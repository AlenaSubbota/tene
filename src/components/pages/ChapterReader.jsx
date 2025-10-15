import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query,
    orderBy, addDoc, serverTimestamp, runTransaction, getDocs, limit,
    startAfter, arrayUnion, arrayRemove
} from "firebase/firestore";
import { db } from "../../firebase-config.js";
import { HeartIcon, BackIcon, ArrowRightIcon, SettingsIcon, SendIcon } from '../icons.jsx';
import { SubscriptionModal } from '../SubscriptionModal.jsx';
import { PaymentMethodModal } from '../PaymentMethodModal.jsx';
import { Comment, groupComments } from '../Comment.jsx';
import { Header } from '../Header.jsx';

export const ChapterReader = ({
    chapter, novel, userId, userName, subscription, botUsername, onBack, isUserAdmin,
    allChapters, onSelectChapter,
    // --- НАСТРОЙКИ ---
    fontSize, onFontSizeChange,
    fontFamily, onFontFamilyChange,
    lineHeight, onLineHeightChange,
    textAlign, onTextAlignChange,
    textIndent, onTextIndentChange,
    paragraphSpacing, onParagraphSpacingChange
}) => {

    if (!novel || !chapter) {
        return (
           <div>
               <Header title="Загрузка..." onBack={onBack} />
               <div className="p-4 text-center">Подготовка главы...</div>
           </div>
       );
    }

    // Состояния компонента
    const [comments, setComments] = useState([]);
    const [likedCommentIds, setLikedCommentIds] = useState(new Set());
    const [lastCommentDoc, setLastCommentDoc] = useState(null);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
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

    const hasActiveSubscription = subscription && subscription.expires_at && typeof subscription.expires_at.toDate === 'function' && subscription.expires_at.toDate() > new Date();
    const chapterMetaRef = useMemo(() => doc(db, "chapters_metadata", `${novel.id}_${chapter.id}`), [novel.id, chapter.id]);
    const commentsColRef = useMemo(() => collection(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`), [novel.id, chapter.id]);

    const loadMoreComments = useCallback(async () => {
        // Проверка, чтобы кнопка не работала, если нет lastCommentDoc
        if (isLoadingComments || !hasMoreComments || !lastCommentDoc) return;
        setIsLoadingComments(true);
        try {
            const q = query(commentsColRef, orderBy("timestamp", "desc"), startAfter(lastCommentDoc), limit(20));
            const documentSnapshots = await getDocs(q);
            
            const newCommentsData = documentSnapshots.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                userHasLiked: likedCommentIds.has(doc.id) // Проверка лайка без запроса к БД
            }));

            setComments(prevComments => [...prevComments, ...newCommentsData]);
            
            const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastCommentDoc(lastVisible || null); // Устанавливаем null, если больше нет документов
            setHasMoreComments(documentSnapshots.docs.length >= 20);

        } catch (error) {
            console.error("Ошибка подгрузки комментариев: ", error);
        } finally {
            setIsLoadingComments(false);
        }
    }, [isLoadingComments, hasMoreComments, lastCommentDoc, commentsColRef, likedCommentIds]);

    
     useEffect(() => {
        // ✅ Главный защитник: не запускаем ничего, пока нет ID пользователя
        // или других необходимых данных.
        if (!userId || !novel?.id || !chapter?.id) {
            // Можно установить состояние, что данные еще не готовы
            setComments([]);
            setIsLoadingComments(false);
            return; // Прерываем выполнение хука
        }

        const fetchInitialData = async () => {
            setIsLoadingComments(true);
            // Сброс состояний перед загрузкой
            setComments([]);
            setLastCommentDoc(null);
            setHasMoreComments(true);

            try {
                // Теперь мы уверены, что userId существует на момент вызова
                const metaSnapPromise = getDoc(chapterMetaRef);
                const chapterLikePromise = getDoc(doc(db, `chapters_metadata/${novel.id}_${chapter.id}/likes`, userId));
                const userCommentLikesPromise = getDoc(doc(db, "user_comment_likes", userId));
                const commentsPromise = getDocs(query(commentsColRef, orderBy("timestamp", "desc"), limit(20)));

                const [metaSnap, chapterLikeSnap, userCommentLikesSnap, commentsSnap] = await Promise.all([
                    metaSnapPromise, chapterLikePromise, userCommentLikesPromise, commentsPromise
                ]);

                // Обрабатываем лайки
                setLikeCount(metaSnap.exists() ? metaSnap.data().likeCount || 0 : 0);
                setUserHasLiked(chapterLikeSnap?.exists() ?? false);

                const chapterKey = `${novel.id}_${chapter.id}`;
                const likedIds = userCommentLikesSnap?.data()?.chapters?.[chapterKey]?.likedCommentIds || [];
                const likedIdsSet = new Set(likedIds);
                setLikedCommentIds(likedIdsSet);

                // Обрабатываем комментарии
                const commentsData = commentsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    userHasLiked: likedIdsSet.has(doc.id)
                }));
                setComments(commentsData);

                // ✅ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Правильно устанавливаем lastCommentDoc
                // Если комментариев нет, lastVisible будет undefined, и мы установим null.
                // Это предотвратит сбой кнопки "Загрузить еще".
                const lastVisible = commentsSnap.docs[commentsSnap.docs.length - 1];
                setLastCommentDoc(lastVisible || null);
                setHasMoreComments(commentsSnap.docs.length >= 20);

            } catch (error) {
                console.error("Ошибка загрузки данных главы:", error);
                setComments([]); // В случае ошибки гарантированно очищаем
            } finally {
                setIsLoadingComments(false);
            }
        };

        fetchInitialData();
        // Убедитесь, что userId есть в массиве зависимостей
    }, [chapterMetaRef, userId, novel.id, chapter.id, commentsColRef]);

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
    }, [novel.id, chapter.id, chapter.isPaid, hasActiveSubscription]);

    const handleCommentSubmit = useCallback(async (e, parentId = null) => {
        e.preventDefault();
        const text = parentId ? replyText : newComment;
        if (!text.trim() || !userId) return;

        try {
            await setDoc(chapterMetaRef, {}, { merge: true });
            const newCommentData = { userId, userName: userName || "Аноним", text, timestamp: serverTimestamp(), likeCount: 0, novelTitle: novel.title, chapterTitle: chapter.title, isNotified: false };

            if (parentId) {
                newCommentData.replyTo = parentId;
                const parentCommentDoc = await getDoc(doc(commentsColRef, parentId));
                if (parentCommentDoc.exists()) { newCommentData.parentUserId = parentCommentDoc.data().userId; }
            }
            
            const addedDocRef = await addDoc(commentsColRef, newCommentData);
            setComments(prev => [{ ...newCommentData, id: addedDocRef.id, userHasLiked: false, timestamp: new Date() }, ...prev]);
            
            if (parentId) { setReplyingTo(null); setReplyText(""); } else { setNewComment(""); }

        } catch (error) {
            console.error("Ошибка добавления комментария:", error);
        }
    }, [userId, userName, newComment, replyText, chapterMetaRef, novel.title, chapter.title, commentsColRef]);

    const handleCommentLike = useCallback(async (commentId) => {
        if (!userId) return;
        const isLiked = likedCommentIds.has(commentId);
        setLikedCommentIds(prevSet => {
            const newSet = new Set(prevSet);
            if (isLiked) { newSet.delete(commentId); } else { newSet.add(commentId); }
            return newSet;
        });
        setComments(prevComments => prevComments.map(c =>
            c.id === commentId
                ? { ...c, userHasLiked: !isLiked, likeCount: isLiked ? (c.likeCount || 1) - 1 : (c.likeCount || 0) + 1 }
                : c
        ));
        const commentRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`, commentId);
        const userLikesRef = doc(db, "user_comment_likes", userId);
        const chapterKey = `${novel.id}_${chapter.id}`;
        try {
    await runTransaction(db, async (transaction) => {
        const commentDoc = await transaction.get(commentRef);
        if (!commentDoc.exists()) return;

        const currentLikes = commentDoc.data().likeCount || 0;
        
        // Используем точечную нотацию для обновления вложенного объекта
        const userLikesUpdatePath = `chapters.${chapterKey}.likedCommentIds`;

        if (isLiked) {
            // Убираем лайк
            transaction.update(commentRef, { likeCount: Math.max(0, currentLikes - 1) });
            transaction.update(userLikesRef, { [userLikesUpdatePath]: arrayRemove(commentId) });
        } else {
            // Добавляем лайк
            transaction.update(commentRef, { likeCount: currentLikes + 1 });
            // При первом лайке в главе может понадобиться создать документ
            // set с mergeFields гарантирует, что мы не перезапишем другие главы
             transaction.set(userLikesRef, {
                chapters: {
                    [chapterKey]: {
                        likedCommentIds: arrayUnion(commentId)
                    }
                }
            }, { merge: true });
        }
    });
} catch (error) {
            console.error("Ошибка при обновлении лайка комментария:", error);
            setLikedCommentIds(prevSet => {
                const newSet = new Set(prevSet);
                if (isLiked) { newSet.add(commentId); } else { newSet.delete(commentId); }
                return newSet;
            });
            setComments(prevComments => prevComments.map(c =>
                c.id === commentId
                    ? { ...c, userHasLiked: isLiked, likeCount: isLiked ? (c.likeCount || 0) + 1 : (c.likeCount || 1) - 1 }
                    : c
            ));
        }
    }, [userId, novel.id, chapter.id, likedCommentIds]);
    
      const handleEdit = useCallback((comment) => {
          setEditingCommentId(comment ? comment.id : null);
          setEditingText(comment ? comment.text : "");
      }, []);

      const handleUpdateComment = useCallback(async (commentId) => {
          if (!editingText.trim()) return;
          const commentRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`, commentId);
          await updateDoc(commentRef, { text: editingText });
          setComments(prev => prev.map(c => c.id === commentId ? { ...c, text: editingText } : c));
          setEditingCommentId(null);
          setEditingText("");
      }, [editingText, novel.id, chapter.id]);

      const handleDelete = useCallback(async (commentId) => {
          const commentRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/comments`, commentId);
          await deleteDoc(commentRef);
          setComments(prev => prev.filter(c => c.id !== commentId));
      }, [novel.id, chapter.id]);

      const handleReply = useCallback((commentId) => {
          setReplyingTo(prev => prev === commentId ? null : commentId);
          setReplyText('');
      }, []);

    const handleLike = async () => {
      if (!userId) return;
      const hasLiked = userHasLiked;
      setUserHasLiked(!hasLiked);
      setLikeCount(prev => hasLiked ? prev - 1 : prev + 1);
      const likeRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/likes`, userId);
      try {
          await runTransaction(db, async (transaction) => {
              const metaDoc = await transaction.get(chapterMetaRef);
              const currentLikes = metaDoc.data()?.likeCount || 0;
              if (hasLiked) {
                  transaction.delete(likeRef);
                  transaction.set(chapterMetaRef, { likeCount: Math.max(0, currentLikes - 1) }, { merge: true });
              } else {
                  transaction.set(likeRef, { timestamp: serverTimestamp() });
                  transaction.set(chapterMetaRef, { likeCount: currentLikes + 1 }, { merge: true });
              }
          });
      } catch (error) {
          console.error("Ошибка при обновлении лайка:", error);
           setUserHasLiked(hasLiked);
           setLikeCount(prev => hasLiked ? prev + 1 : prev -1);
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
        return `<div class="prose max-w-none">${rawHtml}</div>`;
      }
      return markdownText;
    };
    
    const sortedComments = useMemo(() => {
        return [...comments].sort((a, b) => {
            const dateA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
            const dateB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
            // Сортируем от новых к старым для отображения
            return dateB - dateA;
        });
    }, [comments]);
    
    const contentStyle = {
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily,
        lineHeight: lineHeight,
        textAlign: textAlign,
    };

    return (
      <div className="min-h-screen transition-colors duration-300 bg-background text-text-main">
        <style>
          {`
            .chapter-content p {
              text-indent: ${textIndent}em;
              margin-bottom: ${paragraphSpacing}em;
            }
          `}
        </style>
        <Header title={novel.title} onBack={onBack} />
        <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto pb-24">
          <h2 className="text-lg sm:text-xl mb-8 text-center opacity-80 font-sans">{chapter.title}</h2>
          <div
            className="whitespace-normal chapter-content"
            style={contentStyle}
            dangerouslySetInnerHTML={{ __html: isLoadingContent ? '<p class="text-center">Загрузка текста главы...</p>' : renderMarkdown(chapterContent) }}
          />
          <div className="text-center my-8 text-accent font-bold text-2xl tracking-widest">╚══ ≪ °❈° ≫ ══╝</div>
          <div className="border-t border-border-color pt-8">
            <div className="flex items-center gap-4 mb-8">
              <button onClick={handleLike} className="flex items-center gap-2 text-accent-hover transition-transform hover:scale-110">
                <HeartIcon filled={userHasLiked} className={userHasLiked ? "text-accent" : ''} />
                <span className="font-bold text-lg">{likeCount}</span>
              </button>
            </div>
            <h3 className="text-xl font-bold mb-4">Комментарии</h3>
            <div className="space-y-4 mb-6">
              {/* ✅ ИЗМЕНЕНИЕ: Убрал groupComments, так как sortedComments уже отсортирован как надо */}
              {comments.length > 0
                  ? sortedComments.map(comment =>
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
                  : !isLoadingComments && <p className="opacity-70 text-sm">Комментариев пока нет. Будьте первым!</p>
              }
              {isLoadingComments && comments.length === 0 && <p className="text-center opacity-70">Загрузка комментариев...</p>}
              {hasMoreComments && !isLoadingComments && comments.length > 0 && (
                <div className="text-center pt-4">
                    <button 
                        onClick={loadMoreComments}
                        disabled={isLoadingComments}
                        className="text-accent hover:underline font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                    >
                        {isLoadingComments ? 'Загрузка...' : 'Загрузить ещё'}
                    </button>
                </div>
              )}
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
        
        {/* ... остальной JSX без изменений ... */}

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
                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                          <span>Размер текста</span>
                          <div className="flex items-center gap-2">
                              <button onClick={() => onFontSizeChange(-1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl font-bold">-</button>
                              <span>{fontSize}</span>
                              <button onClick={() => onFontSizeChange(1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl font-bold">+</button>
                          </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <span>Шрифт</span>
                          <div className="flex gap-2 flex-wrap">
                              <button onClick={() => onFontFamilyChange("'JetBrains Mono', monospace")} className={`px-3 py-1 rounded-md text-sm ${fontFamily && fontFamily.includes('JetBrains Mono') ? 'bg-accent text-white' : 'bg-background'}`}>Стандарт</button>
                              <button onClick={() => onFontFamilyChange("'Montserrat', sans-serif")} className={`px-3 py-1 rounded-md text-sm ${fontFamily && fontFamily.includes('Montserrat') ? 'bg-accent text-white' : 'bg-background'}`}>Montserrat</button>
                              <button onClick={() => onFontFamilyChange("'Lora', serif")} className={`px-3 py-1 rounded-md text-sm ${fontFamily && fontFamily.includes('Lora') ? 'bg-accent text-white' : 'bg-background'}`}>Lora</button>
                          </div>
                      </div>
                       <div className="flex items-center justify-between">
                          <span>Интервал</span>
                          <div className="flex items-center gap-2">
                              <button onClick={() => onLineHeightChange(-0.1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl font-bold">-</button>
                              <span>{lineHeight.toFixed(1)}</span>
                              <button onClick={() => onLineHeightChange(0.1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl font-bold">+</button>
                          </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <span>Выравнивание</span>
                          <div className="flex gap-2">
                              <button onClick={() => onTextAlignChange('left')} className={`px-3 py-1 rounded-md ${textAlign === 'left' ? 'bg-accent text-white' : 'bg-background'}`}>По левому</button>
                              <button onClick={() => onTextAlignChange('justify')} className={`px-3 py-1 rounded-md ${textAlign === 'justify' ? 'bg-accent text-white' : 'bg-background'}`}>По ширине</button>
                          </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <span>Красная строка</span>
                           <div className="flex gap-2">
                              <button onClick={() => onTextIndentChange(0)} className={`px-3 py-1 rounded-md ${textIndent === 0 ? 'bg-accent text-white' : 'bg-background'}`}>Нет</button>
                              <button onClick={() => onTextIndentChange(1.5)} className={`px-3 py-1 rounded-md ${textIndent === 1.5 ? 'bg-accent text-white' : 'bg-background'}`}>Да</button>
                              <button onClick={() => onTextIndentChange(3)} className={`px-3 py-1 rounded-md ${textIndent === 3 ? 'bg-accent text-white' : 'bg-background'}`}>Большая</button>
                          </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <span>Отступ абзаца</span>
                          <div className="flex items-center gap-2">
                              <button onClick={() => onParagraphSpacingChange(-0.1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl font-bold">-</button>
                              <span>{paragraphSpacing.toFixed(1)}</span>
                              <button onClick={() => onParagraphSpacingChange(0.1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl font-bold">+</button>
                          </div>
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