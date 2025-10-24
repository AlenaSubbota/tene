import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from "../../supabase-config.js";
import { LockIcon } from '../icons.jsx';
import { Header } from '../Header.jsx';
import { SubscriptionModal } from '../SubscriptionModal.jsx';
import { PaymentMethodModal } from '../PaymentMethodModal.jsx';
import { useAuth } from '../../Auth.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';
 
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const NovelDetails = ({ novel, onSelectChapter, onGenreSelect, subscription, botUsername, userId, chapters, isLoadingChapters, lastReadData, onBack, bookmarks, onToggleBookmark }) => {
    const { user } = useAuth();

    // --- ВАШ ФУНКЦИОНАЛ ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ ---
    useEffect(() => {
        if (user && novel?.id) {
            const viewedKey = `viewed-${novel.id}`;
            if (!sessionStorage.getItem(viewedKey)) {
                sessionStorage.setItem(viewedKey, 'true');
                const increment = async () => {
                    const { error } = await supabase.rpc('increment_views', { novel_id_to_inc: novel.id });
                    if(error) console.error("Ошибка обновления счетчика просмотров:", error);
                };
                increment();
            }
        }
    }, [novel, user]);

    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [sortOrder, setSortOrder] = useState('newest');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const descriptionRef = useRef(null);
    const [isLongDescription, setIsLongDescription] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    
    // --- НАЧАЛО ИЗМЕНЕНИЙ (МОДАЛЬНОЕ ОКНО ОБЛОЖКИ) ---
    const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
    // --- КОНЕЦ ИЗМЕНЕНИЙ (МОДАЛЬНОЕ ОКНО ОБЛОЖКИ) ---

    
    const isBookmarked = useMemo(() => {
        if (!novel?.id || !bookmarks) return false;
        return bookmarks.includes(novel.id);
    }, [bookmarks, novel]);

    const handleBookmarkToggle = (e) => {
        e.stopPropagation(); 
        if (!novel) return;
        onToggleBookmark(novel.id);
    };


   useEffect(() => {
        if (novel) {
            const timer = setTimeout(() => setIsMounted(true), 50);
            return () => clearTimeout(timer);
        } else {
            setIsMounted(false);
        }
    }, [novel]); 

    const novelGenres = Array.isArray(novel?.genres) ? novel.genres : [];
    const hasActiveSubscription = subscription?.expires_at && new Date(subscription.expires_at) > new Date();

    const lastReadChapterId = useMemo(() => (lastReadData && novel && lastReadData[novel.id] ? lastReadData[novel.id].chapterId : null), [lastReadData, novel]);

    useEffect(() => {
        if (descriptionRef.current) {
            const checkHeight = () => setIsLongDescription(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight);
            const timer = setTimeout(checkHeight, 150);
            window.addEventListener('resize', checkHeight);
            return () => { clearTimeout(timer); window.removeEventListener('resize', checkHeight); };
        }
    }, [novel?.description, isDescriptionExpanded]);

    const sortedChapters = useMemo(() => {
        if (!Array.isArray(chapters)) return [];
        const chaptersCopy = [...chapters];
        return sortOrder === 'newest' ? chaptersCopy.sort((a, b) => b.id - a.id) : chaptersCopy.sort((a, b) => a.id - b.id);
    }, [chapters, sortOrder]);

    const handleChapterClick = (chapter) => { if (!hasActiveSubscription && chapter.isPaid) setIsSubModalOpen(true); else onSelectChapter(chapter); };
    const handleContinueReading = () => { if (lastReadChapterId) { const chapterToContinue = chapters.find(c => c.id === lastReadChapterId); if (chapterToContinue) onSelectChapter(chapterToContinue); } };
    const handlePlanSelect = (plan) => { setSelectedPlan(plan); setIsSubModalOpen(false); };
    const handlePaymentMethodSelect = async (method) => { console.log({ selectedPlan, method }); setSelectedPlan(null);};
    
    if (!novel) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-background min-h-screen text-text-main font-sans">
            <Header title={novel.title} onBack={onBack} />

            <div className={`transition-opacity duration-700 ease-in ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
                <div className="max-w-5xl mx-auto p-4 md:p-8">
                    
                    {/* --- НАЧАЛО ИЗМЕНЕНИЙ (СЕТКА) --- */}
                    {/* 1. 'md:grid' -> 'grid' (сетка всегда)
                      2. 'md:grid-cols-12' -> 'grid-cols-12' (12 колонок всегда)
                      3. Добавлен 'gap-4' для мобильных
                    */}
                    <div className="grid grid-cols-12 gap-4 md:gap-8 lg:gap-12 items-start">
                        
                        {/* 1. 'md:col-span-8' -> 'col-span-7 md:col-span-8' 
                             (7/12 на мобильных, 8/12 на десктопе)
                        */}
                        <div className="col-span-7 md:col-span-8">
                            <h1 className="text-4xl md:text-5xl font-bold text-text-main">{novel.title}</h1>
                            <p className="text-lg text-text-secondary mt-1">{novel.author}</p>
                            
                            <div className="flex flex-wrap gap-2 my-6">
                               {novelGenres.map(genre => {
                                    const isHighlighted = genre === '16+' || genre === '18+';
                                    const genreClassName = `text-xs font-semibold px-3 py-1 rounded-md transition-colors duration-200 border ${isHighlighted ? 'border-genre-highlight-border text-genre-highlight-text bg-component-bg' : 'border-border-color text-text-secondary bg-component-bg hover:bg-border-color'}`;
                                    return <button key={genre} onClick={() => onGenreSelect(genre)} className={genreClassName}>{genre}</button>;
                                })}
                            </div>

                            <div className="border-t border-border-color pt-6">
                                 <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-3">Описание</h2>
                                 <div ref={descriptionRef} className={`relative overflow-hidden transition-all duration-700 ease-in-out prose prose-invert prose-sm text-text-secondary max-w-none ${isDescriptionExpanded ? 'max-h-[9999px]' : 'max-h-28'}`}>
                                    <div dangerouslySetInnerHTML={{ __html: novel.description }} />
                                    {!isDescriptionExpanded && isLongDescription && <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background to-transparent"></div>}
                                </div>
                                {isLongDescription && (
                                    <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="text-sm font-semibold text-accent hover:text-accent-hover mt-2 hover:underline">
                                        {isDescriptionExpanded ? 'Свернуть' : 'Развернуть...'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 1. 'md:col-span-4' -> 'col-span-5 md:col-span-4' 
                             (5/12 на мобильных, 4/12 на десктопе)
                          2. Убран 'mt-8 md:mt-0', так как он больше не нужен
                        */}
                        <div className="col-span-5 md:col-span-4 text-center">
                            {/* 1. Убраны 'max-w-[280px]' и 'mx-auto'
                              2. Добавлен 'cursor-pointer' и 'onClick'
                            */}
                            <img 
                                src={`/${novel.cover_url}`} 
                                alt={novel.title} 
                                className="w-full rounded-lg shadow-2xl shadow-black/60 object-cover aspect-[3/4] cursor-pointer transition-transform duration-200 hover:scale-[1.03]"
                                onClick={() => setIsCoverModalOpen(true)}
                            />
                            {/* 1. Убраны 'max-w-[280px]' и 'mx-auto'
                            */}
                            <div className="mt-6 flex flex-col gap-3 w-full">
                               {lastReadChapterId ? (
                                    <button onClick={handleContinueReading} className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/20 transition-all hover:scale-105 hover:shadow-xl hover:bg-accent-hover">
                                        Продолжить чтение
                                    </button>
                               ) : (
                                   <button onClick={() => sortedChapters.length > 0 && handleChapterClick(sortedChapters[sortedChapters.length - 1])} className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/20 transition-all hover:scale-105 hover:shadow-xl hover:bg-accent-hover">
                                        Читать
                                    </button>
                               )}
                                <button onClick={handleBookmarkToggle} className={`w-full py-3 rounded-lg font-semibold transition-colors ${isBookmarked ? 'bg-accent/20 text-accent border border-accent' : 'bg-component-bg text-text-main hover:bg-border-color'}`}>
                                    {isBookmarked ? 'В закладках' : 'Добавить в закладки'}
                                </button>
                            </div>
                        </div>
                        
                        {/* --- КОНЕЦ ИЗМЕНЕНИЙ (СЕТКА) --- */}
                    </div>

                    {/* Блок со списком глав остается без изменений */}
                    <div className="mt-10 border-t border-border-color pt-6">
                        <div className="bg-component-bg border border-border-color rounded-lg p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-text-main">Главы</h2>
                                <button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="text-sm font-semibold text-accent hover:text-accent-hover hover:underline">
                                    {sortOrder === 'newest' ? 'Сначала новые' : 'Сначала старые'}
                                </button>
                            </div>
                            
                            {isLoadingChapters ? <p className="text-center text-text-secondary py-4">Загрузка глав...</p> : (
                                <div className="flex flex-col gap-2">
                                    {sortedChapters.map((chapter) => {
                                        const showLock = !hasActiveSubscription && chapter.isPaid;
                                        const isLastRead = lastReadChapterId === chapter.id;
                                        const chapterNumber = chapters.findIndex(c => c.id === chapter.id) + 1;
                                        return (
                                            <div key={chapter.id} onClick={() => handleChapterClick(chapter)} className={`p-3 rounded-lg cursor-pointer transition-all duration-300 border flex items-center justify-between hover:bg-background ${isLastRead ? 'bg-accent/10 border-accent/50' : 'border-transparent'}`}>
                                                <div className="flex items-center gap-4">
                                                    <span className={`font-mono text-sm ${isLastRead ? 'text-accent' : 'text-text-secondary'}`}>{String(chapterNumber).padStart(2, '0')}</span>
                                                    <div>
                                                        <p className={`font-semibold ${showLock ? 'text-text-secondary' : 'text-text-main'}`}>{chapter.title}</p>
                                                        <p className="text-text-secondary text-xs mt-1">{formatDate(chapter.published_at)}</p>
                                                    </div>
                                                </div>
                                                {showLock && <LockIcon className="text-text-secondary" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Модальные окна подписки */}
            {isSubModalOpen && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSelectPlan={handlePlanSelect} />}
            {selectedPlan && <PaymentMethodModal onClose={() => setSelectedPlan(null)} onSelectMethod={handlePaymentMethodSelect} plan={selectedPlan} />}
        
            {/* --- НАЧАЛО ИЗМЕНЕНИЙ (МОДАЛЬНОЕ ОКНО ОБЛОЖКИ) --- */}
            {isCoverModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
                    onClick={() => setIsCoverModalOpen(false)} 
                >
                    {/* Кнопка закрытия */}
                    <button 
                        onClick={() => setIsCoverModalOpen(false)}
                        className="absolute top-4 right-4 bg-white/20 text-white rounded-full w-10 h-10 font-bold text-2xl leading-none backdrop-blur-sm z-50"
                        aria-label="Закрыть"
                    >
                        &times;
                    </button>
                    
                    {/* Изображение */}
                    <img 
                        src={`/${novel.cover_url}`} 
                        alt={novel.title} 
                        className="max-w-full max-h-[90vh] w-auto h-auto rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()} // Остановка клика, чтобы не закрыть модалку
                    />
                </div>
            )}
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ (МОДАЛЬНОЕ ОКНО ОБЛОЖКИ) --- */}
        </div>
    );
};