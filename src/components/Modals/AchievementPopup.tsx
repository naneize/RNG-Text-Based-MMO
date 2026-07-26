import React, { useEffect, useState, useRef } from 'react';
import { useAchievementStore } from '../../store/achievementStore';

export const AchievementPopup: React.FC = () => {
    const { achievements } = useAchievementStore();
    const [popupData, setPopupData] = useState<{ title: string; description: string } | null>(null);

    const prevUnlockedRef = useRef<Record<string, boolean>>({});
    // 1. เพิ่ม Ref สำหรับเช็กว่าเป็นการ Render ครั้งแรกหรือไม่
    const isFirstRender = useRef(true);

    useEffect(() => {
        const currentUnlockedStates = prevUnlockedRef.current;

        // 2. ถ้าเป็นการ Render ครั้งแรก (โหลดหน้าเว็บ / Refresh)
        if (isFirstRender.current) {
            // บันทึกสถานะปัจจุบันเก็บไว้ก่อน โดย "ไม่ต้องสั่งโชว์ Popup"
            Object.values(achievements).forEach((ach) => {
                currentUnlockedStates[ach.id] = ach.isUnlocked;
            });
            // เปลี่ยนสถานะเพื่อบอกว่าผ่านการ render ครั้งแรกไปแล้ว
            isFirstRender.current = false;
            return;
        }

        // 3. หลังจากครั้งแรกไปแล้ว หากมี achievement เปลี่ยนสถานะ ค่อยเช็กเพื่อเด้ง Popup
        Object.values(achievements).forEach((ach) => {
            const wasUnlocked = currentUnlockedStates[ach.id] || false;

            if (ach.isUnlocked && !wasUnlocked) {
                setPopupData({ title: ach.title, description: ach.description });
            }

            currentUnlockedStates[ach.id] = ach.isUnlocked;
        });
    }, [achievements]);

    // จัดการเรื่องเวลาแสดงผล Popup 3 วินาที
    useEffect(() => {
        if (popupData) {
            const timer = setTimeout(() => {
                setPopupData(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [popupData]);

    if (!popupData) return null;

    return (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 border border-emerald-500/50 shadow-2xl shadow-emerald-950/50 rounded-xl p-4 flex items-center gap-4 transition-all animate-bounce">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0">
                🏆
            </div>
            <div className="min-w-[200px]">
                <p className="text-xs text-emerald-400 font-semibold tracking-wider uppercase">Achievement Unlocked!</p>
                <h4 className="text-white font-bold text-sm mt-0.5">{popupData.title}</h4>
                <p className="text-slate-400 text-xs mt-0.5">{popupData.description}</p>
            </div>
        </div>
    );
};