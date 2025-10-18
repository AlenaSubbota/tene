// src/components/pages/ChapterReader.jsx
// (ФИНАЛЬНАЯ ВЕРСИЯ - С localStorage для настроек)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from "../../supabase-config.js";
import { HeartIcon, BackIcon, ArrowRightIcon, SettingsIcon, SendIcon } from '../icons.jsx';
import { SubscriptionModal } from '../SubscriptionModal.jsx';
import { PaymentMethodModal } from '../PaymentMethodModal.jsx';
import { Comment, groupComments } from '../Comment.jsx';
import { Header } from '../Header.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';

// --- НОВАЯ ХЕЛПЕР-ФУНКЦИЯ для чтения из localStorage ---
// Она безопасно читает JSON или возвращает значение по умолчанию
const usePersistentState = (key, defaultValue) => {
    const [state, setState] = useState(() => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (e) {
            console.error("Ошибка чтения localStorage", e);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (e) {
            console.error("Ошибка записи в localStorage", e);
        }
    }, [key, state]);

    return [state, setState];
};


export const ChapterReader = ({
    chapter, novel, userId, userName, subscription, botUsername, onBack, isUserAdmin,
    allChapters, onSelectChapter,
    fontSize, onFontSizeChange // fontSize и onFontSizeChange приходят из App.jsx
}) => {
    // --- Состояния Компонента ---
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
    
    // --- ИСПРАВЛЕНИЕ: Состояния для Настроек теперь используют localStorage ---
    const [fontFamily, setFontFamily] = usePersistentState("reader_fontFamily", "'Montserrat', sans-serif");
    const [lineHeight, setLineHeight] = usePersistentState("reader_lineHeight", 1.7);
    const [textAlign, setTextAlign] = usePersistentState("reader_textAlign", 'left');
    const [textIndent, setTextIndent] = usePersistentState("reader_textIndent", 1.5);
    const [paragraphSpacing, setParagraphSpacing] = usePersistentState("reader_paragraphSpacing", 0.8);

    const hasActiveSubscription = subscription?.expires_at && new Date(subscription.expires_at) > new Date();

    // --- Загрузка Данных (1 запрос) ---
    useEffect(() => {
        const fetchChapterData = async () => {
            if (!novel?.id || !chapter?.id) return;
            setIsLoadingContent(true);
            setIsLoadingComments(true);
            
            if (chapter.isPaid && !hasActiveSubscription) {
                setChapterContent('### 🔒 Для доступа к этой главе необходима премиум-подписка.');
                setIsLoadingContent(false);
                setIsLoadingComments(false);
                setComments([]);
                setLikeCount(0);
                setUserHasLiked(false);
                return;
            }
            
            const { data, error } = await supabase.rpc('get_chapter_data', {
                p_novel_id: novel.id,
                p_chapter_number: chapter.id
            });

            if (error) {
                console.error("Ошибка загрузки данных главы:", error);
                setChapterContent('## Ошибка\n\nНе удалось загрузить данные главы.');
                setComments([]);
            } else {
                setChapterContent(data.content || 'Глава пуста.');
                setLikeCount(data.like_count || 0);
                setUserHasLiked(data.user_has_liked || false);

                const newComments = data.comments.map(c => ({
                    ...c,
                    timestamp: new Date(c.created_at)
                }));
                
                setComments(newComments);
                const COMMENTS_PER_PAGE = 20; 
                setHasMoreComments(newComments.length === COMMENTS_PER_PAGE);
                setCommentsPage(0);
            }
            
            setIsLoadingContent(false);
            setIsLoadingComments(false);
        };
        
        fetchChapterData();
    }, [novel?.id, chapter?.id, userId, hasActiveSubscription]); // Зависимости

    // --- Применение стилей отступа параграфа (prose-override) ---
    useEffect(() => {
        const styleId = 'paragraph-spacing-style';
        let styleTag = document.getElementById(styleId);
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }
        styleTag.innerHTML = `
            .chapter-content > p {
                margin-top: ${paragraphSpacing}em;
                margin-bottom: ${paragraphSpacing}em;
            }
        `;
        return () => {
            if (styleTag) {
                styleTag.remove();
            }
        };
    }, [paragraphSpacing]);

    // --- Функции Комментариев ---
    
    // Загрузка "Загрузить ещё"
    const loadComments = useCallback(async (loadMore = true) => {
        if (!novel?.id || !chapter?.id || !loadMore) return;
        
        setIsLoadingComments(true);
        const COMMENTS_PER_PAGE = 20;
        const currentPage = commentsPage + 1; 
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
            
            setComments(prev => [...prev, ...newComments]); 
            setCommentsPage(currentPage);
            setHasMoreComments(newComments.length === COMMENTS_PER_PAGE);
        }
        setIsLoadingComments(false);
    }, [novel?.id, chapter?.id, userId, commentsPage]);

    // Перезагрузка *первой* страницы (ИСПОЛЬЗУЕТСЯ ПОСЛЕ ОТПРАВКИ)
    const reloadFirstPageComments = useCallback(async () => {
        if (!novel?.id || !chapter?.id) return;
        
        setIsLoadingComments(true); 
        const COMMENTS_PER_PAGE = 20;
        
        const { data, error } = await supabase
            .from('comments')
            .select(`*, comment_likes (user_id)`)
            .eq('novel_id', novel.id)
            .eq('chapter_number', chapter.id)
            .order('created_at', { ascending: false })
            .range(0, COMMENTS_PER_PAGE - 1);

        if (error) {
            console.error("Ошибка перезагрузки комментариев:", error);
        } else {
            const newComments = data.map(c => ({
                ...c,
                userHasLiked: userId ? c.comment_likes.some(like => like.user_id === userId) : false,
                timestamp: new Date(c.created_at)
            }));
            
            setComments(newComments); 
            setCommentsPage(0);
            setHasMoreComments(newComments.length === COMMENTS_PER_PAGE);
        }
        setIsLoadingComments(false);
    }, [novel?.id, chapter?.id, userId]);

    // Отправка комментария (БЕЗ ПЕРЕЗАГРУЗКИ СТРАНИЦЫ)
    const handleCommentSubmit = useCallback(async (e, parentId = null) => { 
        e.preventDefault();
        const textToSubmit = parentId ? replyText : newComment;
        if (textToSubmit.trim().length === 0 || !userId) return;
        
        const { error } = await supabase
            .from('comments')
            .insert({
                novel_id: novel.id,
                chapter_number: chapter.id,
                user_id: userId,
                user_name: userName || 'Аноним', 
                text: textToSubmit,
                reply_to: parentId
            });

        if (error) {
            console.error("Ошибка отправки комментария:", error);
        } else {
            if (parentId) {
                setReplyText("");
                setReplyingTo(null);
            } else {
                setNewComment("");
            }
            reloadFirstPageComments();
        }
     }, [newComment, replyText, userId, userName, novel?.id, chapter?.id, replyingTo, reloadFirstPageComments]);
     
    // Лайк комментария
    const handleCommentLike = useCallback(async (commentId) => { 
        if (!userId) return;
        
        const originalComments = comments; 
        setComments(prevComments => 
            prevComments.map(c => 
                c.id === commentId 
                ? { ...c, 
                    userHasLiked: !c.userHasLiked, 
                    like_count: c.userHasLiked ? c.like_count - 1 : c.like_count + 1 
                  } 
                : c
            )
        );
        
        const { error } = await supabase.rpc('toggle_comment_like', {
            // p_comment_id теперь bigint, а commentId (из JS) - number,
            // это совместимо
            p_comment_id: commentId 
        });
        
        if(error) {
            console.error("Ошибка лайка комментария:", error);
            setComments(originalComments); 
            alert("Ошибка лайка. Попробуйте снова.");
        }
    }, [userId, comments]);
    
    // --- Другие обработчики ---

    // Лайк главы
    const handleLike = async () => {
        if (!userId) return;
        const alreadyLiked = userHasLiked;
        setUserHasLiked(!alreadyLiked);
        setLikeCount(prev => alreadyLiked ? prev - 1 : prev + 1);

        const { error } = await supabase.rpc('toggle_chapter_like', { 
            p_novel_id: novel.id, 
            p_chapter_number: chapter.id
        });

        if (error) {
            console.error("Ошибка при лайке главы:", error);
            setUserHasLiked(alreadyLiked); 
            setLikeCount(prev => alreadyLiked ? prev + 1 : prev - 1); 
        }
    };

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
            // Ошибки здесь больше не должно быть, т.к. триггер исправлен
            alert("Ошибка обновления. Попробуйте снова.");
        } else {
            setComments(prev => prev.map(c => 
                c.id === commentId ? { ...c, text: data.text } : c
            ));
            setEditingCommentId(null);
            setEditingText("");
        }
    }, [editingText]);
    
    // Удалить комментарий
    const handleDelete = useCallback(async (commentId) => { 
        const originalComments = comments;
        setComments(prev => prev.filter(c => c.id !== commentId));
        
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);
            
        if (error) {
            console.error("Ошибка удаления:", error);
            setComments(originalComments); // Откат
        }
    }, [comments]);
    
    const handleReply = useCallback((commentId) => { 
        setReplyingTo(prev => (prev === commentId ? null : commentId));
        setReplyText("");
    }, []);
    
    const handleChapterClick = (chapterToSelect) => {
        if (chapterToSelect && (!hasActiveSubscription && chapterToSelect.isPaid)) {
            setIsSubModalOpen(true);
        } else if (chapterToSelect) {
            onSelectChapter(chapterToSelect);
            window.scrollTo(0, 0); 
        }
    };
    
    const handlePlanSelect = (plan) => { setSelectedPlan(plan); setIsSubModalOpen(false); };
    
    const handlePaymentMethodSelect = async (method) => { 
        const tg = window.Telegram?.WebApp;
        if (!tg || !userId || !selectedPlan) {
          tg?.showAlert("Произошла ошибка.");
          return;
        }
        tg.showConfirm("Вы будете перенаправлены в бот для завершения оплаты...", async (confirmed) => {
          if (!confirmed) return;
          const { error } = await supabase.from('profiles').upsert({ 
              id: userId, 
              pending_subscription: { ...selectedPlan, method, date: new Date().toISOString() } 
          });
          if(error) console.error("Ошибка обновления pending_subscription:", error);
          
          tg.openTelegramLink(`https://t.me/${botUsername}?start=${userId}`);
          tg.close();
        });
    };
    
    const renderMarkdown = (markdownText) => {
        if (window.marked) return window.marked.parse(markdownText || "");
        return (markdownText || "").replace(/\n/g, '<br />');
    };
    
    // --- ИСПРАВЛЕНИЕ: Обработчики Настроек теперь используют set... из usePersistentState ---
    const handleFontSizeChange = (amount) => {
        onFontSizeChange(amount); // Эта функция из App.jsx, она уже сохраняет
    };
    const handleFontFamilyChange = (font) => {
        setFontFamily(font); // Сохранит в localStorage
    };
    const handleLineHeightChange = (amount) => {
        setLineHeight(prev => Math.max(1.2, Math.min(2.5, parseFloat((prev + amount).toFixed(1))))); // Сохранит в localStorage
    };
    const handleTextAlignChange = (align) => {
        setTextAlign(align); // Сохранит в localStorage
    };
    const handleTextIndentChange = (indent) => {
        setTextIndent(indent); // Сохранит в localStorage
    };
    const handleParagraphSpacingChange = (amount) => {
        setParagraphSpacing(prev => Math.max(0.5, Math.min(2.0, parseFloat((prev + amount).toFixed(1))))); // Сохранит в localStorage
    };

    // --- Переменные для Рендера ---
    const groupedComments = useMemo(() => groupComments(comments), [comments]);
    const currentChapterIndex = allChapters.findIndex(c => c.id === chapter.id);
    const prevChapter = allChapters[currentChapterIndex - 1];
    const nextChapter = allChapters[currentChapterIndex + 1];

    if (!novel || !chapter) return <LoadingSpinner />;

    // --- JSX (Разметка) ---
    return (
      <div className="min-h-screen bg-background text-text-main">
        <Header title={novel.title} onBack={onBack} />
        <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto pb-24">
            <h2 className="text-lg sm:text-xl mb-8 text-center opacity-80 font-sans">{chapter.title}</h2>
            
            <div 
                className="whitespace-normal chapter-content prose dark:prose-invert max-w-none" 
                style={{ 
                    fontSize: `${fontSize}px`,
                    fontFamily: fontFamily,
                    lineHeight: lineHeight,
                    textAlign: textAlign,
                    textIndent: `${textIndent}em`
                }} 
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

        {/* --- Модальное Окно: Настройки (ТЕПЕРЬ РАБОТАЕТ) --- */}
        {showSettings && (
           <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setShowSettings(false)}>
               <div className="absolute bottom-0 left-0 right-0 p-4 rounded-t-2xl bg-component-bg text-text-main" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold text-lg mb-4">Настройки чтения</h3>
                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                          <span>Размер текста</span>
                          <div className="flex items-center gap-2">
                              <button onClick={() => handleFontSizeChange(-1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl font-bold">-</button>
                              <span>{fontSize}</span>
                              <button onClick={() => handleFontSizeChange(1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl font-bold">+</button>
                          </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <span>Шрифт</span>
                          <div className="flex gap-2 flex-wrap">
                              <button onClick={() => handleFontFamilyChange("'JetBrains Mono', monospace")} className={`px-3 py-1 rounded-md text-sm ${fontFamily.includes('JetBrains Mono') ? 'bg-accent text-white' : 'bg-background'}`}>Стандарт</button>
                              <button onClick={() => handleFontFamilyChange("'Montserrat', sans-serif")} className={`px-3 py-1 rounded-md text-sm ${fontFamily.includes('Montserrat') ? 'bg-accent text-white' : 'bg-background'}`}>Montserrat</button>
                              <button onClick={() => handleFontFamilyChange("'Lora', serif")} className={`px-3 py-1 rounded-md text-sm ${fontFamily.includes('Lora') ? 'bg-accent text-white' : 'bg-background'}`}>Lora</button>
                          </div>
                      </div>
                       <div className="flex items-center justify-between">
                          <span>Интервал</span>
                          <div className="flex items-center gap-2">
                              <button onClick={() => handleLineHeightChange(-0.1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl font-bold">-</button>
                              <span>{lineHeight.toFixed(1)}</span>
                              <button onClick={() => handleLineHeightChange(0.1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl font-bold">+</button>
                          </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <span>Выравнивание</span>
                          <div className="flex gap-2">
                              <button onClick={() => handleTextAlignChange('left')} className={`px-3 py-1 rounded-md ${textAlign === 'left' ? 'bg-accent text-white' : 'bg-background'}`}>По левому</button>
                              <button onClick={() => handleTextAlignChange('justify')} className={`px-3 py-1 rounded-md ${textAlign === 'justify' ? 'bg-accent text-white' : 'bg-background'}`}>По ширине</button>
                          </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <span>Красная строка</span>
                           <div className="flex gap-2">
                              <button onClick={() => handleTextIndentChange(0)} className={`px-3 py-1 rounded-md ${textIndent === 0 ? 'bg-accent text-white' : 'bg-background'}`}>Нет</button>
                              <button onClick={() => handleTextIndentChange(1.5)} className={`px-3 py-1 rounded-md ${textIndent === 1.5 ? 'bg-accent text-white' : 'bg-background'}`}>Да</button>
                              <button onClick={() => handleTextIndentChange(3)} className={`px-3 py-1 rounded-md ${textIndent === 3 ? 'bg-accent text-white' : 'bg-background'}`}>Большая</button>
                          </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <span>Отступ абзаца</span>
                          <div className="flex items-center gap-2">
                              <button onClick={() => handleParagraphSpacingChange(-0.1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl font-bold">-</button>
                              <span>{paragraphSpacing.toFixed(1)}</span>
                              <button onClick={() => handleParagraphSpacingChange(0.1)} className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-xl font-bold">+</button>
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