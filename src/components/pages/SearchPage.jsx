import React, { useState, useMemo } from 'react';
import { Header } from '../Header';
import { NovelList } from '../NovelList';
import { SearchIcon } from '../icons';

export const SearchPage = ({ novels, onSelectNovel, bookmarks, onToggleBookmark, onGenreSelect }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGenre, setSelectedGenre] = useState(null);

    const allGenres = useMemo(() => {
        const genres = new Set();
        novels.forEach(novel => novel.genres.forEach(genre => genres.add(genre)));
        return ['Все', ...Array.from(genres)];
    }, [novels]);
    
    const filteredNovels = useMemo(() => {
        return novels.filter(novel => {
            const matchesSearch = novel.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesGenre = selectedGenre === 'Все' || !selectedGenre || novel.genres.includes(selectedGenre);
            return matchesSearch && matchesGenre;
        });
    }, [novels, searchTerm, selectedGenre]);

    const handleGenreClick = (genre) => {
        setSelectedGenre(genre);
        onGenreSelect(genre); // Pass to parent if needed
    };

    return (
        <div>
            <Header title="Поиск" />
            <div className="p-4">
                <div className="relative mb-4">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border border-border-color focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                </div>
                 <div className="flex flex-wrap gap-2 mb-4">
                    {allGenres.map(genre => (
                        <button
                            key={genre}
                            onClick={() => handleGenreClick(genre)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${selectedGenre === genre ? 'bg-accent text-white border-accent' : 'bg-background border-border-color hover:bg-border-color'}`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>
            <NovelList
                novels={filteredNovels}
                onSelectNovel={onSelectNovel}
                bookmarks={bookmarks}
                onToggleBookmark={onToggleBookmark}
            />
        </div>
    );
};