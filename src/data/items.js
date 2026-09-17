// Curated Hypixel Skyblock item dataset for SkyblockZordle.
//
// Textures come from the official Hypixel SkyBlock Resource Pack, which has
// custom icons for weapons/tools/wands/bows but NOT for armor or most
// accessories (those are dyed-leather / vanilla items in-game). So the roster
// focuses on items the pack textures cleanly.
//
// Guessable attributes mirror the Stardewdle columns:
//   rarity   -> ordinal (arrows ↑/↓)
//   npcSell  -> numeric (arrows ↑/↓)
//   tradeable-> boolean (✓/✗)
//   category -> exact match   (Sword, Bow, Wand, Pickaxe, ...)
//   source   -> exact match
//   location -> exact match
//
// `id` doubles as the image filename: /items/<id>.png (rarity-colored tile
// fallback if missing). Run `node scripts/import-textures.mjs --write` to
// (re)generate icons from an extracted pack.

export const RARITY_ORDER = [
  "Common",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
  "Divine",
  "Special",
];

export const RARITY_COLORS = {
  Common: "#ffffff",
  Uncommon: "#55ff55",
  Rare: "#5555ff",
  Epic: "#aa00aa",
  Legendary: "#ffaa00",
  Mythic: "#ff55ff",
  Divine: "#55ffff",
  Special: "#ff5555",
};

export const ITEMS = [
  // ---- Swords / melee ----
  { id: "aspect_of_the_end", name: "Aspect of the End", rarity: "Rare", category: "Sword", npcSell: 12000, source: "Crafting", location: "The End", tradeable: true },
  { id: "aspect_of_the_dragons", name: "Aspect of the Dragons", rarity: "Legendary", category: "Sword", npcSell: 100000, source: "Crafting", location: "The End", tradeable: true },
  { id: "hyperion", name: "Hyperion", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Crafting", location: "Dungeons", tradeable: true },
  { id: "scylla", name: "Scylla", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Crafting", location: "Dungeons", tradeable: true },
  { id: "valkyrie", name: "Valkyrie", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Crafting", location: "Dungeons", tradeable: true },
  { id: "astraea", name: "Astraea", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Crafting", location: "Dungeons", tradeable: true },
  { id: "necrons_blade", name: "Necron's Blade", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Crafting", location: "Dungeons", tradeable: true },
  { id: "midas_sword", name: "Midas' Sword", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Dark Auction", location: "Hub", tradeable: true },
  { id: "livid_dagger", name: "Livid Dagger", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "shadow_fury", name: "Shadow Fury", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "giants_sword", name: "Giant's Sword", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "flower_of_truth", name: "Flower of Truth", rarity: "Epic", category: "Sword", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "yeti_sword", name: "Yeti Sword", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Fishing", location: "Jerry's Workshop", tradeable: true },
  { id: "pigman_sword", name: "Pigman Sword", rarity: "Legendary", category: "Sword", npcSell: 25000, source: "Mob Drop", location: "Crimson Isle", tradeable: true },
  { id: "frozen_scythe", name: "Frozen Scythe", rarity: "Rare", category: "Sword", npcSell: 6000, source: "Mob Drop", location: "Deep Caverns", tradeable: true },
  { id: "leaping_sword", name: "Leaping Sword", rarity: "Epic", category: "Sword", npcSell: 8000, source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "rogue_sword", name: "Rogue Sword", rarity: "Common", category: "Sword", npcSell: 150, source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "undead_sword", name: "Undead Sword", rarity: "Uncommon", category: "Sword", npcSell: 500, source: "Crafting", location: "Graveyard", tradeable: true },
  { id: "reaper_falchion", name: "Reaper Falchion", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Crafting", location: "Crimson Isle", tradeable: true },
  { id: "atomsplit_katana", name: "Atomsplit Katana", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Crafting", location: "The End", tradeable: true },
  { id: "recluse_fang", name: "Recluse Fang", rarity: "Uncommon", category: "Sword", npcSell: 0, source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "voidedge_katana", name: "Voidedge Katana", rarity: "Epic", category: "Sword", npcSell: 0, source: "Crafting", location: "The End", tradeable: true },
  { id: "voidwalker_katana", name: "Voidwalker Katana", rarity: "Rare", category: "Sword", npcSell: 0, source: "Crafting", location: "The End", tradeable: true },
  { id: "vorpal_katana", name: "Vorpal Katana", rarity: "Uncommon", category: "Sword", npcSell: 0, source: "Crafting", location: "The End", tradeable: true },
  { id: "silk_edge_sword", name: "Silk Edge Sword", rarity: "Epic", category: "Sword", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "emerald_blade", name: "Emerald Blade", rarity: "Epic", category: "Sword", npcSell: 0, source: "Crafting", location: "Hub", tradeable: true },
  { id: "zombie_sword", name: "Zombie Sword", rarity: "Uncommon", category: "Sword", npcSell: 0, source: "Crafting", location: "Graveyard", tradeable: true },
  { id: "pooch_sword", name: "Pooch Sword", rarity: "Epic", category: "Sword", npcSell: 0, source: "Mob Drop", location: "Spider's Den", tradeable: true },
  { id: "golem_sword", name: "Golem Sword", rarity: "Rare", category: "Sword", npcSell: 0, source: "Crafting", location: "Hub", tradeable: true },
  { id: "daedalus_axe", name: "Daedalus Axe", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Fishing", location: "Crimson Isle", tradeable: true },
  { id: "revenant_falchion", name: "Revenant Falchion", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Slayer", location: "Graveyard", tradeable: true },
  { id: "ragnarock", name: "Ragnarock Axe", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Crafting", location: "Crimson Isle", tradeable: true },
  { id: "ornate_zombie_sword", name: "Ornate Zombie Sword", rarity: "Legendary", category: "Sword", npcSell: 0, source: "Crafting", location: "Graveyard", tradeable: true },
  { id: "wither_cloak_sword", name: "Wither Cloak Sword", rarity: "Epic", category: "Sword", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "soul_whip", name: "Soul Whip", rarity: "Epic", category: "Sword", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "fel_sword", name: "Fel Sword", rarity: "Epic", category: "Sword", npcSell: 0, source: "Mob Drop", location: "The End", tradeable: true },
  { id: "sword_of_bad_health", name: "Sword of Bad Health", rarity: "Epic", category: "Sword", npcSell: 0, source: "Crafting", location: "Hub", tradeable: true },
  { id: "zombie_soldier_cutlass", name: "Zombie Soldier Cutlass", rarity: "Uncommon", category: "Sword", npcSell: 0, source: "Mob Drop", location: "Graveyard", tradeable: true },

  // ---- Wands ----
  { id: "spirit_sceptre", name: "Spirit Sceptre", rarity: "Legendary", category: "Wand", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "bonzo_staff", name: "Bonzo's Staff", rarity: "Epic", category: "Wand", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "ember_rod", name: "Ember Rod", rarity: "Uncommon", category: "Wand", npcSell: 1000, source: "Crafting", location: "Crimson Isle", tradeable: true },
  { id: "midas_staff", name: "Midas Staff", rarity: "Legendary", category: "Wand", npcSell: 0, source: "Dark Auction", location: "Hub", tradeable: true },
  { id: "aurora_staff", name: "Aurora Staff", rarity: "Mythic", category: "Wand", npcSell: 0, source: "Crafting", location: "Crystal Hollows", tradeable: true },
  { id: "fire_veil_wand", name: "Fire Veil Wand", rarity: "Epic", category: "Wand", npcSell: 0, source: "Crafting", location: "Crimson Isle", tradeable: true },
  { id: "starlight_wand", name: "Starlight Wand", rarity: "Legendary", category: "Wand", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "hollow_wand", name: "Hollow Wand", rarity: "Epic", category: "Wand", npcSell: 0, source: "Crafting", location: "Crystal Hollows", tradeable: true },
  { id: "wand_of_healing", name: "Wand of Healing", rarity: "Uncommon", category: "Wand", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "wand_of_mending", name: "Wand of Mending", rarity: "Rare", category: "Wand", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "fire_freeze_staff", name: "Fire Freeze Staff", rarity: "Epic", category: "Wand", npcSell: 0, source: "Crafting", location: "Crimson Isle", tradeable: true },
  { id: "ice_spray_wand", name: "Ice Spray Wand", rarity: "Legendary", category: "Wand", npcSell: 0, source: "Crafting", location: "Crystal Hollows", tradeable: true },

  // ---- Bows ----
  { id: "runaans_bow", name: "Runaan's Bow", rarity: "Legendary", category: "Bow", npcSell: 0, source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "hurricane_bow", name: "Hurricane Bow", rarity: "Epic", category: "Bow", npcSell: 0, source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "mosquito_bow", name: "Mosquito Bow", rarity: "Legendary", category: "Bow", npcSell: 0, source: "Mob Drop", location: "Spider's Den", tradeable: true },
  { id: "magma_bow", name: "Magma Bow", rarity: "Rare", category: "Bow", npcSell: 3000, source: "Mob Drop", location: "Crimson Isle", tradeable: true },
  { id: "savanna_bow", name: "Savanna Bow", rarity: "Uncommon", category: "Bow", npcSell: 1200, source: "Crafting", location: "The Park", tradeable: true },
  { id: "juju_shortbow", name: "Juju Shortbow", rarity: "Legendary", category: "Bow", npcSell: 0, source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "terminator", name: "Terminator", rarity: "Legendary", category: "Bow", npcSell: 0, source: "Crafting", location: "The End", tradeable: true },
  { id: "bonemerang", name: "Bonemerang", rarity: "Uncommon", category: "Bow", npcSell: 800, source: "Crafting", location: "Hub", tradeable: true },
  { id: "silent_death", name: "Silent Death", rarity: "Legendary", category: "Bow", npcSell: 0, source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "soulstealer_bow", name: "Soulstealer Bow", rarity: "Rare", category: "Bow", npcSell: 0, source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "explosive_bow", name: "Explosive Bow", rarity: "Epic", category: "Bow", npcSell: 0, source: "Crafting", location: "Hub", tradeable: true },
  { id: "slime_bow", name: "Slime Bow", rarity: "Epic", category: "Bow", npcSell: 0, source: "Crafting", location: "Hub", tradeable: true },
  { id: "last_breath", name: "Last Breath", rarity: "Legendary", category: "Bow", npcSell: 0, source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "jerry_chine_gun", name: "Jerry-chine Gun", rarity: "Legendary", category: "Bow", npcSell: 0, source: "Crafting", location: "Jerry's Workshop", tradeable: true },
  { id: "machine_gun_shortbow", name: "Machine Gun Bow", rarity: "Epic", category: "Bow", npcSell: 0, source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "dragon_shortbow", name: "Dragon Shortbow", rarity: "Epic", category: "Bow", npcSell: 0, source: "Crafting", location: "The End", tradeable: true },

  // ---- Tools ----
  { id: "stonk", name: "Stonk", rarity: "Epic", category: "Pickaxe", npcSell: 0, source: "Crafting", location: "Dwarven Mines", tradeable: true },
  { id: "titanium_pickaxe", name: "Titanium Pickaxe", rarity: "Rare", category: "Pickaxe", npcSell: 0, source: "Crafting", location: "Dwarven Mines", tradeable: true },
  { id: "mithril_pickaxe", name: "Mithril Pickaxe", rarity: "Rare", category: "Pickaxe", npcSell: 0, source: "Crafting", location: "Dwarven Mines", tradeable: true },
  { id: "silver_fang", name: "Silver Fang", rarity: "Rare", category: "Pickaxe", npcSell: 0, source: "Crafting", location: "Deep Caverns", tradeable: true },
  { id: "treecapitator", name: "Treecapitator", rarity: "Legendary", category: "Axe", npcSell: 0, source: "Crafting", location: "The Park", tradeable: true },
  { id: "pumpkin_dicer", name: "Pumpkin Dicer", rarity: "Epic", category: "Axe", npcSell: 0, source: "Crafting", location: "The Farming Islands", tradeable: true },
  { id: "rod_of_the_sea", name: "Rod of the Sea", rarity: "Legendary", category: "Fishing Rod", npcSell: 0, source: "Crafting", location: "Hub", tradeable: true },
  { id: "rod_of_legends", name: "Rod of Legends", rarity: "Epic", category: "Fishing Rod", npcSell: 0, source: "Crafting", location: "Hub", tradeable: true },
  { id: "magma_rod", name: "Magma Rod", rarity: "Epic", category: "Fishing Rod", npcSell: 0, source: "Crafting", location: "Crimson Isle", tradeable: true },
  { id: "ancestral_spade", name: "Ancestral Spade", rarity: "Legendary", category: "Tool", npcSell: 0, source: "Crafting", location: "Crystal Hollows", tradeable: true },
];

export default ITEMS;
