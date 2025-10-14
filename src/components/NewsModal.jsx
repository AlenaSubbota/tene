export const NewsModal = ({ newsItem, onClose }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="w-full max-w-md p-6 rounded-2xl shadow-lg bg-component-bg text-text-main flex flex-col" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 break-words">{newsItem.title}</h2>
            
            {/* 👇 ИСПРАВЛЕНИЕ ЗДЕСЬ 👇 */}
            <div 
              className="prose prose-sm max-w-none text-text-main opacity-80 overflow-y-auto max-h-[60vh] "
              dangerouslySetInnerHTML={{ __html: newsItem.fullText }} 
            />
            
            <button onClick={onClose} className="w-full py-2 mt-6 rounded-lg bg-accent text-white font-bold">Закрыть</button>
        </div>
    </div>
);