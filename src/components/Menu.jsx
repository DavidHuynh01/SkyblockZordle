import { useState } from "react";
import CreditsModal from "./CreditsModal.jsx";
import Leaderboard from "./Leaderboard.jsx";

const GITHUB_URL = "https://github.com/DavidHuynh01";
const DISCORD_URL = "https://discord.gg/skyblock";

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.6 8.21 11.16.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.7-4.04-1.58-4.04-1.58-.55-1.36-1.34-1.73-1.34-1.73-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.79 2.81 1.27 3.5.97.11-.76.42-1.27.76-1.56-2.67-.3-5.47-1.3-5.47-5.78 0-1.28.47-2.32 1.24-3.14-.13-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.2.96-.26 1.98-.39 3-.4 1.02 0 2.04.14 3 .4 2.28-1.52 3.29-1.2 3.29-1.2.66 1.64.25 2.86.12 3.16.77.82 1.24 1.86 1.24 3.14 0 4.49-2.81 5.47-5.49 5.76.43.36.81 1.09.81 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.21.68.83.56C20.57 21.88 24 17.48 24 12.29 24 5.78 18.63.5 12 .5z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.369a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.371-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.245.198.372.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function CreditsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </svg>
  );
}

export default function Menu({ onNavigate }) {
  const [showCredits, setShowCredits] = useState(false);
  const [showLb, setShowLb] = useState(false);
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mc-panel px-6 sm:px-10 py-6 mb-12 -rotate-1 max-w-[92vw]">
        <h1 className="mc-title text-2xl sm:text-5xl text-center break-words">
          SkyblockZordle
        </h1>
      </div>

      <div className="flex flex-col gap-4 w-72">
        <button
          className="mc-btn text-base"
          onClick={() => onNavigate("daily")}
        >
          DAILY GAME
        </button>
        <button
          className="mc-btn text-base"
          onClick={() => onNavigate("unlimited")}
        >
          UNLIMITED
        </button>
        <button
          className="mc-btn text-base"
          onClick={() => onNavigate("collections")}
        >
          COLLECTIONS
        </button>
        <button className="mc-btn text-base" onClick={() => setShowLb(true)}>
          LEADERBOARD
        </button>

        {/* Icon row: GitHub · Discord · Credits */}
        <div className="flex justify-center gap-3 mt-1">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            title="GitHub"
            className="mc-slot p-3 w-14 h-14 flex items-center justify-center text-paneldark hover:text-black hover:brightness-110"
          >
            <GithubIcon />
          </a>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
            title="Discord"
            className="mc-slot p-3 w-14 h-14 flex items-center justify-center text-[#5865F2] hover:brightness-110"
          >
            <DiscordIcon />
          </a>
          <button
            onClick={() => setShowCredits(true)}
            aria-label="Credits"
            title="Credits"
            className="mc-slot p-3 w-14 h-14 flex items-center justify-center text-paneldark hover:text-black hover:brightness-110"
          >
            <CreditsIcon />
          </button>
        </div>
      </div>

      {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}
      {showLb && <Leaderboard onClose={() => setShowLb(false)} />}

      <p className="text-white text-[9px] text-shadow-mc mt-12 opacity-80 text-center max-w-md leading-relaxed">
        Guess the daily Hypixel Skyblock item. Each guess reveals how close you
        are — ▲ / ▼ mean the answer is higher / lower.
      </p>
    </div>
  );
}
