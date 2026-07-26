import { useState } from 'react';
import { useCharacterDashboard } from '../../hooks/useCharacterDashboard';
import { CombineSection } from '../Modals/CombineSection';
import { CharacterStats } from './CharacterStats';
import { EquippedGear } from './EquippedGear';
import { InventorySection } from './InventorySection';
import { LootModal } from '../../components/Modals/LootedModal';
import { ItemDetailModal } from '../../components/Modals/ItemDetailModal';
import { SkillModal } from '../../components/Modals/MaterialModal';
import { BonusDetailModal } from '../../components/Modals/BonusDetailModal';
import { TransferModal } from '../../components/Modals/TransferModal';
import { SalvageModal } from '../../components/Modals/SalvageModal';
import { WorldChat } from '../../components/WorldChat';
import type { Item } from '../../types/game';

export const CharacterDashboard = () => {
    const {
        player, finalStats, statBreakdown, selectedItem, setSelectedItem, selectedMaterial, setSelectedMaterial,
        lootedItem, setLootedItem, filter, setFilter, showCombine, setShowCombine,
        showBonusModal, setShowBonusModal, isLooting, progress, synergyBonusList,
        getCombinedBonuses, getDropChance, handleLoot, slots, filterOptions,
        filteredInventory, getRarityColor, equippedItem, equipItem, unequipItem, transferItemStat,
        epicPity, legendPity, toggleAutoLoot, isAutoActive,
    } = useCharacterDashboard();

    const [itemA, setItemA] = useState<Item | null>(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [itemToSalvage, setItemToSalvage] = useState<Item | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-900 rounded-xl border border-slate-700 shadow-xl">

                {/* 📌 คอลัมน์ที่ 1: CharacterStats + ปุ่ม World Chat (รวมอยู่ในกล่องเดียว) */}
                <div className="flex flex-col gap-4">
                    <CharacterStats
                        player={player}
                        finalStats={finalStats}
                        statBreakdown={statBreakdown}
                        setShowBonusModal={setShowBonusModal}
                    />

                    {/* ปุ่มเปิด World Chat ใต้กล่อง Stat */}
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                        <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                        World Chat
                    </button>
                </div>

                {/* 📌 คอลัมน์ที่ 2: EquippedGear */}
                <EquippedGear
                    player={player}
                    slots={slots}
                    getRarityColor={getRarityColor}
                    unequipItem={unequipItem}
                    synergyBonusList={synergyBonusList}
                    setShowCombine={setShowCombine}
                />

                {/* 📌 คอลัมน์ที่ 3: InventorySection */}
                <InventorySection
                    player={player}
                    filterOptions={filterOptions}
                    filter={filter}
                    setFilter={setFilter}
                    filteredInventory={filteredInventory}
                    setSelectedMaterial={setSelectedMaterial}
                    setSelectedItem={setSelectedItem}
                    getRarityColor={getRarityColor}
                    unequipItem={unequipItem}
                    isLooting={isLooting}
                    progress={progress}
                    handleLoot={handleLoot}
                    epicPity={epicPity}
                    legendPity={legendPity}
                    isAutoActive={isAutoActive}
                    toggleAutoLoot={toggleAutoLoot}
                />

            </div>

            {showCombine && <CombineSection onClose={() => setShowCombine(false)} />}
            {lootedItem && (
                <LootModal
                    lootedItem={lootedItem}
                    setLootedItem={setLootedItem}
                    getDropChance={getDropChance}
                />
            )}
            {selectedItem && (
                <ItemDetailModal
                    selectedItem={selectedItem}
                    setSelectedItem={setSelectedItem}
                    getRarityColor={getRarityColor}
                    getDropChance={getDropChance}
                    equippedInSlot={equippedItem}
                    equipItem={equipItem}
                    onTransferClick={() => {
                        setItemA(selectedItem);
                        setIsTransferModalOpen(true);
                        setSelectedItem(null);
                    }}
                    onSalvageClick={(item) => {
                        setItemToSalvage(item);
                        setSelectedItem(null);
                    }}
                />
            )}

            {isTransferModalOpen && (
                <TransferModal
                    itemA={itemA}
                    inventory={filteredInventory}
                    getRarityColor={getRarityColor}
                    onClose={() => setIsTransferModalOpen(false)}
                    onConfirmTransfer={(itemB, statA, statB) => {
                        transferItemStat(itemA!, itemB, statA, statB);
                        setIsTransferModalOpen(false);
                    }}
                />
            )}

            {selectedMaterial && (
                <SkillModal
                    selectedSkill={selectedMaterial}
                    setSelectedSkill={setSelectedMaterial}
                />
            )}
            {showBonusModal && (
                <BonusDetailModal
                    setShowBonusModal={setShowBonusModal}
                    getCombinedBonuses={getCombinedBonuses}
                    equippedItems={player.equippedItems}
                />
            )}

            {itemToSalvage && (
                <SalvageModal
                    item={itemToSalvage}
                    onClose={() => setItemToSalvage(null)}
                    getRarityColor={getRarityColor}
                />
            )}


            {/* 🖥️ Modal หน้าต่าง World Chat แบบเด้งขึ้นมาทับหน้าจอ */}
            {isChatOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <WorldChat onClose={() => setIsChatOpen(false)} />
                </div>
            )}
        </div>
    );
};