// src/components/LoadingSpinner.jsx

import React from 'react';
import Lottie from 'lottie-react'; // Импортируем компонент Lottie
import readingGirlAnimation from '../assets/reading_girl_animation.json'; // Импортируем вашу JSON-анимацию

const LoadingSpinner = () => {
  const defaultOptions = {
    loop: true, // Анимация будет повторяться бесконечно
    autoplay: true, // Анимация будет воспроизводиться автоматически
    animationData: readingGirlAnimation, // Ваш JSON-файл
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice' // Настройка масштабирования
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100"> {/* Добавим легкий фон */}
      <div style={{ width: 300, height: 300 }}> {/* Определяем размеры для Lottie контейнера */}
        <Lottie
          animationData={readingGirlAnimation} // Передаем данные анимации
          loop={true} // Указываем, что анимация должна зацикливаться
          autoplay={true} // Указываем, что анимация должна воспроизводиться автоматически
        />
      </div>
    </div>
  );
};

export default LoadingSpinner;