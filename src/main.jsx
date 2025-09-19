// src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './Auth.jsx'; // <-- 1. Импортируйте AuthProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* <-- 2. Оберните App в AuthProvider --> */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)