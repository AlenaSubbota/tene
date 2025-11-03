// src/components/pages/UpdatePassword.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Добавляем useSearchParams
import { supabase } from '../../supabase-config';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false); // Для показа формы
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Получаем параметры из URL

  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    const redirectTo = searchParams.get('redirect_to'); // Получаем redirect_to

    console.log("Token:", token); 
    console.log("Type:", type); 
    console.log("Redirect To:", redirectTo); 

    if (token && type === 'recovery') {
      
      // ИСПРАВЛЕННЫЙ ВЫЗОВ:
      supabase.auth
        .verifyOtp({
          token,
          type, // 'recovery'
          redirect_to: redirectTo, // <-- Просто передаем redirect_to
        })
        .then(({ data, error }) => {
          if (error) {
            console.error('Ошибка verifyOtp:', error);
            setError('Недействительная или просроченная ссылка. Пожалуйста, запросите сброс пароля заново.');
          } else {
            // Успех! Сессия установлена.
            setIsReady(true); // Показываем форму
          }
        });
    } else {
      // Нет токена или неправильный тип
      setError('Недействительная или просроченная ссылка. Пожалуйста, запросите сброс пароля заново.');
    }
  }, [searchParams]); // Зависимость от searchParams

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isReady) { // Дополнительная проверка
      setError('Сессия не подтверждена. Пожалуйста, проверьте ссылку.');
      return;
    }
    setError('');
    setMessage('');
    setIsSubmitting(true);

    // Пытаемся обновить пароль. Если verifyOtp сработал,
    // то сессия должна быть установлена, и updateUser сработает.
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error('Ошибка обновления пароля:', error);
      setError(error.message);
    } else {
      setMessage('Пароль успешно обновлен! Вы будете перенаправлены...');
      // Выходим из системы, чтобы пользователь вошёл с новым паролем
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-8">Задайте новый пароль</h1>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">

          {error ? (
            <p className="text-red-500 text-sm text-center">{error}</p>
          ) : !isReady ? (
            <p>Проверка ссылки...</p>
          ) : (
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