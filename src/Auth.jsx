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
          throw new Error('Не удалось получить данные Telegram. (tg.initData не найден)')
        }

        const initData = tg.initData

        // 3. Вызываем наш собственный бэкенд-сервис /api/auth-tg
        const response = await fetch('/api/auth-tg', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ initData: initData }),
        });

        if (!response.ok) {
          let errorBody = 'Неизвестная ошибка сервера';
          try {
            const err = await response.json();
            errorBody = err.error || `Статус: ${response.statusText}`;
          } catch (e) {
            errorBody = response.statusText;
          }
          throw new Error(`Ошибка функции (auth-tg): ${errorBody}`);
        }
        
        // 4. Ожидаем, что бэкенд вернет { access_token, refresh_token }
        const data = await response.json(); 

        if (!data.access_token || !data.refresh_token) {
          throw new Error('Функция (auth-tg) не вернула access_token или refresh_token.');
        }

        // 5. Используем токены для установки сессии
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        })

        if (sessionError) {
          throw new Error(`Ошибка установки сессии: ${sessionError.message}`)
        }

        // После успешного setSession, onAuthStateChange сам установит
        // пользователя и setLoading(false)
        
      } catch (err) {
        console.error('Критическая ошибка авто-логина:', err)
        setAuthError(err) 
        setLoading(false) 
      }
    }
    
    // Запускаем процесс входа
    loginWithTelegram()

    // Отписываемся при размонтировании
    return () => subscription.unsubscribe()
  }, [authError]) 

  const value = { user, setUser, loading, authError }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}