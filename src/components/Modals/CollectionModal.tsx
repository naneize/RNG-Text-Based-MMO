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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            {/* ปรับให้กว้างขึ้นเป็น max-w-2xl เพื่อรองรับแบบ 2 คอลัมน์ */}
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>

                {/* ส่วนหัว Modal */}
                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-cyan-400">{template.name.toUpperCase()}</h2>
                        <span className="inline-block bg-slate-800 text-cyan-400 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest border border-cyan-900/50">
                            {template.type || template.slot || 'ITEM'}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl cursor-pointer">✕</button>
                </div>

                {/* เนื้อหาแบ่งเป็น 2 คอลัมน์ (ซ้าย: รูปภาพ/ข้อมูลทั่วไป, ขวา: Stats/Bonuses) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                    {/* ฝั่งซ้าย: รูปภาพและ Total Found */}
                    <div className="md:col-span-4 flex flex-col items-center justify-center bg-slate-950/40 p-4 rounded-lg border border-slate-800/60 text-center">
                        <div className="mb-4">
                            <img
                                src={template.icon}
                                alt={template.name}
                                className="w-36 h-36 mx-auto object-contain drop-shadow-lg"
                            />
                        </div>

                        {template.type !== 'material' && template.type !== 'skill' && template.slot !== 'material' && template.slot !== 'skill' && (
                            <div className="w-full bg-slate-900/80 p-2.5 rounded border border-slate-800">
                                <p className="text-slate-400 text-[10px] uppercase tracking-wider">Total Found</p>
                                <p className="text-2xl font-bold text-white">{record?.foundCount || 0}</p>
                            </div>
                        )}
                    </div>

                    {/* ฝั่งขวา: Stats, Skill Data และ Bonuses */}
                    <div className="md:col-span-8 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        {!isMaterial && (
                            <>
                                {/* ส่วนของอุปกรณ์ (Equipment Best Stats) */}
                                {!isSkill && record.bestStats && (
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 mb-2 border-b border-slate-800 pb-1">BEST STATS RECORD</h3>
                                        <div className="grid grid-cols-3 gap-2">
                                            {Object.entries(record.bestStats).map(([key, value]) => (
                                                <div key={key} className="bg-slate-800/80 p-2 rounded text-center border border-slate-700/50">
                                                    <p className="text-[10px] text-slate-400 uppercase">{key}</p>
                                                    <p className="text-emerald-400 font-bold text-sm">{value as number}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ส่วนของสกิล (Skill Data) */}
                                {isSkill && (
                                    <div className="bg-cyan-900/20 border border-cyan-800/60 p-3 rounded text-left">
                                        <h3 className="text-xs font-bold text-cyan-400 mb-2 border-b border-cyan-800 pb-1">SKILL DATA</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] text-slate-400 uppercase">Power Effect</p>
                                                <p className="text-cyan-400 font-bold text-base">{skillData.effectPower || 0}</p>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] text-slate-400 uppercase">Trigger Chance</p>
                                                <p className="text-cyan-400 font-bold text-base">{skillData.effectChance || 0}%</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ส่วนของโบนัส (Best Bonuses) */}
                                {(record.bestElementBonus || record.bestRaceBonus) && (
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 mb-2 border-b border-slate-800 pb-1">BEST BONUSES</h3>
                                        <div className="flex gap-2">
                                            {record.bestElementBonus && (
                                                <div className="bg-orange-900/30 border border-orange-700/60 p-2 rounded text-[10px] flex-1">
                                                    <p className="text-orange-400 font-medium">{record.bestElementBonus.type}</p>
                                                    <p className="font-bold text-sm">+{record.bestElementBonus.value}</p>
                                                </div>
                                            )}
                                            {record.bestRaceBonus && (
                                                <div className="bg-purple-900/30 border border-purple-700/60 p-2 rounded text-[10px] flex-1">
                                                    <p className="text-purple-400 font-medium">{record.bestRaceBonus.type}</p>
                                                    <p className="font-bold text-sm">+{record.bestRaceBonus.value}</p>
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
                <div className="mt-6 pt-3 border-t border-slate-800">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold text-white transition-all cursor-pointer text-sm"
                    >
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
};