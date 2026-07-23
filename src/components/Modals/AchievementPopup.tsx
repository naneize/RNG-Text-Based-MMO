import React, { useEffect, useState, useRef } from 'react';
import { useAchievementStore } from '../../store/achievementStore';

export const AchievementPopup: React.FC = () => {
    const { achievements } = useAchievementStore();
    const [popupData, setPopupData] = useState<{ title: string; description: string } | null>(null);

    // ใช้ Ref เพื่อเก็บสถานะ unlocked ของแต่ละ achievement ไว้เทียบในรอบก่อนหน้า
    const prevUnlockedRef = useRef<Record<string, boolean>>({});

    useEffect(() => {
        const currentUnlockedStates = prevUnlockedRef.current;

        // วนลูปเช็กว่ามีตัวไหนเพิ่งเปลี่ยนสถานะจาก locked -> unlocked บ้าง
        Object.values(achievements).forEach((ach) => {
            const wasUnlocked = currentUnlockedStates[ach.id] || false;

            // ถ้าตอนนี้ปลดล็อกแล้ว แต่รอบก่อนหน้ายังไม่ปลดล็อก (หมายถึงเพิ่งปลดล็อกสดๆ ร้อนๆ)
            if (ach.isUnlocked && !wasUnlocked) {
                setPopupData({ title: ach.title, description: ach.description });
            }

            // อัปเดตสถานะปัจจุบันเก็บไว้เทียบในรอบถัดไป
            currentUnlockedStates[ach.id] = ach.isUnlocked;
        });
    }, [achievements]);

    // จัดการเรื่องเวลาแสดงผล Popup 4 วินาที
    useEffect(() => {
        if (popupData) {
            const timer = setTimeout(() => {
                setPopupData(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [popupData]);

    if (!popupData) return null;

    return (
        // 👇 เปลี่ยนจาก right-6 เป็น left-6 ตรงนี้ครับ
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