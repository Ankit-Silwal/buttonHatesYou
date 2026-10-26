// Every sound in The Reason is synthesized: short effects, plus a tiny step
// sequencer that loops the themes. One AudioContext, kept quiet on purpose.

const VOLUME = 0.16;
const MUSIC_LEVEL = 0.55;

let ctx = null;
let master = null;
let musicBus = null;
let muted = false;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : VOLUME;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = MUSIC_LEVEL;
  musicBus.connect(master);
  if (wanted) startMusic(wanted);
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.value = m ? 0 : VOLUME;
}

function tone(freq, dur = 0.12, type = 'sine', vol = 1, slideTo = null, delay = 0, bus = master) {
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
  g.connect(bus);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur = 0.3, vol = 0.6, freq = 1200, delay = 0, bus = master) {
  if (!ctx || muted) return;
  const t = ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
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
  g.connect(bus);
  src.start(t);
}

export const sfx = {
  jump: () => tone(380, 0.1, 'sine', 0.35, 640),
  djump: () => tone(520, 0.12, 'sine', 0.35, 900),
  land: () => noise(0.05, 0.25, 400),
  swing: () => noise(0.09, 0.35, 3200),
  hit: () => { tone(200, 0.12, 'square', 0.35, 90); noise(0.1, 0.4, 2400); },
  clang: () => { tone(900, 0.15, 'square', 0.2, 600); tone(1350, 0.2, 'sine', 0.2); },
  kill: () => { tone(500, 0.08, 'square', 0.3, 1000); noise(0.2, 0.4, 1800); },
  hurt: () => { tone(260, 0.2, 'sawtooth', 0.35, 110); noise(0.12, 0.4, 900); },
  dash: () => noise(0.16, 0.45, 5000),
  coin: () => { tone(988, 0.07, 'square', 0.25); tone(1319, 0.12, 'square', 0.25, null, 0.07); },
  heal: () => [660, 880, 1100].forEach((f, i) => tone(f, 0.1, 'sine', 0.4, null, i * 0.07)),
  item: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, 'triangle', 0.45, null, i * 0.08)),
  stun: () => { tone(140, 0.25, 'square', 0.4, 60); noise(0.25, 0.5, 700); },
  boom: () => { tone(70, 0.7, 'sine', 0.9, 35); noise(0.6, 0.6, 300); },
  crash: () => { noise(0.9, 0.8, 500); tone(90, 0.6, 'sawtooth', 0.3, 40); },
  door: () => { tone(160, 0.25, 'square', 0.25, 90); noise(0.2, 0.3, 600); },
  hammer: () => { tone(420, 0.05, 'square', 0.35, 200); noise(0.06, 0.5, 1500); },
  glitch: () => { for (let i = 0; i < 5; i++) tone(200 + Math.random() * 1600, 0.04, 'square', 0.18, null, i * 0.035); },
  error: () => { tone(330, 0.16, 'square', 0.3); tone(220, 0.25, 'square', 0.3, null, 0.17); },
  beat: () => { tone(60, 0.16, 'sine', 0.9, 40); tone(55, 0.2, 'sine', 0.7, 38, 0.22); },
  blip: (p = 1) => tone(260 * p + Math.random() * 30, 0.03, 'square', 0.07),
  pop: () => tone(700, 0.08, 'sine', 0.5, 1400),
  select: () => tone(660, 0.06, 'triangle', 0.35),
  confirm: () => { tone(660, 0.07, 'triangle', 0.4); tone(990, 0.12, 'triangle', 0.4, null, 0.07); },
  charge: () => tone(120, 1.2, 'sawtooth', 0.25, 700),
  shoot: () => tone(880, 0.1, 'square', 0.18, 300),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.6, null, i * 0.12)),
  crack: () => { noise(0.3, 0.7, 2600); tone(1800, 0.05, 'square', 0.2, 900); },
  rumble: () => noise(1.2, 0.5, 160),
  ring: () => [0, 0.18].forEach((d) => { tone(1318, 0.12, 'sine', 0.4, null, d); tone(1760, 0.12, 'sine', 0.3, null, d + 0.06); }),
};

/* ---------- music ---------- */

// Themes are written in eighth notes. Tokens: a note ("C5", "Eb4", "F#3"),
// "." for a rest and "_" to hold the previous note one more step.
// The boss theme is the village melody, minor and angry: Bobby's home,
// turned into a fight.
const VILLAGE_A = 'C5 _ E5 G5 A5 _ G5 _ | E5 _ D5 C5 D5 _ _ _ | C5 _ E5 G5 A5 _ C6 _ | B5 _ G5 E5 C5 _ _ _';
const VILLAGE_MINOR = 'C5 _ Eb5 G5 Ab5 _ G5 _ | Eb5 _ D5 C5 D5 _ _ _ | C5 _ Eb5 G5 Ab5 _ C6 _ | B4 _ G4 D5 C5 _ _ _';

const THEMES = {
  village: {
    bpm: 112,
    parts: [
      { notes: VILLAGE_A, wave: 'triangle', vol: 0.5 },
      { notes: 'C3 _ G3 _ C3 _ G3 _ | G2 _ D3 _ G2 _ D3 _ | A2 _ E3 _ F2 _ C3 _ | G2 _ D3 _ C3 _ G2 _', wave: 'sine', vol: 0.55 },
    ],
    drums: 'k . h . s . h . | k . h . s . h h',
  },
  adventure: {
    bpm: 140,
    parts: [
      { notes: 'A4 _ C5 E5 D5 _ C5 B4 | A4 _ E5 _ G5 _ E5 _ | F5 _ E5 D5 C5 _ B4 _ | C5 D5 E5 _ E5 _ . . | A4 _ C5 E5 D5 _ C5 B4 | A4 _ E5 _ A5 _ G5 _ | F5 _ E5 D5 E5 _ G#4 _ | A4 _ _ _ . . . .', wave: 'square', vol: 0.18 },
      { notes: 'A2 A3 A2 A3 A2 A3 A2 A3 | C3 C4 C3 C4 C3 C4 C3 C4 | F2 F3 F2 F3 F2 F3 F2 F3 | E2 E3 E2 E3 E2 E3 E2 E3 | A2 A3 A2 A3 A2 A3 A2 A3 | C3 C4 C3 C4 C3 C4 C3 C4 | D3 D4 D3 D4 E2 E3 E2 E3 | A2 A3 A2 A3 A2 _ _ _', wave: 'triangle', vol: 0.45 },
    ],
    drums: 'k . h k s . h . | k . h k s . h h',
  },
  quiet: {
    bpm: 68,
    parts: [
      { notes: VILLAGE_MINOR, wave: 'sine', vol: 0.45 },
      { notes: 'C3 _ _ _ _ _ _ _ | G2 _ _ _ _ _ _ _ | Ab2 _ _ _ F2 _ _ _ | G2 _ _ _ C3 _ _ _', wave: 'triangle', vol: 0.4 },
    ],
  },
  lab: {
    bpm: 96,
    parts: [
      { notes: 'E4 . . G4 . . F#4 . | E4 . . B3 . . . . | E4 . . G4 . . A4 . | F#4 . . D4 . . . .', wave: 'sine', vol: 0.4 },
      { notes: 'E2 _ E2 _ E2 _ E2 _ | C2 _ C2 _ C2 _ C2 _ | E2 _ E2 _ E2 _ E2 _ | D2 _ D2 _ B1 _ B1 _', wave: 'triangle', vol: 0.5 },
    ],
    drums: 'k . . . h . . . | k . . k h . . .',
  },
  danger: {
    bpm: 168,
    parts: [
      { notes: 'E5 . E5 . G5 . E5 D5 | E5 . E5 . B5 . A5 G5 | E5 . E5 . G5 . E5 D5 | C5 . D5 . B4 . . .', wave: 'square', vol: 0.15 },
      { notes: 'E2 E2 E3 E2 E2 E3 E2 E3 | E2 E2 E3 E2 E2 E3 E2 E3 | C2 C2 C3 C2 C2 C3 C2 C3 | D2 D2 D3 D2 B1 B1 B2 B1', wave: 'sawtooth', vol: 0.18 },
    ],
    drums: 'k h s h k k s h | k h s h k k s s',
  },
  boss: {
    bpm: 150,
    parts: [
      { notes: VILLAGE_MINOR, wave: 'sawtooth', vol: 0.14 },
      { notes: 'C2 C3 C2 C3 C2 C3 C2 C3 | G1 G2 G1 G2 G1 G2 G1 G2 | Ab1 Ab2 Ab1 Ab2 F1 F2 F1 F2 | G1 G2 G1 G2 G1 G2 B1 B2', wave: 'square', vol: 0.14 },
    ],
    drums: 'k h s h k k s h | k h s h k k s s',
  },
  hope: {
    bpm: 132,
    parts: [
      { notes: VILLAGE_A, wave: 'square', vol: 0.15 },
      { notes: 'C3 C3 G3 G3 C3 C3 G3 G3 | G2 G2 D3 D3 G2 G2 D3 D3 | A2 A2 E3 E3 F2 F2 C3 C3 | G2 G2 D3 D3 C3 C3 G2 G2', wave: 'triangle', vol: 0.45 },
      { notes: 'E4 _ _ _ _ _ _ _ | D4 _ _ _ B3 _ _ _ | C4 _ _ _ A3 _ _ _ | B3 _ _ _ E4 _ _ _', wave: 'sine', vol: 0.25 },
    ],
    drums: 'k . h k s . h . | k . h k s . h h',
  },
  ruins: {
    bpm: 76,
    parts: [
      { notes: 'A4 C5 E5 A5 G5 E5 C5 E5 | F4 A4 C5 F5 E5 C5 A4 C5 | D4 F4 A4 D5 C5 A4 F4 A4 | E4 G#4 B4 E5 D5 B4 G#4 B4', wave: 'sine', vol: 0.3 },
      { notes: 'A2 _ _ _ _ _ _ _ | F2 _ _ _ _ _ _ _ | D2 _ _ _ _ _ _ _ | E2 _ _ _ _ _ _ _', wave: 'triangle', vol: 0.45 },
    ],
  },
  love: {
    bpm: 84,
    parts: [
      { notes: 'A4 _ C5 _ F5 _ _ E5 | D5 _ C5 _ A4 _ _ _ | Bb4 _ D5 _ G5 _ _ F5 | E5 _ _ _ C5 _ _ _ | A4 _ C5 _ F5 _ _ A5 | G5 _ F5 _ D5 _ _ _ | Bb4 _ A4 _ G4 _ E5 _ | F5 _ _ _ _ _ _ _', wave: 'triangle', vol: 0.45 },
      { notes: 'F2 _ C3 _ F3 _ C3 _ | D2 _ A2 _ D3 _ A2 _ | G2 _ D3 _ G3 _ D3 _ | C3 _ G3 _ C3 _ G2 _ | F2 _ C3 _ F3 _ C3 _ | D2 _ A2 _ Bb2 _ F3 _ | C3 _ G3 _ C3 _ E3 _ | F2 _ C3 _ F3 _ _ _', wave: 'sine', vol: 0.5 },
    ],
  },
  // the bridal chorus (Wagner, 1850), at a button's pace
  wedding: {
    bpm: 96,
    parts: [
      { notes: 'C5 _ _ F5 F5 _ F5 _ | _ _ _ _ C5 _ _ G5 | E5 _ F5 _ _ _ _ _ | . . . . . . . . | C5 _ _ F5 F5 _ Bb5 _ | Bb5 _ A5 _ G5 _ F5 _ | E5 _ F5 _ G5 _ _ _ | . . . . . . . .', wave: 'triangle', vol: 0.5 },
      { notes: 'F3 _ _ _ A3 _ _ _ | F3 _ _ _ C3 _ _ _ | C3 _ _ _ F3 _ _ _ | F3 _ _ _ C3 _ _ _ | F3 _ _ _ D3 _ _ _ | Bb2 _ _ _ D3 _ _ _ | C3 _ _ _ C3 _ _ _ | F2 _ _ _ C3 _ _ _', wave: 'sine', vol: 0.45 },
    ],
  },
  music_box: {
    bpm: 84,
    parts: [{ notes: VILLAGE_A, wave: 'sine', vol: 0.4 }],
  },
};

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function freqOf(name) {
  const m = /^([A-G])([#b]?)(\d)$/.exec(name);
  if (!m) return null;
  const semi = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * 2 ** ((semi - 69) / 12);
}

// "C5 _ E5" -> [{ step: 0, f, len: 2 }, { step: 2, f, len: 1 }]
function parse(str) {
  const tokens = str.replace(/\|/g, ' ').trim().split(/\s+/);
  const out = [];
  tokens.forEach((tok, i) => {
    if (tok === '_') {
      if (out.length && out[out.length - 1].step + out[out.length - 1].len === i) out[out.length - 1].len++;
    } else if (tok !== '.') {
      const f = freqOf(tok);
      if (f) out.push({ step: i, f, len: 1 });
    }
  });
  return { events: out, steps: tokens.length };
}

const compiled = {};
function compile(name) {
  if (compiled[name]) return compiled[name];
  const t = THEMES[name];
  const parts = t.parts.map((p) => ({ ...p, ...parse(p.notes) }));
  const drums = t.drums ? t.drums.replace(/\|/g, ' ').trim().split(/\s+/) : null;
  const steps = Math.max(...parts.map((p) => p.steps));
  return (compiled[name] = { bpm: t.bpm, parts, drums, steps });
}

let wanted = null; // theme the game asked for (kept while audio is still locked)
let playing = null; // { name, theme, step, next, gain }
let timer = null;

function drum(kind, when, bus) {
  const d = when - ctx.currentTime;
  if (kind === 'k') tone(110, 0.14, 'sine', 0.9, 45, d, bus);
  else if (kind === 's') noise(0.12, 0.45, 2200, d, bus);
  else if (kind === 'h') noise(0.03, 0.18, 8000, d, bus);
}

function schedule() {
  if (!playing || !ctx) return;
  const { theme, gain } = playing;
  const stepDur = 60 / theme.bpm / 2;
  while (playing.next < ctx.currentTime + 0.15) {
    const s = playing.step % theme.steps;
    const when = playing.next;
    for (const p of theme.parts) {
      const local = s % p.steps;
      for (const ev of p.events) {
        if (ev.step !== local) continue;
        const dur = ev.len * stepDur * 0.95;
        tone(ev.f, dur, p.wave, p.vol, null, when - ctx.currentTime, gain);
      }
    }
    if (theme.drums && !muted) {
      const k = theme.drums[s % theme.drums.length];
      if (k !== '.') drum(k, when, gain);
    }
    playing.step++;
    playing.next += stepDur;
  }
}

function startMusic(name) {
  if (!ctx || !THEMES[name]) return;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 0.8);
  gain.connect(musicBus);
  playing = { name, theme: compile(name), step: 0, next: ctx.currentTime + 0.05, gain };
  if (!timer) timer = setInterval(schedule, 30);
}

function fadeOut(fade = 0.8) {
  if (!playing || !ctx) return;
  const g = playing.gain;
  g.gain.cancelScheduledValues(ctx.currentTime);
  g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + fade);
  setTimeout(() => g.disconnect(), fade * 1000 + 200);
  playing = null;
}

// Switch theme; null means silence. Asking for what is already playing is a no-op.
export function music(name, fade = 0.8) {
  wanted = name;
  if (playing?.name === name) return;
  fadeOut(fade);
  if (name) startMusic(name);
}

export function stopAll() {
  wanted = null;
  fadeOut(0.3);
  clearInterval(timer);
  timer = null;
}
