import React, { useEffect, useState, useRef } from 'react';
import { useAchievementStore } from '../../store/achievementStore';

export const AchievementPopup: React.FC = () => {
    const { achievements } = useAchievementStore();
    const [popupData, setPopupData] = useState<{ title: string; description: string } | null>(null);

    const prevUnlockedRef = useRef<Record<string, boolean>>({});
    const isFirstRender = useRef(true);

    // 🟢 ฟังก์ชันสำหรับเล่นเสียง Achievement
    const playUnlockSound = () => {
        const audio = new Audio('/Audio/achievement-unlocked.wav');
        audio.volume = 0.3; // ปรับความดังได้ตามต้องการ (0.0 - 1.0)
        audio.play().catch((err) => {
            // ป้องกัน Error กรณี Browser บล็อกการเล่นเสียงอัตโนมัติก่อนมีการคลิกหน้าจอ
            console.log("Audio play blocked:", err);
        });
    };

    useEffect(() => {
        const currentUnlockedStates = prevUnlockedRef.current;

        if (isFirstRender.current) {
            Object.values(achievements).forEach((ach) => {
                currentUnlockedStates[ach.id] = ach.isUnlocked;
            });
            isFirstRender.current = false;
            return;
        }

        Object.values(achievements).forEach((ach) => {
            const wasUnlocked = currentUnlockedStates[ach.id] || false;

            if (ach.isUnlocked && !wasUnlocked) {
                setPopupData({ title: ach.title, description: ach.description });
                playUnlockSound(); // 🟢 สั่งเล่นเสียงตรงนี้เวลา Achievement ปลดล็อก
            }

            currentUnlockedStates[ach.id] = ach.isUnlocked;
        });
    }, [achievements]);

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