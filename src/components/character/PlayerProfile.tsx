import { useState } from 'react';
import type { Player, Stats, EquipmentSlot } from '../../types/game';
import { calculateCombatPower, getCPRating, getCPBreakdown } from '../../utils/combatPower';
import { STAT_CAPS } from '../../utils/statCalculator';
import { useAchievementStore } from '../../store/achievementStore';
import { useAuthStore } from '../../store/authStore';
import { AVATAR_FILES } from '../constants/avatars';
import { FRAME_FILES } from '../constants/frames';

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
            default: return 'border-slate-700';
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
    const currentAvatar = userProfile?.avatar || AVATAR_FILES?.[0] || '';


    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-7xl mx-auto overflow-hidden relative">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
                <h2 className="text-xl font-bold text-slate-200">Player Profile</h2>
            </div>

            <div className="flex flex-col lg:flex-row h-[calc(100vh-200px)]">
                {/* Left Side - Character Preview */}
                <div className="lg:w-1/3 p-6 bg-linear-to-b from-slate-800/30 to-slate-900/50 border-r border-slate-700 flex flex-col items-center overflow-y-auto max-h-[calc(100vh-150px)]">
                    {/* Avatar & Frame Display */}
                    <div className="flex flex-col items-center mb-6">
                        {/* กล่องห่อหุ้มขนาดใหญ่ขึ้นเพื่อรองรับกรอบที่ล้นออกมาชัดเจน */}
                        <div className="relative w-[130px] h-[130px] flex items-center justify-center mb-1">

                            {/* 1. รูป Avatar ด้านใน (ขนาดปกติ 96px อยู่ตรงกลางเป๊ะ) */}
                            <div
                                onClick={() => setIsAvatarModalOpen(true)}
                                className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center shadow-xl overflow-hidden cursor-pointer group hover:ring-2 hover:ring-emerald-500 transition-all z-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            >
                                {currentAvatar ? (
                                    <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-4xl">🎎</div>
                                )}

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] text-white font-bold z-10">
                                    Change Avatar
                                </div>
                            </div>

                            {/* 2. กรอบรูป (Frame) - กำหนดขนาด 130px เต็มกล่องแม่ ทับขอบเทาแน่นอน */}
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
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-0.5 rounded-full transition-colors mb-2"
                        >
                            Change Frame
                        </button>

                        {/* ชื่อผู้เล่น */}
                        {(userProfile || user) && (
                            <span className="text-emerald-400 text-sm mb-3 font-bold tracking-wide truncate">
                                {userProfile?.username || user?.email || user?.displayName || 'Player'}
                            </span>
                        )}

                        {/* ส่วนฉายา */}
                        <div className="flex flex-col items-center gap-1 mb-2">
                            {userProfile?.equippedTitle ? (
                                <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold uppercase tracking-wider">
                                    {userProfile.equippedTitle}
                                </span>
                            ) : (
                                <span className="text-xs text-slate-500 italic">No title</span>
                            )}

                            <button
                                onClick={() => setIsTitleModalOpen(true)}
                                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-0.5 rounded-full transition-colors"
                            >
                                Change Title
                            </button>
                        </div>
                    </div>


                    {/* 🟢 Combat Power Display (เอาฉายามาไว้ด้านหน้าตัวเลขแรงค์) */}
                    <div className="w-full bg-slate-800/50 rounded-xl p-3 border border-slate-700 mb-2">
                        <div className="text-center mb-1">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Combat Power</p>

                            {/* 🟢 วางฉายาไว้ด้านหน้า หรือจัดเรียงใหม่ตามชอบ */}
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-900/80 rounded-md border border-slate-700 ${cpRating.color}`}>
                                    {cpRating.description}
                                </span>
                                <span className={`text-3xl font-bold ${cpRating.color}`}>{combatPower.toLocaleString()}</span>
                                <span className={`text-xl font-bold ${cpRating.color}`}>{cpRating.rank}</span>
                            </div>
                        </div>

                        {/* 🟢 ลดขนาด Breakdown */}
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                            <div className="bg-slate-900/50 rounded px-1 py-0.5">
                                <p className="text-[9px] text-slate-400 uppercase">Offense</p>
                                <p className="text-xs font-bold text-rose-400">{cpBreakdown.offensive}</p>
                            </div>
                            <div className="bg-slate-900/50 rounded px-1 py-0.5">
                                <p className="text-[9px] text-slate-400 uppercase">Defense</p>
                                <p className="text-xs font-bold text-blue-400">{cpBreakdown.defensive}</p>
                            </div>
                            <div className="bg-slate-900/50 rounded px-1 py-0.5">
                                <p className="text-[9px] text-slate-400 uppercase">Core</p>
                                <p className="text-xs font-bold text-emerald-400">{cpBreakdown.core}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full space-y-2 pb-2">
                        <div className="flex justify-between items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-700">
                            <span className="text-slate-400 text-xs font-mono tracking-wider uppercase">Total Rolls</span>
                            <span className="text-slate-200 font-bold font-mono text-sm">{totalOpens ?? 0}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Tabs Content */}
                <div className="lg:w-2/3 flex flex-col">
                    <div className="flex border-b border-slate-700 bg-slate-800/30">
                        {[
                            { id: 'equipment' as const, label: 'Equipment' },
                            { id: 'stats' as const, label: 'Stats' },
                            { id: 'achievements' as const, label: 'Achievements' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3 px-4 text-sm font-bold transition-colors ${activeTab === tab.id
                                    ? 'text-emerald-400 border-b-2 border-emerald-400 bg-slate-800/50'
                                    : 'text-slate-400 hover:text-slate-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'equipment' && (
                            <div>
                                <h4 className="text-lg font-bold text-slate-200 mb-4">Equipped Gear</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {equipmentSlots.map((slot) => {
                                        const equippedItem = getEquippedItem(slot);

                                        // 🟢 แก้จาก 'item' เป็น 'equippedItem' ให้ถูกต้อง
                                        console.log(`Slot: ${slot}, Item:`, equippedItem);

                                        const borderStyle = equippedItem ? getRarityColor(equippedItem.rarity) : 'border-slate-700';

                                        return (
                                            <div
                                                key={slot}
                                                className={`relative h-24 bg-slate-800 border-2 ${borderStyle} rounded-lg p-2 group transition-all hover:border-slate-500 cursor-pointer`}
                                                onMouseEnter={() => equippedItem && setHoveredItem(equippedItem)}
                                                onMouseLeave={() => setHoveredItem(null)}
                                            >
                                                <span className="capitalize text-[10px] text-slate-500 font-bold block mb-1">{slot}</span>
                                                {equippedItem ? (
                                                    <>
                                                        <img
                                                            src={equippedItem.icon}
                                                            alt={equippedItem.name}
                                                            className="w-10 h-10 object-contain mx-auto"
                                                        />
                                                        <span className="text-emerald-400 text-[10px] truncate block text-center mt-1">
                                                            {equippedItem.name}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <span className="text-slate-600 text-xs">Empty</span>
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
                                <h4 className="text-lg font-bold text-slate-200 mb-4">Stats Overview</h4>
                                <div className="mb-6">
                                    <h5 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-rose-400 rounded-full"></span>
                                        Offensive Stats
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {statGroups.offensive.map(({ key, label }) => {
                                            const value = finalStats[key] || 0;
                                            const cap = STAT_CAPS[key];
                                            const isCapped = cap !== undefined && value >= cap;

                                            return (
                                                <div key={key} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-400 text-sm font-medium">{label}</span>
                                                        <div className="flex items-center gap-2">
                                                            {isCapped && (
                                                                <span className="text-[9px] text-orange-400 font-bold bg-orange-900/30 px-1.5 py-0.5 rounded">
                                                                    CAPPED
                                                                </span>
                                                            )}
                                                            <span className={`font-mono font-bold ${isCapped ? 'text-orange-400' : 'text-emerald-400'}`}>
                                                                {key === 'critRate' ? `${Math.floor(value)}%` : Math.floor(value)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h5 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                        Defensive Stats
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {statGroups.defensive.map(({ key, label }) => {
                                            const value = finalStats[key] || 0;
                                            const cap = STAT_CAPS[key];
                                            const isCapped = cap !== undefined && value >= cap;

                                            return (
                                                <div key={key} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-400 text-sm font-medium">{label}</span>
                                                        <div className="flex items-center gap-2">
                                                            {isCapped && (
                                                                <span className="text-[9px] text-orange-400 font-bold bg-orange-900/30 px-1.5 py-0.5 rounded">
                                                                    CAPPED
                                                                </span>
                                                            )}
                                                            <span className={`font-mono font-bold ${isCapped ? 'text-orange-400' : 'text-emerald-400'}`}>
                                                                {Math.floor(value)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <h5 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                                        Core Attributes
                                    </h5>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {statGroups.core.map(({ key, label }) => {
                                            const value = finalStats[key] || 0;
                                            return (
                                                <div key={key} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-400 text-sm font-medium">{label}</span>
                                                        <span className="font-mono font-bold text-emerald-400">{Math.floor(value)}</span>
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
                                    <h4 className="text-lg font-bold text-slate-200">Achievements Showcase</h4>
                                    <span className="text-xs text-slate-400">
                                        {achievementsList.filter(ach => ach.isUnlocked).length} / {achievementsList.length} Unlocked
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {achievementsList
                                        .filter((achievement) => achievement.isUnlocked)
                                        .map((achievement) => (
                                            <div
                                                key={achievement.id}
                                                className="p-3.5 rounded-lg border bg-slate-800/50 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)] flex items-center justify-between"
                                            >
                                                <span className="font-bold text-amber-400 text-sm">{achievement.title}</span>
                                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold tracking-wider">
                                                    ✓ UNLOCKED
                                                </span>
                                            </div>
                                        ))}

                                    {achievementsList.filter((ach) => ach.isUnlocked).length === 0 && (
                                        <div className="col-span-2 text-center py-8 text-slate-500 text-sm">
                                            No achievements unlocked yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hover Tooltip Item */}
            {hoveredItem && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 pointer-events-none">
                    <div className="w-80 p-6 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
                        <div className="font-bold text-slate-200 text-lg mb-1">{hoveredItem.name}</div>
                        <div className="text-xs text-slate-400 mb-3 pb-2 border-b border-slate-800">{hoveredItem.rarity} • Lv.{hoveredItem.itemLevel || 1}</div>

                        {Object.entries(hoveredItem.stats || {}).filter(([_, value]) => Number(value) > 0).length > 0 && (
                            <div className="space-y-1.5 mb-3">
                                {Object.entries(hoveredItem.stats)
                                    .filter(([_, value]) => Number(value) > 0)
                                    .map(([stat, value]) => (
                                        // 🟢 เพิ่ม border-b และ py-1 เพื่อให้มีเส้นคั่นและมีพื้นที่หายใจระหว่างแถว
                                        <div key={stat} className="flex justify-between text-xs py-1 border-b border-slate-800/60 last:border-b-0">
                                            <span className="text-slate-400 uppercase">{stat}</span>
                                            <span className="text-emerald-400 font-mono">+{value as number}</span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal เลือกฉายา */}
            {
                isTitleModalOpen && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <h3 className="text-slate-200 font-bold text-lg mb-4">Select Your Title</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto mb-4 pr-1">
                                <button
                                    onClick={() => {
                                        setEquippedTitle?.('');
                                        setIsTitleModalOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded transition-colors"
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
                                            className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs rounded font-semibold flex flex-col gap-0.5"
                                        >
                                            <span>{ach.rewardTitle}</span>
                                            <span className="text-slate-400 text-[10px] font-normal">Unlocked from: {ach.title}</span>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-500 text-center py-4">No titles unlocked yet</p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsTitleModalOpen(false)}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded"
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
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <h3 className="text-slate-200 font-bold text-lg mb-4">Select Avatar</h3>

                            {/* ปุ่มอัปโหลดรูปจากคอมพิวเตอร์พร้อมระบบย่อขนาดอัตโนมัติ */}
                            <div className="mb-4">
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
                            </div>

                            <div className="text-xs text-slate-400 mb-2 font-medium">choose from presets:</div>

                            {/* รายการ Avatar สำเร็จรูป */}
                            <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto mb-4 p-1">
                                {AVATAR_FILES && AVATAR_FILES.map((avatarSrc: string, index: number) => (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            setAvatar?.(avatarSrc);
                                            setIsAvatarModalOpen(false);
                                        }}
                                        className={`w-16 h-16 rounded-full overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 ${currentAvatar === avatarSrc ? 'border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'border-slate-700'
                                            }`}
                                    >
                                        <img src={avatarSrc} alt={`Avatar ${index}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setIsAvatarModalOpen(false)}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }

            {isFrameModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-slate-200 font-bold text-lg mb-4">Select Frame</h3>

                        <div className="text-xs text-slate-400 mb-2 font-medium">Unlocked Frames:</div>

                        <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto mb-4 p-1">
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
                                            className={`relative w-20 h-20 bg-slate-950 rounded-lg p-2 border-2 cursor-pointer flex items-center justify-center transition-all hover:scale-105 ${isSelected
                                                ? 'border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                                : 'border-slate-700'
                                                }`}
                                        >
                                            <img src={frameSrc} alt={ach.title} className="w-full h-full object-contain" />
                                        </div>
                                    );
                                })}

                            {/* (ทางเลือก) กรณีที่ยังไม่มีกรอบที่ปลดล็อกเลย */}
                            {achievementsList.filter((ach) => ach.isClaimed && ach.rewardFrame).length === 0 && (
                                <div className="col-span-3 text-center py-6 text-slate-500 text-xs italic">
                                    No frames unlocked yet. Complete achievements to unlock!
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsFrameModalOpen(false)}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
};