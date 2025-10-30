// src/components/NovelList.jsx

import React from 'react';
// --- VVVV --- ИЗМЕНЕНИЕ: Возвращаем EyeIcon для просмотров --- VVVV ---
import { BookmarkIcon, EyeIcon } from './icons.jsx';
// --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЙ --- ^^^^ ---

export const NovelList = ({ novels, onSelectNovel, bookmarks, onToggleBookmark }) => {

    // Если новеллы еще не загрузились, показываем заглушку
    if (!novels) {
        return <div className="text-center p-4"><p>Загрузка новелл...</p></div>;
    }

    // Если новелл нет (например, по фильтру)
    if (novels.length === 0) {
        return <p className="text-center opacity-70 p-4">Новеллы не найдены.</p>;
    }

    // --- VVVV --- НАЧАЛО ИЗМЕНЕНИЙ (Возвращаем функцию для просмотров) --- VVVV ---
    const formatViews = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num;
    };
    // --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЙ --- ^^^^ ---

    const handleBookmarkToggle = (e, novelId) => {
        e.stopPropagation();
        onToggleBookmark(novelId);
    };

    return (
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4">
              {novels.map((novel, index) => {
                const isBookmarked = bookmarks.includes(novel.id);

                // --- VVVV --- НАЧАЛО ИЗМЕНЕНИЙ (Получаем рейтинг и просмотры) --- VVVV ---
                const avgRating = novel.average_rating || 0.0;
                // Предполагаем, что просмотры приходят в поле 'views'
                const views = novel.views || 0; 
                // --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЙ --- ^^^^ ---

                return (
                  <div key={novel.id} onClick={() => onSelectNovel(novel)} className="relative group cursor-pointer animate-fade-in-down" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105 border border-border-color">
                      <img src={`/${novel.cover_url}`} alt={novel.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>

                      <button
                        onClick={(e) => handleBookmarkToggle(e, novel.id)}
                        className={`absolute top-2 right-2 z-10 p-1.5 rounded-full transition-colors ${isBookmarked ? 'bg-accent/90 text-white' : 'bg-black/40 text-white/80 hover:bg-black/60'}`}
                      >
                        <BookmarkIcon filled={isBookmarked} className="w-5 h-5" />
                      </button>

                      {/* --- VVVV --- НАЧАЛО ИЗМЕНЕНИЙ (Плашка рейтинга - меняем цвет) --- VVVV --- */}
{avgRating > 0 && (
  <div className="absolute top-2 left-2 flex items-center gap-1 bg-accent backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs font-bold">
    {/* Иконка сердца УДАЛЕНА по вашему скриншоту */}
    <span>{Number(avgRating).toFixed(1)}</span>
  </div>
)}
{/* --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЙ --- ^^^^ --- */}
                      

                      {/* --- VVVV --- НАЧАЛО ИЗМЕНЕНИЙ (Добавляем просмотры) --- VVVV --- */}
                      {views > 0 && (
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs font-bold">
                          <EyeIcon className="w-4 h-4" />
                          <span>{formatViews(views)}</span>
                        </div>
                      )}
                      {/* --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЙ --- ^^^^ --- */}

                    </div>
                    {/* --- VVVV --- НАЧАЛО ИЗМЕНЕНИЙ (Убираем автора) --- VVVV --- */}
                    <div className="mt-2">
                      <h3 className="font-semibold text-sm text-text-main truncate group-hover:text-accent">{novel.title}</h3>
                      {/* <p>{novel.author}</p> <-- Эта строка УДАЛЕНА по вашей просьбе */}
                    </div>
                    {/* --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЙ --- ^^^^ --- */}
                  </div>
                );
              })}
            </div>
    );
}