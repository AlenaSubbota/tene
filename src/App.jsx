import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase-config.js';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UpdatePassword } from './components/pages/UpdatePassword.jsx';
// --- ИЗМЕНЕНИЕ: Добавляем 'authError' из нашего нового Auth.jsx
import { useAuth } from './Auth';
import { v4 as uuidv4 } from 'uuid';

// --- ИЗМЕНЕНИЕ: Убираем AuthScreen, он больше не нужен ---
// import { AuthScreen } from './AuthScreen.jsx'; 
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
  // --- ИЗМЕНЕНИЕ: Получаем authError из useAuth ---
  const { user, setUser, loading: authLoading, authError } = useAuth();

  // Все состояния приложения (без изменений)
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
  const [userRatings, setUserRatings] = useState({});
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [needsPolicyAcceptance, setNeedsPolicyAcceptance] = useState(false);
  
  const BOT_USERNAME = "tenebrisverbot";
  const userId = user?.id;

  // handleNovelStatsUpdate (без изменений)
  const handleNovelStatsUpdate = useCallback((novelId, newStats) => {
    setNovels(currentNovels =>
      currentNovels.map(n =>
        n.id === novelId
          ? { ...n, ...newStats }
          : n
      )
    );
    setSelectedNovel(currentNovel =>
      currentNovel && currentNovel.id === novelId
        ? { ...currentNovel, ...newStats }
        : currentNovel
    );
  }, []);

  // useEffect (theme) (без изменений)
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

  // useEffect (fontClass) (без изменений)
  useEffect(() => {
  localStorage.setItem('fontClass', fontClass);
}, [fontClass]);

  // useEffect (loadProfileData & Realtime) (без изменений)
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Сброс состояний при выходе (остается)
      setIsLoadingContent(false);
      setNeedsPolicyAcceptance(false);
      setNovels([]);
      setSubscription(null);
      setBookmarks([]);
      setLastReadData({});
      setUserRatings({});
      return; 
    }

    // 1. Проверка политики (остается)
    if (user.user_metadata && !user.user_metadata.policy_accepted) {
      setNeedsPolicyAcceptance(true);
      setIsLoadingContent(false);
      setSubscription(null);
      setBookmarks([]);
      setLastReadData({});
      setIsUserAdmin(false);
      return; 
    }
    
    setNeedsPolicyAcceptance(false);
      
    const loadProfileData = async () => {
      const { data: profileDataArray, error } = await supabase
        .from('profiles')
        .select('subscription, last_read, bookmarks, is_admin')
        .eq('id', user.id)
        .limit(1);

      if (error) {
        console.error("Ошибка загрузки профиля:", error);
      } else if (profileDataArray && profileDataArray.length > 0) {
        
        const userProfile = profileDataArray[0]; 
        
        setIsUserAdmin(userProfile.is_admin || false);
        setSubscription(userProfile.subscription || null); 
        setLastReadData(userProfile.last_read || {});
        
        setBookmarks((userProfile.bookmarks || []).map(Number));
        
      } else {
        console.warn("Профиль не найден или пуст.");
      }

      const { data: ratingsData, error: ratingsError } = await supabase
        .from('novel_ratings')
        .select('novel_id, rating')
        .eq('user_id', user.id);

      if (ratingsError) {
        console.error("Ошибка загрузки оценок:", ratingsError);
      } else if (ratingsData) {
        const ratingsMap = ratingsData.reduce((acc, r) => {
            acc[r.novel_id] = r.rating;
            return acc;
        }, {});
        setUserRatings(ratingsMap);
      }
    };
    
    const channel = supabase
      .channel(`app-realtime:${user.id}`)
      .on(
        'postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, 
        (payload) => {
          const newProfile = payload.new;
          setSubscription(newProfile.subscription || null);
          setIsUserAdmin(newProfile.is_admin || false);
          setLastReadData(newProfile.last_read || {});
          
          const newBookmarksAsNumbers = (newProfile.bookmarks || []).map(Number);
          setBookmarks(newBookmarksAsNumbers);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'novel_ratings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { novel_id, rating } = payload.new;
            setUserRatings(prev => ({ ...prev, [novel_id]: rating }));
          } else if (payload.eventType === 'DELETE') {
            const { novel_id } = payload.old;
            setUserRatings(prev => {
              const newRatings = { ...prev };
              delete newRatings[novel_id];
              return newRatings;
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', 
          schema: 'public',
          table: 'novel_stats'
        },
        (payload) => {
          const updatedStats = payload.new;
          if (updatedStats) {
            handleNovelStatsUpdate(updatedStats.novel_id, updatedStats);
          }
        }
      )
      .subscribe(async (status, err) => {
         if (status === 'SUBSCRIBED') {
           await loadProfileData();
         }
         if (status === 'CHANNEL_ERROR' || err) {
           console.error('Ошибка Realtime-подписки:', err);
         }
      });

    return () => {
      supabase.removeChannel(channel);
    };

}, [user, authLoading, handleNovelStatsUpdate]);

  // useEffect (fetchNovels) (без изменений)
  useEffect(() => {
    const CACHE_KEY = 'novels_cache';
    const MAX_CACHE_AGE_MS = 1000 * 60 * 60; // 1 час

    if (user && !needsPolicyAcceptance) {
      const fetchNovels = async (isBackgroundFetch = false) => {
        if (!isBackgroundFetch) {
          setIsLoadingContent(true);
        }

        const { data: novelsData, error: novelsError } = await supabase
          .from('novels')
          .select('*, novel_stats(*)')

        if (novelsError) {
          console.error("Ошибка загрузки новелл:", novelsError);
          if (!isBackgroundFetch) {
            setNovels([]);
          }
        } else {
          const formattedNovels = novelsData.map(novel => ({
            ...novel,
            views: novel.novel_stats?.views || 0,
            average_rating: novel.novel_stats?.average_rating || 0.0,
            rating_count: novel.novel_stats?.rating_count || 0,
            novel_stats: undefined 
          }));

          formattedNovels.sort((a, b) => b.views - a.views);
          
          setNovels(formattedNovels);
          
          try {
            const cacheData = {
              timestamp: Date.now(),
              data: formattedNovels
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
          } catch (e) {
            console.warn("Не удалось сохранить кеш новелл:", e);
          }
        }
        
        setIsLoadingContent(false);
      };

      try {
        const cachedItem = localStorage.getItem(CACHE_KEY);
        if (cachedItem) {
          const cache = JSON.parse(cachedItem);
          const isCacheValid = (Date.now() - cache.timestamp) < MAX_CACHE_AGE_MS;

          if (isCacheValid) {
            setNovels(cache.data);
            setIsLoadingContent(false);
          } else {
            setNovels(cache.data); 
            setIsLoadingContent(false);
            fetchNovels(true); 
          }
        } else {
          fetchNovels(false);
        }
      } catch (e) {
        console.error("Ошибка чтения кэша новелл:", e);
        fetchNovels(false);
      }

    } else if (!user) {
      setNovels([]);
      setIsLoadingContent(false);
      localStorage.removeItem(CACHE_KEY);
    }
  }, [user, needsPolicyAcceptance]);

  // useEffect (fetchChapters) (без изменений)
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

  // handleBack (без изменений)
  const handleBack = useCallback(() => {
    if (page === 'reader') { setSelectedChapter(null); setPage('details'); }
    else if (page === 'details') { setSelectedNovel(null); setGenreFilter(null); setPage('list'); }
  }, [page]);

  // useEffect (Telegram BackButton) (без изменений)
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

  // updateUserData (без изменений)
  const updateUserData = useCallback(async (dataToUpdate) => {
    if (userId) {
      const { error } = await supabase.rpc('update_my_profile', {
        data_to_update: dataToUpdate
      });

      if (error) {
        console.error("Ошибка при вызове RPC update_my_profile:", error);
        alert(`Не удалось сохранить данные: ${error.message}`);
      }
    }
  }, [userId]);

  // handleTextSizeChange (без изменений)
  const handleTextSizeChange = useCallback((amount) => {
    setFontSize(prevSize => {
      const newSize = Math.max(12, Math.min(32, prevSize + amount));
      updateUserData({ settings: { fontSize: newSize, fontClass } });
      return newSize;
    });
  }, [fontClass, updateUserData]);

  // handleFontChange (без изменений)
  const handleFontChange = (newFontClass) => {
    setFontClass(newFontClass);
    updateUserData({ settings: { fontSize: fontSize, fontClass: newFontClass } });
  };

  // handleSelectChapter (без изменений)
  const handleSelectChapter = useCallback(async (chapter) => {
    setSelectedChapter(chapter);
    setPage('reader');
    if (userId && selectedNovel) {
      const newLastReadData = { ...lastReadData, [selectedNovel.id]: { novelId: selectedNovel.id, chapterId: chapter.id, timestamp: new Date().toISOString() } };
      setLastReadData(newLastReadData);
      await updateUserData({ last_read: newLastReadData });
    }
  }, [userId, selectedNovel, lastReadData, updateUserData]);

  // handleSelectNovel, handleGenreSelect, handleClearGenreFilter (без изменений)
  const handleSelectNovel = (novel) => { setSelectedNovel(novel); setPage('details'); };
  const handleGenreSelect = (genre) => { setGenreFilter(genre); setPage('list'); setActiveTab('library'); };
  const handleClearGenreFilter = () => setGenreFilter(null);

  // handleToggleBookmark (без изменений)
  const handleToggleBookmark = useCallback(async (novelId) => {
    const newBookmarks = bookmarks.includes(novelId) ? bookmarks.filter(id => id !== novelId) : [...bookmarks, novelId];
    setBookmarks(newBookmarks);
    await updateUserData({ bookmarks: newBookmarks });
  }, [bookmarks, updateUserData]);

  // handlePlanSelect (без изменений)
  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setIsSubModalOpen(false);
  };

  // handlePaymentMethodSelect (без изменений)
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
        return;
      }
      const token = uuidv4(); 

      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            pending_subscription: { ...selectedPlan, method, date: new Date().toISOString() },
            telegram_link_token: token 
          })
          .eq('id', userId);


        if (updateError) {
          console.error("Ошибка обновления профиля в Supabase:", updateError);
          tg.showAlert(`Ошибка при сохранении данных: ${updateError.message}`);
          return; 
        }

        const link = `https://t.me/${BOT_USERNAME}?start=${token}`;

        tg.openTelegramLink(link);
        tg.close();

      } catch (e) {
         console.error("Критическая ошибка в handlePaymentMethodSelect:", e);
         tg.showAlert("Произошла непредвиденная ошибка.");
      }
    });
  };

  // handleAcceptPolicy (без изменений, т.к. 'setUser' мы все еще получаем из useAuth)
  const handleAcceptPolicy = async () => {
    if (userId) {
      const { data, error } = await supabase.auth.updateUser({
        data: { policy_accepted: true }
      });

      if (error) {
        console.error('Ошибка обновления user_metadata:', error);
      } else if (data.user) {
        setUser(data.user);
        await updateUserData({ policy_accepted: true });
      }
    }
  };

  // --- ИЗМЕНЕНИЕ: Новая логика загрузки и обработки ошибок ---
  
  // 1. Пока провайдер Auth.jsx проверяет логин
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // 2. Если Auth.jsx завершился с ошибкой
  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main p-4">
        <div className="w-full max-w-sm text-center p-6 rounded-2xl border border-border-color shadow-lg bg-component-bg">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Ошибка входа</h1>
          <p className="text-text-main/80 mb-6">Не удалось выполнить автоматическую аутентификацию.</p>
          <p className="text-xs text-text-main/50 bg-background p-2 rounded-md">
            {authError.message || JSON.stringify(authError)}
          </p>
          <p className="text-sm text-text-main/70 mt-6">
            Пожалуйста, попробуйте полностью закрыть и снова открыть приложение в Telegram.
          </p>
        </div>
      </div>
    );
  }

  // 3. Если мы залогинены, но грузим контент (новеллы, профиль)
  // (Добавляем `user` в проверку, чтобы не показывать спиннер, если user null)
  if (isLoadingContent && !needsPolicyAcceptance && user) {
    return <LoadingSpinner />;
  }
  
  // 4. Если нужно принять политику (пользователь уже есть)
  if (user && needsPolicyAcceptance) {
    return <HelpScreen onAccept={handleAcceptPolicy} />;
  }

  // 5. Если смотрим экран помощи
  if (showHelp) {
    return <HelpScreen onBack={() => setShowHelp(false)} />;
  }

  // --- ИЗМЕНЕНИЕ: Полностью переработанный роутинг ---
  return (
    <Routes>
      {/* Маршрут /update-password остается. 
        Он нужен, если пользователь (теоретически) 
        когда-то регистрировался по email и получил ссылку на сброс.
      */}
      <Route 
        path="/update-password" 
        element={<UpdatePassword />} 
      />

      {!user ? (
        // --- Маршруты для НЕ-авторизованного пользователя ---
        // Сюда мы должны попадать, только если authError не сработал.
        // Перенаправляем на /update-password, т.к. это единственный
        // "внешний" роут, который у нас остался.
        <>
          <Route path="*" element={<Navigate to="/update-password" replace />} />
        </>
      ) : (
        // --- Маршруты для АВТОРИЗОВАННОГО пользователя ---
        <>
          {/* Авторизованный пользователь уже на главной, 
            все остальные пути ("*") ведут на твое основное приложение.
          */}
          <Route path="*" element={
            <main className={`bg-background min-h-screen font-sans text-text-main ${!isUserAdmin ? 'no-select' : ''}`}>
              
              {/* === Начало: Вся твоя логика рендеринга (БЕЗ ИЗМЕНЕНИЙ) === */}
              <div className="pb-20">
                {(() => {
                  if (page === 'details') {
                    const displayName = user?.user_metadata?.full_name || 
                                        user?.user_metadata?.user_name || 
                                        user?.user_metadata?.display_name || 
                                        'Аноним';
                                      
                    return <NovelDetails 
                              novel={selectedNovel} 
                              onSelectChapter={handleSelectChapter} 
                              onGenreSelect={handleGenreSelect} 
                              subscription={subscription} 
                              botUsername={BOT_USERNAME} 
                              userId={userId} 
                              chapters={chapters} 
                              isLoadingChapters={isLoadingChapters} 
                              lastReadData={lastReadData} 
                              onBack={handleBack} 
                              bookmarks={bookmarks} 
                              onToggleBookmark={handleToggleBookmark} 
                              onTriggerSubscription={() => setIsSubModalOpen(true)}
                              isUserAdmin={isUserAdmin}
                              userName={displayName}
                              userRatings={userRatings}
                              setUserRatings={setUserRatings}
                              onNovelStatsUpdate={handleNovelStatsUpdate}
                           />;                    
                  }
                  if (page === 'reader') {
                  const displayName = user?.user_metadata?.full_name || 
                                      user?.user_metadata?.user_name || 
                                      user?.user_metadata?.display_name || 
                                      'Аноним';
                                      
                  return <ChapterReader chapter={selectedChapter} novel={selectedNovel} fontSize={fontSize} onFontSizeChange={handleTextSizeChange} fontClass={fontClass} onFontChange={handleFontChange} userId={userId} userName={displayName} onSelectChapter={handleSelectChapter} allChapters={chapters} subscription={subscription} botUsername={BOT_USERNAME} onBack={handleBack} isUserAdmin={isUserAdmin} onTriggerSubscription={() => setIsSubModalOpen(true)} />;
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
                })()}
              </div>
              
              {/* Все ваши модальные окна и BottomNav (БЕЗ ИЗМЕНЕНИЙ) */}
              {page === 'list' && <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
              {isSubModalOpen && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSelectPlan={handlePlanSelect} />}
              {selectedPlan && <PaymentMethodModal onClose={() => setSelectedPlan(null)} onSelectMethod={handlePaymentMethodSelect} plan={selectedPlan} />}
              {selectedNews && <NewsModal newsItem={selectedNews} onClose={() => setSelectedNews(null)} />}
              {/* === Конец: Вся твоя логика рендеринга === */}
              
            </main>
          } />
        </>
      )}
    </Routes>
  );
}