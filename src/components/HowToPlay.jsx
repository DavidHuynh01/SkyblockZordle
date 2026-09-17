// "How to Play" / rules modal.
export default function HowToPlay({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="mc-panel w-full max-w-lg p-6 animate-pop max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mc-title mc-title-sm text-xl sm:text-2xl text-center mb-5">
          How to Play
        </h2>

        <div className="text-[9px] sm:text-[10px] text-paneldark leading-relaxed space-y-3">
          <p>Guess the secret Hypixel Skyblock item in 8 tries.</p>
          <p>
            Pick an item from the search box or the grid. Each guess reveals how
            its attributes compare to the answer:
          </p>

          <div className="flex items-center gap-2">
            <span className="cell-correct inline-block px-2 py-1">Green</span>
            <span>= exact match</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="cell-wrong inline-block px-2 py-1">Red</span>
            <span>= not a match</span>
          </div>
          <p>
            <span className="text-[#2e7d32]">▲</span> /{" "}
            <span className="text-[#b23b3b]">▼</span> on{" "}
            <b>Rarity</b> and <b>NPC Sell</b> mean the answer is higher / lower.
          </p>

          <p className="pt-1">Attributes compared:</p>
          <ul className="list-disc list-inside space-y-1 opacity-90">
            <li>Rarity (Common → Special)</li>
            <li>Category (Sword, Bow, Wand, Pickaxe…)</li>
            <li>NPC Sell price</li>
            <li>Source (Crafting, Dungeon, Slayer…)</li>
            <li>Location (The End, Dungeons, Crystal Hollows…)</li>
            <li>Tradeable (Yes / No)</li>
          </ul>

          <p className="opacity-70 pt-1">
            A new daily item appears every day — everyone gets the same one!
          </p>
        </div>

        <div className="flex justify-center mt-6">
          <button className="mc-btn text-[10px]" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
