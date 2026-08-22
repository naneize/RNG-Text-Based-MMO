import { useState } from 'react';
import type { Player, Stats, EquipmentSlot } from '../../types/game';
import { calculateCombatPower, getCPRating, getCPBreakdown } from '../../utils/combatPower';
import { STAT_CAPS } from '../../utils/statCalculator';
import { useAchievementStore } from '../../store/achievementStore';
import { useAuthStore } from '../../store/authStore';


interface PlayerProfileProps {
    player: Player;
    finalStats: Stats;
    totalOpens?: number;
    statBreakdown?: Record<string, { label: string; value: number }[]>;
}

export const PlayerProfile = ({ player, finalStats, totalOpens }: PlayerProfileProps) => {
    const [activeTab, setActiveTab] = useState<'equipment' | 'stats' | 'achievements'>('equipment');
    const { user, userProfile, setEquippedTitle, setAvatar, setFrame } = useAuthStore() as any; // สมมติว่ามีฟังก์ชัน setAvatar สำหรับบันทึกรูป
    const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);
    const combatPower = calculateCombatPower(finalStats);
    const cpRating = getCPRating(combatPower);
    const cpBreakdown = getCPBreakdown(finalStats);
    const achievementsRecord = useAchievementStore((state) => state.achievements);
    const achievementsList = Object.values(achievementsRecord);
    const [hoveredItem, setHoveredItem] = useState<any>(null);

    const unlockedTitles = achievementsList.filter(
        (ach) => ach.isUnlocked && ach.rewardTitle
    );



    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'Legendary': return 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
            case 'Epic': return 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
            case 'Rare': return 'border-blue-500';
            default: return 'border-stone-700';
        }
    };

    const equipmentSlots: EquipmentSlot[] = ['weapon', 'armor', 'shield', 'helm', 'cloak', 'necklace', 'ring', 'boots'];

    const getEquippedItem = (slot: EquipmentSlot) => {
        // 🟢 ถ้า slot เป็น 'helm' ให้ดึงจาก player.equippedItems.helmet โดยตรง
        if (slot === 'helm') {
            return player.equippedItems.helmet;
        }
        return player.equippedItems[slot as keyof typeof player.equippedItems];
    };

    const statGroups = {
        offensive: [
            { key: 'atk' as keyof Stats, label: 'ATK' },
            { key: 'critRate' as keyof Stats, label: 'CRIT RATE' },
            { key: 'critDmg' as keyof Stats, label: 'CRIT DMG' },
            { key: 'hit' as keyof Stats, label: 'HIT' },
            { key: 'skillPower' as keyof Stats, label: 'SKILL PWR' },
        ],
        defensive: [
            { key: 'def' as keyof Stats, label: 'DEF' },
            { key: 'maxHp' as keyof Stats, label: 'MAX HP' },
            { key: 'res' as keyof Stats, label: 'RES' },
            { key: 'mRes' as keyof Stats, label: 'M.RES' },
            { key: 'flee' as keyof Stats, label: 'FLEE' },
        ],
        core: [
            { key: 'str' as keyof Stats, label: 'STR' },
            { key: 'agi' as keyof Stats, label: 'AGI' },
            { key: 'vit' as keyof Stats, label: 'VIT' },
            { key: 'int' as keyof Stats, label: 'INT' },
            { key: 'dex' as keyof Stats, label: 'DEX' },
            { key: 'luk' as keyof Stats, label: 'LUK' },
        ],
    };

    // ดึงรูป Avatar ปัจจุบัน (ใช้จาก userProfile หรือ fallback เป็นรูปแรกใน AVATAR_FILES)
    const currentAvatar = userProfile?.avatar || '';


    return (
        <div className="bg-stone-950 rounded-2xl border border-amber-900/80 shadow-2xl shadow-amber-950/40 w-full max-w-7xl mx-auto overflow-hidden relative text-amber-100">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-amber-950 bg-stone-900/80">
                <h2 className="text-xl font-extrabold text-amber-400 tracking-wider">Player Profile</h2>
            </div>

            <div className="flex flex-col lg:flex-row h-[calc(100vh-200px)]">
                {/* Left Side - Character Preview */}
                <div className="lg:w-1/3 p-6 bg-gradient-to-b from-stone-900/50 to-stone-950 border-r border-amber-950 flex flex-col items-center overflow-y-auto max-h-[calc(100vh-150px)]">
                    {/* Avatar & Frame Display */}
                    <div className="flex flex-col items-center mb-6">
                        {/* กล่องห่อหุ้มขนาดใหญ่ขึ้นเพื่อรองรับกรอบที่ล้นออกมาชัดเจน */}
                        <div className="relative w-[130px] h-[130px] flex items-center justify-center mb-1">

                            {/* 1. รูป Avatar ด้านใน (ขนาดปกติ 96px อยู่ตรงกลางเป๊ะ) */}
                            <div
                                onClick={() => setIsAvatarModalOpen(true)}
                                className="w-24 h-24 bg-stone-900 rounded-full flex items-center justify-center shadow-xl overflow-hidden cursor-pointer group hover:ring-2 hover:ring-amber-500 transition-all z-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-amber-900/50"
                            >
                                {currentAvatar ? (
                                    <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-4xl">🎎</div>
                                )}

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-amber-200 font-bold z-10 text-center px-1">
                                    Change Avatar
                                </div>
                            </div>

                            {/* 2. กรอบรูป (Frame) */}
                            {userProfile?.frame && (
                                <img
                                    src={userProfile.frame}
                                    alt="Frame"
                                    className="absolute inset-0 w-full h-full pointer-events-none object-contain z-30"
                                />
                            )}
                        </div>

                        {/* ปุ่มเปลี่ยนกรอบ */}
                        <button
                            onClick={() => setIsFrameModalOpen(true)}
                            className="text-[10px] bg-stone-900 hover:bg-stone-800 text-amber-300/80 border border-amber-900/80 px-3 py-1 rounded-full transition-colors mb-2 font-mono shadow-sm cursor-pointer"
                        >
                            Change Frame
                        </button>

                        {/* ชื่อผู้เล่น */}
                        {(userProfile || user) && (
                            <span className="text-amber-400 text-sm mb-3 font-extrabold tracking-wide truncate">
                                {userProfile?.username || user?.email || user?.displayName || 'Player'}
                            </span>
                        )}

                        {/* ส่วนฉายา */}
                        <div className="flex flex-col items-center gap-1.5 mb-2">
                            {userProfile?.equippedTitle ? (
                                <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold uppercase tracking-wider shadow-sm">
                                    {userProfile.equippedTitle}
                                </span>
                            ) : (
                                <span className="text-xs text-stone-500 italic">No title</span>
                            )}

                            <button
                                onClick={() => setIsTitleModalOpen(true)}
                                className="text-[10px] bg-stone-900 hover:bg-stone-800 text-amber-300/80 border border-amber-900/80 px-3 py-1 rounded-full transition-colors font-mono shadow-sm cursor-pointer"
                            >
                                Change Title
                            </button>
                        </div>
                    </div>


                    {/* 🟢 Combat Power Display */}
                    <div className="w-full bg-stone-900/80 rounded-xl p-3 border border-amber-900/60 mb-3 shadow-inner">
                        <div className="text-center mb-2">
                            <p className="text-[10px] text-amber-500/80 uppercase tracking-widest font-mono">Combat Power</p>

                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-stone-950 rounded-md border border-amber-950 ${cpRating.color}`}>
                                    {cpRating.description}
                                </span>
                                <span className={`text-3xl font-extrabold ${cpRating.color} font-mono`}>{combatPower.toLocaleString()}</span>
                                <span className={`text-xl font-bold ${cpRating.color} font-mono`}>{cpRating.rank}</span>
                            </div>
                        </div>

                        {/* 🟢 Breakdown */}
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                            <div className="bg-stone-950/80 rounded-lg p-1.5 border border-amber-950">
                                <p className="text-[9px] text-stone-400 uppercase tracking-wider font-mono">Offense</p>
                                <p className="text-xs font-bold text-rose-400 font-mono">{cpBreakdown.offensive}</p>
                            </div>
                            <div className="bg-stone-950/80 rounded-lg p-1.5 border border-amber-950">
                                <p className="text-[9px] text-stone-400 uppercase tracking-wider font-mono">Defense</p>
                                <p className="text-xs font-bold text-sky-400 font-mono">{cpBreakdown.defensive}</p>
                            </div>
                            <div className="bg-stone-950/80 rounded-lg p-1.5 border border-amber-950">
                                <p className="text-[9px] text-stone-400 uppercase tracking-wider font-mono">Core</p>
                                <p className="text-xs font-bold text-amber-400 font-mono">{cpBreakdown.core}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-2 pb-2">
                        <div className="flex justify-between items-center bg-stone-900/80 p-2.5 rounded-xl border border-amber-900/60 shadow-sm">
                            <span className="text-amber-200 text-xs font-mono tracking-wider uppercase">Total Rolls</span>
                            <span className="text-amber-200 font-bold font-mono text-sm">{totalOpens ?? 0}</span>
                        </div>
                    </div>
                </div>



                {/* Right Side - Tabs Content */}
                <div className="lg:w-2/3 flex flex-col bg-stone-950 text-amber-100">
                    <div className="flex border-b border-amber-950 bg-stone-900/60">
                        {[
                            { id: 'equipment' as const, label: 'Equipment' },
                            { id: 'stats' as const, label: 'Stats' },
                            { id: 'achievements' as const, label: 'Achievements' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3 px-4 text-sm font-extrabold tracking-wider transition-colors cursor-pointer ${activeTab === tab.id
                                    ? 'text-amber-400 border-b-2 border-amber-500 bg-stone-900/90 shadow-sm'
                                    : 'text-stone-400 hover:text-amber-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'equipment' && (
                            <div>
                                <h4 className="text-lg font-extrabold text-amber-400 tracking-wide mb-4">Equipped Gear</h4>
                                {/* 🟢 คืนค่า Grid Layout 4 คอลัมน์แบบเดิม */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {equipmentSlots.map((slot) => {
                                        const equippedItem = getEquippedItem(slot);
                                        const borderStyle = equippedItem ? getRarityColor(equippedItem.rarity) : 'border-amber-950';

                                        return (
                                            <div
                                                key={slot}
                                                className={`relative h-24 bg-stone-900/80 border-2 ${borderStyle} rounded-xl p-2 transition-all hover:border-amber-600/80 cursor-pointer flex flex-col justify-between shadow-inner`}
                                                onClick={() => {
                                                    if (equippedItem) {
                                                        setHoveredItem(hoveredItem?.name === equippedItem.name ? null : equippedItem);
                                                    }
                                                }}
                                            >
                                                <span className="capitalize text-[10px] text-stone-500 font-mono tracking-wider block pointer-events-none">
                                                    {slot}
                                                </span>

                                                {equippedItem ? (
                                                    <div className="flex flex-col items-center justify-center my-auto pointer-events-none">
                                                        <img
                                                            src={equippedItem.icon}
                                                            alt={equippedItem.name}
                                                            className="w-10 h-10 object-contain pointer-events-none drop-shadow"
                                                        />
                                                        <span className="text-amber-300 text-[10px] truncate w-full text-center mt-1 pointer-events-none font-medium">
                                                            {equippedItem.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full pointer-events-none">
                                                        <span className="text-stone-600 text-xs font-mono">Empty</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div>
                                <h4 className="text-lg font-extrabold text-amber-400 tracking-wide mb-4">Stats Overview</h4>

                                {/* Offensive Stats */}
                                <div className="mb-6">
                                    <h5 className="text-sm font-extrabold text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                                        <span className="w-2 h-2 bg-rose-400 rounded-full shadow-[0_0_8px_rgba(251,113,133,0.6)]"></span>
                                        Offensive Stats
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {statGroups.offensive.map(({ key, label }) => {
                                            const value = finalStats[key] || 0;
                                            const cap = STAT_CAPS[key];
                                            const isCapped = cap !== undefined && value >= cap;

                                            return (
                                                <div key={key} className="bg-stone-900/80 p-3 rounded-xl border border-amber-950 shadow-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-stone-300 text-sm font-medium">{label}</span>
                                                        <div className="flex items-center gap-2">
                                                            {isCapped && (
                                                                <span className="text-[9px] text-amber-400 font-bold bg-amber-950/80 border border-amber-900/50 px-1.5 py-0.5 rounded font-mono">
                                                                    CAPPED
                                                                </span>
                                                            )}
                                                            <span className={`font-mono font-bold ${isCapped ? 'text-amber-400' : 'text-amber-200'}`}>
                                                                {key === 'critRate' ? `${Math.floor(value)}%` : Math.floor(value)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Defensive Stats */}
                                <div className="mb-6">
                                    <h5 className="text-sm font-extrabold text-sky-400 uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                                        <span className="w-2 h-2 bg-sky-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.6)]"></span>
                                        Defensive Stats
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {statGroups.defensive.map(({ key, label }) => {
                                            const value = finalStats[key] || 0;
                                            const cap = STAT_CAPS[key];
                                            const isCapped = cap !== undefined && value >= cap;

                                            return (
                                                <div key={key} className="bg-stone-900/80 p-3 rounded-xl border border-amber-950 shadow-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-stone-300 text-sm font-medium">{label}</span>
                                                        <div className="flex items-center gap-2">
                                                            {isCapped && (
                                                                <span className="text-[9px] text-amber-400 font-bold bg-amber-950/80 border border-amber-900/50 px-1.5 py-0.5 rounded font-mono">
                                                                    CAPPED
                                                                </span>
                                                            )}
                                                            <span className={`font-mono font-bold ${isCapped ? 'text-amber-400' : 'text-amber-200'}`}>
                                                                {Math.floor(value)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Core Attributes */}
                                <div>
                                    <h5 className="text-sm font-extrabold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                                        <span className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
                                        Core Attributes
                                    </h5>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {statGroups.core.map(({ key, label }) => {
                                            const value = finalStats[key] || 0;
                                            return (
                                                <div key={key} className="bg-stone-900/80 p-3 rounded-xl border border-amber-950 shadow-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-stone-300 text-sm font-medium">{label}</span>
                                                        <span className="font-mono font-bold text-amber-300">{Math.floor(value)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'achievements' && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-extrabold text-amber-400 tracking-wide">Achievements Showcase</h4>
                                    <span className="text-xs text-amber-500/80 font-mono">
                                        {achievementsList.filter(ach => ach.isUnlocked).length} / {achievementsList.length} Unlocked
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {achievementsList
                                        .filter((achievement) => achievement.isUnlocked)
                                        .map((achievement) => (
                                            <div
                                                key={achievement.id}
                                                className="p-3.5 rounded-xl border bg-stone-900/80 border-amber-900/80 shadow-[0_0_12px_rgba(120,53,15,0.2)] flex items-center justify-between"
                                            >
                                                <span className="font-bold text-amber-300 text-sm">{achievement.title}</span>
                                                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-md font-bold tracking-wider font-mono shadow-sm">
                                                    ✓ UNLOCKED
                                                </span>
                                            </div>
                                        ))}

                                    {achievementsList.filter((ach) => ach.isUnlocked).length === 0 && (
                                        <div className="col-span-2 text-center py-8 text-stone-500 text-sm italic">
                                            No achievements unlocked yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div >

            {/* Hover Tooltip Item - คลิกพื้นหลังเพื่อปิด */}
            {
                hoveredItem && (
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs cursor-pointer"
                        onClick={() => setHoveredItem(null)}
                    >
                        <div
                            className="w-80 p-6 bg-stone-950 border border-amber-900/85 rounded-2xl shadow-[0_0_25px_rgba(120,53,15,0.3)] cursor-default text-left text-amber-100"
                            onClick={(e) => e.stopPropagation()} // ป้องกันไม่ให้คลิกโดนตัวกล่องแล้วเผลอปิด
                        >
                            {/* ชื่อไอเทม */}
                            <div className="font-extrabold text-amber-400 text-lg mb-1 tracking-wide">{hoveredItem.name}</div>

                            {/* ระดับและความหายาก */}
                            <div className="text-xs text-stone-400 mb-3 pb-2 border-b border-amber-950 font-mono flex justify-between items-center">
                                <span className="text-amber-500/90 font-bold uppercase">{hoveredItem.rarity}</span>
                                <span>Lv.{hoveredItem.itemLevel || 1}</span>
                            </div>

                            {/* แสดงสเตตัสหลัก (Stats) */}
                            {Object.entries(hoveredItem.stats || {}).filter(([_, value]) => Number(value) > 0).length > 0 && (
                                <div className="space-y-1.5 mb-3">
                                    {Object.entries(hoveredItem.stats)
                                        .filter(([_, value]) => Number(value) > 0)
                                        .map(([stat, value]) => (
                                            <div key={stat} className="flex justify-between text-xs py-1 border-b border-amber-950/60 last:border-b-0">
                                                <span className="text-stone-400 uppercase tracking-wider">{stat}</span>
                                                <span className="text-amber-300 font-mono font-bold">+{value as number}</span>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {/* Element Bonus */}
                            {hoveredItem.elementBonus && (
                                <div className="mb-2.5 pb-2 border-b border-amber-950 text-xs">
                                    <div className="text-stone-400 mb-1 font-semibold">Element Bonus:</div>
                                    <div className="flex justify-between text-sky-400 font-mono font-medium">
                                        <span>
                                            {typeof hoveredItem.elementBonus === 'object' && hoveredItem.elementBonus !== null
                                                ? (hoveredItem.elementBonus.type || hoveredItem.elementBonus.element || 'Element')
                                                : 'Element'}
                                        </span>
                                        <span>
                                            +{typeof hoveredItem.elementBonus === 'object' && hoveredItem.elementBonus !== null
                                                ? (hoveredItem.elementBonus.value || 0)
                                                : (hoveredItem.elementBonus || 0)}%
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Race Bonus */}
                            {hoveredItem.raceBonus && (
                                <div className="text-xs">
                                    <div className="text-stone-400 mb-1 font-semibold">Race Bonus:</div>
                                    <div className="flex justify-between text-amber-400 font-mono font-medium">
                                        <span>
                                            {typeof hoveredItem.raceBonus === 'object' && hoveredItem.raceBonus !== null
                                                ? (hoveredItem.raceBonus.type || hoveredItem.raceBonus.race || 'Race')
                                                : 'Race'}
                                        </span>
                                        <span>
                                            +{typeof hoveredItem.raceBonus === 'object' && hoveredItem.raceBonus !== null
                                                ? (hoveredItem.raceBonus.value || 0)
                                                : (hoveredItem.raceBonus || 0)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Modal เลือกฉายา */}
            {
                isTitleModalOpen && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <h3 className="text-stone-200 font-bold text-lg mb-4">Select Your Title</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto mb-4 pr-1">
                                <button
                                    onClick={() => {
                                        setEquippedTitle?.('');
                                        setIsTitleModalOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs rounded transition-colors"
                                >
                                    - No Title -
                                </button>

                                {unlockedTitles.length > 0 ? (
                                    unlockedTitles.map((ach) => (
                                        <button
                                            key={ach.id}
                                            onClick={() => {
                                                setEquippedTitle?.(ach.rewardTitle!);
                                                setIsTitleModalOpen(false);
                                            }}
                                            className="w-full text-left px-3 py-2 bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs rounded font-semibold flex flex-col gap-0.5"
                                        >
                                            <span>{ach.rewardTitle}</span>
                                            <span className="text-stone-400 text-[10px] font-normal">Unlocked from: {ach.title}</span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-xs text-stone-500 text-center py-4">No titles unlocked yet</p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsTitleModalOpen(false)}
                                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Modal เลือก Avatar */}
            {
                isAvatarModalOpen && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <h3 className="text-stone-200 font-bold text-lg mb-4">Select Avatar</h3>

                            {/* ปุ่มอัปโหลดรูปจากคอมพิวเตอร์พร้อมระบบย่อขนาดอัตโนมัติ */}
                            <div className="mb-4 relative">
                                <div className="mb-4 flex flex-col gap-2">
                                    <label className="flex items-center justify-center w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-md">
                                        <span>Upload Custom Image (Auto-Resize)</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        const img = new Image();
                                                        img.onload = () => {
                                                            const canvas = document.createElement('canvas');
                                                            const MAX_SIZE = 150; // กำหนดขนาดสูงสุด (กว้าง/สูง 150px สำหรับรูป Avatar)
                                                            let width = img.width;
                                                            let height = img.height;

                                                            if (width > height) {
                                                                if (width > MAX_SIZE) {
                                                                    height *= MAX_SIZE / width;
                                                                    width = MAX_SIZE;
                                                                }
                                                            } else {
                                                                if (height > MAX_SIZE) {
                                                                    width *= MAX_SIZE / height;
                                                                    height = MAX_SIZE;
                                                                }
                                                            }

                                                            canvas.width = width;
                                                            canvas.height = height;

                                                            const ctx = canvas.getContext('2d');
                                                            ctx?.drawImage(img, 0, 0, width, height);

                                                            // แปลงเป็น Base64 (บีบอัดคุณภาพเหลือ 85% เป็น JPEG เพื่อให้ไฟล์เล็กจิ๋ว)
                                                            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

                                                            setAvatar?.(compressedBase64);
                                                            setIsAvatarModalOpen(false);
                                                        };
                                                        img.src = event.target?.result as string;
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>

                                    {/* ปุ่มปิดอยู่ด้านล่าง */}
                                    <button
                                        type="button"
                                        onClick={() => setIsAvatarModalOpen(false)}
                                        className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition-colors shadow-md"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>


                        </div>
                    </div>
                )
            }

            {
                isFrameModalOpen && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                        <div className="bg-stone-950 border border-amber-900/85 rounded-2xl p-6 w-full max-w-md shadow-[0_0_25px_rgba(120,53,15,0.3)] text-amber-100">
                            <h3 className="text-amber-400 font-extrabold text-lg mb-4 tracking-wide">Select Frame</h3>

                            <div className="text-xs text-stone-400 mb-2 font-semibold tracking-wider font-mono">Unlocked Frames:</div>

                            <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto mb-4 p-1 scrollbar-thin scrollbar-thumb-amber-900">
                                {/* 🟢 กรองเฉพาะ achievement ที่ปลดล็อกและกดรับรางวัล (isClaimed) ที่มี rewardFrame */}
                                {achievementsList
                                    .filter((ach) => ach.isClaimed && ach.rewardFrame)
                                    .map((ach, index) => {
                                        const frameSrc = ach.rewardFrame!;
                                        const isSelected = userProfile?.frame === frameSrc;

                                        return (
                                            <div
                                                key={index}
                                                onClick={() => {
                                                    setFrame?.(frameSrc);
                                                    setIsFrameModalOpen(false);
                                                }}
                                                className={`relative w-20 h-20 bg-stone-900 rounded-xl p-2 border-2 cursor-pointer flex items-center justify-center transition-all hover:scale-105 shadow-inner ${isSelected
                                                    ? 'border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)] bg-stone-900/90'
                                                    : 'border-amber-950 hover:border-amber-700/60'
                                                    }`}
                                            >
                                                <img src={frameSrc} alt={ach.title} className="w-full h-full object-contain pointer-events-none drop-shadow" />
                                            </div>
                                        );
                                    })}

                                {/* (ทางเลือก) กรณีที่ยังไม่มีกรอบที่ปลดล็อกเลย */}
                                {achievementsList.filter((ach) => ach.isClaimed && ach.rewardFrame).length === 0 && (
                                    <div className="col-span-3 text-center py-6 text-stone-500 text-xs italic font-mono">
                                        No frames unlocked yet. Complete achievements to unlock!
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setIsFrameModalOpen(false)}
                                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 border border-amber-950 text-stone-300 text-xs font-bold rounded-xl transition-colors shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};