// Tiny synthesized message tones. We use the Web Audio API instead of
// shipping .wav files — the result is two short, lossless beeps with no
// network cost and no asset pipeline.
//
//  • "sent"     → quick ascending chirp (~120ms, 800 → 1300 Hz)
//  • "received" → soft descending tap   (~150ms, 880 → 600 Hz)
//
// We respect both the prefers-reduced-motion media query and a per-user
// localStorage opt-out (`silicon-interface:sounds = "off"`) so it's never
// invasive. AudioContext is lazily constructed and reused — browsers cap
// the number that can exist at once.

let _ctx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  const Ctor =
    (window as unknown as { AudioContext: typeof AudioContext }).AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    _ctx = new Ctor();
    return _ctx;
  } catch {
    return null;
  }
}

function enabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem("silicon-interface:sounds") === "off") return false;
  } catch {
    /* private mode etc — fine */
  }
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

function tone(start: number, end: number, durSec: number, vol = 0.07) {
  if (!enabled()) return;
  const ac = ctx();
  if (!ac) return;
  // Some browsers suspend AudioContext until a user gesture; resume is
  // idempotent and a no-op when already running.
  if (ac.state === "suspended") ac.resume().catch(() => undefined);
  const t0 = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(start, t0);
  osc.frequency.exponentialRampToValueAtTime(end, t0 + durSec);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + durSec + 0.02);
}

export function playSent() {
  tone(820, 1320, 0.12);
}

export function playReceived() {
  tone(880, 620, 0.16, 0.06);
}
