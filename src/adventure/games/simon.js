import { W, H, pick, clamp, dist, text, drawBobby, drawScore, Mouth, Sparks, sprite, layer, vignette, glow, shadow, rgba, hash } from '../kit';

// Copy Me: the button plays a tune on its four friends, you play it back.
const CX = W / 2;
const CY = H * 0.58;
const REACH = 150; // how far each pad sits from the middle
const PAD = 128;
const ME_SIZE = 78;
const LIT = 0.22; // how long a pad you tap stays lit

// up, right, down, left, so the arrow keys map straight onto them
const PADS = [
  { dx: 0, dy: -1, color: '#6fd08c', dark: '#46a464', freq: 262 },
  { dx: 1, dy: 0, color: '#ff6b6b', dark: '#c94848', freq: 330 },
  { dx: 0, dy: 1, color: '#ffd166', dark: '#d1a33a', freq: 392 },
  { dx: -1, dy: 0, color: '#5fa8ff', dark: '#3b7fd1', freq: 523 },
];
const KEYS = {
  ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3,
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
  Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3,
};

const START = ['Watch closely. Or don\'t.', 'Try to keep up.', 'This is my song.'];
const RIGHT = ['Lucky.', 'Fine. Longer then.', 'Hmph.', 'That was the easy part.', 'Stop remembering things.'];
const WAIT = ['I\'m not done!', 'Wait your turn.', 'Rude. I\'m performing.'];
const WRONG = ['Wrong. Obviously.', 'Goldfish memory. Classic.', 'Ha! HA!', 'I knew you would.'];

export default function simon({ look, sound }) {
  const pads = PADS.map((p) => ({ ...p, x: CX + p.dx * REACH, y: CY + p.dy * REACH, lit: 0, squash: 0, look: { ...look, color: p.color, dark: p.dark } }));
  const seq = [];
  const mouth = new Mouth();
  const sparks = new Sparks();
  let mode = 'wait'; // wait (before a round), show (the button plays), copy (your turn)
  let timer = 1.2;
  let step = 0; // which note of the sequence is next, while showing or copying
  let t = 0;
  let squash = 0;
  let wrongPad = -1;
  let wrongAt = 0; // when the wrong pad was hit, for the red flash

  // notes get shorter as the tune gets longer
  const noteLen = () => clamp(0.55 - g.score * 0.035, 0.24, 0.55);
  const gapLen = () => noteLen() * 0.45;

  const light = (i, sec) => {
    pads[i].lit = sec;
    sound.beep(pads[i].freq);
  };

  const nextRound = () => {
    seq.push(Math.floor(Math.random() * pads.length));
    mode = 'wait';
    timer = 0.9;
  };

  const press = (i) => {
    if (g.over || i == null) return;
    if (mode !== 'copy') {
      mouth.maybe(WAIT, 0.6, 1.2);
      return;
    }
    if (i !== seq[step]) {
      g.over = true;
      wrongPad = i;
      pads[i].lit = 0;
      sound.bad();
      sparks.burst(pads[i].x, pads[i].y, '#ff3a4a', 12);
      wrongAt = t;
      mouth.say(pick(WRONG), 3);
      return;
    }
    light(i, LIT);
    pads[i].squash = 0.15;
    step++;
    if (step === seq.length) {
      g.score++;
      squash = 0.2;
      sound.pop();
      sparks.float(CX, CY - ME_SIZE * 0.8, '+1');
      sparks.burst(pads[i].x, pads[i].y, pads[i].color, 10);
      mouth.maybe(RIGHT, 0.6);
      nextRound();
      timer = 1.1; // let the last note ring before the next tune
    }
  };

  const g = {
    score: 0,
    over: false,
    down(x, y) {
      // whichever pad is closest, as long as the tap is near one
      let best = null;
      let bestD = PAD * 0.62;
      pads.forEach((p, i) => {
        const d = dist(x, y, p.x, p.y);
        if (d < bestD) {
          best = i;
          bestD = d;
        }
      });
      press(best);
    },
    key(code) {
      press(KEYS[code]);
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      squash = Math.max(0, squash - dt);
      for (const p of pads) {
        p.lit = Math.max(0, p.lit - dt);
        p.squash = Math.max(0, p.squash - dt);
      }
      if (g.over) return;

      if (mode === 'copy') return;
      timer -= dt;
      if (timer > 0) return;
      if (mode === 'wait') {
        mode = 'show';
        step = 0;
        timer = 0.15;
        if (!g.score) mouth.say(pick(START), 1.6);
      } else if (step < seq.length) {
        light(seq[step], noteLen());
        squash = 0.12;
        step++;
        timer = noteLen() + gapLen();
      } else {
        mode = 'copy';
        step = 0;
      }
    },

    draw(c) {
      // a dark stage with a glowing dance floor, lit by whatever is playing
      c.drawImage(stageArt(), 0, 0, W, H);
      for (let i = 0; i < 9; i++) {
        const bx = hash(i * 3.3) * W;
        const by = 170 + hash(i * 5.1) * 520 + Math.sin(t * 0.4 + i) * 14;
        glow(c, bx, by, 26 + hash(i + 2) * 40, PADS[i % 4].color, 0.12 + Math.sin(t * 0.9 + i * 2.1) * 0.06);
      }

      const playing = pads.findIndex((p) => p.lit);
      const hot = playing >= 0 ? pads[playing] : null;
      const heat = hot ? Math.min(1, hot.lit * 6) : 0;
      // the floor's neon rim takes the colour of the note being played
      c.globalAlpha = 0.55 + Math.sin(t * 2) * 0.1;
      c.drawImage(ringArt('#8f7bff'), CX - RING - 40, CY - RING - 40);
      if (hot) {
        c.globalAlpha = heat;
        c.drawImage(ringArt(hot.color), CX - RING - 40, CY - RING - 40);
      }
      c.globalAlpha = 1;

      // while the button plays, a beam of light runs from it to the pad
      if (hot && mode === 'show') {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.lineCap = 'round';
        c.strokeStyle = hot.color;
        c.globalAlpha = heat * 0.25;
        c.lineWidth = 16;
        c.beginPath();
        c.moveTo(CX, CY);
        c.lineTo(hot.x, hot.y);
        c.stroke();
        c.globalAlpha = heat * 0.7;
        c.lineWidth = 3;
        c.stroke();
        c.restore();
      }

      pads.forEach((p, i) => {
        const wrong = i === wrongPad;
        const k = p.lit ? Math.min(1, p.lit * 6) : 0;
        // each pad sits on its own coloured light, which flares when it plays
        c.globalAlpha = 0.35 + k * 0.65;
        c.drawImage(padBase(p.color), p.x - PAD * 0.62, p.y + PAD * 0.05);
        c.globalAlpha = 1;
        if (k) glow(c, p.x, p.y, PAD * 1.05, p.color, k * 0.85);
        if (wrong) glow(c, p.x, p.y, PAD * 1.15, '#ff2a3a', 0.85 + Math.sin(t * 20) * 0.15);
        drawBobby(c, p.x + (wrong ? Math.sin(t * 50) * 3 : 0), p.y, PAD, {
          look: p.look,
          t: t + i * 1.3,
          squash: p.lit ? -0.06 : p.squash,
          mood: wrong ? 'worried' : p.lit ? 'shout' : mode === 'copy' ? 'calm' : 'closed',
          alpha: p.lit || mode === 'copy' || g.over ? 1 : 0.8,
        });
        // which key plays it
        const kx = p.x + p.dx * PAD * 0.58;
        const ky = p.y + p.dy * PAD * 0.62;
        c.fillStyle = 'rgba(10, 6, 24, 0.55)';
        c.beginPath();
        c.arc(kx, ky, 11, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = rgba(p.color, 0.5 + k * 0.5);
        c.lineWidth = 1.5;
        c.stroke();
        text(c, String(i + 1), kx, ky + 1, { size: 13, color: k ? '#fff' : rgba(p.color, 0.95) });
      });

      // the button in the middle leans toward whatever it is playing, under a spotlight
      const lean = mode === 'show' && playing >= 0 ? pads[playing].dx * 0.25 : 0;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.5 + heat * 0.3;
      c.drawImage(spotArt(), CX - 110, 0, 220, CY + 40);
      c.restore();
      shadow(c, CX, CY + ME_SIZE * 0.5, ME_SIZE * 0.6, 0.45);
      drawBobby(c, CX, CY, ME_SIZE, {
        look,
        t,
        squash,
        angle: lean,
        facing: lean < 0 ? -1 : 1,
        mood: g.over ? 'smug' : mode === 'show' ? 'happy' : mode === 'copy' ? 'worried' : 'angry',
      });

      sparks.draw(c);
      vignette(c, 0.5, '#05020c');
      if (g.over && t - wrongAt < 0.8) {
        c.globalAlpha = 1 - (t - wrongAt) / 0.8;
        vignette(c, 0.9, '#ff1a2e');
        c.globalAlpha = 1;
      }
      mouth.draw(c, CX, CY - ME_SIZE * 0.6);

      const sub = g.over ? 'Wrong pad.' : mode === 'copy' ? `Your turn: ${step}/${seq.length}` : 'Watch…';
      drawScore(c, g.score, sub);
    },
  };
  nextRound();
  return g;
}

/* ---------- cached art ---------- */
const RING = REACH + PAD * 0.62; // the dance floor's radius

function stageArt() {
  return layer('simon:stage', (c) => {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1d1240');
    g.addColorStop(0.5, '#140c30');
    g.addColorStop(1, '#0a0618');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    // a soft violet wash from above
    const top = c.createRadialGradient(CX, 0, 0, CX, 0, 520);
    top.addColorStop(0, 'rgba(150,110,255,0.35)');
    top.addColorStop(1, 'rgba(150,110,255,0)');
    c.fillStyle = top;
    c.fillRect(0, 0, W, H);
    // the floor: a glossy disc with faint grooves
    const f = c.createRadialGradient(CX - 60, CY - 90, 10, CX, CY, RING);
    f.addColorStop(0, '#3e2d78');
    f.addColorStop(0.7, '#241850');
    f.addColorStop(1, '#170f38');
    c.fillStyle = f;
    c.beginPath();
    c.arc(CX, CY, RING, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(180,160,255,0.08)';
    c.lineWidth = 1;
    for (let r = 40; r < RING; r += 24) {
      c.beginPath();
      c.arc(CX, CY, r, 0, Math.PI * 2);
      c.stroke();
    }
    // a sheen across the top of the floor
    const s = c.createLinearGradient(0, CY - RING, 0, CY);
    s.addColorStop(0, 'rgba(255,255,255,0.10)');
    s.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = s;
    c.beginPath();
    c.ellipse(CX, CY - RING * 0.45, RING * 0.8, RING * 0.5, 0, 0, Math.PI * 2);
    c.fill();
  });
}

// The neon rim of the floor in one colour, glow baked in.
function ringArt(color) {
  const size = (RING + 40) * 2;
  return sprite(`simon:ring:${color}`, size, size, (c) => {
    const m = size / 2;
    c.strokeStyle = color;
    c.shadowColor = color;
    c.shadowBlur = 22;
    c.lineWidth = 4;
    c.beginPath();
    c.arc(m, m, RING, 0, Math.PI * 2);
    c.stroke();
    c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,255,255,0.7)';
    c.lineWidth = 1.5;
    c.stroke();
  });
}

// A flat ellipse of coloured light for a pad to stand in.
function padBase(color) {
  return sprite(`simon:base:${color}`, PAD * 1.24, PAD * 0.6, (c) => {
    const w = PAD * 1.24;
    const h = PAD * 0.6;
    c.setTransform(1, 0, 0, h / w, 0, 0);
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, rgba(color, 0.85));
    g.addColorStop(0.45, rgba(color, 0.35));
    g.addColorStop(1, rgba(color, 0));
    c.fillStyle = g;
    c.fillRect(0, 0, w, w);
  });
}

// A soft cone of light from the top of the screen.
function spotArt() {
  return sprite('simon:spot', 110, 240, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 240);
    g.addColorStop(0, 'rgba(200,180,255,0.0)');
    g.addColorStop(0.5, 'rgba(200,180,255,0.12)');
    g.addColorStop(0.85, 'rgba(230,220,255,0.26)');
    g.addColorStop(1, 'rgba(230,220,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(42, 0);
    c.lineTo(68, 0);
    c.lineTo(108, 240);
    c.lineTo(2, 240);
    c.fill();
    // fade the sides
    c.globalCompositeOperation = 'destination-in';
    const s = c.createLinearGradient(0, 0, 110, 0);
    s.addColorStop(0, 'rgba(0,0,0,0)');
    s.addColorStop(0.5, 'rgba(0,0,0,1)');
    s.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = s;
    c.fillRect(0, 0, 110, 240);
  });
}
