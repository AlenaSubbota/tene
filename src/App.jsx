import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// --- Безопасная загрузка ключей из .env файла ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

// --- Инициализация Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- ИКОНКИ ---
const ArrowRightIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`opacity-50 ${className}`}><path d="m9 18 6-6-6-6"/></svg>);
const SunIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>);
const MoonIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>);
const HomeIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>);
const BackIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>);
const SearchIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 ${className}`}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const LockIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`opacity-50 ${className}`}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>);
const CrownIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>);
const HeartIcon = ({ className = ''}) => (<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19.5 12.572a4.5 4.5 0 0 0-6.43-6.234l-.07.064-.07-.064a4.5 4.5 0 0 0-6.43 6.234l6.5 6.235 6.5-6.235z"></path></svg>);

// --- НОВЫЙ КОМПОНЕНТ: Анимация загрузки ---
const LoadingSpinner = ({ theme }) => {
  const t = themes[theme];
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${t.bg}`}>
      <HeartIcon className="animate-pulse-heart text-pink-400" />
      <p className={`mt-4 text-lg ${t.text} opacity-70`}>Загрузка новелл...</p>
    </div>
  );
};


// --- Цветовые Схемы ---
const themes = {
  light: { bg: 'bg-stone-100', text: 'text-stone-800', componentBg: 'bg-white', componentText: 'text-stone-700', border: 'border-stone-200', searchBg: 'bg-white', searchPlaceholder: 'placeholder-stone-400', searchRing: 'focus:ring-pink-400', tgBg: '#F5F5F0', tgHeader: '#FFFFFF' },
  dark: { bg: 'bg-gray-900', text: 'text-gray-100', componentBg: 'bg-gray-800', componentText: 'text-gray-200', border: 'border-gray-700', searchBg: 'bg-gray-800', searchPlaceholder: 'placeholder-gray-500', searchRing: 'focus:ring-pink-500', tgBg: '#121212', tgHeader: '#171717' }
};

// --- КОМПОНЕНТЫ ---
const SubscriptionModal = ({ onClose, onSelectPlan, theme }) => {
    const t = themes[theme];
    const subscriptionPlans = [{ duration: 1, name: '1 месяц', price: 199 },{ duration: 3, name: '3 месяца', price: 539, popular: true },{ duration: 12, name: '1 год', price: 1899 }];
    return (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className={`w-full max-w-sm rounded-2xl p-6 shadow-lg ${t.componentBg} ${t.text}`}><CrownIcon className={`mx-auto mb-4 text-pink-400`} /><h3 className="text-xl text-center font-bold">Получите доступ ко всем главам</h3><p className={`mt-2 mb-6 text-sm text-center opacity-70`}>Выберите подходящий тариф подписки:</p><div className="space-y-3">{subscriptionPlans.map(plan => (<button key={plan.duration} onClick={() => onSelectPlan(plan)} className={`relative w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 ${t.border} ${t.componentBg} hover:border-pink-400`}>{plan.popular && <span className="absolute top-2 right-2 text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full">Популярный</span>}<p className="font-bold">{plan.name}</p><p className="text-sm">{plan.price} ₽</p></button>))}</div><button onClick={onClose} className={`w-full py-3 mt-4 rounded-lg border ${t.border}`}>Не сейчас</button></div></div>);
};
const PaymentMethodModal = ({ onClose, onSelectMethod, theme, plan }) => {
    const t = themes[theme];
    return (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className={`w-full max-w-sm rounded-2xl p-6 shadow-lg ${t.componentBg} ${t.text}`}><h3 className="text-xl text-center font-bold">Выберите способ оплаты</h3><p className={`mt-2 mb-6 text-sm text-center opacity-70`}>Тариф: {plan.name} ({plan.price} ₽)</p><div className="space-y-3"><button onClick={() => onSelectMethod('card')} className={`w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 ${t.border} ${t.componentBg} hover:border-pink-400`}><p className="font-bold">💳 Банковской картой</p><p className="text-sm opacity-70">Ручная проверка (до 24 часов)</p></button><button onClick={() => onSelectMethod('tribut')} className={`w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 ${t.border} ${t.componentBg} hover:border-pink-400`}><p className="font-bold">❤️ Донат через tribut</p><p className="text-sm opacity-70">Более быстрый способ</p></button></div><button onClick={onClose} className={`w-full py-3 mt-4 rounded-lg border ${t.border}`}>Назад</button></div></div>)
};
const FloatingNav = ({ onBack, onHome }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (<div className="fixed bottom-4 right-4 z-20">{isOpen && (<div className="flex flex-col gap-3 mb-3"><button onClick={onBack} className="w-14 h-14 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-md shadow-lg flex items-center justify-center text-stone-700 dark:text-gray-200"><BackIcon /></button><button onClick={onHome} className="w-14 h-14 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-md shadow-lg flex items-center justify-center text-stone-700 dark:text-gray-200"><HomeIcon /></button></div>)}<button onClick={() => setIsOpen(!isOpen)} className="w-16 h-16 rounded-full bg-pink-500 text-white shadow-lg flex items-center justify-center transform transition-transform duration-300 hover:scale-110"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button></div>)
};
const NovelList = ({ novels, onSelectNovel, theme, setTheme, genreFilter, onClearGenreFilter }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const t = themes[theme];
  const filteredNovels = useMemo(() => novels.filter(novel => (!genreFilter || novel.genres.includes(genreFilter)) && novel.title.toLowerCase().includes(searchQuery.toLowerCase())), [novels, searchQuery, genreFilter]);
  if (!novels.length && !searchQuery) { return <div className={`p-4 text-center ${t.text}`}>Загрузка библиотеки...</div> }
  return (<div className={`p-4 ${t.text}`}><div className="flex justify-between items-center mb-4"><h1 className="text-3xl font-bold">Библиотека</h1><button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-full ${t.componentBg} ${t.border} border`}>{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</button></div>{genreFilter && (<div className={`flex items-center justify-between p-3 mb-4 rounded-lg border ${t.border} ${t.componentBg}`}><p className="text-sm"><span className="opacity-70">Жанр:</span><strong className="ml-2">{genreFilter}</strong></p><button onClick={onClearGenreFilter} className="text-xs font-bold text-pink-500 hover:underline">Сбросить</button></div>)}<div className="relative mb-6"><SearchIcon className={t.searchPlaceholder} /><input type="text" placeholder="Поиск по названию..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full ${t.searchBg} ${t.border} border rounded-lg py-2 pl-10 pr-4 ${t.text} ${t.searchPlaceholder} focus:outline-none focus:ring-2 ${t.searchRing} transition-shadow duration-300`} /></div><div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">{filteredNovels.map(novel => (<div key={novel.id} onClick={() => onSelectNovel(novel)} className="cursor-pointer group relative"><div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg blur-md opacity-0 group-hover:opacity-50 transition duration-500"></div><div className="relative"><img src={novel.coverUrl} alt={novel.title} className={`w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 ${t.border} border`} /><h2 className={`mt-2 font-semibold text-xs truncate ${t.text}`}>{novel.title}</h2><p className="text-xs text-gray-400 dark:text-gray-500">{novel.lastUpdate}</p></div></div>))}</div></div>);
};
const NovelDetails = ({ novel, onSelectChapter, onGenreSelect, theme, subscription, botUsername, userId, chaptersCache }) => {
    const t = themes[theme];
    const [chapters, setChapters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const hasActiveSubscription = subscription && new Date(subscription.expires_at) > new Date();
    useEffect(() => { if (chaptersCache[novel.id]) { setChapters(chaptersCache[novel.id]); setIsLoading(false); } else { setIsLoading(true); fetch(`data/chapters/${novel.id}.json`).then(res => res.json()).then(data => { setChapters(data.chapters || []); setIsLoading(false); }).catch(err => { console.error(err); setChapters([]); setIsLoading(false); }); } }, [novel.id, chaptersCache]);
    const sortedChapters = useMemo(() => { const chaptersCopy = [...chapters]; return chaptersCopy.reverse() }, [chapters]);
    const handleChapterClick = (chapter) => { if (!hasActiveSubscription && chapter.isPaid) { setIsSubModalOpen(true); } else { onSelectChapter(chapter); } };
    const handlePlanSelect = (plan) => { setSelectedPlan(plan); };
    const handlePaymentMethodSelect = async (method) => { const tg = window.Telegram?.WebApp; if (tg && userId && selectedPlan) { const userDocRef = doc(db, "users", userId); try { await setDoc(userDocRef, { pendingSubscription: { ...selectedPlan, method: method, date: new Date().toISOString() } }, { merge: true }); tg.openTelegramLink(`https://t.me/${botUsername}?start=true`); } catch (error) { console.error("Ошибка записи в Firebase:", error); tg.showAlert("Не удалось сохранить ваш выбор. Попробуйте снова."); } } };
    return (<div className={t.text}>{isSubModalOpen && !selectedPlan && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSelectPlan={handlePlanSelect} theme={theme} />}{isSubModalOpen && selectedPlan && <PaymentMethodModal onClose={() => setSelectedPlan(null)} onSelectMethod={handlePaymentMethodSelect} theme={theme} plan={selectedPlan} />}<div className="relative h-64"><img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover object-top absolute"/><div className={`absolute inset-0 bg-gradient-to-t ${theme === 'dark' ? 'from-gray-900 via-gray-900/80' : 'from-stone-100 via-stone-100/80'} to-transparent`}></div><div className="absolute bottom-4 left-4"><h1 className="text-3xl font-bold" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.5)'}}>{novel.title}</h1><p className="text-sm" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>{novel.author}</p></div></div><div className="p-4"><div className="flex flex-wrap gap-2 mb-4">{novel.genres.map(genre => (<button key={genre} onClick={() => onGenreSelect(genre)} className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'}`}>{genre}</button>))}</div><p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-stone-600'}`}>{novel.description}</p><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Главы</h2>{hasActiveSubscription && (<p className="text-sm text-green-500">Подписка до {new Date(subscription.expires_at).toLocaleDateString()}</p>)}</div>{isLoading ? <p className={t.text}>Загрузка глав...</p> : (<div className="flex flex-col gap-3">{sortedChapters.map(chapter => { const showLock = !hasActiveSubscription && chapter.isPaid; return (<div key={chapter.id} onClick={() => handleChapterClick(chapter)} className={`p-4 ${t.componentBg} rounded-xl cursor-pointer transition-colors duration-200 hover:border-pink-400 border ${t.border} flex items-center justify-between ${showLock ? 'opacity-70' : ''}`}><div><p className={`font-semibold ${t.componentText}`}>{chapter.title}</p></div>{showLock ? <LockIcon className={t.text} /> : <ArrowRightIcon className={t.text}/>}</div>); })}</div>)}</div></div>)
};
const ChapterReader = ({ chapter, novel, theme }) => {
  const t = themes[theme];
  return (<div className={`min-h-screen transition-colors duration-300 ${t.bg}`}><div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto"><h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">{novel.title}</h1><h2 className="text-lg sm:text-xl mb-8 text-center opacity-80">{chapter.title}</h2><div className={`whitespace-pre-wrap leading-relaxed text-lg ${t.text}`}>{chapter.content}</div></div></div>);
};


// --- Главный компонент приложения ---
export default function App() {
  const [theme, setTheme] = useState('light');
  const [page, setPage] = useState('list');
  const [novels, setNovels] = useState([]);
  const [selectedNovel, setSelectedNovel] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [genreFilter, setGenreFilter] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chaptersCache, setChaptersCache] = useState({});

  const BOT_USERNAME = "tenebrisverbot";
  
  useEffect(() => {
    const init = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        let telegramUserId = "guest_user";
        if (tg) {
          tg.ready();
          tg.expand();
          telegramUserId = tg.initDataUnsafe?.user?.id?.toString() || "guest_user";
        }
        setUserId(telegramUserId);
        await signInAnonymously(auth);
        const userDocRef = doc(db, "users", telegramUserId);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setSubscription(docSnap.data().subscription || null);
        }
        const response = await fetch(`data/novels.json`);
        if (!response.ok) throw new Error('Failed to fetch novels');
        const data = await response.json();
        setNovels(data.novels);
      } catch (error) {
        console.error("Ошибка инициализации:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);
  
  useEffect(() => {
    if (novels.length > 0) {
      novels.forEach(novel => {
        fetch(`data/chapters/${novel.id}.json`)
          .then(res => res.json())
          .then(data => {
            setChaptersCache(prevCache => ({ ...prevCache, [novel.id]: data.chapters || [] }));
          })
          .catch(err => console.error(`Не удалось предзагрузить главы для ${novel.title}:`, err));
      });
    }
  }, [novels]);

  useEffect(() => { document.documentElement.className = theme; }, [theme]);
  const handleBack = useCallback(() => {
      if (page === 'reader') setPage('details');
      else if (page === 'details') { setPage('list'); setGenreFilter(null); }
  }, [page]);
  const handleHome = useCallback(() => { setPage('list'); setGenreFilter(null); }, []);
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.onEvent('backButtonClicked', handleBack);
    if (page === 'list') tg.BackButton.hide(); else tg.BackButton.show();
    return () => tg.offEvent('backButtonClicked', handleBack);
  }, [page, handleBack]);
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.setHeaderColor(themes[theme].tgHeader);
    tg.setBackgroundColor(themes[theme].tgBg);
  }, [theme]);

  const handleSelectNovel = (novel) => { setSelectedNovel(novel); setPage('details'); };
  const handleSelectChapter = (chapter) => { setSelectedChapter(chapter); setPage('reader'); };
  const handleGenreSelect = (genre) => { setGenreFilter(genre); setPage('list'); };
  const handleClearGenreFilter = () => { setGenreFilter(null); };

  if (isLoading) {
    return <LoadingSpinner theme={theme} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'details': return <NovelDetails novel={selectedNovel} onSelectChapter={handleSelectChapter} onGenreSelect={handleGenreSelect} theme={theme} subscription={subscription} botUsername={BOT_USERNAME} userId={userId} chaptersCache={chaptersCache} />;
      case 'reader': return <ChapterReader chapter={selectedChapter} novel={selectedNovel} theme={theme} />;
      case 'list': default: return <NovelList novels={novels} onSelectNovel={handleSelectNovel} theme={theme} setTheme={setTheme} genreFilter={genreFilter} onClearGenreFilter={handleClearGenreFilter} />;
    }
  };
  
  const t = themes[theme];
  return (
    <main className={`${t.bg} min-h-screen`}>
      {renderPage()}
      {page !== 'list' && <FloatingNav onBack={handleBack} onHome={handleHome} />}
    </main>
  );
}