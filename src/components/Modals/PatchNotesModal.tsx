export const PatchNotesModal = () => {
    return (
        <div className="w-full lg:w-1/2 p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h2 className="text-lg font-bold text-amber-400 tracking-wide">
                    Latest Updates & Patch Notes
                </h2>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                    v0.0.4
                </span>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 max-h-[450px] text-xs">
                {/* Update 1 (ใหม่ล่าสุดวันนี้) */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">Player Profile & Weapon Ability System</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">11 Aug 2026</span>
                            <span className="text-[10px] text-emerald-400 font-mono">New</span>
                        </div>
                    </div>
                    <ul className="text-slate-400 leading-relaxed text-xs list-disc list-inside space-y-1">
                        <li><strong className="text-slate-200">Player Profile Page:</strong> Added dedicated profile interface to track account stats, achievements, and player progress.</li>
                        <li><strong className="text-slate-200">Weapon Abilities:</strong> Weapon items now feature unique innate skills and ability passives to enhance combat strategy.</li>
                    </ul>
                </div>

                {/* Update 2 */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">Transfer Protection System</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-blue-400 font-mono">Enhancement</span>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                        Added optional Protection to Stat Transfer — spend extra materials to safeguard an item's stat from being lost if the transfer fails. Protection cost is calculated separately per item based on rarity.
                    </p>
                </div>

                {/* Update 3 */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">Stat Range Display</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-blue-400 font-mono">Enhancement</span>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                        Item detail view now shows each stat's possible min-max range alongside its rolled value, with a MAX badge highlighting perfectly rolled stats.
                    </p>
                </div>

                {/* Update 4 */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">Item Level & Boss Loot Rebalance</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-amber-400 font-mono">Balance / Fix</span>
                        </div>
                    </div>
                    <ul className="text-slate-400 leading-relaxed text-xs list-disc list-inside space-y-1">
                        <li><strong className="text-slate-200">Boss Loot Buff:</strong> Boss drops now scale up to <span className="text-cyan-400 font-mono">iLv. 1,000</span> (5x Boss Level), making boss hunting the ultimate endgame progression.</li>
                        <li><strong className="text-slate-200">Box Roll Cap:</strong> Standard item rolls are now capped at <span className="text-amber-400 font-mono">iLv. 300</span> to preserve boss farming value.</li>
                        <li><strong className="text-slate-200">Bad Luck Protection:</strong> All item rolls now guarantee a minimum of <span className="text-emerald-400 font-mono">70%</span> of the current max level range.</li>
                        <li><strong className="text-slate-200">Drop Bug Fix:</strong> Fixed a bug where a single boss kill could yield multiple rarity tiers for the same item.</li>
                    </ul>
                </div>

                {/* Update 5 */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">Marketplace System</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-emerald-400 font-mono">New</span>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                        Introduced the Player Marketplace system, allowing users to safely trade items, list gear, and acquire resources. (Note: You must log in with a real account to view and access the marketplace.)
                    </p>
                </div>

                {/* Update 6 */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">Item Reroll System</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-emerald-400 font-mono">New</span>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                        Added the item reroll feature with dynamic statistical ranges, giving players a chance to optimize equipment modifiers.
                    </p>
                </div>

                {/* Update 7 */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">Random Item Rebalance</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-amber-400 font-mono">Balance</span>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                        Rebalanced random item generation, widening stat variance and adjusting scaling formulas for critical and general bonus stats to ensure a smoother progression curve.
                    </p>
                </div>

                {/* Update 8 */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">UI/UX Layout Improvements</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-blue-400 font-mono">Enhancement</span>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                        Overhauled the main dashboard layout for better clarity, streamlined navigation, and improved overall accessibility.
                    </p>
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-500">
                    Thank you for playing! Stay tuned for more updates.
                </p>
            </div>
        </div>
    );
};