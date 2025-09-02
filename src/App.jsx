import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- ИКОНКИ (встроенные SVG для простоты) ---
const ArrowRightIcon = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`opacity-50 ${className}`}>
        <path d="m9 18 6-6-6-6"/>
    </svg>
);
const SettingsIcon = ({ className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l-.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);
const SearchIcon = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 ${className}`}>
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);
const SunIcon = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path></svg>
);
const MoonIcon = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
);
const HomeIcon = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const BackIcon = ({ className = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 12H5"></path><polyline points="12 19 5 12 12 5"></polyline></svg>
);


// --- MOCK ДАННЫЕ ---
const mockNovels = [
  { id: 1, title: "Поднятие уровня в одиночку", coverUrl: "https://placehold.co/300x450/1a202c/ffffff?text=Solo+Leveling", lastUpdate: "4 ч назад", author: "Чхугон", genres: ["Экшен", "Фэнтези"], description: "Десять лет назад открылись «Врата», соединившие реальность с миром монстров. Началась эра охотников — людей со сверхспособностями. Сон Джин-у, охотник ранга E, получает шанс всей жизни.", chapters: Array.from({ length: 270 }, (_, i) => ({ id: i + 1, title: `Глава ${i + 1}`, content: `Содержимое главы ${i + 1}...` })) },
  { id: 2, title: "Всеведущий читатель", coverUrl: "https://placehold.co/300x450/2d3748/a0aec0?text=Omniscient+Reader", lastUpdate: "16 ч назад", author: "Sing-Shong", genres: ["Апокалипсис", "Экшен"], description: "Ким Док-ча — единственный читатель веб-новеллы, которая шла 10 лет. Когда мир превращается в мир этой новеллы, только он знает, чем всё закончится.", chapters: Array.from({ length: 551 }, (_, i) => ({ id: i + 1, title: `Глава ${i + 1}`, content: `Содержимое главы ${i + 1}...` })) },
  { id: 3, title: "Отброс из графской семьи", coverUrl: "https://placehold.co/300x450/4a5568/e2e8f0?text=Trash+of+Count's+Family", lastUpdate: "3 дня назад", author: "Ю Рё Хан", genres: ["Фэнтези", "Комедия"], description: "Проснувшись, Ким Рок Су оказывается в теле второстепенного злодея из романа. Теперь его зовут Кейл Хенитьюз. Чтобы выжить, он решает жить тихо, но мир вокруг не так прост.", chapters: Array.from({ length: 700 }, (_, i) => ({ id: i + 1, title: `Глава ${i + 1}`, content: `Содержимое главы ${i + 1}...` })) },
  { id: 4, title: "Второй приход Глюттони", coverUrl: "https://placehold.co/300x450/718096/1a202c?text=Second+Coming", lastUpdate: "5 дней назад", author: "Ро Ю-джин", genres: ["Драма", "Фэнтези"], description: "Азартный игрок и отброс общества получает второй шанс. Вернувшись в прошлое, Соль Джи-Ху решает прожить жизнь правильно, используя свой дар 'Девять Глаз'.", chapters: Array.from({ length: 488 }, (_, i) => ({ id: i + 1, title: `Глава ${i + 1}`, content: `Содержимое главы ${i + 1}...` })) },
];

// --- Цветовые Схемы ---
const themes = {
  light: {
    bg: 'bg-stone-100', text: 'text-stone-800', componentBg: 'bg-white', componentText: 'text-stone-700', border: 'border-stone-200',
    searchBg: 'bg-white', searchPlaceholder: 'placeholder-stone-400', searchRing: 'focus:ring-pink-400',
    tgBg: '#F5F5F0', tgHeader: '#FFFFFF',
  },
  dark: {
    bg: 'bg-gray-900', text: 'text-gray-100', componentBg: 'bg-gray-800', componentText: 'text-gray-200', border: 'border-gray-700',
    searchBg: 'bg-gray-800', searchPlaceholder: 'placeholder-gray-500', searchRing: 'focus:ring-pink-500',
    tgBg: '#121212', tgHeader: '#171717',
  }
};


// --- Компонент: Плавающая навигация ---
const FloatingNav = ({ onBack, onHome }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="fixed bottom-4 right-4 z-20">
            {isOpen && (
                 <div className="flex flex-col gap-3 mb-3">
                    <button onClick={onBack} className="w-14 h-14 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-md shadow-lg flex items-center justify-center text-stone-700 dark:text-gray-200"><BackIcon /></button>
                    <button onClick={onHome} className="w-14 h-14 rounded-full bg-white/80 dark:bg-gray-700/80 backdrop-blur-md shadow-lg flex items-center justify-center text-stone-700 dark:text-gray-200"><HomeIcon /></button>
                 </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="w-16 h-16 rounded-full bg-pink-500 text-white shadow-lg flex items-center justify-center transform transition-transform duration-300 hover:scale-110">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
        </div>
    )
};


// --- Компонент: Список новелл (Главный экран) ---
const NovelList = ({ onSelectNovel, theme, setTheme, genreFilter, onClearGenreFilter }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const t = themes[theme];

  const filteredNovels = useMemo(() => 
    mockNovels
      .filter(novel => !genreFilter || novel.genres.includes(genreFilter))
      .filter(novel => novel.title.toLowerCase().includes(searchQuery.toLowerCase()))
  , [searchQuery, genreFilter]);

  return (
    <div className={`p-4 ${t.text}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Библиотека</h1>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className={`p-2 rounded-full ${t.componentBg} ${t.border} border`}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>

      {genreFilter && (
        <div className={`flex items-center justify-between p-3 mb-4 rounded-lg border ${t.border} ${t.componentBg}`}>
            <p className="text-sm">
                <span className="opacity-70">Жанр:</span>
                <strong className="ml-2">{genreFilter}</strong>
            </p>
            <button onClick={onClearGenreFilter} className="text-xs font-bold text-pink-500 hover:underline">
                Сбросить
            </button>
        </div>
      )}

      <div className="relative mb-6">
        <SearchIcon className={t.searchPlaceholder} />
        <input type="text" placeholder="Поиск по названию..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full ${t.searchBg} ${t.border} border rounded-lg py-2 pl-10 pr-4 ${t.text} ${t.searchPlaceholder} focus:outline-none focus:ring-2 ${t.searchRing} transition-shadow duration-300`}
        />
      </div>
      
      {filteredNovels.length > 0 ? (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">
          {filteredNovels.map(novel => (
            <div key={novel.id} onClick={() => onSelectNovel(novel)} className="cursor-pointer group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg blur-md opacity-0 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative">
                <img src={novel.coverUrl} alt={novel.title} className={`w-full aspect-[2/3] object-cover rounded-lg shadow-md transition-transform duration-300 group-hover:scale-105 ${t.border} border`} />
                <h2 className={`mt-2 font-semibold text-xs truncate ${t.text}`}>{novel.title}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">{novel.lastUpdate}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center mt-8">Ничего не найдено.</p>
      )}
    </div>
  );
};


// --- Компонент: Детали новеллы ---
const NovelDetails = ({ novel, onSelectChapter, onGenreSelect, theme }) => {
    const t = themes[theme];
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest' или 'oldest'

    const sortedChapters = useMemo(() => {
        if (sortOrder === 'newest') {
            return [...novel.chapters].reverse();
        }
        return novel.chapters;
    }, [novel.chapters, sortOrder]);

    return (
        <div className={t.text}>
            <div className="relative h-64">
                <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover object-top absolute"/>
                <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'dark' ? 'from-gray-900 via-gray-900/80' : 'from-stone-100 via-stone-100/80'} to-transparent`}></div>
                <div className="absolute bottom-4 left-4">
                    <h1 className="text-3xl font-bold" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.5)'}}>{novel.title}</h1>
                    <p className="text-sm" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>{novel.author}</p>
                </div>
            </div>
    
            <div className="p-4">
                <div className="flex flex-wrap gap-2 mb-4">
                    {novel.genres.map(genre => (
                        <button 
                          key={genre} 
                          onClick={() => onGenreSelect(genre)}
                          className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors duration-200 ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-stone-200 text-stone-700 hover:bg-stone-300'}`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
                <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-stone-600'}`}>{novel.description}</p>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Главы</h2>
                    <select 
                        value={sortOrder} 
                        onChange={(e) => setSortOrder(e.target.value)}
                        className={`text-sm p-2 rounded-lg border ${t.border} ${t.componentBg} ${t.text} focus:outline-none focus:ring-1 focus:ring-pink-400`}
                    >
                        <option value="newest">Сначала новые</option>
                        <option value="oldest">Сначала старые</option>
                    </select>
                </div>
                <div className="flex flex-col gap-3">
                    {sortedChapters.map(chapter => (
                        <div key={chapter.id} onClick={() => onSelectChapter(chapter)} className={`p-4 ${t.componentBg} rounded-xl cursor-pointer transition-colors duration-200 hover:border-pink-400 border ${t.border} flex items-center justify-between`}>
                            <div>
                                <p className={`font-semibold ${t.componentText}`}>{chapter.title}</p>
                            </div>
                            <ArrowRightIcon className={t.text}/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
};

// --- Компонент: Читалка глав ---
const ChapterReader = ({ chapter, novel, theme }) => {
  const t = themes[theme];
  return (
    <div className={`min-h-screen transition-colors duration-300 ${t.bg}`}>
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center">{novel.title}</h1>
        <h2 className="text-lg sm:text-xl mb-8 text-center opacity-80">{chapter.title}</h2>
        <div className={`whitespace-pre-wrap leading-relaxed text-lg ${t.text}`}>{chapter.content}</div>
      </div>
    </div>
  );
};


// --- Главный компонент приложения ---
export default function App() {
  const [theme, setTheme] = useState('light'); // 'light' или 'dark'
  const [page, setPage] = useState('list'); // 'list', 'details', 'reader'
  const [selectedNovel, setSelectedNovel] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [genreFilter, setGenreFilter] = useState(null);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const handleBack = useCallback(() => {
      if (page === 'reader') setPage('details');
      else if (page === 'details') {
          setPage('list');
          setGenreFilter(null); // Сбрасываем фильтр при возврате на главный экран
      }
  }, [page]);

  const handleHome = useCallback(() => {
      setPage('list');
      setGenreFilter(null); // Сбрасываем фильтр при возврате на главный экран
  }, []);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;
    tg.ready();
    tg.expand();
    
    tg.onEvent('backButtonClicked', handleBack);
    if (page === 'list') tg.BackButton.hide();
    else tg.BackButton.show();
    
    return () => tg.offEvent('backButtonClicked', handleBack);
  }, [page, handleBack]);

  useEffect(() => {
      const tg = window.Telegram?.WebApp;
      if (!tg) return;
      tg.setHeaderColor(themes[theme].tgHeader);
      tg.setBackgroundColor(themes[theme].tgBg);
  }, [theme]);


  const handleSelectNovel = (novel) => { setSelectedNovel(novel); setPage('details'); };
  const handleSelectChapter = (chapter) => { setSelectedChapter(chapter); setPage('reader'); };
  
  const handleGenreSelect = (genre) => {
    setGenreFilter(genre);
    setPage('list');
  };

  const handleClearGenreFilter = () => {
    setGenreFilter(null);
  };

  const renderPage = () => {
    switch (page) {
      case 'details': return <NovelDetails novel={selectedNovel} onSelectChapter={handleSelectChapter} onGenreSelect={handleGenreSelect} theme={theme} />;
      case 'reader': return <ChapterReader chapter={selectedChapter} novel={selectedNovel} theme={theme} />;
      case 'list': default: return <NovelList onSelectNovel={handleSelectNovel} theme={theme} setTheme={setTheme} genreFilter={genreFilter} onClearGenreFilter={handleClearGenreFilter} />;
    }
  };

  const t = themes[theme];

  return (
    <main className={`${t.bg} min-h-screen`}>
      {renderPage()}
      {page !== 'list' && <FloatingNav onBack={handleBack} onHome={handleHome} />}
    </main>
  );
}

