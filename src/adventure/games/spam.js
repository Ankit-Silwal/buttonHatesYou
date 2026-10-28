import { W, H, rand, pick, clamp, rr, heart, text, drawBobby, drawScore, Mouth, Sparks, reviveFx, shadow, glow, layer } from '../kit';
import { Fx, sprite, vignette } from '../fx';

// Inbox Zero: emails land one at a time. Real mail goes right into the Inbox,
// spam goes left into the bin. A wrong sort, or letting one time out, is a
// strike. Three strikes and you are fired.
const MAX_STRIKES = 3;
const CW = 292; // card size
const CH = 210;
const CX = W / 2;
const CY = 392;
const BIN_W = 92;
const BIN_Y = 244;
const BIN_H = 300;
const THROW = 70; // drag this far and let go to sort
const TAP = 16; // less than this is a tap, not a drag
const DESK_Y = 668;
const BOBBY = { x: CX, y: 634, size: 100 };

// [sender, subject, isSpam]
const MAIL = [
  ['Mum', 'Did you eat?', 0],
  ['Boss', 'Fine.', 0],
  ['Dentist', 'Your appointment is Tuesday', 0],
  ['Grandma', 'Photo of my cat (again)', 0],
  ['HR', 'Your payslip is attached', 0],
  ['Bank', 'Your statement is ready', 0],
  ['Landlord', 'Rent is due Friday', 0],
  ['Dad', 'Call me. Not urgent. CALL NOW.', 0],
  ['Library', 'Your book is 3 days overdue', 0],
  ['Team Lead', 'Standup moved to 10:15', 0],
  ['School', "Parents' evening reminder", 0],
  ['Mum', 'WHY DO YOU NEVER CALL', 0],
  ['Pizza Place', 'Your order is on its way', 0],
  ['IT Dept', 'Maintenance this Sat, 2am', 0],
  ['Sister', 'Did you take my charger?', 0],
  ['Alex', 'Still on for lunch?', 0],
  ['Courier', 'Parcel left with neighbour', 0],
  ['Doctor', 'Test results: all normal', 0],
  ['Accounting', 'Invoice #4471 approved', 0],
  ['Mum', 'URGENT!!! You left your scarf here', 0],
  ['Prince of Nigeria', 'URGENT!!! Claim $5,000,000', 1],
  ['Your Cursor', 'has a virus', 1],
  ['Hot Singles', 'in your RAM', 1],
  ['Free Trial', 'You won a free trial of a free trial', 1],
  ['Totally Legit Bank', 'Verify your password HERE', 1],
  ['Dr. Miracle', 'Lose 10kg by Tuesday', 1],
  ['CryptoBro', '1000x GUARANTEED!!!', 1],
  ['Wizard Supplies', 'Enlarge your staff', 1],
  ['Amazin Prime', 'Your package is waiting (click)', 1],
  ['Mr. Lottery', 'You won a lottery you never entered', 1],
  ["Sheriff's Office", 'Pay $50 in gift cards or be arrested', 1],
  ['Rolex4U', 'Cheap watchez, bargin!!', 1],
  ['Antivirus Pro', '47 VIRUSES FOUND!', 1],
  ['Car Warranty', 'We have been trying to reach you', 1],
  ['Aunt Karen??', 'Forward this to 10 friends or perish', 1],
  ['Click Here', 'Click here', 1],
  ['Your Bank (not)', 'Account suspended!!1', 1],
  ['Bored Millionaire', 'Needs YOUR help moving money', 1],
  ['Mattress World', '90% off! Ends in 3 minutes', 1],
  ['Your Boss', 'Buy gift cards. Urgent. Tell no one.', 1],
  ['Newsletter #482', 'You can unsubscribe. Or can you?', 1],
  ['Hot Tip', 'Buy my NFT of a button', 1],
];

const RIGHT = ['Sorted.', 'Easy.', 'Mum would be proud.', 'Inbox: tidy.', 'Pfft. Too easy.', 'Filed.'];
const NOT_SPAM = ['That was REAL.', 'Mum is calling.', 'You binned a real one.', 'That one mattered.'];
const WAS_SPAM = ['Now I have a virus.', 'You let it IN.', 'Congrats, you won a virus.', 'It followed me home.'];
const LATE = ['Too slow.', 'It just sat there.', 'Unread. Forever.', 'Time is money.'];
const END = ['You are fired.', 'Pack your desk.', 'I need a new job.'];
const IDLE = ['Left. Or right. Pick.', 'Mind the strikes.', 'Another one.'];

export default function spam({ look, sound }) {
  const mouth = new Mouth();
  const sparks = new Sparks();
  const fx = new Fx();
  const fliers = []; // cards on their way out
  const talk = { x: CX, y: BOBBY.y - 52 };
  let t = 0;
  let strikes = 0;
  let combo = 0;
  let cur = null; // the email being sorted
  let drag = null; // { sx, dx, far }
  let next = 0.35; // seconds until the next email arrives
  let calm = 0; // extra-slow emails after a Continue
  let shake = 0;
  let moodT = 0;
  let mood = 'calm';
  let squash = 0;
  let chat = 5;
  let comboPop = 0;
  const pulse = [0, 0]; // bin bump: [spam, inbox]
  let deck = [];
  let lastMail = null;

  // each email stays a little less long than the one before
  const life = () => 0.85 + 3.15 * Math.exp(-g.score / 14) + (calm > 0 ? 0.9 : 0);

  const draw1 = () => {
    if (!deck.length) {
      deck = MAIL.map((_, i) => i);
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      if (deck[deck.length - 1] === lastMail) deck.unshift(deck.pop());
    }
    return deck.pop();
  };

  const arrive = () => {
    const i = draw1();
    lastMail = i;
    const [from, subj, isSpam] = MAIL[i];
    const l = life();
    if (calm > 0) calm--;
    cur = { from, subj, spam: !!isSpam, age: 0, life: l, ox: 0, oy: 0, lines: null };
  };

  const feel = (m, sec = 1) => {
    mood = m;
    moodT = sec;
  };

  const say = (lines, chance = 1, sec) => {
    if (chance < 1 && (mouth.left > 0 || Math.random() >= chance)) return;
    mouth.say(pick(lines), sec);
  };

  const strike = (why) => {
    strikes++;
    combo = 0;
    shake = 0.4;
    sound.bad?.();
    feel(why === 'late' ? 'sad' : 'angry', 1.2);
    fx.ring(CX, 100 + 66, '#ff4f6b', 70, 0.4);
    if (strikes >= MAX_STRIKES) {
      g.over = true;
      cur = null;
      drag = null;
      if (g.score >= 25) sound.win?.();
      else sound.sob?.();
      mouth.say(pick(END), 3);
      feel('sad', 99);
    }
  };

  // sends the current card off to a bin: side -1 = spam, +1 = inbox
  const sort = (side) => {
    if (!cur || g.over) return;
    const card = cur;
    const ok = card.spam === (side < 0);
    const x = CX + card.ox;
    const y = CY + card.oy;
    cur = null;
    drag = null;
    next = 0.12 + (calm > 0 ? 0.25 : 0);
    fliers.push({
      card, x, y, ang: card.ox * 0.0016, vx: side * 1150, vy: -60, vr: side * 5, age: 0, sc: 1, landed: false, side, ok,
      stamp: card.spam ? ['SPAM', '#e0344c'] : ['OK', '#2fae5f'],
    });
    if (ok) {
      g.score++;
      combo++;
      sound.click?.();
      feel(Math.random() < 0.5 ? 'happy' : 'smug', 0.7);
      squash = 0.12;
      sparks.float(x, y - 90, '+1', '#fff');
      say(RIGHT, 0.12);
      if (combo >= 5 && combo % 5 === 0) {
        sound.hit?.();
        comboPop = 0.8;
        sparks.float(CX, 300, `COMBO x${combo}!`, '#ffd84d');
        fx.burst(CX, CY, '#ffd84d', 22, 380);
        fx.ring(CX, CY, '#fff3a8', 120, 0.45, 8);
      }
    } else {
      say(card.spam ? WAS_SPAM : NOT_SPAM, 1, 2);
      strike('wrong');
    }
  };

  const timeout = () => {
    const card = cur;
    cur = null;
    drag = null;
    next = 0.3;
    fliers.push({ card, x: CX + card.ox, y: CY, ang: 0, vx: 0, vy: 80, vr: rand(-1.5, 1.5), age: 0, sc: 1, late: true, grav: 1500, stamp: ['LATE', '#c0392b'] });
    say(LATE, 1, 1.6);
    strike('late');
  };

  const g = {
    score: 0,
    over: false,
    down(x, y) {
      if (g.over || !cur || !Number.isFinite(x + y)) return;
      drag = { sx: x, dx: 0, far: 0 };
    },
    move(x) {
      if (!drag || !Number.isFinite(x)) return;
      drag.dx = x - drag.sx;
      drag.far = Math.max(drag.far, Math.abs(drag.dx));
    },
    up(x) {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!cur || !Number.isFinite(x)) return;
      if (Math.abs(d.dx) >= THROW) sort(d.dx < 0 ? -1 : 1);
      else if (d.far < TAP) sort(x < CX ? -1 : 1);
    },
    key(code) {
      if (code === 'ArrowLeft' || code === 'KeyA') sort(-1);
      else if (code === 'ArrowRight' || code === 'KeyD') sort(1);
    },

    // a paid Continue: strikes back down to one, a calm moment, same score
    revive() {
      g.over = false;
      strikes = Math.min(strikes, MAX_STRIKES - 1);
      strikes = Math.max(0, strikes - 2);
      combo = 0;
      cur = null;
      drag = null;
      next = 1.2;
      calm = 5;
      feel('calm', 0.1);
      reviveFx({ fx, words: sparks, mouth, sound }, CX, CY, look.color);
    },

    update(dt) {
      if (!Number.isFinite(dt)) return;
      dt = clamp(dt, 0, 0.05);
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      fx.update(dt);
      shake = Math.max(0, shake - dt);
      comboPop = Math.max(0, comboPop - dt);
      squash = Math.max(0, squash - dt * 0.5);
      pulse[0] = Math.max(0, pulse[0] - dt);
      pulse[1] = Math.max(0, pulse[1] - dt);
      if (!g.over) {
        moodT -= dt;
        if (moodT <= 0) mood = 'calm';
      }

      if (!g.over) {
        if (cur) {
          cur.age += dt;
          const to = drag ? drag.dx : 0;
          cur.ox += (to - cur.ox) * Math.min(1, dt * (drag ? 28 : 16));
          cur.oy = Math.abs(cur.ox) * 0.05;
          if (cur.age >= cur.life) timeout();
        } else {
          next -= dt;
          if (next <= 0) arrive();
        }
        chat -= dt;
        if (chat <= 0) {
          chat = rand(6, 10);
          say(IDLE, 0.5);
        }
      }

      for (const f of fliers) {
        f.age += dt;
        if (f.grav) f.vy += f.grav * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.ang += f.vr * dt;
        f.sc = clamp(1 - f.age * 0.9, 0.3, 1);
        if (!f.late && !f.landed && Math.abs(f.x - CX) > 190) {
          f.landed = true;
          const bx = f.side < 0 ? BIN_W / 2 + 6 : W - BIN_W / 2 - 6;
          pulse[f.side < 0 ? 0 : 1] = 0.3;
          fx.burst(bx, CY, f.ok ? '#8dffb0' : '#ff4f6b', f.ok ? 12 : 16, 300);
          if (f.ok) fx.ring(bx, CY, '#ffffff', 60, 0.3);
        }
      }
      while (fliers.length && fliers[0].age > 0.55) fliers.shift();
    },

    draw(c) {
      c.drawImage(wall(), 0, 0);
      c.save();
      if (shake) c.translate(rand(-1, 1) * shake * 14, rand(-1, 1) * shake * 14);

      // how far the card is dragged picks which bin lights up
      const lean = cur ? clamp(cur.ox / THROW, -1, 1) : 0;
      bin(c, 0, pulse[0], clamp(-lean, 0, 1), t);
      bin(c, 1, pulse[1], clamp(lean, 0, 1), t);

      const bob = Math.sin(t * 2) * 1.2;
      drawBobby(c, BOBBY.x, BOBBY.y + bob, BOBBY.size, { look, mood: g.over ? 'sad' : mood, t, squash });
      c.drawImage(desk(), 0, 0);

      // a pile of unread mail behind the current one
      if (!g.over) {
        for (let i = 2; i >= 1; i--) {
          c.save();
          c.translate(CX + (i === 2 ? -6 : 7), CY + i * 9);
          c.rotate(i === 2 ? -0.04 : 0.03);
          rr(c, -CW / 2, -CH / 2, CW, CH, 18);
          c.fillStyle = i === 2 ? '#a8b6d6' : '#cdd7ee';
          c.fill();
          c.restore();
        }
      }

      for (const f of fliers) {
        const a = clamp((0.55 - f.age) / 0.2, 0, 1);
        card(c, f.card, f.x, f.y, f.ang, f.sc, a, null, f.stamp, 1);
      }
      if (cur) {
        const k = clamp(cur.age / 0.16, 0, 1);
        const e = 1 - (1 - k) * (1 - k);
        const lift = (1 - e) * -260;
        const stamp = Math.abs(cur.ox) > 14 ? (cur.ox < 0 ? ['SPAM', '#e0344c'] : ['OK', '#2fae5f']) : null;
        const sa = clamp((Math.abs(cur.ox) - 14) / 56, 0, 1);
        card(c, cur, CX + cur.ox, CY + cur.oy + lift, cur.ox * 0.0018, 1, e, 1 - cur.age / cur.life, stamp, sa);
      }
      c.restore();

      fx.draw(c);
      sparks.draw(c);
      vignette(c, 0.3, '#0a1230');
      if (!g.over && cur && 1 - cur.age / cur.life < 0.25) vignette(c, 0.2 + 0.15 * Math.abs(Math.sin(t * 9)), '#c0182a');
      mouth.draw(c, talk.x, talk.y);

      drawScore(c, g.score, 'emails sorted');
      // strikes as hearts
      for (let i = 0; i < MAX_STRIKES; i++) {
        const lost = i >= MAX_STRIKES - strikes;
        const x = CX + (i - 1) * 40;
        heart(c, x, 164 + (lost ? 0 : Math.sin(t * 4 + i) * 1.5), 12, lost ? 'rgba(20,28,60,0.55)' : '#ff4f7b', lost ? 'rgba(255,255,255,0.25)' : '#fff');
      }
      if (combo >= 3 && !g.over) {
        const s = 1 + comboPop * 0.5;
        text(c, `x${combo}`, CX, 224, { size: Math.round(24 * s), color: combo >= 10 ? '#ffd84d' : '#bfe0ff' });
      }
    },
  };
  return g;
}

/* ---------- art ---------- */

// The office wall behind everything, painted once.
function wall() {
  return layer('spam:wall', (c) => {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#202c4d');
    g.addColorStop(1, '#41568a');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    // faint diagonal wallpaper stripes
    c.strokeStyle = 'rgba(255,255,255,0.035)';
    c.lineWidth = 14;
    for (let x = -H; x < W; x += 44) {
      c.beginPath();
      c.moveTo(x, H);
      c.lineTo(x + H, 0);
      c.stroke();
    }
    glow(c, CX, CY, 300, '#9fc4ff', 0.3);
    // a sticky note and a clock to make it an office
    c.save();
    c.translate(398, 180);
    c.rotate(0.08);
    shadow(c, 0, 52, 40, 0.3, 8);
    c.fillStyle = '#ffe66b';
    c.fillRect(-36, -36, 72, 72);
    text(c, 'INBOX', 0, -12, { size: 15, color: '#6b5a10' });
    text(c, 'ZERO', 0, 4, { size: 15, color: '#6b5a10' });
    text(c, 'or else', 0, 22, { size: 15, color: '#a33' });
    c.restore();
    c.fillStyle = '#f4f6fb';
    c.beginPath();
    c.arc(76, 186, 30, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#2a3558';
    c.lineWidth = 4;
    c.stroke();
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(76, 186);
    c.lineTo(76, 168);
    c.moveTo(76, 186);
    c.lineTo(90, 192);
    c.stroke();
  });
}

// The desk in front of the button, drawn over its lower half.
function desk() {
  return layer('spam:desk', (c) => {
    const top = c.createLinearGradient(0, DESK_Y, 0, H);
    top.addColorStop(0, '#c58a52');
    top.addColorStop(0.08, '#a9703c');
    top.addColorStop(1, '#5e381d');
    shadow(c, CX, DESK_Y, 260, 0.35, 16);
    c.fillStyle = top;
    c.fillRect(0, DESK_Y, W, H - DESK_Y);
    c.fillStyle = 'rgba(255,230,190,0.5)';
    c.fillRect(0, DESK_Y, W, 3);
    c.strokeStyle = 'rgba(60,30,12,0.2)';
    c.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      c.beginPath();
      c.moveTo(0, DESK_Y + 22 + i * 24);
      c.lineTo(W, DESK_Y + 22 + i * 24);
      c.stroke();
    }
    // keyboard
    rr(c, CX - 88, DESK_Y + 30, 176, 44, 8);
    c.fillStyle = '#e9ecf3';
    c.fill();
    c.fillStyle = '#b6bccd';
    for (let r = 0; r < 3; r++) for (let k = 0; k < 11; k++) c.fillRect(CX - 80 + k * 14.6, DESK_Y + 37 + r * 11, 11, 8);
    // mug
    rr(c, 392, DESK_Y + 20, 40, 44, 7);
    c.fillStyle = '#e0524a';
    c.fill();
    c.strokeStyle = '#e0524a';
    c.lineWidth = 6;
    c.beginPath();
    c.arc(436, DESK_Y + 42, 10, -Math.PI / 2, Math.PI / 2);
    c.stroke();
    // paper stack
    c.fillStyle = '#f7f3e6';
    rr(c, 44, DESK_Y + 34, 78, 42, 4);
    c.fill();
    c.fillStyle = '#e3dcc6';
    c.fillRect(44, DESK_Y + 66, 78, 3);
  });
}

// A bin on one side. kind 0 = spam (left), 1 = inbox (right).
function binArt(kind) {
  const pal = kind ? ['#2b62b8', '#63a9f5', '#bfe0ff'] : ['#7d1f33', '#d4455c', '#ffc2cb'];
  return sprite(`spam:bin${kind}`, BIN_W + 12, BIN_H + 12, (c) => {
    c.translate(6, 6);
    const g = c.createLinearGradient(0, 0, 0, BIN_H);
    g.addColorStop(0, pal[1]);
    g.addColorStop(1, pal[0]);
    rr(c, 0, 0, BIN_W, BIN_H, 18);
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = pal[2];
    c.lineWidth = 3;
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.15)';
    rr(c, 8, 8, BIN_W - 16, 36, 10);
    c.fill();
    text(c, kind ? 'INBOX' : 'SPAM', BIN_W / 2, 27, { size: 19, color: '#fff' });
    // icon
    const cx = BIN_W / 2;
    const cy = 120;
    c.fillStyle = '#fff';
    c.strokeStyle = pal[0];
    c.lineWidth = 3;
    if (kind) {
      rr(c, cx - 28, cy - 19, 56, 38, 5);
      c.fill();
      c.beginPath();
      c.moveTo(cx - 26, cy - 16);
      c.lineTo(cx, cy + 4);
      c.lineTo(cx + 26, cy - 16);
      c.stroke();
    } else {
      rr(c, cx - 22, cy - 14, 44, 44, 6);
      c.fill();
      rr(c, cx - 28, cy - 24, 56, 9, 4);
      c.fill();
      c.fillRect(cx - 7, cy - 30, 14, 7);
      c.beginPath();
      for (const dx of [-11, 0, 11]) {
        c.moveTo(cx + dx, cy - 6);
        c.lineTo(cx + dx, cy + 22);
      }
      c.stroke();
    }
    // arrow pointing outwards, like the swipe
    c.fillStyle = 'rgba(255,255,255,0.9)';
    const s = kind ? 1 : -1;
    c.beginPath();
    c.moveTo(cx + s * 22, 210);
    c.lineTo(cx - s * 14, 190);
    c.lineTo(cx - s * 14, 230);
    c.fill();
    text(c, kind ? 'REAL' : 'JUNK', BIN_W / 2, 262, { size: 16, color: 'rgba(255,255,255,0.9)' });
  });
}

function bin(c, kind, bump, lit, t) {
  const s = binArt(kind);
  const x = kind ? W - BIN_W - 6 : 6;
  const cx = x + BIN_W / 2;
  const cy = BIN_Y + BIN_H / 2;
  const glowA = Math.max(lit, bump * 2);
  if (glowA > 0.02) glow(c, cx, cy, 130, kind ? '#8dffb0' : '#ff6b86', clamp(glowA, 0, 1) * 0.8);
  const k = 1 + bump * 0.35 + lit * 0.04 + Math.sin(t * 2 + kind * 2) * 0.006;
  c.save();
  c.translate(cx, cy);
  c.scale(k, k);
  c.drawImage(s, -BIN_W / 2 - 6, -BIN_H / 2 - 6);
  c.restore();
}

/* ---------- cards ---------- */

const fit = (c, str, maxW) => {
  if (c.measureText(str).width <= maxW) return str;
  while (str.length > 1 && c.measureText(`${str}…`).width > maxW) str = str.slice(0, -1);
  return `${str}…`;
};

// greedy word wrap, at most `max` lines, the last one truncated if needed
function wrap(c, str, maxW, size, max) {
  text(c, '', 0, 0, { size, weight: 700 });
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const tryLine = line ? `${line} ${w}` : w;
    if (line && c.measureText(tryLine).width > maxW) {
      lines.push(line);
      line = w;
    } else line = tryLine;
  }
  if (line) lines.push(line);
  if (lines.length > max) {
    lines.length = max;
    lines[max - 1] = `${lines[max - 1]}…`;
  }
  return lines.map((l) => fit(c, l, maxW));
}

const strHash = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
};

// frac: time left (0..1) as a bar, or null; stamp: ['SPAM', color] with alpha sa
function card(c, cd, x, y, ang, sc, alpha, frac, stamp, sa) {
  if (!Number.isFinite(x + y + ang)) return;
  if (!cd.lines) {
    cd.lines = wrap(c, cd.subj, CW - 44, 22, 3);
    text(c, '', 0, 0, { size: 17 });
    cd.name = fit(c, cd.from, CW - 92);
  }
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.scale(sc, sc);
  c.globalAlpha = alpha;
  shadow(c, 0, CH / 2 + 12, CW * 0.46, 0.4, 14);
  const g = c.createLinearGradient(0, -CH / 2, 0, CH / 2);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#e8edf8');
  rr(c, -CW / 2, -CH / 2, CW, CH, 18);
  c.fillStyle = g;
  c.fill();
  c.save();
  c.clip();
  c.fillStyle = '#d8e4ff';
  c.fillRect(-CW / 2, -CH / 2, CW, 66);
  c.restore();
  c.strokeStyle = 'rgba(30,50,100,0.25)';
  c.lineWidth = 2;
  rr(c, -CW / 2, -CH / 2, CW, CH, 18);
  c.stroke();
  // avatar and sender
  c.fillStyle = `hsl(${strHash(cd.from)} 58% 52%)`;
  c.beginPath();
  c.arc(-CW / 2 + 36, -CH / 2 + 33, 20, 0, Math.PI * 2);
  c.fill();
  text(c, cd.from[0].toUpperCase(), -CW / 2 + 36, -CH / 2 + 34, { size: 21, color: '#fff' });
  text(c, cd.name, -CW / 2 + 66, -CH / 2 + 25, { size: 17, color: '#1c2540', align: 'left' });
  text(c, 'to me  ·  just now', -CW / 2 + 66, -CH / 2 + 46, { size: 15, color: '#5f6c8f', align: 'left', weight: 600 });
  // subject, centred in the space under the header
  const lh = 27;
  const y0 = 16 - ((cd.lines.length - 1) * lh) / 2;
  cd.lines.forEach((l, i) => text(c, l, -CW / 2 + 22, y0 + i * lh, { size: 22, color: '#1c2540', align: 'left' }));
  if (frac != null) {
    const w = CW - 44;
    rr(c, -w / 2, CH / 2 - 24, w, 8, 4);
    c.fillStyle = 'rgba(30,50,100,0.15)';
    c.fill();
    const f = clamp(frac, 0, 1);
    if (f > 0.02) {
      rr(c, -w / 2, CH / 2 - 24, w * f, 8, 4);
      c.fillStyle = `hsl(${Math.round(f * 120)} 75% 48%)`;
      c.fill();
    }
  }
  if (stamp && sa > 0.02) {
    c.globalAlpha = alpha * clamp(sa, 0, 1);
    c.save();
    c.translate(0, 12);
    c.rotate(stamp[0] === 'OK' ? 0.2 : -0.22);
    const s = 1.15 - clamp(sa, 0, 1) * 0.15;
    c.scale(s, s);
    const w = stamp[0].length * 26 + 30;
    c.strokeStyle = stamp[1];
    c.lineWidth = 6;
    rr(c, -w / 2, -30, w, 60, 10);
    c.stroke();
    text(c, stamp[0], 0, 2, { size: 44, color: stamp[1] });
    c.restore();
  }
  c.restore();
}
