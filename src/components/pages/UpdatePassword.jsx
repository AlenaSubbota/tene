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
    const type = searchParams.get('type');
    
    // --- НОВОЕ ИСПРАВЛЕНИЕ: ПАРСИМ EMAIL ИЗ REDIRECT_TO ---
    let email = null;
    const redirectUrlString = searchParams.get('redirect_to');

    if (redirectUrlString) {
      try {
        // Создаем URL-объект из строки redirect_to
        const redirectUrl = new URL(redirectUrlString);
        // Достаем email из параметров *этого* URL
        email = redirectUrl.searchParams.get('email');
      } catch (e) {
        console.error("Не удалось распарсить redirect_to URL:", e);
      }
    }
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

    console.log("Token из URL (?):", token); 
    console.log("Type из URL (?):", type);
    console.log("Email (распарсенный из redirect_to):", email); // <-- Новый лог

    // Условие теперь должно сработать
    if (token && type === 'recovery' && email) { 
      
      supabase.auth
        .verifyOtp({
          token,
          type, // 'recovery'
          email, // <-- Теперь email должен быть здесь
        })
        .then(({ data, error }) => {
          if (error) {
            console.error("Ошибка verifyOtp:", error.message);
            // Если снова 400 Bad Request, значит токен уже использован
            if (error.message.includes("400")) {
               setError('Эта ссылка уже была использована или срок ее действия истек. Пожалуйста, запросите сброс пароля еще раз.');
            } else {
               setError('Ссылка для восстановления пароля недействительна.');
            }
          } else {
            console.log("verifyOtp success, data:", data);
            // Успех! Устанавливаем сессию и разрешаем ввод пароля
            setIsReady(true);
          }
        });
    } else {
        setError('Неверная ссылка для восстановления пароля (не удалось найти токен, тип или email).');
        console.log("Token, type='recovery' или email не найдены.");
    }
  }, [searchParams]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Пароль не может быть пустым');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setMessage('');

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
  
  // Рендеринг JSX (остается без изменений)
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