import { useEffect, useRef, useState } from "react";
import GuessGrid from "./GuessGrid.jsx";
import ItemPicker from "./ItemPicker.jsx";
import ItemGrid from "./ItemGrid.jsx";
import ItemIcon from "./ItemIcon.jsx";
import HowToPlay from "./HowToPlay.jsx";
import Leaderboard from "./Leaderboard.jsx";
import {
  getDailyItem,
  getRandomItem,
  getPuzzleNumber,
  getDateKey,
  isWin,
  compareGuess,
  buildShareText,
} from "../utils/game.js";
import { recordResult, winPercent } from "../utils/stats.js";
import { api, getClientId, getPlayerName } from "../utils/api.js";

const MAX_GUESSES = 8;
const STORAGE_KEY = "skyblockzordle-daily-v2";

export default function Game({ mode, onBack }) {
  const isDaily = mode === "daily";

  // Unlimited keeps a local target; daily hides the answer on the server.
  const [target, setTarget] = useState(() => (isDaily ? null : getRandomItem()));
  const [date, setDate] = useState(isDaily ? null : "unlimited");
  const [puzzleNum, setPuzzleNum] = useState(null);
  const [offline, setOffline] = useState(false);

  const [guesses, setGuesses] = useState([]); // [{ item, result }]
  const [status, setStatus] = useState("playing"); // playing | won | lost
  const [answer, setAnswer] = useState(null); // revealed item for the banner

  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLb, setShowLb] = useState(false);
  const startRef = useRef(null);

  // ---- Daily setup: fetch puzzle meta from the server (falls back to a local
  // computation if the API is unreachable so the game still works offline). ----
  useEffect(() => {
    if (!isDaily) return;
    let active = true;

    function hydrate(dateKey) {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
        if (saved.date === dateKey && Array.isArray(saved.guesses)) {
          setGuesses(saved.guesses);
          setStatus(saved.status || "playing");
          if (saved.answer) setAnswer(saved.answer);
        }
      } catch {
        /* ignore corrupt storage */
      }
    }

    api
      .daily()
      .then((d) => {
        if (!active) return;
        setDate(d.date);
        setPuzzleNum(d.puzzleNumber);
        hydrate(d.date);
      })
      .catch(() => {
        if (!active) return;
        // Offline fallback: compute the daily locally.
        const dk = getDateKey();
        setOffline(true);
        setTarget(getDailyItem());
        setDate(dk);
        setPuzzleNum(getPuzzleNumber());
        hydrate(dk);
      });

    return () => {
      active = false;
    };
  }, [isDaily]);

  // Persist daily progress.
  useEffect(() => {
    if (!isDaily || !date) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date, guesses, status, answer }));
  }, [isDaily, date, guesses, status, answer]);

  // On round end (daily): record local stats + submit to the leaderboard.
  useEffect(() => {
    if (!isDaily || status === "playing") return;
    const won = status === "won";
    const puzzleNumber = puzzleNum || getPuzzleNumber();
    setStats(recordResult({ won, guesses: guesses.length, puzzleNumber }));
    if (!offline && date) {
      const timeMs = startRef.current ? Date.now() - startRef.current : 0;
      api
        .submitScore({
          name: getPlayerName() || "Anonymous",
          date,
          guesses: guesses.length,
          won,
          timeMs,
          clientId: getClientId(),
        })
        .catch(() => {});
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  function revealAnswer() {
    if (isDaily && !offline && date) {
      api.reveal(date).then((d) => setAnswer(d.answer)).catch(() => target && setAnswer(target));
    } else {
      setAnswer(target);
    }
  }

  async function handleGuess(item) {
    if (status !== "playing") return;
    if (guesses.some((g) => g.item.id === item.id)) return; // no repeats
    if (guesses.length === 0) startRef.current = Date.now();

    let result;
    let correct;
    if (isDaily && !offline) {
      try {
        const r = await api.guess(date, item.id);
        result = r.result;
        correct = r.correct;
        if (r.answer) setAnswer(r.answer);
      } catch {
        // API died mid-game — switch to local checking.
        const t = getDailyItem();
        setTarget(t);
        setOffline(true);
        result = compareGuess(item, t);
        correct = isWin(item, t);
      }
    } else {
      const t = target;
      result = compareGuess(item, t);
      correct = isWin(item, t);
    }

    const next = [...guesses, { item, result }];
    setGuesses(next);
    if (correct) {
      setStatus("won");
      setAnswer(item);
    } else if (next.length >= MAX_GUESSES) {
      setStatus("lost");
      revealAnswer();
    }
  }

  function giveUp() {
    if (status !== "playing") return;
    setStatus("lost");
    revealAnswer();
  }

  function playAgain() {
    setTarget(getRandomItem());
    setGuesses([]);
    setStatus("playing");
    setAnswer(null);
    startRef.current = null;
  }

  function handleShare() {
    const text = buildShareText(guesses, puzzleNum || getPuzzleNumber(), status === "won");
    const done = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
    else done();
  }

  const guessedIds = guesses.map((g) => g.item.id);
  const over = status !== "playing";

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-4 py-6">
      {/* Top bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 gap-2">
        <button className="mc-btn text-[10px]" onClick={onBack}>
          ← Menu
        </button>
        <div className="text-center">
          <div className="mc-title mc-title-sm text-base sm:text-2xl leading-none">
            SkyblockZordle
          </div>
          <div className="text-white text-shadow-mc text-[9px] sm:text-[11px] mt-1">
            {isDaily ? `Daily #${puzzleNum ?? "…"}` : "Unlimited"}
            {offline && <span className="opacity-60"> · offline</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDaily && (
            <button
              className="mc-slot w-9 h-9 flex items-center justify-center text-paneldark hover:text-black"
              title="Leaderboard"
              aria-label="Leaderboard"
              onClick={() => setShowLb(true)}
            >
              🏆
            </button>
          )}
          <button
            className="mc-slot w-9 h-9 flex items-center justify-center text-paneldark hover:text-black"
            title="How to play"
            aria-label="How to play"
            onClick={() => setShowHelp(true)}
          >
            ?
          </button>
          {!over && (
            <button
              className="mc-slot w-9 h-9 flex items-center justify-center text-[#b23b3b] hover:brightness-110"
              title="Give up"
              aria-label="Give up"
              onClick={giveUp}
            >
              ✕
            </button>
          )}
          <div className="text-white text-[10px] text-shadow-mc ml-1">
            {guesses.length}/{MAX_GUESSES}
          </div>
        </div>
      </div>

      {/* Result banner */}
      {over && (
        <div className="w-full max-w-4xl mc-panel p-4 mb-4 flex flex-col items-center gap-3 animate-pop">
          <p className="text-sm text-paneldark">
            {status === "won"
              ? `Solved in ${guesses.length} ${guesses.length === 1 ? "guess" : "guesses"}!`
              : "Out of guesses!"}
          </p>
          {answer && (
            <div className="flex items-center gap-3">
              <div className="mc-slot p-1">
                <ItemIcon item={answer} size={48} />
              </div>
              <div className="text-[11px] text-paneldark">
                <div>{answer.name}</div>
                <div className="opacity-70 text-[9px]">
                  {answer.rarity} · {answer.category}
                </div>
              </div>
            </div>
          )}
          {isDaily ? (
            <>
              {stats && (
                <div className="flex gap-4 sm:gap-6 text-center text-paneldark">
                  {[
                    ["Played", stats.played],
                    ["Win %", winPercent(stats)],
                    ["Streak", stats.currentStreak],
                    ["Max", stats.maxStreak],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div className="text-lg">{val}</div>
                      <div className="text-[7px] opacity-70 uppercase">{label}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button className="mc-btn text-[10px]" onClick={handleShare}>
                  {copied ? "Copied!" : "Share"}
                </button>
                <button className="mc-btn text-[10px]" onClick={() => setShowLb(true)}>
                  🏆 Leaderboard
                </button>
              </div>
              <p className="text-[8px] text-paneldark opacity-70 text-center">
                Come back tomorrow for a new item!
              </p>
            </>
          ) : (
            <button className="mc-btn text-[10px]" onClick={playAgain}>
              Play Again
            </button>
          )}
        </div>
      )}

      {/* Picker */}
      <div className="w-full max-w-4xl mb-3">
        <ItemPicker onGuess={handleGuess} guessedIds={guessedIds} disabled={over} />
      </div>

      {/* Clickable item grid */}
      <div className="w-full max-w-4xl mb-5">
        <ItemGrid onGuess={handleGuess} guessedIds={guessedIds} disabled={over} />
      </div>

      {/* Guesses */}
      <div className="w-full max-w-4xl">
        <GuessGrid guesses={guesses} />
      </div>

      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
      {showLb && <Leaderboard onClose={() => setShowLb(false)} />}
    </div>
  );
}
