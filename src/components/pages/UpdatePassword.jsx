// src/components/pages/UpdatePassword.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase-config';
import { useAuth } from '../../Auth'; // <-- Импортируем useAuth

export const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Получаем состояние загрузки и пользователя из AuthContext
  const { loading, user } = useAuth();

  // Этот useEffect отслеживает, что происходит с сессией
  useEffect(() => {
    // Если загрузка AuthProvider'а завершена, а пользователя все еще нет,
    // значит, пользователь пришел сюда по недействительной/старой ссылке.
    if (!loading && !user) {
      setError('Недействительная или просроченная сессия. Пожалуйста, запросите сброс пароля заново.');
      setTimeout(() => {
        navigate('/'); // Отправляем на главную
      }, 3000);
    }
  }, [loading, user, navigate]);


  // Обработчик формы (ШАГ 3 из твоего старого файла, но он теперь главный)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Пароль не может быть пустым');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setMessage('');

    // Пользователь УЖЕ аутентифицирован.
    // Мы просто обновляем его пароль.
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      console.error("Ошибка обновления пароля:", error);
      setError('Не удалось обновить пароль. Попробуйте еще раз.');
    } else {
      setMessage('Пароль успешно обновлен! Вы будете перенаправлены на страницу входа.');
      // Выходим из системы, так как сессия 'recovery' одноразовая
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/'); // Переход на логин
      }, 3000);
    }
    setIsSubmitting(false);
  };

  // Логика отображения
  const renderContent = () => {
    // 1. Ждем, пока onAuthStateChange в AuthProvider'е отработает
    if (loading) {
      return <p className="text-text-main/70">Проверка сессии...</p>;
    }
    
    // 2. Если была ошибка (из useEffect)
    if (error) {
      return <p className="text-red-500 text-sm text-center">{error}</p>;
    }
    
    // 3. Если загрузка завершена и пользователь есть (сессия 'recovery' активна)
    if (user) {
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

    // 4. (На всякий случай) Если не загрузка, не ошибка, но и пользователя нет
    return <p className="text-text-main/70">Проверка сессии...</p>;
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