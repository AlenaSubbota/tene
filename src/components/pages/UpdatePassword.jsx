// src/components/pages/UpdatePassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabase-config';

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(true); // Новое состояние
  const [isVerified, setIsVerified] = useState(false);  // Новое состояние
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Шаг 1: Верификация токена при загрузке
  useEffect(() => {
    const verifyToken = async () => {
      setIsVerifying(true);
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      const emailParam = searchParams.get('email'); // email будет закодирован (darsisa%40bk.ru)

      if (!token || !emailParam || type !== 'recovery') {
        setError('Недействительная или неполная ссылка для сброса пароля.');
        setIsVerifying(false);
        return;
      }

      // --- ЭТО КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ ИЗ НАШЕЙ ПЕРВОЙ ПОПЫТКИ ---
      // Мы должны декодировать email ПЕРЕД отправкой в Supabase
      const email = decodeURIComponent(emailParam);
      // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

      console.log(`Вызываем verifyOtp с email: ${email} и token: ${token}`);

      // Вызываем verifyOtp с декодированным email
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

  // Шаг 2: Обработчик формы для ОБНОВЛЕНИЯ пароля
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Пароль не может быть пустым');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setMessage('');

    // Теперь, когда сессия активна, мы можем обновить пользователя
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
        navigate('/'); // Переход на логин
      }, 3000);
    }
    setIsSubmitting(false);
  };

  // Логика отображения
  const renderContent = () => {
    // 1. Пока идет верификация токена
    if (isVerifying) {
      return <p className="text-text-main/70">Проверка ссылки...</p>;
    }
    
    // 2. Если была ошибка (в useEffect или в форме)
    if (error) {
      return <p className="text-red-500 text-sm text-center">{error}</p>;
    }
    
    // 3. Если верификация прошла, показываем форму
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
    
    // 4. Если не загрузка и не успех (на всякий случай)
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