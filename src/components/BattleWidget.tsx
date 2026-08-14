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
                } group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3 text-left transition-all duration-300 backdrop-blur-sm cursor-pointer`}
        >
            {/* แถบเรืองแสงด้านหลังแบบอ่อนๆ คุมโทน */}
            <div className={`absolute -inset-0.5 rounded-xl blur-sm opacity-15 group-hover:opacity-40 transition duration-500 pointer-events-none ${isAutoFarm ? 'bg-emerald-500/30' : 'bg-slate-600/30'
                }`}></div>

            <div className="relative z-10">
                {/* Header: ชื่อบอส และสถานะ Auto / Battle */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/60">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="relative flex h-2 w-2">
                            {isAutoFarm && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isAutoFarm ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                        </span>
                        <span className="text-xs font-medium text-slate-300 truncate tracking-wide">{selectedBoss.name}</span>
                    </div>

                    {isAutoFarm ? (
                        <span className="text-[9px] px-2 py-0.5 bg-emerald-600 border border-emerald-500 rounded text-white font-bold tracking-wider animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.7)]">
                            AUTO
                        </span>
                    ) : (
                        <span className="text-[9px] px-2 py-0.5 bg-slate-800/50 border border-slate-700/50 rounded text-slate-400 font-medium">
                            BATTLE
                        </span>
                    )}
                </div>

                {/* HP Bars Section */}
                <div className="space-y-1.5 mb-2">
                    {/* Boss HP */}
                    <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span className="text-red-400/90">Boss</span>
                            <span className="text-slate-400 font-mono text-[9px]">{bossHp.toLocaleString()} <span className="text-slate-600">/</span> {bossEffectiveStats.maxHp.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/40">
                            <div
                                className="bg-red-500/80 h-full rounded-full transition-all duration-300"
                                style={{ width: `${bossHpPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Player HP */}
                    <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                            <span className="text-emerald-400/90">You</span>
                            <span className="text-slate-400 font-mono text-[9px]">{playerHp.toLocaleString()} <span className="text-slate-600">/</span> {(finalStatsSnapshot.maxHp || 0).toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/40">
                            <div
                                className="bg-emerald-500/80 h-full rounded-full transition-all duration-300"
                                style={{ width: `${playerHpPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer status / Action prompt */}
                {!isFighting && (
                    <div className="text-[9px] bg-slate-800/40 border border-slate-700/40 text-slate-300 py-0.5 px-2 rounded text-center tracking-wide">
                        Tap to return
                    </div>
                )}
            </div>
        </button>
    );
};