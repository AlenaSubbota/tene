// src/components/NovelList.jsx (Supabase версия)

import React from 'react';
import { BookmarkIcon, EyeIcon } from './';

// --- ИЗМЕНЕНИЕ: Убираем всю внутреннюю логику загрузки. ---
// Компонент теперь просто принимает готовый массив новелл и отображает его.
// Это делает его намного проще и быстрее.
export const NovelList = ({ novels, onSelectNovel, bookmarks, onToggleBookmark }) => {
    
    // Если новеллы еще не загрузились, показываем заглушку
    if (!novels) {
        return <div className="text-center p-4"><p>Загрузка новелл...</p></div>;
    }
    
    // Если новелл нет (например, по фильтру)
    if (novels.length === 0) {
        return <p className="text-center opacity-70 p-4">Новеллы не найдены.</p>;
    }

    return (
        <div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 p-4 text-text-main">
              {novels.map((novel, index) => (
                <div key={novel.id} onClick={() => onSelectNovel(novel)} className="cursor-pointer group animate-fade-in-down" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="relative transition-all duration-300">
                    <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(novel.id); }} className={`absolute top-2 right-2 z-10 p-1 rounded-full bg-black/30 backdrop-blur-sm text-white transition-colors ${bookmarks.includes(novel.id) ? 'text-accent' : ''}`}>
                      <BookmarkIcon filled={bookmarks.includes(novel.id)} width="20" height="20" />
                    </button>
                    {/* --- ИЗМЕНЕНИЕ: Добавляем проверку на новое имя поля cover_url --- */}
                    <img src={`/${novel.coverUrl || novel.cover_url}`} alt={novel.title} className="w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 border border-border-color" />
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="flex-1 min-w-0">
                          <h2 className="font-semibold text-xs truncate text-text-main">{novel.title}</h2>
                      </div>
                      {/* --- ИЗМЕНЕНИЕ: Просмотры теперь в novel.views --- */}
                      {novel.views > 0 && (
                        <div className="flex items-center gap-1 text-xs opacity-60 flex-shrink-0">
                          <EyeIcon className="w-4 h-4" />
                          <span>{novel.views}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Кнопка "Показать еще" больше не нужна, так как App.jsx загружает все новеллы сразу */}
        </div>
    );
}