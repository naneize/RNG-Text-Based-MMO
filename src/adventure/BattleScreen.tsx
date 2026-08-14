import { useState, useMemo, useEffect } from 'react';
import { useBattleStore } from '../store/battleStore';
import { useGameStore } from '../store/gameStore';
import { RewardModal } from '../components/Modals/RewardModal';


export const BattleScreen = () => {
    const {
        selectedBoss,
        bossEffectiveStats,
        finalStatsSnapshot,
        playerHp,
        bossHp,
        isFighting,
        battleLog,
        lastRewards,
        rewardTick,
        leaveBattle,
        setFighting,
        startBattle,
        clearRewards,
        isAutoFarm,     // 👈 ดึง isAutoFarm มาจากตรงนี้ได้เลย
        setAutoFarm     // 👈 ใช้ setAutoFarm สำหรับกำหนดค่า true/false ตรงๆ
    } = useBattleStore();

    const [showBossStats, setShowBossStats] = useState(false);
    const [showRewardModal, setShowRewardModal] = useState(false);
    const [isVictory, setIsVictory] = useState(false);


    // ปรับเงื่อนไขใน useEffect เล็กน้อย
    useEffect(() => {
        // เพิ่มเช็คว่าถ้ายังไม่ได้ปิด Modal (isVictory ยังเป็น false) ถึงจะให้เด้ง
        if (lastRewards && lastRewards.length > 0 && !isVictory) {
            setShowRewardModal(true);
            setIsVictory(true);
        }
    }, [rewardTick, isVictory]);

    // ระบบ Auto Farm: เมื่อบอสตายและเปิด Auto Farm ไว้ ให้กดเริ่มสู้ใหม่อัตโนมัติ
    useEffect(() => {
        if (isAutoFarm && bossHp <= 0 && !isFighting && selectedBoss && finalStatsSnapshot) {
            const timer = setTimeout(() => {
                setIsVictory(false);
                const player = useGameStore.getState().player;
                startBattle(selectedBoss, finalStatsSnapshot, player.equippedItems);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [isAutoFarm, bossHp, isFighting, selectedBoss, finalStatsSnapshot, startBattle]);

    // ปิด Auto Farm หากผู้เล่นตาย
    useEffect(() => {
        if (playerHp <= 0) {
            setAutoFarm(false); // 👈 เปลี่ยนมาใช้ setAutoFarm(false) ตรงนี้ครับ
        }
    }, [playerHp, setAutoFarm]);

    // เลือก Background ตามธาตุของบอส (Water, Fire หรือค่าเริ่มต้นถ้าไม่ตรง)
    const currentBg = useMemo(() => {
        console.log("Selected Boss Data:", selectedBoss);
        if (!selectedBoss) return '/Icons/Backgrounds/Main_BG_1.png';

        // สมมติว่า element ของบอสเก็บเป็น string เช่น 'Water', 'Fire' หรือภาษาไทย
        // ปรับเงื่อนไขให้ตรงกับข้อมูลในโปรเจกต์ของคุณ (เช่น .toLowerCase())
        const element = selectedBoss.element?.toLowerCase();
        console.log("Detected Element:", element);

        if (element === 'water' || element === 'ธาตุน้ำ') {
            return '/Icons/Backgrounds/BG_BOSS_WATER.png'; // 👈 เปลี่ยนเป็น path รูป BG ธาตุน้ำของคุณ
        } else if (element === 'fire' || element === 'ธาตุไฟ') {
            return '/Icons/Backgrounds/BG_BOSS_FIRE.png'; // 👈 เปลี่ยนเป็น path รูป BG ธาตุไฟของคุณ
        }

        // Fallback: ถ้าไม่ใช่ 2 ธาตุนี้ ให้ใช้รูปสุ่มหรือรูปเริ่มต้น
        return '/Icons/Backgrounds/Main_BG_1.png';
    }, [selectedBoss]);

    if (!selectedBoss || !bossEffectiveStats || !finalStatsSnapshot) {
        return (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 max-w-2xl mx-auto text-white text-center">
                <p className="text-red-400 mb-4">No boss selected!</p>
                <button onClick={leaveBattle} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold">
                    ← Back
                </button>
            </div>
        );
    }

    return (
        <div
            className="relative w-full min-h-screen p-6 text-white overflow-hidden bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${currentBg})` }}
        >
            {/* Overlay ให้จางลง หรือเปลี่ยนเป็นโทนสีฟ้า/น้ำเพื่อให้เข้ากับธาตุน้ำ */}
            <div className="absolute inset-0 bg-slate-950/10 bg-linear-to-b from-slate-950/5 via-slate-950/20 to-slate-950/40 pointer-events-none"></div>

            {/* Content Wrapper */}
            <div className="relative z-10">
                {/* Header: ปุ่ม Back อยู่บนสุด */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={leaveBattle} className="text-slate-400 hover:text-white font-medium transition cursor-pointer">
                        ← Back
                    </button>
                </div>

                {/* Grid 2 คอลัมน์ (ซ้าย: Status & Controls, ขวา: Battle Log) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">

                    {/* ===================== กรอบซ้าย: BOSS & PLAYER STATUS ===================== */}
                    <div className="flex flex-col justify-between bg-black/20 p-5 rounded-xl border border-white/10 hover:border-white/20 backdrop-blur-md transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <div>
                            {/* Boss Avatar & Info */}
                            <div className="flex flex-col items-center mb-4">
                                <div className="relative group w-full max-w-sm">
                                    <img
                                        src={selectedBoss.imagePath}
                                        alt={selectedBoss.name}
                                        className="relative w-full h-48 rounded-2xl border-2 border-slate-700 bg-slate-950 object-cover shadow-2xl"
                                        onError={(e) => (e.currentTarget.src = '/Icons/Monsters/default.png')}
                                    />
                                </div>
                                <h2 className="text-2xl text-white font-bold mt-2 drop-shadow-lg">{selectedBoss.name}</h2>
                                <span className="mt-1 px-3 py-0.5 bg-slate-800/60 border border-slate-700/50 rounded-full text-xs text-slate-300 font-bold uppercase tracking-widest shadow-inner">
                                    Level {selectedBoss.level}
                                </span>
                            </div>

                            {/* Toggle Boss Stats */}
                            <div className="flex justify-between items-center mb-2">
                                <button
                                    onClick={() => setAutoFarm(!isAutoFarm)}
                                    className="flex items-center gap-2 text-xs font-bold transition cursor-pointer select-none group"
                                >
                                    {/* กล่อง Checkbox จำลอง */}
                                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition ${isAutoFarm
                                        ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)] text-white'
                                        : 'bg-slate-800 border-slate-700 group-hover:border-slate-600 text-transparent'
                                        }`}>
                                        {/* ไอคอนติ๊กถูก (SVG) จะแสดงเฉพาะตอนเปิด Auto Farm */}
                                        <svg className="w-3 h-3 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    {/* ตัวหนังสือ Auto Farm จะกระพริบแสงเรืองๆ นุ่มนวลโดยที่บรรทัดไม่ขยับ */}
                                    <span className={`transition-all duration-300 ${isAutoFarm
                                        ? 'text-emerald-400 font-extrabold drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                                        : 'text-slate-300'
                                        }`}>
                                        Auto Farm
                                    </span>
                                </button>

                                <button
                                    onClick={() => setShowBossStats(!showBossStats)}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                                >
                                    {showBossStats ? 'Hide Boss Stats' : 'Show Boss Stats'}
                                </button>
                            </div>

                            {/* Boss Stats Details */}
                            {showBossStats && (
                                <div className="space-y-3 mb-4 p-3 bg-slate-900/90 rounded border border-slate-800 text-xs animate-fadeIn">
                                    <div>
                                        <p className="text-blue-400 font-bold border-b border-slate-800 pb-1 mb-1">Combat Power</p>
                                        <div className="grid grid-cols-2 gap-1.5 text-slate-400">
                                            <p>ATK: <span className="text-white">{bossEffectiveStats.atk.toLocaleString()}</span></p>
                                            <p>DEF: <span className="text-white">{bossEffectiveStats.def.toLocaleString()}</span></p>
                                            <p>RES: <span className="text-white">{bossEffectiveStats.res.toLocaleString()}</span></p>
                                            <p>MRES: <span className="text-white">{(bossEffectiveStats.mRes || 0).toLocaleString()}</span></p>
                                            <p>FLEE: <span className="text-white">{bossEffectiveStats.flee.toLocaleString()}</span></p>
                                            <p>HIT: <span className="text-white">{bossEffectiveStats.hit.toLocaleString()}</span></p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-2">
                                        <div>
                                            <p className="text-red-400 font-bold mb-1">Critical</p>
                                            <p className="text-slate-400">Crit.Rate : <span className="text-white">{selectedBoss.stats.critRate}%</span></p>
                                            <p className="text-slate-400">Crit.Dmg : <span className="text-white">{selectedBoss.stats.critDmg}%</span></p>
                                        </div>
                                        <div>
                                            <p className="text-yellow-400 font-bold mb-1">Attributes</p>
                                            <p className="text-slate-400">Element : <span className="text-white">{selectedBoss.element}</span></p>
                                            <p className="text-slate-400">Race : <span className="text-white">{selectedBoss.race}</span></p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Boss HP Bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span className="font-semibold text-red-400">Boss HP :</span>
                                    <span>{(bossHp ?? 0).toLocaleString()} / {bossEffectiveStats.maxHp.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                                    <div
                                        className="bg-gradient-to-r from-red-700 to-red-500 h-full transition-all duration-300"
                                        style={{ width: `${Math.max(0, (bossHp / bossEffectiveStats.maxHp) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Player HP Bar */}
                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                    <span className="font-semibold text-emerald-400">Player HP :</span>
                                    <span>{playerHp.toLocaleString()} / {(finalStatsSnapshot.maxHp || 1).toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                                    <div
                                        className="bg-emerald-500 h-full transition-all duration-300"
                                        style={{ width: `${Math.max(0, (playerHp / (finalStatsSnapshot.maxHp || 1)) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800/80">
                            <button
                                onClick={() => {
                                    if (bossHp <= 0) {
                                        clearRewards();
                                        setIsVictory(false);
                                        const player = useGameStore.getState().player;
                                        startBattle(selectedBoss, finalStatsSnapshot, player.equippedItems);
                                    } else {
                                        setFighting(!isFighting);
                                    }
                                }}
                                disabled={playerHp <= 0}
                                className={`flex-grow py-3 rounded-lg font-bold text-sm transition-all shadow-md cursor-pointer ${bossHp <= 0
                                    ? 'bg-emerald-600 hover:bg-emerald-500 animate-pulse'
                                    : isFighting
                                        ? 'bg-red-600 hover:bg-red-500'
                                        : 'bg-emerald-600 hover:bg-emerald-500'
                                    } disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed`}
                            >
                                {bossHp <= 0
                                    ? 'Fight Again'
                                    : playerHp <= 0
                                        ? 'Defeated...'
                                        : isFighting
                                            ? 'Stop Fighting'
                                            : 'Start Battle'}
                            </button>

                            <button
                                onClick={leaveBattle}
                                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white text-sm font-bold transition cursor-pointer"
                            >
                                Lobby
                            </button>
                        </div>
                    </div>

                    {/* ===================== กรอบขวา: BATTLE LOG ===================== */}
                    <div className="flex flex-col h-full bg-slate-950/80 p-4 rounded-xl border border-slate-800 backdrop-blur-sm min-h-[380px] max-h-[520px]">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 pb-2 border-b border-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            Battle Log
                        </h3>

                        {/* Log Container */}
                        <div className="grow overflow-y-auto pr-1 text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
                            {battleLog.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-slate-600 italic">
                                    Click "Start Battle" to begin combat...
                                </div>
                            ) : (
                                battleLog.map((log, i) => {
                                    const baseStyle = log.isStun
                                        ? 'bg-yellow-950/20 border-l-2 border-yellow-500'
                                        : log.type === 'player'
                                            ? 'bg-emerald-950/20 border-l-2 border-emerald-500'
                                            : 'bg-red-950/20 border-l-2 border-red-500';

                                    if (log.isMiss) {
                                        const parts = log.text.split(/(missed(?: your attack)?)/i);
                                        return (
                                            <div key={i} className={`p-1.5 rounded leading-relaxed ${baseStyle}`}>
                                                {parts.map((part, index) =>
                                                    part.toLowerCase().includes('missed') ? (
                                                        <span key={index} className="text-slate-400 italic font-normal">
                                                            {part}
                                                        </span>
                                                    ) : (
                                                        <span key={index} className={log.type === 'player' ? 'text-emerald-300 font-medium' : 'text-red-300 font-medium'}>
                                                            {part}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        );
                                    }

                                    const defaultTextColor = log.isStun
                                        ? 'text-yellow-300'
                                        : log.type === 'player'
                                            ? 'text-emerald-300'
                                            : 'text-red-300';

                                    const parts = log.text.split(/(\(CRIT!\)|Crit Rate\s*\+\d+%|\[[^\]]+\]|,\s*activated [^!]+!\s*Lifesteal![^!]*\([^)]+\)|,\s*activated [^!]+!\s*Enemy stunned!|Enemy stunned!)/g);
                                    return (
                                        <div key={i} className={`p-1.5 rounded leading-relaxed ${baseStyle} ${defaultTextColor}`}>
                                            {parts.map((part, index) => {
                                                if (part.startsWith('[') && part.endsWith(']')) {
                                                    return (
                                                        <span key={index} className="text-purple-300 font-bold drop-shadow-[0_0_6px_rgba(192,132,252,0.5)] mx-0.5">
                                                            {part}
                                                        </span>
                                                    );
                                                }

                                                if (part === '(CRIT!)') {
                                                    return (
                                                        <span key={index} className="text-amber-400 font-extrabold drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] mx-1">
                                                            {part}
                                                        </span>
                                                    );
                                                }

                                                // เพิ่มเงื่อนไขจับคำว่า Crit Rate +XX% ตรงนี้
                                                if (part.includes('Crit Rate')) {
                                                    return (
                                                        <span key={index} className="text-amber-300 font-bold drop-shadow-[0_0_6px_rgba(251,191,36,0.4)] mx-0.5">
                                                            {part}
                                                        </span>
                                                    );
                                                }

                                                if (part.includes('Lifesteal!')) {
                                                    return (
                                                        <span key={index} className="text-lime-400 font-bold drop-shadow-[0_0_6px_rgba(163,230,53,0.4)] ml-0.5">
                                                            {part}
                                                        </span>
                                                    );
                                                }

                                                if (part.includes('stunned') || part.includes('Stun')) {
                                                    return (
                                                        <span key={index} className="text-yellow-300 font-bold drop-shadow-[0_0_6px_rgba(253,224,71,0.5)] ml-0.5">
                                                            {part}
                                                        </span>
                                                    );
                                                }

                                                return <span key={index}>{part}</span>;
                                            })}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal แสดงของรางวัล */}
            {showRewardModal && lastRewards && lastRewards.length > 0 && (
                <RewardModal
                    rewards={lastRewards}
                    onClose={() => setShowRewardModal(false)}
                />
            )}
        </div>
    );
};