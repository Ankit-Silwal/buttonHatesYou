import { GRAVITY, moveBody, overlap, solidAt, clamp, rand, cx, cy } from './engine';
import { sfx } from './audio';
import { drawButton, drawKey, rr, text, heart, sword, popupWindow, cursorShape, FONTS } from './draw';

const SPEED = 250;
const DASH_SPEED = 640;

/* ======================================================================
   Bobby, the player's button
   ====================================================================== */
export class Bobby {
  constructor(flags) {
    this.flags = flags;
    this.w = 30;
    this.h = 40;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.maxHp = 5;
    this.hp = 5;
    this.z = 5;
    this.t = 0;
    this.team = 'player';
    this.iframes = 0;
    this.coyote = 0;
    this.buffer = 0;
    this.jumps = 0;
    this.airDash = true;
    this.dashT = 0;
    this.dashCd = 0;
    this.atk = null;
    this.combo = 0;
    this.lastAtk = -1;
    this.mood = 'calm';
    this.walkSpeed = 140;
  }

  get can() {
    const f = this.flags;
    return { sword: !!f.sword, double: !!f.doubleJump, dash: !!f.dash };
  }

  get controllable() {
    const g = this.g;
    return !g.locked && !g.ui.talk && !g.ui.choice && !this.dying && !this.frozen;
  }

  init(g) {
    this.g = g;
  }

  update(g, dt) {
    this.g = g;
    this.t += dt;
    const inp = g.input;
    const ctl = this.controllable;
    this.iframes = Math.max(0, this.iframes - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.coyote = Math.max(0, this.coyote - dt);
    this.buffer = Math.max(0, this.buffer - dt);
    this.flash = Math.max(0, (this.flash ?? 0) - dt);
    if (this.dying) return;

    let move = 0;
    if (this.goal != null) {
      const d = this.goal - cx(this);
      if (Math.abs(d) < 4) {
        this.goal = null;
        this.vx = 0;
      } else move = Math.sign(d) * (this.walkSpeed / SPEED);
      if (this.wall && this.ground) this.vy = -620; // hop small ledges on scripted walks
    } else if (ctl) {
      move = (inp.down('right') ? 1 : 0) - (inp.down('left') ? 1 : 0);
      if (this.reversed) move = -move;
    }
    if (move) this.facing = Math.sign(move);
    if (this.faceLock) this.facing = this.faceLock;

    const onGround = !!this.ground;
    if (onGround) {
      this.coyote = 0.1;
      this.jumps = 0;
      this.airDash = true;
    }

    // dash: a short burst with invincibility
    if (ctl && this.can.dash && inp.hit('dash') && this.dashCd <= 0 && (onGround || this.airDash)) {
      this.dashT = 0.17;
      this.dashCd = 0.45;
      if (!onGround) this.airDash = false;
      sfx.dash();
    }
    if (this.dashT > 0) {
      this.dashT -= dt;
      this.vx = this.facing * DASH_SPEED;
      this.vy = 0;
      if (Math.random() < 0.6) g.parts.push({ x: cx(this) - this.facing * 10, y: cy(this) + rand(-10, 10), vx: -this.facing * 60, vy: 0, grav: 0, life: 0.25, max: 0.25, color: 'rgba(255,255,255,0.7)', size: 6 });
    } else {
      const target = move * SPEED;
      const accel = onGround ? 2400 : 1500;
      if (this.vx < target) this.vx = Math.min(target, this.vx + accel * dt);
      else if (this.vx > target) this.vx = Math.max(target, this.vx - accel * dt);

      if (ctl && (inp.hit('jump') || inp.hit('up'))) this.buffer = 0.13;
      if (this.buffer > 0) {
        if (this.coyote > 0) {
          this.vy = -700;
          this.coyote = 0;
          this.buffer = 0;
          this.jumps = 1;
          sfx.jump();
        } else if (this.can.double && this.jumps < 2) {
          this.vy = -620;
          this.buffer = 0;
          this.jumps = 2;
          sfx.djump();
          g.burst(cx(this), this.y + this.h, '#ffffff', 6, 120, 4);
        }
      }
      const holding = inp.down('jump') || inp.down('up');
      let grav = GRAVITY;
      if (this.vy < 0 && !(holding && ctl)) grav *= 2.2;
      this.vy = Math.min(900, this.vy + grav * dt);
    }
    this.dropping = ctl && inp.down('down') && inp.hit('jump');

    const wasGround = onGround;
    moveBody(g, this, dt);
    if (this.ground && !wasGround && this.vy === 0) sfx.land();
    if (this.ground && !this.ground.fall && !this.ground.vanish && !this.ground.move) this.safe = { x: this.x, y: this.y };

    // attacks
    if (ctl && this.can.sword && inp.hit('attack') && !this.atk && this.dashT <= 0) this.startAttack(g);
    if (this.atk) this.updateAttack(g, dt);

    if (ctl && inp.hit('special') && this.tabby && !this.tabby.dead && this.flags.slam) this.tabby.slam(g);
    if (ctl && inp.hit('special')) this.onSpecial?.(g);

    // fell off the world
    if (this.y > g.level.h + 80) {
      if (this.hp > 1 && this.safe) {
        this.hp--;
        sfx.hurt();
        this.x = this.safe.x;
        this.y = this.safe.y - 4;
        this.vx = this.vy = 0;
        this.iframes = 1;
        g.onRespawn?.();
        g.snapCamera();
      } else this.die(g);
    }
  }

  startAttack(g) {
    const inp = g.input;
    const air = !this.ground;
    let kind = 'slash';
    if (air && inp.down('down')) kind = 'down';
    else if (air) kind = 'air';
    else {
      this.combo = g.time - this.lastAtk < 0.5 ? (this.combo + 1) % 3 : 0;
      if (this.combo === 2) kind = 'finisher';
    }
    this.lastAtk = g.time;
    this.atk = { kind, t: 0, dur: kind === 'finisher' ? 0.32 : 0.24, hit: new Set() };
    if (kind === 'finisher') this.vx = this.facing * 260;
    sfx.swing();
  }

  attackBox() {
    const a = this.atk;
    if (!a) return null;
    if (a.kind === 'down') return { x: this.x - 8, y: this.y + this.h - 6, w: this.w + 16, h: 40 };
    const reach = a.kind === 'finisher' ? 62 : 50;
    return { x: this.facing > 0 ? this.x + this.w - 6 : this.x - reach + 6, y: this.y - 14, w: reach, h: this.h + 20 };
  }

  updateAttack(g, dt) {
    const a = this.atk;
    a.t += dt;
    if (a.t > 0.03 && a.t < 0.17) {
      const box = this.attackBox();
      for (const e of g.ents) {
        if (e === this || e.dead || !e.hurt || e.team === 'player' || a.hit.has(e) || e.ghost) continue;
        if (!overlap(box, e.hitbox?.() ?? e)) continue;
        a.hit.add(e);
        const dmg = (a.kind === 'finisher' ? 2 : 1) * (this.flags.cursed ? 2 : 1);
        if (e.hurt(g, dmg, this.facing, this) !== false) {
          g.burst(cx(e), cy(e), e.blood ?? '#ffffff', 6, 200, 4);
          if (a.kind === 'down') {
            this.vy = -560;
            this.jumps = 1;
            this.airDash = true;
          }
          g.cam.shake = Math.max(g.cam.shake, 3);
          this.onHit?.(e);
        }
      }
    }
    if (a.t >= a.dur) this.atk = null;
  }

  hurt(g, dmg = 1, dir = 0) {
    if (this.iframes > 0 || this.dashT > 0 || this.dying || g.locked || this.invincible) return false;
    this.hp -= dmg;
    this.iframes = 1;
    this.flash = 0.15;
    this.vx = (dir || -this.facing) * 320;
    this.vy = -380;
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
    this.hp = 0;
    g.burst(cx(this), cy(this), '#e2674f', 18, 300, 6);
    g.shake(12);
    (async () => {
      await g.fade(1, 0.5);
      const cp = g.checkpointAt ?? { x: 60, y: 300 };
      this.x = cp.x;
      this.y = cp.y;
      this.vx = this.vy = 0;
      this.hp = this.maxHp;
      this.atk = null;
      this.dashT = 0;
      this.iframes = 1.2;
      this.dying = false;
      g.onRespawn?.();
      g.snapCamera();
      await g.fade(0, 0.5);
    })();
  }

  draw(c, g) {
    if (this.dying) return;
    if (this.iframes > 0 && Math.floor(this.t * 20) % 2 && !g.locked) return;
    const a = this.atk;
    const moving = Math.abs(this.vx) > 20 && !!this.ground;
    const sw = this.flags.cursed ? 'cursed' : this.flags.swordKind ?? 'wood';
    // sword behind/in hand
    if (this.can.sword && !this.noSword) {
      c.save();
      const hx = cx(this) + this.facing * 13;
      const hy = this.y + 24;
      c.translate(hx, hy);
      let ang;
      if (a) {
        const k = Math.min(1, a.t / (a.dur * 0.6));
        if (a.kind === 'down') ang = Math.PI;
        else {
          const from = -2.2;
          const to = a.kind === 'finisher' ? 1.9 : 1.4;
          ang = from + (to - from) * k;
          if (this.combo === 1 && a.kind === 'slash') ang = to - (to - from) * k;
        }
      } else ang = 0.5;
      c.scale(this.facing, 1);
      c.rotate(ang);
      sword(c, sw, 0, 0, 0.8);
      c.restore();
    }
    drawButton(c, {
      x: this.x, y: this.y, w: this.w, h: this.h,
      color: this.color ?? '#e2674f', dark: this.dark ?? '#b84a36',
      facing: this.facing, t: this.t, moving, air: !this.ground,
      mood: this.mood, pendant: this.flags.pendant && !this.noPendant, crack: this.flags.pendantCracked,
      flash: this.flash > 0, red: this.red, tears: this.tears, sit: this.sit, pendantGlow: this.pendantGlow,
    });
    if (a && a.t < 0.18) {
      // swoosh
      c.save();
      c.strokeStyle = this.flags.cursed ? 'rgba(181,124,255,0.7)' : 'rgba(255,255,255,0.75)';
      c.lineWidth = a.kind === 'finisher' ? 6 : 4;
      c.beginPath();
      if (a.kind === 'down') c.arc(cx(this), this.y + this.h + 6, 24, 0.2, Math.PI - 0.2);
      else {
        const r = a.kind === 'finisher' ? 46 : 38;
        const s = this.facing > 0 ? -1.3 : Math.PI + 1.3;
        const e = this.facing > 0 ? 1.1 : Math.PI - 1.1;
        c.arc(cx(this), this.y + 18, r, Math.min(s, e), Math.max(s, e));
      }
      c.stroke();
      c.restore();
    }
  }

  drawOver(c, g) {
    if (this.bubble) drawBubble(c, g, this, this.bubble);
  }
}

/* ======================================================================
   Speech bubbles for quick lines while you keep playing
   ====================================================================== */
export function drawBubble(c, g, who, b) {
  if (g.time > b.until) {
    who.bubble = null;
    return;
  }
  c.font = `600 13px ${FONTS()}`;
  const words = b.text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (c.measureText(test).width > 200 && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  lines.push(line);
  const w = Math.max(...lines.map((l) => c.measureText(l).width)) + 18;
  const h = lines.length * 16 + 10;
  const x = clamp(cx(who) - w / 2, g.cam.x - 470, g.cam.x + 470 - w);
  const y = who.y - h - 16;
  c.fillStyle = b.color ?? 'rgba(255,255,255,0.95)';
  rr(c, x, y, w, h, 8);
  c.fill();
  c.beginPath();
  c.moveTo(cx(who) - 5, y + h);
  c.lineTo(cx(who) + 5, y + h);
  c.lineTo(cx(who), y + h + 7);
  c.fill();
  lines.forEach((l, i) => text(c, l, x + w / 2, y + 13 + i * 16, { size: 13, color: b.ink ?? '#2b1d17', weight: 600 }));
}

export function bark(g, who, text, sec = 2.6, style = {}) {
  who.bubble = { text, until: g.time + sec, ...style };
}

/* ======================================================================
   Everyone else who talks
   ====================================================================== */
const LOOKS = {
  bella: { shape: 'button', color: '#f39ac0', dark: '#cc6f97', bow: true, lashes: true, w: 30, h: 40 },
  tabby: { shape: 'key', color: '#5b9bd5', dark: '#3b77ad', label: 'TAB', w: 44, h: 40 },
  backspace: { shape: 'key', color: '#d9d4cc', dark: '#a8a198', label: '⌫', beard: true, w: 62, h: 40 },
  merchant: { shape: 'button', color: '#7cc6a4', dark: '#549c7c', w: 32, h: 40, label: 'ENTER' },
  trial: { shape: 'key', color: '#b57cff', dark: '#7d4fc4', label: 'FREE', w: 40, h: 40 },
  villager: { shape: 'button', color: '#f2c14e', dark: '#c99a2e', w: 28, h: 36 },
  guardian: { shape: 'robot', w: 54, h: 70 },
  cookie: { shape: 'cookie', w: 110, h: 110 },
  cursor: { shape: 'cursor', w: 26, h: 34 },
};

export class Npc {
  constructor(o) {
    Object.assign(this, { x: 0, y: 0, vx: 0, vy: 0, facing: 1, t: Math.random() * 3, mood: 'calm', walkSpeed: 120, z: 3 }, LOOKS[o.kind] ?? {}, o);
    if (o.act && !o.actLabel) this.actLabel = 'Talk';
  }

  update(g, dt) {
    this.t += dt;
    let move = 0;
    if (this.goal != null) {
      const d = this.goal - cx(this);
      if (Math.abs(d) < 4) this.goal = null;
      else move = Math.sign(d);
      if (this.wall && this.ground && !this.fixed) this.vy = -620;
    } else if (this.follow) move = this.followMove(g);
    if (this.faceTo) this.facing = Math.sign(cx(this.faceTo) - cx(this)) || this.facing;
    if (move) this.facing = move;
    if (!this.fixed) {
      this.vx = move * (this.goal != null ? this.walkSpeed : this.followSpeed ?? 230);
      if (this.knock) {
        this.vx += this.knock;
        this.knock *= 0.85;
        if (Math.abs(this.knock) < 5) this.knock = 0;
      }
      this.vy = Math.min(900, this.vy + GRAVITY * dt);
      moveBody(g, this, dt);
    }
    this.moving = Math.abs(this.vx) > 10;
    this.extra?.(g, dt);
  }

  followMove(g) {
    const p = this.follow;
    const want = cx(p) - p.facing * 46;
    const d = want - cx(this);
    if (Math.abs(cx(p) - cx(this)) > 700 || this.y > g.level.h + 40) {
      this.x = cx(p) - p.facing * 46 - this.w / 2;
      this.y = p.y + p.h - this.h;
      this.vy = 0;
      return 0;
    }
    if (this.ground && (p.y + p.h < this.y + this.h - 50 || this.wall) && Math.abs(d) > 10) this.vy = -720;
    if (Math.abs(d) < 18) {
      this.facing = p.facing;
      return 0;
    }
    return Math.sign(d);
  }

  draw(c, g) {
    const o = { ...this, moving: this.moving, mood: this.mood };
    if (this.shape === 'key') drawKey(c, o);
    else if (this.shape === 'robot') drawRobot(c, this, g);
    else if (this.shape === 'cookie') drawCookie(c, this, g);
    else if (this.shape === 'cursor') drawCursorGuy(c, this, g);
    else drawButton(c, o);
    if (this.weapon) {
      c.save();
      c.translate(cx(this) + this.facing * (this.w / 2 + 2), this.y + 24);
      c.scale(this.facing, 1);
      c.rotate(this.swing > 0 ? -2 + (1 - this.swing / 0.25) * 3.4 : 0.5);
      sword(c, this.weapon, 0, 0, 0.75);
      c.restore();
    }
  }

  drawOver(c, g) {
    if (this.bubble) drawBubble(c, g, this, this.bubble);
  }
}

function drawRobot(c, r, g) {
  const { x, y, w, h } = r;
  c.fillStyle = '#7d8a99';
  rr(c, x, y + 20, w, h - 30, 8);
  c.fill();
  c.fillStyle = '#5c6775';
  c.fillRect(x + 8, y + h - 12, 12, 12);
  c.fillRect(x + w - 20, y + h - 12, 12, 12);
  c.fillStyle = '#a7b3c0';
  rr(c, x + 4, y, w - 8, 28, 6);
  c.fill();
  c.fillStyle = '#0b1a12';
  c.fillRect(x + 9, y + 5, w - 18, 18);
  const broken = r.broken;
  text(c, broken && Math.sin(g.time * 9) > 0 ? 'ERR' : '• •', x + w / 2, y + 14, { size: 11, color: broken ? '#ff6b5e' : '#3df59a' });
  if (broken) {
    c.strokeStyle = '#333';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x + 10, y + 34);
    c.lineTo(x + 24, y + 46);
    c.lineTo(x + 16, y + 56);
    c.stroke();
    if (Math.random() < 0.08) g.burst(x + w - 8, y + 30, '#ffe066', 2, 120, 3);
  }
}

function drawCookie(c, k, g) {
  const r = k.w / 2;
  const x = cx(k);
  const y = cy(k) + Math.sin(g.time * 2) * 3;
  c.fillStyle = '#d79a5a';
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#5a3418';
  [[-25, -20], [20, -30], [30, 15], [-10, 30], [-35, 10], [5, -5]].forEach(([dx, dy]) => {
    c.beginPath();
    c.arc(x + dx, y + dy, 6, 0, Math.PI * 2);
    c.fill();
  });
  c.fillStyle = '#fff';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.arc(x + s * 18, y - 12, 12, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = '#111';
  for (const s of [-1, 1]) {
    c.beginPath();
    c.arc(x + s * 18 + Math.sin(g.time * 3) * 3, y - 10, 5, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = '#3a1a0a';
  c.beginPath();
  c.ellipse(x, y + 22, 26, 10 + Math.abs(Math.sin(g.time * 4)) * 4, 0, 0, Math.PI * 2);
  c.fill();
}

export function drawCursorGuy(c, k, g) {
  c.save();
  c.translate(k.x, k.y + Math.sin(g.time * 3) * 3);
  const s = k.w / 17;
  c.scale(s, s);
  if (k.glow) {
    c.shadowColor = k.glow;
    c.shadowBlur = 18;
  }
  cursorShape(c, k.flash ? '#ffd0d0' : '#ffffff', '#111');
  c.shadowBlur = 0;
  // two tiny worried eyes
  c.fillStyle = '#111';
  c.beginPath();
  c.arc(4, 11, 1.1, 0, Math.PI * 2);
  c.arc(7.5, 11, 1.1, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/* ======================================================================
   Tabby, the best friend who follows you around
   ====================================================================== */
export function makeTabby(g, player, x, y) {
  const t = new Npc({ kind: 'tabby', x, y, weapon: 'tabby', follow: player, z: 4 });
  t.stunReady = 1;
  t.swing = 0;
  t.cd = 0;
  t.team = 'player';
  t.extra = (g, dt) => {
    t.stunReady = Math.min(1, t.stunReady + dt / 5);
    t.swing = Math.max(0, t.swing - dt);
    t.cd = Math.max(0, t.cd - dt);
    if (t.slamming) {
      t.slamT -= dt;
      if (t.slamT <= 0 || t.ground) {
        t.slamming = false;
        t.follow = player;
        const target = t.slamTarget;
        g.burst(cx(t), t.y + t.h, '#5b9bd5', 14, 260, 5);
        g.shake(10);
        sfx.stun();
        for (const e of g.ents) {
          if (e.team !== 'enemy' || e.dead || !e.hurt) continue;
          if (e === target || (Math.abs(cx(e) - cx(t)) < 110 && Math.abs(cy(e) - cy(t)) < 120)) {
            e.stunned = Math.max(e.stunned ?? 0, e.stunTime ?? 2.2);
            e.hurt(g, 1, Math.sign(cx(e) - cx(t)) || 1, t);
          }
        }
        if (target?.onStun) target.onStun(g);
      }
      return;
    }
    if (!t.follow || g.locked || t.passive) return;
    // help out: poke anything close with the wooden sword
    const foe = g.ents.find((e) => e.team === 'enemy' && !e.dead && e.hurt && !e.big && Math.abs(cx(e) - cx(t)) < 70 && Math.abs(cy(e) - cy(t)) < 60);
    if (foe && t.cd <= 0) {
      t.facing = Math.sign(cx(foe) - cx(t)) || 1;
      t.swing = 0.25;
      t.cd = 1.3;
      sfx.swing();
      foe.hurt(g, 1, t.facing, t);
    }
  };
  t.slam = (g) => {
    if (t.stunReady < 1 || t.slamming) return;
    let best = null;
    let bd = 420;
    for (const e of g.ents) {
      if (e.team !== 'enemy' || e.dead || !e.hurt) continue;
      const d = Math.hypot(cx(e) - cx(player), cy(e) - cy(player));
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    if (!best) {
      bark(g, t, pickLine(['Slam what? The air?', 'Nothing to hit, bro.', 'I am READY. Nobody is here.']), 1.6);
      return;
    }
    t.stunReady = 0;
    t.slamming = true;
    t.slamT = 1.2;
    t.slamTarget = best;
    t.follow = null;
    t.x = clamp(cx(best) - t.w / 2, best.x - 20, best.x + best.w - 20);
    t.y = Math.min(t.y, best.y - 160);
    t.vy = 300;
    bark(g, t, pickLine(['TAB SLAM!', 'Indent THIS!', 'Shift + TAB!']), 1.2);
  };
  t.alwaysUpdate = false;
  player.tabby = t;
  g.add(t);
  return t;
}

const pickLine = (a) => a[Math.floor(Math.random() * a.length)];

/* ======================================================================
   Enemies
   ====================================================================== */
export class Enemy {
  constructor(o) {
    Object.assign(this, { vx: 0, vy: 0, facing: -1, t: Math.random() * 2, hp: 1, team: 'enemy', touch: 1, z: 2, flash: 0, stunned: 0 }, o);
    this.maxHp = this.hp;
  }

  hurt(g, dmg, dir) {
    if (this.dead) return false;
    if (this.invuln) {
      sfx.clang();
      return false;
    }
    this.hp -= dmg;
    this.flash = 0.12;
    this.vx = dir * (this.kb ?? 260);
    if (!this.fly) this.vy = -200;
    sfx.hit();
    if (this.hp <= 0) this.kill(g);
    return true;
  }

  kill(g) {
    this.dead = true;
    sfx.kill();
    g.burst(cx(this), cy(this), this.blood ?? '#ffffff', 14, 260, 5);
    if (this.drop !== false && Math.random() < (this.dropChance ?? 0.45)) g.add(new Pickup({ kind: Math.random() < 0.18 ? 'heart' : 'coin', x: cx(this) - 8, y: cy(this) - 8, pop: true }));
    this.onKill?.(g);
  }

  update(g, dt) {
    this.t += dt;
    this.flash = Math.max(0, this.flash - dt);
    if (this.stunned > 0) {
      this.stunned -= dt;
      this.vx *= 0.85;
      if (!this.fly) {
        this.vy = Math.min(900, this.vy + GRAVITY * dt);
        moveBody(g, this, dt);
      }
    } else this.think(g, dt);
    const p = g.player;
    if (this.touch && p && !p.dying && this.stunned <= 0 && overlap(this, p)) {
      if (p.hurt(g, this.touch, Math.sign(cx(p) - cx(this)) || 1)) this.onTouch?.(g);
    }
    if (this.y > g.level.h + 200) this.dead = true;
  }

  think() {}

  gravity(g, dt) {
    this.vy = Math.min(900, this.vy + GRAVITY * dt);
    moveBody(g, this, dt);
  }

  drawStun(c, g) {
    if (this.stunned > 0) {
      for (let i = 0; i < 3; i++) {
        const a = g.time * 5 + (i * Math.PI * 2) / 3;
        text(c, '★', cx(this) + Math.cos(a) * 16, this.y - 8 + Math.sin(a) * 4, { size: 11, color: '#ffe066' });
      }
    }
  }
}

// Garden bug: walks back and forth, turns around at walls and ledges.
export class Bug extends Enemy {
  constructor(o) {
    super({ w: 26, h: 16, hp: 1, speed: 55, blood: '#7ccf5a', ...o });
  }
  think(g, dt) {
    const ahead = this.facing > 0 ? this.x + this.w + 2 : this.x - 2;
    if (this.ground && (!solidAt(g, ahead, this.y + this.h + 4) || this.wall)) this.facing *= -1;
    this.vx += (this.facing * this.speed - this.vx) * Math.min(1, dt * 8);
    this.gravity(g, dt);
  }
  draw(c, g) {
    const x = this.x;
    const y = this.y;
    c.fillStyle = this.flash ? '#fff' : this.color ?? '#5aa845';
    c.beginPath();
    c.ellipse(x + 13, y + 9, 13, 8, 0, Math.PI, 0);
    c.fill();
    c.fillRect(x, y + 8, 26, 3);
    c.strokeStyle = '#2d4a1f';
    c.lineWidth = 2;
    const k = Math.sin(this.t * 18) * 2;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(x + 6 + i * 7, y + 10);
      c.lineTo(x + 4 + i * 7 + (i % 2 ? k : -k), y + 16);
      c.stroke();
    }
    c.fillStyle = '#fff';
    c.fillRect(this.facing > 0 ? x + 20 : x + 2, y + 3, 4, 4);
    this.drawStun(c, g);
  }
}

// Angry Checkbox Crab: hops at you trying to check you off a list.
export class Crab extends Enemy {
  constructor(o) {
    super({ w: 30, h: 26, hp: 2, blood: '#ffffff', hopT: 1, ...o });
  }
  think(g, dt) {
    const p = g.player;
    this.hopT -= dt;
    const near = p && Math.abs(cx(p) - cx(this)) < 380;
    if (this.ground) {
      this.vx *= 0.8;
      if (near && this.hopT <= 0) {
        this.facing = Math.sign(cx(p) - cx(this)) || 1;
        this.vy = -520;
        this.vx = this.facing * 190;
        this.hopT = 1.1 + Math.random() * 0.5;
      }
    }
    this.gravity(g, dt);
  }
  draw(c, g) {
    const x = this.x;
    const y = this.y;
    c.strokeStyle = '#c94a3a';
    c.lineWidth = 3;
    const k = Math.sin(this.t * 12) * 3;
    c.beginPath();
    c.moveTo(x + 4, y + 18);
    c.lineTo(x - 4, y + 26 + k);
    c.moveTo(x + 26, y + 18);
    c.lineTo(x + 34, y + 26 - k);
    c.stroke();
    // claws
    c.fillStyle = '#e65a48';
    c.beginPath();
    c.arc(x - 4, y + 4 + k, 6, 0, Math.PI * 2);
    c.arc(x + 34, y + 4 - k, 6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = this.flash ? '#ffd0d0' : '#ffffff';
    rr(c, x + 3, y + 2, 24, 20, 4);
    c.fill();
    c.strokeStyle = '#333';
    c.lineWidth = 2;
    rr(c, x + 3, y + 2, 24, 20, 4);
    c.stroke();
    c.strokeStyle = '#2bb24c';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x + 8, y + 12);
    c.lineTo(x + 13, y + 17);
    c.lineTo(x + 22, y + 6);
    c.stroke();
    // angry eyes on stalks
    c.fillStyle = '#222';
    c.fillRect(x + 8, y - 6, 3, 8);
    c.fillRect(x + 19, y - 6, 3, 8);
    this.drawStun(c, g);
  }
}

// Popup Bat: flutters around, swoops, and slaps a fake ad over your screen.
export class Bat extends Enemy {
  constructor(o) {
    super({ w: 34, h: 24, hp: 1, fly: true, blood: '#5a74ff', state: 'hover', ...o });
    this.home = { x: o.x, y: o.y };
  }
  think(g, dt) {
    const p = g.player;
    if (this.state === 'hover') {
      this.x += (this.home.x + Math.sin(this.t * 1.7) * 60 - this.x) * dt * 2;
      this.y += (this.home.y + Math.sin(this.t * 3) * 14 - this.y) * dt * 2;
      if (p && Math.abs(cx(p) - cx(this)) < 260 && this.t > 1.5) {
        this.state = 'swoop';
        this.target = { x: cx(p), y: cy(p) };
        this.t = 0;
      }
    } else {
      const dx = this.target.x - cx(this);
      const dy = this.target.y - cy(this);
      const d = Math.hypot(dx, dy);
      if (d < 12 || this.t > 1.4) {
        this.state = 'hover';
        this.t = 0;
      } else {
        this.x += (dx / d) * 300 * dt;
        this.y += (dy / d) * 300 * dt;
      }
    }
    this.x += this.vx * dt;
    this.vx *= 0.9;
    this.facing = p ? Math.sign(cx(p) - cx(this)) || 1 : 1;
  }
  onTouch(g) {
    adPopup(g);
  }
  draw(c, g) {
    const flap = Math.sin(this.t * 20) * 8;
    c.fillStyle = '#444b66';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(cx(this) + s * 10, this.y + 10);
      c.lineTo(cx(this) + s * 30, this.y + flap);
      c.lineTo(cx(this) + s * 22, this.y + 18);
      c.fill();
    }
    popupWindow(c, this.x, this.y, this.w, this.h, 'AD', this.flash ? '#fff' : '#5a74ff');
    this.drawStun(c, g);
  }
}

export function adPopup(g) {
  const labels = ['HOT SINGLE BUTTONS NEAR YOU', 'YOU ARE THE 1,000,000th VISITOR', 'DOWNLOAD MORE RAM', 'LOCAL BUTTON FOUND ONE WEIRD TRICK', 'CONGRATS!! CLICK HERE'];
  g.fx.ads = g.fx.ads ?? [];
  g.fx.ads.push({ x: 120 + Math.random() * 520, y: 80 + Math.random() * 260, w: 280, h: 140, label: labels[Math.floor(Math.random() * labels.length)], until: g.time + 2.2 });
  sfx.error();
}

// Loading Slime: freezes with a spinner, then suddenly charges.
export class Slime extends Enemy {
  constructor(o) {
    super({ w: 34, h: 24, hp: 2, blood: '#7fd6ff', state: 'idle', timer: 0, ...o });
  }
  think(g, dt) {
    const p = g.player;
    this.timer -= dt;
    if (this.state === 'idle') {
      this.vx *= 0.85;
      if (p && Math.abs(cx(p) - cx(this)) < 330 && Math.abs(cy(p) - cy(this)) < 120) {
        this.state = 'load';
        this.timer = 1.1;
        this.facing = Math.sign(cx(p) - cx(this)) || 1;
      }
    } else if (this.state === 'load') {
      this.vx = 0;
      if (this.timer <= 0) {
        this.state = 'charge';
        this.timer = 0.8;
      }
    } else if (this.state === 'charge') {
      this.vx = this.facing * 430;
      if (this.timer <= 0 || this.wall) {
        this.state = 'idle';
        this.timer = 1;
      }
    }
    this.gravity(g, dt);
  }
  draw(c, g) {
    const sq = this.state === 'charge' ? 3 : Math.sin(this.t * 4) * 2;
    c.fillStyle = this.flash ? '#fff' : '#7fd6ff';
    c.beginPath();
    c.ellipse(cx(this), this.y + this.h - 10 + sq / 2, 18 + sq, 13 - sq / 2, 0, Math.PI, 0);
    c.fillRect(this.x - sq, this.y + this.h - 10, this.w + sq * 2, 10);
    c.fill();
    c.fillStyle = '#1d3b56';
    c.fillRect(cx(this) - 7 + this.facing * 3, this.y + 8, 3, 5);
    c.fillRect(cx(this) + 4 + this.facing * 3, this.y + 8, 3, 5);
    if (this.state === 'load') {
      c.strokeStyle = '#ffffff';
      c.lineWidth = 3;
      c.beginPath();
      const a = g.time * 10;
      c.arc(cx(this), this.y - 14, 8, a, a + 4.2);
      c.stroke();
    }
    this.drawStun(c, g);
  }
}

// Security drone: hovers at a distance and shoots.
export class Drone extends Enemy {
  constructor(o) {
    super({ w: 36, h: 22, hp: 2, fly: true, blood: '#ff5a5a', fire: 1.5 + Math.random(), ...o });
    this.home = { x: o.x, y: o.y };
  }
  think(g, dt) {
    const p = g.player;
    if (!p) return;
    this.fire -= dt;
    const tx = clamp(cx(p) + Math.sin(this.t * 0.8) * 160, this.home.x - (this.range ?? 260), this.home.x + (this.range ?? 260));
    const ty = (this.hover ?? this.home.y) + Math.sin(this.t * 2) * 12;
    this.x += (tx - cx(this)) * dt * 1.4 + this.vx * dt;
    this.y += (ty - this.y) * dt * 2;
    this.vx *= 0.9;
    this.facing = Math.sign(cx(p) - cx(this)) || 1;
    if (this.fire <= 0 && Math.abs(cx(p) - cx(this)) < 520) {
      this.fire = this.rate ?? 2;
      const a = Math.atan2(cy(p) - cy(this), cx(p) - cx(this));
      g.add(new Shot({ x: cx(this) - 5, y: cy(this) - 5, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260 }));
      sfx.shoot();
    }
  }
  draw(c, g) {
    const x = this.x;
    const y = this.y;
    c.fillStyle = this.flash ? '#fff' : '#5d6b80';
    rr(c, x, y + 6, this.w, 14, 7);
    c.fill();
    c.fillStyle = '#2b3240';
    c.fillRect(x + 4, y, this.w - 8, 4);
    c.fillStyle = Math.sin(g.time * 30) > 0 ? '#9aa' : '#667';
    c.fillRect(x - 4, y - 2, 14, 2);
    c.fillRect(x + this.w - 10, y - 2, 14, 2);
    c.fillStyle = this.fire < 0.4 ? '#ffffff' : '#ff3b3b';
    c.beginPath();
    c.arc(cx(this) + this.facing * 6, y + 13, 4, 0, Math.PI * 2);
    c.fill();
    this.drawStun(c, g);
  }
}

// Enemy bullets. Some can be slashed out of the air.
export class Shot {
  constructor(o) {
    Object.assign(this, { w: 10, h: 10, life: 4, dmg: 1, team: 'enemy', color: '#ff5a5a', z: 6, cuttable: true }, o);
  }
  update(g, dt) {
    this.life -= dt;
    this.vy += (this.grav ?? 0) * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.life <= 0) this.dead = true;
    if (this.solidHit !== false && g.solids.some((s) => !s.off && !s.oneWay && overlap(this, s))) this.dead = true;
    const p = g.player;
    if (p && !p.dying && overlap(this, p) && p.hurt(g, this.dmg, Math.sign(this.vx) || 1)) {
      this.dead = true;
      this.onHit?.(g);
    }
  }
  hurt(g) {
    if (!this.cuttable) return false;
    this.dead = true;
    sfx.clang();
    return true;
  }
  draw(c, g) {
    if (this.label) {
      popupWindow(c, this.x, this.y, this.w, this.h, this.label, this.bar ?? '#5a74ff');
      return;
    }
    c.fillStyle = this.color;
    c.beginPath();
    c.arc(cx(this), cy(this), this.w / 2 + Math.sin(g.time * 30), 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath();
    c.arc(cx(this), cy(this), this.w / 4, 0, Math.PI * 2);
    c.fill();
  }
}

/* ======================================================================
   Things to pick up, poke, or walk into
   ====================================================================== */
export class Pickup {
  constructor(o) {
    Object.assign(this, { w: 16, h: 16, t: Math.random() * 3, z: 4, vy: o.pop ? -300 : 0, vx: o.pop ? rand(-60, 60) : 0 }, o);
    this.float = !o.pop;
  }
  update(g, dt) {
    this.t += dt;
    if (!this.float) {
      this.vy = Math.min(800, this.vy + GRAVITY * dt);
      moveBody(g, this, dt);
      this.vx *= 0.95;
    }
    const p = g.player;
    if (p && !p.dying && !this.locked && overlap(p, this)) {
      this.dead = true;
      if (this.kind === 'coin') {
        g.flags.coins = (g.flags.coins ?? 0) + 1;
        sfx.coin();
        g.floatText(cx(this), this.y, '+1', '#f2c14e', 14);
      } else if (this.kind === 'heart') {
        p.heal(1);
        sfx.heal();
      } else sfx.item();
      this.onGet?.(g);
    }
  }
  draw(c, g) {
    const y = this.y + (this.float ? Math.sin(this.t * 3) * 3 : 0);
    if (this.kind === 'coin') {
      const sx = Math.abs(Math.cos(this.t * 3));
      c.fillStyle = '#f2c14e';
      c.beginPath();
      c.ellipse(cx(this), y + 8, 7 * sx + 1, 8, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#c99a2e';
      c.fillRect(cx(this) - 1, y + 4, 2 * sx, 8);
    } else if (this.kind === 'heart') heart(c, cx(this), y + 8, 8, '#ff4f6b', '#a3203a');
    else this.look?.(c, g, this.x, y);
  }
}

// A thing you can press E on. draw is optional.
export class Thing {
  constructor(o) {
    Object.assign(this, { w: 40, h: 40, z: 1, actLabel: 'Use' }, o);
  }
  update(g, dt) {
    this.tick?.(g, dt);
  }
  draw(c, g) {
    this.look?.(c, g, this);
  }
}

// An invisible zone that fires once when the player walks in.
export class Trigger {
  constructor(o) {
    Object.assign(this, { w: 40, h: 600, y: -60, once: true }, o);
    this.hidden = true;
  }
  update(g) {
    const p = g.player;
    if (p && !p.dying && overlap(p, this)) {
      if (this.once) this.dead = true;
      this.fire(g);
    }
  }
}

/* ---------- special platforms (these live in g.solids) ---------- */

// Drops a moment after you land on it; comes back later unless gone: true.
export function fallingPlatform(x, y, w, opts = {}) {
  const s = { x, y, w, h: 16, kind: opts.kind ?? 'wood', oneWay: true, fall: true, home: y, state: 'idle', timer: 0 };
  s.update = (g, dt) => {
    const p = g.player;
    if (s.state === 'idle' && p?.ground === s) {
      s.state = 'shake';
      s.timer = opts.delay ?? 0.45;
      sfx.crack();
    } else if (s.state === 'shake') {
      s.shakeX = 4;
      s.timer -= dt;
      if (s.timer <= 0) {
        s.state = 'fall';
        s.vy = 0;
      }
    } else if (s.state === 'fall') {
      s.shakeX = 0;
      s.vy += 1600 * dt;
      s.dy = s.vy * dt;
      s.y += s.dy;
      if (s.y > g.level.h + 100) {
        s.state = opts.gone ? 'gone' : 'wait';
        s.off = true;
        s.timer = 2.5;
      }
    } else if (s.state === 'wait') {
      s.timer -= dt;
      if (s.timer <= 0) {
        s.state = 'idle';
        s.y = s.home;
        s.off = false;
      }
    }
  };
  return s;
}

// Blinks in and out of existence on a timer.
export function vanishingPlatform(x, y, w, period = 3, phase = 0, opts = {}) {
  const s = { x, y, w, h: 16, kind: opts.kind ?? 'glitch', oneWay: true, vanish: true };
  s.update = (g) => {
    const k = ((g.time / period + phase) % 1 + 1) % 1;
    s.off = k > 0.62;
    s.alpha = k > 0.45 && k <= 0.62 ? 0.35 + 0.35 * Math.abs(Math.sin(g.time * 20)) : 1;
  };
  return s;
}

// Slides back and forth between x and x + range (or vertically with axis: 'y').
export function movingPlatform(x, y, w, range, speed = 1, opts = {}) {
  const s = { x, y, w, h: 16, kind: opts.kind ?? 'metal', oneWay: true, move: true, ox: x, oy: y };
  s.update = (g) => {
    const k = (Math.sin(g.time * speed + (opts.phase ?? 0)) + 1) / 2;
    if (opts.axis === 'y') {
      const ny = s.oy + k * range;
      s.dy = ny - s.y;
      s.y = ny;
    } else {
      const nx = s.ox + k * range;
      s.dx = nx - s.x;
      s.x = nx;
    }
  };
  return s;
}
