// src/Auth.jsx

import React, { useState } from 'react';
import {
  // Заменяем OAuthProvider на GoogleAuthProvider
  GoogleAuthProvider,
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
      } catch (err) {
        setError(getFriendlyErrorMessage(err.code));
      }
    }
  };

  // Новая функция для входа через Google
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithRedirect(auth, provider).catch((err) => {
      setError("Не удалось начать вход через Google.");
      console.error(err);
    });
  };

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

  // Иконка Google
  const GoogleIcon = () => (
    <svg viewBox="0 0 48 48" width="1.25em" height="1.25em">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.223 0-9.657-3.657-11.303-8H6.306C9.656 39.663 16.318 44 24 44z"></path>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C44.572 33.931 48 27.461 48 20c0-1.341-.138-2.65-.389-3.917z"></path>
    </svg>
  );

  return (
    <div className="space-y-4">
      <form onSubmit={handleAuthAction} className="space-y-4">
        {isRegistering && (
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ваше имя" className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent" required />
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent" required />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Пароль" className="w-full bg-background border-border-color border rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent" required />
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button type="submit" className="w-full py-3 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-transform hover:scale-105">
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
        onClick={signInWithGoogle}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white text-gray-800 font-bold transition-transform hover:scale-105 border border-border-color"
      >
        <GoogleIcon />
        Войти через Google
      </button>
    </div>
  );
};