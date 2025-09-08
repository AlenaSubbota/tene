import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { initializeApp } from "firebase/app";
import {
    getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc,
    collection, onSnapshot, query, orderBy, addDoc,
    serverTimestamp, runTransaction
} from "firebase/firestore";
import { 
    getAuth,
    onAuthStateChanged, 
    browserLocalPersistence,
    getRedirectResult,
    setPersistence,
    updateProfile
} from "firebase/auth";
import { Auth } from './Auth.jsx';
import { AuthScreen } from './AuthScreen.jsx';

// --- Firebase Config ---
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
setPersistence(auth, browserLocalPersistence);

// --- Иконки ---
const ArrowRightIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`opacity-50 ${className}`}><path d="m9 18 6-6-6-6"/></svg>);
const BackIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>);
const SearchIcon = ({ className = '', filled = false }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>);
const LockIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`opacity-50 ${className}`}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>);
const CrownIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>);
const HeartIcon = ({ className = '', filled = false }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19.5 12.572a4.5 4.5 0 0 0-6.43-6.234l-.07.064-.07-.064a4.5 4.5 0 0 0-6.43 6.234l6.5 6.235 6.5-6.235z"></path></svg>);
const SendIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>);
const BookmarkIcon = ({ className = '', filled = false }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>);
const UserIcon = ({ className = '', filled = false }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const LibraryIcon = ({ className = '', filled = false }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 22h16"/><path d="M7 22V2h10v20"/><path d="M7 12h4"/></svg>);
const ChevronLeftIcon = ({ className = '' }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"/></svg>;
const ChevronRightIcon = ({ className = '' }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>;
const SettingsIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>);

// --- Компоненты ---
const LoadingSpinner = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main">
    <HeartIcon className="animate-pulse-heart text-accent" filled />
    <p className="mt-4 text-lg opacity-70">Загрузка...</p>
  </div>
);
const SubscriptionModal = ({ onClose, onSelectPlan }) => {
    const subscriptionPlans = [{ duration: 1, name: '1 месяц', price: 199 },{ duration: 3, name: '3 месяца', price: 539, popular: true },{ duration: 12, name: '1 год', price: 1899 }];
    return (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="w-full max-w-sm rounded-2xl p-6 shadow-lg bg-component-bg text-text-main"><CrownIcon className="mx-auto mb-4 text-accent" /><h3 className="text-xl text-center font-bold">Получите доступ ко всем главам</h3><p className="mt-2 mb-6 text-sm text-center opacity-70">Выберите подходящий тариф подписки:</p><div className="space-y-3">{subscriptionPlans.map(plan => (<button key={plan.duration} onClick={() => onSelectPlan(plan)} className="relative w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 border-border-color bg-background hover:border-accent-hover"><p className="font-bold">{plan.name}</p><p className="text-sm">{plan.price} ₽</p></button>))}</div><button onClick={onClose} className="w-full py-3 mt-4 rounded-lg border border-border-color">Не сейчас</button></div></div>);
};
const PaymentMethodModal = ({ onClose, onSelectMethod, plan }) => {
    return (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="w-full max-w-sm rounded-2xl p-6 shadow-lg bg-component-bg text-text-main"><h3 className="text-xl text-center font-bold">Выберите способ оплаты</h3><p className="mt-2 mb-6 text-sm text-center opacity-70">Тариф: {plan.name} ({plan.price} ₽)</p><div className="space-y-3"><button onClick={() => onSelectMethod('card')} className="w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 border-border-color bg-background hover:border-accent-hover"><p className="font-bold">💳 Банковской картой</p><p className="text-sm opacity-70">Ручная проверка (до 24 часов)</p></button><button onClick={() => onSelectMethod('tribut')} className="w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 border-border-color bg-background hover:border-accent-hover"><p className="font-bold">❤️ Донат через tribut</p><p className="text-sm opacity-70">Более быстрый способ</p></button></div><button onClick={onClose} className="w-full py-3 mt-4 rounded-lg border border-border-color">Назад</button></div></div>)
};

const Header = ({ title, onBack }) => (
    <div className="sticky top-0 bg-component-bg z-20 py-3 px-4 flex items-center border-b border-border-color shadow-sm text-text-main">
      {onBack && (
        <button onClick={onBack} className="mr-4 p-2 -ml-2 rounded-full hover:bg-background">
          <BackIcon />
        </button>
      )}
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
);

const NovelList = ({ novels, onSelectNovel, bookmarks, onToggleBookmark }) => (
    <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 p-4 text-text-main">
      {novels.length > 0 ? novels.map((novel, index) => (
        <div key={novel.id} onClick={() => onSelectNovel(novel)} className="cursor-pointer group animate-fade-in-down" style={{ animationDelay: `${index * 50}ms` }}>
          <div className="relative transition-all duration-300">
            <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(novel.id); }} className={`absolute top-2 right-2 z-10 p-1 rounded-full bg-black/30 backdrop-blur-sm text-white transition-colors ${bookmarks.includes(novel.id) ? 'text-accent' : ''}`}>
              <BookmarkIcon filled={bookmarks.includes(novel.id)} width="20" height="20" />
            </button>
            <img src={`/tene/${novel.coverUrl}`} alt={novel.title} className="w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 border border-border-color" />
            <h2 className="mt-2 font-semibold text-xs truncate">{novel.title}</h2>
          </div>
        </div>
      )) : (
        <p className="col-span-3 text-center opacity-70">Ничего не найдено.</p>
      )}
    </div>
);

const NovelDetails = ({ novel, onSelectChapter, onGenreSelect, subscription, botUsername, userId, chapters, isLoadingChapters, lastReadData, onBack }) => {
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const descriptionRef = useRef(null);
    const [isLongDescription, setIsLongDescription] = useState(false);

    const hasActiveSubscription = subscription && new Date(subscription.expires_at) > new Date();
    const lastReadChapterId = useMemo(() => lastReadData && lastReadData[novel.id] ? lastReadData[novel.id].chapterId : null, [lastReadData, novel.id]);

    useEffect(() => {
        if (descriptionRef.current) {
            setTimeout(() => {
                 if (descriptionRef.current) {
                    setIsLongDescription(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight);
                }
            }, 100);
        }
    }, [novel.description]);


    const sortedChapters = useMemo(() => {
        const chaptersCopy = [...chapters];
        if (sortOrder === 'newest') return chaptersCopy.reverse();
        return chapters;
    }, [chapters, sortOrder]);

    const handleChapterClick = (chapter) => { if (!hasActiveSubscription && chapter.isPaid) setIsSubModalOpen(true); else onSelectChapter(chapter); };
    const handleContinueReading = () => { if (lastReadChapterId) { const chapterToContinue = chapters.find(c => c.id === lastReadChapterId); if (chapterToContinue) onSelectChapter(chapterToContinue); } };
    const handlePlanSelect = (plan) => setSelectedPlan(plan);
    const handlePaymentMethodSelect = async (method) => {
        const tg = window.Telegram?.WebApp;
        if (!tg || !userId || !selectedPlan) {
            console.error("Telegram Web App, userId, or selectedPlan is not available.");
            if (tg) tg.showAlert("Произошла ошибка. Пожалуйста, попробуйте еще раз.");
            return;
        }

        tg.showConfirm(
            "Вы будете перенаправлены в бот для завершения оплаты. Если бот не реагирует после того, как вы выбрали тариф, не волнуйтесь! Попробуйте отправить команду /start еще раз.",
            async (confirmed) => {
                if (!confirmed) return;
                
                const userDocRef = doc(db, "users", userId);
                try {
                    await setDoc(userDocRef, {
                        pendingSubscription: { ...selectedPlan, method: method, date: new Date().toISOString() }
                    }, { merge: true });
                    tg.openTelegramLink(`https://t.me/${botUsername}?start=${userId}`);
                    tg.close();
                } catch (error) {
                    console.error("Ошибка записи в Firebase:", error);
                    tg.showAlert("Не удалось сохранить ваш выбор. Попробуйте снова.");
                }
            }
        );
    };

    return (<div className="text-text-main"><Header title={novel.title} onBack={onBack} /><div className="relative h-64"><img src={`/tene/${novel.coverUrl}`} alt={novel.title} className="w-full h-full object-cover object-top absolute"/><div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div><div className="absolute bottom-4 left-4 right-4"><h1 className="text-3xl font-bold font-sans text-text-main drop-shadow-[0_2px_2px_rgba(255,255,255,0.7)]">{novel.title}</h1><p className="text-sm font-sans text-text-main opacity-90 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">{novel.author}</p></div></div><div className="p-4"><div className="flex flex-wrap gap-2 mb-4">{novel.genres.map(genre => (<button key={genre} onClick={() => onGenreSelect(genre)} className="text-xs font-semibold px-3 py-1 rounded-full transition-colors duration-200 bg-component-bg text-text-main border border-border-color hover:bg-border-color">{genre}</button>))}</div><div ref={descriptionRef} className={`relative overflow-hidden transition-all duration-500 ${isDescriptionExpanded ? 'max-h-full' : 'max-h-24'}`}><p className="text-sm mb-2 opacity-80 font-body">{novel.description}</p></div>{isLongDescription && <div className="text-right"><button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="text-sm font-semibold text-accent mb-4">{isDescriptionExpanded ? 'Скрыть' : 'Читать полностью...'}</button></div>}{lastReadChapterId && <button onClick={handleContinueReading} className="w-full py-3 mb-4 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-all hover:scale-105 hover:shadow-xl">Продолжить чтение (Глава {lastReadChapterId})</button>}<div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Главы</h2><button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="text-sm font-semibold text-accent">{sortOrder === 'newest' ? 'Сначала новые' : 'Сначала старые'}</button></div>{hasActiveSubscription && (<p className="text-sm text-green-500 mb-4">Подписка до {new Date(subscription.expires_at).toLocaleDateString()}</p>)}{isLoadingChapters ? <p>Загрузка глав...</p> : (<div className="flex flex-col gap-3">{sortedChapters.map(chapter => {
        const showLock = !hasActiveSubscription && chapter.isPaid;
        const isLastRead = lastReadChapterId === chapter.id;
        return (<div key={chapter.id} onClick={() => handleChapterClick(chapter)} className={`p-4 bg-component-bg rounded-xl cursor-pointer transition-all duration-200 hover:border-accent-hover hover:bg-accent/10 border border-border-color flex items-center justify-between shadow-sm hover:shadow-md ${showLock ? 'opacity-70' : ''}`}>
            <div className="flex items-center gap-3">
                {isLastRead && <span className="w-2 h-2 rounded-full bg-accent"></span>}
                <p className="font-semibold">{chapter.title}</p>
            </div>
            {showLock ? <LockIcon /> : <ArrowRightIcon/>}
        </div>);
    })}</div>)}
    {isSubModalOpen && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSelectPlan={handlePlanSelect} />}
    {selectedPlan && <PaymentMethodModal onClose={() => setSelectedPlan(null)} onSelectMethod={handlePaymentMethodSelect} plan={selectedPlan} />}
    </div></div>)
};

const groupComments = (commentsList) => {
    const commentMap = {};
    const topLevelComments = [];
    commentsList.forEach(comment => {
        commentMap[comment.id] = { ...comment, replies: [] };
    });
    commentsList.forEach(comment => {
        if (comment.replyTo && commentMap[comment.replyTo]) {
            commentMap[comment.replyTo].replies.push(commentMap[comment.id]);
        } else {
            topLevelComments.push(commentMap[comment.id]);
        }
    });
    return topLevelComments;
};

const Comment = React.memo(({ comment, onReply, onLike, onEdit, onDelete, onUpdate, isUserAdmin, currentUserId, editingCommentId, editingText, setEditingText, replyingTo, replyText, setReplyText, onCommentSubmit }) => {
    const formatDate = (timestamp) => {
        if (!timestamp?.toDate) return '';
        const date = timestamp.toDate();
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div className="flex flex-col">
            <div className="p-3 rounded-lg bg-component-bg border border-border-color">
                <div className="flex justify-between items-center text-xs opacity-70 mb-1">
                    <p className="font-bold text-sm text-text-main opacity-100">{comment.userName}</p>
                    <span>{formatDate(comment.timestamp)}</span>
                </div>
                {editingCommentId === comment.id ? (
                    <div className="flex items-center gap-2 mt-1">
                        <input type="text" value={editingText} autoFocus onChange={(e) => setEditingText(e.target.value)} className="w-full bg-background border border-border-color rounded-lg py-1 px-2 text-text-main text-sm" />
                        <button onClick={() => onUpdate(comment.id)} className="p-1 rounded-full bg-green-500 text-white">✓</button>
                        <button onClick={() => onEdit(null)} className="p-1 rounded-full bg-gray-500 text-white">✕</button>
                    </div>
                ) : (<p className="text-sm mt-1 opacity-90">{comment.text}</p>)}

                <div className="flex items-center gap-4 mt-2">
                    <button onClick={() => onLike(comment.id)} className="flex items-center gap-1 text-xs text-gray-500">
                        <HeartIcon filled={comment.userHasLiked} className={`w-4 h-4 ${comment.userHasLiked ? 'text-accent' : ''}`} />
                        <span>{comment.likeCount || 0}</span>
                    </button>
                    <button onClick={() => onReply(comment.id)} className="text-xs text-gray-500">Ответить</button>
                    {(currentUserId === comment.userId || isUserAdmin) && (
                        <>
                            <button onClick={() => onEdit(comment)} className="text-xs text-gray-500">Редактировать</button>
                            <button onClick={() => onDelete(comment.id)} className="text-xs text-red-500">Удалить</button>
                        </>
                    )}
                </div>
            </div>

            {replyingTo === comment.id && (
                <form onSubmit={(e) => onCommentSubmit(e, comment.id)} className="flex items-center gap-2 mt-2">
                    <input type="text" value={replyText} autoFocus onChange={(e) => setReplyText(e.target.value)} placeholder={`Ответ для ${comment.userName}...`} className="w-full bg-background border border-border-color rounded-lg py-1 px-3 text-sm" />
                    <button type="submit" className="p-1.5 rounded-full bg-accent text-white"><SendIcon className="w-4 h-4" /></button>
                </form>
            )}

            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2 space-y-2 border-l-2 border-border-color pl-2">
                    {comment.replies.map(reply => 
                        <Comment 
                            key={reply.id} 
                            comment={reply} 
                            onReply={onReply} 
                            onLike={onLike} 
                            onEdit={onEdit} 
                            onDelete={onDelete} 
                            onUpdate={onUpdate} 
                            isUserAdmin={isUserAdmin} 
                            currentUserId={currentUserId} 
                            editingCommentId={editingCommentId} 
                            editingText={editingText} 
                            setEditingText={setEditingText} 
                            replyingTo={replyingTo} 
                            replyText={replyText} 
                            setReplyText={setReplyText} 
                            onCommentSubmit={onCommentSubmit} 
                        />
                    )}
                </div>
            )}
        </div>
    );
});

const ChapterReader = ({ chapter, novel, fontSize, onFontSizeChange, userId, userName, currentFontClass, onSelectChapter, allChapters, subscription, botUsername, onBack, isUserAdmin }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  const [likeCount, setLikeCount] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);

  const [showChapterList, setShowChapterList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [chapterContent, setChapterContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  const hasActiveSubscription = subscription && new Date(subscription.expires_at) > new Date();
  const chapterMetaRef = useMemo(() => doc(db, "chapters_metadata", `${novel.id}_${chapter.id}`), [novel.id, chapter.id]);

  useEffect(() => {
    const unsubMeta = onSnapshot(chapterMetaRef, (docSnap) => {
      setLikeCount(docSnap.data()?.likeCount || 0);
    });

    const commentsQuery = query(collection(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`), orderBy("timestamp", "asc"));
    const unsubComments = onSnapshot(commentsQuery, async (querySnapshot) => {
      const commentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (userId) {
        const likedCommentsPromises = commentsData.map(async (comment) => {
          const likeRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/comments/${comment.id}/likes`, userId);
          const likeSnap = await getDoc(likeRef);
          return { ...comment, userHasLiked: likeSnap.exists() };
        });
        const commentsWithLikes = await Promise.all(likedCommentsPromises);
        setComments(commentsWithLikes);
      } else {
        setComments(commentsData);
      }
    });

    let unsubLike = () => {};
    if (userId) {
        const likeRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/likes`, userId);
        unsubLike = onSnapshot(likeRef, (docSnap) => {
            setUserHasLiked(docSnap.exists());
        });
    }

    return () => {
      unsubMeta();
      unsubComments();
      unsubLike();
    };
  }, [chapterMetaRef, novel.id, chapter.id, userId]);

  useEffect(() => {
    const fetchContent = async () => {
        setIsLoadingContent(true);
        setChapterContent(''); 
        if (chapter.isPaid && !hasActiveSubscription) {
            setIsLoadingContent(false);
            setChapterContent('### 🔒 Для доступа к этой главе необходима подписка.\n\nПожалуйста, оформите подписку в разделе "Профиль", чтобы продолжить чтение.');
            return;
        }
        try {
            const chapterDocRef = doc(db, 'chapter_content', `${novel.id}-${chapter.id}`);
            const docSnap = await getDoc(chapterDocRef);
            if (docSnap.exists()) {
                setChapterContent(docSnap.data().content);
            } else {
                setChapterContent('## Ошибка\n\nНе удалось загрузить текст главы. Пожалуйста, попробуйте позже.');
            }
        } catch (error) {
            console.error("Ошибка загрузки главы:", error);
            setChapterContent('## Ошибка\n\nПроизошла ошибка при загрузке. Проверьте ваше интернет-соединение.');
        } finally {
            setIsLoadingContent(false);
        }
    };
    fetchContent();
  }, [novel.id, chapter.id, hasActiveSubscription]);

  const handleCommentSubmit = useCallback(async (e, parentId = null) => {
    e.preventDefault();
    const text = parentId ? replyText : newComment;
    if (!text.trim() || !userId) return;
    
    try {
        await setDoc(chapterMetaRef, {}, { merge: true });
        
        const commentsColRef = collection(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`);
        const commentData = { 
            userId, 
            userName: userName || "Аноним", 
            text, 
            timestamp: serverTimestamp(), 
            likeCount: 0,
            novelTitle: novel.title,
            chapterTitle: chapter.title
        };

        let replyToUid = null;
        if (parentId) {
            commentData.replyTo = parentId;
            const parentCommentDoc = await getDoc(doc(commentsColRef, parentId));
            if (parentCommentDoc.exists()) {
                replyToUid = parentCommentDoc.data().userId;
            }
        }
        
        await addDoc(commentsColRef, commentData);

        // Создаем "запрос на уведомление" в новой коллекции
        const notificationColRef = collection(db, "notifications");
        await addDoc(notificationColRef, {
            ...commentData,
            processed: false, 
            createdAt: serverTimestamp(),
            replyToUid: replyToUid
        });

        if (parentId) {
            setReplyingTo(null);
            setReplyText("");
        } else {
            setNewComment("");
        }
    } catch (error) {
        console.error("Ошибка добавления комментария:", error);
    }
  }, [userId, userName, newComment, replyText, chapterMetaRef, novel.id, chapter.id, novel.title, chapter.title]);


  const handleCommentLike = useCallback(async (commentId) => {
    if (!userId) return;
    const commentRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`, commentId);
    const likeRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/comments/${commentId}/likes`, userId);
    
    setComments(prevComments => prevComments.map(c => {
        if (c.id === commentId) {
            const newLikeCount = c.userHasLiked ? (c.likeCount || 1) - 1 : (c.likeCount || 0) + 1;
            return { ...c, userHasLiked: !c.userHasLiked, likeCount: newLikeCount };
        }
        return c;
    }));

    try {
        await runTransaction(db, async (transaction) => {
            const likeDoc = await transaction.get(likeRef);
            const commentDoc = await transaction.get(commentRef);
            if (!commentDoc.exists()) return;
            const currentLikes = commentDoc.data().likeCount || 0;
            if (likeDoc.exists()) {
                transaction.delete(likeRef);
                transaction.update(commentRef, { likeCount: Math.max(0, currentLikes - 1) });
            } else {
                transaction.set(likeRef, { timestamp: serverTimestamp() });
                transaction.update(commentRef, { likeCount: currentLikes + 1 });
            }
        });
    } catch (error) {
        console.error("Ошибка при обновлении лайка комментария:", error);
    }
  }, [userId, novel.id, chapter.id]);
  
    const handleEdit = useCallback((comment) => {
        if (comment) {
            setEditingCommentId(comment.id);
            setEditingText(comment.text);
        } else {
            setEditingCommentId(null);
            setEditingText("");
        }
    }, []);

    const handleUpdateComment = useCallback(async (commentId) => {
        if (!editingText.trim()) return;
        const commentRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`, commentId);
        await updateDoc(commentRef, { text: editingText });
        setEditingCommentId(null);
        setEditingText("");
    }, [editingText, novel.id, chapter.id]);

    const handleDelete = useCallback(async (commentId) => {
        const commentRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`, commentId);
        await deleteDoc(commentRef);
    }, [novel.id, chapter.id]);

    const handleReply = useCallback((commentId) => {
        setReplyingTo(prev => prev === commentId ? null : commentId);
        setReplyText('');
    }, []);

  const handleLike = async () => {
    if (!userId) return;
    const likeRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/likes`, userId);
    try {
        await runTransaction(db, async (transaction) => {
            const likeDoc = await transaction.get(likeRef);
            const metaDoc = await transaction.get(chapterMetaRef);
            const currentLikes = metaDoc.data()?.likeCount || 0;
            if (likeDoc.exists()) {
                transaction.delete(likeRef);
                transaction.set(chapterMetaRef, { likeCount: Math.max(0, currentLikes - 1) }, { merge: true });
            } else {
                transaction.set(likeRef, { timestamp: serverTimestamp() });
                transaction.set(chapterMetaRef, { likeCount: currentLikes + 1 }, { merge: true });
            }
        });
    } catch (error) {
        console.error("Ошибка при обновлении лайка:", error);
    }
};

    const handleChapterClick = (chapter) => {
        if (!chapter) return;
        if (!hasActiveSubscription && chapter.isPaid) {
            setShowChapterList(false);
            setIsSubModalOpen(true);
        } else {
            onSelectChapter(chapter);
            setShowChapterList(false);
        }
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setIsSubModalOpen(false);
    };
  
    const handlePaymentMethodSelect = async (method) => {
      const tg = window.Telegram?.WebApp;
      if (tg && userId && selectedPlan) {
        tg.showConfirm("Вы будете перенаправлены в бот для завершения оплаты. Если бот не ответит, отправьте команду /start.", async (confirmed) => {
          if (confirmed) {
            const userDocRef = doc(db, "users", userId);
            try {
              await setDoc(userDocRef, { pendingSubscription: { ...selectedPlan, method: method, date: new Date().toISOString() } }, { merge: true });
              tg.openTelegramLink(`https://t.me/${botUsername}?start=${userId}`);
              tg.close();
            } catch (error) {
              console.error("Ошибка записи в Firebase:", error);
              tg.showAlert("Не удалось сохранить ваш выбор. Попробуйте снова.");
            }
          }
        });
      }
    };
    
  const currentChapterIndex = allChapters.findIndex(c => c.id === chapter.id);
  const prevChapter = allChapters[currentChapterIndex - 1];
  const nextChapter = allChapters[currentChapterIndex + 1];

  const renderMarkdown = (markdownText) => {
    if (window.marked) {
      const rawHtml = window.marked.parse(markdownText);
      return `<div class="prose">${rawHtml}</div>`;
    }
    return markdownText;
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-background text-text-main">
      <Header title={novel.title} onBack={onBack} />
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto pb-24">
        <h2 className="text-lg sm:text-xl mb-8 text-center opacity-80 font-sans">{chapter.title}</h2>
        <div 
          className={`whitespace-normal leading-relaxed ${currentFontClass}`} 
          style={{ fontSize: `${fontSize}px` }}
          dangerouslySetInnerHTML={{ __html: isLoadingContent ? '<p>Загрузка...</p>' : renderMarkdown(chapterContent) }}
        />
        
        <div className="text-center my-8 text-accent font-bold text-2xl tracking-widest">
            ╚══ ≪ °❈° ≫ ══╝
        </div>


        <div className="border-t border-border-color pt-8">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleLike} className="flex items-center gap-2 text-accent-hover transition-transform hover:scale-110">
              <HeartIcon filled={userHasLiked} className={userHasLiked ? "text-accent" : ''} />
              <span className="font-bold text-lg">{likeCount}</span>
            </button>
          </div>

          <h3 className="text-xl font-bold mb-4">Комментарии</h3>
          <div className="space-y-4 mb-6">
            {comments.length > 0
                ? groupComments(comments).map(comment => 
                    <Comment 
                        key={comment.id} 
                        comment={comment}
                        onReply={handleReply}
                        onLike={handleCommentLike}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onUpdate={handleUpdateComment}
                        isUserAdmin={isUserAdmin}
                        currentUserId={userId}
                        editingCommentId={editingCommentId}
                        editingText={editingText}
                        setEditingText={setEditingText}
                        replyingTo={replyingTo}
                        replyText={replyText}
                        setReplyText={setReplyText}
                        onCommentSubmit={handleCommentSubmit}
                    />)
                : <p className="opacity-70 text-sm">Комментариев пока нет. Будьте первым!</p>
            }
          </div>

          <form onSubmit={(e) => handleCommentSubmit(e, null)} className="flex items-center gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Написать комментарий..."
              className="w-full bg-component-bg border border-border-color rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
            <button type="submit" className="p-2 rounded-full bg-accent text-white flex items-center justify-center">
              <SendIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
      {/* Chapter Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-2 border-t border-border-color bg-component-bg flex justify-between items-center z-10 text-text-main">
        <button onClick={() => handleChapterClick(prevChapter)} disabled={!prevChapter} className="p-2 disabled:opacity-50"><BackIcon/></button>
        <div className="flex gap-2">
            <button onClick={() => setShowChapterList(true)} className="px-4 py-2 rounded-lg bg-background">Оглавление</button>
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg bg-background"><SettingsIcon /></button>
        </div>
        <button onClick={() => handleChapterClick(nextChapter)} disabled={!nextChapter} className="p-2 disabled:opacity-50"><ArrowRightIcon className="opacity-100"/></button>
      </div>

      {showChapterList && (
        <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setShowChapterList(false)}>
          <div className="absolute bottom-0 left-0 right-0 max-h-[45vh] p-4 rounded-t-2xl bg-component-bg flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 flex-shrink-0">Главы</h3>
            <div className="overflow-y-auto">
              <div className="flex flex-col gap-2">
                {allChapters.map(chap => (
                  <button
                    key={chap.id}
                    onClick={() => handleChapterClick(chap)}
                    className={`p-2 text-left rounded-md ${chap.id === chapter.id ? "bg-accent text-white" : "bg-background"}`}
                  >
                    {chap.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {showSettings && (
         <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setShowSettings(false)}>
             <div className="absolute bottom-0 left-0 right-0 p-4 rounded-t-2xl bg-component-bg text-text-main" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4">Настройки чтения</h3>
                 <div className="flex items-center justify-between">
                  <span>Размер текста</span>
                  <div className="w-28 h-12 rounded-full bg-background flex items-center justify-around border border-border-color">
                    <button onClick={() => onFontSizeChange(-1)} className="text-2xl font-bold">-</button>
                    <button onClick={() => onFontSizeChange(1)} className="text-2xl font-bold">+</button>
                  </div>
                </div>
             </div>
         </div>
      )}
      {isSubModalOpen && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSelectPlan={handlePlanSelect} />}
      {selectedPlan && <PaymentMethodModal onClose={() => setSelectedPlan(null)} onSelectMethod={handlePaymentMethodSelect} plan={selectedPlan} />}
    </div>
  );
};

const SearchPage = ({ novels, onSelectNovel, bookmarks, onToggleBookmark }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const filteredNovels = useMemo(() => {
        if (!searchQuery) return [];
        return novels.filter(novel => novel.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [novels, searchQuery]);

    return (
        <div>
            <Header title="Поиск" />
            <div className="p-4">
                <div className="relative mb-6">
                    <div className="absolute left-3 top-1-2 -translate-y-1/2">
                        <SearchIcon className="text-text-main opacity-50" />
                    </div>
                    <input type="text" placeholder="Поиск по названию..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-component-bg border-border-color border rounded-lg py-2 pl-10 pr-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent transition-shadow duration-300" />
                </div>
                <NovelList novels={filteredNovels} onSelectNovel={onSelectNovel} bookmarks={bookmarks} onToggleBookmark={onToggleBookmark} />
            </div>
        </div>
    );
}

const BookmarksPage = ({ novels, onSelectNovel, bookmarks, onToggleBookmark }) => (
    <div>
        <Header title="Закладки" />
        <NovelList novels={novels} onSelectNovel={onSelectNovel} bookmarks={bookmarks} onToggleBookmark={onToggleBookmark} />
    </div>
)

const ProfilePage = ({ user, subscription, onGetSubscriptionClick, userId, auth }) => {
    const handleCopyId = () => {
        if (userId) {
            navigator.clipboard.writeText(userId)
                .then(() => console.log("Firebase UID скопирован в буфер обмена"))
                .catch(err => console.error('Не удалось скопировать UID: ', err));
        }
    };

    const hasActiveSubscription = subscription && new Date(subscription.expires_at) > new Date();

    return (
        <div>
            <Header title="Профиль" />
            <div className="p-4 rounded-lg bg-component-bg border border-border-color mx-4 mb-4">
                 <h3 className="font-bold mb-2">Подписка</h3>
                 {hasActiveSubscription ? (
                    <div>
                        <p className="text-green-500">Активна</p>
                        <p className="text-sm opacity-70">
                            Заканчивается: {new Date(subscription.expires_at).toLocaleDateString()}
                        </p>
                    </div>
                ) : (
                    <div>
                        <p className="text-red-500">Неактивна</p>
                         <p className="text-sm opacity-70 mb-3">
                            Оформите подписку, чтобы получить доступ ко всем платным главам.
                        </p>
                        <button onClick={onGetSubscriptionClick} className="w-full py-2 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-all hover:scale-105">
                            Оформить подписку
                        </button>
                    </div>
                )}
            </div>
            <div className="p-4 rounded-lg bg-component-bg border border-border-color mx-4">
                <h3 className="font-bold mb-2">Ваш ID для администрирования</h3>
                <p className="text-sm opacity-70 mb-3">
                    Этот ID нужен для назначения прав администратора через Telegram-бота.
                </p>
                <div className="bg-background p-2 rounded-md text-xs break-all mb-3">
                    <code>{userId || "Загрузка..."}</code>
                </div>
                <button 
                    onClick={handleCopyId} 
                    disabled={!userId}
                    className="w-full py-2 rounded-lg bg-gray-200 text-gray-800 font-bold transition-all hover:scale-105 disabled:opacity-50"
                >
                    Копировать ID
                </button>
            </div>
        </div>
    );
};

const BottomNav = ({ activeTab, setActiveTab }) => {
    const navItems = [
        { id: 'library', label: 'Библиотека', icon: LibraryIcon },
        { id: 'search', label: 'Поиск', icon: SearchIcon },
        { id: 'bookmarks', label: 'Закладки', icon: BookmarkIcon },
        { id: 'profile', label: 'Профиль', icon: UserIcon },
    ];
    return (
        <div className="fixed bottom-0 left-0 right-0 border-t border-border-color bg-component-bg z-30 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${activeTab === item.id ? "text-accent" : "text-text-main opacity-60"}`}>
                        <item.icon filled={activeTab === item.id} />
                        <span className="text-xs mt-1">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

const NewsSlider = ({ onReadMore }) => {
    const [news, setNews] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
    fetch(`/tene/data/news.json`)
        .then(res => res.json())
            .then(setNews)
            .catch(err => console.error("Failed to fetch news", err));
    }, []);

    const nextNews = () => setCurrentIndex((prev) => (prev + 1) % news.length);
    const prevNews = () => setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);

    if (news.length === 0) return null;

    const currentNewsItem = news[currentIndex];

    return (
        <div className="p-4">
            <div className="bg-component-bg p-4 rounded-2xl shadow-md border border-border-color flex items-center gap-4">
                <img src={currentNewsItem.imageUrl} alt="News" className="w-16 h-16 rounded-full object-cover border-2 border-border-color" />
                <div className="flex-1">
                    <h3 className="font-bold text-text-main">{currentNewsItem.title}</h3>
                    <p className="text-sm text-text-main opacity-70">{currentNewsItem.shortDescription}</p>
                    <button onClick={() => onReadMore(currentNewsItem)} className="text-sm font-bold text-accent mt-1">Читать далее</button>
                </div>
                <div className="flex flex-col">
                     <button onClick={prevNews} className="p-1 rounded-full hover:bg-background"><ChevronLeftIcon className="w-5 h-5" /></button>
                     <button onClick={nextNews} className="p-1 rounded-full hover:bg-background"><ChevronRightIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
};

const NewsModal = ({ newsItem, onClose }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="w-full max-w-md p-6 rounded-2xl shadow-lg bg-component-bg text-text-main" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">{newsItem.title}</h2>
            <p className="whitespace-pre-wrap opacity-80">{newsItem.fullText}</p>
            <button onClick={onClose} className="w-full py-2 mt-6 rounded-lg bg-accent text-white font-bold">Закрыть</button>
        </div>
    </div>
);


// --- Главный компонент приложения ---
export default function App() {
  const [fontSize, setFontSize] = useState(16);
  const [fontClass, setFontClass] = useState('font-sans');
  const [page, setPage] = useState('list');
  const [activeTab, setActiveTab] = useState('library');
  const [novels, setNovels] = useState([]);
  const [selectedNovel, setSelectedNovel] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [genreFilter, setGenreFilter] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  const [chapters, setChapters] = useState([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);

  const [lastReadData, setLastReadData] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);

  const BOT_USERNAME = "tenebrisverbot";
  
  const userId = user?.uid;

  const updateUserDoc = useCallback(async (dataToUpdate) => {
    if (userId) { 
        const userDocRef = doc(db, "users", userId);
        try {
            await setDoc(userDocRef, dataToUpdate, { merge: true });
        } catch(e) {
            console.error("Не удалось обновить данные пользователя:", e);
        }
    }
  }, [userId]);

  const handleTextSizeChange = useCallback((amount) => {
    setFontSize(prevSize => {
        const newSize = Math.max(12, Math.min(32, prevSize + amount));
        updateUserDoc({ settings: { fontSize: newSize, fontClass } });
        return newSize;
    });
  }, [fontClass, updateUserDoc]);
  
  useEffect(() => {
    setIsLoading(true);
    fetch(`/tene/data/novels.json`)
      .then(res => res.json())
      .then(data => setNovels(data.novels))
      .catch(err => console.error("Ошибка загрузки новелл:", err));

    let unsubUserFromFirestore = () => {};

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubUserFromFirestore();

      if (firebaseUser) {
        setUser(firebaseUser);
        const idTokenResult = await firebaseUser.getIdTokenResult();
        setIsUserAdmin(!!idTokenResult.claims.admin);

        const userDocRef = doc(db, "users", firebaseUser.uid);
        unsubUserFromFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setSubscription(data.subscription || null);
            setLastReadData(data.lastRead || null);
            setBookmarks(data.bookmarks || []);
            if (data.settings) {
              setFontSize(data.settings.fontSize || 16);
              setFontClass(data.settings.fontClass || 'font-sans');
            }
          } else {
            setSubscription(null);
            setLastReadData(null);
            setBookmarks([]);
          }
        });
        
        const tg = window.Telegram?.WebApp;
        if (tg) { // Убрана проверка на isAnonymous, так как ее больше нет
            const telegramUser = tg.initDataUnsafe?.user;
            if (telegramUser?.id) {
               await setDoc(userDocRef, { telegramId: telegramUser.id.toString() }, { merge: true });

               if (!firebaseUser.displayName && telegramUser.first_name) {
                    const telegramDisplayName = `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim();
                    try {
                        await updateProfile(firebaseUser, { displayName: telegramDisplayName });
                        setUser(auth.currentUser); 
                    } catch (error) {
                        console.error("Ошибка обновления профиля:", error);
                    }
               }
            }
        }
        setIsLoading(false);

      } else {
        // Пользователя нет, прекращаем загрузку и показываем экран входа.
        setUser(null);
        setIsUserAdmin(false);
        setIsLoading(false);
      }
    });
    
    getRedirectResult(auth).catch((error) => {
      console.error("Ошибка при получении результата перенаправления:", error);
    });

    return () => {
      unsubAuth();
      unsubUserFromFirestore();
    };
  }, []);


  useEffect(() => {
      if (!selectedNovel) {
          setChapters([]);
          return;
      }
      const fetchChaptersFromFirestore = async () => {
          setIsLoadingChapters(true);
          try {
              const docRef = doc(db, 'chapter_info', selectedNovel.id.toString());
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                  const data = docSnap.data();
                  const chaptersData = data.chapters || {};
                  const chaptersArray = Object.keys(chaptersData).map(key => ({
                      id: parseInt(key),
                      title: `Глава ${key}`,
                      isPaid: chaptersData[key].isPaid || false
                  })).sort((a, b) => a.id - b.id);
                  setChapters(chaptersArray);
              } else {
                  console.log("Документ с главами не найден в chapter_info!");
                  setChapters([]);
              }
          } catch (error) {
              console.error("Ошибка загрузки глав из Firebase:", error);
              setChapters([]);
          } finally {
              setIsLoadingChapters(false);
          }
      };

      fetchChaptersFromFirestore();
  }, [selectedNovel]);


  const handleBack = useCallback(() => {
      if (page === 'reader') setPage('details');
      else if (page === 'details') { setPage('list'); setGenreFilter(null); }
  }, [page]);
  
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    tg.onEvent('backButtonClicked', handleBack);
    if (page === 'list') {
        tg.BackButton.hide();
    } else {
        tg.BackButton.show();
    }
    return () => tg.offEvent('backButtonClicked', handleBack);
  }, [page, handleBack]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.setHeaderColor('#FFFFFF');
        tg.setBackgroundColor('#F5F1ED');
    }
  }, []);

  const handleSelectChapter = useCallback(async (chapter) => {
    setSelectedChapter(chapter);
    setPage('reader');
    if (userId && selectedNovel) {
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
  const handleGenreSelect = (genre) => { setGenreFilter(genre); setPage('list'); setActiveTab('library'); };
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

  const handleGetSubscription = () => {
    setIsSubModalOpen(true);
  }

  const handlePlanSelect = (plan) => {
      setSelectedPlan(plan);
      setIsSubModalOpen(false);
  };
  
    const handlePaymentMethodSelect = async (method) => {
        const tg = window.Telegram?.WebApp;
        if (!tg || !userId || !selectedPlan) {
            console.error("Telegram Web App, userId, or selectedPlan is not available.");
            if (tg) tg.showAlert("Произошла ошибка. Пожалуйста, попробуйте еще раз.");
            return;
        }

        tg.showConfirm(
            "Вы будете перенаправлены в бот для завершения оплаты. Если бот не ответит, отправьте команду /start.",
            async (confirmed) => {
                if (!confirmed) return;
                
                const userDocRef = doc(db, "users", userId);
                try {
                    await setDoc(userDocRef, {
                        pendingSubscription: { ...selectedPlan, method: method, date: new Date().toISOString() }
                    }, { merge: true });
                    tg.openTelegramLink(`https://t.me/${BOT_USERNAME}?start=${userId}`);
                    tg.close();
                } catch (error) {
                    console.error("Ошибка записи в Firebase:", error);
                    tg.showAlert("Не удалось сохранить ваш выбор. Попробуйте снова.");
                }
            }
        );
    };

  if (isLoading) {
    return <LoadingSpinner />;
}

// Если пользователя нет, показываем экран входа.
if (!user) {
    // Мы передаем auth, чтобы компонент мог работать с Firebase.
    return <AuthScreen auth={auth} />;
}

// Если пользователь есть, показываем основной интерфейс приложения.
  
  const renderContent = () => {
    if (page === 'details') {
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
              />;
    }
    if (page === 'reader') {
      return <ChapterReader 
                chapter={selectedChapter} 
                novel={selectedNovel} 
                fontSize={fontSize} 
                onFontSizeChange={handleTextSizeChange} 
                userId={userId} 
                userName={user?.displayName || 'Аноним'} 
                currentFontClass={fontClass} 
                onSelectChapter={handleSelectChapter} 
                allChapters={chapters} 
                subscription={subscription} 
                botUsername={BOT_USERNAME} 
                onBack={handleBack} 
                isUserAdmin={isUserAdmin} 
              />;
    }

    switch (activeTab) {
      case 'library':
        return (
          <>
            <Header title="Библиотека" />
            <NewsSlider onReadMore={setSelectedNews} />
            {genreFilter && (
                <div className="flex items-center justify-between p-3 mx-4 mb-0 rounded-lg border border-border-color bg-component-bg text-text-main">
                    <p className="text-sm"><span className="opacity-70">Жанр:</span><strong className="ml-2">{genreFilter}</strong></p>
                    <button onClick={handleClearGenreFilter} className="text-xs font-bold text-accent hover:underline">Сбросить</button>
                </div>
            )}
            <NovelList novels={novels.filter(n => !genreFilter || n.genres.includes(genreFilter))} onSelectNovel={handleSelectNovel} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} />
          </>
        )
      case 'search':
        return <SearchPage novels={novels} onSelectNovel={onSelectNovel} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} />
      case 'bookmarks':
        return <BookmarksPage novels={bookmarkedNovels} onSelectNovel={handleSelectNovel} bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} />
      case 'profile':
        return <ProfilePage user={user} subscription={subscription} onGetSubscriptionClick={handleGetSubscription} userId={userId} auth={auth} />
      default:
        return <Header title="Библиотека" />
    }
  };

  return (
    <main className={`bg-background min-h-screen font-sans text-text-main ${!isUserAdmin ? 'no-select' : ''}`}>
        <div className="pb-20">
            {renderContent()}
        </div>
        {page === 'list' && (
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        {isSubModalOpen && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSelectPlan={handlePlanSelect} />}
        {selectedPlan && <PaymentMethodModal onClose={() => setSelectedPlan(null)} onSelectMethod={handlePaymentMethodSelect} plan={selectedPlan} />}
        {selectedNews && <NewsModal newsItem={selectedNews} onClose={() => setSelectedNews(null)} />}
    </main>
  );
}