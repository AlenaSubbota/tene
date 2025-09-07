import React from 'react';
import { Auth } from './Auth.jsx'; // Мы будем использовать существующий компонент Auth

export const AuthScreen = ({ user, subscription, onGetSubscriptionClick, auth }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2 text-text-main">Tenebris Verbum</h1>
        <p className="text-center text-sm opacity-70 mb-6">Войдите или зарегистрируйтесь, чтобы продолжить</p>
        <Auth user={user} subscription={subscription} onGetSubscriptionClick={onGetSubscriptionClick} auth={auth} />
      </div>
    </div>
  );
};