import ItemIcon from "./ItemIcon.jsx";
import { getItemById } from "../utils/game.js";

// Renders guess rows. Each guess is { item, result }, where `result` is the
// per-attribute comparison (computed server-side, or locally when offline).

// Compared columns, in display order. `arrows` marks the ordered ones, where
// a wrong guess also says whether the answer is higher or lower.
const COLUMNS = [
  { key: "rarity", label: "Rarity", arrows: true },
  { key: "category", label: "Category" },
  { key: "damage", label: "Damage", arrows: true },
  { key: "strength", label: "Strength", arrows: true },
  { key: "source", label: "Source" },
  { key: "location", label: "Location" },
  { key: "tradeable", label: "Trade" },
];

function Arrow({ hint }) {
  if (!hint) return null;
  return <span className="ml-1">{hint === "up" ? "▲" : "▼"}</span>;
}

function displayValue(key, item) {
  if (key === "tradeable") return item.tradeable ? "Yes" : "No";
  const v = item[key];
  return v === undefined || v === null ? "—" : String(v);
}

function Cell({ result, children }) {
  const cls = result
    ? result.status === "correct"
      ? "cell-correct"
      : "cell-wrong"
    : "bg-[#5a5a5a] text-white";
  return (
    <div
      className={`mc-slot flex items-center justify-center text-center px-1 py-2 text-[8px] leading-tight min-h-[56px] ${cls} animate-pop`}
    >
      {children}
    </div>
  );
}

export default function GuessGrid({ guesses }) {
  return (
    // Eight columns of pixel text don't fit a phone, and squashing them clips
    // words like "Legendary". Below the minimum width the table scrolls
    // sideways instead; header and rows share one scroller so they stay lined up.
    <div className="w-full overflow-x-auto">
      <div className="min-w-[720px]">
        {/* Header */}
        <div className="grid grid-cols-8 gap-1 mb-1">
          {[{ key: "item", label: "Item" }, ...COLUMNS].map((c) => (
            <div key={c.key} className="text-center text-[8px] text-white text-shadow-mc py-1">
              {c.label}
            </div>
          ))}
        </div>

        {/* Rows (newest on top) */}
        <div className="flex flex-col gap-1">
          {[...guesses].reverse().map(({ item: saved, result: r }) => {
            // Read values from the current item data: a guess saved before a
            // column existed only stored the fields it had at the time. Its
            // result has no entry for the new column either, so that cell
            // renders grey with a dash rather than breaking the row.
            const g = getItemById(saved.id) || saved;
            return (
              <div key={g.id} className="grid grid-cols-8 gap-1">
                <div className="mc-slot flex items-center justify-center p-1 min-h-[56px]">
                  <ItemIcon item={g} size={40} />
                </div>
                {COLUMNS.map((c) => (
                  <Cell key={c.key} result={r[c.key]}>
                    {r[c.key] ? (
                      <span className="flex items-center">
                        {displayValue(c.key, g)}
                        {c.arrows && <Arrow hint={r[c.key].hint} />}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Cell>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {guesses.length === 0 && (
        <p className="text-center text-white text-[10px] text-shadow-mc mt-6 opacity-80">
          Make your first guess to reveal hints!
        </p>
      )}
    </div>
  );
}
