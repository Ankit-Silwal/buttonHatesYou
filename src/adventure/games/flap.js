import { W, H, rand, clamp, rr, drawBobby, drawScore, backdrop, Mouth, Sparks } from '../kit';

// Flappy Regret: tap to flap the button through gaps in the pipes.
const GRAVITY = 1500;
const FLAP = -460;
const SPEED = 170;
const PIPE_W = 78;
const SPACING = 250;
const GROUND = H - 70;
const SIZE = 50;

const FLAPS = ['Stop that.', 'Wheee… no.', 'I hate heights.', 'My wings hurt.', 'Put me down!', 'Why me?'];
const CRASH = ['OW.', 'Told you.', 'Finally.'];

export default function flap({ look, sound }) {
  const me = { x: 140, y: H * 0.42, vy: 0, angle: 0 };
  const pipes = [];
  const mouth = new Mouth();
  const sparks = new Sparks();
  let started = false;
  let t = 0;
  let scroll = 0;
  let squash = 0;

  const gap = () => clamp(210 - g.score * 3, 150, 210);
  const addPipe = (x) => {
    const size = gap();
    const top = rand(110, GROUND - size - 60);
    pipes.push({ x, top, size, passed: false });
  };

  const crash = () => {
    if (g.over) return;
    g.over = true;
    me.vy = Math.min(me.vy, -200);
    sound.hit();
    sparks.burst(me.x, me.y, look.color, 16);
    mouth.say(CRASH[Math.floor(Math.random() * CRASH.length)], 3);
  };

  const flapNow = () => {
    if (g.over) return;
    if (!started) {
      started = true;
      addPipe(W + 60);
    }
    me.vy = FLAP;
    squash = 0.18;
    sound.jump();
    mouth.maybe(FLAPS, 0.2);
  };

  const g = {
    score: 0,
    over: false,
    down: flapNow,
    key(code) {
      if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') flapNow();
    },

    update(dt) {
      t += dt;
      mouth.update(dt);
      sparks.update(dt);
      squash = Math.max(0, squash - dt);

      if (!started) {
        me.y = H * 0.42 + Math.sin(t * 3) * 10; // hover until the first tap
        return;
      }

      me.vy += GRAVITY * dt;
      me.y += me.vy * dt;
      me.angle = clamp(me.vy / 900, -0.45, 1.2);

      if (me.y + SIZE / 2 > GROUND) {
        me.y = GROUND - SIZE / 2;
        me.vy = 0;
        crash();
      }
      if (me.y < SIZE / 2) {
        me.y = SIZE / 2;
        me.vy = 0;
      }
      if (g.over) return;

      scroll += SPEED * dt;
      for (const p of pipes) {
        p.x -= SPEED * dt;
        if (!p.passed && p.x + PIPE_W < me.x) {
          p.passed = true;
          g.score++;
          sound.pop();
          sparks.float(me.x, me.y - 40, '+1');
        }
        // a slightly forgiving circle-vs-rectangle check
        const r = SIZE * 0.4;
        const nx = clamp(me.x, p.x, p.x + PIPE_W);
        const hitsTop = Math.hypot(me.x - nx, me.y - clamp(me.y, -100, p.top)) < r;
        const hitsBottom = Math.hypot(me.x - nx, me.y - clamp(me.y, p.top + p.size, H)) < r;
        if (hitsTop || hitsBottom) crash();
      }
      if (pipes.length && pipes[0].x < -PIPE_W) pipes.shift();
      if (pipes[pipes.length - 1].x < W - SPACING) addPipe(W + 20);
    },

    draw(c) {
      backdrop(c, '#7fc8ff', '#dff3ff');

      // far hills and clouds scroll slower than the pipes
      c.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 5; i++) {
        const x = (((i * 170 - scroll * 0.25) % (W + 200)) + W + 200) % (W + 200) - 100;
        cloud(c, x, 120 + (i % 3) * 90);
      }
      c.fillStyle = '#a9dd95';
      for (let i = 0; i < 6; i++) {
        const x = (((i * 140 - scroll * 0.5) % (W + 280)) + W + 280) % (W + 280) - 140;
        c.beginPath();
        c.arc(x, GROUND + 10, 90, Math.PI, 0);
        c.fill();
      }

      for (const p of pipes) pipe(c, p);

      // the ground
      c.fillStyle = '#d9b77c';
      c.fillRect(0, GROUND, W, H - GROUND);
      c.fillStyle = '#8fca6f';
      c.fillRect(0, GROUND, W, 14);
      c.fillStyle = '#7ab55c';
      for (let x = -((scroll % 28)); x < W; x += 28) c.fillRect(x, GROUND + 14, 14, 6);

      // wings flap faster on the way up
      const beat = Math.sin(t * (me.vy < 0 ? 40 : 14));
      wing(c, me, -1, beat);
      drawBobby(c, me.x, me.y, SIZE, {
        look,
        t,
        angle: me.angle,
        squash,
        mood: g.over ? 'sad' : me.vy < -150 ? 'shout' : 'worried',
        tears: g.over,
      });
      wing(c, me, 1, beat);

      sparks.draw(c);
      mouth.draw(c, me.x, me.y - SIZE * 0.7);

      if (started) drawScore(c, g.score);
      else drawScore(c, 'Tap to flap', 'It will complain. Ignore it.');
    },
  };
  return g;
}

function pipe(c, p) {
  const grad = c.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
  grad.addColorStop(0, '#5fb04a');
  grad.addColorStop(0.5, '#86d66b');
  grad.addColorStop(1, '#4a9439');
  c.fillStyle = grad;
  c.fillRect(p.x, -10, PIPE_W, p.top + 10);
  c.fillRect(p.x, p.top + p.size, PIPE_W, GROUND - p.top - p.size);
  c.fillStyle = '#3f8530';
  rr(c, p.x - 6, p.top - 26, PIPE_W + 12, 26, 6);
  c.fill();
  rr(c, p.x - 6, p.top + p.size, PIPE_W + 12, 26, 6);
  c.fill();
}

function wing(c, me, side, beat) {
  c.save();
  c.translate(me.x - 4, me.y - 6);
  c.rotate(me.angle);
  c.scale(side, 1);
  c.rotate(-0.4 + beat * 0.6);
  c.fillStyle = 'rgba(255,255,255,0.95)';
  c.strokeStyle = '#c9d6e3';
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(26, 0, 22, 10, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.restore();
}

function cloud(c, x, y) {
  c.beginPath();
  c.arc(x, y, 26, 0, Math.PI * 2);
  c.arc(x + 28, y - 12, 30, 0, Math.PI * 2);
  c.arc(x + 58, y, 24, 0, Math.PI * 2);
  c.fill();
}
