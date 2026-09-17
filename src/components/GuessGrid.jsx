import ItemIcon from "./ItemIcon.jsx";

// Renders guess rows. Each guess is { item, result }, where `result` is the
// per-attribute comparison (computed server-side, or locally when offline).

const COLUMNS = [
  { key: "item", label: "Item" },
  { key: "rarity", label: "Rarity" },
  { key: "category", label: "Category" },
  { key: "npcSell", label: "NPC Sell" },
  { key: "source", label: "Source" },
  { key: "location", label: "Location" },
  { key: "tradeable", label: "Trade" },
];

function Arrow({ hint }) {
  if (!hint) return null;
  return <span className="ml-1">{hint === "up" ? "▲" : "▼"}</span>;
}

function displayValue(key, item) {
  if (key === "npcSell") return item.npcSell > 0 ? `${item.npcSell.toLocaleString()}g` : "—";
  if (key === "tradeable") return item.tradeable ? "Yes" : "No";
  return item[key];
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
    <div className="w-full">
      {/* Header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {COLUMNS.map((c) => (
          <div key={c.key} className="text-center text-[8px] text-white text-shadow-mc py-1">
            {c.label}
          </div>
        ))}
      </div>

      {/* Rows (newest on top) */}
      <div className="flex flex-col gap-1">
        {[...guesses].reverse().map(({ item: g, result: r }) => (
          <div key={g.id} className="grid grid-cols-7 gap-1">
            <div className="mc-slot flex items-center justify-center p-1 min-h-[56px]">
              <ItemIcon item={g} size={40} />
            </div>
            <Cell result={r.rarity}>
              <span className="flex items-center">
                {g.rarity}
                <Arrow hint={r.rarity.hint} />
              </span>
            </Cell>
            <Cell result={r.category}>{g.category}</Cell>
            <Cell result={r.npcSell}>
              <span className="flex items-center">
                {displayValue("npcSell", g)}
                <Arrow hint={r.npcSell.hint} />
              </span>
            </Cell>
            <Cell result={r.source}>{g.source}</Cell>
            <Cell result={r.location}>{g.location}</Cell>
            <Cell result={r.tradeable}>{displayValue("tradeable", g)}</Cell>
          </div>
        ))}
      </div>

      {guesses.length === 0 && (
        <p className="text-center text-white text-[10px] text-shadow-mc mt-6 opacity-80">
          Make your first guess to reveal hints!
        </p>
      )}
    </div>
  );
}
