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
    lore?: string;
    effect: (attacker: Stats, defender: Stats, baseDamage: number) => WeaponAbilityResult;
}

// 🟢 Helper Function สำหรับสร้าง Skill เจาะเกราะ (ระบุ Types ชัดเจน ป้องกัน TS Error)
const createArmorPierceSkill = (
    id: string,
    name: string,
    rarity: WeaponAbility['rarity'],
    value: number,
    loreText: string
): WeaponAbility => ({
    id,
    name,
    type: 'on_attack',
    rarity,
    lore: loreText,
    description: `{15% chance to ${value === 100 ? 'fully ignore' : `pierce ${value}%`} enemy DEF/RES for 3 rounds.`,
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
    critRateBonus: number,
    loreText: string
): WeaponAbility => ({
    id,
    name,
    type: 'on_attack',
    rarity,
    lore: loreText,
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
    chancePercent: number,
    loreText: string
): WeaponAbility => ({
    id,
    name,
    type: 'on_attack',
    rarity,
    lore: loreText,
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
    healPercent: number,
    loreText: string
): WeaponAbility => ({
    id,
    name,
    type: 'on_attack',
    rarity,
    lore: loreText,
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
    extraDmgPercent: number,
    loreText: string
): WeaponAbility => ({
    id,
    name,
    type: 'on_attack',
    rarity,
    lore: loreText,
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

// 🟢 Helper Function สำหรับสร้าง Skill ดาเมจแปรผันตาม stat รอง (Stat Scaling)
// ไม่มีโอกาสสุ่ม % เหมือนกลุ่มอื่น — ทำงานทุกครั้งที่โจมตี (แบบเดียวกับ Vampiric) เพราะเป็นโบนัสสะสมจาก build ไม่ใช่ proc
const createStatScalingSkill = (
    id: string,
    name: string,
    rarity: WeaponAbility['rarity'],
    statKey: keyof Stats,
    scalePercent: number,
    loreText: string
): WeaponAbility => ({
    id,
    name,
    type: 'on_attack',
    rarity,
    lore: loreText,
    description: `Adds bonus damage equal to ${Math.round(scalePercent * 0.9)}% - ${Math.round(scalePercent * 1.1)}% of your ${statKey.toUpperCase()}.`,
    effect: (attacker, _defender, _baseDamage) => {
        const statValue = attacker[statKey] || 0;
        const baseExtra = statValue * (scalePercent / 100);
        if (baseExtra <= 0) return { extraDamage: 0, log: '' };
        const minMultiplier = 0.90;
        const maxMultiplier = 1.10;
        const randomMultiplier = Math.random() * (maxMultiplier - minMultiplier) + minMultiplier;
        const extraDamage = Math.floor(baseExtra * randomMultiplier);
        if (extraDamage <= 0) return { extraDamage: 0, log: '' };

        return {
            extraDamage,
            log: `, activated ${name}! +${extraDamage} bonus damage from ${statKey.toUpperCase()}!`
        };
    }
});



export const WEAPON_ABILITY_POOL: WeaponAbility[] = [


    // 🟢 กลุ่มสกิลตีเบิ้ล 4 ระดับ
    createMultiHitSkill('swift_strikes', 'Swift Strikes', 'Common', 15, 50,
        "A flurry of quick, basic slashes that catches the enemy off guard with sheer speed."),
    createMultiHitSkill('dual_strike', 'Dual Strike', 'Rare', 20, 65,
        "Delivers a lightning-fast second blow immediately after the first, doubling the pressure."),
    createMultiHitSkill('flurry_blows', 'Flurry of Blows', 'Epic', 25, 80,
        "A continuous chain of rapid strikes that turns the weapon into a spinning wheel of steel."),
    createMultiHitSkill('fatal_tempest', 'Fatal Tempest', 'Legendary', 30, 100,
        "An overwhelming storm of endless blades, tearing the target apart before they can even blink."),


    // 🟢 กลุ่มสกิลดูดเลือด 4 ระดับ
    createVampiricSkill('lesser_vampiric', 'Minor Vampirism', 'Common', 5,
        "A minor dark enchantment that feeds on the enemy's fresh wounds to heal the user slightly."),
    createVampiricSkill('vampiric_edge', 'Vampiric Edge', 'Rare', 10,
        "The blade drinks deep from the spilling blood, transferring life force directly into the wielder."),
    createVampiricSkill('greater_vampiric', 'Greater Vampirism', 'Epic', 15,
        "A vicious siphon of vitality that tears life away from the foe to restore the user's vigor."),
    createVampiricSkill('soul_leech', 'Soul Leech', 'Legendary', 20,
        "An abyssal curse that harvests the very essence of the target, rejuvenating the wielder instantly."),

    // 🟢 กลุ่มสกิลเจาะเกราะ 4 ระดับ
    createArmorPierceSkill('shatter_armor', 'Shatter Armor', 'Common', 25,
        "A forceful strike aimed at structural weaknesses, cracking the enemy's defenses."),
    createArmorPierceSkill('armor_break', 'Armor Break', 'Rare', 50,
        "A devastating blow capable of shearing through heavy plates like paper."),
    createArmorPierceSkill('sunder_armor', 'Sunder Armor', 'Epic', 75,
        "Strikes with enough crushing weight to completely pulverize and strip away enemy protection."),
    createArmorPierceSkill('true_strike', 'True Strike', 'Legendary', 100,
        "An absolute pierce of destiny that ignores armor entirely, dealing unmitigated devastation."),

    // 🟢 กลุ่มสกิลเพิ่ม Crit Rate ชั่วคราว 4 ระดับ
    createCritBoostSkill('keen_eye', 'Keen Eye', 'Common', 15, 10,
        "Focuses the mind to spot minor flaws in the enemy's guard, raising critical precision."),
    createCritBoostSkill('precision_strike', 'Precision Strike', 'Rare', 18, 18,
        "Calms the breathing to deliver a meticulously aimed strike straight at vital spots."),
    createCritBoostSkill('deadly_focus', 'Deadly Focus', 'Epic', 22, 28,
        "Entering a state of heightened awareness where every weak point becomes glaringly obvious."),
    createCritBoostSkill('eagle_vision', "Eagle's Vision", 'Legendary', 25, 40,
        "The ultimate mastery of perception, ensuring every single attack zeroes in on a fatal flaw."),

    // 🟢 กลุ่มสกิล Stun บอส 4 ระดับ (โอกาสต่ำกว่ากลุ่มอื่น เพราะ effect แรงมาก)
    createStunSkill('dazing_hit', 'Dazing Hit', 'Common', 6,
        "A heavy strike to the head designed to rattle the enemy's senses and buy precious time."),
    createStunSkill('stunning_blow', 'Stunning Blow', 'Rare', 9,
        "A concussive shockwave that leaves the target momentarily disoriented and paralyzed."),
    createStunSkill('paralyzing_strike', 'Paralyzing Strike', 'Epic', 12,
        "Strikes nerve clusters with pinpoint accuracy, freezing the opponent in their tracks."),
    createStunSkill('world_ender', 'World Ender', 'Legendary', 15,
        "A cataclysmic blow of sheer magnitude that halts even the mightiest bosses in absolute shock."),

    // 🟢 กลุ่มสกิลแปรผันตาม LUK 4 ระดับ
    createStatScalingSkill('fortune_edge_c', "Fortune's Edge", 'Common', 'luk', 30,
        "A crude blade forged under a lucky star, seeking vulnerable spots guided by fate's whim."),
    createStatScalingSkill('fortune_edge_r', "Fortune's Blade", 'Rare', 'luk', 45,
        "Channeling a gambler's spirit, this weapon turns sudden desperation into calculated momentum."),
    createStatScalingSkill('fortune_edge_e', "Fortune's Wrath", 'Epic', 'luk', 60,
        "Infused with the capricious anger of Lady Luck, it strikes with unpredictable and overwhelming ferocity."),
    createStatScalingSkill('fortune_edge_l', "Fortune's Judgment", 'Legendary', 'luk', 80,
        "A sacred relic that delivers the absolute, undeniable verdict of destiny. None can escape its fateful blow."),

    // 🟢 กลุ่มสกิลแปรผันตาม AGI 4 ระดับ
    createStatScalingSkill('windrunner_c', "Windrunner's Fang", 'Common', 'agi', 30,
        "Fashioned from a feather of a minor wind spirit, it cuts through the air with effortless agility."),
    createStatScalingSkill('windrunner_r', "Windrunner's Talon", 'Rare', 'agi', 45,
        "Capturing the piercing chill of a gale, this weapon tears down defenses with blinding speed."),
    createStatScalingSkill('windrunner_e', "Windrunner's Claw", 'Epic', 'agi', 60,
        "Embodying a raging tempest, its continuous strikes blur into an inescapable vortex of wind."),
    createStatScalingSkill('windrunner_l', "Windrunner's Fury", 'Legendary', 'agi', 80,
        "The ultimate incarnation of the storm itself. It slashes the enemy a thousand times before they even realize the wind has stopped.")
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