import { drawBobby, clothesOf, hatOf, rr, text, lighten, darken, lookOf } from './kit';

// The friends you can play as (the wardrobe's Character slot), drawn on a
// canvas in their own shapes, as avatar-chars.css draws them: Bobby and Bella
// are round buttons (drawBobby), Tabby a blue TAB keycap, Old Backspace a wide
// grey key with a moustache, Lord 404 a glitching purple error with a crown,
// Karen Popup a popup window and Cursor the white arrow himself. Most games
// still draw everyone as a coloured button; this is for the ones that don't.
//
// drawHero(c, x, y, size, o) is centred on (x, y) and `size` wide, like
// drawBobby (a 38x40 box: the body's top 31, legs below).
// o: { look (lookOf), mood, t, gaze: [-1..1, -1..1] (where the eyes look),
//      flash, alpha, legs (phase, or false), hair (Karen's bob), calm (no glitch) }

const INK = '#2b1d17';

export function drawHero(c, x, y, size, o = {}) {
  const look = o.look ?? lookOf();
  const who = look.char;
  c.save();
  c.translate(x, y);
  if (o.angle) c.rotate(o.angle);
  if (o.squash) c.scale(1 + o.squash, 1 - o.squash);
  if (o.alpha != null) c.globalAlpha = o.alpha;
  if (!who || who === 'bella') {
    const gx = o.gaze?.[0] ?? 0;
    drawBobby(c, 0, 0, size, { look, mood: o.mood, t: o.t, flash: o.flash, facing: gx < -0.2 ? -1 : 1, moving: o.moving });
    if (who === 'bella') {
      c.scale(size / 38, size / 38);
      bella(c, look);
    }
  } else {
    c.scale(size / 38, size / 38);
    (SHAPES[who] ?? SHAPES.tabby)(c, look, o);
  }
  c.restore();
}

/* ---------- the parts ---------- */

function legs(c, xs, top, o, color = '#3a2620') {
  if (o.legs === false) return;
  const ph = typeof o.legs === 'number' ? Math.sin(o.legs) * 2.5 : 0;
  c.strokeStyle = color;
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  for (const [i, lx] of xs.entries()) {
    const p = i ? -ph : ph;
    c.moveTo(lx, top);
    c.lineTo(lx + p, 18.5);
  }
  c.stroke();
  c.fillStyle = color;
  for (const [i, lx] of xs.entries()) c.fillRect(lx + (i ? -ph : ph) - 2, 17.5, 6, 3);
}

// Two eyes and a mouth. (x, y) is between the eyes.
// f: { sep, e (eye scale), mood, gaze, t, lids (0..1 heavy upper lids, in
//      `lid` colour), brows ('angry' | 'bushy' | 'worried'), mouthY, blush }
function face(c, x, y, f) {
  const mood = f.mood ?? 'calm';
  const e = f.e ?? 1;
  const sep = f.sep ?? 6.5;
  const [gx, gy] = f.gaze ?? [0, 0];
  const blink = f.t != null && (f.t * 0.7) % 4 > 3.86;
  c.lineCap = 'round';
  for (const side of [-1, 1]) {
    const px = x + side * sep;
    if (blink || mood === 'happy') {
      c.strokeStyle = INK;
      c.lineWidth = 1.7 * e;
      c.beginPath();
      if (mood === 'happy') c.arc(px, y + 1.6 * e, 3 * e, Math.PI * 1.15, Math.PI * 1.85);
      else {
        c.moveTo(px - 3 * e, y);
        c.lineTo(px + 3 * e, y);
      }
      c.stroke();
    } else {
      c.fillStyle = '#fff';
      c.beginPath();
      c.ellipse(px, y, 3.5 * e, 4.2 * e, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(43,29,23,0.25)';
      c.lineWidth = 0.6;
      c.stroke();
      c.fillStyle = f.pupil ?? INK;
      c.beginPath();
      c.arc(px + gx * 1.3 * e, y + 0.4 * e + gy * 1.2 * e, 2.1 * e, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.92)';
      c.beginPath();
      c.arc(px + gx * 1.3 * e - 0.8 * e, y - 0.6 * e + gy * 1.2 * e, 0.8 * e, 0, Math.PI * 2);
      c.fill();
      if (f.lids) {
        // heavy upper lids: he has seen things
        c.save();
        c.beginPath();
        c.ellipse(px, y, 3.7 * e, 4.4 * e, 0, 0, Math.PI * 2);
        c.clip();
        c.fillStyle = f.lid;
        c.fillRect(px - 4 * e, y - 4.6 * e, 8 * e, 4.6 * e * f.lids * 1.2);
        c.restore();
      }
    }
    if (f.brows === 'bushy') {
      c.fillStyle = '#fbfbfd';
      c.beginPath();
      c.ellipse(px, y - 5.4 * e, 4.4 * e, 1.7 * e, side * -0.15, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(60,64,74,0.3)';
      c.lineWidth = 0.5;
      c.stroke();
    } else if (f.brows || mood === 'angry' || mood === 'worried' || mood === 'sad') {
      const kind = f.brows ?? mood;
      const inner = kind === 'angry' ? 1 : -1;
      c.strokeStyle = INK;
      c.lineWidth = 1.6 * e;
      c.beginPath();
      c.moveTo(px - side * 3.4 * e, y - 6 * e + inner * 1.8 * e);
      c.lineTo(px + side * 3.4 * e, y - 6 * e - inner * 1.6 * e);
      c.stroke();
    }
  }
  if (f.blush !== false && mood !== 'angry') {
    c.fillStyle = 'rgba(255,110,130,0.25)';
    c.beginPath();
    c.ellipse(x - sep - 2 * e, y + 4.8 * e, 2.6 * e, 1.4 * e, 0, 0, Math.PI * 2);
    c.ellipse(x + sep + 2 * e, y + 4.8 * e, 2.6 * e, 1.4 * e, 0, 0, Math.PI * 2);
    c.fill();
  }
  mouth(c, x + gx * 0.6, y + (f.mouthY ?? 7.2) * e, mood, e);
}

function mouth(c, x, y, mood, e = 1) {
  c.strokeStyle = INK;
  c.fillStyle = '#5a1f1a';
  c.lineWidth = 1.7 * e;
  c.lineCap = 'round';
  c.beginPath();
  if (mood === 'calm') c.arc(x, y - 1.8 * e, 3 * e, 0.25, Math.PI - 0.25);
  else if (mood === 'happy') {
    c.moveTo(x - 3.6 * e, y - 0.6 * e);
    c.quadraticCurveTo(x, y + 4.6 * e, x + 3.6 * e, y - 0.6 * e);
    c.closePath();
    c.fill();
    c.stroke();
    return;
  } else if (mood === 'shout' || mood === 'angry' || mood === 'scared') {
    c.ellipse(x, y, 3 * e, (mood === 'angry' ? 1.8 : 3.2) * e, 0, 0, Math.PI * 2);
    c.fill();
  } else if (mood === 'sad' || mood === 'worried') c.arc(x, y + 2.4 * e, 3 * e, Math.PI + 0.35, -0.35);
  else if (mood === 'smug') {
    c.moveTo(x - 3 * e, y);
    c.quadraticCurveTo(x + 1.6 * e, y + 2 * e, x + 3.6 * e, y - 1.8 * e);
  } else {
    c.moveTo(x - 2.6 * e, y);
    c.lineTo(x + 2.6 * e, y);
  }
  c.stroke();
}

// A keycap body: a darker skirt, the lit top face, its gloss.
function keycap(c, x, y, w, h, r, color, dark, flash) {
  c.fillStyle = flash ? '#fff' : dark;
  rr(c, x, y + 3, w, h - 3, r);
  c.fill();
  const g = c.createLinearGradient(0, y, 0, y + h - 5);
  g.addColorStop(0, flash ? '#fff' : lighten(color, 0.22));
  g.addColorStop(0.45, flash ? '#fff' : color);
  g.addColorStop(1, flash ? '#eee' : darken(color, 0.06));
  c.fillStyle = g;
  rr(c, x + 2.4, y, w - 4.8, h - 6, r * 0.85);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.4)';
  c.fillRect(x + r, y + 1.2, w - 2 * r, 1.2);
}

// The outfit's clothes cut to the body's shape (as avatar-chars.css does).
function dress(c, look, shape, x, y, w) {
  if (!look.outfit) return;
  c.save();
  shape();
  c.clip();
  c.translate(x, y);
  c.scale(w / 38, 1);
  clothesOf(c, look.outfit, 0, 0);
  c.restore();
}

/* ---------- each friend ---------- */

const SHAPES = {
  // the Tab key, a blue keycap labelled TAB
  tabby(c, look, o) {
    const x = -22.5;
    const top = -20;
    legs(c, [-8, 8], 9, o, '#2a2a38');
    keycap(c, x, top, 45, 31, 7, look.color, look.dark, o.flash);
    dress(c, look, () => rr(c, x, top, 45, 31, 7), x + 3.5, top, 38);
    text(c, 'TAB ⇥', x + 13, top + 5.2, { size: 5.6, color: 'rgba(255,255,255,0.92)', weight: 800 });
    face(c, 1, top + 13, { mood: o.mood, gaze: o.gaze, t: o.t, sep: 6.8 });
    hatOf(c, look.hat, -19, top, 38);
  },

  // Old Backspace: a wide grey key, wise and a little tired
  backspace(c, look, o) {
    const x = -26.5;
    const top = -18.5;
    legs(c, [-10, 10], 9, o, '#2a2a38');
    keycap(c, x, top, 53, 29.5, 6, look.color, look.dark, o.flash);
    dress(c, look, () => rr(c, x, top, 53, 29.5, 6), x + 4, top - 1.5, 45);
    text(c, '⌫', x + 44, top + 5, { size: 6.5, color: 'rgba(40,44,54,0.55)' });
    const fy = top + 12;
    face(c, 0, fy, { mood: o.mood, gaze: o.gaze, t: o.t, sep: 7, lids: 0.45, lid: look.color, brows: 'bushy', blush: false, mouthY: 8.6 });
    // the moustache
    c.fillStyle = '#fbfbfd';
    c.beginPath();
    c.ellipse(-3.4, fy + 5.6, 4.6, 2, 0.25, 0, Math.PI * 2);
    c.ellipse(3.4, fy + 5.6, 4.6, 2, -0.25, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(60,64,74,0.25)';
    c.lineWidth = 0.5;
    c.stroke();
    hatOf(c, look.hat, -19, top, 38);
  },

  // Lord 404: a purple error, glitching, with a tiny crown
  lord404(c, look, o) {
    const x = -19;
    const top = -20;
    const t = o.t ?? 0;
    const glitch = !o.calm && t % 3.2 > 2.75;
    const j = glitch ? (Math.floor(t * 30) % 2 ? 1.8 : -1.4) : 0;
    legs(c, [-7, 7], 9, o);
    if (glitch) {
      const op = c.globalCompositeOperation;
      c.globalCompositeOperation = 'lighter';
      for (const [dx, col] of [[-2.2, 'rgba(255,47,160,0.55)'], [2.2, 'rgba(47,214,255,0.55)']]) {
        c.fillStyle = col;
        rr(c, x + dx + j, top, 38, 31, 8.7);
        c.fill();
      }
      c.globalCompositeOperation = op;
    }
    c.save();
    c.translate(j, 0);
    keycap(c, x, top, 38, 31, 8.7, look.color, look.dark, o.flash);
    dress(c, look, () => rr(c, x, top, 38, 31, 8.7), x, top, 38);
    // scanlines
    c.fillStyle = 'rgba(30,0,60,0.12)';
    for (let sy = top + 2 + ((t * 12) % 3); sy < top + 26; sy += 3) c.fillRect(x + 3, sy, 32, 0.8);
    text(c, '404', 0, top + 5, { size: 5.4, color: '#e6c8ff', weight: 800 });
    face(c, 0, top + 13.5, { mood: o.mood, gaze: o.gaze, t, sep: 6.4, pupil: '#3a0f5c' });
    if (look.hat) hatOf(c, look.hat, -19, top, 38);
    else {
      // the crown
      c.fillStyle = '#e8b432';
      c.beginPath();
      c.moveTo(-6, top + 1);
      c.lineTo(-6, top - 5);
      c.lineTo(-3, top - 1.8);
      c.lineTo(0, top - 7);
      c.lineTo(3, top - 1.8);
      c.lineTo(6, top - 5);
      c.lineTo(6, top + 1);
      c.closePath();
      c.fill();
      c.fillStyle = '#ffe08a';
      c.fillRect(-6, top - 0.5, 12, 1.5);
    }
    c.restore();
  },

  // Karen Popup: a popup window, title bar and all
  karen(c, look, o) {
    const x = -21.25;
    const top = -17.6;
    const w = 42.5;
    const h = 28.6;
    legs(c, [-8, 8], 9, o);
    // the window
    c.fillStyle = 'rgba(20,10,40,0.22)';
    rr(c, x + 1.5, top + 2, w, h, 3.8);
    c.fill();
    keycap(c, x, top, w, h, 3.8, o.flash ? '#fff' : look.color, look.dark, o.flash);
    dress(c, look, () => rr(c, x, top, w, h, 3.8), x + 2, top - 1, 38.5);
    // the title bar
    c.save();
    rr(c, x + 2.4, top, w - 4.8, h - 6, 3.2);
    c.clip();
    const g = c.createLinearGradient(0, top, 0, top + 6.4);
    g.addColorStop(0, o.angry ? '#ff5a4a' : '#ff8f6d');
    g.addColorStop(1, o.angry ? '#c8281e' : '#e8603e');
    c.fillStyle = g;
    c.fillRect(x, top, w, 6.4);
    c.restore();
    text(c, '! ✕', x + w - 8.5, top + 3.3, { size: 4.6, color: '#fff', weight: 800 });
    if (o.hair) {
      // the haircut (the boss version, as in How I Met Your Cursor)
      const hg = c.createLinearGradient(0, top - 9, 0, top + 4);
      hg.addColorStop(0, '#fbe3a0');
      hg.addColorStop(1, '#c99a3e');
      c.fillStyle = hg;
      // the asymmetric bob: a big swoop over the top left, flipping out at the side
      c.beginPath();
      c.moveTo(x - 3, top + 9);
      c.quadraticCurveTo(x - 6, top - 6, x + 12, top - 6.5);
      c.quadraticCurveTo(x + 26, top - 7, x + 30, top + 0.5);
      c.quadraticCurveTo(x + 18, top - 1.5, x + 8, top + 1.5);
      c.quadraticCurveTo(x + 2, top + 3.5, x + 1.5, top + 8);
      c.quadraticCurveTo(x - 0.5, top + 11, x - 3, top + 9);
      c.fill();
      c.strokeStyle = 'rgba(150,100,30,0.45)';
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(x + 2, top - 2);
      c.quadraticCurveTo(x + 12, top - 5, x + 22, top - 3.5);
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.beginPath();
      c.ellipse(x + 8, top - 4, 4, 1, -0.2, 0, Math.PI * 2);
      c.fill();
    }
    face(c, 0, top + 14.5, { mood: o.mood, gaze: o.gaze, t: o.t, sep: 7, brows: o.mood === 'happy' || o.mood === 'smug' ? 'angry' : undefined, blush: false });
    if (!o.hair) hatOf(c, look.hat, -19, top, 38);
  },

  // Cursor: the white arrow pointer himself
  cursor(c, look, o) {
    const bob = Math.sin((o.t ?? 0) * 3) * 1.2;
    c.translate(0, bob);
    const arrow = () => {
      c.beginPath();
      c.moveTo(-10.6, -20);
      c.lineTo(-10.6, 15.2);
      c.lineTo(-3.8, 8.4);
      c.lineTo(1.5, 20);
      c.lineTo(6.8, 17.2);
      c.lineTo(1.5, 6);
      c.lineTo(11.4, 6);
      c.closePath();
    };
    // soft shadow, outline, body
    c.fillStyle = 'rgba(30,20,10,0.22)';
    c.save();
    c.translate(1.6, 2.4);
    arrow();
    c.fill();
    c.restore();
    arrow();
    c.lineJoin = 'round';
    c.strokeStyle = '#1d1d24';
    c.lineWidth = 2.2;
    c.stroke();
    const g = c.createLinearGradient(-12, -20, 10, 18);
    // white unless a Color item repaints him (lookOf)
    g.addColorStop(0.3, o.flash ? '#fff' : look.color ?? '#ffffff');
    g.addColorStop(1, o.flash ? '#fff' : lighten(look.dark ?? '#b8bccb', 0.45));
    c.fillStyle = g;
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.moveTo(-8.8, -15.5);
    c.lineTo(-8.8, -6);
    c.lineTo(-6.8, -10);
    c.closePath();
    c.fill();
    // little dark eyes (as on the avatar) and a mouth
    const [gx, gy] = o.gaze ?? [0, 0];
    const blink = o.t != null && (o.t * 0.7) % 4 > 3.86;
    for (const ex of [-5.6, -0.6]) {
      c.fillStyle = '#1d1d24';
      c.beginPath();
      if (blink || o.mood === 'happy') {
        c.strokeStyle = '#1d1d24';
        c.lineWidth = 1.3;
        if (o.mood === 'happy') c.arc(ex, -1, 1.8, Math.PI * 1.15, Math.PI * 1.85);
        else {
          c.moveTo(ex - 1.8, -2.4);
          c.lineTo(ex + 1.8, -2.4);
        }
        c.stroke();
        continue;
      }
      c.ellipse(ex + gx * 0.5, -2.4 + gy * 0.5, 1.9, 2.3, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(ex + gx * 0.5 - 0.6, -3.2 + gy * 0.5, 0.65, 0, Math.PI * 2);
      c.fill();
    }
    if (o.mood === 'angry' || o.mood === 'worried' || o.mood === 'sad') {
      c.strokeStyle = '#1d1d24';
      c.lineWidth = 1.1;
      const inner = o.mood === 'angry' ? 1 : -1;
      c.beginPath();
      c.moveTo(-7.6, -6 - inner);
      c.lineTo(-4, -6 + inner);
      c.moveTo(1.4, -6 - inner);
      c.lineTo(-2.2, -6 + inner);
      c.stroke();
    }
    mouth(c, -3, 2.6, o.mood ?? 'calm', 0.6);
    hatOf(c, look.hat, -27, -20, 38);
  },
};

// Bella: the pink button (drawBobby) gets her bow and a blush.
function bella(c, look) {
  c.fillStyle = 'rgba(255,80,130,0.3)';
  c.beginPath();
  c.ellipse(-10.5, 4, 3.2, 1.8, 0, 0, Math.PI * 2);
  c.ellipse(10.5, 4, 3.2, 1.8, 0, 0, Math.PI * 2);
  c.fill();
  c.save();
  if (look.hat) c.translate(16, -9), c.scale(0.75, 0.75);
  else c.translate(10, -17);
  c.rotate(0.24);
  const bow = c.createLinearGradient(0, -5, 0, 5);
  bow.addColorStop(0, '#ff6f9f');
  bow.addColorStop(1, '#d93a6a');
  c.fillStyle = bow;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-7.5, -5);
  c.quadraticCurveTo(-9.5, 0, -7.5, 5);
  c.closePath();
  c.moveTo(0, 0);
  c.lineTo(7.5, -5);
  c.quadraticCurveTo(9.5, 0, 7.5, 5);
  c.closePath();
  c.fill();
  c.fillStyle = '#b8285a';
  c.beginPath();
  c.arc(0, 0, 2, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// The colours a character's paddle hand (and trail) uses.
export const heroTint = (look) => (look.char === 'cursor' || look.char === 'karen' ? '#8fd3ff' : look.color);
