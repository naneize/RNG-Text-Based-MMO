import { create } from 'zustand';
import {
    doc,
    setDoc,
    collection,
    query,
    orderBy,
    limit,
    getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Stats } from '../types/game';

// ครบทุก stat ที่มีใน Stats interface (15 ตัวหลัก ไม่รวม skillPower ที่เป็น optional)
export const LEADERBOARD_STATS: (keyof Stats)[] = [
    'str', 'agi', 'vit', 'int', 'dex', 'luk',
    'critRate', 'critDmg', 'atk', 'def', 'maxHp',
    'hit', 'flee', 'res', 'mRes',
];

export interface LeaderboardEntry {
    uid: string;
    username: string;
    stats: Stats;
    updatedAt: string;
}

interface LeaderboardState {
    boards: Partial<Record<keyof Stats, LeaderboardEntry[]>>;
    isLoading: boolean;
    updateMyEntry: (uid: string, username: string, stats: Stats) => Promise<void>;
    fetchBoard: (statKey: keyof Stats) => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
    boards: {},
    isLoading: false,

    updateMyEntry: async (uid, username, stats) => {
        try {
            const entryRef = doc(db, 'leaderboard', uid);
            await setDoc(entryRef, {
                uid,
                username,
                stats,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
        } catch (err) {
            console.error('Error updating leaderboard entry:', err);
        }
    },

    fetchBoard: async (statKey) => {
        set({ isLoading: true });
        try {
            const q = query(
                collection(db, 'leaderboard'),
                orderBy(`stats.${statKey}`, 'desc'),
                limit(10)
            );
            const snapshot = await getDocs(q);
            const entries: LeaderboardEntry[] = snapshot.docs.map((d) => d.data() as LeaderboardEntry);

            set((state) => ({
                boards: { ...state.boards, [statKey]: entries },
                isLoading: false,
            }));
        } catch (err) {
            console.error(`Error fetching leaderboard for ${statKey}:`, err);
            set({ isLoading: false });
        }
    },
}));