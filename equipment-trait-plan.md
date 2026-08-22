# 🛡️ แผนการพัฒนาระบบ Equipment Trait (คุณสมบัติพิเศษสำหรับอุปกรณ์สวมใส่ทั้งหมด)

เอกสารนี้รวบรวมแผนการทำงานเชิงลึกสำหรับการขยายระบบ **Trait (คุณสมบัติพิเศษ)** จากเดิมที่มีเฉพาะใน **อาวุธ (Weapons)** ให้ครอบคลุม **อุปกรณ์สวมใส่ทุกชิ้น (All Equipment Slots)** ภายในเกม RNG-easyMMO โดยเน้นความเสถียร รองรับข้อมูลเก่าแบบ 100% (Backward Compatibility) และปรับแต่งสมดุลได้ง่าย

---

## 1. 📁 รายการไฟล์ที่ต้องแก้ไขและส่วนที่ต้องปรับปรุง

| ลำดับ | ไฟล์เป้าหมาย | หมวดหมู่ | รายละเอียดส่วนที่ต้องแก้ไข |
| :---: | :--- | :--- | :--- |
| **1** | [`src/types/game.ts`](file:///c:/Users/Admin/OneDrive/Desktop/RNG-easyMMO/RNG-easyMMo/src/types/game.ts) | **Types** | - เพิ่ม `traitId?: string` ใน `interface Item`<br>- คงฟิลด์ `weaponAbilityId?: string` ไว้เพื่อรองรับ Save/Items เก่า<br>- นิยาม Trigger Types และ Trait Types |

| **2** | [`src/data/equipmentTraits.ts`](file:///c:/Users/Admin/OneDrive/Desktop/RNG-easyMMO/RNG-easyMMo/src/data/equipmentTraits.ts) *(สร้างใหม่)* | **Data & Logic** | - ย้าย/เชื่อมโยง Pool เดิมจาก `weaponAbilities.ts`<br>- เพิ่ม Trait Pools ใหม่แยกตาม Slot (Armor, Shield, Helm, Cloak, Boots, Accessory)<br>- ฟังก์ชันสุ่ม Trait ตาม Slot และ Rarity: `getRandomTraitForSlot(slot, rarity)`<br>- ฟังก์ชัน Execute Effect: `resolveEquipmentTraits(...)` |

| **3** | [`src/utils/itemGenerator.ts`](file:///c:/Users/Admin/OneDrive/Desktop/RNG-easyMMO/RNG-easyMMo/src/utils/itemGenerator.ts) | **Generator** | - ปรับปรุงฟังก์ชัน `generateItem` และ `generateBossDropItem`<br>- ขยายเงื่อนไขการสุ่ม Trait จากเดิมที่เช็คเฉพาะ `slot === 'weapon'` ให้สุ่มได้ทุก Slot<br>- ผูก `traitId` (และ `weaponAbilityId` สำหรับอาวุธ) เข้ากับไอเทมที่ถูกสร้าง |

| **4** | [`src/store/battleStore.ts`](file:///c:/Users/Admin/OneDrive/Desktop/RNG-easyMMO/RNG-easyMMo/src/store/battleStore.ts) | **Combat Loop** | - วนลูปตรวจสอบ Trait จาก `equippedItems` ทั้งหมด<br>- **จังหวะผู้เล่นโจมตี:** รัน Trait ประเภท `on_attack`, `on_damage_dealt`<br>- **จังหวะบอสโจมตี/ผู้เล่นรับดาเมจ:** รัน Trait ประเภท `on_take_damage`, `on_dodge`, `on_turn_start`<br>- ประมวลผล Reflect Dmg, Damage Mitigation, Shield, Lifesteal, Buffs |

| **5** | [`src/utils/combat.ts`](file:///c:/Users/Admin/OneDrive/Desktop/RNG-easyMMO/RNG-easyMMo/src/utils/combat.ts) | **Combat Formula** | - รองรับค่าคำนวณ Mitigation/Flat Damage Reduction จากบัฟของ Trait เกราะ/เครื่องประดับ (หากมี) |

| **6** | [`src/components/Modals/ItemDetailModal.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/RNG-easyMMO/RNG-easyMMo/src/components/Modals/ItemDetailModal.tsx) | **UI** | - เปลี่ยนการแสดงผลจาก *"Weapon Trait"* ให้เป็น *"Equipment Trait"* หรือชื่อตาม Slot (เช่น *"Armor Trait"*, *"Ring Trait"*)<br>- แสดงผล Trigger Badge, ชื่อนิมิต, Lore และคำอธิบายสกิล |

| **7** | [`src/components/Modals/LootedModal.tsx`](file:///c:/Users/Admin/OneDrive/Desktop/RNG-easyMMO/RNG-easyMMo/src/components/Modals/LootedModal.tsx) | **UI** | - แสดงกล่อง Trait ของไอเทมที่ได้รับจากการดรอปสำหรับทุก Slot |

---

## 2. 🧩 โครงสร้างข้อมูลและ Type Definitions

```typescript
import type { Stats, EquipmentSlot } from './game';

// 1. จังหวะการทำงาน (Trigger Phase)
export type TraitTriggerType = 
    | 'on_attack'        // เมื่อผู้เล่นเริ่มออกคำสั่งโจมตี (Offensive Proc)
    | 'on_damage_dealt'  // เมื่อสร้างความเสียหายใส่ศัตรูสำเร็จ (Lifesteal, Stat Scaling)
    | 'on_take_damage'   // เมื่อผู้เล่นถูกโจมตี/ได้รับความเสียหาย (Defensive, Thorns, Shield)
    | 'on_dodge'         // เมื่อผู้เล่นหลบการโจมตีได้สำเร็จ (Flee Proc, Counter)
    | 'on_turn_start';   // เมื่อเริ่มต้นรอบการต่อสู้ (Regen, Barrier)

// 2. ผลลัพธ์จากการทำงานของ Trait
export interface EquipmentTraitResult {
    extraDamage?: number;             // โบนัสดาเมจเพิ่มเติมไปยังเป้าหมาย
    healAmount?: number;              // ฟื้นฟู HP ให้ผู้เล่น
    shieldAmount?: number;            // เสริมเกราะป้องกันชั่วคราว
    reflectDamage?: number;           // สะท้อนความเสียหายกลับไปยังศัตรู
    damageReductionPercent?: number;  // เปอร์เซ็นต์ลดทอนความเสียหายที่ได้รับ (0 - 100)
    damageReductionFlat?: number;     // ลดทอนความเสียหายแบบคงที่
    log: string;                      // ข้อความบันทึกสำหรับแสดงใน Battle Log
    buff?: {                          // บัฟ/ดีบัฟที่มีผลต่อเนื่องเป็นรอบ
        type: 'ignoreDef' | 'critBoost' | 'stunBoss' | 'damageMitigation' | 'atkBoost' | 'regen';
        name?: string;
        duration: number;
        value: number;
    };
}

// 3. บริบท (Context) ที่ส่งเข้าไปให้ Effect คำนวณ
export interface TraitContext {
    attacker: Stats;                  // สเตตัสของผู้โจมตี
    defender: Stats;                  // สเตตัสของผู้ตั้งรับ
    baseDamage: number;               // ดาเมจตั้งต้นในจังหวะนั้น
    playerHp: number;                 // HP ปัจจุบันของผู้เล่น
    playerMaxHp: number;              // HP สูงสุดของผู้เล่น
    isCrit?: boolean;                 // ติดคริติคอลหรือไม่
    isMiss?: boolean;                 // ตีวืดหรือไม่
}

// 4. นิยามโครงสร้าง Trait ของอุปกรณ์
export interface EquipmentTrait {
    id: string;
    name: string;
    allowedSlots: EquipmentSlot[];    // ชิ้นส่วนที่สามารถสุ่มได้ Trait นี้
    trigger: TraitTriggerType;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    description: string;
    lore?: string;
    effect: (ctx: TraitContext) => EquipmentTraitResult;
}
```

---

## 3. 🎯 ตัวอย่างการออกแบบ Trait Pool ตามหมวดหมู่อุปกรณ์

### 3.1 หมวดอาวุธ (`weapon`) — Offensive
- **Multi-Hit (Swift Strikes / Dual Strike / Fatal Tempest):** มีโอกาสตีเบิ้ลสร้างดาเมจเสริม
- **Vampirism (Minor / Edge / Soul Leech):** ดูดเลือดตามสัดส่วนดาเมจที่ทำได้
- **Armor Pierce (Shatter / Sunder / True Strike):** เจาะเกราะ/ลด DEF ของบอส
- **Stat Scaling:** เพิ่มดาเมจเสริมอิงตาม LUK หรือ AGI

### 3.2 หมวดชุดเกราะและโล่ (`armor`, `shield`, `helm`, `cloak`) — Defensive & Sustain
- **Spiked Carapace / Thorns (`on_take_damage`):** สะท้อนดาเมจ X% ของ DEF/VIT ผู้เล่นกลับใส่บอสเมื่อถูกโจมตี
- **Iron Bastion (`on_take_damage`):** มีโอกาส 20% ที่จะลดทอนความเสียหายที่ได้รับลง 30% - 70%
- **Emergency Barrier (`on_take_damage`):** เมื่อ HP ต่ำกว่า 35% กางบาเรียดูดซับดาเมจได้ X หน่วย (1 ครั้งต่อการต่อสู้)
- **Second Wind (`on_turn_start`):** ฟื้นฟู HP 3-6% ทุกๆ เทิร์นเมื่อ HP เหลือต่ำกว่า 50%

### 3.3 หมวดรองเท้า (`boots`) — Agility & Evasion
- **Wind Dancer (`on_dodge`):** เมื่อหลบการโจมตีได้ จะได้รับบัฟเพิ่ม Crit Rate +20% ใน 2 เทิร์นถัดไป
- **Nimble Riposte (`on_dodge`):** เมื่อหลบได้ จะสวนกลับด้วยดาเมจทันทีเท่ากับ 80% - 150% ของค่า AGI

### 3.4 หมวดเครื่องประดับ (`necklace`, `ring`) — Utility & Amplification
- **Blood Pact Ring (`on_attack`):** ยิ่งเลือดเหลือน้อย ยิ่งโจมตีแรงขึ้นสูงสุด +30%
- **Siphon Ring (`on_turn_start`):** ฟื้นฟู HP คงที่ 2-5% ทุกๆ ต้นรอบ
- **Fortune's Ring (`on_damage_dealt`):** มีโอกาส 10% ที่จะสุ่มสร้างความเสียหายทวีคูณแบบเสี่ยงดวง (Gambler Strike)

---

## 4. 🚀 ขั้นตอนการดำเนินการทีละสเต็ป (Step-by-Step Execution Plan)

### ขั้นตอนที่ 1: Type Setup & Data Layer (ความเข้ากันได้ 100%)
1. อัปเดต `src/types/game.ts` เพิ่ม `traitId?: string` ใน `Item`
2. สร้างไฟล์ `src/data/equipmentTraits.ts`:
   - รวบรวม Trait ของอาวุธเดิมเข้ามาในระบบใหม่
   - เพิ่ม Trait Pool สำหรับ Armor, Shield, Helm, Cloak, Boots, Necklace, Ring
   - สร้าง Helper: `getTraitById(id: string): EquipmentTrait | undefined`
   - สร้าง Helper: `getRandomTraitForSlot(slot: EquipmentSlot, rarity: string): EquipmentTrait | null`

### ขั้นตอนที่ 2: ปรับปรุงระบบ Generator (`itemGenerator.ts`)
1. กำหนดตารางโอกาสเกิด Trait ตามระดับความหายาก (Trait Chance by Rarity):
   - **Common:** 15%
   - **Rare:** 40%
   - **Epic:** 65%
   - **Legendary:** 100%
2. ปรับปรุงฟังก์ชัน `generateItem` และ `generateBossDropItem`:
   - สุ่ม Trait ให้กับทุก Slot ที่เป็น Equipment
   - กำหนดค่า `traitId` (และส่งต่อ `weaponAbilityId` สำหรับอาวุธเพื่อกันระบบเก่า Error)

### ขั้นตอนที่ 3: ปรับปรุง Battle Engine (`battleStore.ts` & `combat.ts`)
1. สร้างฟังก์ชัน Helper สำหรับดึง Trait ทั้งหมดที่สวมใส่อยู่:
   ```typescript
   const equippedTraits = getEquippedTraits(player.equippedItems);
   ```
2. **Phase 1: Player Attack Turn**
   - รัน Trait กลุ่ม `on_attack` และ `on_damage_dealt`
   - รวม Extra Damage, Lifesteal Heal, Buffs และข้อความ Log
3. **Phase 2: Boss Attack Turn / Player Defense**
   - หากบอสโจมตีโดน: รัน Trait กลุ่ม `on_take_damage` (คำนวณ Damage Reduction, Reflect Dmg, Emergency Heal/Shield)
   - หากบอสโจมตีวืด (Flee): รัน Trait กลุ่ม `on_dodge` (Counter Attack, Buff Boost)
4. อัปเดตสถานะเลือดผู้เล่น บอส และแสดงบันทึก Battle Log อย่างชัดเจน

### ขั้นตอนที่ 4: ปรับปรุงส่วนแสดงผล UI (Modals)
1. **`ItemDetailModal.tsx`**:
   - ปรับการอ่านค่า Trait: `const trait = getTraitById(item.traitId || item.weaponAbilityId)`
   - ปรับหัวข้อและสีของ Badge ให้ตรงตาม Slot เช่น *"Armor Trait"*, *"Accessory Trait"*
2. **`LootedModal.tsx`**:
   - แสดงกล่อง Trait สำหรับไอเทมทุกชิ้นที่มี `traitId` หรือ `weaponAbilityId`

### ขั้นตอนที่ 5: การทดสอบและการตรวจสอบ (Verification Checklist)
- [ ] ทดสอบสร้าง/สุ่มไอเทมทุกชิ้นส่วน (Armor, Shield, Boots, Ring, etc.) ว่าได้ Trait ตรงตามเงื่อนไข Slot
- [ ] ทดสอบว่าอาวุธเก่าหรือไอเทมที่มีอยู่เดิมในเซฟยังคงแสดงผลและใช้งาน Trait ได้ปกติ
- [ ] เข้าฉากต่อสู้กับบอส: ตรวจสอบ Log และเอฟเฟกต์สะท้อน (Reflect), หลบแล้วสวน (Dodge Counter), ลดดาเมจ (Damage Reduction)
- [ ] ตรวจสอบว่าไม่มี TypeScript Error หรือ Performance Drop ในจังหวะ Battle Loop
