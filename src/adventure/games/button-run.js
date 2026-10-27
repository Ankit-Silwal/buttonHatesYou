import { W, H, rand, pick, clamp, rr, text, drawScore, Mouth, Sparks } from '../kit';
import { createWorld } from '../run3d/world';

// Button Run: a 3D dash down three lanes of a giant keyboard, seen from just
// behind the button. The world is in meters: x across (lanes at -1.6, 0, 1.6),
// y up, z ahead of the button (which always sits at z = 0). This file is the
// game; src/adventure/run3d/ draws it with WebGL.
const LANE = 1.6;
const LANES = [-LANE, 0, LANE];
const CAM_UP = 3; // camera height above the button
const NEAR = -4.5; // things behind this are gone for good
const FAR = 75; // things appear this far ahead
const TILE = 2; // keycap length along the track

const GRAVITY = 38;
const JUMP = 12.5; // about 2 m high
const SPRING_JUMP = 18; // about 4 m: over a train
const FLY = 5; // cruising height with wings
const TALL = 1; // the button is 1 m tall standing, 0.5 m sliding
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
const INTRO = 1.8; // seconds of staring at you before the run starts

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
const NEAR_KEY = -4; // where the world's first row of keycaps starts (see run3d/world.js)

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
  let coinPop = 0; // the coin counter bulges for a moment per coin
  let flash = null; // { color, left }: a screen flash
  let phase = 0; // the running stride
  let glance = 0; // 0 facing ahead .. 1 turned round to look at you
  let glanceFor = 0;
  let intro = INTRO;

  const world = createWorld(look, POWERS);
  const P = world.project;
  const lookBack = (sec) => (glanceFor = Math.max(glanceFor, sec));
  const skipIntro = () => {
    intro = Math.min(intro, 0.45);
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
      else if (kind === 'hole') {
        // two keys missing, lined up with the keycaps on the track
        const w0 = Math.ceil((dist + z - 2 - NEAR_KEY) / TILE) * TILE + NEAR_KEY;
        add({ kind, lane, z: w0 - dist, len: TILE * 2 });
      }
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
    flash = { color: p.color, left: 0.35 };
    mouth.say(GOT[kind], 2);
    lookBack(1.2);
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
    world.shake(1);
    flash = { color: '#ff3b2f', left: 0.5 };
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
    world.shake(0.5);
    mouth.say(pick(BUMPS), 1.6);
    lookBack(1.4);
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
        else if (me.vy === 0 && t > 0.5) {
          const [sx, sy] = P(me.x, me.y, 0);
          sparks.burst(sx, sy, 'rgba(255,255,255,0.8)', 5, 90);
        }
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
        coinPop = 0.18;
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
      if (intro > 0) return skipIntro();
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
      if (intro > 0) return skipIntro();
      if (code === 'ArrowLeft' || code === 'KeyA') shift(-1);
      else if (code === 'ArrowRight' || code === 'KeyD') shift(1);
      else if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') jumpNow();
      else if (code === 'ArrowDown' || code === 'KeyS') slideNow();
    },

    update(dt) {
      t += dt;
      coinPop = Math.max(0, coinPop - dt);
      if (flash && (flash.left -= dt) <= 0) flash = null;
      mouth.update(dt);
      sparks.update(dt);
      me.squash = Math.max(0, me.squash - dt);
      buffer -= dt;
      safe -= dt;
      chase -= dt;

      if (intro > 0) {
        if (intro === INTRO) mouth.say('Oh no. Not you again.', 1.4);
        intro -= dt;
        if (intro <= 0) mouth.say(pick(['Bye!', 'Catch me if you can.', 'Run, legs, RUN.']), 1.2);
      } else {
        // small steps, so nothing thin gets skipped over at top speed
        const n = Math.ceil(dt / (1 / 90));
        for (let i = 0; i < n; i++) step(dt / n);
      }

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
          if (mouth.line) lookBack(1.5);
        }
        g.score = Math.floor(dist) + coinPts;
      }

      if (me.ground && !g.over) phase += dt * speed * 0.8;
      glanceFor -= dt;
      glance += ((glanceFor > 0 || g.over ? 1 : 0) - glance) * Math.min(1, dt * 7);
      cam.x += (me.x * 0.75 - cam.x) * Math.min(1, dt * 6);
      cam.y += (CAM_UP + Math.max(0, me.y) * 0.75 - cam.y) * Math.min(1, dt * 5);
    },

    draw(c) {
      const blink = safe > 0 && Math.floor(t * 12) % 2;
      world.sync({
        t,
        me,
        cam,
        speed,
        dist,
        things,
        coins,
        pickups,
        decor,
        chase,
        over: g.over,
        overT,
        intro: clamp(intro / 1.2, 0, 1),
        pose: {
          t,
          phase,
          air: !me.ground,
          slide: me.slide > 0 && me.ground,
          squash: me.squash,
          mood: g.over ? 'sad' : chase > 0 ? 'worried' : !me.ground ? 'shout' : 'angry',
          glance,
          lean: (me.x - LANES[me.lane]) * 0.25,
          spin: g.over ? -me.spin : 0,
          alpha: active.ghost ? 0.45 : blink ? 0.35 : 1,
          wings: !!active.wings,
          bubble: !!active.bubble,
          magnet: !!active.magnet,
          spring: !!active.spring,
        },
      });
      world.render(c);

      if (speed > 17 && !g.over) speedLines(c, (speed - 17) / (TOP_SPEED - 17), t);
      sparks.draw(c);
      const [mx, my] = P(me.x, me.y + 1.35, 0);
      mouth.draw(c, mx + 10, my);

      drawScore(c, g.score, t < 5 ? 'Swipe to dodge · tap to jump' : 'points');
      hud(c);
      if (flash) {
        c.globalAlpha = Math.min(0.45, flash.left);
        c.fillStyle = flash.color;
        c.fillRect(0, 0, W, H);
        c.globalAlpha = 1;
      }
    },
  };

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
    // coins, top right under the shell's buttons, bulging as they come in
    const pop = 1 + coinPop * 1.6;
    c.save();
    c.translate(W - 58, 168);
    c.scale(pop, pop);
    c.translate(-(W - 58), -168);
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
    c.restore();
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

// Streaks rushing past the edges of the screen at speed.
function speedLines(c, k, t) {
  c.strokeStyle = `rgba(255,255,255,${0.12 + k * 0.25})`;
  c.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const a = i * 2.39996 + Math.floor(t * 20) * 0.7;
    const dx = Math.cos(a);
    const dy = Math.sin(a) * 1.4;
    const r0 = 300 + ((i * 53 + Math.floor(t * 30) * 17) % 120);
    const r1 = r0 + 60 + k * 90;
    c.beginPath();
    c.moveTo(W / 2 + dx * r0, 400 + dy * r0);
    c.lineTo(W / 2 + dx * r1, 400 + dy * r1);
    c.stroke();
  }
}
