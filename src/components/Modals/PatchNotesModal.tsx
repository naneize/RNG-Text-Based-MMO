export const PatchNotesModal = () => {
    return (
        <div className="w-full lg:w-1/2 p-6 bg-stone-950/80 backdrop-blur-lg rounded-xl border border-amber-600/30 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col font-serif">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-900/30">
                <h2 className="text-lg font-bold text-amber-100 tracking-wider uppercase font-sans">
                    Latest Updates & Patch Notes
                </h2>
                <span className="text-xs font-mono text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded-md border border-amber-800/50 shadow-sm">
                    v0.0.5
                </span>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 max-h-[450px] text-xs">
                {/* Update v0.0.5 — ใหม่ล่าสุด */}
                <div className="p-3 bg-stone-900/90 rounded-lg border border-amber-900/40 space-y-1.5 shadow-inner">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-100 text-sm font-sans">Living Sets, Item Lock & Dark Fantasy Overhaul</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-amber-500/70 font-mono">22 Aug 2026</span>
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">New</span>
                        </div>
                    </div>
                    <ul className="text-amber-200/70 leading-relaxed text-xs list-disc list-inside space-y-1">
                        <li><strong className="text-amber-100">Living Sets:</strong> Equip matching gear pieces to unlock powerful set bonuses. Sets are assembled from items you already roll every day — no special drops required — and bonuses <strong className="text-amber-100">scale with the average item level</strong> of the pieces you wear, so your set grows with you. Two launch sets: <span className="text-amber-300">Berserker&apos;s Hunger</span> (offense) and <span className="text-amber-300">Warden&apos;s Oath</span> (defense).</li>
                        <li><strong className="text-amber-100">Item Lock:</strong> Lock precious items with the padlock icon to protect them from accidental salvage — locked items are always skipped by single and bulk salvage.</li>
                        <li><strong className="text-amber-100">Dark Fantasy Visual Overhaul:</strong> Rebuilt the entire theme around warm candlelight gold, engraved-stone typography, glowing gold CTA buttons, and brand-new title &amp; login screens.</li>
                        <li><strong className="text-amber-100">Getting Started Quests:</strong> The starter quest panel now shows progress, upcoming rewards before you claim them, and a Go button that takes you straight to where the quest is done.</li>
                        <li><strong className="text-amber-100">Battle Screen Readability:</strong> Darker overlay, gold-trimmed panels, and HP bars that stay readable on every boss background.</li>
                        <li><strong className="text-amber-400">Fix — Guaranteed Rewards:</strong> Quest rewards that specify an exact item are now truly guaranteed (previously a 25% chance to receive a random skill/material instead).</li>
                        <li><strong className="text-amber-400">Fix — Helm HP Ranges:</strong> Helm Max HP stat ranges now display and reroll using the correct formula (values were shown as double the real range).</li>
                        <li><strong className="text-amber-400">Fix — Legacy Icons:</strong> Items saved with old icon paths now update automatically when you load the game.</li>
                    </ul>
                </div>

                {/* Update 1 (ก่อนหน้า) */}
                <div className="p-3 bg-stone-900/90 rounded-lg border border-amber-900/40 space-y-1.5 shadow-inner">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-100 text-sm font-sans">Player Profile & Weapon Ability System</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-amber-500/70 font-mono">11 Aug 2026</span>
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">New</span>
                        </div>
                    </div>
                    <ul className="text-amber-200/70 leading-relaxed text-xs list-disc list-inside space-y-1">
                        <li><strong className="text-amber-100">Player Profile Page:</strong> Added dedicated profile interface to track account stats, achievements, and player progress.</li>
                        <li><strong className="text-amber-100">Weapon Abilities:</strong> Weapon items now feature unique innate skills and ability passives to enhance combat strategy.</li>
                    </ul>
                </div>

                {/* Update 2 */}
                <div className="p-3 bg-stone-900/90 rounded-lg border border-amber-900/40 space-y-1.5 shadow-inner">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-100 text-sm font-sans">Transfer Protection System</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-amber-500/70 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-amber-300 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/50">Enhancement</span>
                        </div>
                    </div>
                    <p className="text-amber-200/70 leading-relaxed">
                        Added optional Protection to Stat Transfer — spend extra materials to safeguard an item&apos;s stat from being lost if the transfer fails. Protection cost is calculated separately per item based on rarity.
                    </p>
                </div>

                {/* Update 3 */}
                <div className="p-3 bg-stone-900/90 rounded-lg border border-amber-900/40 space-y-1.5 shadow-inner">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-100 text-sm font-sans">Stat Range Display</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-amber-500/70 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-amber-300 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/50">Enhancement</span>
                        </div>
                    </div>
                    <p className="text-amber-200/70 leading-relaxed">
                        Item detail view now shows each stat&apos;s possible min-max range alongside its rolled value, with a MAX badge highlighting perfectly rolled stats.
                    </p>
                </div>

                {/* Update 4 */}
                <div className="p-3 bg-stone-900/90 rounded-lg border border-amber-900/40 space-y-1.5 shadow-inner">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-100 text-sm font-sans">Item Level & Boss Loot Rebalance</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-amber-500/70 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">Balance / Fix</span>
                        </div>
                    </div>
                    <ul className="text-amber-200/70 leading-relaxed text-xs list-disc list-inside space-y-1">
                        <li><strong className="text-amber-100">Boss Loot Buff:</strong> Boss drops now scale up to <span className="text-amber-300 font-mono">iLv. 1,000</span> (5x Boss Level), making boss hunting the ultimate endgame progression.</li>
                        <li><strong className="text-amber-100">Box Roll Cap:</strong> Standard item rolls are now capped at <span className="text-amber-400 font-mono">iLv. 300</span> to preserve boss farming value.</li>
                        <li><strong className="text-amber-100">Bad Luck Protection:</strong> All item rolls now guarantee a minimum of <span className="text-emerald-400 font-mono">70%</span> of the current max level range.</li>
                        <li><strong className="text-amber-100">Drop Bug Fix:</strong> Fixed a bug where a single boss kill could yield multiple rarity tiers for the same item.</li>
                    </ul>
                </div>

                {/* Update 5 */}
                <div className="p-3 bg-stone-900/90 rounded-lg border border-amber-900/40 space-y-1.5 shadow-inner">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-100 text-sm font-sans">Marketplace System</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-amber-500/70 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">New</span>
                        </div>
                    </div>
                    <p className="text-amber-200/70 leading-relaxed">
                        Introduced the Player Marketplace system, allowing users to safely trade items, list gear, and acquire resources. (Note: You must log in with a real account to view and access the marketplace.)
                    </p>
                </div>

                {/* Update 6 */}
                <div className="p-3 bg-stone-900/90 rounded-lg border border-amber-900/40 space-y-1.5 shadow-inner">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-100 text-sm font-sans">Item Reroll System</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-amber-500/70 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">New</span>
                        </div>
                    </div>
                    <p className="text-amber-200/70 leading-relaxed">
                        Added the item reroll feature with dynamic statistical ranges, giving players a chance to optimize equipment modifiers.
                    </p>
                </div>

                {/* Update 7 */}
                <div className="p-3 bg-stone-900/90 rounded-lg border border-amber-900/40 space-y-1.5 shadow-inner">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-100 text-sm font-sans">Random Item Rebalance</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-amber-500/70 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">Balance</span>
                        </div>
                    </div>
                    <p className="text-amber-200/70 leading-relaxed">
                        Rebalanced random item generation, widening stat variance and adjusting scaling formulas for critical and general bonus stats to ensure a smoother progression curve.
                    </p>
                </div>

                {/* Update 8 */}
                <div className="p-3 bg-stone-900/90 rounded-lg border border-amber-900/40 space-y-1.5 shadow-inner">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-amber-100 text-sm font-sans">UI/UX Layout Improvements</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-amber-500/70 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-amber-300 font-mono bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/50">Enhancement</span>
                        </div>
                    </div>
                    <p className="text-amber-200/70 leading-relaxed">
                        Overhauled the main dashboard layout for better clarity, streamlined navigation, and improved overall accessibility.
                    </p>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-900/30 text-center">
                <p className="text-[11px] text-amber-500/60 font-sans">
                    Thank you for playing! Stay tuned for more updates.
                </p>
            </div>
        </div>
    );
};