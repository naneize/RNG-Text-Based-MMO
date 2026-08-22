import { useState } from 'react';
import { useCharacterDashboard } from '../../hooks/useCharacterDashboard';
import { CombineSection } from '../Modals/CombineSection';
import { CharacterStats } from './CharacterStats';
import { EquippedGear } from './EquippedGear';
import { InventorySection } from './InventorySection';
import { LootModal } from '../../components/Modals/LootedModal';
import { ItemDetailModal } from '../../components/Modals/ItemDetailModal';
import { MaterialModal } from '../../components/Modals/MaterialModal';
import { BonusDetailModal } from '../../components/Modals/BonusDetailModal';
import { TransferModal } from '../../components/Modals/TransferModal';
import { SalvageModal } from '../../components/Modals/SalvageModal';
import { WorldChat } from '../../components/WorldChat';
import { Leaderboard } from '../../components/Leaderboard';
import { useChatStore } from '../../store/chatStore';
import type { Item } from '../../types/game';
import { SkillModal } from '../../components/Modals/SkillModal';
import { SellItemModal } from '../../components/Marketplace/SellItemModal';
import { RerollModal } from '../Modals/RerollModal';
import { StarterQuestPanel } from '../StarterQuestPanel';
import { DidYouKnowModal } from '../Modals/DidYouKnowModal';

export const CharacterDashboard = () => {
    const {
        player, finalStats, statBreakdown, selectedItem, setSelectedItem, selectedMaterial, setSelectedMaterial,
        lootedItem, setLootedItem, filter, setFilter, showCombine, setShowCombine,
        showBonusModal, setShowBonusModal, isLooting, progress, synergyBonusList,
        getCombinedBonuses, getDropChance, handleLoot, slots, filterOptions,
        filteredInventory, getRarityColor, equipItem, unequipItem, transferItemStat,
        epicPity, legendPity, toggleAutoLoot, isAutoActive, totalOpens, handleSellItem
    } = useCharacterDashboard();

    const [itemA, setItemA] = useState<Item | null>(null);
    const [isSellModalOpen, setIsSellModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [itemToSalvage, setItemToSalvage] = useState<Item | null>(null);
    const [itemToReroll, setItemToReroll] = useState<Item | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState<{ name: string; level: number } | null>(null);
    const { shareStatsToChat } = useChatStore();


    return (
        <div className="flex flex-col gap-4">

            {/* 👇 นำ StarterQuestPanel มาวางไว้ตรงนี้ เป็นบรรทัดแรกสุดของหน้าจอเลยครับ! */}
            <StarterQuestPanel />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-stone-950 border border-amber-950/50 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-xl">
                {/* 📌 คอลัมน์ที่ 1: CharacterStats + ปุ่ม World Chat (รวมอยู่ในกล่องเดียว) */}
                <div className="flex flex-col gap-4">

                    <CharacterStats
                        player={player}
                        finalStats={finalStats}
                        statBreakdown={statBreakdown}
                        setShowBonusModal={setShowBonusModal}
                    />

                    {/* 🌍 World Chat (สไตล์ Slate เรียบหรู + จุดกระพริบสีเขียวบอกสถานะออนไลน์) */}
                    {/* 🌍 World Chat Button (ธีม Crimson & Amber) */}
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="w-full py-3 px-4 bg-stone-950 hover:bg-amber-950/40 text-amber-200 hover:text-amber-100 font-extrabold rounded-xl border border-amber-900/60 hover:border-amber-600 shadow-lg shadow-amber-950/20 transition flex items-center justify-center gap-2 cursor-pointer group"
                    >
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse group-hover:scale-110 transition-transform"></span>
                        <span className="tracking-wide">WORLD CHAT</span>
                    </button>

                    {/* 🏆 Leaderboard Button (ธีม Crimson & Amber) */}
                    <button
                        onClick={() => setIsLeaderboardOpen(true)}
                        className="w-full py-3 px-4 bg-stone-950 hover:bg-amber-950/40 text-amber-200 hover:text-amber-100 font-extrabold rounded-xl border border-amber-900/60 hover:border-amber-600 shadow-lg shadow-amber-950/20 transition flex items-center justify-center gap-2 cursor-pointer group"
                    >
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse group-hover:scale-110 transition-transform"></span>
                        <span className="tracking-wide">LEADERBOARD</span>
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
                    totalRoll={totalOpens}
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
                    equippedInSlot={
                        player.equippedItems[
                        selectedItem.slot === 'helm' ? 'helmet' : selectedItem.slot as keyof typeof player.equippedItems
                        ]
                    }
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
                    onRerollClick={(item) => {
                        setItemToReroll(item);
                        setSelectedItem(null);
                    }}
                    onShareToChat={async (item) => {
                        setIsChatOpen(true);
                        try {
                            const chatStore = useChatStore.getState();
                            await chatStore.sendMessage(`Shared Item :`, item);
                        } catch (error) {
                            console.error("Failed to share item to chat:", error);
                        }
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
                        transferItemStat(itemA!, itemB, statA as keyof typeof player.baseStats, statB as keyof typeof player.baseStats);
                        setIsTransferModalOpen(false);
                    }}
                />
            )}

            {selectedSkill && (
                <SkillModal
                    selectedSkill={selectedSkill}
                    setSelectedSkill={setSelectedSkill}
                />
            )}

            {/* สำหรับแสดง Material (Celestial Shard ฯลฯ) */}
            {selectedMaterial && (
                <MaterialModal
                    selectedMaterial={selectedMaterial}
                    setSelectedMaterial={setSelectedMaterial}
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

            {/* 👇 3. เพิ่มการแสดงผล RerollModal ไว้ตรงนี้ */}
            {itemToReroll && (
                <RerollModal
                    item={itemToReroll}
                    onClose={() => setItemToReroll(null)}
                    getRarityColor={getRarityColor}
                />
            )}


            {/* 🖥️ Modal หน้าต่าง World Chat */}
            {isChatOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <WorldChat
                        onClose={() => setIsChatOpen(false)}
                        // ส่งข้อมูลสเตตัสปัจจุบันเข้าไปให้ WorldChat ใช้แชร์
                        onShareStats={() => shareStatsToChat({
                            ...player,
                            finalStats,
                            statBreakdown
                        })}
                    />
                </div>
            )}

            {/* 💡 Modal หน้าต่าง Did You Know (ปล่อยให้ทำงานแบบอัตโนมัติ ไม่ต้องส่ง props ควบคุม) */}
            <DidYouKnowModal />

            {/* 🏆 Modal หน้าต่าง Leaderboard */}
            {isLeaderboardOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Leaderboard onClose={() => setIsLeaderboardOpen(false)} />
                </div>
            )}

            {isSellModalOpen && (
                <SellItemModal
                    inventory={filteredInventory}
                    onClose={() => setIsSellModalOpen(false)}
                    onSell={async (itemUid, price, currencyType) => {
                        const result = await handleSellItem(itemUid, price, currencyType);
                        if (result.success) {
                            setIsSellModalOpen(false);
                        }
                        return result;
                    }}
                />
            )}
        </div>
    );
};