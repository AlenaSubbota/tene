// src/components/pages/UpdatePassword.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase-config'; // Импортируем supabase напрямую

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false); // Готовность к показу формы
  const navigate = useNavigate();
  
  // 1. Получаем доступ к URL
  const location = useLocation();

  // 2. Этот useEffect запускается один раз при загрузке страницы
  useEffect(() => {
    // 3. Парсим query-параметры (то, что после "?")
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const type = params.get('type');

    // 4. Проверяем, что это токен для восстановления
    if (type !== 'recovery' || !token) {
      setError('Недействительная или просроченная ссылка. Пожалуйста, запросите сброс пароля заново.');
      setIsReady(false); // Не показываем форму
      return;
    }

    // 5. Ключевой шаг: Вручную верифицируем токен
    // Этот метод обменяет токен из URL на сессию
    const verifyToken = async () => {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token,
        type: 'recovery',
      });

      if (verifyError) {
        // Токен невалидный или просрочен
        setError('Недействительная или просроченная ссылка. Пожалуйста, попробуйте еще раз.');
        setIsReady(false);
      } else if (data.session) {
        // Отлично! Токен валиден, сессия установлена.
        // supabase-js сохранил ее. Теперь мы можем менять пароль.
        setIsReady(true);
      }
    };

    verifyToken();
    
    // location.search гарантирует, что эффект сработает, если URL изменится
  }, [location.search]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    // 6. Теперь мы уверены, что сессия установлена (благодаря verifyOtp)
    // Просто обновляем пароль
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    } else {
      setMessage('Пароль успешно обновлен! Вы будете перенаправлены...');
      
      // Принудительно выходим, чтобы "убить" сессию восстановления
      await supabase.auth.signOut(); 
      
      setTimeout(() => {
        navigate('/auth'); 
      }, 3000);
    }
  };

  // Логика рендеринга (остается почти без изменений)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-8">Задайте новый пароль</h1>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">
          
          {!isReady ? (
            // Состояние 1: Либо проверка, либо ошибка
            <div className="flex flex-col items-center gap-4">
              {error ? (
                <p className="text-red-500 text-sm text-center">{error}</p>
              ) : (
                <p>Проверка ссылки...</p>
              )}
            </div>
          ) : (
            // Состояние 2: Готово к вводу пароля
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Новый пароль"
                className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
                required
                disabled={isSubmitting || !!message}
              />
              
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              {message && <p className="text-green-500 text-sm text-center">{message}</p>}
              
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                disabled={isSubmitting || !!message} 
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить пароль'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};