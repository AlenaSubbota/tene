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

                const avgRating = novel.average_rating || 0.0;
                const views = novel.views || 0; 

                return (
                  <div key={novel.id} onClick={() => onSelectNovel(novel)} className="relative group cursor-pointer animate-fade-in-down" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105 border border-border-color">
                      <img src={`/${novel.cover_url}`} alt={novel.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t"></div>

                      <button
                        onClick={(e) => handleBookmarkToggle(e, novel.id)}
                        // Изменяем размер кнопки и иконки закладки
                        className={`absolute top-1.5 right-1.5 z-10 p-1 rounded-full transition-colors ${isBookmarked ? 'bg-accent/90 text-white' : 'bg-black/40 text-white/80 hover:bg-black/60'}`}
                      >
                        {/* Уменьшаем иконку закладки с w-5 h-5 до w-4 h-4 */}
                        <BookmarkIcon filled={isBookmarked} className="w-4 h-4" /> 
                      </button>

{avgRating > 0 && (
  // Изменяем padding, шрифт и размер иконки внутри плашки рейтинга
  <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-accent backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
    <span>{Number(avgRating).toFixed(1)}</span>
  </div>
)}
                      
{views > 0 && (
  // Изменяем padding, шрифт и размер иконки внутри плашки просмотров
  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold">
    {/* Уменьшаем иконку глаза с w-4 h-4 до w-3.5 h-3.5 */}
    <EyeIcon className="w-3.5 h-3.5" />
    <span>{formatViews(views)}</span>
  </div>
)}

                    </div>
                    <div className="mt-1"> {/* Уменьшаем отступ сверху mt-2 до mt-1 */}
                      {/* Уменьшаем размер текста заголовка с text-sm до text-xs */}
                      <h3 className="font-semibold text-xs text-text-main truncate group-hover:text-accent">{novel.title}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
    );
}