import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase-config.js';
// --- ИЗМЕНЕНИЕ 1: Получаем setUser из useAuth ---
import { useAuth } from './Auth';
import { v4 as uuidv4 } from 'uuid';

// Импорты всех ваших компонентов (остаются без изменений)
import { AuthScreen } from './AuthScreen.jsx';
import { HelpScreen } from './components/pages/HelpScreen.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import { SubscriptionModal } from './components/SubscriptionModal.jsx';
import { PaymentMethodModal } from './components/PaymentMethodModal.jsx';
import { Header } from './components/Header.jsx';
import { NovelList } from './components/NovelList.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { NewsSlider } from './components/NewsSlider.jsx';
import { NewsModal } from './components/NewsModal.jsx';
import { NovelDetails } from './components/pages/NovelDetails.jsx';
import { ChapterReader } from './components/pages/ChapterReader.jsx';
import { BookmarksPage } from './components/pages/BookmarksPage.jsx';
import { ProfilePage } from './components/pages/ProfilePage.jsx';
import { SearchPage } from './components/pages/SearchPage.jsx';

export default function App() {
  // --- ИЗМЕНЕНИЕ 2: Получаем setUser ---
  const { user, setUser, loading: authLoading } = useAuth();

  // Все состояния приложения
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [fontSize, setFontSize] = useState(16);
  const [fontClass, setFontClass] = useState(() => localStorage.getItem('fontClass') || 'font-sans');
  const [page, setPage] = useState('list');
  const [activeTab, setActiveTab] = useState('library');
  const [novels, setNovels] = useState([]);
  const [selectedNovel, setSelectedNovel] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [genreFilter, setGenreFilter] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [chapters, setChapters] = useState([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [lastReadData, setLastReadData] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [needsPolicyAcceptance, setNeedsPolicyAcceptance] = useState(false);
  
  // --- ИЗМЕНЕНИЕ 3: Состояние refreshProfile больше не нужно для этой логики ---
  // const [refreshProfile, setRefreshProfile] = useState(0);

  const BOT_USERNAME = "tenebrisverbot";
  const userId = user?.id;

useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'theme-amber');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'dark-amber') {
      root.classList.add('dark', 'theme-amber');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
  localStorage.setItem('fontClass', fontClass);
}, [fontClass]);

  // --- ИЗМЕНЕНИЕ 4: Полностью переписана логика проверки ---
  // Этот useEffect отвечает ТОЛЬКО за профиль и политику
  // Файл: src/App.jsx

  // --- ИЗМЕНЕНИЕ 4 (ФИНАЛЬНАЯ ВЕРСИЯ): Устраняем гонку состояний ---
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Сброс состояний при выходе пользователя (логика остается)
      setIsLoadingContent(false);
      setNeedsPolicyAcceptance(false);
      setNovels([]);
      setSubscription(null);
      setBookmarks([]);
      setLastReadData({});
      return; 
    }

    // 1. Проверяем политику (логика остается)
    if (user.user_metadata && !user.user_metadata.policy_accepted) {
      setNeedsPolicyAcceptance(true);
      setIsLoadingContent(false);
      setSubscription(null);
      setBookmarks([]);
      setLastReadData({});
      setIsUserAdmin(false);
      return; 
    }
    
    // --- Политика принята, продолжаем ---
    setNeedsPolicyAcceptance(false);
      
    // 2. [ИЗМЕНЕНИЕ] Мы больше не вызываем loadProfileData() сразу.
    //    Мы вызовем ее, когда Realtime будет готов.
    const loadProfileData = async () => {
      // Эта функция та же, что и была
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('subscription, last_read, bookmarks, is_admin')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Ошибка загрузки профиля:", error);
      } else if (profileData) {
        console.log("Загружены свежие данные профиля:", profileData);
        setIsUserAdmin(profileData.is_admin || false);
        setSubscription(profileData.subscription || null);
        setLastReadData(profileData.last_read || {});
        setBookmarks(profileData.bookmarks || []);
      }
    };
    
    // 3. Активируем Realtime-подписку
    const channel = supabase
      .channel(`profiles_user_${user.id}`)
      .on(
        'postgres_changes', 
        { 
          event: 'UPDATE', // Слушаем обновления от бота
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, 
        (payload) => {
          // Когда бот обновляет...
          console.log('Realtime: Профиль пользователя обновлен!', payload.new);
          const newProfile = payload.new;
          setSubscription(newProfile.subscription || null);
          setIsUserAdmin(newProfile.is_admin || false);
          setLastReadData(newProfile.last_read || {});
          setBookmarks(newProfile.bookmarks || []);
        }
      )
      .subscribe(async (status, err) => {
         if (status === 'SUBSCRIBED') {
           // --- [ГЛАВНОЕ ИЗМЕНЕНИЕ] ---
           // Как только мы успешно подписались,
           // мы вручную загружаем самые свежие данные.
           // Это устраняет гонку состояний.
           console.log('Успешно подписан на Realtime! Загружаю свежие данные...');
           await loadProfileData();
         }
         if (status === 'CHANNEL_ERROR' || err) {
           console.error('Ошибка Realtime-подписки:', err);
         }
      });

    // 4. Функция очистки (остается)
    return () => {
      console.log('Отписка от Realtime-канала profiles...');
      supabase.removeChannel(channel);
    };

}, [user, authLoading]);

  // Этот useEffect отвечает ТОЛЬКО за загрузку новелл
  useEffect(() => {
    if (user && !needsPolicyAcceptance) {
      setIsLoadingContent(true);
      const fetchNovels = async () => {
        const { data: novelsData, error: novelsError } = await supabase
          .from('novels')
          .select(`*, novel_stats ( views )`);

        if (novelsError) {
          console.error("Ошибка загрузки новелл:", novelsError);
          setNovels([]);
        } else {
          const formattedNovels = novelsData.map(novel => ({
            ...novel,
            views: novel.novel_stats?.views || 0,
          }));
          formattedNovels.sort((a, b) => b.views - a.views);
          setNovels(formattedNovels);
        }
        setIsLoadingContent(false);
      };
      fetchNovels();
    } else if (!user) {
      // Если пользователя нет, тоже сбрасываем
      setNovels([]);
      setIsLoadingContent(false);
    }
  }, [user, needsPolicyAcceptance]); // <-- Зависимость от 'user' (а не user.id)

  // Загрузка глав для выбранной новеллы
  useEffect(() => {
    if (!selectedNovel) { setChapters([]); return; }
    setIsLoadingChapters(true);
    const fetchChapters = async () => {
      const { data, error } = await supabase
      .from('chapters') 
      .select('chapter_number, is_paid, published_at, content_path') 
      .eq('novel_id', selectedNovel.id)
      .order('chapter_number', { ascending: true }); 

      if (error) {
        console.error("Ошибка загрузки глав:", error);
        setChapters([]);
      } else {
        const chaptersArray = data.map(chapter => ({
      id: chapter.chapter_number, 
      title: `Глава ${chapter.chapter_number}`,
          isPaid: chapter.is_paid || false,
          published_at: chapter.published_at,
          content_path: chapter.content_path 
        }));
        setChapters(chaptersArray);
      }
      setIsLoadingChapters(false);
    };
    fetchChapters();
  }, [selectedNovel]);

  const handleBack = useCallback(() => {
    if (page === 'reader') { setSelectedChapter(null); setPage('details'); }
    else if (page === 'details') { setSelectedNovel(null); setGenreFilter(null); setPage('list'); }
  }, [page]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    console.log('Проверка объекта Telegram WebApp (tg):', tg);
    if (!tg) return;
    tg.ready();
    tg.expand();
    tg.onEvent('backButtonClicked', handleBack);
    if (page === 'list' || needsPolicyAcceptance) {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
    }
    return () => tg.offEvent('backButtonClicked', handleBack);
  }, [page, handleBack, needsPolicyAcceptance]);

  const updateUserData = useCallback(async (dataToUpdate) => {
    if (userId) {
      // ИСПОЛЬЗУЕМ UPSERT. Он создаст профиль, если его нет.
      // Он требует, чтобы `id` был частью объекта.
      const { error } = await supabase
        .from('profiles')
        .upsert({ ...dataToUpdate, id: userId }) // <--- ГЛАВНОЕ ИСПРАВЛЕНИЕ
        .select(); // Добавляем .select(), чтобы .upsert() вернул данные

      if (error) {
        console.error("Ошибка при upsert профиля:", error);
        alert(`Не удалось сохранить данные. Ошибка RLS? См. консоль.`);
      }
    }
  }, [userId]);

  const handleTextSizeChange = useCallback((amount) => {
    setFontSize(prevSize => {
      const newSize = Math.max(12, Math.min(32, prevSize + amount));
      updateUserData({ settings: { fontSize: newSize, fontClass } });
      return newSize;
    });
  }, [fontClass, updateUserData]);

const handleFontChange = (newFontClass) => {
  setFontClass(newFontClass);
  updateUserData({ settings: { fontSize: fontSize, fontClass: newFontClass } });
};

  const handleSelectChapter = useCallback(async (chapter) => {
    setSelectedChapter(chapter);
    setPage('reader');
    if (userId && selectedNovel) {
      const newLastReadData = { ...lastReadData, [selectedNovel.id]: { novelId: selectedNovel.id, chapterId: chapter.id, timestamp: new Date().toISOString() } };
      setLastReadData(newLastReadData);
      await updateUserData({ last_read: newLastReadData });
    }
  }, [userId, selectedNovel, lastReadData, updateUserData]);

  const handleSelectNovel = (novel) => { setSelectedNovel(novel); setPage('details'); };
  const handleGenreSelect = (genre) => { setGenreFilter(genre); setPage('list'); setActiveTab('library'); };
  const handleClearGenreFilter = () => setGenreFilter(null);

  const handleToggleBookmark = useCallback(async (novelId) => {
    const newBookmarks = bookmarks.includes(novelId) ? bookmarks.filter(id => id !== novelId) : [...bookmarks, novelId];
    setBookmarks(newBookmarks);
    await updateUserData({ bookmarks: newBookmarks });
  }, [bookmarks, updateUserData]);

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setIsSubModalOpen(false);
  };

 const handlePaymentMethodSelect = async (method) => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      console.error("Telegram WebApp не инициализирован.");
      alert("Не удалось инициализировать Telegram WebApp."); 
      return;
    }
     if (!userId) {
       console.error("User ID не найден.");
       tg.showAlert("Ошибка: ID пользователя не найден. Попробуйте перезагрузить приложение.");
       return;
     }
     if (!selectedPlan) {
       console.error("План подписки не выбран.");
       tg.showAlert("Ошибка: План подписки не выбран.");
       return;
     }

    tg.showConfirm(`Вы будете перенаправлены в бот для способа оплаты: ${method}. Продолжить?`, async (confirmed) => {
      if (!confirmed) {
        console.log("Пользователь отменил перенаправление в бот.");
        return;
      }

      console.log('User ID перед обновлением токена:', userId); 
      const token = uuidv4(); 
      console.log('Новый сгенерированный токен:', token); 

      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            pending_subscription: { ...selectedPlan, method, date: new Date().toISOString() },
            telegram_link_token: token 
          })
          .eq('id', userId);

        console.log('Результат обновления токена в Supabase:', { updateError }); 

        if (updateError) {
          console.error("Ошибка обновления профиля в Supabase:", updateError);
          tg.showAlert(`Ошибка при сохранении данных: ${updateError.message}`);
          return; 
        }

        const link = `https://t.me/${BOT_USERNAME}?start=${token}`;
        console.log('Формируемая ссылка для Telegram:', link); 

        tg.openTelegramLink(link);
        tg.close();

      } catch (e) {
         console.error("Критическая ошибка в handlePaymentMethodSelect:", e);
         tg.showAlert("Произошла непредвиденная ошибка.");
      }
    });
  };

  // --- ИЗМЕНЕНИЕ 5: Меняем логику обработчика ---
  const handleAcceptPolicy = async () => {
    if (userId) {
      // 1. Обновляем данные в `auth.users` (это сохранится в сессии)
      const { data, error } = await supabase.auth.updateUser({
        data: { policy_accepted: true }
      });

      if (error) {
        console.error('Ошибка обновления user_metadata:', error);
      } else if (data.user) {
        // 2. Обновляем локальное состояние 'user' в React
        // Это вызовет повторный запуск useEffect, который скроет модальное окно
        setUser(data.user);
        
        // 3. (Опционально) Обновляем также и таблицу 'profiles'
        // Это полезно для RLS или если другие части приложения читают из profiles
        await updateUserData({ policy_accepted: true });
      }
    }
  };

  if (authLoading || (isLoadingContent && !needsPolicyAcceptance && user)) {
    return <LoadingSpinner />;
  }
  if (user && needsPolicyAcceptance) {
    return <HelpScreen onAccept={handleAcceptPolicy} />;
  }
  if (showHelp) {
    return <HelpScreen onBack={() => setShowHelp(false)} />;
  }
  if (!user) {
    return <AuthScreen />;
  }

  const renderContent = () => {
    if (page === 'details') {
      return <NovelDetails novel={selectedNovel} onSelectChapter={handleSelectChapter} onGenreSelect={handleGenreSelect} subscription={subscription} botUsername={BOT_USERNAME} userId={userId} chapters={chapters} isLoadingChapters={isLoadingChapters} lastReadData={lastReadData} onBack={handleBack} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark}/>;
    }
    if (page === 'reader') {
    const displayName = user?.user_metadata?.full_name || 
                        user?.user_metadata?.user_name || 
                        user?.user_metadata?.display_name || 
                        'Аноним';
                        
    return <ChapterReader chapter={selectedChapter} novel={selectedNovel} fontSize={fontSize} onFontSizeChange={handleTextSizeChange} fontClass={fontClass} onFontChange={handleFontChange} userId={userId} userName={displayName} onSelectChapter={handleSelectChapter} allChapters={chapters} subscription={subscription} botUsername={BOT_USERNAME} onBack={handleBack} isUserAdmin={isUserAdmin} />;
  }
    switch (activeTab) {
      case 'library':
        return (<>
          <Header title="Библиотека" />
          <NewsSlider onReadMore={setSelectedNews} />
          {genreFilter && (<div className="flex items-center justify-between p-3 mx-4 mb-0 rounded-lg border border-border-color bg-component-bg text-text-main">
            <p className="text-sm"><span className="opacity-70">Жанр:</span><strong className="ml-2">{genreFilter}</strong></p>
            <button onClick={handleClearGenreFilter} className="text-xs font-bold text-accent hover:underline">Сбросить</button>
          </div>)}
          <NovelList novels={novels.filter(n => !genreFilter || (n.genres && n.genres.includes(genreFilter)))} onSelectNovel={handleSelectNovel} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} />
        </>);
      case 'search': return <SearchPage novels={novels} onSelectNovel={handleSelectNovel} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} />;
      case 'bookmarks': return <BookmarksPage novels={novels} onSelectNovel={handleSelectNovel} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} />;
      case 'profile': return <ProfilePage user={user} subscription={subscription} onGetSubscriptionClick={() => setIsSubModalOpen(true)} userId={userId} onThemeChange={setTheme} currentTheme={theme} onShowHelp={() => setShowHelp(true)} />;
      default: return <Header title="Библиотека" />;
    }
  };

  return (
    <main className={`bg-background min-h-screen font-sans text-text-main ${!isUserAdmin ? 'no-select' : ''}`}>
      <div className="pb-20">{renderContent()}</div>
      {page === 'list' && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      {isSubModalOpen && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSelectPlan={handlePlanSelect} />}
      {selectedPlan && <PaymentMethodModal onClose={() => setSelectedPlan(null)} onSelectMethod={handlePaymentMethodSelect} plan={selectedPlan} />}
      {selectedNews && <NewsModal newsItem={selectedNews} onClose={() => setSelectedNews(null)} />}
    </main>
  );
}