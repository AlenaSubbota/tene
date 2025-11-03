// src/components/pages/UpdatePassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabase-config';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false); 

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [recoveryData, setRecoveryData] = useState(null);
  const [isHuman, setIsHuman] = useState(false); 

  // ШАГ 1: useEffect ТЕПЕРЬ ПАРСИТ ВСЕ
  useEffect(() => {
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    // --- ПАРСИМ EMAIL ---
    let email = null;
    const redirectUrlString = searchParams.get('redirect_to');
    
    if (redirectUrlString) {
      try {
        const redirectUrl = new URL(redirectUrlString);
        const email_encoded = redirectUrl.searchParams.get('email');
        if (email_encoded) {
          email = decodeURIComponent(email_encoded); // Двойное раскодирование
        }
      } catch (e) {
        console.error("Не удалось распарсить redirect_to URL:", e);
      }
    }

    if (token && type === 'recovery' && email) {
      // Сохраняем ВСЕ
      setRecoveryData({ token, type, email });
      console.log("Токен, тип и email найдены в URL.");
    } else {
      setError('Неверная ссылка (отсутствует токен, тип или email).');
      console.log("Ошибочка парсинга:", { token, type, email });
    }
  }, [searchParams]);

  // ШАГ 2: ОБРАБОТЧИК ВЕРИФИКАЦИИ
  const handleVerifyLink = async () => {
    if (!recoveryData) {
      setError('Ошибка: данные для восстановления не найдены.');
      return;
    }
    setIsVerifying(true);
    setError('');
    
    const { token, type, email } = recoveryData;
    console.log("Вызываем verifyOtp с type: 'recovery' (И С EMAIL)...");
    
    // --- ФИНАЛЬНАЯ КОМБИНАЦИЯ: token + type + email ---
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token,
      type, // 'recovery'
      email, // <-- ВОЗВРАЩАЕМ EMAIL
    });

    if (verifyError) {
      console.error("Ошибка verifyOtp:", verifyError.message);
      setError('Ссылка недействительна или срок ее действия истек. Пожалуйста, запросите новую ссылку.');
      setIsVerifying(false);
    } else {
      console.log("verifyOtp success!");
      setIsReady(true);
      setIsVerifying(false);
    }
  };

  // ШАГ 3: ОБРАБОТЧИК ФОРМЫ (без изменений)
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

  // ШАГ 4: JSX (без изменений, с чекбоксом)
  const renderContent = () => {
    if (error) {
      return <p className="text-red-500 text-sm text-center">{error}</p>;
    }
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
    if (recoveryData) {
      return (
        <div className="flex flex-col gap-4 items-center">
          <div className="flex items-center gap-2 self-center">
            <input
              type="checkbox"
              id="is-human"
              checked={isHuman}
              onChange={(e) => setIsHuman(e.target.checked)}
              className="h-4 w-4 rounded border-border-color text-accent focus:ring-accent"
            />
            <label htmlFor="is-human" className="text-text-main/70 text-sm">
              Я подтверждаю, что я не робот
            </label>
          </div>
          <button
            onClick={handleVerifyLink}
            className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
            disabled={isVerifying || !isHuman} 
          >
            {isVerifying ? 'Проверка...' : 'Подтвердить'}
          </button>
        </div>
      );
    }
    return <p className="text-text-main/70">Проверка ссылки...</p>;
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