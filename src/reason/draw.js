import { hash, sprite, glow, softLight, shadow, boxShadow, fadeStrip, fadeStripX, pattern, speckle, gradeOverlay, vignetteSprite, rgba, mix, lighten, darken } from './fx';

// Everything is drawn with plain canvas shapes: no sprites, no assets.
// Coordinates are in world pixels (the camera transform is already applied),
// except drawSky / drawHud / drawEffects which work in screen space.

const W = 960;
const H = 540;
let FONT = '"Fredoka", system-ui, sans-serif';
export const setFont = (f) => {
  if (f?.trim()) FONT = `${f.trim()}, "Fredoka", system-ui, sans-serif`;
};
export const FONTS = () => FONT;

export const SPEAKERS = {
  bobby: { name: 'Bobby', color: '#e2674f', pitch: 1 },
  bella: { name: 'Bella', color: '#f39ac0', pitch: 1.5 },
  tabby: { name: 'Tabby', color: '#5b9bd5', pitch: 0.85 },
  admin: { name: 'THE ADMIN', color: '#8dffc8', pitch: 0.45 },
  unknown: { name: 'UNKNOWN', color: '#b9b9c6', pitch: 0.6 },
  guardian: { name: 'Guardian', color: '#9fb4c9', pitch: 0.55 },
  backspace: { name: 'Old Backspace', color: '#b4b0a8', pitch: 0.7 },
  trial: { name: 'FREE TRIAL', color: '#c18cff', pitch: 1.2 },
  cookie: { name: 'Cookie Monster', color: '#d79a5a', pitch: 0.6 },
  merchant: { name: 'Mrs. Enter', color: '#7cc6a4', pitch: 1.1 },
  sys: { name: '', color: '#ff6b5e', pitch: 0.5 },
  note: { name: '', color: '#d8d0c4', pitch: 1 },
  player: { name: 'You', color: '#ffffff', pitch: 1.3 },
  rec: { name: 'Tabby (recording)', color: '#7fb6e6', pitch: 0.85 },
  recorder: { name: 'Old recording', color: '#c9c27a', pitch: 0.7 },
  sign: { name: 'Signpost', color: '#c9a36b', pitch: 0.8 },
  ad: { name: 'THE UNSKIPPABLE AD', color: '#ffd84d', pitch: 1.4 },
  // How I Met Your Cursor
  cursor: { name: 'Cursor', color: '#dff1ff', pitch: 1.25 },
  tax: { name: 'The Tax Collector', color: '#f4a6b8', pitch: 0.55 },
  karen: { name: 'Karen Popup', color: '#ff7a59', pitch: 1.35 },
  lord404: { name: 'Lord 404', color: '#b57cff', pitch: 0.5 },
  golem: { name: 'CAPTCHA Golem', color: '#9ec3ff', pitch: 0.45 },
  e500: { name: 'ERROR 500', color: '#ff5a5a', pitch: 0.4 },
  priest: { name: 'Priest (a checkbox)', color: '#e8e8e8', pitch: 1.6 },
  jeweler: { name: 'Mr. Shift', color: '#f2c14e', pitch: 0.9 },
  waiter: { name: 'Waiter', color: '#d9d0c4', pitch: 1.1 },
};


export function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export function text(c, str, x, y, { size = 14, color = '#fff', align = 'center', weight = 700, base = 'middle' } = {}) {
  c.font = `${weight} ${size}px ${FONT}`;
  c.fillStyle = color;
  c.textAlign = align;
  c.textBaseline = base;
  c.fillText(str, x, y);
}

/* ---------- skies (screen space, parallax off the camera) ---------- */
// top/mid/bottom: the sky gradient. haze: the air colour between layers.
// amb: drifting particles. grade: the per-theme colour wash and vignette.
const SKIES = {
  bedroom: { top: '#3c4a6b', bottom: '#5d6a8a', inside: true, amb: 'dust', grade: { edge: '#2b1608', ev: 0.42, top: '#ffd9a0', topA: 0.06, bottom: '#3a2010', bottomA: 0.12 } },
  village: { top: '#5cb6f2', mid: '#9fd8ff', bottom: '#fff0d4', haze: '#e4f3ff', hills: ['#b6e2a4', '#8fca7f'], far: '#a9cde6', clouds: 1, sun: 1, amb: 'pollen', grade: { edge: '#1c3550', ev: 0.24, top: '#fff3c4', topA: 0.12 } },
  forest: { top: '#5fb3a2', mid: '#9fd6c0', bottom: '#e8f6dc', haze: '#d9f0e0', hills: ['#6aa982', '#4d8a66'], far: '#8fc2ad', trees: 1, clouds: 1, rays: 1, amb: 'pollen', grade: { edge: '#0e2a22', ev: 0.32, top: '#fff6c8', topA: 0.12, bottom: '#123326', bottomA: 0.12 } },
  popup: { top: '#7a66f2', mid: '#b58cf5', bottom: '#ffd0f4', haze: '#f0c8ff', hills: ['#a98be6', '#8a68cf'], far: '#c7a4f2', windows: 1, trees: 1, amb: 'sparkle', grade: { edge: '#2a1450', ev: 0.3, top: '#ffd6ff', topA: 0.1 } },
  ruins: { top: '#8794ad', mid: '#b9bcc4', bottom: '#eadccb', haze: '#e3d6c6', city: 1, hills: ['#b9b1a8', '#9d958c'], far: '#c9c2ba', amb: 'ash', grade: { edge: '#2a2420', ev: 0.32, bottom: '#3a3028', bottomA: 0.12 } },
  lab: { top: '#070e1a', mid: '#0d1a2e', bottom: '#1d2c47', haze: '#1c3a5a', racks: 1, inside: true, amb: 'data', grade: { edge: '#000308', ev: 0.55, top: '#3df5c0', topA: 0.04 } },
  tower: { top: '#160b26', mid: '#2e1640', bottom: '#6a2f58', haze: '#7a3a66', city: 1, lit: 1, cables: 1, hills: ['#2f1a3d', '#24142f'], far: '#4a2550', amb: 'embers', grade: { edge: '#07020c', ev: 0.5, top: '#ff7ab8', topA: 0.05, bottom: '#1a0612', bottomA: 0.2 } },
  chamber: { top: '#08070e', mid: '#12080f', bottom: '#2a0c16', haze: '#5a0c1c', grid: 1, inside: true, amb: 'sparks', grade: { edge: '#000000', ev: 0.62, bottom: '#3a0008', bottomA: 0.25 } },
  wreck: { top: '#4a4550', mid: '#7a6a68', bottom: '#b8907a', haze: '#a88a7c', hills: ['#77706d', '#5f5856'], far: '#8f7f7a', smoke: 1, fires: 1, amb: 'embers', grade: { edge: '#1a0e0a', ev: 0.42, top: '#ffb070', topA: 0.06, bottom: '#2a1008', bottomA: 0.18 } },
  void: { top: '#0c0314', mid: '#22072a', bottom: '#4a0d38', haze: '#8a1a6a', grid: 1, glitchy: 1, amb: 'sparks', grade: { edge: '#05000a', ev: 0.55, bottom: '#2a0430', bottomA: 0.2 } },
  epilogue: { top: '#6ab8f7', mid: '#b4dcff', bottom: '#ffe2bf', haze: '#fff0dc', hills: ['#a8dc96', '#7fc276'], far: '#b7d6ea', clouds: 1, sun: 1, rays: 1, amb: 'pollen', grade: { edge: '#3a2a1a', ev: 0.22, top: '#fff0c0', topA: 0.16 } },
  night: { top: '#080d22', mid: '#16204a', bottom: '#33406e', haze: '#3a4a7a', hills: ['#2b3a4d', '#1f2b3a'], far: '#27345a', trees: 1, stars: 1, moon: 1, amb: 'fireflies', grade: { edge: '#02040c', ev: 0.5, top: '#a8c0ff', topA: 0.05 } },
  mine: { top: '#100a06', mid: '#1c130c', bottom: '#3a2818', haze: '#5a3a1a', mine: 1, inside: true, amb: 'gold', grade: { edge: '#000000', ev: 0.6, top: '#ffb050', topA: 0.04 } },
  sunset: { top: '#6a5aa8', mid: '#ff8a6b', bottom: '#ffd9a8', haze: '#ffc8a0', hills: ['#c98a7a', '#a86e64'], far: '#d79a8e', clouds: 1, sun: 1, low: 1, rays: 1, amb: 'pollen', grade: { edge: '#3a1020', ev: 0.32, top: '#ffb070', topA: 0.12 } },
};

// The sky gradient for a theme, rendered once.
function skyBase(key, s) {
  return sprite(`sky:${key}`, W / 2, H / 2, (c) => {
    c.scale(0.5, 0.5);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, s.top);
    if (s.mid) g.addColorStop(0.55, s.mid);
    g.addColorStop(1, s.bottom);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    if (s.sun) {
      // the whole sky brightens around the sun
      const r = c.createRadialGradient(780, s.low ? 330 : 90, 0, 780, s.low ? 330 : 90, 520);
      r.addColorStop(0, s.low ? 'rgba(255,220,150,0.55)' : 'rgba(255,250,220,0.5)');
      r.addColorStop(1, 'rgba(255,250,220,0)');
      c.fillStyle = r;
      c.fillRect(0, 0, W, H);
    }
    if (s.haze) {
      const h = c.createLinearGradient(0, H * 0.45, 0, H);
      h.addColorStop(0, rgba(s.haze, 0));
      h.addColorStop(1, rgba(s.haze, 0.35));
      c.fillStyle = h;
      c.fillRect(0, 0, W, H);
    }
  });
}

// A fluffy cloud with a lit top and a shaded belly, tinted per theme.
function cloudSprite(key, s, v) {
  const lit = s.low ? '#fff1e0' : '#ffffff';
  const belly = s.low ? '#e59a9a' : mix(s.mid ?? s.top, '#c9d6e8', 0.6);
  return sprite(`cloud:${key}:${v}`, 240, 120, (c) => {
    c.translate(20, 20);
    const parts = [
      [[40, 58, 30], [78, 40, 38], [122, 46, 34], [156, 62, 24], [100, 66, 30]],
      [[36, 60, 24], [70, 44, 32], [104, 36, 28], [140, 54, 28], [176, 64, 18]],
      [[50, 56, 26], [88, 42, 34], [128, 58, 26]],
    ][v];
    c.beginPath();
    for (const [x, y, r] of parts) {
      c.moveTo(x + r, y);
      c.arc(x, y, r, 0, Math.PI * 2);
    }
    c.rect(parts[0][0], 60, parts[parts.length - 1][0] - parts[0][0], 22);
    const g = c.createLinearGradient(0, 0, 0, 86);
    g.addColorStop(0, lit);
    g.addColorStop(0.55, lit);
    g.addColorStop(1, belly);
    c.fillStyle = g;
    c.fill('nonzero');
    // a little rim of light along the top
    c.globalCompositeOperation = 'source-atop';
    const r = c.createLinearGradient(0, 0, 0, 40);
    r.addColorStop(0, 'rgba(255,255,255,0.7)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = r;
    c.fillRect(0, 0, 220, 40);
  });
}

// Long soft rays for sunny themes.
function raysSprite() {
  return sprite('rays', 256, 256, (c) => {
    c.translate(128, 128);
    for (let i = 0; i < 9; i++) {
      c.rotate((Math.PI * 2) / 9 + hash(i) * 0.3);
      const g = c.createLinearGradient(0, 0, 128, 0);
      g.addColorStop(0, 'rgba(255,255,230,0.6)');
      g.addColorStop(1, 'rgba(255,255,230,0)');
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(128, -8 - hash(i + 3) * 10);
      c.lineTo(128, 8 + hash(i + 3) * 10);
      c.fill();
    }
  });
}

// A soft round smoke puff.
function puffSprite(color) {
  return sprite(`puff:${color}`, 64, 64, (c) => {
    const g = c.createRadialGradient(28, 26, 0, 32, 32, 32);
    g.addColorStop(0, rgba(color, 0.9));
    g.addColorStop(0.6, rgba(color, 0.5));
    g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });
}

// Cached vertical gradient for a layer (hills, city) of a theme.
function layerGrad(c, s, key, color, y0, y1, rim) {
  const store = (s.__grads ??= {});
  if (!store[key]) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, rim ?? lighten(color, 0.12));
    g.addColorStop(0.18, color);
    g.addColorStop(1, darken(color, 0.18));
    store[key] = g;
  }
  return store[key];
}

const wrap = (v, m) => ((v % m) + m) % m;

export function drawSky(c, g) {
  const key = SKIES[g.level.theme] ? g.level.theme : 'village';
  const s = SKIES[key];
  const cam = g.cam;
  c.drawImage(skyBase(key, s), 0, 0, W, H);

  if (g.fx.redSky > 0) {
    const red = (s.__red ??= (() => {
      const r = c.createLinearGradient(0, 0, 0, H);
      r.addColorStop(0, 'rgba(190, 20, 30, 0.75)');
      r.addColorStop(1, 'rgba(255, 90, 60, 0.35)');
      return r;
    })());
    c.globalAlpha = g.fx.redSky;
    c.fillStyle = red;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
  }

  const t = g.time;
  if (s.stars) {
    for (let i = 0; i < 110; i++) {
      const x = wrap(hash(i) * W * 1.3 - cam.x * 0.02, W);
      const y = hash(i + 9) * H * 0.62;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + hash(i + 4)) + i));
      const big = hash(i + 21) > 0.86;
      c.globalAlpha = tw * (big ? 1 : 0.7);
      c.fillStyle = hash(i + 2) > 0.7 ? '#ffe9c4' : '#dfe8ff';
      c.fillRect(x, y, big ? 2 : 1.5, big ? 2 : 1.5);
      if (big) glow(c, x + 1, y + 1, 7, '#9fb8ff', tw * 0.7);
    }
    c.globalAlpha = 1;
  }
  if (s.moon) {
    const mx = 760 - cam.x * 0.02;
    glow(c, mx, 96, 140, '#5a74c8', 0.5);
    glow(c, mx, 96, 60, '#c8d6ff', 0.45);
    c.fillStyle = '#eef2ff';
    c.beginPath();
    c.arc(mx, 96, 26, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(150, 165, 210, 0.35)';
    c.beginPath();
    c.arc(mx - 8, 90, 6, 0, Math.PI * 2);
    c.arc(mx + 9, 104, 4, 0, Math.PI * 2);
    c.arc(mx + 6, 84, 3, 0, Math.PI * 2);
    c.fill();
  }
  if (s.sun) {
    const sx = 780 - cam.x * 0.02;
    const sy = s.low ? 330 : 90;
    if (s.rays) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = s.low ? 0.12 : 0.07;
      c.translate(sx, sy);
      c.rotate(t * 0.03);
      c.drawImage(raysSprite(), -520, -520, 1040, 1040);
      c.restore();
    }
    glow(c, sx, sy, 150, s.low ? '#ffb070' : '#fff1b0', s.low ? 0.55 : 0.38);
    c.fillStyle = s.low ? '#fff0c8' : '#fffbea';
    c.beginPath();
    c.arc(sx, sy, s.low ? 44 : 36, 0, Math.PI * 2);
    c.fill();
  }
  if (s.clouds) {
    // two depths: small slow ones far away, big ones closer
    for (let i = 0; i < 9; i++) {
      const far = i < 4;
      const sc = far ? 0.45 + hash(i + 5) * 0.25 : 0.7 + hash(i + 5) * 0.55;
      const x = wrap(hash(i) * 2000 + t * (far ? 4 : 9) - cam.x * (far ? 0.05 : 0.12), 1500) - 250;
      const y = (far ? 110 : 30) + hash(i + 3) * (far ? 90 : 120);
      c.globalAlpha = far ? 0.75 : 0.95;
      c.drawImage(cloudSprite(key, s, i % 3), x, y, 240 * sc, 120 * sc);
    }
    c.globalAlpha = 1;
  }
  if (s.windows) {
    for (let i = 0; i < 9; i++) {
      const x = wrap(hash(i) * 2200 - cam.x * 0.15, 1300) - 150;
      const y = 50 + hash(i + 2) * 220 + Math.sin(t + i) * 6;
      const w = 90 + hash(i + 4) * 60;
      const h = 60 + hash(i + 7) * 30;
      softLight(c, x + w / 2, y + h / 2, w * 0.9, '#ffffff', 0.35);
      c.globalAlpha = 0.5;
      popupWindow(c, x, y, w, h, ['FREE!!', 'CLICK', '99% OFF', 'WIN', 'HOT'][i % 5]);
    }
    c.globalAlpha = 1;
  }
  if (s.racks) {
    for (let layer = 0; layer < 2; layer++) {
      const f = layer ? 0.4 : 0.18;
      const top = layer ? 120 : 160;
      const step = layer ? 110 : 76;
      const rw = layer ? 80 : 54;
      const n = layer ? 14 : 20;
      const span = n * step;
      for (let i = 0; i < n; i++) {
        const x = wrap(i * step - cam.x * f, span) - 120;
        if (x > W + 20) continue;
        const rh = H - top - (layer ? 80 : 110);
        c.fillStyle = layerGrad(c, s, `rack${layer}`, layer ? '#16233a' : '#101a2c', top, top + rh, layer ? '#2a3d5e' : '#1a2840');
        c.fillRect(x, top, rw, rh);
        c.fillStyle = layer ? '#0b1422' : '#0b1220';
        const rows = layer ? 9 : 10;
        const rs = rh / rows;
        for (let r = 0; r < rows; r++) c.fillRect(x + 5, top + 8 + r * rs, rw - 10, rs - 8);
        for (let r = 0; r < rows; r++) {
          const ly = top + 14 + r * rs;
          const on = Math.sin(t * 3 + i * 7 + r * 13 + layer) > 0.3;
          const red = Math.sin(t * 5 + r + i + layer * 3) > 0.6;
          c.fillStyle = on ? '#3df59a' : '#1f4a3b';
          c.fillRect(x + 10, ly, 4, 4);
          c.fillStyle = red ? '#ff5a5a' : '#4a1f26';
          c.fillRect(x + 18, ly, 4, 4);
          if (layer) {
            if (on) glow(c, x + 12, ly + 2, 12, '#3df59a', 0.55);
            if (red) glow(c, x + 20, ly + 2, 10, '#ff5a5a', 0.5);
          }
        }
      }
      if (!layer) {
        // cold air between the rows of racks
        c.drawImage(fadeStrip(s.haze, 0.05, 0.45), 0, top - 40, W, H - top + 40);
      }
    }
    // light pooling on the floor
    glow(c, W / 2, H - 70, 420, '#1d6a8a', 0.35);
  }
  if (s.grid) {
    // a glowing floor that recedes to a horizon, and a slow pulse in the dark
    const hz = H * 0.62;
    const col = s.glitchy ? '#ff3cb4' : '#ff283c';
    glow(c, W / 2, hz, 520, col, 0.22 + 0.06 * Math.sin(t * 1.3));
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(col, s.glitchy ? 0.22 : 0.16);
    c.lineWidth = 1;
    const off = wrap(cam.x * 0.3, 60);
    c.beginPath();
    for (let x = -off; x < W; x += 60) {
      c.moveTo(x, 0);
      c.lineTo(x, hz);
    }
    for (let y = wrap(t * 20, 60); y < hz; y += 60) {
      c.moveTo(0, y);
      c.lineTo(W, y);
    }
    c.stroke();
    // perspective floor
    c.strokeStyle = rgba(col, s.glitchy ? 0.32 : 0.24);
    c.beginPath();
    const po = wrap(cam.x * 0.6, 80);
    for (let i = -12; i <= 24; i++) {
      const bx = i * 80 - po;
      c.moveTo(W / 2 + (bx - W / 2) * 0.12, hz);
      c.lineTo(W / 2 + (bx - W / 2) * 1.6, H);
    }
    for (let k = 0; k < 7; k++) {
      const p = wrap(k / 7 + t * 0.08, 1);
      const y = hz + (H - hz) * p * p;
      c.moveTo(0, y);
      c.lineTo(W, y);
    }
    c.stroke();
    c.restore();
    c.drawImage(fadeStrip(s.haze, 0.4, 0, 0.3), 0, hz - 30, W, 90);
  }
  if (s.city) {
    // a faint far skyline first, then two closer ones with air between
    for (let layer = -1; layer < 2; layer++) {
      const f = layer < 0 ? 0.08 : layer ? 0.35 : 0.18;
      const color = layer < 0 ? s.far : s.hills?.[layer] ?? '#9d958c';
      c.fillStyle = layerGrad(c, s, `city${layer}`, color, 120, H, lighten(color, 0.1));
      const count = layer < 0 ? 22 : 16;
      const step = layer < 0 ? 90 : 120;
      for (let i = 0; i < count; i++) {
        const seed = i + (layer + 1) * 30;
        const w = 60 + hash(seed) * 70;
        const h = (layer < 0 ? 150 : 90) + hash(i + 50 + layer * 10) * (180 - layer * 40);
        const x = wrap(i * step - cam.x * f, count * step) - 160;
        if (x > W + 20) continue;
        const y = H - 40 - h + layer * 40;
        c.fillRect(x, y, w, h + 60);
        if (layer >= 0 && hash(i * 3 + layer) > 0.7) c.fillRect(x + w * 0.4, y - 26, 3, 26); // antenna
        if (s.lit && layer >= 0) {
          // lit windows, a few of them flickering
          for (let wy = y + 12; wy < H - 20; wy += 18) {
            for (let wx = x + 8; wx < x + w - 10; wx += 14) {
              const hh = hash(wx * 0.37 + wy * 1.31 + layer);
              if (hh < 0.72) continue;
              const fl = hh > 0.97 && Math.sin(t * 9 + wx) > 0.5 ? 0.25 : 1;
              c.globalAlpha = (layer ? 0.75 : 0.45) * fl;
              c.fillStyle = hh > 0.9 ? '#ff9ad0' : '#ffd88a';
              c.fillRect(wx, wy, 5, 7);
            }
          }
          c.globalAlpha = 1;
          if (hash(i * 3 + layer) > 0.7 && Math.sin(t * 2 + i) > 0) glow(c, x + w * 0.4 + 1, y - 26, 10, '#ff3b3b', 0.8);
          c.fillStyle = layerGrad(c, s, `city${layer}`, color, 120, H, lighten(color, 0.1));
        }
        if (layer >= 0 && hash(i * 3 + layer) > 0.45) {
          // perfect rectangular holes: something deleted part of the city
          c.fillStyle = s.mid ?? s.top;
          c.fillRect(x + w * 0.25, y + h * 0.2, w * 0.45, h * 0.25);
          c.fillStyle = layerGrad(c, s, `city${layer}`, color, 120, H, lighten(color, 0.1));
        }
      }
      // haze in front of each layer
      if (layer < 1) c.drawImage(fadeStrip(s.haze ?? s.bottom, 0, layer < 0 ? 0.55 : 0.35, 0.6), 0, 180, W, H - 180);
    }
  }
  if (s.cables) {
    c.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    c.lineWidth = 3;
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = wrap(i * 220 - cam.x * 0.5, 1320) - 100;
      c.moveTo(x, 0);
      c.quadraticCurveTo(x + 80, 160 + hash(i) * 120, x + 200, 0);
    }
    c.stroke();
  }
  if (s.mine) {
    // rock teeth hanging from the ceiling, lit from below
    for (let layer = 0; layer < 2; layer++) {
      c.fillStyle = layerGrad(c, s, `mine${layer}`, layer ? '#2a1c12' : '#1e150d', 0, 140, layer ? '#3a2818' : '#24180f');
      const off = cam.x * (layer ? 0.4 : 0.2);
      c.beginPath();
      for (let i = -1; i < 20; i++) {
        const wx = Math.floor(off / 60) + i;
        const x = wx * 60 - off;
        const h = 30 + hash(wx + layer * 50) * 90;
        c.moveTo(x, 0);
        c.lineTo(x + 30, h);
        c.lineTo(x + 60, 0);
      }
      c.fill();
    }
    for (let i = 0; i < 12; i++) {
      const a = 0.4 + 0.3 * Math.sin(t * 2 + i);
      const x = wrap(hash(i) * 2000 - cam.x * 0.3, 1100) - 70;
      const y = 160 + hash(i + 4) * 240;
      c.fillStyle = `rgba(255,214,110,${a})`;
      c.fillRect(x, y, 3, 3);
      glow(c, x + 1.5, y + 1.5, 14, '#f2c14e', a * 0.6);
    }
    c.drawImage(fadeStrip(s.haze, 0, 0.35), 0, H * 0.45, W, H * 0.55);
  }
  if (s.hills && !s.city) {
    // far ridge, hazy and pale
    ridge(c, s, cam.x * 0.06, 330, 110, s.far ?? s.hills[0], 7, 'far');
    c.drawImage(fadeStrip(s.haze ?? s.bottom, 0, 0.5, 0.6), 0, 240, W, H - 240);
    hills(c, s, cam.x * 0.15, 360, 70, s.hills[0], 0, 'h0');
    c.drawImage(fadeStrip(s.haze ?? s.bottom, 0, 0.28, 0.6), 0, 300, W, H - 300);
    if (s.trees) treeLine(c, s, cam.x * 0.3, 420, s.hills[1], t);
    else hills(c, s, cam.x * 0.3, 410, 55, s.hills[1], 4, 'h1');
  }
  if (s.fires) {
    // something is still burning on the horizon
    for (let i = 0; i < 4; i++) {
      const x = wrap(i * 390 + 120 - cam.x * 0.15, 1560) - 100;
      glow(c, x, 400, 160, '#ff7a2a', 0.35 + 0.08 * Math.sin(t * 5 + i * 2));
    }
  }
  if (s.smoke) {
    const puff = puffSprite('#3c3740');
    for (let i = 0; i < 6; i++) {
      const x = wrap(i * 260 - cam.x * 0.25, 1560) - 100;
      for (let k = 0; k < 7; k++) {
        const kk = k + ((t * 0.4) % 1);
        const yy = 400 - kk * 50;
        const r = 26 + kk * 9;
        c.globalAlpha = Math.max(0, 0.5 - kk * 0.065);
        c.drawImage(puff, x + Math.sin(t * 0.7 + kk + i) * 14 + kk * 10 - r, yy - r, r * 2, r * 2);
      }
    }
    c.globalAlpha = 1;
  }
}

// Several circles (and an optional base rectangle) filled as one shape, so
// overlaps don't show through translucent fills.
function blobs(c, list, base) {
  c.beginPath();
  for (const [x, y, r] of list) {
    c.moveTo(x + r, y);
    c.arc(x, y, r, 0, Math.PI * 2);
  }
  if (base) c.rect(...base);
  c.fill('nonzero');
}

function hills(c, s, off, base, amp, color, seed, key) {
  c.fillStyle = layerGrad(c, s, key, color, base - amp * 1.5, H);
  c.beginPath();
  c.moveTo(0, H);
  for (let x = 0; x <= W; x += 16) {
    const wx = x + off;
    const y = base - amp * (0.5 + 0.5 * Math.sin(wx / 180 + seed)) - amp * 0.4 * Math.sin(wx / 67 + seed * 2);
    c.lineTo(x, y);
  }
  c.lineTo(W, H);
  c.fill();
}

// A distant mountain ridge: sharper and paler than the hills.
function ridge(c, s, off, base, amp, color, seed, key) {
  c.fillStyle = layerGrad(c, s, key, color, base - amp, H, lighten(color, 0.25));
  c.beginPath();
  c.moveTo(0, H);
  for (let x = 0; x <= W; x += 24) {
    const wx = x + off;
    const y = base - amp * (0.5 + 0.5 * Math.sin(wx / 260 + seed)) - amp * 0.25 * Math.abs(Math.sin(wx / 53 + seed));
    c.lineTo(x, y);
  }
  c.lineTo(W, H);
  c.fill();
}

function treeLine(c, s, off, base, color, t) {
  const hi = lighten(color, 0.16);
  const lo = darken(color, 0.22);
  c.fillStyle = layerGrad(c, s, 'trees', color, base - 100, H);
  c.fillRect(0, base, W, H - base);
  // trunks, then canopies, then a lit crown on each canopy
  c.fillStyle = lo;
  for (let i = -1; i < 16; i++) {
    const wx = Math.floor(off / 70) + i;
    const x = wx * 70 - off;
    const h = 60 + hash(wx) * 70;
    c.fillRect(x + 31, base - h * 0.5, 8, h * 0.5);
  }
  c.fillStyle = color;
  c.beginPath();
  for (let i = -1; i < 16; i++) {
    const wx = Math.floor(off / 70) + i;
    const x = wx * 70 - off + Math.sin(t * 0.8 + wx) * 1.5;
    const h = 60 + hash(wx) * 70;
    const r = 30 + hash(wx + 2) * 14;
    c.moveTo(x + 35 + r, base - h * 0.55);
    c.arc(x + 35, base - h * 0.55, r, 0, Math.PI * 2);
  }
  c.fill();
  c.fillStyle = rgba(hi, 0.55);
  c.beginPath();
  for (let i = -1; i < 16; i++) {
    const wx = Math.floor(off / 70) + i;
    const x = wx * 70 - off + Math.sin(t * 0.8 + wx) * 1.5;
    const h = 60 + hash(wx) * 70;
    const r = 30 + hash(wx + 2) * 14;
    c.moveTo(x + 29 + r * 0.55, base - h * 0.55 - r * 0.35);
    c.arc(x + 29, base - h * 0.55 - r * 0.35, r * 0.55, 0, Math.PI * 2);
  }
  c.fill();
}

/* ---------- atmosphere: drifting particles and the per-theme grade ---------- */
const AMB = {
  dust: { n: 28, color: '#ffe2b0', vx: 4, vy: -3, r: 3, par: 0.5, wob: 10, a: 0.35 },
  pollen: { n: 22, color: '#fff6c8', vx: 14, vy: -6, r: 3, par: 0.6, wob: 14, a: 0.45 },
  fireflies: { n: 26, color: '#d8ff7a', vx: 6, vy: -4, r: 6, par: 0.7, wob: 24, a: 0.9, blink: 1, low: 1 },
  embers: { n: 30, color: '#ff8a3a', vx: 10, vy: -34, r: 4, par: 0.6, wob: 16, a: 0.85, blink: 1 },
  ash: { n: 26, color: '#d8d0c8', vx: 10, vy: 12, r: 2.5, par: 0.5, wob: 12, a: 0.4, flat: 1 },
  data: { n: 30, color: '#3df5c0', vx: 0, vy: -18, r: 4, par: 0.5, wob: 4, a: 0.6, square: 1 },
  sparks: { n: 30, color: '#ff3c8c', vx: 4, vy: -26, r: 4, par: 0.5, wob: 8, a: 0.7, square: 1, blink: 1 },
  sparkle: { n: 22, color: '#ffffff', vx: 6, vy: -8, r: 4, par: 0.5, wob: 10, a: 0.6, blink: 1 },
  gold: { n: 22, color: '#ffcf6a', vx: 3, vy: -5, r: 3, par: 0.5, wob: 10, a: 0.55, blink: 1 },
};

// Out-of-focus grass and leaves passing in front of the camera, along the
// bottom edge only (below everyone's feet). Rendered once per colour.
const FORE = { village: '#3d6b35', forest: '#1f3f2a', night: '#070d18', epilogue: '#3d6b35', popup: '#3e2a70', sunset: '#4a2424', wreck: '#1e1816' };
function foreSprite(color) {
  return sprite(`fore:${color}`, 1024, 80, (c) => {
    if ('filter' in c) c.filter = 'blur(2.5px)';
    c.fillStyle = color;
    c.beginPath();
    for (let i = 0; i < 26; i++) {
      const x = hash(i * 3.7) * 1024;
      if (hash(i + 40) > 0.55) {
        // a leafy clump
        const r = 16 + hash(i + 9) * 22;
        c.moveTo(x + r, 80);
        c.arc(x, 80, r, Math.PI, 0);
        c.moveTo(x + r * 0.9, 80 - r * 0.6);
        c.arc(x + r * 0.5, 80 - r * 0.6, r * 0.45, 0, Math.PI * 2);
      } else {
        // a tuft of blades
        for (let k = 0; k < 7; k++) {
          const bx = x + k * 5 - 15;
          const h = 22 + hash(i * 7 + k) * 40;
          c.moveTo(bx - 3, 80);
          c.quadraticCurveTo(bx + 2, 80 - h * 0.5, bx + (k - 3) * 3, 80 - h);
          c.quadraticCurveTo(bx + 4, 80 - h * 0.5, bx + 3, 80);
        }
      }
    }
    c.fill();
    c.fillRect(0, 74, 1024, 6);
  });
}

export function drawAtmosphere(c, g) {
  const key = SKIES[g.level.theme] ? g.level.theme : 'village';
  const s = SKIES[key];
  const lv = g.level;
  const t = g.time;
  const fore = lv.fore === undefined ? FORE[key] : lv.fore;
  if (fore && g.cam.zoom === 1) {
    const sp = foreSprite(fore);
    const off = wrap(g.cam.x * 1.3, 1024);
    const y = H - 68;
    c.globalAlpha = 0.9;
    c.drawImage(sp, -off, y, 1024, 80);
    c.drawImage(sp, 1024 - off, y, 1024, 80);
    c.globalAlpha = 1;
  }
  const kind = lv.amb === undefined ? s.amb : lv.amb;
  const A = kind && AMB[kind];
  if (A) {
    const cx0 = g.cam.x * A.par;
    for (let i = 0; i < A.n; i++) {
      const h1 = hash(i * 1.37 + 3);
      const h2 = hash(i * 2.11 + 7);
      const sp = 0.6 + hash(i + 11) * 0.8;
      let x = wrap(h1 * 1400 + t * A.vx * sp - cx0 + Math.sin(t * 0.7 + i) * A.wob, W + 80) - 40;
      let y = wrap(h2 * 700 + t * A.vy * sp, H + 80) - 40;
      if (A.low) y = H * 0.35 + wrap(h2 * 400 + t * A.vy * sp, H * 0.6);
      y += Math.cos(t * 0.9 + i * 1.3) * A.wob * 0.5;
      let a = A.a * (0.5 + 0.5 * hash(i + 5));
      if (A.blink) a *= 0.3 + 0.7 * Math.max(0, Math.sin(t * (1.5 + h1 * 2) + i * 2.4));
      if (a < 0.03) continue;
      const r = A.r * (0.6 + hash(i + 17) * 0.8);
      glow(c, x, y, r * 3, A.color, a);
      c.globalAlpha = Math.min(1, a * 1.4);
      c.fillStyle = '#ffffff';
      if (A.square) c.fillRect(x - 1, y - 1, 2.5, 2.5);
      else if (!A.flat) c.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
      c.globalAlpha = 1;
    }
  }
  if (lv.grade !== false) c.drawImage(gradeOverlay(key, lv.grade ?? s.grade ?? { ev: 0.3 }), 0, 0, W, H);
}

export function popupWindow(c, x, y, w, h, label = 'AD', bar = '#4f6bff') {
  c.fillStyle = '#ffffff';
  rr(c, x, y, w, h, 6);
  c.fill();
  c.fillStyle = 'rgba(30, 40, 90, 0.07)';
  c.fillRect(x, y + h * 0.55, w, h * 0.45 - 4);
  c.strokeStyle = 'rgba(30, 40, 90, 0.18)';
  c.lineWidth = 1;
  rr(c, x + 0.5, y + 0.5, w - 1, h - 1, 6);
  c.stroke();
  c.fillStyle = bar;
  rr(c, x, y, w, 16, 6);
  c.fill();
  c.fillRect(x, y + 10, w, 6);
  c.fillStyle = 'rgba(255,255,255,0.3)';
  c.fillRect(x + 4, y + 1.5, w - 8, 3);
  c.fillStyle = '#ff5a5a';
  c.fillRect(x + w - 14, y + 4, 9, 9);
  text(c, label, x + w / 2, y + 16 + (h - 16) / 2, { size: Math.min(18, h * 0.3), color: '#222' });
}

/* ---------- ground ---------- */
// [body, top, edge] colours per kind of solid.
const SOLID = {
  grass: ['#a26f47', '#7cc36a', '#5c9d4e'],
  dirt: ['#6e5a4e', '#8b8378', '#5e5650'],
  wood: ['#c58d58', '#dca673', '#8f5e34'],
  floor: ['#b98654', '#d4a06b', '#8a5e37'],
  stone: ['#8f95a3', '#b4bac6', '#6d7280'],
  metal: ['#34405a', '#6c7fa3', '#222b3e'],
  ruin: ['#7d7470', '#a39994', '#5c5452'],
  glitch: ['#2c1040', '#ff4fd8', '#170824'],
  popup: ['#ffffff', '#5a74ff', '#c9cff5'],
  dark: ['#1b1622', '#3a3044', '#0f0c14'],
  red: ['#3a0d14', '#ff3b3b', '#1d060a'],
};

// The repeating fill for each kind of solid, drawn once at 128x128.
const TEX = {
  soil(c, [body]) {
    c.fillStyle = body;
    c.fillRect(0, 0, 128, 128);
    speckle(c, 128, 128, 140, [darken(body, 0.12), lighten(body, 0.08), darken(body, 0.2)], 1, 3, 1);
    // pebbles with a lit top
    for (let i = 0; i < 9; i++) {
      const x = hash(i * 5.3) * 128;
      const y = hash(i * 2.9 + 1) * 128;
      const r = 2 + hash(i + 8) * 4;
      c.fillStyle = darken(body, 0.25);
      c.beginPath();
      c.ellipse(x, y + 1, r, r * 0.7, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = lighten(body, 0.18);
      c.beginPath();
      c.ellipse(x, y, r * 0.9, r * 0.6, 0, 0, Math.PI * 2);
      c.fill();
    }
    // a few roots
    c.strokeStyle = rgba(darken(body, 0.3), 0.25);
    c.lineWidth = 1.5;
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      const x = hash(i + 30) * 128;
      c.moveTo(x, 0);
      c.quadraticCurveTo(x + 10, 14, x + 4 - hash(i) * 10, 28);
    }
    c.stroke();
  },
  planks(c, [body, , edge]) {
    for (let r = 0; r < 8; r++) {
      const y = r * 16;
      c.fillStyle = mix(body, r % 2 ? lighten(body, 0.06) : darken(body, 0.05), hash(r) * 0.8);
      c.fillRect(0, y, 128, 16);
      // grain
      c.strokeStyle = rgba(darken(body, 0.25), 0.35);
      c.lineWidth = 1;
      c.beginPath();
      for (let k = 0; k < 3; k++) {
        const gy = y + 4 + k * 4 + hash(r * 3 + k) * 2;
        c.moveTo(0, gy);
        c.bezierCurveTo(40, gy - 1.5, 80, gy + 1.5, 128, gy);
      }
      c.stroke();
      c.fillStyle = rgba('#ffffff', 0.12);
      c.fillRect(0, y, 128, 1);
      c.fillStyle = rgba(edge, 0.9);
      c.fillRect(0, y + 15, 128, 1);
      const seam = (r % 2 ? 40 : 100) + hash(r + 9) * 10;
      c.fillRect(seam, y, 2, 16);
      c.fillStyle = rgba('#000000', 0.35);
      c.fillRect(seam + 5, y + 7, 2, 2);
      c.fillRect(seam - 5, y + 7, 2, 2);
    }
  },
  bricks(c, [body, top, edge]) {
    c.fillStyle = darken(edge, 0.1);
    c.fillRect(0, 0, 128, 128);
    for (let r = 0; r < 8; r++) {
      const off = r % 2 ? 16 : 0;
      for (let k = -1; k < 4; k++) {
        const x = k * 32 + off;
        const y = r * 16;
        const tone = hash(r * 7 + k * 3 + 1);
        c.fillStyle = mix(body, tone > 0.5 ? lighten(body, 0.1) : darken(body, 0.1), Math.abs(tone - 0.5) * 2);
        c.fillRect(x + 1, y + 1, 30, 14);
        c.fillStyle = rgba(lighten(top, 0.2), 0.35);
        c.fillRect(x + 1, y + 1, 30, 1.5);
        c.fillStyle = rgba('#000000', 0.18);
        c.fillRect(x + 1, y + 13.5, 30, 1.5);
      }
    }
    speckle(c, 128, 128, 90, [rgba('#000000', 0.15), rgba('#ffffff', 0.1)], 1, 2, 4);
  },
  plates(c, [body, top, edge]) {
    c.fillStyle = body;
    c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 40; i++) {
      c.fillStyle = rgba(i % 2 ? '#ffffff' : '#000000', 0.04);
      c.fillRect(0, hash(i) * 128, 128, 1);
    }
    c.strokeStyle = edge;
    c.lineWidth = 2;
    c.strokeRect(1, 1, 62, 62);
    c.strokeRect(65, 1, 62, 62);
    c.strokeRect(1, 65, 126, 62);
    c.strokeStyle = rgba(lighten(top, 0.2), 0.25);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(3, 3.5);
    c.lineTo(61, 3.5);
    c.moveTo(67, 3.5);
    c.lineTo(125, 3.5);
    c.moveTo(3, 67.5);
    c.lineTo(125, 67.5);
    c.stroke();
    for (const [x, y] of [[8, 8], [56, 8], [72, 8], [120, 8], [8, 56], [56, 56], [72, 56], [120, 56], [8, 72], [120, 72], [8, 120], [120, 120]]) {
      c.fillStyle = edge;
      c.beginPath();
      c.arc(x, y, 2.5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = rgba(lighten(top, 0.4), 0.6);
      c.fillRect(x - 1.5, y - 1.5, 1.5, 1.5);
    }
  },
  circuit(c, [body, top, edge]) {
    c.fillStyle = body;
    c.fillRect(0, 0, 128, 128);
    c.fillStyle = rgba(edge, 0.8);
    for (let y = 0; y < 128; y += 4) c.fillRect(0, y, 128, 1);
    c.strokeStyle = rgba(top, 0.22);
    c.lineWidth = 1.5;
    c.beginPath();
    for (let i = 0; i < 7; i++) {
      const x = Math.floor(hash(i * 3.3) * 16) * 8;
      const y = Math.floor(hash(i * 1.9 + 2) * 16) * 8;
      c.moveTo(x, y);
      c.lineTo(x + 24, y);
      c.lineTo(x + 24, y + 16 + hash(i) * 20);
    }
    c.stroke();
    speckle(c, 128, 128, 22, [rgba(top, 0.45), rgba('#00f0ff', 0.3)], 2, 4, 9);
  },
};
const TEX_OF = { grass: 'soil', dirt: 'soil', wood: 'planks', floor: 'planks', stone: 'bricks', ruin: 'bricks', dark: 'bricks', metal: 'plates', glitch: 'circuit', red: 'circuit' };

export function drawSolid(c, s, g) {
  if (s.kind === 'none') return;
  const kind = SOLID[s.kind] ? s.kind : 'grass';
  const cols = SOLID[kind];
  const [body, top, edge] = cols;
  const flicker = kind === 'glitch' && Math.random() < 0.02;
  const thin = s.h <= 24;
  c.save();
  if (s.alpha != null) c.globalAlpha = s.alpha;
  if (s.shakeX) c.translate((Math.random() - 0.5) * s.shakeX, 0);
  if (kind === 'popup') {
    shadow(c, s.x + s.w / 2, s.y + Math.max(s.h, 20) + 10, s.w * 0.55, 0.3, 8);
    popupWindow(c, s.x, s.y, s.w, Math.max(s.h, 20), '', '#5a74ff');
    c.restore();
    return;
  }
  // only the part that is on screen (ground strips can be thousands of px)
  const cam = g?.cam;
  const half = cam ? W / 2 / cam.zoom + 30 : 1e5;
  const x0 = cam ? Math.max(s.x, cam.x - half) : s.x;
  const x1 = cam ? Math.min(s.x + s.w, cam.x + half) : s.x + s.w;
  const vw = x1 - x0;
  if (vw <= 0) {
    c.restore();
    return;
  }
  const hh = cam ? Math.min(s.h, cam.y + H / 2 / cam.zoom + 30 - s.y) : s.h;

  // soft contact shadow under floating platforms
  if (thin) c.drawImage(fadeStrip('#000000', 0.28, 0, 0.3), x0 + 4, s.y + s.h, vw - 8, 16);

  c.fillStyle = flicker ? '#ff4fd8' : pattern(c, `solid:${kind}`, 128, (k) => TEX[TEX_OF[kind]](k, cols));
  if (thin && kind !== 'glitch' && kind !== 'red') {
    rr(c, s.x, s.y, s.w, s.h, 4);
    c.fill();
  } else c.fillRect(x0, s.y, vw, hh);

  // depth: the deeper, the darker
  if (!thin && hh > 12) {
    c.drawImage(fadeStrip('#000000', 0, 0.5, 0.4), x0, s.y + 8, vw, Math.min(hh - 8, 180));
    if (hh > 188) {
      c.fillStyle = 'rgba(0,0,0,0.5)';
      c.fillRect(x0, s.y + 188, vw, hh - 188);
    }
    // shaded sides on blocks that stand on their own
    const sideW = Math.min(14, s.w / 4);
    if (s.x >= x0) c.drawImage(fadeStripX('#000000', 0.3, 0), s.x, s.y + 4, sideW, hh - 4);
    if (s.x + s.w <= x1) c.drawImage(fadeStripX('#000000', 0, 0.3), s.x + s.w - sideW, s.y + 4, sideW, hh - 4);
  } else if (thin) {
    c.fillStyle = 'rgba(0,0,0,0.28)';
    c.fillRect(s.x + 2, s.y + s.h - 3, s.w - 4, 3);
  }

  const t = g?.time ?? 0;
  if (kind === 'grass') {
    // a thick lip of turf with a ragged edge and a shadow under it
    c.drawImage(fadeStrip('#000000', 0.32, 0, 0.35), x0, s.y + 9, vw, 12);
    const lip = Math.min(9, s.h);
    c.fillStyle = turf(c, top, edge);
    c.save();
    c.translate(0, s.y);
    c.beginPath();
    c.moveTo(x0, 0);
    c.lineTo(x0, lip);
    const start = Math.floor(x0 / 8) * 8;
    for (let x = start; x <= x1; x += 8) c.lineTo(x + 4, lip + 1 + hash(x * 0.13) * 4);
    c.lineTo(x1, lip);
    c.lineTo(x1, 0);
    c.fill();
    // blades along the top, swaying a little
    const bs = Math.floor(x0 / 6) * 6;
    c.fillStyle = edge;
    c.beginPath();
    for (let x = bs; x < x1 - 2; x += 6) {
      if (x < s.x + 2) continue;
      const hgt = 3 + hash(x * 0.71) * 6;
      const sway = Math.sin(t * 1.8 + x * 0.05) * 1.6;
      c.moveTo(x - 1.5, 1);
      c.lineTo(x + sway, -hgt);
      c.lineTo(x + 1.5, 1);
    }
    c.fill();
    c.fillStyle = lighten(top, 0.15);
    c.beginPath();
    for (let x = bs + 3; x < x1 - 2; x += 6) {
      if (x < s.x + 2) continue;
      const hgt = 2 + hash(x * 0.37) * 5;
      const sway = Math.sin(t * 1.8 + x * 0.05 + 1) * 1.6;
      c.moveTo(x - 1.2, 1);
      c.lineTo(x + sway, -hgt);
      c.lineTo(x + 1.2, 1);
    }
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.28)';
    c.fillRect(x0, 0, vw, 1.5);
    c.restore();
  } else if (kind === 'glitch' || kind === 'red') {
    // a neon edge that bleeds light
    const pulse = 0.75 + 0.25 * Math.sin(t * 4 + s.x);
    c.fillStyle = top;
    c.fillRect(x0, s.y, vw, 3);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha *= pulse;
    c.drawImage(fadeStrip(top, 0, 0.55, 0.6), x0, s.y - 12, vw, 12);
    c.drawImage(fadeStrip(top, 0.4, 0, 0.4), x0, s.y + 3, vw, thin ? s.h - 3 : 22);
    c.restore();
  } else {
    // a lit top edge
    const lipH = thin ? 3 : kind === 'metal' ? 5 : 6;
    c.fillStyle = top;
    c.fillRect(x0, s.y, vw, lipH);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(x0, s.y, vw, 1);
    c.fillStyle = edge;
    c.fillRect(x0, s.y + lipH, vw, 2);
    if (!thin) c.drawImage(fadeStrip('#000000', 0.25, 0, 0.3), x0, s.y + lipH + 2, vw, 10);
    if (kind === 'metal' && thin) {
      // running lights on metal platforms
      const blink = 0.6 + 0.4 * Math.sin(t * 3 + s.x * 0.01);
      for (const lx of [s.x + 6, s.x + s.w - 6]) {
        c.fillStyle = '#7fe8ff';
        c.fillRect(lx - 1.5, s.y + 6, 3, 3);
        glow(c, lx, s.y + 7.5, 12, '#3fc8ff', blink);
      }
    }
  }
  if (s.warn) {
    c.fillStyle = 'rgba(255, 60, 60, 0.45)';
    c.fillRect(x0, s.y, vw, hh);
  }
  c.restore();
}

// The turf's vertical gradient as a 16px pattern, so it lines up at any y.
function turf(c, top, edge) {
  return pattern(c, `turf:${top}`, 16, (k) => {
    const g = k.createLinearGradient(0, 0, 0, 16);
    g.addColorStop(0, lighten(top, 0.12));
    g.addColorStop(0.6, top);
    g.addColorStop(1, edge);
    k.fillStyle = g;
    k.fillRect(0, 0, 16, 16);
  });
}

/* ---------- cached gradients for props (in a 100x100 or local space) ---------- */
let WATER_GRAD = null;
const PROP_GRADS = {};
function propGrad(c, key, make) {
  return (PROP_GRADS[key] ??= make(c));
}
const WINDOW_DAY = (c) =>
  propGrad(c, 'winDay', (k) => {
    const g = k.createLinearGradient(0, 0, 0, 100);
    g.addColorStop(0, '#7cc4f5');
    g.addColorStop(0.7, '#c4e6ff');
    g.addColorStop(1, '#e9f6ff');
    return g;
  });
const WINDOW_NIGHT = (c) =>
  propGrad(c, 'winNight', (k) => {
    const g = k.createLinearGradient(0, 0, 0, 100);
    g.addColorStop(0, '#0c1230');
    g.addColorStop(1, '#2c3a6a');
    return g;
  });
const houseGlass = (c, empty) =>
  propGrad(c, empty ? 'glassEmpty' : 'glassLit', (k) => {
    const g = k.createLinearGradient(0, 0, 0, 36);
    g.addColorStop(0, empty ? '#2a2f3a' : '#ffe6a8');
    g.addColorStop(1, empty ? '#1a1d26' : '#f5b45a');
    return g;
  });

/* ---------- props ---------- */
export function drawDeco(c, d, g) {
  const f = DECO[d.t];
  if (!f) return;
  c.save();
  if (d.alpha != null) c.globalAlpha = d.alpha;
  f(c, d, g);
  c.restore();
}

const DECO = {
  // interior back wall (with wallpaper stripes)
  wall(c, d) {
    c.fillStyle = d.color ?? '#f4e1c8';
    c.fillRect(d.x, d.y, d.w, d.h);
    c.fillStyle = d.stripe ?? 'rgba(200, 150, 110, 0.18)';
    for (let x = d.x; x < d.x + d.w; x += 36) c.fillRect(x, d.y, 14, d.h);
    // a fine pattern in the paper
    c.fillStyle = 'rgba(160, 110, 70, 0.08)';
    for (let x = d.x + 25; x < d.x + d.w; x += 36) for (let y = d.y + 20; y < d.y + d.h - 30; y += 28) c.fillRect(x - 1, y - 1, 3, 3);
    // light falls off towards the ceiling, and the corner by the floor is dark
    c.drawImage(fadeStrip('#2a1608', 0.35, 0, 0.5), d.x, d.y, d.w, Math.min(220, d.h * 0.5));
    c.drawImage(fadeStrip('#2a1608', 0, 0.25, 0.6), d.x, d.y + d.h - 70, d.w, 54);
    c.fillStyle = d.trim ?? '#c79f7a';
    c.fillRect(d.x, d.y + d.h - 16, d.w, 16);
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fillRect(d.x, d.y + d.h - 16, d.w, 2);
    c.fillStyle = 'rgba(0,0,0,0.15)';
    c.fillRect(d.x, d.y + d.h - 4, d.w, 4);
    if (d.broken) {
      c.fillStyle = 'rgba(40, 30, 30, 0.5)';
      c.beginPath();
      c.moveTo(d.x + d.w * 0.6, d.y);
      c.lineTo(d.x + d.w * 0.7, d.y + d.h * 0.4);
      c.lineTo(d.x + d.w * 0.62, d.y + d.h * 0.7);
      c.lineTo(d.x + d.w * 0.66, d.y + d.h);
      c.lineTo(d.x + d.w * 0.8, d.y + d.h);
      c.lineTo(d.x + d.w * 0.85, d.y);
      c.fill();
    }
  },
  window(c, d, g) {
    const w = d.w ?? 90;
    const h = d.h ?? 80;
    // light from outside spills onto the wall
    softLight(c, d.x + w / 2, d.y + h / 2, Math.max(w, h) * 1.1, d.night ? '#6a8ad8' : '#fff6d8', d.night ? 0.25 : 0.55);
    const glass = (d.night ? WINDOW_NIGHT : WINDOW_DAY)(c);
    c.save();
    c.translate(d.x, d.y);
    c.scale(w / 100, h / 100);
    c.fillStyle = glass;
    rr(c, 0, 0, 100, 100, 6);
    c.fill();
    c.restore();
    if (d.night) {
      c.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 6; i++) c.fillRect(d.x + 8 + hash(i + d.x) * (w - 16), d.y + 8 + hash(i * 3 + d.y) * h * 0.5, 1.5, 1.5);
    }
    if (d.rain) {
      c.strokeStyle = 'rgba(200, 220, 255, 0.6)';
      c.lineWidth = 1.5;
      c.beginPath();
      for (let i = 0; i < 12; i++) {
        const x = d.x + ((i * 17 + g.time * 30) % w);
        const y = d.y + ((i * 23 + g.time * 260) % h);
        c.moveTo(x, y);
        c.lineTo(x - 2, y + 8);
      }
      c.stroke();
    }
    // reflections on the glass
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.beginPath();
    c.moveTo(d.x + w * 0.12, d.y + h);
    c.lineTo(d.x + w * 0.42, d.y);
    c.lineTo(d.x + w * 0.52, d.y);
    c.lineTo(d.x + w * 0.22, d.y + h);
    c.moveTo(d.x + w * 0.6, d.y + h);
    c.lineTo(d.x + w * 0.85, d.y);
    c.lineTo(d.x + w * 0.88, d.y);
    c.lineTo(d.x + w * 0.63, d.y + h);
    c.fill();
    c.strokeStyle = '#8a6040';
    c.lineWidth = 6;
    rr(c, d.x, d.y, w, h, 6);
    c.stroke();
    c.beginPath();
    c.moveTo(d.x + w / 2, d.y);
    c.lineTo(d.x + w / 2, d.y + h);
    c.stroke();
    c.strokeStyle = 'rgba(255,220,180,0.35)';
    c.lineWidth = 1.5;
    rr(c, d.x - 2, d.y - 2, w + 4, h + 4, 7);
    c.stroke();
    // sill
    c.fillStyle = '#9a6c48';
    c.fillRect(d.x - 8, d.y + h + 2, w + 16, 7);
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fillRect(d.x - 8, d.y + h + 2, w + 16, 1.5);
    c.drawImage(fadeStrip('#2a1608', 0.25, 0), d.x - 6, d.y + h + 9, w + 12, 8);
    if (d.broken) {
      c.strokeStyle = '#fff';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(d.x + 10, d.y + 10);
      c.lineTo(d.x + 40, d.y + 45);
      c.lineTo(d.x + 30, d.y + 70);
      c.moveTo(d.x + 40, d.y + 45);
      c.lineTo(d.x + 75, d.y + 30);
      c.stroke();
    }
  },
  bed(c, d) {
    shadow(c, d.x + 80, d.y, 90, 0.3);
    c.fillStyle = '#8a5a3a';
    c.fillRect(d.x, d.y - 50, 12, 50);
    c.fillRect(d.x + 148, d.y - 34, 12, 34);
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fillRect(d.x + 2, d.y - 50, 3, 50);
    c.fillStyle = '#6fa3d8';
    rr(c, d.x + 6, d.y - 34, 150, 22, 6);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fillRect(d.x + 12, d.y - 33, 140, 3);
    c.fillStyle = 'rgba(20,40,90,0.22)';
    c.fillRect(d.x + 8, d.y - 18, 146, 5);
    c.fillStyle = '#fff';
    rr(c, d.x + 14, d.y - 44, 40, 14, 6);
    c.fill();
    c.fillStyle = 'rgba(120,140,180,0.3)';
    c.fillRect(d.x + 18, d.y - 34, 32, 3);
    c.fillStyle = '#5a3a24';
    c.fillRect(d.x + 6, d.y - 14, 150, 6);
  },
  shelf(c, d) {
    const tilt = d.broken ? 0.35 : 0;
    c.save();
    c.translate(d.x, d.y);
    c.rotate(tilt);
    c.fillStyle = '#9b6a42';
    c.fillRect(0, 0, 110, 10);
    if (!d.broken) {
      c.fillStyle = '#e2674f';
      c.fillRect(10, -26, 16, 26);
      c.fillStyle = '#7cc6a4';
      c.fillRect(28, -22, 14, 22);
      c.fillStyle = '#f2c14e';
      c.beginPath();
      c.arc(80, -12, 12, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    c.fillStyle = '#6b4528';
    c.fillRect(d.x + 8, d.y + 10, 6, 14);
    if (!d.broken) c.fillRect(d.x + 96, d.y + 10, 6, 14);
  },
  photo(c, d) {
    c.fillStyle = '#8a6040';
    c.fillRect(d.x, d.y, 60, 48);
    c.fillStyle = d.dark ? '#555' : '#ffeacc';
    c.fillRect(d.x + 5, d.y + 5, 50, 38);
    c.fillStyle = '#e2674f';
    c.beginPath();
    c.arc(d.x + 20, d.y + 28, 9, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f39ac0';
    c.beginPath();
    c.arc(d.x + 40, d.y + 28, 9, 0, Math.PI * 2);
    c.fill();
    heart(c, d.x + 30, d.y + 13, 5, '#ff4f7b');
    if (d.dark) {
      c.strokeStyle = '#ddd';
      c.beginPath();
      c.moveTo(d.x + 8, d.y + 8);
      c.lineTo(d.x + 52, d.y + 40);
      c.stroke();
    }
  },
  table(c, d) {
    shadow(c, d.x + 45, d.y, 50, 0.28);
    c.fillStyle = '#a8744a';
    c.fillRect(d.x, d.y - 40, 90, 8);
    c.fillRect(d.x + 6, d.y - 32, 8, 32);
    c.fillRect(d.x + 76, d.y - 32, 8, 32);
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fillRect(d.x, d.y - 40, 90, 2);
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.fillRect(d.x, d.y - 33, 90, 1.5);
    c.fillRect(d.x + 11, d.y - 32, 3, 32);
    c.fillRect(d.x + 81, d.y - 32, 3, 32);
    if (d.soup) {
      c.fillStyle = '#fff';
      c.beginPath();
      c.ellipse(d.x + 45, d.y - 44, 16, 6, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#9db84a';
      c.beginPath();
      c.ellipse(d.x + 45, d.y - 45, 12, 3.5, 0, 0, Math.PI * 2);
      c.fill();
    }
  },
  lamp(c, d) {
    if (!d.off) {
      glow(c, d.x + 10, d.y - 66, 150, '#ffb050', 0.4);
      softLight(c, d.x + 10, d.y - 2, 70, '#ffcf80', 0.5);
    }
    c.fillStyle = '#6b4528';
    c.fillRect(d.x + 8, d.y - 60, 4, 60);
    c.fillRect(d.x + 1, d.y - 4, 18, 4);
    c.fillStyle = d.off ? '#8a7a6a' : '#ffd77a';
    c.beginPath();
    c.moveTo(d.x - 6, d.y - 60);
    c.lineTo(d.x + 26, d.y - 60);
    c.lineTo(d.x + 18, d.y - 84);
    c.lineTo(d.x + 2, d.y - 84);
    c.fill();
    c.fillStyle = d.off ? 'rgba(0,0,0,0.15)' : 'rgba(255,140,40,0.35)';
    c.beginPath();
    c.moveTo(d.x + 10, d.y - 60);
    c.lineTo(d.x + 26, d.y - 60);
    c.lineTo(d.x + 18, d.y - 84);
    c.lineTo(d.x + 12, d.y - 84);
    c.fill();
    if (!d.off) {
      c.fillStyle = 'rgba(255, 240, 200, 0.9)';
      c.fillRect(d.x - 4, d.y - 61, 28, 2);
    }
  },
  rug(c, d) {
    const w = d.w ?? 140;
    const col = d.color ?? '#d9826a';
    c.fillStyle = darken(col, 0.25);
    c.beginPath();
    c.ellipse(d.x + w / 2, d.y - 1, w / 2, 6.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(d.x + w / 2, d.y - 2, w / 2 - 2, 5.5, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = lighten(col, 0.35);
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(d.x + w / 2, d.y - 2, w / 2 - 12, 3.2, 0, 0, Math.PI * 2);
    c.stroke();
  },
  door(c, d) {
    const base = d.dark ? '#3a2a20' : '#8a5a3a';
    shadow(c, d.x + 27, d.y, 34, 0.25);
    c.fillStyle = darken(base, 0.3);
    rr(c, d.x - 4, d.y - 94, 62, 94, 10);
    c.fill();
    c.fillStyle = base;
    rr(c, d.x, d.y - 90, 54, 90, 8);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.18)';
    rr(c, d.x + 8, d.y - 80, 38, 30, 4);
    c.fill();
    rr(c, d.x + 8, d.y - 42, 38, 34, 4);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.fillRect(d.x + 8, d.y - 80, 38, 2);
    c.fillRect(d.x + 8, d.y - 42, 38, 2);
    c.fillStyle = '#f2c14e';
    c.beginPath();
    c.arc(d.x + 44, d.y - 44, 4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff6c0';
    c.fillRect(d.x + 42.5, d.y - 46, 1.5, 1.5);
  },
  fallenDoor(c, d) {
    c.save();
    c.translate(d.x, d.y);
    c.rotate(-0.08);
    c.fillStyle = '#7a4e30';
    rr(c, 0, -14, 90, 14, 4);
    c.fill();
    c.restore();
  },
  toolbox(c, d) {
    c.fillStyle = '#d94c3d';
    rr(c, d.x, d.y - 22, 40, 22, 4);
    c.fill();
    c.strokeStyle = '#7a2a20';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(d.x + 20, d.y - 22, 8, Math.PI, 0);
    c.stroke();
  },
  house(c, d) {
    const w = d.w ?? 220;
    const h = d.h ?? 150;
    const x = d.x;
    const y = d.y - h;
    const wallCol = d.color ?? '#f4e1c8';
    c.fillStyle = wallCol;
    if (d.broken) {
      c.beginPath();
      c.moveTo(x, d.y);
      c.lineTo(x, y + 20);
      c.lineTo(x + w * 0.3, y + 50);
      c.lineTo(x + w * 0.55, y + 10);
      c.lineTo(x + w * 0.75, y + 70);
      c.lineTo(x + w, y + 40);
      c.lineTo(x + w, d.y);
      c.fill();
      c.save();
      c.clip();
      c.drawImage(fadeStrip('#1a1010', 0, 0.35), x, y, w, h);
      c.restore();
      c.fillStyle = 'rgba(30, 20, 20, 0.35)';
      c.fillRect(x + w * 0.2, y + 70, w * 0.25, h - 70);
      return;
    }
    shadow(c, x + w / 2, d.y, w * 0.62, 0.3, 10);
    c.fillRect(x, y, w, h);
    // siding, shade on the far side, and the dark eave line under the roof
    c.fillStyle = 'rgba(120, 80, 50, 0.08)';
    for (let yy = y + 12; yy < d.y; yy += 12) c.fillRect(x, yy, w, 1.5);
    c.drawImage(fadeStripX('#2a1608', 0, 0.22), x + w * 0.55, y, w * 0.45, h);
    c.drawImage(fadeStrip('#2a1608', 0.35, 0, 0.3), x, y, w, 26);
    // chimney
    c.fillStyle = darken(d.roof ?? '#c9523e', 0.25);
    c.fillRect(x + w * 0.72, y - 58, 20, 40);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(x + w * 0.72, y - 58, 20, 5);
    // the roof, with rows of tiles and a lit edge
    const roof = d.roof ?? '#c9523e';
    c.fillStyle = roof;
    c.beginPath();
    c.moveTo(x - 20, y);
    c.lineTo(x + w / 2, y - 70);
    c.lineTo(x + w + 20, y);
    c.fill();
    c.save();
    c.clip();
    c.strokeStyle = rgba(darken(roof, 0.3), 0.45);
    c.lineWidth = 1.5;
    c.beginPath();
    for (let k = 1; k < 6; k++) {
      const yy = y - 70 + k * 12;
      c.moveTo(x - 20, yy);
      c.lineTo(x + w + 20, yy);
    }
    c.stroke();
    c.drawImage(fadeStripX('#000000', 0, 0.25), x + w / 2, y - 70, w / 2 + 20, 70);
    c.restore();
    c.strokeStyle = lighten(roof, 0.3);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x - 20, y);
    c.lineTo(x + w / 2, y - 70);
    c.stroke();
    c.fillStyle = darken(roof, 0.35);
    c.fillRect(x - 20, y - 2, w + 40, 5);
    // door
    const dx = x + w / 2 - 24;
    c.fillStyle = darken(wallCol, 0.25);
    rr(c, dx - 4, d.y - 84, 56, 84, 8);
    c.fill();
    c.fillStyle = d.empty ? '#3a2a20' : '#8a5a3a';
    rr(c, dx, d.y - 80, 48, 80, 6);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.fillRect(dx + 7, d.y - 70, 34, 26);
    c.fillRect(dx + 7, d.y - 38, 34, 30);
    c.fillStyle = '#f2c14e';
    c.beginPath();
    c.arc(dx + 39, d.y - 40, 3.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = darken(wallCol, 0.35);
    c.fillRect(dx - 8, d.y - 3, 64, 3);
    // windows: warm light inside unless the house is empty
    for (const wx of [x + 22, x + w - 62]) {
      if (!d.empty) glow(c, wx + 20, y + 52, 46, '#ffb85a', 0.3);
      c.fillStyle = darken(wallCol, 0.3);
      c.fillRect(wx - 4, y + 30, 48, 44);
      c.save();
      c.translate(wx, y + 34);
      c.fillStyle = houseGlass(c, d.empty);
      c.fillRect(0, 0, 40, 36);
      c.restore();
      c.fillStyle = darken(wallCol, 0.3);
      c.fillRect(wx + 19, y + 34, 3, 36);
      c.fillRect(wx, y + 50, 40, 3);
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.fillRect(wx + 3, y + 37, 3, 10);
      c.fillStyle = lighten(wallCol, 0.4);
      c.fillRect(wx - 6, y + 74, 52, 5);
    }
    if (d.label) {
      c.font = `700 13px ${FONT}`;
      const lw = c.measureText(d.label).width + 18;
      c.fillStyle = '#7a5232';
      rr(c, x + w / 2 - lw / 2, y - 31, lw, 22, 5);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.2)';
      c.fillRect(x + w / 2 - lw / 2 + 3, y - 30, lw - 6, 2);
      text(c, d.label, x + w / 2, y - 20, { size: 13, color: '#fff3dc' });
    }
  },
  hole(c, d) {
    // a building sliced cleanly out of existence
    c.fillStyle = 'rgba(10, 10, 20, 0.85)';
    c.fillRect(d.x, d.y - d.h, d.w, d.h);
    c.fillStyle = 'rgba(80, 140, 255, 0.08)';
    for (let y = d.y - d.h; y < d.y; y += 6) c.fillRect(d.x, y, d.w, 2);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.drawImage(fadeStripX('#3a6aff', 0.35, 0), d.x, d.y - d.h, 18, d.h);
    c.drawImage(fadeStripX('#3a6aff', 0, 0.35), d.x + d.w - 18, d.y - d.h, 18, d.h);
    c.restore();
    c.strokeStyle = '#59f';
    c.setLineDash([6, 6]);
    c.lineWidth = 2;
    c.strokeRect(d.x, d.y - d.h, d.w, d.h);
    c.setLineDash([]);
  },
  tag(c, d, g) {
    const y = d.y + Math.sin(g.time * 2 + d.x) * 4;
    c.font = `700 14px ${FONT}`;
    const w = c.measureText(d.text).width + 18;
    c.fillStyle = 'rgba(14, 14, 24, 0.75)';
    rr(c, d.x - w / 2, y - 13, w, 26, 9);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.18)';
    c.lineWidth = 1;
    c.stroke();
    text(c, d.text, d.x, y, { size: 14, color: d.color ?? '#cfe3ff' });
  },
  tree(c, d, g) {
    const s = d.s ?? 1;
    const t = g?.time ?? 0;
    shadow(c, d.x, d.y, 54 * s, 0.3, 9 * s);
    const bark = d.dead ? '#4a3a32' : '#7a5232';
    c.fillStyle = bark;
    c.beginPath();
    c.moveTo(d.x - 11 * s, d.y);
    c.lineTo(d.x - 7 * s, d.y - 90 * s);
    c.lineTo(d.x + 7 * s, d.y - 90 * s);
    c.lineTo(d.x + 11 * s, d.y);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.fillRect(d.x + 1 * s, d.y - 90 * s, 6 * s, 90 * s);
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.fillRect(d.x - 6 * s, d.y - 88 * s, 2.5 * s, 80 * s);
    if (d.dead) {
      c.strokeStyle = bark;
      c.lineWidth = 5 * s;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(d.x, d.y - 70 * s);
      c.lineTo(d.x - 30 * s, d.y - 110 * s);
      c.moveTo(d.x, d.y - 80 * s);
      c.lineTo(d.x + 26 * s, d.y - 120 * s);
      c.moveTo(d.x - 18 * s, d.y - 94 * s);
      c.lineTo(d.x - 12 * s, d.y - 118 * s);
      c.stroke();
      return;
    }
    // canopy: a shaded mass, a mid tone, then sunlit clumps on top, swaying
    const col = d.color ?? '#5fae5b';
    const sw = Math.sin(t * 1.2 + d.x * 0.01) * 2 * s;
    c.fillStyle = darken(col, 0.22);
    blobs(c, [[d.x + sw, d.y - 106 * s, 46 * s], [d.x - 36 * s + sw, d.y - 84 * s, 32 * s], [d.x + 36 * s + sw, d.y - 84 * s, 32 * s], [d.x + sw, d.y - 76 * s, 30 * s]]);
    c.fillStyle = col;
    blobs(c, [[d.x - 4 * s + sw, d.y - 112 * s, 40 * s], [d.x - 36 * s + sw, d.y - 90 * s, 26 * s], [d.x + 30 * s + sw, d.y - 92 * s, 26 * s]]);
    c.fillStyle = lighten(col, 0.22);
    blobs(c, [[d.x - 12 * s + sw * 1.3, d.y - 124 * s, 22 * s], [d.x - 38 * s + sw * 1.3, d.y - 98 * s, 13 * s], [d.x + 18 * s + sw * 1.3, d.y - 120 * s, 12 * s]]);
    c.fillStyle = 'rgba(255,255,230,0.22)';
    blobs(c, [[d.x - 18 * s + sw * 1.4, d.y - 130 * s, 9 * s]]);
  },
  bush(c, d) {
    const col = d.color ?? '#69b85e';
    shadow(c, d.x + 22, d.y, 34, 0.25, 6);
    c.fillStyle = darken(col, 0.2);
    blobs(c, [[d.x, d.y - 12, 20], [d.x + 22, d.y - 16, 24], [d.x + 44, d.y - 10, 18]]);
    c.fillStyle = col;
    blobs(c, [[d.x - 2, d.y - 16, 15], [d.x + 20, d.y - 22, 18], [d.x + 42, d.y - 14, 12]]);
    c.fillStyle = lighten(col, 0.22);
    blobs(c, [[d.x - 4, d.y - 22, 7], [d.x + 16, d.y - 30, 9], [d.x + 40, d.y - 20, 5]]);
  },
  flower(c, d, g) {
    if (d.dead) {
      c.strokeStyle = '#5a4a3a';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(d.x, d.y);
      c.quadraticCurveTo(d.x + 6, d.y - 10, d.x + 10, d.y - 6);
      c.stroke();
      return;
    }
    const sw = Math.sin(g.time * 2 + d.x) * 2;
    c.strokeStyle = '#4c8a3e';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(d.x, d.y);
    c.quadraticCurveTo(d.x, d.y - 10, d.x + sw, d.y - 18);
    c.stroke();
    c.fillStyle = '#5fa84e';
    c.beginPath();
    c.ellipse(d.x + 4, d.y - 7, 4, 1.8, -0.5, 0, Math.PI * 2);
    c.fill();
    // five petals and a bright centre
    const col = d.c ?? '#ff8fb1';
    const fx = d.x + sw;
    const fy = d.y - 20;
    c.fillStyle = darken(col, 0.12);
    c.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + d.x;
      c.moveTo(fx + Math.cos(a) * 4 + 3, fy + Math.sin(a) * 4);
      c.arc(fx + Math.cos(a) * 4, fy + Math.sin(a) * 4, 3, 0, Math.PI * 2);
    }
    c.fill();
    c.fillStyle = lighten(col, 0.25);
    c.beginPath();
    c.arc(fx - 1, fy - 1.5, 2.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffe28a';
    c.beginPath();
    c.arc(fx, fy, 2, 0, Math.PI * 2);
    c.fill();
  },
  fence(c, d) {
    const col = d.dead ? '#6a5a4a' : '#e8d2b0';
    c.drawImage(fadeStrip('#000000', 0, 0.22), d.x, d.y - 10, d.w, 10);
    for (let x = d.x; x < d.x + d.w; x += 22) {
      if (d.dead && hash(x) > 0.6) continue;
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(x, d.y);
      c.lineTo(x, d.y - 32);
      c.lineTo(x + 5, d.y - 37);
      c.lineTo(x + 10, d.y - 32);
      c.lineTo(x + 10, d.y);
      c.fill();
      c.fillStyle = 'rgba(0,0,0,0.14)';
      c.fillRect(x + 6.5, d.y - 33, 3.5, 33);
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.fillRect(x + 1, d.y - 32, 1.5, 30);
    }
    c.fillStyle = col;
    c.fillRect(d.x, d.y - 26, d.w, 5);
    c.fillStyle = 'rgba(0,0,0,0.15)';
    c.fillRect(d.x, d.y - 22, d.w, 1.5);
    c.fillStyle = col;
    c.fillRect(d.x, d.y - 12, d.w, 4);
  },
  stall(c, d) {
    const x = d.x;
    const y = d.y;
    if (d.broken) {
      c.fillStyle = '#6a4a32';
      c.save();
      c.translate(x + 60, y - 10);
      c.rotate(0.3);
      c.fillRect(-60, -6, 120, 10);
      c.restore();
      c.fillStyle = 'rgba(120, 40, 40, 0.6)';
      c.fillRect(x + 10, y - 10, 70, 10);
      return;
    }
    shadow(c, x + 60, y, 70, 0.3, 8);
    c.fillStyle = '#8a5a3a';
    c.fillRect(x + 4, y - 100, 8, 100);
    c.fillRect(x + 108, y - 100, 8, 100);
    c.fillStyle = 'rgba(255,255,255,0.15)';
    c.fillRect(x + 5, y - 100, 2, 100);
    c.fillRect(x + 109, y - 100, 2, 100);
    // counter with planks, shaded under the awning
    c.fillStyle = pattern(c, 'solid:wood', 128, (k) => TEX.planks(k, SOLID.wood));
    c.fillRect(x, y - 44, 120, 44);
    c.drawImage(fadeStrip('#000000', 0.3, 0.1), x, y - 44, 120, 44);
    c.fillStyle = '#dca673';
    c.fillRect(x - 3, y - 47, 126, 5);
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(x - 3, y - 47, 126, 1.5);
    // awning stripes with a scalloped hem
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i % 2 ? '#fff' : d.color ?? '#e2674f';
      c.beginPath();
      c.moveTo(x + i * 20 - 4, y - 100);
      c.lineTo(x + i * 20 + 20, y - 100);
      c.lineTo(x + i * 20 + 18, y - 82);
      c.lineTo(x + i * 20 - 2, y - 82);
      c.fill();
      c.beginPath();
      c.arc(x + i * 20 + 8, y - 82, 10, 0, Math.PI);
      c.fill();
    }
    c.fillStyle = 'rgba(0,0,0,0.12)';
    c.fillRect(x - 4, y - 88, 124, 6);
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fillRect(x - 4, y - 100, 124, 2);
    c.drawImage(fadeStrip('#000000', 0.25, 0), x + 12, y - 72, 96, 14);
    if (d.sign) text(c, d.sign, x + 60, y - 112, { size: 14, color: '#5a3a24' });
  },
  sign(c, d) {
    shadow(c, d.x + 21, d.y, 14, 0.25, 4);
    c.fillStyle = '#8a5a3a';
    c.fillRect(d.x + 18, d.y - 40, 6, 40);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    rr(c, d.x - 9, d.y - 61, 62, 28, 4);
    c.fill();
    c.fillStyle = '#d9a86c';
    rr(c, d.x - 10, d.y - 64, 62, 28, 4);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fillRect(d.x - 7, d.y - 63, 56, 1.5);
    c.fillStyle = 'rgba(120,70,30,0.2)';
    c.fillRect(d.x - 8, d.y - 52, 58, 1);
    c.fillRect(d.x - 8, d.y - 44, 58, 1);
    text(c, d.text ?? '→', d.x + 21, d.y - 50, { size: 12, color: '#4a2a14' });
  },
  lamppost(c, d, g) {
    const on = !d.off;
    if (on) {
      const fl = 0.85 + 0.15 * Math.sin((g?.time ?? 0) * 7 + d.x);
      glow(c, d.x + 3, d.y - 124, 110, '#ffb347', 0.45 * fl);
      softLight(c, d.x + 3, d.y - 2, 60, '#ffd27a', 0.35);
    }
    c.fillStyle = '#3b3b48';
    c.fillRect(d.x, d.y - 120, 6, 120);
    c.fillRect(d.x - 4, d.y - 8, 14, 8);
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fillRect(d.x + 1, d.y - 118, 1.5, 110);
    c.fillStyle = '#2b2b36';
    c.fillRect(d.x - 6, d.y - 116, 18, 4);
    c.fillStyle = on ? '#ffe8a0' : '#555';
    c.beginPath();
    c.arc(d.x + 3, d.y - 124, 9, 0, Math.PI * 2);
    c.fill();
    if (on) {
      c.fillStyle = '#fffbe6';
      c.beginPath();
      c.arc(d.x + 3, d.y - 125, 4.5, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#2b2b36';
    c.beginPath();
    c.moveTo(d.x - 7, d.y - 131);
    c.lineTo(d.x + 13, d.y - 131);
    c.lineTo(d.x + 3, d.y - 140);
    c.fill();
  },
  campfire(c, d, g) {
    const t = g.time;
    glow(c, d.x, d.y - 26, 190, '#ff8a2a', 0.42 + 0.06 * Math.sin(t * 9) + 0.04 * Math.sin(t * 23));
    softLight(c, d.x, d.y - 2, 90, '#ffb060', 0.4);
    // stones and crossed logs
    c.fillStyle = '#5a4a44';
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.ellipse(d.x + i * 11, d.y - 3, 6, 4, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.save();
    c.translate(d.x, d.y - 6);
    for (const r of [-0.25, 0.25]) {
      c.save();
      c.rotate(r);
      c.fillStyle = '#6b4528';
      rr(c, -24, -4, 48, 8, 4);
      c.fill();
      c.fillStyle = '#a0704a';
      c.beginPath();
      c.ellipse(r < 0 ? -24 : 24, 0, 3, 4, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    c.restore();
    // flames: outer, middle, white-hot core, drawn additively
    c.save();
    c.globalCompositeOperation = 'lighter';
    const layers = [['#ff4a1a', 34, 16, 0.9], ['#ff9a2a', 26, 11, 0.9], ['#ffe28a', 15, 6, 1]];
    for (const [col, hgt, wid, a] of layers) {
      c.fillStyle = col;
      c.globalAlpha = a;
      for (let i = -1; i <= 1; i++) {
        const h = hgt * (0.75 + 0.25 * Math.sin(t * 11 + i * 2.1)) * (i ? 0.7 : 1);
        const sway = Math.sin(t * 7 + i) * 3;
        const bx = d.x + i * wid * 0.6;
        c.beginPath();
        c.moveTo(bx - wid / 2, d.y - 8);
        c.quadraticCurveTo(bx - wid / 2, d.y - 8 - h * 0.6, bx + sway, d.y - 8 - h);
        c.quadraticCurveTo(bx + wid / 2, d.y - 8 - h * 0.6, bx + wid / 2, d.y - 8);
        c.fill();
      }
    }
    c.restore();
    // embers drifting up
    for (let i = 0; i < 8; i++) {
      const k = (t * (0.5 + hash(i) * 0.4) + hash(i + 3)) % 1;
      const ex = d.x + (hash(i + 7) - 0.5) * 30 + Math.sin(t * 3 + i) * 8 * k;
      const ey = d.y - 16 - k * 110;
      const a = 1 - k;
      c.fillStyle = `rgba(255, ${170 + Math.floor(60 * (1 - k))}, 80, ${a})`;
      c.fillRect(ex - 1, ey - 1, 2, 2);
      glow(c, ex, ey, 6, '#ff8a2a', a * 0.8);
    }
  },
  log(c, d) {
    const w = d.w ?? 70;
    shadow(c, d.x + w / 2, d.y, w * 0.55, 0.28, 5);
    c.fillStyle = '#7a5232';
    rr(c, d.x, d.y - 16, w, 16, 8);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.15)';
    c.fillRect(d.x + 6, d.y - 14, w - 12, 2);
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.fillRect(d.x + 6, d.y - 5, w - 12, 3);
    c.fillStyle = '#b48558';
    c.beginPath();
    c.ellipse(d.x + w - 6, d.y - 8, 5, 7.5, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#7a5232';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(d.x + w - 6, d.y - 8, 2.5, 4, 0, 0, Math.PI * 2);
    c.stroke();
  },
  rock(c, d) {
    const r = d.r ?? 22;
    const col = d.color ?? '#9a9aa6';
    shadow(c, d.x, d.y, r * 1.2, 0.3, 5);
    c.fillStyle = darken(col, 0.2);
    c.beginPath();
    c.ellipse(d.x, d.y - 10, r, r * 0.6, 0, Math.PI, 0);
    c.lineTo(d.x + r, d.y);
    c.lineTo(d.x - r, d.y);
    c.fill();
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(d.x - r * 0.08, d.y - 11, r * 0.86, r * 0.52, 0, Math.PI, 0);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.beginPath();
    c.ellipse(d.x - r * 0.35, d.y - 10 - r * 0.38, r * 0.3, r * 0.1, -0.2, 0, Math.PI * 2);
    c.fill();
  },
  rubble(c, d) {
    shadow(c, d.x + (d.w ?? 80) / 2, d.y, (d.w ?? 80) * 0.6, 0.3, 5);
    for (let i = 0; i < (d.w ?? 80) / 14; i++) {
      const col = ['#7d7470', '#5c5452', '#a39994', '#8a5a3a'][i % 4];
      const x = d.x + i * 14 + hash(i + d.x) * 6;
      const s = 8 + hash(i * 7 + d.x) * 14;
      c.fillStyle = col;
      c.fillRect(x, d.y - s, s, s);
      c.fillStyle = 'rgba(255,255,255,0.22)';
      c.fillRect(x, d.y - s, s, 2);
      c.fillStyle = 'rgba(0,0,0,0.22)';
      c.fillRect(x + s - 3, d.y - s + 2, 3, s - 2);
    }
  },
  rack(c, d, g) {
    const h = d.h ?? 180;
    shadow(c, d.x + 35, d.y, 46, 0.4, 6);
    c.fillStyle = '#16233a';
    c.fillRect(d.x, d.y - h, 70, h);
    c.fillStyle = 'rgba(120,170,255,0.18)';
    c.fillRect(d.x, d.y - h, 70, 2);
    c.fillRect(d.x, d.y - h, 2, h);
    for (let r = 0; r < h / 26 - 1; r++) {
      c.fillStyle = '#0e1828';
      c.fillRect(d.x + 6, d.y - h + 8 + r * 26, 58, 20);
      const on = Math.sin(g.time * 4 + r * 3 + d.x) > 0;
      c.fillStyle = on ? '#3df59a' : '#1f4a3b';
      c.fillRect(d.x + 12, d.y - h + 15 + r * 26, 5, 5);
      if (on) glow(c, d.x + 14.5, d.y - h + 17.5 + r * 26, 14, '#3df59a', 0.6);
      c.fillStyle = 'rgba(120,170,255,0.12)';
      c.fillRect(d.x + 24, d.y - h + 16 + r * 26, 34, 1);
      c.fillRect(d.x + 24, d.y - h + 20 + r * 26, 34, 1);
    }
  },
  screen(c, d, g) {
    const w = d.w ?? 120;
    const h = d.h ?? 80;
    glow(c, d.x + w / 2, d.y + h / 2, Math.max(w, h) * 0.9, d.color ?? '#3df59a', 0.22);
    c.fillStyle = '#222';
    rr(c, d.x - 6, d.y - 6, w + 12, h + 12, 6);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.fillRect(d.x - 2, d.y - 5, w + 4, 1.5);
    c.fillStyle = d.bg ?? '#0b1a12';
    c.fillRect(d.x, d.y, w, h);
    if (d.face) adminFace(c, d.x + w / 2, d.y + h / 2, Math.min(w, h) * 0.38, g);
    if (d.text) {
      const lines = d.text.split('\n');
      lines.forEach((l, i) => text(c, l, d.x + w / 2, d.y + h / 2 + (i - (lines.length - 1) / 2) * 16, { size: d.size ?? 12, color: d.color ?? '#3df59a' }));
    }
    c.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let y = d.y + ((g.time * 30) % 4); y < d.y + h; y += 4) c.fillRect(d.x, y, w, 1);
    c.fillStyle = 'rgba(255,255,255,0.06)';
    c.beginPath();
    c.moveTo(d.x, d.y);
    c.lineTo(d.x + w * 0.45, d.y);
    c.lineTo(d.x, d.y + h * 0.6);
    c.fill();
  },
  pipe(c, d) {
    const w = d.w ?? 16;
    const h = d.h ?? 200;
    c.fillStyle = d.color ?? '#3c4a63';
    c.fillRect(d.x, d.y, w, h);
    c.drawImage(fadeStripX('#000000', 0, 0.35), d.x + w * 0.4, d.y, w * 0.6, h);
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fillRect(d.x + w * 0.2, d.y, Math.max(1.5, w * 0.12), h);
    c.fillStyle = 'rgba(0,0,0,0.3)';
    for (let y = d.y + 40; y < d.y + h; y += 80) c.fillRect(d.x - 2, y, w + 4, 5);
  },
  memorial(c, d) {
    shadow(c, d.x, d.y, 36, 0.3, 6);
    c.fillStyle = '#9a948b';
    rr(c, d.x - 24, d.y - 64, 48, 64, 18);
    c.fill();
    c.fillStyle = '#b9b3aa';
    rr(c, d.x - 24, d.y - 64, 44, 62, 18);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fillRect(d.x - 14, d.y - 62, 22, 2);
    c.fillStyle = 'rgba(90,120,70,0.35)';
    c.beginPath();
    c.ellipse(d.x - 18, d.y - 8, 8, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#8f8a82';
    c.fillRect(d.x - 30, d.y - 8, 60, 8);
    c.fillStyle = 'rgba(255,255,255,0.2)';
    c.fillRect(d.x - 30, d.y - 8, 60, 1.5);
    text(c, d.name, d.x - 1, d.y - 37, { size: 12, color: 'rgba(255,255,255,0.35)' });
    text(c, d.name, d.x - 2, d.y - 38, { size: 12, color: '#4a4440' });
    if (d.flowers) {
      heart(c, d.x - 14, d.y - 4, 4, '#ff8fb1');
      heart(c, d.x + 14, d.y - 4, 4, '#f2c14e');
    }
  },
  dummy(c, d) {
    if (d.broken) {
      c.save();
      c.translate(d.x, d.y);
      c.rotate(1.35);
      c.fillStyle = '#c9a36b';
      rr(c, -30, -16, 40, 26, 8);
      c.fill();
      c.restore();
      c.fillStyle = '#6b4528';
      c.fillRect(d.x - 3, d.y - 14, 6, 14);
      return;
    }
    c.fillStyle = '#6b4528';
    c.fillRect(d.x - 3, d.y - 60, 6, 60);
    c.fillRect(d.x - 22, d.y - 46, 44, 5);
    c.fillStyle = '#c9a36b';
    rr(c, d.x - 16, d.y - 76, 32, 34, 10);
    c.fill();
    c.strokeStyle = '#8a5a3a';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(d.x, d.y - 60, 8, 0, Math.PI * 2);
    c.stroke();
  },
  // Bobby, Bella, Cursor and Tabby on the wedding day.
  weddingPhoto(c, d) {
    c.save();
    c.translate(d.x, d.y);
    if (d.fallen) c.rotate(1.45);
    c.fillStyle = '#c9a43a';
    c.fillRect(0, 0, 76, 56);
    c.fillStyle = d.cracked ? '#6a6670' : '#ffeacc';
    c.fillRect(5, 5, 66, 46);
    const people = [['#e2674f', 18], ['#f39ac0', 34]];
    for (const [col, x] of people) {
      c.fillStyle = col;
      c.beginPath();
      c.arc(x, 34, 8, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#5b9bd5';
    c.fillRect(46, 26, 16, 14);
    c.save();
    c.translate(52, 12);
    c.scale(0.5, 0.5);
    cursorShape(c, '#fff', '#333');
    c.restore();
    heart(c, 26, 16, 4, '#ff4f7b');
    if (d.cracked) {
      c.strokeStyle = '#eee';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(10, 8);
      c.lineTo(34, 28);
      c.lineTo(26, 48);
      c.moveTo(34, 28);
      c.lineTo(66, 18);
      c.stroke();
    }
    c.restore();
  },
  // The Forever Bloom in its vase. wilted: after the purge.
  bloomVase(c, d, g) {
    if (!d.wilted) glow(c, d.x, d.y - 46, 30, '#ffd0f0', 0.45 + 0.15 * Math.sin(g.time * 2));
    c.fillStyle = '#7fb6e6';
    rr(c, d.x - 9, d.y - 22, 18, 22, 5);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.fillRect(d.x - 6, d.y - 19, 2.5, 14);
    c.fillStyle = 'rgba(0,0,40,0.18)';
    c.fillRect(d.x + 3, d.y - 20, 4, 18);
    c.strokeStyle = d.wilted ? '#6a5a3a' : '#4c8a3e';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(d.x, d.y - 20);
    if (d.wilted) c.quadraticCurveTo(d.x + 4, d.y - 40, d.x + 14, d.y - 30);
    else c.lineTo(d.x, d.y - 44);
    c.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + (d.wilted ? 0 : g.time);
      c.fillStyle = d.wilted ? '#7a6a7a' : `hsl(${(g.time * 60 + i * 50) % 360}, 90%, 70%)`;
      const cxp = d.wilted ? d.x + 15 : d.x;
      const cyp = d.wilted ? d.y - 28 : d.y - 46;
      c.beginPath();
      c.arc(cxp + Math.cos(a) * 6, cyp + Math.sin(a) * 6, d.wilted ? 3 : 4.5, 0, Math.PI * 2);
      c.fill();
    }
    if (!d.wilted) {
      c.fillStyle = '#fff6d0';
      c.beginPath();
      c.arc(d.x, d.y - 46, 2.5, 0, Math.PI * 2);
      c.fill();
      // sparkles drifting off the petals
      for (let i = 0; i < 3; i++) {
        const k = (g.time * 0.5 + i / 3) % 1;
        glow(c, d.x + Math.sin(g.time * 2 + i * 2) * 10, d.y - 50 - k * 30, 5, '#ffffff', (1 - k) * 0.9);
      }
    }
  },
  water(c, d, g) {
    const grad = (WATER_GRAD ??= (() => {
      const k = c.createLinearGradient(0, 0, 0, 120);
      k.addColorStop(0, '#6cc0ec');
      k.addColorStop(1, '#1f5a8a');
      return k;
    })());
    c.save();
    c.translate(0, d.y);
    c.fillStyle = grad;
    c.fillRect(d.x, 0, d.w, 120);
    c.fillStyle = '#1f5a8a';
    c.fillRect(d.x, 120, d.w, 280);
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.fillRect(d.x, d.y, d.w, 2);
    c.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < d.w / 20; i++) c.fillRect(d.x + i * 20 + ((g.time * 30) % 20), d.y + 6 + (i % 2) * 6, 10, 2);
    for (let i = 0; i < d.w / 34; i++) {
      const a = 0.5 + 0.5 * Math.sin(g.time * 3 + i * 1.7);
      c.fillStyle = `rgba(255,255,255,${a * 0.5})`;
      c.fillRect(d.x + i * 34 + hash(i) * 20, d.y + 20 + hash(i + 3) * 30, 6, 1.5);
    }
  },
  textD(c, d) {
    text(c, d.text, d.x, d.y, { size: d.size ?? 16, color: d.color ?? '#fff' });
  },
  pendantStand(c, d, g) {
    // the pendant hanging from a memorial
    glow(c, d.x, d.y - 12, 22, '#dfe6ee', 0.3 + 0.15 * Math.sin(g.time * 2));
    c.strokeStyle = '#ccc';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(d.x - 8, d.y - 30);
    c.lineTo(d.x, d.y - 16);
    c.lineTo(d.x + 8, d.y - 30);
    c.stroke();
    heart(c, d.x, d.y - 10, 6, '#dfe6ee', '#9aa6b4');
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillRect(d.x - 3.5, d.y - 13, 2, 2);
  },
  woodSword(c, d) {
    c.save();
    c.translate(d.x, d.y);
    c.rotate(d.rot ?? -0.2);
    sword(c, 'tabby', 0, 0, 1);
    c.restore();
  },
  giantCursor(c, d, g) {
    const s = d.s ?? 4;
    const y = d.y + Math.sin(g.time) * 6;
    glow(c, d.x + 7 * s, y + 13 * s, 22 * s, '#9fdcff', 0.4);
    c.save();
    c.translate(d.x, y);
    c.scale(s, s);
    cursorShape(c, '#fff', '#111');
    c.restore();
  },
};

/* ---------- characters ---------- */
export function heart(c, x, y, r, fill, stroke) {
  c.beginPath();
  c.moveTo(x, y + r * 0.9);
  c.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.8, y - r * 1.4, x, y - r * 0.5);
  c.bezierCurveTo(x + r * 0.8, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r * 0.9);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1.2;
    c.stroke();
  }
}

export function cursorShape(c, fill = '#fff', stroke = '#111') {
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 22);
  c.lineTo(5.5, 17);
  c.lineTo(9.5, 26);
  c.lineTo(13, 24.5);
  c.lineTo(9, 15.5);
  c.lineTo(16, 15.5);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = stroke;
  c.lineWidth = 1.6;
  c.stroke();
}

export function adminFace(c, x, y, r, g) {
  // faceless: a dark silhouette with two thin pale slits
  c.fillStyle = '#05080a';
  c.beginPath();
  c.arc(x, y - r * 0.15, r * 0.7, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x - r, y + r * 0.45, r * 2, r * 0.7);
  c.fillStyle = '#8dffc8';
  const blink = Math.sin(g.time * 1.3) > 0.97 ? 0.2 : 1;
  c.fillRect(x - r * 0.38, y - r * 0.25, r * 0.22, r * 0.06 * blink + 1);
  c.fillRect(x + r * 0.16, y - r * 0.25, r * 0.22, r * 0.06 * blink + 1);
  glow(c, x - r * 0.27, y - r * 0.22, r * 0.4, '#8dffc8', 0.55 * blink);
  glow(c, x + r * 0.27, y - r * 0.22, r * 0.4, '#8dffc8', 0.55 * blink);
}

// Blades. kind: wood | steel | cursed | tabby (Tabby's chipped wooden sword) | glitch
export function sword(c, kind, x, y, s = 1) {
  const blade = { wood: '#d9b07a', steel: '#dfe6ee', cursed: '#b57cff', tabby: '#c79a62', glitch: '#ff3b5c' }[kind] ?? '#dfe6ee';
  c.fillStyle = '#5a3a24';
  c.fillRect(x - 2 * s, y - 2 * s, 4 * s, 9 * s);
  c.fillStyle = kind === 'cursed' ? '#5a2a8a' : '#8a6a3a';
  c.fillRect(x - 7 * s, y - 4 * s, 14 * s, 3 * s);
  c.fillStyle = blade;
  c.beginPath();
  c.moveTo(x - 3 * s, y - 4 * s);
  c.lineTo(x - 3 * s, y - 28 * s);
  c.lineTo(x, y - 33 * s);
  c.lineTo(x + 3 * s, y - 28 * s);
  c.lineTo(x + 3 * s, y - 4 * s);
  c.fill();
  if (kind === 'tabby') {
    c.fillStyle = 'rgba(0, 0, 0, 0.35)';
    c.fillRect(x - 3 * s, y - 20 * s, 6 * s, 2 * s);
    c.beginPath();
    c.moveTo(x + 3 * s, y - 26 * s);
    c.lineTo(x - 1 * s, y - 24 * s);
    c.lineTo(x + 3 * s, y - 21 * s);
    c.fill();
  }
}

// A round button person (Bobby, Bella, villagers). o: { x, y, w, h, color,
// dark, facing, t, moving, mood, bow, lashes, pendant, crack, sword, swing,
// flash, red, tears, alpha, sit, label }
export function drawButton(c, o) {
  const { x, y, w, h } = o;
  const f = o.facing ?? 1;
  const legH = o.sit ? 0 : 9;
  const bodyH = h - legH;
  const bob = o.moving ? Math.abs(Math.sin(o.t * 14)) * 2 : 0;
  const by = y - bob + (o.squash ?? 0);
  c.save();
  if (o.alpha != null) c.globalAlpha = o.alpha;
  if (o.air != null ? !o.air : o.ground !== null) shadow(c, x + w / 2, y + h, w * 0.62, 0.3);

  // legs
  if (legH) {
    c.strokeStyle = '#3a2620';
    c.lineWidth = 3;
    c.lineCap = 'round';
    const ph = o.moving ? Math.sin(o.t * 14) * 5 : 0;
    const air = o.air ? -3 : 0;
    c.beginPath();
    c.moveTo(x + w * 0.35, by + bodyH - 2);
    c.lineTo(x + w * 0.35 + ph, y + h - 1 + air);
    c.moveTo(x + w * 0.65, by + bodyH - 2);
    c.lineTo(x + w * 0.65 - ph, y + h - 1 + air);
    c.stroke();
    c.fillStyle = '#3a2620';
    c.fillRect(x + w * 0.35 + ph - 2 + f * 2, y + h - 3 + air, 6, 3);
    c.fillRect(x + w * 0.65 - ph - 2 + f * 2, y + h - 3 + air, 6, 3);
  }

  const acc = o.acc ?? [];
  if (acc.includes('cape')) {
    const k = Math.sin((o.t ?? 0) * 6) * 3;
    c.fillStyle = '#c62f3a';
    c.beginPath();
    c.moveTo(x + w * 0.2, by + bodyH * 0.3);
    c.lineTo(x + w * 0.8, by + bodyH * 0.3);
    c.lineTo(x + w / 2 - f * (w * 0.75) + k, by + bodyH + 4);
    c.lineTo(x + w / 2 - f * (w * 0.2), by + bodyH + 6);
    c.fill();
    text(c, 'ALPHA', x + w / 2 - f * w * 0.42, by + bodyH * 0.85, { size: 6, color: '#ffe08a' });
  }

  // body: a fat round button with a darker rim at the bottom
  const color = o.flash ? '#ffffff' : o.color;
  const dark = o.flash ? '#dddddd' : o.dark;
  c.fillStyle = dark;
  rr(c, x, by + bodyH * 0.25, w, bodyH * 0.75, Math.min(w, bodyH) * 0.42);
  c.fill();
  c.fillStyle = color;
  rr(c, x, by, w, bodyH * 0.82, Math.min(w, bodyH) * 0.45);
  c.fill();
  if (!o.flash) {
    // round shading: lit from the top left, a rim of bounce light underneath
    c.save();
    c.clip();
    c.drawImage(ballShade(), x - w * 0.12, by - bodyH * 0.1, w * 1.24, bodyH * 1.02);
    c.restore();
    c.fillStyle = 'rgba(0, 0, 0, 0.22)';
    c.fillRect(x + w * 0.12, by + bodyH * 0.8, w * 0.76, 1.5);
  }
  c.fillStyle = 'rgba(255, 255, 255, 0.5)';
  c.beginPath();
  c.ellipse(x + w * 0.3, by + bodyH * 0.17, w * 0.13, bodyH * 0.06, -0.4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255, 255, 255, 0.85)';
  c.beginPath();
  c.arc(x + w * 0.2, by + bodyH * 0.26, Math.max(1, w * 0.035), 0, Math.PI * 2);
  c.fill();
  if (o.label) text(c, o.label, x + w / 2, by + bodyH * 0.7, { size: 8, color: 'rgba(0,0,0,0.4)' });

  face(c, x + w / 2 + f * w * 0.08, by + bodyH * 0.42, w, o);
  if (acc.length) accessories(c, acc, x, by, w, bodyH, f, o.t ?? 0);

  if (o.bow) {
    c.fillStyle = '#ff4f7b';
    c.beginPath();
    c.moveTo(x + w * 0.7, by + 3);
    c.lineTo(x + w * 0.55, by - 7);
    c.lineTo(x + w * 0.55, by + 9);
    c.lineTo(x + w * 0.7, by + 3);
    c.lineTo(x + w * 0.85, by - 7);
    c.lineTo(x + w * 0.85, by + 9);
    c.fill();
  }
  if (o.scarf) {
    c.fillStyle = o.scarf;
    c.fillRect(x + 2, by + bodyH * 0.68, w - 4, 5);
  }
  if (o.pendant) {
    c.strokeStyle = '#c7ced8';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x + w * 0.38, by + bodyH * 0.55);
    c.lineTo(x + w / 2, by + bodyH * 0.66);
    c.lineTo(x + w * 0.62, by + bodyH * 0.55);
    c.stroke();
    heart(c, x + w / 2, by + bodyH * 0.7, 3.6, o.pendantGlow ? '#ffffff' : '#dfe6ee', '#8a96a6');
    if (o.crack) {
      c.strokeStyle = '#333';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + w / 2 - 1, by + bodyH * 0.66);
      c.lineTo(x + w / 2 + 1, by + bodyH * 0.7);
      c.lineTo(x + w / 2 - 1, by + bodyH * 0.74);
      c.stroke();
    }
  }
  c.restore();
}

// Shading laid over a round body (clipped to it): highlight top left,
// core shadow bottom right.
function ballShade() {
  return sprite('ballShade', 64, 64, (c) => {
    const hl = c.createRadialGradient(22, 16, 2, 26, 22, 40);
    hl.addColorStop(0, 'rgba(255,255,255,0.38)');
    hl.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    hl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = hl;
    c.fillRect(0, 0, 64, 64);
    const sh = c.createRadialGradient(28, 20, 22, 32, 28, 46);
    sh.addColorStop(0, 'rgba(20,0,30,0)');
    sh.addColorStop(1, 'rgba(20,0,30,0.32)');
    c.fillStyle = sh;
    c.fillRect(0, 0, 64, 64);
  });
}

// The same idea for a keycap: a lit top face that darkens towards the bottom.
function keyShade() {
  return sprite('keyShade', 8, 64, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.32)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(10,0,30,0.22)');
    c.fillStyle = g;
    c.fillRect(0, 0, 8, 64);
  });
}

// Bobby's glow-up items (and wedding clothes). Drawn over the body.
function accessories(c, acc, x, y, w, h, f, t) {
  const ex = x + w / 2 + f * w * 0.08;
  const ey = y + h * 0.42;
  if (acc.includes('abs')) {
    c.fillStyle = 'rgba(120, 30, 20, 0.35)';
    for (let r = 0; r < 3; r++) for (const s of [-1, 1]) rr(c, x + w / 2 + s * 5 - 4, y + h * 0.56 + r * 5, 7, 4, 2), c.fill();
  }
  if (acc.includes('grass')) {
    c.fillStyle = '#5fbf4e';
    for (let i = 0; i < 7; i++) {
      const gx = x + 3 + i * ((w - 6) / 6);
      c.beginPath();
      c.moveTo(gx - 3, y + 3);
      c.lineTo(gx + Math.sin(t * 4 + i) * 2, y - 9 - (i % 2) * 4);
      c.lineTo(gx + 3, y + 3);
      c.fill();
    }
  }
  if (acc.includes('shades')) {
    c.fillStyle = '#111';
    rr(c, ex - w * 0.48, ey - 6, w * 0.96, 11, 4);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.fillRect(ex - w * 0.38, ey - 4, 6, 2);
  }
  if (acc.includes('stache')) {
    // it moves on its own
    const k = Math.sin(t * 9) * 2;
    c.fillStyle = '#f2c14e';
    c.beginPath();
    c.ellipse(ex - 5, ey + 7 + k * 0.5, 6, 2.6, -0.3 + k * 0.1, 0, Math.PI * 2);
    c.ellipse(ex + 5, ey + 7 - k * 0.5, 6, 2.6, 0.3 - k * 0.1, 0, Math.PI * 2);
    c.fill();
  }
  if (acc.includes('bowtie') || acc.includes('bigbow')) {
    const s = acc.includes('bigbow') ? 2.3 : 1;
    const bx = x + w / 2;
    const byy = y + h * 0.72;
    c.fillStyle = '#16161c';
    c.beginPath();
    c.moveTo(bx, byy);
    c.lineTo(bx - 8 * s, byy - 5 * s);
    c.lineTo(bx - 8 * s, byy + 5 * s);
    c.closePath();
    c.moveTo(bx, byy);
    c.lineTo(bx + 8 * s, byy - 5 * s);
    c.lineTo(bx + 8 * s, byy + 5 * s);
    c.closePath();
    c.fill();
  }
  if (acc.includes('veil')) {
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath();
    c.moveTo(x + w * 0.2, y + 2);
    c.quadraticCurveTo(x + w / 2, y - 10, x + w * 0.8, y + 2);
    c.lineTo(x + w + 6, y + h * 0.7);
    c.lineTo(x + w * 0.6, y + h * 0.5);
    c.fill();
  }
}

function face(c, x, y, w, o) {
  const mood = o.mood ?? 'calm';
  const f = o.facing ?? 1;
  const s = w / 38;
  const ex = 7 * s;
  const blink = mood === 'closed' || (o.t != null && (o.t * 0.7) % 4 > 3.88);
  c.lineCap = 'round';
  for (const side of [-1, 1]) {
    const px = x + side * ex;
    if (blink || mood === 'happy') {
      c.strokeStyle = '#2b1d17';
      c.lineWidth = 2;
      c.beginPath();
      if (mood === 'happy') c.arc(px, y + 2 * s, 3.5 * s, Math.PI * 1.15, Math.PI * 1.85);
      else {
        c.moveTo(px - 3.5 * s, y);
        c.lineTo(px + 3.5 * s, y);
      }
      c.stroke();
      continue;
    }
    c.fillStyle = '#fff';
    c.beginPath();
    c.ellipse(px, y, 4.2 * s, 5 * s, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = o.red ? '#ff1e2d' : '#2b1d17';
    c.beginPath();
    c.arc(px + f * 1.4 * s, y + 0.6 * s, (o.red ? 2.8 : 2.4) * s, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.arc(px + f * 1.4 * s - 0.9 * s, y - 0.5 * s, 0.85 * s, 0, Math.PI * 2);
    c.fill();
    if (o.red) {
      c.fillStyle = 'rgba(255, 30, 45, 0.35)';
      c.beginPath();
      c.arc(px + f * 1.4 * s, y, 6 * s, 0, Math.PI * 2);
      c.fill();
    }
    if (o.lashes) {
      c.strokeStyle = '#2b1d17';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(px + side * 3 * s, y - 4 * s);
      c.lineTo(px + side * 5.5 * s, y - 6.5 * s);
      c.stroke();
    }
    // brows
    if (mood === 'angry' || mood === 'sad' || mood === 'worried') {
      c.strokeStyle = '#2b1d17';
      c.lineWidth = 2;
      c.beginPath();
      const inner = mood === 'angry' ? 1 : -1;
      c.moveTo(px - side * 4 * s, y - 7 * s + inner * 2 * s);
      c.lineTo(px + side * 4 * s, y - 7 * s - inner * 2 * s);
      c.stroke();
    }
  }
  // a touch of blush
  if (mood !== 'angry' && !o.red) {
    c.fillStyle = 'rgba(255, 110, 130, 0.22)';
    c.beginPath();
    c.ellipse(x - ex - 2 * s, y + 5.5 * s, 3 * s, 1.6 * s, 0, 0, Math.PI * 2);
    c.ellipse(x + ex + 2 * s, y + 5.5 * s, 3 * s, 1.6 * s, 0, 0, Math.PI * 2);
    c.fill();
  }
  // mouth
  c.strokeStyle = '#2b1d17';
  c.fillStyle = '#5a1f1a';
  c.lineWidth = 2;
  const my = y + 8 * s;
  c.beginPath();
  if (mood === 'happy' || mood === 'calm') c.arc(x, my - 2 * s, 3.5 * s, 0.2, Math.PI - 0.2);
  else if (mood === 'shout' || mood === 'angry') {
    c.ellipse(x, my, 3.5 * s, (mood === 'shout' ? 3.5 : 2) * s, 0, 0, Math.PI * 2);
    c.fill();
  } else if (mood === 'sad' || mood === 'worried') c.arc(x, my + 2.5 * s, 3.5 * s, Math.PI + 0.3, -0.3);
  else if (mood === 'smug') {
    c.moveTo(x - 3 * s, my);
    c.quadraticCurveTo(x + 2 * s, my + 2 * s, x + 4 * s, my - 2 * s);
  } else {
    c.moveTo(x - 3 * s, my);
    c.lineTo(x + 3 * s, my);
  }
  c.stroke();
  if (o.tears) {
    c.fillStyle = '#7fc8ff';
    const ty = (o.t * 40) % 14;
    c.beginPath();
    c.arc(x - ex - 1, y + 6 * s + ty, 1.8 * s, 0, Math.PI * 2);
    c.arc(x + ex + 1, y + 6 * s + ((ty + 7) % 14), 1.8 * s, 0, Math.PI * 2);
    c.fill();
  }
}

// A keyboard key person (Tabby, Old Backspace).
export function drawKey(c, o) {
  const { x, y, w, h } = o;
  const legH = o.sit ? 0 : 9;
  const bodyH = h - legH;
  const bob = o.moving ? Math.abs(Math.sin(o.t * 14)) * 2 : 0;
  const by = y - bob;
  c.save();
  if (o.alpha != null) c.globalAlpha = o.alpha;
  if (o.air != null ? !o.air : o.ground !== null) shadow(c, x + w / 2, y + h, w * 0.6, 0.3);
  if (legH) {
    c.strokeStyle = '#2a2a38';
    c.lineWidth = 3;
    c.lineCap = 'round';
    const ph = o.moving ? Math.sin(o.t * 14) * 5 : 0;
    c.beginPath();
    c.moveTo(x + w * 0.3, by + bodyH - 2);
    c.lineTo(x + w * 0.3 + ph, y + h - 1);
    c.moveTo(x + w * 0.7, by + bodyH - 2);
    c.lineTo(x + w * 0.7 - ph, y + h - 1);
    c.stroke();
  }
  c.fillStyle = o.flash ? '#fff' : o.dark;
  rr(c, x, by + 4, w, bodyH - 4, 7);
  c.fill();
  c.fillStyle = o.flash ? '#fff' : o.color;
  rr(c, x + 3, by, w - 6, bodyH - 8, 6);
  c.fill();
  if (!o.flash) {
    c.save();
    c.clip();
    c.drawImage(keyShade(), x + 3, by, w - 6, bodyH - 8);
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.45)';
    c.fillRect(x + 8, by + 1.5, w - 16, 1.5);
  }
  if (o.label) text(c, o.label, x + w * 0.3, by + 9, { size: 8, color: 'rgba(0,0,0,0.45)' });
  face(c, x + w / 2 + (o.facing ?? 1) * 3, by + bodyH * 0.45, Math.min(w, 40), o);
  if (o.beard) {
    c.fillStyle = '#f2f2f2';
    c.beginPath();
    c.moveTo(x + w * 0.3, by + bodyH * 0.62);
    c.lineTo(x + w * 0.7, by + bodyH * 0.62);
    c.lineTo(x + w / 2, by + bodyH + 6);
    c.fill();
  }
  c.restore();
}

/* ---------- screen space: HUD and effects ---------- */
// A glossy bar: dark glass track, coloured fill with a lit top and a glow at its tip.
function bar(c, x, y, w, h, k, color, glowIt = true) {
  c.fillStyle = 'rgba(8, 8, 16, 0.55)';
  rr(c, x - 2, y - 2, w + 4, h + 4, (h + 4) / 2);
  c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.14)';
  c.lineWidth = 1;
  c.stroke();
  const fw = Math.max(0, Math.min(1, k)) * w;
  if (fw < 1) return;
  c.fillStyle = color;
  rr(c, x, y, fw, h, h / 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.3)';
  rr(c, x + 2, y + 1.5, Math.max(0, fw - 4), h * 0.35, h * 0.2);
  c.fill();
  c.fillStyle = 'rgba(0,0,0,0.15)';
  c.fillRect(x + h / 2, y + h - 3, Math.max(0, fw - h), 2);
  if (glowIt) glow(c, x + fw - 2, y + h / 2, h * 1.6, color, 0.6);
}

// Text with a soft dark outline so it reads over any sky.
function hudText(c, str, x, y, o) {
  c.font = `${o.weight ?? 700} ${o.size ?? 14}px ${FONT}`;
  c.textAlign = o.align ?? 'center';
  c.textBaseline = 'middle';
  c.lineJoin = 'round';
  c.lineWidth = 4;
  c.strokeStyle = 'rgba(10, 8, 20, 0.55)';
  c.strokeText(str, x, y);
  c.fillStyle = o.color ?? '#fff';
  c.fillText(str, x, y);
}

export function drawHud(c, g) {
  const p = g.player;
  if (p && !p.hideHud && g.level.hud !== false) {
    const coins = g.level.coins !== false;
    // a frosted plate behind the hearts and coins
    c.fillStyle = 'rgba(10, 10, 22, 0.28)';
    rr(c, 12, 12, p.maxHp * 26 + 8, coins ? 62 : 34, 14);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.1)';
    c.lineWidth = 1;
    c.stroke();
    for (let i = 0; i < p.maxHp; i++) {
      const full = i < p.hp;
      const hx = 28 + i * 26;
      // the last full heart beats when health is low
      const beat = full && i === p.hp - 1 && p.hp <= 2 ? 1 + 0.12 * Math.max(0, Math.sin(g.time * 8)) : 1;
      if (full) glow(c, hx, 28, 16, '#ff4f6b', 0.35);
      heart(c, hx, 28, 9 * beat, full ? '#ff4f6b' : 'rgba(0,0,0,0.35)', full ? '#a3203a' : 'rgba(255,255,255,0.18)');
      if (full) {
        c.fillStyle = 'rgba(255,255,255,0.65)';
        c.beginPath();
        c.ellipse(hx - 4 * beat, 24.5, 2.6 * beat, 1.6 * beat, -0.6, 0, Math.PI * 2);
        c.fill();
      }
    }
    if (coins) {
      glow(c, 30, 58, 16, '#f2a23e', 0.35);
      c.fillStyle = '#c99a2e';
      c.beginPath();
      c.arc(30, 58, 8, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#f7cf5e';
      c.beginPath();
      c.arc(29.4, 57.2, 6.8, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.7)';
      c.fillRect(25.5, 53.5, 2, 4);
      hudText(c, `${g.flags.coins ?? 0}`, 44, 59, { size: 15, align: 'left' });
    }
    if (p.tabby && !p.tabby.dead && g.flags.slam && !g.locked) {
      const k = p.tabby.stunReady;
      bar(c, 18, 82, 96, 18, k, k >= 1 ? '#5b9bd5' : '#3a5a7a', k >= 1);
      hudText(c, k >= 1 ? 'Q · Tabby slam' : 'Tabby…', 66, 91, { size: 11 });
    }
  }
  const m = g.meter;
  if (m && !g.locked) {
    const x = 760;
    const y = 74;
    hudText(c, m.label, x + 90, y - 12, { size: 12 });
    const k = Math.max(0, m.value) / 100;
    bar(c, x, y, 180, 14, k, k > 1 ? `hsl(${Math.floor(g.time * 200) % 360}, 90%, 60%)` : m.color ?? '#ff8fb1', k <= 1);
    hudText(c, `${Math.round(m.value)}%`, x + 90, y + 7, { size: 11 });
  }
  const b = g.boss;
  if (b && !b.dead && b.showBar !== false) {
    const bw = 520;
    const x = (W - bw) / 2;
    const y = H - 44;
    hudText(c, b.name, W / 2, y - 14, { size: 15 });
    bar(c, x, y, bw, 14, b.hp / b.maxHp, b.barColor ?? '#ff4d3d');
  }
}

export function drawEffects(c, g) {
  const f = g.fx;
  if (f.tint && f.tintA > 0) {
    c.fillStyle = f.tint;
    c.globalAlpha = f.tintA;
    c.fillRect(0, 0, W, H);
    c.globalAlpha = 1;
  }
  if (f.bw > 0) {
    c.globalCompositeOperation = 'saturation';
    c.fillStyle = `rgba(128,128,128,${f.bw})`;
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
  }
  if (f.vignette) c.drawImage(vignetteSprite(f.vignette), 0, 0, W, H);
  if (f.glitch > 0 || f.glitchHold) {
    const n = 6;
    for (let i = 0; i < n; i++) {
      if (Math.random() > 0.6) continue;
      const y = Math.random() * H;
      const h = 4 + Math.random() * 30;
      const dx = (Math.random() - 0.5) * 40;
      try {
        c.drawImage(g.canvas, 0, y * g.scale * g.dpr, g.canvas.width, h * g.scale * g.dpr, dx, y, W, h);
      } catch {}
      c.fillStyle = Math.random() > 0.5 ? 'rgba(255,0,80,0.25)' : 'rgba(0,255,220,0.2)';
      c.fillRect(0, y, W, h);
    }
  }
  if (f.ads?.length) {
    f.ads = f.ads.filter((a) => a.until > g.time);
    for (const a of f.ads) {
      boxShadow(c, a.x, a.y, a.w, a.h, 0.5, 22, 10);
      popupWindow(c, a.x, a.y, a.w, a.h, '', '#ff3bb0');
      text(c, a.label, a.x + a.w / 2, a.y + a.h / 2 + 4, { size: 15, color: '#d4145a' });
      text(c, 'Close in ' + Math.ceil(a.until - g.time) + '…', a.x + a.w / 2, a.y + a.h - 16, { size: 11, color: '#777' });
    }
  }
  if (f.letterbox > 0) {
    const bh = 50 * f.letterbox;
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, bh);
    c.fillRect(0, H - bh, W, bh);
    // the bars cast a little shade onto the picture
    c.globalAlpha = Math.min(1, f.letterbox);
    c.drawImage(fadeStrip('#000000', 0.45, 0), 0, bh, W, 18);
    c.drawImage(fadeStrip('#000000', 0, 0.45), 0, H - bh - 18, W, 18);
    c.globalAlpha = 1;
  }
  if (f.flash > 0) {
    // a bright bloom from the middle rather than a flat white sheet
    const k = Math.min(1, f.flash);
    glow(c, W / 2, H / 2, W * 0.9, '#fff4e0', k * 0.8);
    c.fillStyle = `rgba(255,255,255,${k * 0.75})`;
    c.fillRect(0, 0, W, H);
  }
  if (f.fade > 0) {
    // the edges go dark first, like a camera iris closing
    if (f.fade < 1) {
      c.globalAlpha = Math.min(1, f.fade * 1.8);
      c.drawImage(vignetteSprite(1), 0, 0, W, H);
      c.globalAlpha = 1;
    }
    c.fillStyle = `rgba(0,0,0,${f.fade})`;
    c.fillRect(0, 0, W, H);
  }
}
