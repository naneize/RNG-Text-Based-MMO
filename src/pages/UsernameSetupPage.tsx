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
            // บันทึกสำเร็จ รีโหลดหรือปล่อยให้แอปพาไปหน้าหลัก
            window.location.reload();
        }

        setIsSubmitting(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <div className="w-full max-w-sm p-8 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white mb-1">
                        Create Character
                    </h1>
                    <p className="text-slate-400 text-sm">
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
                        className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600 text-sm"
                    />

                    {(validationError || error) && (
                        <p className="text-red-400 text-xs text-center">{validationError || error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="p-3 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm transition disabled:opacity-50 mt-1"
                    >
                        {isSubmitting ? 'Checking & Saving...' : 'Confirm Username'}
                    </button>
                </form>

                <div className="mt-8 pt-4 border-t border-slate-800/80 text-center">
                    <p className="text-[10px] text-slate-500">
                        This name will be displayed in the World Chat. Choose wisely!
                    </p>
                </div>
            </div>
        </div>
    );
};