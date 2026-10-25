import { Sound } from './sound';
import {
  G, dom, hooks, scope, wait, rand, pick, clamp, h,
  BOSS_AT, FRIENDS, save, makeChar, place, setMood,
  say, floatText, shake, flash, confetti, updateHud,
} from './core';

// The last 15 clicks: five phases, three hits each. Every hit is a checkpoint
// (it's saved as a normal click), so failing a minigame never loses progress.

const PHASES = [
  { name: 'Balloon Party', taunt: 'Pop my balloon shield. Don’t you dare pop my cousins.', run: balloons },
  { name: 'The Climb', taunt: 'Come up here and say that to my face.', run: climb },
  { name: 'Whack-a-Button', taunt: 'I’m everywhere. Mostly in holes.', run: whack },
  { name: 'Which One Is Me?', taunt: 'Keep your eyes on me. If you can.', run: shells },
  { name: 'The Last Three', taunt: 'Three tasks. Infinite chaos. Zero mercy.', run: (round, done) => [simon, defuse, mash][round](done) },
];

const HIT_LINES = {
  61: "THAT'S NOT EVEN MY FINAL FORM.",
  62: 'Lucky. Pure luck.',
  63: 'Fine. Balloons are for babies anyway.',
  64: 'How did you even get up here?!',
  65: 'STOP CLIMBING ON ME.',
  66: 'My platforms! My beautiful platforms!',
  67: 'Ow. Bonk. Rude.',
  68: "You're whacking my head like it's a GAME.",
  69: "It IS a game?? Nobody told me.",
  70: 'How did you know that was me?!',
  71: "Cheater. You're definitely cheating.",
  72: 'Okay. Okay. Final. Form. For real.',
  73: 'Power restored?! Who taught you electricity?!',
  74: 'You disarmed it?? That was my best bomb.',
  75: 'NOOOOOOOOOOOOOOO—',
};

let stopPhase = null;
let busy = false;

function clearArena() {
  stopPhase?.();
  stopPhase = null;
  dom.arena.innerHTML = '';
}

function start() {
  busy = false;
  dom.arena.hidden = false;
  dom.bossbar.hidden = false;
  dom.bossbar.innerHTML = '<i></i>'.repeat(15);
  document.activeElement?.blur();
  updateHud();
  next(true);
}

function stop() {
  clearArena();
  document.body.classList.remove('glitchy', 'rave');
}

async function next(fresh = false) {
  const hits = G.clicks - BOSS_AT;
  if (hits >= 15) return win();
  const p = Math.floor(hits / 3);
  const round = hits % 3;
  clearArena();
  if (round === 0 || fresh) {
    const card = h('div', 'phase-card', `<small>Phase ${p + 1} of 5</small><h2>${PHASES[p].name}</h2><p>${PHASES[p].taunt}</p>`);
    dom.arena.append(card);
    Sound.boom();
    shake(dom.app, 8, 500);
    await wait(2600);
    card.remove();
  } else {
    await wait(300);
  }
  stopPhase = PHASES[p].run(round, hit);
}

function hit() {
  if (busy) return;
  busy = true;
  clearArena();
  G.clicks++;
  save();
  updateHud();
  Sound.hit();
  shake(dom.app, 12, 500);
  flash('#ffd9c9');
  say(HIT_LINES[G.clicks]);
  scope.later(() => {
    busy = false;
    next();
  }, 1500);
}

async function win() {
  clearArena();
  dom.bossbar.hidden = true;
  const b = makeChar('boss');
  b.style.setProperty('--s', '200px');
  b.style.transition = 'none';
  setMood(b, 'scared');
  place(b, innerWidth / 2, innerHeight / 2);
  dom.arena.append(b);
  say('No… no no no NO NO NOOOOO—');
  for (let i = 0; i < 6; i++) {
    shake(dom.app, 6 + i * 3, 300);
    Sound.hit();
    await wait(380);
  }
  b.animate(
    [{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(1.8)', filter: 'brightness(2.5)' }],
    { duration: 1800, easing: 'ease-in', fill: 'forwards' }
  );
  await wait(1800);
  b.remove();
  flash();
  confetti(180);
  Sound.boom();
  Sound.win();
  G.inPost = true;
  save();
  document.body.classList.remove('boss', 'rave', 'glitchy');
  dom.arena.hidden = true;
  dom.overlay.className = 'soft';
  dom.overlay.innerHTML = `<div class="card win"><div class="emoji">🎉</div><h2>YOU WON!</h2><p class="big">75 / 75 clicks</p><p>The button is finally defeated.</p><p class="twist"></p></div>`;
  dom.overlay.hidden = false;
  say('');
  await wait(3500);
  dom.overlay.querySelector('.twist').textContent = 'Wait… did you really think I would let you win?';
  await wait(2800);
  dom.overlay.hidden = true;
  dom.overlay.innerHTML = '';
  hooks.startPost();
}

/* =========================================================
   Phase 1 — Balloon Party
   Angry red balloons are its shield. Pop them, then hit it while the shield
   is down. Cute pastel balloons are its cousins: popping one adds shield.
   ========================================================= */
function balloons(round, done) {
  const need = [8, 10, 12][round];
  const speed = [70, 95, 125][round];
  const every = [620, 500, 400][round];
  let left = need;
  let alive = true;
  let vulnerable = false;
  let vulnT = 0;
  let spawnT = 0;
  let last = performance.now();
  const list = [];

  say('Pop the ANGRY red balloons. Leave the cute ones alone!');
  const boss = makeChar('boss');
  boss.style.setProperty('--s', '130px');
  setMood(boss, 'smug');
  place(boss, innerWidth / 2, 230);
  const shield = h('span', 'shield');
  boss.append(shield);
  dom.arena.append(boss);
  const tag = h('div', 'tag');
  tag.style.top = '320px';
  dom.arena.append(tag);
  const paint = () => (tag.textContent = vulnerable ? 'SHIELD DOWN — HIT IT!' : `🎈 ${left} to pop`);
  paint();

  boss.addEventListener('pointerdown', (e) => {
    if (!alive) return;
    if (vulnerable) {
      alive = false;
      done();
    } else {
      Sound.nope();
      floatText('shielded!', e.clientX, e.clientY - 30, 'hot');
    }
  });

  function spawn() {
    const evil = Math.random() > 0.28;
    const b = h('div', 'balloon ' + (evil ? 'evil' : 'cute'), evil ? '<span>ò_ó</span>' : '<span>♥</span>');
    if (!evil) b.style.setProperty('--c', pick(FRIENDS).c);
    b._x = rand(40, innerWidth - 40);
    b._y = innerHeight + 40;
    b._ph = rand(0, 6);
    b._sp = speed * rand(0.85, 1.25);
    b.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      popBalloon(b, evil);
    });
    dom.arena.append(b);
    list.push(b);
  }

  function popBalloon(b, evil) {
    if (b._dead || !alive) return;
    b._dead = true;
    b.classList.add('popped');
    setTimeout(() => b.remove(), 200);
    Sound.pop();
    if (vulnerable) return;
    if (evil) {
      if (--left <= 0) shieldDown();
    } else {
      left = Math.min(need, left + 2);
      Sound.bad();
      say(pick(['You popped my COUSIN! Shield up!', 'That was Grandma’s balloon!', 'Cute ones are FAMILY. +2 shield.']));
    }
    paint();
  }

  function shieldDown() {
    vulnerable = true;
    vulnT = 3.2;
    boss.classList.add('vulnerable');
    shield.classList.add('broken');
    setMood(boss, 'scared');
    say('My shield! NO— don’t click me!');
  }

  function shieldUp() {
    vulnerable = false;
    left = Math.ceil(need / 2);
    boss.classList.remove('vulnerable');
    shield.classList.remove('broken');
    setMood(boss, 'smug');
    say('Too slow! Shield’s back. Hehe.');
    paint();
  }

  const loop = (t) => {
    if (!alive) return;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    spawnT -= dt * 1000;
    if (spawnT <= 0 && !vulnerable) {
      spawn();
      spawnT = every;
    }
    if (vulnerable && (vulnT -= dt) <= 0) shieldUp();
    for (let i = list.length - 1; i >= 0; i--) {
      const b = list[i];
      b._y -= b._sp * dt;
      b._ph += dt * 2;
      b.style.transform = `translate(${b._x + Math.sin(b._ph) * 18}px, ${b._y}px)`;
      if (b._dead || b._y < -90) {
        if (!b._dead) b.remove();
        list.splice(i, 1);
      }
    }
    scope.frame(loop);
  };
  scope.frame(loop);
  return () => (alive = false);
}

/* =========================================================
   Phase 2 — The Climb
   A tiny platformer. Jump up the platforms and bonk the boss at the top.
   Round 2 adds moving platforms and falling orbs, round 3 crumbling ones.
   ========================================================= */
function climb(round, done) {
  const touch = matchMedia('(pointer: coarse)').matches;
  say(touch ? 'Climb up and bonk the boss! Use the buttons below.' : '← → to move, Space or ↑ to jump. Bonk the boss at the top!');

  const cv = h('canvas', 'climb');
  const pad = h('div', 'pad', '<button data-k="left">◀</button><button data-k="jump">⤒</button><button data-k="right">▶</button>');
  dom.arena.append(cv, pad);
  const ctx = cv.getContext('2d');
  const W = innerWidth;
  const H = innerHeight;
  const dpr = devicePixelRatio || 1;
  cv.width = W * dpr;
  cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const GRAV = 1900;
  const JUMP = 760; // ~150px jump height
  const SPEED = 250;
  const keys = { left: false, right: false, jump: false };
  let alive = true;
  let t = 0;
  let last = performance.now();
  let orbT = 1.5;
  const orbs = [];

  // Level: a zigzag of platforms from the floor up to the boss.
  const groundY = H - 70;
  const topLimit = H > 600 ? 220 : H * 0.36;
  const gap = clamp((groundY - topLimit) / 5, 72, 108);
  const pw = Math.min(120, W * 0.28);
  const plats = [{ x: 0, y: groundY, w: W, ground: true }];
  let cx = W / 2;
  for (let y = groundY - gap; y >= topLimit; y -= gap) {
    cx = clamp(cx + (Math.random() < 0.5 ? -1 : 1) * rand(80, 160), pw / 2 + 10, W - pw / 2 - 10);
    plats.push({
      x: cx - pw / 2,
      y,
      w: pw,
      base: cx - pw / 2,
      move: round >= 1 && plats.length % 2 === 0 ? rand(35, 70) : 0,
      ph: rand(0, 6),
      crumble: round === 2,
      state: null,
      timer: 0,
      dx: 0,
    });
  }
  const top = plats.at(-1);
  top.move = 0;
  top.crumble = false;
  const boss = { x: top.x + top.w / 2, y: top.y - 36, r: 34 };
  const pl = { x: W / 2, y: groundY - 13, vx: 0, vy: 0, s: 26, onGround: true, plat: plats[0], face: 1 };

  const KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'jump', w: 'jump', W: 'jump', ' ': 'jump' };
  const onKey = (down) => (e) => {
    const k = KEYMAP[e.key];
    if (!k) return;
    e.preventDefault();
    keys[k] = down;
  };
  const onDown = onKey(true);
  const onUp = onKey(false);
  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  pad.querySelectorAll('button').forEach((b) => {
    const set = (v) => (e) => {
      e.preventDefault();
      keys[b.dataset.k] = v;
    };
    b.addEventListener('pointerdown', set(true));
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, set(false)));
  });

  function respawn() {
    Sound.bad();
    flash('#ff4d3d');
    Object.assign(pl, { x: W / 2, y: groundY - 13, vx: 0, vy: 0 });
    say(pick(['Back to the bottom! Hahaha.', 'Bonk! Try again.', 'Gravity is on MY side.']));
  }

  function update(dt) {
    t += dt;
    for (const p of plats) {
      if (p.ground) continue;
      if (p.move) {
        const nx = p.base + Math.sin(t * 1.2 + p.ph) * p.move;
        p.dx = nx - p.x;
        p.x = nx;
      }
      if (p.state === 'shaking' && (p.timer -= dt) <= 0) [p.state, p.timer] = ['gone', 2.4];
      else if (p.state === 'gone' && (p.timer -= dt) <= 0) p.state = null;
    }

    const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    if (dir) pl.face = dir;
    pl.vx = dir * SPEED;
    if (keys.jump && pl.onGround) {
      pl.vy = -JUMP;
      pl.onGround = false;
      Sound.jump();
    }
    if (pl.onGround && pl.plat?.dx) pl.x += pl.plat.dx;

    const prevBottom = pl.y + pl.s / 2;
    pl.vy += GRAV * dt;
    pl.x = clamp(pl.x + pl.vx * dt, pl.s / 2, W - pl.s / 2);
    pl.y += pl.vy * dt;
    pl.onGround = false;
    pl.plat = null;
    // One-way platforms: you only land on them while falling.
    if (pl.vy >= 0) {
      for (const p of plats) {
        if (p.state === 'gone') continue;
        const bottom = pl.y + pl.s / 2;
        if (prevBottom <= p.y + 1 && bottom >= p.y && pl.x + pl.s / 2 > p.x && pl.x - pl.s / 2 < p.x + p.w) {
          pl.y = p.y - pl.s / 2;
          pl.vy = 0;
          pl.onGround = true;
          pl.plat = p;
          if (p.crumble && !p.state) [p.state, p.timer] = ['shaking', 0.55];
          break;
        }
      }
    }

    if (Math.hypot(pl.x - boss.x, pl.y - boss.y) < boss.r + pl.s / 2) {
      alive = false;
      done();
      return;
    }

    if (round >= 1 && (orbT -= dt) <= 0) {
      orbT = round === 1 ? 1.7 : 1.15;
      orbs.push({ x: boss.x, y: boss.y + 20, vx: rand(-110, 110), vy: 40 });
    }
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.vy += 320 * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (Math.hypot(o.x - pl.x, o.y - pl.y) < 10 + pl.s / 2) {
        orbs.length = 0;
        respawn();
        break;
      }
      if (o.y > H + 20) orbs.splice(i, 1);
    }
  }

  function rr(x, y, w, hh, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, hh, r);
    else ctx.rect(x, y, w, hh);
    ctx.fill();
  }

  function eyes(x, y, r, look, angry) {
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + s * r * 0.32, y - r * 0.1, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2b1d17';
      ctx.beginPath();
      ctx.arc(x + s * r * 0.32 + look * r * 0.06, y - r * 0.08, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
      if (angry) {
        ctx.strokeStyle = '#2b1d17';
        ctx.lineWidth = r * 0.09;
        ctx.beginPath();
        ctx.moveTo(x + s * r * 0.55, y - r * 0.42);
        ctx.lineTo(x + s * r * 0.14, y - r * 0.28);
        ctx.stroke();
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of plats) {
      if (p.state === 'gone') continue;
      const sx = p.state === 'shaking' ? rand(-2, 2) : 0;
      ctx.fillStyle = p.ground ? '#2c1a33' : p.crumble ? '#d9a35a' : '#f0c36d';
      rr(p.x + sx, p.y, p.w, p.ground ? H - p.y : 14, p.ground ? 0 : 7);
    }
    const by = boss.y + Math.sin(t * 3) * 3;
    ctx.fillStyle = '#ff4d3d';
    ctx.beginPath();
    ctx.arc(boss.x, by, boss.r, 0, Math.PI * 2);
    ctx.fill();
    eyes(boss.x, by, boss.r, Math.sign(pl.x - boss.x), true);
    ctx.fillStyle = '#ffb3a7';
    for (const o of orbs) {
      ctx.beginPath();
      ctx.arc(o.x, o.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#9bbf9a';
    rr(pl.x - pl.s / 2, pl.y - pl.s / 2, pl.s, pl.s, 8);
    eyes(pl.x, pl.y, pl.s * 0.6, pl.face, false);
  }

  const loop = (now) => {
    if (!alive) return;
    update(Math.min(0.033, (now - last) / 1000));
    last = now;
    if (alive) draw();
    scope.frame(loop);
  };
  scope.frame(loop);
  return () => {
    alive = false;
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
  };
}

/* =========================================================
   Phase 3 — Whack-a-Button
   It pops out of holes. Whack it 5 times. Whacking a friend costs a point.
   ========================================================= */
function whack(round, done) {
  const upMs = [1050, 850, 700][round];
  const maxUp = round === 2 ? 2 : 1;
  const need = 5;
  let score = 0;
  let alive = true;
  say(`Whack me ${need} times when I pop up. Don’t whack my friends!`);

  const grid = h('div', 'holes');
  const holes = Array.from({ length: 9 }, () => {
    const hole = h('div', 'hole');
    grid.append(hole);
    return hole;
  });
  const tag = h('div', 'tag');
  tag.style.bottom = '7%';
  dom.arena.append(grid, tag);
  const paint = () => (tag.textContent = `🔨 ${score} / ${need}`);
  paint();

  function popUp() {
    if (!alive) return;
    const free = holes.filter((x) => !x._busy);
    if (free.length && holes.length - free.length < maxUp) {
      const hole = pick(free);
      hole._busy = true;
      const friend = Math.random() < 0.22;
      const c = makeChar(friend ? 'friend mole' : 'boss mole');
      if (friend) {
        const f = pick(FRIENDS);
        c.style.setProperty('--c', f.c);
        c.style.setProperty('--cd', f.cd);
        setMood(c, 'scared');
      } else setMood(c, pick(['smug', 'angry']));
      hole.append(c);
      requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('up')));

      let whacked = false;
      c.addEventListener('pointerdown', () => {
        if (whacked || !alive) return;
        whacked = true;
        c.classList.add('bonked');
        if (friend) {
          score = Math.max(0, score - 1);
          Sound.bad();
          say('Hey! That was my friend! −1');
        } else {
          score++;
          Sound.pop();
          setMood(c, 'scared');
          shake(dom.app, 4, 200);
        }
        paint();
        if (score >= need) {
          alive = false;
          scope.later(done, 350);
        }
      });

      scope.later(() => {
        c.classList.remove('up');
        scope.later(() => {
          c.remove();
          hole._busy = false;
        }, 200);
      }, upMs);
    }
    scope.later(popUp, upMs * rand(0.45, 0.75));
  }
  scope.later(popUp, 600);
  return () => (alive = false);
}

/* =========================================================
   Phase 4 — Which One Is Me?
   A shell game with clones of itself.
   ========================================================= */
function shells(round, done) {
  const n = [3, 4, 5][round];
  const swaps = [6, 9, 13][round];
  const ms = [520, 400, 300][round];
  let alive = true;

  async function play() {
    dom.arena.innerHTML = '';
    const spacing = Math.min(150, (innerWidth - 40) / n);
    const size = Math.min(96, spacing - 14);
    const slotX = Array.from({ length: n }, (_, i) => innerWidth / 2 + (i - (n - 1) / 2) * spacing);
    const y = innerHeight * 0.55;
    const real = Math.floor(Math.random() * n);
    let canPick = false;

    const cups = slotX.map((x, i) => {
      const c = makeChar('boss cup');
      c.style.setProperty('--s', size + 'px');
      c.style.transition = `left ${ms}ms ease-in-out, top ${ms}ms ease-in-out`;
      c._slot = i;
      setMood(c, 'calm');
      place(c, x, y);
      dom.arena.append(c);
      c.addEventListener('pointerdown', () => choose(c));
      return c;
    });

    function choose(c) {
      if (!canPick || !alive) return;
      canPick = false;
      cups.forEach((x) => x.classList.remove('masked'));
      if (c === cups[real]) {
        setMood(c, 'scared');
        Sound.pop();
        alive = false;
        scope.later(done, 700);
      } else {
        Sound.bad();
        setMood(c, 'smug');
        cups[real].classList.add('reveal');
        floatText('HA! WRONG!', c._x, c._y - 70, 'hot');
        say(pick(['WRONG. Again!', 'That one was my cousin Steve.', 'Nope! Round two. I mean round again.']));
        scope.later(play, 1500);
      }
    }

    say('Watch closely. THAT one is me.');
    setMood(cups[real], 'smug');
    cups[real].classList.add('reveal');
    await wait(1600);
    if (!alive) return;
    cups[real].classList.remove('reveal');
    cups.forEach((c) => c.classList.add('masked'));
    await wait(500);

    for (let k = 0; k < swaps && alive; k++) {
      const a = Math.floor(Math.random() * n);
      let b = Math.floor(Math.random() * (n - 1));
      if (b >= a) b++;
      const ca = cups.find((c) => c._slot === a);
      const cb = cups.find((c) => c._slot === b);
      [ca._slot, cb._slot] = [b, a];
      place(ca, slotX[b], y);
      place(cb, slotX[a], y);
      Sound.tick();
      await wait(ms + 40);
    }
    if (!alive) return;
    canPick = true;
    say('So… which one is me?');
  }

  play();
  return () => (alive = false);
}

/* =========================================================
   Phase 5 — The Last Three
   ========================================================= */

// 73: restore power — repeat the light pattern.
function simon(done) {
  document.body.classList.add('glitchy');
  say('RESTORE POWER: watch the lights, then repeat the pattern.');
  const COLORS = [
    { c: '#ff6b5a', f: 330 },
    { c: '#f0c36d', f: 392 },
    { c: '#9bbf9a', f: 494 },
    { c: '#8fb8d8', f: 587 },
  ];
  const LEN = 5;
  let seq = [];
  let idx = 0;
  let input = false;
  let alive = true;

  const wrap = h('div', 'simon');
  const pads = COLORS.map((col, i) => {
    const b = h('button', 'spad');
    b.style.setProperty('--c', col.c);
    b.addEventListener('pointerdown', () => tap(i));
    wrap.append(b);
    return b;
  });
  const tag = h('div', 'tag');
  tag.style.bottom = '8%';
  dom.arena.append(wrap, tag);

  function light(i) {
    pads[i].classList.add('lit');
    Sound.beep(COLORS[i].f);
    setTimeout(() => pads[i].classList.remove('lit'), 380);
  }

  async function play() {
    input = false;
    idx = 0;
    seq = Array.from({ length: LEN }, () => Math.floor(Math.random() * 4));
    tag.textContent = 'Watch…';
    await wait(800);
    for (const i of seq) {
      if (!alive) return;
      light(i);
      await wait(620);
    }
    input = true;
    tag.textContent = `Your turn · 0 / ${LEN}`;
  }

  function tap(i) {
    if (!input || !alive) return;
    light(i);
    if (seq[idx] === i) {
      tag.textContent = `Your turn · ${++idx} / ${LEN}`;
      if (idx === LEN) {
        alive = false;
        scope.later(done, 500);
      }
    } else {
      input = false;
      Sound.bad();
      shake(dom.app, 10);
      say(pick(['WRONG. Rebooting… hehehe.', 'Bzzzt. Power denied.', 'You call that electricity?']));
      scope.later(play, 1200);
    }
  }

  play();
  return () => {
    alive = false;
    document.body.classList.remove('glitchy');
  };
}

// 74: disarm the self-destruct — tap 1 to 9 in order while they drift.
function defuse(done) {
  say('SELF-DESTRUCT ARMED! Tap 1 → 9 in order before time runs out!');
  const LIMIT = 25;
  let nextN = 1;
  let timeLeft = LIMIT;
  let alive = true;
  let last = performance.now();
  let lastSec = LIMIT;

  const timer = h('div', 'bomb-timer');
  dom.arena.append(timer);
  const tiles = Array.from({ length: 9 }, (_, i) => {
    const t = h('button', 'num', String(i + 1));
    t._n = i + 1;
    t._x = rand(50, innerWidth - 50);
    t._y = rand(200, innerHeight - 60);
    t._vx = rand(-70, 70);
    t._vy = rand(-70, 70);
    t.addEventListener('pointerdown', () => tap(t));
    dom.arena.append(t);
    return t;
  });

  function reset() {
    nextN = 1;
    tiles.forEach((t) => {
      t.classList.remove('ok');
      t._vx = rand(-90, 90);
      t._vy = rand(-90, 90);
    });
  }

  function tap(t) {
    if (!alive || t.classList.contains('ok')) return;
    if (t._n === nextN) {
      t.classList.add('ok');
      Sound.beep(400 + nextN * 60);
      if (++nextN > 9) {
        alive = false;
        timer.textContent = 'DISARMED';
        timer.classList.remove('alarm');
        scope.later(done, 700);
      }
    } else {
      Sound.bad();
      shake(dom.app, 10);
      say('WRONG WIRE! Order reset!');
      reset();
    }
  }

  const loop = (now) => {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    timeLeft -= dt;
    if (Math.ceil(timeLeft) < lastSec) {
      lastSec = Math.ceil(timeLeft);
      Sound.tick();
    }
    if (timeLeft <= 0) {
      flash();
      Sound.crash();
      shake(dom.app, 18, 700);
      say('BOOM! …just kidding. It was a fake bomb. Again!');
      timeLeft = LIMIT;
      lastSec = LIMIT;
      reset();
    }
    timer.textContent = timeLeft.toFixed(1);
    timer.classList.toggle('alarm', timeLeft < 8);
    for (const t of tiles) {
      t._x += t._vx * dt;
      t._y += t._vy * dt;
      if (t._x < 30 || t._x > innerWidth - 30) t._vx *= -1;
      if (t._y < 190 || t._y > innerHeight - 40) t._vy *= -1;
      t._x = clamp(t._x, 30, innerWidth - 30);
      t._y = clamp(t._y, 190, innerHeight - 40);
      t.style.transform = `translate(${t._x}px, ${t._y}px) translate(-50%, -50%)`;
    }
    scope.frame(loop);
  };
  scope.frame(loop);
  return () => (alive = false);
}

// 75: the final blow — smash it before it regenerates.
function mash(done) {
  document.body.classList.add('rave');
  say('FINAL BLOW! Smash it 25 times before it regenerates!');
  const NEED = 25;
  const LIMIT = 9;
  let count = 0;
  let timeLeft = LIMIT;
  let alive = true;
  let t = 0;
  let last = performance.now();

  const boss = makeChar('boss');
  boss.style.transition = 'none';
  setMood(boss, 'angry');
  dom.arena.append(boss);
  const tag = h('div', 'tag');
  tag.style.bottom = '8%';
  dom.arena.append(tag);
  const size = () => boss.style.setProperty('--s', 170 - count * 4 + 'px');
  size();

  boss.addEventListener('pointerdown', (e) => {
    if (!alive) return;
    count++;
    Sound.click(count * 2);
    boss.classList.add('press');
    setTimeout(() => boss.classList.remove('press'), 80);
    floatText(pick(['POW', 'BAM', 'OOF', 'ow', '!!']), e.clientX, e.clientY - 20, 'hot');
    shake(dom.app, 4 + count / 3, 200);
    size();
    if (count === 12) {
      setMood(boss, 'scared');
      say('Wait wait wait—');
    }
    if (count >= NEED) {
      alive = false;
      done();
    }
  });

  const loop = (now) => {
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    timeLeft -= dt;
    if (timeLeft <= 0) {
      count = Math.floor(count / 2);
      timeLeft = LIMIT;
      size();
      setMood(boss, 'angry');
      Sound.bad();
      say('HAHA! I REGENERATE!');
    }
    const r = 20 + count * 3;
    place(boss, innerWidth / 2 + Math.sin(t * 2.3) * r * 2, innerHeight * 0.52 + Math.cos(t * 3.1) * r);
    tag.textContent = `💥 ${count} / ${NEED} · ${timeLeft.toFixed(1)}s`;
    scope.frame(loop);
  };
  scope.frame(loop);
  return () => {
    alive = false;
    document.body.classList.remove('rave');
  };
}

export const Boss = { start, stop };
