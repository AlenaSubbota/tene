// src/components/pages/UpdatePassword.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabase-config';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [isVerifying, setIsVerifying] = useState(false); // Для кнопки "Проверить"
  const [isSubmitting, setIsSubmitting] = useState(false); // Для кнопки "Сохранить"
  
  // isReady теперь означает, что ссылка проверена и можно вводить пароль
  const [isReady, setIsReady] = useState(false); 
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // --- НОВОЕ СОСТОЯНИЕ ДЛЯ ДАННЫХ ИЗ URL ---
  const [recoveryData, setRecoveryData] = useState(null);

  // --- ШАГ 1: useEffect ТЕПЕРЬ ТОЛЬКО ПАРСИТ URL ---
  useEffect(() => {
    const token = searchParams.get('token');
    const typeFromUrl = searchParams.get('type');
    
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

    if (token && email && typeFromUrl === 'recovery') {
      // Просто сохраняем данные, НЕ вызываем verifyOtp
      setRecoveryData({ token, email, type: 'email' }); // Важно: type: 'email'
    } else {
      setError('Неверная ссылка для восстановления пароля (не найден токен, тип или email).');
    }
  }, [searchParams]);
  
  // --- ШАГ 2: НОВЫЙ ОБРАБОТЧИК ДЛЯ ВЕРИФИКАЦИИ ---
  const handleVerifyLink = async () => {
    if (!recoveryData) {
      setError('Ошибка: данные для восстановления не найдены.');
      return;
    }

    setIsVerifying(true);
    setError('');

    const { token, email, type } = recoveryData;

    console.log("Вызываем verifyOtp с type: 'email'...");

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token,
      email,
      type, // <-- Здесь будет 'email', как мы и сохранили
    });

    if (verifyError) {
      console.error("Ошибка verifyOtp:", verifyError.message);
      setError('Ссылка недействительна или срок ее действия истек. Пожалуйста, запросите новую ссылку.');
      setIsVerifying(false);
    } else {
      console.log("verifyOtp success!");
      // УСПЕХ! Показываем форму для ввода пароля
      setIsReady(true); 
      setIsVerifying(false);
    }
  };

  // --- ШАГ 3: ОБРАБОТЧИК ФОРМЫ ОСТАЕТСЯ ПРЕЖНИМ ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... (весь ваш код handleSubmit остается без изменений) ...
    
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
  
  // --- ШАГ 4: ОБНОВЛЕННЫЙ JSX ---
  const renderContent = () => {
    if (error) {
      return <p className="text-red-500 text-sm text-center">{error}</p>;
    }
    
    // Если isReady === true, показываем форму ввода пароля
    if (isReady) {
      return (
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
      );
    }

    // Если isReady === false и данные из URL есть, показываем кнопку верификации
    if (recoveryData) {
      return (
        <div className="flex flex-col gap-4 items-center">
           <p className="text-text-main/70">Нажмите, чтобы подтвердить ссылку.</p>
           <button
             onClick={handleVerifyLink}
             className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
             disabled={isVerifying}
           >
             {isVerifying ? 'Проверка...' : 'Подтвердить'}
           </button>
        </div>
      );
    }
    
    // По умолчанию (пока парсится URL или если была ошибка парсинга)
    return <p className="text-text-main/70">Загрузка...</p>;
  };

  return (
     <div className="flex justify-center items-center min-h-screen bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-8">Задайте новый пароль</h1>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};