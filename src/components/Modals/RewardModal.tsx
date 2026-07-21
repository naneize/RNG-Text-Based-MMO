import React, { useEffect } from 'react';
import type { RewardResult } from '../../utils/dropLogic'; // ดึง Type มาจากไฟล์ logic เลย
import { materialLibrary } from '../../data/materialLibrary';

interface RewardModalProps {
    rewards: RewardResult[]; // ใช้ Type ที่เราประกาศไว้ใน dropLogic.ts
    onClose: () => void;
}

export const RewardModal = ({ rewards, onClose }: RewardModalProps) => {

    // เพิ่ม useEffect สำหรับตั้งเวลาปิดอัตโนมัติ
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 1500);

        // ล้าง timer เมื่อ Component ถูกทำลาย เพื่อป้องกัน Memory Leak
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-emerald-500 p-6 rounded-xl max-w-sm w-full shadow-2xl">
                <h2 className="text-xl font-bold text-emerald-400 mb-4 text-center">Victory</h2>

                <div className="space-y-2 mb-6">
                    {rewards.map((reward, index) => {
                        // 1. หาข้อมูล Material จาก Library ให้ชัวร์ก่อนนำไปใช้
                        const materialData = reward.type === 'material'
                            ? materialLibrary.find(m => m.id === reward.id)
                            : null;

                        return (
                            <div key={index} className="flex items-center justify-between bg-slate-800 p-2 px-3 rounded text-sm">
                                <div className="flex items-center gap-3">
                                    {/* แก้ไขส่วนแสดงรูปภาพ: ใช้ materialData ที่หาเจอ */}
                                    <img
                                        src={reward.type === 'item'
                                            ? reward.itemData?.icon
                                            : (materialData?.icon || reward.icon || '/placeholder.png')}
                                        alt="reward-icon"
                                        className="w-8 h-8 object-contain bg-slate-900 rounded p-1"
                                    />
                                    <span className="text-white">
                                        {reward.type === 'item'
                                            ? reward.itemData?.name
                                            : (materialData?.name || reward.id)}
                                    </span>
                                </div>

                                {/* แก้ไขส่วนแสดงจำนวน: ให้โชว์ค่า amount ถ้ามี */}
                                <span className="text-emerald-400 font-bold">
                                    {reward.type === 'material'
                                        ? `x${reward.amount || 1}`
                                        : (reward.itemData?.rarity || 'Item')}
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