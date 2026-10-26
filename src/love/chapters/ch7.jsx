'use client';

// Chapter 7: Catch Your Crush. The roles flip: Bobby goes after the cursor.

import { useEffect, useRef, useState } from 'react';
import { Bobby, CursorGuy, Bubble, Drag, over, useFrame, useLater, useEvery, useBox, usePointer, rand, pick, sfx } from '../kit';
import './ch7.css';

/* ---------- 31. Come Back, Baby! ---------- */
const CHASE_S = 20;
const MAX_HITS = 3;
const CHASE_LINES = ['COME BACK, BABY!', 'I just want to hold your hand!', 'Why are you so FAST?', 'Is this a game? I love games!', 'I made you a heart! Catch it!'];

function ComeBack({ win, fail, say }) {
  const [ref, box] = useBox();
  const ptr = usePointer(ref);
  const me = useRef({ x: 60, y: 60, grace: 0 });
  const hearts = useRef([]);
  const [, redraw] = useState(0);
  const [hits, setHits] = useState(0);
  const [left, setLeft] = useState(CHASE_S);
  const t = useRef(0);
  const last = useRef({ x: 0, y: 0 });
  const done = useRef(false);
  const later = useLater();

  function caught(text) {
    sfx.kiss();
    const n = hits + 1;
    setHits(n);
    me.current.grace = 1.2;
    // He bounces back to the far corner, embarrassed.
    me.current.x = last.current.x < box.w / 2 ? box.w - 50 : 50;
    me.current.y = last.current.y < box.h / 2 ? box.h - 50 : 50;
    if (n > MAX_HITS) {
      done.current = true;
      return later(() => fail("GOTCHA. We're holding hands now. Forever. This is the level now."), 300);
    }
    say(text, 'smug');
  }

  useFrame((dt) => {
    if (done.current || !box.w) return;
    t.current += dt;
    const remaining = Math.max(0, CHASE_S - t.current);
    if (Math.ceil(remaining) !== left) setLeft(Math.ceil(remaining));
    if (remaining <= 0) {
      done.current = true;
      say('*wheeze* You win. I need a nap. And a hug.', 'tired');
      return later(() => win('Fine. I will love you from a respectful distance. For now.'), 900);
    }
    if (ptr.current.inside) last.current = { x: ptr.current.x, y: ptr.current.y };
    const target = last.current;
    const m = me.current;
    m.grace = Math.max(0, m.grace - dt);
    const speed = 150 + t.current * 6;
    const dx = target.x - m.x;
    const dy = target.y - m.y;
    const d = Math.hypot(dx, dy) || 1;
    if (!m.grace) {
      m.x += (dx / d) * Math.min(d, speed * dt);
      m.y += (dy / d) * Math.min(d, speed * dt);
    }
    // Love projectiles, aimed at where the cursor is now.
    hearts.current.forEach((h) => ((h.x += h.vx * dt), (h.y += h.vy * dt)));
    hearts.current = hearts.current.filter((h) => h.x > -30 && h.y > -30 && h.x < box.w + 30 && h.y < box.h + 30);
    if (ptr.current.inside && !m.grace) {
      if (d < 44) caught(pick(['GOTCHA! …wait, I let go. Again!', 'Caught you! (You slipped away. Rude.)', 'Hand: held. For 0.2 seconds.']));
      const hit = hearts.current.find((h) => Math.hypot(h.x - target.x, h.y - target.y) < 22);
      if (hit) {
        hearts.current = hearts.current.filter((h) => h !== hit);
        caught('Direct hit! That heart was for you!');
      }
    }
    redraw((n) => n + 1);
  });

  useEvery(() => {
    if (done.current || !box.w) return;
    const m = me.current;
    const { x, y } = last.current;
    const d = Math.hypot(x - m.x, y - m.y) || 1;
    hearts.current.push({ id: Math.random(), x: m.x, y: m.y, vx: ((x - m.x) / d) * 230, vy: ((y - m.y) / d) * 230 });
    sfx.pop();
    if (Math.random() < 0.4) say(pick(CHASE_LINES), 'smug');
  }, 1500);

  // Start him in a corner away from wherever the cursor is.
  useEffect(() => {
    if (!box.w) return;
    me.current.x = 60;
    me.current.y = 60;
    last.current = { x: box.w * 0.75, y: box.h * 0.6 };
  }, [box.w, box.h]);

  return (
    <div className="lv c7-chase" ref={ref}>
      <div className="c7-hud">
        <span>⏱ {left}s</span>
        <span>{'💗'.repeat(Math.min(hits, MAX_HITS + 1))}{'🤍'.repeat(Math.max(0, MAX_HITS + 1 - hits))}</span>
      </div>
      {hearts.current.map((h) => (
        <span key={h.id} className="c7-heart" style={{ left: h.x, top: h.y }}>
          💗
        </span>
      ))}
      <span className={`c7-chaser ${me.current.grace ? 'c7-dizzy' : ''}`} style={{ left: me.current.x, top: me.current.y }}>
        <Bobby size={64} mood={me.current.grace ? 'scared' : 'smug'} love blush />
      </span>
    </div>
  );
}

/* ---------- 32. Cursor Dating Simulator ---------- */
const DECOR = [
  { id: 'candles', icon: '🕯️', line: 'Candles. Fire is romantic. Fire is also scary. Like love.' },
  { id: 'roses', icon: '🌹', line: 'Roses. I picked them from a stock photo.' },
  { id: 'disco', icon: '🪩', line: 'A disco ball. In case it wants to dance. Does it dance?' },
  { id: 'balloon', icon: '🎈', line: 'A balloon. I will not pop it. I have grown.' },
  { id: 'cake', icon: '🎂', line: 'Cake. For it. I will eat the crumbs. Respectfully.' },
  { id: 'teddy', icon: '🧸', line: 'A teddy. For when I am not there. I will always be there.' },
];
const SPOTS = [
  [18, 30], [82, 28], [30, 70], [70, 72], [50, 22], [50, 78],
];
const ASK_ANSWERS = ['Yes', 'Probably', 'Ask it yourself'];
const ASK_REACT = {
  Yes: 'REALLY?? Okay. Okay okay okay. Back to work.',
  Probably: 'PROBABLY. That is basically yes. I am framing this.',
  'Ask it yourself': 'I… can’t. It’s right there. It’s YOU. Never mind.',
};

function DateSim({ win, say }) {
  const [placed, setPlaced] = useState([]);
  const [asking, setAsking] = useState(false);
  const spot = useRef(null);
  const later = useLater();
  const finished = placed.length === DECOR.length;

  useEvery(() => {
    if (!asking && !finished) {
      setAsking(true);
      sfx.ring();
    }
  }, finished ? null : 4500);

  function put(item) {
    const next = [...placed, item.id];
    setPlaced(next);
    sfx.pop();
    say(item.line, 'smug');
    if (next.length === DECOR.length) {
      say("It's perfect. Do you think it likes— no. Don't answer. Don't.", 'love');
      later(() => win('The date spot is ready. The date is with you. Obviously. Surprise.'), 1500);
    }
  }

  return (
    <div className="lv c7-sim">
      <div className="c7-spot" ref={spot}>
        <span className="c7-table">🍽️</span>
        {placed.map((id, i) => (
          <span key={id} className="c7-placed" style={{ left: `${SPOTS[i][0]}%`, top: `${SPOTS[i][1]}%` }}>
            {DECOR.find((d) => d.id === id).icon}
          </span>
        ))}
        <span className="c7-sim-bobby">
          <Bobby size={70} mood="smug" blush legs={false} />
        </span>
        <span className="c7-sim-label">Date spot · {placed.length}/{DECOR.length}</span>
      </div>
      <div className="c7-shelf">
        {DECOR.filter((d) => !placed.includes(d.id)).map((d) => (
          <Drag key={d.id} className="c7-item" disabled={asking} onDrop={(pt) => over(pt, spot.current) && (put(d), false)}>
            {d.icon}
          </Drag>
        ))}
      </div>
      {asking && (
        <div className="c7-ask">
          <div className="win-dialog">
            <div className="win-bar">💭 bobby_thoughts.exe</div>
            <p>
              <b>DO YOU THINK IT LIKES ME?</b>
            </p>
            <div className="c7-ask-row">
              {ASK_ANSWERS.map((a) => (
                <button
                  key={a}
                  className="pill love-btn"
                  onClick={() => {
                    setAsking(false);
                    say(ASK_REACT[a], a === 'Ask it yourself' ? 'scared' : 'love');
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 33. The Jealous Button ---------- */
const CONTROLS = [
  { id: 'check', at: [27, 28], label: 'Remember me', jealous: 'A CHECKBOX? She has one box. ONE.' },
  { id: 'toggle', at: [73, 28], label: 'Dark mode', jealous: 'Is that a toggle?? Is that CHAD’S COUSIN?' },
  { id: 'radio', at: [27, 76], label: 'Option A', jealous: 'Option A. What about option BOBBY.' },
  { id: 'drop', at: [73, 76], label: 'Choose ▾', jealous: 'A dropdown. She has so many options. I have one. Me.' },
];
const NOTICE_MS = 550;

function Jealous({ win, say }) {
  const [ref, box] = useBox();
  const ptr = usePointer(ref);
  const [done, setDone] = useState([]);
  const [guard, setGuard] = useState(null); // control id Bobby is standing on
  const pending = useRef({ id: null, since: 0 });
  const later = useLater();

  useEvery(() => {
    if (!box.w) return;
    const near = CONTROLS.find((c) => {
      if (done.includes(c.id)) return false;
      return Math.hypot(ptr.current.x - (c.at[0] / 100) * box.w, ptr.current.y - (c.at[1] / 100) * box.h) < 150;
    });
    const id = ptr.current.inside ? near?.id ?? null : null;
    if (id !== pending.current.id) pending.current = { id, since: Date.now() };
    else if (Date.now() - pending.current.since > NOTICE_MS && guard !== id) {
      setGuard(id);
      if (id) {
        sfx.nope();
        say(CONTROLS.find((c) => c.id === id).jealous, 'angry');
      }
    }
  }, 120);

  function use(c) {
    if (done.includes(c.id)) return;
    const next = [...done, c.id];
    setDone(next);
    sfx.ding();
    say(pick(['WHAT. You touched it. In front of me.', 'I saw that. I see everything.', "That's it. I'm writing a sad song."]), 'sad');
    if (next.length === CONTROLS.length) {
      setGuard(null);
      say("…You used all of them. And you're still here. With me?", 'love');
      later(() => win("Okay. They're just controls. You came back. I'm fine. I'm FINE."), 1400);
    }
  }

  const g = CONTROLS.find((c) => c.id === guard);
  const at = g ? g.at : [50, 52];

  return (
    <div className="lv c7-jealous" ref={ref}>
      {CONTROLS.map((c) => (
        <button key={c.id} className={`c7-ctrl c7-${c.id} ${done.includes(c.id) ? 'c7-on' : ''}`} style={{ left: `${c.at[0]}%`, top: `${c.at[1]}%` }} onClick={() => use(c)}>
          <span className="c7-widget" />
          {c.label}
        </button>
      ))}
      <span
        className="c7-guard"
        style={{ left: `${at[0]}%`, top: `${at[1]}%` }}
        onClick={() => {
          sfx.nope();
          say(pick(['No. Look at ME.', 'You have to go through me. Emotionally.', 'Who is she?? WHO IS SHE??']), 'angry');
        }}
      >
        <Bobby size={110} mood={guard ? 'angry' : 'calm'} blush={!guard} />
      </span>
      <p className="hint c7-count">
        {done.length} / {CONTROLS.length} used
      </p>
    </div>
  );
}

/* ---------- 34. Hold My Hand ---------- */
const WALK_S = 16;
const NEAR_PX = 110;
const MAX_DRAMA = 4;
const FALL_LINES = ['NOOOO. You let go. *falls to knees*', 'Why. WHY. *dramatic kneel*', 'I am alone in this world. *kneels in the rain*', 'My hand is so cold. *collapses theatrically*'];

function HoldHand({ win, fail, say }) {
  const [ref, box] = useBox();
  const ptr = usePointer(ref);
  const s = useRef({ p: 0, far: 0, started: false, kneel: false, drama: 0, over: false });
  const [, redraw] = useState(0);
  const later = useLater();

  const pos = (p) => ({
    x: box.w * (0.1 + 0.8 * p),
    y: box.h * (0.55 + 0.22 * Math.sin(p * Math.PI * 3)),
  });

  useFrame((dt) => {
    const st = s.current;
    if (!box.w || st.over) return;
    const b = pos(st.p);
    const near = ptr.current.inside && Math.hypot(ptr.current.x - b.x, ptr.current.y - (b.y - 10)) < NEAR_PX;
    if (!st.started) {
      if (near) {
        st.started = true;
        say('You took my hand. Okay. Walking. Don’t let go.', 'love');
      }
      return redraw((n) => n + 1);
    }
    if (st.kneel) {
      if (near) {
        st.kneel = false;
        st.far = 0;
        sfx.aww();
        say(pick(['You came back. I knew you would.', "Okay. I'm up. I'm composed.", 'Never mind. All good. Walking.']), 'love');
      }
      return redraw((n) => n + 1);
    }
    if (near) st.far = 0;
    else st.far += dt;
    if (st.far > 0.9) {
      st.kneel = true;
      st.drama++;
      sfx.sob();
      if (st.drama >= MAX_DRAMA) {
        st.over = true;
        later(() => fail('I fell to my knees four times. My knees are pixels. They are gone now.'), 600);
      } else say(FALL_LINES[st.drama - 1], 'sad');
    } else st.p = Math.min(1, st.p + dt / WALK_S);
    if (st.p >= 1) {
      st.over = true;
      say('We made it. Together. Holding hands. I may cry.', 'love');
      later(() => win('Best walk of my life. I will remember every pixel.'), 1100);
    }
    redraw((n) => n + 1);
  });

  const st = s.current;
  const b = box.w ? pos(st.p) : { x: -999, y: 0 };
  const path = box.w ? Array.from({ length: 40 }, (_, i) => pos(i / 39)) : [];

  return (
    <div className="lv c7-walk" ref={ref}>
      <svg className="c7-path" width={box.w} height={box.h}>
        <polyline points={path.map((q) => `${q.x},${q.y + 30}`).join(' ')} />
      </svg>
      <span className="c7-flag" style={{ left: box.w * 0.9, top: box.h ? pos(1).y + 10 : 0 }}>
        🏁
      </span>
      <span className="c7-walker" style={{ left: b.x, top: b.y }}>
        <Bobby size={70} mood={st.kneel ? 'sad' : 'love'} love={!st.kneel} tears={st.kneel} blush={!st.kneel} className={st.kneel ? 'c7-kneel' : st.started ? 'c7-stroll' : ''} />
        {!st.started && <Bubble>Hold my hand. (Put your cursor on me.)</Bubble>}
        <span className="c7-hand" style={{ width: NEAR_PX * 2, height: NEAR_PX * 2 }} />
      </span>
      <div className="c7-hud">
        <span>{Math.round(st.p * 100)}%</span>
        <span>{'🧎'.repeat(st.drama)}</span>
      </div>
    </div>
  );
}

/* ---------- 35. The First Date ---------- */
const FEED_HALF = 6;
const FEED_ALL = 12;
const MAX_AWK = 3;
const WAITER = ['Would you like to hear our specials?', 'Is everything delicious?', 'May I interest you in a violin?', 'Sparkling or still pixels?', 'Are you two… together?'];
const MENU = [
  { id: 'go', label: 'Continue date ❤️', line: 'Yes. Continuing. Nothing weird happened.' },
  { id: 'run', label: 'Run away', line: "We can't run. We're IN the dropdown." },
  { id: 'bill', label: 'Ask for the bill', line: 'The bill is a dropdown too. It is 404 dollars.' },
];

function FirstDate({ win, fail, say }) {
  const [pixels, setPixels] = useState([]);
  const [fed, setFed] = useState(0);
  const [waiter, setWaiter] = useState(null);
  const [awk, setAwk] = useState(0);
  const [stage, setStage] = useState('dinner'); // dinner | dropdown | dinner2 | done
  const id = useRef(0);
  const later = useLater();
  const eating = stage === 'dinner' || stage === 'dinner2';

  useEvery(() => {
    if (pixels.length >= 4) return;
    setPixels([...pixels, { id: ++id.current, x: rand(22, 78), y: rand(58, 82), c: pick(['#ff4f7b', '#5b9bd5', '#f0c36d', '#7cc6a4', '#a58bd6']) }]);
  }, eating ? 850 : null);

  useEvery(() => {
    if (waiter) {
      // Ignored him: he is now part of the date.
      setWaiter(null);
      const n = awk + 1;
      setAwk(n);
      sfx.bad();
      if (n >= MAX_AWK) return fail('The waiter pulled up a chair. He is in the relationship now.');
      return say(pick(['He started singing. Nobody asked him to.', 'He is just… standing there. Watching us eat.', 'He brought a violinist. The violinist brought a cousin.']), 'scared');
    }
    setWaiter({ text: pick(WAITER), x: rand(10, 62), y: rand(8, 40) });
    sfx.ring();
  }, eating ? 3400 : null);

  function feed(p) {
    sfx.pop();
    setPixels(pixels.filter((q) => q.id !== p.id));
    const n = fed + 1;
    setFed(n);
    if (n === FEED_HALF) {
      setWaiter(null);
      setPixels([]);
      setStage('dropdown');
      sfx.crash();
      return say('Wait. Why is the restaurant… collapsing into a… DROPDOWN MENU??', 'scared');
    }
    if (n === FEED_ALL) {
      setStage('done');
      setWaiter(null);
      say('Best dinner ever. 12 pixels. I am so full. Of love. And pixels.', 'love');
      return later(() => win('Our first date. In a dropdown. I would not change a thing.'), 1400);
    }
    say(pick(['Nom.', 'Delicious. Like you. Sorry. Too much?', '*chews romantically*', 'This one tastes blue.', 'Feeding me?? We are SO dating.']), 'love');
  }

  if (stage === 'dropdown') {
    return (
      <div className="lv center c7-dropdown">
        <div className="c7-select">
          <div className="c7-select-head">🍷 The Restaurant ▾</div>
          {MENU.map((m) => (
            <button
              key={m.id}
              className="c7-option"
              onClick={() => {
                say(m.line, m.id === 'go' ? 'love' : 'scared');
                if (m.id === 'go') {
                  sfx.ding();
                  setStage('dinner2');
                } else sfx.nope();
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <Bobby size={70} mood="scared" sweat legs={false} />
      </div>
    );
  }

  return (
    <div className="lv c7-date">
      <div className="c7-candle">🕯️</div>
      <div className="c7-diners">
        <Bobby size={86} mood="love" love blush legs={false} />
        <CursorGuy size={48} />
      </div>
      <div className="c7-tablecloth">
        {pixels.map((p) => (
          <button key={p.id} className="c7-pixel" style={{ left: `${p.x}%`, top: `${p.y}%`, background: p.c }} onClick={() => feed(p)} aria-label="Pixel" />
        ))}
      </div>
      {waiter && (
        <div className="c7-waiter" style={{ left: `${waiter.x}%`, top: `${waiter.y}%` }}>
          <span>🤵 {waiter.text}</span>
          <button
            onClick={() => {
              setWaiter(null);
              sfx.swoosh();
              say(pick(['Thank you. Goodbye. Please.', 'We are FINE, thank you.', 'Shoo. Lovingly.']), 'calm');
            }}
            aria-label="Send the waiter away"
          >
            ✕
          </button>
        </div>
      )}
      <div className="c7-hud">
        <span>🍽️ {fed}/{FEED_ALL}</span>
        <span>😬 {awk}/{MAX_AWK}</span>
      </div>
    </div>
  );
}

const chapter7 = { 31: ComeBack, 32: DateSim, 33: Jealous, 34: HoldHand, 35: FirstDate };
export default chapter7;
