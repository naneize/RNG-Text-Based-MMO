// data/weaponAbilities.ts
import type { Stats } from '../types/game';

export interface WeaponAbilityResult {
    extraDamage?: number;
    healAmount?: number;
    defReductionPercent?: number;
    log: string;
    buff?: { type: 'ignoreDef'; duration: number; value: number }; // ✅ เพิ่มบรรทัดนี้ — สั่งให้เริ่ม buff ที่มีผลหลายรอบ

}

export interface WeaponAbility {
    id: string;
    name: string;
    type: 'on_attack' | 'on_hit' | 'on_damage';
    description: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    effect: (attacker: Stats, defender: Stats, baseDamage: number) => WeaponAbilityResult;
}

export const WEAPON_ABILITY_POOL: WeaponAbility[] = [
    {
        id: 'double_strike',
        name: 'Swift Strikes',
        type: 'on_attack',
        rarity: 'Common',
        description: '15% chance to attack an additional time.',
        effect: (attacker, defender, baseDamage) => {
            if (Math.random() < 0.15) {
                return {
                    extraDamage: Math.floor(baseDamage * 0.5),
                    log: `, activated Swift Strikes! Additional attack deals extra damage!`
                };
            }
            return { extraDamage: 0, log: '' };
        }
    },
    {
        id: 'vampiric_edge',
        name: 'Vampiric Edge',
        type: 'on_damage',
        rarity: 'Rare',
        description: 'Heals for 10% of the damage dealt.',
        effect: (attacker, defender, baseDamage) => ({
            healAmount: Math.floor(baseDamage * 0.1),
            log: `, activated Vampiric! Edge restores health!`
        })
    },
    {
        id: 'armor_break',
        name: 'Armor Break',
        type: 'on_attack',
        rarity: 'Common',
        description: '15% chance to fully ignore enemy DEF/RES for the next 3 rounds.',
        effect: (attacker, defender, baseDamage) => {
            if (Math.random() < 0.15) {
                return {
                    extraDamage: 0,
                    buff: { type: 'ignoreDef', duration: 3, value: 100 },
                    log: `, activated Armor Break! Enemy armor ignored for 3 rounds!`
                };
            }
            return { extraDamage: 0, log: '' };
        }
    }
    // เพิ่ม ability อื่นๆ ต่อท้ายในอาเรย์นี้ได้เรื่อยๆ ครับ
];

// สุ่ม ability 1 ตัวจาก pool ที่ tier ไม่เกิน rarity ของอาวุธ
export const getRandomWeaponAbility = (weaponRarity: string): WeaponAbility | null => {
    const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary'];
    const maxTierIndex = rarityOrder.indexOf(weaponRarity);
    if (maxTierIndex === -1) return null;

    // 1. กรองเอาเฉพาะ Ability ที่ระดับน้อยกว่าหรือเท่ากับอาวุธ (ไม่มีทางได้สูงกว่า)
    const eligiblePool = WEAPON_ABILITY_POOL.filter(a => rarityOrder.indexOf(a.rarity) <= maxTierIndex);
    if (eligiblePool.length === 0) return null;

    // 2. ใส่ระบบถ่วงน้ำหนัก (Weighting)
    const weightedPool: WeaponAbility[] = [];
    eligiblePool.forEach(ability => {
        const abilityTierIndex = rarityOrder.indexOf(ability.rarity);

        // 🟢 ถ้า Ability ตรงกับระดับอาวุธ ให้สิทธิ์สุ่ม 3 ช่อง (75%)
        // 🟢 ถ้าระดับต่ำกว่า ให้สิทธิ์สุ่มแค่ 1 ช่อง (25%)
        const weight = (abilityTierIndex === maxTierIndex) ? 3 : 1;

        for (let i = 0; i < weight; i++) {
            weightedPool.push(ability);
        }
    });

    // 3. สุ่มจากโถที่ถ่วงน้ำหนักแล้ว
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
        buff: result.buff, // ✅ เพิ่มบรรทัดนี้
    };
};