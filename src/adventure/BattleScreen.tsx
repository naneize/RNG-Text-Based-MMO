import { useState, useMemo, useEffect } from 'react';
import { getEffectiveStats } from '../utils/combat';
import { useBattle } from '../hooks/useBattle';
import type { Stats, Boss, Player } from '../types/game';
import { RewardModal } from '../components/Modals/RewardModal';
import { useGameStore } from '../store/gameStore'; // ดึง store มาใช้

interface BattleScreenProps {
    player: Player;
    selectedBoss: Boss;
    finalStats: Stats;
    onBack: () => void;
    onGameOver: () => void;
}

export const BattleScreen = ({ player, selectedBoss, finalStats, onBack, onGameOver }: BattleScreenProps) => {
    const [showBossStats, setShowBossStats] = useState(false);

    const [showRewardModal, setShowRewardModal] = useState(false);
    const [receivedRewards, setReceivedRewards] = useState<any[]>([]);

    const [isVictory, setIsVictory] = useState(false);



    const bossEffectiveStats = useMemo(
        () => getEffectiveStats(selectedBoss.stats),
        [selectedBoss]
    );

    const { battleLog, isFighting, setIsFighting, bossHp, playerHp, resetBattle } = useBattle(
        player,
        selectedBoss,
        finalStats,
        bossEffectiveStats,
        onGameOver
    );

    useEffect(() => {
        if (bossHp <= 0 && !isVictory) {
            setIsVictory(true);
            setIsFighting(false);

            // เรียกจาก Store ที่นี่ที่เดียว
            const rewards = useGameStore.getState().handleBossDefeated(selectedBoss);
            setReceivedRewards(rewards);
            setShowRewardModal(true);
        }
    }, [bossHp, isVictory, selectedBoss]);

    return (
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 max-w-2xl mx-auto text-white">
            <button onClick={onBack} className="text-slate-400 hover:text-white mb-4">← Back</button>

            <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-linear-to-r from-purple-600 to-cyan-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                    <img
                        src={selectedBoss.imagePath}
                        alt={selectedBoss.name}
                        className="relative w-32 h-32 rounded-full border-4 border-slate-800 bg-slate-950 object-cover shadow-2xl"
                        onError={(e) => (e.currentTarget.src = '/Icons/Monsters/default.png')}
                    />
                </div>
                <h2 className="text-2xl text-white font-bold mt-1 drop-shadow-lg">{selectedBoss.name}</h2>

                {/* ส่วนแสดงเลเวลบอสที่เพิ่มเข้ามา */}
                <span className="mt-1 px-3 py-0.5 bg-amber-950/60 border border-amber-700/50 rounded-full text-xs text-amber-400 font-bold uppercase tracking-widest shadow-inner">
                    Level {selectedBoss.level}
                </span>
            </div>

            <div className="flex justify-between items-end mb-2">
                <h2 className="text-xl text-red-400 font-bold"></h2>
                <button
                    onClick={() => setShowBossStats(!showBossStats)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                >
                    {showBossStats ? 'Hide' : 'Show Boss Stats'}
                </button>
            </div>

            {showBossStats && (
                <div className="space-y-4 mt-2 p-3 bg-slate-950 rounded border border-slate-800 text-xs">
                    <div>
                        <p className="text-blue-400 font-bold border-b border-slate-800 pb-1 mb-2">Combat Power</p>
                        <div className="grid grid-cols-2 gap-2 text-slate-400">
                            <p>ATK: <span className="text-white">{bossEffectiveStats.atk.toLocaleString()}</span></p>
                            <p>DEF: <span className="text-white">{bossEffectiveStats.def.toLocaleString()}</span></p>
                            <p>RES: <span className="text-white">{bossEffectiveStats.res.toLocaleString()}</span></p>
                            <p>FLEE: <span className="text-white">{bossEffectiveStats.flee.toLocaleString()}</span></p>
                            <p>HIT: <span className="text-white">{bossEffectiveStats.hit.toLocaleString()}</span></p>
                        </div>
                    </div>

                    <div>
                        <p className="text-red-400 font-bold border-b border-slate-800 pb-1 mb-2">Critical Info</p>
                        <div className="grid grid-cols-2 gap-2 text-slate-400">
                            <p>Crit Rate: <span className="text-white">{selectedBoss.stats.critRate}%</span></p>
                            <p>Crit Dmg: <span className="text-white">{selectedBoss.stats.critDmg}%</span></p>
                        </div>
                    </div>

                    <div>
                        <p className="text-yellow-400 font-bold border-b border-slate-800 pb-1 mb-2">Attributes</p>
                        <div className="grid grid-cols-2 gap-2 text-slate-400">
                            <p>ธาตุ: <span className="text-white">{selectedBoss.element}</span></p>
                            <p>เผ่า: <span className="text-white">{selectedBoss.race}</span></p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-2 mb-4">
                <div className="flex justify-between text-[12px] text-slate-400 mb-1">
                    <span>Boss HP :</span>
                    <span>
                        {(bossHp ?? 0).toLocaleString()} / {bossEffectiveStats.maxHp.toLocaleString()}
                    </span>
                </div>

                <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden border border-slate-600">
                    <div
                        className="bg-gradient-to-r from-red-700 to-red-500 h-4 transition-all duration-300"
                        style={{
                            width: `${Math.max(0, (bossHp / bossEffectiveStats.maxHp) * 100)}%`
                        }}
                    ></div>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-[12px] text-slate-400 mb-1">
                    <span>Player HP :</span>
                    <span>
                        {playerHp.toLocaleString()} / {finalStats.maxHp.toLocaleString()}
                    </span>
                </div>

                <div className="w-full bg-slate-700 h-2 rounded-full mt-1">
                    <div
                        className="bg-emerald-500 h-2 transition-all"
                        style={{ width: `${(playerHp / finalStats.maxHp) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="h-40 w-full border border-slate-800 rounded bg-slate-950 p-4 overflow-y-auto">
                {battleLog.map((log, i) => (
                    <div
                        key={i}
                        className={`mb-1 ${log.type === 'player' ? 'text-emerald-400' : 'text-red-400'}`}
                    >
                        {log.text}
                    </div>
                ))}
                {isVictory && (
                    <div className="text-yellow-400 font-bold mt-2 animate-bounce">
                        Victory! Rewards received!
                    </div>
                )}
            </div>

            <div className="flex gap-2 mt-6">
                {/* Button to handle: Start / Stop / Reset */}
                <button
                    onClick={() => {
                        if (bossHp <= 0) {
                            resetBattle();
                            setIsVictory(false); // Reset the battle to fight again
                        } else {
                            setIsFighting(!isFighting);
                        }
                    }}
                    disabled={playerHp <= 0}
                    className={`flex-grow py-3 rounded-lg font-bold transition ${bossHp <= 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse'
                        : isFighting
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        } disabled:bg-slate-700`}
                >
                    {bossHp <= 0
                        ? 'Fight Again'
                        : playerHp <= 0
                            ? 'Defeated...'
                            : isFighting
                                ? 'Stop Fighting'
                                : 'Start Battle'}
                </button>

                {/* Back to Lobby button */}
                <button
                    onClick={onBack}
                    className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold"
                >
                    Back to Lobby
                </button>
            </div>

            {showRewardModal && receivedRewards.length > 0 && (
                <RewardModal
                    rewards={receivedRewards}
                    onClose={() => setShowRewardModal(false)}
                />
            )}
        </div>
    );
};