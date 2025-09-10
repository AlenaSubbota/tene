import React from 'react';
import { CrownIcon } from './icons';

export const SubscriptionModal = ({ onClose, onSelectPlan }) => {
    const subscriptionPlans = [{ duration: 1, name: '1 месяц', price: 199 },{ duration: 3, name: '3 месяца', price: 539, popular: true },{ duration: 12, name: '1 год', price: 1899 }];
    return (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="w-full max-w-sm rounded-2xl p-6 shadow-lg bg-component-bg text-text-main"><CrownIcon className="mx-auto mb-4 text-accent" /><h3 className="text-xl text-center font-bold">Получите доступ ко всем главам</h3><p className="mt-2 mb-6 text-sm text-center opacity-70">Выберите подходящий тариф подписки:</p><div className="space-y-3">{subscriptionPlans.map(plan => (<button key={plan.duration} onClick={() => onSelectPlan(plan)} className="relative w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 border-border-color bg-background hover:border-accent-hover"><p className="font-bold">{plan.name}</p><p className="text-sm">{plan.price} ₽</p></button>))}</div><button onClick={onClose} className="w-full py-3 mt-4 rounded-lg border border-border-color">Не сейчас</button></div></div>);
};

export const PaymentMethodModal = ({ onClose, onSelectMethod, plan }) => {
    return (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="w-full max-w-sm rounded-2xl p-6 shadow-lg bg-component-bg text-text-main"><h3 className="text-xl text-center font-bold">Выберите способ оплаты</h3><p className="mt-2 mb-6 text-sm text-center opacity-70">Тариф: {plan.name} ({plan.price} ₽)</p><div className="space-y-3"><button onClick={() => onSelectMethod('card')} className="w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 border-border-color bg-background hover:border-accent-hover"><p className="font-bold">💳 Банковской картой</p><p className="text-sm opacity-70">Ручная проверка (до 24 часов)</p></button><button onClick={() => onSelectMethod('tribut')} className="w-full text-left p-4 rounded-xl border-2 transition-colors duration-200 border-border-color bg-background hover:border-accent-hover"><p className="font-bold">❤️ Донат через tribut</p><p className="text-sm opacity-70">Более быстрый способ</p></button></div><button onClick={onClose} className="w-full py-3 mt-4 rounded-lg border border-border-color">Назад</button></div></div>)
};

export const NewsModal = ({ newsItem, onClose }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="w-full max-w-md p-6 rounded-2xl shadow-lg bg-component-bg text-text-main" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">{newsItem.title}</h2>
            <p className="whitespace-pre-wrap opacity-80">{newsItem.fullText}</p>
            <button onClick={onClose} className="w-full py-2 mt-6 rounded-lg bg-accent text-white font-bold">Закрыть</button>
        </div>
    </div>
);