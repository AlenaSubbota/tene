// src/AuthScreen.jsx

import React from 'react';
import { Auth } from './Auth.jsx';

// Теперь компонент принимает auth как пропс
export const AuthScreen = ({ auth }) => {
  const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" height="1.5em" width="1.5em">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.62 12c-.88-.25-.89-1.39.2-1.61l15.35-5.83c.71-.27 1.33.17 1.13.91l-2.29 10.81c-.19.88-1.05 1.08-1.74.52l-4.55-3.35-2.14 2.05c-.21.21-.4.4-.69.4z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-2">Добро пожаловать</h1>
        <p className="text-text-main/70 mb-8">
          Войдите в свой аккаунт, чтобы получить доступ к библиотеке.
        </p>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">
          {/* Передаем auth дальше в компонент Auth */}
          <Auth auth={auth} />
        </div>
      </div>
    </div>
  );
};