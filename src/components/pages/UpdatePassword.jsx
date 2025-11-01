// src/components/pages/UpdatePassword.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase-config';
import { useAuth } from '../../Auth'; // <-- 1. ИМПОРТИРУЕМ useAuth

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Для блокировки кнопки
  const navigate = useNavigate();
  
  // 2. ПОЛУЧАЕМ 'user' И 'loading' ИЗ AuthProvider
  // 'loading' здесь означает "AuthProvider еще не закончил первую проверку сессии"
  // 'user' будет установлен, когда AuthProvider поймает 'PASSWORD_RECOVERY'
  const { user, loading: authLoading } = useAuth();

  // 3. НОВОЕ СОСТОЯНИЕ ДЛЯ ОЖИДАНИЯ
  // Мы должны подождать, пока authLoading не станет false, И user не станет true.
  // Но если authLoading стал false, а user все еще null, значит, ссылка невалидная.
  const [isReady, setIsReady] = useState(false);
  
  // 4. НОВЫЙ useEffect ДЛЯ ПРОВЕРКИ СЕССИИ
  useEffect(() => {
    if (authLoading) {
      // AuthProvider еще не загрузился, просто ждем.
      return;
    }

    // AuthProvider загрузился.
    if (user) {
      // Отлично, AuthProvider поймал событие PASSWORD_RECOVERY
      // и установил временную сессию.
      setIsReady(true);
    } else {
      // AuthProvider загрузился, но user === null.
      // Это значит, что мы на странице /update-password
      // без валидного токена.
      setError('Недействительная или просроченная ссылка. Пожалуйста, запросите сброс пароля заново.');
      setIsReady(false); // Не даем показать форму
    }

    // authLoading изменится с true на false
    // user изменится с null на {...}
  }, [user, authLoading]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true); // Блокируем кнопку

    // Теперь мы *уверены*, что сессия установлена,
    // потому что 'user' из useAuth() существует.
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setIsSubmitting(false); // Разблокируем
    } else {
      setMessage('Пароль успешно обновлен! Вы будете перенаправлены...');
      
      // Принудительно выходим, чтобы "убить" сессию восстановления
      await supabase.auth.signOut(); 
      
      setTimeout(() => {
        // Переходим на /auth
        navigate('/auth'); 
      }, 3000);
    }
  };

  // 5. ОБНОВЛЕННАЯ ЛОГИКА РЕНДЕРИНГА
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-8">Задайте новый пароль</h1>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">
          
          {!isReady ? (
            // Состояние 1: Либо authLoading, либо ошибка
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
                disabled={isSubmitting || !!message} // Блокируем при отправке или успехе
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