// utils/battleLogStyles.ts
// ระบบสีของ Battle Log — ศูนย์กลางเดียว ใช้ร่วมกันทุกจุดที่ render log
// หลักการ: ลดจาก 11 สีอิสระ เหลือ 5 หมวดความหมาย (semantic) ที่ผู้เล่นจำได้:
//   ทอง   = สกิล/trait ทำงาน + คริติคอล   (identity ของเกม)
//   เขียว = ดาเมจที่เราทำ + การฮีล/ซัพพอร์ตตัวเอง
//   แดง   = เอฟเฟกต์บุกโจมตีสายรุนแรง (สะท้อน, บ้าเลือด, พนัน, ตีเบิ้ล)
//   ม่วง  = ควบคุม/ดีบัฟ (สตัน, เจาะเกราะ, บัฟคริต)
//   ครีม  = โบนัสตัวเลขเสริม (ธาตุ/เผ่า/สถานะ)

export const LOG_STYLES = {
    /** [ชื่อสกิล/trait] และข้อความ activated ... */
    skill: 'text-amber-300 font-bold drop-shadow-[0_0_6px_rgba(251,191,36,0.5)] mx-0.5',
    /** (CRIT!) และบัฟ Crit Rate */
    crit: 'text-amber-400 font-extrabold drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] mx-0.5',
    /** ตัวเลขดาเมจหลัก "...damage" */
    damage: 'text-emerald-400 font-bold',
    /** ฮีล / ซับดาเมจ / Lifesteal */
    sustain: 'text-emerald-300 font-semibold mx-0.5',
    /** เอฟเฟกต์รุนแรง: สะท้อน / สวนกลับ / บ้าเลือด / แจ็คพอต / ตีเบิ้ล */
    offense: 'text-red-400 font-bold drop-shadow-[0_0_6px_rgba(248,113,113,0.4)] mx-0.5',
    /** ควบคุม/ดีบัฟ: สตัน / เจาะเกราะ / ละเมิดเกราะ / Wind Dance */
    control: 'text-violet-300 font-bold drop-shadow-[0_0_6px_rgba(196,181,253,0.4)] mx-0.5',
    /** โบนัสธาตุ/เผ่า/สถานะพ่วง */
    bonus: 'text-amber-200/90 font-semibold mx-0.5',
} as const;

// ลำดับเช็คสำคัญ: หมวดเฉพาะเจาะจงต้องมาก่อนหมวดกว้าง (เช่น CRIT ก่อน damage)
interface LogRule {
    test: (token: string) => boolean;
    className: string;
}

const RULES: LogRule[] = [
    {
        // ทุกสกิล/trait ใช้ prefix [ชื่อ] ฟอร์แมตเดียวกันหมด
        test: (t) => t.startsWith('[') && t.endsWith(']'),
        className: LOG_STYLES.skill,
    },
    {
        test: (t) => t === '(CRIT!)' || t.includes('Crit Rate') || t.includes('critBoost'),
        className: LOG_STYLES.crit,
    },
    {
        // ฮีล/ซัพพอร์ตตัวเอง — เช็คก่อน damage เพราะมีคำว่า damage ปน
        test: (t) =>
            t.includes('Lifesteal') ||
            t.includes('Emergency Aegis') ||
            t.includes('Rejuvenated') ||
            t.includes('absorbed') ||
            t.includes('Iron guard'),
        className: LOG_STYLES.sustain,
    },
    {
        test: (t) =>
            t.includes('Thorns') ||
            t.includes('Countered') ||
            t.includes('Berserk') ||
            t.includes("Gambler's Jackpot") ||
            t.includes('Additional attack'),
        className: LOG_STYLES.offense,
    },
    {
        test: (t) =>
            t.includes('stunned') ||
            t.includes('Stun') ||
            t.includes('Pierced') ||
            t.includes('armor ignored') ||
            t.includes('Wind dance'),
        className: LOG_STYLES.control,
    },
    {
        // โบนัส stat พ่วง (LUK/AGI bonus damage, Elem+, Race+, Weakness+)
        test: (t) =>
            t.startsWith('Elem+') ||
            t.startsWith('Race+') ||
            t.startsWith('SkillElem+') ||
            t.startsWith('SkillRace+') ||
            t.includes('bonus damage from') ||
            t.includes('Weakness'),
        className: LOG_STYLES.bonus,
    },
    {
        // ตัวเลขดาเมจหลัก — เช็คท้ายสุด
        test: (t) => t.endsWith('damage') && !t.includes('bonus') && !t.includes('Thorns') && !t.includes('Countered') && !t.includes('absorbed'),
        className: LOG_STYLES.damage,
    },
];

/** คืน className ของหมวดที่ตรง หรือ null ถ้าให้ใช้สีเริ่มต้นของบรรทัด (ผู้เล่น/บอส) */
export const classifyLogToken = (token: string): string | null => {
    for (const rule of RULES) {
        if (rule.test(token)) return rule.className;
    }
    return null;
};
