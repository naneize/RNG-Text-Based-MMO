import React, { useEffect } from 'react';
import type { RewardResult } from '../../utils/dropLogic';
import { materialLibrary } from '../../data/materialLibrary';

interface RewardModalProps {
    rewards: RewardResult[];
    onClose: () => void;
}

export const RewardModal = ({ rewards, onClose }: RewardModalProps) => {

    // กำหนดน้ำหนักความหายาก (ใช้ string ทั่วไปเพื่อเลี่ยง Type Collision)
    const rarityWeight: Record<string, number> = {
        'Legendary': 1,
        'Epic': 2,
        'Rare': 3,
        'Common': 4,
        'material': 5
    };

    // 🟢 ฟังก์ชันสำหรับคืนค่า Class สีตามระดับ Rarity
    const getRarityColor = (rarity: string = '') => {
        switch (rarity.toLowerCase()) {
            case 'legendary':
                return 'text-amber-400 font-extrabold drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'; // สีทองส้ม + เรืองแสงนิดๆ
            case 'epic':
                return 'text-purple-400 font-bold drop-shadow-[0_0_6px_rgba(192,132,252,0.4)]'; // สีม่วง
            case 'rare':
                return 'text-blue-400 font-semibold'; // สีน้ำเงิน
            case 'common':
            default:
                return 'text-slate-300'; // สีเทาอ่อน/ขาวมาตรฐาน
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
        const timer = setTimeout(() => {
            onClose();
        }, 1500);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-emerald-500 p-6 rounded-xl max-w-sm w-full shadow-2xl">
                <h2 className="text-xl font-bold text-emerald-400 mb-4 text-center">Victory</h2>

                <div className="space-y-2 mb-6">
                    {sortedRewards.map((reward, index) => {
                        const typeStr = (reward.type || '').toLowerCase();

                        // 🟢 ค้นหาจาก materialLibrary โดยเช็คทั้ง id และ itemId เผื่อชื่อฟิลด์ไม่ตรงกัน
                        const targetId = reward.id || (reward as any).itemId;
                        const materialData = materialLibrary.find(m => m.id === targetId);

                        // 🟢 ดึง icon
                        const iconSrc = materialData?.icon
                            || (typeStr === 'item' || typeStr === 'skill' ? reward.itemData?.icon : null)
                            || (reward as any).icon
                            || `/Icons/Materials/${targetId}.svg`;

                        // 🟢 ดึงชื่อไอเทม
                        const displayName = materialData?.name
                            || (typeStr === 'item' || typeStr === 'skill' ? reward.itemData?.name : null)
                            || (reward as any).name
                            || targetId;

                        // 🟢 ดึงค่า Rarity เพื่อเอามาเทียบสี (ถ้าเป็น material จะให้เป็น common หรือสีมาตรฐาน)
                        const itemRarity = (reward as any).itemData?.rarity || (reward as any).fixedRarity || (reward as any).rarity || (typeStr === 'material' ? 'Common' : typeStr);
                        const rarityColorClass = getRarityColor(itemRarity);

                        return (
                            <div key={index} className="flex items-center justify-between bg-slate-800 p-2 px-3 rounded text-sm">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={iconSrc}
                                        alt="reward-icon"
                                        className="w-8 h-8 object-contain bg-slate-900 rounded p-1"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/placeholder.png';
                                        }}
                                    />
                                    {/* 🟢 ใส่สีให้ชื่อไอเทมตามระดับ Rarity */}
                                    <span className={rarityColorClass}>
                                        {displayName}
                                    </span>
                                </div>

                                {/* 🟢 ใส่สีให้ข้อความบอกจำนวน (หรือระดับ Rarity ด้านขวา) ด้วยเช่นกัน */}
                                <span className={`font-bold ${typeStr === 'material' ? 'text-emerald-400' : rarityColorClass}`}>
                                    {typeStr === 'material'
                                        ? `x${reward.amount || 1}`
                                        : itemRarity}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 py-2 rounded text-white font-bold transition-colors"
                >
                    GOT IT
                </button>
            </div>
        </div>
    );
};