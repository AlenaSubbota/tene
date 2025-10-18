// src/App.jsx (Supabase версия)

import React, { useState, useEffect, useCallback } from 'react';
// --- ИЗМЕНЕНИЕ: Убираем импорты Firebase, добавляем Supabase ---
import { supabase } from './supabase-config.js'; 
import { useAuth } from './Auth';

// Импорты всех ваших компонентов и экранов (остаются без изменений)
import { AuthScreen } from './AuthScreen.jsx';
import { HelpScreen } from './components/pages/HelpScreen.jsx';
import  LoadingSpinner  from './components/LoadingSpinner.jsx';
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
  // --- Состояние аутентификации из useAuth ---
  const { user, loading: authLoading } = useAuth();

  // --- Состояния остаются практически без изменений ---
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [fontSize, setFontSize] = useState(16);
  const [fontClass, setFontClass] = useState('font-sans');
  const [page, setPage] = useState('list');
  const [activeTab, setActiveTab] = useState('library');
  const [novels, setNovels] = useState([]);
  const [selectedNovel, setSelectedNovel] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [genreFilter, setGenreFilter] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false); // Мы вернемся к этому
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
  // --- ИЗМЕНЕНИЕ: в Supabase ID пользователя находится в user.id ---
  const userId = user?.id;

  // Применение темы
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
  if (authLoading) return;
  if (!user) {
    setIsLoadingContent(false);
    setNovels([]);
    setSubscription(null);
    setBookmarks([]);
    setLastReadData({});
    setNeedsPolicyAcceptance(false);
    return;
  }

  const fetchData = async () => {
    setIsLoadingContent(true);

    // Сначала получаем профиль, чтобы решить, нужно ли показывать политику
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Ошибка загрузки профиля:", profileError);
    } else if (profileData) {
      // Сразу устанавливаем все состояния из профиля
      setSubscription(profileData.subscription || null);
      setLastReadData(profileData.last_read || {});
      setBookmarks(profileData.bookmarks || []);
      if (profileData.settings) {
        // Здесь должны быть ваши состояния для настроек, например setFontSize
      }
      // Это ключевой момент: мы решаем, показывать ли политику, ДО загрузки остального
      if (!profileData.policy_accepted) {
        setNeedsPolicyAcceptance(true);
        setIsLoadingContent(false); // Прекращаем загрузку, т.к. нужно показать политику
        return; // Выходим из функции
      } else {
        setNeedsPolicyAcceptance(false);
      }
    } else {
      setNeedsPolicyAcceptance(true);
      setIsLoadingContent(false);
      return;
    }

    // Если мы дошли сюда, значит политика принята. Грузим все остальное.
    const { data: novelsData, error: novelsError } = await supabase
      .from('novels')
      .select(`*, novel_stats ( views )`);

    if (novelsError) {
      console.error("Ошибка загрузки новелл:", novelsError);
    } else {
      const formattedNovels = novelsData.map(novel => ({
          ...novel,
          views: novel.novel_stats?.views || 0,
      }));
      setNovels(formattedNovels);
    }
    
    setIsLoadingContent(false);
  };

  fetchData();

  // Подписка на изменения остается такой же
  const channel = supabase
    .channel(`profiles_user_${user.id}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, 
      (payload) => {
        const data = payload.new;
        setSubscription(data.subscription || null);
        setLastReadData(data.last_read || {});
        setBookmarks(data.bookmarks || []);
        // Важно: если политика меняется в реальном времени, тоже обновляем
        setNeedsPolicyAcceptance(!data.policy_accepted);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user, authLoading]);

  // --- ИЗМЕНЕНИЕ: Загрузка глав для выбранной новеллы ---
  useEffect(() => {
    if (!selectedNovel) { setChapters([]); return; }
    setIsLoadingChapters(true);
    const fetchChapters = async () => {
        // Было (Firebase): getDoc(doc(db, 'chapter_info', selectedNovel.id))
        // Стало (Supabase): select с фильтром по ID новеллы
        const { data, error } = await supabase
            .from('chapter_info')
            .select('*')
            .eq('novel_id', selectedNovel.id)
            .order('chapter_number', { ascending: true }); // Сразу сортируем

        if (error) {
            console.error("Ошибка загрузки глав:", error);
            setChapters([]);
        } else {
            const chaptersArray = data.map(chapter => ({
                id: chapter.chapter_number,
                title: `Глава ${chapter.chapter_number}`,
                isPaid: chapter.is_paid || false,
                published_at: chapter.published_at,
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
  
  // Этот хук для Telegram остается без изменений
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
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

  // --- ИЗМЕНЕНИЕ: Функция обновления данных пользователя ---
  const updateUserData = useCallback(async (dataToUpdate) => {
    if (userId) {
        // Было (Firebase): setDoc(doc(db, "users", userId), dataToUpdate, { merge: true });
        // Стало (Supabase): update с фильтром по ID
        const { error } = await supabase
            .from('profiles')
            .update(dataToUpdate)
            .eq('id', userId);
        
        if (error) {
            console.error("Ошибка обновления профиля:", error);
        }
    }
  }, [userId]);

  const handleThemeToggle = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleTextSizeChange = useCallback((amount) => {
    setFontSize(prevSize => {
        const newSize = Math.max(12, Math.min(32, prevSize + amount));
        // Используем новую функцию updateUserData
        updateUserData({ settings: { fontSize: newSize, fontClass } });
        return newSize;
    });
  }, [fontClass, updateUserData]);

  const handleSelectChapter = useCallback(async (chapter) => {
    setSelectedChapter(chapter);
    setPage('reader');
    if (userId && selectedNovel) {
        const newLastReadData = { ...lastReadData, [selectedNovel.id]: { novelId: selectedNovel.id, chapterId: chapter.id, timestamp: new Date().toISOString() } };
        setLastReadData(newLastReadData);
        // Используем новую функцию и правильное имя поля из БД
        await updateUserData({ last_read: newLastReadData });
    }
  }, [userId, selectedNovel, lastReadData, updateUserData]);

  const handleSelectNovel = (novel) => { setSelectedNovel(novel); setPage('details'); };
  const handleGenreSelect = (genre) => { setGenreFilter(genre); setPage('list'); setActiveTab('library'); };
  const handleClearGenreFilter = () => setGenreFilter(null);

  const handleToggleBookmark = useCallback(async (novelId) => {
    const newBookmarks = bookmarks.includes(novelId) ? bookmarks.filter(id => id !== novelId) : [...bookmarks, novelId];
    setBookmarks(newBookmarks);
    // Используем новую функцию
    await updateUserData({ bookmarks: newBookmarks });
  }, [bookmarks, updateUserData]);

  const handlePlanSelect = (plan) => {
      setSelectedPlan(plan);
      setIsSubModalOpen(false);
  };
  
  // Эта функция пока остаётся как есть, но updateUserDoc заменен на updateUserData
  // В будущем ее тоже можно улучшить с помощью Edge Functions в Supabase
  const handlePaymentMethodSelect = async (method) => {
      const tg = window.Telegram?.WebApp;
      if (!tg || !userId || !selectedPlan) {
          if (tg) tg.showAlert("Произошла ошибка.");
          return;
      }
      tg.showConfirm("Вы будете перенаправлены в бот для завершения оплаты...", async (confirmed) => {
          if (!confirmed) return;
          try {
              // Здесь мы можем создать поле pending_subscription в таблице profiles
              await updateUserData({ pending_subscription: { ...selectedPlan, method, date: new Date().toISOString() } });
              tg.openTelegramLink(`https://t.me/${BOT_USERNAME}?start=${userId}`);
              tg.close();
          } catch (error) {
              console.error("Ошибка записи в Supabase:", error);
              tg.showAlert("Не удалось сохранить ваш выбор.");
          }
      });
  };

  const handleAcceptPolicy = async () => {
    if (userId) {
      // Используем новую функцию и правильное имя поля
      await updateUserData({ policy_accepted: true });
      setNeedsPolicyAcceptance(false);
    }
  };

  // --- ЛОГИКА РЕНДЕРИНГА (без серьезных изменений) ---
  if (authLoading || (isLoadingContent && !needsPolicyAcceptance)) {
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
    // ... рендеринг страниц остается без изменений
    if (page === 'details') {
      return <NovelDetails novel={selectedNovel} onSelectChapter={handleSelectChapter} onGenreSelect={handleGenreSelect} subscription={subscription} botUsername={BOT_USERNAME} userId={userId} chapters={chapters} isLoadingChapters={isLoadingChapters} lastReadData={lastReadData} onBack={handleBack} />;
    }
    if (page === 'reader') {
      return <ChapterReader chapter={selectedChapter} novel={selectedNovel} fontSize={fontSize} onFontSizeChange={handleTextSizeChange} userId={userId} userName={user?.user_metadata?.display_name || 'Аноним'} currentFontClass={fontClass} onSelectChapter={handleSelectChapter} allChapters={chapters} subscription={subscription} botUsername={BOT_USERNAME} onBack={handleBack} isUserAdmin={isUserAdmin} />;
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
      case 'bookmarks': return <BookmarksPage novels={novels.filter(n => bookmarks.includes(n.id))} onSelectNovel={handleSelectNovel} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} />;
      // --- ИЗМЕНЕНИЕ: убираем auth из пропсов, он больше не нужен ---
      case 'profile': return <ProfilePage user={user} subscription={subscription} onGetSubscriptionClick={() => setIsSubModalOpen(true)} userId={userId} onThemeToggle={handleThemeToggle} currentTheme={theme} onShowHelp={() => setShowHelp(true)} />;
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