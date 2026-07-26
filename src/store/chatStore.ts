import { create } from 'zustand';
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp,
    type Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from './authStore';

export interface ChatMessage {
    id: string;
    uid: string;
    username: string;
    text: string;
    createdAt: Timestamp | null;
}

interface ChatState {
    messages: ChatMessage[];
    sendMessage: (text: string) => Promise<void>;
    subscribeToChat: () => () => void; // คืนค่าฟังก์ชันสำหรับ unsubscribe เมื่อปิดแชท
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],

    // 📤 ฟังก์ชันส่งข้อความ
    sendMessage: async (text: string) => {
        if (!text.trim()) return;

        const authState = useAuthStore.getState();
        const user = authState.user;
        const userProfile = authState.userProfile;

        if (!user || !userProfile) {
            console.error("User not authenticated or profile not found");
            return;
        }

        try {
            await addDoc(collection(db, 'chats'), {
                uid: user.uid,
                username: userProfile.username,
                text: text.trim(),
                createdAt: serverTimestamp() // เวลามาตรฐานจากเซิร์ฟเวอร์ Firebase
            });
        } catch (err) {
            console.error("Error sending message:", err);
        }
    },

    // 📥 ฟังก์ชันดึงข้อความแบบ Real-time (ฟังการเปลี่ยนแปลง)
    subscribeToChat: () => {
        const q = query(
            collection(db, 'chats'),
            orderBy('createdAt', 'asc'), // เรียงจากเก่าไปใหม่
            limit(50) // ดึงมาแสดง 50 ข้อความล่าสุดเพื่อประหยัดโควต้า
        );

        // onSnapshot จะทำงานอัตโนมัติทุกครั้งที่มีข้อความใหม่ถูกส่งเข้ามา
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: ChatMessage[] = [];
            snapshot.forEach((doc) => {
                msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
            });
            set({ messages: msgs });
        }, (error) => {
            console.error("Error listening to chat:", error);
        });

        return unsubscribe; // ส่งค่านี้ออกไปเพื่อใช้ cleanup ตอนปิดคอมпонент
    }
}));