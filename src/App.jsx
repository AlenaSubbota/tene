// src/App.jsx (ФИНАЛЬНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ V2)

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase-config.js';
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
  const { user, loading: authLoading } = useAuth();

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

  const BOT_USERNAME = "tenebrisverbot";
  const userId = user?.id;

useEffect(() => {
    const root = window.document.documentElement;

    // Сначала удаляем все классы тем
    root.classList.remove('dark', 'theme-amber');

    // Применяем классы в зависимости от состояния
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'dark-amber') {
      root.classList.add('dark', 'theme-amber');
    }
    // Если theme === 'light', никакие классы не добавляются

    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
  localStorage.setItem('fontClass', fontClass);
}, [fontClass]);

  // Этот useEffect отвечает ТОЛЬКО за профиль и политику
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Сброс состояний при выходе пользователя
      setIsLoadingContent(false);
      setNeedsPolicyAcceptance(false);
      setNovels([]);
      setSubscription(null);
      setBookmarks([]);
      setLastReadData({});
      return;
    }

    const checkProfileAndPolicy = async () => {
      const { data: profileData, error } = await supabase
        .from('profiles')
        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
        .select('policy_accepted, subscription, last_read, bookmarks, is_admin') 
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Ошибка загрузки профиля:", error);
      } else if (profileData) { // <-- Убрали ?.policy_accepted
        // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
        setIsUserAdmin(profileData.is_admin || false); // Устанавливаем статус админа
        // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
        
        if (profileData.policy_accepted) {
          setSubscription(profileData.subscription || null);
          setLastReadData(profileData.last_read || {});
          setBookmarks(profileData.bookmarks || []);
          setNeedsPolicyAcceptance(false);
        } else {
          // Если профиль есть, но политика не принята
          setNeedsPolicyAcceptance(true);
        }
      } else {
        setNeedsPolicyAcceptance(true);
      }
    };

    checkProfileAndPolicy();

    // const channel = supabase
//   .channel(`profiles_user_${user.id}`)
//   .on('postgres_changes', ... )
//   ...
//   .subscribe();
//
// return () => {
//   supabase.removeChannel(channel);
// };
  }, [user?.id, authLoading]); // Зависимость от user.id решает проблему перезагрузки

  // Этот useEffect отвечает ТОЛЬКО за загрузку новелл
  useEffect(() => {
    if (user && !needsPolicyAcceptance) {
      setIsLoadingContent(true);
      const fetchNovels = async () => {
        const { data: novelsData, error: novelsError } = await supabase
          .from('novels')
          .select(`*, novel_stats ( views )`);
          // .order('views', { ascending: false, foreignTable: 'novel_stats' }); // <-- УБРАЛИ ЭТУ СТРОКУ

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
    } else {
      setNovels([]);
      setIsLoadingContent(false);
    }
    // 👇 --КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ЗДЕСЬ --- 👇
  }, [user?.id, needsPolicyAcceptance]); // Зависимость от user.id вместо user

  // Загрузка глав для выбранной новеллы
  useEffect(() => {
    if (!selectedNovel) { setChapters([]); return; }
    setIsLoadingChapters(true);
    const fetchChapters = async () => {
      const { data, error } = await supabase
      .from('chapters') 
      .select('chapter_number, is_paid, published_at, content_path') // <-- ИСПРАВЛЕНО
      .eq('novel_id', selectedNovel.id)
      .order('chapter_number', { ascending: true }); // <-- ИСПРАВЛЕНО

      if (error) {
        console.error("Ошибка загрузки глав:", error);
        setChapters([]);
      } else {
        const chaptersArray = data.map(chapter => ({
      id: chapter.chapter_number, // <-- ИСПРАВЛЕНО
      title: `Глава ${chapter.chapter_number}`,
          isPaid: chapter.is_paid || false,
          published_at: chapter.published_at,
          content_path: chapter.content_path // <-- ИСПРАВЛЕНО
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
      // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
      // .upsert() не работает с column-level security.
      // Используем .update() и .eq()
      // dataToUpdate НЕ должен содержать 'id'
      console.log('User ID перед обновлением:', userId);

      const { error } = await supabase
        .from('profiles')
        .update(dataToUpdate) // <--- ИСПОЛЬЗУЕМ UPDATE
        .eq('id', userId);    // <--- И УКАЗЫВАЕМ ID ЗДЕСЬ
        
      if (error) console.error("Ошибка обновления профиля (update):", error);
      // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
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
  // Обновляем настройки в БД, сохраняя текущий fontSize
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
      alert("Не удалось инициализировать Telegram WebApp."); // Используем alert вместо tg.showAlert
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

    // Показываем подтверждение *перед* генерацией токена
    tg.showConfirm(`Вы будете перенаправлены в бот для способа оплаты: ${method}. Продолжить?`, async (confirmed) => {
      if (!confirmed) {
        console.log("Пользователь отменил перенаправление в бот.");
        return;
      }

      // --- ДОБАВЛЕННЫЕ ЛОГИ ---
      console.log('User ID перед обновлением токена:', userId); // Лог ID пользователя

      const token = uuidv4(); // Генерируем НОВЫЙ токен
      console.log('Новый сгенерированный токен:', token); // Лог нового токена

      try {
        // Сохраняем НОВЫЙ токен и выбранный метод в pending_subscription
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            pending_subscription: { ...selectedPlan, method, date: new Date().toISOString() },
            telegram_link_token: token // <--- Обновляем токен в базе
          })
          .eq('id', userId);

        console.log('Результат обновления токена в Supabase:', { updateError }); // Лог результата обновления

        if (updateError) {
          console.error("Ошибка обновления профиля в Supabase:", updateError);
          tg.showAlert(`Ошибка при сохранении данных: ${updateError.message}`);
          return; // Прерываем выполнение, если не удалось сохранить токен
        }

        // Формируем ссылку с НОВЫМ токеном
        const link = `https://t.me/${BOT_USERNAME}?start=${token}`;
        console.log('Формируемая ссылка для Telegram:', link); // Лог формируемой ссылки

        // Перенаправляем пользователя с НОВЫМ токеном
        tg.openTelegramLink(link);
        tg.close();

      } catch (e) {
         console.error("Критическая ошибка в handlePaymentMethodSelect:", e);
         tg.showAlert("Произошла непредвиденная ошибка.");
      }
    });
  };

  const handleAcceptPolicy = async () => {
    if (userId) {
      await updateUserData({ policy_accepted: true });
      setNeedsPolicyAcceptance(false);
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
    // --- ИСПРАВЛЕНИЕ ЗДЕСЬ ---
    // Ищем имя в нескольких полях, которые может вернуть Telegram
    const displayName = user?.user_metadata?.full_name || 
                        user?.user_metadata?.user_name || 
                        user?.user_metadata?.display_name || 
                        'Аноним';
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
                        
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