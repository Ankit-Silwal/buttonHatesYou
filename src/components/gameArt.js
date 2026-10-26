import { drawSky, drawSolid, drawButton, drawKey, cursorShape, adminFace, sword, heart, rr } from '@/reason/draw';
import { drawCursorGuy } from '@/reason/actors';
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
    sky(c, 'sunset');
    drawSolid(c, { kind: 'grass', x: 0, y: 214, w: ART_W, h: 60 }, STILL);
    big(c, 2.2, 36, 214, () => drawKey(c, { x: 0, y: -40, w: 44, h: 40, color: '#5b9bd5', dark: '#3b77ad', label: 'TAB', mood: 'happy', t: 0.5 }));
    big(c, 2.6, 150, 214, () => drawButton(c, { x: 0, y: -40, w: 38, h: 40, ...BOBBY, mood: 'happy', t: 0.5 }));
    big(c, 2.6, 268, 96, () => drawCursorGuy(c, { x: 0, y: 0, w: 26 }, { time: 0 }));
    big(c, 2.6, 368, 214, () => drawButton(c, { x: 0, y: -40, w: 30, h: 40, color: '#f39ac0', dark: '#cc6f97', bow: true, lashes: true, mood: 'happy', facing: -1, t: 0.5 }));
    heart(c, 410, 92, 13, '#ff4f7b', '#c2304f');
    heart(c, 438, 64, 8, '#ff7a9a');
  },

  // Bobby with a sword, the Player's giant cursor over the kingdom, the Admin
  'the-reason'(c) {
    sky(c, 'tower', 900);
    drawSolid(c, { kind: 'metal', x: 0, y: 220, w: ART_W, h: 60 }, STILL);
    big(c, 3.4, 400, 120, () => adminFace(c, 0, 0, 16, STILL));
    big(c, 4.2, 170, 18, () => cursorShape(c, 'rgba(255,255,255,0.92)', '#111'));
    c.save();
    c.translate(186, 196);
    c.rotate(0.6);
    sword(c, 'steel', 0, 0, 2.4);
    c.restore();
    big(c, 2.8, 70, 220, () => drawButton(c, { x: 0, y: -40, w: 38, h: 40, ...BOBBY, mood: 'angry', pendant: true, t: 0.5 }));
  },

  // the button in its room, begging the cursor not to press it
  'please-dont'(c, look) {
    c.fillStyle = '#f6e3cf';
    c.fillRect(0, 0, ART_W, ART_H);
    c.fillStyle = '#e8c9a8';
    c.fillRect(0, 200, ART_W, 70);
    c.fillStyle = '#d4ad85';
    c.fillRect(0, 200, ART_W, 5);
    // a window and a little picture on the wall
    c.fillStyle = '#bfe3ff';
    rr(c, 330, 40, 110, 80, 8);
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 6;
    c.strokeRect(330, 40, 110, 80);
    c.beginPath();
    c.moveTo(385, 40);
    c.lineTo(385, 120);
    c.stroke();
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
