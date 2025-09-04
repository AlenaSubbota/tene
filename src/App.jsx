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
const ADMIN_ID = "417641827"; // Ваш ID администратора

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
const BookmarkIcon = ({ className = '', filled = false }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>);


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

// --- Цветовые Схемы ---
const themes = {
  light: { 
    bg: 'bg-stone-100', text: 'text-stone-800', componentBg: 'bg-white', componentText: 'text-stone-700', 
    border: 'border-stone-200', searchBg: 'bg-white', searchPlaceholder: 'placeholder-stone-400', 
    searchRing: 'focus:ring-pink-400', tgBg: '#f8f7f5', tgHeader: '#FFFFFF', accent: 'pink-500', 
    accentHover: 'pink-400', commentBg: 'bg-stone-50', commentText: 'text-stone-800'
  },
  dark: { 
    bg: 'bg-gray-900', text: 'text-gray-100', componentBg: 'bg-gray-800', componentText: 'text-gray-200', 
    border: 'border-gray-700', searchBg: 'bg-gray-800', searchPlaceholder: 'placeholder-gray-500', 
    searchRing: 'focus:ring-pink-500', tgBg: '#111827', tgHeader: '#1f2937', accent: 'pink-500', 
    accentHover: 'pink-400', commentBg: 'bg-gray-700', commentText: 'text-gray-100'
  }
};


// --- КОМПОНЕНТЫ ---
// ... (Код SubscriptionModal и PaymentMethodModal без изменений) ...

const TopMenu = ({ onBack, onHome, isReader = false, onTextSizeChange, onThemeChange, theme, onFontChange, currentFont }) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = themes[theme];

  const fonts = [
    { name: 'Montserrat', class: 'font-sans' },
    { name: 'Arial', class: 'font-body' },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className={`fixed top-4 right-4 z-20 w-12 h-12 rounded-full ${t.componentBg} ${t.border} border text-lg shadow-lg flex items-center justify-center ${t.text}`}
      >
        ☰
      </button>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className={`fixed top-0 left-0 right-0 p-4 ${t.componentBg} shadow-lg rounded-b-2xl animate-fade-in-down ${t.text}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Настройки</h3>
              <button onClick={() => setIsOpen(false)} className="font-bold text-2xl">&times;</button>
            </div>
            {isReader && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Размер текста</span>
                  <div className={`w-28 h-12 rounded-full ${t.bg} flex items-center justify-around`}>
                    <button onClick={() => onTextSizeChange(-2)} className="text-2xl font-bold">-</button>
                    <button onClick={() => onTextSizeChange(2)} className="text-2xl font-bold">+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Тема</span>
                  <button onClick={onThemeChange} className={`w-12 h-12 rounded-full ${t.bg} flex items-center justify-center`}>
                    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                  </button>
                </div>
                {/* Выбор шрифта */}
                <div className="flex items-center justify-between">
                  <span>Шрифт</span>
                  <select 
                    onChange={(e) => onFontChange(e.target.value)} 
                    value={currentFont}
                    className={`w-32 h-10 rounded-full ${t.bg} border ${t.border} ${t.text} px-2 py-1 focus:outline-none focus:ring-2 ${t.searchRing}`}
                  >
                    {fonts.map(font => (
                      <option key={font.name} value={font.class}>{font.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
             <div className="flex gap-3 mt-4">
               {onBack && <button onClick={() => { onBack(); setIsOpen(false); }} className={`flex-1 py-3 rounded-lg ${t.bg} flex items-center justify-center gap-2`}><BackIcon /> Назад</button>}
               {onHome && <button onClick={() => { onHome(); setIsOpen(false); }} className={`flex-1 py-3 rounded-lg ${t.bg} flex items-center justify-center gap-2`}><HomeIcon /> Главная</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};


const NovelList = ({ novels, onSelectNovel, theme, setTheme, genreFilter, onClearGenreFilter, bookmarks, onToggleBookmark, onShowBookmarks }) => {
  const t = themes[theme];
  const [searchQuery, setSearchQuery] = useState('');
  const filteredNovels = useMemo(() => novels.filter(novel => (!genreFilter || novel.genres.includes(genreFilter)) && novel.title.toLowerCase().includes(searchQuery.toLowerCase())), [novels, searchQuery, genreFilter]);
  if (!novels.length && !searchQuery) { return <div className={`p-4 text-center ${t.text}`}>Загрузка библиотеки...</div> }
  return (<div className={`p-4 ${t.text}`}><div className="flex justify-between items-center mb-4"><h1 className="text-3xl font-bold">Библиотека</h1><div className="flex gap-2 items-center"><button onClick={onShowBookmarks} className={`p-2 rounded-full ${t.componentBg} ${t.border} border`}><BookmarkIcon /></button><button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-full ${t.componentBg} ${t.border} border`}>{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</button></div></div>{genreFilter && (<div className={`flex items-center justify-between p-3 mb-4 rounded-lg border ${t.border} ${t.componentBg}`}><p className="text-sm"><span className="opacity-70">Жанр:</span><strong className="ml-2">{genreFilter}</strong></p><button onClick={onClearGenreFilter} className={`text-xs font-bold text-${t.accent} hover:underline`}>Сбросить</button></div>)}<div className="relative mb-6"><SearchIcon className={t.searchPlaceholder} /><input type="text" placeholder="Поиск по названию..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full ${t.searchBg} ${t.border} border rounded-lg py-2 pl-10 pr-4 ${t.text} ${t.searchPlaceholder} focus:outline-none focus:ring-2 ${t.searchRing} transition-shadow duration-300`} /></div><div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">{filteredNovels.map((novel, index) => (<div key={novel.id} onClick={() => onSelectNovel(novel)} className="cursor-pointer group animate-fade-in-down" style={{ animationDelay: `${index * 50}ms` }}><div className="relative filter drop-shadow-md group-hover:drop-shadow-pink transition-all duration-300"><button onClick={(e) => { e.stopPropagation(); onToggleBookmark(novel.id); }} className={`absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white transition-colors ${bookmarks.includes(novel.id) ? 'text-pink-400' : ''}`}><BookmarkIcon filled={bookmarks.includes(novel.id)} /></button><img src={novel.coverUrl} alt={novel.title} className={`w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 ${t.border} border`} /><h2 className={`mt-2 font-semibold text-xs truncate ${t.text}`}>{novel.title}</h2></div></div>))}</div></div>);
};

const NovelDetails = ({ novel, onSelectChapter, onGenreSelect, theme, subscription, botUsername, userId, chaptersCache, lastReadData }) => {
    const t = themes[theme];
    const [chapters, setChapters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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
    
    return (<div className={t.text}><div className="relative h-64"><img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover object-top absolute"/><div className={`absolute inset-0 bg-gradient-to-t ${theme === 'dark' ? 'from-gray-900 via-gray-900/80' : 'from-stone-100 via-stone-100/80'} to-transparent`}></div><div className="absolute bottom-4 left-4"><h1 className={`text-3xl font-bold font-sans text-pink-400 drop-shadow-pink`}>{novel.title}</h1><p className="text-sm font-sans">{novel.author}</p></div></div><div className="p-4"><div className="flex flex-wrap gap-2 mb-4">{novel.genres.map(genre => (<button key={genre} onClick={() => onGenreSelect(genre)} className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'}`}>{genre}</button>))}</div><div className={`relative overflow-hidden transition-all duration-500 ${isDescriptionExpanded ? 'max-h-full' : 'max-h-24'}`}><p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-stone-600'} font-body`}>{novel.description}</p></div><button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className={`text-sm font-semibold text-${t.accent} mb-4`}>{isDescriptionExpanded ? 'Скрыть' : 'Читать полностью...'}</button>{lastReadChapterId && <button onClick={handleContinueReading} className={`w-full py-3 mb-4 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold shadow-lg shadow-pink-500/30 transition-all hover:scale-105 hover:shadow-xl`}>Продолжить чтение (Глава {lastReadChapterId})</button>}<div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Главы</h2><button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className={`text-sm font-semibold text-${t.accent}`}>{sortOrder === 'newest' ? 'Сначала новые' : 'Сначала старые'}</button></div>{hasActiveSubscription && (<p className="text-sm text-green-500 mb-4">Подписка до {new Date(subscription.expires_at).toLocaleDateString()}</p>)}{isLoading ? <p className={t.text}>Загрузка глав...</p> : (<div className="flex flex-col gap-3">{sortedChapters.map(chapter => { 
        const showLock = !hasActiveSubscription && chapter.isPaid; 
        const isLastRead = lastReadChapterId === chapter.id;
        return (<div key={chapter.id} onClick={() => handleChapterClick(chapter)} className={`p-4 ${t.componentBg} rounded-xl cursor-pointer transition-all duration-200 hover:border-pink-400 hover:bg-pink-500/10 border ${t.border} flex items-center justify-between shadow-sm hover:shadow-md ${showLock ? 'opacity-70' : ''}`}> 
            <div className="flex items-center gap-3">
                {isLastRead && <span className={`w-2 h-2 rounded-full bg-pink-400`}></span>}
                <p className={`font-semibold ${t.componentText}`}>{chapter.title}</p>
            </div>
            {showLock ? <LockIcon className={t.text} /> : <ArrowRightIcon className={t.text}/>}
        </div>); 
    })}</div>)}</div></div>)
};

const ChapterReader = ({ chapter, novel, theme, fontSize, userId, userName, currentFontClass }) => {
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center font-sans text-pink-400">{novel.title}</h1>
        <h2 className={`text-lg sm:text-xl mb-8 text-center opacity-80 font-sans ${t.text}`}>{chapter.title}</h2>
        <div className={`whitespace-pre-wrap leading-relaxed ${t.text} ${currentFontClass}`} style={{ fontSize: `${fontSize}px` }}>{chapter.content}</div>
        
        <div className="mt-12 border-t pt-8">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleLike} className={`flex items-center gap-2 text-${t.accentHover} transition-transform hover:scale-110`}>
              <HeartIcon filled={userHasLiked} className={userHasLiked ? `text-${t.accent}` : ''} />
              <span className="font-bold text-lg">{likeCount}</span>
            </button>
          </div>

          <h3 className={`text-2xl font-bold mb-4 ${t.text}`}>Комментарии</h3>
          <div className="space-y-4 mb-6">
            {comments.map(comment => (
              <div key={comment.id} className={`p-3 rounded-lg ${t.commentBg}`}> 
                <p className={`font-bold text-sm ${t.commentText}`}>{comment.userName}</p>
                {editingCommentId === comment.id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className={`w-full ${t.searchBg} ${t.border} border rounded-lg py-1 px-2 ${t.commentText}`}
                    />
                    <button onClick={() => handleUpdateComment(comment.id)} className={`p-1 rounded-full bg-green-500 text-white`}>✓</button>
                    <button onClick={() => setEditingCommentId(null)} className={`p-1 rounded-full bg-gray-500 text-white`}>✕</button>
                  </div>
                ) : (
                  <p className={`text-md mt-1 ${t.commentText}`}>{comment.text}</p>
                )}
                 {(userId === comment.userId || userId === ADMIN_ID) && (
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => handleEdit(comment)} className="text-xs text-gray-500">Редактировать</button>
                    <button onClick={() => handleDelete(comment.id)} className="text-xs text-red-500">Удалить</button>
                  </div>
                )}
              </div>
            ))}
            {comments.length === 0 && <p className={`opacity-70 ${t.text}`}>Комментариев пока нет. Будьте первым!</p>}
          </div>

          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
            <input 
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Написать комментарий..."
              className={`w-full ${t.searchBg} ${t.border} border rounded-lg py-2 px-4 ${t.commentText} ${t.searchPlaceholder} focus:outline-none focus:ring-2 ${t.searchRing}`}
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
  const [fontClass, setFontClass] = useState('font-body');
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
  const [bookmarks, setBookmarks] = useState([]);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

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
    updateUserDoc({ settings: { theme: newTheme, fontSize, fontClass } });
  }, [fontSize, fontClass, updateUserDoc]);
  
  const handleTextSizeChange = useCallback((amount) => {
    setFontSize(prevSize => {
        const newSize = Math.max(12, Math.min(32, prevSize + amount));
        updateUserDoc({ settings: { theme, fontSize: newSize, fontClass } });
        return newSize;
    });
  }, [theme, fontClass, updateUserDoc]);

  const handleFontChange = useCallback((newFontClass) => {
    setFontClass(newFontClass);
    updateUserDoc({ settings: { theme, fontSize, fontClass: newFontClass } });
  }, [theme, fontSize, updateUserDoc]);

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
              setBookmarks(data.bookmarks || []);
              if (data.settings) {
                setTheme(data.settings.theme || 'light');
                setFontSize(data.settings.fontSize || 18);
                setFontClass(data.settings.fontClass || 'font-body');
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

  const handleToggleBookmark = useCallback(async (novelId) => {
    const newBookmarks = bookmarks.includes(novelId) 
      ? bookmarks.filter(id => id !== novelId)
      : [...bookmarks, novelId];
    setBookmarks(newBookmarks);
    await updateUserDoc({ bookmarks: newBookmarks });
  }, [bookmarks, updateUserDoc]);

  const bookmarkedNovels = useMemo(() => {
    return novels.filter(novel => bookmarks.includes(novel.id));
  }, [novels, bookmarks]);

  if (isLoading) {
    return <LoadingSpinner theme={theme} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'details': return <NovelDetails novel={selectedNovel} onSelectChapter={handleSelectChapter} onGenreSelect={handleGenreSelect} theme={theme} subscription={subscription} botUsername={BOT_USERNAME} userId={userId} chaptersCache={chaptersCache} lastReadData={lastReadData} />;
      case 'reader': return <ChapterReader chapter={selectedChapter} novel={selectedNovel} theme={theme} fontSize={fontSize} userId={userId} userName={userName} currentFontClass={fontClass} />;
      case 'list': default: return <NovelList novels={novels} onSelectNovel={handleSelectNovel} theme={theme} setTheme={handleSetTheme} genreFilter={genreFilter} onClearGenreFilter={handleClearGenreFilter} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} onShowBookmarks={() => setIsBookmarksOpen(true)} />;
    }
  };
  
  const t = themes[theme];
  const isUserAdmin = userId === ADMIN_ID;

  return (
    <main className={`${t.bg} min-h-screen font-sans ${!isUserAdmin ? 'no-select' : ''}`}>
      {renderPage()}
      {isBookmarksOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 p-4" onClick={() => setIsBookmarksOpen(false)}>
          <div className={`w-full max-w-md mx-auto mt-10 p-4 rounded-2xl shadow-lg ${t.componentBg} ${t.text}`} onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Закладки</h2>
            <div className="grid grid-cols-3 gap-3">
              {bookmarkedNovels.length > 0 ? bookmarkedNovels.map(novel => (
                <div key={novel.id} onClick={() => { onSelectNovel(novel); setIsBookmarksOpen(false); }} className="cursor-pointer">
                  <img src={novel.coverUrl} alt={novel.title} className="w-full aspect-[2/3] object-cover rounded-lg"/>
                </div>
              )) : <p>У вас пока нет закладок.</p>}
            </div>
          </div>
        </div>
      )}
      <TopMenu
        onBack={page !== 'list' ? handleBack : null} 
        onHome={page !== 'list' ? handleHome : null}
        isReader={page === 'reader'}
        onTextSizeChange={handleTextSizeChange}
        onThemeChange={() => handleSetTheme(theme === 'dark' ? 'light' : 'dark')}
        onFontChange={handleFontChange}
        currentFont={fontClass}
        theme={theme}
      />
    </main>
  );
}