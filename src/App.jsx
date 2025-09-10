import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, collection } from "firebase/firestore";
import { db, auth } from './firebase-config';
import { AuthScreen } from './components/AuthScreen';
import { LoadingSpinner } from './components/LoadingSpinner';
import { BottomNav } from './components/BottomNav';
import { NovelList } from './components/NovelList';
import { NovelDetails } from './components/NovelDetails';
import { ChapterReader } from './components/ChapterReader';
import { SearchPage } from './components/pages/SearchPage';
import { BookmarksPage } from './components/pages/BookmarksPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { NewsSlider } from './components/NewsSlider';
import { SubscriptionModal, PaymentMethodModal, NewsModal } from './components/Modals';

export default function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [novels, setNovels] = useState([]);
    const [page, setPage] = useState('list'); // list, details, reader
    const [selectedNovel, setSelectedNovel] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [bookmarks, setBookmarks] = useState([]);
    const [isUserAdmin, setIsUserAdmin] = useState(false);
    const [lastReadData, setLastReadData] = useState({});
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [selectedNews, setSelectedNews] = useState(null);
    const [activeTab, setActiveTab] = useState('library'); // library, search, bookmarks, profile
    const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('fontSize'), 10) || 16);
    const [fontClass] = useState('font-sans'); // Placeholder for future font selection

    const BOT_USERNAME = "tenebrisverbot";
    const userId = user?.uid;
    const userName = user?.displayName || "Аноним";
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Fetch user data, sub, bookmarks, etc.
                const adminRef = doc(db, "admins", currentUser.uid);
                const adminSnap = await getDoc(adminRef);
                setIsUserAdmin(adminSnap.exists());

                onSnapshot(doc(db, "users", currentUser.uid, "subscription", "current"), (doc) => {
                    setSubscription(doc.data());
                });
                onSnapshot(doc(db, "users", currentUser.uid), (doc) => {
                    setBookmarks(doc.data()?.bookmarks || []);
                    setLastReadData(doc.data()?.lastRead || {});
                });
            }
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        fetch('/tene/data/novels.json')
            .then(res => res.json())
            .then(data => setNovels(data))
            .catch(error => console.error("Failed to load novels:", error));
    }, []);
    
    const handleSelectNovel = useCallback((novel) => {
        setSelectedNovel(novel);
        setPage('details');
        setIsLoadingChapters(true);
        // Simulate fetching chapters
        setTimeout(() => {
             fetch(`/tene/data/${novel.id}.json`)
                .then(res => res.json())
                .then(data => setChapters(data.chapters || []))
                .catch(() => setChapters([]))
                .finally(() => setIsLoadingChapters(false));
        }, 300);
    }, []);

    const handleSelectChapter = useCallback(async (novelId, chapterId) => {
        const chapter = chapters.find(c => c.id === chapterId);
        if (chapter) {
            setSelectedChapter(chapter);
            setPage('reader');
            // Update last read chapter
            if (userId) {
                const userRef = doc(db, "users", userId);
                await setDoc(userRef, {
                    lastRead: { ...lastReadData, [novelId]: { chapterId, chapterTitle: chapter.title } }
                }, { merge: true });
            }
        }
    }, [chapters, userId, lastReadData]);

    const handleToggleBookmark = useCallback(async (novelId) => {
        if (!userId) return;
        const userRef = doc(db, "users", userId);
        const newBookmarks = bookmarks.includes(novelId)
            ? bookmarks.filter(id => id !== novelId)
            : [...bookmarks, novelId];
        await setDoc(userRef, { bookmarks: newBookmarks }, { merge: true });
    }, [bookmarks, userId]);

    const handleFontSizeChange = (size) => {
        setFontSize(size);
        localStorage.setItem('fontSize', size);
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setIsSubModalOpen(false);
    };

    const handlePaymentMethodSelect = async (method) => {
        if (!selectedPlan || !userId) return;
        const message = `Оплата подписки:
        Тариф: ${selectedPlan.name} (${selectedPlan.price} ₽)
        Способ: ${method}
        UserID: ${userId}`;
        const telegramUrl = `https://t.me/${BOT_USERNAME}?start=subscribe_${userId}_${selectedPlan.duration}`;
        window.open(telegramUrl, '_blank');
        setSelectedPlan(null);
    };
    
    const renderContent = () => {
        if (page === 'details' && selectedNovel) {
            return <NovelDetails 
                novel={selectedNovel} 
                onBack={() => setPage('list')}
                onSelectChapter={handleSelectChapter}
                chapters={chapters}
                isLoadingChapters={isLoadingChapters}
                subscription={subscription}
                lastReadData={lastReadData}
                onGenreSelect={(genre) => {
                    // Logic to handle genre selection from details page
                    setActiveTab('search');
                    setPage('list');
                }}
            />;
        }
        if (page === 'reader' && selectedChapter) {
            return <ChapterReader 
                chapter={selectedChapter}
                novel={selectedNovel}
                onBack={() => setPage('details')}
                onSelectChapter={handleSelectChapter}
                allChapters={chapters}
                subscription={subscription}
                userId={userId}
                userName={userName}
                isUserAdmin={isUserAdmin}
                fontSize={fontSize}
                onFontSizeChange={handleFontSizeChange}
                currentFontClass={fontClass}
            />;
        }

        // Main 'list' page with tabs
        switch (activeTab) {
            case 'search':
                return <SearchPage 
                    novels={novels}
                    onSelectNovel={handleSelectNovel}
                    bookmarks={bookmarks}
                    onToggleBookmark={handleToggleBookmark}
                    onGenreSelect={(genre) => console.log(genre)}
                />;
            case 'bookmarks':
                return <BookmarksPage 
                    allNovels={novels}
                    onSelectNovel={handleSelectNovel}
                    bookmarks={bookmarks}
                    onToggleBookmark={handleToggleBookmark}
                />;
            case 'profile':
                return <ProfilePage 
                    user={user}
                    subscription={subscription}
                    auth={auth}
                    onGetSubscriptionClick={() => setIsSubModalOpen(true)}
                />;
            case 'library':
            default:
                return (
                    <div>
                        <NewsSlider onReadMore={setSelectedNews} />
                        <NovelList
                            novels={novels}
                            onSelectNovel={handleSelectNovel}
                            bookmarks={bookmarks}
                            onToggleBookmark={handleToggleBookmark}
                        />
                    </div>
                );
        }
    };

    if (isLoading) return <LoadingSpinner />;
    if (!user) return <AuthScreen auth={auth} />;

    return (
        <main className={`bg-background min-h-screen text-text-main ${!isUserAdmin ? 'no-select' : ''}`}>
            <div className="pb-20 max-w-4xl mx-auto">
                {renderContent()}
            </div>

            {(page === 'list') && (
                <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
            )}

            {isSubModalOpen && <SubscriptionModal onClose={() => setIsSubModalOpen(false)} onSelectPlan={handlePlanSelect} />}
            {selectedPlan && <PaymentMethodModal onClose={() => setSelectedPlan(null)} onSelectMethod={handlePaymentMethodSelect} plan={selectedPlan} />}
            {selectedNews && <NewsModal newsItem={selectedNews} onClose={() => setSelectedNews(null)} />}
        </main>
    );
}