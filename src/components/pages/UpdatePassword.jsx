// src/components/pages/UpdatePassword.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabase-config';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // --- НАШ ХИТРЫЙ ПЛАН ---
    // 1. Ищем токены в параметрах `?`
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    // 2. Если они там есть...
    if (token && type === 'recovery') {
      console.log('Найдены токены в URL (?). Перемещаем их в хэш (#)...');
      
      // 3. ...пересобираем URL, чтобы токены были в хэше
      // Вместо ?token=...&type=...
      // делаем #token=...&type=...
      // (Мы используем access_token, т.к. onAuthStateChange ищет именно его)
      const newHash = `access_token=${token}&type=${type}`;
      
      // 4. Перезагружаем страницу с новым URL
      // (replace() не сохраняет старый URL в истории браузера)
      window.location.replace(`${window.location.pathname}#${newHash}`);
      
      // Важно: после этого страница перезагрузится, 
      // onAuthStateChange в Auth.jsx "съест" хэш, 
      // и этот useEffect больше не выполнится (т.к. ?token=... исчезнет)
    }
    // 5. Если токенов в `?` нет, просто ничего не делаем.
    // Это значит, что страница загрузилась либо уже с хэшем,
    // либо сессия установлена, и мы просто ждем ввода пароля.

  }, [searchParams]); // Зависим от searchParams

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Пароль не может быть пустым');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setMessage('');

    // Теперь этот вызов ДОЛЖЕН найти сессию
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error("Ошибка обновления пароля:", error);
      if (error.message.includes("session missing")) {
         setError('Сессия истекла. Пожалуйста, запросите новую ссылку.');
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
  
  // Рендеринг JSX (как в прошлый раз)
  return (
     <div className="flex justify-center items-center min-h-screen bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-8">Задайте новый пароль</h1>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
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