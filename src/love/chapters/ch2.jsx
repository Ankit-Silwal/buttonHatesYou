'use client';

// Chapter 2: The Dating App Disaster. A dating app where everyone is UI.

import { useEffect, useRef, useState } from 'react';
import { Bobby, Toon, Bubble, useFrame, useLater, useEvery, usePointer, rand, pick, shuffle, sfx } from '../kit';

/* ---------- 6. Swipe Right on Everything ---------- */
const SAFE = [
  ['🍞', 'Toaster Button', 'I get hot fast.'],
  ['🍪', 'Cookie Banner', 'I accept all.'],
  ['📎', 'Paperclip', 'Looks like you are writing a love letter.'],
  ['🔔', 'Notification Bell', "I'll never leave you alone."],
  ['🛒', 'Add to Cart', "I'm a commitment."],
  ['🍔', 'Hamburger Menu', 'Three layers of mystery.'],
  ['📶', 'Wi-Fi', 'Strong connection. Sometimes.'],
  ['⭐', '5-Star Review', 'Would date again.'],
  ['🔍', 'Search Bar', "Still looking. Like you."],
];
const DANGER = [
  ['🗑️', 'Delete Account', "Let's make this permanent."],
  ['🚪', 'Log Out', "I'll show you the door."],
  ['💣', 'Format C:', 'Fresh start?'],
  ['🔕', 'Unsubscribe', "I'm not like other buttons."],
];
const SWIPES = 12;
const AUTO_MS = 1700;

function SwipeEverything({ win, fail, say }) {
  const [deck] = useState(() => {
    const d = shuffle(SAFE).slice(0, 8).map((c) => ({ c, danger: false }));
    shuffle(DANGER).forEach((c, i) => d.splice(2 + i * 3, 0, { c, danger: true }));
    return d.slice(0, SWIPES);
  });
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [gone, setGone] = useState(null); // 'left' | 'right' while the card flies off
  const grab = useRef(null);
  const later = useLater();
  const card = deck[i];
  const over = i >= deck.length;

  // Bobby swipes right on his own if you wait.
  useEffect(() => {
    if (over || gone) return;
    const t = setTimeout(() => swipe('right', true), AUTO_MS);
    return () => clearTimeout(t);
  });

  function swipe(dir, auto = false) {
    if (gone || over) return;
    setGone(dir);
    setDx(0);
    sfx.swoosh();
    if (dir === 'right' && card.danger) {
      say('Wait what did I just—', 'scared');
      return later(() => fail(`I swiped right on "${card.c[1]}". My account is gone. I'm a ghost now.`), 600);
    }
    if (dir === 'right') say(pick([auto ? "I'm not waiting for you. YES." : 'YES. Obviously.', "She's the one!", "Also the one!", 'Marry me!']), 'smug');
    else say(card.danger ? 'Oh. Oh no. Thank you.' : 'NO! SHE WAS THE ONE!', card.danger ? 'scared' : 'sad');
    later(() => {
      setGone(null);
      if (i + 1 >= deck.length) win("Matched with 8 things and didn't delete myself. Personal best.");
      setI((n) => n + 1);
    }, 380);
  }

  if (over) return <div className="lv" />;
  return (
    <div className="lv center swipe">
      <div
        key={i}
        className={`swipe-card ${gone ?? ''} ${card.danger ? 'danger' : ''}`}
        style={{ translate: `${dx}px 0`, rotate: `${dx / 14}deg` }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          grab.current = e.clientX;
        }}
        onPointerMove={(e) => grab.current != null && setDx(e.clientX - grab.current)}
        onPointerUp={() => {
          if (grab.current == null) return;
          grab.current = null;
          if (dx < -80) swipe('left');
          else if (dx > 80) swipe('right');
          else setDx(0);
        }}
      >
        <span className="pic">{card.c[0]}</span>
        <b>{card.c[1]}</b>
        <q>{card.c[2]}</q>
        <span className="timer" key={`t${i}`} style={{ animationDuration: `${AUTO_MS}ms` }} />
      </div>
      <div className="row">
        <button className="round no" onClick={() => swipe('left')} aria-label="Swipe left">
          ✕
        </button>
        <Bobby size={70} mood="smug" legs={false} />
        <button className="round yes" onClick={() => swipe('right')} aria-label="Swipe right">
          ♥
        </button>
      </div>
      <p className="hint">
        {i + 1} / {deck.length} · drag left or press ✕
      </p>
    </div>
  );
}

/* ---------- 7. The CAPTCHA Girlfriend ---------- */
const CAPTCHAS = [
  {
    ask: 'Select all squares with traffic lights IN LOVE',
    yes: ['🚦💕🚦', '🚦😘', '💑🚦', '🚦💍🚦'],
    no: ['🚦', '🚗', '🚦😐🚦', '🛑', '🚧', '🚦💔🚦'],
  },
  {
    ask: 'Select all squares where the bus is SINGLE',
    yes: ['🚌', '🚌😢', '🚌🍦'],
    no: ['🚌💕🚌', '🚌💍', '👫🚌', '🚎💕🚌', '🚗', '🚲'],
  },
  {
    ask: 'Select all squares containing Bobby',
    yes: ['🔴', '🔴🥺', '🔴💦'],
    no: ['🍅', '🟠', '🟥', '🍎', '🎈', '🛑'],
  },
];

function Captcha({ win, say }) {
  const [round, setRound] = useState(0);
  const [tiles, setTiles] = useState(() => deal(0));
  const [sel, setSel] = useState([]);
  const [shake, setShake] = useState(0);
  const later = useLater();

  function deal(r) {
    const q = CAPTCHAS[r];
    const yes = shuffle(q.yes).slice(0, 3);
    return shuffle([...yes.map((t) => ({ t, ok: true })), ...shuffle(q.no).slice(0, 9 - yes.length).map((t) => ({ t, ok: false }))]);
  }

  function verify() {
    const right = tiles.every((x, k) => x.ok === sel.includes(k));
    if (!right) {
      sfx.nope();
      setShake((s) => s + 1);
      setSel([]);
      setTiles(deal(round));
      return say(pick(['Bobby is 87% robot. Again.', 'She thinks I am a toaster now.', "That's a tomato, bro."]), 'scared');
    }
    sfx.ding();
    if (round === CAPTCHAS.length - 1) {
      say('VERIFIED. HUMAN. (I am not human. Do not tell her.)', 'smug');
      return later(() => win("She said I'm cute for a human. I'm a button. We'll cross that bridge later."), 1200);
    }
    say(['Nailed it. She is impressed.', 'One more. She wants to be SURE.'][round], 'smug');
    setRound(round + 1);
    setSel([]);
    setTiles(deal(round + 1));
  }

  return (
    <div className="lv center">
      <div className="captcha" key={shake}>
        <div className="cap-head">
          <small>Select all squares with</small>
          <b>{CAPTCHAS[round].ask.replace('Select all squares with ', '').replace('Select all squares ', '')}</b>
        </div>
        <div className="cap-grid">
          {tiles.map((x, k) => (
            <button
              key={`${round}-${k}`}
              className={sel.includes(k) ? 'on' : ''}
              onClick={() => {
                sfx.click(k * 4);
                setSel((s) => (s.includes(k) ? s.filter((v) => v !== k) : [...s, k]));
              }}
            >
              {x.t}
            </button>
          ))}
        </div>
        <div className="cap-foot">
          <span>
            {round + 1} / {CAPTCHAS.length}
          </span>
          <button className="pill" onClick={verify}>
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 8. She Left Me on Read ---------- */
const TEXTS = [
  'hey', 'hey', 'heyyy', 'u up?', 'hello??', 'are you mad at me', 'ARE YOU MAD AT ME', 'lol jk', 'unless..', 'i miss u',
  "it's been 3 seconds", 'my battery is fine btw', 'do u like buttons', 'i am a button', 'pls', 'pls respond', '🥺', '🥺🥺',
  'i wrote you a poem', 'roses are red. i am red.', 'that was the poem', 'hello?', 'helloooo', 'r u alive', 'should i call',
  'calling', 'missed call x4', 'ok', 'k', 'fine', 'jk not fine', 'i love u', 'too soon?', 'deleting this', 'not deleting',
  'good night', 'good morning',
];
const MAX_LEAKS = 3;

function LeftOnRead({ win, fail, say }) {
  // The bubbles move every frame, so they live in a ref and a counter re-renders.
  const msgs = useRef([]);
  const [, redraw] = useState(0);
  const [leaks, setLeaks] = useState(0);
  const sent = useRef(0);
  const ended = useRef(false);
  const later = useLater();

  useEvery(() => {
    if (sent.current >= TEXTS.length) return;
    const text = TEXTS[sent.current++];
    msgs.current.push({ id: sent.current, text, x: rand(4, 60), y: 100, v: rand(9, 14) + sent.current * 0.35 });
    sfx.tick();
  }, 620);

  useFrame((dt) => {
    if (ended.current) return;
    msgs.current.forEach((x) => (x.y -= x.v * dt));
    const leaked = msgs.current.filter((x) => x.y <= 6).length;
    msgs.current = msgs.current.filter((x) => x.y > 6);
    redraw((n) => n + 1);

    if (leaked) {
      sfx.ring();
      const n = leaks + leaked;
      setLeaks(n);
      if (n > MAX_LEAKS) {
        ended.current = true;
        later(() => fail('She saw "ARE YOU MAD AT ME" four times. She is now mad at me.'), 300);
      } else say(pick(['NOOO that one sent!', 'Seen. SEEN. ✓✓', 'Delete faster!!']), 'scared');
    } else if (sent.current >= TEXTS.length && !msgs.current.length) {
      ended.current = true;
      say('Nothing sent. She has no idea. Perfect.', 'smug');
      later(() => win('Zero messages sent. She definitely misses me now.'), 1000);
    }
  });

  return (
    <div className="lv chat-lv">
      <div className="chat">
        <div className="chat-head">
          <Toon c="#f39ac0" cd="#cc6f97" size={34} bow legs={false} />
          <b>Bella</b>
          <span className="seen">
            {leaks ? `Seen ✓✓ (${leaks}/${MAX_LEAKS})` : 'online'}
          </span>
        </div>
        <div className="chat-body">
          {msgs.current.map((x) => (
            <button
              key={x.id}
              className="msg out"
              style={{ left: `${x.x}%`, top: `${x.y}%` }}
              onPointerDown={() => {
                sfx.pop();
                msgs.current = msgs.current.filter((y) => y.id !== x.id);
              }}
            >
              {x.text}
            </button>
          ))}
        </div>
        <div className="chat-foot">
          <Bobby size={34} mood="scared" legs={false} />
          <span>Bobby is typing… forever</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- 9. The Accidental Group Chat ---------- */
const PEOPLE = [
  ['Kevin', '#9bbf9a'], ['Gary', '#8fb8d8'], ['Doris', '#f0c36d'], ['Pip', '#c4a6dc'], ['Bubbles', '#f3a6a0'],
  ['Robby', '#e0705a'], ['Bob (other Bob)', '#d9604c'], ['Submit', '#7cc6a4'], ['Cancel', '#aaa'], ['Bella', '#f39ac0'],
];
const LOOKALIKES = [
  'I love yogurt', 'I love you guys (platonic)', 'i love you 3000', 'I love you, mom', 'I love YouTube', 'I love yo-yos',
  'I love you too?', 'who said I love you', 'love you 😂', 'I LOVE YOUR DOG', 'I love Yugoslavia (history)', 'ilu (I like umbrellas)',
  'I love yoga', 'I love you… r car', 'love u (wrong chat)', 'I loathe you',
];
const SEEN_ALL = 20;

function GroupChat({ win, fail, say }) {
  const [rows] = useState(() => {
    const r = shuffle(LOOKALIKES).map((text, k) => ({ k, text, who: PEOPLE[k % PEOPLE.length] }));
    r.splice(Math.floor(rand(5, r.length - 2)), 0, { k: 'me', text: 'I love you ❤️', who: ['Bobby', null] });
    return r;
  });
  const [seen, setSeen] = useState(3);
  const [menu, setMenu] = useState(false);
  const [gone, setGone] = useState(false);
  const later = useLater();

  useEvery(() => {
    setSeen(seen + 1);
    if (seen + 1 >= SEEN_ALL) fail('Everyone saw it. Gary replied "same". Now Gary and I are dating.');
  }, gone || seen >= SEEN_ALL ? null : 1300);

  return (
    <div className="lv center">
      <div className="chat group">
        <div className="chat-head">
          <b>🔘 Button Squad (20)</b>
          <span className={`seen ${seen > 14 ? 'hot' : ''}`}>
            Seen by {seen}/{SEEN_ALL}
          </span>
        </div>
        <div className="chat-scroll">
          {rows.map((r) => (
            <div key={r.k} className={`row-msg ${r.k === 'me' ? 'mine' : ''} ${r.k === 'me' && gone ? 'unsent' : ''}`}>
              <span className="face" style={{ background: r.who[1] ?? 'var(--skin, #e2674f)' }} />
              <button
                className="msg"
                onClick={() => {
                  if (gone) return;
                  if (r.k === 'me') return (setMenu(true), sfx.pop());
                  sfx.nope();
                  setSeen((s) => Math.min(SEEN_ALL - 1, s + 2));
                  say(`That's ${r.who[0]}'s message. You just reacted 😂 to it. Everyone noticed.`, 'scared');
                }}
              >
                <small>{r.who[0]}</small>
                {r.k === 'me' && gone ? <i>This message was unsent</i> : r.text}
              </button>
              {r.k === 'me' && menu && !gone && (
                <button
                  className="unsend"
                  onClick={() => {
                    setGone(true);
                    setMenu(false);
                    sfx.ding();
                    say('Unsent. Nobody saw. (Gary saw.)', 'smug');
                    later(() => win('Crisis averted. I will text Gary separately.'), 1300);
                  }}
                >
                  ↩ Unsend
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- 10. First Match: The Power Button ---------- */
const DATE_STEPS = [
  { id: 'table', icon: '🕯️', name: 'the table', line: 'Table found. Romantic. Probably.' },
  { id: 'menu', icon: '📜', name: 'the menu', line: 'Menu! I will order... the blackout special.' },
  { id: 'her', icon: '⏻', name: 'her', line: 'There she is.' },
];
const WRONG = ['That was the bathroom.', 'That was a waiter. I said "I love you". To a waiter.', "That's a coat rack. We're not compatible."];

function PowerDate({ win, say }) {
  const ref = useRef(null);
  const ptr = usePointer(ref);
  const [light, setLight] = useState({ x: -999, y: -999 });
  const [spots] = useState(() =>
    shuffle([
      [15, 25], [80, 20], [25, 75], [70, 70], [50, 45], [88, 55], [10, 55],
    ]).slice(0, 6)
  );
  const [step, setStep] = useState(0);
  const [blackout, setBlackout] = useState(false);
  const later = useLater();

  useFrame(() => setLight((l) => (l.x === ptr.current.x && l.y === ptr.current.y ? l : { x: ptr.current.x, y: ptr.current.y })));

  function find(k) {
    const target = DATE_STEPS[step];
    if (k !== step) {
      sfx.nope();
      return say(k < step ? 'Already found that one.' : pick(WRONG), 'scared');
    }
    sfx.ding();
    say(target.line, 'smug');
    if (step === DATE_STEPS.length - 1) {
      setBlackout(true);
      sfx.boom();
      say('*touches her* …', 'love');
      return later(() => win('The lights went out. Worth it.'), 2200);
    }
    setStep(step + 1);
  }

  return (
    <div className="lv dark-date" ref={ref}>
      {DATE_STEPS.map((s, k) => (
        <button
          key={s.id}
          className={`date-thing ${k === step ? 'glow' : ''} ${k < step ? 'found' : ''}`}
          style={{ left: `${spots[k][0]}%`, top: `${spots[k][1]}%` }}
          onClick={() => find(k)}
          aria-label={s.name}
        >
          {s.id === 'her' ? (
            <Toon c="#3f3f4a" cd="#26262e" size={70} lashes legs={false}>
              <span className="power-icon">⏻</span>
            </Toon>
          ) : (
            s.icon
          )}
        </button>
      ))}
      {spots.slice(3).map(([x, y], k) => (
        <button key={k} className="date-thing decoy" style={{ left: `${x}%`, top: `${y}%` }} onClick={() => find(99)}>
          {['🚽', '🧥', '🤵'][k]}
        </button>
      ))}
      <div className={`flashlight ${blackout ? 'out' : ''}`} style={{ '--mx': `${light.x}px`, '--my': `${light.y}px` }} />
      <div className="dark-bobby">
        <Bobby size={64} mood="scared" legs={false} />
        <Bubble>{blackout ? '❤️' : `Find ${DATE_STEPS[step].name}!`}</Bubble>
      </div>
    </div>
  );
}

const chapter2 = { 6: SwipeEverything, 7: Captcha, 8: LeftOnRead, 9: GroupChat, 10: PowerDate };
export default chapter2;
