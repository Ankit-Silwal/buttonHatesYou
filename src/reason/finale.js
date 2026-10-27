import { GRAVITY, moveBody, overlap, clamp, rand, cx, cy } from './engine';
import { sfx } from './audio';
import { rr, text, sword, drawButton, adminFace, popupWindow, heart } from './draw';
import { Shot, Thing, drawBubble, drawCursorGuy, bark } from './actors';
import { glow, boxShadow, fadeStrip } from './fx';
import { GROUND } from './build';

/* ======================================================================
   The Player, as a cursor. Flies anywhere; J clicks.
   ====================================================================== */
export class CursorPlayer {
  constructor() {
    Object.assign(this, { x: 0, y: 0, w: 22, h: 30, vx: 0, vy: 0, hp: 5, maxHp: 5, facing: 1, z: 8, t: 0, team: 'player', iframes: 0, clickCd: 0, ring: 0, walkSpeed: 160 });
  }

  init(g) {
    this.g = g;
  }

  update(g, dt) {
    this.t += dt;
    this.iframes = Math.max(0, this.iframes - dt);
    this.clickCd = Math.max(0, this.clickCd - dt);
    this.ring = Math.max(0, this.ring - dt);
    this.flash = Math.max(0, (this.flash ?? 0) - dt);
    if (this.dying) return;
    const inp = g.input;
    const ctl = !g.locked && !g.ui.talk && !g.ui.choice && !this.frozen;
    let mx = 0;
    let my = 0;
    if (this.goal != null) {
      const dx = this.goal - cx(this);
      const dy = (this.goalY ?? this.y) - this.y;
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) {
        this.goal = null;
        this.goalY = null;
      } else {
        const d = Math.hypot(dx, dy);
        mx = (dx / d) * (this.walkSpeed / 330);
        my = (dy / d) * (this.walkSpeed / 330);
      }
    } else if (ctl) {
      mx = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
      my = (inp.down('down') ? 1 : 0) - (inp.down('up') || inp.down('jump') ? 1 : 0);
      const d = Math.hypot(mx, my);
      if (d > 1) {
        mx /= d;
        my /= d;
      }
    }
    if (mx) this.facing = Math.sign(mx);
    const k = Math.min(1, dt * 12);
    this.vx += (mx * 330 - this.vx) * k;
    this.vy += (my * 330 - this.vy) * k;
    this.x = clamp(this.x + this.vx * dt, 10, g.level.w - this.w - 10);
    this.y = clamp(this.y + this.vy * dt, 50, GROUND - this.h);
    if (ctl && inp.hit('attack') && this.clickCd <= 0) this.click(g);
    if (ctl && inp.hit('act')) this.onAct?.(g);
  }

  click(g) {
    this.clickCd = 0.3;
    this.ring = 0.22;
    sfx.select();
    const box = { x: this.x - 40, y: this.y - 38, w: 92, h: 92 };
    for (const e of g.ents) {
      if (e === this || e.dead || !e.hurt || e.team === 'player' || e.ghost) continue;
      if (overlap(box, e.hitbox?.() ?? e)) e.hurt(g, 1, Math.sign(cx(e) - cx(this)) || 1, this);
    }
  }

  hurt(g, dmg = 1, dir = 0) {
    if (this.iframes > 0 || this.dying || g.locked || this.invincible) return false;
    this.hp -= dmg;
    this.iframes = 1.2;
    this.flash = 0.2;
    this.vx = (dir || -this.facing) * 420;
    sfx.hurt();
    g.shake(8);
    if (this.hp <= 0) this.die(g);
    return true;
  }

  heal(n = 1) {
    this.hp = Math.min(this.maxHp, this.hp + n);
  }

  die(g) {
    if (this.dying) return;
    this.dying = true;
    g.burst(cx(this), cy(this), '#ffffff', 16, 260, 5);
    (async () => {
      await g.fade(1, 0.5);
      const cp = g.checkpointAt ?? { x: 100, y: 300 };
      this.x = cp.x;
      this.y = cp.y;
      this.vx = this.vy = 0;
      this.hp = this.maxHp;
      this.iframes = 1.5;
      this.dying = false;
      g.onRespawn?.();
      await g.fade(0, 0.5);
    })();
  }

  draw(c, g) {
    if (this.dying) return;
    if (this.iframes > 0 && Math.floor(this.t * 20) % 2 && !g.locked) return;
    drawCursorGuy(c, { ...this, glow: '#7fdcff' }, g);
    if (this.ring > 0) {
      glow(c, this.x + 6, this.y + 8, 60, '#7fdcff', this.ring * 3);
      c.strokeStyle = `rgba(127,220,255,${this.ring * 4})`;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(this.x + 6, this.y + 8, 46 * (1.2 - this.ring * 2), 0, Math.PI * 2);
      c.stroke();
    }
  }

  drawOver(c, g) {
    if (this.bubble) drawBubble(c, g, this, this.bubble);
  }
}

/* ======================================================================
   BOBBY — THE BROKEN BUTTON. Fights with everything you taught him.
   Only takes hits while he's catching his breath after an attack.
   ====================================================================== */
export class BobbyBoss {
  constructor({ x, x0, x1 }) {
    Object.assign(this, {
      x, y: GROUND - 40, w: 30, h: 40, vx: 0, vy: 0, x0, x1, hp: 30, maxHp: 30, t: 0, z: 6,
      name: 'BOBBY — THE BROKEN BUTTON', barColor: '#ff3b4a', team: 'enemy', big: true,
      state: 'idle', timer: 1.4, facing: -1, cycle: 0, hazards: [], flash: 0, mood: 'angry',
    });
  }

  hurt(g, dmg, dir) {
    if (this.state !== 'tired' || this.held) {
      sfx.clang();
      if (Math.random() < 0.4) g.floatText(cx(this), this.y - 14, 'blocked', '#ff9c9c', 13);
      return false;
    }
    this.hp = Math.max(1, this.hp - 1);
    this.flash = 0.12;
    sfx.hit();
    g.floatText(cx(this), this.y - 14, pickOne(['disarmed!', 'staggered', 'ow', '…!']), '#ffffff', 14);
    if (this.hp <= 1) this.done = true;
    return true;
  }

  begin(g, state) {
    this.state = state;
    const angry = this.hp < this.maxHp / 2;
    const fast = angry ? 0.75 : 1;
    const c = g.player;
    if (state === 'dash') {
      this.timer = 0.5 * fast;
      this.facing = Math.sign(cx(c) - cx(this)) || 1;
      this.swings = 0;
    } else if (state === 'leap') {
      const tx = clamp(cx(c), this.x0 + 40, this.x1 - 40);
      const air = 0.85;
      this.vx = (tx - cx(this)) / air;
      this.vy = -GRAVITY * air * 0.5;
      this.timer = air + 0.05;
      this.facing = Math.sign(this.vx) || 1;
      sfx.jump();
    } else if (state === 'beams') {
      this.timer = 1.5;
      const xs = [cx(c), cx(c) - 170, cx(c) + 170];
      if (angry) xs.push(cx(c) - 340, cx(c) + 340);
      xs.forEach((x, i) => g.add(beam(clamp(x, this.x0 + 20, this.x1 - 20), 0.75 + i * 0.08)));
      sfx.charge();
    } else if (state === 'throw') {
      this.timer = 1.2;
      this.thrown = 0;
    } else if (state === 'tired') {
      this.timer = angry ? 1.35 : 1.7;
      this.vx = 0;
    } else if (state === 'idle') {
      this.timer = angry ? 0.45 : 0.7;
    }
  }

  update(g, dt) {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    this.hazards = [];
    if (this.held) {
      this.vx *= 0.8;
      this.vy = Math.min(900, this.vy + GRAVITY * dt);
      moveBody(g, this, dt);
      return;
    }
    this.timer -= dt;
    const c = g.player;
    const angry = this.hp < this.maxHp / 2;
    const s = this.state;
    if (s === 'idle') {
      this.vx = 0;
      this.facing = Math.sign(cx(c) - cx(this)) || this.facing;
      if (this.timer <= 0) this.begin(g, ['dash', 'leap', 'beams', 'throw', 'dash', 'leap'][this.cycle++ % 6]);
    } else if (s === 'dash') {
      // the sword combo from Episode 1, plus the Dash from Episode 5
      if (this.timer > 0.15) {
        this.vx = 0;
        this.red = Math.sin(this.t * 40) > 0;
      } else {
        this.red = true;
        this.vx = this.facing * (angry ? 700 : 600);
        this.swingT = (this.swingT ?? 0) - dt;
        if (this.swingT <= 0) {
          this.swingT = 0.14;
          this.swing = 0.14;
          sfx.swing();
        }
        this.hazards.push({ x: this.facing > 0 ? this.x : this.x - 50, y: GROUND - 150, w: this.w + 50, h: 150 });
        if (this.wall || this.x <= this.x0 + 2 || this.x + this.w >= this.x1 - 2 || this.timer < -0.75) this.begin(g, 'tired');
      }
    } else if (s === 'leap') {
      this.hazards.push({ x: this.x - 30, y: this.y - 30, w: this.w + 60, h: this.h + 50 });
      this.swing = 0.14;
      if (this.ground && this.timer < 0.7) {
        // Tabby's slam, rebuilt from his broken sword
        sfx.stun();
        g.shake(10);
        for (const d of [-1, 1]) g.add(new Shot({ x: cx(this) - 14, y: GROUND - 64, w: 28, h: 64, vx: d * 380, vy: 0, life: 1.6, color: '#5b9bd5', cuttable: false, solidHit: false, wave: true }));
        this.begin(g, 'tired');
      }
    } else if (s === 'beams') {
      this.vx = 0;
      this.swing = this.timer < 0.7 ? 0.14 : 0;
      if (this.timer <= 0) this.begin(g, 'tired');
    } else if (s === 'throw') {
      this.vx = 0;
      if (this.timer < 1 - this.thrown * 0.25 && this.thrown < (angry ? 4 : 3)) {
        this.thrown++;
        const a = Math.atan2(cy(c) - cy(this), cx(c) - cx(this)) + rand(-0.15, 0.15);
        g.add(new Shot({ x: cx(this) - 9, y: cy(this) - 9, w: 18, h: 18, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, color: '#ff3b5c', cuttable: false, solidHit: false, life: 3 }));
        this.swing = 0.14;
        sfx.shoot();
      }
      if (this.timer <= 0) this.begin(g, 'tired');
    } else if (s === 'tired') {
      this.vx = 0;
      this.red = false;
      if (this.timer <= 0) this.begin(g, 'idle');
    }
    this.swing = Math.max(0, (this.swing ?? 0) - dt);
    if (s !== 'leap' || !this.ground) this.vy = Math.min(900, this.vy + GRAVITY * dt);
    moveBody(g, this, dt);
    this.x = clamp(this.x, this.x0, this.x1 - this.w);
    for (const h of this.hazards) if (overlap(h, c)) c.hurt(g, 1, Math.sign(cx(c) - cx(this)) || 1);
  }

  draw(c, g) {
    const tired = this.state === 'tired';
    // a red aura while he fights; it gutters out when he's out of breath
    if (!this.dropped) glow(c, cx(this), cy(this), tired ? 40 : 70 + Math.sin(this.t * 6) * 6, '#ff2040', tired ? 0.25 : 0.55);
    if (!this.dropped) this.drawSword(c, tired);
    if (Math.random() < 0.3 && !this.dropped) g.parts.push({ x: cx(this) + rand(-20, 20), y: this.y + rand(0, 40), vx: 0, vy: -40, grav: 0, life: 0.4, max: 0.4, color: 'rgba(255,40,70,0.6)', size: 3 });
    drawButton(c, {
      x: this.x, y: this.y, w: this.w, h: this.h, color: '#e2674f', dark: '#b84a36', facing: this.facing, t: this.t,
      moving: Math.abs(this.vx) > 20, air: !this.ground, mood: tired ? 'sad' : this.mood, red: !this.dropped && (!tired || this.red),
      pendant: true, crack: true, flash: this.flash > 0, tears: this.tears, sit: this.sit, pendantGlow: this.pendantGlow,
    });
    if (tired && !this.held) text(c, '…huff…', cx(this), this.y - 12, { size: 11, color: '#ffd0d0' });
  }

  drawSword(c, tired) {
    c.save();
    c.translate(cx(this) + this.facing * 13, this.y + 24);
    c.scale(this.facing, 1);
    c.rotate(this.swing > 0 ? -2 + (1 - this.swing / 0.14) * 3.4 : tired ? 2.2 : 0.5);
    sword(c, 'glitch', 0, 0, 0.85);
    c.restore();
  }

  drawOver(c, g) {
    if (this.bubble) drawBubble(c, g, this, this.bubble);
  }
}

// A column that lights up, then strikes the whole height of the arena.
function beam(x, delay) {
  return new Thing({ x: x - 22, y: 0, w: 44, h: GROUND, z: 7, t: 0,
    tick(g, dt) {
      this.t += dt;
      if (this.t > delay && this.t < delay + 0.22) {
        if (!this.boomed) {
          this.boomed = true;
          sfx.crack();
          g.shake(5);
        }
        const p = g.player;
        if (p && overlap(p, this)) p.hurt(g, 1, 0);
      }
      if (this.t > delay + 0.4) this.dead = true;
    },
    look(c) {
      if (this.t < delay) {
        const k = this.t / delay;
        c.fillStyle = `rgba(255,40,70,${0.12 + 0.15 * Math.sin(this.t * 30)})`;
        c.fillRect(this.x + 18, this.y, 8, this.h);
        glow(c, this.x + 22, this.h - 6, 30 + k * 30, '#ff2846', 0.4 + k * 0.4);
      } else {
        const k = 1 - Math.min(1, (this.t - delay) / 0.4);
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = k;
        c.drawImage(fadeStrip('#ff3c50', 0.9, 0.9), this.x - 22, this.y, this.w + 44, this.h);
        c.fillStyle = 'rgba(255,60,80,0.85)';
        c.fillRect(this.x, this.y, this.w, this.h);
        c.fillStyle = 'rgba(255,255,255,0.9)';
        c.fillRect(this.x + 14, this.y, 16, this.h);
        c.restore();
        glow(c, this.x + 22, this.h - 8, 90, '#ff3c50', k);
      }
    },
  });
}

/* ======================================================================
   THE ADMIN. A wall of a monitor with arms, cables and command windows.
   The episode script decides what it does each round.
   ====================================================================== */
export class AdminBoss {
  constructor() {
    Object.assign(this, { x: 330, y: 40, w: 300, h: 190, home: 40, t: 0, z: 1, hp: 100, maxHp: 100, name: 'THE ADMIN', barColor: '#8dffc8', team: 'enemy', big: true, flash: 0, low: 0 });
  }

  update(g, dt) {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    const ty = this.home + this.low * 180;
    this.y += (ty + Math.sin(this.t * 1.2) * 6 - this.y) * Math.min(1, dt * 3);
  }

  draw(c, g) {
    const { x, y, w, h } = this;
    // the screen lights the whole room green
    glow(c, cx(this), y + h / 2, w * 1.3, this.flash ? '#ff3b3b' : '#2fd690', 0.3 + 0.05 * Math.sin(this.t * 2));
    // arms: thick cables with a lit edge
    c.lineCap = 'round';
    for (const s of [-1, 1]) {
      if (this.armsOff?.[s]) continue;
      const k = Math.sin(this.t * 1.6 + s) * 20;
      c.beginPath();
      c.moveTo(cx(this) + s * (w / 2 - 10), y + h - 30);
      c.quadraticCurveTo(cx(this) + s * (w / 2 + 80), y + h + 40 + k, cx(this) + s * (w / 2 + 120), y + h + 90 + k);
      c.strokeStyle = '#2a2a33';
      c.lineWidth = 12;
      c.stroke();
      c.strokeStyle = 'rgba(141,255,200,0.22)';
      c.lineWidth = 3;
      c.stroke();
      glow(c, cx(this) + s * (w / 2 + 120), y + h + 90 + k, 18, '#8dffc8', 0.6);
    }
    // floating command windows
    for (let i = 0; i < 8; i++) {
      const a = this.t * 0.4 + (i * Math.PI) / 4;
      c.globalAlpha = 0.35;
      popupWindow(c, cx(this) + Math.cos(a) * 260 - 30, y + h / 2 + Math.sin(a) * 90 - 18, 60, 36, ['sudo', 'rm', 'kill', 'chmod'][i % 4], '#1d6b4a');
    }
    c.globalAlpha = 1;
    boxShadow(c, x - 14, y - 14, w + 28, h + 28, 0.5, 26, 16);
    c.fillStyle = '#16141c';
    rr(c, x - 14, y - 14, w + 28, h + 28, 14);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.fillRect(x - 4, y - 12, w + 8, 2);
    c.fillStyle = this.flash ? '#3a0a10' : '#050b08';
    c.fillRect(x, y, w, h);
    glow(c, cx(this), y + h / 2, w * 0.45, this.flash ? '#ff3b3b' : '#1d6b4a', 0.35);
    adminFace(c, cx(this), y + h / 2 + 6, 80, g);
    if (this.status) text(c, this.status, cx(this), y + h - 18, { size: 14, color: '#ff6b5e' });
    c.fillStyle = 'rgba(141,255,200,0.05)';
    for (let yy = y + ((g.time * 30) % 4); yy < y + h; yy += 4) c.fillRect(x, yy, w, 1);
    c.fillStyle = 'rgba(255,255,255,0.05)';
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + w * 0.4, y);
    c.lineTo(x, y + h * 0.7);
    c.fill();
  }
}

const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
