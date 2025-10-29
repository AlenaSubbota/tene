// src/components/pages/NovelDetails.jsx

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from "../../supabase-config.js";
import { LockIcon, ChatBubbleIcon } from '../icons.jsx'; 
import { Header } from '../Header.jsx';
import { useAuth } from '../../Auth.jsx';
import LoadingSpinner from '../LoadingSpinner.jsx';
import { NovelReviews } from '../NovelReviews.jsx'; 
 
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const VISIBLE_GENRES_COUNT = 4;

export const NovelDetails = ({ 
    novel, onSelectChapter, onTriggerSubscription, onGenreSelect, 
    subscription, botUsername, userId, chapters, isLoadingChapters, 
    lastReadData, onBack, bookmarks, onToggleBookmark,
    isUserAdmin, userName 
}) => {
    const { user } = useAuth();

    // ... (хук для просмотров без изменений) ...
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

    // Состояния
    const [sortOrder, setSortOrder] = useState('newest');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const descriptionRef = useRef(null);
    const [isLongDescription, setIsLongDescription] = useState(false);
    const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
    const [showAllGenres, setShowAllGenres] = useState(false);
    const [activeTab, setActiveTab] = useState('description'); 

    
    // ... (все useMemo без изменений) ...
    const isBookmarked = useMemo(() => {
        if (!novel?.id || !bookmarks) return false;
        return bookmarks.includes(novel.id);
    }, [bookmarks, novel]);
    const novelGenres = Array.isArray(novel?.genres) ? novel.genres : [];
    const hasActiveSubscription = subscription?.expires_at && new Date(subscription.expires_at) > new Date();
    const lastReadChapterId = useMemo(() => (lastReadData && novel && lastReadData[novel.id] ? lastReadData[novel.id].chapterId : null), [lastReadData, novel]);
    const sortedChapters = useMemo(() => {
        if (!Array.isArray(chapters)) return [];
        const chaptersCopy = [...chapters];
        return sortOrder === 'newest' ? chaptersCopy.sort((a, b) => b.id - a.id) : chaptersCopy.sort((a, b) => a.id - b.id);
    }, [chapters, sortOrder]);
    const genresToShow = useMemo(() => {
        if (showAllGenres) {
            return novelGenres;
        }
        return novelGenres.slice(0, VISIBLE_GENRES_COUNT);
    }, [novelGenres, showAllGenres]);
    const hiddenGenresCount = novelGenres.length - genresToShow.length;


    // ... (useEffect для описания без изменений) ...
    useEffect(() => {
        if (descriptionRef.current && activeTab === 'description') { 
            const checkHeight = () => {
                 if (descriptionRef.current) {
                    setIsLongDescription(descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight);
                 }
            }
            const timer = setTimeout(checkHeight, 150);
            window.addEventListener('resize', checkHeight);
            
            return () => { 
                clearTimeout(timer); 
                window.removeEventListener('resize', checkHeight); 
            };
        }
    }, [novel?.description, activeTab]); 

    // ... (все обработчики без изменений) ...
    const handleBookmarkToggle = (e) => { e.stopPropagation(); if (!novel) return; onToggleBookmark(novel.id); };
    const handleChapterClick = (chapter) => { 
        if (!hasActiveSubscription && chapter.isPaid) {
            onTriggerSubscription(); 
        } else {
            onSelectChapter(chapter); 
        }
    };
    const handleContinueReading = () => { if (lastReadChapterId) { const chapterToContinue = chapters.find(c => c.id === lastReadChapterId); if (chapterToContinue) onSelectChapter(chapterToContinue); } };
    
    if (!novel) {
        return <LoadingSpinner />;
    }

    return (
        <div className="bg-background min-h-screen text-text-main font-sans">
            <Header title={novel.title} onBack={onBack} />

            <div key={novel.id} className="animate-fade-in"> 
                <div className="max-w-5xl mx-auto p-4 md:p-8">
                    
                    {/* ... (Блок 1: Обложка, Кнопки, Жанры - без изменений) ... */}
                    <div className="grid grid-cols-12 gap-4 md:gap-8 lg:gap-12 items-start">
                        {/* Левая колонка: Обложка + Кнопки */}
                        <div className="col-span-5 md:col-span-4"> 
                            <img 
                                src={`/${novel.cover_url}`} 
                                alt={novel.title} 
                                className="w-full mx-auto rounded-lg shadow-2xl shadow-black/60 object-cover aspect-[3/4] cursor-pointer transition-transform duration-200 hover:scale-[1.03]"
                                onClick={() => setIsCoverModalOpen(true)}
                            />
                            
                            <div className="mt-4 flex flex-col gap-3 w-full">
                               {lastReadChapterId ? (
                                    <button onClick={handleContinueReading} className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/20 transition-all hover:scale-105 hover:shadow-xl hover:bg-accent-hover text-sm md:text-base">
                                        Продолжить
                                    </button>
                               ) : (
                                   <button onClick={() => sortedChapters.length > 0 && handleChapterClick(sortedChapters[sortedChapters.length - 1])} className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/20 transition-all hover:scale-105 hover:shadow-xl hover:bg-accent-hover text-sm md:text-base">
                                        Читать
                                    </button>
                               )}
                                <button onClick={handleBookmarkToggle} className={`w-full py-3 rounded-lg font-semibold transition-colors text-sm md:text-base ${isBookmarked ? 'bg-accent/20 text-accent border border-accent' : 'bg-component-bg text-text-main hover:bg-border-color'}`}>
                                    {isBookmarked ? 'В закладках' : 'В закладки'}
                                </button>
                            </div>
                        </div>

                        {/* Правая колонка: Заголовок, Автор, ЖАНРЫ */}
                        <div className="col-span-7 md:col-span-8"> 
                            <h1 className="text-xl md:text-4xl font-bold text-text-main text-left">{novel.title}</h1>
                            <p className="text-sm md:text-lg text-text-secondary mt-1 text-left">{novel.author}</p>
                            
                            <div className="mt-4 md:mt-6">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-3">Жанры</h2>
                                <div className="flex flex-wrap gap-2 justify-start">
                                  {genresToShow.map(genre => {
                                      const isHighlighted = genre === '16+' || genre === '18+';
                                      const genreClassName = `text-xs font-semibold px-3 py-1 rounded-md transition-colors duration-200 border ${isHighlighted ? 'border-genre-highlight-border text-genre-highlight-text bg-component-bg' : 'border-border-color text-text-secondary bg-component-bg hover:bg-border-color'}`;
                                      return <button key={genre} onClick={() => onGenreSelect(genre)} className={genreClassName}>{genre}</button>;
                                  })}
                                  
                                  {hiddenGenresCount > 0 && (
                                      <button 
                                          onClick={() => setShowAllGenres(true)} 
                                          className="text-xs font-semibold px-3 py-1 rounded-md text-accent bg-accent/10 hover:bg-accent/20"
                                      >
                                          + {hiddenGenresCount} еще
                                      </button>
                                  )}
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* ... (Блок Описания и Отзывов с табами - без изменений) ... */}
                    <div className="mt-8 md:mt-10 border-t border-border-color">
                        {/* --- Таб-свитчер --- */}
                        <div className="flex border-b border-border-color">
                            <button 
                                onClick={() => setActiveTab('description')} 
                                className={`flex-1 py-3 text-center font-bold transition-colors ${activeTab === 'description' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-main'}`}
                            >
                                Описание
                            </button>
                            <button 
                                onClick={() => setActiveTab('reviews')} 
                                className={`flex-1 py-3 text-center font-bold transition-colors ${activeTab === 'reviews' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-main'}`}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <ChatBubbleIcon className="w-5 h-5" />
                                    Отзывы
                                </span>
                            </button>
                        </div>

                        {/* --- Условный рендер контента табов --- */}
                        
                        {/* Таб 1: Описание */}
                        {activeTab === 'description' && (
                            <div className="pt-6 animate-fade-in">
                                <div ref={descriptionRef} className={`relative overflow-hidden transition-[max-height] duration-500 ease-in-out prose prose-invert prose-sm text-text-secondary max-w-none ${isDescriptionExpanded ? 'max-h-[2000px]' : 'max-h-28'}`}>
                                    <div dangerouslySetInnerHTML={{ __html: novel.description }} />
                                    {!isDescriptionExpanded && isLongDescription && <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-background to-transparent"></div>}
                                </div>
                                {isLongDescription && (
                                    <button onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} className="text-sm font-semibold text-accent hover:text-accent-hover mt-2 hover:underline">
                                        {isDescriptionExpanded ? 'Свернуть' : 'Развернуть...'}
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {/* Таб 2: Отзывы */}
                        {activeTab === 'reviews' && (
                            <div className="animate-fade-in">
                                <NovelReviews 
                                    novelId={novel.id}
                                    userId={userId}
                                    userName={userName}
                                    isUserAdmin={isUserAdmin}
                                />
                            </div>
                        )}
                    </div>


                    {/* --- VVVV --- НАЧАЛО ИЗМЕНЕНИЙ --- VVVV --- */}
                    {/* Блок Главы теперь отображается только если активна вкладка "Описание" */}
                    {activeTab === 'description' && (
                        <div className="mt-8 md:mt-10 border-t border-border-color pt-6 animate-fade-in">
                            <div className="bg-component-bg border border-border-color rounded-lg p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold text-text-main">Главы</h2>
                                    <button onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')} className="text-sm font-semibold text-accent hover:text-accent-hover hover:underline">
                                        {sortOrder === 'newest' ? 'Сначала новые' : 'Сначала старые'}
                                    </button>
                                </div>
                                
                                {isLoadingChapters ? <div className="flex justify-center items-center py-4"><LoadingSpinner /></div> : (
                                    <div className="flex flex-col gap-2">
                                        {sortedChapters.map((chapter, index) => {
                                            const showLock = !hasActiveSubscription && chapter.isPaid;
                                            const isLastRead = lastReadChapterId === chapter.id;
                                            const chapterNumber = sortOrder === 'newest' ? chapters.length - index : index + 1;
                                            
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
                    )}
                    {/* --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЙ --- ^^^^ --- */}

                </div>
            </div>

        
            {isCoverModalOpen && (
                <div 
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fade-in"
                    onClick={() => setIsCoverModalOpen(false)} 
                >
                    <button 
                        onClick={() => setIsCoverModalOpen(false)}
                        className="absolute top-4 right-4 bg-white/20 text-white rounded-full w-10 h-10 font-bold text-2xl leading-none backdrop-blur-sm z-50 hover:bg-white/30 transition-colors"
                        aria-label="Закрыть"
                    >
                        &times;
                    </button>
                    
                    <img 
                        src={`/${novel.cover_url}`} 
                        alt={novel.title} 
                        className="max-w-full max-h-[90vh] w-auto h-auto rounded-lg object-contain shadow-2xl shadow-black/50"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </div>
    );
};