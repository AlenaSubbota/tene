// src/components/pages/UpdatePassword.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// УБИРАЕМ useSearchParams
import { supabase } from '../../supabase-config';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // УДАЛЯЕМ ВЕСЬ useEffect. 
  // onAuthStateChange в Auth.jsx сам обработает токен.
  // Мы просто должны показать форму.

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Пароль не может быть пустым');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setMessage('');

    // Этот вызов сработает, потому что onAuthStateChange 
    // УЖЕ создал сессию для сброса пароля
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error("Ошибка обновления пароля:", error);
      // Если ошибка 403, значит, ссылка истекла
      if (error.status === 403 || error.message.includes("invalid")) {
        setError('Ссылка недействительна или срок ее действия истек. Пожалуйста, запросите новую ссылку.');
      } else {
        setError('Не удалось обновить пароль. Попробуйте еще раз.');
      }
    } else {
      setMessage('Пароль успешно обновлен! Вы будете перенаправлены на страницу входа.');
      setTimeout(() => {
        navigate('/'); 
      }, 3000);
    }
    setIsSubmitting(false);
  };
  
  // Рендеринг JSX
  return (
     <div className="flex justify-center items-center min-h-screen bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-8">Задайте новый пароль</h1>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">
          
          {/* Показываем форму СРАЗУ (isReady: true по умолчанию) */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Показываем ошибки/сообщения ВНУТРИ формы */}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {message && <p className="text-green-500 text-sm text-center">{message}</p>}

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Новый пароль"
              className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
              required
              disabled={isSubmitting || !!message}
            />
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
              disabled={isSubmitting || !!message}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить пароль'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};