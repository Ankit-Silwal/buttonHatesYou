'use strict';

// Tiny synthesized sounds. Master volume is kept low on purpose.
const Sound = (() => {
  const VOLUME = 0.12;
  let ctx = null;
  let master = null;
  let muted = false;

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(ctx.destination);
  }

  function tone(freq, dur = 0.12, type = 'sine', vol = 1, slideTo = null, delay = 0) {
    if (!ctx || muted) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(dur = 0.3, vol = 0.6, freq = 1200) {
    if (!ctx || muted) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start();
  }

  return {
    init,
    setMuted(m) {
      muted = m;
      if (master) master.gain.value = m ? 0 : VOLUME;
    },
    click: (n = 0) => tone(320 + Math.min(n, 90) * 6, 0.09, 'triangle', 0.8),
    pop: () => tone(700, 0.08, 'sine', 0.9, 1400),
    nope: () => tone(150, 0.18, 'square', 0.35, 110),
    bad: () => tone(220, 0.25, 'sawtooth', 0.3, 120),
    crack: () => noise(0.35, 0.7, 900),
    crash: () => { noise(0.8, 0.9, 500); tone(90, 0.6, 'sawtooth', 0.35, 40); },
    boom: () => { tone(70, 0.7, 'sine', 1, 35); noise(0.5, 0.5, 300); },
    sob: () => { tone(520, 0.25, 'sine', 0.5, 380); tone(480, 0.3, 'sine', 0.4, 340, 0.3); },
    ring: () => { tone(880, 0.1, 'sine', 0.5); tone(880, 0.1, 'sine', 0.5, null, 0.16); },
    hit: () => { tone(180, 0.15, 'square', 0.45, 90); noise(0.15, 0.5, 2000); },
    jump: () => tone(400, 0.12, 'sine', 0.4, 700),
    beep: (f) => tone(f, 0.25, 'sine', 0.7),
    tick: () => tone(1000, 0.03, 'square', 0.2),
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.7, null, i * 0.12)),
  };
})();
