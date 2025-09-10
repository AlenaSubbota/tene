import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons.jsx';

export const NewsSlider = ({ onReadMore }) => {
    const [news, setNews] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // ИСПРАВЛЕННЫЙ ПУТЬ
        fetch('/data/news.json')
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.json();
            })
            .then(data => setNews(data))
            .catch(error => console.error("Failed to load news:", error));
    }, []);

    const prevSlide = () => {
        setCurrentIndex(prevIndex => (prevIndex === 0 ? news.length - 1 : prevIndex - 1));
    };

    const nextSlide = () => {
        setCurrentIndex(prevIndex => (prevIndex === news.length - 1 ? 0 : prevIndex + 1));
    };

    if (news.length === 0) {
        return null; // Не рендерим ничего, если новостей нет
    }

    return (
        <div className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-lg shadow-lg my-4 border border-border-color">
            <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {news.map((item) => (
                    <div key={item.id} className="w-full flex-shrink-0 p-6 bg-component-bg text-text-main">
                        <h3 className="text-xl font-bold">{item.title}</h3>
                        <p className="mt-2 text-sm opacity-80">{item.shortText}</p>
                        <button onClick={() => onReadMore(item)} className="mt-4 text-accent font-semibold">Читать далее</button>
                    </div>
                ))}
            </div>
            
            <button onClick={prevSlide} className="absolute top-1/2 left-2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm"><ChevronLeftIcon /></button>
            <button onClick={nextSlide} className="absolute top-1/2 right-2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white backdrop-blur-sm"><ChevronRightIcon /></button>
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                {news.map((_, index) => (
                    <div key={index} className={`w-2 h-2 rounded-full transition-colors ${currentIndex === index ? 'bg-accent' : 'bg-gray-400'}`}></div>
                ))}
            </div>
        </div>
    );
};