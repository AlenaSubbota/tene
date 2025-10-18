// src/AuthScreen.jsx (Supabase версия)

import React from 'react';
// --- ИЗМЕНЕНИЕ: Убираем лишний импорт `auth` ---
import { AuthForm } from './Auth';

// --- ИЗМЕНЕНИЕ: Убираем лишние пропсы `auth` и `onRegisterClick` ---
export const AuthScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-2">Добро пожаловать</h1>
        <p className="text-text-main/70 mb-8">
          Войдите или создайте аккаунт, чтобы продолжить.
        </p>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">
           <AuthForm />
        </div>
      </div>
    </div>
  );
};
