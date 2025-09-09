// src/Auth.jsx

import React, { useState } from 'react';
import {
  OAuthProvider,
  signInWithRedirect,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

export const Auth = ({ auth }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError(''); // Сбрасываем ошибку перед новой попыткой

    if (isRegistering) {
      // --- РЕГИСТРАЦИЯ ---
      if (!displayName.trim()) {
        setError('Пожалуйста, введите имя.');
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Сразу после регистрации обновляем профиль, добавляя имя
        await updateProfile(userCredential.user, { displayName: displayName });
      } catch (err) {
        setError(getFriendlyErrorMessage(err.code));
      }
    } else {
      // --- ВХОД ---
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err) {
        setError(getFriendlyErrorMessage(err.code));
      }
    }
  };

  const signInWithTelegram = () => {
    const provider = new OAuthProvider('telegram.com');
    signInWithRedirect(auth, provider).catch((err) => {
      setError("Не удалось начать вход через Telegram.");
      console.error(err);
    });
  };

  // Функция для более понятных сообщений об ошибках
  const getFriendlyErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Неверный формат электронной почты.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Неверный email или пароль.';
      case 'auth/email-already-in-use':
        return 'Этот email уже зарегистрирован.';
      case 'auth/weak-password':
        return 'Пароль слишком слабый. Используйте не менее 6 символов.';
      default:
        return 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
    }
  };

  const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" height="1.5em" width="1.5em">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.62 12c-.88-.25-.89-1.39.2-1.61l15.35-5.83c.71-.27 1.33.17 1.13.91l-2.29 10.81c-.19.88-1.05 1.08-1.74.52l-4.55-3.35-2.14 2.05c-.21.21-.4.4-.69.4z" />
    </svg>
  );

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
        <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-sm text-accent hover:underline">
          {isRegistering ? 'У меня уже есть аккаунт' : 'Создать новый аккаунт'}
        </button>
      </div>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-border-color"></div>
        <span className="flex-shrink mx-4 text-text-main/50 text-xs">ИЛИ</span>
        <div className="flex-grow border-t border-border-color"></div>
      </div>

      <button
        onClick={signInWithTelegram}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-[#2AABEE] text-white font-bold transition-transform hover:scale-105"
      >
        <TelegramIcon />
        Войти через Telegram
      </button>
    </div>
  );
};