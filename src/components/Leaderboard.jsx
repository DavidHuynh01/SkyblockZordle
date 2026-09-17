import { useEffect, useState } from "react";
import { api, getPlayerName, setPlayerName } from "../utils/api.js";

function fmtTime(ms) {
  if (!ms) return "";
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m ? `${m}m ${s % 60}s` : `${s}s`;
}

const DIST_KEYS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Leaderboard({ onClose }) {
  const [entries, setEntries] = useState(null); // null = loading
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);

  const [name, setName] = useState(getPlayerName());
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    let active = true;
    const load = Promise.all([api.leaderboard().then((r) => r.entries || []), api.globalStats()]);
    load
      .then(([e, s]) => {
        if (!active) return;
        setEntries(e);
        setStats(s);
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  function saveName() {
    setPlayerName(name.trim().slice(0, 16));
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 1500);
  }

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, ...(stats?.dist || {}) };
  const maxDist = Math.max(1, ...DIST_KEYS.map((k) => dist[k] || 0));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="mc-panel w-full max-w-md p-5 animate-pop max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mc-title mc-title-sm text-xl sm:text-2xl text-center mb-4">
          Leaderboard
        </h2>

        {error && (
          <p className="text-[10px] text-paneldark text-center py-6">
            Couldn't reach the leaderboard server.
          </p>
        )}

        {!error && (
          <>
            {/* Display name */}
            <div className="mb-4">
              <label className="text-[8px] text-paneldark uppercase opacity-70">
                Your display name
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  value={name}
                  maxLength={16}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Anonymous"
                  className="flex-1 bg-[#3a3a3a] text-white px-3 py-2 text-[10px] outline-none mc-slot"
                />
                <button className="mc-btn text-[9px]" onClick={saveName}>
                  {savedMsg ? "Saved!" : "Save"}
                </button>
              </div>
            </div>

            {/* Today's top solvers */}
            <h3 className="text-[10px] text-paneldark mb-2">Today's fastest solves</h3>
            <div className="mc-panel-dark p-2 mb-4">
              {entries === null ? (
                <p className="text-white text-[9px] text-center py-3 opacity-70">Loading…</p>
              ) : entries.length === 0 ? (
                <p className="text-white text-[9px] text-center py-3 opacity-70">
                  No solves yet today — be the first!
                </p>
              ) : (
                <ol className="space-y-1">
                  {entries.map((e) => (
                    <li
                      key={e.rank}
                      className="flex items-center justify-between text-white text-[9px] px-1"
                    >
                      <span className="flex items-center gap-2">
                        <span className="opacity-60 w-5">#{e.rank}</span>
                        <span>{e.name}</span>
                      </span>
                      <span className="opacity-80">
                        {e.guesses}/8{e.timeMs ? ` · ${fmtTime(e.timeMs)}` : ""}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Global stats */}
            {stats && (
              <>
                <h3 className="text-[10px] text-paneldark mb-2">Global stats</h3>
                <div className="flex justify-around text-center text-paneldark mb-3">
                  <Stat label="Players today" value={stats.todayPlayers} />
                  <Stat label="Solved today" value={stats.todaySolved} />
                  <Stat label="Global win %" value={stats.winPercent} />
                </div>
                <div className="space-y-1">
                  {DIST_KEYS.map((g) => (
                    <div key={g} className="flex items-center gap-2 text-[8px] text-paneldark">
                      <span className="w-3">{g}</span>
                      <div className="flex-1 bg-[#8b8b8b] h-3">
                        <div
                          className="bg-[#2e7d32] h-3"
                          style={{ width: `${((dist[g] || 0) / maxDist) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right">{dist[g] || 0}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div className="flex justify-center mt-5">
          <button className="mc-btn text-[10px]" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-lg">{value}</div>
      <div className="text-[7px] opacity-70 uppercase">{label}</div>
    </div>
  );
}
