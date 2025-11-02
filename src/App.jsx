// src/App.jsx (Полная исправленная версия)

import React from 'react';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';
import './App.css'; // <-- Ваш импорт стилей

// Импорты ваших компонентов/страниц
import NovelList from './components/NovelList';
import NovelDetails from './components/pages/NovelDetails';
import ChapterReader from './components/pages/ChapterReader';
import AuthScreen from './AuthScreen';
import ProfilePage from './components/pages/ProfilePage';
import SearchPage from './components/pages/SearchPage';
import BookmarksPage from './components/pages/BookmarksPage';
import PolicyScreen from './components/pages/PolicyScreen';
import HelpScreen from './components/pages/HelpScreen';
import UpdatePassword from './components/pages/UpdatePassword';

// Импорт нового компонента для защиты маршрутов
import ProtectedRoute from './ProtectedRoute';

// 1. Роутер создается ОДИН РАЗ, вне компонента App
const router = createBrowserRouter([
  {
    path: '/',
    element: <NovelList />,
  },
  {
    path: '/novel/:id',
    element: <NovelDetails />,
  },
  {
    path: '/chapter/:id',
    element: <ChapterReader />,
  },
  {
    path: '/auth',
    element: <AuthScreen />,
  },
  {
    path: '/update-password', // <-- Публичный маршрут
    element: <UpdatePassword />,
  },
  {
    path: '/search',
    element: <SearchPage />,
  },
  {
    path: '/policy',
    element: <PolicyScreen />,
  },
  {
    path: '/help',
    element: <HelpScreen />,
  },
  // 2. Защищенные маршруты теперь используют ProtectedRoute
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/bookmarks',
    element: (
      <ProtectedRoute>
        <BookmarksPage />
      </ProtectedRoute>
    ),
  },
]);

// 3. Компонент App теперь максимально простой
function App() {
  // Логика (useAuth, Navigate) отсюда убрана.
  // Роутер больше не создается при каждом рендере.
  return <RouterProvider router={router} />;
}

export default App;