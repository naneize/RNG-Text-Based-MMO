import React, { useEffect, useState, useRef } from 'react';
import { useAchievementStore } from '../../store/achievementStore';

export const AchievementPopup: React.FC = () => {
    const { achievements } = useAchievementStore();
    const [popupData, setPopupData] = useState<{ title: string; description: string } | null>(null);

    const prevUnlockedRef = useRef<Record<string, boolean>>({});
    const isFirstRender = useRef(true);

    const playUnlockSound = () => {
        const audio = new Audio('/Audio/achievement-unlocked.wav');
        audio.volume = 0.3;
        audio.play().catch((err) => {
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
                playUnlockSound();
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
        <div className="fixed bottom-6 left-6 z-50 bg-stone-950/95 backdrop-blur-xl border border-amber-500/50 shadow-2xl shadow-amber-950/50 rounded-2xl p-4 flex items-center gap-4 transition-all animate-bounce">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                🏆
            </div>
            <div className="min-w-[200px]">
                <p className="text-[10px] text-amber-400 font-extrabold tracking-widest uppercase">Achievement Unlocked!</p>
                <h4 className="text-white font-bold text-sm mt-0.5">{popupData.title}</h4>
                <p className="text-stone-400 text-xs mt-0.5">{popupData.description}</p>
            </div>
        </div>
    );
};