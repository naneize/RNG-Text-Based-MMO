import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import type { ChatMessage } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { formatMessageTime, formatFullDate } from '../utils/dateFormatter';
import { ItemDetailModal } from './Modals/ItemDetailModal';
import { CharacterStats } from './character/CharacterStats';
import type { Item, Player } from '../types/game';

interface WorldChatProps {
    onClose?: () => void;
    onShareStats?: () => void;
}

// ชุดอีโมจิสั้นๆ สำหรับ react
const REACTION_EMOJIS = ['👍', '🔥', '❤️', '😂', '👑', '💯'];

export const WorldChat = ({ onClose, onShareStats }: WorldChatProps) => {
    const { messages, sendMessage, deleteMessage, clearChat, toggleReaction, onlineUsers, subscribeToOnlineUsers } = useChatStore();
    const { userProfile, user } = useAuthStore();

    const [inputText, setInputText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [openReactionPickerFor, setOpenReactionPickerFor] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const reactionPickerRef = useRef<HTMLDivElement>(null);

    // State สำหรับเปิดดูไอเทม หรือ ส่องสเตตัสผู้เล่น
    const [inspectingItem, setInspectingItem] = useState<Item | null>(null);
    const [inspectingPlayerStats, setInspectingPlayerStats] = useState<ChatMessage['playerStats'] | null>(null);

    const FREE_EMOJIS = ['😊', '😂', '🔥', '👍', '❤️', '🎉', '😎', '⭐', '😢', '🙏', '💯', '👑', '⚔️', '🛡️', '💎', '🚀'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
                setOpenReactionPickerFor(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const unsubscribe = subscribeToOnlineUsers();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [subscribeToOnlineUsers]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        await sendMessage(inputText);
        setInputText('');
        setShowEmojiPicker(false);
    };

    const addEmoji = (emoji: string) => {
        setInputText((prev) => prev + emoji);
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity?.toLowerCase()) {
            case 'legendary':
                return 'text-orange-500 border-orange-700 bg-orange-700/40 font-semibold';
            case 'epic':
                return 'text-purple-300 border-purple-600 bg-purple-700/40 font-semibold';
            case 'rare':
                return 'text-blue-400 border-blue-600 bg-blue-700/40 font-semibold';
            default:
                return 'text-slate-200 border-slate-500 bg-slate-800/80';
        }
    };

    const getDropChance = (item?: Item) => {
        if (!item) return '100';
        const chance = (item as any).dropChance || (item as any).drop_chance || '1';
        return String(chance).replace('%', '');
    };

    // สรุป reactions ของข้อความหนึ่ง -> { emoji: count } เรียงจากเยอะไปน้อย
    const summarizeReactions = (reactions?: Record<string, string>) => {
        if (!reactions) return [];
        const counts: Record<string, number> = {};
        Object.values(reactions).forEach((emoji) => {
            counts[emoji] = (counts[emoji] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    };

    return (
        <div className="relative flex flex-col h-[500px] w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700/50 flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-white font-bold text-sm tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        WORLD CHAT
                        {/* 🟢 โชว์จำนวนคนออนไลน์ตรงนี้ */}
                        <span className="text-xs bg-emerald-900/60 text-emerald-400 border border-emerald-700/50 px-2 py-0.5 rounded-full font-normal">
                            Online : {onlineUsers.length}
                        </span>
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => clearChat()}
                        className="px-3 h-7 bg-slate-700/50 hover:bg-red-600/80 text-slate-300 hover:text-white rounded-lg flex items-center justify-center text-xs font-semibold transition cursor-pointer"
                    >
                        Clear Chat
                    </button>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-7 h-7 bg-slate-700/50 hover:bg-red-600/80 text-slate-300 hover:text-white rounded-lg flex items-center justify-center text-sm font-bold transition cursor-pointer"
                        >
                            ✕
                        </button>
                    )}
                </div>
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
                        const myReaction = userProfile ? msg.reactions?.[userProfile.uid] : undefined;
                        const reactionSummary = summarizeReactions(msg.reactions);

                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col max-w-[80%] relative group ${isMyMessage ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                            >
                                {/* โครงสร้างใหม่: รวม Avatar, ชื่อ, เวลา และกล่องข้อความไว้ในก้อนเดียว */}
                                <div className={`flex items-start gap-3 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>

                                    {/* Avatar */}
                                    <div className="relative w-11 h-11 shrink-0 flex items-center justify-center cursor-pointer">
                                        <img src={msg.avatar || '/default-avatar.png'} alt={msg.username} className="w-9 h-9 rounded-full object-cover" />
                                        {msg.frame && <img src={msg.frame} alt="frame" className="absolute inset-0 w-full h-full pointer-events-none scale-150" />}
                                    </div>

                                    {/* ส่วนของชื่อและข้อความ */}
                                    <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                        {/* ชื่อและเวลา */}
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            {msg.role === 'developer' ? (
                                                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] px-1.5 py-0.5 rounded font-mono font-bold">DEV</span>
                                            ) : (
                                                <span className="text-xs font-bold text-indigo-300 hover:underline cursor-pointer">{msg.username}</span>
                                            )}
                                            <span className="text-[10px] text-slate-500">{formatMessageTime(msg.createdAt)}</span>
                                        </div>

                                        {/* กล่องข้อความ (รวม Logic การลบ/Item/Stats ไว้ที่นี่) */}
                                        <div className={`flex items-center gap-2 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {isMyMessage && (
                                                <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-500 text-xs p-1 cursor-pointer">Clear</button>
                                            )}

                                            <div className={`px-3 py-2 rounded-2xl text-sm break-words flex flex-col gap-1.5 ${isMyMessage ? 'bg-emerald-700 text-white rounded-br-none border border-emerald-600' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'}`}>
                                                {msg.text && <span>{msg.text}</span>}
                                                {msg.item && (
                                                    <button onClick={() => setInspectingItem(msg.item!)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${getRarityColor(msg.item.rarity)}`}>
                                                        <img src={msg.item.icon} alt={msg.item.name} className="w-5 h-5 object-contain" />
                                                        <span>[{msg.item.name}]</span>
                                                        <span className="text-[10px] underline opacity-80 text-white font-normal">Click to view</span>
                                                    </button>
                                                )}
                                                {msg.playerStats && (
                                                    <button onClick={() => setInspectingPlayerStats(msg.playerStats!)} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold bg-slate-900/80 border-emerald-500/50 text-emerald-300">
                                                        <div className="flex flex-col text-left">
                                                            <span>Inspect {msg.playerStats.username}'s Stats</span>
                                                            <span className="text-[10px] text-slate-400">Click to view stats</span>
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Reactions */}
                                        <div className={`relative flex items-center gap-1.5 mt-1 flex-wrap ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* (ส่วน Reaction เหมือนเดิมของคุณ) */}
                                            {/* ... วางโค้ด Reaction เดิมของคุณต่อจากตรงนี้ได้เลยครับ ... */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form & Emoji Picker */}
            <div className="relative p-3 bg-slate-900 border-t border-slate-800 flex flex-col gap-2">
                {/* 📌 นำโค้ดปุ่ม Share My Stats มาวางไว้ตรงนี้ครับ */}
                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => {
                            if (onShareStats) {
                                onShareStats();
                            } else {
                                useChatStore.getState().shareStatsToChat();
                            }
                        }}
                        className="bg-slate-800 hover:bg-slate-700 border border-emerald-600/50 text-emerald-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                        <span></span> Share My Stats
                    </button>
                </div>

                {showEmojiPicker && (
                    <div
                        ref={emojiPickerRef}
                        className="absolute bottom-full left-3 mb-2 bg-slate-800 border border-slate-700 p-2 rounded-xl shadow-lg grid grid-cols-8 gap-1.5 z-20"
                    >
                        {FREE_EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => addEmoji(emoji)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-slate-700 rounded-lg text-lg transition cursor-pointer"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSend} className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-2 rounded-lg text-sm transition cursor-pointer flex items-center justify-center"
                        title="Add Emoji"
                    >
                        😀
                    </button>

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
                        className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition cursor-pointer"
                    >
                        Send
                    </button>
                </form>
            </div>

            {/* Modal หน้าต่างดูไอเทม */}
            {inspectingItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <ItemDetailModal
                        selectedItem={inspectingItem}
                        setSelectedItem={() => setInspectingItem(null)}
                        getRarityColor={getRarityColor}
                        getDropChance={() => getDropChance(inspectingItem)}
                        equippedInSlot={null}
                        equipItem={() => { }}
                        onTransferClick={() => { }}
                        onSalvageClick={() => { }}
                        onRerollClick={() => { }}
                        hideActions={true}
                    />
                </div>
            )}

            {/* Modal หน้าต่างส่อง Stats ผู้เล่นอื่น */}
            {inspectingPlayerStats && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                            <h3 className="text-white font-bold text-lg flex items-center gap-3">
                                {/* 🟢 เพิ่มรูป Avatar และ Frame ตรงหัวข้อส่องสเตตัส */}
                                <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                                    <img
                                        src={inspectingPlayerStats.avatar || '/default-avatar.png'}
                                        alt={inspectingPlayerStats.username}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                    {inspectingPlayerStats.frame && (
                                        <img
                                            src={inspectingPlayerStats.frame}
                                            alt="frame"
                                            className="absolute inset-0 w-full h-full pointer-events-none scale-125"
                                        />
                                    )}
                                </div>
                                <span>Inspecting : <span className="text-emerald-400">{inspectingPlayerStats.username}</span></span>
                            </h3>
                            <button
                                onClick={() => setInspectingPlayerStats(null)}
                                className="w-8 h-8 bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white rounded-lg flex items-center justify-center font-bold transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* เรียกใช้ Component CharacterStats ที่มีอยู่แล้ว */}
                        <CharacterStats
                            finalStats={inspectingPlayerStats.finalStats}
                            statBreakdown={inspectingPlayerStats.statBreakdown}
                            equippedItems={inspectingPlayerStats.equippedItems as Record<string, Item | null>}
                            hideExtraButtons={true} // 👈 ซ่อนปุ่มเฉพาะตอนส่องผู้เล่นอื่น
                            hideBreakdown={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};