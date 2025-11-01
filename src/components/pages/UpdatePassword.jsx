// src/components/pages/UpdatePassword.jsx

import React, { useState, useEffect } from 'react'; // <-- Импортируем useEffect
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase-config'; 

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true); // <-- Добавляем состояние загрузки
  const navigate = useNavigate();

  // -- VVVV -- ДОБАВЛЕННЫЙ БЛОК -- VVVV --
  // Этот useEffect будет ждать, пока Supabase обработает токен из URL
  useEffect(() => {
    // Проверяем, есть ли вообще хэш в URL.
    // Если хэша нет, пользователь зашел сюда случайно.
    const hasHash = window.location.hash.includes('access_token');
    if (!hasHash) {
        setError('Недействительная ссылка. Пожалуйста, запросите сброс пароля заново.');
        setLoading(false);
        return; // Прерываем выполнение useEffect
    }

    // Хэш есть, подписываемся на событие
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Это событие срабатывает, когда Supabase УСПЕШНО
        // прочитал #access_token из URL.
        // Теперь вызов updateUser() будет работать.
        setLoading(false);
      }
    });

    // Добавим таймаут на случай, если токен невалидный
    // и событие 'PASSWORD_RECOVERY' никогда не придет.
    const timer = setTimeout(() => {
        if (loading) { // Если мы все еще ждем...
           setError('Недействительная или просроченная ссылка. Пожалуйста, запросите сброс пароля заново.');
           setLoading(false);
        }
    }, 5000); // 5 секунд ожидания

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer); // Очищаем таймер при размонтировании
    };
  }, [loading]); // 'loading' в зависимостях, чтобы перезапустить таймер (хотя можно и пустой массив)
  // -- ^^^^ -- КОНЕЦ ДОБАВЛЕННОГО БЛОКА -- ^^^^ --


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Эта функция теперь будет вызвана только ПОСЛЕ
    // того, как 'PASSWORD_RECOVERY' установил сессию.
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Пароль успешно обновлен! Вы будете перенаправлены на главную.');
      setTimeout(() => {
        navigate('/'); // Перенаправляем на главную страницу через 3 секунды
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-8">Задайте новый пароль</h1>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">
          
          {/* -- VVVV -- ИЗМЕНЕНА ЛОГИКА РЕНДЕРА -- VVVV -- */}
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <p>Проверка вашей сессии...</p>
              {/* Можешь добавить сюда свой компонент LoadingSpinner, если хочешь */}
            </div>
          ) : (
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
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              {message && <p className="text-green-500 text-sm text-center">{message}</p>}
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                // Блокируем на время загрузки, при ошибке или успехе
                disabled={loading || !!message || !!error} 
              >
                Сохранить пароль
              </button>
            </form>
          )}
          {/* -- ^^^^ -- КОНЕЦ ИЗМЕНЕНИЙ -- ^^^^ -- */}

        </div>
      </div>
    </div>
  );
};