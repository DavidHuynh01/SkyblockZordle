import { useEffect, useState } from "react";
import { isMuted, setMuted, onMuteChange, sfx } from "../utils/sfx.js";

export default function SoundToggle({ className = "" }) {
  const [muted, setLocal] = useState(isMuted());
  useEffect(() => onMuteChange(setLocal), []);

  return (
    <button
      className={`mc-slot w-9 h-9 flex items-center justify-center text-paneldark hover:text-black ${className}`}
      title={muted ? "Sound off" : "Sound on"}
      aria-label={muted ? "Turn sound on" : "Turn sound off"}
      onClick={() => {
        const next = !muted;
        setMuted(next);
        if (!next) sfx.click(); // confirm it's back on
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}
