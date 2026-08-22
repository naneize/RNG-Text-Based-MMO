import React from 'react';
import type { ItemTemplate, CollectionRecord, Item } from '../../types/game';

interface Props {
    template: ItemTemplate;
    record: CollectionRecord | undefined;
    onClose: () => void;
}

export const CollectionModal = ({ template, record, onClose }: Props) => {
    if (!record) return null;

    const isMaterial = template.type === 'material';
    const isSkill = template.type === 'skill';
    const skillData = template as Item;

    return (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            {/* กล่อง Modal ธีม Dark Fantasy (slate + amber) */}
            <div className="bg-stone-900 border border-amber-600/40 p-6 rounded-2xl max-w-2xl w-full shadow-[0_0_30px_rgba(217,119,6,0.15)] relative overflow-hidden" onClick={(e) => e.stopPropagation()}>

                {/* แสงเรืองแสงตกแต่งมุมกล่อง (Ornamental Glow) */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

                {/* ส่วนหัว Modal */}
                <div className="flex justify-between items-center mb-5 border-b border-amber-950 pb-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-extrabold text-amber-400 tracking-wider">{template.name.toUpperCase()}</h2>
                        <span className="inline-block bg-amber-950/60 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-widest border border-amber-800/50">
                            {template.type || template.slot || 'ITEM'}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-amber-400 text-xl font-bold transition cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-800 border border-transparent hover:border-amber-900/40"
                    >
                        ✕
                    </button>
                </div>

                {/* เนื้อหาแบ่งเป็น 2 คอลัมน์ (ซ้าย: รูปภาพ/ข้อมูลทั่วไป, ขวา: Stats/Bonuses) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                    {/* ฝั่งซ้าย: รูปภาพและ Total Found */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center bg-stone-950/60 p-4 rounded-xl border border-amber-950/60 text-center shadow-inner">
                        <div className="mb-4 relative">
                            <div className="absolute inset-0 bg-amber-500/5 rounded-full blur-md" />
                            <img
                                src={template.icon}
                                alt={template.name}
                                className="w-32 h-32 mx-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] relative z-10"
                            />
                        </div>

                        {template.type !== 'material' && template.type !== 'skill' && template.slot !== 'material' && template.slot !== 'skill' && (
                            <div className="w-full bg-stone-900/90 p-2.5 rounded-lg border border-amber-950/80 shadow-sm">
                                <p className="text-stone-400 text-[10px] uppercase tracking-widest font-mono">Total Found</p>
                                <p className="text-2xl font-black text-amber-400 font-mono mt-0.5">{record?.foundCount || 0}</p>
                            </div>
                        )}
                    </div>

                    {/* ฝั่งขวา: Stats, Skill Data และ Bonuses */}
                    <div className="md:col-span-8 space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                        {!isMaterial && (
                            <>
                                {/* ส่วนของอุปกรณ์ (Equipment Best Stats) */}
                                {!isSkill && record.bestStats && (
                                    <div>
                                        <h3 className="text-xs font-bold text-amber-500/80 mb-2 border-b border-amber-950 pb-1 tracking-wider">BEST STATS RECORD</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {Object.entries(record.bestStats).map(([key, value]) => (
                                                <div key={key} className="bg-stone-950/50 p-2.5 rounded-lg text-center border border-amber-950/50 shadow-sm">
                                                    <p className="text-[10px] text-amber-600 uppercase font-mono font-bold">{key}</p>
                                                    <p className="text-amber-100 font-black text-sm font-mono mt-0.5">{value as number}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ส่วนของสกิล (Skill Data) */}
                                {isSkill && (
                                    <div className="bg-amber-950/20 border border-amber-800/40 p-3.5 rounded-xl text-left shadow-inner">
                                        <h3 className="text-xs font-extrabold text-amber-400 mb-2 border-b border-amber-900/40 pb-1 tracking-wider">SKILL DATA</h3>
                                        <div className="space-y-2.5 font-mono">
                                            <div className="flex justify-between items-center bg-stone-950/40 px-3 py-2 rounded-lg border border-amber-950/40">
                                                <p className="text-[10px] text-stone-400 uppercase">Power Effect</p>
                                                <p className="text-amber-400 font-bold text-base">{skillData.effectPower || 0}</p>
                                            </div>
                                            <div className="flex justify-between items-center bg-stone-950/40 px-3 py-2 rounded-lg border border-amber-950/40">
                                                <p className="text-[10px] text-stone-400 uppercase">Trigger Chance</p>
                                                <p className="text-amber-400 font-bold text-base">{skillData.effectChance || 0}%</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ส่วนของโบนัส (Best Bonuses) */}
                                {(record.bestElementBonus || record.bestRaceBonus) && (
                                    <div>
                                        <h3 className="text-xs font-bold text-amber-500/80 mb-2 border-b border-amber-950 pb-1 tracking-wider">BEST BONUSES</h3>
                                        <div className="flex gap-2">
                                            {record.bestElementBonus && (
                                                <div className="bg-orange-950/30 border border-orange-700/40 p-2.5 rounded-xl text-[10px] flex-1 shadow-sm">
                                                    <p className="text-orange-400 font-semibold tracking-wide">{record.bestElementBonus.type}</p>
                                                    <p className="font-black text-sm font-mono text-orange-200 mt-0.5">+{record.bestElementBonus.value}</p>
                                                </div>
                                            )}
                                            {record.bestRaceBonus && (
                                                <div className="bg-purple-950/30 border border-purple-700/40 p-2.5 rounded-xl text-[10px] flex-1 shadow-sm">
                                                    <p className="text-purple-400 font-semibold tracking-wide">{record.bestRaceBonus.type}</p>
                                                    <p className="font-black text-sm font-mono text-purple-200 mt-0.5">+{record.bestRaceBonus.value}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ปุ่มปิดด้านล่าง */}
                <div className="mt-6 pt-3 border-t border-amber-950">
                    <button
                        onClick={onClose}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 py-2.5 rounded-xl font-extrabold transition-all duration-200 cursor-pointer text-xs uppercase tracking-widest shadow-[0_0_12px_rgba(217,119,6,0.3)] border border-amber-400"
                    >
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
};