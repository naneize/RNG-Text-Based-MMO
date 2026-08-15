import { useState, useEffect } from 'react';

const GAME_TIPS = [
    "Tip: Higher rarity gear provides significantly greater sub-stats.",
    "Tip: Check the Marketplace regularly for rare items sold by other players.",
    "Tip: Completing achievements awards valuable in-game resources.",
    "Tip: RNG can be unpredictable—patience is a true adventurer's strength.",
    "Tip: Make sure to check your Patch Notes for recent balance updates.",
    "Tip: Equipping items with complementary stats will greatly boost your combat rating.",
    "Tip: Daily login streaks grant exclusive bonuses for dedicated adventurers."
];

interface LoadingScreenProps {
    onFinished: () => void;
}

export const LoadingScreen = ({ onFinished }: LoadingScreenProps) => {
    const [progress, setProgress] = useState(0);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    // 1. ⏱️ ระบบนับเวลา Progress Bar (~15 วินาที ตามที่ปรับล่าสุด)
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        onFinished();
                    }, 500);
                    return 100;
                }
                return prev + 1;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [onFinished]);

    // 2. 🔄 เปลี่ยน Tip ทุก 6 วินาที
    useEffect(() => {
        const tipInterval = setInterval(() => {
            setCurrentTipIndex((prevIndex) => (prevIndex + 1) % GAME_TIPS.length);
        }, 6000);

        return () => clearInterval(tipInterval);
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 overflow-hidden select-none">

            {/* 🖼️ Live Video Background */}
            <div className="absolute inset-0 z-0 opacity-100">
                <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                    <source src="/Icons/Backgrounds/202608131618.mp4" type="video/mp4" />
                </video>
                {/* เกลี่ยแสงขอบมืดให้ตัวหนังสือเด่นขึ้น โดยอมโทนแดงเข้มนิดๆ ด้านล่าง */}
                <div className="absolute inset-0 bg-radial from-transparent via-slate-950/40 to-black/80" />
            </div>

            {/* ⏳ กล่อง Loading Center (ปรับขอบและเงาให้เข้ากับธีมไฟนรก/วิหารโบราณ) */}
            <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center bg-black/75 backdrop-blur-md p-8 rounded-2xl border border-amber-900/40 shadow-[0_10px_50px_rgba(0,0,0,0.9)]">

                {/* หัวข้อเปลี่ยนเป็นสีทองแดง/ส้มอมเหลือง (Amber) */}
                <h2 className="text-xl font-extrabold text-amber-500 tracking-widest mb-1 animate-pulse drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)]">
                    PREPARING YOUR ADVENTURE
                </h2>
                <p className="text-amber-200/60 text-xs font-mono mb-6">
                    Loading game assets, player stats & realm events...
                </p>

                {/* 📊 Progress Bar Container */}
                <div className="w-full h-4 bg-black/90 rounded-full overflow-hidden border border-amber-900/50 p-0.5 shadow-inner">
                    {/* หลอดโหลดเปลี่ยนเป็นไล่สี ส้มอิฐ ไปจนถึง เหลืองทองประกายไฟ */}
                    <div
                        className="h-full bg-gradient-to-r from-amber-700 via-orange-500 to-amber-300 rounded-full transition-all duration-300 ease-linear shadow-[0_0_15px_rgba(245,158,11,0.7)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* เปอร์เซ็นต์ */}
                <div className="flex justify-between w-full mt-2 text-xs font-mono text-slate-300">
                    <span className="text-amber-200/50">Entering Realm...</span>
                    <span className="text-amber-400 font-bold">{progress}%</span>
                </div>

                {/* 💡 Game Tip Section */}
                <div className="mt-6 pt-4 border-t border-amber-950/80 w-full min-h-[60px] flex items-center justify-center">
                    <p className="text-amber-100/80 text-xs italic font-sans leading-relaxed transition-all duration-500 ease-in-out drop-shadow">
                        "{GAME_TIPS[currentTipIndex]}"
                    </p>
                </div>
            </div>
        </div>
    );
};