import { sfx, initAudio, music } from './audio';
import { drawSky, drawSolid, drawDeco, drawHud, drawEffects, SPEAKERS, setFont, FONTS } from './draw';

// The world is drawn at a fixed 960x540 and scaled to fit the screen.
export const W = 960;
export const H = 540;
export const GRAVITY = 2100;
const STEP = 1 / 60;

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const cx = (e) => e.x + e.w / 2;
export const cy = (e) => e.y + e.h / 2;

const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyZ: 'jump',
  KeyJ: 'attack', KeyX: 'attack',
  KeyK: 'dash', KeyC: 'dash', ShiftLeft: 'dash', ShiftRight: 'dash',
  KeyQ: 'special', KeyL: 'special', KeyV: 'special',
  KeyE: 'act', Enter: 'act', KeyF: 'act',
};

export class Input {
  held = new Set();
  fresh = new Set();
  press(a) {
    if (!this.held.has(a)) this.fresh.add(a);
    this.held.add(a);
  }
  release(a) {
    this.held.delete(a);
  }
  down(a) {
    return this.held.has(a);
  }
  hit(a) {
    return this.fresh.has(a);
  }
  clear() {
    this.held.clear();
    this.fresh.clear();
  }
}

// Moves a body through the solid rectangles one axis at a time.
// One-way platforms only catch things falling onto them from above.
export function moveBody(g, b, dt) {
  b.wall = 0;
  b.x += b.vx * dt;
  for (const s of g.solids) {
    if (s.off || s.oneWay || !overlap(b, s)) continue;
    // only sunk a little into the top: let the vertical pass lift us out
    if (b.y + b.h - s.y < 8 && b.vy >= 0) continue;
    if (b.vx > 0) b.x = s.x - b.w;
    else if (b.vx < 0) b.x = s.x + s.w;
    else b.x = cx(b) < cx(s) ? s.x - b.w : s.x + s.w;
    b.wall = b.vx > 0 ? 1 : -1;
    b.vx = 0;
  }
  const prevBottom = b.y + b.h;
  b.y += b.vy * dt;
  b.ground = null;
  for (const s of g.solids) {
    if (s.off || !overlap(b, s)) continue;
    if (s.oneWay) {
      if (b.vy < 0 || prevBottom > s.y + 2 || b.dropping) continue;
    }
    if (b.vy >= 0) {
      b.y = s.y - b.h;
      b.ground = s;
    } else {
      b.y = s.y + s.h;
    }
    b.vy = 0;
  }
  // stand still on a platform that is moving under us
  if (b.ground?.dx) b.x += b.ground.dx;
}

// A point is solid ground (used by walkers to avoid ledges).
export function solidAt(g, x, y) {
  return g.solids.some((s) => !s.off && x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
}

export class Game {
  constructor(canvas, hooks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hooks = hooks;
    setFont(getComputedStyle(document.documentElement).getPropertyValue('--font'));
    this.flags = hooks.flags ?? {};
    this.input = new Input();
    this.ui = { talk: null, choice: null, card: null, objective: '', prompt: '', retry: null };
    this.paused = false;
    this.scale = 1;
    this.dpr = 1;
    this.clear();

    this.onKey = (e) => {
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (e.type === 'keydown' && !e.repeat) this.hooks.onPause?.();
        return;
      }
      if (e.type === 'keydown' && this.ui.choice && /^Digit[1-4]$/.test(e.code)) {
        this.pick(Number(e.code.slice(5)) - 1);
        return;
      }
      const a = KEYS[e.code];
      if (!a) return;
      if (e.target?.tagName === 'INPUT') return;
      e.preventDefault();
      if (e.type === 'keydown') {
        initAudio();
        this.input.press(a);
      } else this.input.release(a);
    };
    this.onBlur = () => this.input.clear();
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    window.addEventListener('blur', this.onBlur);

    this.last = performance.now();
    this.acc = 0;
    this.frame = (t) => {
      this.raf = requestAnimationFrame(this.frame);
      const dt = Math.min(0.1, (t - this.last) / 1000);
      this.last = t;
      if (!this.paused) {
        this.acc += dt;
        while (this.acc >= STEP) {
          this.update(STEP);
          this.acc -= STEP;
        }
      }
      this.render();
      if (this.dirty) {
        this.dirty = false;
        this.hooks.onUi?.({ ...this.ui });
      }
    };
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    window.removeEventListener('blur', this.onBlur);
  }

  // Empties the world (the player object survives and is re-added by load).
  clear() {
    this.solids = [];
    this.ents = [];
    this.parts = [];
    this.deco = [];
    this.waiters = [];
    this.time = this.time ?? 0;
    this.level = { w: W, h: H, theme: 'village' };
    this.cam = { x: W / 2, y: H / 2, zoom: 1, shake: 0, target: null, fixed: null, ox: 0, oy: 0 };
    this.fx = { fade: this.fx?.fade ?? 0, fadeTo: this.fx?.fadeTo ?? 0, fadeSpeed: 2, flash: 0, glitch: 0, tint: null, tintA: 0, redSky: 0, letterbox: 0, heart: 0, noHud: false, bw: 0 };
    this.boss = null;
    this.locked = this.locked ?? false; // a level change mid-cutscene stays a cutscene
    this.freeze = false;
    this.checkpointAt = null;
    this.onRespawn = null;
  }

  // level: { w, h, theme, solids, deco, spawn: {x, y} }
  load(level, player) {
    this.clear();
    this.level = { h: H, ...level };
    this.solids = (level.solids ?? []).map((s) => ({ ...s }));
    this.deco = level.deco ?? [];
    if (player) {
      this.player = player;
      player.x = level.spawn?.x ?? 60;
      player.y = level.spawn?.y ?? 300;
      player.vx = player.vy = 0;
      player.goal = null;
      this.add(player);
      this.checkpoint(player.x, player.y);
      this.snapCamera();
    }
    this.dirty = true;
  }

  add(e) {
    this.ents.push(e);
    e.init?.(this);
    return e;
  }

  addSolid(s) {
    this.solids.push(s);
    return s;
  }

  checkpoint(x, y) {
    this.checkpointAt = { x, y };
  }

  /* ---------- the loop ---------- */
  update(dt) {
    this.time += dt;
    const inp = this.input;

    this.updateTalk(dt);

    const frozen = !!(this.ui.talk || this.ui.choice || this.freeze);
    for (const s of this.solids) {
      s.dx = s.dy = 0;
      if (!frozen) s.update?.(this, dt);
    }
    for (const e of this.ents) {
      if (e.dead) continue;
      if (frozen && !e.alwaysUpdate && e !== this.player) continue;
      e.update?.(this, dt);
    }
    this.ents = this.ents.filter((e) => !e.dead || e === this.player);

    for (const p of this.parts) {
      p.life -= dt;
      p.vy += (p.grav ?? 900) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.parts = this.parts.filter((p) => p.life > 0);

    this.updatePrompt();
    this.updateCamera(dt);
    this.updateFx(dt);

    // scripts waiting on a condition
    if (this.waiters.length) {
      const ready = this.waiters.filter((w) => w.test());
      if (ready.length) {
        this.waiters = this.waiters.filter((w) => !ready.includes(w));
        ready.forEach((w) => w.resolve());
      }
    }
    inp.fresh.clear();
  }

  updateTalk(dt) {
    const inp = this.input;
    const t = this.ui.talk;
    const advance = inp.hit('act') || inp.hit('jump') || inp.hit('attack');
    if (t) {
      const before = Math.floor(t.shown);
      t.shown = Math.min(t.text.length, t.shown + dt * (t.speed ?? 42));
      if (Math.floor(t.shown) !== before) {
        if (Math.floor(t.shown) % 3 === 0 && t.text[Math.floor(t.shown)] !== ' ') sfx.blip(SPEAKERS[t.who]?.pitch ?? 1);
        this.dirty = true;
      }
      const done = t.shown >= t.text.length;
      if (done) t.age = (t.age ?? 0) + dt;
      if (t.auto != null && done && t.age >= t.auto) this.finishTalk();
      else if (advance && !t.noSkip) {
        if (!done) {
          t.shown = t.text.length;
          this.dirty = true;
        } else this.finishTalk();
      }
      return;
    }
    const c = this.ui.choice;
    if (c) {
      const n = c.options.length;
      if (inp.hit('left') || inp.hit('up')) c.idx = (c.idx + n - 1) % n;
      else if (inp.hit('right') || inp.hit('down')) c.idx = (c.idx + 1) % n;
      else if (advance) return this.pick(c.idx);
      else return;
      sfx.select();
      this.dirty = true;
    }
  }

  finishTalk() {
    const t = this.ui.talk;
    this.ui.talk = null;
    this.dirty = true;
    t.resolve();
  }

  // Clicking the dialogue box: finish the line, or move on.
  tap() {
    const t = this.ui.talk;
    if (!t || t.noSkip) return;
    if (t.shown < t.text.length) {
      t.shown = t.text.length;
      this.dirty = true;
    } else this.finishTalk();
  }

  // The big on-screen button some scenes show (ui.button).
  pressButton() {
    this.buttonPresses = (this.buttonPresses ?? 0) + 1;
    sfx.select();
  }

  pick(i) {
    const c = this.ui.choice;
    if (!c || i < 0 || i >= c.options.length) return;
    sfx.confirm();
    this.ui.choice = null;
    this.dirty = true;
    c.resolve(i);
  }

  // The "Press E" hint for whatever the player is standing next to.
  updatePrompt() {
    const p = this.player;
    let near = null;
    if (p && !p.dead && !this.locked && !this.ui.talk && !this.ui.choice) {
      for (const e of this.ents) {
        if (!e.act || e.dead || e.actOff) continue;
        const dx = Math.abs(cx(e) - cx(p));
        const dy = Math.abs(cy(e) - cy(p));
        if (dx < (e.w / 2 + 40) && dy < e.h / 2 + 50) {
          near = e;
          break;
        }
      }
    }
    const label = near ? near.actLabel ?? 'Talk' : '';
    if (label !== this.ui.prompt) {
      this.ui.prompt = label;
      this.dirty = true;
    }
    if (near && this.input.hit('act')) near.act(this);
  }

  updateCamera(dt) {
    const c = this.cam;
    const L = this.level;
    let tx, ty;
    if (c.fixed) {
      tx = c.fixed.x;
      ty = c.fixed.y;
    } else {
      const t = c.target ?? this.player;
      if (t) {
        tx = cx(t) + (t.facing ?? 0) * 50;
        ty = cy(t) - 40;
      } else {
        tx = c.x;
        ty = c.y;
      }
    }
    const k = 1 - Math.exp(-dt * (c.speed ?? 6));
    c.x += (tx - c.x) * k;
    c.y += (ty - c.y) * k;
    const hw = W / 2 / c.zoom;
    const hh = H / 2 / c.zoom;
    if (!c.free) {
      c.x = L.w < hw * 2 ? L.w / 2 : clamp(c.x, hw, L.w - hw);
      c.y = L.h < hh * 2 ? L.h / 2 : clamp(c.y, hh, L.h - hh);
    }
    c.shake = Math.max(0, c.shake - dt * 30);
    c.ox = (Math.random() - 0.5) * c.shake;
    c.oy = (Math.random() - 0.5) * c.shake;
  }

  snapCamera() {
    const p = this.cam.target ?? this.player;
    if (!p) return;
    this.cam.x = cx(p);
    this.cam.y = cy(p) - 40;
    this.updateCamera(10);
  }

  updateFx(dt) {
    const f = this.fx;
    if (f.fade !== f.fadeTo) {
      const step = dt * f.fadeSpeed;
      f.fade = f.fade < f.fadeTo ? Math.min(f.fadeTo, f.fade + step) : Math.max(f.fadeTo, f.fade - step);
    }
    f.flash = Math.max(0, f.flash - dt * 3);
    f.glitch = Math.max(0, f.glitch - dt);
  }

  /* ---------- drawing ---------- */
  resize(cssW, cssH) {
    this.scale = Math.min(cssW / W, cssH / H);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(W * this.scale);
    const h = Math.round(H * this.scale);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
  }

  render() {
    const c = this.ctx;
    const k = this.scale * this.dpr;
    c.setTransform(k, 0, 0, k, 0, 0);
    c.clearRect(0, 0, W, H);
    drawSky(c, this);

    const cam = this.cam;
    c.save();
    c.translate(W / 2 + cam.ox, H / 2 + cam.oy);
    c.scale(cam.zoom, cam.zoom);
    c.translate(-cam.x, -cam.y);
    const view = { x: cam.x - W / 2 / cam.zoom - 100, w: W / cam.zoom + 200 };
    for (const d of this.deco) if (!d.front && d.x < view.x + view.w && (d.x + (d.w ?? 200)) > view.x) drawDeco(c, d, this);
    for (const s of this.solids) if (!s.off && s.x < view.x + view.w && s.x + s.w > view.x) (s.draw ?? drawSolid)(c, s, this);
    const ents = [...this.ents].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
    for (const e of ents) if (!e.hidden) e.draw?.(c, this);
    for (const d of this.deco) if (d.front) drawDeco(c, d, this);
    for (const p of this.parts) {
      c.globalAlpha = Math.max(0, Math.min(1, p.life / (p.max ?? 0.5)));
      c.fillStyle = p.color;
      if (p.text) {
        c.font = `700 ${p.size ?? 16}px ${FONTS()}`;
        c.textAlign = 'center';
        c.fillText(p.text, p.x, p.y);
      } else c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    c.globalAlpha = 1;
    for (const e of ents) if (!e.hidden) e.drawOver?.(c, this);
    c.restore();

    drawEffects(c, this);
    if (!this.fx.noHud) drawHud(c, this);
  }

  /* ---------- helpers for effects ---------- */
  burst(x, y, color, n = 10, speed = 260, size = 5) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.8);
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 0.4 + Math.random() * 0.4, max: 0.6, color, size: size * (0.6 + Math.random() * 0.8) });
    }
  }

  floatText(x, y, text, color = '#fff', size = 16) {
    this.parts.push({ x, y, vx: 0, vy: -90, grav: 60, life: 1.2, max: 1.2, color, text, size });
  }

  shake(n = 8) {
    this.cam.shake = Math.max(this.cam.shake, n);
  }

  /* ---------- the script API (episodes await these) ---------- */
  until(test) {
    if (test()) return Promise.resolve();
    return new Promise((resolve) => this.waiters.push({ test, resolve }));
  }

  wait(sec) {
    const end = this.time + sec;
    return this.until(() => this.time >= end);
  }

  // Blocking dialogue line. who is a key of SPEAKERS.
  say(who, text, opts = {}) {
    return new Promise((resolve) => {
      this.ui.talk = { who, text, shown: 0, resolve, ...opts };
      this.dirty = true;
    });
  }

  async talk(lines) {
    for (const l of lines) {
      if (typeof l === 'function') await l();
      else if (typeof l === 'number') await this.wait(l);
      else await this.say(l[0], l[1], l[2]);
    }
  }

  choose(prompt, options) {
    return new Promise((resolve) => {
      this.ui.choice = { prompt, options, idx: 0, resolve };
      this.dirty = true;
    });
  }

  // Big title card in the middle of the screen. style: episode | big | error | soft
  async card(title, sub = '', sec = 3, style = 'episode') {
    this.ui.card = { title, sub, style, n: (this.ui.card?.n ?? 0) + 1 };
    this.dirty = true;
    await this.wait(sec);
    this.ui.card = null;
    this.dirty = true;
  }

  objective(text) {
    this.ui.objective = text ?? '';
    this.dirty = true;
  }

  music(name, fade) {
    music(name, fade);
  }

  fade(to, sec = 0.6) {
    this.fx.fadeTo = to;
    this.fx.fadeSpeed = sec > 0 ? 1 / sec : 999;
    return this.until(() => this.fx.fade === to);
  }

  lock(on = true) {
    this.locked = on;
    this.ui.locked = on;
    if (this.player && on) this.player.vx *= 0.5;
    this.dirty = true;
  }

  // Walk an actor (or the player) to x. Resolves on arrival.
  walk(actor, x, speed) {
    actor.goal = x;
    if (speed) actor.walkSpeed = speed;
    return this.until(() => actor.goal == null || actor.dead);
  }

  // Resolves once the player is inside [x0, x1].
  reach(x0, x1 = Infinity) {
    return this.until(() => {
      const p = this.player;
      return p && cx(p) >= x0 && cx(p) <= x1;
    });
  }

  // Resolves once every entity in list is dead.
  cleared(list) {
    return this.until(() => list.every((e) => e.dead));
  }
}
