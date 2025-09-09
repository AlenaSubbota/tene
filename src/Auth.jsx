import React from 'react';
// Импортируем Auth из Auth.jsx, как и раньше
import { Auth } from './Auth.jsx'; 
import { getAuth } from "firebase/auth"; // Импортируем getAuth

// Получаем инстанс auth прямо в этом файле.
// Это более надежный способ, чем передавать его через пропсы.
const auth = getAuth();

// Убираем лишние пропсы, которые не используются
export const AuthScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2 text-text-main">Tenebris Verbum</h1>
        <p className="text-center text-sm opacity-70 mb-6">Войдите или зарегистрируйтесь, чтобы продолжить</p>
        
        {/* Передаем auth напрямую в компонент Auth */}
        <Auth auth={auth} />
      </div>
    </div>
  );
};
