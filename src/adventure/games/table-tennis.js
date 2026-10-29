import { W, H, clamp, rand, pick, rr, text, glow, rgba, lighten, darken, layer, sprite, hash, Mouth, reviveFx, vignette } from '../kit';
import { FONTS } from '@/reason/draw';
import { Fx } from '../fx';
import { drawHero } from '../cast';

// Ping Pong Grudge: table tennis against Karen Popup (or, if you are Karen,
// Lord 404). The table is seen from your end in a stylised 3/4 view; your
// character holds the near paddle. Drag (or ← →) to move it: the ball is hit
// when it reaches you and the paddle is under it. Where it meets the paddle
// aims the return, how fast the paddle moves puts spin on it (the ball curves,
// and kicks sideways off the bounce), and a ball that sits up high gets
// smashed. Every point you win counts; when the opponent has 5, the run is over.
//
// The world is in centimetres-ish: the table spans x -76..76 and y 0 (your
// edge) to 274 (theirs), the net at y 137, z is height above the table.

export const LIVES = 5; // points the opponent needs to end the run
const BACK = 2; // points a paid Continue takes off the opponent

const TW = 76;
const TL = 274;
const NET = 137;
const NET_H = 15;
const G = 520; // gravity
const REST = 0.85; // table bounce
const KICK = 0.2; // how much of the spin turns into sideways speed off a bounce
const COMP = 0.7; // how much of a shot's curve its aim allows for
const SPIN_MAX = 230;
const ME_Y = -12; // the hit planes: just behind each end
const AI_Y = TL + 12;
const REACH = 19; // how far from the paddle's centre a ball still gets hit
const AI_REACH = 19;
const PAD_X = 92; // the paddle's travel, either side
const KEY_SPEED = 360;

// the camera: a perspective along y, squashed a little in z
const D = 335;
const K = 2.58;
const NEAR = 690; // screen y of your edge of the table
const HZ = -196;
const CX = W / 2;
const ZK = 0.82;
const sc = (y) => D / (D + Math.max(-D * 0.6, y));
const SX = (x, y) => CX + x * K * sc(y);
const SY = (y, z) => HZ + (NEAR - HZ) * sc(y) - z * K * sc(y) * ZK;
const toWorldX = (px) => (px - CX) / (K * sc(ME_Y));

const FOES = {
  karen: {
    name: 'KAREN',
    look: { color: '#eef1f7', dark: '#a9b1c3', char: 'karen', eyes: null, ears: null, scarf: null, hat: null, outfit: null },
    hair: true,
    paddle: '#26262e',
    serve: ['Serving. Try to keep up.', 'This one is going in my review.', 'Ready? I was not asking.'],
    wins: ['Next.', 'One star. For you.', 'That is going in my review.', 'Too slow, sweetie.', 'I have had better rallies with a fax machine.'],
    loses: ['That was OUT. I saw it.', 'MANAGER!', 'I demand a replay.', 'Unacceptable!', 'The sun was in my eyes. Indoors.', 'Who trained you? I want their name.'],
    smashed: ['EXCUSE ME?!', 'How DARE you.', 'Rude!'],
    spin: ['Spin is cheating.', 'That is illegal. Probably.', 'Did that just CURVE?'],
    rally: ['Are you even trying to lose?', 'Just miss already.', 'My arm is filing a complaint.'],
    angry: ['Fine. No more Ms. Nice Popup.', 'Upgrading to Premium Karen.', 'I am escalating this.'],
    end: ['Game. Set. Refund.', 'I win. As always.', 'Leave five stars on your way out.'],
  },
  lord404: {
    name: 'LORD 404',
    look: { color: '#8a5cd6', dark: '#5b3a9c', char: 'lord404', eyes: null, ears: null, scarf: null, hat: null, outfit: null },
    paddle: '#3a1460',
    serve: ['Serving… into the void.', 'Ping. Is anyone there?', 'Please hit it back. Please.'],
    wins: ['Point found. For once.', 'Even the ball came back to me.', 'Status 200.'],
    loses: ['Point not found.', 'Connection lost. Like my ex.', '404: reflexes missing.', 'Why does everything leave me?'],
    smashed: ['My packets!', 'Request timed out!', 'Ow. Emotionally.'],
    spin: ['Unexpected spin. Error.', 'That ball is corrupted.'],
    rally: ['Stay. Please. Keep hitting.', 'Longest connection I have had in years.'],
    angry: ['Rebooting… angrier.', 'Upgrading to Lord 500.'],
    end: ['I won? I never win.', 'Game over. I am still sad.'],
  },
};

// what your character says when it wins a point
const CHEERS = {
  null: ['Take THAT.', 'I hate this sport.', 'Point. Leave me alone.'],
  tabby: ['BRO! Ace!', 'Tabbed it!', 'Knight point!'],
  bella: ['That one is for the flowers.', 'Sweetie, no.', 'Cute try.'],
  backspace: ['Back in my day…', 'Deleted.', 'Still got it.'],
  lord404: ['Point… found!', 'A win? For me?', 'Status 200!'],
  karen: ['Refund THIS.', 'Manager approved.', 'Five stars. For me.'],
  cursor: ['Clicked it.', 'Point and click. Point.', 'Right where I pointed.'],
};
const OUCH = ['Ugh.', 'I blinked.', 'That was lag.', 'My paddle slipped.'];

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function tableTennis({ look, sound, keys }) {
  const calm = reduced();
  const foe = look.char === 'karen' ? FOES.lord404 : FOES.karen;
  const cheers = CHEERS[look.char] ?? CHEERS.null;
  const fx = new Fx(320);
  const mouth = new Mouth(); // the opponent
  const mine = new Mouth(); // your character
  const ball = { x: 0, y: ME_Y, z: 30, vx: 0, vy: 0, vz: 0, spin: 0, by: 'me', bounces: 0, smash: false, live: false };
  const pad = { x: 0, tx: 0, vx: 0, z: 30, swing: 0, sx: 0 };
  const ai = { x: 0, tx: 0, vx: 0, z: 30, swing: 0, react: 0, plan: null, flash: 0, mood: 'smug' };
  const hero = { x: CX - 70, side: -1, jump: 0 };
  const trail = [];
  const words = [];
  let t = 0;
  let phase = 'serve'; // serve | play | dead
  let server = 'me';
  let serveT = 0;
  let deadT = 0;
  let rally = 0;
  let shake = 0;
  let flash = 0;
  let netWobble = 0;
  let anger = 0; // steps up every 6 points you win
  let cheer = 0; // the crowd jumps
  let lastWin = null;
  let banner = null; // { str, color, age }

  // (state: for poking at a run from the console, see window.__advGame)
  const g = { score: 0, foe: 0, over: false, state: { ball, pad, ai, points: [] } };

  // how good the opponent is right now: up with your score, a little with the rally
  const skill = () => clamp(g.score / 24, 0, 0.9) + Math.min(rally, 12) * 0.008;

  const say = (lines, sec = 1.8, chance = 1) => {
    if (Math.random() < chance) mouth.say(pick(lines), sec);
  };
  const pop = (str, color = '#fff', x = CX, y = 470) => words.push({ str, color, x, y, age: 0 });

  /* ---------- sounds ---------- */
  const tok = (hard) => {
    sound.tone?.(hard ? 620 : 900, 0.05, 'triangle', hard ? 0.9 : 0.65, hard ? 300 : 650);
    sound.tone?.(2400, 0.02, 'square', 0.12);
  };
  const tik = () => sound.tone?.(1500, 0.03, 'sine', 0.45, 1100);

  /* ---------- shots ---------- */
  // Sends the ball from where it is to land at (tx, ty) in about T seconds,
  // curving with `spin`, clearing the net by `clear`.
  function shoot(tx, ty, T, spin, clear = 6) {
    const { x: x0, y: y0, z: z0 } = ball;
    for (let i = 0; i < 10; i++) {
      const vy = (ty - y0) / T;
      const vz = (0.5 * G * T * T - z0) / T;
      const tn = (NET - y0) / vy;
      const zn = z0 + vz * tn - 0.5 * G * tn * tn;
      if (zn >= NET_H + clear || i === 9) {
        ball.vy = vy;
        ball.vz = vz;
        ball.vx = (tx - x0) / T - 0.5 * spin * T * COMP;
        break;
      }
      T *= 1.08;
    }
    ball.spin = spin;
    ball.bounces = 0;
    ball.live = true;
  }

  function myShot(serve = false) {
    const d = skill();
    const off = clamp((ball.x - pad.x) / REACH, -1, 1);
    const pv = pad.vx;
    const spin = clamp(pv * 0.85, -SPIN_MAX, SPIN_MAX);
    const high = !serve && ball.z > 62;
    const edge = !serve && !high && Math.abs(off) > 0.82;
    let tx = clamp(off * 60 + pv * 0.035, -64, 64);
    let T = clamp(0.95 - d * 0.22 - rally * 0.018, 0.52, 0.95);
    let ty = rand(185, 255);
    ball.smash = false;
    if (serve) T = 1.05;
    if (high) {
      // smash!
      T = 0.4;
      ty = rand(200, 250);
      ball.smash = true;
      tx = clamp(off * 70 + pv * 0.05, -68, 68);
      boom(pad, '#ffd36b');
      pop('SMASH!', '#ffd36b');
      mine.say(pick(['HAAA!', ...cheers]), 1.2);
    } else if (edge) {
      // off the edge of the paddle: it pops up, asking to be smashed
      T = 1.35;
      ty = rand(150, 200);
      tx *= 0.6;
      pop('Edge!', '#ffb0a0', SX(pad.x, ME_Y), 560);
    }
    shoot(tx, ty, T, high ? spin * 0.4 : spin, high ? 3 : 6);
    if (Math.abs(spin) > SPIN_MAX * 0.55 && !high) {
      pop(spin > 0 ? 'Spin ↷' : '↶ Spin', spin > 0 ? '#ffb347' : '#7fe3ff', SX(pad.x, ME_Y), 590);
      if (Math.random() < 0.35) say(foe.spin, 1.6);
    }
    ball.by = 'me';
    pad.swing = 0.18;
    pad.sx = ball.x - pad.x;
    hero.jump = 0.25;
    rally++;
    tok(high);
    fx.burst(SX(ball.x, ball.y), SY(ball.y, ball.z), lighten(look.color, 0.3), high ? 18 : 7, high ? 340 : 180, { gravity: 300, size: 2.4, life: 0.4 });
    fx.ring(SX(ball.x, ball.y), SY(ball.y, ball.z), high ? '#ffd36b' : '#ffffff', high ? 70 : 34, 0.28, high ? 7 : 4);
    // the opponent reads the shot after a moment, ignoring the spin at first
    ai.react = clamp(0.3 - d * 0.18, 0.1, 0.3) + (ball.smash ? 0.06 : 0);
    ai.plan = 'naive';
    if (rally > 0 && rally % 10 === 0) say(foe.rally, 1.8);
  }

  function aiShot(serve = false) {
    const d = skill();
    const incoming = Math.abs(ball.spin) / SPIN_MAX;
    const stretch = Math.abs(ball.x - ai.x) / AI_REACH;
    const pressure = incoming * 0.55 + stretch * 0.35 + (ball.smash ? 1 : 0) + Math.max(0, Math.abs(ball.vy) - 300) / 400;
    const err = serve ? 0.02 : clamp(0.07 + pressure * 0.2 - d * 0.09, 0.03, 0.6);
    const r = Math.random();
    let T = clamp(1.05 - d * 0.38 - rally * 0.016, 0.55, 1.05);
    let tx = Math.random() < 0.3 + d * 0.45 ? -Math.sign(pad.x || rand(-1, 1)) * rand(22, 64) : rand(-60, 60);
    let ty = rand(30, 110);
    let spin = Math.random() < d * 0.6 ? rand(0.35, 1) * SPIN_MAX * d * (Math.random() < 0.5 ? -1 : 1) : 0;
    let clear = 6;
    let dunk = false; // a shot into the net
    ball.smash = false;
    if (serve) T = 1.1;
    if (!serve && ball.z > 62 && d > 0.12 && Math.random() < 0.4 + d * 0.5) {
      // she smashes your pop-up back
      T = 0.45;
      ty = rand(45, 95);
      spin *= 0.3;
      ball.smash = true;
      clear = 3;
      pop('SMASH!', '#ff8f6d', CX, 330);
      say(['TAKE THAT.', 'MANAGER SMASH!', 'Refund THIS.'], 1.2);
      shake = calm ? 0 : 0.12;
      sound.hit?.();
    } else if (r < err) {
      // a mistake: into the net, long, or wide
      const kind = pick(['net', 'long', 'long', 'wide', 'wide']);
      if (kind === 'net') dunk = true;
      else if (kind === 'long') ty = -rand(30, 70);
      else tx = Math.sign(rand(-1, 1)) * rand(88, 110);
      spin = 0;
    } else if (r < err + pressure * 0.22) {
      // under pressure she pops it up: your smash
      T = 1.4;
      ty = rand(55, 95);
      tx *= 0.5;
      spin = 0;
    }
    shoot(tx, ty, T, spin, clear);
    if (dunk) ball.vz *= 0.35;
    ball.by = 'ai';
    ai.swing = 0.18;
    rally++;
    tok(ball.smash);
    fx.burst(SX(ball.x, ball.y), SY(ball.y, ball.z), '#ffb08a', 5, 120, { gravity: 200, size: 1.6, life: 0.3 });
    ai.tx = ai.x * 0.4;
    ai.plan = null;
  }

  // A big moment: sparks, a shockwave, a flash, a shake.
  function boom(p, color) {
    const x = SX(ball.x, ball.y);
    const y = SY(ball.y, ball.z);
    fx.burst(x, y, color, 24, 420, { gravity: 200, size: 3, life: 0.6 });
    fx.ring(x, y, '#ffffff', 110, 0.35, 9);
    if (!calm) {
      shake = 0.28;
      flash = 0.12;
    }
    sound.hit?.();
  }

  /* ---------- the ball ---------- */
  // where the ball will cross plane `py` (simulated; `real` knows about spin)
  function predict(py, real) {
    let { x, y, z, vx, vy, vz, spin, bounces } = ball;
    const dt = 1 / 120;
    for (let i = 0; i < 400; i++) {
      if (real) vx += spin * dt;
      vz -= G * dt;
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      if (z <= 0 && vz < 0 && Math.abs(x) <= TW && y >= 0 && y <= TL && bounces < 2) {
        z = -z;
        vz = -vz * REST;
        bounces++;
        if (real) {
          vx += spin * KICK;
          spin *= 0.6;
        }
      }
      if ((vy > 0 && y >= py) || (vy < 0 && y <= py)) break;
    }
    return { x, z };
  }

  function point(winner, why) {
    if (phase === 'dead') return;
    phase = 'dead';
    deadT = 0;
    lastWin = winner;
    if (g.state.points.length < 200) g.state.points.push([winner, why ?? '', rally]);
    if (winner === 'me') {
      g.score++;
      cheer = 1;
      ai.flash = 0.5;
      ai.mood = 'angry';
      banner = { str: why ?? 'POINT!', color: '#9dffb0', age: 0 };
      sound.win?.();
      fx.burst(CX, 120, '#9dffb0', 14, 260, { gravity: 120, life: 0.7 });
      say(foe.loses, 1.9);
      if (Math.random() < 0.4) mine.say(pick(cheers), 1.4);
      if (g.score % 6 === 0) {
        anger++;
        say(foe.angry, 2.2);
        pop('She is getting better…', '#ffcf8a', CX, 300);
      }
    } else {
      g.foe++;
      ai.mood = 'happy';
      banner = { str: why ? `${why}` : `${foe.name} SCORES`, color: '#ff9b8a', age: 0 };
      sound.bad?.();
      if (g.foe >= LIVES) {
        g.over = true;
        say(foe.end, 3);
      } else say(foe.wins, 1.8);
      if (Math.random() < 0.3) mine.say(pick(OUCH), 1.3);
    }
  }

  function resetServe(who) {
    phase = 'serve';
    server = who;
    serveT = 0;
    rally = 0;
    trail.length = 0;
    ball.live = false;
    ball.smash = false;
    ball.spin = 0;
    ai.plan = null;
    ai.react = 0;
    ai.mood = 'smug';
    if (who === 'ai' && Math.random() < 0.5) say(foe.serve, 1.6);
  }

  function step(dt) {
    const py = ball.y;
    const pz = ball.z;
    ball.vx += ball.spin * dt;
    ball.vz -= G * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.z += ball.vz * dt;
    // the net
    if (phase === 'play' && (py - NET) * (ball.y - NET) <= 0 && py !== ball.y && Math.abs(ball.x) < TW + 14 && ball.z < NET_H && pz > -20) {
      ball.y = NET + (py < NET ? -1 : 1);
      ball.vy *= -0.15;
      ball.vx *= 0.3;
      ball.vz = Math.max(ball.vz, 40);
      netWobble = 1;
      sound.thud?.();
      point(ball.by === 'me' ? 'ai' : 'me', 'NET!');
      return;
    }
    // the table, or the floor
    if (ball.z <= 0 && pz > 0 && Math.abs(ball.x) <= TW && ball.y >= 0 && ball.y <= TL) {
      ball.z = -ball.z;
      ball.vz = -ball.vz * REST;
      ball.vx += ball.spin * KICK;
      ball.spin *= 0.6;
      tik();
      fx.ring(SX(ball.x, ball.y), SY(ball.y, 0), 'rgba(255,255,255,0.8)', 16 * sc(ball.y) + 6, 0.3, 2);
      if (phase === 'play') {
        const side = ball.y < NET ? 'me' : 'ai';
        if (side === ball.by) point(ball.by === 'me' ? 'ai' : 'me', 'FAULT');
        else if (++ball.bounces > 1) point(ball.by, 'DOUBLE BOUNCE');
        else if (ball.by === 'me' && Math.abs(ball.spin) > SPIN_MAX * 0.2) {
          // the spin kicks it sideways: she re-reads the ball, a beat late
          ai.react = Math.max(ai.react, 0.06 + (1 - skill()) * 0.12);
          ai.plan = 'real';
        }
      }
    } else if (ball.z < -76 && ball.vz < 0) {
      ball.z = -76 - (ball.z + 76) * 0.5;
      ball.vz = -ball.vz * 0.55;
      ball.vx *= 0.8;
      ball.vy *= 0.8;
      if (Math.abs(ball.vz) > 40) tik();
    }
    if (phase !== 'play') return;
    // missed the table altogether
    if (ball.z < -8 && ball.bounces === 0 && (Math.abs(ball.x) > TW || ball.y < 0 || ball.y > TL)) {
      point(ball.by === 'me' ? 'ai' : 'me', 'OUT!');
      return;
    }
    // reaching a player
    if (ball.by === 'ai' && py > ME_Y && ball.y <= ME_Y) {
      if (ball.bounces === 0) return point('me', 'OUT!');
      if (Math.abs(ball.x - pad.x) <= REACH + 2 && ball.z > -30) myShot();
      else point('ai');
    } else if (ball.by === 'me' && py < AI_Y && ball.y >= AI_Y) {
      if (ball.bounces === 0) return point('ai', 'OUT!');
      if (Math.abs(ball.x - ai.x) <= AI_REACH && ball.z > -30) aiShot();
      else point('me', ball.smash ? 'SMASH!' : Math.abs(ball.x) > TW - 10 ? 'WINNER!' : 'POINT!');
    }
  }

  /* ---------- input ---------- */
  const serveNow = () => {
    if (phase === 'serve' && server === 'me' && serveT > 0.35 && !g.over) {
      phase = 'play';
      myShot(true);
    }
  };

  Object.assign(g, {
    down(x) {
      pad.tx = clamp(toWorldX(x), -PAD_X, PAD_X);
      serveNow();
    },
    move(x) {
      pad.tx = clamp(toWorldX(x), -PAD_X, PAD_X);
    },
    key(code) {
      if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(code)) serveNow();
    },

    // a paid Continue: two points off the opponent, and your serve
    revive() {
      g.over = false;
      g.foe = Math.max(0, LIVES - BACK);
      resetServe('me');
      reviveFx({ fx, words: { float: (x, y, s, col) => pop(s, col, x, y) }, mouth: mine, sound }, hero.x, 700, look.color);
      say(['Oh, you PAID? Pathetic.', 'Fine. Round two.', 'Bought yourself a second chance? Typical.'], 2);
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      mine.update(dt);
      fx.update(dt);
      shake = Math.max(0, shake - dt);
      flash = Math.max(0, flash - dt);
      netWobble = Math.max(0, netWobble - dt * 2.5);
      cheer = Math.max(0, cheer - dt * 1.5);
      ai.flash = Math.max(0, ai.flash - dt);
      pad.swing = Math.max(0, pad.swing - dt);
      ai.swing = Math.max(0, ai.swing - dt);
      hero.jump = Math.max(0, hero.jump - dt);
      if (banner && (banner.age += dt) > 1.3) banner = null;
      for (const w of words) w.age += dt;
      while (words.length && words[0].age > 1) words.shift();

      // your paddle: keys nudge its target, it follows the target quickly
      const dir = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0) - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
      if (dir) pad.tx = clamp(pad.tx + dir * KEY_SPEED * dt, -PAD_X, PAD_X);
      const before = pad.x;
      pad.x += (pad.tx - pad.x) * Math.min(1, dt * 26);
      const v = (pad.x - before) / Math.max(dt, 1e-3);
      pad.vx += (v - pad.vx) * Math.min(1, dt * 22);

      // the opponent's paddle
      if (ai.react > 0) ai.react -= dt;
      else if (ai.plan && ball.by === 'me' && phase === 'play') {
        const p = predict(AI_Y, ai.plan === 'real');
        const sloppy = (1 - skill()) * 16;
        ai.tx = clamp(p.x + rand(-sloppy, sloppy), -PAD_X - 10, PAD_X + 10);
        ai.plan = null;
      }
      const speed = 170 + skill() * 190 + anger * 8;
      const av = clamp((ai.tx - ai.x) * 9, -speed, speed);
      ai.x += av * dt;
      ai.vx = av;

      // serving
      if (phase === 'serve') {
        serveT += dt;
        if (server === 'me') {
          ball.x = pad.x + 6;
          ball.y = ME_Y + 2;
          ball.z = 34 + Math.abs(Math.sin(serveT * 4)) * 26;
          if (serveT > 2.6 && !g.over) serveNow();
        } else {
          ball.x = ai.x - 6;
          ball.y = AI_Y - 2;
          ball.z = 34 + Math.abs(Math.sin(serveT * 4)) * 26;
          if (serveT > 1.1 && !g.over) {
            phase = 'play';
            aiShot(true);
          }
        }
      } else {
        // a few small steps a frame, so a fast ball doesn't skip a plane
        const n = 3;
        for (let i = 0; i < n; i++) step(dt / n);
        if (phase === 'dead') {
          deadT += dt;
          if (deadT > 1.35 && !g.over) resetServe(lastWin === 'me' ? 'ai' : 'me');
        }
      }

      // the paddles rise to meet the ball
      const near = (who) => (who === 'me' ? ball.y < NET + 60 : ball.y > NET - 60);
      const want = (who) => (phase !== 'serve' && ball.by !== who && near(who) ? clamp(ball.z, 12, 46) : 28); // rising to meet a ball coming its way
      pad.z += (want('me') - pad.z) * Math.min(1, dt * 8);
      ai.z += (want('ai') - ai.z) * Math.min(1, dt * 6);

      // your character steps along with the paddle, switching sides near the edges
      const px = SX(pad.x, ME_Y);
      if (px < 150) hero.side = 1;
      else if (px > 330) hero.side = -1;
      hero.x += (px + hero.side * 74 - hero.x) * Math.min(1, dt * 10);

      // the trail
      if (ball.live || phase === 'serve') {
        trail.push(SX(ball.x, ball.y), SY(ball.y, ball.z));
        if (trail.length > 28) trail.splice(0, 2);
      }
    },

    draw(c) {
      c.save();
      if (shake > 0) c.translate(rand(-1, 1) * shake * 30, rand(-1, 1) * shake * 30);
      c.drawImage(arena(), 0, 0, W, H);
      crowd(c, t, cheer);
      drawFoe(c);
      // a ball far behind the table (and below it) goes under it
      const under = ball.z < 0 && ball.y > TL;
      if (under) drawBall(c);
      c.drawImage(table(), 0, 0, W, H);
      const far = ball.y > NET && !under;
      if (far) {
        drawShadow(c);
        drawBall(c);
      }
      net(c, netWobble, t);
      if (!far && !under) {
        drawShadow(c);
        drawBall(c);
      }
      drawMe(c);
      fx.draw(c);
      hud(c);
      mouth.draw(c, CX + Math.sin(t * 1.3) * 6, 148);
      mine.draw(c, hero.x, 668);
      for (const w of words) {
        const a = clamp((1 - w.age) * 2, 0, 1);
        const s = w.age < 0.12 ? 1.4 - w.age * 3.3 : 1;
        c.globalAlpha = a;
        outlined(c, w.str, w.x, w.y - w.age * 40, 22 * s, w.color);
      }
      c.globalAlpha = 1;
      if (banner) {
        const k = banner.age;
        const s = k < 0.15 ? 0.6 + k * 2.6 : 1;
        c.globalAlpha = clamp((1.3 - k) * 3, 0, 1);
        outlined(c, banner.str, CX, 470, 40 * s, banner.color);
        c.globalAlpha = 1;
      }
      if (phase === 'serve' && server === 'me' && t < 30 && serveT > 0.3) {
        c.globalAlpha = 0.65 + Math.sin(t * 5) * 0.25;
        outlined(c, 'Tap to serve', CX, 560, 18, '#fff');
        c.globalAlpha = 1;
      }
      vignette(c, 0.32, '#0a0418');
      c.restore();
      if (flash > 0) {
        c.fillStyle = `rgba(255,250,235,${flash * 2.4})`;
        c.fillRect(0, 0, W, H);
      }
    },
  });

  /* ---------- drawing ---------- */
  function drawShadow(c) {
    const onTable = Math.abs(ball.x) <= TW && ball.y >= 0 && ball.y <= TL && ball.z >= -1;
    const z0 = onTable ? 0 : -76;
    const h = ball.z - z0;
    const s = sc(ball.y);
    const x = SX(ball.x, ball.y);
    const y = SY(ball.y, z0);
    const a = clamp(0.5 - h / 260, 0.12, 0.5);
    const r = (5 + h * 0.06) * s * 1.6;
    c.fillStyle = `rgba(4,8,30,${a})`;
    c.beginPath();
    c.ellipse(x, y, r * 1.3, r * 0.5, 0, 0, Math.PI * 2);
    c.fill();
  }

  function drawBall(c) {
    const x = SX(ball.x, ball.y);
    const y = SY(ball.y, ball.z);
    const s = sc(ball.y);
    const r = Math.max(4.6, 7.6 * s);
    // the trail: a tapering ribbon, tinted by spin, red-hot on a smash
    const n = trail.length / 2;
    if (n > 2 && phase !== 'serve') {
      const tint = ball.smash ? '#ff6a3d' : ball.spin > SPIN_MAX * 0.3 ? '#ffb347' : ball.spin < -SPIN_MAX * 0.3 ? '#7fe3ff' : '#ffffff';
      const op = c.globalCompositeOperation;
      c.globalCompositeOperation = 'lighter';
      c.lineCap = 'round';
      c.strokeStyle = tint;
      for (let i = 1; i < n; i++) {
        const k = i / n;
        c.globalAlpha = k * k * (ball.smash ? 0.8 : 0.5);
        c.lineWidth = r * 1.7 * k;
        c.beginPath();
        c.moveTo(trail[(i - 1) * 2], trail[(i - 1) * 2 + 1]);
        c.lineTo(trail[i * 2], trail[i * 2 + 1]);
        c.stroke();
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = op;
      if (ball.smash) glow(c, x, y, r * 5, '#ff7a3d', 0.7);
    }
    glow(c, x, y, r * 3, '#fff3d6', 0.35);
    c.drawImage(ballSprite(), x - r, y - r, r * 2, r * 2);
    // the spin, as a turning seam
    if (Math.abs(ball.spin) > 20 && ball.live) {
      c.strokeStyle = 'rgba(200,120,40,0.55)';
      c.lineWidth = Math.max(1, r * 0.22);
      c.beginPath();
      const a = t * Math.sign(ball.spin) * 30;
      c.ellipse(x, y, r * 0.72, r * 0.72 * Math.abs(Math.cos(a)), 0.4, 0, Math.PI * 2);
      c.stroke();
    }
  }

  function drawMe(c) {
    const s = sc(ME_Y);
    const lunge = pad.swing > 0 ? (pad.swing / 0.18) * pad.sx * 0.8 : 0;
    const px = SX(pad.x + lunge, ME_Y);
    const py = SY(ME_Y, pad.z);
    const hx = hero.x;
    const hop = hero.jump > 0 ? Math.sin((hero.jump / 0.25) * Math.PI) * 10 : 0;
    const hy = 742 - hop + Math.sin(t * 2.4) * 1.5;
    const size = 96;
    const look4 = [clamp((SX(ball.x, ball.y) - hx) / 160, -1, 1), clamp((SY(ball.y, ball.z) - (hy - 20)) / 300, -1, 1)];
    const mood = phase === 'dead' ? (lastWin === 'me' ? 'happy' : 'sad') : pad.swing > 0 ? 'shout' : ball.smash && ball.by === 'ai' ? 'scared' : 'calm';
    // shadow on the floor
    c.fillStyle = 'rgba(10,4,30,0.35)';
    c.beginPath();
    c.ellipse(hx, 792, 48, 9, 0, 0, Math.PI * 2);
    c.fill();
    // the arm, from the body to the paddle's handle
    const tilt = clamp(-pad.vx / 900, -0.5, 0.5) + (hero.side > 0 ? 0.35 : -0.35);
    const handX = px + Math.sin(tilt) * 30 * 0.9 + hero.side * 6;
    const handY = py + Math.cos(tilt) * 30;
    const shX = hx - hero.side * (SHOULDER[look.char] ?? 17) * (size / 38);
    const shY = hy - 2;
    c.strokeStyle = '#3a2620';
    c.lineWidth = 7;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(shX, shY);
    c.quadraticCurveTo((shX + handX) / 2, Math.max(shY, handY) + 18, handX, handY);
    c.stroke();
    drawHero(c, hx, hy, size, { look, mood, t, gaze: look4, legs: phase === 'play' ? t * 9 : 0, calm });
    paddle(c, px, py, 30 * s, tilt, '#d8333a', pad.swing);
    // the hand
    c.fillStyle = '#f4efe6';
    c.beginPath();
    c.arc(handX, handY, 6, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(40,20,20,0.35)';
    c.lineWidth = 1.2;
    c.stroke();
  }

  function drawFoe(c) {
    const s = sc(AI_Y);
    const lunge = ai.swing > 0 ? (ai.swing / 0.18) * 8 : 0;
    const px = SX(ai.x, AI_Y);
    const py = SY(AI_Y, ai.z) - lunge;
    const bx = clamp(px - 52, 70, W - 70);
    const by = 226 + Math.sin(t * 3) * 2 + (ai.swing > 0 ? -4 : 0);
    const mood = ai.flash > 0 ? 'angry' : phase === 'dead' ? ai.mood : ai.swing > 0 ? 'shout' : anger > 0 ? 'angry' : 'smug';
    if (ai.flash > 0 || anger > 1) glow(c, bx, by, 90, '#ff4a3a', ai.flash > 0 ? ai.flash * 1.2 : 0.25);
    // steam, once she's properly cross
    if (anger > 0) {
      for (let i = 0; i < 2 + anger; i++) {
        const k = (t * 0.7 + i * 0.37) % 1;
        c.fillStyle = `rgba(255,255,255,${0.35 * (1 - k)})`;
        c.beginPath();
        c.arc(bx + (i % 2 ? 26 : -26) + Math.sin(t * 3 + i) * 4, by - 40 - k * 34, 4 + k * 8, 0, Math.PI * 2);
        c.fill();
      }
    }
    const arm = [bx + 40, by - 2];
    c.strokeStyle = '#3a2620';
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(arm[0], arm[1]);
    c.quadraticCurveTo((arm[0] + px) / 2, Math.max(arm[1], py) + 14, px - 2, py + 14);
    c.stroke();
    drawHero(c, bx, by, 100, { look: foe.look, mood, t, gaze: [clamp((SX(ball.x, ball.y) - bx) / 150, -1, 1), 0.6], hair: foe.hair, angry: ai.flash > 0 || anger > 0, flash: ai.flash > 0.4 && Math.floor(t * 20) % 2 === 0, legs: false, calm });
    paddle(c, px, py, 30 * s, -0.25 + ai.vx / 1400, foe.paddle, ai.swing);
    c.fillStyle = '#f4efe6';
    c.beginPath();
    c.arc(px - 2, py + 14, 4.5, 0, Math.PI * 2);
    c.fill();
  }

  function hud(c) {
    // the scoreboard: you, the rally, them (their dots are the run's lives)
    const y = 72;
    c.save();
    c.fillStyle = 'rgba(8,6,24,0.72)';
    rr(c, CX - 150, y, 300, 58, 16);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.12)';
    c.lineWidth = 1.5;
    c.stroke();
    // your side
    c.fillStyle = rgba(look.color, 0.9);
    rr(c, CX - 142, y + 8, 8, 42, 4);
    c.fill();
    text(c, NAMES[look.char] ?? 'YOU', CX - 124, y + 17, { size: 11, color: 'rgba(255,255,255,0.7)', align: 'left', weight: 700 });
    outlined(c, String(g.score), CX - 108, y + 37, 26, '#fff');
    // theirs
    text(c, foe.name, CX + 140, y + 17, { size: 11, color: 'rgba(255,255,255,0.7)', align: 'right', weight: 700 });
    for (let i = 0; i < LIVES; i++) {
      const on = i < g.foe;
      const dx = CX + 132 - (LIVES - 1 - i) * 17;
      c.fillStyle = on ? '#ff6a55' : 'rgba(255,255,255,0.14)';
      c.beginPath();
      c.arc(dx, y + 38, 6, 0, Math.PI * 2);
      c.fill();
      if (on) glow(c, dx, y + 38, 12, '#ff6a55', 0.5);
    }
    // the rally, in the middle
    if (rally >= 3 && phase !== 'serve') {
      const k = Math.min(1, (rally - 2) / 10);
      text(c, 'RALLY', CX - 8, y + 18, { size: 10, color: 'rgba(255,255,255,0.6)', weight: 700 });
      outlined(c, `×${rally}`, CX - 8, y + 38, 20 + k * 4, lighten('#ffd36b', 0.3 * (1 - k)));
    } else text(c, 'VS', CX - 8, y + 30, { size: 14, color: 'rgba(255,255,255,0.35)', weight: 800 });
    c.restore();
  }

  return g;
}

const SHOULDER = { tabby: 20, backspace: 24, karen: 19, cursor: 6 }; // half the body's width, where the arm starts
const NAMES = { null: 'BOBBY', tabby: 'TABBY', bella: 'BELLA', backspace: 'BACKSPACE', lord404: 'LORD 404', karen: 'KAREN', cursor: 'CURSOR' };

/* ---------- shared art ---------- */

function outlined(c, str, x, y, size, color) {
  c.font = `700 ${Math.round(size)}px ${FONTS()}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  c.lineWidth = Math.max(3, size * 0.22);
  c.strokeStyle = 'rgba(20,8,36,0.6)';
  c.strokeText(str, x, y + 1);
  c.fillStyle = color;
  c.fillText(str, x, y);
}

// A paddle: a rubber face with a wooden edge and handle, tilted by `a`.
export function paddle(c, x, y, r, a, rubber, swing = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(a);
  if (swing > 0) c.scale(1 + swing, 1 - swing * 0.6);
  // handle
  const hg = c.createLinearGradient(-r * 0.2, 0, r * 0.2, 0);
  hg.addColorStop(0, '#c58d58');
  hg.addColorStop(1, '#8f5e34');
  c.fillStyle = hg;
  rr(c, -r * 0.17, r * 0.62, r * 0.34, r * 0.95, r * 0.12);
  c.fill();
  // blade
  c.fillStyle = '#e8c08a';
  c.beginPath();
  c.ellipse(0, 0, r * 1.04, r * 0.98, 0, 0, Math.PI * 2);
  c.fill();
  const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, lighten(rubber, 0.35));
  g.addColorStop(1, darken(rubber, 0.15));
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, -r * 0.03, r * 0.92, r * 0.86, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.22)';
  c.beginPath();
  c.ellipse(-r * 0.32, -r * 0.4, r * 0.32, r * 0.14, -0.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

const ballSprite = () =>
  sprite('tt:ball', 32, 32, (k) => {
    const g = k.createRadialGradient(11, 10, 1, 16, 16, 16);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, '#fff4e2');
    g.addColorStop(1, '#f0b878');
    k.fillStyle = g;
    k.beginPath();
    k.arc(16, 16, 15.5, 0, Math.PI * 2);
    k.fill();
  });

// The arena: a dark gym after hours, banners, a spotlight on the table, a
// floor of boards running away from you.
function arena() {
  return layer('tt:arena', (c) => {
    const wall = c.createLinearGradient(0, 0, 0, 190);
    wall.addColorStop(0, '#1b1036');
    wall.addColorStop(1, '#2c1a4f');
    c.fillStyle = wall;
    c.fillRect(0, 0, W, 190);
    // banners
    const banners = [
      [40, 'NO REFUNDS', '#e8603e'],
      [345, 'MANAGER: OUT', '#5b9bd5'],
    ];
    for (const [bx, str, col] of banners) {
      c.fillStyle = darken(col, 0.25);
      rr(c, bx, 10, 96, 30, 4);
      c.fill();
      c.fillStyle = col;
      rr(c, bx, 8, 96, 28, 4);
      c.fill();
      text(c, str, bx + 48, 22, { size: 11, color: '#fff', weight: 800 });
    }
    // bleachers
    for (let r = 0; r < 3; r++) {
      c.fillStyle = r % 2 ? '#3a2766' : '#33215c';
      c.fillRect(0, 128 + r * 18, W, 18);
      c.fillStyle = 'rgba(255,255,255,0.06)';
      c.fillRect(0, 128 + r * 18, W, 2);
    }
    // the floor: boards converging on the vanishing point
    const fl = c.createLinearGradient(0, 182, 0, H);
    fl.addColorStop(0, '#5a3a2c');
    fl.addColorStop(0.4, '#8a5a3c');
    fl.addColorStop(1, '#b07a50');
    c.fillStyle = fl;
    c.fillRect(0, 182, W, H - 182);
    c.save();
    c.beginPath();
    c.rect(0, 182, W, H - 182);
    c.clip();
    c.strokeStyle = 'rgba(40,20,10,0.25)';
    c.lineWidth = 1.5;
    for (let i = -14; i <= 14; i++) {
      c.beginPath();
      c.moveTo(CX + i * 14, 182);
      c.lineTo(CX + i * 95, H);
      c.stroke();
    }
    // a court line
    c.strokeStyle = 'rgba(255,230,170,0.35)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, 214);
    c.lineTo(W, 214);
    c.stroke();
    c.restore();
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.fillRect(0, 182, W, 6);
    // the spotlight
    const sp = c.createRadialGradient(CX, 480, 40, CX, 480, 330);
    sp.addColorStop(0, 'rgba(255,240,210,0.28)');
    sp.addColorStop(1, 'rgba(255,240,210,0)');
    c.fillStyle = sp;
    c.fillRect(0, 0, W, H);
    const cone = c.createLinearGradient(0, 0, 0, 500);
    cone.addColorStop(0, 'rgba(255,245,220,0.16)');
    cone.addColorStop(1, 'rgba(255,245,220,0)');
    c.fillStyle = cone;
    c.beginPath();
    c.moveTo(CX - 30, 0);
    c.lineTo(CX + 30, 0);
    c.lineTo(CX + 240, 560);
    c.lineTo(CX - 240, 560);
    c.fill();
  });
}

// The crowd on the bleachers: little buttons and keys who jump when you score.
function crowd(c, t, cheer) {
  for (let i = 0; i < 22; i++) {
    const row = i % 3;
    const x = 14 + ((i * 47 + row * 23) % 460);
    const jump = cheer > 0 ? Math.abs(Math.sin(t * 14 + i)) * cheer * 8 : Math.abs(Math.sin(t * 2 + i)) * 1.2;
    const y = 132 + row * 18 - jump;
    const col = ['#e2674f', '#5b9bd5', '#f39ac0', '#b4b8c2', '#8a5cd6', '#9bbf9a', '#f2c14e'][i % 7];
    c.fillStyle = darken(col, 0.45);
    if (i % 4 === 1) rr(c, x - 9, y - 8, 18, 14, 3);
    else rr(c, x - 8, y - 8, 16, 14, 7);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.fillRect(x - 3.5, y - 3, 2, 2.5);
    c.fillRect(x + 1.5, y - 3, 2, 2.5);
  }
}

// The table, painted once: the blue top with its white lines, its front edge
// and the far legs.
function table() {
  return layer('tt:table', (c) => {
    const P = (x, y, z = 0) => [SX(x, y), SY(y, z)];
    // far legs and the frame under the top
    c.fillStyle = '#20232c';
    for (const lx of [-62, 62]) {
      const [x0, y0] = P(lx, TL - 18, 0);
      const [, y1] = P(lx, TL - 18, -76);
      c.fillRect(x0 - 3, y0, 6, y1 - y0);
    }
    c.fillStyle = 'rgba(10,6,20,0.35)';
    const sh = [P(-TW - 4, -10, -76), P(TW + 4, -10, -76), P(TW, TL + 6, -76), P(-TW, TL + 6, -76)];
    c.beginPath();
    sh.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.fill();
    // front edge (thickness)
    const f = [P(-TW, 0, 0), P(TW, 0, 0), P(TW, 0, -6), P(-TW, 0, -6)];
    c.fillStyle = '#163a7a';
    c.beginPath();
    f.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.fill();
    // near legs, into the bottom of the frame
    c.fillStyle = '#20232c';
    for (const lx of [-62, 62]) {
      const [x0, y0] = P(lx, 14, -6);
      c.fillRect(x0 - 4, y0, 8, H - y0);
    }
    // the top
    const top = [P(-TW, 0), P(TW, 0), P(TW, TL), P(-TW, TL)];
    const g = c.createLinearGradient(0, top[2][1], 0, top[0][1]);
    g.addColorStop(0, '#1f4f9c');
    g.addColorStop(0.55, '#2a63b8');
    g.addColorStop(1, '#2d6cc4');
    c.fillStyle = g;
    c.beginPath();
    top.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fill();
    // sheen from the spotlight
    c.save();
    c.clip();
    const sp = c.createRadialGradient(CX, 470, 10, CX, 470, 260);
    sp.addColorStop(0, 'rgba(255,255,255,0.16)');
    sp.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = sp;
    c.fillRect(0, 0, W, H);
    // a little texture
    for (let i = 0; i < 160; i++) {
      c.fillStyle = `rgba(255,255,255,${0.02 + hash(i) * 0.03})`;
      const x = hash(i * 3.1) * 2 - 1;
      const y = hash(i * 7.7) * TL;
      c.fillRect(SX(x * TW, y), SY(y, 0), 2, 1);
    }
    c.restore();
    // the white lines: the edges, and the centre line
    c.strokeStyle = 'rgba(255,255,255,0.92)';
    c.lineJoin = 'round';
    const line = (pts, w) => {
      c.lineWidth = w;
      c.beginPath();
      pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.stroke();
    };
    const in2 = 1.5;
    line([P(-TW + in2, in2), P(TW - in2, in2), P(TW - in2, TL - in2), P(-TW + in2, TL - in2), P(-TW + in2, in2)], 3);
    line([P(0, in2), P(0, TL - in2)], 1.6);
    // the table's maker, printed on your half
    const [lx, ly] = P(-38, 62);
    c.save();
    c.translate(lx, ly);
    c.scale(1, 0.62);
    text(c, 'GRUDGE', 0, 0, { size: 30, color: 'rgba(255,255,255,0.1)', weight: 800 });
    c.restore();
  });
}

// The net: posts, a mesh and a white tape, wobbling after a hit.
function net(c, wob, t) {
  const y0 = SY(NET, 0);
  const y1 = SY(NET, NET_H);
  const xl = SX(-TW - 8, NET);
  const xr = SX(TW + 8, NET);
  const bulge = wob * Math.sin(t * 40) * 4;
  c.fillStyle = 'rgba(20,20,30,0.18)';
  c.beginPath();
  c.moveTo(xl, y0);
  c.lineTo(xr, y0);
  c.lineTo(xr, y1 + 4);
  c.quadraticCurveTo(CX, y1 + 4 + bulge, xl, y1 + 4);
  c.fill();
  // the mesh
  c.strokeStyle = 'rgba(235,240,255,0.32)';
  c.lineWidth = 0.8;
  c.beginPath();
  for (let x = xl; x <= xr; x += 6) {
    c.moveTo(x, y0);
    c.lineTo(x, y1 + bulge * (1 - Math.abs((x - CX) / (xr - CX))));
  }
  for (let k = 1; k < 4; k++) {
    const y = y0 + (y1 - y0) * (k / 4);
    c.moveTo(xl, y);
    c.quadraticCurveTo(CX, y + bulge * 0.6, xr, y);
  }
  c.stroke();
  // tape
  c.strokeStyle = '#f6f7fb';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(xl, y1);
  c.quadraticCurveTo(CX, y1 + bulge, xr, y1);
  c.stroke();
  // posts
  c.fillStyle = '#2a2d36';
  for (const x of [xl, xr]) {
    rr(c, x - 3, y1 - 3, 6, y0 - y1 + 6, 2);
    c.fill();
  }
}

/* ---------- the card on the Games screen ---------- */
// Your character mid-swing in the foreground, the ball curving over the net,
// Karen fuming at the far end. Drawn at 480x270.
export function card(c, look) {
  const foe = look.char === 'karen' ? FOES.lord404 : FOES.karen;
  const bg = c.createLinearGradient(0, 0, 0, 270);
  bg.addColorStop(0, '#1b1036');
  bg.addColorStop(0.45, '#3a2766');
  bg.addColorStop(0.46, '#6a4532');
  bg.addColorStop(1, '#a87450');
  c.fillStyle = bg;
  c.fillRect(0, 0, 480, 270);
  glow(c, 260, 150, 220, '#fff0d0', 0.3);
  crowd(c, 0.3, 0);
  // the table, from low at the side
  const top = [[60, 200], [460, 200], [400, 150], [150, 150]];
  c.fillStyle = '#163a7a';
  c.fillRect(60, 200, 400, 9);
  c.fillStyle = '#20232c';
  c.fillRect(92, 209, 8, 70);
  c.fillRect(420, 209, 8, 70);
  c.fillStyle = '#2a63b8';
  c.beginPath();
  top.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.9)';
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(64, 198);
  c.lineTo(456, 198);
  c.lineTo(398, 152);
  c.lineTo(152, 152);
  c.closePath();
  c.stroke();
  // Karen behind the far end, cross
  drawHero(c, 322, 108, 60, { look: foe.look, mood: 'angry', t: 0.4, gaze: [-1, 0.5], hair: foe.hair, angry: true, legs: false, calm: true });
  paddle(c, 358, 124, 13, 0.5, foe.paddle);
  // the net
  c.fillStyle = 'rgba(235,240,255,0.35)';
  c.fillRect(292, 150, 3, 52);
  c.fillStyle = 'rgba(20,20,40,0.25)';
  c.beginPath();
  c.moveTo(250, 168);
  c.lineTo(330, 160);
  c.lineTo(330, 186);
  c.lineTo(250, 196);
  c.fill();
  c.strokeStyle = '#f6f7fb';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(250, 168);
  c.lineTo(330, 160);
  c.stroke();
  // the ball's curving trail and the ball
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  let px = 254;
  let py = 128;
  for (let i = 1; i <= 30; i++) {
    const u = i / 30;
    const x = 254 + u * 48 + Math.sin(u * Math.PI) * 10;
    const y = 128 - Math.sin(u * Math.PI) * 52 + u * 4;
    c.strokeStyle = `rgba(255,190,90,${u * u * 0.8})`;
    c.lineWidth = 1 + u * 8;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(x, y);
    c.stroke();
    px = x;
    py = y;
  }
  c.restore();
  glow(c, px, py, 26, '#fff3d6', 0.7);
  c.drawImage(ballSprite(), px - 7, py - 7, 14, 14);
  // you, big in front
  c.fillStyle = 'rgba(10,4,30,0.35)';
  c.beginPath();
  c.ellipse(170, 262, 60, 10, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#3a2620';
  c.lineWidth = 6;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(212, 200);
  c.quadraticCurveTo(240, 196, 250, 160);
  c.stroke();
  drawHero(c, 166, 196, 118, { look, mood: 'happy', t: 0.4, gaze: [1, -0.6], legs: 0, calm: true });
  paddle(c, 252, 138, 26, 0.5, '#d8333a');
  c.fillStyle = '#f4efe6';
  c.beginPath();
  c.arc(250, 160, 7, 0, Math.PI * 2);
  c.fill();
  outlined(c, 'MANAGER!!', 318, 52, 17, '#ff9b8a');
}
