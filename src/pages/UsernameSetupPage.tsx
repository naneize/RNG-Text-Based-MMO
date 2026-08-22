import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export const UsernameSetupPage = () => {
    const { saveUsername, error } = useAuthStore();
    const [username, setUsername] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ตรวจสอบความยาวเบื้องต้น
        if (username.trim().length < 3) {
            setValidationError('Username must be at least 3 characters long.');
            return;
        }

        setValidationError(null);
        setIsSubmitting(true);

        // บันทึกและเช็คชื่อซ้ำผ่าน Store
        const success = await saveUsername(username.trim());

        if (success) {

        }

        setIsSubmitting(false);
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-stone-950 text-white p-6 overflow-hidden select-none">

            {/* 🖼️ Live Video Background (ใช้ตัวเดียวกันเป๊ะ) */}
            <div className="absolute inset-0 z-0 opacity-100">
                <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                    <source src="/Icons/Backgrounds/202608131618.webm" type="video/webm" />
                </video>
                {/* เกลี่ยแสงขอบมืดให้ตัวหนังสือเด่นขึ้น โดยอมโทนแดงเข้มนิดๆ ด้านล่าง */}
                <div className="absolute inset-0 bg-radial from-transparent via-stone-950/40 to-black/80" />
            </div>

            {/* ⏳ กล่อง Create Character (ปรับดีไซน์ให้เข้ากับธีม Amber / วิหารโบราณ) */}
            <div className="relative z-10 w-full max-w-sm p-8 bg-black/75 backdrop-blur-md rounded-2xl border border-amber-900/40 shadow-[0_10px_50px_rgba(0,0,0,0.9)]">

                {/* หัวข้อเปลี่ยนเป็นสีทองแดง/ส้มอมเหลือง (Amber) พร้อมเอฟเฟกต์เรืองแสง */}
                <div className="text-center mb-6">
                    <h1 className="text-xl font-extrabold text-amber-500 tracking-widest mb-1 animate-pulse drop-shadow-[0_2px_10px_rgba(245,158,11,0.4)]">
                        CREATE CHARACTER
                    </h1>
                    <p className="text-amber-200/60 text-xs font-mono">
                        Choose your unique username for the world chat
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                        type="text"
                        placeholder="Character Name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        maxLength={20}
                        className="p-3 rounded-lg bg-black/80 border border-amber-900/50 text-amber-100 placeholder-amber-500/40 focus:outline-none focus:border-amber-500 text-sm font-mono shadow-inner"
                    />

                    {(validationError || error) && (
                        <p className="text-red-400 text-xs text-center font-mono">{validationError || error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="p-3 rounded-lg bg-gradient-to-r from-amber-700 via-orange-600 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-sm tracking-wider transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.4)] disabled:opacity-50 mt-1"
                    >
                        {isSubmitting ? 'CHECKING & SAVING...' : 'CONFIRM USERNAME'}
                    </button>
                </form>

                <div className="mt-8 pt-4 border-t border-amber-950/80 text-center">
                    <p className="text-[10px] text-amber-200/40 font-mono">
                        This name will be displayed in the World Chat. Choose wisely!
                    </p>
                </div>
            </div>
        </div>
    );
};