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
};

const hash = (i) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
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
const SKIES = {
  bedroom: { top: '#3c4a6b', bottom: '#5d6a8a', inside: true },
  village: { top: '#8fd3ff', bottom: '#e6f6ff', hills: ['#b6e2a4', '#8fca7f'], clouds: 1, sun: 1 },
  forest: { top: '#79c2b0', bottom: '#dcf2d4', hills: ['#6aa982', '#4d8a66'], trees: 1, clouds: 1 },
  popup: { top: '#8c7cf7', bottom: '#ffd0f4', hills: ['#a98be6', '#8a68cf'], windows: 1, trees: 1 },
  ruins: { top: '#97a3b8', bottom: '#eadccb', city: 1, hills: ['#b9b1a8', '#9d958c'] },
  lab: { top: '#0b1424', bottom: '#1d2c47', racks: 1, inside: true },
  tower: { top: '#1c0f2e', bottom: '#53284f', city: 1, cables: 1, hills: ['#2f1a3d', '#24142f'] },
  chamber: { top: '#08070e', bottom: '#2a0c16', grid: 1, inside: true },
  wreck: { top: '#54505a', bottom: '#a08c80', hills: ['#77706d', '#5f5856'], smoke: 1 },
  void: { top: '#100419', bottom: '#3d0b2f', grid: 1, glitchy: 1 },
  epilogue: { top: '#7cc6ff', bottom: '#ffe6c7', hills: ['#a8dc96', '#7fc276'], clouds: 1, sun: 1 },
  night: { top: '#0f1630', bottom: '#2f3a63', hills: ['#2b3a4d', '#1f2b3a'], trees: 1, stars: 1 },
};

export function drawSky(c, g) {
  const s = SKIES[g.level.theme] ?? SKIES.village;
  const cam = g.cam;
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, s.top);
  sky.addColorStop(1, s.bottom);
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);

  if (g.fx.redSky > 0) {
    const red = c.createLinearGradient(0, 0, 0, H);
    red.addColorStop(0, `rgba(190, 20, 30, ${0.75 * g.fx.redSky})`);
    red.addColorStop(1, `rgba(255, 90, 60, ${0.35 * g.fx.redSky})`);
    c.fillStyle = red;
    c.fillRect(0, 0, W, H);
  }

  const t = g.time;
  if (s.stars) {
    for (let i = 0; i < 60; i++) {
      c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t + i));
      c.fillStyle = '#fff';
      c.fillRect((hash(i) * W * 1.3 - cam.x * 0.02) % W, hash(i + 9) * H * 0.6, 2, 2);
    }
    c.globalAlpha = 1;
  }
  if (s.sun) {
    c.fillStyle = 'rgba(255, 244, 190, 0.9)';
    c.beginPath();
    c.arc(780 - cam.x * 0.02, 90, 38, 0, Math.PI * 2);
    c.fill();
  }
  if (s.clouds) {
    c.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let i = 0; i < 7; i++) {
      const x = ((hash(i) * 2000 + t * 8 - cam.x * 0.1) % 1400 + 1400) % 1400 - 200;
      const y = 40 + hash(i + 3) * 140;
      cloud(c, x, y, 0.6 + hash(i + 5) * 0.7);
    }
  }
  if (s.windows) {
    for (let i = 0; i < 9; i++) {
      const x = ((hash(i) * 2200 - cam.x * 0.15) % 1300 + 1300) % 1300 - 150;
      const y = 50 + hash(i + 2) * 220 + Math.sin(t + i) * 6;
      c.globalAlpha = 0.45;
      popupWindow(c, x, y, 90 + hash(i + 4) * 60, 60 + hash(i + 7) * 30, ['FREE!!', 'CLICK', '99% OFF', 'WIN', 'HOT'][i % 5]);
    }
    c.globalAlpha = 1;
  }
  if (s.racks) {
    for (let i = 0; i < 14; i++) {
      const x = ((i * 110 - cam.x * 0.4) % 1540 + 1540) % 1540 - 120;
      c.fillStyle = '#16233a';
      c.fillRect(x, 120, 80, 340);
      c.fillStyle = '#0e1828';
      for (let r = 0; r < 9; r++) c.fillRect(x + 6, 130 + r * 36, 68, 28);
      for (let r = 0; r < 9; r++) {
        const on = Math.sin(t * 3 + i * 7 + r * 13) > 0.3;
        c.fillStyle = on ? '#3df59a' : '#1f4a3b';
        c.fillRect(x + 12, 140 + r * 36, 5, 5);
        c.fillStyle = Math.sin(t * 5 + r + i) > 0.6 ? '#ff5a5a' : '#4a1f26';
        c.fillRect(x + 22, 140 + r * 36, 5, 5);
      }
    }
  }
  if (s.grid) {
    c.strokeStyle = s.glitchy ? 'rgba(255, 60, 160, 0.25)' : 'rgba(255, 40, 60, 0.18)';
    c.lineWidth = 1;
    const off = (cam.x * 0.3) % 60;
    for (let x = -off; x < W; x += 60) {
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, H);
      c.stroke();
    }
    for (let y = (t * 20) % 60; y < H; y += 60) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
    }
  }
  if (s.city) {
    for (let layer = 0; layer < 2; layer++) {
      const f = layer ? 0.35 : 0.18;
      c.fillStyle = s.hills?.[layer] ?? '#9d958c';
      for (let i = 0; i < 16; i++) {
        const w = 60 + hash(i + layer * 30) * 70;
        const h = 90 + hash(i + 50 + layer * 10) * (180 - layer * 40);
        const x = ((i * 120 - cam.x * f) % 1920 + 1920) % 1920 - 160;
        const y = H - 40 - h + layer * 40;
        c.fillRect(x, y, w, h + 60);
        // perfect rectangular holes: something deleted part of the city
        if (hash(i * 3 + layer) > 0.45) {
          c.fillStyle = s.top;
          c.fillRect(x + w * 0.25, y + h * 0.2, w * 0.45, h * 0.25);
          c.fillStyle = s.hills?.[layer] ?? '#9d958c';
        }
      }
    }
  }
  if (s.cables) {
    c.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    c.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const x = ((i * 220 - cam.x * 0.5) % 1320 + 1320) % 1320 - 100;
      c.beginPath();
      c.moveTo(x, 0);
      c.quadraticCurveTo(x + 80, 160 + hash(i) * 120, x + 200, 0);
      c.stroke();
    }
  }
  if (s.hills && !s.city) {
    hills(c, cam.x * 0.15, 360, 70, s.hills[0], 0);
    if (s.trees) treeLine(c, cam.x * 0.3, 420, s.hills[1]);
    else hills(c, cam.x * 0.3, 410, 55, s.hills[1], 4);
  }
  if (s.smoke) {
    for (let i = 0; i < 6; i++) {
      const x = ((i * 260 - cam.x * 0.25) % 1560 + 1560) % 1560 - 100;
      for (let k = 0; k < 6; k++) {
        const yy = 380 - k * 50 - ((t * 20) % 50);
        c.fillStyle = `rgba(60, 55, 60, ${0.25 - k * 0.035})`;
        c.beginPath();
        c.arc(x + Math.sin(t + k + i) * 14 + k * 8, yy, 22 + k * 6, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
}

function cloud(c, x, y, s) {
  blobs(c, [[x, y, 22 * s], [x + 26 * s, y - 10 * s, 28 * s], [x + 56 * s, y, 22 * s]]);
  c.fillRect(x, y, 56 * s, 22 * s);
}

// Several circles filled as one shape, without stray connecting edges.
function blobs(c, list) {
  c.beginPath();
  for (const [x, y, r] of list) {
    c.moveTo(x + r, y);
    c.arc(x, y, r, 0, Math.PI * 2);
  }
  c.fill();
}

function hills(c, off, base, amp, color, seed) {
  c.fillStyle = color;
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

function treeLine(c, off, base, color) {
  c.fillStyle = color;
  c.fillRect(0, base, W, H - base);
  for (let i = -1; i < 16; i++) {
    const wx = Math.floor(off / 70) + i;
    const x = wx * 70 - off;
    const h = 60 + hash(wx) * 70;
    c.beginPath();
    c.arc(x + 35, base - h * 0.55, 30 + hash(wx + 2) * 14, 0, Math.PI * 2);
    c.fill();
    c.fillRect(x + 30, base - h * 0.5, 10, h * 0.5);
  }
}

export function popupWindow(c, x, y, w, h, label = 'AD', bar = '#4f6bff') {
  c.fillStyle = '#ffffff';
  rr(c, x, y, w, h, 6);
  c.fill();
  c.fillStyle = bar;
  rr(c, x, y, w, 16, 6);
  c.fill();
  c.fillRect(x, y + 10, w, 6);
  c.fillStyle = '#ff5a5a';
  c.fillRect(x + w - 14, y + 4, 9, 9);
  text(c, label, x + w / 2, y + 16 + (h - 16) / 2, { size: Math.min(18, h * 0.3), color: '#222' });
}

/* ---------- ground ---------- */
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

export function drawSolid(c, s, g) {
  if (s.kind === 'none') return;
  const [body, top, edge] = SOLID[s.kind] ?? SOLID.grass;
  const flicker = s.kind === 'glitch' && Math.random() < 0.02;
  c.save();
  if (s.alpha != null) c.globalAlpha = s.alpha;
  if (s.shakeX) c.translate((Math.random() - 0.5) * s.shakeX, 0);
  if (s.kind === 'popup') {
    popupWindow(c, s.x, s.y, s.w, Math.max(s.h, 20), '', '#5a74ff');
    c.restore();
    return;
  }
  c.fillStyle = flicker ? '#ff4fd8' : body;
  c.fillRect(s.x, s.y, s.w, s.h);
  if (s.kind === 'wood' || s.kind === 'floor') {
    c.strokeStyle = edge;
    c.lineWidth = 2;
    for (let x = s.x + 40; x < s.x + s.w; x += 40) {
      c.beginPath();
      c.moveTo(x, s.y + 6);
      c.lineTo(x, s.y + Math.min(s.h, 40));
      c.stroke();
    }
  }
  if (s.kind === 'stone' || s.kind === 'ruin') {
    c.strokeStyle = edge;
    c.lineWidth = 2;
    for (let y = s.y + 18; y < s.y + Math.min(s.h, 120); y += 18) {
      c.beginPath();
      c.moveTo(s.x, y);
      c.lineTo(s.x + s.w, y);
      c.stroke();
    }
  }
  if (s.kind === 'metal') {
    c.fillStyle = edge;
    for (let x = s.x + 10; x < s.x + s.w - 4; x += 30) c.fillRect(x, s.y + 8, 4, 4);
  }
  c.fillStyle = top;
  c.fillRect(s.x, s.y, s.w, Math.min(8, s.h));
  c.fillStyle = edge;
  c.fillRect(s.x, s.y + Math.min(8, s.h), s.w, 2);
  if (s.kind === 'grass') {
    c.fillStyle = top;
    for (let x = s.x + 6; x < s.x + s.w - 4; x += 14) c.fillRect(x, s.y - 3, 3, 4);
  }
  if (s.warn) {
    c.fillStyle = 'rgba(255, 60, 60, 0.45)';
    c.fillRect(s.x, s.y, s.w, s.h);
  }
  c.restore();
}

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
    c.fillStyle = d.trim ?? '#c79f7a';
    c.fillRect(d.x, d.y + d.h - 16, d.w, 16);
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
    c.fillStyle = d.night ? '#25304f' : '#9fd6ff';
    rr(c, d.x, d.y, d.w ?? 90, d.h ?? 80, 6);
    c.fill();
    if (d.rain) {
      c.strokeStyle = 'rgba(200, 220, 255, 0.7)';
      c.lineWidth = 1.5;
      for (let i = 0; i < 12; i++) {
        const x = d.x + ((i * 17 + g.time * 30) % (d.w ?? 90));
        const y = d.y + ((i * 23 + g.time * 260) % (d.h ?? 80));
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x - 2, y + 8);
        c.stroke();
      }
    }
    c.strokeStyle = '#8a6040';
    c.lineWidth = 6;
    rr(c, d.x, d.y, d.w ?? 90, d.h ?? 80, 6);
    c.stroke();
    c.beginPath();
    c.moveTo(d.x + (d.w ?? 90) / 2, d.y);
    c.lineTo(d.x + (d.w ?? 90) / 2, d.y + (d.h ?? 80));
    c.stroke();
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
    c.fillStyle = '#8a5a3a';
    c.fillRect(d.x, d.y - 50, 12, 50);
    c.fillRect(d.x + 148, d.y - 34, 12, 34);
    c.fillStyle = '#6fa3d8';
    rr(c, d.x + 6, d.y - 34, 150, 22, 6);
    c.fill();
    c.fillStyle = '#fff';
    rr(c, d.x + 14, d.y - 44, 40, 14, 6);
    c.fill();
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
    c.fillStyle = '#a8744a';
    c.fillRect(d.x, d.y - 40, 90, 8);
    c.fillRect(d.x + 6, d.y - 32, 8, 32);
    c.fillRect(d.x + 76, d.y - 32, 8, 32);
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
    c.fillStyle = '#6b4528';
    c.fillRect(d.x + 8, d.y - 60, 4, 60);
    c.fillStyle = d.off ? '#8a7a6a' : '#ffd77a';
    c.beginPath();
    c.moveTo(d.x - 6, d.y - 60);
    c.lineTo(d.x + 26, d.y - 60);
    c.lineTo(d.x + 18, d.y - 84);
    c.lineTo(d.x + 2, d.y - 84);
    c.fill();
  },
  rug(c, d) {
    c.fillStyle = d.color ?? '#d9826a';
    c.beginPath();
    c.ellipse(d.x + (d.w ?? 140) / 2, d.y - 2, (d.w ?? 140) / 2, 6, 0, 0, Math.PI * 2);
    c.fill();
  },
  door(c, d) {
    c.fillStyle = d.dark ? '#3a2a20' : '#8a5a3a';
    rr(c, d.x, d.y - 90, 54, 90, 8);
    c.fill();
    c.fillStyle = '#f2c14e';
    c.beginPath();
    c.arc(d.x + 44, d.y - 44, 4, 0, Math.PI * 2);
    c.fill();
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
    c.fillStyle = d.color ?? '#f4e1c8';
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
      c.fillStyle = 'rgba(30, 20, 20, 0.35)';
      c.fillRect(x + w * 0.2, y + 70, w * 0.25, h - 70);
      return;
    }
    c.fillRect(x, y, w, h);
    c.fillStyle = d.roof ?? '#c9523e';
    c.beginPath();
    c.moveTo(x - 20, y);
    c.lineTo(x + w / 2, y - 70);
    c.lineTo(x + w + 20, y);
    c.fill();
    c.fillStyle = d.empty ? '#3a2a20' : '#8a5a3a';
    rr(c, x + w / 2 - 24, d.y - 80, 48, 80, 6);
    c.fill();
    c.fillStyle = d.empty ? '#2a2f3a' : '#9fd6ff';
    c.fillRect(x + 22, y + 34, 40, 36);
    c.fillRect(x + w - 62, y + 34, 40, 36);
    if (d.label) text(c, d.label, x + w / 2, y - 20, { size: 13, color: '#5a3a24' });
  },
  hole(c, d) {
    // a building sliced cleanly out of existence
    c.fillStyle = 'rgba(10, 10, 20, 0.85)';
    c.fillRect(d.x, d.y - d.h, d.w, d.h);
    c.strokeStyle = '#59f';
    c.setLineDash([6, 6]);
    c.lineWidth = 2;
    c.strokeRect(d.x, d.y - d.h, d.w, d.h);
    c.setLineDash([]);
  },
  tag(c, d, g) {
    const y = d.y + Math.sin(g.time * 2 + d.x) * 4;
    c.font = `700 14px ${FONT}`;
    const w = c.measureText(d.text).width + 16;
    c.fillStyle = 'rgba(20, 20, 30, 0.7)';
    rr(c, d.x - w / 2, y - 12, w, 24, 8);
    c.fill();
    text(c, d.text, d.x, y, { size: 14, color: d.color ?? '#cfe3ff' });
  },
  tree(c, d) {
    const s = d.s ?? 1;
    c.fillStyle = d.dead ? '#4a3a32' : '#7a5232';
    c.fillRect(d.x - 8 * s, d.y - 90 * s, 16 * s, 90 * s);
    if (d.dead) {
      c.strokeStyle = '#4a3a32';
      c.lineWidth = 5 * s;
      c.beginPath();
      c.moveTo(d.x, d.y - 70 * s);
      c.lineTo(d.x - 30 * s, d.y - 110 * s);
      c.moveTo(d.x, d.y - 80 * s);
      c.lineTo(d.x + 26 * s, d.y - 120 * s);
      c.stroke();
      return;
    }
    c.fillStyle = d.color ?? '#5fae5b';
    blobs(c, [[d.x, d.y - 110 * s, 44 * s], [d.x - 34 * s, d.y - 86 * s, 30 * s], [d.x + 34 * s, d.y - 86 * s, 30 * s]]);
  },
  bush(c, d) {
    c.fillStyle = d.color ?? '#69b85e';
    blobs(c, [[d.x, d.y - 14, 20], [d.x + 22, d.y - 18, 24], [d.x + 44, d.y - 12, 18]]);
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
    c.strokeStyle = '#4c8a3e';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(d.x, d.y);
    c.lineTo(d.x + Math.sin(g.time * 2 + d.x) * 2, d.y - 18);
    c.stroke();
    c.fillStyle = d.c ?? '#ff8fb1';
    c.beginPath();
    c.arc(d.x + Math.sin(g.time * 2 + d.x) * 2, d.y - 20, 5, 0, Math.PI * 2);
    c.fill();
  },
  fence(c, d) {
    c.fillStyle = d.dead ? '#6a5a4a' : '#e8d2b0';
    for (let x = d.x; x < d.x + d.w; x += 22) {
      if (d.dead && hash(x) > 0.6) continue;
      c.fillRect(x, d.y - 34, 10, 34);
    }
    c.fillRect(d.x, d.y - 26, d.w, 5);
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
    c.fillStyle = '#8a5a3a';
    c.fillRect(x + 4, y - 100, 8, 100);
    c.fillRect(x + 108, y - 100, 8, 100);
    c.fillStyle = '#b88250';
    c.fillRect(x, y - 44, 120, 44);
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i % 2 ? '#fff' : d.color ?? '#e2674f';
      c.beginPath();
      c.moveTo(x + i * 20 - 4, y - 100);
      c.lineTo(x + i * 20 + 20, y - 100);
      c.lineTo(x + i * 20 + 18, y - 82);
      c.lineTo(x + i * 20 - 2, y - 82);
      c.fill();
    }
    if (d.sign) text(c, d.sign, x + 60, y - 112, { size: 14, color: '#5a3a24' });
  },
  sign(c, d) {
    c.fillStyle = '#8a5a3a';
    c.fillRect(d.x + 18, d.y - 40, 6, 40);
    c.fillStyle = '#d9a86c';
    rr(c, d.x - 10, d.y - 64, 62, 28, 4);
    c.fill();
    text(c, d.text ?? '→', d.x + 21, d.y - 50, { size: 12, color: '#4a2a14' });
  },
  lamppost(c, d) {
    c.fillStyle = '#3b3b48';
    c.fillRect(d.x, d.y - 120, 6, 120);
    c.fillStyle = d.off ? '#555' : '#ffe8a0';
    c.beginPath();
    c.arc(d.x + 3, d.y - 124, 9, 0, Math.PI * 2);
    c.fill();
  },
  campfire(c, d, g) {
    c.fillStyle = '#6b4528';
    c.fillRect(d.x - 22, d.y - 8, 44, 8);
    for (let i = 0; i < 3; i++) {
      const h = 24 + Math.sin(g.time * 12 + i * 2) * 8;
      c.fillStyle = ['#ff8a3d', '#ffc94d', '#ff5a3d'][i];
      c.beginPath();
      c.moveTo(d.x - 14 + i * 8, d.y - 8);
      c.quadraticCurveTo(d.x - 8 + i * 8, d.y - 8 - h, d.x - 2 + i * 8, d.y - 8);
      c.fill();
    }
    const glow = c.createRadialGradient(d.x, d.y - 20, 4, d.x, d.y - 20, 160);
    glow.addColorStop(0, 'rgba(255, 170, 80, 0.35)');
    glow.addColorStop(1, 'rgba(255, 170, 80, 0)');
    c.fillStyle = glow;
    c.fillRect(d.x - 160, d.y - 180, 320, 200);
  },
  log(c, d) {
    c.fillStyle = '#7a5232';
    rr(c, d.x, d.y - 16, d.w ?? 70, 16, 8);
    c.fill();
  },
  rock(c, d) {
    c.fillStyle = d.color ?? '#9a9aa6';
    c.beginPath();
    c.ellipse(d.x, d.y - 10, d.r ?? 22, (d.r ?? 22) * 0.6, 0, Math.PI, 0);
    c.fill();
  },
  rubble(c, d) {
    for (let i = 0; i < (d.w ?? 80) / 14; i++) {
      c.fillStyle = ['#7d7470', '#5c5452', '#a39994', '#8a5a3a'][i % 4];
      const x = d.x + i * 14 + hash(i + d.x) * 6;
      const s = 8 + hash(i * 7 + d.x) * 14;
      c.fillRect(x, d.y - s, s, s);
    }
  },
  rack(c, d, g) {
    c.fillStyle = '#16233a';
    c.fillRect(d.x, d.y - (d.h ?? 180), 70, d.h ?? 180);
    for (let r = 0; r < (d.h ?? 180) / 26 - 1; r++) {
      c.fillStyle = '#0e1828';
      c.fillRect(d.x + 6, d.y - (d.h ?? 180) + 8 + r * 26, 58, 20);
      c.fillStyle = Math.sin(g.time * 4 + r * 3 + d.x) > 0 ? '#3df59a' : '#1f4a3b';
      c.fillRect(d.x + 12, d.y - (d.h ?? 180) + 15 + r * 26, 5, 5);
    }
  },
  screen(c, d, g) {
    const w = d.w ?? 120;
    const h = d.h ?? 80;
    c.fillStyle = '#222';
    rr(c, d.x - 6, d.y - 6, w + 12, h + 12, 6);
    c.fill();
    c.fillStyle = d.bg ?? '#0b1a12';
    c.fillRect(d.x, d.y, w, h);
    if (d.face) adminFace(c, d.x + w / 2, d.y + h / 2, Math.min(w, h) * 0.38, g);
    if (d.text) {
      const lines = d.text.split('\n');
      lines.forEach((l, i) => text(c, l, d.x + w / 2, d.y + h / 2 + (i - (lines.length - 1) / 2) * 16, { size: d.size ?? 12, color: d.color ?? '#3df59a' }));
    }
    c.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let y = d.y + ((g.time * 30) % 4); y < d.y + h; y += 4) c.fillRect(d.x, y, w, 1);
  },
  pipe(c, d) {
    c.fillStyle = d.color ?? '#3c4a63';
    c.fillRect(d.x, d.y, d.w ?? 16, d.h ?? 200);
  },
  memorial(c, d) {
    c.fillStyle = '#b9b3aa';
    rr(c, d.x - 24, d.y - 64, 48, 64, 18);
    c.fill();
    c.fillStyle = '#8f8a82';
    c.fillRect(d.x - 30, d.y - 8, 60, 8);
    text(c, d.name, d.x, d.y - 38, { size: 12, color: '#4a4440' });
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
  textD(c, d) {
    text(c, d.text, d.x, d.y, { size: d.size ?? 16, color: d.color ?? '#fff' });
  },
  pendantStand(c, d, g) {
    // the pendant hanging from a memorial
    c.strokeStyle = '#ccc';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(d.x - 8, d.y - 30);
    c.lineTo(d.x, d.y - 16);
    c.lineTo(d.x + 8, d.y - 30);
    c.stroke();
    heart(c, d.x, d.y - 10, 6, '#dfe6ee', '#9aa6b4');
  },
  woodSword(c, d) {
    c.save();
    c.translate(d.x, d.y);
    c.rotate(d.rot ?? -0.2);
    sword(c, 'tabby', 0, 0, 1);
    c.restore();
  },
  giantCursor(c, d, g) {
    c.save();
    c.translate(d.x, d.y + Math.sin(g.time) * 6);
    c.scale(d.s ?? 4, d.s ?? 4);
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

  // body: a fat round button with a darker rim at the bottom
  const color = o.flash ? '#ffffff' : o.color;
  const dark = o.flash ? '#dddddd' : o.dark;
  c.fillStyle = dark;
  rr(c, x, by + bodyH * 0.25, w, bodyH * 0.75, Math.min(w, bodyH) * 0.42);
  c.fill();
  c.fillStyle = color;
  rr(c, x, by, w, bodyH * 0.82, Math.min(w, bodyH) * 0.45);
  c.fill();
  c.fillStyle = 'rgba(255, 255, 255, 0.35)';
  c.beginPath();
  c.ellipse(x + w * 0.32, by + bodyH * 0.2, w * 0.16, bodyH * 0.08, -0.3, 0, Math.PI * 2);
  c.fill();
  if (o.label) text(c, o.label, x + w / 2, by + bodyH * 0.7, { size: 8, color: 'rgba(0,0,0,0.4)' });

  face(c, x + w / 2 + f * w * 0.08, by + bodyH * 0.42, w, o);

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
export function drawHud(c, g) {
  const p = g.player;
  if (p && !p.hideHud && g.level.hud !== false) {
    for (let i = 0; i < p.maxHp; i++) {
      heart(c, 28 + i * 26, 28, 9, i < p.hp ? '#ff4f6b' : 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.35)');
    }
    if (g.level.coins !== false) {
      c.fillStyle = '#f2c14e';
      c.beginPath();
      c.arc(30, 58, 8, 0, Math.PI * 2);
      c.fill();
      text(c, `${g.flags.coins ?? 0}`, 44, 59, { size: 15, color: '#fff', align: 'left' });
      c.lineWidth = 3;
    }
    if (p.tabby && !p.tabby.dead && g.flags.slam && !g.locked) {
      const k = p.tabby.stunReady;
      c.fillStyle = 'rgba(0,0,0,0.35)';
      rr(c, 18, 74, 96, 22, 11);
      c.fill();
      c.fillStyle = k >= 1 ? '#5b9bd5' : '#3a5a7a';
      rr(c, 18, 74, 96 * k, 22, 11);
      c.fill();
      text(c, k >= 1 ? 'Q · Tabby slam' : 'Tabby…', 66, 85, { size: 11, color: '#fff' });
    }
  }
  const b = g.boss;
  if (b && !b.dead && b.showBar !== false) {
    const bw = 520;
    const x = (W - bw) / 2;
    const y = H - 44;
    text(c, b.name, W / 2, y - 14, { size: 15, color: '#fff' });
    c.fillStyle = 'rgba(0,0,0,0.5)';
    rr(c, x, y, bw, 14, 7);
    c.fill();
    c.fillStyle = b.barColor ?? '#ff4d3d';
    rr(c, x, y, Math.max(0, bw * (b.hp / b.maxHp)), 14, 7);
    c.fill();
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
  if (f.vignette) {
    const v = c.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, `rgba(0,0,0,${f.vignette})`);
    c.fillStyle = v;
    c.fillRect(0, 0, W, H);
  }
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
      c.save();
      c.shadowColor = 'rgba(0,0,0,0.4)';
      c.shadowBlur = 20;
      popupWindow(c, a.x, a.y, a.w, a.h, '', '#ff3bb0');
      c.restore();
      text(c, a.label, a.x + a.w / 2, a.y + a.h / 2 + 4, { size: 15, color: '#d4145a' });
      text(c, 'Close in ' + Math.ceil(a.until - g.time) + '…', a.x + a.w / 2, a.y + a.h - 16, { size: 11, color: '#777' });
    }
  }
  if (f.letterbox > 0) {
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, 50 * f.letterbox);
    c.fillRect(0, H - 50 * f.letterbox, W, 50 * f.letterbox);
  }
  if (f.flash > 0) {
    c.fillStyle = `rgba(255,255,255,${Math.min(1, f.flash)})`;
    c.fillRect(0, 0, W, H);
  }
  if (f.fade > 0) {
    c.fillStyle = `rgba(0,0,0,${f.fade})`;
    c.fillRect(0, 0, W, H);
  }
}
