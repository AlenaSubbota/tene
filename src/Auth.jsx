// src/Auth.jsx (Обновленная версия)

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from './supabase-config.js';

// ✅ --- НАЧАЛО: НОВЫЙ КОМПОНЕНТ-ЗАГЛУШКА ---
// Компонент, который будет блокировать экран, если нет подписки.
// Стили встроены, чтобы не создавать лишних .css файлов.
const SubscriptionGate = ({ message }) => {
  const styles = {
    gate: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      padding: '20px',
      boxSizing: 'border-box',
      textAlign: 'center',
      backgroundColor: 'var(--tg-theme-bg-color, #fff)', // Используем цвета Telegram
      color: 'var(--tg-theme-text-color, #000)',
    },
    message: {
      fontSize: '18px',
      marginBottom: '24px',
      lineHeight: '1.5',
    },
    button: {
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: 'bold',
      color: 'var(--tg-theme-button-text-color, #fff)',
      backgroundColor: 'var(--tg-theme-button-color, #007bff)', // Цвет кнопки TG
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      textDecoration: 'none',
    }
  };

  // Пытаемся извлечь @username из сообщения об ошибке
  const channelUsername = message.split(':').pop().trim() || "t.me/novelslab";
  const channelLink = channelUsername.startsWith('t.me/') 
    ? `https://${channelUsername}` 
    : `https://t.me/${channelUsername.replace('@', '')}`;

  return (
    <div style={styles.gate}>
      <p style={styles.message}>{message || 'Для доступа к приложению требуется подписка.'}</p>
      <a 
        href={channelLink} 
        target="_blank" 
        rel="noopener noreferrer" 
        style={styles.button}
      >
        Перейти и подписаться
      </a>
    </div>
  );
};
// ✅ --- КОНЕЦ: НОВЫЙ КОМПОНЕНТ ---


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  // ✅ --- НОВОЕ СОСТОЯНИЕ ДЛЯ БЛОКИРОВКИ ---
  const [subscriptionRequired, setSubscriptionRequired] = useState(false); 

  useEffect(() => {
    // 1. Подписка на изменения (без изменений)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      // Не прекращаем загрузку, если у нас ошибка подписки
      if (currentUser || authError) { 
        setLoading(false);
      }
    });

    // 2. Функция авто-входа
    const loginWithTelegram = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          setLoading(false);
          return; // Уже залогинены
        }
        
        const tg = window.Telegram?.WebApp;
        if (!tg || !tg.initData) {
          throw new Error('Не удалось получить данные Telegram. (tg.initData не найден)');
        }

        const initData = tg.initData;

        // 3. Вызываем наш бэкенд
        const response = await fetch('/api/auth-tg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: initData }),
        });

        // ✅ --- НАЧАЛО: ОБНОВЛЕННАЯ ЛОГИКА ОБРАБОТКИ ОШИБОК ---
        if (!response.ok) {
          let errorBody = 'Неизвестная ошибка сервера';
          let errorMessage = 'Ошибка функции (auth-tg): Неизвестная ошибка';

          try {
            const err = await response.json();
            // Бэкенд возвращает `message` с текстом ошибки
            errorMessage = err.message || err.error || 'Неизвестная ошибка от /api/auth-tg';

            // ГЛАВНАЯ ПРОВЕРКА на подписку
            if (response.status === 403 && err.error === 'subscription_required') {
              console.warn('Доступ заблокирован: требуется подписка.');
              setAuthError(errorMessage); // "Для доступа к приложению, пожалуйста, подпишитесь..."
              setSubscriptionRequired(true); // Устанавливаем флаг блокировки
              setLoading(false); // Завершаем загрузку
              return; // Прерываем процесс авторизации
            }
            
            errorBody = err.error || `Статус: ${response.statusText}`;

          } catch (e) {
             // Ответ не-JSON
            errorBody = response.statusText;
            errorMessage = `Ошибка функции (auth-tg): ${errorBody}`;
          }
          
          // Если это была не ошибка подписки, кидаем обычную ошибку
          throw new Error(errorMessage);
        }
        // ✅ --- КОНЕЦ: ОБНОВЛЕННАЯ ЛОГИКА ---
        

        // 4. Ожидаем { session: ..., isNewUser: ... } от бэкенда
        const data = await response.json(); 

        // ❗️ Я ИСПРАВИЛ ОШИБКУ: твой бэкенд возвращает data.session,
        // а старый код искал data.access_token.
        if (!data.session) {
          throw new Error('Бэкенд (/api/auth-tg) не вернул объект сессии.');
        }

        // 5. Используем сессию, которую вернул наш бэкенд
        const { error: sessionError } = await supabase.auth.setSession(data.session);

        if (sessionError) {
          throw new Error(`Ошибка установки сессии: ${sessionError.message}`);
        }
        
        // Cессия установлена, onAuthStateChange ее подхватит
        // Но мы установим юзера вручную, чтобы ускорить
        setUser(data.session.user);
        setLoading(false);
        
      } catch (err) {
        // Все остальные ошибки (нет TG, сбой сети и т.д.)
        console.error('Критическая ошибка авто-логина:', err);
        setAuthError(err.message || 'Произошла критическая ошибка'); 
        setLoading(false); 
      }
    };
    
    // Запускаем процесс входа
    loginWithTelegram();

    // Отписываемся при размонтировании
    return () => subscription.unsubscribe();
  }, []); // Убран [authError] из зависимостей, чтобы избежать цикла ошибок

  // ✅ --- ОБНОВЛЕНО: передаем новые значения ---
  const value = { user, setUser, loading, authError, subscriptionRequired };

  return (
    <AuthContext.Provider value={value}>
      {/* ✅ --- НАЧАЛО: ОБНОВЛЕННАЯ ЛОГИКА РЕНДЕРА --- */}
      {loading ? (
        null // Показываем пустой экран во время загрузки
      ) : subscriptionRequired ? (
        <SubscriptionGate message={authError} /> // Показываем заглушку
      ) : authError ? (
        // Показываем заглушку для *других* ошибок (например, "Не удалось получить данные Telegram")
        <SubscriptionGate message={authError.toString()} />
      ) : (
        children // Показываем приложение, если user есть (или если его нет, но нет и ошибки)
      )}
      {/* ✅ --- КОНЕЦ: ОБНОВЛЕННАЯ ЛОГИКА --- */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};