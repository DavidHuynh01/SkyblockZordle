import { useEffect, useId, useRef, useState } from "react";
import { getSound, setSound, onSoundChange } from "../utils/sound.js";
import { sfx } from "../utils/sfx.js";

// Sound button that opens a small panel: music and effects volume, plus a
// master mute. `placement` is where the panel opens relative to the button;
// `align` keeps it on screen when the button sits near an edge. `className`
// sets the button's size; it replaces the default rather than adding to it,
// because two Tailwind widths on one element resolve by stylesheet order.
export default function SoundControl({ className = "w-9 h-9", placement = "below", align = "end" }) {
  const [s, setS] = useState(getSound);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => onSoundChange(setS), []);

  // Close on a click outside the panel, or Escape.
  useEffect(() => {
    if (!open) return;
    const away = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const silent = s.muted || (s.music === 0 && s.sfx === 0);
  const pos = [
    placement === "above" ? "bottom-full mb-2" : "top-full mt-2",
    align === "start" ? "left-0" : "right-0",
  ].join(" ");

  return (
    <div ref={ref} className="relative">
      <button
        className={`mc-slot flex items-center justify-center text-paneldark hover:text-black ${className}`}
        title="Sound"
        aria-label="Sound settings"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {silent ? "🔇" : "🔊"}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Sound settings"
          className={`mc-panel absolute z-50 w-56 p-4 animate-pop ${pos}`}
        >
          <VolumeSlider
            label="Music"
            value={s.music}
            disabled={s.muted}
            onChange={(music) => setSound({ music })}
          />
          <VolumeSlider
            label="Effects"
            value={s.sfx}
            disabled={s.muted}
            onChange={(v) => setSound({ sfx: v })}
            // Let the player hear the new level once they let go.
            onCommit={() => sfx.click()}
          />
          <button
            className="mc-btn text-[9px] w-full py-2 mt-1"
            onClick={() => {
              const muted = !s.muted;
              setSound({ muted });
              if (!muted) sfx.click();
            }}
          >
            {s.muted ? "Unmute" : "Mute all"}
          </button>
        </div>
      )}
    </div>
  );
}

function VolumeSlider({ label, value, onChange, onCommit, disabled }) {
  const id = useId();
  return (
    <div className={`mb-3 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex justify-between text-[9px] text-paneldark mb-2">
        <label htmlFor={id}>{label}</label>
        <span>{value}%</span>
      </div>
      <input
        id={id}
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onKeyUp={onCommit}
        className="mc-range w-full"
      />
    </div>
  );
}
