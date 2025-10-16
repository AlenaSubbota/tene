import React, { useState, useEffect, useCallback } from 'react';
// ✅ Добавляем 'where' для фильтрации
import { collection, getDocs, query, orderBy, limit, startAfter, where } from "firebase/firestore";
import { db } from "../firebase-config.js";
import { BookmarkIcon, EyeIcon } from './';
// import { LoadingSpinner } from './LoadingSpinner'; 

// ✅ Добавляем genreFilter в props
export const NovelList = ({ onSelectNovel, bookmarks, onToggleBookmark, genreFilter }) => {
    
    const [novels, setNovels] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    // ✅ Добавляем состояние для отслеживания текущего фильтра
    const [currentFilter, setCurrentFilter] = useState(null);

    // ✅ ОСНОВНОЕ ИЗМЕНЕНИЕ: Функция для загрузки данных, которая учитывает фильтр
    const fetchData = useCallback(async (filter, lastVisibleDoc = null) => {
        setIsLoading(true);
        try {
            const novelsCollection = collection(db, 'novels');
            const queryConstraints = [orderBy("title"), limit(12)];

            // Если есть фильтр, добавляем условие 'where'
            if (filter) {
                // 'array-contains' используется для поиска значения в массиве (поле genres)
                queryConstraints.unshift(where("genres", "array-contains", filter));
            }

            // Если есть последний документ (для пагинации), добавляем startAfter
            if (lastVisibleDoc) {
                queryConstraints.push(startAfter(lastVisibleDoc));
            }

            const q = query(novelsCollection, ...queryConstraints);
            const documentSnapshots = await getDocs(q);
            
            const newNovelsData = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (lastVisibleDoc) {
                // Если это подгрузка, добавляем к существующему списку
                setNovels(prev => [...prev, ...newNovelsData]);
            } else {
                // Если это первая загрузка, заменяем список
                setNovels(newNovelsData);
            }
            
            const lastDocSnapshot = documentSnapshots.docs[documentSnapshots.docs.length - 1];
            setLastDoc(lastDocSnapshot || null);

            if (documentSnapshots.docs.length < 12) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (error) {
            console.error("Ошибка загрузки новелл: ", error);
            // Если вы видите ошибку "FAILED_PRECONDITION", вам нужно создать индекс (см. ниже)
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ✅ Эффект, который перезагружает данные при смене фильтра
    useEffect(() => {
        // Сбрасываем все состояния и запускаем загрузку с новым фильтром
        setNovels([]);
        setLastDoc(null);
        setHasMore(true);
        setCurrentFilter(genreFilter); // Обновляем текущий фильтр
        fetchData(genreFilter, null);
    }, [genreFilter, fetchData]); // Зависимость от genreFilter

    // ✅ Функция подгрузки теперь просто вызывает fetchData
    const loadMoreNovels = useCallback(() => {
        if (!isLoading && hasMore) {
            fetchData(currentFilter, lastDoc);
        }
    }, [isLoading, hasMore, currentFilter, lastDoc, fetchData]);

    return (
        <div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 p-4 text-text-main">
              {novels.map((novel, index) => (
                <div key={novel.id} onClick={() => onSelectNovel(novel)} className="cursor-pointer group animate-fade-in-down" style={{ animationDelay: `${index * 50}ms` }}>
                  {/* ... твой JSX для карточки новеллы остается без изменений ... */}
                  <div className="relative transition-all duration-300">
                    <button onClick={(e) => { e.stopPropagation(); onToggleBookmark(novel.id); }} className={`absolute top-2 right-2 z-10 p-1 rounded-full bg-black/30 backdrop-blur-sm text-white transition-colors ${bookmarks.includes(novel.id) ? 'text-accent' : ''}`}>
                      <BookmarkIcon filled={bookmarks.includes(novel.id)} width="20" height="20" />
                    </button>
                    <img src={`/${novel.coverUrl}`} alt={novel.title} className="w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 border border-border-color" />
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="flex-1 min-w-0">
                          <h2 className="font-semibold text-xs truncate text-text-main">{novel.title}</h2>
                      </div>
                      {novel.views > 0 && (
                        <div className="flex items-center gap-1 text-xs opacity-60 flex-shrink-0">
                          <EyeIcon className="w-4 h-4" />
                          <span>{novel.views}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isLoading && (
                <div className="text-center p-4">
                    <p>Загрузка...</p> 
                </div>
            )}

            {!isLoading && novels.length === 0 && (
                <p className="col-span-3 text-center opacity-70 p-4">
                    {genreFilter ? `Новелл в жанре "${genreFilter}" не найдено.` : 'Новеллы пока не добавлены.'}
                </p>
            )}

            {hasMore && !isLoading && novels.length > 0 && (
                <div className="text-center p-4">
                    <button
                        onClick={loadMoreNovels}
                        className="bg-accent text-white font-bold py-2 px-6 rounded-lg hover:bg-accent-hover transition-colors"
                    >
                        Показать ещё
                    </button>
                </div>
            )}
        </div>
    );
}