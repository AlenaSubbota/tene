import React, { useState } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut 
} from "firebase/auth";

// --- Компонент Auth ---
export const Auth = ({ user, auth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginView, setIsLoginView] = useState(true); // Переключатель между входом и регистрацией
    const [error, setError] = useState('');

    const handleAuthAction = async () => {
        setError('');
        if (!email || !password) {
            setError('Пожалуйста, заполните все поля.');
            return;
        }

        try {
            if (isLoginView) {
                // Вход существующего пользователя
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Регистрация нового пользователя
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            console.error("Ошибка аутентификации:", err.code);
            // Преобразуем коды ошибок Firebase в понятные сообщения
            switch (err.code) {
                case 'auth/invalid-email':
                    setError('Некорректный формат email.');
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError('Неверный email или пароль.');
                    break;
                case 'auth/email-already-in-use':
                    setError('Этот email уже зарегистрирован.');
                    break;
                case 'auth/weak-password':
                    setError('Пароль слишком слабый (должен быть не менее 6 символов).');
                    break;
                case 'auth/too-many-requests':
                    setError('Слишком много попыток входа. Попробуйте позже.');
                    break;
                default:
                    setError('Произошла непредвиденная ошибка. Попробуйте снова.');
            }
        }
    };

    // Функция выхода
    const handleSignOut = () => {
        signOut(auth).catch(error => console.error("Ошибка выхода:", error));
    };
    
    return (
        <div className="p-4 space-y-4">
            {user && !user.isAnonymous ? (
                // --- ИНТЕРФЕЙС ДЛЯ ЗАЛОГИНЕННОГО ПОЛЬЗОВАТЕЛЯ ---
                <div className="p-4 rounded-lg bg-component-bg border border-border-color">
                    <div className="flex items-center space-x-4 mb-4">
                         <img src={user.photoURL || 'https://placehold.co/64x64/F5F1ED/2C3A47?text=👤'} alt="Avatar" className="w-16 h-16 rounded-full" />
                        <div>
                            <h3 className="font-bold">{user.email}</h3>
                        </div>
                    </div>
                    <button onClick={handleSignOut} className="w-full py-2 rounded-lg bg-gray-200 text-gray-800 font-bold">Выйти</button>
                </div>
            ) : (
                // --- ИНТЕРФЕЙС ДЛЯ ВХОДА/РЕГИСТРАЦИИ ---
                <div className="p-4 rounded-lg bg-component-bg border border-border-color">
                    <h3 className="font-bold mb-2">{isLoginView ? 'Войдите в аккаунт' : 'Создайте аккаунт'}</h3>
                    <p className="text-sm opacity-70 mb-3">
                        Чтобы синхронизировать ваши закладки, подписку и прогресс чтения.
                    </p>
                    
                    <div className="space-y-3">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full bg-background border border-border-color rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                         <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Пароль"
                            className="w-full bg-background border border-border-color rounded-lg py-2 px-4 text-text-main placeholder-text-main/50 focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                        <button onClick={handleAuthAction} className="w-full py-2 rounded-lg bg-accent text-white font-bold">
                            {isLoginView ? 'Войти' : 'Зарегистрироваться'}
                        </button>
                    </div>
                     <button onClick={() => setIsLoginView(!isLoginView)} className="w-full text-center text-xs mt-4 text-accent hover:underline">
                        {isLoginView ? 'У меня еще нет аккаунта' : 'У меня уже есть аккаунт'}
                    </button>
                    {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
                </div>
            )}
        </div>
    );
};