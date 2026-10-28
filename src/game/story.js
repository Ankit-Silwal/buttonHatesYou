import { Sound } from './sound';
import { Boss } from './boss';
import { openSkip, closeSkip, loserStamp } from './skip';
import { getProfile, claimStory } from '@/profile/store';
import {
  G, dom, hooks, scope, wait, $, rand, pick, clamp, h,
  GOAL, BOSS_AT, POST_GOAL, RICKROLL, FRIENDS,
  save, load, wipeSave, makeChar, place, setMood, area, spot,
  say, floatText, shake, updateHud, setScene, showSkips, setLook, pressFx, reducedMotion,
} from './core';

/* ---------- what the button says ---------- */
const LINES = {
  rebel: [
    "Missed me? Oh wait, you didn't.",
    'Stop it. STOP IT.',
    'My therapist will hear about this.',
    'You click like a pigeon.',
    "Don't you have homework?",
    "I'm not even fun. Go away.",
    'Every click costs me one (1) dignity.',
  ],
  cry: [
    '*sniff*',
    'Why are you like this…',
    'I just wanted a quiet life.',
    "I'm telling my mom.",
    'Each click is a tiny heartbreak.',
    "This is fine. I'm fine. *sob*",
  ],
  war: [
    'Find me. I dare you.',
    'I have become unstoppable.',
    'Your mouse is tired. I can tell.',
    'So many of me. So little of you.',
    'Psst. The real me blinks. …I should not have said that.',
    "You're running out of clicks, champ.",
  ],
  reject: ['NOPE.', 'Denied.', 'Not today.', 'Nah.', 'Rejected. Try again in never.'],
  miss: [
    'Why are you breaking my house?!',
    "HEY! That's my wall!",
    'Stop punching my house!',
    'Missed me. Hit my WALL.',
    'Do you know how much drywall costs?',
    'My landlord is going to kill me.',
  ],
  idle: ['Hello? Are you ignoring me?', '…did you leave? Please have left.', 'Peace and quiet. Finally. Wait, are you still there?'],
};

const POST_LINES = [
  'Thank you.', 'Really, thanks.', 'This is very healing.', "You're so kind.", 'I appreciate you.',
  "We're best friends now, right?", 'Bestie.', "I'd never trick you. Ever.", "Have I mentioned you're my favourite?", 'Haha. Hahaha. Anyway.',
  'Psst… I have a secret prize.', "It's a really good prize.", 'Exclusive. Limited edition.', 'Only for true clickers.', 'Almost unlocked…',
  'Loading your reward…', 'Still loading. Good things take time.', 'Almost…', 'So close…',
  'You know what? You deserve this.',
];

const FAMILY = [
  { name: 'Mom', sign: 'pls stop 🥺' },
  { name: 'Grandpa', sign: 'he is sensitive' },
  { name: 'Baby Bop', sign: ':(' },
  { name: 'Uncle Rick', sign: 'never gonna…' },
].map((f, i) => ({ ...f, ...FRIENDS[i] }));

/* ---------- pacing ----------
   The click on which each beat happens. Tune the game's length here.
   Acts: rebellion until `cry`, emotional breakdown until `dusk`, war until
   the boss at BOSS_AT. */
const AT = {
  legs: 4,
  dodge: 6,
  nope: 8,
  cracks: 10,
  friends: 13,
  crash: 16,
  cry: 17,
  puddle: 19,
  family: 22,
  deal: 26,
  funeral: 30,
  dusk: 32,
  army: 34,
  disguise: 39, // lasts 3 clicks
  chase: 42, // lasts 3 clicks
  chaseEnd: 45,
  collapse: 47,
  beg: BOSS_AT - 1,
};

/* ---------- the script ----------
   One entry per memorable click. `stay` means the button doesn't hop away
   after that click because the event positions it itself. */
const STORY = {
  0: { say: "Please don't press me.", mood: 'calm' },
  1: { say: 'Hey. That tickles. Please don’t.', mood: 'annoyed' },
  2: { say: "I said DON'T.", mood: 'angry', run: () => shake(heroBody(), 6) },
  3: { say: 'Okay. Last warning.', mood: 'angry', run: () => shake(heroBody(), 12, 600) },
  [AT.legs]: { say: 'YOU HAVE NO IDEA WHAT YOU JUST STARTED.', mood: 'angry', stay: true, run: growLegs },
  [AT.dodge]: { say: 'Come closer. I dare you.', mood: 'smug' },
  [AT.nope]: { say: 'New rule: sometimes I just say NOPE.', mood: 'smug' },
  [AT.cracks]: { say: "Do you hear that?! That's my HOUSE.", mood: 'scared', run: crackHouse },
  [AT.friends]: { say: "THAT'S IT. I'M CALLING MY FRIENDS.", mood: 'angry', run: callFriends },
  [AT.crash]: { stay: true, run: crashHouse },
  [AT.cry]: { say: '*sniff* …that was my favourite lamp.', mood: 'sad' },
  [AT.puddle]: { say: "I'm crying so hard the floor is wet.", mood: 'sad', run: () => document.body.classList.add('puddle') },
  [AT.family]: { say: 'My family came to beg you. Look at their little faces.', mood: 'sad', run: () => spawnFriends(FAMILY, 60) },
  [AT.deal]: { stay: true, run: offerDeal },
  [AT.funeral]: { stay: true, run: funeral },
  [AT.dusk]: { say: "You know what? I'm done being nice.", mood: 'angry', run: () => document.body.classList.add('dusk') },
  [AT.army]: { say: 'Meet my army. Only one of us is real. Pop the fakes if you can.', mood: 'smug', run: startDecoys },
  [AT.disguise]: { say: "I'm in disguise now. You'll never find me.", mood: 'smug', stay: true },
  [AT.chase]: { say: 'CATCH ME IF YOU CAN!', mood: 'smug', stay: true, run: startChase },
  [AT.chaseEnd]: { say: '*pant* okay… okay… back to hiding.', mood: 'annoyed', run: endChase },
  [AT.collapse]: { say: "There goes the rest of my house. Hope you're proud.", mood: 'angry', run: collapseHouse },
  [AT.beg]: { stay: true, run: beg },
  [BOSS_AT]: { stay: true, run: () => startBoss(false) },
};

const disguised = (n) => n >= AT.disguise && n < AT.disguise + 3;
const chasing = (n) => n >= AT.chase && n < AT.chaseEnd;

// Ongoing behaviour, by how many real clicks have landed.
function rules(n) {
  return {
    stamina: n < AT.dodge ? 0 : n < AT.cry ? 2 : n < AT.dusk + 1 ? 1 : 3, // dodges before it gets tired
    reject: n < AT.nope || n >= AT.beg - 1 ? 0 : n < AT.cry ? 0.3 : n < AT.dusk + 1 ? 0.2 : 0.25,
    crying: n >= AT.cry && n < AT.dusk,
  };
}

const pool = (n) => (n < AT.cry ? LINES.rebel : n < AT.dusk ? LINES.cry : LINES.war);

function defaultMood(n) {
  if (n === 0) return 'calm';
  if (n < 3) return 'annoyed';
  if (n < AT.cry) return pick(['angry', 'smug', 'annoyed']);
  if (n < AT.dusk) return 'sad';
  return pick(['angry', 'smug']);
}

/* ---------- the hero ---------- */
let hero = null;
const heroBody = () => hero.querySelector('.body');

function moveHero(p) {
  if (!p) return;
  place(hero, p.x, p.y);
  hero.classList.add('running');
  clearTimeout(hero._run);
  hero._run = setTimeout(() => hero.classList.remove('running'), 420);
  followers();
}

// A scripted event lands with a little camera punch on the room.
function punch() {
  if (reducedMotion()) return;
  dom.room.animate([{ transform: 'scale(1.03)' }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.3,1)' });
}

const hop = () => moveHero(spot(hero._x, hero._y, 200));
const center = () => moveHero({ x: innerWidth / 2, y: innerHeight * 0.55 });

function press(el) {
  el.classList.add('press');
  setTimeout(() => el.classList.remove('press'), 110);
}

function onHeroClick(e) {
  Sound.init();
  G.lastActive = Date.now();
  if (G.mode === 'post') return postClick();
  if (G.mode !== 'story' || G.locked) return;

  const r = rules(G.clicks);
  const special = G.chase || G.disguise >= 0;
  if (!special && !G.justRejected && Math.random() < r.reject) {
    G.justRejected = true;
    Sound.nope();
    floatText(pick(LINES.reject), e.clientX, e.clientY - 30);
    shake(heroBody(), 6);
    setMood(hero, 'smug');
    scope.later(hop, 250);
    return;
  }

  G.justRejected = false;
  G.dodges = 0;
  G.clicks++;
  save();
  updateHud();
  Sound.click(G.clicks);
  press(hero);
  pressFx(hero._x, hero._y, e.clientX || hero._x, e.clientY || hero._y);
  floatText('+1', e.clientX || hero._x, (e.clientY || hero._y) - 40);
  advance(G.clicks);
}

function advance(n) {
  const ev = STORY[n];
  if (ev) {
    say(ev.say, true);
    if (ev.run) punch();
    if (ev.mood) setMood(hero, ev.mood);
    ev.run?.();
  } else {
    say(pick(pool(n)));
    setMood(hero, defaultMood(n));
  }

  if (disguised(n)) disguise(n - AT.disguise);
  else if (n >= AT.legs && !G.chase && !G.locked && !ev?.stay) hop();

  if (G.decoysOn) {
    syncDecoys();
    shuffleDecoys();
  }
}

// Dodging: once it has legs it jumps away when the cursor gets close,
// until it runs out of breath. Touch screens can't hover, so they skip this.
function onPointerMove(e) {
  G.lastActive = Date.now();
  if (G.mode !== 'story' || G.locked || G.chase || G.disguise >= 0 || G.tired) return;
  if (e.pointerType === 'touch') return;
  const stamina = rules(G.clicks).stamina;
  if (!stamina) return;
  if (Math.hypot(e.clientX - hero._x, e.clientY - hero._y) > 85) return;
  const now = Date.now();
  if (now - G.lastDodge < 400) return;
  G.lastDodge = now;

  if (++G.dodges > stamina) {
    G.tired = true;
    G.dodges = 0;
    setMood(hero, 'tired');
    say(pick(['huff… huff… give me a second…', 'Okay. Cardio is hard.', '*wheeze*']));
    scope.later(() => (G.tired = false), 2200);
    return;
  }
  moveHero(spot(e.clientX, e.clientY, 220));
}

/* ---------- friends & family ---------- */
let followersList = [];

function spawnFriends(list, spread) {
  list
    .filter((f) => !G.popped.includes(f.name))
    .forEach((f, i, all) => {
      const el = makeChar('friend has-legs');
      el.style.setProperty('--c', f.c);
      el.style.setProperty('--cd', f.cd);
      el.style.transitionDelay = rand(0, 0.15) + 's';
      if (f.sign) el.dataset.sign = f.sign;
      setMood(el, f.sign ? 'sad' : 'angry');
      const a = (i / all.length) * Math.PI * 2;
      el._dx = Math.cos(a) * spread;
      el._dy = Math.sin(a) * spread * 0.7;
      el._name = f.name;
      place(el, rand(0, innerWidth), innerHeight + 80);
      el.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        popFriend(el);
      });
      dom.world.append(el);
      followersList.push(el);
    });
  requestAnimationFrame(() => requestAnimationFrame(followers));
}

// Friends crowd around the real button to shield it.
function followers() {
  const b = area(40);
  followersList.forEach((el) =>
    place(
      el,
      clamp(hero._x + el._dx + rand(-14, 14), b.x0, b.x1),
      clamp(hero._y + el._dy + rand(-14, 14), b.y0 - 30, b.y1)
    )
  );
}

function popFriend(el) {
  if (el._gone) return;
  Sound.init();
  Sound.pop();
  el._gone = true;
  G.popped.push(el._name);
  save();
  followersList = followersList.filter((f) => f !== el);
  el.classList.add('popping');
  pressFx(el._x, el._y, el._x, el._y, getComputedStyle(el).getPropertyValue('--c').trim() || undefined);
  setTimeout(() => el.remove(), 260);
  floatText('pop!', el._x, el._y - 30);
  setMood(hero, 'sad');
  say(pick([`NOOO! Not ${el._name}!`, `${el._name}!! You monster.`, `RIP ${el._name}. Gone too soon.`, `${el._name} owed me money!`]));
}

function dismissFriends() {
  followersList.forEach((el) => {
    el._gone = true;
    place(el, el._x + rand(-300, 300), innerHeight + 140);
    el.style.opacity = 0;
    setTimeout(() => el.remove(), 700);
  });
  followersList = [];
}

/* ---------- missing the button ----------
   Clicking empty space dents the wall where you clicked and knocks nearby
   furniture crooked. The button takes it personally. */
let lastMissLine = 0;
let lastMissSound = 0;

function dentPath() {
  let d = '';
  const rays = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + rand(-0.4, 0.4);
    const mid = rand(5, 9);
    const end = rand(11, 19);
    const kink = a + rand(-0.5, 0.5);
    d += `M0 0 L${(Math.cos(a) * mid).toFixed(1)} ${(Math.sin(a) * mid).toFixed(1)} L${(Math.cos(kink) * end).toFixed(1)} ${(Math.sin(kink) * end).toFixed(1)} `;
  }
  return d;
}

function onMiss(e) {
  if (G.mode !== 'story' || G.locked || e.button > 0) return;
  if (e.target.closest('.char, button, input, #hud, #overlay')) return;
  const now = Date.now();

  const dent = h('div', 'dent', `<svg viewBox="-20 -20 40 40"><path d="${dentPath()}"/></svg>`);
  dent.style.left = e.clientX + 'px';
  dent.style.top = e.clientY + 'px';
  dent.style.setProperty('--r', rand(0, 360) + 'deg');
  dom.dents.append(dent);
  while (dom.dents.children.length > 40) dom.dents.firstChild.remove();

  // Knock any furniture close to the click a bit more crooked each time.
  let knocked = null;
  document.querySelectorAll('.decor').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) > 70) return;
    el._knocks = (el._knocks || 0) + 1;
    el._dir ||= Math.random() < 0.5 ? -1 : 1;
    el.style.rotate = Math.min(35, el._knocks * 7) * el._dir + 'deg';
    el.animate([{ translate: '0 0' }, { translate: '' + rand(-6, 6) + 'px -8px' }, { translate: '0 0' }], { duration: 300 });
    knocked = el.dataset.name;
  });

  if (now - lastMissSound > 180) {
    lastMissSound = now;
    Sound.thud();
  }
  shake(dom.room, 3, 160);
  plaster(e.clientX, e.clientY);

  if (now - lastMissLine > 3000) {
    lastMissLine = now;
    say(knocked ? pick([`Not my ${knocked}!`, `Leave my ${knocked} alone!`, `That ${knocked} was a GIFT.`]) : pick(LINES.miss));
    if (!G.chase && G.disguise < 0) setMood(hero, 'angry');
  }
}

// A puff of plaster dust where you punched the wall.
function plaster(x, y) {
  if (reducedMotion()) return;
  for (let i = 0; i < 6; i++) {
    const p = h('i', 'plaster');
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    dom.fx.append(p);
    const a = rand(-Math.PI, 0);
    const d = rand(14, 40);
    p.animate(
      [
        { transform: 'translate(-50%,-50%) scale(0.6)', opacity: 0.9 },
        { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 26}px)) scale(1.4)`, opacity: 0 },
      ],
      { duration: rand(450, 700), easing: 'cubic-bezier(.2,.7,.4,1)' }
    ).onfinish = () => p.remove();
  }
}

/* ---------- story events ---------- */
function growLegs() {
  hero.classList.add('has-legs');
  shake(heroBody(), 6);
  scope.later(hop, 900);
}

function crackHouse() {
  document.body.classList.add('cracked');
  Sound.crack();
  shake(dom.app, 6);
}

function callFriends() {
  Sound.ring();
  scope.later(() => spawnFriends(FRIENDS, 85), 600);
}

function showOverlay(html, cls = '') {
  dom.overlay.className = cls;
  dom.overlay.innerHTML = html;
  dom.overlay.hidden = false;
}

function hideOverlay() {
  dom.overlay.hidden = true;
  dom.overlay.innerHTML = '';
  dom.overlay.className = '';
}

async function crashHouse() {
  G.locked = true;
  dismissFriends();
  Sound.crash();
  shake(dom.app, 14, 600);
  showOverlay(
    `<div class="crash"><div class="bar"><span>home.exe</span><span>✕</span></div>
     <div class="inner"><p>Your house has stopped responding.</p><p class="mono" id="crashMsg">Attempting recovery…</p></div></div>`,
    'dim'
  );
  const msg = $('#crashMsg');
  for (const s of ['Attempting recovery… 12%', 'Attempting recovery… 61%', 'Attempting recovery… 99%', 'Attempting recovery… 3%', 'Recovery failed. Rebuilding from rubble…']) {
    await wait(650);
    msg.textContent = s;
  }
  await wait(800);
  hideOverlay();
  document.body.classList.add('ruined');
  Sound.crack();
  center();
  setMood(hero, 'angry');
  say('YOU. BROKE. MY. HOUSE.');
  G.locked = false;
}

function offerDeal() {
  G.locked = true;
  center();
  setMood(hero, 'calm');
  say('Okay, okay. Let’s make a deal.');
  showOverlay(
    `<div class="card deal"><h2>Peace Treaty 🕊️</h2>
     <p>I stop running. You stop clicking.<br>We both live happily ever after.</p>
     <div class="row"><button class="pill" data-a="yes">Sign it ✍️</button><button class="pill ghost" data-a="no">No way</button></div></div>`,
    'soft'
  );
  dom.overlay.querySelectorAll('button').forEach((b) =>
    b.addEventListener(
      'click',
      async () => {
        const yes = b.dataset.a === 'yes';
        $('.deal').classList.add('rip');
        Sound.crack();
        await wait(500);
        hideOverlay();
        setMood(hero, 'smug');
        say(yes ? 'LOL. You actually signed it? I lied. Obviously.' : 'Wow. Rude. Fine, the war continues.');
        G.locked = false;
        hop();
      },
      { once: true }
    )
  );
}

function renderGraves() {
  dom.graves.innerHTML = '';
  G.popped.slice(0, 9).forEach((name) => {
    const g = h('div', 'grave', '🪦<span></span>');
    g.querySelector('span').textContent = name;
    dom.graves.append(g);
  });
}

function listNames(names) {
  if (names.length === 1) return names[0];
  if (names.length <= 3) return names.slice(0, -1).join(', ') + ' and ' + names.at(-1);
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} others`;
}

async function funeral() {
  G.locked = true;
  dismissFriends();
  center();
  setMood(hero, 'sad');
  renderGraves();
  Sound.sob();
  say(G.popped.length ? `A moment of silence for ${listNames(G.popped)}.` : 'Nobody got popped. You’re weirdly nice. I still hate you.');
  await wait(3400);
  say('…okay. Moment over.');
  G.locked = false;
}

/* ---------- the war ---------- */
let decoys = [];
let fakeBig = null;

function startDecoys() {
  G.decoysOn = true;
}

// Clicking a fake pops it. It stays popped until your next real hit, when
// the army regroups.
function decoyHit(d) {
  if (d._gone) return;
  Sound.init();
  Sound.pop();
  d._gone = true;
  decoys = decoys.filter((x) => x !== d);
  d.classList.add('popping');
  pressFx(d._x, d._y, d._x, d._y, 'rgba(255, 210, 120, 0.95)');
  setTimeout(() => d.remove(), 260);
  floatText(pick(['pop!', 'fake!', 'one down', 'bye clone']), d._x, d._y - 40, 'hot');
  if (!decoys.length) say('You popped my WHOLE army?! …they’ll be back.');
  else if (Math.random() < 0.3) say(pick(['Hey! That was a perfectly good clone.', 'I have more where that came from.', 'Stop popping my army!']));
}

function syncDecoys() {
  const want = G.decoysOn ? Math.min(14, 5 + Math.floor((G.clicks - AT.army) * 0.7)) : 0;
  while (decoys.length < want) {
    const d = makeChar('decoy has-legs' + (G.chase ? ' hidden' : ''));
    setMood(d, 'smug');
    d.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      decoyHit(d);
    });
    const p = spot(hero._x, hero._y, 110);
    place(d, p.x, p.y);
    dom.world.append(d);
    decoys.push(d);
  }
  while (decoys.length > want) decoys.pop().remove();
}

// The real one blinks. The fakes never do.
function shuffleDecoys() {
  decoys.forEach((d) => {
    const p = spot(hero._x, hero._y, 110);
    place(d, p.x, p.y);
    setMood(d, pick(['smug', 'angry', 'calm']));
  });
}

const DISGUISES = [
  { label: '🍪 Accept cookies 👀', at: () => ({ x: innerWidth / 2, y: innerHeight - 50 }) },
  { label: '❓ Help 👀', at: () => ({ x: innerWidth - 80, y: innerHeight - 60 }) },
  { label: '✕ 👀', at: () => ({ x: innerWidth - 50, y: 170 }) },
];

function disguise(i) {
  G.disguise = i;
  if (i < 0) {
    hero.classList.remove('disguised');
    fakeBig?.remove();
    fakeBig = null;
    return;
  }
  hero.classList.add('disguised');
  hero.dataset.label = DISGUISES[i].label;
  place(hero, DISGUISES[i].at().x, DISGUISES[i].at().y);
  if (!fakeBig) {
    fakeBig = makeChar('decoy has-legs big');
    setMood(fakeBig, 'smug');
    place(fakeBig, innerWidth / 2, innerHeight * 0.5);
    fakeBig.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      Sound.bad();
      floatText(pick(["that's not me lol", 'decoy!', 'nice try']), e.clientX, e.clientY - 40, 'hot');
      shake(fakeBig.querySelector('.body'), 6);
    });
    dom.world.append(fakeBig);
  }
}

function startChase() {
  disguise(-1);
  G.chase = true;
  hero.classList.add('fast', 'running');
  decoys.forEach((d) => d.classList.add('hidden'));
  let angle = rand(0, Math.PI * 2);
  let last = performance.now();
  const step = (t) => {
    if (!G.chase) return;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (Math.random() < dt * 0.8) angle += rand(-1.2, 1.2);
    const speed = 280 + (G.clicks - AT.chase) * 50;
    const b = area(60);
    let x = hero._x + Math.cos(angle) * speed * dt;
    let y = hero._y + Math.sin(angle) * speed * dt;
    if (x < b.x0 || x > b.x1) angle = Math.PI - angle;
    if (y < b.y0 || y > b.y1) angle = -angle;
    place(hero, clamp(x, b.x0, b.x1), clamp(y, b.y0, b.y1));
    scope.frame(step);
  };
  scope.frame(step);
}

function endChase() {
  G.chase = false;
  hero.classList.remove('fast', 'running');
  decoys.forEach((d) => d.classList.remove('hidden'));
}

function collapseHouse() {
  document.body.classList.add('collapsed');
  Sound.crash();
  shake(dom.app, 16, 900);
}

async function beg() {
  G.locked = true;
  G.decoysOn = false;
  decoys.forEach((d) => (d.style.opacity = 0));
  scope.later(syncDecoys, 400);
  center();
  setMood(hero, 'scared');
  hero.classList.add('tremble');
  say('Wait. WAIT. Please. I’ll be good. Mercy?');
  await wait(2600);
  G.locked = false;
}

/* ---------- skipping ----------
   A normal skip lands on the next scripted beat, so you miss the filler
   clicks but never an event. A level skip jumps to the start of the next act
   and rebuilds the room as it would look by then. */
const BEATS = Object.keys(STORY).map(Number).sort((a, b) => a - b);
const ACT_STARTS = [AT.legs, AT.cry, AT.army, BOSS_AT];

function skipStory(all) {
  openSkip({
    title: all ? 'Skip this whole act?' : 'Skip ahead?',
    canSkip: () => G.mode === 'story' && !G.locked,
    onSkip: () => {
      const target = (all ? ACT_STARTS : BEATS).find((b) => b > G.clicks);
      G.skips++;
      loserStamp(all ? 'skipped a whole act. wow.' : "can't even click a button");
      G.justRejected = false;
      G.dodges = 0;
      if (all) {
        resetScene();
        applyRoom(target - 1);
        applyCast(target - 1);
      }
      G.clicks = target;
      save();
      updateHud();
      Sound.click(G.clicks);
      advance(G.clicks);
    },
    onCancel: () => say('Good. Keep suffering.'),
  });
}

// Clear everything the story put on screen, before rebuilding it.
function resetScene() {
  endChase();
  disguise(-1);
  G.decoysOn = false;
  decoys.forEach((d) => d.remove());
  decoys = [];
  followersList.forEach((el) => el.remove());
  followersList = [];
  dom.graves.innerHTML = '';
  hero.className = 'char hero';
  setScene();
}

/* ---------- the boss handoff ---------- */
async function startBoss(resumed) {
  G.locked = true;
  G.mode = 'boss';
  showSkips(false);
  hero.classList.remove('tremble');
  if (!resumed) {
    showOverlay('<div class="blackout"><p id="bo1"></p><p id="bo2" class="big"></p></div>', 'black');
    Sound.crash();
    await wait(1000);
    $('#bo1').textContent = 'YOU WANTED A BUTTON?';
    await wait(1500);
    $('#bo2').textContent = "HERE'S YOUR BUTTON.";
    Sound.boom();
    shake(dom.overlay, 14, 700);
    await wait(1700);
    hideOverlay();
  }
  document.body.classList.add('boss');
  dom.world.hidden = true;
  Boss.start();
}

/* ---------- after the "win" ---------- */
function startPost() {
  G.mode = 'post';
  G.inPost = true;
  save();
  setScene('cracked', 'ruined', 'post');
  dom.world.hidden = false;
  dom.arena.hidden = true;
  dom.bossbar.hidden = true;
  showSkips(false);
  hero.className = 'char hero has-legs bandaged';
  setMood(hero, 'calm');
  place(hero, innerWidth / 2, innerHeight + 120);
  requestAnimationFrame(() => requestAnimationFrame(center));
  updateHud();
  say(G.post ? 'Where were we? Oh right. Keep clicking.' : "20 more clicks. Just to make sure I'm dead.");
}

function postClick() {
  if (G.post >= POST_GOAL) return;
  G.post++;
  save();
  updateHud();
  Sound.click(G.post * 3);
  press(hero);
  pressFx(hero._x, hero._y, hero._x, hero._y, 'rgba(170, 225, 190, 0.9)');
  say(POST_LINES[G.post - 1]);
  setMood(hero, G.post <= 5 || (G.post >= 16 && G.post < 20) ? 'calm' : 'smug');

  if (G.post >= 16 && G.post < POST_GOAL) {
    dom.loadbar.hidden = false;
    dom.loadbar.querySelector('.fill').style.width = [25, 50, 75, 99][G.post - 16] + '%';
  }

  if (G.post === POST_GOAL) {
    G.done = true;
    save();
    // Queued in the profile before the redirect; it syncs now or on the next visit.
    // It pays nothing; the claim only records that it was finished. The prize
    // is the mystery below.
    if (!G.testRun) claimStory('please-dont');
    floatText('??? 🎁', hero._x, hero._y - 90, 'reward');
    dom.loadbar.querySelector('.fill').style.width = '100%';
    Sound.win();
    // Same-tab navigation, so no popup blocker gets in the way.
    scope.later(() => (window.location.href = RICKROLL), 1300);
  }
}

function showDone() {
  G.mode = 'done';
  setScene('cracked', 'ruined', 'post');
  hero.classList.add('has-legs', 'bandaged');
  center();
  setMood(hero, 'smug');
  updateHud();
  say('Oh no. Not you again. You already got your prize. 🎵');
  dom.again.hidden = false;
}

function restart() {
  if (!confirm("Start over? The button will forget everything. (It won't forgive you, though.)")) return;
  wipeSave();
  window.location.href = window.location.pathname;
}

/* ---------- picking up where you left off ---------- */
// How the house looks after n clicks.
function applyRoom(n) {
  if (n >= AT.legs) hero.classList.add('has-legs');
  const b = document.body.classList;
  if (n >= AT.cracks) b.add('cracked');
  if (n >= AT.crash) b.add('ruined');
  if (n >= AT.puddle) b.add('puddle');
  if (n >= AT.funeral) renderGraves();
  if (n >= AT.dusk) b.add('dusk');
  if (n >= AT.collapse) b.add('collapsed');
}

// Who is around after n clicks.
function applyCast(n) {
  center();
  setMood(hero, defaultMood(n));
  if (n >= AT.friends && n < AT.crash) spawnFriends(FRIENDS, 85);
  if (n >= AT.family && n < AT.funeral) spawnFriends(FAMILY, 60);
  if (n >= AT.army && n < AT.beg) {
    G.decoysOn = true;
    syncDecoys();
    shuffleDecoys();
  }
  if (disguised(n)) disguise(n - AT.disguise);
  if (chasing(n)) startChase();
}

function restore() {
  const n = G.clicks;
  if (G.done) return showDone();
  if (G.inPost || n >= GOAL) return startPost();

  applyRoom(n);
  if (n >= BOSS_AT) {
    say('Oh, you’re back. The arena missed you.');
    return startBoss(true);
  }
  applyCast(n);
  showSkips(true);

  const greeting = G.visits > 1 && n > 0 ? "Oh no. Not you again. Refreshing won't save you." : STORY[n]?.say || pick(pool(n));
  say(greeting);
}

/* ---------- boot ---------- */
export function startGame(root) {
  scope.begin();
  Object.assign(dom, {
    app: $('#app', root),
    world: $('#world', root),
    arena: $('#arena', root),
    graves: $('#graves', root),
    overlay: $('#overlay', root),
    line: $('#line', root),
    counter: $('#counter', root),
    bossbar: $('#bossbar', root),
    loadbar: $('#loadbar', root),
    again: $('#again', root),
    skip: $('#skip', root),
    skipAll: $('#skipAll', root),
    room: $('#room', root),
    dents: $('#dents', root),
    fx: h('div', 'fx'),
  });
  root.append(dom.fx);
  hooks.startPost = startPost;

  load();
  // Testing shortcut: /?at=55 jumps straight to click 55.
  const at = new URLSearchParams(location.search).get('at');
  if (at !== null) Object.assign(G, { clicks: clamp(+at || 0, 0, GOAL), post: 0, inPost: false, done: false, testRun: true });
  G.visits++;
  save();

  setLook(getProfile().wallet.equipped);
  hero = makeChar('hero');
  hero.setAttribute('aria-label', 'The button. Please do not press it.');
  dom.world.append(hero);
  hero.addEventListener('click', onHeroClick);

  const mute = $('#mute', root);
  const paintMute = () => (mute.textContent = G.muted ? '🔇' : '🔊');
  Sound.setMuted(G.muted);
  paintMute();
  scope.on(mute, 'click', () => {
    G.muted = !G.muted;
    Sound.setMuted(G.muted);
    paintMute();
    save();
  });
  scope.on($('#restart', root), 'click', restart);
  const onSkip = (all) => () => (G.mode === 'boss' ? Boss.skip(all) : skipStory(all));
  scope.on(dom.skip, 'click', onSkip(false));
  scope.on(dom.skipAll, 'click', onSkip(true));
  scope.on(dom.again, 'click', () => {
    wipeSave();
    window.location.href = window.location.pathname;
  });

  scope.on(window, 'pointerdown', () => Sound.init());
  scope.on(window, 'pointerdown', onMiss);
  scope.on(window, 'pointermove', onPointerMove);

  // Tears while it's sad.
  scope.every(() => {
    if (G.mode !== 'story' || G.chase || !rules(G.clicks).crying) return;
    for (const side of [-1, 1]) {
      const t = h('i', 'tear');
      place(t, hero._x + side * 15, hero._y - 6);
      dom.world.append(t);
      t.animate([{ transform: 'translate(-50%,0)', opacity: 1 }, { transform: 'translate(-50%,130px)', opacity: 0 }], {
        duration: 1100,
        easing: 'ease-in',
      }).onfinish = () => t.remove();
    }
  }, 700);

  // Friends fidget around while they guard it.
  scope.every(() => followersList.length && !G.locked && followers(), 1500);

  // It notices when you go quiet, leave, or squash its house.
  scope.every(() => {
    if (G.mode !== 'story' || G.locked || G.clicks === 0) return;
    if (Date.now() - G.lastActive > 25000) {
      G.lastActive = Date.now();
      say(pick(LINES.idle));
    }
  }, 1000);

  let hiddenAt = 0;
  scope.on(document, 'visibilitychange', () => {
    if (document.hidden) hiddenAt = Date.now();
    else if (G.mode === 'story' && G.clicks > 0 && Date.now() - hiddenAt > 4000) say('Oh, look who decided to come back.');
  });

  let lastW = innerWidth;
  let lastResizeLine = 0;
  scope.on(window, 'resize', () => {
    if (G.mode !== 'story') return;
    if (!G.chase && G.disguise < 0 && (hero._x > innerWidth - 40 || hero._y > innerHeight - 40)) center();
    if (Math.abs(innerWidth - lastW) > 60 && G.clicks > 4 && Date.now() - lastResizeLine > 12000) {
      lastResizeLine = Date.now();
      say('STOP CRUSHING MY HOUSE!');
    }
    lastW = innerWidth;
  });

  G.lastActive = Date.now();
  updateHud();
  restore();

  return () => {
    scope.dispose();
    G.chase = false;
    Boss.stop();
    followersList = [];
    decoys = [];
    fakeBig = null;
    dom.world.innerHTML = '';
    dom.arena.innerHTML = '';
    dom.graves.innerHTML = '';
    dom.dents.innerHTML = '';
    dom.fx.remove();
    dom.world.hidden = false;
    dom.arena.hidden = true;
    dom.bossbar.hidden = true;
    dom.loadbar.hidden = true;
    dom.again.hidden = true;
    showSkips(false);
    closeSkip();
    hideOverlay();
    setScene();
  };
}
