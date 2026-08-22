// components/BattleWidget.tsx
import { useBattleStore } from '../store/battleStore';
import { useGameStore } from '../store/gameStore';

interface BattleWidgetProps {
    isSidebarMode?: boolean;
}

export const BattleWidget = ({ isSidebarMode = false }: BattleWidgetProps) => {
    const { selectedBoss, bossEffectiveStats, playerHp, bossHp, finalStatsSnapshot, isFighting, isAutoFarm } = useBattleStore();
    const { currentPage, setCurrentPage } = useGameStore();

    if (!selectedBoss || !bossEffectiveStats || !finalStatsSnapshot) return null;

    // ถ้าไม่ได้อยู่ในโหมด Sidebar แล้วอยู่หน้า adventure ให้ซ่อนเหมือนเดิม
    if (!isSidebarMode && currentPage === 'adventure') return null;

    const bossHpPercent = Math.max(0, (bossHp / bossEffectiveStats.maxHp) * 100);
    const playerHpPercent = Math.max(0, (playerHp / (finalStatsSnapshot.maxHp || 1)) * 100);

    return (
        <button
            onClick={() => setCurrentPage('adventure')}
            className={`${isSidebarMode
                ? 'w-full relative'
                : 'fixed bottom-5 right-5 z-40 w-64'
                } group bg-stone-950/80 hover:bg-stone-950 border border-amber-900/60 hover:border-amber-500/80 rounded-xl p-3 text-left transition-all duration-300 backdrop-blur-md cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.8)]`}
        >
            {/* แถบเรืองแสงด้านหลังโทนอำพัน */}
            <div className={`absolute -inset-0.5 rounded-xl blur-sm opacity-20 group-hover:opacity-50 transition duration-500 pointer-events-none ${isAutoFarm ? 'bg-amber-500/40' : 'bg-amber-900/40'
                }`}></div>

            <div className="relative z-10">
                {/* Header: ชื่อบอส และสถานะ Auto / Battle */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-amber-900/40">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="relative flex h-2 w-2">
                            {isAutoFarm && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoFarm ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-stone-600'}`}></span>
                        </span>
                        <span className="text-xs font-semibold text-amber-200/90 truncate tracking-wide">{selectedBoss.name}</span>
                    </div>

                    {isAutoFarm ? (
                        <span className="text-[9px] px-2 py-0.5 bg-amber-500/20 border border-amber-500/60 rounded text-amber-300 font-bold tracking-wider animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                            AUTO
                        </span>
                    ) : (
                        <span className="text-[9px] px-2 py-0.5 bg-stone-900/80 border border-stone-700/60 rounded text-stone-400 font-medium">
                            BATTLE
                        </span>
                    )}
                </div>

                {/* HP Bars Section */}
                <div className="space-y-1.5 mb-2">
                    {/* Boss HP */}
                    <div>
                        <div className="flex justify-between text-[10px] text-stone-400 mb-0.5">
                            <span className="text-red-400/90 font-medium">Boss</span>
                            <span className="text-stone-300 font-mono text-[9px]">{bossHp.toLocaleString()} <span className="text-stone-600">/</span> {bossEffectiveStats.maxHp.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden border border-amber-950">
                            <div
                                className="bg-red-600/90 h-full rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                                style={{ width: `${bossHpPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Player HP */}
                    <div>
                        <div className="flex justify-between text-[10px] text-stone-400 mb-0.5">
                            <span className="text-emerald-400/90 font-medium">You</span>
                            <span className="text-stone-300 font-mono text-[9px]">{playerHp.toLocaleString()} <span className="text-stone-600">/</span> {(finalStatsSnapshot.maxHp || 0).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-stone-950 h-1.5 rounded-full overflow-hidden border border-amber-950">
                            <div
                                className="bg-emerald-500/90 h-full rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                                style={{ width: `${playerHpPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer status / Action prompt */}
                {!isFighting && (
                    <div className="text-[9px] bg-amber-950/30 border border-amber-900/40 text-amber-300/80 py-0.5 px-2 rounded text-center tracking-wide">
                        Tap to return
                    </div>
                )}
            </div>
        </button>
    );
};