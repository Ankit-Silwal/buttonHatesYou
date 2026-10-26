import { GRAVITY, moveBody, overlap, solidAt, clamp, rand, pick, cx, cy } from '@/reason/engine';
import { sfx } from '@/reason/audio';
import { rr, text, heart, popupWindow, drawButton, drawKey } from '@/reason/draw';
import { Enemy, Bug, Crab, Bat, Slime, Drone, Shot, Thing, Pickup, bark } from '@/reason/actors';
import { GROUND } from '@/reason/build';

// Everything that fights Bobby in How I Met Your Cursor. Most enemies reuse
// a brain from The Reason and just wear a different face.

/* ---------- small fry ---------- */

export class Wallet extends Bug {
  constructor(o) {
    super({ w: 30, h: 20, hp: 2, speed: 85, blood: '#8a5a3a', ...o });
  }
  draw(c, g) {
    const { x, y } = this;
    c.fillStyle = this.flash ? '#fff' : '#7a4a2a';
    rr(c, x, y, 30, 20, 4);
    c.fill();
    c.fillStyle = '#5a3218';
    c.fillRect(x + (this.facing > 0 ? 18 : 2), y + 6, 10, 8);
    c.fillStyle = '#fff';
    c.fillRect(x + 6, y + 4, 5, 4);
    c.fillRect(x + 15, y + 4, 5, 4);
    c.fillStyle = '#e83b3b';
    c.fillRect(x + 8, y + 5, 2, 2);
    c.fillRect(x + 17, y + 5, 2, 2);
    this.drawStun(c, g);
  }
}

export class TaxGoblin extends Crab {
  constructor(o) {
    super({ w: 26, h: 28, hp: 2, blood: '#7cc06a', ...o });
  }
  draw(c, g) {
    const { x, y } = this;
    c.fillStyle = this.flash ? '#fff' : '#6fae5a';
    rr(c, x, y + 4, 26, 24, 8);
    c.fill();
    c.fillStyle = '#6fae5a';
    c.beginPath();
    c.moveTo(x, y + 8);
    c.lineTo(x - 7, y);
    c.lineTo(x + 6, y + 6);
    c.moveTo(x + 26, y + 8);
    c.lineTo(x + 33, y);
    c.lineTo(x + 20, y + 6);
    c.fill();
    c.fillStyle = '#111';
    c.fillRect(x + 7, y + 11, 3, 3);
    c.fillRect(x + 16, y + 11, 3, 3);
    c.fillStyle = '#c62f3a';
    c.fillRect(x + 11, y + 18, 4, 9);
    text(c, 'TAX', x + 13, y - 4, { size: 9, color: '#2d4a1f' });
    this.drawStun(c, g);
  }
}

// Coins with legs. They run away. Catching one is the point.
export class RunCoin extends Enemy {
  constructor(o) {
    super({ w: 18, h: 22, hp: 1, touch: 0, blood: '#f2c14e', drop: false, ...o });
  }
  think(g, dt) {
    const p = g.player;
    const d = cx(this) - cx(p);
    const scared = Math.abs(d) < 220;
    const dir = scared ? Math.sign(d) || 1 : this.facing;
    const ahead = dir > 0 ? this.x + this.w + 2 : this.x - 2;
    if (this.ground && (!solidAt(g, ahead, this.y + this.h + 4) || this.wall)) {
      if (scared) this.vy = -520;
      else this.facing *= -1;
    }
    this.facing = dir;
    this.vx += (dir * (scared ? 175 : 40) - this.vx) * Math.min(1, dt * 6);
    this.gravity(g, dt);
    if (overlap(this, p)) this.grab(g);
  }
  hurt(g) {
    this.grab(g);
    return true;
  }
  grab(g) {
    if (this.dead) return;
    this.dead = true;
    g.flags.coins = (g.flags.coins ?? 0) + (this.value ?? 1);
    sfx.coin();
    g.floatText(cx(this), this.y, `+${this.value ?? 1}`, '#f2c14e', 15);
    this.onKill?.(g);
  }
  draw(c, g) {
    const { x, y } = this;
    c.strokeStyle = '#7a5a10';
    c.lineWidth = 2;
    const k = Math.sin(this.t * 22) * 3;
    c.beginPath();
    c.moveTo(x + 6, y + 15);
    c.lineTo(x + 6 + k, y + 22);
    c.moveTo(x + 12, y + 15);
    c.lineTo(x + 12 - k, y + 22);
    c.stroke();
    c.fillStyle = '#f2c14e';
    c.beginPath();
    c.arc(x + 9, y + 8, 8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#111';
    c.fillRect(x + 5 + this.facing * 2, y + 6, 2, 2);
    c.fillRect(x + 10 + this.facing * 2, y + 6, 2, 2);
    c.strokeStyle = '#111';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(x + 9 + this.facing * 2, y + 12, 2, 0, Math.PI * 2);
    c.stroke();
  }
}

export class CapsBat extends Bat {
  draw(c, g) {
    const flap = Math.sin(this.t * 20) * 8;
    c.fillStyle = '#3a3a4a';
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(cx(this) + s * 10, this.y + 10);
      c.lineTo(cx(this) + s * 30, this.y + flap);
      c.lineTo(cx(this) + s * 22, this.y + 18);
      c.fill();
    }
    drawKey(c, { x: this.x, y: this.y - 4, w: this.w, h: this.h + 6, color: this.flash ? '#fff' : '#e8e4dc', dark: '#a8a198', label: 'CAPS', t: this.t, mood: 'shout', sit: true, facing: this.facing });
    if (Math.sin(this.t * 1.3) > 0.95) text(c, 'AAAAA', cx(this), this.y - 14, { size: 11, color: '#ff5a5a' });
    this.drawStun(c, g);
  }
}

const AUTOCORRECT = ['I am ducking furious.', 'Bella is so beautiful, like a potato.', 'I will defeat you with my sword. Swore. Sward.', 'Help, I have been autocorrected to "Bibby".'];
export class AutoSlime extends Slime {
  onTouch(g) {
    bark(g, g.player, pick(AUTOCORRECT), 2.2, { color: '#ffe6f0' });
  }
  draw(c, g) {
    super.draw(c, g);
    text(c, 'ABC→ABD', cx(this), this.y - 6, { size: 8, color: '#1d3b56' });
  }
}

// Lag Spider: touching it makes you slow for a bit.
export class LagSpider extends Bug {
  constructor(o) {
    super({ w: 28, h: 18, hp: 2, speed: 45, blood: '#555', ...o });
  }
  onTouch(g) {
    g.player.slowT = 2.2;
    bark(g, g.player, 'Why… is… everything… loading…', 2);
  }
  draw(c, g) {
    const { x, y } = this;
    c.strokeStyle = '#2a2a33';
    c.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const k = Math.sin(this.t * 10 + i) * 3;
      c.beginPath();
      c.moveTo(x + 14, y + 8);
      c.lineTo(x - 2 + i * 2, y + 18 + k);
      c.moveTo(x + 14, y + 8);
      c.lineTo(x + 30 - i * 2, y + 18 - k);
      c.stroke();
    }
    c.fillStyle = this.flash ? '#fff' : '#3a3a46';
    c.beginPath();
    c.arc(x + 14, y + 8, 9, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#8dffc8';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x + 14, y + 8, 5, this.t * 6, this.t * 6 + 4);
    c.stroke();
    this.drawStun(c, g);
  }
}

// Spam Bees come in swarms and home in on you.
export class SpamBee extends Enemy {
  constructor(o) {
    super({ w: 14, h: 12, hp: 1, fly: true, blood: '#ffd84d', dropChance: 0.15, ...o });
    this.ph = Math.random() * 6;
  }
  think(g, dt) {
    const p = g.player;
    const d = Math.hypot(cx(p) - cx(this), cy(p) - cy(this));
    if (d < 420) {
      const sp = 120;
      this.x += ((cx(p) - cx(this)) / d) * sp * dt + Math.sin(this.t * 9 + this.ph) * 40 * dt;
      this.y += ((cy(p) - cy(this)) / d) * sp * dt + Math.cos(this.t * 7 + this.ph) * 60 * dt;
    }
    this.x += this.vx * dt;
    this.vx *= 0.9;
  }
  draw(c, g) {
    c.fillStyle = this.flash ? '#fff' : '#ffd84d';
    rr(c, this.x, this.y, 14, 12, 5);
    c.fill();
    c.fillStyle = '#222';
    c.fillRect(this.x + 4, this.y, 2, 12);
    c.fillRect(this.x + 9, this.y, 2, 12);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fillRect(this.x + 3, this.y - 4 + Math.sin(this.t * 40) * 2, 8, 4);
    if (Math.sin(this.t * 2 + this.ph) > 0.97) text(c, 'SPAM', cx(this), this.y - 8, { size: 8, color: '#a37f00' });
  }
}

export class GoldCoinCrab extends Crab {
  constructor(o) {
    super({ w: 24, h: 24, hp: 2, blood: '#f2c14e', ...o });
  }
  draw(c, g) {
    c.fillStyle = this.flash ? '#fff' : '#f2c14e';
    c.beginPath();
    c.arc(cx(this), cy(this), 12, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#c99a2e';
    text(c, '$', cx(this), cy(this) + 1, { size: 13, color: '#a37f00' });
    c.fillStyle = '#c62f3a';
    c.fillRect(cx(this) - 7, this.y + 5, 4, 3);
    c.fillRect(cx(this) + 3, this.y + 5, 4, 3);
    this.drawStun(c, g);
  }
}

export class PaperclipWorm extends Bug {
  constructor(o) {
    super({ w: 40, h: 14, hp: 3, speed: 50, blood: '#c9ccd6', ...o });
  }
  draw(c, g) {
    c.strokeStyle = this.flash ? '#fff' : '#b8bcc8';
    c.lineWidth = 3;
    const k = Math.sin(this.t * 8) * 3;
    rr(c, this.x, this.y + 2 + k * 0.3, 40, 12, 6);
    c.stroke();
    rr(c, this.x + 6, this.y + 5 - k * 0.3, 28, 6, 3);
    c.stroke();
    c.fillStyle = '#111';
    c.fillRect(this.facing > 0 ? this.x + 34 : this.x + 3, this.y + 4, 3, 3);
    this.drawStun(c, g);
  }
}

export class CaptchaGuard extends Drone {
  draw(c, g) {
    const { x, y } = this;
    c.fillStyle = this.flash ? '#fff' : '#f4f6fb';
    rr(c, x, y, this.w, this.h, 4);
    c.fill();
    c.strokeStyle = '#4a74d9';
    c.lineWidth = 2;
    c.strokeRect(x + 5, y + 5, 12, 12);
    if (Math.sin(this.t * 3) > 0) {
      c.beginPath();
      c.moveTo(x + 7, y + 11);
      c.lineTo(x + 10, y + 14);
      c.lineTo(x + 16, y + 6);
      c.stroke();
    }
    text(c, 'robot?', x + 27, y + 11, { size: 7, color: '#4a74d9' });
    this.drawStun(c, g);
  }
}

export class PopupGoblin extends Crab {
  constructor(o) {
    super({ w: 30, h: 26, hp: 1, blood: '#5a74ff', ...o });
  }
  draw(c, g) {
    popupWindow(c, this.x, this.y, this.w, this.h, '>:(', this.flash ? '#fff' : '#ff7a59');
    this.drawStun(c, g);
  }
}

// A giant ant running off with a slice of wedding cake.
export class CakeAnt extends Enemy {
  constructor(o) {
    super({ w: 34, h: 20, hp: 2, touch: 0, blood: '#3a2a20', drop: false, ...o });
    this.facing = 1;
  }
  think(g, dt) {
    const p = g.player;
    const near = Math.abs(cx(p) - cx(this)) < 260;
    const ahead = this.x + this.w + 4;
    if (this.ground && (!solidAt(g, ahead, this.y + this.h + 4) || this.wall)) this.vy = -560;
    this.vx += ((near ? 200 : 70) - this.vx) * Math.min(1, dt * 5);
    this.gravity(g, dt);
    if (this.x > g.level.w - 80) this.x = g.level.w - 80;
  }
  draw(c, g) {
    const { x, y } = this;
    c.fillStyle = '#ffe8f0';
    c.fillRect(x + 6, y - 14, 22, 12);
    c.fillStyle = '#ff8fb1';
    c.fillRect(x + 6, y - 14, 22, 4);
    c.fillStyle = this.flash ? '#fff' : '#2a1a14';
    for (const [dx, r] of [[6, 6], [17, 7], [28, 6]]) {
      c.beginPath();
      c.arc(x + dx, y + 10, r, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = '#2a1a14';
    c.lineWidth = 2;
    const k = Math.sin(this.t * 25) * 3;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(x + 10 + i * 8, y + 14);
      c.lineTo(x + 8 + i * 8 + (i % 2 ? k : -k), y + 20);
      c.stroke();
    }
    this.drawStun(c, g);
  }
}

/* ======================================================================
   THE TAX COLLECTOR — a piggy bank with armour and opinions
   Break the plates with the sword, then Cursor hits the reset switch on its
   back. Only then does it take damage.
   ====================================================================== */
export class TaxCollector extends Enemy {
  constructor({ x, x0, x1 }) {
    super({ x, y: GROUND - 110, w: 150, h: 110, hp: 12, big: true, kb: 0, touch: 1, drop: false, blood: '#f4a6b8' });
    Object.assign(this, { x0, x1, name: 'THE TAX COLLECTOR', barColor: '#f4a6b8', plates: 3, plateHp: 2, dazed: 0, fire: 1.2, walk: 1 });
  }
  init(g) {
    const boss = this;
    this.switch = g.add(new Thing({ w: 30, h: 30, z: 7, hidden: true, clickable: false,
      onPress(g) {
        if (boss.plates > 0 || boss.dazed > 0) return;
        boss.dazed = 4.2;
        sfx.confirm();
        g.floatText(cx(this), this.y - 10, 'RESET!', '#8dffc8', 18);
        bark(g, boss, pick(['MY LEDGER!', 'AUDIT ME GENTLY.', 'THAT IS TAX EVASION.']), 2);
      },
      look(c, g) {
        c.fillStyle = Math.sin(g.time * 8) > 0 ? '#8dffc8' : '#2bb27a';
        rr(c, this.x, this.y, 30, 30, 6);
        c.fill();
        text(c, '⟳', this.x + 15, this.y + 15, { size: 18, color: '#0b3a28' });
        text(c, 'click me', this.x + 15, this.y - 10, { size: 10, color: '#fff' });
      },
    }));
  }
  hurt(g, dmg, dir) {
    if (this.dead) return false;
    if (this.dazed > 0) {
      this.hp -= dmg;
      this.flash = 0.12;
      sfx.hit();
      g.floatText(cx(this), this.y, pick(['-TAX', 'REFUND!', 'deductible']), '#fff', 14);
      if (this.hp <= 0) this.kill(g);
      return true;
    }
    if (this.plates > 0) {
      this.plateHp -= dmg;
      sfx.clang();
      this.flash = 0.06;
      if (this.plateHp <= 0) {
        this.plates--;
        this.plateHp = 2;
        sfx.crack();
        g.burst(cx(this), this.y + 30, '#b8bcc8', 12, 220, 5);
        if (!this.plates) bark(g, g.player.buddy ?? g.player, 'The armour’s off! Click the switch on its back!', 2.6);
      }
      return true;
    }
    sfx.clang();
    return false;
  }
  kill(g) {
    this.dead = true;
    this.switch.dead = true;
    sfx.boom();
    g.shake(16);
    for (let i = 0; i < 40; i++) g.add(new Pickup({ kind: 'coin', x: cx(this) + rand(-60, 60), y: this.y + 30, pop: true }));
  }
  think(g, dt) {
    const p = g.player;
    this.dazed = Math.max(0, this.dazed - dt);
    if (this.dazed > 0) {
      this.vx = 0;
      if (this.dazed < 0.05) {
        this.plates = 3;
        sfx.door();
        bark(g, this, 'ARMOUR RENEWED. FEES APPLY.', 2);
      }
    } else {
      this.walk -= dt;
      this.facing = Math.sign(cx(p) - cx(this)) || 1;
      this.vx = this.walk > 0 ? this.facing * 70 : 0;
      if (this.walk < -1.5) this.walk = 2;
      this.fire -= dt;
      if (this.fire <= 0) {
        this.fire = this.hp < 6 ? 0.55 : 0.85;
        // an invoice falls out of the sky
        const x = clamp(cx(p) + rand(-160, 160), this.x0 + 20, this.x1 - 40);
        g.add(new Shot({ x, y: 40, w: 26, h: 32, vx: rand(-20, 20), vy: 120, grav: 500, color: '#fff', label: 'BILL', bar: '#c62f3a', life: 3 }));
      }
    }
    this.gravity(g, dt);
    this.x = clamp(this.x, this.x0, this.x1 - this.w);
    this.switch.hidden = this.plates > 0 || this.dazed > 0;
    this.switch.clickable = !this.switch.hidden;
    this.switch.x = cx(this) - this.facing * 40 - 15;
    this.switch.y = this.y - 34;
    this.touch = this.dazed > 0 ? 0 : 1;
  }
  draw(c, g) {
    const { x, y, w, h } = this;
    const f = this.facing;
    c.fillStyle = '#d97a92';
    for (const lx of [x + 25, x + 55, x + w - 55, x + w - 25]) c.fillRect(lx - 8, y + h - 22, 16, 22);
    c.fillStyle = this.flash ? '#fff' : '#f4a6b8';
    c.beginPath();
    c.ellipse(cx(this), y + h / 2, w / 2, h / 2 - 8, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#e98aa3';
    c.beginPath();
    c.ellipse(cx(this) + f * (w / 2 - 6), y + h / 2 + 2, 16, 13, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#9c4a5e';
    c.fillRect(cx(this) + f * (w / 2 - 6) - 6, y + h / 2 - 2, 4, 7);
    c.fillRect(cx(this) + f * (w / 2 - 6) + 2, y + h / 2 - 2, 4, 7);
    c.fillStyle = '#111';
    c.fillRect(cx(this) + f * 30, y + 30, 6, 6);
    c.fillStyle = '#5a2a36';
    c.fillRect(cx(this) - 18, y + 8, 36, 5);
    // monocle
    c.strokeStyle = '#f2c14e';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx(this) + f * 33, y + 33, 7, 0, Math.PI * 2);
    c.stroke();
    // armour plates
    for (let i = 0; i < this.plates; i++) {
      c.fillStyle = '#b8bcc8';
      rr(c, x + 20 + i * 38, y + 44, 32, 40, 6);
      c.fill();
      c.fillStyle = '#8a8f9c';
      text(c, '%', x + 36 + i * 38, y + 64, { size: 16, color: '#6d7280' });
    }
    if (this.dazed > 0) text(c, '★ AUDITED ★', cx(this), y - 6, { size: 13, color: '#ffe066' });
    this.drawStun(c, g);
  }
}

/* ======================================================================
   KAREN POPUP — wants the manager
   ====================================================================== */
export class KarenPopup extends Enemy {
  constructor({ x0, x1 }) {
    super({ x: (x0 + x1) / 2 - 110, y: 70, w: 220, h: 140, hp: 14, big: true, fly: true, kb: 0, touch: 0, drop: false, blood: '#ff7a59' });
    Object.assign(this, { x0, x1, name: 'KAREN POPUP', barColor: '#ff7a59', state: 'hover', timer: 2, home: 70 });
  }
  hurt(g, dmg) {
    if (this.dead) return false;
    if (this.state !== 'swoop' && this.state !== 'tired') {
      sfx.clang();
      return false;
    }
    this.hp -= dmg;
    this.flash = 0.12;
    sfx.hit();
    g.floatText(cx(this), this.y + this.h, pick(['1 STAR', 'RUDE', 'unsubscribed']), '#fff', 14);
    if (this.hp <= 0) this.kill(g);
    return true;
  }
  kill(g) {
    this.dead = true;
    sfx.boom();
    g.shake(14);
    g.burst(cx(this), cy(this), '#ff7a59', 30, 320, 6);
  }
  think(g, dt) {
    const p = g.player;
    this.timer -= dt;
    let ty = this.home;
    if (this.state === 'swoop' || this.state === 'tired') ty = GROUND - this.h - 30;
    this.y += (ty - this.y) * Math.min(1, dt * 3);
    const tx = clamp(cx(p) - this.w / 2, this.x0 + 10, this.x1 - this.w - 10);
    if (this.state !== 'tired') this.x += (tx - this.x) * dt * 0.9;
    if (this.state === 'hover') {
      this.fire = (this.fire ?? 0.5) - dt;
      if (this.fire <= 0) {
        this.fire = this.hp < 7 ? 0.7 : 1;
        const roll = Math.random();
        if (roll < 0.5) {
          const a = Math.atan2(cy(p) - cy(this), cx(p) - cx(this));
          g.add(new Shot({ x: cx(this) - 20, y: this.y + this.h - 10, w: 40, h: 26, vx: Math.cos(a) * 240, vy: Math.sin(a) * 240, label: 'COMPLAINT', bar: '#ff7a59', life: 3.5 }));
          sfx.pop();
        } else if (roll < 0.8) {
          for (let i = -1; i <= 1; i++) g.add(new Shot({ x: cx(p) + i * 90, y: 30, w: 22, h: 22, vx: 0, vy: 180, grav: 300, color: '#ffd84d', life: 3, star: true, cuttable: true }));
          bark(g, this, 'ONE STAR. ONE STAR. ONE STAR.', 1.6);
        } else if (g.ents.filter((e) => e instanceof PopupGoblin && !e.dead).length < 3) {
          g.add(new PopupGoblin({ x: cx(this) - 15, y: this.y + this.h }));
          bark(g, this, 'I’M CALLING MY FRIENDS.', 1.6);
        }
      }
      if (this.timer <= 0) {
        this.state = 'swoop';
        this.timer = 1.2;
        bark(g, this, 'I WANT TO SPEAK TO THE MANAGER!', 1.8);
      }
    } else if (this.state === 'swoop') {
      if (this.timer <= 0) {
        this.state = 'tired';
        this.timer = this.hp < 7 ? 2 : 2.6;
      }
      if (overlap(this, p)) p.hurt(g, 1, Math.sign(cx(p) - cx(this)) || 1);
    } else if (this.state === 'tired' && this.timer <= 0) {
      this.state = 'hover';
      this.timer = 3.5;
    }
  }
  draw(c, g) {
    const { x, y, w, h } = this;
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.3)';
    c.shadowBlur = 18;
    popupWindow(c, x, y, w, h, '', this.flash ? '#fff' : '#ff7a59');
    c.restore();
    // the haircut
    c.fillStyle = '#e6c06a';
    c.beginPath();
    c.ellipse(x + 40, y + 6, 46, 22, -0.3, Math.PI, 0);
    c.fill();
    c.fillStyle = '#111';
    const angry = this.state !== 'tired';
    c.fillRect(x + w / 2 - 40, y + 50, 16, 6);
    c.fillRect(x + w / 2 + 24, y + 50, 16, 6);
    c.strokeStyle = '#111';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x + w / 2 - 44, y + (angry ? 38 : 44));
    c.lineTo(x + w / 2 - 20, y + 46);
    c.moveTo(x + w / 2 + 44, y + (angry ? 38 : 44));
    c.lineTo(x + w / 2 + 20, y + 46);
    c.stroke();
    c.beginPath();
    c.ellipse(x + w / 2, y + 90, 22, angry ? 10 : 4, 0, 0, Math.PI * 2);
    c.fillStyle = '#5a1f1a';
    c.fill();
    text(c, this.state === 'tired' ? '…ugh' : 'MANAGER!!', x + w / 2, y + h - 18, { size: 13, color: '#c62f3a' });
  }
}

/* ======================================================================
   LORD 404 — not found, emotionally or physically
   Three of him blink between platforms. Click one with Cursor to reveal
   which is real; only the real one can be hit.
   ====================================================================== */
export class Lord404 {
  constructor({ spots }) {
    Object.assign(this, { spots, hp: 10, maxHp: 10, name: 'LORD 404', barColor: '#b57cff', team: 'enemy', big: true, t: 0, x: 0, y: 0, w: 0, h: 0, reveal: 0, timer: 0.5, fire: 1.5, sob: false });
  }
  init(g) {
    const lord = this;
    this.bodies = [0, 1, 2].map((i) =>
      g.add(new Thing({ w: 40, h: 60, z: 5, team: 'enemy', clickable: true, pad: 20, idx: i,
        onPress(g) {
          lord.reveal = 3.2;
          sfx.select();
          g.floatText(cx(this), this.y - 12, this.idx === lord.real ? 'FOUND!' : 'not found', this.idx === lord.real ? '#8dffc8' : '#b57cff', 14);
        },
        hurt(g, dmg) {
          if (lord.dead) return false;
          if (this.idx !== lord.real || lord.reveal <= 0) {
            g.floatText(cx(this), this.y - 10, '404: NOT FOUND', '#b57cff', 13);
            sfx.clang();
            return false;
          }
          lord.hp -= dmg;
          this.flash = 0.12;
          sfx.hit();
          if (lord.hp <= 0) lord.hp = 0;
          return true;
        },
        look(c, g) {
          lord.drawBody(c, g, this);
        },
      }))
    );
    this.place();
  }
  place() {
    const picks = [...this.spots].sort(() => Math.random() - 0.5).slice(0, 3);
    this.real = Math.floor(Math.random() * 3);
    this.bodies.forEach((b, i) => {
      b.x = picks[i].x - 20;
      b.y = picks[i].y - 60;
    });
  }
  update(g, dt) {
    if (this.dead) return;
    this.t += dt;
    this.reveal = Math.max(0, this.reveal - dt);
    if (this.held) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = this.reveal > 0 ? 3.6 : 3;
      if (this.reveal <= 0) {
        this.place();
        sfx.glitch();
      }
    }
    this.fire -= dt;
    if (this.fire <= 0) {
      this.fire = 1.3;
      const r = this.bodies[this.real];
      const p = g.player;
      const a = Math.atan2(cy(p) - cy(r), cx(p) - cx(r));
      g.add(new Shot({ x: cx(r) - 16, y: cy(r) - 10, w: 34, h: 20, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, label: '404', bar: '#b57cff', life: 3, solidHit: false }));
    }
  }
  drawBody(c, g, b) {
    const real = b.idx === this.real;
    const shown = this.reveal > 0;
    c.save();
    c.globalAlpha = shown ? (real ? 1 : 0.18) : 0.55 + 0.15 * Math.sin(g.time * 6 + b.idx);
    const x = b.x;
    const y = b.y + Math.sin(g.time * 2 + b.idx) * 4;
    c.fillStyle = b.flash ? '#fff' : '#7a3fc4';
    c.beginPath();
    c.moveTo(x + 20, y);
    c.lineTo(x + 40, y + 60);
    c.lineTo(x, y + 60);
    c.fill();
    c.fillStyle = '#2a1040';
    c.fillRect(x + 8, y + 20, 24, 18);
    text(c, '404', x + 20, y + 29, { size: 11, color: '#e6c8ff' });
    if (this.sob) {
      c.fillStyle = '#7fc8ff';
      c.fillRect(x + 10, y + 40 + ((g.time * 40) % 12), 3, 5);
      c.fillRect(x + 27, y + 40 + ((g.time * 40 + 6) % 12), 3, 5);
    }
    c.restore();
    if (b.flash) b.flash = Math.max(0, b.flash - 1 / 60);
  }
  draw() {}
  kill() {
    this.dead = true;
    this.bodies.forEach((b) => (b.dead = true));
  }
}

/* ======================================================================
   CAPTCHA GOLEM — prove you are not a robot
   Every so often it asks you to select all the starred squares. Click them
   (or slash them). Get them all and it short-circuits; hit its head.
   ====================================================================== */
export class CaptchaGolem extends Enemy {
  constructor({ x, x0, x1 }) {
    super({ x, y: GROUND - 170, w: 130, h: 170, hp: 9, big: true, kb: 0, touch: 1, drop: false, blood: '#9ec3ff' });
    Object.assign(this, { x0, x1, name: 'THE CAPTCHA GOLEM', barColor: '#9ec3ff', state: 'walk', timer: 2.5, dazed: 0, tiles: [] });
  }
  hurt(g, dmg) {
    if (this.dazed <= 0) {
      sfx.clang();
      if (Math.random() < 0.4) g.floatText(cx(this), this.y, 'VERIFYING…', '#9ec3ff', 13);
      return false;
    }
    this.hp -= dmg;
    this.flash = 0.12;
    sfx.hit();
    if (this.hp <= 0) this.kill(g);
    return true;
  }
  kill(g) {
    this.dead = true;
    this.tiles.forEach((t) => (t.dead = true));
    sfx.boom();
    g.shake(16);
    for (let i = 0; i < 9; i++) g.burst(this.x + rand(0, this.w), this.y + rand(0, this.h), pick(['#9ec3ff', '#f4f6fb', '#4a74d9']), 10, 280, 6);
  }
  quiz(g) {
    this.state = 'quiz';
    this.timer = 7;
    bark(g, this, 'SELECT ALL SQUARES WITH ★', 3);
    sfx.error();
    const stars = new Set();
    while (stars.size < 3) stars.add(Math.floor(Math.random() * 9));
    const gx = (this.x0 + this.x1) / 2 - 105;
    this.tiles = [];
    for (let i = 0; i < 9; i++) {
      const star = stars.has(i);
      const t = g.add(new Thing({ x: gx + (i % 3) * 74, y: 190 + Math.floor(i / 3) * 74, w: 62, h: 62, z: 6, clickable: true, team: 'enemy', star, picked: false,
        onPress: (g) => this.pickTile(g, t),
        hurt: (g) => (this.pickTile(g, t), true),
        look(c, g) {
          c.fillStyle = this.picked ? '#4a74d9' : '#f4f6fb';
          rr(c, this.x, this.y, this.w, this.h, 6);
          c.fill();
          c.strokeStyle = '#4a74d9';
          c.lineWidth = 2;
          rr(c, this.x, this.y, this.w, this.h, 6);
          c.stroke();
          text(c, this.star ? '★' : ['▲', '■', '●'][this.idx ?? 0], this.x + 31, this.y + 32, { size: 26, color: this.picked ? '#fff' : this.star ? '#e6a817' : '#9aa6c0' });
        },
      }));
      t.idx = i % 3;
      this.tiles.push(t);
    }
  }
  pickTile(g, t) {
    if (this.state !== 'quiz' || t.picked) return;
    if (!t.star) {
      sfx.error();
      g.floatText(cx(t), t.y, 'WRONG ANSWER', '#ff5a5a', 16);
      this.endQuiz(g);
      this.state = 'slam';
      this.timer = 0.6;
      return;
    }
    t.picked = true;
    sfx.select();
    if (this.tiles.filter((x) => x.star).every((x) => x.picked)) {
      this.endQuiz(g);
      this.dazed = 4.5;
      this.state = 'walk';
      this.timer = 5;
      sfx.win();
      bark(g, this, 'VERIFIED… HUMAN?? ERROR. ERROR.', 2.4);
    }
  }
  endQuiz() {
    this.tiles.forEach((t) => (t.dead = true));
    this.tiles = [];
  }
  think(g, dt) {
    const p = g.player;
    this.timer -= dt;
    this.dazed = Math.max(0, this.dazed - dt);
    this.touch = this.dazed > 0 ? 0 : 1;
    if (this.dazed > 0) {
      this.vx = 0;
    } else if (this.state === 'walk') {
      this.facing = Math.sign(cx(p) - cx(this)) || 1;
      this.vx = this.facing * 60;
      if (this.timer <= 0) {
        this.state = Math.random() < 0.5 ? 'slam' : 'throw';
        this.timer = 0.8;
        this.quizzes = (this.quizzes ?? 0) + 1;
        if (this.quizzes % 2 === 0) this.quiz(g);
      }
    } else if (this.state === 'slam') {
      this.vx = 0;
      if (this.timer <= 0) {
        sfx.stun();
        g.shake(10);
        for (const d of [-1, 1]) g.add(new Shot({ x: cx(this) - 12, y: GROUND - 40, w: 24, h: 40, vx: d * 330, vy: 0, life: 1.8, color: '#9ec3ff', cuttable: false, solidHit: false }));
        this.state = 'walk';
        this.timer = 2.6;
      }
    } else if (this.state === 'throw') {
      this.vx = 0;
      if (this.timer <= 0) {
        for (let i = 0; i < 3; i++) {
          const t = 0.9 + i * 0.15;
          g.add(new Shot({ x: cx(this) - 14, y: this.y, w: 28, h: 28, vx: (cx(p) + rand(-80, 80) - cx(this)) / t, vy: -520, grav: 1000, color: '#f4f6fb', life: 3, label: '?', bar: '#4a74d9' }));
        }
        this.state = 'walk';
        this.timer = 2.6;
      }
    } else if (this.state === 'quiz') {
      this.vx = 0;
      if (this.timer <= 0) {
        g.floatText(cx(this), this.y, 'TIMEOUT. TRY AGAIN.', '#ff5a5a', 16);
        this.endQuiz(g);
        this.state = 'slam';
        this.timer = 0.4;
      }
    }
    this.gravity(g, dt);
    this.x = clamp(this.x, this.x0, this.x1 - this.w);
  }
  draw(c, g) {
    const { x, y, w, h } = this;
    for (let r = 0; r < 5; r++) {
      for (let k = 0; k < 4; k++) {
        if ((r === 0 && (k === 0 || k === 3)) || (r === 4 && (k === 1 || k === 2))) continue;
        c.fillStyle = this.flash ? '#fff' : (r + k) % 2 ? '#e8edf8' : '#cfd9ef';
        rr(c, x + k * (w / 4) + 2, y + r * (h / 5) + 2, w / 4 - 4, h / 5 - 4, 4);
        c.fill();
      }
    }
    c.fillStyle = this.dazed > 0 ? '#ffe066' : '#4a74d9';
    c.fillRect(cx(this) - 22, y + 14, 12, 8);
    c.fillRect(cx(this) + 10, y + 14, 12, 8);
    text(c, this.dazed > 0 ? '✓ ✓ ✓' : 'I am not a robot', cx(this), y - 10, { size: 12, color: this.dazed > 0 ? '#ffe066' : '#9ec3ff' });
    this.drawStun(c, g);
  }
}

/* ======================================================================
   ERROR 500 — THE WEDDING CRASHER
   Made of broken wedding decorations. Cursor scans it (click it, or R) to
   show the weak spots; only those take damage.
   ====================================================================== */
export class Error500 extends Enemy {
  constructor({ x, x0, x1 }) {
    super({ x, y: GROUND - 190, w: 200, h: 190, hp: 20, big: true, kb: 0, touch: 1, drop: false, blood: '#ff5a5a', clickable: true });
    Object.assign(this, { x0, x1, name: 'THE WEDDING CRASHER — ERROR 500', barColor: '#ff5a5a', scan: 0, fire: 1.5, timer: 2 });
    this.weak = [[0.25, 0.3], [0.75, 0.45], [0.45, 0.75]];
  }
  onPress(g) {
    this.scan = 4.5;
    sfx.confirm();
    g.floatText(cx(this), this.y - 10, 'WEAK SPOTS FOUND', '#8dffc8', 16);
  }
  hitbox() {
    return this;
  }
  hurt(g, dmg, dir, src) {
    if (this.dead) return false;
    if (this.scan <= 0 && !(this.stunned > 0)) {
      sfx.clang();
      if (Math.random() < 0.3) g.floatText(cx(this), this.y, 'SERVICE UNAVAILABLE', '#ff9c9c', 13);
      return false;
    }
    this.hp -= dmg;
    this.flash = 0.1;
    sfx.hit();
    if (this.hp <= 0) this.kill(g);
    return true;
  }
  kill(g) {
    this.dead = true;
    sfx.boom();
    g.shake(18);
    for (let i = 0; i < 10; i++) g.burst(this.x + rand(0, this.w), this.y + rand(0, this.h), pick(['#ffffff', '#ff8fb1', '#f2c14e', '#ff5a5a']), 12, 300, 6);
  }
  think(g, dt) {
    const p = g.player;
    this.scan = Math.max(0, this.scan - dt);
    this.fire -= dt;
    this.timer -= dt;
    this.facing = Math.sign(cx(p) - cx(this)) || 1;
    this.vx = Math.sin(this.t * 0.7) * 60;
    if (this.fire <= 0) {
      this.fire = this.hp < 10 ? 0.9 : 1.3;
      const r = Math.random();
      if (r < 0.4) {
        const t = 1;
        g.add(new Shot({ x: cx(this) - 16, y: this.y + 20, w: 32, h: 26, vx: (cx(p) - cx(this)) / t, vy: -560, grav: 1100, color: '#ffe8f0', label: 'CAKE', bar: '#ff8fb1', life: 3 }));
      } else if (r < 0.75) {
        g.add(new Shot({ x: cx(this), y: GROUND - 30, w: 30, h: 30, vx: this.facing * 300, vy: 0, color: '#a8744a', life: 3, label: 'CHAIR', bar: '#6b4528', solidHit: false }));
      } else {
        const a = Math.atan2(cy(p) - cy(this), cx(p) - cx(this));
        g.add(new Shot({ x: cx(this) - 10, y: this.y + 40, w: 20, h: 20, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, color: '#ff8fb1', life: 3.5 }));
      }
      sfx.shoot();
    }
    this.gravity(g, dt);
    this.x = clamp(this.x, this.x0, this.x1 - this.w);
  }
  draw(c, g) {
    const { x, y, w, h } = this;
    c.fillStyle = this.flash ? '#fff' : '#f4f0ea';
    // a tiered cake body
    rr(c, x + 10, y + h * 0.55, w - 20, h * 0.45, 10);
    c.fill();
    rr(c, x + 35, y + h * 0.25, w - 70, h * 0.32, 10);
    c.fill();
    rr(c, x + 65, y, w - 130, h * 0.27, 10);
    c.fill();
    c.fillStyle = '#ff8fb1';
    for (const yy of [y + h * 0.55, y + h * 0.25, y]) c.fillRect(x + 10, yy, w - 20, 5);
    c.fillStyle = '#c62f3a';
    c.fillRect(x + 60, y + h * 0.36, 26, 10);
    c.fillRect(x + w - 86, y + h * 0.36, 26, 10);
    text(c, '500', cx(this), y + h * 0.78, { size: 30, color: '#c62f3a' });
    c.strokeStyle = '#6b4528';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(x + 5, y + h * 0.6);
    c.lineTo(x - 30, y + h * 0.4 + Math.sin(this.t * 4) * 10);
    c.moveTo(x + w - 5, y + h * 0.6);
    c.lineTo(x + w + 30, y + h * 0.4 - Math.sin(this.t * 4) * 10);
    c.stroke();
    if (this.scan > 0) {
      for (const [kx, ky] of this.weak) {
        c.strokeStyle = `rgba(141,255,200,${0.6 + 0.4 * Math.sin(g.time * 10)})`;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(x + kx * w, y + ky * h, 14, 0, Math.PI * 2);
        c.stroke();
      }
    } else text(c, 'click to scan', cx(this), y - 12, { size: 11, color: 'rgba(255,255,255,0.7)' });
    this.drawStun(c, g);
  }
}
