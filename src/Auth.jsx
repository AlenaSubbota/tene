// src/Auth.jsx

import React, { useState } from 'react';
import {
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
    </div>
  );
};