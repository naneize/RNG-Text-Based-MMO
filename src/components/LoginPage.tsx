import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { PatchNotesModal } from '../components/Modals/PatchNotesModal';

export const LoginPage = () => {
    const { login, register, loginWithGoogle, loginAsGuest, error, clearError } = useAuthStore();

    const [hasStarted, setHasStarted] = useState(false);
    const [currentBg] = useState('Main_BG_1.png');

    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 🟢 เช็กว่าเกมกำลังรันอยู่บน iframe ของแพลตฟอร์มภายนอก (เช่น CrazyGames) หรือไม่
    const isEmbedded = (() => {
        try {
            return window.self !== window.top || window.location.hostname.includes('crazygames');
        } catch (e) {
            return true;
        }
    })();

    // 🟢 ฟังก์ชันกดเริ่มเกม (กดปุ่ม START ADVENTURE)
    const handleStartAdventure = () => {
        setHasStarted(true);
        if (isEmbedded) {
            loginAsGuest();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (mode === 'login') {
            await login(email, password);
        } else {
            await register(email, password);
        }
        setIsSubmitting(false);
    };

    const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        await loginWithGoogle();
        setIsSubmitting(false);
    };

    const switchMode = () => {
        clearError();
        setMode(mode === 'login' ? 'register' : 'login');
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">

            {/* 🖼️ วิดีโอพื้นหลังเคลื่อนไหว */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                >
                    <source src="/Icons/Backgrounds/202608131618.webm" type="video/webm" />
                    <img src={`/Icons/Backgrounds/${currentBg}`} alt="Background Fallback" className="w-full h-full object-cover" />
                </video>

                <div className={`absolute inset-0 transition-colors duration-500 ${hasStarted ? 'bg-slate-950/40 backdrop-blur-xs' : 'bg-slate-950/0 backdrop-blur-none'}`} />
            </div>

            {/* 🌟 หน้าแรก (Splash Screen) */}
            {!hasStarted ? (
                <div className="relative z-10 flex flex-col items-center text-center animate-fadeIn">
                    <div className="mb-8">
                        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-wider mt-4 drop-shadow-[0_5px_20px_rgba(245,158,11,0.4)]">
                            RNG-TEXT-BASED
                        </h1>
                        <p className="text-amber-100/70 text-sm md:text-base mt-2 tracking-wide drop-shadow-md">
                            Embark on your text-based adventure, roll legendary gear, and conquer the realm.
                        </p>
                    </div>

                    <button
                        onClick={handleStartAdventure}
                        className="group relative px-10 py-5 bg-gradient-to-b from-rose-950 via-red-950 to-slate-950 hover:from-rose-900 hover:to-red-900 text-amber-200 font-extrabold text-lg tracking-widest rounded-xl border-2 border-amber-500/90 hover:border-amber-300 shadow-[0_0_40px_rgba(220,38,38,0.5),inset_0_1px_2px_rgba(255,255,255,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.7)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                    >
                        <span className="flex items-center gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                            START ADVENTURE
                        </span>
                    </button>
                    <p className="text-amber-200/50 text-xs mt-4">
                        Click the button to enter
                    </p>
                </div>
            ) : (
                /* 🔐 หน้า Login / Register + Patch Notes */
                <div className="relative z-10 w-full max-w-4xl flex flex-col lg:flex-row gap-6 items-stretch animate-fadeIn">

                    <div className="w-full lg:w-1/2 p-8 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl flex flex-col justify-between">
                        <div>
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    RNG-Text-Based
                                </h1>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">
                                        Version : 0.0.4
                                    </span>
                                    <p className="text-slate-400 text-sm">
                                        {isEmbedded ? 'Welcome Player' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                                    </p>
                                </div>
                            </div>

                            {!isEmbedded ? (
                                <>
                                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 text-sm"
                                        />
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={6}
                                            className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 text-sm"
                                        />

                                        {error && (
                                            <p className="text-red-400 text-xs text-center">{error}</p>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="p-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm transition disabled:opacity-50 mt-1 cursor-pointer"
                                        >
                                            {isSubmitting ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
                                        </button>
                                    </form>

                                    <div className="flex items-center gap-3 my-4">
                                        <div className="flex-1 h-px bg-slate-800" />
                                        <span className="text-slate-500 text-xs">OR</span>
                                        <div className="flex-1 h-px bg-slate-800" />
                                    </div>

                                    <button
                                        onClick={handleGoogleLogin}
                                        disabled={isSubmitting}
                                        className="w-full p-3 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.14C3.15 21.35 7.23 24 12 24z" />
                                            <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.18C.43 8.14 0 9.87 0 12s.43 3.86 1.18 5.38l4.09-3.14z" />
                                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.15 2.65 1.18 6.62l4.09 3.14c.95-2.85 3.6-4.91 6.73-4.91z" />
                                        </svg>
                                        Continue with Google
                                    </button>

                                    <p className="text-slate-400 text-sm text-center mt-6">
                                        {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                                        <button
                                            onClick={switchMode}
                                            className="text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                                        >
                                            {mode === 'login' ? 'Sign Up' : 'Sign In'}
                                        </button>
                                    </p>
                                </>
                            ) : (
                                <div className="text-center py-6 text-slate-300">
                                    <p className="mb-4 text-sm">Ready to play on CrazyGames!</p>
                                </div>
                            )}

                            <button
                                onClick={loginAsGuest}
                                className="w-full mt-3 p-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                            >
                                Play Game (Guest)
                            </button>
                        </div>

                        {/* 🟢 ส่วนที่เพิ่ม: ข้อความ Terms & Conditions และ Privacy Policy สำหรับผ่านตรวจ CrazyGames */}
                        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center flex flex-col gap-1.5">
                            <p className="text-[11px] text-slate-400">
                                By playing, you agree to our{' '}
                                <span className="text-emerald-400 underline cursor-pointer">Terms & Conditions</span>{' '}
                                and{' '}
                                <span className="text-emerald-400 underline cursor-pointer">Privacy Policy</span>.
                            </p>
                            <p className="text-[10px] text-slate-500">
                                Icons provided by{' '}
                                <a href="https://game-icons.net/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 underline">
                                    Game-Icons.net
                                </a>
                            </p>
                        </div>
                    </div>

                    <PatchNotesModal />

                </div>
            )}
        </div>
    );
};