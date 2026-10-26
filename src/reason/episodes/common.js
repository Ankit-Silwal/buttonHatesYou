import { GROUND } from '../build';
import { Pickup, Thing } from '../actors';
import { cx, overlap } from '../engine';
import { sfx } from '../audio';
import { adminFace, rr, text } from '../draw';

// An old monitor THE ADMIN talks through. Static when off.
export function adminMonitor(g, x, y, w = 150, h = 100, opts = {}) {
  return g.add(new Thing({
    x, y, w, h, on: false, z: 0, stand: opts.stand ?? true,
    look(c, g) {
      if (this.stand) {
        c.fillStyle = '#2a2a33';
        c.fillRect(this.x + this.w / 2 - 8, this.y + this.h + 6, 16, GROUND - this.y - this.h - 6);
        c.fillRect(this.x + this.w / 2 - 30, GROUND - 8, 60, 8);
      }
      c.fillStyle = '#1d1d24';
      rr(c, this.x - 8, this.y - 8, this.w + 16, this.h + 16, 8);
      c.fill();
      c.fillStyle = this.on ? '#071510' : '#15151b';
      c.fillRect(this.x, this.y, this.w, this.h);
      if (this.on) {
        adminFace(c, this.x + this.w / 2, this.y + this.h / 2 + 4, Math.min(this.w, this.h) * 0.42, g);
        c.fillStyle = 'rgba(141,255,200,0.07)';
        for (let yy = this.y + ((g.time * 40) % 4); yy < this.y + this.h; yy += 4) c.fillRect(this.x, yy, this.w, 1);
      } else {
        for (let i = 0; i < 60; i++) {
          c.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`;
          c.fillRect(this.x + Math.random() * this.w, this.y + Math.random() * this.h, 3, 2);
        }
      }
    },
  }));
}

// A floating Core Fragment. Resolves the returned promise when picked up.
export function coreFragment(g, x, y, n) {
  let got;
  const done = new Promise((r) => (got = r));
  const f = g.add(new Pickup({
    kind: 'fragment', x, y, w: 26, h: 30, z: 6,
    look(c, g, px, py) {
      const glow = c.createRadialGradient(px + 13, py + 15, 2, px + 13, py + 15, 46);
      glow.addColorStop(0, 'rgba(120, 255, 220, 0.55)');
      glow.addColorStop(1, 'rgba(120, 255, 220, 0)');
      c.fillStyle = glow;
      c.fillRect(px - 40, py - 40, 110, 110);
      c.fillStyle = '#7dffe0';
      c.beginPath();
      c.moveTo(px + 13, py);
      c.lineTo(px + 26, py + 12);
      c.lineTo(px + 18, py + 30);
      c.lineTo(px + 8, py + 30);
      c.lineTo(px, py + 12);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)';
      c.fillRect(px + 9, py + 8, 4, 12);
      text(c, `${n}/3`, px + 13, py - 12, { size: 12, color: '#bfffee' });
    },
    onGet() {
      got();
    },
  }));
  f.done = done;
  return f;
}

// A little flag post. Passing it sets the respawn point.
export function checkpointPost(g, x, y = GROUND) {
  return g.add(new Thing({
    x: x - 6, y: y - 70, w: 12, h: 70, lit: false, z: 0,
    tick(g) {
      const p = g.player;
      if (!this.lit && p && cx(p) > this.x) {
        this.lit = true;
        g.checkpoint(this.x, y - p.h - 2);
        sfx.confirm();
        g.floatText(this.x + 6, this.y - 6, 'Checkpoint', '#bfffee', 14);
      }
    },
    look(c) {
      c.fillStyle = '#6b5a4a';
      c.fillRect(this.x + 4, this.y, 4, this.h);
      c.fillStyle = this.lit ? '#7dffe0' : '#8a8a96';
      c.beginPath();
      c.moveTo(this.x + 8, this.y);
      c.lineTo(this.x + 34, this.y + 10);
      c.lineTo(this.x + 8, this.y + 20);
      c.fill();
    },
  }));
}

// A row (or arc) of coins.
export function coins(g, x, y, n = 5, gap = 28, arc = 0) {
  for (let i = 0; i < n; i++) {
    const k = n > 1 ? i / (n - 1) : 0;
    g.add(new Pickup({ kind: 'coin', x: x + i * gap, y: y - Math.sin(k * Math.PI) * arc }));
  }
}

export const heartAt = (g, x, y) => g.add(new Pickup({ kind: 'heart', x, y }));

// Resolves when the player's box touches the rectangle.
export const touched = (g, r) => g.until(() => g.player && overlap(g.player, r));
