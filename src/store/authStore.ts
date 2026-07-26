import { create } from 'zustand';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    type User,
} from 'firebase/auth';
import {
    collection,
    doc,
    getDoc,
    setDoc,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase';

interface UserProfile {
    uid: string;
    email: string | null;
    username: string;
}

interface AuthState {
    user: User | null;
    userProfile: UserProfile | null;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;

    checkUsernameExists: (username: string) => Promise<boolean>;
    saveUsername: (username: string) => Promise<boolean>;
    fetchUserProfile: (uid: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    userProfile: null,
    isLoading: true,
    error: null,

    login: async (email, password) => {
        set({ error: null });
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await get().fetchUserProfile(userCredential.user.uid);
        } catch (err: any) {
            set({ error: mapFirebaseError(err.code) });
        }
    },

    register: async (email, password) => {
        set({ error: null });
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            set({ userProfile: null }); // สมัครใหม่ยังไม่มีชื่อ ต้องไปหน้าตั้งชื่อ
        } catch (err: any) {
            set({ error: mapFirebaseError(err.code) });
        }
    },

    loginWithGoogle: async () => {
        set({ error: null });
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            await get().fetchUserProfile(userCredential.user.uid);
        } catch (err: any) {
            set({ error: mapFirebaseError(err.code) });
        }
    },

    logout: async () => {
        await signOut(auth);
        set({ user: null, userProfile: null });
    },

    clearError: () => set({ error: null }),

    // 🔍 ฟังก์ชันเช็คว่าชื่อซ้ำไหม (Return true ถ้ามีคนใช้แล้ว)
    checkUsernameExists: async (username: string): Promise<boolean> => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (err) {
            console.error("Error checking username:", err);
            return false;
        }
    },

    // 👤 ฟังก์ชันดึงข้อมูลโปรไฟล์จาก Firestore
    fetchUserProfile: async (uid: string) => {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                set({ userProfile: userSnap.data() as UserProfile });
            } else {
                set({ userProfile: null });
            }
        } catch (err) {
            console.error("Error fetching user profile:", err);
            set({ userProfile: null });
        }
    },

    // 💾 ฟังก์ชันบันทึกชื่อลง Firestore โดยใช้ UID เป็น Document ID
    saveUsername: async (username: string): Promise<boolean> => {
        const currentUser = get().user;
        if (!currentUser) return false;

        set({ error: null });
        try {
            const isExists = await get().checkUsernameExists(username);
            if (isExists) {
                set({ error: 'This username is already taken.' });
                return false;
            }

            const userRef = doc(db, 'users', currentUser.uid);
            const profileData: UserProfile = {
                uid: currentUser.uid,
                email: currentUser.email,
                username: username,
            };

            await setDoc(userRef, {
                ...profileData,
                createdAt: new Date().toISOString()
            }, { merge: true });

            // อัปเดต state โปรไฟล์ในเครื่องทันที
            set({ userProfile: profileData });
            return true;
        } catch (err: any) {
            set({ error: 'Failed to save username. Please try again.' });
            return false;
        }
    }
}));

// แปล error code ของ Firebase ให้อ่านง่ายขึ้น (ภาษาอังกฤษ)
function mapFirebaseError(code: string): string {
    switch (code) {
        case 'auth/invalid-email':
            return 'Invalid email address.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password.';
        case 'auth/email-already-in-use':
            return 'This email is already in use.';
        case 'auth/weak-password':
            return 'Password is too weak (at least 6 characters).';
        case 'auth/popup-closed-by-user':
            return 'Google Sign-In popup was closed before completion.';
        default:
            return 'An error occurred. Please try again.';
    }
}

// ผูก listener เช็ค session ค้าง — เรียกครั้งเดียวตอนแอปเริ่มทำงาน (ใน main.tsx)
export const initAuthListener = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const userSnap = await getDoc(userRef);

            useAuthStore.setState({
                user: firebaseUser,
                userProfile: userSnap.exists() ? (userSnap.data() as UserProfile) : null,
                isLoading: false
            });
        } else {
            useAuthStore.setState({ user: null, userProfile: null, isLoading: false });
        }
    });
};