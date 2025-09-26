import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, orderBy, addDoc, serverTimestamp, runTransaction, getDocs, limit, startAfter } from "firebase/firestore";
import { db } from "../../firebase-config.js";
import { HeartIcon, BackIcon, ArrowRightIcon, SettingsIcon, SendIcon } from '../icons.jsx';
import { SubscriptionModal } from '../SubscriptionModal.jsx';
import { PaymentMethodModal } from '../PaymentMethodModal.jsx';
import { Comment, groupComments } from '../Comment.jsx';
import { Header } from '../Header.jsx';

export const ChapterReader = ({ chapter, novel, fontSize, onFontSizeChange, userId, userName, currentFontClass, onSelectChapter, allChapters, subscription, botUsername, onBack, isUserAdmin }) => {

    if (!novel || !chapter) {
        return (
           <div>
               <Header title="Загрузка..." onBack={onBack} />
               <div className="p-4 text-center">Подготовка главы...</div>
           </div>
       );
    }

    // Состояния для комментариев и пагинации
    const [comments, setComments] = useState([]);
    const [lastCommentDoc, setLastCommentDoc] = useState(null);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    const [isLoadingComments, setIsLoadingComments] = useState(false);

    // Остальные состояния компонента
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

    // Функция для загрузки порции комментариев
    const fetchComments = useCallback(async () => {
        if (isLoadingComments || !hasMoreComments) return;
        setIsLoadingComments(true);

        try {
            let q;
            if (lastCommentDoc) {
                q = query(commentsColRef, orderBy("timestamp", "desc"), startAfter(lastCommentDoc), limit(20));
            } else {
                q = query(commentsColRef, orderBy("timestamp", "desc"), limit(20));
            }

            const documentSnapshots = await getDocs(q);
            const newCommentsData = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            let commentsWithLikes = newCommentsData;
            if (userId && newCommentsData.length > 0) {
                 commentsWithLikes = await Promise.all(
                    newCommentsData.map(async (comment) => {
                        const likeDocRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/comments/${comment.id}/likes`, userId);
                        const likeDocSnap = await getDoc(likeDocRef);
                        return { ...comment, userHasLiked: likeDocSnap.exists() };
                    })
                );
            }

            setComments(prevComments => [...prevComments, ...commentsWithLikes]);

            const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastCommentDoc(lastVisible);

            if (documentSnapshots.docs.length < 20) {
                setHasMoreComments(false);
            }
        } catch (error) {
            console.error("Ошибка загрузки комментариев: ", error);
        } finally {
            setIsLoadingComments(false);
        }
    }, [isLoadingComments, hasMoreComments, lastCommentDoc, commentsColRef, userId, novel.id, chapter.id]);

    // Загрузка основной информации о главе и первой порции комментариев
    useEffect(() => {
        // Сброс состояния при смене главы
        setComments([]);
        setLastCommentDoc(null);
        setHasMoreComments(true);
        setIsLoadingComments(false); // Убедимся, что сбрасываем состояние загрузки

        const fetchInitialData = async () => {
            try {
                const metaSnap = await getDoc(chapterMetaRef);
                setLikeCount(metaSnap.exists() ? metaSnap.data().likeCount || 0 : 0);

                if (userId) {
                    const likeRef = doc(db, `chapters_metadata/${novel.id}_${chapter.id}/likes`, userId);
                    const likeSnap = await getDoc(likeRef);
                    setUserHasLiked(likeSnap.exists());
                } else {
                    setUserHasLiked(false);
                }
                
                // Запускаем загрузку первой порции комментариев
                await fetchComments();

            } catch (error) {
                console.error("Ошибка загрузки данных главы:", error);
            }
        };

        fetchInitialData();
    }, [chapterMetaRef, userId, novel.id, chapter.id]); // Добавлен fetchComments в зависимости, но useCallback его защищает

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
        // Убедимся, что документ-контейнер для комментариев существует
        await setDoc(chapterMetaRef, {}, { merge: true });

        // 1. Добавляем поле isNotified: false
        const newCommentData = {
            userId,
            userName: userName || "Аноним",
            text,
            timestamp: serverTimestamp(),
            likeCount: 0,
            novelTitle: novel.title,
            chapterTitle: chapter.title,
            isNotified: false // <--- РЕШЕНИЕ ПРОБЛЕМЫ С УВЕДОМЛЕНИЯМИ
        };

        // Если это ответ, добавляем ID родительского комментария
        if (parentId) {
            newCommentData.replyTo = parentId;
            const parentCommentDoc = await getDoc(doc(commentsColRef, parentId));
            if (parentCommentDoc.exists()) {
                // Добавляем ID автора родительского комментария для уведомлений об ответе
                newCommentData.parentUserId = parentCommentDoc.data().userId;
            }
        }
        
        const addedDocRef = await addDoc(commentsColRef, newCommentData);
        
        // Оптимистичное обновление интерфейса
        setComments(prev => [{ ...newCommentData, id: addedDocRef.id, userHasLiked: false, timestamp: new Date() }, ...prev]);
        
        // 2. УДАЛИЛИ лишнюю запись в коллекцию "notifications"

        // 3. Теперь этот код будет выполняться без ошибок
        if (parentId) {
            setReplyingTo(null);
            setReplyText("");
        } else {
            setNewComment(""); // <--- РЕШЕНИЕ ПРОБЛЕМЫ С ОЧИСТКОЙ ПОЛЯ
        }

    } catch (error) {
        console.error("Ошибка добавления комментария:", error);
        // Можно добавить уведомление для пользователя об ошибке
        // alert("Не удалось отправить комментарий. Попробуйте снова.");
    }
}, [userId, userName, newComment, replyText, chapterMetaRef, novel.id, chapter.id, novel.title, chapter.title, commentsColRef]);

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
          setComments(prevComments => prevComments.map(c => {
            if (c.id === commentId) {
                const newLikeCount = !c.userHasLiked ? (c.likeCount || 1) - 1 : (c.likeCount || 0) + 1;
                return { ...c, userHasLiked: !c.userHasLiked, likeCount: newLikeCount };
            }
            return c;
          }));
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
        return `<div class="prose">${rawHtml}</div>`;
      }
      return markdownText;
    };
    
    // Сортируем комментарии для отображения, так как мы их загружаем в обратном порядке
    const sortedComments = useMemo(() => {
        return [...comments].sort((a, b) => {
            const dateA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
            const dateB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
            return dateA - dateB;
        });
    }, [comments]);


    return (
      <div className="min-h-screen transition-colors duration-300 bg-background text-text-main">
        <Header title={novel.title} onBack={onBack} />
        <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto pb-24">
          <h2 className="text-lg sm:text-xl mb-8 text-center opacity-80 font-sans">{chapter.title}</h2>
          <div
            className={`whitespace-normal leading-relaxed ${currentFontClass}`}
            style={{ fontSize: `${fontSize}px` }}
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
              {comments.length > 0
                  ? groupComments(sortedComments).map(comment =>
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
              {isLoadingComments && <p className="text-center opacity-70">Загрузка комментариев...</p>}
              {hasMoreComments && !isLoadingComments && comments.length > 0 && (
                <div className="text-center pt-4">
                    <button 
                        onClick={fetchComments}
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