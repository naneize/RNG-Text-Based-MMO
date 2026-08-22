import React, { useState, useEffect } from 'react';

interface DidYouKnowModalProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const tips = [
    "💡 Don't forget to complete the starter quests to claim free materials and learn the basic game systems!",
    "💡 The maximum item level cap from regular rolling is 300, but you can unlock higher limits by defeating the boss in the boss lobby!",
    "💡 Focus on upgrading your character stats regularly to clear higher dungeon levels much faster.",
    "💡 Log in with Gmail to access the Marketplace and trade your unwanted items with other players!",
    "💡 You can upload your own custom image as your character avatar with auto-resize support!",
    "💡 You can use protection items during Stat Transfer by using additional materials to prevent your equipment or stats from being lost permanently on failure!",
    "💡 You can use Stat Reroll with additional materials to optimize your equipment stats, and enable Safety Lock to keep the old stat if the new one is worse!",
    "💡 Keeping your character data clean and checking your online status ensures the system tracks your progress accurately.",
    "💡 You can enable Auto Roll / Autofarm to continuously gather items and materials automatically while you are away!",
    "💡 The background farming system keeps working even when you are managing your inventory or checking other menus.",
    "💡 Study the boss's Element, Race, and Weakness carefully before battle to gain the upper hand and deal massive damage!",
    "💡 Weapons can roll special Weapon Abilities — from extra strikes and lifesteal to armor-piercing hits and enemy stuns. Check your weapon's details to see if it has one!",
    "💡 Check your Combat Power (CP) before challenging a boss — each boss shows a recommended CP so you'll know if you're ready or need to gear up more first.",
    "💡 Don't just hoard unwanted items — Salvage them into crafting materials instead! Higher rarity items have a better chance of yielding rare materials.",
    "💡 Each material serves a different purpose — Iron Ore rerolls ATK/DEF, Magic Dust rerolls core stats like STR/AGI/LUK, and Ancient Rune powers Stat Transfer Protection. Save the right ones for the right job!",
    "💡 Void Essence and Celestial Shard aren't just loot — use them to reroll an item's Element and Race bonuses if you're chasing the perfect match for your build!",
    "💡 Out of the exact material you need? Primordial Essence can substitute for almost any reroll material — at a steeper cost, but it's a great emergency backup!",
    "💡 Boss-dropped gear can roll up to 5x the boss's own level — the tougher the fight, the higher the ceiling for what you can earn!",
    "💡 Bosses come in different combat styles — some are tanky, some hit hard, some dodge everything, and some rarely miss. Check a boss's stats before you commit to a strategy!",
    "💡 The Marketplace isn't limited to Gold Ore — sellers can choose different materials as payment, so keep an eye out for listings that accept what you're stockpiling!",
    "💡 Completed achievements can reward more than materials — some unlock exclusive titles and profile frames to show off!",
    "💡 Reaching the maximum limit for Crit Rate, Crit Dmg, Flee, or HIT will automatically convert your excess stats into other powerful combat bonuses!",
    "💡 Pushing your main stats beyond standard limits helps maximize your secondary attributes like Attack, Defense, and Resistances.",
    "💡 STR and DEX both increase your ATK power, while DEX also helps boost your HIT accuracy.",
    "💡 Upgrading VIT increases your DEF, Max HP, and M.RES to make you much tankier.",
    "💡 Increasing AGI and LUK enhances your Flee rate to dodge enemy attacks effectively.",
    "💡 Boosting INT improves your RES defenses and directly amplifies your Skill Power."
];

export const DidYouKnowModal: React.FC<DidYouKnowModalProps> = ({
    isOpen: externalIsOpen,
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [currentTip, setCurrentTip] = useState('');

    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

    // ⏱️ ระบบตั้งเวลาสุ่มเด้งอัตโนมัติ (1 นาที)
    useEffect(() => {
        const intervalTime = 5 * 60 * 1000;

        const timer = setInterval(() => {
            const randomIndex = Math.floor(Math.random() * tips.length);
            setCurrentTip(tips[randomIndex]);
            setInternalIsOpen(true);

            // ซ่อนอัตโนมัติหลังจากแสดงขึ้นมา 15 วินาที
            const autoCloseTimer = setTimeout(() => {
                setInternalIsOpen(false);
            }, 15000);

            return () => clearTimeout(autoCloseTimer);
        }, intervalTime);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (isOpen && !currentTip) {
            const randomIndex = Math.floor(Math.random() * tips.length);
            setCurrentTip(tips[randomIndex]);
        }
    }, [isOpen, currentTip]);

    if (!isOpen) return null;

    return (
        <div className="fixed top-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-5 duration-300 pointer-events-none">
            {/* กล่องหลักสไตล์ Dark Fantasy UI */}
            <div className="bg-stone-950/90 backdrop-blur-xl border-2 border-amber-500/50 rounded-2xl p-4 shadow-[0_0_25px_rgba(245,158,11,0.15)] text-white relative pointer-events-auto overflow-hidden">

                {/* แสงเรืองรองพื้นหลังมุมขวาบน */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex items-start gap-3.5 relative z-10">

                    {/* ไอคอนแบบไม่มีกรอบซ้อน ปล่อยลอยเด่น */}
                    <div className="shrink-0 pt-0.5">
                        <img
                            src="./Icons/Backgrounds/note.png"
                            alt="Note Icon"
                            className="w-10 h-10 object-contain drop-shadow-[0_2px_6px_rgba(245,158,11,0.4)]"
                        />
                    </div>

                    {/* ส่วนเนื้อหาข้อความ */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-extrabold tracking-wide text-amber-400 uppercase drop-shadow">
                                Adventurer's Note
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-100 border border-amber-500/30 font-medium">
                                Tip
                            </span>
                        </div>
                        <p className="text-amber-200 text-xs md:text-sm leading-relaxed font-normal">
                            {currentTip || tips[0]}
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
};