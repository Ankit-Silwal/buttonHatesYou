import { drawSky, drawSolid, drawButton, drawKey, cursorShape, adminFace, sword, heart, rr } from '@/reason/draw';
import { drawCursorGuy } from '@/reason/actors';
import { drawAtmosphere } from '@/reason/draw';
import { glow } from '@/reason/fx';
import { W as AW, H as AH, drawBobby, bubble } from '@/adventure/kit';
import { CREATE } from '@/adventure/games';

// The pictures on the Games screen cards, drawn with each game's own drawing
// code. Every painter draws on a 480x270 canvas: paint(c, look) where `look`
// is the outfit from lookOf, which Please Don't and the Adventure games wear.
export const ART_W = 480;
export const ART_H = 270;

const BOBBY = { color: '#e2674f', dark: '#b84a36' }; // Bobby in the story games
const STILL = { time: 2, fx: {} }; // enough of a game state for drawSky / adminFace

// A story game's sky (drawn for its 960x540 screen) squeezed onto the card.
function sky(c, theme, camX = 400) {
  c.save();
  c.scale(ART_W / 960, ART_H / 540);
  drawSky(c, { ...STILL, level: { theme }, cam: { x: camX, y: 0 } });
  c.restore();
}

// Draw a story-game character `k` times its in-game size, standing on y.
function big(c, k, x, y, fn) {
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  fn();
  c.restore();
}

const STORY = {
  // Bobby, his new best friend Cursor, Tabby, and Bella with a heart
  'how-i-met-your-cursor'(c) {
    sky(c, 'sunset', 300);
    drawSolid(c, { kind: 'grass', x: 0, y: 214, w: ART_W, h: 60 }, STILL);
    // golden-hour light pooling behind the couple
    glow(c, 300, 170, 230, '#ff9a6b', 0.35);
    glow(c, 330, 200, 120, '#ffc2d6', 0.3);
    big(c, 2.2, 36, 214, () => drawKey(c, { x: 0, y: -40, w: 44, h: 40, color: '#5b9bd5', dark: '#3b77ad', label: 'TAB', mood: 'happy', t: 0.5 }));
    big(c, 2.6, 150, 214, () => drawButton(c, { x: 0, y: -40, w: 38, h: 40, ...BOBBY, mood: 'happy', t: 0.5 }));
    big(c, 2.6, 368, 214, () => drawButton(c, { x: 0, y: -40, w: 30, h: 40, color: '#f39ac0', dark: '#cc6f97', bow: true, lashes: true, mood: 'happy', facing: -1, t: 0.5 }));
    // Cursor's light trail: a swoop in from the sky, ending at his tip
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const v = 1 - u;
      pts.push([v * v * 40 + 2 * v * u * 170 + u * u * 276, v * v * 26 + 2 * v * u * -10 + u * u * 112]);
    }
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) {
      const u = i / pts.length;
      c.strokeStyle = `rgba(160,220,255,${u * u * 0.6})`;
      c.lineWidth = 1 + u * 9;
      c.beginPath();
      c.moveTo(pts[i - 1][0], pts[i - 1][1]);
      c.lineTo(pts[i][0], pts[i][1]);
      c.stroke();
    }
    c.restore();
    for (const [x, y, r] of [[120, 40, 6], [196, 30, 7], [236, 70, 5], [330, 40, 5]]) glow(c, x, y, r * 3, '#ffffff', 0.7);
    glow(c, 290, 130, 70, '#9fdcff', 0.75);
    big(c, 2.6, 268, 96, () => drawCursorGuy(c, { x: 0, y: 0, w: 26 }, { time: 0 }));
    // hearts, glowing
    glow(c, 410, 92, 40, '#ff4f7b', 0.6);
    heart(c, 410, 92, 13, '#ff4f7b', '#c2304f');
    glow(c, 438, 64, 24, '#ff7a9a', 0.5);
    heart(c, 438, 64, 8, '#ff7a9a');
    // drifting petals
    c.fillStyle = '#ffc2d6';
    for (const [x, y, a] of [[60, 120, 0.4], [96, 180, 1.2], [200, 22, 2], [356, 150, 0.8], [452, 140, 2.4], [300, 236, 1.6], [24, 40, 0.2]]) {
      c.save();
      c.translate(x, y);
      c.rotate(a);
      c.beginPath();
      c.ellipse(0, 0, 4, 2.2, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    c.save();
    c.scale(ART_W / 960, ART_H / 540);
    drawAtmosphere(c, { ...STILL, level: { theme: 'sunset' }, cam: { x: 300, y: 0 } });
    c.restore();
  },

  // Bobby with a sword, the Player's giant cursor over the kingdom, the Admin
  'the-reason'(c) {
    sky(c, 'tower', 900);
    drawSolid(c, { kind: 'metal', x: 0, y: 220, w: ART_W, h: 60 }, STILL);
    // THE ADMIN's green light, the cursor's cold halo, Bobby's red anger
    glow(c, 400, 120, 130, '#2fd690', 0.65);
    big(c, 3.4, 400, 120, () => adminFace(c, 0, 0, 16, STILL));
    glow(c, 205, 70, 100, '#9fdcff', 0.5);
    big(c, 4.2, 170, 18, () => cursorShape(c, 'rgba(255,255,255,0.92)', '#111'));
    glow(c, 123, 170, 90, '#ff2040', 0.6);
    c.save();
    c.translate(186, 196);
    c.rotate(0.6);
    sword(c, 'steel', 0, 0, 2.4);
    c.restore();
    glow(c, 218, 132, 14, '#ffffff', 0.9);
    big(c, 2.8, 70, 220, () => drawButton(c, { x: 0, y: -40, w: 38, h: 40, ...BOBBY, mood: 'angry', pendant: true, t: 0.5 }));
    c.save();
    c.scale(ART_W / 960, ART_H / 540);
    drawAtmosphere(c, { ...STILL, level: { theme: 'tower' }, cam: { x: 900, y: 0 } });
    c.restore();
  },

  // the button in its room, begging the cursor not to press it
  'please-dont'(c, look) {
    const lin = (y0, y1, stops) => {
      const g = c.createLinearGradient(0, y0, 0, y1);
      stops.forEach(([o, col]) => g.addColorStop(o, col));
      return g;
    };
    const rad = (x, y, r, stops) => {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      stops.forEach(([o, col]) => g.addColorStop(o, col));
      return g;
    };
    // wall: warm plaster, faint wallpaper stripes, light pooling from above
    c.fillStyle = lin(0, 200, [[0, '#f8ecdb'], [1, '#ecd5b8']]);
    c.fillRect(0, 0, ART_W, 200);
    c.fillStyle = 'rgba(255,255,255,0.25)';
    for (let x = 14; x < ART_W; x += 28) c.fillRect(x, 0, 2, 200);
    c.fillStyle = rad(240, -20, 260, [[0, 'rgba(255,246,226,0.9)'], [1, 'rgba(255,246,226,0)']]);
    c.fillRect(0, 0, ART_W, 200);
    // wainscot
    c.fillStyle = lin(158, 200, [[0, '#ecd6b9'], [1, '#e0c4a1']]);
    c.fillRect(0, 158, ART_W, 42);
    c.fillStyle = '#fbf2e4';
    c.fillRect(0, 156, ART_W, 4);
    c.fillStyle = 'rgba(120,80,50,0.14)';
    for (let x = 60; x < ART_W; x += 60) c.fillRect(x, 160, 2, 40);
    // floor: wood planks running toward you
    c.fillStyle = lin(200, ART_H, [[0, '#b98d66'], [1, '#dab28b']]);
    c.fillRect(0, 200, ART_W, 70);
    c.strokeStyle = 'rgba(90,52,28,0.22)';
    c.lineWidth = 1.5;
    for (let i = -8; i <= 8; i++) {
      c.beginPath();
      c.moveTo(240 + i * 34, 200);
      c.lineTo(240 + i * 80, ART_H);
      c.stroke();
    }
    c.fillStyle = lin(200, 214, [[0, 'rgba(80,45,25,0.3)'], [1, 'rgba(80,45,25,0)']]);
    c.fillRect(0, 200, ART_W, 14);
    c.fillStyle = '#f6e8d4';
    c.fillRect(0, 196, ART_W, 5);
    // an arched window with the sky behind it, and its sunbeam
    const wx = 334;
    const wy = 34;
    const ww = 104;
    const wh = 118;
    const arch = () => {
      c.beginPath();
      c.moveTo(wx, wy + wh);
      c.lineTo(wx, wy + ww / 2);
      c.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0);
      c.lineTo(wx + ww, wy + wh);
      c.closePath();
    };
    c.save();
    c.shadowColor = 'rgba(110,70,40,0.25)';
    c.shadowBlur = 16;
    c.shadowOffsetY = 8;
    c.fillStyle = '#fbf3e6';
    c.lineWidth = 14;
    c.strokeStyle = '#fbf3e6';
    arch();
    c.stroke();
    c.restore();
    arch();
    c.fillStyle = lin(wy, wy + wh, [[0, '#8cc8f0'], [0.6, '#c6e6f7'], [1, '#fde9c8']]);
    c.fill();
    c.fillStyle = rad(wx + 70, wy + 34, 22, [[0, '#fff7d6'], [0.5, 'rgba(255,230,160,0.7)'], [1, 'rgba(255,230,160,0)']]);
    c.fillRect(wx, wy, ww, wh);
    c.fillStyle = '#fbf3e6';
    c.fillRect(wx + ww / 2 - 3, wy, 6, wh);
    c.fillRect(wx, wy + wh * 0.55 - 3, ww, 6);
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.beginPath();
    c.moveTo(wx + 8, wy + wh);
    c.lineTo(wx + 30, wy + 20);
    c.lineTo(wx + 44, wy + 20);
    c.lineTo(wx + 22, wy + wh);
    c.fill();
    c.fillStyle = lin(wy + wh, ART_H, [[0, 'rgba(255,240,200,0.4)'], [1, 'rgba(255,240,200,0)']]);
    c.beginPath();
    c.moveTo(wx, wy + wh);
    c.lineTo(wx + ww, wy + wh);
    c.lineTo(wx + 40, ART_H);
    c.lineTo(wx - 120, ART_H);
    c.fill();
    // rug, then a soft glow and shadow so the button sits in the room
    c.save();
    c.translate(190, 236);
    c.scale(1, 0.16);
    c.fillStyle = rad(0, 0, 120, [[0, '#e2674f'], [0.18, '#e2674f'], [0.2, '#f0c36d'], [0.24, '#c45a43'], [0.52, '#c45a43'], [0.55, '#f3d9a8'], [0.6, '#b84a36'], [0.86, '#b84a36'], [0.9, '#f0c36d'], [0.94, '#9c3c2b'], [1, '#9c3c2b']]);
    c.beginPath();
    c.arc(0, 0, 120, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.fillStyle = rad(190, 150, 120, [[0, 'rgba(255,214,160,0.55)'], [1, 'rgba(255,214,160,0)']]);
    c.fillRect(60, 30, 260, 240);
    c.fillStyle = 'rgba(60,30,20,0.28)';
    c.beginPath();
    c.ellipse(190, 222, 50, 9, 0, 0, Math.PI * 2);
    c.fill();
    drawBobby(c, 190, 160, 110, { look, mood: 'worried', tears: true, t: 0.1 });
    bubble(c, 190, 96, 'Please don’t.', { size: 20 });
    c.save();
    c.translate(300, 150);
    c.rotate(-0.25);
    c.scale(3.2, 3.2);
    cursorShape(c, '#fff', '#111');
    c.restore();
  },
};

// Adventure games: run the real game for `sec` seconds (tapping at `taps`)
// with no sound and a seeded Math.random, so a card always shows the same
// moment, and draw one frame from `top` down.
const QUIET = new Proxy({}, { get: () => () => {} });
const ADVENTURE = {
  flap: { sec: 1.2, top: 40, taps: [0.1, 0.45, 0.8, 1.1] },
  pop: { sec: 0.5, top: 300 },
  catch: { sec: 2.4, top: 520 },
  simon: { sec: 0.4, top: 230 },
  hop: { sec: 0.5, top: 300 },
  whack: { sec: 3, top: 400 },
  run: { sec: 1.8, top: 420 },
  stack: { sec: 0.5, top: 500 },
  slice: { sec: 0.8, top: 530, taps: [0] },
  'button-run': { sec: 4.6, top: 395 },
};

function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function adventure(id, { sec, top, taps = [] }) {
  return (c, look) => {
    const random = Math.random;
    Math.random = seeded(7);
    try {
      const game = CREATE[id]({ look, sound: QUIET, keys: new Set() });
      const dt = 1 / 60;
      const left = [...taps];
      for (let t = 0; t < sec; t += dt) {
        while (left.length && t >= left[0]) {
          left.shift();
          game.down?.(AW / 2, AH / 2);
          game.up?.(AW / 2, AH / 2);
          game.key?.('Space');
        }
        game.update(dt);
      }
      const k = ART_W / AW;
      c.save();
      c.scale(k, k);
      c.translate(0, -top);
      game.draw(c);
      c.restore();
    } finally {
      Math.random = random;
    }
  };
}

export const PAINT = {
  ...STORY,
  ...Object.fromEntries(Object.entries(ADVENTURE).map(([id, o]) => [id, adventure(id, o)])),
};
