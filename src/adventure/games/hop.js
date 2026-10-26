import { W, H, rand, pick, clamp, rr, drawBobby, drawScore, backdrop, Mouth, Sparks } from '../kit';

// Sky Hop: the button bounces up cloud after cloud, as far from you as it can get.
const GRAVITY = 1700;
const BOUNCE = -900;
const SPRING = -1550;
const STEER = 380; // top sideways speed
const SIZE = 48;
const FEET = SIZE * 0.5; // center of the button to its feet
const CLOUD_W = 84;
const PER_METER = 8; // pixels climbed per meter of score
const SPACE = 24000; // pixels climbed before the sky is fully dark

const HOPS = ['Up. Away. From you.', 'Boing. Ugh.', 'Higher. Faster.', 'Clouds are damp.', 'Do not follow me.'];
const SPRINGS = ['WHEEE— I mean, ugh.', 'Bye forever!', 'See you never!'];
const CRUMBLES = ['Cheap cloud.', 'Who built this?'];
const MILES = ['Still too close to you.', 'The air is thin. Good.', 'Is that space?', 'Almost free of you.'];
const FALLS = ['Your fault.', 'NOOO—', 'I blame you.'];

export default function hop({ look, sound, keys }) {
  const me = { x: W / 2, y: H - 160, vx: 0, vy: BOUNCE, facing: 1 };
  const startY = me.y;
  const clouds = [];
  const mouth = new Mouth();
  const sparks = new Sparks();
  let pointer = null; // the x the pointer is held at, if it is held
  let cam = 0; // world y at the top of the screen; only goes down (up the sky)
  let top = me.y; // the highest the button has been
  let nextY = H - 90;
  let nextMile = 500;
  let t = 0;
  let squash = 0;

  // How far apart clouds are, and what kinds show up, depends on the height.
  const addCloud = (y, kind) => {
    const m = (startY - y) / PER_METER;
    const k = clamp(m / 3000, 0, 1);
    if (!kind) {
      const r = Math.random();
      const moving = m > 150 ? 0.08 + k * 0.25 : 0;
      const crumbly = m > 300 ? 0.06 + k * 0.2 : 0;
      kind = r < moving ? 'moving' : r < moving + crumbly ? 'crumbly' : 'normal';
    }
    clouds.push({
      x: kind === 'start' ? W / 2 : rand(CLOUD_W / 2 + 6, W - CLOUD_W / 2 - 6),
      y,
      w: kind === 'start' ? 200 : CLOUD_W,
      kind,
      vx: kind === 'moving' ? pick([-1, 1]) * rand(60, 90 + k * 80) : 0,
      spring: kind === 'normal' && m > 60 && Math.random() < 0.07 ? rand(-20, 20) : null,
      sprung: 0,
      squish: 0,
      gone: false,
      fall: 0,
    });
    nextY = y - rand(0.75, 1) * clamp(70 + m * 0.035, 70, 175);
  };
  addCloud(nextY, 'start');

  const land = (cl) => {
    me.y = cl.y - FEET;
    squash = 0.25;
    cl.squish = 1;
    if (cl.spring != null && Math.abs(me.x - (cl.x + cl.spring)) < 22) {
      me.vy = SPRING;
      cl.sprung = 0.3;
      sound.pop();
      sparks.burst(me.x, cl.y, '#ffd84d', 12);
      mouth.maybe(SPRINGS, 0.5);
      return;
    }
    me.vy = BOUNCE;
    sound.jump();
    if (cl.kind === 'crumbly') {
      cl.gone = true;
      sound.crack();
      sparks.burst(cl.x, cl.y, '#c9b59a', 10, 160);
      mouth.maybe(CRUMBLES, 0.25);
    } else mouth.maybe(HOPS, 0.05);
  };

  const fall = () => {
    if (g.over) return;
    g.over = true;
    sound.bad();
    sparks.burst(me.x, cam + H - 10, look.color, 16);
    mouth.say(pick(FALLS), 3);
  };

  const g = {
    score: 0,
    over: false,
    down(x) {
      pointer = x;
    },
    move(x) {
      if (pointer != null) pointer = x;
    },
    up() {
      pointer = null;
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      squash = Math.max(0, squash - dt);

      // steer: keys push to full speed, a held pointer pulls toward its x
      let want = 0;
      if (keys.has('ArrowLeft') || keys.has('KeyA')) want -= STEER;
      if (keys.has('ArrowRight') || keys.has('KeyD')) want += STEER;
      if (pointer != null) want = clamp((pointer - me.x) * 5, -STEER, STEER);
      if (g.over) want = 0;
      me.vx += (want - me.vx) * Math.min(1, dt * 10);
      if (Math.abs(me.vx) > 30) me.facing = Math.sign(me.vx);

      const before = me.y + FEET;
      me.vy += GRAVITY * dt;
      me.x += me.vx * dt;
      me.y += me.vy * dt;
      // wrap around the sides
      if (me.x < -SIZE / 2) me.x += W + SIZE;
      if (me.x > W + SIZE / 2) me.x -= W + SIZE;

      for (const cl of clouds) {
        cl.squish = Math.max(0, cl.squish - dt * 4);
        cl.sprung = Math.max(0, cl.sprung - dt);
        if (cl.vx) {
          cl.x += cl.vx * dt;
          if (cl.x < cl.w / 2 || cl.x > W - cl.w / 2) {
            cl.x = clamp(cl.x, cl.w / 2, W - cl.w / 2);
            cl.vx = -cl.vx;
          }
        }
        if (cl.gone) {
          cl.fall += 900 * dt;
          cl.y += cl.fall * dt;
        }
      }

      // it only lands on the way down, and only if its feet crossed the top
      if (!g.over && me.vy > 0) {
        const after = me.y + FEET;
        for (const cl of clouds) {
          if (cl.gone || before > cl.y + 4 || after < cl.y) continue;
          if (Math.abs(me.x - cl.x) < cl.w / 2 + SIZE * 0.25) {
            land(cl);
            break;
          }
        }
      }
      if (g.over) return;

      // the camera follows the button up, never down
      cam = Math.min(cam, me.y - H * 0.4);
      top = Math.min(top, me.y);
      g.score = Math.max(0, Math.floor((startY - top) / PER_METER));
      if (g.score >= nextMile) {
        nextMile += 500;
        mouth.say(pick(MILES), 2.2);
      }

      while (nextY > cam - 120) addCloud(nextY);
      for (let i = clouds.length - 1; i >= 0; i--) if (clouds[i].y - cam > H + 80) clouds.splice(i, 1);

      if (me.y - FEET - cam > H) fall();
    },

    draw(c) {
      // the sky darkens into space the higher it gets
      const k = clamp(-cam / SPACE, 0, 1);
      backdrop(c, mix('#7fc8ff', '#07071f', k), mix('#e4f6ff', '#3a2f7a', k));

      // stars fade in up high
      const starAlpha = clamp((k - 0.35) * 1.8, 0, 1);
      if (starAlpha > 0) {
        c.fillStyle = '#fff';
        for (let i = 0; i < 46; i++) {
          const sx = (i * 97.3) % W;
          const sy = ((((i * 151.7 - cam * 0.05) % H) + H) % H);
          c.globalAlpha = starAlpha * (0.5 + 0.5 * Math.sin(t * 2 + i));
          c.fillRect(sx, sy, 2, 2);
        }
        c.globalAlpha = 1;
      }

      // far clouds drift slower than the camera
      c.fillStyle = `rgba(255,255,255,${0.45 * (1 - k)})`;
      for (let i = 0; i < 5; i++) {
        const y = ((((i * 190 - cam * 0.3) % (H + 200)) + H + 200) % (H + 200)) - 100;
        puff(c, (i * 131 + 40) % (W - 60), y, 0.9);
      }

      for (const cl of clouds) cloud(c, cl, cl.y - cam, t);

      const mood = g.over ? 'shout' : me.vy < -1100 ? 'happy' : me.vy < 0 ? 'smug' : me.vy > 700 ? 'worried' : 'calm';
      const opts = { look, t, mood, squash, facing: me.facing, angle: (me.vx / STEER) * 0.25, tears: g.over };
      const sy = me.y - cam;
      drawBobby(c, me.x, sy, SIZE, opts);
      // a second copy peeks in from the other side while it wraps
      if (me.x < SIZE / 2) drawBobby(c, me.x + W + SIZE, sy, SIZE, opts);
      if (me.x > W - SIZE / 2) drawBobby(c, me.x - W - SIZE, sy, SIZE, opts);

      c.save();
      c.translate(0, -cam);
      sparks.draw(c);
      c.restore();
      mouth.draw(c, clamp(me.x, 40, W - 40), clamp(sy - SIZE * 0.7, 160, H - 20));

      drawScore(c, g.score, t < 4 ? '← → or drag to steer' : 'meters');
    },
  };
  return g;
}

// Blends two #rrggbb colors; k = 0 is a, 1 is b.
function mix(a, b, k) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

function puff(c, x, y, s) {
  c.beginPath();
  c.arc(x, y, 22 * s, 0, Math.PI * 2);
  c.arc(x + 24 * s, y - 10 * s, 26 * s, 0, Math.PI * 2);
  c.arc(x + 50 * s, y, 20 * s, 0, Math.PI * 2);
  c.fill();
}

// A cloud platform whose walkable top is at y.
function cloud(c, cl, y, t) {
  if (y < -60 || y > H + 60) return;
  const colors = {
    start: ['#ffffff', '#d6e6f5'],
    normal: ['#ffffff', '#d6e6f5'],
    moving: ['#e3f6ff', '#93cbee'],
    crumbly: ['#eee2d1', '#bda88c'],
  }[cl.kind];
  const x = cl.x;
  const w = cl.w;
  const dy = y + cl.squish * 5;
  c.save();
  if (cl.gone) {
    c.globalAlpha = clamp(1 - cl.fall / 700, 0, 1);
    // the two halves drift apart as it falls
    for (const side of [-1, 1]) {
      c.save();
      c.translate(x + side * cl.fall * 0.04, dy);
      c.rotate(side * cl.fall * 0.0006);
      c.fillStyle = colors[0];
      rr(c, side < 0 ? -w / 2 : 2, 0, w / 2 - 2, 16, 8);
      c.fill();
      c.restore();
    }
    c.restore();
    return;
  }

  c.fillStyle = colors[1];
  rr(c, x - w / 2, dy + 4, w, 16, 8);
  c.fill();
  c.fillStyle = colors[0];
  rr(c, x - w / 2, dy, w, 14, 7);
  c.fill();
  const bumps = Math.max(3, Math.round(w / 26));
  for (let i = 0; i < bumps; i++) {
    const bx = x - w / 2 + (w / bumps) * (i + 0.5);
    c.beginPath();
    c.arc(bx, dy + 3, (i % 2 ? 11 : 13) * Math.min(1, w / 84), Math.PI, 0);
    c.fill();
  }

  if (cl.kind === 'crumbly') {
    c.strokeStyle = colors[1];
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x - 14, dy - 6);
    c.lineTo(x - 6, dy + 4);
    c.lineTo(x - 12, dy + 12);
    c.moveTo(x + 18, dy - 4);
    c.lineTo(x + 10, dy + 8);
    c.stroke();
  } else if (cl.kind === 'moving') {
    // little arrows hint that it slides
    c.strokeStyle = colors[1];
    c.lineWidth = 2.5;
    c.lineCap = 'round';
    const wob = Math.sin(t * 6) * 2;
    c.beginPath();
    c.moveTo(x - w / 2 + 12 - wob, dy + 7);
    c.lineTo(x - w / 2 + 6 - wob, dy + 11);
    c.lineTo(x - w / 2 + 12 - wob, dy + 15);
    c.moveTo(x + w / 2 - 12 + wob, dy + 7);
    c.lineTo(x + w / 2 - 6 + wob, dy + 11);
    c.lineTo(x + w / 2 - 12 + wob, dy + 15);
    c.stroke();
  }

  if (cl.spring != null) {
    // a coil that squashes when bounced on
    const sx = x + cl.spring;
    const tall = cl.sprung > 0 ? 8 : 18;
    c.strokeStyle = '#8a8f99';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(sx - 8, dy);
    for (let i = 1; i <= 4; i++) c.lineTo(sx + (i % 2 ? 8 : -8), dy - (tall * i) / 4);
    c.stroke();
    c.fillStyle = '#e04a3f';
    rr(c, sx - 13, dy - tall - 5, 26, 6, 3);
    c.fill();
  }
  c.restore();
}
