// src/components/pages/SearchPage.jsx (Supabase версия)

import React, { useState, useMemo } from 'react';
// --- ИЗМЕНЕНИЕ: Убираем импорты Firebase ---
import { Header } from "../Header.jsx";
import { SearchIcon, BookmarkIcon, EyeIcon } from '../icons.jsx';

// --- ИЗМЕНЕНИЕ: Принимаем 'novels' как пропс, убираем загрузку ---
export const SearchPage = ({ novels, onSelectNovel, bookmarks, onToggleBookmark }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    // isLoading больше не нужен, т.к. данные приходят готовыми
    const isLoading = !novels; 

    // Фильтрация остается без изменений
    const filteredNovels = useMemo(() => {
        if (!searchQuery || !novels) {
            return [];
        }
        return novels.filter(novel => novel.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }, [novels, searchQuery]);

    return (
        <div>
            <Header title="Поиск" />
            <div className="p-4">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <SearchIcon className="text-text-main opacity-50" />
                    </div>
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-component-bg border-border-color border rounded-lg py-2 pl-10 pr-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                </div>
            </div>
            
            {isLoading ? (
                <div className="text-center p-8"><p>Загрузка...</p></div>
            ) : (
                <>
                    {searchQuery && (
                        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 p-4 text-text-main">
                            {filteredNovels.map((novel, index) => (
                                <div key={novel.id} onClick={() => onSelectNovel(novel)} className="cursor-pointer group animate-fade-in-down" style={{ animationDelay: `${index * 50}ms` }}>
                                  <div className="relative transition-all duration-300">
                                    <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(novel.id); }} className={`absolute top-2 right-2 z-10 p-1 rounded-full bg-black/30 backdrop-blur-sm text-white transition-colors ${bookmarks.includes(novel.id) ? 'text-accent' : ''}`}>
                                      <BookmarkIcon filled={bookmarks.includes(novel.id)} width="20" height="20" />
                                    </button>
                                    <img src={`/${novel.cover_url}`} alt={novel.title} className="w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 border border-border-color" />
                                    <div className="flex items-center justify-between mt-2 gap-2">
                                      <div className="flex-1 min-w-0"> <h2 className="font-semibold text-xs truncate text-text-main">{novel.title}</h2></div>
                                      {novel.views > 0 && (<div className="flex items-center gap-1 text-xs opacity-60 flex-shrink-0"> <EyeIcon className="w-4 h-4" /> <span>{novel.views}</span></div>)}
                                    </div>
                                  </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {searchQuery && filteredNovels.length === 0 && (
                        <p className="text-center text-text-main opacity-70 mt-8">Ничего не найдено</p>
                    )}
                    {!searchQuery && (
                        <p className="text-center text-text-main opacity-70 mt-8">Начните вводить название новеллы...</p>
                    )}
                </>
            )}
        </div>
    );
}