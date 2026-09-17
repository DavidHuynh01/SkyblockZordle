# Item icons

These `<id>.png` files are the item icons shown in the game, matching the `id`
field in `src/data/items.js`.

They are extracted from the **official Hypixel SkyBlock Resource Pack**
(© Hypixel Inc.), used under the Hypixel SkyBlock Resource Pack License, which
permits free, Hypixel-related fan projects to use the assets.

## Regenerate / update

1. Download the latest pack from the Hypixel resource-pack API and unzip it.
2. Point the importer at it and copy matching icons:

   ```bash
   PACK_DIR="/path/to/unzipped/assets" node scripts/import-textures.mjs --write
   ```

   (Omit `PACK_DIR` to use the pack in `assets/`.) The script fuzzy-matches by
   `id`/name and reports anything it couldn't find.

If an icon is missing, the game falls back to a rarity-colored tile, so the
game still works without images.
