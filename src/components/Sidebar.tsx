import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';

type PageType = 'home' | 'adventure' | 'collection' | 'achievement'; // เพิ่ม 'worldchat' เข้าไปใน type

export const Sidebar = () => {
    const { currentPage, setCurrentPage } = useGameStore();
    const { user, logout } = useAuthStore();

    const menu: { id: PageType; label: string }[] = [
        { id: 'home', label: 'Main' },
        { id: 'adventure', label: 'Boss Lobby' },
        { id: 'collection', label: 'Items Collection' },
        { id: 'achievement', label: 'Achievements' },

    ];

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="w-64 h-screen bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-2">
            <h1 className="text-xl font-bold text-white mb-6">RNG-Text-Based MMO</h1>
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

            {/* ดันส่วนผู้เล่น + ปุ่ม Logout ไปอยู่ล่างสุดของ sidebar */}
            <div className="mt-auto pt-4 border-t border-slate-800">
                {user && (
                    <p className="text-slate-500 text-xs px-3 mb-2 truncate">
                        {user.email || user.displayName || 'ผู้เล่น'}
                    </p>
                )}
                <button
                    node-type="logout"
                    onClick={handleLogout}
                    className="w-full p-3 rounded-lg text-left text-red-400 hover:bg-red-950/40 transition"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};