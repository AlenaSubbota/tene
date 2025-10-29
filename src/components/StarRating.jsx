// src/components/StarRating.jsx
import React, { useState } from 'react';

// --- VVVV --- НОВАЯ ИКОНКА: Звезда --- VVVV ---
// Встроенная SVG-иконка для "красивой звезды"
const StarIcon = ({ className, filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-full h-full ${className}`}
  >
    {filled ? (
      // Заполненная звезда
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006Z"
        clipRule="evenodd"
      />
    ) : (
      // Пустая звезда (только контур)
      <path
        fillRule="evenodd"
        d="M11.21 4.21a.75.75 0 0 1 1.58 0l2.082 5.006 5.404.434a.75.75 0 0 1 .416 1.298l-4.117 3.527 1.257 5.273a.75.75 0 0 1-1.12.822L12 18.354l-4.71 2.855a.75.75 0 0 1-1.12-.822l1.257-5.273-4.117-3.527a.75.75 0 0 1 .416-1.298l5.404-.434L11.21 4.21Z"
        clipRule="evenodd"
      />
    )}
  </svg>
);
// --- ^^^^ --- КОНЕЦ ИКОНКИ --- ^^^^ ---


export const StarRating = ({ initialRating = 0, onRatingSet }) => {
  // Используем ТОЛЬКО hover-состояние.
  // 'initialRating' приходит из App.jsx и является "источником правды".
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (newRating) => {
    // Позволяем сбросить оценку, если кликнуть по той же звезде
    if (newRating === initialRating) {
      onRatingSet(0); // 0 = "удалить мою оценку"
    } else {
      onRatingSet(newRating);
    }
  };

  return (
    <div className="flex items-center gap-1.5"> {/* gap-1.5 чуть свободнее, чем gap-1 */}
      {[1, 2, 3, 4, 5].map((index) => {
        
        // Звезда "активна" (заполнена), если:
        // 1. На нее наведен курсор (hoverRating)
        // 2. Или (если курсор не наведен) она является частью initialRating
        const isFilled = (hoverRating || initialRating) >= index;

        return (
          <button
            key={index}
            onClick={() => handleClick(index)}
            onMouseEnter={() => setHoverRating(index)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform duration-150 ease-in-out hover:scale-125 focus:outline-none"
            aria-label={`Оценка ${index}`}
          >
            {/* --- VVVV --- ИЗМЕНЕНИЕ: Уменьшаем размер до w-6 h-6 --- VVVV --- */}
            <StarIcon
              className={`w-6 h-6 ${
                isFilled
                  ? 'text-amber-500' // Классический "золотой" цвет для рейтинга
                  : 'text-text-secondary/30' // Цвет пустой звезды (из вашего кода)
              }`}
              filled={isFilled}
            />
            {/* --- ^^^^ --- КОНЕЦ ИЗМЕНЕНИЯ --- ^^^^ --- */}
          </button>
        );
      })}
    </div>
  );
};