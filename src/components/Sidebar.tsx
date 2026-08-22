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
        <div className="w-64 h-screen sticky top-0 bg-stone-950 border-r border-amber-900/30 p-4 flex flex-col gap-2 overflow-y-auto shadow-[5px_0_20px_rgba(0,0,0,0.5)]">
            <h1 className="text-xl font-bold text-amber-100 tracking-wider mb-6 shrink-0 drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
                RNG-Text-Based MMO
            </h1>

            {/* ส่วนเมนูหลัก */}
            <div className="flex flex-col gap-2 shrink-0">
                {menu.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentPage(item.id)}
                        className={`p-3 rounded-lg text-left transition flex items-center gap-3 cursor-pointer text-sm font-semibold tracking-wide ${currentPage === item.id
                            ? 'bg-gradient-to-r from-rose-950 to-red-950 text-amber-200 border border-amber-500/50 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                            : 'text-amber-100/60 hover:bg-stone-900 hover:text-amber-100 border border-transparent'
                            } font-display`}
                    >
                        {item.icon && <span className="text-lg">{item.icon}</span>}
                        {item.label}
                    </button>
                ))}
            </div>

            {/* ส่วนล่างของ Sidebar */}
            <div className="mt-auto pt-4 border-t border-amber-900/30 space-y-3 shrink-0">
                {hasActiveBattle && (
                    <div className="relative w-full">
                        <BattleWidget isSidebarMode={true} />
                    </div>
                )}

                {(userProfile || user) && (
                    <p className="text-amber-400 text-xs px-1 truncate font-medium drop-shadow-sm">
                        Account : {userProfile?.username || user?.email || user?.displayName || 'ผู้เล่น'}
                    </p>
                )}

                {!isEmbedded && (
                    <button
                        node-type="logout"
                        onClick={handleLogout}
                        className="w-full p-2.5 rounded-lg text-left text-red-400 hover:bg-red-950/50 hover:text-red-300 transition cursor-pointer text-sm font-medium border border-transparent hover:border-red-900/40"
                    >
                        Logout
                    </button>
                )}

                <div className="pt-2 border-t border-amber-900/20 text-center flex flex-col gap-1">
                    <p className="text-[10px] text-amber-500/70 leading-tight">
                        By playing, you agree to our{' '}
                        <span className="text-amber-400 underline cursor-pointer">Terms</span> &{' '}
                        <span className="text-amber-400 underline cursor-pointer">Privacy</span>.
                    </p>
                    <p className="text-[9px] text-amber-600/60">
                        Icons by <a href="https://game-icons.net/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 underline">Game-Icons.net</a>
                    </p>
                </div>
            </div>
        </div>
    );
};