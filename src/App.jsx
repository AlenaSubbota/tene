import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from "firebase/app";
import { 
    getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
    collection, onSnapshot, query, orderBy, addDoc, 
    serverTimestamp, runTransaction
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// --- Безопасная загрузка ключей ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID
};

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
const HeartIcon = ({ className = '', filled = false }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19.5 12.572a4.5 4.5 0 0 0-6.43-6.234l-.07.064-.07-.064a4.5 4.5 0 0 0-6.43 6.234l6.5 6.235 6.5-6.235z"></path></svg>);
const SendIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>);

// --- Компонент: Анимация загрузки ---
const LoadingSpinner = ({ theme }) => {
  const t = themes[theme];
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${t.bg}`}>
      <HeartIcon className="animate-pulse-heart text-pink-400" filled />
      <p className={`mt-4 text-lg ${t.text} opacity-70`}>Загрузка новелл...</p>
    </div>
  );
};

// --- Цветовые Схемы с розовым акцентом ---
const themes = {
  light: { bg: 'bg-stone-100', text: 'text-stone-800', componentBg: 'bg-white', componentText: 'text-stone-700', border: 'border-stone-200', searchBg: 'bg-white', searchPlaceholder: 'placeholder-stone-400', searchRing: 'focus:ring-pink-400', tgBg: '#f8f7f5', tgHeader: '#FFFFFF', accent: 'pink-500', accentHover: 'pink-400' },
  dark: { bg: 'bg-gray-900', text: 'text-gray-100', componentBg: 'bg-gray-800', componentText: 'text-gray-200', border: 'border-gray-700', searchBg: 'bg-gray-800', searchPlaceholder: 'placeholder-gray-500', searchRing: 'focus:ring-pink-500', tgBg: '#111827', tgHeader: '#1f2937', accent: 'pink-500', accentHover: 'pink-400' }
};

// --- КОМПОНЕНТЫ ---
const SubscriptionModal = ({ onClose, onSelectPlan, theme }) => {
    const t = themes[theme];
    const subscriptionPlans = [{ duration: 1, name: '1 месяц', price: 199 },{ duration: 3, name: '3 месяца', price: 539, popular: true },{ duration: 12, name: '1 год', price: 1899 }];
    return (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className={`w-full max-w-sm rounded-2xl p-6 shadow-lg ${t.componentBg} ${t.text}`}><CrownIcon className={`mx-auto mb-4 text-${t.accent}`} /><h3 className="text-xl text-center font-bold">Получите доступ ко всем главам</h3><p className={`mt-2 mb-6 text-sm text-center opacity-70`}>Выберите подходящий тариф подписки:</p><div className="space-y-3">{subscriptionPlans.map(plan => (<button key={plan.duration} onClick={() => onSelectPlan(plan)} className={`relative w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 ${t.border} ${t.componentBg} hover:border-${t.accentHover}`}><p className="font-bold">{plan.name}</p><p className="text-sm">{plan.price} ₽</p></button>))}</div><button onClick={onClose} className={`w-full py-3 mt-4 rounded-lg border ${t.border}`}>Не сейчас</button></div></div>);
};
const PaymentMethodModal = ({ onClose, onSelectMethod, theme, plan }) => {
    const t = themes[theme];
    return (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className={`w-full max-w-sm rounded-2xl p-6 shadow-lg ${t.componentBg} ${t.text}`}><h3 className="text-xl text-center font-bold">Выберите способ оплаты</h3><p className={`mt-2 mb-6 text-sm text-center opacity-70`}>Тариф: {plan.name} ({plan.price} ₽)</p><div className="space-y-3"><button onClick={() => onSelectMethod('card')} className={`w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 ${t.border} ${t.componentBg} hover:border-${t.accentHover}`}><p className="font-bold">💳 Банковской картой</p><p className="text-sm opacity-70">Ручная проверка (до 24 часов)</p></button><button onClick={() => onSelectMethod('tribut')} className={`w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 ${t.border} ${t.componentBg} hover:border-${t.accentHover}`}><p className="font-bold">❤️ Донат через tribut</p><p className="text-sm opacity-70">Более быстрый способ</p></button></div><button onClick={onClose} className={`w-full py-3 mt-4 rounded-lg border ${t.border}`}>Назад</button></div></div>)
};
const FloatingNav = ({ onBack, onHome, isReader = false, onTextSizeChange, onThemeChange, theme }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="fixed bottom-4 right-4 z-20">
            {isOpen && (
                 <div className="flex flex-col items-center gap-3 mb-3">
                    {isReader && (
                        <>
                            <div className={`w-28 h-14 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-md shadow-lg flex items-center justify-around text-stone-700 dark:text-gray-200`}>
                                <button onClick={() => onTextSizeChange(-2)} className="text-2xl font-bold">-</button>
                                <button onClick={() => onTextSizeChange(2)} className="text-2xl font-bold">+</button>
                            </div>
                            <button onClick={onThemeChange} className="w-14 h-14 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-md shadow-lg flex items-center justify-center text-stone-700 dark:text-gray-200">
                                {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                            </button>
                        </>
                    )}
                    {onBack && <button onClick={onBack} className="w-14 h-14 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-md shadow-lg flex items-center justify-center text-stone-700 dark:text-gray-200"><BackIcon /></button>}
                    {onHome && <button onClick={onHome} className="w-14 h-14 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-md shadow-lg flex items-center justify-center text-stone-700 dark:text-gray-200"><HomeIcon /></button>}
                 </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className={`w-16 h-16 rounded-full bg-pink-500 text-white shadow-lg flex items-center justify-center transform transition-transform duration-300 hover:scale-110`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
        </div>
    )
};

const NovelList = ({ novels, onSelectNovel, theme, setTheme, genreFilter, onClearGenreFilter }) => {
  const t = themes[theme];
  const [searchQuery, setSearchQuery] = useState('');
  const filteredNovels = useMemo(() => novels.filter(novel => (!genreFilter || novel.genres.includes(genreFilter)) && novel.title.toLowerCase().includes(searchQuery.toLowerCase())), [novels, searchQuery, genreFilter]);
  if (!novels.length && !searchQuery) { return <div className={`p-4 text-center ${t.text}`}>Загрузка библиотеки...</div> }
  return (<div className={`p-4 ${t.text}`}><div className="flex justify-between items-center mb-4"><h1 className="text-3xl font-bold">Библиотека</h1><button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-full ${t.componentBg} ${t.border} border`}>{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</button></div>{genreFilter && (<div className={`flex items-center justify-between p-3 mb-4 rounded-lg border ${t.border} ${t.componentBg}`}><p className="text-sm"><span className="opacity-70">Жанр:</span><strong className="ml-2">{genreFilter}</strong></p><button onClick={onClearGenreFilter} className={`text-xs font-bold text-${t.accent} hover:underline`}>Сбросить</button></div>)}<div className="relative mb-6"><SearchIcon className={t.searchPlaceholder} /><input type="text" placeholder="Поиск по названию..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full ${t.searchBg} ${t.border} border rounded-lg py-2 pl-10 pr-4 ${t.text} ${t.searchPlaceholder} focus:outline-none focus:ring-2 ${t.searchRing} transition-shadow duration-300`} /></div><div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">{filteredNovels.map((novel, index) => (<div key={novel.id} onClick={() => onSelectNovel(novel)} className="cursor-pointer group relative animate-fade-in-down" style={{ animationDelay: `${index * 50}ms` }}><div className={`absolute -inset-1 bg-gradient-to-r from-${t.accent} to-purple-500 rounded-lg blur-md opacity-0 group-hover:opacity-50 transition duration-500`}></div><div className="relative"><img src={novel.coverUrl} alt={novel.title} className={`w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 ${t.border} border`} /><h2 className={`mt-2 font-semibold text-xs truncate ${t.text}`}>{novel.title}</h2></div></div>))}</div></div>);
};

const NovelDetails = ({ novel, onSelectChapter, onGenreSelect, theme, subscription, botUsername, userId, chaptersCache, lastReadData }) => {
    const t = themes[theme];
    const [chapters, setChapters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest');

    const hasActiveSubscription = subscription && new Date(subscription.expires_at) > new Date();
    const lastReadChapterId = useMemo(() => lastReadData && lastReadData[novel.id] ? lastReadData[novel.id].chapterId : null, [lastReadData, novel.id]);
    
    useEffect(() => { 
        if (chaptersCache[novel.id]) { 
            setChapters(chaptersCache[novel.id]); 
            setIsLoading(false); 
        } else { 
            setIsLoading(true); 
            fetch(`./data/chapters/${novel.id}.json`)
                .then(res => res.json())
                .then(data => { setChapters(data.chapters || []); setIsLoading(false); })
                .catch(err => { console.error(err); setChapters([]); setIsLoading(false); });
        } 
    }, [novel.id, chaptersCache]);
    
    const sortedChapters = useMemo(() => {
        const chaptersCopy = [...chapters];
        if (sortOrder === 'newest') return chaptersCopy.reverse();
        return chapters;
    }, [chapters, sortOrder]);

    const handleChapterClick = (chapter) => { if (!hasActiveSubscription && chapter.isPaid) setIsSubModalOpen(true); else onSelectChapter(chapter); };
    const handleContinueReading = () => { if (lastReadChapterId) { const chapterToContinue = chapters.find(c => c.id === lastReadChapterId); if (chapterToContinue) onSelectChapter(chapterToContinue); } };
    const handlePlanSelect = (plan) => setSelectedPlan(plan);
    const handlePaymentMethodSelect = async (method) => { const tg = window.Telegram?.WebApp; if (tg && userId && selectedPlan) { const userDocRef = doc(db, "users", userId); try { await setDoc(userDocRef, { pendingSubscription: { ...selectedPlan, method: method, date: new Date().toISOString() } }, { merge: true }); tg.openTelegramLink(`https://t.me/${botUsername}?start=true`); } catch (error) { console.error("Ошибка записи в Firebase:", error); tg.showAlert("Не удалось сохранить ваш выбор. Попробуйте снова."); } } };
    
    return (<div className={t.text}>{isSubModalOpen && !selectedPlan && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSelectPlan={handlePlanSelect} theme={theme} />}{isSubModalOpen && selectedPlan && <PaymentMethodModal onClose={() => setSelectedPlan(null)} onSelectMethod={handlePaymentMethodSelect} theme={theme} plan={selectedPlan} />}<div className="relative h-64"><img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover object-top absolute"/><div className={`absolute inset-0 bg-gradient-to-t ${theme === 'dark' ? 'from-gray-900 via-gray-900/80' : 'from-stone-100 via-stone-100/80'} to-transparent`}></div><div className="absolute bottom-4 left-4"><h1 className="text-3xl font-bold" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.5)'}}>{novel.title}</h1><p className="text-sm" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>{novel.author}</p></div></div><div className="p-4"><div className="flex flex-wrap gap-2 mb-4">{novel.genres.map(genre => (<button key={genre} onClick={() => onGenreSelect(genre)} className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'}`}>{genre}</button>))}</div><p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-stone-600'}`}>{novel.description}</p>{lastReadChapterId && <button onClick={handleContinueReading} className={`w-full py-3 mb-4 rounded-lg bg-${t.accent} text-white font-bold transition-transform hover:scale-105`}>Продолжить чтение (Глава {lastReadChapterId})</button>}<div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Главы</h2><button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className={`text-sm font-semibold text-${t.accent}`}>{sortOrder === 'newest' ? 'Сначала новые' : 'Сначала старые'}</button></div>{hasActiveSubscription && (<p className="text-sm text-green-500 mb-4">Подписка до {new Date(subscription.expires_at).toLocaleDateString()}</p>)}{isLoading ? <p className={t.text}>Загрузка глав...</p> : (<div className="flex flex-col gap-3">{sortedChapters.map(chapter => { const showLock = !hasActiveSubscription && chapter.isPaid; return (<div key={chapter.id} onClick={() => handleChapterClick(chapter)} className={`p-4 ${t.componentBg} rounded-xl cursor-pointer transition-all duration-200 hover:border-${t.accentHover} border ${t.border} flex items-center justify-between shadow-sm hover:shadow-md ${showLock ? 'opacity-70' : ''}`}>{lastReadChapterId === chapter.id && <span className={`absolute left-2 text-xs text-${t.accent}`}>●</span>}<div><p className={`font-semibold ${t.componentText}`}>{chapter.title}</p></div>{showLock ? <LockIcon className={t.text} /> : <ArrowRightIcon className={t.text}/>}</div>); })}</div>)}</div></div>)
};

const ChapterReader = ({ chapter, novel, theme, fontSize, userId, userName }) => {
  const t = themes[theme];
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [likeCount, setLikeCount] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);

  const chapterMetaRef = useMemo(() => doc(db, "chapters_metadata", `${novel.id}_${chapter.id}`), [novel.id, chapter.id]);

  useEffect(() => {
    const unsubMeta = onSnapshot(chapterMetaRef, (docSnap) => {
      setLikeCount(docSnap.data()?.likeCount || 0);
    });

    const commentsQuery = query(collection(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`), orderBy("timestamp", "asc"));
    const unsubComments = onSnapshot(commentsQuery, (querySnapshot) => {
      const commentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(commentsData);
    });

    if (userId && userId !== "guest_user") {
        const likeRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/likes`, userId);
        getDoc(likeRef).then(docSnap => setUserHasLiked(docSnap.exists()));
    }

    return () => {
      unsubMeta();
      unsubComments();
    };
  }, [chapterMetaRef, novel.id, chapter.id, userId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userId || userId === "guest_user") return;

    const commentsColRef = collection(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`);
    await addDoc(commentsColRef, {
      userId,
      userName: userName || "Аноним",
      text: newComment,
      timestamp: serverTimestamp()
    });
    setNewComment("");
  };
    const handleEdit = (comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };
    const handleUpdateComment = async (commentId) => {
    if (!editingText.trim()) return;
    const commentRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`, commentId);
    await updateDoc(commentRef, { text: editingText });
    setEditingCommentId(null);
    setEditingText("");
  };
    const handleDelete = async (commentId) => {
    const commentRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`, commentId);
    await deleteDoc(commentRef);
  };

  const handleLike = async () => {
    if (!userId || userId === "guest_user") return;
    
    const likeRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/likes`, userId);

    await runTransaction(db, async (transaction) => {
      const likeDoc = await transaction.get(likeRef);
      const metaDoc = await transaction.get(chapterMetaRef);
      const currentLikes = metaDoc.data()?.likeCount || 0;

      if (likeDoc.exists()) {
        transaction.delete(likeRef);
        transaction.set(chapterMetaRef, { likeCount: Math.max(0, currentLikes - 1) }, { merge: true });
        setUserHasLiked(false);
      } else {
        transaction.set(likeRef, { timestamp: serverTimestamp() });
        transaction.set(chapterMetaRef, { likeCount: currentLikes + 1 }, { merge: true });
        setUserHasLiked(true);
      }
    });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${t.bg}`}>
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto pb-24">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">{novel.title}</h1>
        <h2 className="text-lg sm:text-xl mb-8 text-center opacity-80">{chapter.title}</h2>
        <div className={`whitespace-pre-wrap leading-relaxed ${t.text}`} style={{ fontSize: `${fontSize}px` }}>{chapter.content}</div>
        
        <div className="mt-12 border-t pt-8">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleLike} className={`flex items-center gap-2 text-${t.accentHover} transition-transform hover:scale-110`}>
              <HeartIcon filled={userHasLiked} className={userHasLiked ? `text-${t.accent}` : ''} />
              <span className="font-bold text-lg">{likeCount}</span>
            </button>
          </div>

          <h3 className="text-2xl font-bold mb-4">Комментарии</h3>
          <div className="space-y-4 mb-6">
            {comments.map(comment => (
              <div key={comment.id} className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-stone-50'}`}>
                <p className="font-bold text-sm">{comment.userName}</p>
                {editingCommentId === comment.id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className={`w-full ${t.searchBg} ${t.border} border rounded-lg py-1 px-2 ${t.text}`}
                    />
                    <button onClick={() => handleUpdateComment(comment.id)} className={`p-1 rounded-full bg-green-500 text-white`}>✓</button>
                    <button onClick={() => setEditingCommentId(null)} className={`p-1 rounded-full bg-gray-500 text-white`}>✕</button>
                  </div>
                ) : (
                  <p className="text-md mt-1">{comment.text}</p>
                )}
                 {(userId === comment.userId || userId === "5493263435") && (
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => handleEdit(comment)} className="text-xs text-gray-500">Редактировать</button>
                    <button onClick={() => handleDelete(comment.id)} className="text-xs text-red-500">Удалить</button>
                  </div>
                )}
              </div>
            ))}
            {comments.length === 0 && <p className="opacity-70">Комментариев пока нет. Будьте первым!</p>}
          </div>

          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
            <input 
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Написать комментарий..."
              className={`w-full ${t.searchBg} ${t.border} border rounded-lg py-2 px-4 ${t.text} ${t.searchPlaceholder} focus:outline-none focus:ring-2 ${t.searchRing}`}
            />
            <button type="submit" className={`p-2 rounded-full bg-${t.accent} text-white`}>
              <SendIcon />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Главный компонент приложения ---
export default function App() {
  const [theme, setTheme] = useState('light');
  const [fontSize, setFontSize] = useState(18);
  const [page, setPage] = useState('list');
  const [novels, setNovels] = useState([]);
  const [selectedNovel, setSelectedNovel] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [genreFilter, setGenreFilter] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chaptersCache, setChaptersCache] = useState({});
  const [lastReadData, setLastReadData] = useState(null);

  const BOT_USERNAME = "tenebrisverbot";
  
  const updateUserDoc = useCallback(async (dataToUpdate) => {
    if (userId && userId !== "guest_user") {
        const userDocRef = doc(db, "users", userId);
        try {
            await setDoc(userDocRef, dataToUpdate, { merge: true });
        } catch(e) {
            console.error("Не удалось обновить данные пользователя:", e);
        }
    }
  }, [userId]);

  const handleSetTheme = useCallback((newTheme) => {
    setTheme(newTheme);
    updateUserDoc({ settings: { theme: newTheme, fontSize } });
  }, [fontSize, updateUserDoc]);
  
  const handleTextSizeChange = useCallback((amount) => {
    setFontSize(prevSize => {
        const newSize = Math.max(12, Math.min(32, prevSize + amount));
        updateUserDoc({ settings: { theme, fontSize: newSize } });
        return newSize;
    });
  }, [theme, updateUserDoc]);

  useEffect(() => {
    const init = async () => {
      try {
        const tg = window.Telegram?.WebApp;
        let telegramUserId = "guest_user";
        if (tg) {
          tg.ready();
          tg.expand();
          telegramUserId = tg.initDataUnsafe?.user?.id?.toString() || "guest_user";
          setUserName(tg.initDataUnsafe?.user?.first_name || null);
        }
        setUserId(telegramUserId);
        await signInAnonymously(auth);
        if (telegramUserId !== "guest_user") {
            const userDocRef = doc(db, "users", telegramUserId);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setSubscription(data.subscription || null);
              setLastReadData(data.lastRead || null);
              if (data.settings) {
                setTheme(data.settings.theme || 'light');
                setFontSize(data.settings.fontSize || 18);
              }
            }
        }
        const response = await fetch(`./data/novels.json`);
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
        fetch(`./data/chapters/${novel.id}.json`).then(res => res.json()).then(data => setChaptersCache(prev => ({ ...prev, [novel.id]: data.chapters || [] }))).catch(err => console.error(`Не удалось предзагрузить главы для ${novel.title}:`, err));
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

  const handleSelectChapter = useCallback(async (chapter) => {
    setSelectedChapter(chapter);
    setPage('reader');
    if (userId && userId !== "guest_user" && selectedNovel) {
        const newLastReadData = {
            ...(lastReadData || {}),
            [selectedNovel.id]: {
                novelId: selectedNovel.id,
                chapterId: chapter.id,
                timestamp: new Date().toISOString()
            }
        };
        setLastReadData(newLastReadData);
        await updateUserDoc({ lastRead: newLastReadData });
    }
  }, [userId, selectedNovel, lastReadData, updateUserDoc]);
  
  const handleSelectNovel = (novel) => { setSelectedNovel(novel); setPage('details'); };
  const handleGenreSelect = (genre) => { setGenreFilter(genre); setPage('list'); };
  const handleClearGenreFilter = () => { setGenreFilter(null); };

  if (isLoading) {
    return <LoadingSpinner theme={theme} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'details': return <NovelDetails novel={selectedNovel} onSelectChapter={handleSelectChapter} onGenreSelect={handleGenreSelect} theme={theme} subscription={subscription} botUsername={BOT_USERNAME} userId={userId} chaptersCache={chaptersCache} lastReadData={lastReadData} />;
      case 'reader': return <ChapterReader chapter={selectedChapter} novel={selectedNovel} theme={theme} fontSize={fontSize} userId={userId} userName={userName} />;
      case 'list': default: return <NovelList novels={novels} onSelectNovel={handleSelectNovel} theme={theme} setTheme={handleSetTheme} genreFilter={genreFilter} onClearGenreFilter={handleClearGenreFilter} />;
    }
  };
  
  const t = themes[theme];
  return (
    <main className={`${t.bg} min-h-screen`}>
      {renderPage()}
      <FloatingNav 
        onBack={page !== 'list' ? handleBack : null} 
        onHome={page !== 'list' ? handleHome : null}
        isReader={page === 'reader'}
        onTextSizeChange={handleTextSizeChange}
        onThemeChange={() => handleSetTheme(theme === 'dark' ? 'light' : 'dark')}
        theme={theme}
      />
    </main>
  );
}