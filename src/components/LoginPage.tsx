import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export const LoginPage = () => {
    const { login, register, loginWithGoogle, loginAsGuest, error, clearError } = useAuthStore();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
            <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-6 items-stretch">

                {/* 📌 Column 1: Login Box */}
                <div className="w-full lg:w-1/2 p-8 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl flex flex-col justify-between">
                    <div>
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-white mb-1">
                                RNG-Text-Based
                            </h1>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full font-mono">
                                    Version : 0.0.2
                                </span>
                                <p className="text-slate-400 text-sm">
                                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                                </p>
                            </div>
                        </div>

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

                        <button
                            onClick={loginAsGuest}
                            className="w-full mt-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                            Play as Guest
                        </button>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-800/80 text-center">
                        <p className="text-[10px] text-slate-500">
                            Icons provided by{' '}
                            <a href="https://game-icons.net/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-400 underline">
                                Game-Icons.net
                            </a>
                        </p>
                    </div>
                </div>

                {/* 📌 Column 2: Patch Notes / Updates Box */}
                <div className="w-full lg:w-1/2 p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl flex flex-col">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                        <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                            <span>🚀</span> Latest Updates & Patch Notes
                        </h2>
                        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                            v0.0.2
                        </span>
                    </div>

                    <div className="space-y-4 overflow-y-auto pr-1 flex-1 max-h-[450px] text-xs">
                        {/* Update 1 */}
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-white text-sm">✨ Cloud Save & Profile Sync</span>
                                <span className="text-[10px] text-emerald-400 font-mono">New</span>
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                Implemented cloud data synchronization for player stats, inventory, and progression across multiple devices.
                            </p>
                        </div>

                        {/* Update 2 */}
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-white text-sm">🛡️ Advanced Equipment Tiering</span>
                                <span className="text-[10px] text-emerald-400 font-mono">Updated</span>
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                Added rare prefix and suffix modifiers to dropped items, enhancing custom stat rolls and build varieties.
                            </p>
                        </div>

                        {/* Update 3 */}
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-white text-sm">⚖️ Economy & Drop Rate Tweaks</span>
                                <span className="text-[10px] text-amber-400 font-mono">Balance</span>
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                Rebalanced crafting resource costs and fine-tuned RNG drop rates for high-tier materials in mid-game zones.
                            </p>
                        </div>

                        {/* Update 4 */}
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-white text-sm">🐛 Bug Fixes & UI Enhancements</span>
                                <span className="text-[10px] text-blue-400 font-mono">Fix</span>
                            </div>
                            <p className="text-slate-400 leading-relaxed">
                                Resolved an issue with stat-overflow calculations and optimized overall UI responsiveness on mobile screens.
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                        <p className="text-[11px] text-slate-500">
                            Thank you for playing! Stay tuned for more updates.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};