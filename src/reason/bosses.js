import { GRAVITY, moveBody, overlap, clamp, rand, cx, cy } from './engine';
import { sfx } from './audio';
import { rr, text, popupWindow, sword, drawButton, adminFace, heart } from './draw';
import { Shot, Slime, Thing, Bat, bark } from './actors';

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
        c.fillStyle = '#ff2a3a';
        rr(c, this.x, this.y, this.w, this.h, 8);
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
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.35)';
    c.shadowBlur = 24;
    c.fillStyle = this.flash ? '#fff' : '#ffffff';
    rr(c, x, y, w, h, 12);
    c.fill();
    c.restore();
    c.fillStyle = '#ffb800';
    rr(c, x, y, w, 26, 12);
    c.fill();
    c.fillRect(x, y + 14, w, 12);
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
