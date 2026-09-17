// Credits / about dialog opened from the menu's scroll icon.
export default function CreditsModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="mc-panel w-full max-w-md p-6 animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mc-title mc-title-sm text-xl sm:text-2xl text-center mb-5">
          Credits
        </h2>

        <div className="text-[9px] sm:text-[10px] text-paneldark leading-relaxed space-y-4">
          <p>
            <span className="text-[#3f7d2e]">SkyblockZordle</span>
            <br />
            Created by David Huynh
          </p>

          <p>
            Item textures from the official{" "}
            <a
              className="text-[#2b5fb0] underline"
              href="https://hypixel.net/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hypixel SkyBlock Resource Pack
            </a>
            , used under its license. © Hypixel Inc.
          </p>

          <p>Built with React, Vite &amp; Tailwind CSS.</p>

          <p className="opacity-70">
            A free, fan-made project. Not affiliated with or endorsed by Hypixel
            or Mojang.
          </p>
        </div>

        <div className="flex justify-center mt-6">
          <button className="mc-btn text-[10px]" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
