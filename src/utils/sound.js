// Sound settings shared by the music player and the UI sound effects: a
// volume for each (0–100, as the sliders show it) and a master mute. Saved per
// browser so a player's choice sticks.

const KEYS = {
  muted: "skyblockzordle-muted", // predates the sliders; kept so old choices survive
  music: "skyblockzordle-music-volume",
  sfx: "skyblockzordle-sfx-volume",
};

export const DEFAULTS = { music: 40, sfx: 100, muted: false };

const listeners = new Set();

export function clampPercent(value, fallback = DEFAULTS.music) {
  const n = Number(value);
  if (value === undefined || value === null || value === "" || Number.isNaN(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n)));
}

// Slider percent -> gain. Hearing is roughly logarithmic, so a linear slider
// would put nearly all the audible change in its bottom fifth. Squaring
// spreads it out: 50% on the slider sounds like about half as loud.
export function toGain(percent) {
  const p = clampPercent(percent, 0) / 100;
  return p * p;
}

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    /* private mode / storage blocked: the setting just won't persist */
  }
}

export function getSound() {
  return {
    muted: read(KEYS.muted) === "1",
    music: clampPercent(read(KEYS.music) ?? undefined, DEFAULTS.music),
    sfx: clampPercent(read(KEYS.sfx) ?? undefined, DEFAULTS.sfx),
  };
}

export function setSound(patch) {
  if ("muted" in patch) write(KEYS.muted, patch.muted ? "1" : "0");
  if ("music" in patch) write(KEYS.music, clampPercent(patch.music, DEFAULTS.music));
  if ("sfx" in patch) write(KEYS.sfx, clampPercent(patch.sfx, DEFAULTS.sfx));
  const next = getSound();
  listeners.forEach((fn) => fn(next));
  return next;
}

export function onSoundChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
