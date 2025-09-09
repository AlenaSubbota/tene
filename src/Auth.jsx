// src/Auth.jsx

import React from 'react';
import { GoogleAuthProvider, signInWithRedirect, TelegramAuthProvider } from "firebase/auth";

// Получаем auth как пропс
export const Auth = ({ auth }) => {

  const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" height="1.5em" width="1.5em">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.62 12c-.88-.25-.89-1.39.2-1.61l15.35-5.83c.71-.27 1.33.17 1.13.91l-2.29 10.81c-.19.88-1.05 1.08-1.74.52l-4.55-3.35-2.14 2.05c-.21.21-.4.4-.69.4z" />
    </svg>
  );

  const signInWithTelegram = () => {
    const provider = new TelegramAuthProvider();
    const tg = window.Telegram.WebApp;
    provider.setCustomParameters({
      'tg_login_params': tg.initData,
    });
    signInWithRedirect(auth, provider);
  };

  return (
    <div>
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