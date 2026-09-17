import { useMemo, useState } from "react";
import { ITEMS } from "../data/items.js";
import ItemIcon from "./ItemIcon.jsx";

// Stardewdle-style inventory grid: click an item icon to guess it. Already
// guessed items are greyed out and disabled. Hover shows the item name.
export default function ItemGrid({ onGuess, guessedIds, disabled }) {
  const [open, setOpen] = useState(true);
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? ITEMS.filter((i) => i.name.toLowerCase().includes(q)) : ITEMS;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [query]);

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-white text-shadow-mc text-[10px] mb-2 flex items-center gap-2"
      >
        <span>{open ? "▼" : "▶"}</span> Item grid
      </button>

      {open && (
        <div className="mc-panel-dark p-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter…"
            className="w-full bg-[#3a3a3a] text-white placeholder-gray-400 px-3 py-2 text-[10px] outline-none mb-2 mc-slot"
          />
          <div
            className="grid gap-1 overflow-y-auto pr-1"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))",
              maxHeight: "200px",
            }}
          >
            {items.map((item) => {
              const used = guessedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  disabled={used || disabled}
                  title={item.name}
                  onClick={() => onGuess(item)}
                  className={`mc-slot p-1 flex items-center justify-center aspect-square hover:brightness-125 ${
                    used || disabled ? "opacity-30 cursor-not-allowed" : ""
                  }`}
                >
                  <ItemIcon item={item} size={32} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
