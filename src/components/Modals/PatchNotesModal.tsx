export const PatchNotesModal = () => {
    return (
        <div className="w-full lg:w-1/2 p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h2 className="text-lg font-bold text-amber-400 tracking-wide">
                    Latest Updates & Patch Notes
                </h2>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                    v0.0.3
                </span>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 max-h-[450px] text-xs">
                {/* Update 5 (ใหม่ล่าสุด) */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">Transfer Protection System</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-emerald-400 font-mono">New</span>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                        Added optional Protection to Stat Transfer — spend extra materials to safeguard an item's stat from being lost if the transfer fails. Protection cost is calculated separately per item based on rarity.
                    </p>
                </div>

                {/* Update 6 */}
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

                {/* Update 7 */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">Boss Loot Fixes</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">31 Jul 2026</span>
                            <span className="text-[10px] text-amber-400 font-mono">Fix</span>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                        Fixed a bug where a single boss kill could drop multiple rarity tiers of the same item at once. Item level dropped from bosses now scales into a range above the boss's own level, rewarding tougher fights with a chance at significantly stronger gear.
                    </p>
                </div>

                {/* Update 1 */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">Marketplace System</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">30 Jul 2026</span>
                            <span className="text-[10px] text-emerald-400 font-mono">New</span>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                        Introduced the Player Marketplace system, allowing users to safely trade items, list gear, and acquire resources. (Note: You must log in with a real account to view and access the marketplace.)                    </p>
                </div>

                {/* Update 2 */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">Item Reroll System</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">30 Jul 2026</span>
                            <span className="text-[10px] text-emerald-400 font-mono">New</span>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                        Added the item reroll feature with dynamic statistical ranges, giving players a chance to optimize equipment modifiers.
                    </p>
                </div>

                {/* Update 3 */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">Random Item Rebalance</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">30 Jul 2026</span>
                            <span className="text-[10px] text-amber-400 font-mono">Balance</span>
                        </div>
                    </div>
                    <p className="text-slate-400 leading-relaxed">
                        Rebalanced random item generation, widening stat variance and adjusting scaling formulas for critical and general bonus stats to ensure a smoother progression curve.
                    </p>
                </div>

                {/* Update 4 */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">UI/UX Layout Improvements</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">30 Jul 2026</span>
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
