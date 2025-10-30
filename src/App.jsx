// src/App.jsx

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
  const [userRatings, setUserRatings] = useState({}); // <-- Это состояние у вас уже есть
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

  // VVVV --- НАЧАТЬ ИЗМЕНЕНИЕ 1: Добавить callback для обновления состояния --- VVVV
  const handleNovelStatsUpdate = useCallback((novelId, newStats) => {
    // newStats - это объект, например { views: 101 } или { average_rating: 4.5, rating_count: 20 }
    setNovels(currentNovels =>
      currentNovels.map(n =>
        n.id === novelId
          ? { ...n, ...newStats } // Обновляем статистику
          : n
      )
    );
    setSelectedNovel(currentNovel =>
      currentNovel && currentNovel.id === novelId
        ? { ...currentNovel, ...newStats } // Обновляем и выбранную новеллу
        : currentNovel
    );
  }, []);
  // ^^^^ --- КОНЕЦ ИЗМЕНЕНИЯ 1 --- ^^^^

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
      setUserRatings({}); // <-- Этот сброс у вас уже есть
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
    
    // --- Политика принята, продолжаем ---
    setNeedsPolicyAcceptance(false);
      
    // 2. Функция загрузки данных
    const loadProfileData = async () => {
      
      // [ИСПРАВЛЕНИЕ] Используем .limit(1), чтобы ГАРАНТИРОВАННО получить массив, как в логах
      const { data: profileDataArray, error } = await supabase
        .from('profiles')
        .select('subscription, last_read, bookmarks, is_admin')
        .eq('id', user.id)
        .limit(1); // <-- Используем .limit(1) вместо .single()

      if (error) {
        console.error("Ошибка загрузки профиля:", error);
      } else if (profileDataArray && profileDataArray.length > 0) {
        
        // [ИСПРАВЛЕНИЕ] Извлекаем первый (и единственный) объект из массива
        const userProfile = profileDataArray[0]; 
        
        
        // [ИСПРАВЛЕНИЕ] Используем 'userProfile', а не 'profileDataArray'
        setIsUserAdmin(userProfile.is_admin || false);
        setSubscription(userProfile.subscription || null); 
        setLastReadData(userProfile.last_read || {});
        setBookmarks((userProfile.bookmarks || []).map(Number));
        
      } else {
        console.warn("Профиль не найден или пуст.");
      }

      // --- VVVV --- НАЧАЛО ИЗМЕНЕНИЙ (Добавление загрузки рейтингов) --- VVVV ---
      // Сразу после загрузки профиля, загружаем оценки этого пользователя
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('novel_ratings')
        .select('novel_id, rating')
        .eq('user_id', user.id);

      if (ratingsError) {
        console.error("Ошибка загрузки оценок:", ratingsError);
      } else if (ratingsData) {
        // Преобразуем массив в { novel_id: rating } для быстрого доступа
        const ratingsMap = ratingsData.reduce((acc, r) => {
            acc[r.novel_id] = r.rating;
            return acc;
        }, {});
        setUserRatings(ratingsMap);
      }
      // --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЙ --- ^^^^ ---
    };
    

    
    // 3. Активируем Realtime-подписку
    const channel = supabase
      .channel(`app-realtime:${user.id}`) // Даем каналу более общее имя
      .on(
        'postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, 
        (payload) => {
          
          // Обновляем состояние из Realtime (здесь 'payload.new' - это ОБЪЕКТ, и это_правильно)
          const newProfile = payload.new;
          setSubscription(newProfile.subscription || null);
          setIsUserAdmin(newProfile.is_admin || false);
          setLastReadData(newProfile.last_read || {});
          const newBookmarksAsNumbers = (newProfile.bookmarks || []).map(Number);
          setBookmarks(newBookmarksAsNumbers);
        }
      )
      // --- VVVV --- НАЧАЛО ИЗМЕНЕНИЙ (Realtime для рейтингов) --- VVVV ---
      // Слушаем изменения в *своих* оценках
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
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
      // --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЙ --- ^^^^ ---
      
      // --- VVVV --- НАЧАТЬ ИЗМЕНЕНИЕ 2: Заменить listener 'novels' на 'novel_stats' --- VVVV ---
      // Слушаем ЛЮБЫЕ обновления в `novel_stats` (просмотры, рейтинги)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Нас интересует только обновление
          schema: 'public',
          table: 'novel_stats' // <-- СЛУШАЕМ ПРАВИЛЬНУЮ ТАБЛИЦУ
          // Нет фильтра, слушаем все
        },
        (payload) => {
          // payload.new будет содержать { novel_id, views, average_rating, rating_count }
          const updatedStats = payload.new;
          
          // Вызываем наш callback, чтобы обновить состояние
          // Это унифицирует обновление и от Realtime, и от прямого вызова
          if (updatedStats) {
            handleNovelStatsUpdate(updatedStats.novel_id, updatedStats);
          }
        }
      )
      // --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЯ 2 --- ^^^^ ---
      .subscribe(async (status, err) => {
         if (status === 'SUBSCRIBED') {
           await loadProfileData(); // Загружаем данные после подписки
         }
         if (status === 'CHANNEL_ERROR' || err) {
           console.error('Ошибка Realtime-подписки:', err);
         }
      });

    // 4. Функция очистки (остается)
    return () => {
      supabase.removeChannel(channel);
    };

}, [user, authLoading, handleNovelStatsUpdate]); // <-- Добавили handleNovelStatsUpdate в зависимости

  // --- VVVV --- НАЧАЛО ИЗМЕНЕНИЙ (Загрузка новелл) --- VVVV ---
  // Этот useEffect отвечает ТОЛЬКО за загрузку новелл
  useEffect(() => {
    const CACHE_KEY = 'novels_cache';
    const MAX_CACHE_AGE_MS = 1000 * 60 * 60; // 1 час

    if (user && !needsPolicyAcceptance) {

      // Функция загрузки новелл
      const fetchNovels = async (isBackgroundFetch = false) => {
        if (!isBackgroundFetch) {
          setIsLoadingContent(true);
        }

        // --- VVVV --- ИСПРАВЛЕНО: Загружаем `novel_stats` --- VVVV ---
        const { data: novelsData, error: novelsError } = await supabase
          .from('novels')
          .select('*, novel_stats(*)') // <--- ПРАВИЛЬНЫЙ ЗАПРОС
        // --- ^^^^ --- КОНЕЦ ИСПРАВЛЕНИЯ --- ^^^^ ---

        if (novelsError) {
          console.error("Ошибка загрузки новелл:", novelsError);
          if (!isBackgroundFetch) {
            setNovels([]);
          }
        } else {
         // --- VVVV --- ИСПРАВЛЕНО: Маппинг данных из `novel_stats` --- VVVV ---
          const formattedNovels = novelsData.map(novel => ({
            ...novel,
            // Данные теперь в `novel_stats` (или 0 по умолчанию)
            views: novel.novel_stats?.views || 0,
            average_rating: novel.novel_stats?.average_rating || 0.0,
            rating_count: novel.novel_stats?.rating_count || 0,
            // Удаляем дублирующую структуру, чтобы избежать путаницы
            novel_stats: undefined 
          }));
          // --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЯ --- ^^^^ ---

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

      // --- (Логика кэширования остается без изменений) ---
      try {
        const cachedItem = localStorage.getItem(CACHE_KEY);
        if (cachedItem) {
          const cache = JSON.parse(cachedItem);
          const isCacheValid = (Date.now() - cache.timestamp) < MAX_CACHE_AGE_MS;

          if (isCacheValid) {
            setNovels(cache.data);
            setIsLoadingContent(false);
            // Загружаем в фоне, только если кэш ОЧЕНЬ старый (например, >15 мин)
            // Для 1 часа можно не грузить в фоне
          } else {
            // Кэш невалиден
            setNovels(cache.data); // Показываем старые данные...
            setIsLoadingContent(false); // ...но не показываем спиннер
            fetchNovels(true); // true = фоновая загрузка
          }
        } else {
          // Кэша нет
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
  // --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЙ --- ^^^^ ---


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
      // Мы передаем 'dataToUpdate' как один JSONB-аргумент 'data_to_update'
      const { error } = await supabase.rpc('update_my_profile', {
        data_to_update: dataToUpdate
      });

      if (error) {
        // Эта ошибка теперь будет более значимой, если что-то пойдет не так
        console.error("Ошибка при вызове RPC update_my_profile:", error);
        alert(`Не удалось сохранить данные: ${error.message}`);
      }
    }
    // 'userId' - единственная зависимость, все верно
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
                // --- VVVV --- НАЧАЛО ИЗМЕНЕНИЙ (Передача props) --- VVVV ---
                userRatings={userRatings}
                setUserRatings={setUserRatings}
                // --- VVVV --- НАЧАТЬ ИЗМЕНЕНИЕ 3: Передать callback --- VVVV ---
                onNovelStatsUpdate={handleNovelStatsUpdate}
                // --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЯ 3 --- ^^^^ ---
                // --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЙ --- ^^^^ ---
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