import React from 'react';
import type { ItemTemplate, CollectionRecord, Item } from '../../types/game';

interface Props {
    template: ItemTemplate;
    record: CollectionRecord | undefined;
    onClose: () => void;
}

export const CollectionModal = ({ template, record, onClose }: Props) => {
    if (!record) return null;

    // เช็กว่าเป็นวัสดุหรือไม่
    const isMaterial = template.type === 'material';
    const isSkill = template.type === 'skill';
    const skillData = template as Item;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-cyan-400">{template.name.toUpperCase()}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <img src={template.icon} alt={template.name} className="w-20 h-20 bg-slate-800 p-2 rounded border border-slate-700" />
                    <div>
                        <p className="text-sm text-slate-400">Total Found</p>
                        <p className="text-2xl font-bold text-white">{record.foundCount}</p>
                    </div>
                </div>

                {/* แสดง Stats และ Bonus เฉพาะถ้าไม่ใช่ Material */}
                {!isMaterial && (
                    <>
                        {/* ส่วนของอุปกรณ์ (Equipment) */}
                        {!isSkill && record.bestStats && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-slate-500 mb-2 border-b border-slate-800 pb-1">BEST STATS RECORD</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(record.bestStats).map(([key, value]) => (
                                        <div key={key} className="bg-slate-800 p-2 rounded text-center">
                                            <p className="text-[10px] text-slate-400 uppercase">{key}</p>
                                            <p className="text-emerald-400 font-bold">{value as number}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ส่วนของสกิล (Skill) */}
                        {isSkill && (
                            <div className="mb-6 bg-cyan-900/20 border border-cyan-800 p-3 rounded">
                                <h3 className="text-xs font-bold text-cyan-500 mb-2 border-b border-cyan-800 pb-1">SKILL DATA</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-slate-400 uppercase">Power Effect</p>
                                        <p className="text-cyan-400 font-bold text-lg">{skillData.effectPower || 0}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-[10px] text-slate-400 uppercase">Trigger Chance</p>
                                        <p className="text-cyan-400 font-bold text-lg">{skillData.effectChance || 0}%</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ส่วนของโบนัส (ใช้ร่วมกันได้ถ้าสกิลมีโบนัส) */}
                        {(record.bestElementBonus || record.bestRaceBonus) && (
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 mb-2 border-b border-slate-800 pb-1">BEST BONUSES</h3>
                                <div className="flex gap-2">
                                    {record.bestElementBonus && (
                                        <div className="bg-orange-900/30 border border-orange-700 p-2 rounded text-[10px] flex-1">
                                            <p className="text-orange-400">{record.bestElementBonus.type}</p>
                                            <p className="font-bold">+{record.bestElementBonus.value}</p>
                                        </div>
                                    )}
                                    {record.bestRaceBonus && (
                                        <div className="bg-purple-900/30 border border-purple-700 p-2 rounded text-[10px] flex-1">
                                            <p className="text-purple-400">{record.bestRaceBonus.type}</p>
                                            <p className="font-bold">+{record.bestRaceBonus.value}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};