import { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import type { ChatMessage } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { formatMessageTime } from '../utils/dateFormatter';
import { ItemDetailModal } from './Modals/ItemDetailModal';
import { CharacterStats } from './character/CharacterStats';
import type { Item } from '../types/game';

interface WorldChatProps {
    onClose?: () => void;
    onShareStats?: () => void;
}

// ชุดอีโมจิสั้นๆ สำหรับ react
const REACTION_EMOJIS = ['👍', '🔥', '❤️', '😂', '👑', '💯'];

export const WorldChat = ({ onClose, onShareStats }: WorldChatProps) => {
    const { messages, sendMessage, deleteMessage, clearChat, toggleReaction, onlineUsers, subscribeToOnlineUsers } = useChatStore();
    const { userProfile } = useAuthStore();

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
                return 'text-amber-400 border-amber-600 bg-amber-950/60 font-semibold';
            case 'epic':
                return 'text-purple-300 border-purple-600 bg-purple-950/60 font-semibold';
            case 'rare':
                return 'text-blue-400 border-blue-600 bg-blue-950/60 font-semibold';
            default:
                return 'text-amber-200/80 border-amber-950 bg-stone-900';
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
        <div className="relative flex flex-col h-[500px] w-full max-w-2xl bg-stone-950 border border-amber-900/80 rounded-2xl overflow-hidden shadow-2xl shadow-amber-950/40 text-amber-100">
            {/* Header */}
            <div className="bg-stone-900 px-4 py-3.5 border-b border-amber-950/80 flex justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-amber-400 font-extrabold text-sm tracking-wider uppercase flex items-center gap-2 drop-shadow">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        WORLD CHAT
                        <span className="text-[11px] bg-amber-950/60 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-semibold">
                            Online : {onlineUsers.length}
                        </span>
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => clearChat()}
                        className="px-3 h-7 bg-stone-900 hover:bg-amber-950 border border-amber-950 text-amber-400/80 hover:text-amber-300 rounded-xl flex items-center justify-center text-xs font-semibold transition cursor-pointer"
                    >
                        Clear Chat
                    </button>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="w-7 h-7 bg-stone-900 hover:bg-amber-950 border border-amber-950 text-amber-400/80 hover:text-amber-300 rounded-xl flex items-center justify-center text-sm font-bold transition cursor-pointer"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-amber-500/60 text-sm">
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
                                <div className={`flex items-start gap-3 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className="relative w-11 h-11 shrink-0 flex items-center justify-center cursor-pointer">
                                        <img src={msg.avatar || '/default-avatar.png'} alt={msg.username} className="w-9 h-9 rounded-full object-cover border border-amber-900/50" />
                                        {msg.frame && <img src={msg.frame} alt="frame" className="absolute inset-0 w-full h-full pointer-events-none scale-150" />}
                                    </div>

                                    {/* ส่วนของชื่อและข้อความ */}
                                    <div className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                                        {/* ชื่อและเวลา */}
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            {msg.role === 'developer' ? (
                                                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] px-1.5 py-0.5 rounded font-mono font-bold">DEV</span>
                                            ) : (
                                                <span className="text-xs font-bold text-amber-300 hover:underline cursor-pointer">{msg.username}</span>
                                            )}
                                            <span className="text-[10px] text-amber-500/60">{formatMessageTime(msg.createdAt)}</span>
                                        </div>

                                        {/* กล่องข้อความ */}
                                        <div className={`flex items-center gap-2 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {isMyMessage && (
                                                <button onClick={() => deleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-500/60 hover:text-amber-400 text-xs p-1 cursor-pointer">🗑️</button>
                                            )}

                                            <div className={`px-3.5 py-2.5 rounded-2xl text-sm break-words flex flex-col gap-1.5 shadow-md ${isMyMessage
                                                ? 'bg-amber-950/60 text-amber-100 rounded-br-none border border-amber-700/60'
                                                : 'bg-stone-900 text-amber-200 rounded-bl-none border border-amber-950'
                                                }`}>
                                                {msg.text && <span>{msg.text}</span>}
                                                {msg.item && (
                                                    <button onClick={() => setInspectingItem(msg.item!)} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${getRarityColor(msg.item.rarity)}`}>
                                                        <img
                                                            src={msg.item.icon || '/default-item-icon.png'}
                                                            alt={msg.item.name}
                                                            className="w-5 h-5 object-contain"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/default-item-icon.png';
                                                            }}
                                                        />
                                                        <span>[{msg.item.name}]</span>
                                                        <span className="text-[10px] underline opacity-80 font-normal">Click to view</span>
                                                    </button>
                                                )}
                                                {msg.playerStats && (
                                                    <button onClick={() => setInspectingPlayerStats(msg.playerStats!)} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold bg-stone-950 border-amber-700/60 text-amber-300 hover:bg-amber-950/40 transition cursor-pointer">
                                                        <div className="flex flex-col text-left">
                                                            <span>Inspect {msg.playerStats.username}'s Stats</span>
                                                            <span className="text-[10px] text-amber-500/70">Click to view stats</span>
                                                        </div>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Reactions Component */}
                                        <div className={`relative flex items-center gap-1.5 mt-1.5 flex-wrap ${isMyMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {reactionSummary.map(([emoji, count]) => {
                                                const hasReactedThis = myReaction === emoji;
                                                return (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => userProfile && toggleReaction(msg.id, emoji)}
                                                        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs border transition cursor-pointer ${hasReactedThis
                                                            ? 'bg-amber-900/60 border-amber-500 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                                                            : 'bg-stone-900 border-amber-950 text-amber-300/80 hover:bg-amber-950/50'
                                                            }`}
                                                    >
                                                        <span>{emoji}</span>
                                                        <span className="text-[10px] font-bold">{count}</span>
                                                    </button>
                                                );
                                            })}

                                            {/* ปุ่มเปิดตัวเลือก Reaction (+) */}
                                            {userProfile && (
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setOpenReactionPickerFor(openReactionPickerFor === msg.id ? null : msg.id)}
                                                        className="w-6 h-6 bg-stone-900 hover:bg-amber-950 border border-amber-950 text-amber-400/80 hover:text-amber-300 rounded-full flex items-center justify-center text-xs transition cursor-pointer"
                                                        title="React"
                                                    >
                                                        😀
                                                    </button>

                                                    {/* Popup เลือกอีโมจิสำหรับกด Reaction */}
                                                    {openReactionPickerFor === msg.id && (
                                                        <div
                                                            ref={reactionPickerRef}
                                                            className={`absolute bottom-full mb-1 bg-stone-900 border border-amber-900/80 p-2 rounded-xl shadow-2xl flex gap-1 z-30 ${isMyMessage ? 'right-0' : 'left-0'
                                                                }`}
                                                        >
                                                            {REACTION_EMOJIS.map((emoji) => (
                                                                <button
                                                                    key={emoji}
                                                                    onClick={() => {
                                                                        toggleReaction(msg.id, emoji);
                                                                        setOpenReactionPickerFor(null);
                                                                    }}
                                                                    className="w-7 h-7 flex items-center justify-center hover:bg-amber-950 rounded-lg text-sm transition cursor-pointer"
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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
            <div className="relative p-3.5 bg-stone-900 border-t border-amber-950/80 flex flex-col gap-2">
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
                        className="bg-stone-950 hover:bg-amber-950 border border-amber-700/60 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                        <span>📊</span> Share My Stats
                    </button>
                </div>

                {showEmojiPicker && (
                    <div
                        ref={emojiPickerRef}
                        className="absolute bottom-full left-3 mb-2 bg-stone-900 border border-amber-900/80 p-2.5 rounded-2xl shadow-2xl grid grid-cols-8 gap-1.5 z-20"
                    >
                        {FREE_EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => addEmoji(emoji)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-amber-950 rounded-xl text-lg transition cursor-pointer"
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
                        className="bg-stone-950 hover:bg-amber-950 border border-amber-950 text-amber-400 px-3 py-2 rounded-xl text-sm transition cursor-pointer flex items-center justify-center"
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
                        className="flex-1 bg-stone-950 border border-amber-950 rounded-xl px-3.5 py-2 text-sm text-amber-100 placeholder-amber-500/50 focus:outline-none focus:border-amber-600 shadow-inner"
                    />

                    <button
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-500 text-stone-950 px-4 py-2 rounded-xl text-sm font-extrabold transition cursor-pointer shadow-lg"
                    >
                        Send
                    </button>
                </form>
            </div>

            {/* Modal หน้าต่างดูไอเทม */}
            {inspectingItem && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
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
                    <div className="bg-stone-950 border border-amber-900/80 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-amber-100">
                        <div className="flex justify-between items-center mb-4 border-b border-amber-950 pb-3">
                            <h3 className="text-amber-400 font-extrabold text-lg flex items-center gap-3">
                                <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                                    <img
                                        src={inspectingPlayerStats.avatar || '/default-avatar.png'}
                                        alt={inspectingPlayerStats.username}
                                        className="w-8 h-8 rounded-full object-cover border border-amber-900/50"
                                    />
                                    {inspectingPlayerStats.frame && (
                                        <img
                                            src={inspectingPlayerStats.frame}
                                            alt="frame"
                                            className="absolute inset-0 w-full h-full pointer-events-none scale-125"
                                        />
                                    )}
                                </div>
                                <span>Inspecting : <span className="text-amber-300">{inspectingPlayerStats.username}</span></span>
                            </h3>
                            <button
                                onClick={() => setInspectingPlayerStats(null)}
                                className="w-8 h-8 bg-stone-900 hover:bg-amber-950 border border-amber-950 text-amber-400/80 hover:text-amber-300 rounded-xl flex items-center justify-center font-bold transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <CharacterStats
                            finalStats={inspectingPlayerStats.finalStats}
                            statBreakdown={inspectingPlayerStats.statBreakdown}
                            equippedItems={inspectingPlayerStats.equippedItems as Record<string, Item | null>}
                            hideExtraButtons={true}
                            hideBreakdown={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};