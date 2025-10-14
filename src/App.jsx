// src/App.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, collection, setDoc, onSnapshot, getDocs } from "firebase/firestore";
import { db, auth } from './firebase-config.js';
import { useAuth } from './Auth';

// Импорты всех ваших компонентов и экранов
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

  // --- ОБЩИЕ СОСТОЯНИЯ ---
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
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

  // --- НОВОЕ: ЦЕНТРАЛИЗОВАННОЕ СОСТОЯНИЕ ДЛЯ НАСТРОЕК ЧТЕНИЯ ---
  const [readingSettings, setReadingSettings] = useState(() => {
    const savedSettings = localStorage.getItem('readingSettings');
    const defaultSettings = {
        fontSize: 16,
        fontFamily: "'JetBrains Mono', monospace", // <-- Шрифт по умолчанию
        lineHeight: 1.6,
        textAlign: 'left',
        textIndent: 1.5,
        paragraphSpacing: 1, // <-- Увеличил значение по умолчанию для наглядности
    };
    return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
  });

  const BOT_USERNAME = "tenebrisverbot";
  const userId = user?.uid;

  // --- useEffect'ы ---

  // Применение темы
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // НОВОЕ: Сохранение настроек чтения в localStorage при их изменении
  useEffect(() => {
    localStorage.setItem('readingSettings', JSON.stringify(readingSettings));
  }, [readingSettings]);

  // ГЛАВНЫЙ useEffect ДЛЯ ЗАГРУЗКИ ДАННЫХ
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
    
    setIsLoadingContent(true);

    const fetchNovelsAndStats = async () => {
        try {
            const novelsSnapshot = await getDocs(collection(db, "novels"));
            const novelsData = novelsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            const statsSnapshot = await getDocs(collection(db, "novel_stats"));
            const statsMap = new Map();
            statsSnapshot.forEach(doc => statsMap.set(doc.id, doc.data().views));
            const mergedNovels = novelsData.map(novel => ({ ...novel, views: statsMap.get(novel.id) || 0 }));
            setNovels(mergedNovels);
        } catch (err) {
            console.error("Ошибка загрузки новелл или статистики:", err);
            setNovels([]);
        }
    };
    
    const checkAdminStatus = async () => {
        try {
            const idTokenResult = await user.getIdTokenResult();
            setIsUserAdmin(!!idTokenResult.claims.admin);
        } catch (err) {
            console.error("Ошибка проверки статуса администратора:", err);
            setIsUserAdmin(false);
        }
    };

    Promise.all([fetchNovelsAndStats(), checkAdminStatus()]).finally(() => {
        setIsLoadingContent(false);
    });

    // Подписка на изменения данных пользователя
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setSubscription(data.subscription || null);
            setLastReadData(data.lastRead || {});
            setBookmarks(data.bookmarks || []);
            // --- ИЗМЕНЕНИЕ: Загружаем все настройки из Firebase ---
            if (data.settings) {
              setReadingSettings(prev => ({ ...prev, ...data.settings }));
            }
            if (!data.policyAccepted) {
              setNeedsPolicyAcceptance(true);
            } else {
              setNeedsPolicyAcceptance(false);
            }
        } else {
            setNeedsPolicyAcceptance(true);
        }
    }, (error) => {
        console.error("Ошибка подписки на данные пользователя:", error);
    });

    return () => unsubscribeUser();
  }, [user, authLoading]);

  // Загрузка глав для выбранной новеллы
  useEffect(() => {
    if (!selectedNovel) { setChapters([]); return; }
    setIsLoadingChapters(true);
    const fetchChapters = async () => {
        try {
            const docRef = doc(db, 'chapter_info', selectedNovel.id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data()) {
                const data = docSnap.data();
                const chaptersData = data.chapters || {};
                const chaptersArray = Object.keys(chaptersData).map(key => ({
                    id: parseInt(key),
                    title: `Глава ${key}`,
                    isPaid: chaptersData[key].isPaid || false,
                    published_at: chaptersData[key].published_at || null 
                })).sort((a, b) => a.id - b.id);
                setChapters(chaptersArray);
            } else { setChapters([]); }
        } catch (error) {
            console.error("Ошибка загрузки глав:", error);
            setChapters([]);
        } finally { setIsLoadingChapters(false); }
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

  // --- Функции-обработчики ---
  const updateUserDoc = useCallback(async (dataToUpdate) => {
    if (userId) {
        await setDoc(doc(db, "users", userId), dataToUpdate, { merge: true });
    }
  }, [userId]);

  const handleThemeToggle = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // --- НОВОЕ: ЕДИНАЯ ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ НАСТРОЕК ---
  const handleSettingChange = useCallback((key, value) => {
    setReadingSettings(prev => {
        const newValue = typeof value === 'function' ? value(prev[key]) : value;

        // Ограничения
        if (key === 'fontSize' && (newValue < 12 || newValue > 28)) return prev;
        if ((key === 'lineHeight' || key === 'paragraphSpacing') && (newValue < 1.0 || newValue > 2.5)) return prev;

        const newSettings = { ...prev, [key]: newValue };

        // Сохраняем в Firestore асинхронно
        updateUserDoc({ settings: newSettings });

        return newSettings;
    });
  }, [updateUserDoc]);

  const handleSelectChapter = useCallback(async (chapter) => {
    setSelectedChapter(chapter);
    setPage('reader');
    if (userId && selectedNovel) {
        const newLastReadData = { ...lastReadData, [selectedNovel.id]: { novelId: selectedNovel.id, chapterId: chapter.id, timestamp: new Date().toISOString() } };
        setLastReadData(newLastReadData);
        await updateUserDoc({ lastRead: newLastReadData });
    }
  }, [userId, selectedNovel, lastReadData, updateUserDoc]);

  const handleSelectNovel = (novel) => { setSelectedNovel(novel); setPage('details'); };
  const handleGenreSelect = (genre) => { setGenreFilter(genre); setPage('list'); setActiveTab('library'); };
  const handleClearGenreFilter = () => setGenreFilter(null);

  const handleToggleBookmark = useCallback(async (novelId) => {
    const newBookmarks = bookmarks.includes(novelId) ? bookmarks.filter(id => id !== novelId) : [...bookmarks, novelId];
    setBookmarks(newBookmarks);
    await updateUserDoc({ bookmarks: newBookmarks });
  }, [bookmarks, updateUserDoc]);

  const handlePlanSelect = (plan) => {
      setSelectedPlan(plan);
      setIsSubModalOpen(false);
  };

  const handlePaymentMethodSelect = async (method) => {
      const tg = window.Telegram?.WebApp;
      if (!tg || !userId || !selectedPlan) {
          if (tg) tg.showAlert("Произошла ошибка.");
          return;
      }
      tg.showConfirm("Вы будете перенаправлены в бот для завершения оплаты...", async (confirmed) => {
          if (!confirmed) return;
          try {
              await updateUserDoc({ pendingSubscription: { ...selectedPlan, method, date: new Date().toISOString() } });
              tg.openTelegramLink(`https://t.me/${BOT_USERNAME}?start=${userId}`);
              tg.close();
          } catch (error) {
              console.error("Ошибка записи в Firebase:", error);
              tg.showAlert("Не удалось сохранить ваш выбор.");
          }
      });
  };

  const handleAcceptPolicy = async () => {
    if (userId) {
      await updateUserDoc({ policyAccepted: true });
      setNeedsPolicyAcceptance(false);
    }
  };

  // --- ЛОГИКА РЕНДЕРИНГА ---
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
    if (page === 'details') {
      return <NovelDetails novel={selectedNovel} onSelectChapter={handleSelectChapter} onGenreSelect={handleGenreSelect} subscription={subscription} botUsername={BOT_USERNAME} userId={userId} chapters={chapters} isLoadingChapters={isLoadingChapters} lastReadData={lastReadData} onBack={handleBack} />;
    }
    if (page === 'reader') {
      // --- ИЗМЕНЕНИЕ: Передаем все новые props в ChapterReader ---
      return (
        <ChapterReader 
          chapter={selectedChapter} 
          novel={selectedNovel} 
          userId={userId} 
          userName={user?.displayName || 'Аноним'} 
          allChapters={chapters} 
          subscription={subscription} 
          botUsername={BOT_USERNAME} 
          onBack={handleBack} 
          isUserAdmin={isUserAdmin} 
          onSelectChapter={handleSelectChapter}
          
          // --- Новые props для настроек ---
          fontSize={readingSettings.fontSize}
          onFontSizeChange={(increment) => handleSettingChange('fontSize', val => val + increment)}
          
          fontFamily={readingSettings.fontFamily}
          onFontFamilyChange={(family) => handleSettingChange('fontFamily', family)}

          lineHeight={readingSettings.lineHeight}
          onLineHeightChange={(increment) => handleSettingChange('lineHeight', val => val + increment)}
          
          textAlign={readingSettings.textAlign}
          onTextAlignChange={(align) => handleSettingChange('textAlign', align)}

          textIndent={readingSettings.textIndent}
          onTextIndentChange={(indent) => handleSettingChange('textIndent', indent)}

          paragraphSpacing={readingSettings.paragraphSpacing}
          onParagraphSpacingChange={(increment) => handleSettingChange('paragraphSpacing', val => val + increment)}
        />
      );
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
      case 'profile': return <ProfilePage user={user} subscription={subscription} onGetSubscriptionClick={() => setIsSubModalOpen(true)} userId={userId} auth={auth} onThemeToggle={handleThemeToggle} currentTheme={theme} onShowHelp={() => setShowHelp(true)} />;
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