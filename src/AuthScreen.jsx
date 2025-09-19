// src/AuthScreen.jsx

import React from 'react';
import { AuthForm } from './Auth'; // <-- 1. ИЗМЕНИТЕ ИМПОРТ
import { auth } from './firebase-config'; // Убедитесь, что auth импортирован

export const AuthScreen = ({ auth, onRegisterClick }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-text-main p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold mb-2">Добро пожаловать</h1>
        <p className="text-text-main/70 mb-8">
          Войдите или создайте аккаунт, чтобы продолжить.
        </p>
        <div className="bg-component-bg p-6 rounded-2xl border border-border-color shadow-lg">
           <AuthForm onRegisterClick={onRegisterClick} />
        </div>
      </div>
    </div>
  );
};