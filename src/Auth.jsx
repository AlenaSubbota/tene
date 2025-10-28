// src/Auth.jsx (Supabase версия)

import React, { createContext, useState, useContext, useEffect } from 'react';
// --- ИЗМЕНЕНИЕ: Убираем импорты Firebase, добавляем Supabase ---
import { supabase } from './supabase-config.js';

// --- 1. Контекст остается без изменений ---
const AuthContext = createContext();

// --- 2. Провайдер переписан под Supabase ---
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Получаем текущую сессию при первой загрузке
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // onAuthStateChange в Supabase слушает изменения (вход, выход)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Отписываемся от слушателя при размонтировании компонента
    return () => subscription.unsubscribe();
  }, []);

  // --- ИЗМЕНЕНИЕ: Добавляем setUser в value ---
  const value = { user, setUser, loading };

  // Логика рендеринга остается той же
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// --- 3. Хук useAuth остается без изменений ---
export const useAuth = () => {
  return useContext(AuthContext);
};


// --- 4. Компонент с формой авторизации переписан под Supabase ---
// (Остальная часть файла без изменений)
export const AuthForm = ({ onRegisterClick }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  
  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!displayName.trim()) {
        setError('Пожалуйста, введите имя.');
        return;
      }
      // Было (Firebase): createUserWithEmailAndPassword
      // Стало (Supabase): supabase.auth.signUp
      const { error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          // В Supabase дополнительные данные (имя) передаются так
          data: {
            display_name: displayName,
            policy_accepted: false // --- ИЗМЕНЕНИЕ: Устанавливаем значение по умолчанию при регистрации
          }
        }
      });
      if (signUpError) setError(getFriendlyErrorMessage(signUpError.message));

    } else {
      // Было (Firebase): signInWithEmailAndPassword
      // Стало (Supabase): supabase.auth.signInWithPassword
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (signInError) setError(getFriendlyErrorMessage(signInError.message));
    }
  };

  // Новая функция для обработки ошибок Supabase
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
    return 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAuthAction} className="space-y-4">
        {isRegistering && (
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ваше имя"
            className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
            required
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
          required
        />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-transform hover:scale-105"
        >
          {isRegistering ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>

      <div className="flex items-center justify-center">
        <button 
          onClick={() => { 
            // onRegisterClick больше не нужен, убираем его
            setIsRegistering(!isRegistering); 
            setError(''); 
          }} 
          className="text-sm text-accent hover:underline"
        >
          {isRegistering ? 'У меня уже есть аккаунт' : 'Создать новый аккаунт'}
        </button>
      </div>
    </div>
  );
};