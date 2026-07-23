export const bossImages: Record<string, string> = {
    // Volcanic Core (Fire)
    'b-001': '/Icons/Monsters/EmberGrunt.svg',
    'b-002': '/Icons/Monsters/CinderRaider.svg',
    'b-003': '/Icons/Monsters/FirelashOrc.svg',
    'b-004': '/Icons/Monsters/BlazingBrute.svg',
    'b-005': '/Icons/Monsters/InfernalWarlord.svg',
    'b-006': '/Icons/Monsters/MagmaBerserker.svg',
    'b-007': '/Icons/Monsters/VolcanicChieftain.svg',
    'b-008': '/Icons/Monsters/AshbornTitan.svg',
    'b-009': '/Icons/Monsters/PyreSovereign.svg',
    'b-010': '/Icons/Monsters/EmberkingRagnar.svg',
    'b-011': '/Icons/Monsters/HellfireWyrm.svg',
    'b-012': '/Icons/Monsters/MagmaAbyssLord.svg',

    // Sunken Temple (Water)
    'b-013': '/Icons/Monsters/SproutSapling.svg',
    'b-014': '/Icons/Monsters/MossyVinewalker.svg',
    'b-015': '/Icons/Monsters/TidalBramble.svg',
    'b-016': '/Icons/Monsters/CoralTreant.svg',
    'b-017': '/Icons/Monsters/GluttonousSmile.svg',
    'b-018': '/Icons/Monsters/WaterSpirit.svg',
    'b-019': '/Icons/Monsters/IceGolem.svg',
    'b-020': '/Icons/Monsters/TsunamiWarden.svg',
    'b-021': '/Icons/Monsters/OceanicElder.svg',
    'b-022': '/Icons/Monsters/PrimordialKrakenTree.svg',
    'b-023': '/Icons/Monsters/AbyssalLeviathan.svg',
    'b-024': '/Icons/Monsters/DeepSeaSovereign.svg',

    // Quarry Ruins (Earth)
    'b-025': '/Icons/Monsters/RubbleBrute.svg',
    'b-026': '/Icons/Monsters/BoulderFist.svg',
    'b-027': '/Icons/Monsters/GraniteOgre.svg',
    'b-028': '/Icons/Monsters/QuarrySmasher.svg',
    'b-029': '/Icons/Monsters/MountainCrusher.svg',
    'b-030': '/Icons/Monsters/BedrockTitan.svg',
    'b-031': '/Icons/Monsters/SeismicBehemoth.svg',
    'b-032': '/Icons/Monsters/ObsidianWarlord.svg',
    'b-033': '/Icons/Monsters/TectonicColossus.svg',
    'b-034': '/Icons/Monsters/GaiasWrath.svg',
    'b-035': '/Icons/Monsters/WorldbreakerBehemoth.svg',
    'b-036': '/Icons/Monsters/CoreTitan.svg',

    // Sky Fortress (Wind)
    'b-037': '/Icons/Monsters/HollowWisp.svg',
    'b-038': '/Icons/Monsters/RestlessSpecter.svg',
    'b-039': '/Icons/Monsters/HowlingWraith.svg',
    'b-040': '/Icons/Monsters/GalePhantom.svg',
    'b-041': '/Icons/Monsters/SoulwindReaper.svg',
    'b-042': '/Icons/Monsters/TempestBanshee.svg',
    'b-043': '/Icons/Monsters/CycloneRevenant.svg',
    'b-044': '/Icons/Monsters/StormHarbinger.svg',
    'b-045': '/Icons/Monsters/DeathwindSovereign.svg',
    'b-046': '/Icons/Monsters/EternalMaelstrom.svg',
    'b-047': '/Icons/Monsters/SkyLordAeris.svg',
    'b-048': '/Icons/Monsters/FirmamentGod.svg',

    // Cursed Throne (Dark)
    'b-049': '/Icons/Monsters/ShadeImp.svg',
    'b-050': '/Icons/Monsters/GrimCultist.svg',
    'b-051': '/Icons/Monsters/DuskFiend.svg',
    'b-052': '/Icons/Monsters/NightmareStalker.svg',
    'b-053': '/Icons/Monsters/Voidcaller.svg',
    'b-054': '/Icons/Monsters/AbyssalTormentor.svg',
    'b-055': '/Icons/Monsters/ChaosDevourer.svg',
    'b-056': '/Icons/Monsters/DarkbloodOverlord.svg',
    'b-057': '/Icons/Monsters/InfernalArchdemon.svg',
    'b-058': '/Icons/Monsters/OblivionsHerald.svg',
    'b-059': '/Icons/Monsters/DespairLord.svg',
    'b-060': '/Icons/Monsters/VoidHarbinger.svg',

    // Holy Sanctuary (Holy)
    'b-061': '/Icons/Monsters/NoviceAcolyte.svg',
    'b-062': '/Icons/Monsters/BlessedGuardian.svg',
    'b-063': '/Icons/Monsters/RadiantTemplar.svg',
    'b-064': '/Icons/Monsters/DivineSentinel.svg',
    'b-065': '/Icons/Monsters/HolyVanguard.svg',
    'b-066': '/Icons/Monsters/CelestialPaladin.svg',
    'b-067': '/Icons/Monsters/SeraphicWarden.svg',
    'b-068': '/Icons/Monsters/ArchangelAscendant.svg',
    'b-069': '/Icons/Monsters/EmpyreanJudge.svg',
    'b-070': '/Icons/Monsters/DivineSovereign.svg',
    'b-071': '/Icons/Monsters/SupremeSeraph.svg',
    'b-072': '/Icons/Monsters/LightApostle.svg',

    // Abyssal Void (Neutral)
    'b-073': '/Icons/Monsters/Wyrmling.svg',
    'b-074': '/Icons/Monsters/ScaledDrake.svg',
    'b-075': '/Icons/Monsters/VoidSerpent.svg',
    'b-076': '/Icons/Monsters/TwilightWyvern.svg',
    'b-077': '/Icons/Monsters/AstralDragon.svg',
    'b-078': '/Icons/Monsters/NebulaWyrm.svg',
    'b-079': '/Icons/Monsters/CosmicLeviathan.svg',
    'b-080': '/Icons/Monsters/StarforgedDragon.svg',
    'b-081': '/Icons/Monsters/VoidboundAncient.svg',
    'b-082': '/Icons/Monsters/GenesisWyrmking.svg',
    'b-083': '/Icons/Monsters/InfiniteWorldEater.svg',
    'b-084': '/Icons/Monsters/PrimevalCosmos.svg',
};

export const DEFAULT_IMAGE = '/Icons/Monsters/EvilBook.svg';

export const baseStats = {
    str: 40, agi: 30, vit: 40, int: 30, dex: 40, luk: 40,
    critRate: 20, critDmg: 100,
    atk: 150,     // 🟢 จากเดิม 60 ดันขึ้นมา
    def: 80,      // 🟢 จากเดิม 60
    maxHp: 5000,  // 🟢 จากเดิม 1,200 ดันขึ้นมาให้เลือดหนาๆ
    hit: 80, flee: 40, res: 40, mRes: 35
};


export const materialTiers: Record<number, string[]> = {
    1: ['iron_ore', 'steel_ingot', 'leather'],
    2: ['magic_dust', 'mithril', 'gold_ore'],
    3: ['dark_crystal', 'dragon_scale'],
    4: ['void_essence', 'celestial_shard'],
    5: ['ancient_rune', 'primordial_essence']
};