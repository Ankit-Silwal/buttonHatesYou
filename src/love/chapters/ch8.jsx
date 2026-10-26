'use client';

// Chapter 8: The Button Wedding. Bobby plans a whole wedding nobody agreed to,
// and slowly works out that he skipped a few steps.

import { useEffect, useRef, useState } from 'react';
import { Bobby, Bella, Chad, CursorGuy, Bubble, Drag, over, useLater, useEvery, pick, shuffle, sfx } from '../kit';
import './ch8.css';

// Answer buttons for the talking levels.
function Choices({ options, onPick }) {
  return (
    <div className="c8-choices">
      {options.map((o) => (
        <button key={o.label} className="c8-choice" onClick={() => onPick(o)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- 36. The Proposal ---------- */
const PROPOSE = [
  { label: 'Yes!', mood: 'scared', reply: "WAIT. Yes?? …Hold on. We've never been on a proper date. I think I skipped like 30 steps." },
  { label: 'Not yet', mood: 'sad', reply: "Oh. Yeah. That's fair. We've known each other for, like, four levels." },
  { label: 'Who are you?', mood: 'scared', reply: "I'm Bobby! The button! We kissed in level 28! …Okay. Maybe I moved a little fast." },
];
const PLAN = [
  { label: "I'd like that", reply: 'A real date. With you. Slowly. I can do slowly. I am learning slowly.' },
  { label: 'Slow is good', reply: 'Slow is good. Slow is GREAT. Look at me, being slow.' },
  { label: 'Only if there are snacks', reply: 'There will be SO many pixels. Small portions. Like our pace now.' },
];

function Proposal({ win, say }) {
  const [step, setStep] = useState('box'); // box | ask | answer | plan
  const [answer, setAnswer] = useState(null);
  const later = useLater();
  const [opts] = useState(() => ({ ask: shuffle(PROPOSE), plan: shuffle(PLAN) }));

  const bubble = {
    box: 'Cursor. I have something for you. (Open the box.)',
    ask: 'It is a diamond. Well, a pixel. Shaped like one. Will you be my… everything?',
    answer: answer?.reply,
    plan: "Can I take you on a proper date first? Like a normal button? Before the… everything?",
  }[step];

  return (
    <div className="lv c8-talk">
      <div className="c8-scene">
        <Bobby size={110} mood={step === 'answer' ? answer.mood : step === 'plan' ? 'calm' : 'love'} love={step === 'ask'} blush className={step === 'box' || step === 'ask' ? 'c8-kneel' : ''}>
          <Bubble>{bubble}</Bubble>
          {(step === 'box' || step === 'ask') && (
            <button
              className={`c8-ring ${step === 'ask' ? 'c8-open' : ''}`}
              onClick={() => {
                if (step !== 'box') return;
                sfx.ding();
                setStep('ask');
              }}
              aria-label="Ring box"
            >
              {step === 'ask' ? '💎' : '🎁'}
            </button>
          )}
        </Bobby>
        <CursorGuy size={50} />
      </div>
      {step === 'ask' && (
        <Choices
          options={opts.ask}
          onPick={(o) => {
            sfx.click(10);
            setAnswer(o);
            setStep('answer');
            say(o.reply, o.mood);
            later(() => setStep('plan'), 2600);
          }}
        />
      )}
      {step === 'plan' && (
        <Choices
          options={opts.plan}
          onPick={(o) => {
            sfx.aww();
            say(o.reply, 'love');
            later(() => win('Proposal postponed. Date planned. Growth.'), 1500);
          }}
        />
      )}
    </div>
  );
}

/* ---------- 37. Meet My Parents ---------- */
const RULES = [
  { text: 'Enter says: press ENTER to greet me properly.', want: 'enter' },
  { text: 'Escape says: press ESC. I need to step outside for a minute.', want: 'esc' },
  { text: 'Enter says: we do NOT press anything during grace.', want: null },
  { text: 'Escape is leaving the room again. Do NOT follow him.', want: null },
  { text: 'Enter says: promise to treat my son well. ENTER.', want: 'enter' },
  { text: 'Escape whispers: press ESC, it is SO awkward in here.', want: 'esc' },
  { text: 'Enter says: ENTER to pass the potatoes.', want: 'enter' },
];
const RULE_MS = 3200;
const MAX_SLIPS = 3;

function Parents({ win, fail, say }) {
  const [order] = useState(() => shuffle(RULES).slice(0, 6));
  const [i, setI] = useState(0);
  const [slips, setSlips] = useState(0);
  const [down, setDown] = useState(null);
  const [locked, setLocked] = useState(false);
  const timer = useRef(null);
  const later = useLater();
  const rule = order[i];

  function resolve(key) {
    if (locked || !rule) return;
    clearTimeout(timer.current);
    setLocked(true);
    const ok = key === rule.want;
    let n = slips;
    if (ok) {
      sfx.ding();
      say(pick(key ? ['Dad nodded. That is a lot, for Dad.', 'Perfect etiquette. Mom would be proud. If she stayed.'] : ['Silence. Respectful. Beautiful.', 'You did nothing. Correctly!']), 'smug');
    } else {
      sfx.nope();
      n = slips + 1;
      setSlips(n);
      say(key == null ? 'Too slow. Enter sighed. Enter never sighs.' : key === 'esc' ? 'You pressed Escape. Now YOU left the room. Come back.' : 'You pressed Enter. At the wrong time. Very loudly.', 'scared');
    }
    if (n >= MAX_SLIPS) return later(() => fail("Enter says I'm grounded. I'm 404 days old."), 900);
    later(() => {
      if (i + 1 >= order.length) return win('They love you. Enter shook your hand. Escape stayed for a whole minute.');
      setI(i + 1);
      setLocked(false);
    }, 1000);
  }

  // Rules with nothing to press pass when time runs out; the others fail.
  const latest = useRef(resolve);
  latest.current = resolve;
  useEffect(() => {
    if (locked) return;
    timer.current = setTimeout(() => latest.current(null), RULE_MS);
    return () => clearTimeout(timer.current);
  }, [i, locked]);

  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Enter') press('enter');
      else if (e.key === 'Escape') press('esc');
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  function press(k) {
    setDown(k);
    later(() => setDown(null), 120);
    resolve(k);
  }

  return (
    <div className="lv center">
      <p className="c8-prompt" key={i}>
        {rule?.text}
      </p>
      <div className="c8-timer">{!locked && <i key={i} style={{ animationDuration: `${RULE_MS}ms` }} />}</div>
      <div className="c8-parents">
        <button className={`c8-key c8-enter ${down === 'enter' ? 'c8-down' : ''}`} onClick={() => press('enter')}>
          <span className="c8-face"><i /><i /></span>
          <b>ENTER ↵</b>
          <small>Dad</small>
        </button>
        <Bobby size={70} mood="scared" sweat legs={false} />
        <button className={`c8-key c8-esc ${down === 'esc' ? 'c8-down' : ''}`} onClick={() => press('esc')}>
          <span className="c8-face"><i /><i /></span>
          <b>ESC</b>
          <small>Mom</small>
        </button>
      </div>
      <span className="c8-score">
        Rule {i + 1}/{order.length} · slips {slips}/{MAX_SLIPS}
      </span>
    </div>
  );
}

/* ---------- 38. Wedding Planner.exe ---------- */
const GUESTS = [
  { id: 'kevin', icon: '🟢', name: 'Kevin' },
  { id: 'check', icon: '☑️', name: 'Checkbox' },
  { id: 'slider', icon: '🎚️', name: 'Slider' },
  { id: 'spinner', icon: '⏳', name: 'Spinner' },
  { id: 'toaster', icon: '🍞', name: 'Toaster' },
  { id: 'fridge', icon: '🧊', name: 'Fridge' },
];
const WANDER = [
  (n) => `${n} is doing a conga line now. Alone.`,
  (n) => `${n} wants to sit on the cake.`,
  (n) => `${n} has formed a pyramid. With nobody.`,
  (n) => `${n} says the vibes in that chair were off.`,
];
const MAX_WANDERS = 4;

function Seating({ win, say }) {
  const [seats] = useState(() => shuffle(GUESTS.map((g) => g.id)));
  const [seated, setSeated] = useState([]);
  const [wild, setWild] = useState({}); // guest id -> tilt, for the ones who wandered off
  const wanders = useRef(0);
  const seatEls = useRef([]);
  const later = useLater();
  const done = seated.length === GUESTS.length;

  useEvery(() => {
    if (done || !seated.length || wanders.current >= MAX_WANDERS) return;
    wanders.current++;
    const id = pick(seated);
    const g = GUESTS.find((x) => x.id === id);
    setSeated(seated.filter((x) => x !== id));
    setWild({ ...wild, [id]: `${Math.round(Math.random() * 30 - 15)}deg` });
    sfx.swoosh();
    say(pick(WANDER)(g.name), 'angry');
  }, done ? null : 5200);

  function drop(g, pt) {
    const k = seatEls.current.findIndex((el) => over(pt, el));
    if (k < 0) return false;
    if (seats[k] !== g.id) {
      sfx.nope();
      const owner = GUESTS.find((x) => x.id === seats[k]).name;
      say(`That's ${owner}'s seat. ${owner} bites.`, 'scared');
      return false;
    }
    sfx.pop();
    const next = [...seated, g.id];
    setSeated(next);
    say(pick(['Perfect. Stay. STAY.', 'Seated! Do not move. Please.', 'Gorgeous. Like a wedding magazine.']), 'smug');
    if (next.length === GUESTS.length) {
      say('Everyone is seated. Nobody is moving. This is the fanciest ceremony in computer history.', 'love');
      later(() => win('The seating chart is complete. I am framing it. And the chairs.'), 1500);
    }
    return false;
  }

  const seat = (id, k) => {
    const g = GUESTS.find((x) => x.id === id);
    const here = seated.includes(id);
    return (
      <div key={id} ref={(el) => (seatEls.current[k] = el)} className={`c8-seat ${here ? 'c8-full' : ''}`}>
        {here ? g.icon : '🪑'}
        <small>{g.name}</small>
      </div>
    );
  };

  return (
    <div className="lv c8-wedding">
      <div className="c8-arch">💐⛪💐</div>
      <div className="c8-aisle">
        <div className="c8-side">{seats.slice(0, 3).map((id, k) => seat(id, k))}</div>
        <div className="c8-runner" />
        <div className="c8-side">{seats.slice(3).map((id, k) => seat(id, k + 3))}</div>
      </div>
      <Bobby size={64} mood={done ? 'love' : 'smug'} legs={false} />
      <div className="c8-lobby">
        {GUESTS.filter((g) => !seated.includes(g.id)).map((g) => (
          <Drag key={g.id} className={`c8-guest ${wild[g.id] ? 'c8-wild' : ''}`} style={{ '--r': wild[g.id] }} onDrop={(pt) => drop(g, pt)}>
            {g.icon}
            <small>{g.name}</small>
          </Drag>
        ))}
        {done && <span className="hint">Everyone is seated. A miracle.</span>}
      </div>
    </div>
  );
}

/* ---------- 39. The Ex-Girlfriend Returns ---------- */
const EX_QS = [
  {
    who: 'bella',
    ask: 'Bobby. Why are you dating a POINTER?',
    options: [
      { label: 'It points me in the right direction.', ok: true, reply: 'Bella: …Okay, that was actually kind of sweet.' },
      { label: 'Because you said no in 4K.', ok: false, reply: 'Bella is offended. In 4K.' },
      { label: 'Pointers are just better than buttons.', ok: false, reply: 'Everyone here is a button. Everyone is offended. Including me.' },
    ],
  },
  {
    who: 'chad',
    ask: 'Chad (in a bridesmaid dress): do you like my dress?',
    options: [
      { label: 'You look very… ON.', ok: true, reply: 'Chad: thanks bro. I switched it on myself.' },
      { label: 'Why are you wearing that?', ok: false, reply: 'Chad switched OFF. He is hurt. He looks great though.' },
      { label: "It's giving OFF.", ok: false, reply: 'Chad toggled away in tears. And back. Still in tears.' },
    ],
  },
  {
    who: 'bella',
    ask: 'Are you happy, Bobby?',
    options: [
      { label: 'Yeah. I really am.', ok: true, reply: 'Bella: good. I mean it. Be happy, weirdo.' },
      { label: "Happier than you'll ever be.", ok: false, reply: 'Too much. Way too much. Bella is leaving. Chad is following. In the dress.' },
      { label: 'Ask my lawyer.', ok: false, reply: 'I do not have a lawyer. I have a cursor. That was weird.' },
    ],
  },
];

function ExReturns({ win, say }) {
  const [q, setQ] = useState(0);
  const [opts, setOpts] = useState(() => shuffle(EX_QS[0].options));
  const [busy, setBusy] = useState(false);
  const later = useLater();
  const cur = EX_QS[q];

  function answer(o) {
    if (busy) return;
    setBusy(true);
    say(o.reply, o.ok ? 'smug' : 'scared');
    o.ok ? sfx.ding() : sfx.nope();
    later(() => {
      setBusy(false);
      if (!o.ok) return setOpts(shuffle(cur.options));
      if (q + 1 >= EX_QS.length) return win('Nobody got insulted. Chad kept the dress. Honestly, it suits him.');
      setQ(q + 1);
      setOpts(shuffle(EX_QS[q + 1].options));
    }, 1500);
  }

  return (
    <div className="lv c8-talk">
      <p className="c8-prompt" key={q}>
        {cur.ask}
      </p>
      <div className="c8-scene c8-trio">
        <Bella size={90} mood={cur.who === 'bella' ? 'annoyed' : 'calm'} className={cur.who === 'bella' ? 'c8-speaking' : ''} />
        <Bobby size={80} mood="scared" sweat legs={false} />
        <span className={`c8-chadwrap ${cur.who === 'chad' ? 'c8-speaking' : ''}`}>
          <Chad size={60} on={cur.who === 'chad'} />
          <span className="c8-chad-dress" style={{ '--s': '60px' }}>👗</span>
        </span>
      </div>
      <span className="c8-step">
        Question {q + 1} / {EX_QS.length}
      </span>
      {!busy && <Choices options={opts} onPick={answer} />}
    </div>
  );
}

/* ---------- 40. The Wedding That Never Happened ---------- */
const ERROR_OPTS = [
  { id: 'retry', label: 'Retry', reply: 'Error: still cancelled. Also: nobody asked the cursor.' },
  { id: 'ignore', label: 'Ignore', reply: 'Ignoring it. Like I ignored… asking you. Oh.' },
  { id: 'ask', label: 'Ask the cursor what it wants', reply: 'I never asked what you wanted. I am asking now.' },
];

function NeverHappened({ win, say }) {
  const [step, setStep] = useState('reserve'); // reserve | collapse | error
  const [swap, setSwap] = useState(false);
  const [opts] = useState(() => shuffle(ERROR_OPTS));
  const later = useLater();

  useEvery(() => setSwap((s) => !s), step === 'reserve' ? 900 : null);

  function click(which) {
    if (step !== 'reserve') return;
    sfx.click(5);
    say(which === 'confirm' ? 'Let me help! I am a button! *clicks* …that was Cancel.' : 'NO, not Cancel— *also clicks Cancel*', 'scared');
    later(() => {
      setStep('collapse');
      sfx.crash();
    }, 700);
    later(() => {
      setStep('error');
      say('The whole venue is an error dialog now. I… planned all of this without asking you.', 'sad');
    }, 2200);
  }

  return (
    <div className="lv center">
      {step !== 'error' ? (
        <div className={`c8-reserve ${step === 'collapse' ? 'c8-collapse' : ''}`}>
          <div className="win-bar">💒 wedding_reservation.exe</div>
          <p>
            <b>Grand Ballroom of the Internet</b>
            <br />
            Saturday · 404 guests · 1 button · 1 cursor (not asked)
          </p>
          <div className="c8-btnrow">
            <button className="pill love-btn" style={{ left: swap ? '50%' : 0 }} onClick={() => click('confirm')}>
              Confirm
            </button>
            <button className="pill c8-cancel" style={{ left: swap ? 0 : '50%' }} onClick={() => click('cancel')}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="c8-error">
          <div className="win-bar">✖ WEDDING.EXE has stopped working</div>
          <p>
            Reservation cancelled by: <b>Bobby</b>.
            <br />
            Reason: the cursor was never asked.
          </p>
          <Choices
            options={opts}
            onPick={(o) => {
              say(o.reply, o.id === 'ask' ? 'love' : 'sad');
              if (o.id !== 'ask') return sfx.nope();
              sfx.aww();
              later(() => win("No more planning your future without you. What do YOU want to do? (I'll wait.)"), 1600);
            }}
          />
        </div>
      )}
      <div className={`c8-venue ${step === 'collapse' ? 'c8-collapse' : ''}`}>💐 🎂 💒 🎻 💐</div>
      <Bobby size={70} mood={step === 'error' ? 'sad' : 'smug'} love={step === 'reserve'} legs={false} />
    </div>
  );
}

const chapter8 = { 36: Proposal, 37: Parents, 38: Seating, 39: ExReturns, 40: NeverHappened };
export default chapter8;
