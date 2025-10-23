// src/components/NovelList.jsx (Supabase версия)

import React from 'react';
import { BookmarkIcon, EyeIcon } from './';
// --- ИМПОРТЫ ДЛЯ СИНХРОНИЗАЦИИ ---
import { useAuth } from '../Auth.jsx'; // Добавили, чтобы получить user
import { useBookmarks } from './pages/BookmarksPage'; // Добавили главный хук

// --- ИЗМЕНЕНИЕ: Убираем 'bookmarks' и 'onToggleBookmark' из props ---
export const NovelList = ({ novels, onSelectNovel }) => {
        
    // --- ИЗМЕНЕНИЕ: Получаем глобальное состояние закладок ---
    const { user } = useAuth();
    // Хук useBookmarks вернет нам актуальный список закладок и функции для их изменения
    const { bookmarks, addBookmark, removeBookmark } = useBookmarks(user ? user.id : null);
    
    // Если новеллы еще не загрузились, показываем заглушку
    if (!novels) {
        return <div className="text-center p-4"><p>Загрузка новелл...</p></div>;
    }
    
    // Если новелл нет (например, по фильтру)
    if (novels.length === 0) {
        return <p className="text-center opacity-70 p-4">Новеллы не найдены.</p>;
    }

    const formatViews = (num) => {
      if (num === null || num === undefined) return '0';
      try {
        // Используем Intl.NumberFormat для красивого сокращения
        return new Intl.NumberFormat('en-US', {
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(num);
      } catch (e) {
        return num.toString();
      }
    };
    
    return (
        <div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 p-4 text-text-main">
              {novels.map((novel, index) => {
                
                // --- ИЗМЕНЕНИЕ: Логика для КАЖДОЙ новеллы ---
                
                // 1. Проверяем, есть ли эта новелла в ГЛОБАЛЬНОМ массиве закладок
                // (раньше тут была проверка bookmarks.includes(novel.id))
                const isBookmarked = bookmarks ? bookmarks.some(b => b.id === novel.id) : false;

                // 2. Создаем обработчик, который использует ГЛОБАЛЬНЫЕ функции
                const handleBookmarkToggle = (e) => {
                    e.stopPropagation(); // Остановка клика, чтобы не перейти на страницу новеллы
                    if (isBookmarked) {
                        removeBookmark(novel.id); // Удаляем по ID
                    } else {
                        addBookmark(novel); // Добавляем весь ОБЪЕКТ новеллы
                    }
                };
                // --- КОНЕЦ ИЗМЕНЕНИЙ ---

                return (
                  <div key={novel.id} onClick={() => onSelectNovel(novel)} className="cursor-pointer group animate-fade-in-down" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="relative transition-all duration-300">
                      
                      {/* --- ИЗМЕНЕНИЕ: Используем новую логику --- */}
                      <button 
                        onClick={handleBookmarkToggle} 
                        className={`absolute top-2 right-2 z-10 p-1 rounded-full bg-black/30 backdrop-blur-sm text-white transition-colors ${isBookmarked ? 'text-accent' : ''}`}
                      >
                        <BookmarkIcon filled={isBookmarked} width="20" height="20" />
                      </button>
                      
                      {/* --- Ваш остальной код без изменений --- */}
                      <img src={`/${novel.coverUrl || novel.cover_url}`} alt={novel.title} className="w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 border border-border-color" />
                      <div className="flex items-center justify-between mt-2 gap-2">
                        <div className="flex-1 min-w-0">
                            <h2 className="font-semibold text-xs truncate text-text-main">{novel.title}</h2>
                        </div>
                        {novel.views > 0 && (
                          <div className="flex items-center gap-1 text-xs opacity-60 flex-shrink-0">
                            <EyeIcon className="w-4 h-4" />
                            <span>{formatViews(novel.views)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
    );
}