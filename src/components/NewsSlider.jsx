import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '.';

export const NewsSlider = ({ onReadMore }) => {
    const [news, setNews] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // ✅ Возвращаем логику загрузки из локального файла news.json
    useEffect(() => {
        // Указываем полный путь от корня папки public
        fetch('/data/news.json')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => {
                // Сортируем новости, чтобы новые были первыми (если в файле есть поле date)
                const sortedNews = data.sort((a, b) => new Date(b.date) - new Date(a.date));
                setNews(sortedNews);
            })
            .catch(err => console.error("Не удалось загрузить news.json:", err));
    }, []); // Пустой массив зависимостей, чтобы загрузка произошла один раз

    const nextNews = () => {
        if (news.length > 0) {
            setCurrentIndex((prev) => (prev + 1) % news.length);
        }
    };
    
    const prevNews = () => {
        if (news.length > 0) {
            setCurrentIndex((prev) => (prev - 1 + news.length) % news.length);
        }
    };

    // Если новостей нет, компонент ничего не будет отображать
    if (news.length === 0) {
        return null; 
    }

    const currentNewsItem = news[currentIndex];

    return (
        <div className="p-4">
            <div className="bg-component-bg p-4 rounded-2xl shadow-md border border-border-color flex items-center gap-4">
                <img src={currentNewsItem.imageUrl} alt="News" className="w-16 h-16 rounded-full object-cover border-2 border-border-color" />
                <div className="flex-1">
                    <h3 className="font-bold text-text-main">{currentNewsItem.title}</h3>
                    <p className="text-sm text-text-main opacity-70">{currentNewsItem.shortDescription}</p>
                    <button onClick={() => onReadMore(currentNewsItem)} className="text-sm font-bold text-accent mt-1">Читать далее</button>
                </div>
                <div className="flex flex-col">
                     <button onClick={prevNews} className="p-1 rounded-full hover:bg-background"><ChevronLeftIcon className="w-5 h-5" /></button>
                     <button onClick={nextNews} className="p-1 rounded-full hover:bg-background"><ChevronRightIcon className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
};

