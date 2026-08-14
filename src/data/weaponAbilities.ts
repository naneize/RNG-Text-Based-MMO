import type { Stats } from '../types/game';

export interface WeaponAbilityResult {
    extraDamage?: number;
    healAmount?: number;
    defReductionPercent?: number;
    log: string;
    buff?: { type: 'ignoreDef' | 'critBoost' | 'stunBoss'; name?: string; duration: number; value: number }; // ✅ เพิ่ม 2 ชนิดใหม่

}

export interface WeaponAbility {
    id: string;
    name: string;
    type: 'on_attack' | 'on_hit' | 'on_damage';
    description: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    effect: (attacker: Stats, defender: Stats, baseDamage: number) => WeaponAbilityResult;
}

// 🟢 Helper Function สำหรับสร้าง Skill เจาะเกราะ (ระบุ Types ชัดเจน ป้องกัน TS Error)
const createArmorPierceSkill = (
    id: string,
    name: string,
    rarity: WeaponAbility['rarity'],
    value: number
): WeaponAbility => ({
    id,
    name,
    type: 'on_attack',
    rarity,
    description: `15% chance to ${value === 100 ? 'fully ignore' : `pierce ${value}%`} enemy DEF/RES for 3 rounds.`,
    effect: () => {
        if (Math.random() < 0.15) {
            return {
                extraDamage: 0,
                buff: { type: 'ignoreDef', name, duration: 3, value },
                log: `, activated ${name}! ${value === 100 ? 'Enemy armor ignored' : `Pierced ${value}% armor`} for 3 rounds!`
            };
        }
        return { extraDamage: 0, log: '' };
    }
});

// 🟢 Helper Function สำหรับสร้าง Skill เพิ่ม Crit Rate ชั่วคราว (Precision)
const createCritBoostSkill = (
    id: string,
    name: string,
    rarity: WeaponAbility['rarity'],
    chancePercent: number,
    critRateBonus: number
): WeaponAbility => ({
    id,
    name,
    type: 'on_attack',
    rarity,
    description: `${chancePercent}% chance to gain +${critRateBonus}% Crit Rate for 3 rounds.`,
    effect: () => {
        if (Math.random() < chancePercent / 100) {
            return {
                extraDamage: 0,
                buff: { type: 'critBoost', name, duration: 3, value: critRateBonus },
                log: `, activated ${name}! Crit Rate +${critRateBonus}% for 3 rounds!`
            };
        }
        return { extraDamage: 0, log: '' };
    }
});

// 🟢 Helper Function สำหรับสร้าง Skill Stun บอส (ข้ามการโจมตี 1 ครั้ง)
const createStunSkill = (
    id: string,
    name: string,
    rarity: WeaponAbility['rarity'],
    chancePercent: number
): WeaponAbility => ({
    id,
    name,
    type: 'on_attack',
    rarity,
    description: `${chancePercent}% chance to stun the enemy, skipping their next attack.`,
    effect: () => {
        if (Math.random() < chancePercent / 100) {
            return {
                extraDamage: 0,
                buff: { type: 'stunBoss', name, duration: 1, value: 100 },
                log: `, activated ${name}! Enemy stunned!`
            };
        }
        return { extraDamage: 0, log: '' };
    }
});


// 🟢 Helper Function สำหรับสร้าง Skill ดูดเลือด (Vampiric)
const createVampiricSkill = (
    id: string,
    name: string,
    rarity: WeaponAbility['rarity'],
    healPercent: number
): WeaponAbility => ({
    id,
    name,
    type: 'on_attack',
    rarity,
    description: `Drains ${healPercent}% of damage dealt into HP.`,
    effect: (_attacker, _defender, baseDamage) => {
        const healAmount = Math.floor(baseDamage * (healPercent / 100));
        return {
            healAmount,
            // 🟢 ใส่ % และ +HP เด้งเข้าไปใน log ของสกิลโดยตรง
            log: `, activated ${name}! Lifesteal! (${healPercent}% , + ${healAmount} HP)`
        };
    }
});

// 🟢 Helper Function สำหรับสร้าง Skill โจมตีซ้ำ (Multi-Hit / Double Strike)
const createMultiHitSkill = (
    id: string,
    name: string,
    rarity: WeaponAbility['rarity'],
    chancePercent: number,
    extraDmgPercent: number
): WeaponAbility => ({
    id,
    name,
    type: 'on_attack',
    rarity,
    description: `${chancePercent}% chance to deal ${extraDmgPercent}% extra damage as an additional hit.`,
    effect: (_attacker, _defender, baseDamage) => {
        if (Math.random() < chancePercent / 100) {
            const extraDamage = Math.floor(baseDamage * (extraDmgPercent / 100));
            return {
                extraDamage,
                log: `, activated ${name}! Additional attack deals ${extraDmgPercent}% extra damage!`
            };
        }
        return { extraDamage: 0, log: '' };
    }
});



export const WEAPON_ABILITY_POOL: WeaponAbility[] = [


    // 🟢 กลุ่มสกิลตีเบิ้ล 4 ระดับ
    createMultiHitSkill('swift_strikes', 'Swift Strikes', 'Common', 15, 50),
    createMultiHitSkill('dual_strike', 'Dual Strike', 'Rare', 20, 65),
    createMultiHitSkill('flurry_blows', 'Flurry of Blows', 'Epic', 25, 80),
    createMultiHitSkill('fatal_tempest', 'Fatal Tempest', 'Legendary', 30, 100),


    // 🟢 กลุ่มสกิลดูดเลือด 4 ระดับ
    createVampiricSkill('lesser_vampiric', 'Minor Vampirism', 'Common', 5),
    createVampiricSkill('vampiric_edge', 'Vampiric Edge', 'Rare', 10),
    createVampiricSkill('greater_vampiric', 'Greater Vampirism', 'Epic', 15),
    createVampiricSkill('soul_leech', 'Soul Leech', 'Legendary', 20),

    // 🟢 กลุ่มสกิลเจาะเกราะ 4 ระดับ
    createArmorPierceSkill('shatter_armor', 'Shatter Armor', 'Common', 25),
    createArmorPierceSkill('armor_break', 'Armor Break', 'Rare', 50),
    createArmorPierceSkill('sunder_armor', 'Sunder Armor', 'Epic', 75),
    createArmorPierceSkill('true_strike', 'True Strike', 'Legendary', 100),

    // 🟢 กลุ่มสกิลเพิ่ม Crit Rate ชั่วคราว 4 ระดับ
    createCritBoostSkill('keen_eye', 'Keen Eye', 'Common', 15, 10),
    createCritBoostSkill('precision_strike', 'Precision Strike', 'Rare', 18, 18),
    createCritBoostSkill('deadly_focus', 'Deadly Focus', 'Epic', 22, 28),
    createCritBoostSkill('eagle_vision', "Eagle's Vision", 'Legendary', 25, 40),

    // 🟢 กลุ่มสกิล Stun บอส 4 ระดับ (โอกาสต่ำกว่ากลุ่มอื่น เพราะ effect แรงมาก)
    createStunSkill('dazing_hit', 'Dazing Hit', 'Common', 6),
    createStunSkill('stunning_blow', 'Stunning Blow', 'Rare', 9),
    createStunSkill('paralyzing_strike', 'Paralyzing Strike', 'Epic', 12),
    createStunSkill('world_ender', 'World Ender', 'Legendary', 15),
];



// สุ่ม ability 1 ตัวจาก pool ที่ tier ไม่เกิน rarity ของอาวุธ
export const getRandomWeaponAbility = (weaponRarity: string): WeaponAbility | null => {
    const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary'];
    const maxTierIndex = rarityOrder.indexOf(weaponRarity);
    if (maxTierIndex === -1) return null;

    const eligiblePool = WEAPON_ABILITY_POOL.filter(a => rarityOrder.indexOf(a.rarity) <= maxTierIndex);
    if (eligiblePool.length === 0) return null;

    const weightedPool: WeaponAbility[] = [];
    eligiblePool.forEach(ability => {
        const abilityTierIndex = rarityOrder.indexOf(ability.rarity);
        const diff = maxTierIndex - abilityTierIndex;

        // 🎲 กำหนดน้ำหนักตามความห่างของ Rarity (รองรับทุกระดับอาวุธ):
        // - ตรงสายเป๊ะๆ (diff = 0)  -> Weight 12 (~70%)
        // - ต่ำกว่า 1 ขั้น (diff = 1) -> Weight 3  (~20%)
        // - ต่ำกว่า 2 ขั้นขึ้นไป     -> Weight 1  (~10%)
        let weight = 1;
        if (diff === 0) {
            weight = 12;
        } else if (diff === 1) {
            weight = 3;
        } else {
            weight = 1;
        }

        for (let i = 0; i < weight; i++) {
            weightedPool.push(ability);
        }
    });

    return weightedPool[Math.floor(Math.random() * weightedPool.length)];
};


export const resolveWeaponAbility = (
    weaponItem: { weaponAbilityId?: string } | null | undefined,
    triggerType: 'on_attack' | 'on_hit' | 'on_damage',
    attacker: Stats,
    defender: Stats,
    baseDamage: number
): { extraDamage: number; healAmount: number; log: string; buff?: WeaponAbilityResult['buff'] } => {
    if (!weaponItem?.weaponAbilityId) return { extraDamage: 0, healAmount: 0, log: '' };

    const ability = WEAPON_ABILITY_POOL.find(a => a.id === weaponItem.weaponAbilityId);
    if (!ability || ability.type !== triggerType) return { extraDamage: 0, healAmount: 0, log: '' };

    const result = ability.effect(attacker, defender, baseDamage);
    return {
        extraDamage: result.extraDamage || 0,
        healAmount: result.healAmount || 0,
        log: result.log || '',
        buff: result.buff,
    };
};