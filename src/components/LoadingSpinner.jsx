// src/components/LoadingSpinner.jsx

import React from 'react';

// Определяем стили для анимаций прямо в файле.
// Это позволяет нам использовать их в JSX.
const styles = `
  @keyframes page-turn {
    0%, 100% { transform: rotateY(0deg); }
    50% { transform: rotateY(-180deg); }
  }

  .book-page {
    transform-origin: left center;
    animation: page-turn 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  @keyframes dot-fade {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 1; }
  }

  .dot-1 { animation: dot-fade 1.5s infinite; animation-delay: 0s; }
  .dot-2 { animation: dot-fade 1.5s infinite; animation-delay: 0.2s; }
  .dot-3 { animation: dot-fade 1.5s infinite; animation-delay: 0.4s; }
`;

const LoadingSpinner = () => {
  return (
    <>
      {/* Вставляем наши стили в head документа */}
      <style>{styles}</style>
      
      {/* Основной контейнер, центрирует все по экрану */}
      <div className="flex flex-col justify-center items-center h-screen bg-background text-text-main">
        
        {/* Анимированная иконка книги */}
        <div className="relative w-20 h-16 mb-6">
          {/* Левая страница и обложка */}
          <div className="absolute w-10 h-16 bg-component-bg border-2 border-border-color rounded-r-md left-1/2"></div>
          {/* Правая страница и обложка */}
          <div className="absolute w-10 h-16 bg-component-bg border-2 border-border-color rounded-l-md right-1/2"></div>
          {/* Переворачивающаяся страница (используем акцентный цвет) */}
          <div className="book-page absolute w-10 h-16 bg-accent rounded-r-md left-1/2"></div>
        </div>

        {/* Анимированный текст */}
        <p className="text-lg font-semibold text-text-main flex items-center">
          Загрузка новелл
          <span className="dot-1">.</span>
          <span className="dot-2">.</span>
          <span className="dot-3">.</span>
        </p>
      </div>
    </>
  );
};

export default LoadingSpinner;