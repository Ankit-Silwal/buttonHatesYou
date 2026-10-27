import { W, H, rand, pick, clamp, rr, text, dist, drawBobby, drawScore, Mouth, Sparks } from '../kit';
import { Fx, sprite, glow, rays, fade, shadow, vignette, hash } from '../fx';

// Run Away: the button grew legs and sprints right, away from your cursor.
const GROUND = Math.round(H * 0.66);
const GRAVITY = 2600;
const JUMP = -820;
const HOLD = 0.24; // how long a held jump keeps floating up
const SIZE = 58;
const FOOT = SIZE * (20 / 38); // center of the button to the soles of its feet
const TALL = 56; // standing hitbox height; ducking shrinks it to about 34
const ME_X = 170;
const PER_METER = 36; // pixels run per meter of score
const START_SPEED = 320;
const TOP_SPEED = 640;
const AD_BOTTOM = GROUND - 44; // ads float just low enough to need a duck

const RUNS = ['Leave me alone!', 'Stop chasing me.', 'Faster, legs!', 'I can hear your mouse.', 'Not today, cursor.'];
const JUMPS = ['Hup.', 'Junk everywhere.', 'Who leaves a stapler here?'];
const DUCKS = ['Not clicking that.', 'No thank you.', 'Ads. Ugh.'];
const COINS = ['Mine.', 'Running money.', 'Not sharing.'];
const CRASH = ['OW.', 'Do not click me.', 'Caught. Great.'];
const ADS = ['YOU WON!', 'FREE RAM', 'CLICK ME', '1 VIRUS!', 'HOT DEALS'];

export default function run({ look, sound, keys }) {
  const me = { y: GROUND - FOOT, vy: 0, ground: true, angle: 0 };
  const things = []; // junk, ads and gaps, in screen x
  const coins = [];
  const mouth = new Mouth();
  const sparks = new Sparks(); // floating score numbers
  const fx = new Fx();
  let dust = 0;
  let press = null; // a pointer press: { y, wait, jumped, swiped }
  let speed = START_SPEED;
  let ran = 0; // pixels run so far
  let bonus = 0;
  let scroll = 0;
  let ahead = 520; // pixels until the next obstacle
  let coinAhead = 900;
  let hold = 0;
  let buffer = 0; // a jump pressed just before landing
  let coyote = 0; // a jump pressed just after running off an edge
  let duckLeft = 0;
  let duck = 0; // 0 standing .. 0.4 fully squashed
  let squash = 0;
  let cursorX = 80;
  let chatter = 3;
  let t = 0;

  const meters = () => Math.floor(ran / PER_METER);

  const addThing = () => {
    const m = meters();
    const kinds = ['box', 'stapler'];
    if (m > 60) kinds.push('ad', 'ad');
    if (m > 150) kinds.push('boxes');
    if (m > 250) kinds.push('gap', 'gap');
    const kind = pick(kinds);
    const x = W + 40;
    let w = 0;
    if (kind === 'box') things.push({ kind, x, w: (w = 44), h: 42 });
    else if (kind === 'stapler') things.push({ kind, x, w: (w = 64), h: 30 });
    else if (kind === 'boxes') things.push({ kind, x, w: (w = 46), h: 80 });
    else if (kind === 'ad') things.push({ kind, x, w: (w = 130), h: 80, label: pick(ADS) });
    else things.push({ kind, x, w: (w = rand(90, 110 + Math.min(40, m * 0.05))), h: 0 });
    ahead = w + rand(speed * 0.95, speed * 1.7) + 120;
  };

  const addCoins = () => {
    const n = pick([1, 1, 3, 3]);
    const y = pick([GROUND - 40, GROUND - 120, GROUND - 170]);
    for (let i = 0; i < n; i++) coins.push({ x: W + 30 + i * 42, y, got: false });
    coinAhead = rand(speed * 2.2, speed * 4);
  };

  // A gap the button's feet are entirely over.
  const overGap = () => things.some((o) => o.kind === 'gap' && ME_X - 8 > o.x && ME_X + 8 < o.x + o.w);

  const jumpNow = () => {
    if (g.over) return;
    if (!me.ground && coyote <= 0) {
      buffer = 0.12;
      return;
    }
    me.vy = JUMP;
    me.ground = false;
    hold = HOLD;
    coyote = 0;
    buffer = 0;
    squash = 0.2;
    for (let i = 0; i < 6; i++) fx.mote(ME_X + rand(-14, 14), GROUND - 2, '#f3d2a2', { vx: rand(-120, 40), vy: rand(-60, -10), r: rand(3, 5), life: 0.45, add: false, drag: 3 });
    sound.jump();
    mouth.maybe(JUMPS, 0.06);
  };

  const crash = (fell) => {
    if (g.over) return;
    g.over = true;
    sound.hit();
    fx.burst(ME_X, me.y, look.color, 22, 320);
    fx.burst(ME_X, me.y, '#ffffff', 10, 260, { size: 2 });
    fx.ring(ME_X, me.y, '#ffd0c0', 90, 0.4);
    mouth.say(fell ? 'AAAAH—' : pick(CRASH), 3);
    if (!fell) {
      me.vy = -480;
      me.ground = false;
    }
  };

  const g = {
    score: 0,
    over: false,
    down(x, y) {
      // wait a moment to tell a tap (jump) from a swipe down (duck)
      press = { y, wait: 0.08, jumped: false, swiped: false };
    },
    move(x, y) {
      if (press && !press.swiped && y - press.y > 36) {
        press.swiped = true;
        duckLeft = 0.45;
        hold = 0;
      }
    },
    up() {
      if (press && !press.jumped && !press.swiped) jumpNow();
      press = null;
    },
    key(code) {
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') jumpNow();
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      fx.update(dt);
      // kicked-up dust while running
      dust -= dt;
      if (me.ground && !g.over && dust <= 0) {
        dust = 0.07;
        fx.mote(ME_X - 10, GROUND - 3, '#e9c495', { vx: -speed * 0.5 + rand(-20, 20), vy: rand(-40, -10), r: rand(2, 3.5), life: 0.35, add: false });
      }
      squash = Math.max(0, squash - dt);
      buffer -= dt;
      coyote -= dt;
      duckLeft -= dt;
      hold -= dt;

      if (press && !press.jumped && !press.swiped) {
        press.wait -= dt;
        if (press.wait <= 0) {
          press.jumped = true;
          jumpNow();
        }
      }

      const ducking = !g.over && (keys.has('ArrowDown') || keys.has('KeyS') || press?.swiped || duckLeft > 0);
      const holding = keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW') || (press?.jumped && !press.swiped);
      duck += ((ducking ? 0.4 : 0) - duck) * Math.min(1, dt * 18);

      // a held jump floats; ducking in the air slams it back down
      let grav = GRAVITY;
      if (ducking && !me.ground) {
        grav *= 1.9;
        hold = 0;
      } else if (holding && hold > 0 && me.vy < 0) grav *= 0.35;

      if (g.over) {
        speed = Math.max(0, speed - 900 * dt);
        me.angle += (me.ground ? 0 : -4) * dt;
      } else speed = Math.min(TOP_SPEED, START_SPEED + t * 4);

      // run off the edge of a gap
      if (me.ground && overGap()) {
        me.ground = false;
        coyote = 0.08;
      }
      if (!me.ground) {
        const before = me.y + FOOT;
        me.vy += grav * dt;
        me.y += me.vy * dt;
        const feet = me.y + FOOT;
        if (feet >= GROUND && before <= GROUND + 2 && !overGap()) {
          me.y = GROUND - FOOT;
          me.vy = 0;
          me.ground = true;
          squash = 0.18;
          for (let i = 0; i < 7; i++) fx.mote(ME_X + rand(-18, 18), GROUND - 2, '#f3d2a2', { vx: rand(-140, 80), vy: rand(-50, -10), r: rand(3, 6), life: 0.5, add: false, drag: 3 });
          if (g.over) me.angle = 0;
          if (buffer > 0) jumpNow();
        } else if (feet > GROUND + 10 && !g.over) crash(true);
      }

      // the cursor creeps closer, and pounces once it is over
      const want = g.over ? ME_X - SIZE * 0.3 : 80 + Math.sin(t * 2.2) * 10;
      cursorX += (want - cursorX) * Math.min(1, dt * (g.over ? 5 : 2));

      const move = speed * dt;
      scroll += move;
      for (const o of things) o.x -= move + (o.kind === 'ad' && speed > 0 ? 50 * dt : 0);
      for (const k of coins) k.x -= move;
      if (g.over) return;

      ran += move;
      ahead -= move;
      coinAhead -= move;
      if (ahead <= 0) addThing();
      if (coinAhead <= 0) addCoins();
      while (things.length && things[0].x + things[0].w < -60) things.shift();
      while (coins.length && coins[0].x < -30) coins.shift();

      // a forgiving box around the button; ducking makes it shorter
      const feet = me.y + FOOT;
      const box = { l: ME_X - SIZE * 0.3, r: ME_X + SIZE * 0.3, t: feet - TALL + duck * 55, b: feet - 2 };
      for (const o of things) {
        if (o.kind === 'gap' || o.x + 4 > box.r || o.x + o.w - 4 < box.l) continue;
        const top = o.kind === 'ad' ? AD_BOTTOM - o.h : GROUND - o.h;
        const bottom = o.kind === 'ad' ? AD_BOTTOM : GROUND;
        if (box.b > top + 4 && box.t < bottom - 2) {
          crash(false);
          return;
        }
        if (o.kind === 'ad' && ducking && !o.ducked && o.x < ME_X) {
          o.ducked = true;
          mouth.maybe(DUCKS, 0.3);
        }
      }

      for (const k of coins) {
        if (k.got || dist(ME_X, me.y + duck * FOOT, k.x, k.y) > SIZE * 0.5 + 12) continue;
        k.got = true;
        bonus += 10;
        sound.pop();
        fx.burst(k.x, k.y, '#ffd84d', 12, 220, { gravity: 200 });
        fx.ring(k.x, k.y, '#ffe9a0', 34, 0.3, 4);
        sparks.float(k.x, k.y - 20, '+10', '#ffe27a');
        mouth.maybe(COINS, 0.1);
      }

      chatter -= dt;
      if (chatter <= 0) {
        chatter = rand(5, 9);
        mouth.maybe(RUNS, 0.6);
      }

      g.score = meters() + bonus;
    },

    draw(c) {
      scenery(c, scroll, t);
      for (const o of things) if (o.kind === 'gap') pit(c, o);

      for (const k of coins) if (!k.got) coin(c, k, t);
      for (const o of things) {
        if (o.kind !== 'gap') shadow(c, o.x + o.w / 2, GROUND + 1, o.w * 0.65, o.kind === 'ad' ? 0.15 : 0.4);
        if (o.kind === 'box') box(c, o.x, GROUND - o.h, o.w, o.h);
        else if (o.kind === 'boxes') {
          box(c, o.x, GROUND - 40, o.w, 40);
          box(c, o.x + 3, GROUND - 80, o.w - 6, 40);
        } else if (o.kind === 'stapler') stapler(c, o);
        else if (o.kind === 'ad') ad(c, o, t);
      }

      // a shadow on the ground that shrinks as it jumps
      const lift = GROUND - (me.y + FOOT);
      if (lift > 2 && !overGap()) shadow(c, ME_X, GROUND + 2, SIZE * 0.5 * clamp(1 - lift / 300, 0.3, 1), 0.35 * clamp(1 - lift / 300, 0.2, 1));
      speedLines(c, t, (speed - START_SPEED) / (TOP_SPEED - START_SPEED));

      // squash down for a duck, keeping the feet on the floor
      const sq = Math.max(duck, squash);
      drawBobby(c, ME_X, me.y + FOOT * sq, SIZE, {
        look,
        t,
        squash: sq,
        angle: me.angle,
        moving: !g.over && me.ground,
        mood: g.over ? 'sad' : duck > 0.2 ? 'worried' : !me.ground ? 'shout' : 'angry',
        tears: g.over,
      });

      cursor(c, cursorX, GROUND - 70 + Math.sin(t * 5) * 6, t);

      fx.draw(c);
      sparks.draw(c);
      vignette(c, 0.3, '#2a1030');
      mouth.draw(c, ME_X + 20, me.y - SIZE * 0.6);

      drawScore(c, g.score, t < 4 ? 'Tap to jump · swipe down to duck' : 'meters');
    },
  };
  return g;
}

// Wraps a scrolling x so things loop around the screen.
function wrap(x, pad) {
  const span = W + pad * 2;
  return (((x + pad) % span) + span) % span - pad;
}

/* ---------- art ---------- */

// A layer that repeats every W pixels, scrolled by `x` (drawn twice).
function strip(c, spr, x, y) {
  // whole pixels, overlapping by one, so no seam shows between the copies
  const o = -Math.round(((x % W) + W) % W);
  c.drawImage(spr, o, y, W + 1, spr.height);
  c.drawImage(spr, o + W, y, W + 1, spr.height);
}

// A sunset sky with a low sun, painted once.
function skyArt() {
  return sprite('run:sky', W, GROUND + 20, (c) => {
    const g = c.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, '#24357e');
    g.addColorStop(0.35, '#6a5cb4');
    g.addColorStop(0.62, '#e77e9b');
    g.addColorStop(0.85, '#ffbf7a');
    g.addColorStop(1, '#ffe2a6');
    c.fillStyle = g;
    c.fillRect(0, 0, W, GROUND + 20);
    const sun = c.createRadialGradient(W - 120, GROUND - 170, 0, W - 120, GROUND - 170, 300);
    sun.addColorStop(0, 'rgba(255,250,225,1)');
    sun.addColorStop(0.1, 'rgba(255,236,180,0.95)');
    sun.addColorStop(0.14, 'rgba(255,200,140,0.55)');
    sun.addColorStop(0.45, 'rgba(255,150,120,0.22)');
    sun.addColorStop(1, 'rgba(255,150,120,0)');
    c.fillStyle = sun;
    c.fillRect(0, 0, W, GROUND + 20);
    for (let i = 0; i < 40; i++) {
      c.fillStyle = `rgba(255,255,255,${0.15 + hash(i) * 0.4})`;
      c.fillRect(hash(i + 1) * W, hash(i + 2) * 160, 1.5, 1.5);
    }
  });
}

// Far mountains, then rolling hills with trees, then near bushes: each
// tileable and lit from the sun behind them.
function mountains() {
  return sprite('run:mtn', W, 260, (c) => {
    c.beginPath();
    c.moveTo(0, 260);
    for (let x = 0; x <= W; x += 6) {
      const y = 120 - Math.abs(Math.sin((x / W) * Math.PI * 3)) * 70 - Math.sin((x / W) * Math.PI * 8) * 12;
      c.lineTo(x, y);
    }
    c.lineTo(W, 260);
    const g = c.createLinearGradient(0, 40, 0, 260);
    g.addColorStop(0, '#9b78b8');
    g.addColorStop(1, '#f3a98e');
    c.fillStyle = g;
    c.fill();
    // snowy sunlit ridges
    c.save();
    c.clip();
    c.strokeStyle = 'rgba(255,230,210,0.5)';
    c.lineWidth = 2;
    c.beginPath();
    for (let x = 0; x <= W; x += 6) {
      const y = 120 - Math.abs(Math.sin((x / W) * Math.PI * 3)) * 70 - Math.sin((x / W) * Math.PI * 8) * 12;
      c.lineTo(x, y + 1);
    }
    c.stroke();
    c.restore();
  });
}

function hillsArt() {
  return sprite('run:hills', W, 200, (c) => {
    const f = (x) => 90 - Math.sin((x / W) * Math.PI * 4) * 26 - Math.sin((x / W) * Math.PI * 10 + 1) * 8;
    const path = () => {
      c.beginPath();
      c.moveTo(0, 200);
      for (let x = 0; x <= W; x += 6) c.lineTo(x, f(x));
      c.lineTo(W, 200);
    };
    for (let k = 0; k < 10; k++) {
      // poplar trees standing on the hills
      const x = (k + 0.3 + hash(k) * 0.5) * (W / 10);
      const y = f(x);
      const h = 26 + hash(k + 5) * 20;
      c.fillStyle = '#5f7a74';
      c.beginPath();
      c.ellipse(x, y - h / 2, 6 + hash(k + 2) * 3, h / 2 + 4, 0, 0, Math.PI * 2);
      c.fill();
    }
    path();
    const g = c.createLinearGradient(0, 50, 0, 200);
    g.addColorStop(0, '#6f9a68');
    g.addColorStop(1, '#3d6a48');
    c.fillStyle = g;
    c.fill();
    c.save();
    path();
    c.clip();
    // warm haze along the top edge
    const hz = c.createLinearGradient(0, 50, 0, 130);
    hz.addColorStop(0, 'rgba(255,190,140,0.3)');
    hz.addColorStop(1, 'rgba(255,190,140,0)');
    c.fillStyle = hz;
    c.fillRect(0, 0, W, 200);
    c.restore();
  });
}

function bushesArt() {
  return sprite('run:bush', W, 80, (c) => {
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const x = i * 60 + hash(i) * 20;
      for (const [dx, r] of [
        [0, 26],
        [26, 20],
        [-20, 16],
      ]) {
        const rr2 = r * (0.8 + hash(i + dx) * 0.4);
        c.moveTo(x + dx + rr2, 80);
        c.arc(x + dx, 80, rr2, Math.PI, 0);
      }
    }
    // repeat across the seam
    for (const x of [-30, W + 30]) {
      c.moveTo(x + 26, 80);
      c.arc(x, 80, 26, Math.PI, 0);
    }
    const g = c.createLinearGradient(0, 40, 0, 80);
    g.addColorStop(0, '#5c9a4a');
    g.addColorStop(1, '#2f5f34');
    c.fillStyle = g;
    c.fill();
    // a warm rim of sunset light along the tops
    c.save();
    c.clip();
    const rim = c.createLinearGradient(0, 40, 0, 66);
    rim.addColorStop(0, 'rgba(255,200,130,0.55)');
    rim.addColorStop(1, 'rgba(255,200,130,0)');
    c.fillStyle = rim;
    c.fillRect(0, 0, W, 80);
    c.restore();
  });
}

// The ground: grass lip, layered soil, pebbles; tileable.
function groundArt() {
  const h = H - GROUND;
  return sprite('run:ground', W, h, (c) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#b07a48');
    g.addColorStop(0.3, '#8d5d36');
    g.addColorStop(1, '#2e1c11');
    c.fillStyle = g;
    c.fillRect(0, 0, W, h);
    // strata
    for (let i = 0; i < 4; i++) {
      c.fillStyle = `rgba(0,0,0,${0.06 + i * 0.02})`;
      c.beginPath();
      const y0 = 50 + i * 55;
      c.moveTo(0, y0);
      for (let x = 0; x <= W; x += 12) c.lineTo(x, y0 + Math.sin((x / W) * Math.PI * 2 * (i + 2)) * 6);
      c.lineTo(W, y0 + 14);
      c.lineTo(0, y0 + 14);
      c.fill();
    }
    // pebbles
    for (let i = 0; i < 70; i++) {
      const x = hash(i) * W;
      const y = 26 + hash(i + 70) * (h - 30);
      const r = 2 + hash(i + 140) * 4;
      const pg = c.createLinearGradient(0, y - r, 0, y + r);
      pg.addColorStop(0, '#d6b48c');
      pg.addColorStop(1, '#6e4a2c');
      c.fillStyle = pg;
      c.beginPath();
      c.ellipse(x, y, r * 1.3, r, 0, 0, Math.PI * 2);
      c.fill();
    }
    // grass lip
    const gg = c.createLinearGradient(0, 0, 0, 18);
    gg.addColorStop(0, '#a6dd6a');
    gg.addColorStop(1, '#4f9a3c');
    c.fillStyle = gg;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(W, 0);
    c.lineTo(W, 14);
    for (let x = W; x >= 0; x -= 8) c.lineTo(x, 14 + (hash(x) * 6));
    c.fill();
    c.fillStyle = 'rgba(255,255,220,0.55)';
    c.fillRect(0, 0, W, 2);
    // shadow under the lip
    const sh = c.createLinearGradient(0, 14, 0, 32);
    sh.addColorStop(0, 'rgba(30,15,5,0.35)');
    sh.addColorStop(1, 'rgba(30,15,5,0)');
    c.fillStyle = sh;
    c.fillRect(0, 14, W, 18);
  });
}

function pit(c, o) {
  const s = sprite('run:pit', 4, 256, (k) => {
    const g = k.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#2a1a10');
    g.addColorStop(0.3, '#0d0805');
    g.addColorStop(1, '#000000');
    k.fillStyle = g;
    k.fillRect(0, 0, 4, 256);
  });
  c.drawImage(s, o.x, GROUND, o.w, H - GROUND);
  // the walls: lit edge on the far side, shadow on the near
  c.fillStyle = 'rgba(176,122,72,0.6)';
  c.fillRect(o.x + o.w - 6, GROUND, 6, H - GROUND);
  c.fillStyle = 'rgba(0,0,0,0.5)';
  c.fillRect(o.x, GROUND, 8, H - GROUND);
  c.fillStyle = '#6fb04a';
  c.fillRect(o.x - 3, GROUND, 3, 14);
  c.fillRect(o.x + o.w, GROUND, 3, 14);
}

function scenery(c, scroll, t) {
  c.drawImage(skyArt(), 0, 0);
  rays(c, W - 120, GROUND - 170, 380, '#ffd9a0', 0.2, t * 0.03);
  c.globalAlpha = 0.85;
  const p = puffSprite();
  for (let i = 0; i < 4; i++) c.drawImage(p, wrap(i * 160 + 40 - scroll * 0.1, 200), 140 + (i % 3) * 64);
  c.globalAlpha = 1;
  strip(c, mountains(), scroll * 0.06, GROUND - 250);
  strip(c, hillsArt(), scroll * 0.25, GROUND - 150);
  // haze where the far land meets the ground
  fade(c, 0, GROUND - 90, W, 90, '#ffcf9a', 0, 0.35);
  strip(c, bushesArt(), scroll * 0.6, GROUND - 80);
  strip(c, groundArt(), scroll, GROUND);
}

function puffSprite() {
  return sprite('run:puff', 110, 70, (c) => {
    const g = c.createLinearGradient(0, 10, 0, 60);
    g.addColorStop(0, '#fff2e0');
    g.addColorStop(0.6, '#ffc2a8');
    g.addColorStop(1, '#c983a8');
    c.fillStyle = g;
    c.shadowColor = 'rgba(255,220,200,0.6)';
    c.shadowBlur = 10;
    c.beginPath();
    c.moveTo(30, 42);
    c.arc(22, 42, 20, 0, Math.PI * 2);
    c.moveTo(70, 32);
    c.arc(48, 32, 24, 0, Math.PI * 2);
    c.moveTo(92, 42);
    c.arc(74, 42, 18, 0, Math.PI * 2);
    c.fill();
  });
}

function box(c, x, y, w, h) {
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, '#e2ad6c');
  g.addColorStop(0.7, '#c38a4c');
  g.addColorStop(1, '#94632f');
  c.fillStyle = g;
  rr(c, x, y, w, h, 3);
  c.fill();
  c.fillStyle = 'rgba(255,240,210,0.6)';
  c.fillRect(x + 1, y, w - 2, 2);
  c.fillStyle = 'rgba(80,45,15,0.35)';
  c.fillRect(x, y + 4, w, 4);
  c.fillStyle = '#efdcae';
  c.fillRect(x + w / 2 - 4, y, 8, h);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.fillRect(x + w / 2 - 4, y, 2, h);
  // a "this way up" mark
  c.strokeStyle = 'rgba(90,50,20,0.45)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x + 7, y + h - 8);
  c.lineTo(x + 7, y + h - 16);
  c.moveTo(x + 4, y + h - 13);
  c.lineTo(x + 7, y + h - 16);
  c.lineTo(x + 10, y + h - 13);
  c.stroke();
}

function stapler(c, o) {
  const y = GROUND - o.h;
  const base = c.createLinearGradient(0, y + 18, 0, y + 30);
  base.addColorStop(0, '#6a6e7c');
  base.addColorStop(1, '#22242c');
  c.fillStyle = base;
  rr(c, o.x, y + 18, o.w, 12, 4);
  c.fill();
  const top = c.createLinearGradient(0, y, 0, y + 18);
  top.addColorStop(0, '#ff7a6a');
  top.addColorStop(0.5, '#d8433a');
  top.addColorStop(1, '#8e1f1a');
  c.fillStyle = top;
  c.beginPath();
  c.moveTo(o.x + 4, y + 18);
  c.lineTo(o.x + 6, y + 4);
  c.quadraticCurveTo(o.x + o.w * 0.6, y - 2, o.x + o.w, y + 12);
  c.lineTo(o.x + o.w, y + 18);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(255,220,210,0.7)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(o.x + 8, y + 5);
  c.quadraticCurveTo(o.x + o.w * 0.55, y + 0.5, o.x + o.w - 4, y + 10);
  c.stroke();
  c.fillStyle = '#c8ccd6';
  c.beginPath();
  c.arc(o.x + 8, y + 16, 4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#fff';
  c.fillRect(o.x + 6.5, y + 14, 1.5, 1.5);
}

// A popup ad window flying in at duck height, glossy and glowing.
function ad(c, o, t) {
  const y = AD_BOTTOM - o.h;
  const blink = Math.sin(t * 10) > 0;
  glow(c, o.x + o.w / 2, y + o.h / 2, o.w * 0.85, blink ? '#ff5a4a' : '#ffb340', 0.35);
  c.fillStyle = 'rgba(20,10,30,0.25)';
  rr(c, o.x + 6, y + 8, o.w, o.h, 6);
  c.fill();
  const body = c.createLinearGradient(0, y, 0, y + o.h);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(1, '#e3e8f2');
  c.fillStyle = body;
  rr(c, o.x, y, o.w, o.h, 6);
  c.fill();
  const bar = c.createLinearGradient(0, y, 0, y + 18);
  bar.addColorStop(0, '#6f9bff');
  bar.addColorStop(1, '#2f5ac8');
  c.fillStyle = bar;
  rr(c, o.x, y, o.w, 18, 6);
  c.fill();
  c.fillRect(o.x, y + 10, o.w, 8);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.fillRect(o.x + 4, y + 2, o.w - 8, 4);
  c.fillStyle = '#e0453a';
  rr(c, o.x + o.w - 17, y + 3, 13, 12, 3);
  c.fill();
  text(c, '×', o.x + o.w - 10.5, y + 9, { size: 12 });
  text(c, o.label, o.x + o.w / 2, y + 40, { size: 17, color: blink ? '#e0453a' : '#f2a516' });
  const ok = c.createLinearGradient(0, y + 55, 0, y + 72);
  ok.addColorStop(0, '#6bd486');
  ok.addColorStop(1, '#2f9a4a');
  c.fillStyle = ok;
  rr(c, o.x + o.w / 2 - 28, y + 55, 56, 17, 5);
  c.fill();
  text(c, 'OK', o.x + o.w / 2, y + 64, { size: 11 });
}

function coin(c, k, t) {
  const squeeze = Math.abs(Math.cos(t * 4 + k.x * 0.02));
  glow(c, k.x, k.y, 30, '#ffc23a', 0.45);
  c.fillStyle = '#b9781a';
  c.beginPath();
  c.ellipse(k.x, k.y, 11 * squeeze + 2, 12, 0, 0, Math.PI * 2);
  c.fill();
  const g = c.createLinearGradient(k.x - 10, k.y - 12, k.x + 10, k.y + 12);
  g.addColorStop(0, '#fff2a8');
  g.addColorStop(0.5, '#f2b632');
  g.addColorStop(1, '#c98a1a');
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(k.x, k.y, 10 * squeeze + 1.5, 11, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255,240,170,0.9)';
  c.beginPath();
  c.ellipse(k.x, k.y, 5 * squeeze + 0.8, 6.5, 0, 0, Math.PI * 2);
  c.fill();
  // a glint sweeping round
  const ph = (t * 1.3 + k.x * 0.003) % 1;
  if (ph < 0.25) glow(c, k.x - 5 * squeeze, k.y - 6, 10, '#ffffff', 1 - ph * 4);
}

// The giant mouse pointer chasing the button, tip at (x, y), pointing right.
const CURSOR = [[0, 0], [0, 17], [4, 13], [7, 20], [9.5, 19], [6.5, 12], [12, 12]];
function cursor(c, x, y, t) {
  glow(c, x - 30, y - 10, 120, '#ff4060', 0.18 + Math.sin(t * 4) * 0.06);
  c.save();
  c.translate(x, y);
  c.rotate(2);
  c.scale(6, 6);
  // drop shadow
  c.save();
  c.translate(1.2, -1.4);
  c.beginPath();
  for (const [px, py] of CURSOR) c.lineTo(px, py);
  c.closePath();
  c.fillStyle = 'rgba(20,10,40,0.3)';
  c.fill();
  c.restore();
  c.beginPath();
  for (const [px, py] of CURSOR) c.lineTo(px, py);
  c.closePath();
  const g = c.createLinearGradient(0, 0, 10, 18);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#c9cfe0');
  c.fillStyle = g;
  c.fill();
  c.lineWidth = 0.9;
  c.lineJoin = 'round';
  c.strokeStyle = '#1b1b22';
  c.stroke();
  c.restore();
}

// Streaks of wind once the run gets fast.
function speedLines(c, t, a) {
  if (a <= 0) return;
  c.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const ph = (t * (1.6 + hash(i) * 0.8) + hash(i + 3)) % 1;
    const x = W - ph * (W + 200);
    const y = 140 + hash(i + 9) * (GROUND - 160);
    c.strokeStyle = `rgba(255,255,255,${a * 0.35 * Math.sin(ph * Math.PI)})`;
    c.lineWidth = 1.5 + hash(i + 1) * 1.5;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 60 + hash(i + 2) * 80, y);
    c.stroke();
  }
}
