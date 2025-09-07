// src/Auth.jsx
import React from 'react';
// 👇 Убираем getAuth, signInWithPopup, linkWithPopup. Оставляем только то, что нужно для провайдера.
import { GoogleAuthProvider, signInWithPopup, linkWithPopup, signOut } from "firebase/auth";

// --- Иконки (остаются без изменений) ---
const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.82l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
        <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
);

const UserIcon = ({ className = '', filled = false }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const CrownIcon = ({ className = '' }) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>);


// --- Компонент Auth ---
// 👇 Добавляем 'auth' в список props
export const Auth = ({ user, subscription, onGetSubscriptionClick, auth }) => {
    // 💥 Убираем: const auth = getAuth();
    const provider = new GoogleAuthProvider();

    const handleSignIn = async () => {
        try {
            if (auth.currentUser && auth.currentUser.isAnonymous) {
                await linkWithPopup(auth.currentUser, provider);
            } else {
                await signInWithPopup(auth, provider);
            }
        } catch (error) {
            console.error("Ошибка входа или привязки:", error);
        }
    };

    const handleSignOut = () => {
        signOut(auth).catch(error => console.error("Ошибка выхода:", error));
    };
    
    const hasActiveSubscription = subscription && new Date(subscription.expires_at) > new Date();

    return (
        <div className="p-4 space-y-4">
            {user && !user.isAnonymous ? (
                // --- Состояние: Пользователь вошел ---
                <div className="p-4 rounded-lg bg-component-bg border border-border-color">
                    <div className="flex items-center space-x-4 mb-4">
                        <img src={user.photoURL || undefined} alt="Avatar" className="w-16 h-16 rounded-full" />
                        <div>
                            <h3 className="font-bold">{user.displayName}</h3>
                            <p className="text-sm opacity-70">{user.email}</p>
                        </div>
                    </div>
                    <button onClick={handleSignOut} className="w-full py-2 rounded-lg bg-gray-200 text-gray-800 font-bold">Выйти</button>
                </div>
            ) : (
                // --- Состояние: Пользователь не вошел (аноним) ---
                <div className="p-4 rounded-lg bg-component-bg border border-border-color">
                    <h3 className="font-bold mb-2">Войдите в аккаунт</h3>
                    <p className="text-sm opacity-70 mb-3">
                        Чтобы синхронизировать ваши закладки, подписку и прогресс чтения между устройствами.
                    </p>
                    <button onClick={handleSignIn} className="w-full py-2 rounded-lg bg-white text-gray-800 font-bold flex items-center justify-center border border-gray-300 shadow-sm hover:bg-gray-50">
                        <GoogleIcon />
                        Войти через Google
                    </button>
                </div>
            )}

            {/* Блок подписки */}
            <div className="p-4 rounded-lg bg-component-bg border border-border-color">
                <h3 className="font-bold mb-2">Подписка</h3>
                 {hasActiveSubscription ? (
                    <div>
                        <p className="text-green-500">Активна</p>
                        <p className="text-sm opacity-70">
                            Заканчивается: {new Date(subscription.expires_at).toLocaleDateString()}
                        </p>
                    </div>
                ) : (
                    <div>
                        <p className="text-red-500">Неактивна</p>
                         <p className="text-sm opacity-70 mb-3">
                            Оформите подписку, чтобы получить доступ ко всем платным главам.
                        </p>
                        <button onClick={onGetSubscriptionClick} className="w-full py-2 rounded-lg bg-accent text-white font-bold shadow-lg shadow-accent/30 transition-all hover:scale-105">
                            Оформить подписку
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
