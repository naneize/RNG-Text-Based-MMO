import React, { useState } from 'react';
import { itemLibrary } from '../../data/itemLibrary';
import { SKILL_POOL } from '../../data/skills'; // 1. นำเข้า SKILL_POOL
import { CollectionItem } from './CollectionItem';
import type { CollectionRecord } from '../../types/game';

interface Props {
    collectionData: CollectionRecord[];
}

const CATEGORIES = ['all', 'weapon', 'armor', 'shield', 'helm', 'boots', 'cloak', 'ring', 'necklace', 'skill', 'material'] as const;
type Category = typeof CATEGORIES[number];

export const CollectionPage = ({ collectionData }: Props) => {
    const [activeCategory, setActiveCategory] = useState<Category>('all');

    // 2. รวมรายการทั้งหมดเข้าด้วยกัน
    const allItems = [...itemLibrary, ...SKILL_POOL];

    // 3. กรองไอเทมจาก allItems
    const filteredLibrary = activeCategory === 'all'
        ? allItems
        : allItems.filter(item =>
            item.slot === activeCategory || item.type === activeCategory
        );

    // 4. คำนวณความคืบหน้าโดยใช้ allItems.length
    const totalCount = allItems.length;
    const unlockedCount = collectionData.filter(r => r.isUnlocked).length;
    const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

    return (
        <div className="p-6 bg-stone-950 min-h-screen text-amber-100">
            <h1 className="text-2xl font-extrabold mb-6 text-center text-amber-400 tracking-wider">ITEM COLLECTION</h1>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-extrabold uppercase transition-all tracking-wide ${activeCategory === cat
                            ? 'bg-amber-600 text-stone-950 shadow-[0_0_12px_rgba(217,119,6,0.5)] border border-amber-400'
                            : 'bg-stone-900 text-stone-400 hover:bg-stone-800 border border-amber-950'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="max-w-md mx-auto mb-6 bg-stone-900 h-3.5 rounded-xl overflow-hidden border border-amber-950 shadow-inner p-0.5">
                <div className="bg-gradient-to-r from-amber-600 to-emerald-500 h-full rounded-lg transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" style={{ width: `${progress}%` }} />
            </div>

            <div className="text-center text-stone-400 text-sm mb-8 font-mono">
                <p>
                    COLLECTED: <span className="text-amber-400 font-extrabold">{unlockedCount}</span>
                    <span className="mx-2 text-stone-700">/</span>
                    TOTAL: <span className="text-stone-200 font-extrabold">{totalCount}</span>
                </p>
                <p className="text-[10px] mt-1 uppercase tracking-widest text-amber-500/80 font-bold">{Math.round(progress)}% COMPLETED</p>
            </div>

            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-w-5xl mx-auto">
                {filteredLibrary.map((template) => {
                    const record = collectionData.find(r => r.itemId === template.id);

                    return (
                        <CollectionItem
                            key={template.id}
                            template={template}
                            record={record}
                            isUnlocked={!!record?.isUnlocked}
                        />
                    );
                })}
            </div>
        </div>
    );
};