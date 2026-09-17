import { useMemo, useState } from "react";
import { ITEMS } from "../data/items.js";
import ItemIcon from "./ItemIcon.jsx";
import { RARITY_COLORS } from "../data/items.js";

export default function Collections({ onBack }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? ITEMS.filter((i) => i.name.toLowerCase().includes(q))
      : ITEMS;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-5xl flex items-center justify-between mb-6">
        <h2 className="text-white text-shadow-mc text-2xl">Collections</h2>
        <button className="mc-btn text-[10px]" onClick={onBack}>
          ← Back
        </button>
      </div>

      <div className="w-full max-w-5xl mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items…"
          className="w-full bg-[#3a3a3a] text-white placeholder-gray-400 px-4 py-3 text-[11px] outline-none mc-panel-dark"
        />
      </div>

      <div className="w-full max-w-5xl mc-panel p-3 overflow-x-auto">
        <table className="w-full border-collapse text-[9px]">
          <thead>
            <tr className="text-left">
              {["", "Name", "Rarity", "Category", "NPC Sell", "Source", "Location", "Trade"].map(
                (h) => (
                  <th key={h} className="px-2 py-2 text-paneldark">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t-2 border-[#8b8b8b]">
                <td className="px-2 py-1">
                  <div className="mc-slot p-1 inline-flex">
                    <ItemIcon item={item} size={32} />
                  </div>
                </td>
                <td className="px-2 py-1">{item.name}</td>
                <td className="px-2 py-1" style={{ color: shade(item.rarity) }}>
                  {item.rarity}
                </td>
                <td className="px-2 py-1">{item.category}</td>
                <td className="px-2 py-1">
                  {item.npcSell > 0 ? `${item.npcSell.toLocaleString()}g` : "—"}
                </td>
                <td className="px-2 py-1">{item.source}</td>
                <td className="px-2 py-1">{item.location}</td>
                <td className="px-2 py-1">{item.tradeable ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-white text-[8px] opacity-70 mt-4">
        {ITEMS.length} items in the collection
      </p>
    </div>
  );
}

// Darken pure-white rarity text so it's readable on the light panel.
function shade(rarity) {
  const c = RARITY_COLORS[rarity];
  return rarity === "Common" ? "#555" : c;
}
