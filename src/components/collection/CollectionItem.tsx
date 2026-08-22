import React, { useState } from 'react';
import type { ItemTemplate, CollectionRecord } from '../../types/game';
import { CollectionModal } from '../Modals/CollectionModal';

interface Props {
    template: ItemTemplate;
    record: CollectionRecord | undefined;
    isUnlocked: boolean;
}

export const CollectionItem = ({ template, record, isUnlocked }: Props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div
                className={`p-3 rounded-xl border transition-all duration-300 ${isUnlocked
                        ? 'bg-stone-900 border-amber-800/60 hover:border-amber-500 hover:bg-stone-800/80 shadow-[0_0_10px_rgba(120,53,15,0.15)]'
                        : 'bg-stone-950/60 border-stone-900 opacity-40 grayscale hover:opacity-60'
                    }`}
                onClick={() => isUnlocked && setIsModalOpen(true)}
            >
                <img
                    src={template.icon}
                    alt={template.name}
                    className={`w-12 h-12 mx-auto mb-2 transition-all drop-shadow ${!isUnlocked ? 'brightness-50' : ''}`}
                />

                {/* ชื่อไอเทม */}
                <h3 className={`text-[10px] font-extrabold text-center uppercase truncate tracking-wide ${isUnlocked ? 'text-amber-100' : 'text-stone-600'}`}>
                    {template.name}
                </h3>

                {/* 🟢 ซ่อนทั้ง Material และ Skill */}
                {isUnlocked && record && template.type !== 'material' && template.type !== 'skill' && (
                    <p className="text-[9px] text-center text-amber-500 mt-1 font-mono font-bold">
                        FOUND: <span className="text-amber-200">{record.foundCount}</span>
                    </p>
                )}
            </div>

            {isModalOpen && (
                <CollectionModal
                    template={template}
                    record={record}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
};