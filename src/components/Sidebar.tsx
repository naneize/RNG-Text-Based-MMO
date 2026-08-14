// components/Sidebar.tsx
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { useBattleStore } from '../store/battleStore';
import { BattleWidget } from './BattleWidget'; // 👈 1. นำเข้า BattleWidget ตัวใหม่มาใช้

type PageType = 'home' | 'adventure' | 'collection' | 'achievement' | 'marketplace' | 'profile';

export const Sidebar = () => {
    const { currentPage, setCurrentPage } = useGameStore();
    const { user, userProfile, logout } = useAuthStore();
    const { selectedBoss, bossEffectiveStats, finalStatsSnapshot } = useBattleStore(); // เช็คแค่ว่ามีบอสอยู่มั้ย

    const menu: { id: PageType; label: string; icon?: string }[] = [
        { id: 'home', label: 'Main' },
        { id: 'profile', label: 'Player Profile' },
        { id: 'adventure', label: 'Boss Lobby' },
        { id: 'collection', label: 'Items Collection' },
        { id: 'achievement', label: 'Achievements' },
        ...(user ? [{ id: 'marketplace' as PageType, label: 'Marketplace' }] : []),
    ];

    const handleLogout = async () => {
        await logout();
    };

    const hasActiveBattle = selectedBoss && bossEffectiveStats && finalStatsSnapshot;

    return (
        <div className="w-64 h-screen bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-2">
            <h1 className="text-xl font-bold text-white mb-6">RNG-Text-Based MMO</h1>
            {menu.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={`p-3 rounded-lg text-left transition flex items-center gap-3 ${currentPage === item.id
                        ? 'bg-emerald-900 text-white'
                        : 'text-slate-400 hover:bg-slate-900'
                        }`}
                >
                    {item.icon && <span className="text-lg">{item.icon}</span>}
                    {item.label}
                </button>
            ))}

            {/* ดันส่วนผู้เล่น + ปุ่ม Logout ไปอยู่ล่างสุดของ sidebar */}
            <div className="mt-auto pt-4 border-t border-slate-800 space-y-3">

                {/* ⚔️ เรียกใช้ BattleWidget แบบฝังใน Sidebar โดยตรง */}
                {hasActiveBattle && (
                    <div className="relative w-full">
                        <BattleWidget isSidebarMode={true} />
                    </div>
                )}

                {/* Account Info */}
                {(userProfile || user) && (
                    <p className="text-emerald-400 text-xs px-1 truncate font-medium">
                        Account : {userProfile?.username || user?.email || user?.displayName || 'ผู้เล่น'}
                    </p>
                )}

                {/* Logout Button */}
                <button
                    node-type="logout"
                    onClick={handleLogout}
                    className="w-full p-2.5 rounded-lg text-left text-red-400 hover:bg-red-950/40 transition cursor-pointer text-sm font-medium"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};