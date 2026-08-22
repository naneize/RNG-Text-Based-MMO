// pages/TowerPage.tsx
// Lobby ของ Boss Tower — สถานะ checkpoint, ปุ่มเริ่ม/ไปต่อ, กติกาสั้น ๆ
import { useTowerStore } from '../store/towerStore';
import { useGameStore } from '../store/gameStore';
import { useBattleStore } from '../store/battleStore';
import { FLOORS_PER_CHECKPOINT } from '../data/towerConfig';

export const TowerPage = () => {
    const {
        highestCleared,
        isActive,
        currentFloor,
        runPlayerHpPercent,
        floorsClearedThisRun,
        lastRunSummary,
        getCheckpointStart,
        startRun,
        nextFloor,
        endRun,
        dismissRunSummary,
    } = useTowerStore();
    const setCurrentPage = useGameStore((s) => s.setCurrentPage);

    const checkpointStart = getCheckpointStart();
    const canStartFromCheckpoint = checkpointStart > 1;

    const handleStart = (fromCheckpoint: boolean) => {
        startRun(fromCheckpoint);
        setCurrentPage('adventure'); // การต่อสู้ของ tower แสดงผ่าน BattleScreen บนหน้า Boss Lobby
    };

    return (
        <div className="bg-stone-950 rounded-2xl border border-amber-900/80 shadow-2xl shadow-amber-950/40 w-full max-w-3xl mx-auto p-6 text-amber-100 space-y-6">
            {/* หัวเรื่อง */}
            <div className="text-center border-b border-amber-950 pb-4">
                <h2 className="text-2xl font-extrabold text-amber-400 tracking-widest uppercase drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                    Boss Tower
                </h2>
                <p className="text-amber-200/60 text-xs mt-1 tracking-wide">
                    Endless floors. Escalating modifiers. Your build is the key.
                </p>
            </div>

            {/* สถิติ */}
            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-stone-900/80 rounded-xl border border-amber-950 p-3">
                    <p className="text-[10px] text-amber-500/70 uppercase tracking-widest">Highest Cleared</p>
                    <p className="text-xl font-extrabold text-amber-300 font-mono">F.{highestCleared}</p>
                </div>
                <div className="bg-stone-900/80 rounded-xl border border-amber-950 p-3">
                    <p className="text-[10px] text-amber-500/70 uppercase tracking-widest">Checkpoint</p>
                    <p className="text-xl font-extrabold text-amber-300 font-mono">F.{checkpointStart}</p>
                </div>
                <div className="bg-stone-900/80 rounded-xl border border-amber-950 p-3">
                    <p className="text-[10px] text-amber-500/70 uppercase tracking-widest">Next Milestone</p>
                    <p className="text-xl font-extrabold text-amber-300 font-mono">
                        F.{(Math.floor(highestCleared / FLOORS_PER_CHECKPOINT) + 1) * FLOORS_PER_CHECKPOINT}
                    </p>
                </div>
            </div>

            {/* สรุปรันก่อนหน้า */}
            {lastRunSummary && (
                <div className="bg-amber-950/30 rounded-xl border border-amber-800/50 p-4 text-center space-y-2">
                    <p className="text-sm font-bold text-amber-300">
                        {lastRunSummary.cause === 'death' ? '☠️ Run Ended — You Died' : '🏃 Run Ended — Retreated'}
                    </p>
                    <p className="text-xs text-amber-200/80">
                        Reached Floor {lastRunSummary.reachedFloor} · Cleared {lastRunSummary.clearedFloors} floor{lastRunSummary.clearedFloors > 1 ? 's' : ''} this run
                    </p>
                    <button
                        onClick={dismissRunSummary}
                        className="text-[10px] bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-900/80 px-3 py-1 rounded-full cursor-pointer transition"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* ปุ่มควบคุม */}
            {isActive && currentFloor ? (
                <div className="space-y-3">
                    <div className="bg-stone-900/60 border border-amber-900/60 rounded-xl p-4 flex items-center justify-between shadow-inner">
                        <div>
                            <p className="text-xs text-amber-400 font-bold uppercase tracking-widest">Run in progress</p>
                            <p className="text-amber-100 text-sm mt-1">
                                Floor {currentFloor.floor} · HP carry {Math.round(runPlayerHpPercent * 100)}%
                                {floorsClearedThisRun > 0 && ` · ${floorsClearedThisRun} cleared this run`}
                            </p>
                            {currentFloor.modifiers.map((m) => (
                                <p key={m.id} className="text-[10px] text-rose-300/90 mt-0.5">◈ {m.name} — <span className="text-amber-100/70">{m.description}</span></p>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                // ชั้นปัจจุบันยังสู้ไม่จบ → กลับเข้าไปสู้ต่อชั้นเดิม (ห้ามข้ามชั้น)
                                const battle = useBattleStore.getState();
                                const floorStillAlive = battle.selectedBoss && battle.bossHp > 0 && battle.playerHp > 0;
                                if (!floorStillAlive) {
                                    nextFloor();
                                }
                                setCurrentPage('adventure');
                            }}
                            className="flex-grow py-3 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/25 transition cursor-pointer text-sm"
                        >
                            CONTINUE CLIMB — FLOOR {currentFloor.floor}
                        </button>
                        <button
                            onClick={() => {
                                endRun('exit');
                                useBattleStore.getState().leaveBattle();
                            }}
                            className="px-4 py-3 bg-stone-800 hover:bg-stone-700 border border-amber-900/60 text-amber-300 font-bold rounded-xl text-sm transition cursor-pointer"
                        >
                            Abandon Run
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <button
                        onClick={() => handleStart(false)}
                        className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-stone-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/25 transition cursor-pointer text-sm"
                    >
                        START FROM FLOOR 1
                    </button>
                    {canStartFromCheckpoint && (
                        <button
                            onClick={() => handleStart(true)}
                            className="w-full py-3 bg-stone-800 hover:bg-stone-700 border border-amber-700/60 text-amber-300 font-bold rounded-xl transition cursor-pointer text-sm"
                        >
                            RESUME FROM CHECKPOINT — FLOOR {checkpointStart}
                        </button>
                    )}
                </div>
            )}

            {/* กติกาสั้น ๆ */}
            <div className="bg-stone-900/60 rounded-xl border border-amber-950 p-4 text-[11px] text-amber-200/70 leading-relaxed space-y-1">
                <p>◆ Boss stats scale every floor. Every {FLOORS_PER_CHECKPOINT}th floor is a <span className="text-amber-300 font-bold">Boss Floor</span> — tougher, double material rewards.</p>
                <p>◆ <span className="text-amber-300 font-bold">Tower bonus materials</span> are added automatically on every floor you clear — you'll see them listed in the reward window after each victory.</p>
                <p>◆ HP carries between floors (+25% restored per floor cleared). Death ends the run — you keep everything earned.</p>
                <p>◆ Checkpoints every {FLOORS_PER_CHECKPOINT} floors: new runs may resume from your latest checkpoint.</p>
                <p>◆ Auto Farm is disabled inside the tower — this climb is earned, not idled.</p>
            </div>
        </div>
    );
};
