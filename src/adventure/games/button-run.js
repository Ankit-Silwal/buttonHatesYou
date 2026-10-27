import { W, H, rand, pick, clamp, rr, text, drawBobby, drawScore, Mouth, Sparks } from '../kit';
import { cursorShape } from '@/reason/draw';

// Button Run: a 3D dash down three lanes of a giant keyboard, seen from just
// behind the button. The world is in meters: x across (lanes at -1.6, 0, 1.6),
// y up, z ahead of the button (which always sits at z = 0). Everything is
// projected with one fixed-pitch camera and painted far to near.
const LANE = 1.6;
const LANES = [-LANE, 0, LANE];
const HOR = 360; // the horizon, in screen pixels
const F = 360; // focal length, pixels per meter at 1 m away
const CAM_BACK = 4.5; // camera distance behind the button
const CAM_UP = 3;
const NEAR = -2.3; // nothing is drawn closer than this
const FAR = 75; // or further than this
const TILE = 2; // keycap length along the track

const GRAVITY = 38;
const JUMP = 12.5; // about 2 m high
const SPRING_JUMP = 18; // about 4 m: over a train
const FLY = 5; // cruising height with wings
const BODY = 0.9; // the button is 0.9 m wide...
const TALL = 1; // ...1 m tall standing, 0.5 m sliding
const LOW = 0.5;
const PZ = 0.3; // half its depth
const SHIFT = 13; // lane change speed, m/s
const START_SPEED = 13;
const TOP_SPEED = 28;
const SPAM_SPEED = 7; // extra speed of an oncoming spam train
const TRAIN_TOP = 2.4;
const RAMP = 4;
const AD_LOW = 1.15; // popup ads float just high enough to slide under
const COIN = 5;

export const POWERS = {
  magnet: { icon: '🧲', name: 'Magnet', color: '#e0453a', time: 10 },
  wings: { icon: '🪽', name: 'Wings', color: '#7cc9ff', time: 7 },
  spring: { icon: '👟', name: 'Spring shoes', color: '#7cc6a4', time: 10 },
  bubble: { icon: '🫧', name: 'Bubble wrap', color: '#a7e3ff', time: 0 }, // until it pops
  ghost: { icon: '🕶️', name: 'Incognito', color: '#a58bd6', time: 6 },
  double: { icon: 'x2', name: 'Double coins', color: '#f2c14e', time: 15 },
};

const RUNS = ['You again?', 'Stop following me!', 'This keyboard is huge.', 'I can hear your mouse.', 'Leave me alone!', 'Why is everything a key?'];
const GOT = {
  magnet: 'Money, come here.',
  wings: 'I am a bird now. Bye.',
  spring: 'Boing. Respectfully.',
  bubble: 'Wrapped. Untouchable.',
  ghost: 'Incognito. You can’t see me.',
  double: 'Double coins, double spite.',
};
const BUMPS = ['Ow, my side!', 'It is RIGHT behind me!', 'Not a wall. NOT a wall.'];
const CRASH = ['Clicked. Again.', 'OW.', 'Fine. You win. For now.'];
const POPS = ['My bubble!', 'Pop. Rude.'];
const KEYS = ['ESC', 'DEL', 'ALT', 'F1', 'TAB', 'END'];
const ADS = ['YOU WON!', 'FREE RAM', 'CLICK ME', 'HOT DEALS', '1 VIRUS!'];
const SERVERS = ['SERVER', 'CLOUD', 'BACKUP'];

export default function buttonRun({ look, sound }) {
  const me = { lane: 1, from: 1, x: 0, y: 0, vy: 0, ground: true, gh: 0, slide: 0, squash: 0, spin: 0 };
  const things = []; // obstacles: { kind, lane, z, len, ... }, z = the end nearest the button
  const coins = []; // { x, y, z }
  const pickups = []; // power-ups waiting on the track: { kind, x, z }
  const decor = []; // pencils, mugs and books along the sides of the desk
  const active = {}; // power -> seconds left
  const laneEnd = [0, 0, 0]; // where the last thing in each lane ends
  const cam = { x: 0, y: CAM_UP };
  const mouth = new Mouth();
  const sparks = new Sparks();
  let press = null; // a pointer press: { x, y, done }
  let speed = START_SPEED;
  let dist = 0;
  let coinPts = 0;
  let coinCount = 0;
  let rowZ = 48; // where the next row of obstacles goes
  let decorZ = 0;
  let nextPower = 120; // meters run before the next power-up shows up
  let safe = 0; // a short spell of not getting hit, after a pop or a landing
  let chase = 0; // after a bump the cursor is right behind you
  let buffer = 0; // a jump pressed just before landing
  let chatter = 4;
  let overT = 0;
  let t = 0;

  // world -> screen: [x, y, pixels per meter]
  const P = (x, y, z) => {
    const s = F / (z + CAM_BACK);
    return [W / 2 + (x - cam.x) * s, HOR + (cam.y - y) * s, s];
  };

  /* ---------- building the track ---------- */
  const coinLine = (lane, z0, n, height = () => 0.6) => {
    for (let i = 0; i < n; i++) {
      const z = z0 + i * 1.6;
      coins.push({ x: LANES[lane], y: height(z), z });
    }
  };

  const add = (o) => {
    things.push(o);
    if (o.lane != null) laneEnd[o.lane] = Math.max(laneEnd[o.lane], o.z + o.len);
  };

  const spawnRow = (z) => {
    const gap = clamp(speed * 1.1, 14, 24) + rand(0, 6);
    const r = Math.random();

    // a loading bar across the whole track: jump it
    if (dist > 250 && r < 0.1) {
      add({ kind: 'bar', z, len: 0.3, pct: rand(0.6, 0.97) });
      coinLine(pick([0, 1, 2]), z - 4, 6, (cz) => 0.6 + Math.max(0, 1.7 * (1 - ((cz - z) / 4.5) ** 2)));
      rowZ = z + gap;
      return;
    }

    // trains of servers (some with a ramp to run up) and oncoming spam
    if (dist > 80 && r < 0.38) {
      const lanes = shuffle([0, 1, 2]).slice(0, dist > 400 && Math.random() < 0.4 ? 2 : 1);
      // spam only comes when it can't catch up with anything still on the
      // track, so it never corners you between two other trains
      const last = Math.max(...laneEnd);
      const room = z - last > (SPAM_SPEED * (last + 3)) / speed + 3;
      let far = z;
      for (const l of lanes) {
        const len = rand(10, 16);
        const moving = dist > 300 && room && Math.random() < 0.4;
        const ramp = !moving && Math.random() < 0.5;
        const tz = ramp ? z + RAMP : z;
        if (ramp) {
          add({ kind: 'ramp', lane: l, z, len: RAMP });
          coinLine(l, z + 0.5, 9, (cz) => 0.6 + clamp((cz - z) / RAMP, 0, 1) * TRAIN_TOP);
        }
        add({ kind: 'train', lane: l, z: tz, len, top: TRAIN_TOP, moving, label: moving ? 'SPAM' : pick(SERVERS) });
        far = Math.max(far, tz + len);
      }
      const free = [0, 1, 2].filter((l) => !lanes.includes(l));
      if (Math.random() < 0.6) coinLine(pick(free), z, 6);
      else if (dist > 500) add({ kind: 'block', lane: pick(free), z: z + rand(2, 8), len: 0.7, label: pick(KEYS) });
      rowZ = far + gap * 0.6;
      return;
    }

    // a row of single obstacles, one per lane at most
    const pool = ['none', 'none', 'block'];
    if (dist > 40) pool.push('ad');
    if (dist > 120) pool.push('wall');
    if (dist > 220) pool.push('hole');
    if (dist > 350) pool.push('click');
    const row = [0, 1, 2].map(() => pick(pool));
    let clicks = 0;
    row.forEach((k, l) => {
      if (k === 'click' && clicks++) row[l] = 'none';
    });
    if (row.every((k) => k === 'wall' || k === 'click')) row[pick([0, 1, 2])] = 'none';
    if (row.every((k) => k === 'none')) row[pick([0, 1, 2])] = 'block';

    row.forEach((kind, lane) => {
      if (kind === 'block') add({ kind, lane, z, len: 0.7, label: pick(KEYS) });
      else if (kind === 'ad') add({ kind, lane, z, len: 0.25, label: pick(ADS) });
      else if (kind === 'wall') add({ kind, lane, z, len: 1 });
      else if (kind === 'hole') add({ kind, lane, z: z - 1.4, len: 3.4 });
      else if (kind === 'click') add({ kind, lane, z, len: 1.2, cy: 7, slammed: false });
    });

    // coins down an open lane, or arcing over something jumpable
    const open = row.map((k, l) => [k, l]).filter(([k]) => k === 'none' || k === 'block' || k === 'hole');
    if (open.length && Math.random() < 0.6) {
      const [k, l] = pick(open);
      if (k === 'none') coinLine(l, z - 3, 6);
      else coinLine(l, z - 4, 6, (cz) => 0.6 + Math.max(0, 1.7 * (1 - ((cz - z) / 4.5) ** 2)));
    }

    // and now and then a power-up in an empty lane
    const empty = row.map((k, l) => [k, l]).filter(([k]) => k === 'none');
    if (dist >= nextPower && empty.length) {
      const kind = pick(Object.keys(POWERS));
      pickups.push({ kind, x: LANES[pick(empty)[1]], z: z + 3 });
      nextPower = dist + rand(200, 340);
    }
    rowZ = z + gap;
  };

  const spawnDecor = (z) => {
    for (const side of [-1, 1]) {
      const x = side * rand(3.2, 4.4);
      const r = Math.random();
      if (r < 0.45) decor.push({ kind: 'pencil', x, z: z + rand(0, 3), h: rand(2.2, 4.6), color: pick(['#f2c14e', '#5b9bd5', '#7cc6a4', '#e2674f']) });
      else if (r < 0.7) decor.push({ kind: 'mug', x, z: z + rand(0, 3), color: pick(['#ffffff', '#f39ac0', '#4a5a85']) });
      else decor.push({ kind: 'books', x, z: z + rand(0, 3), n: pick([2, 3, 4]), colors: shuffle(['#c0392b', '#3b77ad', '#549c7c', '#c99a2e', '#7c63ad']) });
    }
    decorZ = z + rand(5, 9);
  };

  /* ---------- the button ---------- */
  const jumpNow = () => {
    if (g.over || active.wings) return;
    if (!me.ground) {
      buffer = 0.15;
      return;
    }
    me.vy = active.spring ? SPRING_JUMP : JUMP;
    me.ground = false;
    me.slide = 0;
    buffer = 0;
    me.squash = 0.2;
    sound.jump();
  };

  const slideNow = () => {
    if (g.over || active.wings) return;
    me.slide = 0.7;
    if (!me.ground) me.vy = Math.min(me.vy, -16); // slam back down
    sound.tone(260, 0.12, 'sine', 0.3, 130);
  };

  const shift = (dir) => {
    if (g.over) return;
    const to = clamp(me.lane + dir, 0, 2);
    if (to === me.lane) {
      me.squash = 0.12;
      return;
    }
    me.from = me.lane;
    me.lane = to;
    sound.tone(520, 0.06, 'triangle', 0.25, 700);
  };

  const power = (kind) => {
    const p = POWERS[kind];
    active[kind] = p.time || 1;
    sound.win();
    mouth.say(GOT[kind], 2);
    if (kind === 'wings') {
      // a trail of coins up in the sky
      let lane = me.lane;
      for (let z = 6; z < speed * (p.time - 1); z += 2.2) {
        if (Math.random() < 0.12) lane = clamp(lane + pick([-1, 1]), 0, 2);
        coins.push({ x: LANES[lane], y: FLY + 0.5, z });
      }
    }
  };

  const crash = (fell) => {
    if (g.over) return;
    g.over = true;
    sound.crash();
    const [sx, sy] = P(me.x, me.y + 0.5, 0);
    sparks.burst(sx, sy, look.color, 18);
    mouth.say(fell ? 'AAAAH—' : pick(CRASH), 3);
    if (!fell) {
      me.vy = 9;
      me.ground = false;
    }
  };

  // Brushed the side of something while changing lanes: bounce back, and the
  // cursor catches up. Do it twice in a row and it has you.
  const bump = () => {
    if (chase > 0) return crash(false);
    chase = 5;
    safe = 0.6;
    me.lane = me.from;
    sound.thud();
    mouth.say(pick(BUMPS), 1.6);
  };

  // What the button stands on right now: the desk, a train roof, a ramp, or
  // nothing at all over a hole.
  const groundUnder = () => {
    let gh = 0;
    for (const o of things) {
      if (o.lane == null || Math.abs(LANES[o.lane] - me.x) > 0.75) continue;
      if (o.kind === 'hole' && Math.abs(LANES[o.lane] - me.x) < 0.45 && o.z + 0.3 < 0 && o.z + o.len - 0.3 > 0) gh = -20;
      else if (o.kind === 'train' && o.z < PZ && o.z + o.len > -PZ && me.y >= o.top - 0.5) gh = Math.max(gh, o.top);
      else if (o.kind === 'ramp' && o.z < 0 && o.z + o.len > 0) {
        const s = (-o.z / o.len) * TRAIN_TOP;
        if (me.y >= s - 0.6) gh = Math.max(gh, s);
      }
    }
    return gh;
  };

  const physics = (dt) => {
    const gh = groundUnder();
    me.gh = gh;
    if (active.wings) {
      me.y += (FLY - me.y) * Math.min(1, dt * 4);
      me.vy = 0;
      me.ground = false;
      return;
    }
    if (me.ground) {
      if (gh < me.y - 0.05) {
        me.ground = false; // ran off the end of a roof, or over a hole
        me.vy = 0;
      } else me.y = gh;
    }
    if (!me.ground) {
      me.vy -= GRAVITY * (me.slide > 0 ? 1.8 : 1) * dt;
      me.y += me.vy * dt;
      if (me.vy <= 0 && me.y <= gh && me.y > gh - 0.6) {
        me.y = gh;
        me.vy = 0;
        me.ground = true;
        me.squash = 0.18;
        if (g.over) me.spin = 0;
        if (buffer > 0) jumpNow();
      } else if (me.y < -0.8 && !g.over) crash(true);
    }
  };

  const hits = () => {
    const box = { x0: me.x - 0.38, x1: me.x + 0.38, y0: me.y + 0.05, y1: me.y + (me.slide > 0 ? LOW : TALL) };
    for (const o of things) {
      const hb = hitOf(o);
      if (!hb) continue;
      const was = o.inZ;
      o.inZ = o.z < PZ && o.z + o.len > -PZ;
      if (!o.inZ) continue;
      if (hb.x1 <= box.x0 || hb.x0 >= box.x1 || hb.y1 <= box.y0 || hb.y0 >= box.y1) continue;
      if (safe > 0 || active.ghost) continue;
      if (active.bubble) {
        delete active.bubble;
        safe = 1.2;
        sound.crack();
        const [sx, sy] = P(me.x, me.y + 0.5, 0);
        sparks.burst(sx, sy, '#cdefff', 16, 260);
        mouth.say(pick(POPS), 1.4);
        continue;
      }
      // already alongside it before this frame: we swerved into its side
      if (was) bump();
      else crash(false);
      if (g.over) return;
    }
  };

  const collect = (dt) => {
    const magnet = active.magnet > 0;
    for (const k of coins) {
      if (magnet && k.z < 14 && k.z > -1) {
        const f = Math.min(1, dt * 9);
        k.x += (me.x - k.x) * f;
        k.y += (me.y + 0.5 - k.y) * f;
        k.z += -k.z * f;
      }
      if (Math.abs(k.z) < 0.7 && Math.abs(k.x - me.x) < 0.75 && Math.abs(k.y - (me.y + 0.5)) < 0.95) {
        k.got = true;
        const worth = active.double ? COIN * 2 : COIN;
        coinPts += worth;
        coinCount++;
        sound.tone(1320, 0.06, 'square', 0.12, 1760);
        const [sx, sy] = P(k.x, k.y, Math.max(k.z, 0));
        sparks.burst(sx, sy, '#ffd84d', 6, 140);
      }
    }
    for (const p of pickups) {
      if (Math.abs(p.z) < 0.8 && Math.abs(p.x - me.x) < 0.8 && me.y < 2.5) {
        p.got = true;
        power(p.kind);
        const [sx, sy] = P(p.x, 1, 0);
        sparks.burst(sx, sy, POWERS[p.kind].color, 20, 260);
      }
    }
  };

  const step = (dt) => {
    if (g.over) {
      overT += dt;
      speed = Math.max(0, speed - 30 * dt);
      me.spin += dt * 5;
    } else speed = Math.min(TOP_SPEED, START_SPEED + t * 0.16);

    const move = speed * dt;
    for (const o of things) o.z -= move + (o.moving && !g.over ? SPAM_SPEED * dt : 0);
    for (const k of coins) k.z -= move;
    for (const p of pickups) p.z -= move;
    for (const d of decor) d.z -= move;
    for (let l = 0; l < 3; l++) laneEnd[l] -= move;
    rowZ -= move;
    decorZ -= move;

    // the cursor hovers over its lane, then clicks down as you get close
    for (const o of things) {
      if (o.kind !== 'click') continue;
      const k = clamp((16 - o.z) / 7, 0, 1);
      o.cy = 7 * (1 - k * k);
      if (k >= 1 && !o.slammed) {
        o.slammed = true;
        sound.thud();
        const [sx, sy] = P(LANES[o.lane], 0, o.z + 0.6);
        sparks.burst(sx, sy, '#ffffff', 12, 200);
      }
    }

    me.x += clamp(LANES[me.lane] - me.x, -SHIFT * dt, SHIFT * dt);
    me.slide -= dt;
    physics(dt);

    if (!g.over) {
      dist += move;
      while (rowZ < FAR) spawnRow(rowZ);
      hits();
      collect(dt);
    }
    while (decorZ < FAR) spawnDecor(decorZ);

    prune(things, (o) => o.z + o.len < NEAR - 1);
    prune(coins, (k) => k.got || k.z < NEAR);
    prune(pickups, (p) => p.got || p.z < NEAR);
    prune(decor, (d) => d.z < NEAR - 1);
  };

  const g = {
    score: 0,
    over: false,

    down(x, y) {
      press = { x, y, done: false };
    },
    move(x, y) {
      if (!press || press.done) return;
      const dx = x - press.x;
      const dy = y - press.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
      press.done = true;
      if (Math.abs(dx) > Math.abs(dy)) shift(Math.sign(dx));
      else if (dy < 0) jumpNow();
      else slideNow();
    },
    up() {
      if (press && !press.done) jumpNow();
      press = null;
    },
    key(code) {
      if (code === 'ArrowLeft' || code === 'KeyA') shift(-1);
      else if (code === 'ArrowRight' || code === 'KeyD') shift(1);
      else if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') jumpNow();
      else if (code === 'ArrowDown' || code === 'KeyS') slideNow();
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      me.squash = Math.max(0, me.squash - dt);
      buffer -= dt;
      safe -= dt;
      chase -= dt;

      // small steps, so nothing thin gets skipped over at top speed
      const n = Math.ceil(dt / (1 / 90));
      for (let i = 0; i < n; i++) step(dt / n);

      if (!g.over) {
        for (const k of Object.keys(active)) {
          if (k === 'bubble') continue;
          active[k] -= dt;
          if (active[k] > 0) continue;
          delete active[k];
          if (k === 'wings') safe = 1.5; // a soft landing
        }
        chatter -= dt;
        if (chatter <= 0) {
          chatter = rand(6, 10);
          mouth.maybe(RUNS, 0.6);
        }
        g.score = Math.floor(dist) + coinPts;
      }

      cam.x += (me.x * 0.75 - cam.x) * Math.min(1, dt * 6);
      cam.y += (CAM_UP + Math.max(0, me.y) * 0.75 - cam.y) * Math.min(1, dt * 5);
    },

    draw(c) {
      drawWorld(c, P, cam, dist, t);
      drawTrack(c, P, dist);

      for (const o of things) if (o.kind === 'hole') hole(c, P, o);
      for (const o of things) if (o.kind === 'click' && o.z < FAR) target(c, P, o, t);

      // the button's shadow on whatever is under it
      if (me.gh > -1) {
        const [sx, sy, s] = P(me.x, me.gh, 0);
        const k = clamp(1 - (me.y - me.gh) / 6, 0.3, 1);
        c.fillStyle = `rgba(0,0,0,${0.25 * k})`;
        c.beginPath();
        c.ellipse(sx, sy, 0.45 * s * k, 0.14 * s * k, 0, 0, Math.PI * 2);
        c.fill();
      }

      // everything else, far to near
      const list = [];
      for (const o of things) if (o.kind !== 'hole' && o.z < FAR) list.push([o.kind === 'train' || o.kind === 'ramp' ? o.z + o.len : o.z, () => thing(c, P, cam, o, t)]);
      for (const k of coins) if (k.z < FAR) list.push([k.z, () => coin(c, P, k, t)]);
      for (const p of pickups) if (p.z < FAR) list.push([p.z, () => pickup(c, P, p, t)]);
      for (const d of decor) if (d.z < FAR) list.push([d.z, () => prop(c, P, cam, d)]);
      list.sort((a, b) => b[0] - a[0]);
      for (const [z, paint] of list) {
        c.globalAlpha = clamp((FAR - z) / 14, 0, 1);
        paint();
      }
      c.globalAlpha = 1;

      drawMe(c);
      sparks.draw(c);
      const [mx, my, ms] = P(me.x, me.y + TALL, 0);
      mouth.draw(c, mx + 20, my - ms * 0.15);

      if (chase > 0 && !g.over) {
        // the cursor, right on your heels
        const k = Math.min(1, chase * 2, (5 - chase) * 4);
        bigCursor(c, W / 2 - 60, H - 150 * k + Math.sin(t * 9) * 8, 6, -0.3);
      }
      if (g.over) {
        const [sx, sy] = P(me.x, me.y + 0.5, 0);
        const k = clamp(overT / 0.5, 0, 1);
        bigCursor(c, sx, sy - (1 - k) * 500, 6, -0.4);
      }

      drawScore(c, g.score, t < 5 ? 'Swipe to dodge · tap to jump' : 'points');
      hud(c);
    },
  };

  function drawMe(c) {
    const [sx, sy, s] = P(me.x, me.y, 0);
    const size = BODY * s;
    const foot = size * (20 / 38);
    const sq = me.slide > 0 && me.ground ? 0.4 : me.squash;
    const blink = safe > 0 && Math.floor(t * 12) % 2;
    const cy = sy - foot + foot * sq;

    if (active.wings) wings(c, sx, cy, size, t);
    if (active.spring && !active.wings) springs(c, sx, sy, size, t);
    drawBobby(c, sx, cy, size, {
      look,
      t,
      squash: sq,
      angle: g.over ? -me.spin : (LANES[me.lane] - me.x) * 0.18,
      moving: !g.over && me.ground,
      mood: g.over ? 'sad' : chase > 0 ? 'worried' : !me.ground ? 'shout' : 'angry',
      tears: g.over,
      alpha: active.ghost ? 0.45 : blink ? 0.4 : 1,
    });
    if (active.bubble) {
      c.strokeStyle = 'rgba(200,240,255,0.9)';
      c.fillStyle = 'rgba(167,227,255,0.18)';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(sx, cy, size * 0.85, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.7)';
      c.beginPath();
      c.ellipse(sx - size * 0.35, cy - size * 0.4, size * 0.12, size * 0.07, -0.6, 0, Math.PI * 2);
      c.fill();
    }
    if (active.magnet) {
      c.globalAlpha = 0.5 + Math.sin(t * 8) * 0.2;
      c.strokeStyle = '#e0453a';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(sx, cy, size * (0.9 + ((t * 1.5) % 1) * 0.6), 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 1;
    }
  }

  // Power-ups running, with time left, down the left side.
  function hud(c) {
    let y = 150;
    for (const [k, left] of Object.entries(active)) {
      const p = POWERS[k];
      c.fillStyle = 'rgba(25,18,40,0.55)';
      rr(c, 12, y, 140, 36, 18);
      c.fill();
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(30, y + 18, 14, 0, Math.PI * 2);
      c.fill();
      text(c, p.icon, 30, y + 19, { size: p.icon === 'x2' ? 13 : 16, color: '#2b1d17' });
      if (p.time) {
        c.fillStyle = 'rgba(255,255,255,0.25)';
        rr(c, 52, y + 14, 88, 8, 4);
        c.fill();
        c.fillStyle = p.color;
        rr(c, 52, y + 14, 88 * clamp(left / p.time, 0, 1), 8, 4);
        c.fill();
      } else text(c, 'one hit', 96, y + 18, { size: 13, color: '#fff' });
      y += 44;
    }
    // coins, top right under the shell's buttons
    c.fillStyle = 'rgba(25,18,40,0.55)';
    rr(c, W - 104, 150, 92, 36, 18);
    c.fill();
    c.fillStyle = '#f2b632';
    c.beginPath();
    c.arc(W - 86, 168, 11, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffe27a';
    c.beginPath();
    c.arc(W - 86, 168, 6, 0, Math.PI * 2);
    c.fill();
    text(c, String(coinCount), W - 46, 169, { size: 18, color: '#fff' });
  }

  return g;
}

/* ---------- helpers ---------- */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function prune(arr, gone) {
  let n = 0;
  for (const v of arr) if (!gone(v)) arr[n++] = v;
  arr.length = n;
}

// The box the button can run into, or null for things it can't.
function hitOf(o) {
  const lx = LANES[o.lane];
  switch (o.kind) {
    case 'block':
      return { x0: lx - 0.7, x1: lx + 0.7, y0: 0, y1: 0.8 };
    case 'ad':
      return { x0: lx - 0.75, x1: lx + 0.75, y0: AD_LOW, y1: AD_LOW + 1.25 };
    case 'wall':
      return { x0: lx - 0.75, x1: lx + 0.75, y0: 0, y1: 3.2 };
    case 'train':
      return { x0: lx - 0.72, x1: lx + 0.72, y0: 0, y1: o.top };
    case 'bar':
      return { x0: -2.6, x1: 2.6, y0: 0.1, y1: 0.7 };
    case 'click':
      return o.cy < 1.2 ? { x0: lx - 0.6, x1: lx + 0.6, y0: o.cy, y1: o.cy + 1.6 } : null;
    default:
      return null;
  }
}

const shades = new Map();
// A hex color made lighter (k > 0) or darker (k < 0).
function shade(hex, k) {
  const key = hex + k;
  if (!shades.has(key)) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
    shades.set(key, `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`);
  }
  return shades.get(key);
}

function poly(c, pts, fill) {
  c.beginPath();
  for (const p of pts) c.lineTo(p[0], p[1]);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

// A solid box, painted with the faces the camera can see. Returns the
// corners of its front face for decorating: [bottom-left, bottom-right,
// top-right, top-left].
function box(c, P, cam, x0, x1, y0, y1, z0, z1, color) {
  z0 = Math.max(z0, NEAR);
  if (z1 <= z0) return null;
  if (cam.x < x0) poly(c, [P(x0, y0, z0), P(x0, y0, z1), P(x0, y1, z1), P(x0, y1, z0)], shade(color, -0.3));
  if (cam.x > x1) poly(c, [P(x1, y0, z0), P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0)], shade(color, -0.3));
  if (cam.y > y1) poly(c, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], shade(color, 0.25));
  const front = [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)];
  poly(c, front, color);
  return front;
}

// Text stuck on a front face, centered at its middle.
function label(c, front, str, k, color) {
  const [bl, br, tr] = front;
  const size = Math.max(6, (br[0] - bl[0]) * k);
  text(c, str, (bl[0] + br[0]) / 2, (bl[1] + tr[1]) / 2, { size, color });
}

/* ---------- the world ---------- */
function drawWorld(c, P, cam, dist, t) {
  const sky = c.createLinearGradient(0, 0, 0, HOR);
  sky.addColorStop(0, '#6f6cf0');
  sky.addColorStop(1, '#ffc2a8');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, HOR + 2);

  c.fillStyle = '#fff1b8';
  c.beginPath();
  c.arc(W / 2 + 120 - cam.x * 4, HOR - 90, 44, 0, Math.PI * 2);
  c.fill();

  // a row of giant app icons on the horizon
  const icons = ['#f39ac0', '#7cc6a4', '#5b9bd5', '#f2c14e', '#a58bd6', '#e2674f'];
  for (let i = 0; i < 9; i++) {
    const x = i * 62 - 20 - cam.x * 10;
    const h = 40 + ((i * 37) % 50);
    c.fillStyle = shade(icons[i % icons.length], -0.15);
    rr(c, x, HOR - h, 48, h + 4, 10);
    c.fill();
  }

  // and the monitor you are watching all this on, with your cursor in it
  const mx = W / 2 - cam.x * 6;
  c.fillStyle = '#2b2d3a';
  c.fillRect(mx - 10, HOR - 40, 20, 40);
  rr(c, mx - 95, HOR - 160, 190, 120, 12);
  c.fill();
  const scr = c.createLinearGradient(0, HOR - 152, 0, HOR - 48);
  scr.addColorStop(0, '#9fd7ff');
  scr.addColorStop(1, '#5b8fe0');
  c.fillStyle = scr;
  rr(c, mx - 87, HOR - 152, 174, 104, 7);
  c.fill();
  c.save();
  c.translate(mx - 8 + Math.sin(t * 1.3) * 26, HOR - 128 + Math.cos(t * 1.7) * 10);
  c.scale(2, 2);
  cursorShape(c, '#fff', '#111');
  c.restore();

  // the desk, with its planks running off to the horizon
  const desk = c.createLinearGradient(0, HOR, 0, H);
  desk.addColorStop(0, '#d9a777');
  desk.addColorStop(1, '#9a6a42');
  c.fillStyle = desk;
  c.fillRect(0, HOR, W, H - HOR);
  c.strokeStyle = 'rgba(70,40,20,0.18)';
  c.lineWidth = 2;
  for (const x of [-16, -10, -6.5, 6.5, 10, 16]) {
    const a = P(x, 0, NEAR);
    const b = P(x, 0, FAR);
    c.beginPath();
    c.moveTo(a[0], a[1]);
    c.lineTo(b[0], b[1]);
    c.stroke();
  }
  const off = dist % 9;
  for (let z = 9 - off; z < FAR; z += 9) {
    const a = P(-30, 0, z);
    const b = P(30, 0, z);
    c.beginPath();
    c.moveTo(a[0], a[1]);
    c.lineTo(b[0], b[1]);
    c.stroke();
  }
}

// The keyboard the button runs down: three lanes of keycaps.
function drawTrack(c, P, dist) {
  poly(c, [P(-2.55, 0, NEAR), P(2.55, 0, NEAR), P(2.55, 0, FAR), P(-2.55, 0, FAR)], '#2c2f3d');
  const off = dist % TILE;
  const base = Math.floor(dist / TILE);
  for (let k = Math.ceil((FAR - NEAR) / TILE); k >= 0; k--) {
    const z0 = NEAR + k * TILE - off;
    const z1 = z0 + TILE - 0.18;
    if (z1 < NEAR) continue;
    for (let l = 0; l < 3; l++) {
      const lx = LANES[l];
      const col = (base + k + l) % 2 ? '#f4f1ea' : '#e2ddd0';
      poly(c, [P(lx - 0.72, 0, Math.max(z0, NEAR)), P(lx + 0.72, 0, Math.max(z0, NEAR)), P(lx + 0.72, 0, z1), P(lx - 0.72, 0, z1)], col);
    }
  }
  // haze where the keyboard meets the sky
  const haze = c.createLinearGradient(0, HOR - 4, 0, HOR + 40);
  haze.addColorStop(0, 'rgba(255,194,168,0.95)');
  haze.addColorStop(1, 'rgba(255,194,168,0)');
  c.fillStyle = haze;
  c.fillRect(0, HOR - 4, W, 44);
}

// A missing key: a dark pit in the lane.
function hole(c, P, o) {
  if (o.z > FAR) return;
  const lx = LANES[o.lane];
  const z0 = Math.max(o.z, NEAR);
  const z1 = Math.min(o.z + o.len, FAR);
  if (z1 <= z0) return;
  poly(c, [P(lx - 0.8, 0, z0), P(lx + 0.8, 0, z0), P(lx + 0.8, 0, z1), P(lx - 0.8, 0, z1)], '#110d18');
  poly(c, [P(lx - 0.8, 0, z1), P(lx + 0.8, 0, z1), P(lx + 0.8, -1.2, z1), P(lx - 0.8, -1.2, z1)], '#3a2c4f');
}

// The red ring where the cursor is about to click.
function target(c, P, o, t) {
  const lx = LANES[o.lane];
  const cz = o.z + 0.6;
  if (cz < NEAR) return;
  const pts = [];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    pts.push(P(lx + Math.cos(a) * 0.7, 0.01, cz + Math.sin(a) * 0.7));
  }
  c.globalAlpha = o.slammed ? 0.35 : 0.5 + Math.sin(t * 14) * 0.25;
  poly(c, pts, '#e0453a');
  c.globalAlpha = 1;
}

function thing(c, P, cam, o, t) {
  const lx = LANES[o.lane];
  const z0 = o.z;
  const z1 = o.z + o.len;
  if (o.kind === 'block') {
    // a giant keycap, wider at the bottom
    box(c, P, cam, lx - 0.7, lx + 0.7, 0, 0.35, z0, z1, '#cfc7b4');
    const f = box(c, P, cam, lx - 0.58, lx + 0.58, 0.35, 0.8, z0 + 0.08, z1 - 0.08, '#f4efe2');
    if (f) label(c, f, o.label, 0.24, '#5a5246');
  } else if (o.kind === 'ad') {
    // a popup window on two poles: slide under it
    box(c, P, cam, lx - 0.78, lx - 0.7, 0, AD_LOW, z0, z1, '#9aa0ab');
    box(c, P, cam, lx + 0.7, lx + 0.78, 0, AD_LOW, z0, z1, '#9aa0ab');
    const f = box(c, P, cam, lx - 0.78, lx + 0.78, AD_LOW, AD_LOW + 1.25, z0, z1, '#ffffff');
    if (f) {
      const [bl, br, tr, tl] = f;
      const bar = (tl[1] - bl[1]) * -0.2;
      c.fillStyle = '#3b6fd8';
      c.fillRect(tl[0], tl[1], tr[0] - tl[0], bar);
      c.fillStyle = '#e0453a';
      c.fillRect(tr[0] - bar * 0.9, tl[1] + bar * 0.15, bar * 0.7, bar * 0.7);
      const w = br[0] - bl[0];
      text(c, o.label, (bl[0] + br[0]) / 2, tl[1] + (bl[1] - tl[1]) * 0.5, { size: Math.max(5, w * 0.15), color: Math.sin(t * 10) > 0 ? '#e0453a' : '#f2a516' });
      c.fillStyle = '#3fae5a';
      const bw = w * 0.36;
      rr(c, (bl[0] + br[0]) / 2 - bw / 2, bl[1] - (bl[1] - tl[1]) * 0.26, bw, (bl[1] - tl[1]) * 0.16, 3);
      c.fill();
    }
  } else if (o.kind === 'wall') {
    // a firewall: bricks, on fire
    const f = box(c, P, cam, lx - 0.75, lx + 0.75, 0, 3.2, z0, z1, '#c8432f');
    if (f) {
      c.strokeStyle = 'rgba(90,20,10,0.5)';
      c.lineWidth = 1.5;
      const [bl, br, , tl] = f;
      const rows = 7;
      for (let i = 1; i < rows; i++) {
        const y = bl[1] + ((tl[1] - bl[1]) * i) / rows;
        c.beginPath();
        c.moveTo(bl[0], y);
        c.lineTo(br[0], y);
        c.stroke();
        for (let j = i % 2 ? 0.25 : 0.5; j < 1; j += 0.5) {
          const x = bl[0] + (br[0] - bl[0]) * j;
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x, y - (tl[1] - bl[1]) / rows);
          c.stroke();
        }
      }
      label(c, f, 'FIREWALL', 0.13, '#ffe0b8');
    }
    for (let i = 0; i < 4; i++) {
      const x = lx - 0.75 + (i + 0.5) * 0.375;
      const h = 0.55 + Math.sin(t * 13 + i * 2) * 0.18;
      const z = Math.max(z0, NEAR);
      poly(c, [P(x - 0.2, 3.2, z), P(x + 0.2, 3.2, z), P(x, 3.2 + h, z)], '#f2a516');
      poly(c, [P(x - 0.1, 3.2, z), P(x + 0.1, 3.2, z), P(x, 3.2 + h * 0.55, z)], '#ffe27a');
    }
  } else if (o.kind === 'train') {
    const color = o.moving ? '#e0453a' : '#4a5a85';
    const f = box(c, P, cam, lx - 0.72, lx + 0.72, 0, o.top, z0, z1, color);
    if (f && z0 > NEAR) {
      const [bl, br, tr, tl] = f;
      const w = br[0] - bl[0];
      const h = bl[1] - tl[1];
      c.fillStyle = 'rgba(15,20,40,0.75)';
      rr(c, tl[0] + w * 0.12, tl[1] + h * 0.12, w * 0.76, h * 0.3, 4);
      c.fill();
      if (o.moving) {
        // headlights and an envelope: spam, coming straight at you
        c.fillStyle = Math.sin(t * 16) > 0 ? '#fff6a8' : '#ffd84d';
        for (const k of [0.2, 0.8]) {
          c.beginPath();
          c.arc(bl[0] + w * k, bl[1] - h * 0.18, w * 0.08, 0, Math.PI * 2);
          c.fill();
        }
        text(c, '✉ SPAM', (bl[0] + br[0]) / 2, tl[1] + h * 0.6, { size: Math.max(6, w * 0.15), color: '#fff' });
      } else {
        for (let i = 0; i < 4; i++) {
          c.fillStyle = (Math.floor(t * 3) + i) % 3 ? '#7cc6a4' : '#ffd84d';
          c.fillRect(bl[0] + w * (0.2 + i * 0.18), bl[1] - h * 0.2, w * 0.06, w * 0.06);
        }
        text(c, o.label, (bl[0] + br[0]) / 2, tl[1] + h * 0.6, { size: Math.max(6, w * 0.14), color: '#dfe6ff' });
      }
    }
  } else if (o.kind === 'ramp') {
    const zz = Math.max(z0, NEAR);
    const y0 = ((zz - z0) / o.len) * TRAIN_TOP;
    if (cam.x < lx - 0.72) poly(c, [P(lx - 0.72, 0, zz), P(lx - 0.72, 0, z1), P(lx - 0.72, TRAIN_TOP, z1), P(lx - 0.72, y0, zz)], '#a87d0c');
    if (cam.x > lx + 0.72) poly(c, [P(lx + 0.72, 0, zz), P(lx + 0.72, 0, z1), P(lx + 0.72, TRAIN_TOP, z1), P(lx + 0.72, y0, zz)], '#a87d0c');
    poly(c, [P(lx - 0.72, y0, zz), P(lx + 0.72, y0, zz), P(lx + 0.72, TRAIN_TOP, z1), P(lx - 0.72, TRAIN_TOP, z1)], '#f2c14e');
    for (let i = 1; i < 4; i++) {
      const z = z0 + (o.len * i) / 4;
      if (z < zz) continue;
      const y = (i / 4) * TRAIN_TOP;
      poly(c, [P(lx - 0.72, y, z), P(lx + 0.72, y, z), P(lx + 0.72, y + 0.08, z + 0.2), P(lx - 0.72, y + 0.08, z + 0.2)], '#2b2d3a');
    }
  } else if (o.kind === 'bar') {
    // a loading bar laid across the whole track: jump it
    const f = box(c, P, cam, -2.6, 2.6, 0.1, 0.7, z0, z1, '#ffffff');
    if (f) {
      const [bl, br, , tl] = f;
      const w = br[0] - bl[0];
      const h = bl[1] - tl[1];
      c.fillStyle = '#d6d9e6';
      c.fillRect(bl[0] + w * 0.03, tl[1] + h * 0.2, w * 0.94, h * 0.6);
      c.fillStyle = '#3fae5a';
      c.fillRect(bl[0] + w * 0.03, tl[1] + h * 0.2, w * 0.94 * o.pct, h * 0.6);
      text(c, `LOADING ${Math.floor(o.pct * 100)}%`, (bl[0] + br[0]) / 2, tl[1] + h * 0.5, { size: Math.max(5, h * 0.45), color: '#1b1b22' });
    }
  } else if (o.kind === 'click') {
    const [sx, sy, s] = P(lx, o.cy, Math.max(o.z + 0.6, NEAR));
    bigCursor(c, sx, sy, s * 0.085, Math.PI - 0.35);
  }
}

// The mouse pointer, tip at (x, y), `k` times its normal size.
function bigCursor(c, x, y, k, angle) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(k, k);
  cursorShape(c, '#fff', '#111');
  c.restore();
}

function coin(c, P, k, t) {
  const [sx, sy, s] = P(k.x, k.y, Math.max(k.z, NEAR));
  const r = 0.3 * s;
  const squeeze = Math.abs(Math.cos(t * 4 + k.z * 0.4));
  c.fillStyle = '#c99a2e';
  c.beginPath();
  c.ellipse(sx, sy, r * squeeze + 1.5, r, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#f2b632';
  c.beginPath();
  c.ellipse(sx, sy, r * squeeze * 0.85 + 1, r * 0.85, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffe27a';
  c.beginPath();
  c.ellipse(sx, sy, r * squeeze * 0.45 + 0.5, r * 0.5, 0, 0, Math.PI * 2);
  c.fill();
}

function pickup(c, P, p, t) {
  const kind = POWERS[p.kind];
  const [sx, sy, s] = P(p.x, 1 + Math.sin(t * 4) * 0.15, Math.max(p.z, NEAR));
  const r = 0.48 * s;
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath();
  c.arc(sx, sy, r * (1.25 + Math.sin(t * 6) * 0.08), 0, Math.PI * 2);
  c.fill();
  c.fillStyle = kind.color;
  c.beginPath();
  c.arc(sx, sy, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#fff';
  c.lineWidth = Math.max(1, r * 0.12);
  c.stroke();
  text(c, kind.icon, sx, sy + r * 0.05, { size: Math.max(6, r * (kind.icon === 'x2' ? 0.8 : 1.1)), color: '#2b1d17' });
}

// Desk clutter along both sides of the keyboard.
function prop(c, P, cam, d) {
  if (d.kind === 'pencil') {
    box(c, P, cam, d.x - 0.18, d.x + 0.18, 0, d.h, d.z, d.z + 0.36, d.color);
    box(c, P, cam, d.x - 0.18, d.x + 0.18, d.h, d.h + 0.18, d.z, d.z + 0.36, '#b8bcc6');
    box(c, P, cam, d.x - 0.18, d.x + 0.18, d.h + 0.18, d.h + 0.45, d.z, d.z + 0.36, '#f39ac0');
  } else if (d.kind === 'mug') {
    box(c, P, cam, d.x - 0.55, d.x + 0.55, 0, 1.2, d.z, d.z + 1.1, d.color);
    if (cam.y > 1.2) poly(c, [P(d.x - 0.45, 1.2, d.z + 0.1), P(d.x + 0.45, 1.2, d.z + 0.1), P(d.x + 0.45, 1.2, d.z + 1), P(d.x - 0.45, 1.2, d.z + 1)], '#5a3a22');
  } else {
    for (let i = 0; i < d.n; i++) {
      const inset = (i % 2) * 0.15;
      box(c, P, cam, d.x - 0.9 + inset, d.x + 0.9 - inset, i * 0.4, i * 0.4 + 0.38, d.z + inset, d.z + 1.3 - inset, d.colors[i % d.colors.length]);
    }
  }
}

function wings(c, x, y, size, t) {
  const flap = Math.sin(t * 14) * 0.35;
  c.fillStyle = '#ffffff';
  c.strokeStyle = '#b9d9f0';
  c.lineWidth = 2;
  for (const side of [-1, 1]) {
    c.save();
    c.translate(x + side * size * 0.35, y - size * 0.1);
    c.rotate(side * (-0.5 + flap));
    c.beginPath();
    c.ellipse(side * size * 0.45, 0, size * 0.5, size * 0.22, 0, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();
  }
}

function springs(c, x, y, size, t) {
  c.strokeStyle = '#7cc6a4';
  c.lineWidth = Math.max(2, size * 0.06);
  for (const side of [-1, 1]) {
    const fx = x + side * size * 0.2;
    c.beginPath();
    for (let i = 0; i <= 4; i++) c.lineTo(fx + (i % 2 ? 6 : -6), y - 2 - i * 3 + Math.sin(t * 20) * 1.5);
    c.stroke();
  }
}
