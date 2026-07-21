import { useGameStore } from '../store/gameStore';

type PageType = 'home' | 'adventure' | 'collection' | 'achievement';

export const Sidebar = () => {
    const { currentPage, setCurrentPage } = useGameStore();

    const menu: { id: PageType; label: string }[] = [
        { id: 'home', label: 'Main' },
        { id: 'adventure', label: 'Boss Lobby' },
        { id: 'collection', label: 'Items Collection' },
        { id: 'achievement', label: 'Achievements' }, // <-- เมนูนี้ต้องอยู่ในไฟล์นี้
    ];

    return (
        <div className="w-64 h-screen bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-2">
            <h1 className="text-xl font-bold text-White mb-6">RNG-Text-Based MMO</h1>
            {menu.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`p-3 rounded-lg text-left transition ${currentPage === item.id
                        ? 'bg-emerald-900 text-white'
                        : 'text-slate-400 hover:bg-slate-900'
                        }`}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
};