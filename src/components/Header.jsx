import React from 'react';
import { BackIcon } from './icons.jsx'; // Я добавил .jsx на всякий случай

export const Header = ({ title, onBack, children }) => (
    <div className="sticky top-0 bg-component-bg z-20 py-3 px-4 flex items-center border-b border-border-color shadow-sm text-text-main">
        {onBack && (
            <button onClick={onBack} className="mr-4 p-2 -ml-2 rounded-full hover:bg-background">
                <BackIcon />
            </button>
        )}
        <h1 className="text-xl font-bold flex-grow">{title}</h1>
        {children}
    </div>
);