// src/ProtectedRoute.jsx
import React from 'react';
import { useAuth } from './Auth';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { session } = useAuth();

  if (!session) {
    // Перенаправляем на страницу входа, если сессии нет
    return <Navigate to="/auth" replace />;
  }

  // Если сессия есть, показываем дочерний компонент (например, ProfilePage)
  return children;
};

export default ProtectedRoute;