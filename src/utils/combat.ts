import type { Player, Stats } from '../types/game';
import { calculateSynergyStats } from './synergy';
import type { Boss } from '../types/game';
import { finalizeStats } from './statCalculator';

export interface StatSource {
    label: string;
    value: number;
}

export const getTotalStatsWithBreakdown = (player: Player): { finalStats: Stats; breakdown: Record<string, StatSource[]> } => {
    const breakdown: Record<string, StatSource[]> = {};

    const addSource = (statKey: string, label: string, value: number) => {
        if (!value) return;
        if (!breakdown[statKey]) breakdown[statKey] = [];
        const existing = breakdown[statKey].find(s => s.label === label);
        if (existing) {
            existing.value += value;
        } else {
            breakdown[statKey].push({ label, value });
        }
    };

    // 0. ตั้งต้นด้วย Base Stats
    const rawTotal: Stats = { ...player.baseStats };
    Object.entries(player.baseStats).forEach(([key, val]) => {
        addSource(key, 'Base Stats', val as number);
    });

    // 1. รวมค่าจากไอเทมสวมใส่
    Object.entries(player.equippedItems).forEach(([slot, item]) => {
        if (item && item.stats) {
            (Object.keys(item.stats) as Array<keyof Stats>).forEach((statKey) => {
                const itemVal = item.stats![statKey] || 0;
                rawTotal[statKey] = (rawTotal[statKey] || 0) + itemVal;
                addSource(statKey, `${item.name} (${slot})`, itemVal);
            });
        }
    });

    // 2. คำนวณ Synergy
    const equippedSkill = player.equippedItems['skill'] || undefined;
    const synergyStats = calculateSynergyStats(rawTotal, equippedSkill);

    // ดึงค่า LUK ทั้งหมดมารวมคำนวณ Synergy Breakdown (Crit Rate, Crit Dmg, Hit, Flee จาก LUK)
    const totalLuk = synergyStats.luk || rawTotal.luk || 0;
    if (totalLuk > 0) {
        const critRateBonus = Math.floor(totalLuk / 20) * 1;
        if (critRateBonus > 0) addSource('critRate', 'LUK -> CRIT RATE', critRateBonus);

        const critDmgBonus = Math.floor(totalLuk / 20) * 1;
        if (critDmgBonus > 0) addSource('critDmg', 'LUK -> CRIT DMG', critDmgBonus);
    }

    Object.keys(synergyStats).forEach(key => {
        const statKey = key as keyof Stats;
        const baseVal = rawTotal[statKey] || 0;
        const synVal = synergyStats[statKey] || 0;
        const diff = synVal - baseVal;

        // 📌 เพิ่มเงื่อนไขยกเว้น skillPower ไม่ให้เอา Synergy Bonus มาบวกซ้ำซ้อนกับ Effect Power ของสกิล
        if (
            diff > 0 &&
            statKey !== 'critRate' &&
            statKey !== 'critDmg' &&
            statKey !== 'hit' &&
            statKey !== 'flee' &&
            statKey !== 'skillPower' // <--- เพิ่มตรงนี้เพื่อกันเบิ้ล
        ) {
            addSource(statKey, 'Synergy Bonus', diff);
        }
    });

    if (equippedSkill && equippedSkill.effectPower) {
        addSource('skillPower', `${equippedSkill.name} (Skill)`, equippedSkill.effectPower);
    }

    // 3. คำนวณค่า Effective
    const effective = getEffectiveStats(synergyStats);

    const statConversions: { [key in keyof Stats]?: { from: keyof Stats; mult: number; label: string }[] } = {
        atk: [
            { from: 'str', mult: STAT_MULTIPLIERS.strToAtk, label: 'STR -> ATK' },
            { from: 'dex', mult: STAT_MULTIPLIERS.dexToAtk, label: 'DEX -> ATK' } // 🟢 เพิ่ม DEX -> ATK เข้ามาให้ครบตาม getEffectiveStats
        ],
        def: [{ from: 'vit', mult: STAT_MULTIPLIERS.vitToDef, label: 'VIT -> DEF' }],
        maxHp: [{ from: 'vit', mult: STAT_MULTIPLIERS.vitToHp, label: 'VIT -> HP' }],
        hit: [
            { from: 'dex', mult: STAT_MULTIPLIERS.dexToHit, label: 'DEX -> HIT' },
            { from: 'luk', mult: STAT_MULTIPLIERS.lukToHit, label: 'LUK -> HIT' } // 🟢 ตรวจสอบว่ามี LUK -> HIT ครบถ้วนไหม
        ],
        flee: [
            { from: 'agi', mult: STAT_MULTIPLIERS.agiToFlee, label: 'AGI -> FLEE' },
            { from: 'luk', mult: STAT_MULTIPLIERS.lukToFlee, label: 'LUK -> FLEE' }
        ],
        res: [{ from: 'int', mult: STAT_MULTIPLIERS.intToRes, label: 'INT -> RES' }],
        mRes: [{ from: 'vit', mult: STAT_MULTIPLIERS.vitToMRes, label: 'VIT -> M.RES' }],
        skillPower: [{ from: 'int', mult: STAT_MULTIPLIERS.intToSkillPwr, label: 'INT -> Skill Pwr' }]
    };

    // เวลาวนลูปเรียกใช้ ให้รองรับแบบ Array หลายตัวต่อ 1 Stat Key
    Object.entries(statConversions).forEach(([targetKey, conversions]) => {
        if (!conversions) return;
        conversions.forEach(conf => {
            const statVal = synergyStats[conf.from] || 0;
            const convertedVal = Math.floor(statVal * conf.mult);
            if (convertedVal > 0) {
                addSource(targetKey, conf.label, convertedVal);
            }
        });
    });

    // 4. ทำ Cap และแปลงค่าสุดท้าย
    const finalStats = finalizeStats(effective);

    if (finalStats.critRate <= 0) delete breakdown['critRate'];
    if (finalStats.critDmg <= 0) delete breakdown['critDmg'];
    if (finalStats.hit <= 0) delete breakdown['hit'];
    if (finalStats.flee <= 0) delete breakdown['flee'];

    return { finalStats, breakdown };
};

export const getTotalStats = (player: Player): Stats => {
    const rawTotal: Stats = { ...player.baseStats };

    // 1. รวมค่าจากไอเทม
    Object.entries(player.equippedItems).forEach(([slot, item]) => {
        if (item && item.stats) {
            (Object.keys(item.stats) as Array<keyof Stats>).forEach((statKey) => {
                const itemVal = item.stats![statKey] || 0;
                rawTotal[statKey] = (rawTotal[statKey] || 0) + itemVal;
            });
        }
    });

    // 2. คำนวณ Synergy
    const equippedSkill = player.equippedItems['skill'] || undefined;
    const synergyStats = calculateSynergyStats(rawTotal, equippedSkill);

    // 3. คำนวณค่า Effective จาก Stat หลัก (STR, DEX, VIT, AGI, INT, LUK) ก่อน
    const effective = getEffectiveStats(synergyStats);

    // 4. ค่อยทำ Cap และแปลง Flee ล้น -> RES เป็นขั้นตอนสุดท้าย
    const finalStats = finalizeStats(effective);



    return finalStats;
};


const STAT_MULTIPLIERS = {
    strToAtk: 0.5,
    dexToAtk: 0.2,
    vitToDef: 0.5,
    vitToHp: 5,
    dexToHit: 0.5,
    lukToHit: 0.2,
    agiToFlee: 0.5,
    lukToFlee: 0.2,
    intToRes: 0.5,
    vitToMRes: 0.4,
    intToSkillPwr: 0.5,
};



export const getEffectiveStats = (stats: Stats): Stats => {
    const str = stats.str || 0;
    const dex = stats.dex || 0;
    const vit = stats.vit || 0;
    const agi = stats.agi || 0;
    const int = stats.int || 0;
    const luk = stats.luk || 0;

    return {
        ...stats,
        atk: Math.floor((stats.atk || 0) + (str * STAT_MULTIPLIERS.strToAtk) + (dex * STAT_MULTIPLIERS.dexToAtk)),
        def: Math.floor((stats.def || 0) + (vit * STAT_MULTIPLIERS.vitToDef)),
        maxHp: Math.floor((stats.maxHp || 0) + (vit * STAT_MULTIPLIERS.vitToHp)),
        hit: Math.floor((stats.hit || 0) + (dex * STAT_MULTIPLIERS.dexToHit) + (luk * STAT_MULTIPLIERS.lukToHit)),
        flee: Math.floor((stats.flee || 0) + (agi * STAT_MULTIPLIERS.agiToFlee) + (luk * STAT_MULTIPLIERS.lukToFlee)),
        res: Math.floor((stats.res || 0) + (int * STAT_MULTIPLIERS.intToRes)),
        mRes: Math.floor((stats.mRes || 0) + (vit * STAT_MULTIPLIERS.vitToMRes)),
        critRate: stats.critRate || 0,
        critDmg: stats.critDmg || 0,
        skillPower: Math.floor((stats.skillPower || 0) + (int * STAT_MULTIPLIERS.intToSkillPwr))
    };
};

export const getEquippedBonus = (equippedItems: any[], boss: Boss) => {
    let raceBonus = 0;
    let elementBonus = 0;

    equippedItems.forEach((item: any) => {
        if (item.elementBonus?.type === boss.element) {
            elementBonus += item.elementBonus.value;
        }
        if (item.raceBonus?.type === boss.race) {
            raceBonus += item.raceBonus.value;
        }
    });

    return { racePercent: raceBonus, elementPercent: elementBonus };
};

export const getEffectiveStatsInfo = () => [
    { label: 'ATK', bonus: `+${STAT_MULTIPLIERS.strToAtk} ATK`, stat: 'STR' },
    { label: 'ATK', bonus: `+${STAT_MULTIPLIERS.dexToAtk} ATK`, stat: 'DEX' },
    { label: 'DEF', bonus: `+${STAT_MULTIPLIERS.vitToDef} DEF`, stat: 'VIT' },
    { label: 'HP', bonus: `+${STAT_MULTIPLIERS.vitToHp} HP`, stat: 'VIT' },
    { label: 'HIT', bonus: `+${STAT_MULTIPLIERS.dexToHit} HIT`, stat: 'DEX' },
    { label: 'HIT', bonus: `+${STAT_MULTIPLIERS.lukToHit} HIT`, stat: 'LUK' },
    { label: 'FLEE', bonus: `+${STAT_MULTIPLIERS.agiToFlee} FLEE`, stat: 'AGI' },
    { label: 'FLEE', bonus: `+${STAT_MULTIPLIERS.lukToFlee} FLEE`, stat: 'LUK' },
    { label: 'RES', bonus: `+${STAT_MULTIPLIERS.intToRes} RES   (Mitigation Max 75%)`, stat: 'INT' },
    { label: 'M.RES', bonus: `+${STAT_MULTIPLIERS.vitToMRes} M.RES   (Crit Res Max 40%)`, stat: 'VIT' },
    { label: 'SKILL PWR', bonus: `+${STAT_MULTIPLIERS.intToSkillPwr} PWR`, stat: 'INT' },
];


export const calculateDamage = (
    attacker: Stats,
    defender: Stats,
    bonusDamage: {
        flatBonus?: number;
        elementPercent?: number;
        racePercent?: number;
        weaponWeaknessPercent?: number;
    } = {},
    isMagic: boolean = false,
    skill?: {
        effectChance: number;
        effectPower: number;
        name?: string;
        skillCondition?: {
            elementBonusAgainst?: 'Fire' | 'Water' | 'Earth' | 'Wind' | 'Dark' | 'Holy' | 'Neutral';
            elementBonusPercent?: number;
            raceBonusAgainst?: 'DemiHuman' | 'Plant' | 'Brute' | 'Undead' | 'Demon' | 'Angel' | 'Dragon';
            raceBonusPercent?: number;
            scalingStat?: keyof Stats;
            scalingMultiplier?: number;
            damageType?: 'physical' | 'magic';
            requiresLowHp?: boolean;
            hpThreshold?: number;
        };
    },
    attackerCurrentHp?: number,
    attackerMaxHp?: number,
    defenderElement?: 'Fire' | 'Water' | 'Earth' | 'Wind' | 'Dark' | 'Holy' | 'Neutral',
    defenderRace?: 'DemiHuman' | 'Plant' | 'Brute' | 'Undead' | 'Demon' | 'Angel' | 'Dragon'
) => {
    const flatBonus = bonusDamage.flatBonus || 0;
    const elementPercent = bonusDamage.elementPercent || 0;
    const racePercent = bonusDamage.racePercent || 0;
    const weaponWeaknessPercent = bonusDamage.weaponWeaknessPercent || 0;

    // 2. คำนวณ Hit/Miss
    let hitChance = 80 + (attacker.hit - defender.flee);
    hitChance = Math.max(5, Math.min(95, hitChance));

    if (Math.random() * 100 > hitChance) {
        return { damage: 0, isMiss: true, isCrit: false, isSkillActive: false };
    }

    // --- 3. คำนวณการทำงานของสกิลก่อน เพื่อเช็คว่าสกิลติดหรือไม่ ---
    let isSkillActive = false;
    let skillDamageBonus = 0;

    if (skill && Math.random() * 100 < skill.effectChance) {
        isSkillActive = true;
    }

    // 📌 แก้ไขจุดนี้: ถ้าสกิลติด ค่อยยึด damageType ตามสกิล ถ้าสกิลไม่ติด ให้ใช้ตามปกติ (isMagic หรือ physical)
    const activeDamageType = isSkillActive
        ? (skill?.skillCondition?.damageType || (isMagic ? 'magic' : 'physical'))
        : (isMagic ? 'magic' : 'physical');

    // 📌 ฐานดาเมจจะสลับเป็น skillPower เฉพาะตอนที่สกิลเวททำงานจริงเท่านั้น!
    const rawBase = activeDamageType === 'magic' ? attacker.skillPower : attacker.atk;

    if (isSkillActive) {
        const baseForSkill = rawBase;
        skillDamageBonus = baseForSkill * (skill.effectPower / 100);

        if (skill.skillCondition?.scalingStat && skill.skillCondition?.scalingMultiplier) {
            const scalingValue = attacker[skill.skillCondition.scalingStat] || 0;
            skillDamageBonus += scalingValue * skill.skillCondition.scalingMultiplier;
        }

        if (skill.skillCondition?.requiresLowHp && attackerCurrentHp !== undefined && attackerMaxHp !== undefined) {
            const hpPercent = (attackerCurrentHp / attackerMaxHp) * 100;
            if (hpPercent < (skill.skillCondition.hpThreshold || 50)) {
                skillDamageBonus *= 1.25;
            }
        }
    }

    // --- คำนวณโบนัสธาตุและเผ่าจากสกิลเฉพาะตอนที่สกิลติด ---
    let skillElementBonus = 0;
    let skillRaceBonus = 0;

    if (skill?.skillCondition && isSkillActive) {
        const cond = skill.skillCondition;
        if (cond.elementBonusAgainst && defenderElement === cond.elementBonusAgainst) {
            skillElementBonus = (cond.elementBonusPercent || 0) / 100;
        }
        if (cond.raceBonusAgainst && defenderRace === cond.raceBonusAgainst) {
            skillRaceBonus = (cond.raceBonusPercent || 0) / 100;
        }
    }

    // --- คำนวณดาเมจตั้งต้นรวมโบนัสทั้งหมด ---
    const totalMultiplier = 1 + elementPercent + racePercent + weaponWeaknessPercent + skillElementBonus + skillRaceBonus;
    let baseDamage = (rawBase + flatBonus + skillDamageBonus) * totalMultiplier;

    // --- 4. คำนวณ Critical ล่วงหน้าก่อนหักเกราะ (ช่วยให้ดาเมจเสถียร ไม่แกว่งหลุดโลก) ---
    const isCrit = Math.random() * 100 < attacker.critRate;
    if (isCrit) {
        let critMultiplier = (1.5 + (attacker.critDmg / 200));
        const critResistance = Math.min(defender.mRes / 5000, 0.4);
        critMultiplier -= critResistance;
        baseDamage *= critMultiplier;
    }

    // --- 5. สุ่มความแกว่ง (Variance) ช่วงนี้ ---
    const variance = 0.9 + Math.random() * 0.2;
    baseDamage *= variance;

    // --- 6. นำดาเมจทั้งหมดมาหักลบเกราะ (DEF / RES) เป็นด่านสุดท้าย ---
    const mitigation = activeDamageType === 'magic' ? defender.mRes : defender.def;
    const damageReductionFactor = 100 / (100 + mitigation);
    let damage = baseDamage * damageReductionFactor;

    const resReduction = Math.min(defender.res / 1000, 0.75);
    damage *= (1 - resReduction);

    const finalDamage = Math.floor(damage);

    // 7. สรุปผลลัพธ์
    return {
        damage: Math.max(1, finalDamage),
        isMiss: false,
        isCrit,
        isSkillActive
    };
};