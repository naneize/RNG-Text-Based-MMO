import React, { useEffect } from 'react';
import type { RewardResult } from '../../utils/dropLogic';
import { materialLibrary } from '../../data/materialLibrary';

interface RewardModalProps {
    rewards: RewardResult[];
    onClose: () => void;
    newRollCapUnlocked?: number | null; // ✅ เพิ่มบรรทัดนี้

}

export const RewardModal = ({ rewards, onClose, newRollCapUnlocked }: RewardModalProps) => {

    const rarityWeight: Record<string, number> = {
        'Legendary': 1,
        'Epic': 2,
        'Rare': 3,
        'Common': 4,
        'material': 5
    };

    const getRarityColor = (rarity: string = '') => {
        switch (rarity.toLowerCase()) {
            case 'legendary':
                return 'text-amber-400 font-extrabold drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]';
            case 'epic':
                return 'text-purple-400 font-bold drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]';
            case 'rare':
                return 'text-blue-400 font-semibold';
            case 'common':
            default:
                return 'text-stone-400';
        }
    };

    const sortedRewards = [...rewards].sort((a, b) => {
        const getPriorityKey = (reward: any) => {
            const typeStr = reward.type as string;
            if (typeStr === 'material') return 'material';
            return reward.itemData?.rarity || 'Common';
        };

        const weightA = rarityWeight[getPriorityKey(a)] ?? 99;
        const weightB = rarityWeight[getPriorityKey(b)] ?? 99;

        return weightA - weightB;
    });

    useEffect(() => {
        // ✅ ถ้ามีการปลดล็อก roll cap ให้เวลาอ่านนานขึ้น (3.5 วิ) ปกติทั่วไปยังคง 1.5 วิเหมือนเดิม
        const duration = newRollCapUnlocked ? 3500 : 1500;
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [onClose, newRollCapUnlocked]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* ปรับพื้นหลังให้เข้มขึ้น ตัดขอบด้วยสีทองแดงตุ่นๆ (Amber-700/40) ให้ดูพรีเมียมแต่ไม่แสบตา */}
            <div className="relative bg-[#12100e] border border-amber-700/40 p-6 rounded-2xl max-w-sm w-full shadow-2xl">

                <div className="relative z-10">
                    {/* หัวข้อ Victory เปลี่ยนเป็นสีทองอมส้มหม่นๆ ดูขลังขึ้น */}
                    <h2 className="text-xl font-bold text-amber-200/90 mb-5 text-center tracking-wide">
                        VICTORY
                    </h2>

                    {/* ✅ เพิ่ม banner นี้ — โชว์เฉพาะตอนปลดล็อก roll cap ใหม่จริงๆ */}
                    {newRollCapUnlocked && (
                        <div className="bg-gradient-to-r from-amber-600/20 via-yellow-500/20 to-amber-600/20 border border-amber-500/50 rounded-xl p-3 mb-4 text-center animate-pulse">
                            <div className="text-amber-300 font-bold text-xs uppercase tracking-wider">🎉 Roll Ceiling Increased!</div>
                            <div className="text-white text-sm mt-1 font-semibold">
                                Loot up to <span className="text-amber-300">Level {newRollCapUnlocked}</span> unlocked
                            </div>
                        </div>
                    )}

                    <div className="space-y-2 mb-6">
                        {sortedRewards.map((reward, index) => {
                            const typeStr = (reward.type || '').toLowerCase();

                            const targetId = reward.id || (reward as any).itemId;
                            const materialData = materialLibrary.find(m => m.id === targetId);

                            const iconSrc = materialData?.icon
                                || (typeStr === 'item' || typeStr === 'skill' ? reward.itemData?.icon : null)
                                || (reward as any).icon
                                || `./Icons/Materials/${targetId}.svg`;

                            const displayName = materialData?.name
                                || (typeStr === 'item' || typeStr === 'skill' ? reward.itemData?.name : null)
                                || (reward as any).name
                                || targetId;

                            const itemRarity = (reward as any).itemData?.rarity || (reward as any).fixedRarity || (reward as any).rarity || (typeStr === 'material' ? 'Common' : typeStr);
                            const rarityColorClass = getRarityColor(itemRarity);

                            return (
                                <div key={index} className="flex items-center justify-between bg-stone-900/80 hover:bg-stone-900 p-2.5 px-3 rounded-xl border border-stone-800 transition">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={iconSrc}
                                            alt="reward-icon"
                                            className="w-9 h-9 object-contain bg-stone-950 border border-stone-800 rounded-lg p-1"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder.png';
                                            }}
                                        />
                                        <span className={`${rarityColorClass} text-sm font-medium`}>
                                            {displayName}
                                        </span>
                                    </div>

                                    <span className={`text-xs font-semibold px-2 py-1 rounded bg-stone-950/50 border border-stone-800 ${typeStr === 'material' ? 'text-amber-300/80' : rarityColorClass}`}>
                                        {typeStr === 'material'
                                            ? `x${reward.amount || 1}`
                                            : itemRarity}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* ปุ่ม GOT IT เปลี่ยนเป็นโทนดาร์กตัดขอบทองหม่น สบายตากว่าเดิม */}
                    <button
                        onClick={onClose}
                        className="w-full bg-stone-800 hover:bg-stone-700 border border-amber-600/50 py-2.5 rounded-xl text-amber-200 font-bold tracking-wide transition-all cursor-pointer shadow-md"
                    >
                        GOT IT
                    </button>
                </div>
            </div>
        </div>
    );
};