import { cx, cy, pick } from '@/reason/engine';
import { sfx } from '@/reason/audio';
import { rr, text } from '@/reason/draw';
import { Npc, Thing, bark } from '@/reason/actors';

// Cursor: Bobby's best friend, and the Player's hand in the world. He floats
// next to Bobby. Clicking anything glowing (or pressing R near it) sends him
// over to press it. Now and then he pokes an enemy for you.
export function makeCursor(g, p, x, y) {
  const c = g.add(new Npc({ kind: 'cursor', x, y, w: 22, h: 30, fixed: true, z: 9, team: 'player' }));
  c.task = null;
  c.cd = 2;
  c.trollT = 25 + Math.random() * 20;
  c.extra = function (g, dt) {
    this.cd -= dt;
    let tx;
    let ty;
    if (this.task) {
      const t = this.task;
      tx = cx(t) - 4;
      ty = cy(t) - 10;
      if (Math.hypot(tx - this.x, ty - this.y) < 18 || t.dead) {
        this.task = null;
        if (!t.dead) {
          sfx.select();
          g.parts.push({ x: tx + 4, y: ty + 10, vx: 0, vy: 0, grav: 0, life: 0.3, max: 0.3, color: 'rgba(223,241,255,0.9)', size: 18 });
          if (t.onPress) t.onPress(g);
          else if (t.hurt) t.hurt(g, 1, 1, this);
        }
      }
    } else if (this.home) {
      tx = this.home.x;
      ty = this.home.y;
    } else {
      tx = cx(p) - p.facing * 34;
      ty = p.y - 34 + Math.sin(g.time * 2.4) * 5;
      // help out in fights
      if (this.cd <= 0 && !g.locked && !this.passive) {
        const foe = g.ents.find((e) => e.team === 'enemy' && !e.dead && e.hurt && !e.big && !e.clickable && Math.hypot(cx(e) - cx(p), cy(e) - cy(p)) < 170);
        if (foe) {
          this.task = foe;
          this.cd = 2.6;
        }
      }
    }
    const speed = this.task ? 9 : 5;
    this.x += (tx - this.x) * Math.min(1, dt * speed);
    this.y += (ty - this.y) * Math.min(1, dt * speed);
    this.facing = tx > this.x ? 1 : -1;
    // R: press the nearest glowing thing
    if (g.input.hit('point') && !g.locked && !g.ui.talk) {
      const near = g.ents
        .filter((e) => e.clickable && !e.dead && !e.hidden)
        .sort((a, b) => Math.abs(cx(a) - cx(p)) - Math.abs(cx(b) - cx(p)))[0];
      if (near && Math.abs(cx(near) - cx(p)) < 700) this.task = near;
      else bark(g, this, pick(['Click what? The sky?', 'Nothing to point at, bro.']), 1.6);
    }
    // the occasional bit of trolling
    this.trollT -= dt;
    if (this.trollT <= 0 && !g.locked && !this.task && !this.passive) {
      this.trollT = 35 + Math.random() * 30;
      bark(g, this, pick(TROLLS), 2.6);
    }
  };
  c.press = (t) => {
    c.task = t;
  };
  g.onClickable = (t) => c.press(t);
  p.buddy = c;
  return c;
}

const TROLLS = [
  'I could double-click you right now. I won’t. But I could.',
  'Hey Bobby. What’s your favourite colour? Mine’s #FF0000. Like you.',
  'Fun fact: I’ve been hovering over you this whole time.',
  'Should I right-click Tabby? Just to see?',
  'You’re doing great. Probably.',
];

// A glowing switch Cursor can press. onPress(g) runs once (unless repeat).
export function clickSwitch(g, x, y, onPress, opts = {}) {
  return g.add(new Thing({ x: x - 15, y: y - 15, w: 30, h: 30, z: 6, clickable: true, used: false, label: opts.label ?? 'click',
    onPress(g) {
      if (this.used && !opts.repeat) return;
      this.used = true;
      if (!opts.repeat) this.clickable = false;
      sfx.confirm();
      onPress(g, this);
    },
    look(c, g) {
      const on = this.used && !opts.repeat;
      c.fillStyle = 'rgba(0,0,0,0.25)';
      rr(c, this.x - 3, this.y - 3, 36, 36, 9);
      c.fill();
      c.fillStyle = on ? '#8dffc8' : `hsl(${190 + Math.sin(g.time * 5) * 20}, 90%, ${60 + Math.sin(g.time * 5) * 10}%)`;
      rr(c, this.x, this.y, 30, 30, 7);
      c.fill();
      text(c, on ? '✓' : '⊙', this.x + 15, this.y + 15, { size: 16, color: '#103040' });
      if (!on) text(c, this.label, this.x + 15, this.y - 10, { size: 10, color: '#fff' });
    },
  }));
}
