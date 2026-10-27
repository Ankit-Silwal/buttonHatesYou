import { cursorShape } from '@/reason/draw';
import { glow, twinkle, stamp } from './art';

// How Cursor looks: a glossy pointer with a glow, a light trail, a lean into
// his motion, blinking eyes that follow what he's looking at, a blush when
// love is in the air, and a click ripple whenever he presses something.

const TRAIL = 18;

// Called every update: remember where he's been and how he's moving.
export function motion(k, g, dt, ox) {
  if (!k.trail) {
    k.trail = new Float32Array(TRAIL * 2);
    k.ti = 0;
    k.sparks = Array.from({ length: 14 }, () => ({ x: 0, y: 0, life: 0, vx: 0, vy: 0 }));
    k.ripples = Array.from({ length: 3 }, () => ({ x: 0, y: 0, t: 9 }));
    k.blinkT = Math.random() * 3;
    k.lean = 0;
    k.pressT = 0;
    for (let i = 0; i < TRAIL; i++) {
      k.trail[i * 2] = k.x + 9;
      k.trail[i * 2 + 1] = k.y + 15;
    }
  }
  const s = k.w / 17;
  const bob = Math.sin(g.time * 3) * 3;
  const prev = k.ti;
  k.ti = (k.ti + 1) % TRAIL;
  k.trail[k.ti * 2] = k.x + 7 * s;
  k.trail[k.ti * 2 + 1] = k.y + 12 * s + bob;
  const v = dt > 0 ? (k.x - ox) / dt : 0;
  k.lean += (Math.max(-0.38, Math.min(0.38, v * 0.0012)) - k.lean) * Math.min(1, dt * 8);
  k.pressT = Math.max(0, k.pressT - dt);
  for (const r of k.ripples) r.t += dt;
  // sparkles shed while he zips about
  const sp = Math.hypot(k.trail[k.ti * 2] - k.trail[prev * 2], k.trail[k.ti * 2 + 1] - k.trail[prev * 2 + 1]) / Math.max(dt, 1e-3);
  if (sp > 220 && Math.random() < 0.5) {
    const f = k.sparks.find((q) => q.life <= 0);
    if (f) {
      f.x = k.trail[k.ti * 2] + (Math.random() - 0.5) * 10;
      f.y = k.trail[k.ti * 2 + 1] + (Math.random() - 0.5) * 10;
      f.vx = (Math.random() - 0.5) * 40;
      f.vy = 20 + Math.random() * 30;
      f.life = 0.5 + Math.random() * 0.3;
    }
  }
  for (const q of k.sparks) {
    if (q.life <= 0) continue;
    q.life -= dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
  }
}

export function ripple(k, x, y) {
  if (!k.ripples) return;
  let r = k.ripples[0];
  for (const q of k.ripples) if (q.t > r.t) r = q;
  r.x = x;
  r.y = y;
  r.t = 0;
}

// A crisp, glossy pointer body, rendered once at 4x.
const bodies = {};
function body(flash) {
  const key = flash ? 'f' : 'n';
  if (bodies[key]) return bodies[key];
  const S = 4;
  const cv = document.createElement('canvas');
  cv.width = 24 * S;
  cv.height = 32 * S;
  const c = cv.getContext('2d');
  c.scale(S, S);
  c.translate(3, 2);
  // soft drop shadow
  c.save();
  c.translate(1.2, 1.8);
  c.filter = 'blur(1.2px)';
  cursorShape(c, 'rgba(10,20,50,0.35)', 'rgba(10,20,50,0.35)');
  c.restore();
  // body with a top-light gradient
  const gr = c.createLinearGradient(0, 0, 10, 26);
  gr.addColorStop(0, flash ? '#fff2f2' : '#ffffff');
  gr.addColorStop(0.55, flash ? '#ffd6d6' : '#f2f8ff');
  gr.addColorStop(1, flash ? '#ffb0b0' : '#cfe4ff');
  cursorShape(c, gr, '#141a33');
  // a glint along the left edge
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(255,255,255,0.95)';
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(1.5, 3.4);
  c.lineTo(1.5, 17);
  c.stroke();
  c.strokeStyle = 'rgba(120,170,255,0.4)';
  c.beginPath();
  c.moveTo(9.8, 17);
  c.lineTo(12, 22.8);
  c.stroke();
  bodies[key] = cv;
  return cv;
}

function groundBelow(g, x, y) {
  let best = null;
  for (const s of g.solids) {
    if (s.off || x < s.x || x > s.x + s.w || s.y < y) continue;
    if (best === null || s.y < best) best = s.y;
  }
  return best;
}

export function drawPal(c, k, g) {
  if (!k.trail) return;
  const t = g.time;
  const s = k.w / 17;
  const bob = Math.sin(t * 3) * 3;
  const love = g.art?.love ?? 0;
  const rgb = love > 0.5 ? '255,160,210' : '150,220,255';
  const hx = k.x + 7 * s;
  const hy = k.y + 12 * s + bob;
  // in the dark, Cursor lights the way
  k.light = g.art?.m?.dark ? LIGHT : null;

  // a soft shadow on the ground below him
  const gy = groundBelow(g, hx, k.y + k.h);
  if (gy !== null) {
    const d = gy - (k.y + k.h);
    if (d < 260) {
      const f = 1 - d / 260;
      c.fillStyle = `rgba(10,10,30,${0.22 * f})`;
      c.beginPath();
      c.ellipse(hx, gy + 1, 6 + 8 * f, 2 + 1.5 * f, 0, 0, Math.PI * 2);
      c.fill();
    }
  }

  c.save();
  c.globalCompositeOperation = 'lighter';
  // the light trail: tapered, newest segments brightest
  c.lineCap = 'round';
  c.strokeStyle = `rgb(${rgb})`;
  for (let i = 1; i < TRAIL; i++) {
    const a = (k.ti + i) % TRAIL;
    const b = (k.ti + i + 1) % TRAIL;
    const x0 = k.trail[a * 2];
    const y0 = k.trail[a * 2 + 1];
    const x1 = k.trail[b * 2];
    const y1 = k.trail[b * 2 + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 0.6) continue;
    const u = i / TRAIL;
    c.globalAlpha = Math.min(1, len / 6) * u * 0.55;
    c.lineWidth = 1 + u * 7;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
  }
  // the halo
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
  stamp(c, glow(rgb), hx, hy, 30 + pulse * 6 + k.pressT * 40, 0.4 + 0.12 * pulse + k.pressT * 1.6);
  // sparkles
  const tw = twinkle(rgb);
  for (const q of k.sparks) if (q.life > 0) stamp(c, tw, q.x, q.y, 5 + q.life * 6, q.life * 1.4);
  // click ripples
  for (const r of k.ripples) {
    if (r.t > 0.6) continue;
    const u = r.t / 0.6;
    stamp(c, glow(rgb), r.x, r.y, 20 + u * 30, (1 - u) * 0.9);
    c.globalAlpha = (1 - u) * 0.9;
    c.lineWidth = 2.5 * (1 - u) + 0.5;
    c.beginPath();
    c.arc(r.x, r.y, 6 + u * 34, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();

  // the body: leans into motion, squashes when it clicks
  const press = k.pressT > 0 ? Math.sin((k.pressT / 0.3) * Math.PI) : 0;
  c.save();
  c.translate(k.x, k.y + bob + press * 4);
  c.rotate(k.lean);
  c.scale(s * (1 + press * 0.12), s * (1 - press * 0.16));
  c.drawImage(body(k.flash > 0), -3, -2, 24, 32);
  // eyes that look where he's going (or at Bobby)
  let lx = 0;
  let ly = 0;
  const L = k.look;
  if (L) {
    const dx = L.x + L.w / 2 - hx;
    const dy = L.y + L.h / 2 - hy;
    const d = Math.hypot(dx, dy) || 1;
    lx = (dx / d) * 0.7;
    ly = (dy / d) * 0.6;
  }
  const blink = (t + k.blinkT) % 3.4 < 0.13 ? 0.15 : 1; // time-based, so he blinks during dialogue too
  const wide = k.pressT > 0.12;
  c.fillStyle = '#141a33';
  c.beginPath();
  c.ellipse(4 + lx, 11 + ly, wide ? 1.35 : 1.15, (wide ? 1.8 : 1.5) * blink, 0, 0, Math.PI * 2);
  c.ellipse(7.6 + lx, 11 + ly, wide ? 1.35 : 1.15, (wide ? 1.8 : 1.5) * blink, 0, 0, Math.PI * 2);
  c.fill();
  if (blink === 1) {
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(4.4 + lx, 10.4 + ly, 0.42, 0, Math.PI * 2);
    c.arc(8 + lx, 10.4 + ly, 0.42, 0, Math.PI * 2);
    c.fill();
  }
  // blushing whenever love is in the air
  if (love > 0.05) {
    c.fillStyle = `rgba(255,110,150,${0.55 * love})`;
    c.beginPath();
    c.ellipse(3, 13.6, 1.3, 0.7, 0, 0, Math.PI * 2);
    c.ellipse(8.6, 13.6, 1.3, 0.7, 0, 0, Math.PI * 2);
    c.fill();
  }
  // a little mouth that moves when he talks
  const tk = g.ui.talk;
  const talking = tk && tk.who === 'cursor' && tk.shown < tk.text.length;
  c.beginPath();
  if (talking && Math.sin(t * 22) > -0.2) {
    c.fillStyle = '#141a33';
    c.ellipse(5.8 + lx * 0.5, 14.2, 1, 0.9, 0, 0, Math.PI * 2);
    c.fill();
  } else {
    c.strokeStyle = '#141a33';
    c.lineWidth = 0.7;
    c.arc(5.8 + lx * 0.5, 13.2, 1.1, 0.2 * Math.PI, 0.8 * Math.PI);
    c.stroke();
  }
  c.restore();
}

const LIGHT = { r: 120, rgb: '170,220,255', a: 0.85 };
