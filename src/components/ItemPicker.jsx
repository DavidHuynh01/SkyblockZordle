import { useMemo, useState } from "react";
import { ITEMS } from "../data/items.js";
import ItemIcon from "./ItemIcon.jsx";

// Search box + autocomplete dropdown for choosing a guess.
// `guessedIds` are greyed out and disabled so you can't repeat a guess.
export default function ItemPicker({ onGuess, guessedIds, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ITEMS.filter((it) => it.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  function pick(item) {
    if (guessedIds.includes(item.id)) return;
    onGuess(item);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative w-full">
      <input
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches[0]) pick(matches[0]);
        }}
        placeholder={disabled ? "Round over" : "Type an item name…"}
        className="w-full bg-[#3a3a3a] text-white placeholder-gray-400 px-4 py-3 text-[11px] outline-none mc-panel-dark disabled:opacity-50"
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full mc-panel-dark max-h-72 overflow-y-auto">
          {matches.map((item) => {
            const used = guessedIds.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  disabled={used}
                  onClick={() => pick(item)}
                  className={`flex items-center gap-3 w-full px-3 py-2 text-left text-[10px] text-white hover:bg-[#4f4f4f] ${
                    used ? "opacity-30 cursor-not-allowed" : ""
                  }`}
                >
                  <ItemIcon item={item} size={28} />
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
