import type { Stats, EquipmentSlot, TraitTriggerType, EquipmentTrait } from '../types/game';

// 1. โครงสร้างผลลัพธ์จากการทำงานของ Trait
export interface EquipmentTraitResult {
    extraDamage?: number;             // ดาเมจโจมตีเพิ่มใส่เป้าหมาย
    healAmount?: number;              // ฟื้นฟู HP ให้ผู้เล่น
    shieldAmount?: number;            // เสริมเกราะป้องกันชั่วคราว
    reflectDamage?: number;           // สะท้อนความเสียหายกลับใส่บอส
    damageReductionPercent?: number;  // ลดทอนดาเมจที่ได้รับเป็น % (0 - 100)
    damageReductionFlat?: number;     // ลดทอนดาเมจที่ได้รับแบบตัวเลขคงที่
    log: string;                      // ข้อความบันทึกใน Battle Log
    buff?: {                          // บัฟ/ดีบัฟต่อรอบ
        type: 'ignoreDef' | 'critBoost' | 'stunBoss' | 'damageMitigation' | 'atkBoost' | 'regen';
        name?: string;
        duration: number;
        value: number;
    };
}

// 2. บริบท (Context) ที่ส่งเข้าไปคำนวณเอฟเฟกต์
export interface TraitContext {
    attacker: Stats;                  // สเตตัสของผู้โจมตี
    defender: Stats;                  // สเตตัสของผู้ตั้งรับ
    baseDamage: number;               // ดาเมจตั้งต้นในจังหวะนั้น
    playerHp: number;                 // HP ปัจจุบันของผู้เล่น
    playerMaxHp: number;              // HP สูงสุดของผู้เล่น
    isCrit?: boolean;                 // ติดคริติคอลหรือไม่
    isMiss?: boolean;                 // ตีวืดหรือไม่
}

// 3. Helper Functions สำหรับสร้าง Trait แต่ละประเภท

// -------------------------------------------------------------
// 🗡️ WEAPON HELPERS (สืบทอดและแปลงจาก Weapon Abilities เดิม)
// -------------------------------------------------------------
const createMultiHitTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    chancePercent: number,
    extraDmgPercent: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots: ['weapon'],
    trigger: 'on_attack',
    rarity,
    lore: loreText,
    description: `${chancePercent}% chance to deal ${extraDmgPercent}% extra damage as an additional hit.`,
    effect: (ctx: TraitContext) => {
        if (Math.random() < chancePercent / 100) {
            const extraDamage = Math.floor(ctx.baseDamage * (extraDmgPercent / 100));
            return {
                extraDamage,
                log: `, activated ${name}! Additional attack deals ${extraDmgPercent}% extra damage!`
            };
        }
        return { extraDamage: 0, log: '' };
    }
});

const createVampiricTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    healPercent: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots: ['weapon'],
    trigger: 'on_attack',
    rarity,
    lore: loreText,
    description: `Drains ${healPercent}% of damage dealt into HP.`,
    effect: (ctx: TraitContext) => {
        const healAmount = Math.floor(ctx.baseDamage * (healPercent / 100));
        return {
            healAmount,
            log: `, activated ${name}! Lifesteal! (${healPercent}% , + ${healAmount} HP)`
        };
    }
});

const createArmorPierceTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    value: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots: ['weapon'],
    trigger: 'on_attack',
    rarity,
    lore: loreText,
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

const createCritBoostTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    chancePercent: number,
    critRateBonus: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots: ['weapon'],
    trigger: 'on_attack',
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

const createStunTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    chancePercent: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots: ['weapon'],
    trigger: 'on_attack',
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

const createStatScalingTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    statKey: keyof Stats,
    scalePercent: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots: ['weapon'],
    trigger: 'on_attack',
    rarity,
    lore: loreText,
    description: `Adds bonus damage equal to ${Math.round(scalePercent * 0.9)}% - ${Math.round(scalePercent * 1.1)}% of your ${statKey.toUpperCase()}.`,
    effect: (ctx: TraitContext) => {
        const statValue = ctx.attacker[statKey] || 0;
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

// -------------------------------------------------------------
// 🛡️ ARMOR / SHIELD / HELM / CLOAK HELPERS (เน้นป้องกัน / สะท้อน / ฮีล)
// -------------------------------------------------------------
const createThornsTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    allowedSlots: EquipmentSlot[],
    reflectPercentOfDef: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots,
    trigger: 'on_take_damage',
    rarity,
    lore: loreText,
    description: `When hit, reflects damage equal to ${reflectPercentOfDef}% of your DEF back to the attacker.`,
    effect: (ctx: TraitContext) => {
        const defVal = ctx.defender.def || 0;
        const reflectDamage = Math.max(1, Math.floor(defVal * (reflectPercentOfDef / 100)));
        return {
            reflectDamage,
            log: `[${name}] Thorns reflected ${reflectDamage} damage back! (${reflectPercentOfDef}% DEF)`
        };
    }
});

const createDamageMitigationTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    allowedSlots: EquipmentSlot[],
    chancePercent: number,
    mitigationPercent: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots,
    trigger: 'on_take_damage',
    rarity,
    lore: loreText,
    description: `${chancePercent}% chance to mitigate incoming damage by ${mitigationPercent}%.`,
    effect: (ctx: TraitContext) => {
        if (Math.random() < chancePercent / 100) {
            // คำนวณตัวเลขดาเมจที่ถูกบล็อกจริงจากดาเมจที่ได้รับ (baseDamage หรือ incoming damage)
            const incomingDamage = ctx.baseDamage || 0;
            const mitigatedAmount = Math.floor(incomingDamage * (mitigationPercent / 100));

            return {
                damageReductionPercent: mitigationPercent,
                log: `[${name}] absorbed ${mitigatedAmount} damage (${mitigationPercent}%)`
            };
        }
        return { log: '' };
    }
});

const createEmergencyShieldTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    allowedSlots: EquipmentSlot[],
    hpThresholdPercent: number,
    healPercentOfMaxHp: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots,
    trigger: 'on_take_damage',
    rarity,
    lore: loreText,
    description: `When HP drops below ${hpThresholdPercent}%, immediately restores ${healPercentOfMaxHp}% of Max HP when damaged.`,
    effect: (ctx: TraitContext) => {
        const currentHpPercent = (ctx.playerHp / (ctx.playerMaxHp || 1)) * 100;
        if (currentHpPercent <= hpThresholdPercent) {
            const healAmount = Math.floor((ctx.playerMaxHp || 1) * (healPercentOfMaxHp / 100));
            return {
                healAmount,
                log: `[${name}] Emergency Aegis triggered! Restored ${healAmount} HP!`
            };
        }
        return { log: '' };
    }
});

const createRegenTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    allowedSlots: EquipmentSlot[],
    regenPercentOfMaxHp: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots,
    trigger: 'on_turn_start',
    rarity,
    lore: loreText,
    description: `Restores ${regenPercentOfMaxHp}% of Max HP at the start of each round.`,
    effect: (ctx: TraitContext) => {
        const healAmount = Math.max(1, Math.floor((ctx.playerMaxHp || 1) * (regenPercentOfMaxHp / 100)));
        return {
            healAmount,
            log: `[${name}] Rejuvenated +${healAmount} HP!`
        };
    }
});

// -------------------------------------------------------------
// 🥾 BOOTS HELPERS (เน้นหลบหลีก / เคาน์เตอร์ / ความเร็ว)
// -------------------------------------------------------------
const createDodgeCounterTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    scalePercentOfAgi: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots: ['boots'],
    trigger: 'on_dodge',
    rarity,
    lore: loreText,
    description: `Upon dodging an attack, counter-attacks dealing ${scalePercentOfAgi}% of your AGI as damage.`,
    effect: (ctx: TraitContext) => {
        const agi = ctx.defender.agi || 0;
        const counterDamage = Math.max(1, Math.floor(agi * (scalePercentOfAgi / 100)));
        return {
            extraDamage: counterDamage,
            log: `[${name}] Dodged & Countered for ${counterDamage} damage!`
        };
    }
});

const createDodgeCritBuffTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    critBoostValue: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots: ['boots'],
    trigger: 'on_dodge',
    rarity,
    lore: loreText,
    description: `Upon dodging an attack, grants +${critBoostValue}% Crit Rate for 2 rounds.`,
    effect: () => ({
        buff: { type: 'critBoost', name, duration: 2, value: critBoostValue },
        log: `[${name}] Wind dance flow! Crit Rate +${critBoostValue}% for 2 rounds!`
    })
});

// -------------------------------------------------------------
// 💍 ACCESSORY HELPERS (Necklace & Ring: Utility / Stat Amplifiers)
// -------------------------------------------------------------
const createBerserkBonusTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    maxBonusPercent: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots: ['necklace', 'ring'],
    trigger: 'on_attack',
    rarity,
    lore: loreText,
    description: `Increases damage by up to +${maxBonusPercent}% scaling with your missing HP.`,
    effect: (ctx: TraitContext) => {
        const missingHpPercent = 1 - (ctx.playerHp / (ctx.playerMaxHp || 1));
        const bonusPercent = Math.floor(missingHpPercent * maxBonusPercent);
        if (bonusPercent > 0) {
            const extraDamage = Math.floor(ctx.baseDamage * (bonusPercent / 100));
            return {
                extraDamage,
                log: `[${name}] Berserk rage (+${bonusPercent}% DMG, +${extraDamage})`
            };
        }
        return { log: '' };
    }
});

const createGamblerStrikeTrait = (
    id: string,
    name: string,
    rarity: EquipmentTrait['rarity'],
    chancePercent: number,
    maxLukMultiplier: number,
    loreText: string
): EquipmentTrait => ({
    id,
    name,
    allowedSlots: ['necklace', 'ring'],
    trigger: 'on_damage_dealt',
    rarity,
    lore: loreText,
    description: `${chancePercent}% chance to trigger Gambler's Dice, adding bonus damage up to ${maxLukMultiplier}x your LUK.`,
    effect: (ctx: TraitContext) => {
        if (Math.random() < chancePercent / 100) {
            const luk = ctx.attacker.luk || 0;
            const extraDamage = Math.floor(luk * (Math.random() * maxLukMultiplier + 1));
            return {
                extraDamage,
                log: `[${name}] Gambler's Jackpot! +${extraDamage} bonus damage!`
            };
        }
        return { log: '' };
    }
});


// =============================================================
// 🌟 EQUIPMENT TRAIT POOL (รวบรวม Trait ทั้งหมดในเกม)
// =============================================================
export const EQUIPMENT_TRAIT_POOL: EquipmentTrait[] = [
    // ----------------- WEAPONS (24 รายการเดิม) -----------------
    // Multi-Hit
    createMultiHitTrait('swift_strikes', 'Swift Strikes', 'Common', 15, 50,
        "A flurry of quick, basic slashes that catches the enemy off guard with sheer speed."),
    createMultiHitTrait('dual_strike', 'Dual Strike', 'Rare', 20, 65,
        "Delivers a lightning-fast second blow immediately after the first, doubling the pressure."),
    createMultiHitTrait('flurry_blows', 'Flurry of Blows', 'Epic', 25, 80,
        "A continuous chain of rapid strikes that turns the weapon into a spinning wheel of steel."),
    createMultiHitTrait('fatal_tempest', 'Fatal Tempest', 'Legendary', 30, 100,
        "An overwhelming storm of endless blades, tearing the target apart before they can even blink."),

    // Vampiric
    createVampiricTrait('lesser_vampiric', 'Minor Vampirism', 'Common', 5,
        "A minor dark enchantment that feeds on the enemy's fresh wounds to heal the user slightly."),
    createVampiricTrait('vampiric_edge', 'Vampiric Edge', 'Rare', 10,
        "The blade drinks deep from the spilling blood, transferring life force directly into the wielder."),
    createVampiricTrait('greater_vampiric', 'Greater Vampirism', 'Epic', 15,
        "A vicious siphon of vitality that tears life away from the foe to restore the user's vigor."),
    createVampiricTrait('soul_leech', 'Soul Leech', 'Legendary', 20,
        "An abyssal curse that harvests the very essence of the target, rejuvenating the wielder instantly."),

    // Armor Pierce
    createArmorPierceTrait('shatter_armor', 'Shatter Armor', 'Common', 25,
        "A forceful strike aimed at structural weaknesses, cracking the enemy's defenses."),
    createArmorPierceTrait('armor_break', 'Armor Break', 'Rare', 50,
        "A devastating blow capable of shearing through heavy plates like paper."),
    createArmorPierceTrait('sunder_armor', 'Sunder Armor', 'Epic', 75,
        "Strikes with enough crushing weight to completely pulverize and strip away enemy protection."),
    createArmorPierceTrait('true_strike', 'True Strike', 'Legendary', 100,
        "An absolute pierce of destiny that ignores armor entirely, dealing unmitigated devastation."),

    // Crit Boost
    createCritBoostTrait('keen_eye', 'Keen Eye', 'Common', 15, 10,
        "Focuses the mind to spot minor flaws in the enemy's guard, raising critical precision."),
    createCritBoostTrait('precision_strike', 'Precision Strike', 'Rare', 18, 18,
        "Calms the breathing to deliver a meticulously aimed strike straight at vital spots."),
    createCritBoostTrait('deadly_focus', 'Deadly Focus', 'Epic', 22, 28,
        "Entering a state of heightened awareness where every weak point becomes glaringly obvious."),
    createCritBoostTrait('eagle_vision', "Eagle's Vision", 'Legendary', 25, 40,
        "The ultimate mastery of perception, ensuring every single attack zeroes in on a fatal flaw."),

    // Stun
    createStunTrait('dazing_hit', 'Dazing Hit', 'Common', 6,
        "A heavy strike to the head designed to rattle the enemy's senses and buy precious time."),
    createStunTrait('stunning_blow', 'Stunning Blow', 'Rare', 9,
        "A concussive shockwave that leaves the target momentarily disoriented and paralyzed."),
    createStunTrait('paralyzing_strike', 'Paralyzing Strike', 'Epic', 12,
        "Strikes nerve clusters with pinpoint accuracy, freezing the opponent in their tracks."),
    createStunTrait('world_ender', 'World Ender', 'Legendary', 15,
        "A cataclysmic blow of sheer magnitude that halts even the mightiest bosses in absolute shock."),

    // LUK Scaling
    createStatScalingTrait('fortune_edge_c', "Fortune's Edge", 'Common', 'luk', 30,
        "A crude blade forged under a lucky star, seeking vulnerable spots guided by fate's whim."),
    createStatScalingTrait('fortune_edge_r', "Fortune's Blade", 'Rare', 'luk', 45,
        "Channeling a gambler's spirit, this weapon turns sudden desperation into calculated momentum."),
    createStatScalingTrait('fortune_edge_e', "Fortune's Wrath", 'Epic', 'luk', 60,
        "Infused with the capricious anger of Lady Luck, it strikes with unpredictable and overwhelming ferocity."),
    createStatScalingTrait('fortune_edge_l', "Fortune's Judgment", 'Legendary', 'luk', 80,
        "A sacred relic that delivers the absolute, undeniable verdict of destiny. None can escape its fateful blow."),

    // AGI Scaling
    createStatScalingTrait('windrunner_c', "Windrunner's Fang", 'Common', 'agi', 30,
        "Fashioned from a feather of a minor wind spirit, it cuts through the air with effortless agility."),
    createStatScalingTrait('windrunner_r', "Windrunner's Talon", 'Rare', 'agi', 45,
        "Capturing the piercing chill of a gale, this weapon tears down defenses with blinding speed."),
    createStatScalingTrait('windrunner_e', "Windrunner's Claw", 'Epic', 'agi', 60,
        "Embodying a raging tempest, its continuous strikes blur into an inescapable vortex of wind."),
    createStatScalingTrait('windrunner_l', "Windrunner's Fury", 'Legendary', 'agi', 80,
        "The ultimate incarnation of the storm itself. It slashes the enemy a thousand times before they even realize the wind has stopped."),

    // ----------------- ARMOR / SHIELD / HELM / CLOAK -----------------
    // Thorns (Armor / Shield / Helm / Cloak)
    createThornsTrait('thorns_c', 'Spiked Shell', 'Common', ['armor', 'shield', 'helm', 'cloak'], 20,
        "Sharp jagged edges that sting attackers upon impact."),
    createThornsTrait('thorns_r', 'Barbed Carapace', 'Rare', ['armor', 'shield', 'helm', 'cloak'], 35,
        "Reinforced barbed plating designed to puncture anything that strikes it."),
    createThornsTrait('thorns_e', 'Bramble Fortress', 'Epic', ['armor', 'shield', 'helm', 'cloak'], 55,
        "Entangled thorny armor pulsating with protective retaliatory energy."),
    createThornsTrait('thorns_l', 'Titan Retaliation', 'Legendary', ['armor', 'shield', 'helm', 'cloak'], 80,
        "An ancient behemoth aegis that turns every incoming blow into crushing reflection."),

    // Damage Mitigation (Armor / Shield / Helm / Cloak)
    createDamageMitigationTrait('iron_bastion_c', 'Sturdy Plating', 'Common', ['armor', 'shield', 'helm', 'cloak'], 15, 20,
        "Dense metal padding that occasionally cushions heavy blows."),
    createDamageMitigationTrait('iron_bastion_r', 'Iron Bastion', 'Rare', ['armor', 'shield', 'helm', 'cloak'], 20, 35,
        "A stalwart defensive posture that absorbs concussive force."),
    createDamageMitigationTrait('iron_bastion_e', 'Adamantine Guard', 'Epic', ['armor', 'shield', 'helm', 'cloak'], 25, 50,
        "Unbreakable crystalline plates that nullify half of severe damage."),
    createDamageMitigationTrait('iron_bastion_l', 'Aegis of the Immortal', 'Legendary', ['armor', 'shield', 'helm', 'cloak'], 30, 70,
        "The celestial barrier of gods, deflecting devastating strikes with absolute ease."),

    // Emergency Shield / Heal (Armor / Shield / Helm)
    createEmergencyShieldTrait('emergency_shield_c', 'Last Stand', 'Common', ['armor', 'shield', 'helm'], 30, 15,
        "Adrenaline kicks in when wounded, quickly binding minor fractures."),
    createEmergencyShieldTrait('emergency_shield_r', 'Survivor Resilience', 'Rare', ['armor', 'shield', 'helm'], 35, 25,
        "A fierce survival instinct that surges vitality at the brink of death."),
    createEmergencyShieldTrait('emergency_shield_e', 'Phoenix Heart', 'Epic', ['armor', 'shield', 'helm'], 40, 40,
        "Reborn from the ashes of mortal danger with renewed life."),
    createEmergencyShieldTrait('emergency_shield_l', 'Divine Intervention', 'Legendary', ['armor', 'shield', 'helm'], 45, 60,
        "A miraculous blessing that restores your vitality when on the verge of defeat."),

    // Regen (Cloak / Helm)
    createRegenTrait('regen_c', 'Lesser Mending', 'Common', ['cloak', 'helm'], 2,
        "Subtle healing threads woven into the fabric."),
    createRegenTrait('regen_r', 'Restorative Aura', 'Rare', ['cloak', 'helm'], 4,
        "A gentle glowing warmth that eases fatigue round by round."),
    createRegenTrait('regen_e', 'Verdant Life', 'Epic', ['cloak', 'helm'], 6,
        "Nature's blessing steadily regenerating vital organs during battle."),
    createRegenTrait('regen_l', 'Fountain of Eternity', 'Legendary', ['cloak', 'helm'], 10,
        "Boundless life essence that makes mortal wounds fade away effortlessly."),

    // ----------------- BOOTS -----------------
    // Dodge Counter
    createDodgeCounterTrait('dodge_counter_c', 'Quick Reflex', 'Common', 40,
        "Lightweight soles allowing a swift pivot and jab when evading."),
    createDodgeCounterTrait('dodge_counter_r', 'Nimble Riposte', 'Rare', 70,
        "Sidesteps the opponent's strike and retaliates with momentum."),
    createDodgeCounterTrait('dodge_counter_e', 'Shadow Strike', 'Epic', 110,
        "Dissolves into shadows to dodge, reappearing with a ruthless counter."),
    createDodgeCounterTrait('dodge_counter_l', 'Phantom Velocity', 'Legendary', 160,
        "Moves so fast that evasion and lethal retaliation happen simultaneously."),

    // Dodge Crit Buff
    createDodgeCritBuffTrait('dodge_crit_c', 'Wind Step', 'Common', 10,
        "Catching the enemy off balance after a dodge."),
    createDodgeCritBuffTrait('dodge_crit_r', 'Wind Dancer', 'Rare', 18,
        "Graceful footwork creating prime openings for critical hits."),
    createDodgeCritBuffTrait('dodge_crit_e', 'Tempest Dance', 'Epic', 25,
        "Whirling evasion that lines up lethal vital strikes."),
    createDodgeCritBuffTrait('dodge_crit_l', 'Gale Mastery', 'Legendary', 35,
        "Absolute mastery of air currents, ensuring next strikes are unerringly fatal."),

    // ----------------- ACCESSORIES (Necklace & Ring) -----------------
    // Berserk Damage
    createBerserkBonusTrait('berserk_c', 'Bloodcurse Ring', 'Common', 15,
        "Pulses with anger as fresh wounds appear."),
    createBerserkBonusTrait('berserk_r', 'Fury Talisman', 'Rare', 25,
        "Converts agonizing pain directly into raw offensive prowess."),
    createBerserkBonusTrait('berserk_e', 'Berserker Soul', 'Epic', 40,
        "A legendary warlord's spirit that burns brightest at death's door."),
    createBerserkBonusTrait('berserk_l', 'Wrath of the Underworld', 'Legendary', 60,
        "Unleashes boundless cataclysmic power proportional to missing vitality."),

    // Gambler's Dice
    createGamblerStrikeTrait('gambler_c', 'Lucky Charm', 'Common', 15, 2,
        "A whimsical trinket that grants occasional good fortune."),
    createGamblerStrikeTrait('gambler_r', "Gambler's Coin", 'Rare', 20, 3,
        "Flips fate on its head with surprising bursts of lucky damage."),
    createGamblerStrikeTrait('gambler_e', "Destiny's Wheel", 'Epic', 25, 4,
        "Spins the wheel of fortune to unleash chaotic damage."),
    createGamblerStrikeTrait('gambler_l', 'Hand of God', 'Legendary', 30, 6,
        "Divine luck manifest, obliterating foes with celestial fortune.")
];

// =============================================================
// 🔍 HELPER QUERY & RESOLVE FUNCTIONS
// =============================================================

export const getTraitById = (traitId: string | undefined): EquipmentTrait | undefined => {
    if (!traitId) return undefined;
    return EQUIPMENT_TRAIT_POOL.find(t => t.id === traitId);
};

// สุ่ม Trait 1 ตัวจาก Pool ที่รองรับ Slot นั้นๆ และ Tier ไม่เกิน Rarity ของไอเทม
export const getRandomTraitForSlot = (slot: EquipmentSlot | string, itemRarity: string): EquipmentTrait | null => {
    const rarityOrder = ['Common', 'Rare', 'Epic', 'Legendary'];
    const maxTierIndex = rarityOrder.indexOf(itemRarity);
    if (maxTierIndex === -1) return null;

    // กรองหา Trait ที่ใส่ใน Slot นี้ได้ และ Rarity ไม่เกิน
    const eligiblePool = EQUIPMENT_TRAIT_POOL.filter(t => {
        const isSlotMatch = t.allowedSlots.includes(slot as EquipmentSlot);
        const isRarityMatch = rarityOrder.indexOf(t.rarity) <= maxTierIndex;
        return isSlotMatch && isRarityMatch;
    });

    if (eligiblePool.length === 0) return null;

    // ถ่วงน้ำหนักตามความห่างของ Rarity Tier
    const weightedPool: EquipmentTrait[] = [];
    eligiblePool.forEach(trait => {
        const tierIndex = rarityOrder.indexOf(trait.rarity);
        const diff = maxTierIndex - tierIndex;

        let weight = 1;
        if (diff === 0) weight = 12;      // ~70%
        else if (diff === 1) weight = 3;  // ~20%
        else weight = 1;                  // ~10%

        for (let i = 0; i < weight; i++) {
            weightedPool.push(trait);
        }
    });

    return weightedPool[Math.floor(Math.random() * weightedPool.length)];
};

// ฟังก์ชันสำหรับประมวลผล Trait หลายชิ้นพร้อมกันในจังหวะ Trigger นั้นๆ
export const resolveEquipmentTraits = (
    equippedItems: Record<string, { traitId?: string; weaponAbilityId?: string } | null | undefined>,
    trigger: TraitTriggerType,
    context: TraitContext
): EquipmentTraitResult => {
    const aggregatedResult: EquipmentTraitResult = {
        extraDamage: 0,
        healAmount: 0,
        shieldAmount: 0,
        reflectDamage: 0,
        damageReductionPercent: 0,
        damageReductionFlat: 0,
        log: '',
    };

    const logs: string[] = [];

    Object.values(equippedItems).forEach(item => {
        if (!item) return;
        const traitId = item.traitId || item.weaponAbilityId;
        if (!traitId) return;

        const trait = getTraitById(traitId);
        if (!trait || trait.trigger !== trigger) return;

        const result = trait.effect(context);

        if (result.extraDamage) aggregatedResult.extraDamage = (aggregatedResult.extraDamage || 0) + result.extraDamage;
        if (result.healAmount) aggregatedResult.healAmount = (aggregatedResult.healAmount || 0) + result.healAmount;
        if (result.shieldAmount) aggregatedResult.shieldAmount = (aggregatedResult.shieldAmount || 0) + result.shieldAmount;
        if (result.reflectDamage) aggregatedResult.reflectDamage = (aggregatedResult.reflectDamage || 0) + result.reflectDamage;
        if (result.damageReductionPercent) {
            aggregatedResult.damageReductionPercent = Math.max(
                aggregatedResult.damageReductionPercent || 0,
                result.damageReductionPercent
            );
        }
        if (result.damageReductionFlat) {
            aggregatedResult.damageReductionFlat = (aggregatedResult.damageReductionFlat || 0) + result.damageReductionFlat;
        }
        if (result.buff) {
            aggregatedResult.buff = result.buff; // เก็บ Buff ล่าสุดที่ทำงาน
        }
        if (result.log) {
            logs.push(result.log);
        }
    });

    aggregatedResult.log = logs.filter(Boolean).join(' ');
    return aggregatedResult;
};

// -------------------------------------------------------------
// 🔄 BACKWARD-COMPATIBILITY EXPORTS (ให้อาวุธและโค้ดเดิมยังคงทำงานได้)
// -------------------------------------------------------------
export const WEAPON_ABILITY_POOL = EQUIPMENT_TRAIT_POOL.filter(t => t.allowedSlots.includes('weapon'));
export const getRandomWeaponAbility = (weaponRarity: string) => getRandomTraitForSlot('weapon', weaponRarity);
export const resolveWeaponAbility = (
    weaponItem: { weaponAbilityId?: string; traitId?: string } | null | undefined,
    triggerType: 'on_attack' | 'on_hit' | 'on_damage',
    attacker: Stats,
    defender: Stats,
    baseDamage: number
) => {
    const traitId = weaponItem?.traitId || weaponItem?.weaponAbilityId;
    if (!traitId) return { extraDamage: 0, healAmount: 0, log: '' };

    const trait = getTraitById(traitId);
    if (!trait) return { extraDamage: 0, healAmount: 0, log: '' };

    const mappedTrigger = triggerType === 'on_damage' ? 'on_damage_dealt' : 'on_attack';
    if (trait.trigger !== mappedTrigger && trait.trigger !== triggerType) {
        return { extraDamage: 0, healAmount: 0, log: '' };
    }

    const result = trait.effect({
        attacker,
        defender,
        baseDamage,
        playerHp: 100,
        playerMaxHp: 100
    });

    return {
        extraDamage: result.extraDamage || 0,
        healAmount: result.healAmount || 0,
        log: result.log || '',
        buff: result.buff
    };
};
