import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../store/authStore';

export const AdminPanel = () => {
    const [message, setMessage] = useState('');
    const [isMinimized, setIsMinimized] = useState(false); // 👈 เพิ่ม state สำหรับซ่อน
    const { userProfile } = useAuthStore();

    if (!userProfile || userProfile.role !== 'developer') {
        return null;
    }

    const handleSendAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            await addDoc(collection(db, 'announcements'), {
                message: message.trim(),
                sender: userProfile.username || 'Admin',
                type: 'system',
                timestamp: Date.now()
            });
            setMessage('');
        } catch (error) {
            console.error("Error sending announcement:", error);
        }
    };

    return (
        <div className={`fixed bottom-5 left-4 z-50 bg-slate-900/95 border border-amber-500/80 rounded-lg p-2.5 shadow-lg max-w-[220px] w-full backdrop-blur transition-all duration-300 ${isMinimized ? 'opacity-70' : ''}`}>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
                    {isMinimized ? '🛠️ Admin (Show)' : '🛠️ Admin Panel'}
                </span>
                <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 hover:bg-amber-500/40"
                >
                    {isMinimized ? '▲' : '▼'}
                </button>
            </div>

            {!isMinimized && (
                <form onSubmit={handleSendAnnouncement} className="flex flex-col gap-1.5 animate-in fade-in duration-300">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type announcement..."
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-[10px] focus:outline-none focus:border-amber-500"
                    />
                    <button
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1 rounded text-[11px] transition-colors shadow"
                    >
                        🚀 Send Broadcast
                    </button>
                </form>
            )}
        </div>
    );
};