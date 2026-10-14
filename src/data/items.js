// Curated Hypixel Skyblock item dataset for SkyblockZordle.
//
// Textures come from the official Hypixel SkyBlock Resource Pack, which has
// custom icons for weapons/tools/wands/bows but NOT for armor or most
// accessories (those are dyed-leather / vanilla items in-game). So the roster
// focuses on items the pack textures cleanly.
//
// Guessable attributes:
//   rarity   -> ordinal (arrows ↑/↓)  } from Hypixel's item API, generated
//   damage   -> numeric (arrows ↑/↓)  } into item-stats.js by
//   strength -> numeric (arrows ↑/↓)  } scripts/import-stats.mjs
//   category -> exact match   (Sword, Bow, Wand, Pickaxe, ...)
//   source   -> exact match
//   location -> exact match
//   tradeable-> boolean (Yes/No)
//
// Damage and Strength replaced NPC Sell, which was empty for most items and
// left 38% of them indistinguishable from another item. Rarity is generated
// too: the hand-entered values were wrong for ~28 items. CI fails if three
// items ever share every attribute (server/test/items.test.js).
//
// ORDER MATTERS: the daily answer is picked by position in this list. Adding,
// removing or reordering items changes every day's answer, including today's.
//
// `id` doubles as the image filename: /items/<id>.png (rarity-colored tile
// fallback if missing). Run `node scripts/import-textures.mjs --write` to
// (re)generate icons from an extracted pack.

import { ITEM_STATS } from "./item-stats.js";

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

// Curated by hand. Stats are merged in below.
export const BASE_ITEMS = [
  // ---- Swords / melee ----
  { id: "aspect_of_the_end", name: "Aspect of the End", category: "Sword", source: "Crafting", location: "The End", tradeable: true },
  { id: "aspect_of_the_dragons", name: "Aspect of the Dragons", category: "Sword", source: "Crafting", location: "The End", tradeable: true },
  { id: "hyperion", name: "Hyperion", category: "Sword", source: "Crafting", location: "Dungeons", tradeable: true },
  { id: "scylla", name: "Scylla", category: "Sword", source: "Crafting", location: "Dungeons", tradeable: true },
  { id: "valkyrie", name: "Valkyrie", category: "Sword", source: "Crafting", location: "Dungeons", tradeable: true },
  { id: "astraea", name: "Astraea", category: "Sword", source: "Crafting", location: "Dungeons", tradeable: true },
  { id: "necrons_blade", name: "Necron's Blade", category: "Sword", source: "Crafting", location: "Dungeons", tradeable: true },
  { id: "midas_sword", name: "Midas' Sword", category: "Sword", source: "Dark Auction", location: "Hub", tradeable: true },
  { id: "livid_dagger", name: "Livid Dagger", category: "Sword", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "shadow_fury", name: "Shadow Fury", category: "Sword", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "giants_sword", name: "Giant's Sword", category: "Sword", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "flower_of_truth", name: "Flower of Truth", category: "Sword", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "yeti_sword", name: "Yeti Sword", category: "Sword", source: "Fishing", location: "Jerry's Workshop", tradeable: true },
  { id: "pigman_sword", name: "Pigman Sword", category: "Sword", source: "Mob Drop", location: "Crimson Isle", tradeable: true },
  { id: "frozen_scythe", name: "Frozen Scythe", category: "Sword", source: "Mob Drop", location: "Deep Caverns", tradeable: true },
  { id: "leaping_sword", name: "Leaping Sword", category: "Sword", source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "rogue_sword", name: "Rogue Sword", category: "Sword", source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "undead_sword", name: "Undead Sword", category: "Sword", source: "Crafting", location: "Graveyard", tradeable: true },
  { id: "reaper_falchion", name: "Reaper Falchion", category: "Sword", source: "Crafting", location: "Crimson Isle", tradeable: true },
  { id: "atomsplit_katana", name: "Atomsplit Katana", category: "Sword", source: "Crafting", location: "The End", tradeable: true },
  { id: "recluse_fang", name: "Recluse Fang", category: "Sword", source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "voidedge_katana", name: "Voidedge Katana", category: "Sword", source: "Crafting", location: "The End", tradeable: true },
  { id: "voidwalker_katana", name: "Voidwalker Katana", category: "Sword", source: "Crafting", location: "The End", tradeable: true },
  { id: "vorpal_katana", name: "Vorpal Katana", category: "Sword", source: "Crafting", location: "The End", tradeable: true },
  { id: "silk_edge_sword", name: "Silk-Edge Sword", category: "Sword", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "emerald_blade", name: "Emerald Blade", category: "Sword", source: "Crafting", location: "Hub", tradeable: true },
  { id: "zombie_sword", name: "Zombie Sword", category: "Sword", source: "Crafting", location: "Graveyard", tradeable: true },
  { id: "pooch_sword", name: "Pooch Sword", category: "Sword", source: "Mob Drop", location: "Spider's Den", tradeable: true },
  { id: "golem_sword", name: "Golem Sword", category: "Sword", source: "Crafting", location: "Hub", tradeable: true },
  { id: "daedalus_axe", name: "Daedalus Blade", category: "Sword", source: "Fishing", location: "Crimson Isle", tradeable: true },
  { id: "revenant_falchion", name: "Revenant Falchion", category: "Sword", source: "Slayer", location: "Graveyard", tradeable: true },
  { id: "ragnarock", name: "Ragnarock", category: "Sword", source: "Crafting", location: "Crimson Isle", tradeable: true },
  { id: "ornate_zombie_sword", name: "Ornate Zombie Sword", category: "Sword", source: "Crafting", location: "Graveyard", tradeable: true },
  { id: "wither_cloak_sword", name: "Wither Cloak Sword", category: "Sword", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "soul_whip", name: "Soul Whip", category: "Sword", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "fel_sword", name: "Fel Sword", category: "Sword", source: "Mob Drop", location: "The End", tradeable: true },
  { id: "sword_of_bad_health", name: "Sword of Bad Health", category: "Sword", source: "Crafting", location: "Hub", tradeable: true },
  { id: "zombie_soldier_cutlass", name: "Zombie Soldier Cutlass", category: "Sword", source: "Mob Drop", location: "Graveyard", tradeable: true },

  // ---- Wands ----
  { id: "spirit_sceptre", name: "Spirit Sceptre", category: "Wand", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "bonzo_staff", name: "Bonzo's Staff", category: "Wand", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "ember_rod", name: "Ember Rod", category: "Wand", source: "Crafting", location: "Crimson Isle", tradeable: true },
  { id: "midas_staff", name: "Midas Staff", category: "Wand", source: "Dark Auction", location: "Hub", tradeable: true },
  { id: "aurora_staff", name: "Aurora Staff", category: "Wand", source: "Crafting", location: "Crystal Hollows", tradeable: true },
  { id: "fire_veil_wand", name: "Fire Veil Wand", category: "Wand", source: "Crafting", location: "Crimson Isle", tradeable: true },
  { id: "starlight_wand", name: "Starlight Wand", category: "Wand", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "hollow_wand", name: "Hollow Wand", category: "Wand", source: "Crafting", location: "Crystal Hollows", tradeable: true },
  { id: "wand_of_healing", name: "Wand of Healing", category: "Wand", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "wand_of_mending", name: "Wand of Mending", category: "Wand", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "fire_freeze_staff", name: "Fire Freeze Staff", category: "Wand", source: "Crafting", location: "Crimson Isle", tradeable: true },
  { id: "ice_spray_wand", name: "Ice Spray Wand", category: "Wand", source: "Crafting", location: "Crystal Hollows", tradeable: true },

  // ---- Bows ----
  { id: "runaans_bow", name: "Runaan's Bow", category: "Bow", source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "hurricane_bow", name: "Hurricane Bow", category: "Bow", source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "mosquito_bow", name: "Mosquito Shortbow", category: "Bow", source: "Mob Drop", location: "Spider's Den", tradeable: true },
  { id: "magma_bow", name: "Magma Bow", category: "Bow", source: "Mob Drop", location: "Crimson Isle", tradeable: true },
  { id: "savanna_bow", name: "Savanna Bow", category: "Bow", source: "Crafting", location: "The Park", tradeable: true },
  { id: "juju_shortbow", name: "Juju Shortbow", category: "Bow", source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "terminator", name: "Terminator", category: "Bow", source: "Crafting", location: "The End", tradeable: true },
  { id: "bonemerang", name: "Bonemerang", category: "Bow", source: "Crafting", location: "Hub", tradeable: true },
  { id: "silent_death", name: "Silent Death", category: "Bow", source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "soulstealer_bow", name: "Soulstealer Bow", category: "Bow", source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "explosive_bow", name: "Explosive Bow", category: "Bow", source: "Crafting", location: "Hub", tradeable: true },
  { id: "slime_bow", name: "Slime Bow", category: "Bow", source: "Crafting", location: "Hub", tradeable: true },
  { id: "last_breath", name: "Last Breath", category: "Bow", source: "Dungeon", location: "Dungeons", tradeable: true },
  { id: "jerry_chine_gun", name: "Jerry-chine Gun", category: "Bow", source: "Crafting", location: "Jerry's Workshop", tradeable: true },
  { id: "machine_gun_shortbow", name: "Machine Gun Shortbow", category: "Bow", source: "Crafting", location: "Spider's Den", tradeable: true },
  { id: "dragon_shortbow", name: "Dragon Shortbow", category: "Bow", source: "Crafting", location: "The End", tradeable: true },

  // ---- Tools ----
  { id: "stonk", name: "Stonk", category: "Pickaxe", source: "Crafting", location: "Dwarven Mines", tradeable: true },
  { id: "titanium_pickaxe", name: "Titanium Pickaxe", category: "Pickaxe", source: "Crafting", location: "Dwarven Mines", tradeable: true },
  { id: "mithril_pickaxe", name: "Mithril Pickaxe", category: "Pickaxe", source: "Crafting", location: "Dwarven Mines", tradeable: true },
  { id: "treecapitator", name: "Treecapitator", category: "Axe", source: "Crafting", location: "The Park", tradeable: true },
  { id: "pumpkin_dicer", name: "Pumpkin Dicer", category: "Axe", source: "Crafting", location: "The Farming Islands", tradeable: true },
  { id: "rod_of_the_sea", name: "Rod of the Sea", category: "Fishing Rod", source: "Crafting", location: "Hub", tradeable: true },
  { id: "rod_of_legends", name: "Rod of Legends", category: "Fishing Rod", source: "Crafting", location: "Hub", tradeable: true },
  { id: "magma_rod", name: "Magma Rod", category: "Fishing Rod", source: "Crafting", location: "Crimson Isle", tradeable: true },
  { id: "ancestral_spade", name: "Ancestral Spade", category: "Tool", source: "Crafting", location: "Crystal Hollows", tradeable: true },
];

export const ITEMS = BASE_ITEMS.map((item) => ({ ...item, ...ITEM_STATS[item.id] }));

export default ITEMS;
