import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    doc, getDoc, setDoc, updateDoc, deleteDoc,
    collection, onSnapshot, query, orderBy, addDoc,
    serverTimestamp, runTransaction
} from "firebase/firestore";
import { db } from '../firebase-config';
import { Header } from './Header';
import { SettingsIcon, HeartIcon, SendIcon } from './icons';
import { Comment, groupComments } from './Comment';

export const ChapterReader = ({ chapter, novel, fontSize, onFontSizeChange, userId, userName, currentFontClass, onSelectChapter, allChapters, subscription, onBack, isUserAdmin }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [likes, setLikes] = useState({});
    const [showSettings, setShowSettings] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");
    const commentsEndRef = useRef(null);

    const hasActiveSubscription = subscription && new Date(subscription.endDate.seconds * 1000) > new Date();
    const isChapterLocked = chapter.paid && !hasActiveSubscription;

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!chapter || !novel) return;
        const commentsQuery = query(collection(db, "novels", novel.id, "chapters", chapter.id, "comments"), orderBy("createdAt"));
        const unsubscribe = onSnapshot(commentsQuery, snapshot => {
            const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setComments(commentsData);
        });
        return unsubscribe;
    }, [novel?.id, chapter?.id]);

    useEffect(() => {
        if (!chapter || !userId) return;
        const likesRef = doc(db, "users", userId, "likes", chapter.id);
        const unsubscribe = onSnapshot(likesRef, doc => {
            setLikes(doc.data() || {});
        });
        return unsubscribe;
    }, [chapter?.id, userId]);

    const handleCommentSubmit = async (text, parentId = null) => {
        if (text.trim() === "") return;
        try {
            await addDoc(collection(db, "novels", novel.id, "chapters", chapter.id, "comments"), {
                text,
                userId,
                userName,
                createdAt: serverTimestamp(),
                likes: 0,
                parentId
            });
            if (parentId) {
                setReplyingTo(null);
                setReplyText("");
            } else {
                setNewComment("");
            }
            scrollToBottom();
        } catch (error) {
            console.error("Error adding comment: ", error);
        }
    };

    const handleLike = useCallback(async (commentId) => {
        if (!userId) return;
        const commentRef = doc(db, "novels", novel.id, "chapters", chapter.id, "comments", commentId);
        const userLikesRef = doc(db, "users", userId, "likes", chapter.id);
        const alreadyLiked = likes[commentId];

        try {
            await runTransaction(db, async (transaction) => {
                const commentDoc = await transaction.get(commentRef);
                if (!commentDoc.exists()) throw "Comment does not exist!";

                const newLikesCount = commentDoc.data().likes + (alreadyLiked ? -1 : 1);
                transaction.update(commentRef, { likes: newLikesCount });

                const userLikesDoc = await transaction.get(userLikesRef);
                if (userLikesDoc.exists()) {
                    transaction.update(userLikesRef, { [commentId]: !alreadyLiked });
                } else {
                    transaction.set(userLikesRef, { [commentId]: true });
                }
            });

            setLikes(prev => ({ ...prev, [commentId]: !alreadyLiked }));
        } catch (error) {
            console.error("Transaction failed: ", error);
        }
    }, [userId, novel?.id, chapter?.id, likes]);
    
    const handleUpdateComment = async (commentId, newText) => {
        const commentRef = doc(db, "novels", novel.id, "chapters", chapter.id, "comments", commentId);
        await updateDoc(commentRef, { text: newText });
        setEditingCommentId(null);
        setEditingText("");
    };

    const handleDeleteComment = async (commentId) => {
        if (window.confirm("Вы уверены, что хотите удалить этот комментарий?")) {
            await deleteDoc(doc(db, "novels", novel.id, "chapters", chapter.id, "comments", commentId));
        }
    };
    
    const chapterIndex = useMemo(() => allChapters.findIndex(c => c.id === chapter.id), [allChapters, chapter]);
    const prevChapter = chapterIndex > 0 ? allChapters[chapterIndex - 1] : null;
    const nextChapter = chapterIndex < allChapters.length - 1 ? allChapters[chapterIndex + 1] : null;

    const groupedComments = useMemo(() => groupComments(comments), [comments]);

    if (isChapterLocked) {
        return (
            <div className="animate-slide-in-right">
                <Header title={chapter.title} onBack={onBack} />
                <div className="p-4 text-center">
                    <p className="text-lg">Эта глава доступна только по подписке.</p>
                    {/* Здесь можно добавить кнопку для оформления подписки */}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-slide-in-right">
            <Header title={chapter.title} onBack={onBack}>
                <button onClick={() => setShowSettings(!showSettings)} className="ml-auto p-2 rounded-full hover:bg-background">
                    <SettingsIcon />
                </button>
            </Header>

            {showSettings && (
                <div className="p-4 bg-component-bg border-b border-border-color">
                    <div className="mb-2">
                        <label className="block text-sm opacity-80 mb-1">Размер шрифта</label>
                        <input type="range" min="12" max="24" value={fontSize} onChange={(e) => onFontSizeChange(parseInt(e.target.value, 10))} className="w-full" />
                    </div>
                </div>
            )}

            <article style={{ fontSize: `${fontSize}px` }} className={`p-4 leading-relaxed whitespace-pre-wrap ${currentFontClass}`}>
                {chapter.content}
            </article>
            
            <div className="flex justify-between p-4">
                <button onClick={() => onSelectChapter(novel.id, prevChapter.id)} disabled={!prevChapter} className="px-4 py-2 rounded-lg bg-component-bg border border-border-color disabled:opacity-50">Назад</button>
                <button onClick={() => onSelectChapter(novel.id, nextChapter.id)} disabled={!nextChapter} className="px-4 py-2 rounded-lg bg-component-bg border border-border-color disabled:opacity-50">Вперед</button>
            </div>

            <div className="p-4">
                <h3 className="text-lg font-bold mb-3">Комментарии ({comments.length})</h3>
                <div className="space-y-4">
                    {groupedComments.map(comment => (
                        <Comment 
                            key={comment.id}
                            comment={comment}
                            onLike={() => handleLike(comment.id)}
                            onDelete={() => handleDeleteComment(comment.id)}
                            onEdit={(id, text) => { setEditingCommentId(id); setEditingText(text); }}
                            onUpdate={handleUpdateComment}
                            onReply={(id) => setReplyingTo(id)}
                            isUserAdmin={isUserAdmin}
                            currentUserId={userId}
                            editingCommentId={editingCommentId}
                            editingText={editingText}
                            setEditingText={setEditingText}
                            replyingTo={replyingTo}
                            replyText={replyText}
                            setReplyText={setReplyText}
                            onCommentSubmit={handleCommentSubmit}
                            isLiked={!!likes[comment.id]}
                        />
                    ))}
                    <div ref={commentsEndRef} />
                </div>
                <div className="sticky bottom-0 flex items-center gap-2 mt-4 p-2 bg-component-bg border-t border-border-color">
                    <input value={newComment} onChange={(e) => setNewComment(e.target.value)} type="text" placeholder="Ваш комментарий..." className="w-full p-2 bg-background border border-border-color rounded-lg focus:outline-none focus:ring-1 focus:ring-accent" />
                    <button onClick={() => handleCommentSubmit(newComment)} className="p-2 rounded-full bg-accent text-white"><SendIcon /></button>
                </div>
            </div>
        </div>
    );
};