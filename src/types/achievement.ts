

export type AchievementCategory = 'combat' | 'challenge' | 'collection' | 'starter';

export interface AchievementTemplate {
    id: string;              // รหัสความสำเร็จ เช่น 'BOSS_KILL_RARE_ONLY'
    title: string;          // ชื่อ achievement
    description: string;    // คำอธิบายเงื่อนไข
    category: AchievementCategory;
    reward: {
        type: 'stat' | 'material' | 'item' | 'equipment' | 'rarity';
        amount?: number;
        itemId?: string;
        rarity?: string;      // 🟢 เพิ่มตรงนี้ เพื่อรองรับการระบุความหายาก
        itemLevel?: number;   // 🟢 เพิ่มตรงนี้ เพื่อรองรับการระบุเลเวลไอเทม (ถ้าต้องการใช้)
    }[];
}

export interface AchievementProgress extends AchievementTemplate {
    isUnlocked: boolean;
    isClaimed?: boolean;    // <--- เพิ่มบรรทัดนี้ เพื่อเช็กสถานะการกดรับรางวัล
    progress?: number;      // สำหรับเควสต์สะสม (ถ้ามี)
    maxProgress?: number;
    rewardTitle?: string;   // <--- เพิ่มบรรทัดนี้ เพื่อรับฉายาที่จะได้รับ
    rewardFrame?: string;   // <--- เพิ่มบรรทัดนี้ เพื่อรับเฟรมที่จะได้รับ
}