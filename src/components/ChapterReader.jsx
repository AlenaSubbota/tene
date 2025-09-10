import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase-config';
import { doc, getDoc, onSnapshot, collection, query, orderBy, addDoc, setDoc, serverTimestamp, runTransaction, updateDoc, deleteDoc } from "firebase/firestore";
import { Header } from './Header';
import { Comment } from './Comment';
import { SubscriptionModal, PaymentMethodModal } from './Modals';
import { BackIcon, ArrowRightIcon, SettingsIcon, HeartIcon, SendIcon } from './icons';

// Функция для группировки комментариев
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

export const ChapterReader = ({
    chapter, novel, onBack, onSelectChapter, allChapters,
    subscription, userId, userName, isUserAdmin, fontSize, onFontSizeChange, currentFontClass
}) => {
    
    if (!novel || !chapter) {
        return (
           <div>
               <Header title="Ошибка" onBack={onBack} />
               <div className="p-4 text-center">Не удалось загрузить главу. Пожалуйста, вернитесь назад.</div>
           </div>
       );
    }

    const [chapterContent, setChapterContent] = useState('');
    const [isLoadingContent, setIsLoadingContent] = useState(true);
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

    const hasActiveSubscription = subscription && subscription.expires_at && typeof subscription.expires_at.toDate === 'function' && subscription.expires_at.toDate() > new Date();
    const chapterMetaRef = useMemo(() => doc(db, "chapters_metadata", `${novel.id}_${chapter.id}`), [novel.id, chapter.id]);

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoadingContent(true);
            setChapterContent('');
            if (chapter.isPaid && !hasActiveSubscription) {
                setIsLoadingContent(false);
                setChapterContent('### 🔒 Для доступа к этой главе необходима подписка.');
                return;
            }
            try {
                const chapterDocRef = doc(db, 'chapter_content', `${novel.id}-${chapter.id}`);
                const docSnap = await getDoc(chapterDocRef);
                if (docSnap.exists()) {
                    setChapterContent(docSnap.data().content);
                } else {
                    setChapterContent('## Ошибка\n\nНе удалось загрузить текст главы.');
                }
            } catch (error) {
                console.error("Ошибка загрузки главы:", error);
                setChapterContent('## Ошибка\n\nПроизошла ошибка при загрузке.');
            } finally {
                setIsLoadingContent(false);
            }
        };
        fetchContent();
    }, [novel.id, chapter.id, hasActiveSubscription]);

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
            };
            if (parentId) {
                commentData.replyTo = parentId;
            }
            await addDoc(commentsColRef, commentData);
            if (parentId) {
                setReplyingTo(null);
                setReplyText("");
            } else {
                setNewComment("");
            }
        } catch (error) {
            console.error("Ошибка добавления комментария:", error);
        }
    }, [userId, userName, newComment, replyText, chapterMetaRef, novel.id, chapter.id]);

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

    const renderMarkdown = (markdownText) => {
        if (window.marked) {
          const rawHtml = window.marked.parse(markdownText || '');
          return `<div class="prose max-w-none prose-p:text-text-main prose-headings:text-text-main">${rawHtml}</div>`;
        }
        return markdownText;
    };

    const currentChapterIndex = allChapters.findIndex(c => c.id === chapter.id);
    const prevChapter = allChapters[currentChapterIndex - 1];
    const nextChapter = allChapters[currentChapterIndex + 1];

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
    
    return (
        <div className="min-h-screen bg-background text-text-main">
          <Header title={novel.title} onBack={onBack} />
          <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto pb-24">
            <h2 className="text-lg sm:text-xl mb-8 text-center opacity-80 font-sans">{chapter.title}</h2>
            <div
              className={`whitespace-normal leading-relaxed ${currentFontClass}`}
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: isLoadingContent ? '<p>Загрузка...</p>' : renderMarkdown(chapterContent) }}
            />
            <div className="text-center my-8 text-accent font-bold text-2xl tracking-widest">╚══ ≪ °❈° ≫ ══╝</div>
            <div className="border-t border-border-color pt-8">
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
                    : <p className="opacity-70 text-sm">Комментариев пока нет.</p>
                }
              </div>
              <form onSubmit={(e) => handleCommentSubmit(e, null)} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Написать комментарий..."
                  className="w-full bg-component-bg border border-border-color rounded-lg py-2 px-4"
                />
                <button type="submit" className="p-2 rounded-full bg-accent text-white"><SendIcon className="w-5 h-5" /></button>
              </form>
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-2 border-t border-border-color bg-component-bg flex justify-between items-center z-10">
            <button onClick={() => handleChapterClick(prevChapter)} disabled={!prevChapter} className="p-2 disabled:opacity-50"><BackIcon/></button>
            <div className="flex gap-2">
                {/* ЭТО МЕСТО БЫЛО С ОШИБКОЙ. ТЕПЕРЬ ИСПРАВЛЕНО. */}
                <button onClick={() => setShowChapterList(true)} className="px-4 py-2 rounded-lg bg-background">Оглавление</button>
                <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg bg-background"><SettingsIcon /></button>
            </div>
            <button onClick={() => handleChapterClick(nextChapter)} disabled={!nextChapter} className="p-2 disabled:opacity-50"><ArrowRightIcon className="opacity-100"/></button>
          </div>

          {showChapterList && (
            <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setShowChapterList(false)}>
              <div className="absolute bottom-0 left-0 right-0 max-h-[45vh] p-4 rounded-t-2xl bg-component-bg flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-4">Главы</h3>
                <div className="overflow-y-auto">
                    {allChapters.map(chap => (
                      <button key={chap.id} onClick={() => handleChapterClick(chap)} className={`w-full p-2 text-left rounded-md ${chap.id === chapter.id ? "bg-accent text-white" : "bg-background"}`}>
                        {chap.title}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
          {showSettings && (
             <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setShowSettings(false)}>
                 <div className="absolute bottom-0 left-0 right-0 p-4 rounded-t-2xl bg-component-bg" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-lg mb-4">Настройки</h3>
                     <div className="flex items-center justify-between">
                      <span>Размер текста</span>
                      <div className="flex items-center gap-4">
                        <button onClick={() => onFontSizeChange(-1)} className="text-2xl font-bold">-</button>
                        <span>{fontSize}</span>
                        <button onClick={() => onFontSizeChange(1)} className="text-2xl font-bold">+</button>
                      </div>
                    </div>
                 </div>
             </div>
          )}
          {isSubModalOpen && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSelectPlan={() => {}} />}
          {selectedPlan && <PaymentMethodModal onClose={() => setSelectedPlan(null)} onSelectMethod={() => {}} plan={selectedPlan} />}
        </div>
    );
};