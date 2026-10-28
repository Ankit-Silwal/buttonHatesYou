import { W, H, rand, pick, clamp, rr, heart, text, drawBobby, drawScore, Mouth, Sparks, reviveFx, vignette, layer, sprite, softLight, shadow, lighten, darken } from '../kit';
import { Fx } from '../fx';

// Cursor Pong: the ball is an angry mouse cursor. The button wears the paddle
// as a hat and has to bounce it back off the walls and ceiling. Three lives.
const LEFT = 26;
const RIGHT = 454;
const TOP = 172; // ceiling: the window's inner top edge
const PY = 680; // paddle centre line
const PH = 18;
const R = 13; // ball radius
const MISS_Y = 790;
const LIVES = 3;

const WALL = ['Click me!', 'Is that all?', 'Boing.', 'Try me.', 'Double click this.'];
const OUCH = ['Ow.', 'Rude.', 'My pixels!', 'Hey!', 'Ow. Again.'];
const ESCAPE = ['Free at last!', 'Bye!', 'Seeya, button.', 'Not my problem now.'];
const END = ['Click me! Oh wait.', 'I always win.', 'Task failed successfully.'];
const CHEAT = ['Cheater.', 'That is not fair.', 'Hey, power-ups?!'];

export default function pong({ look, sound, keys }) {
  const fx = new Fx();
  const words = new Sparks();
  const mouth = new Mouth();
  const ripples = [];
  const trail = [];
  const ups = [];
  const talk = { x: W / 2, y: 240, pin: false };
  const ball = { x: W / 2, y: 300, vx: 0, vy: 0, wait: 0.8, scale: 1 };
  let t = 0;
  let shake = 0;
  let lives = LIVES;
  let returns = 0;
  let speed = 360;
  let px = W / 2;
  let tx = W / 2;
  let pw = 150;
  let wide = 0; // seconds of donut left
  let slow = 0; // seconds of slow-mo left
  let dip = 0; // paddle bounce after a hit
  let glad = 0;
  let sadT = 0;
  let ouchT = 0;
  let upIn = 7;
  let trailT = 0;
  let facing = 1;
  let moving = false;

  const baseW = () => Math.max(84, 150 - returns * 1.4);
  const maxV = () => Math.min(640, 360 + returns * 7);

  const serve = (sp, wait) => {
    ball.x = W / 2 + rand(-40, 40);
    ball.y = 300;
    const a = rand(-0.2, 0.2);
    ball.vx = Math.sin(a) * sp;
    ball.vy = Math.cos(a) * sp;
    ball.wait = wait;
    trail.length = 0;
  };
  serve(360, 0.8);

  const say = (lines, chance = 1, sec = 1.3) => {
    if (chance < 1 && (mouth.left > 0 || Math.random() >= chance)) return;
    mouth.say(pick(lines), sec);
  };
  const ripple = (x, y) => ripples.push({ x, y, age: 0 });

  const lose = () => {
    lives--;
    shake = 0.4;
    sadT = 1.2;
    sound.bad?.();
    const x = clamp(ball.x, LEFT, RIGHT);
    fx.burst(x, MISS_Y - 30, '#ff5a5a', 14, 280);
    fx.ring(x, MISS_Y - 30, '#ff8a8a', 90, 0.4);
    if (lives <= 0) {
      g.over = true;
      mouth.say(pick(END), 3);
      talk.pin = true;
      talk.x = W / 2;
      talk.y = 260;
      return;
    }
    mouth.say(pick(ESCAPE), 1.6);
    talk.pin = true;
    talk.x = clamp(x, 70, W - 70);
    talk.y = 735;
    serve(Math.min(speed, 400), 1);
  };

  const wallHit = (x, y) => {
    ripple(x, y);
    ball.scale = 1.25;
    sound.click?.(0);
    say(WALL, 0.1);
  };

  const paddleHit = () => {
    returns++;
    g.score++;
    speed = maxV();
    const off = clamp((ball.x - px) / (pw / 2), -1, 1);
    const a = off * 1.0;
    ball.vx = Math.sin(a) * speed;
    ball.vy = -Math.cos(a) * speed;
    ball.y = PY - PH / 2 - R;
    ball.scale = 1.4;
    dip = 0.14;
    glad = 0.4;
    ouchT = 0.28;
    shake = Math.max(shake, 0.06);
    ripple(ball.x, ball.y + R);
    fx.burst(ball.x, ball.y + R, look.color, 8, 260);
    fx.burst(ball.x, ball.y + R, '#ffffff', 5, 200, { size: 2 });
    words.float(ball.x, ball.y - 24, '+1');
    sound.pop?.();
    if (returns % 10 === 0) {
      fx.ring(ball.x, ball.y, '#ffd84d', 100, 0.5);
      sound.ring?.();
      mouth.say('Is that all?', 1.4);
    } else say(OUCH, 0.14);
  };

  const step = (h) => {
    ball.x += ball.vx * h;
    ball.y += ball.vy * h;
    if (ball.x < LEFT + R) {
      ball.x = LEFT + R;
      ball.vx = Math.abs(ball.vx);
      wallHit(LEFT, ball.y);
    } else if (ball.x > RIGHT - R) {
      ball.x = RIGHT - R;
      ball.vx = -Math.abs(ball.vx);
      wallHit(RIGHT, ball.y);
    }
    if (ball.y < TOP + R) {
      ball.y = TOP + R;
      ball.vy = Math.abs(ball.vy);
      wallHit(ball.x, TOP);
    }
    const top = PY - PH / 2;
    if (ball.vy > 0 && ball.y + R >= top && ball.y - R <= top + PH && Math.abs(ball.x - px) <= pw / 2 + 6) paddleHit();
    if (ball.y > MISS_Y) lose();
  };

  const catchUp = (u) => {
    fx.burst(u.x, u.y, u.kind === 'donut' ? '#ff7fb0' : '#6fb4ff', 12, 280);
    sound.ring?.();
    if (u.kind === 'donut') {
      wide = 8;
      words.float(u.x, u.y - 20, 'WIDE!', '#ff9cc4');
    } else {
      slow = 5;
      words.float(u.x, u.y - 20, 'SLOW-MO', '#9fd0ff');
    }
    say(CHEAT, 0.5);
  };

  const g = {
    score: 0,
    over: false,
    down(x) {
      if (!g.over && Number.isFinite(x)) tx = x;
    },
    move(x) {
      if (!g.over && Number.isFinite(x)) tx = x;
    },

    // a paid Continue: one more life, the cursor starts again high and slow
    revive() {
      g.over = false;
      lives = 1;
      slow = 0;
      sadT = 0;
      serve(340, 1);
      talk.pin = false;
      reviveFx({ fx, words, mouth, sound }, W / 2, 330, look.color);
    },

    update(dt) {
      dt = Number.isFinite(dt) ? clamp(dt, 0, 0.05) : 0.016;
      t += dt;
      fx.update(dt);
      words.update(dt);
      mouth.update(dt);
      shake = Math.max(0, shake - dt);
      dip = Math.max(0, dip - dt);
      glad = Math.max(0, glad - dt);
      sadT = Math.max(0, sadT - dt);
      ouchT = Math.max(0, ouchT - dt);
      ball.scale += (1 - ball.scale) * Math.min(1, dt * 12);
      if (mouth.left <= 0) talk.pin = false;
      for (const r of ripples) r.age += dt;
      while (ripples.length && ripples[0].age > 0.5) ripples.shift();
      if (g.over) return;

      // the paddle: drag, or hold the arrow keys
      const dir = (keys?.has('ArrowRight') || keys?.has('KeyD') ? 1 : 0) - (keys?.has('ArrowLeft') || keys?.has('KeyA') ? 1 : 0);
      if (dir) tx += dir * 700 * dt;
      wide = Math.max(0, wide - dt);
      slow = Math.max(0, slow - dt);
      pw += ((baseW() + (wide > 0 ? 56 : 0)) - pw) * Math.min(1, dt * 8);
      tx = clamp(tx, LEFT + pw / 2, RIGHT - pw / 2);
      const old = px;
      px += (tx - px) * Math.min(1, dt * 22);
      px = clamp(px, LEFT + pw / 2, RIGHT - pw / 2);
      moving = Math.abs(px - old) > 0.6;
      if (px - old > 0.6) facing = 1;
      else if (px - old < -0.6) facing = -1;

      // the cursor, in sub-steps so it can never tunnel through the paddle
      if (ball.wait > 0) ball.wait -= dt;
      else {
        const left = dt * (slow > 0 ? 0.6 : 1);
        const n = Math.max(1, Math.ceil((Math.hypot(ball.vx, ball.vy) * left) / 5));
        for (let i = 0; i < n && !g.over; i++) {
          const before = lives;
          step(left / n);
          if (lives !== before) break;
        }
      }
      if (!Number.isFinite(ball.x) || !Number.isFinite(ball.y)) serve(360, 0.6);

      trailT -= dt;
      if (trailT <= 0 && ball.wait <= 0) {
        trailT = 0.025;
        trail.push({ x: ball.x, y: ball.y });
        if (trail.length > 8) trail.shift();
      }

      // power-ups drift down from the ceiling
      upIn -= dt;
      if (upIn <= 0 && ball.wait <= 0) {
        upIn = rand(8, 13);
        if (ups.length < 1) ups.push({ x: rand(60, W - 60), y: TOP + 14, kind: Math.random() < 0.5 ? 'donut' : 'clock', age: 0 });
      }
      for (const u of ups) {
        u.age += dt;
        u.y += 150 * dt;
        if (!u.gone && Math.abs(u.x - px) < pw / 2 + 14 && u.y + 14 > PY - PH / 2 && u.y - 14 < PY + PH / 2 + 20) {
          u.gone = true;
          catchUp(u);
        }
        if (u.y > H) u.gone = true;
      }
      for (let i = ups.length - 1; i >= 0; i--) if (ups[i].gone) ups.splice(i, 1);
    },

    draw(c) {
      c.save();
      if (shake) c.translate(rand(-1, 1) * shake * 16, rand(-1, 1) * shake * 16);
      c.drawImage(desk(), 0, 0);

      // click ripples
      for (const r of ripples) {
        const k = r.age / 0.5;
        c.strokeStyle = `rgba(40,120,220,${(1 - k) * 0.8})`;
        c.lineWidth = 2.5 * (1 - k) + 0.5;
        c.beginPath();
        c.arc(r.x, r.y, 4 + k * 30, 0, Math.PI * 2);
        c.stroke();
        c.beginPath();
        c.arc(r.x, r.y, 2 + k * 16, 0, Math.PI * 2);
        c.stroke();
      }

      for (const u of ups) powerUp(c, u, t);

      // the button under its paddle hat
      const by = PY + PH / 2 + 22;
      const mood = g.over || sadT > 0 ? 'sad' : glad > 0 ? 'happy' : ball.vy > 0 && ball.y > PY - 190 ? 'angry' : 'calm';
      shadow(c, px, by + 24, 30, 0.22);
      drawBobby(c, px, by, 52, { look, mood, t, moving, facing, squash: dip * 1.1, tears: g.over });
      paddle(c, px, PY + dip * 40, pw, look);

      if (!g.over) {
        // afterimages, then the furious cursor itself
        const cur = cursor(ouchT > 0 ? 'ouch' : 'angry');
        trail.forEach((p, i) => {
          c.globalAlpha = (i / trail.length) * 0.22;
          c.drawImage(cur, p.x - CX, p.y - CY);
        });
        c.globalAlpha = 1;
        softLight(c, ball.x, ball.y, 34, '#ff5a5a', 0.3);
        c.save();
        c.translate(ball.x, ball.y + (ball.wait > 0 ? Math.sin(t * 6) * 3 : 0));
        c.rotate(clamp(ball.vx * 0.0012, -0.5, 0.5) + Math.sin(t * 34) * 0.04);
        c.scale(ball.scale, ball.scale);
        c.drawImage(cur, -CX, -CY);
        c.restore();
      }
      c.restore();

      fx.draw(c);
      words.draw(c);
      if (slow > 0) vignette(c, 0.3, '#2a63c8');
      else vignette(c, 0.18, '#0b2a40');
      const ax = talk.pin ? talk.x : clamp(ball.x, 60, W - 60);
      const ay = talk.pin ? talk.y : Math.max(ball.y - 24, 222);
      mouth.draw(c, ax, ay);

      // lives as tiny buttons, and the power-up timers
      for (let i = 0; i < LIVES; i++) drawBobby(c, 52 + i * 30, 200, 24, { look, alpha: i < lives ? 1 : 0.2, t: t + i });
      if (wide > 0) timer(c, 'donut', wide / 8, 52, 232, t);
      if (slow > 0) timer(c, 'clock', slow / 5, wide > 0 ? 100 : 52, 232, t);
      drawScore(c, g.score, 'returns');
      if (t < 2.6) text(c, 'Drag left and right', W / 2, 450, { size: 16, color: 'rgba(40,70,85,0.75)' });
    },
  };
  return g;
}

/* ---------- art ---------- */

// The cursor: white with a black outline, tiny furious eyes, drawn at 2x.
const CS = 1.9;
const CX = 19.5; // centre of the arrow inside its sprite
const CY = 27;
function cursor(mood) {
  return sprite(`pong:cursor:${mood}`, 96, 112, (c) => {
    c.scale(2, 2);
    c.translate(10, 8);
    c.scale(CS, CS);
    const body = () => {
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, 17);
      c.lineTo(4.5, 13.2);
      c.lineTo(7.8, 21);
      c.lineTo(11, 19.6);
      c.lineTo(7.8, 12.2);
      c.lineTo(13, 12);
      c.closePath();
    };
    c.lineJoin = 'round';
    body();
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.save();
    c.translate(0.5, 0.7);
    c.fill();
    c.restore();
    const gr = c.createLinearGradient(0, 0, 0, 21);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(1, '#d6dbe8');
    body();
    c.fillStyle = gr;
    c.fill();
    c.lineWidth = 1.3;
    c.strokeStyle = '#14101a';
    c.stroke();
    c.lineCap = 'round';
    if (mood === 'ouch') {
      c.lineWidth = 0.8;
      for (const s of [-1, 1]) {
        const ex = s < 0 ? 2.4 : 6.2;
        c.beginPath();
        c.moveTo(ex - s * 1.2, 7.2);
        c.lineTo(ex + s * 0.2, 8.1);
        c.lineTo(ex - s * 1.2, 9);
        c.stroke();
      }
      c.beginPath();
      c.ellipse(4.3, 11, 1.1, 0.8, 0, 0, Math.PI * 2);
      c.fillStyle = '#14101a';
      c.fill();
      return;
    }
    // angry eyes, brows slanting down to the middle, and a scowl
    for (const ex of [2.4, 6.2]) {
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(ex, 8.2, 1.5, 0, Math.PI * 2);
      c.fill();
      c.lineWidth = 0.4;
      c.stroke();
      c.fillStyle = '#14101a';
      c.beginPath();
      c.arc(ex + 0.3, 8.5, 0.8, 0, Math.PI * 2);
      c.fill();
    }
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(0.9, 5.9);
    c.lineTo(3.5, 7);
    c.moveTo(7.8, 5.9);
    c.lineTo(5.1, 7);
    c.stroke();
    c.lineWidth = 0.6;
    c.beginPath();
    c.arc(4.3, 12.4, 1.7, Math.PI * 1.2, Math.PI * 1.8);
    c.stroke();
  });
}

// The wide rounded paddle the button wears as a hat.
function paddle(c, x, y, w, look) {
  const h = PH;
  const g = c.createLinearGradient(0, y - h / 2, 0, y + h / 2);
  g.addColorStop(0, lighten(look.color, 0.4));
  g.addColorStop(0.5, look.color);
  g.addColorStop(1, darken(look.color, 0.3));
  rr(c, x - w / 2, y - h / 2, w, h, h / 2);
  c.fillStyle = g;
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = look.dark;
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.5)';
  rr(c, x - w / 2 + 10, y - h / 2 + 3, w - 20, 3.5, 1.75);
  c.fill();
  // little ridges, like a button's rim
  c.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = -2; i <= 2; i++) c.fillRect(x + i * Math.min(24, w / 6) - 1, y + 1, 2, 5);
}

function powerUp(c, u, t) {
  const bob = Math.sin(u.age * 6) * 3;
  c.save();
  c.translate(u.x, u.y + bob);
  c.rotate(Math.sin(u.age * 4) * 0.3);
  softLight(c, 0, 0, 30, u.kind === 'donut' ? '#ff9cc4' : '#9fd0ff', 0.55);
  c.drawImage(upSprite(u.kind), -18, -18, 36, 36);
  c.restore();
}

function upSprite(kind) {
  return sprite(`pong:up:${kind}`, 72, 72, (c) => {
    c.scale(2, 2);
    c.translate(18, 18);
    c.lineJoin = 'round';
    if (kind === 'donut') {
      c.beginPath();
      c.arc(0, 0, 15, 0, Math.PI * 2);
      c.fillStyle = '#d9a066';
      c.fill();
      c.beginPath();
      c.arc(0, -1, 13, 0, Math.PI * 2);
      c.fillStyle = '#ff7fb0';
      c.fill();
      c.beginPath();
      c.arc(0, 0, 4.6, 0, Math.PI * 2);
      c.fillStyle = '#d8ecf0';
      c.fill();
      c.lineWidth = 1.5;
      c.strokeStyle = '#8a4f2a';
      c.beginPath();
      c.arc(0, 0, 15, 0, Math.PI * 2);
      c.stroke();
      const cols = ['#fff', '#ffe066', '#7fd6ff', '#fff'];
      for (let i = 0; i < 8; i++) {
        const a = i * 0.8 + 0.3;
        c.strokeStyle = cols[i % 4];
        c.lineWidth = 1.8;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(Math.cos(a) * 9, Math.sin(a) * 9 - 1);
        c.lineTo(Math.cos(a) * 9 + Math.cos(a + 1) * 2.4, Math.sin(a) * 9 - 1 + Math.sin(a + 1) * 2.4);
        c.stroke();
      }
    } else {
      c.beginPath();
      c.arc(0, 0, 15, 0, Math.PI * 2);
      c.fillStyle = '#fff';
      c.fill();
      c.lineWidth = 3;
      c.strokeStyle = '#4a7fd0';
      c.stroke();
      c.lineCap = 'round';
      c.lineWidth = 2;
      c.strokeStyle = '#1d2a44';
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(0, -9);
      c.moveTo(0, 0);
      c.lineTo(6, 3);
      c.stroke();
      c.fillStyle = '#4a7fd0';
      for (let i = 0; i < 12; i += 3) {
        const a = (i * Math.PI) / 6;
        c.fillRect(Math.cos(a) * 11.5 - 0.8, Math.sin(a) * 11.5 - 0.8, 1.6, 1.6);
      }
    }
  });
}

// An active power-up: its icon and a draining bar.
function timer(c, kind, k, x, y, t) {
  c.drawImage(upSprite(kind), x - 14, y - 14, 28, 28);
  c.fillStyle = 'rgba(30,60,80,0.25)';
  rr(c, x + 18, y - 3, 30, 6, 3);
  c.fill();
  c.fillStyle = kind === 'donut' ? '#ff7fb0' : '#5aa0ff';
  rr(c, x + 18, y - 3, Math.max(4, 30 * k), 6, 3);
  c.fill();
}

// The retro desktop, painted once: wallpaper, icons, a window with a fake
// title bar and a faint grid, and a taskbar.
function desk() {
  return layer('pong:desk', (c) => {
    // wallpaper
    const wp = c.createLinearGradient(0, 0, 0, H);
    wp.addColorStop(0, '#2f7fc0');
    wp.addColorStop(0.6, '#4aa3d8');
    wp.addColorStop(1, '#6fc0a0');
    c.fillStyle = wp;
    c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.beginPath();
    c.ellipse(120, 70, 150, 40, 0, 0, Math.PI * 2);
    c.ellipse(390, 120, 110, 28, 0, 0, Math.PI * 2);
    c.fill();

    icon(c, 50, 96, 'bin', 'Recycle Bin');
    icon(c, 118, 96, 'folder', 'Homework');
    icon(c, 420, 96, 'exe', 'do_not_click');

    // window with a soft drop shadow
    c.fillStyle = 'rgba(0,20,40,0.3)';
    rr(c, 22, 152, 440, 620, 8);
    c.fill();
    rr(c, 18, 146, 440, 620, 7);
    c.fillStyle = '#d9dee6';
    c.fill();
    const tb = c.createLinearGradient(0, 146, 0, 172);
    tb.addColorStop(0, '#4b92e8');
    tb.addColorStop(1, '#1b5fb0');
    c.fillStyle = tb;
    c.beginPath();
    c.roundRect(18, 146, 440, 26, [7, 7, 0, 0]);
    c.fill();
    text(c, 'cursor_pong.exe (Not Responding)', 30, 160, { size: 13, color: '#fff', align: 'left' });
    [['_', '#5b7fb5'], ['□', '#5b7fb5'], ['X', '#d8433a']].forEach(([g, col], i) => {
      const bx = 458 - 8 - (3 - i) * 22;
      c.fillStyle = col;
      rr(c, bx, 150, 19, 18, 3);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.lineWidth = 1;
      c.stroke();
      text(c, g, bx + 9.5, 159, { size: 12, color: '#fff' });
    });

    // the arena: a pale canvas with a faint grid
    c.fillStyle = '#eef7f2';
    c.fillRect(LEFT, TOP, RIGHT - LEFT, 762 - TOP);
    c.strokeStyle = 'rgba(70,130,150,0.12)';
    c.lineWidth = 1;
    for (let x = LEFT + 20; x < RIGHT; x += 28) {
      c.beginPath();
      c.moveTo(x, TOP);
      c.lineTo(x, 762);
      c.stroke();
    }
    for (let y = TOP + 20; y < 762; y += 28) {
      c.beginPath();
      c.moveTo(LEFT, y);
      c.lineTo(RIGHT, y);
      c.stroke();
    }
    const fade = c.createLinearGradient(0, TOP, 0, TOP + 40);
    fade.addColorStop(0, 'rgba(60,90,110,0.22)');
    fade.addColorStop(1, 'rgba(60,90,110,0)');
    c.fillStyle = fade;
    c.fillRect(LEFT, TOP, RIGHT - LEFT, 40);
    text(c, 'Your cursor has stopped working.', W / 2, 520, { size: 15, color: 'rgba(60,100,120,0.28)' });
    text(c, 'Probably. Please do not click.', W / 2, 542, { size: 13, color: 'rgba(60,100,120,0.22)' });
    c.lineWidth = 2;
    c.strokeStyle = '#8f98a6';
    c.strokeRect(LEFT, TOP, RIGHT - LEFT, 762 - TOP);

    // taskbar
    const tk = c.createLinearGradient(0, 768, 0, H);
    tk.addColorStop(0, '#dfe3ea');
    tk.addColorStop(1, '#aeb6c4');
    c.fillStyle = tk;
    c.fillRect(0, 768, W, H - 768);
    c.fillStyle = '#fff';
    c.fillRect(0, 768, W, 2);
    const st = c.createLinearGradient(0, 772, 0, 796);
    st.addColorStop(0, '#5bc86a');
    st.addColorStop(1, '#2f9a45');
    c.fillStyle = st;
    rr(c, 6, 772, 74, 24, 12);
    c.fill();
    text(c, 'Start', 43, 785, { size: 13, color: '#fff' });
    c.fillStyle = 'rgba(255,255,255,0.7)';
    rr(c, 90, 773, 150, 22, 4);
    c.fill();
    c.strokeStyle = '#8f98a6';
    c.lineWidth = 1;
    c.stroke();
    text(c, 'cursor_pong.exe', 165, 784, { size: 12, color: '#33404f' });
    text(c, '13:37', W - 34, 784, { size: 12, color: '#33404f' });
  });
}

function icon(c, x, y, kind, label) {
  c.save();
  c.translate(x, y);
  c.lineJoin = 'round';
  c.lineWidth = 1.5;
  if (kind === 'bin') {
    c.fillStyle = '#c9d2de';
    c.beginPath();
    c.moveTo(-14, -12);
    c.lineTo(14, -12);
    c.lineTo(11, 16);
    c.lineTo(-11, 16);
    c.closePath();
    c.fill();
    c.strokeStyle = '#6a7686';
    c.stroke();
    c.beginPath();
    for (const dx of [-5, 0, 5]) {
      c.moveTo(dx, -8);
      c.lineTo(dx * 0.8, 12);
    }
    c.stroke();
    c.fillStyle = '#e6ecf4';
    rr(c, -16, -17, 32, 6, 3);
    c.fill();
    c.stroke();
  } else if (kind === 'folder') {
    c.fillStyle = '#f3c850';
    rr(c, -17, -12, 34, 28, 3);
    c.fill();
    c.strokeStyle = '#a9811f';
    c.stroke();
    c.fillStyle = '#ffdc78';
    rr(c, -17, -7, 34, 23, 3);
    c.fill();
    c.stroke();
  } else {
    c.fillStyle = '#fff';
    rr(c, -16, -14, 32, 28, 3);
    c.fill();
    c.strokeStyle = '#4a5568';
    c.stroke();
    c.fillStyle = '#d8433a';
    c.fillRect(-16, -14, 32, 7);
    c.strokeStyle = '#d8433a';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-6, -1);
    c.lineTo(6, 9);
    c.moveTo(6, -1);
    c.lineTo(-6, 9);
    c.stroke();
  }
  c.restore();
  c.save();
  c.shadowColor = 'rgba(0,20,40,0.8)';
  c.shadowBlur = 3;
  text(c, label, x, y + 30, { size: 11, color: '#fff', weight: 600 });
  c.restore();
}
