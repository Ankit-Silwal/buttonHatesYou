import { W, H, pick, clamp, dist, text, drawBobby, drawScore, backdrop, Mouth, Sparks } from '../kit';

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
      sparks.burst(pads[i].x, pads[i].y, '#2b1d17', 12);
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
      backdrop(c, '#9b86e8', '#e6defc');

      // a soft stage under the five of them
      c.fillStyle = 'rgba(60, 30, 120, 0.15)';
      c.beginPath();
      c.arc(CX, CY, REACH + PAD * 0.62, 0, Math.PI * 2);
      c.fill();

      pads.forEach((p, i) => {
        if (p.lit) {
          c.fillStyle = p.color;
          c.globalAlpha = 0.45;
          c.beginPath();
          c.arc(p.x, p.y, PAD * 0.68, 0, Math.PI * 2);
          c.fill();
          c.globalAlpha = 1;
        }
        const wrong = i === wrongPad;
        drawBobby(c, p.x + (wrong ? Math.sin(t * 50) * 3 : 0), p.y, PAD, {
          look: p.look,
          t: t + i * 1.3,
          squash: p.lit ? -0.06 : p.squash,
          mood: wrong ? 'worried' : p.lit ? 'shout' : mode === 'copy' ? 'calm' : 'closed',
          alpha: p.lit || mode === 'copy' || g.over ? 1 : 0.8,
        });
        // which key plays it
        text(c, String(i + 1), p.x + p.dx * PAD * 0.58, p.y + p.dy * PAD * 0.62, { size: 16, color: 'rgba(60, 30, 120, 0.55)' });
      });

      // the button in the middle leans toward whatever it is playing
      const playing = pads.findIndex((p) => p.lit);
      const lean = mode === 'show' && playing >= 0 ? pads[playing].dx * 0.25 : 0;
      drawBobby(c, CX, CY, ME_SIZE, {
        look,
        t,
        squash,
        angle: lean,
        facing: lean < 0 ? -1 : 1,
        mood: g.over ? 'smug' : mode === 'show' ? 'happy' : mode === 'copy' ? 'worried' : 'angry',
      });

      sparks.draw(c);
      mouth.draw(c, CX, CY - ME_SIZE * 0.6);

      const sub = g.over ? 'Wrong pad.' : mode === 'copy' ? `Your turn: ${step}/${seq.length}` : 'Watch…';
      drawScore(c, g.score, sub);
    },
  };
  nextRound();
  return g;
}
