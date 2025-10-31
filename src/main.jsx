// src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './Auth.jsx';
import { BrowserRouter } from 'react-router-dom'; // <-- 1. ИМПОРТ

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <-- 2. Обертка #1 */}
      <AuthProvider> {/* <-- 3. Обертка #2 */}
        <App />
      </AuthProvider>
    </BrowserRouter> {/* <-- 4. Закрыть обертку #1 */}
  </React.StrictMode>,
)
// Лишней скобки здесь больше нет