import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import type { ChatMessage } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

// เพิ่มรับ prop onClose เข้ามาเพื่อสั่งปิด Modal
interface WorldChatProps {
    onClose?: () => void;
}

export const WorldChat = ({ onClose }: WorldChatProps) => {
    const { messages, sendMessage, subscribeToChat } = useChatStore();
    const { userProfile } = useAuthStore();
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = subscribeToChat();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [subscribeToChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        await sendMessage(inputText);
        setInputText('');
    };

    return (
        <div className="flex flex-col h-[500px] w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {/* Header รวมชื่อหัวข้อ, สถานะล็อกอิน และปุ่มปิดไว้อย่างลงตัวในแถวเดียว */}
            <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50 flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-white font-bold text-sm tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        WORLD CHAT
                    </h2>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                        Logged in as: <strong className="text-emerald-400">{userProfile?.username}</strong>
                    </span>
                </div>

                {/* ปุ่มปิด (X) มุมขวาบนสุดของ Header แชทพอดี */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-7 h-7 bg-slate-700/50 hover:bg-red-600/80 text-slate-300 hover:text-white rounded-lg flex items-center justify-center text-sm font-bold transition"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                        No messages yet. Say something to the world!
                    </div>
                ) : (
                    messages.map((msg: ChatMessage) => {
                        const isMyMessage = msg.uid === userProfile?.uid;
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col max-w-[80%] ${isMyMessage ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                            >
                                <span className="text-[10px] text-slate-400 mb-1 px-1">
                                    {msg.username}
                                </span>
                                <div
                                    className={`px-3 py-2 rounded-2xl text-sm break-words ${isMyMessage
                                        ? 'bg-emerald-700 text-white rounded-br-none'
                                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={200}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-600"
                />
                <button
                    type="submit"
                    className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
                >
                    Send
                </button>
            </form>
        </div>
    );
};