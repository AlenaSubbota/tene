import React, { useMemo } from 'react';
import { Header } from '../Header';
import { NovelList } from '../NovelList';

export const BookmarksPage = ({ allNovels, onSelectNovel, bookmarks, onToggleBookmark }) => {
    
    const bookmarkedNovels = useMemo(() => {
        return allNovels.filter(novel => bookmarks.includes(novel.id));
    }, [allNovels, bookmarks]);
    
    return (
        <div>
            <Header title="Закладки" />
            {bookmarkedNovels.length > 0 ? (
                <NovelList 
                    novels={bookmarkedNovels} 
                    onSelectNovel={onSelectNovel} 
                    bookmarks={bookmarks} 
                    onToggleBookmark={onToggleBookmark} 
                />
            ) : (
                <p className="text-center p-4 opacity-70">У вас пока нет закладок.</p>
            )}
        </div>
    );
};