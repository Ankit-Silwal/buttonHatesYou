import { W, H, rand, pick, clamp, rr, drawBobby, drawScore, Mouth, reviveFx, blinkAlpha } from '../kit';
import { Fx, sprite, sky, glow, softLight, rays, vignette, hash, rgba } from '../fx';

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
  const sparks = new Fx();
  let breeze = 0; // seconds until the next drifting mote
  let pointer = null; // the x the pointer is held at, if it is held
  let cam = 0; // world y at the top of the screen; only goes down (up the sky)
  let top = me.y; // the highest the button has been
  let nextY = H - 90;
  let nextMile = 500;
  let t = 0;
  let squash = 0;
  let safe = 0; // blinks for a moment after a Continue

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
      sparks.burst(me.x, cl.y, '#ffd84d', 16, 320);
      sparks.ring(me.x, cl.y, '#ffe9a0', 70, 0.4);
      mouth.maybe(SPRINGS, 0.5);
      return;
    }
    me.vy = BOUNCE;
    sound.jump();
    if (cl.kind === 'crumbly') {
      cl.gone = true;
      sound.crack();
      sparks.burst(cl.x, cl.y + 6, '#d9c3a0', 14, 180, { gravity: 700, size: 3.5 });
      mouth.maybe(CRUMBLES, 0.25);
    } else {
      mouth.maybe(HOPS, 0.05);
      // a little puff of cloud kicked up by the landing
      for (let i = 0; i < 5; i++) sparks.mote(me.x + rand(-18, 18), cl.y + 2, '#ffffff', { vx: rand(-60, 60), vy: rand(-40, -10), r: rand(2, 4), life: 0.45 });
    }
  };

  const fall = () => {
    if (g.over) return;
    g.over = true;
    sound.bad();
    sparks.burst(me.x, cam + H - 10, look.color, 22, 300);
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

    // a paid Continue: a wide rescue cloud low on the screen catches the button
    revive() {
      g.over = false;
      const y = cam + H * 0.74;
      clouds.push({ x: W / 2, y, w: 200, kind: 'start', vx: 0, spring: null, sprung: 0, squish: 1, gone: false, fall: 0 });
      me.x = W / 2;
      me.y = y - FEET;
      me.vx = 0;
      me.vy = BOUNCE;
      squash = 0.25;
      safe = 1.5;
      sound.jump();
      reviveFx({ fx: sparks, mouth, sound }, me.x, y, look.color);
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      breeze -= dt;
      if (breeze <= 0) {
        breeze = rand(0.15, 0.4);
        sparks.mote(rand(0, W), cam + rand(0, H), '#ffffff', { vx: rand(-25, 25), vy: rand(-30, -8), r: rand(1, 2.2), life: rand(1.5, 3) });
      }
      squash = Math.max(0, squash - dt);
      safe -= dt;

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
      // the sky darkens into space the higher it gets: a day and a night
      // gradient, cross-faded
      const k = clamp(-cam / SPACE, 0, 1);
      backdropAt(c, k, cam, t);

      for (const cl of clouds) cloud(c, cl, cl.y - cam, t, k);

      const mood = g.over ? 'shout' : me.vy < -1100 ? 'happy' : me.vy < 0 ? 'smug' : me.vy > 700 ? 'worried' : 'calm';
      const opts = { look, t, mood, squash, facing: me.facing, angle: (me.vx / STEER) * 0.25, tears: g.over, alpha: blinkAlpha(safe, t) };
      const sy = me.y - cam;
      // a soft halo behind the button: sunlit by day, its own glow by night
      softLight(c, me.x, sy, SIZE * 1.3, '#ffffff', 0.35 * (1 - k));
      glow(c, me.x, sy, SIZE * 1.4, look.color, 0.35 * k);
      if (me.vy < -1000 && !g.over) speedLines(c, me.x, sy, t, clamp((-me.vy - 1000) / 400, 0, 1));
      drawBobby(c, me.x, sy, SIZE, opts);
      // a second copy peeks in from the other side while it wraps
      if (me.x < SIZE / 2) drawBobby(c, me.x + W + SIZE, sy, SIZE, opts);
      if (me.x > W - SIZE / 2) drawBobby(c, me.x - W - SIZE, sy, SIZE, opts);

      c.save();
      c.translate(0, -cam);
      sparks.draw(c);
      c.restore();
      vignette(c, 0.25 + k * 0.2, k > 0.5 ? '#05031a' : '#0b2a55');
      mouth.draw(c, clamp(me.x, 40, W - 40), clamp(sy - SIZE * 0.7, 160, H - 20));

      drawScore(c, g.score, t < 4 ? '← → or drag to steer' : 'meters');
    },
  };
  return g;
}

/* ---------- art ---------- */

const DAY = ['#2f7fd6', '#5fb0f0', '#a9dcff', '#ffe8cf'];
const NIGHT = ['#03031a', '#0d0b38', '#26195e', '#4b2a78'];

// Everything behind the clouds: the sky, the sun or the stars, the world far
// below and two layers of slow distant clouds. k is 0 by day, 1 in space.
function backdropAt(c, k, cam, t) {
  if (k < 1) sky(c, DAY);
  if (k > 0) {
    c.globalAlpha = k;
    sky(c, NIGHT);
    c.globalAlpha = 1;
  }
  const up = -cam; // pixels climbed

  // nebula and stars fade in up high
  const night = clamp((k - 0.3) * 1.6, 0, 1);
  if (night > 0) {
    const neb = nebula();
    const ny = ((up * 0.03) % H + H) % H;
    c.globalAlpha = night * 0.85;
    c.drawImage(neb, 0, ny - H, W, H);
    c.drawImage(neb, 0, ny, W, H);
    c.globalAlpha = 1;
    for (let i = 0; i < 70; i++) {
      const sx = hash(i) * W;
      const sy = (((hash(i + 99) * H + up * (0.03 + hash(i + 7) * 0.05)) % H) + H) % H;
      const tw = 0.55 + 0.45 * Math.sin(t * (1.5 + hash(i + 3) * 2) + i);
      const r = 2 + hash(i + 5) * 5;
      glow(c, sx, sy, r * (0.8 + tw * 0.4), i % 7 ? '#cfe0ff' : '#ffd9a8', night * tw);
    }
    // a ringed planet drifts by far away
    const pk = clamp((k - 0.55) * 3, 0, 1);
    if (pk > 0) {
      c.globalAlpha = pk;
      c.drawImage(planet(), W - 190, 150 + ((up * 0.015) % 60), 150, 110);
      c.globalAlpha = 1;
    }
  }

  // the sun, with slow-turning rays, fades as the sky darkens
  const day = 1 - k;
  if (day > 0.02) {
    const sy = 150 + Math.min(up * 0.02, 120);
    rays(c, W - 92, sy, 330, '#fff2c8', 0.22 * day, t * 0.04);
    softLight(c, W - 92, sy, 190, '#fff4d8', 0.55 * day);
    glow(c, W - 92, sy, 60, '#fff6dc', 0.9 * day);
  }

  // the town far below, lost in the haze once the climb starts
  const gy = H - 150 + up * 0.35;
  if (gy < H) c.drawImage(townBelow(), 0, gy, W, 300);

  // far and near layers of big soft clouds, scrolling at their own pace
  const tint = k > 0.5 ? 1 : 0;
  for (const [depth, n, scale, alpha] of [
    [0.12, 4, 0.7, 0.32],
    [0.3, 4, 1, 0.5],
  ]) {
    const a = alpha * (1 - k * 0.75);
    if (a <= 0.02) continue;
    const span = H + 260;
    c.globalAlpha = a;
    for (let i = 0; i < n; i++) {
      const y = ((((i * span) / n + up * depth) % span) + span) % span - 160;
      const x = ((hash(i * 3 + depth * 10) * (W + 120) + t * 6 * depth * 10) % (W + 280)) - 200;
      const spr = farCloud(tint);
      c.drawImage(spr, x, y, spr.width * scale, spr.height * scale);
    }
    c.globalAlpha = 1;
  }
}

function nebula() {
  return sprite('hop:nebula', W / 2, H / 2, (c) => {
    c.scale(0.5, 0.5);
    c.globalCompositeOperation = 'lighter';
    const blobs = [
      [120, 180, 260, '#5b2aa8', 0.35],
      [380, 330, 230, '#1f6fa8', 0.28],
      [220, 560, 300, '#a83a8a', 0.22],
      [420, 720, 200, '#3a2aa8', 0.3],
      [60, 760, 180, '#1f8fa0', 0.2],
    ];
    for (const [x, y, r, col, a] of blobs) {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(col, a));
      g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
    // a dusting of tiny far stars baked in
    for (let i = 0; i < 220; i++) {
      c.fillStyle = `rgba(255,255,255,${0.2 + hash(i + 300) * 0.5})`;
      const s = hash(i + 500) < 0.9 ? 1.5 : 2.5;
      c.fillRect(hash(i + 100) * W, hash(i + 200) * H, s, s);
    }
  });
}

function planet() {
  return sprite('hop:planet', 150, 110, (c) => {
    const cx = 75;
    const cy = 55;
    const ring = () => {
      c.beginPath();
      c.ellipse(cx, cy, 70, 14, -0.25, 0, Math.PI * 2);
    };
    c.save();
    c.lineWidth = 5;
    c.strokeStyle = 'rgba(255,214,170,0.55)';
    // the back half of the ring
    c.beginPath();
    c.ellipse(cx, cy, 70, 14, -0.25, Math.PI, Math.PI * 2);
    c.stroke();
    const g = c.createRadialGradient(cx - 14, cy - 16, 4, cx, cy, 40);
    g.addColorStop(0, '#ffd7b0');
    g.addColorStop(0.5, '#d9806a');
    g.addColorStop(1, '#4a2050');
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, 36, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(cx, cy, 70, 14, -0.25, 0, Math.PI);
    c.stroke();
    ring();
    c.lineWidth = 1.5;
    c.strokeStyle = 'rgba(255,240,220,0.5)';
    c.stroke();
    c.restore();
  });
}

// Hills and rooftops far below the start, softened by haze.
function townBelow() {
  return sprite('hop:town', W, 300, (c) => {
    c.fillStyle = '#9cc7ea';
    c.beginPath();
    c.moveTo(0, 300);
    for (let x = 0; x <= W; x += 20) c.lineTo(x, 120 + Math.sin(x * 0.012) * 30 + Math.sin(x * 0.031) * 12);
    c.lineTo(W, 300);
    c.fill();
    c.fillStyle = '#7fb0d9';
    for (let i = 0; i < 22; i++) {
      const x = hash(i + 40) * W;
      const w = 16 + hash(i + 41) * 26;
      const h = 30 + hash(i + 42) * 70;
      c.fillRect(x, 190 - h, w, h + 120);
      if (hash(i + 43) > 0.5) {
        c.beginPath();
        c.moveTo(x - 3, 190 - h);
        c.lineTo(x + w / 2, 190 - h - 14);
        c.lineTo(x + w + 3, 190 - h);
        c.fill();
      }
    }
    c.fillStyle = '#6aa2cf';
    c.beginPath();
    c.moveTo(0, 300);
    for (let x = 0; x <= W; x += 16) c.lineTo(x, 210 + Math.sin(x * 0.02 + 1) * 14);
    c.lineTo(W, 300);
    c.fill();
    // haze over everything, thickest at the top
    const g = c.createLinearGradient(0, 60, 0, 300);
    g.addColorStop(0, 'rgba(255,232,207,1)');
    g.addColorStop(0.35, 'rgba(255,232,207,0.55)');
    g.addColorStop(1, 'rgba(255,232,207,0.15)');
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = g;
    c.fillRect(0, 0, W, 300);
  });
}

// A big soft background cloud, lit from above (tint 1 = moonlit violet).
function farCloud(tint) {
  return sprite(`hop:far:${tint}`, 320, 200, (c) => {
    c.translate(10, 25);
    const lobes = [
      [70, 95, 42],
      [120, 70, 56],
      [180, 78, 48],
      [230, 98, 36],
      [150, 108, 46],
      [100, 112, 34],
    ];
    const g = c.createLinearGradient(0, 20, 0, 140);
    g.addColorStop(0, tint ? '#b9a8ff' : '#ffffff');
    g.addColorStop(0.55, tint ? '#6f5fc0' : '#e2effc');
    g.addColorStop(1, tint ? '#3a2f80' : '#9dbde3');
    c.shadowColor = tint ? 'rgba(170,150,255,0.5)' : 'rgba(255,255,255,0.6)';
    c.shadowBlur = 18;
    c.fillStyle = g;
    c.beginPath();
    for (const [x, y, r] of lobes) {
      c.moveTo(x + r, y);
      c.arc(x, y, r, 0, Math.PI * 2);
    }
    c.fill();
  });
}

const CLOUD = {
  start: ['#ffffff', '#f0f6ff', '#8eaedb'],
  normal: ['#ffffff', '#f0f6ff', '#8eaedb'],
  moving: ['#f4fdff', '#c4ecff', '#5aa6dc'],
  crumbly: ['#fff4e2', '#ead4b4', '#a5845f'],
  night: ['#f1edff', '#b3a8ec', '#4f42a0'],
};
const PAD = 26; // room around a cloud sprite for its glow
const TOPY = 34; // the walkable top inside the sprite

// A puffy, lit cloud platform w wide, painted once per kind and width.
function cloudSprite(kind, w, night = false) {
  return sprite(`hop:cloud:${kind}:${w}:${night}`, w + PAD * 2, 74, (c) => {
    const [hi, mid, low] = CLOUD[night && kind !== 'crumbly' && kind !== 'moving' ? 'night' : kind];
    const x0 = PAD;
    const y = TOPY;
    const s = Math.min(1, w / 84);
    const shape = () => {
      c.beginPath();
      rr(c, x0, y - 2, w, 20, 10);
      const bumps = Math.max(3, Math.round(w / 26));
      for (let i = 0; i < bumps; i++) {
        const bx = x0 + (w / bumps) * (i + 0.5);
        const r = (i % 2 ? 11 : 14) * s;
        c.moveTo(bx + r, y + 4);
        c.arc(bx, y + 4, r, 0, Math.PI * 2);
      }
      // softer lobes underneath
      for (let i = 0; i < bumps - 1; i++) {
        const bx = x0 + (w / bumps) * (i + 1);
        c.moveTo(bx + 9, y + 16);
        c.arc(bx, y + 16, 9, 0, Math.PI * 2);
      }
    };
    // an airy halo around it
    c.save();
    c.shadowColor = kind === 'moving' ? 'rgba(120,210,255,0.75)' : kind === 'crumbly' ? 'rgba(120,90,50,0.3)' : 'rgba(255,255,255,0.85)';
    c.shadowBlur = 16;
    c.shadowOffsetY = 3;
    c.fillStyle = mid;
    shape();
    c.fill();
    c.restore();
    // body: bright on top, shaded underneath
    const g = c.createLinearGradient(0, y - 14, 0, y + 26);
    g.addColorStop(0, hi);
    g.addColorStop(0.45, mid);
    g.addColorStop(1, low);
    c.fillStyle = g;
    shape();
    c.fill();
    c.save();
    shape();
    c.clip();
    // sunlit rim along the top left
    const rim = c.createRadialGradient(x0 + w * 0.3, y - 10, 2, x0 + w * 0.3, y - 10, w * 0.6);
    rim.addColorStop(0, 'rgba(255,255,255,0.95)');
    rim.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = rim;
    c.fillRect(0, 0, w + PAD * 2, 74);
    // bounce light from below
    const bl = c.createLinearGradient(0, y + 14, 0, y + 26);
    bl.addColorStop(0, 'rgba(255,255,255,0)');
    bl.addColorStop(1, kind === 'crumbly' ? 'rgba(255,200,140,0.35)' : 'rgba(200,235,255,0.5)');
    c.fillStyle = bl;
    c.fillRect(0, y + 10, w + PAD * 2, 20);
    if (kind === 'crumbly') {
      // dry cracks and specks
      c.strokeStyle = 'rgba(110,80,50,0.65)';
      c.lineWidth = 1.6;
      c.lineCap = 'round';
      c.beginPath();
      const cx = x0 + w / 2;
      c.moveTo(cx - 14, y - 6);
      c.lineTo(cx - 6, y + 4);
      c.lineTo(cx - 12, y + 12);
      c.lineTo(cx - 8, y + 20);
      c.moveTo(cx + 18, y - 4);
      c.lineTo(cx + 10, y + 8);
      c.lineTo(cx + 15, y + 16);
      c.moveTo(cx - 30, y + 2);
      c.lineTo(cx - 24, y + 10);
      c.stroke();
      c.fillStyle = 'rgba(120,90,60,0.35)';
      for (let i = 0; i < 14; i++) c.fillRect(x0 + hash(i + w) * w, y - 4 + hash(i + 9) * 24, 2, 2);
    }
    c.restore();
  });
}

// A cloud platform whose walkable top is at y. k: how dark the sky is.
function cloud(c, cl, y, t, k) {
  if (y < -70 || y > H + 70) return;
  const x = cl.x;
  const w = cl.w;
  const spr = cloudSprite(cl.kind, w);
  const sw = spr.width;
  const sh = spr.height;
  const dy = y + cl.squish * 5;
  if (cl.gone) {
    // the two halves drift apart as it falls
    c.save();
    c.globalAlpha = clamp(1 - cl.fall / 700, 0, 1);
    for (const side of [-1, 1]) {
      c.save();
      c.translate(x + side * cl.fall * 0.04, dy);
      c.rotate(side * cl.fall * 0.0006);
      const sx = side < 0 ? 0 : sw / 2;
      c.drawImage(spr, sx, 0, sw / 2, sh, sx - sw / 2, -TOPY, sw / 2, sh);
      c.restore();
    }
    c.restore();
    return;
  }

  // moonlit clouds glow faintly from beneath
  if (k > 0.3) glow(c, x, dy + 12, w * 0.7, '#7a6cff', (k - 0.3) * 0.5);
  if (cl.kind === 'moving') glow(c, x, dy + 16, w * 0.55, '#59c8ff', 0.35 + Math.sin(t * 4) * 0.1);
  const sq = 1 - cl.squish * 0.08;
  c.drawImage(spr, x - sw / 2, dy - TOPY * sq, sw, sh * sq);
  if (k > 0.2 && cl.kind !== 'crumbly' && cl.kind !== 'moving') {
    // moonlight takes over from the sun
    c.globalAlpha = Math.min(1, (k - 0.2) * 1.5);
    c.drawImage(cloudSprite(cl.kind, w, true), x - sw / 2, dy - TOPY * sq, sw, sh * sq);
    c.globalAlpha = 1;
  }

  if (cl.kind === 'moving') {
    // little glowing arrows hint that it slides
    c.strokeStyle = 'rgba(40,130,200,0.9)';
    c.lineWidth = 2.5;
    c.lineCap = 'round';
    c.lineJoin = 'round';
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

  if (cl.spring != null) spring(c, x + cl.spring, dy, cl.sprung, t);
}

// A shiny coil with a glowing pad that squashes when bounced on.
function spring(c, sx, dy, sprung, t) {
  const tall = sprung > 0 ? 8 : 18;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(sx - 8, dy);
  for (let i = 1; i <= 4; i++) c.lineTo(sx + (i % 2 ? 8 : -8), dy - (tall * i) / 4);
  c.strokeStyle = '#4c5260';
  c.lineWidth = 4.5;
  c.stroke();
  c.strokeStyle = '#d9dee8';
  c.lineWidth = 1.8;
  c.stroke();
  const py = dy - tall - 5;
  glow(c, sx, py + 3, 26 + (sprung > 0 ? 20 : 0), '#ff6a4f', 0.45 + Math.sin(t * 6) * 0.12 + sprung * 2);
  const g = c.createLinearGradient(0, py, 0, py + 7);
  g.addColorStop(0, '#ff8a6a');
  g.addColorStop(1, '#b8261f');
  c.fillStyle = g;
  rr(c, sx - 13, py, 26, 7, 3.5);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)';
  rr(c, sx - 9, py + 1, 12, 2, 1);
  c.fill();
}

// Streaks of wind rushing past during a big spring launch.
function speedLines(c, x, y, t, a) {
  const op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const ox = (hash(i) - 0.5) * 70;
    const ph = (t * 3 + hash(i + 4)) % 1;
    const ly = y + 10 + ph * 90;
    c.strokeStyle = `rgba(255,255,255,${a * 0.55 * (1 - ph)})`;
    c.lineWidth = 2 + hash(i + 8) * 2;
    c.beginPath();
    c.moveTo(x + ox, ly);
    c.lineTo(x + ox, ly + 30 + hash(i + 2) * 30);
    c.stroke();
  }
  c.globalCompositeOperation = op;
}
