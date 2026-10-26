import { W, H, rand, pick, clamp, rr, drawBobby, drawScore, backdrop, bubble, Mouth, Sparks } from '../kit';

// Tower of Regret: drop swinging button clones on top of each other. Whatever
// hangs over the edge is cut off and falls away, screaming.
const GROUND = H - 70;
const SLAB_H = 44;
const START_W = 250;
const HOVER = 110; // how far above the tower the next clone swings
const SWING = 190; // how far left and right of center it swings
const GRAVITY = 2400;
const PERFECT = 6;
const HUE_STEP = 9;
const WATCHER = 54;

const MOODS = ['calm', 'sad', 'angry', 'worried', 'smug', 'closed'];
const SCREAMS = ['AAA!', 'Nooo!', 'Bye!', 'Eek!', 'Why?!'];
const DROPS = ['That one had a family.', 'Higher. Great. Wonderful.', 'Stop stacking my clones.', 'My back hurts.', 'This is a cry for help.'];
const PERFECTS = ['Show-off.', 'Lucky.', 'Ugh. Perfect.', 'Nobody saw that.'];
const CRASH = ['Ha! Timber.', 'Told you.', 'Finally.', 'Gravity agrees with me.'];

export default function stack({ look, sound }) {
  const floors = [{ x: W / 2, w: START_W, mood: 'closed', hue: 0 }]; // the base, not counted
  const debris = [];
  const mouth = new Mouth();
  const sparks = new Sparks();
  const slab = { x: W / 2 - SWING, y: 0, w: START_W, dir: 1, vy: 0, falling: false, mood: 'calm', angle: 0, va: 0 };
  let started = false;
  let t = 0;
  let cam = 0; // how far the view has risen, in pixels
  let shake = 0;
  let scared = 0; // the watcher flinches for a moment after a cut

  const top = () => GROUND - floors.length * SLAB_H; // y of the tower's top edge
  const speed = () => Math.min(170 + g.score * 9, 420);
  const hueOf = (n) => n * HUE_STEP;

  const nextSlab = () => {
    const last = floors[floors.length - 1];
    slab.w = last.w;
    slab.dir = Math.random() < 0.5 ? 1 : -1;
    slab.x = W / 2 - slab.dir * SWING;
    slab.y = top() - HOVER - SLAB_H;
    slab.vy = 0;
    slab.falling = false;
    slab.mood = pick(MOODS);
  };

  // The piece that hangs over the edge tumbles off on its own.
  const cutOff = (x, w, side) => {
    debris.push({
      x,
      y: top() - SLAB_H / 2,
      w,
      vx: side * rand(60, 140),
      vy: rand(-220, -120),
      angle: 0,
      va: side * rand(2, 5),
      hue: hueOf(floors.length),
      scream: pick(SCREAMS),
    });
  };

  const land = () => {
    const last = floors[floors.length - 1];
    const off = slab.x - last.x;
    if (Math.abs(off) >= (slab.w + last.w) / 2) {
      // missed the tower entirely: it keeps falling, and so does the run
      g.over = true;
      slab.falling = true;
      slab.vy = 100;
      slab.va = Math.sign(off || 1) * 3;
      sound.crash();
      shake = 0.4;
      mouth.say(pick(CRASH), 3);
      return;
    }

    let x = slab.x;
    let w = slab.w;
    if (Math.abs(off) <= PERFECT) {
      x = last.x;
      sound.ring();
      sparks.burst(x, top(), '#fff', 14, 260);
      sparks.float(x, top() - 50, 'Perfect!', '#fff6a8');
      mouth.say(pick(PERFECTS), 1.6);
    } else {
      const l = Math.max(slab.x - slab.w / 2, last.x - last.w / 2);
      const r = Math.min(slab.x + slab.w / 2, last.x + last.w / 2);
      const side = Math.sign(off);
      w = r - l;
      x = (l + r) / 2;
      const cutW = slab.w - w;
      cutOff(side > 0 ? r + cutW / 2 : l - cutW / 2, cutW, side);
      sound.thud();
      scared = 0.8;
      mouth.maybe(DROPS, 0.3);
    }
    floors.push({ x, w, mood: slab.mood, hue: hueOf(floors.length) });
    g.score++;
    sound.pop();
    shake = 0.12;
    nextSlab();
  };

  const drop = () => {
    if (g.over || slab.falling) return;
    if (!started) mouth.say("Don't you dare.", 1.6);
    started = true;
    slab.falling = true;
    slab.vy = 0;
    sound.jump();
  };

  const g = {
    score: 0,
    over: false,
    down: drop,
    key(code) {
      if (code === 'Space' || code === 'ArrowDown' || code === 'Enter') drop();
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      shake = Math.max(0, shake - dt);
      scared = Math.max(0, scared - dt);

      // the view rises so the tower top stays a little below the middle
      cam += (Math.max(0, 470 - top()) - cam) * Math.min(1, dt * 4);

      for (const d of debris) {
        d.vy += GRAVITY * 0.6 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.angle += d.va * dt;
      }
      if (debris.length && debris[0].y + cam > H + 200) debris.shift();

      if (slab.falling) {
        slab.vy += GRAVITY * dt;
        slab.y += slab.vy * dt;
        if (g.over) {
          slab.angle += slab.va * dt; // the missed clone keeps tumbling
          slab.x += slab.va * 30 * dt;
        } else if (slab.y + SLAB_H >= top()) {
          slab.y = top() - SLAB_H;
          land();
        }
        return;
      }
      if (g.over) return;

      slab.x += slab.dir * speed() * dt;
      if (slab.x > W / 2 + SWING) {
        slab.x = W / 2 + SWING;
        slab.dir = -1;
      } else if (slab.x < W / 2 - SWING) {
        slab.x = W / 2 - SWING;
        slab.dir = 1;
      }
    },

    draw(c) {
      backdrop(c, `hsl(${210 - Math.min(cam / 30, 60)}, 70%, ${clamp(72 - cam / 60, 25, 72)}%)`, '#ffe6c7');

      c.save();
      c.translate(shake ? rand(-3, 3) : 0, cam);

      // far clouds drift past as the camera rises
      c.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 12; i++) cloud(c, ((i * 173 + t * 8) % (W + 160)) - 80, GROUND - 160 - i * 260);

      // the ground
      c.fillStyle = '#d9b77c';
      c.fillRect(-10, GROUND, W + 20, H);
      c.fillStyle = '#8fca6f';
      c.fillRect(-10, GROUND, W + 20, 14);

      for (let i = 0; i < floors.length; i++) {
        const f = floors[i];
        const y = GROUND - (i + 1) * SLAB_H;
        if (y + cam > H + 20 || y + cam < -SLAB_H) continue;
        clone(c, f.x, y + SLAB_H / 2, f.w, look, f.hue, i ? f.mood : 'closed', t + i);
      }
      for (const d of debris) {
        c.save();
        c.translate(d.x, d.y);
        c.rotate(d.angle);
        clone(c, 0, 0, d.w, look, d.hue, 'shout', t);
        c.restore();
        if (d.vy < 500) bubble(c, d.x, d.y - 26, d.scream, { size: 11 });
      }

      const lastY = top() + SLAB_H / 2;
      if (!slab.falling && !g.over) {
        // a faint guide line from the swinging clone to the tower
        c.strokeStyle = 'rgba(255,255,255,0.35)';
        c.setLineDash([6, 8]);
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(slab.x, slab.y + SLAB_H);
        c.lineTo(slab.x, lastY - SLAB_H / 2);
        c.stroke();
        c.setLineDash([]);
      }
      c.save();
      c.translate(slab.x, slab.y + SLAB_H / 2);
      c.rotate(slab.angle);
      clone(c, 0, 0, slab.w, look, hueOf(floors.length), g.over ? 'shout' : slab.mood, t);
      c.restore();
      c.restore();

      // the original button watches from the ground, and stays in view after it
      const wy = Math.min(GROUND + cam, H + 6) - WATCHER / 2;
      const mood = g.over ? 'smug' : scared > 0 ? 'shout' : g.score < 5 ? 'calm' : g.score < 12 ? 'worried' : 'sad';
      drawBobby(c, 52, wy, WATCHER, { look, t, mood, tears: !g.over && g.score >= 16, facing: 1 });
      sparks.draw(c);
      mouth.draw(c, 52, wy - WATCHER * 0.7);

      if (started) drawScore(c, g.score, g.score >= 20 ? 'My back. All our backs.' : null);
      else drawScore(c, 'Tap to drop', 'They scream. That is normal.');
    },
  };
  nextSlab();
  return g;
}

// A squashed button clone: a wide rounded slab in `look`'s color, nudged by
// `hue` degrees, with a face. Centered on (x, y).
function clone(c, x, y, w, look, hue, mood, t) {
  const h = SLAB_H - 4;
  const left = x - w / 2;
  const topY = y - h / 2;
  const r = Math.min(w / 2, h * 0.45);
  c.fillStyle = shift(look.dark, hue);
  rr(c, left, topY + h * 0.2, w, h * 0.8, r);
  c.fill();
  c.fillStyle = shift(look.color, hue);
  rr(c, left, topY, w, h * 0.84, r);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.3)';
  c.beginPath();
  c.ellipse(left + Math.min(w * 0.22, 40), topY + h * 0.18, Math.min(w * 0.12, 22), h * 0.07, -0.15, 0, Math.PI * 2);
  c.fill();
  if (w > 14) face(c, x, topY + h * 0.4, Math.min(1, w / 70), mood, t);
}

// Eyes and a mouth, `s` times the normal size.
function face(c, x, y, s, mood, t) {
  const ex = 11 * s;
  const blink = mood === 'closed' || (t * 0.7) % 4 > 3.88;
  c.lineCap = 'round';
  c.strokeStyle = '#2b1d17';
  c.lineWidth = 2;
  for (const side of [-1, 1]) {
    const px = x + side * ex;
    if (blink) {
      c.beginPath();
      c.moveTo(px - 4 * s, y);
      c.lineTo(px + 4 * s, y);
      c.stroke();
      continue;
    }
    c.fillStyle = '#fff';
    c.beginPath();
    c.ellipse(px, y, 4.5 * s, (mood === 'shout' ? 6 : 4.5) * s, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#2b1d17';
    c.beginPath();
    c.arc(px, y + 0.5 * s, 2.3 * s, 0, Math.PI * 2);
    c.fill();
    if (mood === 'angry' || mood === 'sad' || mood === 'worried') {
      const inner = mood === 'angry' ? 1 : -1;
      c.beginPath();
      c.moveTo(px - side * 4.5 * s, y - 7 * s + inner * 2 * s);
      c.lineTo(px + side * 4.5 * s, y - 7 * s - inner * 2 * s);
      c.stroke();
    }
  }
  const my = y + 10 * s;
  c.fillStyle = '#5a1f1a';
  c.beginPath();
  if (mood === 'shout') {
    c.ellipse(x, my, 4 * s, 4.5 * s, 0, 0, Math.PI * 2);
    c.fill();
  } else if (mood === 'calm') c.arc(x, my - 3 * s, 4 * s, 0.3, Math.PI - 0.3);
  else if (mood === 'sad' || mood === 'worried') c.arc(x, my + 2 * s, 4 * s, Math.PI + 0.3, -0.3);
  else if (mood === 'smug') {
    c.moveTo(x - 4 * s, my);
    c.quadraticCurveTo(x + 2 * s, my + 2 * s, x + 5 * s, my - 2 * s);
  } else {
    c.moveTo(x - 4 * s, my);
    c.lineTo(x + 4 * s, my);
  }
  c.stroke();
}

// `hex` with its hue turned by `deg` degrees, as an hsl() string.
function shift(hex, deg) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const gr = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, gr, b);
  const min = Math.min(r, gr, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((gr - b) / d) % 6;
    else if (max === gr) h = (b - r) / d + 2;
    else h = (r - gr) / d + 4;
    h *= 60;
  }
  return `hsl(${(((h + deg) % 360) + 360) % 360}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function cloud(c, x, y) {
  c.beginPath();
  c.arc(x, y, 22, 0, Math.PI * 2);
  c.arc(x + 24, y - 10, 26, 0, Math.PI * 2);
  c.arc(x + 50, y, 20, 0, Math.PI * 2);
  c.fill();
}
