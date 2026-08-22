import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const GlobalAnnouncement = () => {
    const [latestAnnouncement, setLatestAnnouncement] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // ดึงประกาศล่าสุดจาก Firestore แบบ Realtime
        const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'), limit(1));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();

                // ป้องกันไม่ให้ข้อความเก่าเด้งขึ้นมาตอนเพิ่งโหลดหน้าเว็บ (เช็คว่าไม่เกิน 10 วินาที)
                if (Date.now() - data.timestamp < 10000) {
                    setLatestAnnouncement(data);
                    setIsVisible(true);

                    // ซ่อนกล่องข้อความอัตโนมัติหลังผ่านไป 15 วินาที
                    const timer = setTimeout(() => {
                        setIsVisible(false);
                    }, 15000);

                    return () => clearTimeout(timer);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    if (!isVisible || !latestAnnouncement) return null;

    return (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-stone-950/95 border-2 border-amber-400/80 text-white px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.25)] backdrop-blur-md transition-all duration-300 max-w-2xl w-full">
            {/* จัดทุกอย่างให้อยู่ในบรรทัดเดียวด้วย Flex */}
            <div className="flex items-center justify-center gap-3">
                <span className="shrink-0 text-amber-400 font-extrabold uppercase tracking-widest text-xs bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 shadow-sm">
                    📢 ANNOUNCEMENT
                </span>
                <p className="text-sm font-medium text-white tracking-wide truncate">
                    {latestAnnouncement.message}
                </p>
            </div>
        </div>
    );
};