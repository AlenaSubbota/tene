import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from "../../supabase-config.js";
import { HeartIcon, BackIcon, ArrowRightIcon, SettingsIcon, SendIcon } from '../icons.jsx';
import { SubscriptionModal } from '../SubscriptionModal.jsx';
import { PaymentMethodModal } from '../PaymentMethodModal.jsx';
import { Comment, groupComments } from '../Comment.jsx';
import { Header } from '../Header.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';

export const ChapterReader = ({
    chapter, novel, userId, userName, subscription, botUsername, onBack, isUserAdmin,
    allChapters, onSelectChapter,
    fontSize, onFontSizeChange
}) => {
    const [comments, setComments] = useState([]);
    const [commentsPage, setCommentsPage] = useState(0);
    const [hasMoreComments, setHasMoreComments] = useState(true);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
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

    const hasActiveSubscription = subscription?.expires_at && new Date(subscription.expires_at) > new Date();

    useEffect(() => {
        const fetchChapterData = async () => {
            if (!novel?.id || !chapter?.id) return;
            setIsLoadingContent(true);
            
            if (chapter.isPaid && !hasActiveSubscription) {
                setChapterContent('### 🔒 Для доступа к этой главе необходима подписка.');
                setIsLoadingContent(false);
                return;
            }
            
            const contentPromise = supabase.from('chapter_content').select('content').eq('novel_id', novel.id).eq('chapter_number', chapter.id).single();
            const likesPromise = supabase.from('chapter_likes').select('like_count').eq('novel_id', novel.id).eq('chapter_number', chapter.id).single();
            const userLikePromise = userId ? supabase.from('chapter_user_likes').select('*', { count: 'exact', head: true }).eq('novel_id', novel.id).eq('chapter_number', chapter.id).eq('user_id', userId) : Promise.resolve({ count: 0 });

            const [{ data: contentData, error: contentError }, { data: likesData }, { count: userLikeCount }] = await Promise.all([contentPromise, likesPromise, userLikePromise]);

            if (contentError) {
                setChapterContent('## Ошибка\n\nНе удалось загрузить текст главы.');
            } else {
                setChapterContent(contentData?.content || 'Глава пуста.');
            }

            setLikeCount(likesData?.like_count || 0);
            setUserHasLiked(userLikeCount > 0);
            setIsLoadingContent(false);
        };
        fetchChapterData();
    }, [novel?.id, chapter?.id, userId, hasActiveSubscription]);


    const loadComments = useCallback(async (loadMore = false) => {
        if (!novel?.id || !chapter?.id) return;
        setIsLoadingComments(true);
        const COMMENTS_PER_PAGE = 20;
        const currentPage = loadMore ? commentsPage + 1 : 0;
        const from = currentPage * COMMENTS_PER_PAGE;
        
        const { data, error } = await supabase
            .from('comments')
            .select(`*, comment_likes (user_id)`)
            .eq('novel_id', novel.id)
            .eq('chapter_number', chapter.id)
            .order('created_at', { ascending: false })
            .range(from, from + COMMENTS_PER_PAGE - 1);

        if (error) {
            console.error("Ошибка загрузки комментариев:", error);
        } else {
            const newComments = data.map(c => ({
                ...c,
                userHasLiked: userId ? c.comment_likes.some(like => like.user_id === userId) : false,
                timestamp: new Date(c.created_at)
            }));
            if (loadMore) {
                setComments(prev => [...prev, ...newComments]);
            } else {
                setComments(newComments);
            }
            setCommentsPage(currentPage);
            setHasMoreComments(newComments.length === COMMENTS_PER_PAGE);
        }
        setIsLoadingComments(false);
    }, [novel?.id, chapter?.id, userId, commentsPage]);

    useEffect(() => { loadComments(false); }, [novel?.id, chapter?.id, userId]);

    // --- ИСПРАВЛЕНО: Логика лайков главы ---
    const handleLike = async () => {
        if (!userId) return;

        // Оптимистичное обновление
        const alreadyLiked = userHasLiked;
        setUserHasLiked(!alreadyLiked);
        setLikeCount(prev => alreadyLiked ? prev - 1 : prev + 1);

        // Вызов функции в базе данных
        const { error } = await supabase.rpc('toggle_chapter_like', { 
            p_novel_id: novel.id, 
            p_chapter_number: chapter.id, 
            p_user_id: userId 
        });

        // Если произошла ошибка, откатываем изменения в интерфейсе
        if (error) {
            console.error("Ошибка при лайке главы:", error);
            setUserHasLiked(alreadyLiked); // Возвращаем как было
            setLikeCount(prev => alreadyLiked ? prev + 1 : prev - 1); // Возвращаем как было
        }
    };
    
    // Остальные функции без критических изменений...
    const handleCommentSubmit = useCallback(async (e, parentId = null) => { /* ... */ });
    const handleCommentLike = useCallback(async (commentId) => { /* ... */ });
    const handleEdit = useCallback((comment) => { /* ... */ });
    const handleUpdateComment = useCallback(async (commentId) => { /* ... */ });
    const handleDelete = useCallback(async (commentId) => { /* ... */ });
    const handleReply = useCallback((commentId) => { /* ... */ });
    const handleChapterClick = (chapterToSelect) => {
        if (chapterToSelect && (!hasActiveSubscription && chapterToSelect.isPaid)) {
            setIsSubModalOpen(true);
        } else if (chapterToSelect) {
            onSelectChapter(chapterToSelect);
        }
    };
    const handlePlanSelect = (plan) => { setSelectedPlan(plan); setIsSubModalOpen(false); };
    const handlePaymentMethodSelect = async (method) => { /* ... */ };
    const renderMarkdown = (markdownText) => {
        if (window.marked) return window.marked.parse(markdownText || "");
        return (markdownText || "").replace(/\n/g, '<br />');
    };
    const groupedComments = useMemo(() => groupComments(comments), [comments]);
    const currentChapterIndex = allChapters.findIndex(c => c.id === chapter.id);
    const prevChapter = allChapters[currentChapterIndex - 1];
    const nextChapter = allChapters[currentChapterIndex + 1];

    if (!novel || !chapter) return <LoadingSpinner />;

    return (
      <div className="min-h-screen bg-background text-text-main">
        <Header title={novel.title} onBack={onBack} />
        <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto pb-24">
            <h2 className="text-lg sm:text-xl mb-8 text-center opacity-80 font-sans">{chapter.title}</h2>
            <div 
                className="whitespace-normal chapter-content prose dark:prose-invert max-w-none" 
                style={{ fontSize: `${fontSize}px` }} 
                dangerouslySetInnerHTML={{ __html: isLoadingContent ? '<p class="text-center">Загрузка...</p>' : renderMarkdown(chapterContent) }} 
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
                    {comments.length > 0 ? groupedComments.reverse().map(comment =>
                        <Comment
                            key={comment.id} comment={comment} onReply={handleReply} onLike={handleCommentLike}
                            onEdit={handleEdit} onDelete={handleDelete} onUpdate={handleUpdateComment}
                            isUserAdmin={isUserAdmin} currentUserId={userId} editingCommentId={editingCommentId}
                            editingText={editingText} setEditingText={setEditingText} replyingTo={replyingTo}
                            replyText={replyText} setReplyText={setReplyText} onCommentSubmit={handleCommentSubmit}
                        />)
                        : !isLoadingComments && <p className="opacity-70 text-sm">Комментариев пока нет. Будьте первым!</p>
                    }
                    {isLoadingComments && comments.length === 0 && <p className="text-center opacity-70">Загрузка комментариев...</p>}
                    {hasMoreComments && !isLoadingComments && comments.length > 0 && (
                        <div className="text-center pt-4">
                            <button onClick={() => loadComments(true)} disabled={isLoadingComments} className="text-accent hover:underline font-semibold px-4 py-2 rounded-lg disabled:opacity-50">
                                {isLoadingComments ? 'Загрузка...' : 'Загрузить ещё'}
                            </button>
                        </div>
                    )}
                </div>
                <form onSubmit={(e) => handleCommentSubmit(e, null)} className="flex items-center gap-2">
                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Написать комментарий..." className="w-full bg-component-bg border border-border-color rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
                    <button type="submit" className="p-2 rounded-full bg-accent text-white flex items-center justify-center"><SendIcon className="w-5 h-5" /></button>
                </form>
            </div>
        </div>
        
        <div className="fixed bottom-0 left-0 right-0 p-2 border-t border-border-color bg-component-bg flex justify-between items-center z-10 text-text-main">
          <button onClick={() => handleChapterClick(prevChapter)} disabled={!prevChapter} className="p-2 disabled:opacity-50"><BackIcon/></button>
          <div className="flex gap-2">
              <button onClick={() => setShowChapterList(true)} className="px-4 py-2 rounded-lg bg-background">Оглавление</button>
              <button onClick={() => setShowSettings(true)} className="p-2 rounded-lg bg-background"><SettingsIcon /></button>
          </div>
          <button onClick={() => handleChapterClick(nextChapter)} disabled={!nextChapter} className="p-2 disabled:opacity-50"><ArrowRightIcon/></button>
        </div>

        {showChapterList && (
            <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setShowChapterList(false)}>
                <div className="absolute bottom-0 left-0 right-0 max-h-[45vh] p-4 rounded-t-2xl bg-component-bg flex flex-col" onClick={e => e.stopPropagation()}>
                    <h3 className="font-bold text-lg mb-4 flex-shrink-0">Главы</h3>
                    <div className="overflow-y-auto">
                        <div className="flex flex-col gap-2">
                            {allChapters.map(chap => (
                                <button key={chap.id} onClick={() => handleChapterClick(chap)} className={`p-2 text-left rounded-md ${chap.id === chapter.id ? "bg-accent text-white" : "bg-background"}`}>
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