import { useState } from "react";
import { RARITY_COLORS } from "../data/items.js";

// Renders an item's sprite from /items/<id>.png. If that image is missing
// (the curated starter set ships without sprites), it falls back to a
// rarity-colored tile showing the item's initials — so the game is fully
// playable immediately, and you can drop real PNGs into /public/items later.
export default function ItemIcon({ item, size = 48 }) {
  const [failed, setFailed] = useState(false);
  const color = RARITY_COLORS[item.rarity] || "#ffffff";

  if (failed) {
    const initials = item.name
      .replace(/['’]/g, "")
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    return (
      <div
        title={item.name}
        className="flex items-center justify-center select-none"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${color}33, ${color}11)`,
          border: `2px solid ${color}`,
          color,
          fontSize: Math.max(8, size / 4),
          textShadow: "1px 1px 0 #000",
          boxShadow: `inset 0 0 ${size / 4}px ${color}55`,
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      className="pixel"
      src={`${import.meta.env.BASE_URL}items/${item.id}.png`}
      alt={item.name}
      title={item.name}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      // Minecraft animated textures are tall vertical strips (frames stacked
      // top-to-bottom). "cover" + top alignment scales the strip to fill the
      // square and crops to the first frame; square textures fill exactly.
      style={{ width: size, height: size, objectFit: "cover", objectPosition: "top" }}
    />
  );
}
