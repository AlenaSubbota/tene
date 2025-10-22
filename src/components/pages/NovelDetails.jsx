import React, { useState, useMemo, useEffect, useRef } from 'react';
// Предполагается, что эти импорты настроены правильно в вашем проекте.
// В этом примере они заменены на заглушки, чтобы код был самодостаточным.
// import { supabase } from "../../supabase-config.js";
// import { LockIcon } from '../icons.jsx';
// import { Header } from '../Header.jsx';
// import { SubscriptionModal } from '../SubscriptionModal.jsx';
// import { PaymentMethodModal } from '../PaymentMethodModal.jsx';
// import { useAuth } from '../../Auth.jsx';


// --- КОМПОНЕНТЫ-ЗАГЛУШКИ ДЛЯ ДЕМОНСТРАЦИИ ---

// --- КОМПОНЕНТЫ-ЗАГЛУШКИ ДЛЯ ДЕМОНСТРАЦИИ ---

const LockIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2V10a2 2 0 00-2-2h-1V6a4 4 0 00-4-4zm2 6V6a2 2 0 10-4 0v2h4z" clipRule="evenodd" /></svg> );
const Header = ({ title, onBack }) => (
    <div className="sticky top-0 z-10 flex items-center p-4 bg-background/80 backdrop-blur-sm border-b border-border-color">
        <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-component-bg transition-colors">&larr;</button>
        <h1 className="text-lg font-bold truncate">{title}</h1>
    </div>
);
const SubscriptionModal = ({ onClose, onSelectPlan }) => ( <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"><div className="bg-component-bg border border-border-color rounded-lg p-6 text-text-main max-w-sm w-full"><h2 className="text-2xl font-bold mb-4">Требуется подписка</h2><p className="mb-6 text-text-secondary">Для доступа к этой главе, пожалуйста, оформите подписку.</p><div className="flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 rounded-md bg-border-color hover:opacity-80 transition-opacity">Закрыть</button><button onClick={() => onSelectPlan({ id: 1, name: 'Premium' })} className="px-4 py-2 rounded-md bg-accent text-white hover:bg-accent-hover transition-colors font-semibold">Выбрать план</button></div></div></div>);
const PaymentMethodModal = ({ onClose, onSelectMethod, plan }) => ( <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"><div className="bg-component-bg border border-border-color rounded-lg p-6 text-text-main max-w-sm w-full"><h2 className="text-2xl font-bold mb-2">Оплата: {plan.name}</h2><p className="mb-6 text-text-secondary">Выберите удобный способ оплаты.</p><button onClick={() => onSelectMethod('telegram_stars')} className="w-full text-left p-3 rounded-md mb-4 bg-border-color hover:opacity-80 transition-opacity">Оплатить через Telegram</button><div className="flex justify-end"><button onClick={onClose} className="px-4 py-2 rounded-md bg-border-color hover:opacity-80 transition-opacity">Отмена</button></div></div></div>);
const useAuth = () => ({ user: { id: 'test-user-id' } });
const supabase = { rpc: async () => console.log('Supabase RPC called') };
const formatDate = (dateString) => { if (!dateString) return ''; const date = new Date(dateString); return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }); };


// --- ОСНОВНОЙ КОМПОНЕНТ С ИСПРАВЛЕНИЯМИ ---
export const NovelDetails = ({ novel, onSelectChapter, onGenreSelect, subscription, botUsername, userId, chapters, isLoadingChapters, lastReadData, onBack }) => {
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
    // ++ НОВОЕ СОСТОЯНИЕ ДЛЯ ЗАКЛАДКИ
    const [isBookmarked, setIsBookmarked] = useState(false); 

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 50);
        return () => clearTimeout(timer);
    }, []);

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
        return sortOrder === 'newest' ? chaptersCopy.sort((a, b) => b.id - a.id) : chaptersCopy.sort((a, b) => a.id - a.id);
    }, [chapters, sortOrder]);
    
    // ++ НОВЫЙ ОБРАБОТЧИК ДЛЯ ЗАКЛАДКИ
    const handleBookmarkToggle = () => {
        setIsBookmarked(prev => !prev);
        // Здесь будет ваша логика для сохранения в Supabase или localStorage
        console.log('Bookmark status changed:', !isBookmarked);
    };

    const handleChapterClick = (chapter) => { if (!hasActiveSubscription && chapter.isPaid) setIsSubModalOpen(true); else onSelectChapter(chapter); };
    const handleContinueReading = () => { if (lastReadChapterId) { const chapterToContinue = chapters.find(c => c.id === lastReadChapterId); if (chapterToContinue) onSelectChapter(chapterToContinue); } };
    const handlePlanSelect = (plan) => { setSelectedPlan(plan); setIsSubModalOpen(false); };
    const handlePaymentMethodSelect = async (method) => { console.log({ selectedPlan, method }); setSelectedPlan(null);};
    
    if (!novel) {
        return (
            <div className="bg-background text-text-main min-h-screen">
                <Header title="Загрузка..." onBack={onBack} />
                <p className="text-center p-4">Загрузка данных...</p>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen text-text-main font-sans">
            {/* ++ ВОЗВРАЩЕН ВАШ HEADER */}
            <Header title={novel.title} onBack={onBack} />

            <div className={`transition-opacity duration-700 ease-in ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
                {/* ++ Вся контентная часть теперь обернута для центрирования */}
                <div className="max-w-5xl mx-auto p-4 md:p-8">
                    {/* Верхний блок: обложка и информация */}
                    <div className="md:grid md:grid-cols-12 md:gap-8 lg:gap-12 items-start">
                        <div className="md:col-span-4 text-center">
                            <img src={`/${novel.cover_url}`} alt={novel.title} className="w-full max-w-[280px] mx-auto rounded-lg shadow-2xl shadow-black/60 object-cover aspect-[3/4]"/>
                            <div className="mt-6 flex flex-col gap-3 max-w-[280px] mx-auto">
                               {lastReadChapterId ? (
                                    <button onClick={handleContinueReading} className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/20 transition-all hover:scale-105 hover:shadow-xl hover:bg-accent-hover">
                                        Продолжить чтение
                                    </button>
                               ) : (
                                   <button onClick={() => sortedChapters.length > 0 && handleChapterClick(sortedChapters[sortedChapters.length - 1])} className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/20 transition-all hover:scale-105 hover:shadow-xl hover:bg-accent-hover">
                                        Читать
                                    </button>
                               )}
                                {/* ++ ИЗМЕНЕННАЯ КНОПКА ЗАКЛАДКИ */}
                                <button onClick={handleBookmarkToggle} className={`w-full py-3 rounded-lg font-semibold transition-colors ${isBookmarked ? 'bg-accent/20 text-accent border border-accent' : 'bg-component-bg text-text-main hover:bg-border-color'}`}>
                                    {isBookmarked ? 'В закладках' : 'Добавить в закладки'}
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-8 mt-8 md:mt-0">
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
                                 <div ref={descriptionRef} className={`relative overflow-hidden transition-all duration-700 ease-in-out prose prose-invert prose-sm text-text-secondary max-w-none ${isDescriptionExpanded ? 'max-h-[1000px]' : 'max-h-28'}`}>
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
                    </div>

                    {/* ++ Нижний блок: Главы (теперь он отдельный и центрированный) */}
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

            {isSubModalOpen && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSelectPlan={handlePlanSelect} />}
            {selectedPlan && <PaymentMethodModal onClose={() => setSelectedPlan(null)} onSelectMethod={handlePaymentMethodSelect} plan={selectedPlan} />}
        </div>
    );
};



