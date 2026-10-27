import { W, H, rand, pick, clamp, rr, drawBobby, drawScore, bubble, Mouth, Sparks } from '../kit';
import { Fx, sprite, sky, glow, softLight, rays, shadow, vignette, hash, rgb } from '../fx';

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
  const sparks = new Sparks(); // floating words
  const fx = new Fx();
  let flash = 0; // a perfect drop lights the tower top
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
      fx.burst(x, top(), '#fff6c8', 22, 340);
      fx.ring(x, top(), '#ffffff', slab.w * 0.8, 0.45, 8);
      flash = 0.5;
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
      fx.burst(side > 0 ? r : l, top() - SLAB_H / 2, '#fff1c0', 10, 220, { size: 2.5, life: 0.4 });
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
      fx.update(dt);
      flash = Math.max(0, flash - dt);
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
      backdropAt(c, cam, t);

      c.save();
      c.translate(shake ? rand(-3, 3) : 0, cam);

      // far clouds drift past as the camera rises
      c.globalAlpha = 0.8 - clamp(cam / 2600, 0, 1) * 0.5;
      for (let i = 0; i < 12; i++) cloud(c, ((i * 173 + t * 8) % (W + 160)) - 80, GROUND - 160 - i * 260);
      c.globalAlpha = 1;

      // the ground
      if (GROUND + cam < H) c.drawImage(groundArt(), -10, GROUND);
      shadow(c, floors[0].x, GROUND + 4, floors[0].w * 0.62, 0.35);

      for (let i = 0; i < floors.length; i++) {
        const f = floors[i];
        const y = GROUND - (i + 1) * SLAB_H;
        if (y + cam > H + 20 || y + cam < -SLAB_H) continue;
        clone(c, f.x, y + SLAB_H / 2, f.w, look, f.hue, i ? f.mood : 'closed', t + i);
      }
      if (flash > 0) glow(c, floors[floors.length - 1].x, top() + 6, floors[floors.length - 1].w * 0.9, '#fff3c0', flash * 1.6);
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
        // a soft beam and a faint guide line from the swinging clone to the tower
        beam(c, slab.x, slab.y + SLAB_H, lastY - SLAB_H / 2, slab.w);
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
      fx.draw(c);
      c.restore();

      // the original button watches from the ground, and stays in view after it
      const wy = Math.min(GROUND + cam, H + 6) - WATCHER / 2;
      const mood = g.over ? 'smug' : scared > 0 ? 'shout' : g.score < 5 ? 'calm' : g.score < 12 ? 'worried' : 'sad';
      drawBobby(c, 52, wy, WATCHER, { look, t, mood, tears: !g.over && g.score >= 16, facing: 1 });
      sparks.draw(c);
      vignette(c, 0.3, '#1a1030');
      mouth.draw(c, 52, wy - WATCHER * 0.7);

      if (started) drawScore(c, g.score, g.score >= 20 ? 'My back. All our backs.' : null);
      else drawScore(c, 'Tap to drop', 'They scream. That is normal.');
    },
  };
  nextSlab();
  return g;
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

/* ---------- art ---------- */

const DAY = ['#3d8fe0', '#8fcaf5', '#ffe2c0'];
const DUSK = ['#0b1038', '#3b2b78', '#d9708a'];

// Sky from day to dusk as the tower climbs, a skyline sinking below, and
// stars once it is dark. k: 0 at the ground, 1 way up.
function backdropAt(c, cam, t) {
  const k = clamp(cam / 2600, 0, 1);
  if (k < 1) sky(c, DAY);
  if (k > 0) {
    c.globalAlpha = k;
    sky(c, DUSK);
    c.globalAlpha = 1;
  }
  const night = clamp((k - 0.4) * 2, 0, 1);
  if (night > 0) {
    for (let i = 0; i < 50; i++) {
      const sx = hash(i) * W;
      const sy = (((hash(i + 40) * H + cam * 0.04) % H) + H) % H;
      glow(c, sx, sy, 2.5 + hash(i + 2) * 4, '#dfe8ff', night * (0.55 + 0.45 * Math.sin(t * 2 + i)));
    }
  }
  // the sun sinks behind the city as the camera rises
  const sunY = 300 + cam * 0.25;
  if (sunY < H + 120) {
    rays(c, W - 140, sunY, 360, '#fff0c8', 0.2 * (1 - k), t * 0.03);
    softLight(c, W - 140, sunY, 200, k > 0.3 ? '#ffb48a' : '#fff4d8', 0.6);
    glow(c, W - 140, sunY, 55, '#fff2d0', 0.9);
  }
  // two skylines, the far one hazier and slower
  const fy = GROUND - 250 + cam * 0.35;
  if (fy < H) {
    // the far towers fade into the dusk
    c.globalAlpha = 1 - k * 0.6;
    c.drawImage(skyline(0), 0, fy);
    c.globalAlpha = 1;
  }
  const ny = GROUND - 170 + cam * 0.65;
  if (ny < H) {
    c.drawImage(skyline(1), 0, ny);
    if (night > 0) {
      c.globalAlpha = night;
      c.drawImage(skyline(2), 0, ny);
      c.globalAlpha = 1;
    }
  }
}

// layer 0: far hazy towers; 1: near city; 2: the near city's lit windows
function skyline(layer) {
  const h = layer ? 260 : 300;
  return sprite(`stack:city:${layer}`, W, h, (c) => {
    const near = layer > 0;
    const seed = near ? 50 : 10;
    const n = near ? 11 : 15;
    for (let i = 0; i < n; i++) {
      const bw = (near ? 38 : 26) + hash(i + seed) * (near ? 30 : 22);
      const x = (i / n) * W - 10 + hash(i + seed + 1) * 20;
      const bh = (near ? 70 : 100) + hash(i + seed + 2) * (near ? 110 : 150);
      const y = h - bh;
      if (layer === 2) {
        // only the windows, glowing warm
        for (let wy = y + 10; wy < h - 10; wy += 14)
          for (let wx = x + 6; wx < x + bw - 8; wx += 10)
            if (hash(wx * 3.1 + wy) > 0.55) {
              c.fillStyle = hash(wx + wy * 7) > 0.3 ? 'rgba(255,214,140,0.95)' : 'rgba(170,220,255,0.9)';
              c.fillRect(wx, wy, 5, 7);
            }
        continue;
      }
      const g = c.createLinearGradient(x, 0, x + bw, 0);
      if (near) {
        g.addColorStop(0, '#5a6a9a');
        g.addColorStop(0.3, '#46507e');
        g.addColorStop(1, '#2c3158');
      } else {
        g.addColorStop(0, '#a9b9dc');
        g.addColorStop(1, '#8796c4');
      }
      c.fillStyle = g;
      c.fillRect(x, y, bw, bh);
      if (hash(i + seed + 3) > 0.6) {
        // an antenna with a red light
        c.fillRect(x + bw / 2 - 1, y - 18, 2, 18);
        c.fillStyle = '#ff5a5a';
        c.fillRect(x + bw / 2 - 2, y - 20, 4, 3);
      }
      if (near) {
        c.fillStyle = 'rgba(20,24,50,0.35)';
        for (let wy = y + 10; wy < h - 10; wy += 14)
          for (let wx = x + 6; wx < x + bw - 8; wx += 10) c.fillRect(wx, wy, 5, 7);
        c.fillStyle = 'rgba(255,220,180,0.35)';
        c.fillRect(x, y, 2, bh);
      }
    }
    if (layer < 2) {
      // haze settles at the bottom
      const hz = c.createLinearGradient(0, h * 0.3, 0, h);
      hz.addColorStop(0, 'rgba(255,226,192,0)');
      hz.addColorStop(1, `rgba(255,226,192,${near ? 0.35 : 0.65})`);
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = hz;
      c.fillRect(0, 0, W, h);
    }
  });
}

function groundArt() {
  return sprite('stack:ground', W + 20, 140, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 140);
    g.addColorStop(0, '#c9a06a');
    g.addColorStop(1, '#6e4e2e');
    c.fillStyle = g;
    c.fillRect(0, 0, W + 20, 140);
    for (let i = 0; i < 50; i++) {
      c.fillStyle = hash(i) > 0.5 ? 'rgba(255,240,210,0.25)' : 'rgba(60,35,15,0.25)';
      c.beginPath();
      c.ellipse(hash(i + 1) * (W + 20), 22 + hash(i + 2) * 110, 2 + hash(i + 3) * 3, 1.5 + hash(i + 4) * 2, 0, 0, Math.PI * 2);
      c.fill();
    }
    const gg = c.createLinearGradient(0, 0, 0, 16);
    gg.addColorStop(0, '#b3e87a');
    gg.addColorStop(1, '#5aa646');
    c.fillStyle = gg;
    c.fillRect(0, 0, W + 20, 14);
    c.fillStyle = 'rgba(255,255,230,0.6)';
    c.fillRect(0, 0, W + 20, 2);
    const sh = c.createLinearGradient(0, 14, 0, 30);
    sh.addColorStop(0, 'rgba(40,20,5,0.3)');
    sh.addColorStop(1, 'rgba(40,20,5,0)');
    c.fillStyle = sh;
    c.fillRect(0, 14, W + 20, 16);
  });
}

function puffSprite() {
  return sprite('stack:puff', 110, 70, (c) => {
    const g = c.createLinearGradient(0, 10, 0, 64);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#c9d8f0');
    c.fillStyle = g;
    c.shadowColor = 'rgba(255,255,255,0.7)';
    c.shadowBlur = 10;
    c.beginPath();
    c.moveTo(42, 44);
    c.arc(22, 44, 20, 0, Math.PI * 2);
    c.moveTo(72, 34);
    c.arc(48, 34, 24, 0, Math.PI * 2);
    c.moveTo(92, 44);
    c.arc(74, 44, 18, 0, Math.PI * 2);
    c.fill();
  });
}

function cloud(c, x, y) {
  c.drawImage(puffSprite(), x - 22, y - 44);
}

const SPAD = 10;
// A squashed clone's body, lit and shaded, cached by width and hue.
function slabSprite(w, look, hue) {
  const wq = Math.max(2, Math.round(w));
  const h = SLAB_H - 4;
  return sprite(`stack:slab:${look.color}:${look.dark}:${wq}:${hue}`, wq + SPAD * 2, h + SPAD * 2, (c) => {
    const left = SPAD;
    const topY = SPAD;
    const r = Math.min(wq / 2, h * 0.45);
    const base = shift(look.color, hue);
    const dark = shift(look.dark, hue);
    // underside rim
    c.fillStyle = dark;
    rr(c, left, topY + h * 0.2, wq, h * 0.8, r);
    c.fill();
    // top face, lit from above
    const g = c.createLinearGradient(0, topY, 0, topY + h * 0.84);
    g.addColorStop(0, mixc(base, '#ffffff', 0.35));
    g.addColorStop(0.45, base);
    g.addColorStop(1, mixc(base, '#000000', 0.12));
    c.fillStyle = g;
    rr(c, left, topY, wq, h * 0.84, r);
    c.fill();
    c.save();
    rr(c, left, topY, wq, h * 0.84, r);
    c.clip();
    // side shading for roundness
    const side = c.createLinearGradient(left, 0, left + wq, 0);
    side.addColorStop(0, 'rgba(255,255,255,0.18)');
    side.addColorStop(0.12, 'rgba(255,255,255,0)');
    side.addColorStop(0.88, 'rgba(0,0,0,0)');
    side.addColorStop(1, 'rgba(0,0,0,0.18)');
    c.fillStyle = side;
    c.fillRect(left, topY, wq, h);
    c.restore();
    // a glossy specular streak and a thin rim of light on top
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath();
    c.ellipse(left + Math.min(wq * 0.22, 40), topY + h * 0.18, Math.min(wq * 0.13, 24), h * 0.07, -0.12, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.45)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(left + r, topY + 1);
    c.lineTo(left + wq - r, topY + 1);
    c.stroke();
  });
}

// A squashed button clone, centered on (x, y), with a face.
function clone(c, x, y, w, look, hue, mood, t) {
  const h = SLAB_H - 4;
  const topY = y - h / 2;
  const spr = slabSprite(w, look, hue);
  c.drawImage(spr, x - w / 2 - SPAD, topY - SPAD, w + SPAD * 2, h + SPAD * 2);
  if (w > 14) face(c, x, topY + h * 0.4, Math.min(1, w / 70), mood, t);
}

function mixc(a, b, k) {
  const A = rgb(a);
  const B = rgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
}

// A pale beam from the swinging clone down to the tower top.
function beam(c, x, y0, y1, w) {
  const s = sprite('stack:beam', 64, 4, (k) => {
    const g = k.createLinearGradient(0, 0, 64, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    k.fillStyle = g;
    k.fillRect(0, 0, 64, 4);
  });
  c.drawImage(s, x - w / 2, y0, w, y1 - y0);
}
