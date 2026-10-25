// Shared state and helpers for the story and the boss fight.
// Nothing here touches the browser at import time, so it is safe to import
// from a component that Next.js also renders on the server.

export const BOSS_AT = 50;
export const BOSS_HITS = 15;
export const GOAL = BOSS_AT + BOSS_HITS;
export const POST_GOAL = 20;
export const RICKROLL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const SAVE_KEY = 'pleaseDont.v1';

// Every class the engine puts on <body>, so a scene change can wipe them.
export const SCENE_CLASSES = ['cracked', 'ruined', 'puddle', 'dusk', 'collapsed', 'boss', 'post', 'glitchy', 'rave'];

export const FRIENDS = [
  { name: 'Kevin', c: '#9bbf9a', cd: '#6f9a6e' },
  { name: 'Bubbles', c: '#f3a6a0', cd: '#cf7d77' },
  { name: 'Gary', c: '#8fb8d8', cd: '#6591b3' },
  { name: 'Doris', c: '#f0c36d', cd: '#c99a45' },
  { name: 'Pip', c: '#c4a6dc', cd: '#9c7fb6' },
];

const fresh = () => ({
  // saved
  clicks: 0,
  post: 0,
  popped: [],
  inPost: false,
  done: false,
  muted: false,
  visits: 0,
  // runtime only
  mode: 'story', // story | boss | post | done
  locked: false,
  chase: false,
  disguise: -1,
  decoysOn: false,
  justRejected: false,
  dodges: 0,
  tired: false,
  lastDodge: 0,
  lastActive: 0,
});

export const G = fresh();
export const dom = {};
export const hooks = {}; // filled by story.js so boss.js can hand control back

export const $ = (s, el = document) => el.querySelector(s);
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function h(tag, cls = '', html = '') {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

/* ---------- lifetime ----------
   React may mount, unmount and remount the game (strict mode, fast refresh).
   Every timer, listener and loop goes through `scope` so it can all be torn
   down at once. */
let timers = new Set();
let intervals = new Set();
let offs = [];

export const scope = {
  dead: false,
  later(fn, ms) {
    const id = setTimeout(() => {
      timers.delete(id);
      if (!scope.dead) fn();
    }, ms);
    timers.add(id);
    return id;
  },
  cancel(id) {
    clearTimeout(id);
    timers.delete(id);
  },
  every(fn, ms) {
    const id = setInterval(() => !scope.dead && fn(), ms);
    intervals.add(id);
    return id;
  },
  on(target, ev, fn, opts) {
    target.addEventListener(ev, fn, opts);
    offs.push(() => target.removeEventListener(ev, fn, opts));
  },
  frame(fn) {
    return requestAnimationFrame((t) => !scope.dead && fn(t));
  },
  begin() {
    scope.dead = false;
    Object.assign(G, fresh());
  },
  dispose() {
    scope.dead = true;
    timers.forEach(clearTimeout);
    intervals.forEach(clearInterval);
    offs.forEach((off) => off());
    timers = new Set();
    intervals = new Set();
    offs = [];
  },
};

// A wait that silently never resumes once the game is torn down.
export const wait = (ms) => new Promise((r) => scope.later(r, ms));

/* ---------- saving ---------- */
export function save() {
  try {
    const { clicks, post, popped, inPost, done, muted, visits } = G;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ clicks, post, popped, inPost, done, muted, visits }));
  } catch {}
}

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (d) Object.assign(G, d);
  } catch {}
}

export function wipeSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {}
}

/* ---------- the character ----------
   Everyone in this game (the button, friends, decoys, the boss) is the same
   little round face with different colors and moods. */
export function makeChar(cls = '') {
  const el = h(
    'button',
    'char ' + cls,
    '<span class="legs"><i></i><i></i></span>' +
      '<span class="body"><span class="brows"><i></i><i></i></span>' +
      '<span class="eyes"><i></i><i></i></span><span class="mouth"></span></span>'
  );
  el.type = 'button';
  return el;
}

export function place(el, x, y) {
  el._x = x;
  el._y = y;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
}

export const setMood = (el, m) => (el.dataset.mood = m);

// Where things may stand: clear of the HUD and the dialogue line.
export function area(m = 70) {
  return { x0: m, x1: innerWidth - m, y0: 160, y1: innerHeight - m - 10 };
}

export function spot(ax, ay, minD = 180) {
  const b = area();
  let best = null;
  let bestD = -1;
  for (let i = 0; i < 24; i++) {
    const p = { x: rand(b.x0, b.x1), y: rand(b.y0, b.y1) };
    const d = ax == null ? Infinity : Math.hypot(p.x - ax, p.y - ay);
    if (d >= minD) return p;
    if (d > bestD) [best, bestD] = [p, d];
  }
  return best;
}

/* ---------- feedback ---------- */
export function say(text) {
  if (!text) return;
  dom.line.textContent = text;
  dom.line.classList.remove('in');
  void dom.line.offsetWidth;
  dom.line.classList.add('in');
}

export function floatText(text, x, y, cls = '') {
  const f = h('div', 'float ' + cls);
  f.textContent = text;
  f.style.left = x + 'px';
  f.style.top = y + 'px';
  dom.fx.append(f);
  f.addEventListener('animationend', () => f.remove());
}

export function shake(el = dom.app, power = 8, ms = 400) {
  if (reducedMotion() || !el) return;
  const frames = [];
  for (let i = 0; i < 8; i++) frames.push({ transform: `translate(${rand(-power, power)}px, ${rand(-power, power)}px)` });
  frames.push({ transform: 'none' });
  el.animate(frames, { duration: ms });
}

export function flash(color = '#fff') {
  const f = h('div', 'flash');
  f.style.background = color;
  dom.fx.append(f);
  f.addEventListener('animationend', () => f.remove());
}

export function confetti(n = 150) {
  const cols = ['#e2674f', '#f0c36d', '#9bbf9a', '#8fb8d8', '#f3a6a0', '#c4a6dc'];
  for (let i = 0; i < n; i++) {
    const c = h('i', 'confetti');
    c.style.background = pick(cols);
    c.style.left = innerWidth / 2 + 'px';
    c.style.top = innerHeight / 2 + 'px';
    dom.fx.append(c);
    const a = rand(0, Math.PI * 2);
    const d = rand(120, Math.max(innerWidth, innerHeight) * 0.7);
    c.animate(
      [
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 300}px) rotate(${rand(-720, 720)}deg)`, opacity: 0 },
      ],
      { duration: rand(1400, 2600), easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'forwards' }
    ).onfinish = () => c.remove();
  }
}

export function updateHud() {
  if (G.mode === 'post') dom.counter.textContent = `${G.post} / ${POST_GOAL}`;
  else if (G.mode === 'done') dom.counter.textContent = `${GOAL} / ${GOAL} ✓`;
  else dom.counter.textContent = `${G.clicks} / ${GOAL}`;
  const hits = G.clicks - BOSS_AT;
  [...dom.bossbar.children].forEach((s, i) => s.classList.toggle('gone', i < hits));
}

export function setScene(...classes) {
  document.body.classList.remove(...SCENE_CLASSES);
  document.body.classList.add(...classes);
}
