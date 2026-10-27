import { W, H, rand, pick, text, drawBobby, drawScore, Mouth, Sparks, reviveFx, sprite, layer, vignette, glow, softLight, hash } from '../kit';

// Pop Tantrum: tap groups of 2+ same-colored buttons to pop them. 25 taps.
const COLS = 8;
const ROWS = 10;
const CELL = 54;
const GX = (W - COLS * CELL) / 2;
const GY = 168;
const FACE = 44;
const TAPS = 25;
const MORE_TAPS = 10; // a paid Continue adds this many
const GOAL = 1500; // matches the catalog, only used for the ending mood
const FALL = 2600;
const ME = { x: 74, y: H - 46, size: 58 };

// the cousins, as { color, dark } pairs for drawBobby
const PALETTE = [
  { color: '#ff6b6b', dark: '#c94848' },
  { color: '#ffd166', dark: '#d1a33a' },
  { color: '#6fd08c', dark: '#46a464' },
  { color: '#5fa8ff', dark: '#3b7fd1' },
  { color: '#b48cff', dark: '#8a62d6' },
];

const SINGLE = ['That one is alone. Like you.', 'Two or more. Can you count?', 'Nope.', 'It takes two, genius.', 'Free tap? Not today.'];
const POPS = ['That was my cousin!', 'Monster.', 'Uncle Gary, no!', 'I will tell Grandma.', 'Rude.', 'Stop popping us!'];
const BIG = ['A WHOLE BRANCH!', 'My family tree!', 'You did that on purpose.'];
const DONE_GOOD = ['You popped my whole family.', 'I hope you are proud.'];
const DONE_BAD = ['Family reunion: saved.', 'Ha. Out of taps.'];

export default function pop({ look, sound }) {
  // cols[x] is a column of cells, bottom first: { k, y, vy, shake }
  const cols = [];
  const popping = [];
  const mouth = new Mouth();
  const sparks = new Sparks();
  let used = 0;
  let taps = TAPS; // grows with each Continue
  let t = 0;
  let squash = 0;
  let sulk = 0; // how long the main button stays upset after a pop

  // the cousins keep the outfit's eyes and scarf; hats and ears would poke into the next row
  const looks = PALETTE.map((p) => ({ ...look, ...p, hat: null, ears: null }));
  const restY = (i) => GY + (ROWS - 1 - i) * CELL + CELL / 2;
  const cellX = (x) => GX + x * CELL + CELL / 2;
  const newCell = (y) => ({ k: Math.floor(Math.random() * PALETTE.length), y, vy: 0, shake: 0 });

  // fill every column up to ROWS, new cells start stacked above the grid
  const refill = () => {
    for (const col of cols) {
      let above = 0;
      while (col.length < ROWS) col.push(newCell(GY - CELL / 2 - CELL * above++));
    }
  };
  for (let x = 0; x < COLS; x++) cols.push([]);
  refill();
  for (const col of cols) col.forEach((cell, i) => (cell.y = restY(i) - 500 - i * 30 - rand(0, 40))); // rain in at the start

  const settled = () => cols.every((col) => col.every((cell, i) => cell.y === restY(i)));

  // every same-colored neighbour of (x, i), as [x, i] pairs
  const groupAt = (x, i) => {
    const k = cols[x][i].k;
    const seen = new Set([x * ROWS + i]);
    const stack = [[x, i]];
    const found = [];
    while (stack.length) {
      const [a, b] = stack.pop();
      found.push([a, b]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const na = a + dx;
        const nb = b + dy;
        if (na < 0 || na >= COLS || nb < 0 || nb >= ROWS) continue;
        if (seen.has(na * ROWS + nb) || cols[na][nb].k !== k) continue;
        seen.add(na * ROWS + nb);
        stack.push([na, nb]);
      }
    }
    return found;
  };

  // with a refilled grid this almost never happens, but just in case
  const anyMove = () => {
    for (let x = 0; x < COLS; x++)
      for (let i = 0; i < ROWS; i++) {
        if (x + 1 < COLS && cols[x + 1][i].k === cols[x][i].k) return true;
        if (i + 1 < ROWS && cols[x][i + 1].k === cols[x][i].k) return true;
      }
    return false;
  };

  const tap = (px, py) => {
    if (g.over || !settled()) return;
    const x = Math.floor((px - GX) / CELL);
    const i = ROWS - 1 - Math.floor((py - GY) / CELL);
    if (x < 0 || x >= COLS || i < 0 || i >= ROWS) return;

    const group = groupAt(x, i);
    if (group.length < 2) {
      cols[x][i].shake = 0.4;
      sound.nope();
      mouth.say(pick(SINGLE), 1.6);
      return;
    }

    const n = group.length;
    const points = n * (n - 1) * 5;
    g.score += points;
    used++;
    squash = 0.2;
    sulk = 1.2;
    sound.pop();
    if (n >= 6) sound.crack();

    let cx = 0;
    let cy = 0;
    const gone = new Set(group.map(([a, b]) => cols[a][b]));
    for (const [a, b] of group) {
      const cell = cols[a][b];
      popping.push({ x: cellX(a), y: cell.y, k: cell.k, life: 0.3 });
      sparks.burst(cellX(a), cell.y, PALETTE[cell.k].color, 5, 180);
      cx += cellX(a) / n;
      cy += cell.y / n;
    }
    sparks.float(cx, cy - 10, `+${points}`);
    for (let a = 0; a < COLS; a++) cols[a] = cols[a].filter((cell) => !gone.has(cell));
    refill();
    if (!anyMove()) for (const col of cols) for (const cell of col) cell.k = Math.floor(Math.random() * PALETTE.length);

    if (used >= taps) {
      g.over = true;
      mouth.say(pick(g.score >= GOAL ? DONE_GOOD : DONE_BAD), 3);
      if (g.score >= GOAL) sound.sob();
      else sound.nope();
    } else if (n >= 6) mouth.say(pick(BIG), 1.8);
    else mouth.maybe(POPS, 0.4);
  };

  const g = {
    score: 0,
    over: false,
    down: tap,

    // a paid Continue: more taps, same board, same score
    revive() {
      g.over = false;
      taps = used + MORE_TAPS;
      sulk = 0;
      reviveFx({ fx: sparks, mouth, sound }, ME.x + 20, ME.y - 30, look.color);
      sparks.float(W - 100, ME.y - 34, `+${MORE_TAPS} taps`, '#aef3ff');
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      squash = Math.max(0, squash - dt);
      sulk = Math.max(0, sulk - dt);
      for (const p of popping) p.life -= dt;
      while (popping.length && popping[0].life <= 0) popping.shift();

      // gravity: every cell falls to its resting row, with a tiny bounce-free landing
      cols.forEach((col) =>
        col.forEach((cell, i) => {
          cell.shake = Math.max(0, cell.shake - dt);
          const rest = restY(i);
          if (cell.y >= rest) return;
          cell.vy += FALL * dt;
          cell.y += cell.vy * dt;
          if (cell.y >= rest) {
            cell.y = rest;
            cell.vy = 0;
          }
        }),
      );
    },

    draw(c) {
      // a deep candy-pink room with drifting bokeh behind a glass tray
      c.drawImage(roomArt(), 0, 0, W, H);
      for (let i = 0; i < 10; i++) {
        const bx = hash(i * 2.7) * W + Math.sin(t * 0.25 + i) * 20;
        const by = (((hash(i * 4.1) * (H + 200) - t * (6 + hash(i) * 10)) % (H + 200)) + H + 200) % (H + 200) - 100;
        softLight(c, bx, by, 30 + hash(i + 5) * 50, PALETTE[i % PALETTE.length].color, 0.18 + Math.sin(t + i) * 0.06);
      }
      c.drawImage(trayArt(), GX - 20, GY - 20);

      // new cells fall in from above, so hide anything outside the tray
      c.save();
      c.beginPath();
      c.rect(GX - 8, GY - 8, COLS * CELL + 16, ROWS * CELL + 16);
      c.clip();
      cols.forEach((col, x) =>
        col.forEach((cell, i) => {
          const falling = cell.y < restY(i);
          const wobble = cell.shake ? Math.sin(cell.shake * 60) * 4 : 0;
          drawBobby(c, cellX(x) + wobble, cell.y, FACE, {
            look: looks[cell.k],
            t: t + x * 0.9 + i * 1.7, // so they don't all blink together
            mood: cell.shake ? 'angry' : falling ? 'worried' : 'calm',
          });
        }),
      );
      for (const p of popping) {
        const k = p.life / 0.3;
        glow(c, p.x, p.y, FACE * (0.9 + (1 - k) * 0.9), PALETTE[p.k].color, k * 0.9);
        drawBobby(c, p.x, p.y, FACE * (1 + (1 - k) * 0.6), { look: looks[p.k], mood: 'shout', alpha: k, t });
      }
      c.restore();
      // the tray's glass: a sheen over the top of everything inside it
      c.drawImage(glassArt(), GX - 8, GY - 8);

      // the main button sulks at the bottom, on a little spotlight
      softLight(c, ME.x, ME.y + ME.size * 0.3, ME.size * 1.3, '#ffb3dd', 0.35);
      drawBobby(c, ME.x, ME.y, ME.size, {
        look,
        t,
        squash,
        mood: g.over ? (g.score >= GOAL ? 'sad' : 'smug') : sulk ? 'shout' : mouth.line ? 'smug' : 'angry',
        tears: g.over && g.score >= GOAL,
      });
      // taps left, on a glowing chip that turns red near the end
      const left = taps - used;
      const low = left <= 5;
      const pulse = low && !g.over ? 0.5 + Math.sin(t * 8) * 0.5 : 0;
      if (low) glow(c, W - 100, ME.y, 80, '#ff3a5a', 0.35 + pulse * 0.35);
      c.fillStyle = low ? 'rgba(90, 8, 30, 0.75)' : 'rgba(50, 10, 50, 0.55)';
      c.beginPath();
      c.roundRect(W - 186, ME.y - 22, 172, 44, 22);
      c.fill();
      c.strokeStyle = low ? 'rgba(255,120,140,0.8)' : 'rgba(255,190,230,0.45)';
      c.lineWidth = 1.5;
      c.stroke();
      text(c, `${left} tap${left === 1 ? '' : 's'} left`, W - 100, ME.y + 1, { size: 21, color: low ? '#ffd0d8' : '#ffe6f4', weight: 700 });

      sparks.draw(c);
      vignette(c, 0.4, '#1a0420');
      mouth.draw(c, ME.x, ME.y - ME.size * 0.6);

      if (used || g.score) drawScore(c, g.score);
      else drawScore(c, 'Tap a group', 'Two or more of the same color.');
    },
  };
  return g;
}

/* ---------- cached art ---------- */
const TW = COLS * CELL + 16; // the tray, with its 8px border
const TH = ROWS * CELL + 16;

function roomArt() {
  return layer('pop:room', (c) => {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#ff7cc0');
    g.addColorStop(0.35, '#d24a9a');
    g.addColorStop(0.75, '#7a2470');
    g.addColorStop(1, '#3e1046');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    // a warm light from the top centre
    const l = c.createRadialGradient(W / 2, 40, 0, W / 2, 40, 420);
    l.addColorStop(0, 'rgba(255,230,245,0.45)');
    l.addColorStop(1, 'rgba(255,230,245,0)');
    c.fillStyle = l;
    c.fillRect(0, 0, W, H);
    // soft diagonal stripes, like candy wrapping
    c.globalAlpha = 0.05;
    c.fillStyle = '#ffffff';
    for (let x = -H; x < W; x += 56) {
      c.beginPath();
      c.moveTo(x, H);
      c.lineTo(x + 26, H);
      c.lineTo(x + 26 + H * 0.6, 0);
      c.lineTo(x + H * 0.6, 0);
      c.fill();
    }
    c.globalAlpha = 1;
  });
}

// The tray: a recessed glass panel with a slot under every cell.
function trayArt() {
  return sprite('pop:tray', TW + 40, TH + 40, (c) => {
    c.translate(20, 20);
    // drop shadow, baked once
    c.shadowColor = 'rgba(40,0,40,0.55)';
    c.shadowBlur = 24;
    c.shadowOffsetY = 10;
    c.fillStyle = 'rgba(60,10,60,0.5)';
    c.beginPath();
    c.roundRect(0, 0, TW, TH, 20);
    c.fill();
    c.shadowColor = 'transparent';
    // the panel: darker at the bottom
    const g = c.createLinearGradient(0, 0, 0, TH);
    g.addColorStop(0, 'rgba(70,14,70,0.55)');
    g.addColorStop(1, 'rgba(30,4,40,0.7)');
    c.fillStyle = g;
    c.fill();
    // the slots
    for (let x = 0; x < COLS; x++)
      for (let y = 0; y < ROWS; y++) {
        const cx = 8 + x * CELL + CELL / 2;
        const cy = 8 + y * CELL + CELL / 2;
        const s = c.createRadialGradient(cx, cy - 4, 4, cx, cy, CELL * 0.46);
        s.addColorStop(0, 'rgba(0,0,0,0.25)');
        s.addColorStop(0.8, 'rgba(0,0,0,0.1)');
        s.addColorStop(1, 'rgba(255,200,240,0.08)');
        c.fillStyle = s;
        c.beginPath();
        c.arc(cx, cy, CELL * 0.46, 0, Math.PI * 2);
        c.fill();
      }
    // an inner shadow along the top edge, and a bright rim
    c.save();
    c.beginPath();
    c.roundRect(0, 0, TW, TH, 20);
    c.clip();
    const top = c.createLinearGradient(0, 0, 0, 30);
    top.addColorStop(0, 'rgba(20,0,30,0.45)');
    top.addColorStop(1, 'rgba(20,0,30,0)');
    c.fillStyle = top;
    c.fillRect(0, 0, TW, 30);
    c.restore();
    c.strokeStyle = 'rgba(255,190,235,0.55)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.roundRect(0.75, 0.75, TW - 1.5, TH - 1.5, 19);
    c.stroke();
  });
}

// A faint glass reflection laid over the tray's contents.
function glassArt() {
  return sprite('pop:glass', TW, TH, (c) => {
    c.beginPath();
    c.roundRect(0, 0, TW, TH, 20);
    c.clip();
    const g = c.createLinearGradient(0, 0, TW, TH);
    g.addColorStop(0, 'rgba(255,255,255,0.12)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.03)');
    g.addColorStop(0.36, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, TW, TH);
  });
}
