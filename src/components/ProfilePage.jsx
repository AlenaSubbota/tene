import React from 'react';
import { signOut } from "firebase/auth";
import { Header } from '../Header';
import { LogOutIcon } from '../icons';

export const ProfilePage = ({ user, subscription, onGetSubscriptionClick, auth }) => {
    
    const handleLogout = () => {
        signOut(auth).catch(error => console.error("Logout failed:", error));
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date.seconds * 1000).toLocaleDateString('ru-RU');
    };

    const hasActiveSubscription = subscription && new Date(subscription.endDate.seconds * 1000) > new Date();

    return (
        <div>
            <Header title="Профиль" />
            <div className="p-4 space-y-4">
                <div className="p-4 rounded-lg bg-component-bg border border-border-color">
                    <p className="text-lg font-semibold">{user.displayName || 'Анонимный пользователь'}</p>
                    <p className="text-sm opacity-70">{user.email}</p>
                </div>

                <div className="p-4 rounded-lg bg-component-bg border border-border-color">
                    <h3 className="font-semibold mb-2">Статус подписки</h3>
                    {hasActiveSubscription ? (
                        <div>
                            <p className="text-green-500">Активна</p>
                            <p className="text-sm opacity-70">Действительна до: {formatDate(subscription.endDate)}</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-red-500">Неактивна</p>
                            <button onClick={onGetSubscriptionClick} className="mt-2 px-4 py-2 text-sm font-bold text-white bg-accent rounded-lg">
                                Оформить подписку
                            </button>
                        </div>
                    )}
                </div>

                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 text-red-500 rounded-lg bg-component-bg border border-border-color hover:bg-border-color transition-colors">
                    <LogOutIcon />
                    <span>Выйти из аккаунта</span>
                </button>
            </div>
        </div>
    );
};