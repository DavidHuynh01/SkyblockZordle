// Tiny synthesized UI sounds (Web Audio). No audio files: nothing to download,
// nothing to license. Browsers block audio until the user interacts, and the
// AudioContext is only created on first play. Loudness follows the "Effects"
// slider and the master mute in sound.js.
import { getSound, toGain } from "./sound.js";

let ctx = null;

function audio() {
  const { muted, sfx } = getSound();
  if (muted || sfx === 0) return null;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = ctx || new Ctx();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// One short blip. `slideTo` bends the pitch, which is what makes it read as a
// "win" rather than a beep.
function blip({ freq, dur = 0.09, type = "square", gain = 0.05, at = 0, slideTo }) {
  const a = audio();
  if (!a) return;
  // exponential ramps can't reach 0, so a near-silent slider floors at 0.0002
  const peak = Math.max(0.0002, gain * toGain(getSound().sfx));
  const t0 = a.currentTime + at;
  const osc = a.createOscillator();
  const vol = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  // quick attack, smooth decay — avoids the click of an abrupt stop
  vol.gain.setValueAtTime(0.0001, t0);
  vol.gain.exponentialRampToValueAtTime(peak, t0 + 0.01);
  vol.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(vol).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  click: () => blip({ freq: 420, dur: 0.05, gain: 0.035 }),
  correct: () => blip({ freq: 660, dur: 0.1, slideTo: 880, gain: 0.05 }),
  wrong: () => blip({ freq: 220, dur: 0.12, type: "triangle", gain: 0.045 }),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => blip({ freq: f, dur: 0.13, at: i * 0.09, gain: 0.05 }));
  },
  lose: () => {
    [392, 330, 262].forEach((f, i) => blip({ freq: f, dur: 0.18, type: "triangle", at: i * 0.12, gain: 0.045 }));
  },
};
