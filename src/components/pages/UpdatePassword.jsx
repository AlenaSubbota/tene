// src/components/pages/UpdatePassword.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase-config'; 

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true); // Всегда начинаем с загрузки
  const navigate = useNavigate();

  useEffect(() => {
    let recoveryEventReceived = false;

    // Подписываемся на события Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Это наше событие! Supabase прочел токен из URL (даже если URL уже "чистый")
        // и установил временную сессию.
        recoveryEventReceived = true;
        setLoading(false); // Показываем форму
      }
    });

    // Устанавливаем таймер. Если за 5 секунд событие не пришло,
    // значит, ссылка действительно невалидная или истекла.
    const timer = setTimeout(() => {
      if (!recoveryEventReceived) {
         // Мы все еще в состоянии 'loading' и не получили событие
         setError('Недействительная или просроченная ссылка. Пожалуйста, запросите сброс пароля заново.');
         setLoading(false); // Показываем ошибку
      }
    }, 5000); // 5 секунд ожидания

    return () => {
      // Очистка при размонтировании компонента
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []); // Пустой массив зависимостей, запускается только один раз при монтировании

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Теперь эта функция будет вызвана с активной сессией восстановления
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Пароль успешно обновлен! Вы будете перенаправлены на главную.');
      
      // Принудительно выходим из системы, чтобы "убить" сессию восстановления
      await supabase.auth.signOut(); 
      
      setTimeout(() => {
        // Переходим на главную (которая теперь покажет /auth, т.к. мы вышли)
        navigate('/'); 
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-8">Задайте новый пароль</h1>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">
          
          {loading ? (
            // Состояние 1: Идет проверка ссылки
            <div className="flex flex-col items-center gap-4">
              <p>Проверка ссылки...</p>
              {/* Ты можешь добавить сюда свой LoadingSpinner, если хочешь */}
            </div>
          ) : (
            // Состояние 2: Проверка завершена (успех или ошибка)
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Новый пароль"
                className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
                required
                disabled={!!message} // Блокируем после успеха
              />
              
              {/* Показываем ошибку ИЛИ сообщение об успехе */}
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              {message && <p className="text-green-500 text-sm text-center">{message}</p>}
              
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                // Блокируем кнопку, если есть ошибка или уже есть сообщение об успехе
                disabled={!!message || !!error} 
              >
                Сохранить пароль
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};