import { GROUND } from '@/reason/build';
import { Thing, Npc, bark } from '@/reason/actors';
import { sfx } from '@/reason/audio';
import { cx, cy, overlap, rand } from '@/reason/engine';
import { rr, text, heart } from '@/reason/draw';
import { makeCursor } from './companion';

// Shared bits for How I Met Your Cursor's chapters.

// Load a level, put Cursor next to Bobby, show the chapter card, fade in.
export async function begin(g, p, level, n, title, music) {
  g.fx.fade = 1;
  g.load(level, p);
  p.acc = g.flags.acc ?? [];
  const cur = makeCursor(g, p, p.x - 40, p.y - 40);
  if (music !== undefined) g.music(music);
  g.lock();
  await g.card(`Chapter ${n}`, title, 3);
  await g.fade(0, 1);
  return cur;
}

// Bobby's confidence meter, a running joke. It goes above 100%.
export function confidence(g, value, note) {
  g.meter = { label: 'Bobby’s confidence', value, color: '#ff8fb1' };
  if (note && g.player) g.floatText(cx(g.player), g.player.y - 30, note, value > 100 ? '#ffe08a' : '#fff', 14);
  sfx.blip(value > 100 ? 2 : 1);
}

// Rose petals drifting across the screen (for love at first sight).
export function petals(g, sec = 6) {
  const end = g.time + sec;
  return g.add(new Thing({ w: 0, h: 0, hidden: true, alwaysUpdate: true, tick(g) {
    if (g.time > end) return (this.dead = true);
    if (Math.random() < 0.5) g.parts.push({ x: g.cam.x + rand(-500, 500), y: g.cam.y - 290, vx: rand(-60, 20), vy: rand(30, 80), grav: 15, life: 6, max: 6, color: Math.random() < 0.5 ? '#ff8fb1' : '#ffc2d6', size: rand(4, 7) });
  } }));
}

// Little floating hearts above someone's head.
export function hearts(g, who, n = 6) {
  for (let i = 0; i < n; i++) g.floatText(cx(who) + rand(-20, 20), who.y - 10 - i * 4, '♥', '#ff4f7b', 14 + i);
}

// A green wheelie bin. Bobby lives here now.
export function trashCan(g, x) {
  return g.add(new Thing({ x, y: GROUND - 48, w: 40, h: 48, z: 6, wob: 0,
    tick(g, dt) {
      this.wob = Math.max(0, this.wob - dt);
    },
    look(c, g) {
      c.save();
      c.translate(this.x + 20, this.y + 48);
      c.rotate(Math.sin(this.wob * 30) * this.wob * 0.4);
      c.fillStyle = '#4f8a52';
      rr(c, -20, -42, 40, 42, 4);
      c.fill();
      c.fillStyle = '#3a6a3d';
      c.fillRect(-23, -48 - (this.open ?? 0) * 10, 46, 8);
      c.fillStyle = '#2d4a2f';
      for (const dx of [-10, 0, 10]) c.fillRect(dx - 1, -36, 2, 28);
      c.restore();
    },
  }));
}

// Bella, with an optional flower stall behind her.
export function bellaAt(g, x, opts = {}) {
  return g.add(new Npc({ kind: 'bella', x, y: GROUND - 40, facing: opts.facing ?? -1, ...opts }));
}

// A white "card" message floating over the world (PRESS TO START, etc.).
export function floatingText(g, x, y, str, opts = {}) {
  return g.add(new Thing({ x, y, w: 0, h: 0, z: 9,
    look(c, g) {
      const a = 0.65 + 0.35 * Math.sin(g.time * 3);
      c.globalAlpha = opts.blink === false ? 1 : a;
      text(c, str, this.x, this.y + Math.sin(g.time * 2) * 3, { size: opts.size ?? 22, color: opts.color ?? '#fff' });
      c.globalAlpha = 1;
    },
  }));
}

// A heart-shaped item card helper.
export function heartIcon(c, x, y) {
  heart(c, x, y, 7, '#ff4f7b', '#a3203a');
}

// Bella's flowers: a little projectile that only hurts the boss.
export function flowerShot(bella, target) {
  const sx = cx(bella);
  const sy = bella.y + 10;
  const a = Math.atan2(cy(target) - sy, cx(target) - sx);
  return new Thing({ x: sx, y: sy, w: 14, h: 14, z: 7, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, life: 2,
    tick(g, dt) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.life -= dt;
      if (this.life <= 0) this.dead = true;
      if (!target.dead && overlap(this, target)) {
        this.dead = true;
        target.hurt(g, 1, Math.sign(this.vx) || 1);
      }
    },
    look(c) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        c.fillStyle = '#ff8fb1';
        c.beginPath();
        c.arc(this.x + 7 + Math.cos(a) * 4, this.y + 7 + Math.sin(a) * 4, 3.5, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = '#f2c14e';
      c.beginPath();
      c.arc(this.x + 7, this.y + 7, 2.5, 0, Math.PI * 2);
      c.fill();
    },
  });
}

export function mixHex(a, b, k) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(',')})`;
}
