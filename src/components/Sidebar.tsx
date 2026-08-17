// components/Sidebar.tsx
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { useBattleStore } from '../store/battleStore';
import { BattleWidget } from './BattleWidget';

type PageType = 'home' | 'adventure' | 'collection' | 'achievement' | 'marketplace' | 'profile';

export const Sidebar = () => {
    const { currentPage, setCurrentPage } = useGameStore();
    const { user, userProfile, logout } = useAuthStore();
    const { selectedBoss, bossEffectiveStats, finalStatsSnapshot } = useBattleStore();

    const isEmbedded = (() => {
        try {
            return window.self !== window.top || window.location.hostname.includes('crazygames');
        } catch (e) {
            return true;
        }
    })();

    const menu: { id: PageType; label: string; icon?: string }[] = [
        { id: 'home', label: 'Main' },
        { id: 'profile', label: 'Player Profile' },
        { id: 'adventure', label: 'Boss Lobby' },
        { id: 'collection', label: 'Items Collection' },
        { id: 'achievement', label: 'Achievements' },
        ...(user && !isEmbedded ? [{ id: 'marketplace' as PageType, label: 'Marketplace' }] : []),
    ];

    const handleLogout = async () => {
        await logout();
    };

    const hasActiveBattle = selectedBoss && bossEffectiveStats && finalStatsSnapshot;

    return (
        /* 
          1. เปลี่ยนจาก h-screen เป็น h-full และใช้ sticky top-0 เพื่อให้เส้นกรอบยาวเต็มความสูงของหน้าจอเสมอ 
          2. เพิ่ม overflow-y-auto ให้สามารถเลื่อนดูเนื้อหาใน sidebar ได้หากหน้าจอเล็กเกินไป
        */
        <div className="w-64 h-screen sticky top-0 bg-slate-950 border-r border-slate-800 p-4 flex flex-col gap-2 overflow-y-auto">
            <h1 className="text-xl font-bold text-white mb-6 shrink-0">RNG-Text-Based MMO</h1>

            {/* ส่วนเมนูหลัก */}
            <div className="flex flex-col gap-2 shrink-0">
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
            </div>

            {/* ส่วนล่างของ Sidebar */}
            <div className="mt-auto pt-4 border-t border-slate-800 space-y-3 shrink-0">
                {hasActiveBattle && (
                    <div className="relative w-full">
                        <BattleWidget isSidebarMode={true} />
                    </div>
                )}

                {(userProfile || user) && (
                    <p className="text-emerald-400 text-xs px-1 truncate font-medium">
                        Account : {userProfile?.username || user?.email || user?.displayName || 'ผู้เล่น'}
                    </p>
                )}

                {!isEmbedded && (
                    <button
                        node-type="logout"
                        onClick={handleLogout}
                        className="w-full p-2.5 rounded-lg text-left text-red-400 hover:bg-red-950/40 transition cursor-pointer text-sm font-medium"
                    >
                        Logout
                    </button>
                )}

                <div className="pt-2 border-t border-slate-900 text-center flex flex-col gap-1">
                    <p className="text-[10px] text-slate-400 leading-tight">
                        By playing, you agree to our{' '}
                        <span className="text-emerald-400 underline cursor-pointer">Terms</span> &{' '}
                        <span className="text-emerald-400 underline cursor-pointer">Privacy</span>.
                    </p>
                    <p className="text-[9px] text-slate-500">
                        Icons by <a href="https://game-icons.net/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 underline">Game-Icons.net</a>
                    </p>
                </div>
            </div>
        </div>
    );
};