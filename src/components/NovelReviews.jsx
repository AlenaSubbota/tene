// src/components/NovelReviews.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from "../supabase-config.js";
import { SendIcon } from './icons.jsx';
import { Comment, groupComments } from './Comment.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';

// Сколько отзывов загружать за раз
const REVIEWS_PER_PAGE = 10;

export const NovelReviews = ({ novelId, userId, userName, isUserAdmin }) => {
    const [reviews, setReviews] = useState([]);
    const [commentsPage, setCommentsPage] = useState(0);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");

    // --- 1. Функция загрузки ОТЗЫВОВ ---
    const loadReviews = useCallback(async (loadMore = false) => {
        if (!novelId) return;
        
        const currentPage = loadMore ? commentsPage + 1 : 0;
        const from = currentPage * REVIEWS_PER_PAGE;
        
        setIsLoading(true);

        const { data, error } = await supabase
            .from('comments')
            .select(`*, comment_likes (user_id)`)
            .eq('novel_id', novelId)
            .eq('chapter_number', 0) // <-- ИЗМЕНЕНИЕ 1: Ищем '0' вместо 'null'
            .order('created_at', { ascending: false })
            .range(from, from + REVIEWS_PER_PAGE - 1);

        if (error) {
            console.error("Ошибка загрузки отзывов:", error);
        } else {
            const newReviews = data.map(c => ({
                ...c,
                userHasLiked: userId ? c.comment_likes.some(like => like.user_id === userId) : false,
                timestamp: new Date(c.created_at)
            }));
            
            setReviews(prev => loadMore ? [...prev, ...newReviews] : newReviews);
            setCommentsPage(currentPage);
            setHasMoreComments(newReviews.length === REVIEWS_PER_PAGE);
        }
        setIsLoading(false);
    }, [novelId, userId, commentsPage]);

    // --- 2. Первичная загрузка ---
    useEffect(() => {
        loadReviews(false);
    }, [loadReviews]);
    
    // --- 3. Отправка отзыва ---
    const handleCommentSubmit = useCallback(async (e, parentId = null) => { 
        e.preventDefault();
        const textToSubmit = parentId ? replyText : newComment;
        if (textToSubmit.trim().length === 0 || !userId) return;
        
        const { error } = await supabase
            .from('comments')
            .insert({
                novel_id: novelId,
                chapter_number: 0, // <-- ИЗМЕНЕНИЕ 2: Вставляем '0' вместо 'null'
                user_id: userId,
                user_name: userName || 'Аноним', 
                text: textToSubmit,
                reply_to: parentId
            });

        if (error) {
            // Эта ошибка теперь не должна появляться
            console.error("Ошибка отправки отзыва:", error);
        } else {
            if (parentId) {
                setReplyText("");
                setReplyingTo(null);
            } else {
                setNewComment("");
            }
            loadReviews(false); // Перезагружаем первую страницу
        }
     }, [newComment, replyText, userId, userName, novelId, replyingTo, loadReviews]);
     
    // --- 4. Все остальные обработчики (лайки, удаление, редактирование) ---
    // (Они остаются БЕЗ ИЗМЕНЕНИЙ)
    
    // Лайк комментария
    const handleCommentLike = useCallback(async (commentId) => { 
        if (!userId) return;
        
        const originalComments = reviews; 
        setReviews(prevComments => 
            prevComments.map(c => 
                c.id === commentId 
                ? { ...c, 
                    userHasLiked: !c.userHasLiked, 
                    like_count: c.userHasLiked ? c.like_count - 1 : c.like_count + 1 
                  } 
                : c
            )
        );
        
        const { error } = await supabase.rpc('toggle_comment_like', { p_comment_id: commentId });
        
        if(error) {
            console.error("Ошибка лайка комментария:", error);
            setReviews(originalComments); 
            alert("Ошибка лайка. Попробуйте снова.");
        }
    }, [userId, reviews]);
    
    // Открыть/Закрыть редактирование
    const handleEdit = useCallback((comment) => { 
        setEditingCommentId(comment ? comment.id : null);
        setEditingText(comment ? comment.text : "");
    }, []);
    
    // Сохранить отредактированный комментарий
    const handleUpdateComment = useCallback(async (commentId) => { 
        if (editingText.trim().length === 0) return;
        
        const { data, error } = await supabase
            .from('comments')
            .update({ text: editingText })
            .eq('id', commentId)
            .select()
            .single();
            
        if (error) {
            console.error("Ошибка обновления:", error);
            alert("Ошибка обновления. Попробуйте снова.");
        } else {
            setReviews(prev => prev.map(c => 
                c.id === commentId ? { ...c, text: data.text } : c
            ));
            setEditingCommentId(null);
            setEditingText("");
        }
    }, [editingText]);
    
    // Удалить комментарий
    const handleDelete = useCallback(async (commentId) => {
        const { error } = await supabase
            .rpc('delete_comment_and_replies', {
                p_comment_id: commentId
            });

        if (error) {
            console.error('Ошибка при каскадном удалении:', error);
            alert("Не удалось удалить комментарий. Попробуйте снова.");
        } else {
            loadReviews(false); // Перезагружаем
        }
    }, [loadReviews]);
    
    const handleReply = useCallback((commentId) => { 
        setReplyingTo(prev => (prev === commentId ? null : commentId));
        setReplyText("");
    }, []);
    
    const groupedComments = useMemo(() => groupComments(reviews), [reviews]);

    return (
        <div className="pt-6">
            <div className="space-y-4 mb-6">
                {reviews.length > 0 ? groupedComments.reverse().map(comment =>
                    <Comment
                        key={comment.id} comment={comment} onReply={handleReply} onLike={handleCommentLike}
                        onEdit={handleEdit} onDelete={handleDelete} onUpdate={handleUpdateComment}
                        isUserAdmin={isUserAdmin} currentUserId={userId} editingCommentId={editingCommentId}
                        editingText={editingText} setEditingText={setEditingText} replyingTo={replyingTo}
                        replyText={replyText} setReplyText={setReplyText} onCommentSubmit={handleCommentSubmit}
                    />)
                    : !isLoading && <p className="opacity-70 text-sm text-center">Отзывов пока нет. Будьте первым!</p>
                }
                {isLoading && reviews.length === 0 && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
                
                {hasMoreComments && !isLoading && reviews.length > 0 && (
                    <div className="text-center pt-4">
                        <button onClick={() => loadReviews(true)} disabled={isLoading} className="text-accent hover:underline font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
                            {isLoading ? 'Загрузка...' : 'Загрузить ещё'}
                        </button>
                    </div>
                )}
            </div>
            
            <form onSubmit={(e) => handleCommentSubmit(e, null)} className="flex items-center gap-2 mt-4 sticky bottom-4">
                <input 
                    type="text" 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    placeholder="Написать отзыв..." 
                    className="w-full bg-component-bg border border-border-color rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent text-sm shadow-lg" 
                />
                <button 
                    type="submit" 
                    className="p-2 rounded-full bg-accent text-white flex items-center justify-center h-10 w-10 shadow-lg flex-shrink-0"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};