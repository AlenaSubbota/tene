// src/components/pages/UpdatePassword.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase-config'; 

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false); 
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 1. Парсим query-параметры
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const type = params.get('type');
    
    // 2. ❗❗❗ ВОТ ИСПРАВЛЕНИЕ ❗❗❗
    // Получаем redirect_to из URL
    const redirectTo = params.get('redirect_to');

    // 3. Проверяем, что это токен для восстановления
    if (type !== 'recovery' || !token) {
      setError('Недействительная или просроченная ссылка. Пожалуйста, запросите сброс пароля заново.');
      setIsReady(false);
      return;
    }

    // 4. Верифицируем токен
    const verifyToken = async () => {
      
      // 5. ❗❗❗ И ПЕРЕДАЕМ ЕГО СЮДА ❗❗❗
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token,
        type: 'recovery',
        redirect_to: redirectTo, // Добавляем этот параметр
      });

      if (verifyError) {
        // Теперь мы должны видеть более конкретную ошибку, если токен неверный
        setError(verifyError.message || 'Недействительная или просроченная ссылка.');
        setIsReady(false);
      } else if (data.session) {
        setIsReady(true);
      }
    };

    verifyToken();
    
  }, [location.search]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    // 6. Обновляем пароль (здесь все без изменений)
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    } else {
      setMessage('Пароль успешно обновлен! Вы будете перенаправлены...');
      await supabase.auth.signOut(); 
      setTimeout(() => {
        navigate('/auth'); 
      }, 3000);
    }
  };

  // --- Рендеринг (без изменений) ---
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-8">Задайте новый пароль</h1>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">
          
          {!isReady ? (
            <div className="flex flex-col items-center gap-4">
              {error ? (
                <p className="text-red-500 text-sm text-center">{error}</p>
              ) : (
                <p>Проверка ссылки...</p>
              )}
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