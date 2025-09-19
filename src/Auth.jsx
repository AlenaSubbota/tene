// src/Auth.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth } from './firebase-config'; // Убедитесь, что импортируете auth из вашего конфига

// --- 1. Создаем контекст ---
const AuthContext = createContext();

// --- 2. Создаем провайдер, который будет "оберткой" для всего приложения ---
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged слушает изменения состояния аутентификации
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Отписываемся от слушателя при размонтировании компонента
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    // Вы можете добавить сюда другие функции, если они понадобятся в других частях приложения
    // например: register, login, logout
  };

  // Пока идет проверка пользователя, можно показывать заглушку (но в нашем случае App.jsx уже это делает)
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// --- 3. Создаем и экспортируем хук useAuth ---
// Именно его и не хватало вашему приложению
export const useAuth = () => {
  return useContext(AuthContext);
};


// --- 4. Компонент с формой авторизации остается почти без изменений ---
// Мы просто убираем его экспорт по умолчанию и делаем именованным
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
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: displayName });
      } catch (err) {
        setError(getFriendlyErrorMessage(err.code));
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err)
 {
        setError(getFriendlyErrorMessage(err.code));
      }
    }
  };

  const getFriendlyErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email': return 'Неверный формат электронной почты.';
      case 'auth/user-not-found':
      case 'auth/wrong-password': return 'Неверный email или пароль.';
      case 'auth/email-already-in-use': return 'Этот email уже зарегистрирован.';
      case 'auth/weak-password': return 'Пароль слишком слабый. Используйте не менее 6 символов.';
      default: return 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
    }
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
            if (!isRegistering && onRegisterClick) {
              onRegisterClick();
            }
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