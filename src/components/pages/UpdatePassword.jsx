// src/components/pages/UpdatePassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabase-config';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Шаг 1: Верификация токена при загрузке
  useEffect(() => {
    const verifyToken = async () => {
      setIsVerifying(true);
      
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      // --- НОВОЕ РЕШЕНИЕ (ИЩЕМ EMAIL ВНУТРИ REDIRECT_TO) ---
      const redirectToUrlString = searchParams.get('redirect_to');
      let emailParam = null;

      if (redirectToUrlString) {
        try {
          // searchParams.get() автоматически декодирует redirect_to один раз
          // (из %2540 в %40).
          const redirectUrl = new URL(redirectToUrlString);
          emailParam = redirectUrl.searchParams.get('email'); // Получаем 'darsisa%40bk.ru'
        } catch (e) {
          console.error("Не удалось распарсить redirect_to:", e);
        }
      }
      // --- КОНЕЦ РЕШЕНИЯ ---

      if (!token || !emailParam || type !== 'recovery') {
        setError('Недействительная или неполная ссылка для сброса пароля.');
        setIsVerifying(false);
        return;
      }

      // emailParam все еще закодирован ('darsisa%40bk.ru'),
      // декодируем его, чтобы получить 'darsisa@bk.ru'
      const email = decodeURIComponent(emailParam);

      console.log(`Вызываем verifyOtp с email: ${email} и token: ${token}`);

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token,
        type,
        email: email, // Отправляем 'darsisa@bk.ru'
      });

      if (verifyError) {
        console.error("Ошибка verifyOtp:", verifyError.message);
        setError('Ссылка недействительна или срок ее действия истек. Пожалуйста, запросите новую.');
      } else {
        console.log("Успешная верификация (verifyOtp)! Сессия создана.");
        setIsVerified(true); // Успех!
      }
      setIsVerifying(false);
    };

    verifyToken();
  }, [searchParams]);

  // Шаг 2: Обработчик формы (остается без изменений)
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
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }
    setIsSubmitting(false);
  };

  // Логика отображения (остается без изменений)
  const renderContent = () => {
    if (isVerifying) {
      return <p className="text-text-main/70">Проверка ссылки...</p>;
    }
    
    if (error) {
      return <p className="text-red-500 text-sm text-center">{error}</p>;
    }
    
    if (isVerified) {
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
    
    return <p className="text-text-main/70">Не удалось проверить сессию.</p>;
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