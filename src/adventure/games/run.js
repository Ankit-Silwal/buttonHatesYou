import { W, H, rand, pick, rr, text, dist, drawBobby, drawScore, backdrop, Mouth, Sparks } from '../kit';

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
  const sparks = new Sparks();
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
    sound.jump();
    mouth.maybe(JUMPS, 0.06);
  };

  const crash = (fell) => {
    if (g.over) return;
    g.over = true;
    sound.hit();
    sparks.burst(ME_X, me.y, look.color, 16);
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
        sparks.burst(k.x, k.y, '#ffd84d', 10, 180);
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
      backdrop(c, '#7cc9ff', '#fde6c4');

      // sun, clouds, far hills and near bushes all scroll at their own pace
      c.fillStyle = '#fff3b0';
      c.beginPath();
      c.arc(W - 90, 200, 46, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 4; i++) puff(c, wrap(i * 160 + 40 - scroll * 0.1, 200), 170 + (i % 3) * 70);
      c.fillStyle = '#b9d9a0';
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        c.arc(wrap(i * 150 - scroll * 0.25, 300), GROUND + 20, 120, Math.PI, 0);
        c.fill();
      }
      c.fillStyle = '#86c06a';
      for (let i = 0; i < 7; i++) {
        const x = wrap(i * 95 - scroll * 0.6, 120);
        c.beginPath();
        c.arc(x, GROUND, 28, Math.PI, 0);
        c.arc(x + 30, GROUND, 20, Math.PI, 0);
        c.fill();
      }

      // the ground, with pits cut into it
      c.fillStyle = '#c99a62';
      c.fillRect(0, GROUND, W, H - GROUND);
      c.fillStyle = '#7fbe5d';
      c.fillRect(0, GROUND, W, 14);
      c.fillStyle = '#b3864f';
      for (let x = -(scroll % 60); x < W; x += 60) {
        c.fillRect(x, GROUND + 40, 22, 6);
        c.fillRect(x + 30, GROUND + 110, 16, 6);
        c.fillRect(x + 12, GROUND + 190, 26, 6);
      }
      for (const o of things) if (o.kind === 'gap') pit(c, o);

      for (const k of coins) if (!k.got) coin(c, k, t);
      for (const o of things) {
        if (o.kind === 'box') box(c, o.x, GROUND - o.h, o.w, o.h);
        else if (o.kind === 'boxes') {
          box(c, o.x, GROUND - 40, o.w, 40);
          box(c, o.x + 3, GROUND - 80, o.w - 6, 40);
        } else if (o.kind === 'stapler') stapler(c, o);
        else if (o.kind === 'ad') ad(c, o, t);
      }

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

      cursor(c, cursorX, GROUND - 70 + Math.sin(t * 5) * 6);

      sparks.draw(c);
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

function puff(c, x, y) {
  c.beginPath();
  c.arc(x, y, 22, 0, Math.PI * 2);
  c.arc(x + 26, y - 10, 26, 0, Math.PI * 2);
  c.arc(x + 52, y, 20, 0, Math.PI * 2);
  c.fill();
}

function pit(c, o) {
  const grad = c.createLinearGradient(0, GROUND, 0, H);
  grad.addColorStop(0, '#3b2a1c');
  grad.addColorStop(1, '#120c08');
  c.fillStyle = grad;
  c.fillRect(o.x, GROUND, o.w, H - GROUND);
  c.fillStyle = '#5e8f45';
  c.fillRect(o.x - 3, GROUND, 3, 14);
  c.fillRect(o.x + o.w, GROUND, 3, 14);
}

function box(c, x, y, w, h) {
  c.fillStyle = '#c8955a';
  rr(c, x, y, w, h, 3);
  c.fill();
  c.fillStyle = '#a97a44';
  c.fillRect(x, y, w, 6);
  c.fillStyle = '#e9d8a6';
  c.fillRect(x + w / 2 - 4, y, 8, h);
}

function stapler(c, o) {
  const y = GROUND - o.h;
  c.fillStyle = '#3d3f48';
  rr(c, o.x, y + 18, o.w, 12, 4);
  c.fill();
  c.fillStyle = '#d8433a';
  c.beginPath();
  c.moveTo(o.x + 4, y + 18);
  c.lineTo(o.x + 6, y + 4);
  c.quadraticCurveTo(o.x + o.w * 0.6, y - 2, o.x + o.w, y + 12);
  c.lineTo(o.x + o.w, y + 18);
  c.closePath();
  c.fill();
  c.fillStyle = '#9aa0ab';
  c.beginPath();
  c.arc(o.x + 8, y + 16, 4, 0, Math.PI * 2);
  c.fill();
}

// A popup ad window flying in at duck height.
function ad(c, o, t) {
  const y = AD_BOTTOM - o.h;
  c.fillStyle = 'rgba(0,0,0,0.15)';
  rr(c, o.x + 5, y + 6, o.w, o.h, 6);
  c.fill();
  c.fillStyle = '#ffffff';
  rr(c, o.x, y, o.w, o.h, 6);
  c.fill();
  c.fillStyle = '#3b6fd8';
  rr(c, o.x, y, o.w, 18, 6);
  c.fill();
  c.fillRect(o.x, y + 10, o.w, 8);
  c.fillStyle = '#e0453a';
  rr(c, o.x + o.w - 17, y + 3, 13, 12, 3);
  c.fill();
  text(c, '×', o.x + o.w - 10.5, y + 9, { size: 12 });
  const blink = Math.sin(t * 10) > 0 ? '#e0453a' : '#f2a516';
  text(c, o.label, o.x + o.w / 2, y + 40, { size: 17, color: blink });
  c.fillStyle = '#3fae5a';
  rr(c, o.x + o.w / 2 - 28, y + 55, 56, 17, 5);
  c.fill();
  text(c, 'OK', o.x + o.w / 2, y + 64, { size: 11 });
}

function coin(c, k, t) {
  const squeeze = Math.abs(Math.cos(t * 4 + k.x * 0.02));
  c.fillStyle = '#f2b632';
  c.beginPath();
  c.ellipse(k.x, k.y, 11 * squeeze + 2, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffe27a';
  c.beginPath();
  c.ellipse(k.x, k.y, 6 * squeeze + 1, 7, 0, 0, Math.PI * 2);
  c.fill();
}

// The giant mouse pointer chasing the button, tip at (x, y), pointing right.
function cursor(c, x, y) {
  const pts = [[0, 0], [0, 17], [4, 13], [7, 20], [9.5, 19], [6.5, 12], [12, 12]];
  c.save();
  c.translate(x, y);
  c.rotate(2);
  c.scale(6, 6);
  c.beginPath();
  for (const [px, py] of pts) c.lineTo(px, py);
  c.closePath();
  c.fillStyle = '#ffffff';
  c.fill();
  c.lineWidth = 0.9;
  c.lineJoin = 'round';
  c.strokeStyle = '#1b1b22';
  c.stroke();
  c.restore();
}
