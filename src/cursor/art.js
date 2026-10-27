import { W, H } from '@/reason/engine';
import { Thing } from '@/reason/actors';

// How I Met Your Cursor's own lighting and atmosphere, painted on top of the
// shared story engine through g.art = { back, front }:
//   back  — after the sky: sun bloom, light shafts, horizon haze, far bokeh
//   world — a z:-50 entity (after scenery, before characters): set dressing
//   front — after the world: lamp glows, motes, darkness, colour grade,
//           foreground silhouettes, vignette
// Every gradient and glow is drawn once into a small cached canvas and then
// stamped (often with additive blending), so a frame is mostly drawImage.

/* ---------- cached sprites ---------- */
const cache = new Map();
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
export function sprite(key, w, h, paint) {
  let s = cache.get(key);
  if (!s) {
    s = canvas(w, h);
    paint(s.getContext('2d'), w, h);
    cache.set(key, s);
  }
  return s;
}

// A soft round glow in one colour ('r,g,b'). Stamp it with 'lighter'.
export function glow(rgb) {
  return sprite(`glow:${rgb}`, 128, 128, (c) => {
    const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(0.18, `rgba(${rgb},0.55)`);
    gr.addColorStop(0.45, `rgba(${rgb},0.18)`);
    gr.addColorStop(0.75, `rgba(${rgb},0.05)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = gr;
    c.fillRect(0, 0, 128, 128);
  });
}
export function stamp(c, img, x, y, r, a = 1) {
  if (a <= 0.004) return;
  c.globalAlpha = a > 1 ? 1 : a;
  c.drawImage(img, x - r, y - r, r * 2, r * 2);
}
// glow helper: additive is up to the caller
export function drawGlow(c, rgb, x, y, r, a = 1) {
  stamp(c, glow(rgb), x, y, r, a);
}

// A flat-topped "out of focus" disc for bokeh.
function bokehDisc(rgb) {
  return sprite(`bokeh:${rgb}`, 96, 96, (c) => {
    const gr = c.createRadialGradient(48, 48, 0, 48, 48, 46);
    gr.addColorStop(0, `rgba(${rgb},0.55)`);
    gr.addColorStop(0.7, `rgba(${rgb},0.5)`);
    gr.addColorStop(0.86, `rgba(${rgb},0.65)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = gr;
    c.beginPath();
    c.arc(48, 48, 46, 0, Math.PI * 2);
    c.fill();
  });
}

// A four-point twinkle.
export function twinkle(rgb) {
  return sprite(`tw:${rgb}`, 64, 64, (c) => {
    c.drawImage(glow(rgb), 16, 16, 32, 32);
    const gr = c.createLinearGradient(0, 0, 64, 0);
    gr.addColorStop(0, `rgba(${rgb},0)`);
    gr.addColorStop(0.5, 'rgba(255,255,255,1)');
    gr.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = gr;
    c.fillRect(0, 31, 64, 2);
    c.save();
    c.translate(32, 32);
    c.rotate(Math.PI / 2);
    c.fillRect(-32, -1, 64, 2);
    c.restore();
  });
}

// A soft glowing heart.
export function heartGlow(rgb) {
  return sprite(`heart:${rgb}`, 64, 64, (c) => {
    c.drawImage(glow(rgb), 0, 0, 64, 64);
    c.fillStyle = `rgba(${rgb},0.9)`;
    c.beginPath();
    const x = 32;
    const y = 27;
    const r = 9;
    c.moveTo(x, y + r * 1.6);
    c.bezierCurveTo(x - r * 2.2, y + r * 0.2, x - r * 1.1, y - r * 1.3, x, y - r * 0.2);
    c.bezierCurveTo(x + r * 1.1, y - r * 1.3, x + r * 2.2, y + r * 0.2, x, y + r * 1.6);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath();
    c.ellipse(x - 5, y - 1, 3, 2, -0.6, 0, Math.PI * 2);
    c.fill();
  });
}

// A light shaft: a tall soft wedge, bright at the top.
function shaft(rgb) {
  return sprite(`shaft:${rgb}`, 64, 256, (c) => {
    const across = c.createLinearGradient(0, 0, 64, 0);
    across.addColorStop(0, `rgba(${rgb},0)`);
    across.addColorStop(0.5, `rgba(${rgb},1)`);
    across.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = across;
    c.fillRect(0, 0, 64, 256);
    c.globalCompositeOperation = 'destination-in';
    const down = c.createLinearGradient(0, 0, 0, 256);
    down.addColorStop(0, 'rgba(0,0,0,1)');
    down.addColorStop(0.6, 'rgba(0,0,0,0.35)');
    down.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = down;
    c.fillRect(0, 0, 64, 256);
  });
}

// Vertical gradient strip (stretched to the screen when drawn).
function vstrip(key, stops) {
  return sprite(`v:${key}`, 2, 128, (c) => {
    const gr = c.createLinearGradient(0, 0, 0, 128);
    for (const [k, col] of stops) gr.addColorStop(k, col);
    c.fillStyle = gr;
    c.fillRect(0, 0, 2, 128);
  });
}

// An elliptical vignette (a small canvas stretched over the screen).
function vignette(rgb, inner) {
  return sprite(`vig:${rgb}:${inner}`, 192, 108, (c) => {
    c.save();
    c.scale(1, 108 / 192);
    const gr = c.createRadialGradient(96, 96, 96 * inner, 96, 96, 118);
    gr.addColorStop(0, `rgba(${rgb},0)`);
    gr.addColorStop(0.6, `rgba(${rgb},0.45)`);
    gr.addColorStop(1, `rgba(${rgb},1)`);
    c.fillStyle = gr;
    c.fillRect(0, 0, 192, 192);
    c.restore();
  });
}

// Foreground grass and flowers, blurred once (they're closer than the focus).
function fgGrass(col, flowers) {
  return sprite(`fg:${col}:${flowers}`, 1024, 96, (c) => {
    const tmp = canvas(1024, 96);
    const t = tmp.getContext('2d');
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    t.fillStyle = col;
    t.strokeStyle = col;
    t.lineCap = 'round';
    for (let i = 0; i < 340; i++) {
      const x = rnd() * 1024;
      // clumps: taller blades bunch up in a few places
      const clump = 0.5 + 0.5 * Math.sin(x / 90) * Math.sin(x / 37 + 1);
      const h = 10 + rnd() * 34 * (0.4 + clump);
      const lean = (rnd() - 0.5) * 16;
      t.lineWidth = 2 + rnd() * 3;
      t.beginPath();
      t.moveTo(x, 96);
      t.quadraticCurveTo(x + lean * 0.3, 96 - h * 0.6, x + lean, 96 - h);
      t.stroke();
    }
    t.fillRect(0, 84, 1024, 12);
    if (flowers) {
      for (let i = 0; i < 14; i++) {
        const x = 30 + rnd() * 964;
        const y = 50 + rnd() * 26;
        t.lineWidth = 2;
        t.beginPath();
        t.moveTo(x, 96);
        t.lineTo(x + 2, y);
        t.stroke();
        t.fillStyle = flowers[i % flowers.length];
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          t.beginPath();
          t.arc(x + 2 + Math.cos(a) * 4, y + Math.sin(a) * 4, 3.4, 0, Math.PI * 2);
          t.fill();
        }
        t.fillStyle = col;
      }
    }
    c.filter = 'blur(1.6px)';
    c.drawImage(tmp, 0, 0);
    c.filter = 'none';
  });
}

/* ---------- moods ---------- */
// rgb strings are 'r,g,b'. grade = soft-light gradient (top, bottom).
const MOODS = {
  morning: {
    day: 1,
    sun: { x: 0.8125, y: 90, rgb: '255,236,190', r: 260, a: 0.55 },
    shafts: { rgb: '255,238,200', a: 0.07, from: 0.86, n: 5, tilt: 0.38 },
    haze: { rgb: '255,250,240', y: 0.62, a: 0.32 },
    motes: { kind: 'pollen', n: 34, rgb: '255,240,190' },
    grade: ['rgba(255,200,150,0.3)', 'rgba(90,110,180,0.22)'],
    vig: { rgb: '40,24,40', a: 0.32, inner: 0.55 },
    fg: { col: '#24461f', flowers: ['#ff8fb1', '#f2c14e', '#fff2f6'] },
  },
  noon: {
    day: 1,
    sun: { x: 0.8125, y: 90, rgb: '255,246,210', r: 240, a: 0.45 },
    shafts: { rgb: '255,248,220', a: 0.05, from: 0.84, n: 4, tilt: 0.3 },
    haze: { rgb: '250,252,255', y: 0.62, a: 0.3 },
    motes: { kind: 'pollen', n: 26, rgb: '255,248,210' },
    grade: ['rgba(255,214,160,0.24)', 'rgba(80,110,190,0.2)'],
    vig: { rgb: '30,30,50', a: 0.28, inner: 0.58 },
    fg: { col: '#24461f', flowers: ['#ff8fb1', '#f2c14e'] },
  },
  dinner: {
    dim: { rgb: '86,40,40', a: 0.3 },
    motes: { kind: 'dust', n: 30, rgb: '255,214,150' },
    bokeh: { n: 8, rgbs: ['255,190,120', '255,150,120', '255,220,170'], a: 0.16 },
    grade: ['rgba(255,170,110,0.45)', 'rgba(120,40,70,0.45)'],
    vig: { rgb: '30,8,16', a: 0.62, inner: 0.42 },
    lights: 1,
    garland: { y: 46, rgb: '255,214,140', sag: 26 },
  },
  moonlit: {
    sun: { x: 760 / 960, y: 96, rgb: '200,220,255', r: 220, a: 0.35 },
    haze: { rgb: '120,140,210', y: 0.66, a: 0.3 },
    motes: { kind: 'firefly', n: 22, rgb: '210,255,140' },
    bokeh: { n: 5, rgbs: ['150,170,255', '255,170,210'], a: 0.1 },
    grade: ['rgba(90,110,220,0.4)', 'rgba(30,20,70,0.5)'],
    vig: { rgb: '4,6,20', a: 0.65, inner: 0.42 },
    lights: 1,
    fg: { col: '#0a1222', flowers: null },
  },
  forest: {
    shafts: { rgb: '230,255,200', a: 0.085, from: 0.3, n: 7, tilt: 0.28, sway: 1 },
    haze: { rgb: '210,240,220', y: 0.72, a: 0.2 },
    motes: { kind: 'spore', n: 32, rgb: '200,255,210' },
    grade: ['rgba(240,255,200,0.3)', 'rgba(20,60,70,0.4)'],
    vig: { rgb: '6,24,20', a: 0.42, inner: 0.5 },
    fg: { col: '#173225', flowers: ['#b6f0ff', '#ffe08a'] },
    glitch: 1,
  },
  mine: {
    dark: { rgb: '10,6,14', a: 0.6 },
    motes: { kind: 'ember', n: 26, rgb: '255,196,110' },
    grade: ['rgba(255,170,90,0.35)', 'rgba(40,20,60,0.5)'],
    vig: { rgb: '0,0,0', a: 0.55, inner: 0.45 },
    lights: 1,
  },
  golden: {
    day: 1,
    sun: { x: 0.8125, y: 330, rgb: '255,196,120', r: 330, a: 0.45, flare: 1 },
    shafts: { rgb: '255,210,150', a: 0.08, from: 0.74, n: 6, tilt: 0.55, low: 1 },
    haze: { rgb: '255,210,170', y: 0.6, a: 0.38 },
    motes: { kind: 'pollen', n: 36, rgb: '255,220,160' },
    grade: ['rgba(255,170,110,0.55)', 'rgba(150,60,110,0.45)'],
    vig: { rgb: '60,14,30', a: 0.42, inner: 0.5 },
    fg: { col: '#3a1a1c', flowers: ['#ff8fb1', '#ffd36b'] },
  },
  wedding: {
    day: 1,
    sun: { x: 0.8125, y: 90, rgb: '255,240,210', r: 260, a: 0.5 },
    shafts: { rgb: '255,240,220', a: 0.06, from: 0.86, n: 5, tilt: 0.38 },
    haze: { rgb: '255,244,248', y: 0.62, a: 0.32 },
    motes: { kind: 'sparkle', n: 14, rgb: '255,214,232' },
    grade: ['rgba(255,196,206,0.28)', 'rgba(100,110,200,0.2)'],
    vig: { rgb: '40,20,40', a: 0.3, inner: 0.55 },
    fg: { col: '#24461f', flowers: ['#ff8fb1', '#ffffff', '#ffc2d6'] },
    bunting: 1,
  },
  hall: {
    dim: { rgb: '150,70,110', a: 0.22 },
    motes: { kind: 'sparkle', n: 16, rgb: '255,214,232' },
    bokeh: { n: 7, rgbs: ['255,170,200', '255,214,170'], a: 0.12 },
    grade: ['rgba(255,214,190,0.4)', 'rgba(200,90,150,0.35)'],
    vig: { rgb: '60,16,40', a: 0.42, inner: 0.5 },
    lights: 1,
    garland: { y: 34, rgb: '255,226,170', sag: 30 },
    chandelier: [300, 660],
  },
  home: {
    dim: { rgb: '40,30,70', a: 0.28 },
    motes: { kind: 'dust', n: 22, rgb: '255,220,170' },
    grade: ['rgba(255,190,130,0.4)', 'rgba(60,50,120,0.45)'],
    vig: { rgb: '14,8,24', a: 0.55, inner: 0.45 },
    lights: 1,
  },
};

function moodName(g) {
  const theme = g.level.theme;
  const n = g.art.n;
  if (theme === 'night') return 'moonlit';
  if (theme === 'forest') return 'forest';
  if (theme === 'mine') return 'mine';
  if (theme === 'sunset') return 'golden';
  if (theme === 'bedroom') {
    if (n === 3) return 'dinner';
    return g.deco.some((d) => d.t === 'weddingPhoto') ? 'home' : 'hall';
  }
  if (n === 6) return 'wedding';
  if (n === 2) return 'noon';
  return 'morning';
}

/* ---------- motes (screen-space, parallax-wrapped, never allocated per frame) ---------- */
function makeMotes(m) {
  const list = [];
  const n = m?.n ?? 0;
  for (let i = 0; i < n; i++) {
    list.push({
      x: Math.random() * (W + 80),
      y: Math.random() * H,
      z: 0.4 + Math.random() * 1.1,
      ph: Math.random() * 100,
      sp: 0.5 + Math.random(),
    });
  }
  return list;
}

const wrap = (v, m) => ((v % m) + m) % m;

function drawMotes(c, g, art, m) {
  const list = art.motes;
  if (!list.length) return;
  const t = g.time;
  const cam = g.cam;
  const kind = m.kind;
  const img = kind === 'sparkle' ? twinkle(m.rgb) : glow(m.rgb);
  c.globalCompositeOperation = art.m.day ? 'source-over' : 'lighter';
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    let x = p.x - cam.x * p.z * 0.6;
    let y = p.y - cam.y * p.z * 0.3;
    let r = 3 * p.z;
    let a = 0.5;
    if (kind === 'pollen') {
      x += t * 9 * p.sp + Math.sin(t * 0.7 + p.ph) * 18;
      y += Math.sin(t * 0.5 + p.ph * 2) * 22 - t * 4 * p.sp;
      r = 2.5 + 3 * p.z;
      a = 0.35 + 0.3 * Math.sin(t * 2 + p.ph);
    } else if (kind === 'dust') {
      x += Math.sin(t * 0.3 + p.ph) * 30;
      y += Math.sin(t * 0.23 + p.ph * 3) * 26 + t * 3 * p.sp;
      r = 1.5 + 2.4 * p.z;
      a = 0.25 + 0.25 * Math.sin(t * 1.3 + p.ph);
    } else if (kind === 'firefly') {
      x += Math.sin(t * 0.6 * p.sp + p.ph) * 60 + Math.sin(t * 1.7 + p.ph) * 10;
      y = p.y * 0.5 + H * 0.38 + Math.sin(t * 0.8 * p.sp + p.ph * 2) * 50 - cam.y * p.z * 0.3;
      r = 5 + 5 * p.z;
      a = Math.max(0, Math.sin(t * 1.6 * p.sp + p.ph)) * 0.9;
    } else if (kind === 'spore') {
      x += Math.sin(t * 0.4 + p.ph) * 26;
      y -= t * 10 * p.sp;
      r = 2.5 + 3.5 * p.z;
      a = 0.3 + 0.25 * Math.sin(t * 1.1 + p.ph);
    } else if (kind === 'ember') {
      x += Math.sin(t * 1.2 + p.ph) * 14;
      y -= t * 22 * p.sp;
      r = 2 + 3 * p.z;
      a = 0.35 + 0.4 * Math.abs(Math.sin(t * 3 * p.sp + p.ph));
    } else if (kind === 'sparkle') {
      x += Math.sin(t * 0.4 + p.ph) * 20;
      y += t * 8 * p.sp;
      r = 1.5 + 3 * p.z * Math.abs(Math.sin(t * 1.4 * p.sp + p.ph));
      a = 0.7;
    }
    stamp(c, img, wrap(x, W + 80) - 40, wrap(y, H + 60) - 30, r * 2.4, a * art.ambient);
  }
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
}

/* ---------- world <-> screen ---------- */
function sx(g, x) {
  return (x - g.cam.x) * g.cam.zoom + W / 2 + g.cam.ox;
}
function sy(g, y) {
  return (y - g.cam.y) * g.cam.zoom + H / 2 + g.cam.oy;
}

// Light sources, gathered into a reused list: [x, y, r, rgb, a]
function gatherLights(g, art) {
  const L = art.lights;
  L.n = 0;
  const add = (x, y, r, rgb, a) => {
    let s = L.items[L.n];
    if (!s) s = L.items[L.n] = [0, 0, 0, '', 0];
    s[0] = x;
    s[1] = y;
    s[2] = r;
    s[3] = rgb;
    s[4] = a;
    L.n++;
  };
  const flick = (k) => 0.92 + 0.08 * Math.sin(g.time * 9 + k) * Math.sin(g.time * 5.3 + k * 2);
  for (const d of g.deco) {
    if (d.off) continue;
    if (d.t === 'lamppost') add(d.x + 3, d.y - 124, 190, '255,214,140', flick(d.x));
    else if (d.t === 'lamp') add(d.x + 10, d.y - 70, 130, '255,206,130', flick(d.x));
    else if (d.t === 'window' && d.night) add(d.x + d.w / 2, d.y + d.h / 2, d.w * 0.9, '170,190,255', 0.3);
    else if (d.t === 'window') add(d.x + d.w / 2, d.y + d.h / 2, d.w, '255,244,220', 0.5);
    else if (d.t === 'table' && art.mood === 'dinner') add(d.x + 45, d.y - 58, 90, '255,190,110', flick(d.x + 3));
    else if (d.t === 'campfire') add(d.x + 20, d.y - 20, 160, '255,160,80', flick(d.x));
    else if (d.t === 'bloomVase') add(d.x + 10, d.y - 30, 70, '255,170,220', 0.6);
  }
  if (art.mood === 'mine' || art.mood === 'moonlit' || art.mood === 'home') {
    const p = g.player;
    if (p && !p.hidden && !p.dead) add(p.x + p.w / 2, p.y + p.h / 2, art.mood === 'mine' ? 170 : 60, '255,220,180', art.mood === 'mine' ? 0.55 : 0.25);
  }
  for (const e of g.ents) {
    if (e.dead || e.hidden) continue;
    if (e.light) add(e.x + e.w / 2, e.y + e.h / 2, e.light.r, e.light.rgb, e.light.a ?? 1);
    else if (e.clickable) add(e.x + e.w / 2, e.y + e.h / 2, 70, '127,220,255', 0.7);
    else if (e.kind === 'coin' && art.mood === 'mine') add(e.x + e.w / 2, e.y + e.h / 2, 40, '255,210,90', 0.6);
  }
}

function paintLights(c, g, art, scale = 1) {
  const L = art.lights;
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < L.n; i++) {
    const [x, y, r, rgb, a] = L.items[i];
    const X = sx(g, x);
    const Y = sy(g, y);
    const R = r * g.cam.zoom * scale;
    if (X + R < 0 || X - R > W || Y + R < 0 || Y - R > H) continue;
    stamp(c, glow(rgb), X, Y, R, a * 0.55);
  }
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
}

/* ---------- the layers ---------- */
function back(c, g) {
  const art = g.art;
  syncMood(g, art);
  const m = art.m;
  const t = g.time;
  const cam = g.cam;
  c.save();
  if (m.sun) {
    const s = m.sun;
    const x = W * s.x - cam.x * 0.02;
    // on a bright sky, additive light turns cyan; alpha-blend a warm bloom instead
    c.globalCompositeOperation = m.day ? 'source-over' : 'lighter';
    drawGlow(c, s.rgb, x, s.y, s.r * (1 + 0.02 * Math.sin(t * 0.8)), s.a);
    drawGlow(c, s.rgb, x, s.y, s.r * 0.32, s.a * 0.9);
  }
  if (m.shafts) drawShafts(c, g, m.shafts, 1);
  if (m.haze) {
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = m.haze.a;
    const y0 = H * m.haze.y - cam.y * 0.05 + 120;
    c.drawImage(vstrip(`haze:${m.haze.rgb}`, [[0, `rgba(${m.haze.rgb},0)`], [0.55, `rgba(${m.haze.rgb},1)`], [1, `rgba(${m.haze.rgb},0)`]]), 0, y0 - 220, W, 300);
  }
  // romance: pink bloom behind everything
  if (art.love > 0.01) {
    c.globalCompositeOperation = m.day ? 'source-over' : 'lighter';
    drawGlow(c, m.day ? '255,170,200' : '255,120,170', W * 0.5, H * 0.55, 520, art.love * (m.day ? 0.14 : 0.25));
  }
  c.restore();
}

function drawShafts(c, g, s, k) {
  const t = g.time;
  const img = shaft(s.rgb);
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < s.n; i++) {
    const base = W * s.from + (i - s.n / 2) * (s.low ? 70 : 110) - g.cam.x * 0.05 * (1 + i * 0.1);
    const sway = s.sway ? Math.sin(t * 0.3 + i * 1.7) * 0.06 : 0;
    const a = s.a * k * (0.6 + 0.4 * Math.sin(t * 0.4 + i * 2.1));
    c.save();
    c.translate(wrap(base, W + 400) - 200, s.low ? 120 : -30);
    c.rotate(s.tilt + sway + (i % 3) * 0.04);
    c.globalAlpha = a;
    c.drawImage(img, -30 - (i % 2) * 20, 0, 60 + (i % 3) * 40, 760);
    c.restore();
  }
  c.globalCompositeOperation = 'source-over';
}

function front(c, g) {
  const art = g.art;
  const m = art.m;
  if (!m) return;
  const t = g.time;
  const dt = Math.min(0.1, Math.max(0, t - art.t));
  art.t = t;
  // romance eases in while a love song plays
  const want = art.track === 'love' || art.track === 'wedding' ? 1 : 0;
  art.love += (want - art.love) * Math.min(1, dt * 0.8);
  // ambient (motes etc.) fade down during black fades so cards stay clean
  art.ambient = 1 - g.fx.fade;
  // the forest gets glitchier the deeper Bobby goes
  const gk = m.glitch && g.player ? Math.min(1, Math.max(0, (g.player.x - 1450) / 900)) * 0.75 : 0;
  art.glitchK += (Math.max(gk, Math.min(1, g.fx.glitch ?? 0)) - art.glitchK) * Math.min(1, dt * 2);

  c.save();
  if (m.lights || m.dark) gatherLights(g, art);

  if (m.dim) {
    c.globalCompositeOperation = 'multiply';
    c.globalAlpha = 1;
    c.fillStyle = `rgba(${m.dim.rgb},${m.dim.a})`;
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
  }
  if (m.dark) drawDark(c, g, art, m.dark);
  if (m.lights) paintLights(c, g, art);
  if (art.glitchK > 0.01) drawGlitchAir(c, g, art);
  drawMotes(c, g, art, m.motes ?? {});
  if (art.love > 0.01) drawLove(c, g, art);
  if (m.sun?.flare) drawFlare(c, g, art, m.sun);
  if (m.bokeh) drawBokeh(c, g, art, m.bokeh);

  // colour grade (soft-light gradient), then the foreground, then the vignette
  if (m.grade) {
    c.globalCompositeOperation = 'soft-light';
    c.globalAlpha = 1;
    c.drawImage(vstrip(`grade:${m.grade[0]}:${m.grade[1]}`, [[0, m.grade[0]], [1, m.grade[1]]]), 0, 0, W, H);
    if (art.love > 0.01) {
      c.globalAlpha = art.love * 0.45;
      c.drawImage(vstrip('grade:love', [[0, 'rgba(255,150,190,0.6)'], [1, 'rgba(160,60,140,0.5)']]), 0, 0, W, H);
    }
    if (art.glitchK > 0.01) {
      c.globalAlpha = art.glitchK;
      c.drawImage(vstrip('grade:glitch', [[0, 'rgba(170,90,255,0.6)'], [1, 'rgba(40,0,80,0.6)']]), 0, 0, W, H);
    }
    c.globalCompositeOperation = 'source-over';
  }
  if (m.fg) {
    const img = fgGrass(m.fg.col, m.fg.flowers);
    const off = wrap(g.cam.x * 1.35 * g.cam.zoom, 1024);
    const y = H - 70 + Math.max(-40, Math.min(40, (460 - g.cam.y - 190) * 0.3));
    c.globalAlpha = 0.92;
    for (let x = -off; x < W; x += 1024) c.drawImage(img, x, y, 1024, 96);
  }
  if (m.vig) {
    c.globalAlpha = m.vig.a + art.love * 0.12;
    c.drawImage(vignette(m.vig.rgb, m.vig.inner), 0, 0, W, H);
  }
  c.globalAlpha = 1;
  for (const fx of art.fx) fx(c, g, dt);
  if (art.fx.length) art.fx = art.fx.filter((f) => !f.done);
  c.restore();
}

// The mine: a darkness layer with holes cut out around every light.
function drawDark(c, g, art, d) {
  if (!art.darkCv) art.darkCv = canvas(W / 2, H / 2);
  const cv = art.darkCv;
  const k = cv.getContext('2d');
  k.globalCompositeOperation = 'source-over';
  k.clearRect(0, 0, W / 2, H / 2);
  k.fillStyle = `rgba(${d.rgb},${d.a})`;
  k.fillRect(0, 0, W / 2, H / 2);
  k.globalCompositeOperation = 'destination-out';
  const L = art.lights;
  const img = glow('255,255,255');
  for (let i = 0; i < L.n; i++) {
    const [x, y, r, , a] = L.items[i];
    stamp(k, img, sx(g, x) / 2, sy(g, y) / 2, (r * 1.5 * g.cam.zoom) / 2, Math.min(1, a * 1.4));
  }
  k.globalAlpha = 1;
  c.globalAlpha = 1;
  c.drawImage(cv, 0, 0, W, H);
}

// Floating hearts while the love theme plays.
function drawLove(c, g, art) {
  const t = g.time;
  const img = heartGlow('255,120,170');
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 10; i++) {
    const sp = 0.6 + ((i * 37) % 10) / 14;
    const x = wrap(i * 131 + Math.sin(t * 0.7 + i) * 30 - g.cam.x * 0.2 * sp, W + 60) - 30;
    const y = wrap(H - t * 26 * sp - i * 97, H + 80) - 40;
    const r = 8 + 6 * sp;
    stamp(c, img, x, y, r, art.love * art.ambient * (0.35 + 0.25 * Math.sin(t * 2 + i)));
  }
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
}

// Lens flare ghosts strung from the low sun through the middle of the screen.
const GHOSTS = [
  [0.35, 10, 0.16, '255,220,170'],
  [0.62, 22, 0.1, '255,170,140'],
  [0.9, 7, 0.2, '255,240,200'],
  [1.25, 34, 0.08, '200,170,255'],
  [1.6, 15, 0.12, '255,190,150'],
];
function drawFlare(c, g, art, s) {
  const x0 = W * s.x - g.cam.x * 0.02;
  const y0 = s.y;
  const dx = W / 2 - x0;
  const dy = H / 2 - y0;
  c.globalCompositeOperation = 'lighter';
  for (const [k, r, a, rgb] of GHOSTS) stamp(c, bokehDisc(rgb), x0 + dx * k, y0 + dy * k, r, a * art.ambient);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
}

// Big soft out-of-focus lights drifting close to the lens.
function drawBokeh(c, g, art, b) {
  const t = g.time;
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < b.n; i++) {
    const rgb = b.rgbs[i % b.rgbs.length];
    const x = wrap(i * 263 + Math.sin(t * 0.2 + i) * 40 - g.cam.x * 1.6, W + 300) - 150;
    const y = wrap(i * 149 + Math.cos(t * 0.17 + i * 2) * 30, H + 200) - 100;
    const r = 30 + ((i * 53) % 50);
    stamp(c, bokehDisc(rgb), x, y, r, b.a * art.ambient * (0.7 + 0.3 * Math.sin(t * 0.5 + i)));
  }
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
}

// Glitchy air in the corrupted part of the forest: flickering pixel squares.
function drawGlitchAir(c, g, art) {
  const t = g.time;
  const k = art.glitchK * art.ambient;
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const on = Math.sin(t * (3 + (i % 5)) + i * 7.3) > 0.2;
    if (!on) continue;
    const x = wrap(i * 173 - g.cam.x * (0.5 + (i % 4) * 0.2) + Math.floor(t * 2 + i) * 13, W + 40) - 20;
    const y = wrap(i * 89 - t * (8 + (i % 6) * 4), H);
    const s = 3 + (i % 4) * 2;
    c.globalAlpha = k * 0.7;
    c.fillStyle = i % 3 === 0 ? '#ff4fd8' : i % 3 === 1 ? '#7d5cff' : '#4ff0ff';
    c.fillRect(Math.round(x), Math.round(y), s, s);
    stamp(c, glow(i % 3 === 0 ? '255,80,216' : '125,92,255'), x + s / 2, y + s / 2, s * 3, k * 0.4);
  }
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
}

/* ---------- world-space set dressing (a z:-50 entity per level) ---------- */
function dressing(g, art) {
  const m = art.m;
  if (!(m.garland || m.bunting || m.chandelier || m.lights)) return;
  g.add(new Thing({ x: 0, y: 0, w: 0, h: 0, z: -50, art: true,
    look(c, g) {
      const x0 = g.cam.x - W / 2 / g.cam.zoom - 60;
      const x1 = g.cam.x + W / 2 / g.cam.zoom + 60;
      if (m.garland) drawGarland(c, g, m.garland, x0, x1);
      if (m.bunting) drawBunting(c, g, x0, x1);
      if (m.chandelier) for (const x of m.chandelier) drawChandelier(c, g, x);
      if (art.mood === 'dinner') for (const d of g.deco) if (d.t === 'table' && d.x > x0 - 100 && d.x < x1) drawCandle(c, g, d.x + 45, d.y - 40);
    },
  }));
}

function drawGarland(c, g, gl, x0, x1) {
  const span = 160;
  const start = Math.floor(x0 / span) * span;
  c.strokeStyle = 'rgba(60,40,40,0.55)';
  c.lineWidth = 1.5;
  c.beginPath();
  for (let x = start; x < x1; x += span) {
    c.moveTo(x, gl.y);
    c.quadraticCurveTo(x + span / 2, gl.y + gl.sag * 2, x + span, gl.y);
  }
  c.stroke();
  const img = glow(gl.rgb);
  for (let x = start; x < x1; x += span) {
    for (let k = 1; k < 8; k++) {
      const u = k / 8;
      const bx = x + span * u;
      const by = gl.y + gl.sag * 2 * 2 * u * (1 - u) + 3;
      const tw = 0.7 + 0.3 * Math.sin(g.time * 2.2 + bx * 0.05);
      c.globalCompositeOperation = 'lighter';
      stamp(c, img, bx, by, 14, 0.55 * tw);
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 1;
      c.fillStyle = '#fff6dc';
      c.beginPath();
      c.arc(bx, by, 2.4, 0, Math.PI * 2);
      c.fill();
    }
  }
}

const FLAGS = ['#ff8fb1', '#ffffff', '#f2c14e', '#8fd3ff', '#ffc2d6'];
function drawBunting(c, g, x0, x1) {
  const span = 300;
  const y = 120;
  const start = Math.floor(x0 / span) * span;
  for (let x = start; x < x1; x += span) {
    if (x < 0) continue;
    c.strokeStyle = 'rgba(80,50,60,0.6)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + span / 2, y + 60, x + span, y);
    c.stroke();
    for (let k = 1; k < 12; k++) {
      const u = k / 12;
      const bx = x + span * u;
      const by = y + 60 * 2 * u * (1 - u);
      const wave = Math.sin(g.time * 3 + bx * 0.03) * 2;
      c.fillStyle = FLAGS[(k + x / span) % FLAGS.length | 0];
      c.beginPath();
      c.moveTo(bx - 7, by);
      c.lineTo(bx + 7, by);
      c.lineTo(bx + wave, by + 16);
      c.fill();
    }
  }
}

function drawChandelier(c, g, x) {
  const y = 96 + Math.sin(g.time * 0.8 + x) * 1.5;
  c.strokeStyle = '#b08a5a';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, 0);
  c.lineTo(x, y - 18);
  c.stroke();
  c.fillStyle = '#d8b36a';
  c.beginPath();
  c.ellipse(x, y, 46, 8, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#b08a5a';
  c.beginPath();
  c.ellipse(x, y + 2, 40, 5, 0, 0, Math.PI);
  c.fill();
  // crystals
  for (let k = -3; k <= 3; k++) {
    c.fillStyle = 'rgba(230,240,255,0.9)';
    c.beginPath();
    c.moveTo(x + k * 12, y + 6);
    c.lineTo(x + k * 12 + 3, y + 14 + (k & 1) * 6);
    c.lineTo(x + k * 12, y + 20 + (k & 1) * 6);
    c.lineTo(x + k * 12 - 3, y + 14 + (k & 1) * 6);
    c.fill();
  }
  c.globalCompositeOperation = 'lighter';
  for (let k = -2; k <= 2; k++) {
    const fx = x + k * 18;
    const fy = y - 10;
    stamp(c, glow('255,214,150'), fx, fy, 22, 0.8 + 0.2 * Math.sin(g.time * 8 + k * 3));
  }
  stamp(c, glow('255,226,180'), x, y, 130, 0.2);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
  for (let k = -2; k <= 2; k++) {
    c.fillStyle = '#fff';
    c.fillRect(x + k * 18 - 1.5, y - 14, 3, 8);
  }
}

function drawCandle(c, g, x, y) {
  c.fillStyle = '#f6efe2';
  c.fillRect(x - 3, y - 18, 6, 18);
  c.fillStyle = '#d9cfbd';
  c.fillRect(x + 1, y - 18, 2, 18);
  const fl = Math.sin(g.time * 13 + x) * 0.8;
  c.fillStyle = '#ffcf6a';
  c.beginPath();
  c.ellipse(x + fl * 0.5, y - 23, 2.6, 5 + Math.abs(fl), 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#fff6d8';
  c.beginPath();
  c.ellipse(x + fl * 0.5, y - 22, 1.2, 2.4, 0, 0, Math.PI * 2);
  c.fill();
  c.globalCompositeOperation = 'lighter';
  stamp(c, glow('255,190,110'), x, y - 22, 26, 0.7);
  c.globalCompositeOperation = 'source-over';
  c.globalAlpha = 1;
}

/* ---------- wiring ---------- */
function syncMood(g, art) {
  if (art.level === g.level) return;
  art.level = g.level;
  art.mood = moodName(g);
  art.m = MOODS[art.mood];
  art.motes = makeMotes(art.m.motes);
  // the engine's own drifting particles and colour grade step aside: this
  // game paints its own (g.level is a per-load copy, so this is safe)
  g.level.amb = null;
  g.level.grade = false;
  if (art.track !== 'love' && art.track !== 'wedding') art.love = 0;
  dressing(g, art);
}

// Install (once per game) and set the chapter number.
export function installArt(g, n) {
  if (!g.art) {
    g.art = { n, back, front, level: null, mood: null, m: null, motes: [], lights: { n: 0, items: [] }, love: 0, ambient: 1, t: g.time, track: null, glitchK: 0, fx: [] };
    const music = g.music.bind(g);
    g.music = (name, fade) => {
      g.art.track = name;
      music(name, fade);
    };
  }
  g.art.n = n;
  return g.art;
}

// One-off screen effects pushed from anywhere: fn(c, g, dt) sets fn.done.
export function addFx(g, fn) {
  g.art?.fx.push(fn);
}

// Chapter opening: the black opens as a circle around Cursor, with a ring of
// his light at the edge (like a click spreading out). Resolves after sec.
export function iris(g, sec, who) {
  const start = g.time;
  const fn = (c, g) => {
    const u = Math.min(1, (g.time - start) / sec);
    if (u >= 1) {
      fn.done = true;
      return;
    }
    const e = 1 - (1 - u) ** 3;
    const X = who ? sx(g, who.x + who.w / 2) : W / 2;
    const Y = who ? sy(g, who.y + who.h / 2) : H / 2;
    const R = 6 + e * 1150;
    const art = g.art;
    if (!art.irisCv) art.irisCv = canvas(W / 2, H / 2);
    const k = art.irisCv.getContext('2d');
    k.globalCompositeOperation = 'source-over';
    k.globalAlpha = 1;
    k.fillStyle = '#05040a';
    k.fillRect(0, 0, W / 2, H / 2);
    k.globalCompositeOperation = 'destination-out';
    k.drawImage(disc(), (X - R) / 2, (Y - R) / 2, R, R);
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    c.drawImage(art.irisCv, 0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = (1 - u) * 0.9;
    c.strokeStyle = 'rgb(150,220,255)';
    c.lineWidth = 3 + 6 * (1 - u);
    c.beginPath();
    c.arc(X, Y, R * 0.94, 0, Math.PI * 2);
    c.stroke();
    stamp(c, glow('150,220,255'), X, Y, 40 + 60 * (1 - u), 1 - u);
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
  };
  g.art?.fx.push(fn);
  return g.wait(sec);
}

// A filled circle with a soft rim (for the iris).
function disc() {
  return sprite('disc', 128, 128, (c) => {
    const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(0.9, 'rgba(0,0,0,1)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr;
    c.fillRect(0, 0, 128, 128);
  });
}
