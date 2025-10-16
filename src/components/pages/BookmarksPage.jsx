import React, { useState, useEffect } from 'react';
// ✅ Добавляем 'where', 'documentId' для запроса по ID
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { db } from "../../firebase-config.js";
import { Header } from "../Header.jsx";
import { BookmarkIcon, EyeIcon } from '../icons.jsx';
// import { LoadingSpinner } from '../LoadingSpinner.jsx';

// Убираем 'novels' из props
export const BookmarksPage = ({ onSelectNovel, bookmarks, onToggleBookmark }) => {
    // Состояние для хранения новелл из закладок
    const [bookmarkedNovels, setBookmarkedNovels] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBookmarkedNovels = async () => {
            setIsLoading(true);
            setBookmarkedNovels([]); // Очищаем старые результаты

            // Если массив закладок пуст, ничего не делаем
            if (!bookmarks || bookmarks.length === 0) {
                setIsLoading(false);
                return;
            }
            
            // Firestore может искать не более 30 элементов в одном запросе 'in'.
            // Поэтому мы разбиваем длинный список закладок на части по 30.
            const chunks = [];
            for (let i = 0; i < bookmarks.length; i += 30) {
                chunks.push(bookmarks.slice(i, i + 30));
            }

            try {
                let novelsData = [];
                // Выполняем запросы для каждой части параллельно
                const fetchPromises = chunks.map(chunk => {
                    const q = query(collection(db, "novels"), where(documentId(), 'in', chunk));
                    return getDocs(q);
                });

                const snapshots = await Promise.all(fetchPromises);
                
                snapshots.forEach(snapshot => {
                    snapshot.docs.forEach(doc => {
                        novelsData.push({ id: doc.id, ...doc.data() });
                    });
                });
                
                setBookmarkedNovels(novelsData);
            } catch (error) {
                console.error("Ошибка загрузки новелл из закладок:", error);
            }
            setIsLoading(false);
        };

        // Запускаем загрузку, когда компонент монтируется или когда меняется список закладок
        fetchBookmarkedNovels();
    }, [bookmarks]);

    return (
        <div>
            <Header title="Закладки" />
            
            {isLoading ? (
                 <div className="text-center p-8"><p>Загрузка...</p></div>
            ) : bookmarkedNovels.length > 0 ? (
                 <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 p-4 text-text-main">
                    {bookmarkedNovels.map((novel, index) => (
                        <div key={novel.id} onClick={() => onSelectNovel(novel)} className="cursor-pointer group animate-fade-in-down" style={{ animationDelay: `${index * 50}ms` }}>
                          <div className="relative transition-all duration-300">
                            <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(novel.id); }} className={`absolute top-2 right-2 z-10 p-1 rounded-full bg-black/30 backdrop-blur-sm text-white transition-colors ${bookmarks.includes(novel.id) ? 'text-accent' : ''}`}>
                              <BookmarkIcon filled={bookmarks.includes(novel.id)} width="20" height="20" />
                            </button>
                            <img src={`/${novel.coverUrl}`} alt={novel.title} className="w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 border border-border-color" />
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <div className="flex-1 min-w-0"> <h2 className="font-semibold text-xs truncate text-text-main">{novel.title}</h2></div>
                              {novel.views > 0 && (<div className="flex items-center gap-1 text-xs opacity-60 flex-shrink-0"> <EyeIcon className="w-4 h-4" /> <span>{novel.views}</span></div>)}
                            </div>
                          </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-text-main opacity-70 mt-8">У вас пока нет закладок.</p>
            )}
        </div>
    );
};
