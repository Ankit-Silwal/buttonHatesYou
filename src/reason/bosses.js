import { GRAVITY, moveBody, overlap, clamp, rand, cx, cy } from './engine';
import { sfx } from './audio';
import { rr, text, popupWindow, sword, drawButton, adminFace, heart } from './draw';
import { Shot, Slime, Thing, Bat, Enemy, bark } from './actors';
import { glow, shadow, boxShadow, fadeStrip, fadeStripX } from './fx';

/* ======================================================================
   THE UNSKIPPABLE AD (Episode 3)
   Shoots popups, covers the screen, dangles a fake close button. The real
   close icon is tiny, grey, and only there while it buffers.
   ====================================================================== */
export class UnskippableAd {
  constructor({ x0, x1 }) {
    this.x0 = x0;
    this.x1 = x1;
    this.w = 300;
    this.h = 190;
    this.x = (x0 + x1) / 2 - this.w / 2 + 120;
    this.y = 80;
    this.home = this.y;
    this.hp = this.maxHp = 12;
    this.name = 'THE UNSKIPPABLE AD';
    this.barColor = '#ffd84d';
    this.team = 'enemy';
    this.big = true;
    this.z = 1;
    this.t = 0;
    this.state = 'intro';
    this.timer = 1.5;
    this.order = ['popups', 'fake', 'buffer', 'banner', 'buffer'];
    this.step = 0;
    this.skipN = 5;
  }

  init(g) {
    const boss = this;
    this.fake = g.add(new Thing({ w: 40, h: 40, team: 'enemy', z: 2, hidden: true, ghost: true,
      hurt(g) {
        if (this.hidden) return false;
        boss.fakeHit(g);
        return true;
      },
      look(c) {
        glow(c, this.x + this.w / 2, this.y + this.h / 2, 46, '#ff2a3a', 0.6);
        c.fillStyle = '#ff2a3a';
        rr(c, this.x, this.y, this.w, this.h, 8);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.3)';
        rr(c, this.x + 3, this.y + 2, this.w - 6, this.h / 2 - 2, 6);
        c.fill();
        text(c, '✕', this.x + this.w / 2, this.y + this.h / 2 + 1, { size: 26, color: '#fff' });
        text(c, 'CLOSE!!', this.x + this.w / 2, this.y - 10, { size: 11, color: '#ff2a3a' });
      },
    }));
    this.real = g.add(new Thing({ w: 26, h: 26, team: 'enemy', z: 2, hidden: true, ghost: true,
      hurt(g, dmg) {
        if (this.hidden) return false;
        boss.realHit(g, dmg);
        return true;
      },
      look(c, g) {
        glow(c, this.x + 13, this.y + 13, 30, '#ffffff', 0.3 + 0.2 * Math.sin(g.time * 8));
        c.strokeStyle = `rgba(255,255,255,${0.35 + 0.35 * Math.sin(g.time * 8)})`;
        c.lineWidth = 2;
        c.beginPath();
        c.arc(this.x + 13, this.y + 13, 15 + Math.sin(g.time * 8) * 2, 0, Math.PI * 2);
        c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.6)';
        rr(c, this.x + 5, this.y + 5, 16, 16, 3);
        c.fill();
        text(c, '×', this.x + 13, this.y + 13, { size: 15, color: '#777' });
        if (Math.sin(g.time * 6) > 0) text(c, 'close', this.x + 13, this.y + 34, { size: 9, color: '#eee' });
      },
    }));
  }

  fakeHit(g) {
    sfx.error();
    this.hp = Math.min(this.maxHp, this.hp + 1);
    g.floatText(cx(this.fake), this.fake.y - 20, 'NICE TRY', '#ff5a5a', 20);
    this.fake.hidden = this.fake.ghost = true;
    for (let i = 0; i < 4; i++) this.popup(g, (i - 1.5) * 120);
    bark(g, g.player, pickOne(['That was the FAKE one?!', 'It says close! It said CLOSE!', 'Of course it was fake.']), 2);
  }

  realHit(g, dmg) {
    this.hp -= dmg + 1;
    this.flash = 0.15;
    sfx.hit();
    g.shake(6);
    g.floatText(cx(this.real), this.real.y - 16, 'CLOSED', '#ffe066', 16);
    if (this.hp <= 0) this.die(g);
  }

  popup(g, spread = 0) {
    const p = g.player;
    const sx = cx(this) + rand(-80, 80);
    const sy = this.y + this.h * 0.6;
    const dx = cx(p) + spread - sx;
    const t = 1.1;
    g.add(new Shot({ x: sx, y: sy, w: 44, h: 30, label: pickOne(['AD', 'BUY', '$$$', 'WIN']), vx: dx / t, vy: -280, grav: 520, life: 4, solidHit: true }));
    sfx.pop();
  }

  update(g, dt) {
    if (this.dead) return;
    this.t += dt;
    this.flash = Math.max(0, (this.flash ?? 0) - dt);
    this.timer -= dt;
    const angry = this.hp < this.maxHp / 2;
    const s = this.state;
    let ty = this.home;
    if (s === 'fake' || s === 'buffer') ty = 250;
    this.y += (ty + Math.sin(this.t * 1.5) * 8 - this.y) * Math.min(1, dt * 2.5);
    const tx = s === 'buffer' || s === 'fake' ? clamp(cx(g.player) - this.w / 2, this.x0 + 40, this.x1 - this.w - 40) : this.x;
    this.x += (tx - this.x) * Math.min(1, dt * 0.8);

    if (s === 'popups') {
      this.fireT = (this.fireT ?? 0) - dt;
      if (this.fireT <= 0) {
        this.fireT = angry ? 0.45 : 0.7;
        this.popup(g, rand(-60, 60));
      }
    } else if (s === 'banner') {
      this.fireT = (this.fireT ?? 0) - dt;
      if (this.fireT <= 0) {
        this.fireT = 1.4;
        g.fx.ads = g.fx.ads ?? [];
        g.fx.ads.push({ x: rand(60, 520), y: rand(70, 300), w: 360, h: 170, label: pickOne(['THIS AD WILL END SOON', 'WATCH 5 MORE ADS TO SKIP', 'HAVE YOU TRIED: BUTTONS?', 'YOUR AD IS LOADING YOUR AD']), until: g.time + 2 });
        sfx.error();
        if (angry && Math.random() < 0.5) this.popup(g);
      }
    }
    this.skipT = (this.skipT ?? 1) - dt;
    if (this.skipT <= 0) {
      this.skipT = 1;
      this.skipN = this.skipN <= 1 ? 5 : this.skipN - 1;
    }

    if (this.timer <= 0) {
      this.state = this.order[this.step % this.order.length];
      this.step++;
      this.timer = { popups: 4.5, fake: 3.5, buffer: angry ? 3.2 : 4, banner: 4 }[this.state];
      this.fireT = 0.3;
      if (this.state === 'buffer') bark(g, g.player.tabby ?? g.player, pickOne(['It’s buffering! Find the REAL close button!', 'Tiny grey X! Bottom corner!']), 2.2);
    }
    this.fake.hidden = this.fake.ghost = this.state !== 'fake';
    this.real.hidden = this.real.ghost = this.state !== 'buffer';
    this.fake.x = this.x + this.w - 30;
    this.fake.y = this.y - 14;
    this.real.x = this.x + 4;
    this.real.y = this.y + this.h - 30;
  }

  die(g) {
    this.dead = true;
    this.fake.dead = this.real.dead = true;
    sfx.boom();
    g.shake(16);
    g.fx.flash = 0.8;
    g.fx.ads = [];
    for (let i = 0; i < 6; i++) g.burst(this.x + rand(0, this.w), this.y + rand(0, this.h), pickOne(['#ffd84d', '#5a74ff', '#ff3bb0']), 12, 300, 6);
    for (const e of g.ents) if (e instanceof Shot) e.dead = true;
  }

  draw(c, g) {
    if (this.dead) return;
    const { x, y, w, h } = this;
    const buffering = this.state === 'buffer';
    // a sickly yellow glow and a soft drop shadow (both cached sprites)
    glow(c, x + w / 2, y + h / 2, w * 0.95, '#ffb800', 0.28 + 0.08 * Math.sin(this.t * 3));
    boxShadow(c, x, y, w, h, 0.45, 26, 14);
    c.fillStyle = this.flash ? '#fff' : '#ffffff';
    rr(c, x, y, w, h, 12);
    c.fill();
    c.fillStyle = '#ffb800';
    rr(c, x, y, w, 26, 12);
    c.fill();
    c.fillRect(x, y + 14, w, 12);
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.fillRect(x + 10, y + 2, w - 20, 2);
    text(c, 'SPONSORED · Ad 1 of 37', x + 12, y + 13, { size: 12, color: '#4a3000', align: 'left' });
    const hue = (this.t * 120) % 360;
    c.fillStyle = buffering ? '#555' : `hsl(${hue}, 85%, 60%)`;
    c.fillRect(x + 10, y + 34, w - 20, h - 70);
    if (buffering) {
      c.strokeStyle = '#fff';
      c.lineWidth = 6;
      c.beginPath();
      c.arc(cx(this), y + 34 + (h - 70) / 2, 22, this.t * 8, this.t * 8 + 4.4);
      c.stroke();
      text(c, 'Buffering…', cx(this), y + h - 52, { size: 13, color: '#fff' });
    } else {
      text(c, pickBy(this.t, ['BUY BUTTONS', 'CLICK HERE', 'LIMITED TIME', 'YOU NEED THIS']), cx(this), y + 34 + (h - 70) / 2, { size: 26, color: '#fff' });
    }
    // glossy screen: a sheen sweeps across every few seconds
    c.save();
    c.beginPath();
    c.rect(x + 10, y + 34, w - 20, h - 70);
    c.clip();
    c.drawImage(fadeStrip('#ffffff', 0.22, 0, 0.5), x + 10, y + 34, w - 20, (h - 70) * 0.5);
    const sweep = ((this.t * 0.45) % 1.6) * (w + 120) - 60;
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath();
    c.moveTo(x + sweep, y + 34);
    c.lineTo(x + sweep + 40, y + 34);
    c.lineTo(x + sweep - 20, y + h - 36);
    c.lineTo(x + sweep - 60, y + h - 36);
    c.fill();
    c.restore();
    // the "skip" box that never gets there
    c.fillStyle = 'rgba(0,0,0,0.7)';
    rr(c, x + w - 120, y + h - 32, 110, 24, 4);
    c.fill();
    text(c, `Skip ad in ${this.skipN}`, x + w - 65, y + h - 20, { size: 12, color: '#fff' });
    // little arms of hate
    c.strokeStyle = '#ffb800';
    c.lineWidth = 5;
    c.lineCap = 'round';
    const k = Math.sin(this.t * 5) * 10;
    c.beginPath();
    c.moveTo(x, y + h / 2);
    c.lineTo(x - 30, y + h / 2 + 20 + k);
    c.moveTo(x + w, y + h / 2);
    c.lineTo(x + w + 30, y + h / 2 + 20 - k);
    c.stroke();
  }
}

const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
const pickBy = (t, a) => a[Math.floor(t / 1.2) % a.length];

/* ======================================================================
   THE GARBAGE COLLECTOR (Episode 6)
   Armoured. Charges wall to wall, vacuums you in, throws trash. Only takes
   damage while dazed from hitting a wall, or stunned by Tabby.
   ====================================================================== */
export class GarbageCollector extends Enemy {
  constructor({ x, x0, x1 }) {
    super({ x, y: 460 - 116, w: 170, h: 116, hp: 16, big: true, kb: 0, blood: '#9aa0ad', drop: false, stunTime: 2.6, touch: 1 });
    this.x0 = x0;
    this.x1 = x1;
    this.name = 'THE GARBAGE COLLECTOR';
    this.barColor = '#9fdc6b';
    this.state = 'idle';
    this.timer = 1.2;
    this.facing = -1;
    this.cycle = 0;
  }

  hurt(g, dmg, dir, src) {
    this.invuln = !(this.state === 'dazed' || this.stunned > 0);
    const ok = super.hurt(g, dmg, dir, src);
    this.vx = 0;
    this.vy = 0;
    return ok;
  }

  kill(g) {
    this.dead = true;
    sfx.boom();
    g.shake(16);
    for (let i = 0; i < 5; i++) g.burst(this.x + rand(0, this.w), this.y + rand(0, this.h), pickOne(['#9aa0ad', '#9fdc6b', '#5d6b80']), 12, 300, 6);
  }

  think(g, dt) {
    const p = g.player;
    this.timer -= dt;
    this.touch = this.state === 'dazed' ? 0 : 1;
    const angry = this.hp < this.maxHp / 2;
    if (this.state === 'idle') {
      this.vx = 0;
      this.facing = Math.sign(cx(p) - cx(this)) || -1;
      if (this.timer <= 0) {
        const pick = ['charge', 'suck', 'toss', 'charge'][this.cycle++ % 4];
        this.state = pick === 'charge' ? 'rev' : pick;
        this.timer = { rev: 0.8, suck: 2.6, toss: 1.6 }[this.state];
        this.tossed = 0;
      }
    } else if (this.state === 'rev') {
      this.vx = 0;
      this.shakeX = 3;
      if (this.timer <= 0) {
        this.state = 'charge';
        this.shakeX = 0;
        sfx.crash();
      }
    } else if (this.state === 'charge') {
      this.vx = this.facing * (angry ? 520 : 430);
      if ((this.facing < 0 && this.x <= this.x0 + 4) || (this.facing > 0 && this.x + this.w >= this.x1 - 4)) {
        this.x = Math.max(this.x0 + 4, Math.min(this.x, this.x1 - this.w - 4));
        this.state = 'dazed';
        this.timer = 2.4;
        this.vx = 0;
        sfx.boom();
        g.shake(12);
        g.burst(this.facing > 0 ? this.x + this.w : this.x, this.y + 40, '#ffe066', 14, 260, 5);
      }
    } else if (this.state === 'dazed') {
      this.vx = 0;
      if (this.timer <= 0) {
        this.state = 'idle';
        this.timer = 0.9;
      }
    } else if (this.state === 'suck') {
      this.vx = 0;
      const d = cx(this) - cx(p);
      if (Math.abs(d) < 520 && !p.dashT) p.x += Math.sign(d) * (angry ? 150 : 115) * dt;
      if (Math.random() < 0.5) g.parts.push({ x: cx(this) - Math.sign(d) * rand(80, 400), y: rand(this.y, 460), vx: Math.sign(d) * 420, vy: 0, grav: 0, life: 0.4, max: 0.4, color: 'rgba(200,220,180,0.6)', size: 4 });
      if (this.timer <= 0) {
        this.state = 'idle';
        this.timer = 0.8;
      }
    } else if (this.state === 'toss') {
      this.vx = 0;
      if (this.timer < 1.4 - this.tossed * 0.4 && this.tossed < (angry ? 4 : 3)) {
        this.tossed++;
        const t = 0.9 + this.tossed * 0.15;
        const tx = cx(p) + rand(-90, 90);
        g.add(new Shot({ x: cx(this) - 12, y: this.y, w: 24, h: 24, vx: (tx - cx(this)) / t, vy: -560, grav: 1100, color: '#3a3f4a', life: 3 }));
        sfx.shoot();
      }
      if (this.timer <= 0) {
        this.state = 'idle';
        this.timer = 0.7;
      }
    }
    this.vy = Math.min(900, this.vy + GRAVITY * dt);
    moveBody(g, this, dt);
  }

  draw(c, g) {
    const { x, y, w, h } = this;
    const shake = this.shakeX ? (Math.random() - 0.5) * this.shakeX * 2 : 0;
    c.save();
    c.translate(shake, 0);
    if (this.ground) shadow(c, x + w / 2, y + h, w * 0.6, 0.4, 10);
    const lid = this.state === 'suck' ? -0.5 : this.state === 'toss' ? -0.3 : 0;
    // wheels
    for (const wx of [x + 30, x + w - 30]) {
      c.fillStyle = '#1d1f26';
      c.beginPath();
      c.arc(wx, y + h - 12, 14, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#6a6e7a';
      c.beginPath();
      c.arc(wx, y + h - 12, 5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.25)';
      c.fillRect(wx - 8, y + h - 23, 8, 2);
    }
    c.fillStyle = this.flash ? '#fff' : this.state === 'dazed' || this.stunned > 0 ? '#7fae5a' : '#5d8a44';
    rr(c, x, y + 20, w, h - 32, 10);
    c.fill();
    if (!this.flash) {
      // a rounded metal bin: lit on the left, dark on the right, grimy at the bottom
      c.drawImage(fadeStripX('#ffffff', 0.18, 0), x + 2, y + 22, w * 0.3, h - 36);
      c.drawImage(fadeStripX('#000000', 0, 0.3), x + w * 0.6, y + 22, w * 0.4 - 2, h - 36);
      c.drawImage(fadeStrip('#1a2a10', 0, 0.35), x + 2, y + h - 60, w - 4, 46);
    }
    c.fillStyle = 'rgba(0,0,0,0.2)';
    for (let i = 1; i < 5; i++) c.fillRect(x + i * (w / 5), y + 30, 4, h - 52);
    c.fillStyle = 'rgba(255,255,255,0.12)';
    for (let i = 1; i < 5; i++) c.fillRect(x + i * (w / 5) - 2, y + 30, 2, h - 52);
    // lid
    c.save();
    c.translate(this.facing > 0 ? x : x + w, y + 22);
    c.rotate(lid * -this.facing);
    c.fillStyle = '#466d33';
    c.fillRect(this.facing > 0 ? 0 : -w, -12, w, 14);
    c.restore();
    // face
    const fx = cx(this) + this.facing * 40;
    c.fillStyle = '#fff';
    c.fillRect(fx - 26, y + 44, 16, 12);
    c.fillRect(fx + 10, y + 44, 16, 12);
    c.fillStyle = this.state === 'dazed' ? '#333' : '#ff3b3b';
    c.fillRect(fx - 20 + this.facing * 3, y + 47, 6, 6);
    c.fillRect(fx + 16 + this.facing * 3, y + 47, 6, 6);
    if (this.state !== 'dazed') {
      glow(c, fx - 17 + this.facing * 3, y + 50, 16, '#ff3b3b', 0.7);
      glow(c, fx + 19 + this.facing * 3, y + 50, 16, '#ff3b3b', 0.7);
    }
    c.fillStyle = '#1d1f26';
    rr(c, fx - 24, y + 66, 48, this.state === 'suck' ? 22 : 10, 4);
    c.fill();
    text(c, 'GC', x + w / 2 - this.facing * 50, y + 74, { size: 16, color: 'rgba(0,0,0,0.35)' });
    c.restore();
    if (this.state === 'dazed') text(c, '★ ★ ★', cx(this), y + 6, { size: 14, color: '#ffe066' });
    this.drawStun(c, g);
  }
}
