// src/components/pages/UpdatePassword.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabase-config';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false); 
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const typeFromUrl = searchParams.get('type'); // Будет 'recovery'
    
    let email = null;
    const redirectUrlString = searchParams.get('redirect_to');
    if (redirectUrlString) {
      try {
        const redirectUrl = new URL(redirectUrlString);
        const email_encoded = redirectUrl.searchParams.get('email');
        if (email_encoded) {
          email = decodeURIComponent(email_encoded);
        }
      } catch (e) {
        console.error("Не удалось распарсить redirect_to URL:", e);
      }
    }

    console.log("Token:", token); 
    console.log("Email (раскодированный):", email);
    console.log("Тип из URL (для проверки):", typeFromUrl);

    if (token && email && typeFromUrl === 'recovery') { 
      
      // --- ГЛАВНОЕ ИЗМЕНЕНИЕ ---
      // Тип в URL - 'recovery'. Мы *обязаны* использовать 'recovery'
      // Это аутентифицирует пользователя и создает сессию.
      console.log("Вызываем verifyOtp с type: 'recovery'...");

      supabase.auth
        .verifyOtp({
          token,
          email,
          type: 'recovery', // <-- ВОТ ПРАВИЛЬНЫЙ ТИП
        })
        .then(({ data, error }) => {
          if (error) {
            console.error("Ошибка verifyOtp:", error.message);
            // Вот ТЕПЕРЬ, если эта ошибка все еще есть,
            // это 100% бот notisend.
            setError('Ссылка недействительна или срок ее действия истек. Пожалуйста, запросите новую ссылку.');
          } else {
            // УСПЕХ! Пользователь теперь вошел в систему (сессия создана)
            console.log("verifyOtp success, data:", data);
            // Теперь можно показать форму для ввода пароля.
            setIsReady(true);
          }
        });
    } else {
        setError('Неверная ссылка для восстановления пароля (не найден токен, тип или email).');
    }
  }, [searchParams]); // Зависимость правильная
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Пароль не может быть пустым');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setMessage('');

    // Этот вызов updateUser теперь сработает, т.к. verifyOtp
    // с type: 'recovery' создал сессию
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error("Ошибка обновления пароля:", error);
      setError('Не удалось обновить пароль. Попробуйте еще раз.');
    } else {
      setMessage('Пароль успешно обновлен! Вы будете перенаправлены на страницу входа.');
      setTimeout(() => {
        navigate('/'); 
      }, 3000);
    }
    setIsSubmitting(false);
  };
  
  // Рендеринг JSX (как в самом первом варианте)
  return (
     <div className="flex justify-center items-center min-h-screen bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-8">Задайте новый пароль</h1>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">
          {error ? (
            <p className="text-red-500 text-sm text-center">{error}</p>
          ) : !isReady ? (
            <p className="text-text-main/70">Проверка ссылки...</p>
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