import { useEffect, useRef, useState } from "react";
import GuessGrid from "./GuessGrid.jsx";
import ItemPicker from "./ItemPicker.jsx";
import ItemGrid from "./ItemGrid.jsx";
import ItemIcon from "./ItemIcon.jsx";
import HowToPlay from "./HowToPlay.jsx";
import SoundControl from "./SoundControl.jsx";
import Leaderboard from "./Leaderboard.jsx";
import {
  getRandomItem,
  getPuzzleNumber,
  isWin,
  compareGuess,
  buildShareText,
} from "../utils/game.js";
import { recordResult, winPercent } from "../utils/stats.js";
import { api } from "../utils/api.js";
import { sfx } from "../utils/sfx.js";

const MAX_GUESSES = 8;
const STORAGE_KEY = "skyblockzordle-daily-v2";

export default function Game({ mode, onBack }) {
  const isDaily = mode === "daily";

  // Unlimited keeps a local target; daily hides the answer on the server.
  const [target, setTarget] = useState(() => (isDaily ? null : getRandomItem()));
  const [date, setDate] = useState(isDaily ? null : "unlimited");
  const [puzzleNum, setPuzzleNum] = useState(null);
  const [offline, setOffline] = useState(false);
  const [retry, setRetry] = useState(0); // bump to ask the server again
  const [guessFailed, setGuessFailed] = useState(false);

  const [guesses, setGuesses] = useState([]); // [{ item, result }]
  const [status, setStatus] = useState("playing"); // playing | won | lost
  const [answer, setAnswer] = useState(null); // revealed item for the banner

  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLb, setShowLb] = useState(false);
  const [confirmGiveUp, setConfirmGiveUp] = useState(false);
  const [todayStats, setTodayStats] = useState(null);
  // Streak as counted by the server, for signed-in players only.
  const [serverStreak, setServerStreak] = useState(null);
  const startRef = useRef(null);

  // ---- Daily setup: fetch puzzle meta from the server. Only the server knows
  // the answer (it's picked with a secret), so the daily can't run offline. ----
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
          if (saved.serverStreak) setServerStreak(saved.serverStreak);
        }
      } catch {
        /* ignore corrupt storage */
      }
    }

    setOffline(false);
    api
      .daily()
      .then((d) => {
        if (!active) return;
        setDate(d.date);
        setPuzzleNum(d.puzzleNumber);
        hydrate(d.date);
      })
      .catch(() => {
        if (active) setOffline(true);
      });

    return () => {
      active = false;
    };
  }, [isDaily, retry]);

  // Persist daily progress.
  useEffect(() => {
    if (!isDaily || !date) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date, guesses, status, answer, serverStreak })
    );
  }, [isDaily, date, guesses, status, answer, serverStreak]);

  // On round end (daily): local stats only. A signed-in player's leaderboard
  // entry is written by the server when it sees the winning guess, so nothing
  // here is trusted for ranking.
  useEffect(() => {
    if (!isDaily || status === "playing") return;
    status === "won" ? sfx.win() : sfx.lose();
    api.globalStats().then(setTodayStats).catch(() => {});
    setStats(
      recordResult({
        won: status === "won",
        guesses: guesses.length,
        puzzleNumber: puzzleNum || getPuzzleNumber(),
      })
    );
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  function revealAnswer() {
    if (isDaily) {
      api.reveal(date).then((d) => setAnswer(d.answer)).catch(() => {});
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
    if (isDaily) {
      try {
        const r = await api.guess(date, item.id);
        result = r.result;
        correct = r.correct;
        if (r.answer) setAnswer(r.answer);
        if (r.streak) setServerStreak({ streak: r.streak, maxStreak: r.maxStreak });
        setGuessFailed(false);
      } catch {
        // API died mid-game. The guess doesn't count; the player can retry it.
        setGuessFailed(true);
        return;
      }
    } else {
      const t = target;
      result = compareGuess(item, t);
      correct = isWin(item, t);
    }

    const next = [...guesses, { item, result }];
    setGuesses(next);
    correct ? sfx.correct() : sfx.wrong();
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
    setConfirmGiveUp(true);
  }

  function reallyGiveUp() {
    setConfirmGiveUp(false);
    if (status !== "playing") return;
    setStatus("lost");
    sfx.lose();
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
      {/* Top bar. On phones the buttons drop to their own row: the wordmark
          alone takes most of a 375px screen, which pushed them off the edge. */}
      <div className="w-full max-w-4xl flex flex-wrap items-center justify-between mb-4 gap-2">
        <button className="mc-btn text-[10px]" onClick={onBack}>
          ← Menu
        </button>
        <div className="flex-1 sm:flex-none text-center">
          <div className="mc-title mc-title-sm text-base sm:text-2xl leading-none">
            SkyblockZordle
          </div>
          <div className="text-white text-shadow-mc text-[9px] sm:text-[11px] mt-1">
            {isDaily ? `Daily #${puzzleNum ?? "…"}` : "Unlimited"}
            {offline && <span className="opacity-60"> · offline</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 w-full justify-center sm:w-auto sm:justify-end">
          <SoundControl placement="below" align="start-mobile" />
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
          {!over && !offline && (
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
              {serverStreak && status === "won" && (
                <p className="text-[10px] text-[#3f7d2e] text-center">
                  🔥 {serverStreak.streak}
                  {serverStreak.streak === 1 ? " day streak" : " days in a row"}
                  {serverStreak.streak > 1 && serverStreak.streak === serverStreak.maxStreak
                    ? " — personal best!"
                    : ""}
                </p>
              )}
              <div className="flex gap-2">
                <button className="mc-btn text-[10px]" onClick={handleShare}>
                  {copied ? "Copied!" : "Share"}
                </button>
                <button className="mc-btn text-[10px]" onClick={() => setShowLb(true)}>
                  🏆 Leaderboard
                </button>
              </div>
              {todayStats && (
                <p className="text-[9px] text-paneldark text-center">
                  <b>{todayStats.todaySolved}</b> of <b>{todayStats.todayPlayers}</b>{" "}
                  {todayStats.todayPlayers === 1 ? "player" : "players"} solved today's puzzle
                </p>
              )}
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

      {offline ? (
        <div className="w-full max-w-md mc-panel p-5 flex flex-col items-center gap-3 text-center animate-pop">
          <p className="text-[11px] text-paneldark">Can't reach the server</p>
          <p className="text-[9px] text-paneldark opacity-70">
            The daily puzzle is checked on the server, so it needs a connection. Unlimited
            mode works offline.
          </p>
          <div className="flex gap-2">
            <button className="mc-btn text-[10px]" onClick={() => setRetry((n) => n + 1)}>
              Try again
            </button>
            <button className="mc-btn text-[10px]" onClick={onBack}>
              Menu
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Picker */}
          <div className="w-full max-w-4xl mb-3">
            <ItemPicker onGuess={handleGuess} guessedIds={guessedIds} disabled={over} />
            {guessFailed && (
              <p className="text-[9px] text-[#b23b3b] text-shadow-mc text-center mt-2">
                Couldn't reach the server. That guess didn't count, try it again.
              </p>
            )}
          </div>

          {/* Clickable item grid */}
          <div className="w-full max-w-4xl mb-5">
            <ItemGrid onGuess={handleGuess} guessedIds={guessedIds} disabled={over} />
          </div>

          {/* Guesses */}
          <div className="w-full max-w-4xl">
            <GuessGrid guesses={guesses} />
          </div>
        </>
      )}

      {confirmGiveUp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setConfirmGiveUp(false)}
        >
          <div className="mc-panel w-full max-w-xs p-5 animate-pop text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-[11px] text-paneldark mb-2">Give up?</p>
            <p className="text-[9px] text-paneldark opacity-70 mb-5">
              The answer will be revealed and the round ends.
            </p>
            <div className="flex justify-center gap-3">
              <button className="mc-btn text-[10px]" onClick={() => setConfirmGiveUp(false)}>
                Keep playing
              </button>
              <button
                className="mc-btn text-[10px]"
                style={{ background: "#b23b3b" }}
                onClick={reallyGiveUp}
              >
                Give up
              </button>
            </div>
          </div>
        </div>
      )}

      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
      {showLb && <Leaderboard onClose={() => setShowLb(false)} />}
    </div>
  );
}
