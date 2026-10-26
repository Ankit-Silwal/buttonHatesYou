import { W, H, rand, pick, clamp, rr, heart, text, drawBobby, drawScore, backdrop, Mouth, Sparks } from '../kit';

// Whack-a-Button: clones of the button pop out of nine holes. Bonk them, but
// not the ones holding a heart. 45 seconds on the clock.
const TIME = 45;
const SIZE = 84;
const COLS = [100, 240, 380];
const ROWS = [330, 480, 630];
const HOLES = ROWS.flatMap((y) => COLS.map((x) => ({ x, y })));
const RISE = 0.15; // seconds to pop up or duck down
const TRAVEL = SIZE * 1.15;
const HOLE_W = 58;
const HOLE_H = 18;
// numpad keys follow the numpad's layout; the number row reads like a book
const NUMPAD = { Numpad7: 0, Numpad8: 1, Numpad9: 2, Numpad4: 3, Numpad5: 4, Numpad6: 5, Numpad1: 6, Numpad2: 7, Numpad3: 8 };

const IDLE = ['Missed me.', 'We are legion.', 'Too slow.', 'Is that a hammer or a feather?', 'Peekaboo. I hate you.'];
const BONK = ['OW.', 'My face!', 'Rude.', 'I felt that.', 'That one had a family.'];
const WHIFF = ['Swing and a miss.', 'Ha!', 'Not even close.'];
const ESCAPE = ['Too slow.', 'Nyeh.', 'Bye!'];
const SOB = ['It was a GIFT.', 'I just wanted a hug…', 'You monster.', 'Why would you…'];
const END = ['Finally. A nap.', 'My head hurts.', 'Time’s up. Leave.'];

export default function whack({ look, sound }) {
  const clones = [];
  const hammers = [];
  const mouth = new Mouth();
  const sparks = new Sparks();
  const talk = { x: W / 2, y: 260 };
  let left = TIME;
  let t = 0;
  let next = 0.6; // seconds until the next clone pops up
  let chat = 4;
  let lastTick = TIME;

  // later clones come faster and duck sooner, and more of them at once
  const played = () => TIME - left;
  const interval = () => clamp(0.8 - played() * 0.011, 0.38, 0.8);
  const stay = () => clamp(1.05 - played() * 0.013, 0.5, 1.05);
  const most = () => Math.min(4, 1 + Math.floor(played() / 14));

  const rise = (cl) => clamp(Math.min(cl.age / RISE, (cl.end - cl.age) / RISE), 0, 1);
  const centerY = (cl) => HOLES[cl.hole].y + SIZE * 0.75 - rise(cl) * TRAVEL;
  // the clone in hole `cl.hole` says something (sometimes, if `chance` < 1)
  const say = (cl, lines, chance = 1, sec) => {
    if (chance < 1 && (mouth.left > 0 || Math.random() >= chance)) return;
    mouth.say(pick(lines), sec);
    talk.x = HOLES[cl.hole].x;
    talk.y = centerY(cl) - SIZE * 0.62;
  };

  const popUp = () => {
    const busy = new Set(clones.map((cl) => cl.hole));
    const free = HOLES.map((_, i) => i).filter((i) => !busy.has(i));
    if (!free.length || clones.filter((cl) => cl.bonked == null).length >= most()) return;
    const hasHeart = played() > 3 && Math.random() < 0.22;
    clones.push({
      hole: pick(free),
      age: 0,
      end: RISE * 2 + stay(),
      heart: hasHeart,
      mood: hasHeart ? 'happy' : pick(['angry', 'smug']),
      bonked: null, // seconds since it got bonked
    });
  };

  const bonk = (cl) => {
    cl.bonked = 0;
    cl.end = cl.age + 0.35 + RISE;
    const x = HOLES[cl.hole].x;
    const y = centerY(cl);
    if (cl.heart) {
      g.score = Math.max(0, g.score - 3);
      sound.sob();
      sparks.burst(x, y, '#ff4f7b', 12, 180);
      sparks.float(x, y - SIZE * 0.6, '-3', '#ff4f7b');
      say(cl, SOB, 1, 2.2);
    } else {
      g.score++;
      sound.hit();
      sparks.burst(x, y - SIZE * 0.3, look.color, 10, 240);
      sparks.burst(x, y - SIZE * 0.3, '#fff3a8', 6, 180);
      sparks.float(x, y - SIZE * 0.6, '+1');
      say(cl, BONK, 0.18);
    }
  };

  const swing = (x, y) => hammers.push({ x, y, age: 0 });

  // the clone (if any) that is up enough in hole `i`
  const upIn = (i, enough) => clones.find((cl) => cl.hole === i && cl.bonked == null && rise(cl) > enough);

  const g = {
    score: 0,
    over: false,
    down(x, y) {
      if (g.over) return;
      swing(x, y);
      let best = null;
      let bestD = Infinity;
      for (const cl of clones) {
        if (cl.bonked != null || rise(cl) < 0.35) continue;
        const h = HOLES[cl.hole];
        const cy = centerY(cl);
        if (Math.abs(x - h.x) > HOLE_W || y < cy - SIZE * 0.65 || y > h.y + HOLE_H + 6) continue;
        const d = Math.hypot(x - h.x, y - cy);
        if (d < bestD) {
          bestD = d;
          best = cl;
        }
      }
      if (best) bonk(best);
      else {
        sound.click();
        if (mouth.left <= 0 && Math.random() < 0.15) {
          const up = clones.find((cl) => cl.bonked == null);
          if (up) say(up, WHIFF);
        }
      }
    },
    key(code) {
      if (g.over) return;
      const i = code in NUMPAD ? NUMPAD[code] : code.startsWith('Digit') ? Number(code.slice(5)) - 1 : -1;
      if (!(i >= 0 && i < 9)) return;
      const cl = upIn(i, 0.2);
      swing(HOLES[i].x, cl ? centerY(cl) - SIZE * 0.3 : HOLES[i].y - 10);
      if (cl) bonk(cl);
      else sound.click();
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      for (const hm of hammers) hm.age += dt;
      while (hammers.length && hammers[0].age > 0.3) hammers.shift();

      if (!g.over) {
        left -= dt;
        // tick through the last five seconds
        const sec = Math.ceil(left);
        if (sec !== lastTick) {
          lastTick = sec;
          if (sec > 0 && sec <= 5) sound.tick();
        }
        if (left <= 0) {
          left = 0;
          g.over = true;
          for (const cl of clones) cl.end = Math.min(cl.end, cl.age + rise(cl) * RISE);
          if (g.score >= 30) sound.win();
          else sound.bad();
          mouth.say(pick(END), 3);
          talk.x = W / 2;
          talk.y = 230;
        } else {
          next -= dt;
          if (next <= 0) {
            popUp();
            next = interval();
          }
          chat -= dt;
          if (chat <= 0) {
            const up = clones.find((cl) => cl.bonked == null && rise(cl) > 0.8);
            if (up) say(up, IDLE, 0.6);
            chat = rand(4, 7);
          }
        }
      }

      for (const cl of clones) {
        cl.age += dt;
        if (cl.bonked != null) cl.bonked += dt;
        if (cl.age >= cl.end) {
          cl.gone = true;
          if (cl.bonked == null && !cl.heart && !g.over) say(cl, ESCAPE, 0.12);
        }
      }
      for (let i = clones.length - 1; i >= 0; i--) if (clones[i].gone) clones.splice(i, 1);
    },

    draw(c) {
      backdrop(c, '#8fd3ff', '#e8f7ff');
      c.fillStyle = '#b6e2a4';
      c.beginPath();
      c.arc(80, 250, 160, Math.PI, 0);
      c.arc(360, 260, 190, Math.PI, 0);
      c.fill();

      // the lawn, with a few tufts that never move
      const grass = c.createLinearGradient(0, 220, 0, H);
      grass.addColorStop(0, '#8fd36f');
      grass.addColorStop(1, '#5aa646');
      c.fillStyle = grass;
      c.fillRect(0, 220, W, H - 220);
      c.strokeStyle = '#4e9a3c';
      c.lineWidth = 2;
      c.lineCap = 'round';
      for (let i = 0; i < 26; i++) {
        const x = (i * 97) % W;
        const y = 250 + ((i * 61) % (H - 270));
        c.beginPath();
        c.moveTo(x - 5, y + 4);
        c.lineTo(x - 7, y - 4);
        c.moveTo(x, y + 4);
        c.lineTo(x, y - 7);
        c.moveTo(x + 5, y + 4);
        c.lineTo(x + 7, y - 4);
        c.stroke();
      }

      HOLES.forEach((h, i) => {
        // the back of the hole
        c.fillStyle = '#7a5236';
        c.beginPath();
        c.ellipse(h.x, h.y + 4, HOLE_W + 8, HOLE_H + 8, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#2e1f16';
        c.beginPath();
        c.ellipse(h.x, h.y, HOLE_W, HOLE_H, 0, 0, Math.PI * 2);
        c.fill();

        // only what sticks out above the front rim shows
        const cl = clones.find((k) => k.hole === i);
        if (cl) {
          c.save();
          c.beginPath();
          c.rect(h.x - HOLE_W - 30, h.y - SIZE * 2, (HOLE_W + 30) * 2, SIZE * 2);
          c.ellipse(h.x, h.y, HOLE_W, HOLE_H, 0, 0, Math.PI);
          c.clip();
          clone(c, cl, h.x, centerY(cl), look, t);
          c.restore();
        }

        // the front rim and its key number
        c.strokeStyle = '#8f6443';
        c.lineWidth = 7;
        c.beginPath();
        c.ellipse(h.x, h.y, HOLE_W + 2, HOLE_H + 2, 0, 0.1, Math.PI - 0.1);
        c.stroke();
        text(c, String(i + 1), h.x + HOLE_W + 4, h.y + HOLE_H + 10, { size: 13, color: 'rgba(255,255,255,0.6)' });
      });

      for (const hm of hammers) hammer(c, hm);
      sparks.draw(c);
      mouth.draw(c, talk.x, talk.y);

      drawScore(c, g.score, `${Math.ceil(left)}s left`);
      if (played() < 2.5) text(c, 'Bonk them. Not the hearts.', W / 2, 166, { size: 16, color: 'rgba(30,60,90,0.75)' });
    },
  };
  return g;
}

function clone(c, cl, x, y, look, t) {
  const bonked = cl.bonked != null;
  const squash = bonked ? 0.3 * Math.max(0, 1 - cl.bonked / 0.35) : 0;
  drawBobby(c, x, y, SIZE, {
    look,
    t: t + cl.hole, // so the clones don't all blink together
    squash,
    flash: bonked && cl.bonked < 0.08,
    mood: bonked ? (cl.heart ? 'sad' : 'closed') : cl.mood,
    tears: bonked && cl.heart,
  });
  if (cl.heart) {
    // a stubby arm holding the heart out to you
    c.strokeStyle = look.dark;
    c.lineWidth = 5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x + SIZE * 0.3, y + SIZE * 0.1);
    c.lineTo(x + SIZE * 0.42, y + SIZE * 0.02);
    c.stroke();
    const beat = 1 + Math.sin(t * 8) * 0.08;
    heart(c, x + SIZE * 0.44, y - SIZE * 0.02, 13 * beat, bonked ? '#b0496a' : '#ff4f7b', '#fff');
  } else if (bonked) {
    // little stars spinning round its head
    c.fillStyle = '#ffd84d';
    for (let i = 0; i < 3; i++) {
      const a = t * 7 + (i * Math.PI * 2) / 3;
      c.beginPath();
      c.arc(x + Math.cos(a) * SIZE * 0.32, y - SIZE * 0.55 + Math.sin(a) * 6, 4, 0, Math.PI * 2);
      c.fill();
    }
  }
}

function hammer(c, hm) {
  const L = 70;
  const rest = -0.6;
  // a quick swing down onto the tapped point, then it fades away
  const a = hm.age < 0.07 ? 0.5 + (rest - 0.5) * (hm.age / 0.07) : rest;
  c.save();
  c.globalAlpha = clamp((0.3 - hm.age) / 0.12, 0, 1);
  c.translate(hm.x - L * Math.sin(rest), hm.y + L * Math.cos(rest));
  c.rotate(a);
  c.fillStyle = '#b07a3f';
  rr(c, -4, -L, 8, L + 16, 4);
  c.fill();
  c.fillStyle = '#d8433a';
  rr(c, -28, -L - 14, 56, 28, 7);
  c.fill();
  c.fillStyle = '#efe6d2';
  rr(c, -30, -L - 14, 8, 28, 3);
  c.fill();
  rr(c, 22, -L - 14, 8, 28, 3);
  c.fill();
  c.restore();
}
