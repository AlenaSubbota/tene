// src/Auth.jsx (ИСПРАВЛЕННАЯ версия с displayName и сбросом пароля)

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from './supabase-config.js';

// --- 1. Контекст (без изменений) ---
const AuthContext = createContext();

// --- 2. Провайдер (без изменений, взят из вашего файла) ---
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = { user, setUser, loading };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// --- 3. Хук useAuth (без изменений) ---
export const useAuth = () => {
  return useContext(AuthContext);
};


// --- 4. Компонент с формой (ОБЪЕДИНЕННАЯ ВЕРСИЯ) ---
export const AuthForm = () => {
  // Вместо isRegistering (boolean), используем mode (string) для 3 состояний
  const [mode, setMode] = useState('login'); // 'login', 'register', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(''); // (Из вашего кода)
  const [error, setError] = useState('');
  const [message, setMessage] = useState(''); // (Для сообщений о сбросе)
  
  const { setUser } = useAuth(); // (Для явного обновления состояния)

  // (Функция из вашего кода)
  const getFriendlyErrorMessage = (errorMessage) => {
    if (errorMessage.includes('Invalid login credentials')) {
        return 'Неверный email или пароль.';
    }
    if (errorMessage.includes('User already registered')) {
        return 'Этот email уже зарегистрирован.';
    }
    if (errorMessage.includes('Password should be at least 6 characters')) {
        return 'Пароль слишком слабый. Используйте не менее 6 символов.';
    }
    // Добавим обработку ошибки для сброса пароля
    if (errorMessage.includes('User not found')) {
        return 'Пользователь с таким email не найден.';
    }
    return 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        // --- Вход (Ваша логика + setUser) ---
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (signInError) throw signInError;
        setUser(data.user); // Явно устанавливаем
      
      } else if (mode === 'register') {
        // --- Регистрация (Ваша логика + setUser) ---
        if (!displayName.trim()) {
          setError('Пожалуйста, введите имя.');
          return;
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              display_name: displayName,
              policy_accepted: false 
            }
          }
        });
        if (signUpError) throw signUpError;
        setUser(data.user); // Явно устанавливаем
      
      } else if (mode === 'reset') {
        // --- Сброс пароля (Моя логика) ---
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://tene.fun/update-password', 
        });
        if (resetError) throw resetError;
        setMessage('Ссылка для сброса пароля отправлена на вашу почту.');
      }
    } catch (error) {
      setError(getFriendlyErrorMessage(error.message));
    }
  };

  // Динамический текст для кнопки
  const getButtonText = () => {
    if (mode === 'login') return 'Войти';
    if (mode === 'register') return 'Зарегистрироваться';
    if (mode === 'reset') return 'Отправить ссылку';
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* (Из вашего кода - но с условием) */}
        {mode === 'register' && (
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ваше имя"
            className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        )}
        
        {/* Поле Email (нужно всегда) */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
          required
        />
        
        {/* Поле Пароль (не нужно для сброса) */}
        {mode !== 'reset' && (
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
            required={mode !== 'reset'} // Пароль обязателен только для входа и регистрации
          />
        )}
        
        {/* Сообщения */}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {message && <p className="text-green-500 text-sm text-center">{message}</p>}
        
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-transform hover:scale-105"
        >
          {getButtonText()}
        </button>
      </form>

      {/* Переключатели режимов (обновленная логика) */}
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