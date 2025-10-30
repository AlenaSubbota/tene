// src/components/pages/BookmarksPage.jsx (Исправленная версия)

import React, { useMemo } from 'react'; // <-- ИЗМЕНЕНИЕ 1: Убрали useState, useEffect
import { supabase } from "../../supabase-config.js";
import { Header } from "../Header.jsx";
import { BookmarkIcon, EyeIcon } from '../icons.jsx';

// --- ИЗМЕНЕНИЕ 2: Принимаем 'novels' (полный список) как пропс ---
export const BookmarksPage = ({ novels, onSelectNovel, bookmarks, onToggleBookmark }) => {
    
    // --- ИЗМЕНЕНИЕ 3: Удалили useState и useEffect. Добавили useMemo. ---
    
    // Загрузка теперь зависит от того, загружены ли 'novels' в App.jsx
    const isLoading = !novels; 

    // Мы просто фильтруем список, который уже есть в App.jsx
    // Этот список УЖЕ содержит актуальные просмотры
    const bookmarkedNovels = useMemo(() => {
        if (!novels || !bookmarks) {
            return [];
        }
        // Находим новеллы, ID которых есть в закладках
        return novels.filter(novel => bookmarks.includes(novel.id));
    }, [novels, bookmarks]); // <-- Зависим от пропсов

    // --- ИЗМЕНЕНИЕ 4: (Конец) Блок useEffect полностью удален ---

    return (
        <div>
            <Header title="Закладки" />
            {isLoading ? (
                <p className="text-center text-text-main opacity-70 mt-8">Загрузка...</p>
            ) : bookmarkedNovels.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-4">
                    {bookmarkedNovels.map((novel, index) => (
                        <div key={novel.id} className="group cursor-pointer animate-fade-in-down" onClick={() => onSelectNovel(novel)} style={{ animationDelay: `${index * 50}ms` }}>
                          <div className="relative transition-all duration-300">
                            <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(novel.id); }} className={`absolute top-2 right-2 z-10 p-1 rounded-full bg-black/30 backdrop-blur-sm text-white transition-colors ${bookmarks.includes(novel.id) ? 'text-accent' : ''}`}>
                              <BookmarkIcon filled={bookmarks.includes(novel.id)} width="20" height="20" />
                            </button>
                            {/* Используем cover_url, как в NovelList */}
                            <img src={`/${novel.cover_url}`} alt={novel.title} className="w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 border border-border-color" />
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <div className="flex-1 min-w-0"> <h2 className="font-semibold text-xs truncate text-text-main">{novel.title}</h2></div>
                              
                              {/* Эта проверка теперь будет работать, т.к. novel.views придет из App.jsx */}
                              {novel.views > 0 && (<div className="flex items-center gap-1 text-xs opacity-60 flex-shrink-0"> <EyeIcon className="w-4 h-4" /> <span>{novel.views}</span></div>)}
                            
                            </div>
                          </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-text-main opacity-70 mt-8">У вас пока нет закладок.</p>
            )}
        </div>
    );
};