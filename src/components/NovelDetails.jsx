import React from 'react';
import { Header } from './Header';
import { LockIcon, ArrowRightIcon } from './icons';

export const NovelDetails = ({ novel, onSelectChapter, onGenreSelect, subscription, chapters, isLoadingChapters, lastReadData, onBack }) => {
    if (!novel) {
        return (
            <div>
                <Header title="Загрузка..." onBack={onBack} />
                <div className="p-4 text-center">Загрузка данных о новелле...</div>
            </div>
        );
    }

    const lastReadChapter = lastReadData?.[novel.id];
    const hasActiveSubscription = subscription && new Date(subscription.endDate.seconds * 1000) > new Date();

    return (
        <div className="animate-slide-in-right">
            <Header title={novel.title} onBack={onBack} />
            <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">
                    <img src={`/tene/${novel.coverUrl}`} alt={novel.title} className="w-32 h-auto mx-auto sm:mx-0 rounded-lg shadow-lg border border-border-color" />
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl font-bold text-text-main">{novel.title}</h1>
                        <p className="text-sm opacity-80 mt-1">{novel.author}</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                            {novel.genres.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => onGenreSelect(genre)}
                                    className="px-3 py-1 text-xs font-medium rounded-full bg-background border border-border-color hover:bg-border-color transition-colors"
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-90">{novel.description}</p>
            </div>

            <div className="px-4 pb-4">
                {lastReadChapter && (
                     <button
                        onClick={() => onSelectChapter(novel.id, lastReadChapter.chapterId)}
                        className="flex items-center justify-between w-full p-4 mb-4 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors"
                    >
                        <div>
                            <p className="font-semibold text-accent">Продолжить чтение</p>
                            <p className="text-sm opacity-80">{lastReadChapter.chapterTitle}</p>
                        </div>
                        <ArrowRightIcon className="text-accent" />
                    </button>
                )}
                <h3 className="text-lg font-bold mb-3">Главы</h3>
                <div className="border border-border-color rounded-lg overflow-hidden">
                    {isLoadingChapters ? (
                        <div className="p-4 text-center opacity-70">Загрузка глав...</div>
                    ) : (
                        chapters.map((chapter, index) => {
                            const isLocked = chapter.paid && !hasActiveSubscription;
                            return (
                                <button
                                    key={chapter.id}
                                    onClick={() => onSelectChapter(novel.id, chapter.id)}
                                    disabled={isLocked}
                                    className={`flex items-center justify-between w-full text-left p-4 transition-colors duration-200 ${isLocked ? 'bg-background text-text-main/50 cursor-not-allowed' : 'hover:bg-background'} ${index !== chapters.length - 1 ? 'border-b border-border-color' : ''}`}
                                >
                                    <span>{chapter.title}</span>
                                    {isLocked && <LockIcon />}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};