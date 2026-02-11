/* ── Web Audio API sound effects ── */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let alarmOsc: OscillatorNode | null = null;
let alarmGain: GainNode | null = null;
let alarmInterval: number | null = null;
let _enabled = true;
let _volume = 0.5;
let _unlocked = false;

function getCtx(): AudioContext | null {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = _volume;
    masterGain.connect(ctx.destination);
  }
  // If still suspended (mobile), don't try to play — it'll be silent anyway
  if (ctx.state === 'suspended') {
    ctx.resume();
    return null;
  }
  return ctx;
}

function getMaster(): GainNode | null {
  const c = getCtx();
  if (!c) return null;
  return masterGain!;
}

/**
 * Must be called from a direct user gesture (tap/click) to unlock
 * audio on mobile browsers. Call this on "Start Practice" tap.
 */
async function unlock(): Promise<void> {
  if (_unlocked) return;
  // Create context if needed
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = _volume;
    masterGain.connect(ctx.destination);
  }
  // Resume must happen inside user gesture
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  // Play a silent buffer to fully unlock on iOS
  const buf = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
  _unlocked = true;
}

/** Play a short tone */
function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.3) {
  if (!_enabled) return;
  const c = getCtx();
  if (!c) return;
  const m = getMaster();
  if (!m) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(m);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export const audio = {
  /** Call from a tap/click handler to unlock audio on mobile */
  unlock,

  click() {
    playTone(800, 0.06, 'square', 0.15);
  },

  error() {
    playTone(200, 0.25, 'sawtooth', 0.25);
  },

  success() {
    if (!_enabled) return;
    const c = getCtx();
    if (!c) return;
    const m = getMaster();
    if (!m) return;
    const now = c.currentTime;
    [523, 659, 784].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.2;
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.15 + 0.3);
      osc.connect(gain);
      gain.connect(m);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.4);
    });
  },

  startAlarm() {
    if (!_enabled || alarmOsc) return;
    const c = getCtx();
    if (!c) return;
    const m = getMaster();
    if (!m) return;
    alarmOsc = c.createOscillator();
    alarmGain = c.createGain();
    alarmOsc.type = 'square';
    alarmOsc.frequency.value = 440;
    alarmGain.gain.value = 0.15;
    alarmOsc.connect(alarmGain);
    alarmGain.connect(m);
    alarmOsc.start();
    let high = false;
    alarmInterval = window.setInterval(() => {
      if (alarmOsc) {
        high = !high;
        alarmOsc.frequency.value = high ? 880 : 440;
      }
    }, 500);
  },

  stopAlarm() {
    if (alarmOsc) {
      try { alarmOsc.stop(); } catch (_) { /* already stopped */ }
      alarmOsc.disconnect();
      alarmOsc = null;
    }
    if (alarmGain) {
      alarmGain.disconnect();
      alarmGain = null;
    }
    if (alarmInterval !== null) {
      clearInterval(alarmInterval);
      alarmInterval = null;
    }
  },

  setEnabled(enabled: boolean) {
    _enabled = enabled;
    if (!enabled) audio.stopAlarm();
  },

  setVolume(vol: number) {
    _volume = Math.max(0, Math.min(1, vol));
    if (masterGain) masterGain.gain.value = _volume;
  },

  get enabled() { return _enabled; },
  get volume() { return _volume; },
};
