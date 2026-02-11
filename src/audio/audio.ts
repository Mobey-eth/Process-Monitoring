/* ── Web Audio API sound effects ── */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let alarmOsc: OscillatorNode | null = null;
let alarmGain: GainNode | null = null;
let alarmInterval: number | null = null;
let _enabled = true;
let _volume = 0.5;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = _volume;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function getMaster(): GainNode {
  getCtx();
  return masterGain!;
}

/** Play a short tone */
function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.3) {
  if (!_enabled) return;
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start();
  osc.stop(c.currentTime + duration);
}

export const audio = {
  click() {
    playTone(800, 0.06, 'square', 0.15);
  },

  error() {
    playTone(200, 0.25, 'sawtooth', 0.25);
  },

  success() {
    if (!_enabled) return;
    const c = getCtx();
    const now = c.currentTime;
    // C-E-G ascending chord
    [523, 659, 784].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.2;
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3 + i * 0.15 + 0.3);
      osc.connect(gain);
      gain.connect(getMaster());
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.4);
    });
  },

  startAlarm() {
    if (!_enabled || alarmOsc) return;
    const c = getCtx();
    alarmOsc = c.createOscillator();
    alarmGain = c.createGain();
    alarmOsc.type = 'square';
    alarmOsc.frequency.value = 440;
    alarmGain.gain.value = 0.15;
    alarmOsc.connect(alarmGain);
    alarmGain.connect(getMaster());
    alarmOsc.start();
    // Alternate between 440 and 880 Hz
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
      alarmOsc.stop();
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
