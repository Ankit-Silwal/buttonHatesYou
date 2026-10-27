import { W, H, rand, clamp, drawBobby, drawScore, Mouth, Sparks, sprite, layer, scrollTile, vignette, glow, shadow, hash } from '../kit';

// Flappy Regret: tap to flap the button through gaps in the pipes.
const GRAVITY = 1500;
const FLAP = -460;
const SPEED = 170;
const PIPE_W = 78;
const SPACING = 250;
const GROUND = H - 70;
const SIZE = 50;

const FLAPS = ['Stop that.', 'Wheee… no.', 'I hate heights.', 'My wings hurt.', 'Put me down!', 'Why me?'];
const CRASH = ['OW.', 'Told you.', 'Finally.'];

export default function flap({ look, sound }) {
  const me = { x: 140, y: H * 0.42, vy: 0, angle: 0 };
  const pipes = [];
  const mouth = new Mouth();
  const sparks = new Sparks();
  let started = false;
  let t = 0;
  let scroll = 0;
  let squash = 0;

  const gap = () => clamp(210 - g.score * 3, 150, 210);
  const addPipe = (x) => {
    const size = gap();
    const top = rand(110, GROUND - size - 60);
    pipes.push({ x, top, size, passed: false });
  };

  const crash = () => {
    if (g.over) return;
    g.over = true;
    me.vy = Math.min(me.vy, -200);
    sound.hit();
    sparks.burst(me.x, me.y, look.color, 16);
    sparks.burst(me.x, me.y, '#ffffff', 8, 140); // loose feathers
    mouth.say(CRASH[Math.floor(Math.random() * CRASH.length)], 3);
  };

  const flapNow = () => {
    if (g.over) return;
    if (!started) {
      started = true;
      addPipe(W + 60);
    }
    me.vy = FLAP;
    squash = 0.18;
    sparks.burst(me.x - 6, me.y + SIZE * 0.4, '#fff4ea', 3, 90); // a puff of air
    sound.jump();
    mouth.maybe(FLAPS, 0.2);
  };

  const g = {
    score: 0,
    over: false,
    down: flapNow,
    key(code) {
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') flapNow();
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      squash = Math.max(0, squash - dt);

      if (!started) {
        me.y = H * 0.42 + Math.sin(t * 3) * 10; // hover until the first tap
        return;
      }

      me.vy += GRAVITY * dt;
      me.y += me.vy * dt;
      me.angle = clamp(me.vy / 900, -0.45, 1.2);

      if (me.y + SIZE / 2 > GROUND) {
        me.y = GROUND - SIZE / 2;
        me.vy = 0;
        crash();
      }
      if (me.y < SIZE / 2) {
        me.y = SIZE / 2;
        me.vy = 0;
      }
      if (g.over) return;

      scroll += SPEED * dt;
      for (const p of pipes) {
        p.x -= SPEED * dt;
        if (!p.passed && p.x + PIPE_W < me.x) {
          p.passed = true;
          g.score++;
          sound.pop();
          sparks.float(me.x, me.y - 40, '+1');
        }
        // a slightly forgiving circle-vs-rectangle check
        const r = SIZE * 0.4;
        const nx = clamp(me.x, p.x, p.x + PIPE_W);
        const hitsTop = Math.hypot(me.x - nx, me.y - clamp(me.y, -100, p.top)) < r;
        const hitsBottom = Math.hypot(me.x - nx, me.y - clamp(me.y, p.top + p.size, H)) < r;
        if (hitsTop || hitsBottom) crash();
      }
      if (pipes.length && pipes[0].x < -PIPE_W) pipes.shift();
      if (pipes[pipes.length - 1].x < W - SPACING) addPipe(W + 20);
    },

    draw(c) {
      // a dusk sky with the sun sinking behind three layers of hills
      c.drawImage(skyArt(), 0, 0, W, H);
      const sunPulse = 1 + Math.sin(t * 0.8) * 0.03;
      glow(c, SUN.x, SUN.y, 230 * sunPulse, '#ff9a5c', 0.55);

      for (let i = 0; i < 5; i++) {
        const x = (((i * 170 - scroll * 0.12 - t * 6) % (W + 260)) + W + 260) % (W + 260) - 160;
        c.drawImage(cloudArt(i % 3), x, 90 + (i % 3) * 95 + (i === 4 ? 40 : 0));
      }
      scrollTile(c, ridgeArt(0), scroll * 0.18, GROUND - 330);
      scrollTile(c, ridgeArt(1), scroll * 0.4, GROUND - 230);
      scrollTile(c, ridgeArt(2), scroll * 0.7, GROUND - 150);

      // drifting motes catching the last light
      for (let i = 0; i < 14; i++) {
        const mx = (((hash(i) * W * 1.4 - scroll * (0.3 + hash(i + 9) * 0.5)) % (W + 40)) + W + 40) % (W + 40) - 20;
        const my = 260 + hash(i + 3) * 420 + Math.sin(t * (0.6 + hash(i + 5)) + i) * 18;
        glow(c, mx, my, 10 + hash(i + 7) * 8, '#ffc27a', 0.35 + Math.sin(t * 2 + i * 1.7) * 0.2);
      }

      for (const p of pipes) pipe(c, p);

      // the ground: lit grass lip over dark soil, scrolling with the pipes
      scrollTile(c, groundArt(), scroll, GROUND - 10);

      // the button's shadow on the ground shrinks as it climbs
      const lift = clamp((GROUND - me.y) / 500, 0, 1);
      shadow(c, me.x, GROUND + 3, SIZE * (0.55 - lift * 0.3), 0.35 * (1 - lift * 0.7));

      // wings flap faster on the way up
      const beat = Math.sin(t * (me.vy < 0 ? 40 : 14));
      wing(c, me, -1, beat);
      drawBobby(c, me.x, me.y, SIZE, {
        look,
        t,
        angle: me.angle,
        squash,
        mood: g.over ? 'sad' : me.vy < -150 ? 'shout' : 'worried',
        tears: g.over,
      });
      wing(c, me, 1, beat);

      sparks.draw(c);
      vignette(c, 0.42, '#12061f');
      mouth.draw(c, me.x, me.y - SIZE * 0.7);

      if (started) drawScore(c, g.score);
      else drawScore(c, 'Tap to flap', 'It will complain. Ignore it.');
    },
  };
  return g;
}

/* ---------- cached art ---------- */
const SUN = { x: 330, y: GROUND - 370 };
const TILE = 960; // the hill strips repeat every TILE px, so they scroll seamlessly

function skyArt() {
  return layer('flap:sky', (c) => {
    const g = c.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, '#141a45');
    g.addColorStop(0.32, '#3a2f72');
    g.addColorStop(0.58, '#8a4f8e');
    g.addColorStop(0.78, '#e9787e');
    g.addColorStop(0.92, '#ffb27a');
    g.addColorStop(1, '#ffd49a');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    // faint stars in the high, dark part of the sky
    for (let i = 0; i < 70; i++) {
      const y = hash(i * 2.3) * 300;
      c.globalAlpha = (1 - y / 300) * (0.35 + hash(i + 40) * 0.6);
      c.fillStyle = '#fff';
      const s = hash(i + 80) < 0.15 ? 2 : 1.2;
      c.fillRect(hash(i * 1.7 + 4) * W, y, s, s);
    }
    c.globalAlpha = 1;
    // the sun disc with a hot core
    const s = c.createRadialGradient(SUN.x, SUN.y, 0, SUN.x, SUN.y, 46);
    s.addColorStop(0, '#fffbe8');
    s.addColorStop(0.6, '#ffe2a6');
    s.addColorStop(1, '#ffc27a');
    c.fillStyle = s;
    c.beginPath();
    c.arc(SUN.x, SUN.y, 44, 0, Math.PI * 2);
    c.fill();
    // a warm haze band along the horizon
    const h = c.createLinearGradient(0, GROUND - 260, 0, GROUND);
    h.addColorStop(0, 'rgba(255,190,140,0)');
    h.addColorStop(1, 'rgba(255,200,150,0.35)');
    c.fillStyle = h;
    c.fillRect(0, GROUND - 260, W, 260);
  });
}

// Three hill silhouettes, far (hazy, sunlit) to near (dark). Their outline is
// a sum of sines whose periods divide TILE, so each strip tiles seamlessly.
const RIDGES = [
  { h: 340, top: 70, amp: [46, 22, 9], k: [2, 5, 13], fill: ['#9a5e93', '#c77d8f'], rim: 'rgba(255,214,170,0.75)' },
  { h: 240, top: 70, amp: [34, 16, 7], k: [3, 7, 17], fill: ['#5a3a73', '#7e4b80'], rim: 'rgba(255,170,140,0.6)' },
  { h: 170, top: 62, amp: [26, 12, 6], k: [4, 9, 23], fill: ['#2b1f48', '#3a2858'], trees: true },
];
function ridgeArt(i) {
  const r = RIDGES[i];
  return sprite(`flap:ridge:${i}`, TILE, r.h, (c) => {
    const yAt = (x) => r.top + r.amp.reduce((s, a, j) => s + a * Math.sin((x / TILE) * Math.PI * 2 * r.k[j] + j * 1.7 + i), 0);
    c.beginPath();
    c.moveTo(0, r.h);
    for (let x = 0; x <= TILE; x += 4) c.lineTo(x, yAt(x));
    c.lineTo(TILE, r.h);
    c.closePath();
    const g = c.createLinearGradient(0, 0, 0, r.h);
    g.addColorStop(0, r.fill[1]);
    g.addColorStop(1, r.fill[0]);
    c.fillStyle = g;
    c.fill();
    if (r.trees) {
      // a row of round treetops riding the near ridge
      c.fillStyle = r.fill[0];
      for (let x = 0; x < TILE; x += 22) {
        const rad = 12 + hash(x * 0.37 + i) * 12;
        const ty = yAt(x + 11) + 8;
        for (const ox of [0, -TILE, TILE]) {
          // copies across the seam keep the strip tileable
          c.beginPath();
          c.arc(x + 11 + ox, ty, rad, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
    // the sun catches the top edge (the treeline hides it on the near ridge)
    c.globalCompositeOperation = 'source-atop';
    if (!r.trees) {
      c.strokeStyle = r.rim;
      c.lineWidth = 3;
      c.beginPath();
      for (let x = 0; x <= TILE; x += 4) c.lineTo(x, yAt(x) + 1);
      c.stroke();
    }
    // haze towards the bottom: further hills melt into the air
    const hz = c.createLinearGradient(0, 0, 0, r.h);
    hz.addColorStop(0, 'rgba(255,170,150,0)');
    hz.addColorStop(1, `rgba(255,170,150,${0.28 - i * 0.08})`);
    c.fillStyle = hz;
    c.fillRect(0, 0, TILE, r.h);
  });
}

// Fluffy clouds lit from below by the setting sun.
function cloudArt(v) {
  return sprite(`flap:cloud:${v}`, 160, 80, (c) => {
    const parts = [
      [[34, 48, 22], [62, 34, 28], [96, 40, 24], [122, 50, 18], [80, 54, 22]],
      [[30, 50, 18], [56, 38, 24], [86, 32, 22], [114, 46, 22], [138, 54, 14]],
      [[44, 46, 20], [74, 36, 26], [104, 48, 20]],
    ][v];
    c.beginPath();
    for (const [x, y, r] of parts) {
      c.moveTo(x + r, y);
      c.arc(x, y, r, 0, Math.PI * 2);
    }
    const g = c.createLinearGradient(0, 8, 0, 74);
    g.addColorStop(0, '#6f5a9e');
    g.addColorStop(0.55, '#b5789f');
    g.addColorStop(1, '#ffb58f');
    c.fillStyle = g;
    c.globalAlpha = 0.9;
    c.fill();
  });
}

function groundArt() {
  return sprite('flap:ground', TILE, H - GROUND + 10, (c) => {
    const h = H - GROUND + 10;
    const g = c.createLinearGradient(0, 10, 0, h);
    g.addColorStop(0, '#4a2f3e');
    g.addColorStop(1, '#1c1224');
    c.fillStyle = g;
    c.fillRect(0, 10, TILE, h);
    // pebbles in the soil
    for (let i = 0; i < 90; i++) {
      c.fillStyle = `rgba(255,200,170,${0.05 + hash(i + 3) * 0.08})`;
      c.beginPath();
      c.ellipse(hash(i) * TILE, 30 + hash(i + 1) * (h - 34), 2 + hash(i + 2) * 4, 1.5 + hash(i + 2) * 2, 0, 0, Math.PI * 2);
      c.fill();
    }
    // the grass lip, sunlit on top, with tufts (spaced to divide TILE)
    const lip = c.createLinearGradient(0, 4, 0, 26);
    lip.addColorStop(0, '#9ad06a');
    lip.addColorStop(0.35, '#4f9a4a');
    lip.addColorStop(1, '#2b5a36');
    c.fillStyle = lip;
    c.fillRect(0, 10, TILE, 16);
    c.beginPath();
    for (let x = 0; x < TILE; x += 8) {
      const hh = 5 + hash(x * 0.13) * 7;
      c.moveTo(x, 12);
      c.lineTo(x + 4, 12 - hh);
      c.lineTo(x + 8, 12);
    }
    c.fill();
    c.fillStyle = 'rgba(255,225,160,0.55)';
    c.fillRect(0, 10, TILE, 2);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(0, 26, TILE, 3);
  });
}

// The pipe body as a 1px-tall cylinder strip, and its lip, rendered once.
function pipeStrip(w, lipped) {
  return sprite(`flap:pipe:${w}:${lipped}`, w, 4, (c) => {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#1d5a52');
    g.addColorStop(0.12, '#2f8c74');
    g.addColorStop(0.3, '#7fe0b0');
    g.addColorStop(0.38, '#d8ffe6');
    g.addColorStop(0.46, '#6fd2a2');
    g.addColorStop(0.78, '#2a7a68');
    g.addColorStop(0.9, '#1b4d4a');
    g.addColorStop(1, '#a8706a'); // the sun's rim light on the right edge
    c.fillStyle = g;
    c.fillRect(0, 0, w, 4);
  });
}
function pipeLip() {
  const w = PIPE_W + 12;
  return sprite('flap:lip', w, 26, (c) => {
    c.beginPath();
    c.roundRect(0, 0, w, 26, 6);
    c.save();
    c.clip();
    c.drawImage(pipeStrip(w, 1), 0, 0, w, 26);
    const v = c.createLinearGradient(0, 0, 0, 26);
    v.addColorStop(0, 'rgba(255,255,255,0.35)');
    v.addColorStop(0.2, 'rgba(255,255,255,0)');
    v.addColorStop(0.8, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,20,20,0.35)');
    c.fillStyle = v;
    c.fillRect(0, 0, w, 26);
    c.restore();
    c.strokeStyle = 'rgba(10,40,40,0.55)';
    c.lineWidth = 2;
    c.beginPath();
    c.roundRect(1, 1, w - 2, 24, 5);
    c.stroke();
  });
}
// A soft dark band: the lip's shadow on the pipe body.
function lipShade() {
  return sprite('flap:lipShade', 4, 32, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 32);
    g.addColorStop(0, 'rgba(5,25,30,0.5)');
    g.addColorStop(1, 'rgba(5,25,30,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 4, 32);
  });
}

function pipe(c, p) {
  const strip = pipeStrip(PIPE_W, 0);
  const x = Math.round(p.x);
  const bottomY = p.top + p.size;
  c.drawImage(strip, x, -10, PIPE_W, p.top + 10);
  c.drawImage(strip, x, bottomY, PIPE_W, GROUND - bottomY);
  // shade where the lips overhang the body (the top one hangs down, flip it)
  c.save();
  c.translate(0, p.top - 26);
  c.scale(1, -1);
  c.drawImage(lipShade(), x, 0, PIPE_W, 26);
  c.restore();
  c.drawImage(lipShade(), x, bottomY + 26, PIPE_W, 26);
  c.drawImage(pipeLip(), x - 6, p.top - 26);
  c.drawImage(pipeLip(), x - 6, bottomY);
  // grounded: a little contact shadow at the foot of the bottom pipe
  shadow(c, x + PIPE_W / 2, GROUND + 2, PIPE_W * 0.75, 0.4, 6);
}

// A feathered wing: three lobes with a soft gradient, rendered once.
function wingArt() {
  return sprite('flap:wing', 64, 32, (c) => {
    c.translate(4, 16);
    const g = c.createLinearGradient(0, -12, 0, 12);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.6, '#e9eefc');
    g.addColorStop(1, '#b9c3e6');
    c.fillStyle = g;
    c.strokeStyle = 'rgba(90,90,140,0.55)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(28, -1, 26, 10, 0, 0, Math.PI * 2);
    c.ellipse(36, 4, 20, 7, 0.15, 0, Math.PI * 2);
    c.ellipse(42, 8, 14, 5, 0.3, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.fill();
    c.strokeStyle = 'rgba(120,120,170,0.35)';
    c.beginPath();
    c.moveTo(8, 0);
    c.quadraticCurveTo(30, 2, 50, 6);
    c.stroke();
  });
}

function wing(c, me, side, beat) {
  c.save();
  c.translate(me.x - 4, me.y - 6);
  c.rotate(me.angle);
  c.scale(side, 1);
  c.rotate(-0.4 + beat * 0.6);
  c.drawImage(wingArt(), -2, -16);
  c.restore();
}
