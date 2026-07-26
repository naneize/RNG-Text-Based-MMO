export type AchievementCategory = 'combat' | 'challenge' | 'collection';

export interface AchievementTemplate {
    id: string;             // รหัสความสำเร็จ เช่น 'BOSS_KILL_RARE_ONLY'
    title: string;          // ชื่อ achievement
    description: string;    // คำอธิบายเงื่อนไข
    category: AchievementCategory;
    reward: {
        type: 'stat' | 'material' | 'item';
        amount: number;
        itemId?: string;
    }[]; // 🟢 เติม [] เข้าไปเพื่อให้เป็น Array รับรางวัลได้หลายชิ้น
}

export interface AchievementProgress extends AchievementTemplate {
    isUnlocked: boolean;
    isClaimed?: boolean;    // <--- เพิ่มบรรทัดนี้ เพื่อเช็กสถานะการกดรับรางวัล
    progress?: number;      // สำหรับเควสต์สะสม (ถ้ามี)
    maxProgress?: number;
}