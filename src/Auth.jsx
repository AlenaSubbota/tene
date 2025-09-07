import React, { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, signOut } from "firebase/auth";

// --- Компонент Auth ---
export const Auth = ({ user, subscription, onGetSubscriptionClick, auth }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [error, setError] = useState('');

    // Инициализация reCAPTCHA
    useEffect(() => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                    console.log("reCAPTCHA solved");
                }
            });
        }
    }, [auth]);
    
    // Функция отправки номера телефона
    const handleSendCode = async () => {
        setError('');
        if (!phoneNumber || !/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
            setError("Пожалуйста, введите корректный номер в формате +79123456789");
            return;
        }
        try {
            const appVerifier = window.recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(result);
        } catch (error) {
            console.error("Ошибка при отправке кода:", error);
            setError("Не удалось отправить код. Попробуйте перезагрузить страницу.");
            // В случае ошибки, возможно, потребуется сбросить reCAPTCHA
            window.recaptchaVerifier.render().then(widgetId => {
                window.grecaptcha.reset(widgetId);
            });
        }
    };

    // Функция проверки кода из СМС
    const handleVerifyCode = async () => {
        setError('');
        if (!verificationCode || verificationCode.length !== 6) {
            setError("Код должен состоять из 6 цифр.");
            return;
        }
        try {
            await confirmationResult.confirm(verificationCode);
            setConfirmationResult(null); // Сбрасываем после успешного входа
        } catch (error) {
            console.error("Ошибка при проверке кода:", error);
            setError("Неверный код. Попробуйте снова.");
        }
    };

    // Функция выхода
    const handleSignOut = () => {
        signOut(auth).catch(error => console.error("Ошибка выхода:", error));
    };
    
    const hasActiveSubscription = subscription && new Date(subscription.expires_at) > new Date();

    return (
        <div className="p-4 space-y-4">
            {user && !user.isAnonymous ? (
                // --- ИНТЕРФЕЙС ДЛЯ ЗАЛОГИНЕННОГО ПОЛЬЗОВАТЕЛЯ ---
                <div className="p-4 rounded-lg bg-component-bg border border-border-color">
                    <div className="flex items-center space-x-4 mb-4">
                        <img src={user.photoURL || 'https://placehold.co/64x64/F5F1ED/2C3A47?text=👤'} alt="Avatar" className="w-16 h-16 rounded-full" />
                        <div>
                            <h3 className="font-bold">{user.phoneNumber}</h3>
                            <p className="text-sm opacity-70">Пользователь</p>
                        </div>
                    </div>
                    <button onClick={handleSignOut} className="w-full py-2 rounded-lg bg-gray-200 text-gray-800 font-bold">Выйти</button>
                </div>
            ) : (
                // --- ИНТЕРФЕЙС ДЛЯ АНОНИМНОГО ПОЛЬЗОВАТЕЛЯ ---
                <div className="p-4 rounded-lg bg-component-bg border border-border-color">
                    <h3 className="font-bold mb-2">Войдите в аккаунт</h3>
                    <p className="text-sm opacity-70 mb-3">
                        Чтобы синхронизировать ваши закладки, подписку и прогресс чтения между устройствами.
                    </p>
                    
                    {!confirmationResult ? (
                        // --- ЭТАП 1: ВВОД НОМЕРА ТЕЛЕФОНА ---
                        <div className="space-y-3">
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="+79123456789"
                                className="w-full bg-background border border-border-color rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                            <button onClick={handleSendCode} className="w-full py-2 rounded-lg bg-accent text-white font-bold">
                                Отправить код
                            </button>
                        </div>
                    ) : (
                        // --- ЭТАП 2: ВВОД КОДА ИЗ СМС ---
                        <div className="space-y-3">
                            <input
                                type="number"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Код из СМС"
                                className="w-full bg-background border border-border-color rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                            <button onClick={handleVerifyCode} className="w-full py-2 rounded-lg bg-accent text-white font-bold">
                                Подтвердить
                            </button>
                        </div>
                    )}
                    {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
                </div>
            )}

            {/* --- БЛОК ПОДПИСКИ (ОСТАЕТСЯ БЕЗ ИЗМЕНЕНИЙ) --- */}
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