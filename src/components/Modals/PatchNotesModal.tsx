export const PatchNotesModal = () => {
    return (
        <div className="w-full lg:w-1/2 p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h2 className="text-lg font-bold text-amber-400 tracking-wide">
                    Latest Updates & Patch Notes
                </h2>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                    v0.0.2
                </span>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 max-h-[450px] text-xs">
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
                        Introduced the player marketplace system, allowing users to trade items, list gear, and acquire resources safely.
                    </p>
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
                        Rebalanced the RandomItem logic to ensure smoother progression curves and fair stat distribution.
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