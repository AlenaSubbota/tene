// src/components/pages/ProfilePage.jsx (Supabase версия)

import React from 'react';
// import { useNavigate } from 'react-router-dom'; // <-- УДАЛЕНО
import { supabase } from '../../supabase-config';
import { Header } from "../Header.jsx";
// import { LogOutIcon } from "../icons.jsx"; // <-- УДАЛЕНО

export const ProfilePage = ({ user, subscription, onGetSubscriptionClick, userId, onThemeChange, currentTheme, onShowHelp }) => {

    const handleCopyId = () => {
        if (userId) {
            navigator.clipboard.writeText(userId)
                .then(() => console.log("Supabase UID скопирован в буфер обмена"))
                .catch(err => console.error('Не удалось скопировать UID: ', err));
        }
    };
    
    const getSubscriptionEndDate = () => {
        if (subscription?.expires_at) {
            return new Date(subscription.expires_at);
        }
        return null;
    };

    const subscriptionEndDate = getSubscriptionEndDate();
    const hasActiveSubscription = subscriptionEndDate && subscriptionEndDate > new Date();


    return (
        <div>
            <Header title="Профиль" />
            <div className="p-4 rounded-lg bg-component-bg border border-border-color mx-4 mb-4">
                
                {/* Класс 'justify-between' удален, кнопка тоже */}
                <div className="flex items-center mb-4">
                    <div>
                        {/* Эта строка уже была правильной (full_name) */}
                        <p className="font-bold text-lg">{user?.user_metadata?.full_name || 'Аноним'}</p>
                    </div>
                    {/* ‼️ КНОПКА ВЫХОДА УДАЛЕНА ‼️ */}
                </div>
            </div>
          
            {/* ... остальной JSX (темы, подписка, ID) ... */}
            
             <div className="p-4 rounded-lg bg-component-bg border border-border-color mx-4 mb-4">
                 <h3 className="font-bold mb-2">Тема оформления</h3>
                 <div className="flex flex-col space-y-2">
                     <label className="flex items-center justify-between">
                         <span>Светлая</span>
                         <input
                             type="radio"
                             name="theme"
                             value="light"
                             checked={currentTheme === 'light'}
                             onChange={() => onThemeChange('light')}
                             className="form-radio text-accent focus:ring-accent"
                         />
                     </label>
                     <label className="flex items-center justify-between">
                         <span>Тёмная (Бирюза)</span>
                         <input
                             type="radio"
                             name="theme"
                             value="dark"
                             checked={currentTheme === 'dark'}
                             onChange={() => onThemeChange('dark')}
                             className="form-radio text-accent focus:ring-accent"
                         />
                     </label>
                     <label className="flex items-center justify-between">
                         <span>Тёмная (Золото)</span>
                         <input
                             type="radio"
                             name="theme"
                             value="dark-amber"
                             checked={currentTheme === 'dark-amber'}
                             onChange={() => onThemeChange('dark-amber')}
                             className="form-radio text-accent focus:ring-accent"
                         />
                     </label>
                 </div>
             </div>
             <div className="p-4 rounded-lg bg-component-bg border border-border-color mx-4 mb-4">
                  <h3 className="font-bold mb-2">Подписка</h3>
                  {hasActiveSubscription ? (
                     <div>
                         <p className="text-green-500">Активна</p>
                         <p className="text-sm opacity-70">
                             Заканчивается: {subscriptionEndDate.toLocaleDateString()}
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
             
             <div className="p-4 rounded-lg bg-component-bg border border-border-color mx-4 mb-4">
                  <h3 className="font-bold mb-2">Ваш ID для привязки</h3>
                 <p className="text-sm opacity-70 mb-3">
                     Этот ID нужен для связи вашего аккаунта с Telegram-ботом. 
                     Например, после подписки на Boosty.
                 </p>
                 <div className="bg-background p-2 rounded-md text-xs break-all mb-3">
                     <code>{userId || "Загрузка..."}</code>
                 </div>
                 <button
                     onClick={handleCopyId}
                     disabled={!userId}
                     className="w-full py-2 rounded-lg bg-gray-200 text-gray-800 font-bold transition-all hover:scale-105 disabled:opacity-50"
                 >
                     Копировать ID
                 </button>
             </div>
              <div className="p-4 rounded-lg bg-component-bg border border-border-color mx-4">
                 <button
                     onClick={onShowHelp}
                     className="w-full text-left text-sm text-accent hover:underline"
                 >
                     Справка и правовая информация
                 </button>
             </div>
        </div>
    );
};