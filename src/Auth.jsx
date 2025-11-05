// src/Auth.jsx

import React, { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from './supabase-config.js'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    // 1. Сначала подписываемся на изменения состояния
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      
      // Если сессия есть ИЛИ если мы уже пытались войти (есть ошибка),
      // то загрузка завершена.
      // Если сессии нет и ошибки нет, мы еще в процессе входа.
      if (currentUser || authError) {
        setLoading(false)
      }
    })

    // 2. Функция для автоматического входа через Telegram
    const loginWithTelegram = async () => {
      try {
        // Проверяем, есть ли уже сессия в localStorage
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          setLoading(false)
          return // Уже залогинены, ничего не делаем
        }
        
        // Получаем initData из Telegram WebApp
        const tg = window.Telegram?.WebApp
        if (!tg || !tg.initData) {
          // ВАЖНО: Убедись, что скрипт Telegram подключен в index.html
          // <script src="https://telegram.org/js/telegram-web-app.js"></script>
          throw new Error('Не удалось получить данные Telegram. (tg.initData не найден)')
        }

        const initData = tg.initData

        // --- ИЗМЕНЕНИЕ ЗДЕСЬ ---
        // 3. Вызываем наш собственный бэкенд-сервис /api/auth-tg
        const response = await fetch('/api/auth-tg', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initData: initData }),
        });

        if (!response.ok) {
          // Попытаемся прочитать ошибку из ответа
          let errorBody = 'Неизвестная ошибка сервера';
          try {
            const err = await response.json();
            errorBody = err.error || `Статус: ${response.statusText}`;
          } catch (e) {
            // Ошибка не в JSON, просто используем statusText
            errorBody = response.statusText;
          }
          throw new Error(`Ошибка функции (auth-tg): ${errorBody}`);
        }
        
        const data = await response.json(); // Получаем { email, password }

        if (!data.email || !data.password) {
          throw new Error('Функция не вернула email или пароль.');
        }
        // --- КОНЕЦ ИЗМЕНЕНИЯ ---

        // 4. Используем "скрытые" данные для входа
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })

        if (signInError) {
          throw new Error(`Ошибка входа (signIn): ${signInError.message}`)
        }

        // После успешного signIn, onAuthStateChange сам установит
        // пользователя и setLoading(false)
        
      } catch (err) {
        console.error('Критическая ошибка авто-логина:', err)
        setAuthError(err) // Сохраняем весь объект ошибки
        setLoading(false) // Ошибка, прекращаем загрузку
      }
    }
    
    // Запускаем процесс входа
    loginWithTelegram()

    // Отписываемся при размонтировании
    return () => subscription.unsubscribe()
  }, [authError]) // Добавляем authError в зависимости, чтобы onAuthStateChange 
                  // правильно обработал setLoading(false)

  // Передаем user, loading и authError (теперь это объект ошибки)
  const value = { user, setUser, loading, authError }

  // Показываем children только после завершения загрузки
  // (authError - это тоже "завершение")
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}