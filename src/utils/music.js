// Background music: one looping track, routed through Web Audio so the volume
// slider works everywhere (iOS Safari ignores <audio>.volume) and changes can
// be smoothed instead of clicking.
//
// Nothing is downloaded until music is actually going to play: the file is
// only requested after the player's first click or key press, and not at all
// while music is muted or at 0%.
//
// The track ("Ambient Piano" by leberch, Pixabay Content License) is hosted in
// S3 only. It is git-ignored because the license forbids redistributing the
// file unchanged, and the repository is public.
import { getSound, onSoundChange, toGain } from "./sound.js";

const SRC = `${import.meta.env.BASE_URL}audio/ambient-piano.mp3`;
const FADE_IN_SECONDS = 2.5;
const GESTURES = ["pointerdown", "click", "touchend", "keydown"];

let el = null;
let ctx = null;
let gain = null;
let interacted = false; // browsers refuse to start audio before a user gesture
let started = false; // playback has actually begun at least once
let pauseTimer = null;

function targetGain(s = getSound()) {
  return s.muted ? 0 : toGain(s.music);
}

// Built lazily, on the first gesture, so the AudioContext is allowed to run.
function ensureGraph() {
  if (el) return true;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    el = new Audio(SRC);
    el.loop = true;
    el.preload = "auto";
    ctx = new Ctx();
    gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(el).connect(gain).connect(ctx.destination);
    return true;
  } catch {
    el = null;
    return false;
  }
}

function stopListening() {
  GESTURES.forEach((g) => window.removeEventListener(g, onGesture));
}

function sync({ fade = false } = {}) {
  const target = targetGain();
  const shouldPlay = interacted && target > 0 && !document.hidden;

  if (!shouldPlay) {
    if (!el) return;
    // Duck quickly, then pause so the browser stops decoding in the background.
    clearTimeout(pauseTimer);
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    pauseTimer = setTimeout(() => el.pause(), 400);
    return;
  }

  if (!ensureGraph()) return;
  clearTimeout(pauseTimer);
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  const param = gain.gain;
  param.cancelScheduledValues(now);
  if (el.paused || fade) {
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(target, now + FADE_IN_SECONDS);
    el.play()
      .then(() => {
        started = true;
        stopListening();
      })
      // Not allowed yet (e.g. the gesture didn't count on this browser):
      // keep listening and try again on the next one.
      .catch(() => {});
  } else {
    // Dragging the slider: follow it closely, without zipper noise.
    param.setTargetAtTime(target, now, 0.05);
  }
}

function onGesture() {
  if (started) return;
  interacted = true;
  sync({ fade: true });
}

export function initMusic() {
  if (typeof window === "undefined") return;
  GESTURES.forEach((g) => window.addEventListener(g, onGesture, { passive: true }));
  // Fade out when the tab is hidden, back in when the player returns.
  document.addEventListener("visibilitychange", () => sync({ fade: !document.hidden }));
  onSoundChange(() => sync());
}
