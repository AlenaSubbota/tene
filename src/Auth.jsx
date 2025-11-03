// src/Auth.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from './supabase-config.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false); 
    });

    return () => subscription.unsubscribe();
  }, []); 

  const value = { user, setUser, loading };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};


// --- Компонент с формой (ОБЪЕДИНЕННАЯ ВЕРСЯ) ---
export const AuthForm = () => {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { setUser } = useAuth(); // Получаем setUser из контекста

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    let authError = null;
    
    try {
      if (mode === 'login') {
        // 1. Логика входа
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        authError = error;
        if (!error) setUser(data.user); // <-- Обновляем состояние немедленно

      } else if (mode === 'register') {
        // 2. Логика регистрации
        const { error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });
        authError = error;
        if (!error) setMessage('Проверьте вашу почту для подтверждения регистрации!');
        
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `https://tene.fun/update-password`,
        });
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---

        authError = error;
        if (!error) setMessage('Проверьте вашу почту для сброса пароля!');
      }

      if (authError) {
        throw authError;
      }

    } catch (error) {
      console.error(`Ошибка в режиме ${mode}:`, error.message);
      if (error.message.includes("Email not confirmed")) {
        setError('Пожалуйста, подтвердите ваш e-mail. Проверьте почту.');
      } else if (error.message.includes("Invalid login credentials")) {
        setError('Неверный e-mail или пароль.');
      } else if (error.message.includes("User already registered")) {
        setError('Пользователь с таким e-mail уже зарегистрирован.');
      } else {
        setError(error.message || 'Произошла неизвестная ошибка.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Вспомогательная функция для текста кнопки
  const getButtonText = () => {
    if (loading) {
      if (mode === 'login') return 'Входим...';
      if (mode === 'register') return 'Регистрация...';
      if (mode === 'reset') return 'Отправка...';
    }
    if (mode === 'login') return 'Войти';
    if (mode === 'register') return 'Зарегистрироваться';
    if (mode === 'reset') return 'Сбросить пароль';
    return 'Отправить';
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-center">
        {mode === 'login' && 'Вход'}
        {mode === 'register' && 'Регистрация'}
        {mode === 'reset' && 'Сброс пароля'}
      </h1>

      {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded-lg">{error}</p>}
      {message && <p className="text-green-500 text-sm text-center bg-green-500/10 p-2 rounded-lg">{message}</p>}

      <form onSubmit={handleAuth} className="flex flex-col gap-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
          required
        />
        
        {/* Показываем поле пароля только для входа и регистрации */}
        {mode !== 'reset' && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
            required
            minLength={6}
          />
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-transform hover:scale-105 disabled:opacity-50"
        >
          {getButtonText()}
        </button>
      </form>

      {/* Переключатели режимов */}
      <div className="text-sm text-center">
        {mode === 'login' && (
          <>
            <button 
              onClick={() => { setMode('register'); setError(''); setMessage(''); }} 
              className="text-accent hover:underline"
            >
              Нет аккаунта? Зарегистрироваться
            </button>
            <span className="mx-2 text-text-main/50">|</span>
            <button 
              onClick={() => { setMode('reset'); setError(''); setMessage(''); }} 
              className="text-accent hover:underline"
            >
              Забыли пароль?
            </button>
          </>
        )}
        
        {mode === 'register' && (
          <button 
            onClick={() => { setMode('login'); setError(''); setMessage(''); }} 
            className="text-accent hover:underline"
          >
            Уже есть аккаунт? Войти
          </button>
        )}
        
        {mode === 'reset' && (
          <button 
            onClick={() => { setMode('login'); setError(''); setMessage(''); }} 
            className="text-accent hover:underline"
          >
            Вернуться ко входу
          </button>
        )}
      </div>
    </div>
  );
};