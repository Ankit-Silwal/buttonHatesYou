'use client';

// Chapter 6: Something Is Wrong With My Cursor. The twist: Bobby starts
// reacting to the player's own pointer. Touch counts too (usePointer listens
// to pointer events, and these stages turn off touch scrolling).

import { useEffect, useRef, useState } from 'react';
import { Bobby, CursorGuy, Bubble, Drag, over, useFrame, useLater, useEvery, useBox, usePointer, rand, pick, clamp, sfx } from '../kit';
import './ch6.css';

// Distance from the pointer to the middle of an element, in px.
function distTo(ptr, el, stage) {
  if (!el || !stage) return Infinity;
  const b = el.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  return Math.hypot(ptr.x - (b.left - s.left + b.width / 2), ptr.y - (b.top - s.top + b.height / 2));
}

/* ---------- 26. Why Is My Heart Beating? ---------- */
const PULSE_LINES = [
  ['Normal. Totally normal. 70 BPM.', 'calm'],
  ['Why is my heart doing that?', 'scared'],
  ["I'm overheating. It's a hardware thing.", 'scared'],
  ["STOP. Come closer. NO. YES. I'M MALFUNCTIONING.", 'scared'],
];

function HeartBeating({ win, say }) {
  const stage = useRef(null);
  const me = useRef(null);
  const ptr = usePointer(stage);
  const s = useRef({ bpm: 70, charge: 0, close: 0, level: 0, phase: 0, done: false });
  const [, redraw] = useState(0);
  const later = useLater();

  useFrame((dt) => {
    const st = s.current;
    if (st.done) return;
    const d = distTo(ptr.current, me.current, stage.current);
    st.close = clamp(1 - (d - 70) / 320, 0, 1);
    st.bpm += (70 + st.close * 150 - st.bpm) * Math.min(1, dt * 3);
    st.charge = clamp(st.charge + (d < 140 ? dt / 4.5 : -dt / 10), 0, 1);

    st.phase += (dt * st.bpm) / 60;
    if (st.phase >= 1) {
      st.phase -= 1;
      if (st.close > 0.25) sfx.heart();
    }

    const level = st.bpm > 190 ? 3 : st.bpm > 150 ? 2 : st.bpm > 100 ? 1 : 0;
    if (level !== st.level) {
      if (level < st.level && st.level >= 2) say("Where are you going? I mean. Good. Go. Stay. Go.", 'sad');
      else say(...PULSE_LINES[level]);
      st.level = level;
    }
    if (st.charge >= 1) {
      st.done = true;
      sfx.win();
      say("The doctor says it's 'a crush'. On WHO??", 'scared');
      later(() => win("I'm not in love with a cursor. I'm in love with... no. No way."), 1600);
    }
    redraw((n) => n + 1);
  });

  const st = s.current;
  return (
    <div className="lv c6-lv c6-heart-lv" ref={stage}>
      <div className="c6-bobby" ref={me}>
        <Bobby size={150} mood={st.close > 0.5 ? 'scared' : 'calm'} blush={st.close > 0.35} sweat={st.close > 0.7} love={st.charge > 0.6} className={st.close > 0.7 ? 'c6-big-blush' : ''}>
          <span className="c6-chest" style={{ '--beat': `${60 / st.bpm}s` }}>
            ❤️
          </span>
          {st.close < 0.05 && !st.charge && <Bubble>Something is wrong with me. Come check?</Bubble>}
        </Bobby>
      </div>
      <div className={`c6-monitor ${st.bpm > 150 ? 'hot' : ''}`}>
        <span className="c6-bpm">♥ {Math.round(st.bpm)} BPM</span>
        <span className="c6-charge">
          <i style={{ width: `${st.charge * 100}%` }} />
        </span>
        <small>diagnosis: {st.charge > 0.66 ? 'oh no' : st.charge > 0.33 ? 'investigating…' : 'unknown'}</small>
      </div>
    </div>
  );
}

/* ---------- 27. Stop Looking at Me Like That ---------- */
const COVERS = [
  { id: 'paper', icon: '📰', name: 'Newspaper', at: [28, 36] },
  { id: 'bag', icon: '🛍️', name: 'Paper bag', at: [72, 34] },
  { id: 'teddy', icon: '🧸', name: 'Teddy', at: [30, 70] },
  { id: 'plant', icon: '🪴', name: 'Plant', at: [72, 70] },
];
const PEEKS = ['*peeks* …hi.', "*peeks* Are you still looking? You are. Oh no.", '*peeks* I just wanted to check. Nothing else.', "*peeks* I'm not blushing. This is my normal color."];

function StopLooking({ win, say }) {
  const [on, setOn] = useState([]);
  const [hover, setHover] = useState(false);
  const [done, setDone] = useState(false);
  const me = useRef(null);
  const later = useLater();

  useEvery(() => {
    if (!on.length || on.length === COVERS.length) return;
    const peek = pick(on);
    setOn(on.filter((c) => c !== peek));
    sfx.swoosh();
    say(pick(PEEKS), 'scared');
  }, done ? null : 2400);

  function cover(id) {
    const next = [...on, id];
    setOn(next);
    sfx.pop();
    if (next.length === COVERS.length) {
      setDone(true);
      say("You can't see me. I'm invisible. (I'm blushing.)", 'smug');
      later(() => win("Fully hidden. You'll never know how red I am. I'm VERY red."), 1400);
    } else say(pick(['More! Cover more!', "Don't look at me like that!", 'Hide me. HIDE ME.']), 'scared');
  }

  return (
    <div className="lv c6-cover">
      <div className="c6-hide" ref={me} onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
        <Bobby size={170} mood={done ? 'smug' : 'scared'} blush love={hover && !done} className={hover ? 'c6-big-blush' : ''}>
          {on.map((id) => {
            const c = COVERS.find((x) => x.id === id);
            return (
              <span key={id} className="c6-on" style={{ left: `${c.at[0]}%`, top: `${c.at[1]}%` }}>
                {c.icon}
              </span>
            );
          })}
        </Bobby>
      </div>
      <span className="c6-count">
        Covered: {on.length} / {COVERS.length}
      </span>
      <div className="c6-shelf">
        {COVERS.filter((c) => !on.includes(c.id)).map((c) => (
          <Drag key={c.id} onDrop={(pt) => over(pt, me.current) && (cover(c.id), false)}>
            <span className="c6-icon">{c.icon}</span>
            <span>{c.name}</span>
          </Drag>
        ))}
      </div>
    </div>
  );
}

/* ---------- 28. The Accidental Kiss ---------- */
const SWEEP_S = 22;
const DENY = ['Nothing happened.', 'Those hearts are… decorative.', 'It was a CSS bug. A romantic CSS bug.', 'I tripped. On purpose. NO. Not on purpose.', "Why is everyone looking at me. It's fine."];

function AccidentalKiss({ win, fail, say }) {
  const [boxRef, box] = useBox();
  const ptr = usePointer(boxRef);
  const [walker, setWalker] = useState({ x: 12, y: 60, cls: '' });
  const [phase, setPhase] = useState('walk'); // walk | sweep | done
  const [flash, setFlash] = useState(false);
  const hearts = useRef([]);
  const left = useRef(SWEEP_S);
  const [, redraw] = useState(0);
  const later = useLater();

  useEffect(() => {
    say('La la la. Just walking. Not near the cursor. Just walking.', 'calm');
    later(() => setWalker({ x: 42, y: 60, cls: '' }), 100);
    later(() => {
      const p = ptr.current;
      const { clientWidth: w, clientHeight: h } = boxRef.current;
      const tx = p.inside ? clamp((p.x / w) * 100, 10, 90) : 62;
      const ty = p.inside ? clamp((p.y / h) * 100, 15, 80) : 35;
      setWalker({ x: tx, y: ty, cls: 'trip fly' });
      say('WHOA—', 'scared');
    }, 1300);
    later(() => {
      sfx.kiss();
      setFlash(true);
      hearts.current = Array.from({ length: 28 }, (_, k) => ({ id: k, x: rand(6, 94), y: rand(8, 86), d: rand(0, 0.5) }));
      setWalker({ x: 50, y: 46, cls: '' });
      setPhase('sweep');
      say('*mwah* …NOTHING HAPPENED. Clean up the hearts! Quick!', 'scared');
    }, 1750);
  }, [say, later, ptr, boxRef]); // all stable: runs once

  useFrame((dt) => {
    if (phase !== 'sweep') return;
    left.current -= dt;
    const p = ptr.current;
    const before = hearts.current.length;
    hearts.current = hearts.current.filter((h) => Math.hypot((h.x / 100) * box.w - p.x, (h.y / 100) * box.h - p.y) > 46);
    if (hearts.current.length < before) {
      sfx.pop();
      if (Math.random() < 0.25) say(pick(DENY), 'scared');
    }
    if (!hearts.current.length) {
      setPhase('done');
      say('See? Nothing happened. Nobody saw anything.', 'smug');
      later(() => win('Nothing happened. (Something happened.) (Nothing happened.)'), 1300);
    } else if (left.current <= 0) {
      setPhase('done');
      fail('The whole website saw. Someone already made it a meme.');
    }
    redraw((n) => n + 1);
  });

  return (
    <div className="lv c6-lv c6-kiss-lv" ref={boxRef}>
      {phase === 'walk' && <span className="c6-step">&lt;div&gt;</span>}
      {hearts.current.map((h) => (
        <span key={h.id} className="c6-heart" style={{ left: `${h.x}%`, top: `${h.y}%`, animationDelay: `${h.d}s` }}>
          💖
        </span>
      ))}
      <span className={`c6-walker ${walker.cls}`} style={{ left: `${walker.x}%`, top: `${walker.y}%` }}>
        <Bobby size={90} mood={phase === 'walk' ? 'calm' : 'scared'} love={phase !== 'walk'} blush={phase !== 'walk'} className={phase === 'walk' ? 'running' : ''} />
      </span>
      {flash && <div className="c6-flash" onAnimationEnd={() => setFlash(false)} />}
      {phase === 'sweep' && (
        <div className="c6-sweep">
          <span>Sweep the hearts away! {hearts.current.length} left</span>
          <span className="c6-charge">
            <i style={{ width: `${(left.current / SWEEP_S) * 100}%` }} />
          </span>
        </div>
      )}
    </div>
  );
}

/* ---------- 29. Am I in Love With an Arrow? ---------- */
const QUESTIONS = [
  { q: 'Pick a shape you like.', a: ['Circle (like me)', 'Square', 'Triangle'], alt: 'An arrow. Pointy. Clicky. 😳' },
  { q: 'Your ideal date?', a: ['A walk in the park', 'Dinner and a movie', 'Staying in'], alt: 'Following someone around the screen' },
  { q: 'What makes your heart beat faster?', a: ['Exercise', 'Coffee', 'Scary movies'], alt: 'When it hovers over me' },
  { q: 'Pick a sound.', a: ['Rain', 'Ocean waves', 'Birds singing'], alt: '*click*' },
];
const ANSWER_LINES = ['Very normal answer. Nothing to see.', 'Hm. Interesting. Moving on.', 'That is what anyone would pick.', "Science. This is just science."];

function PersonalityTest({ win, say }) {
  const [q, setQ] = useState(0);
  const [hover, setHover] = useState(-1);
  const [phase, setPhase] = useState('quiz'); // quiz | calc | result
  const [retakes, setRetakes] = useState(0);
  const later = useLater();

  function answer(k) {
    sfx.click(q * 8 + k);
    setHover(k);
    say(ANSWER_LINES[q], 'calm');
    later(() => {
      setHover(-1);
      if (q + 1 < QUESTIONS.length) return setQ(q + 1);
      calc();
    }, 450);
  }

  function calc() {
    setPhase('calc');
    later(() => {
      setPhase('result');
      sfx.boom();
      say(retakes === 0 ? '…the test is broken.' : retakes === 1 ? 'OK the test is NOT broken.' : 'I have taken this test 400 times.', 'scared');
    }, 1500);
  }

  const cur = QUESTIONS[q];
  return (
    <div className="lv c6-test">
      <div className="c6-sheet">
        {phase === 'quiz' && (
          <>
            <h3>
              Love-o-meter 3000 · {q + 1} / {QUESTIONS.length}
            </h3>
            <p className="c6-q">{cur.q}</p>
            <div className="c6-answers">
              {cur.a.map((a, k) => (
                <button key={a} className={hover === k ? 'morph' : ''} onPointerEnter={() => setHover(k)} onPointerLeave={() => setHover(-1)} onClick={() => answer(k)}>
                  {hover === k ? cur.alt : a}
                </button>
              ))}
            </div>
          </>
        )}
        {phase === 'calc' && (
          <>
            <h3>Calculating your feelings…</h3>
            <div className="c6-calc">
              <i />
            </div>
          </>
        )}
        {phase === 'result' && (
          <>
            <h3>Your result</h3>
            <p className="c6-result">100% CURSORSEXUAL 🖱️💘</p>
            <div className="row">
              <button
                className="pill ghost"
                onClick={() => {
                  setRetakes(retakes + 1);
                  say(pick(["Again. It's a glitch.", 'One more time. For science.', 'Maybe I clicked wrong.']), 'scared');
                  calc();
                }}
              >
                Retake test
              </button>
              <button
                className="pill love-btn"
                onClick={() => {
                  sfx.kiss();
                  win("100%. The test doesn't lie. I'm in love with an arrow. With YOU.");
                }}
              >
                Accept it
              </button>
            </div>
          </>
        )}
      </div>
      <Bobby size={80} mood={phase === 'result' ? 'scared' : 'calm'} blush={phase === 'result'} love={phase === 'result' && retakes > 0} />
    </div>
  );
}

/* ---------- 30. The Confession ---------- */
const NEED = ['I', 'LOVE', 'YOU'];
const DECOY_WORDS = ['LOAF', 'YOGURT', 'LIKE?', 'CHEESE', 'TOLERATE', 'SANDWICH', 'EYE', 'LOBE', 'EWE', 'MAYBE', 'CURSOR', 'UHH'];

function Confession({ win, say }) {
  const [boxRef] = useBox();
  const words = useRef([]);
  const n = useRef(0);
  const [got, setGot] = useState(0);
  const [phase, setPhase] = useState('catch'); // catch | confess
  const [runner, setRunner] = useState(null);
  const [, redraw] = useState(0);
  const later = useLater();

  useEvery(() => {
    const need = NEED[got];
    const text = Math.random() < 0.42 ? need : pick(DECOY_WORDS);
    words.current.push({ id: n.current++, text, x: rand(10, 88), y: -6, v: rand(13, 20) });
  }, phase === 'catch' ? 650 : null);

  useFrame((dt) => {
    words.current.forEach((w) => (w.y += w.v * dt));
    words.current = words.current.filter((w) => w.y < 108);
    redraw((k) => k + 1);
  }, phase === 'catch');

  function grab(w) {
    if (phase !== 'catch') return;
    words.current = words.current.filter((x) => x.id !== w.id);
    if (w.text !== NEED[got]) {
      sfx.nope();
      const said = [...NEED.slice(0, got), w.text].join(' ');
      return say(`${said}… NO. That's not it. Delete.`, 'scared');
    }
    sfx.ding();
    const g = got + 1;
    setGot(g);
    if (g < NEED.length) return say(g === 1 ? 'I… (keep going)' : 'I LOVE… (one more!!)', 'scared');
    setPhase('confess');
    words.current = [];
    say('I LOVE YOU.', 'love');
    later(() => setRunner({ x: 62, y: 42 }), 700);
    later(() => {
      setRunner({ x: 140, y: -30 });
      sfx.swoosh();
      say('…wait. Where are you going?', 'sad');
    }, 1700);
    later(() => win("It ran away. That means it's shy. Right? RIGHT?"), 3600);
  }

  return (
    <div className="lv c6-lv c6-words-lv" ref={boxRef}>
      {words.current.map((w) => (
        <button key={w.id} className="c6-word" style={{ left: `${w.x}%`, top: `${w.y}%` }} onPointerDown={() => grab(w)}>
          {w.text}
        </button>
      ))}
      {runner && (
        <span className="c6-runner" style={{ left: `${runner.x}%`, top: `${runner.y}%` }}>
          <CursorGuy size={56} />
        </span>
      )}
      <div className="c6-sentence">
        <Bobby size={64} mood={phase === 'confess' ? 'scared' : 'calm'} blush love={phase === 'confess'} legs={false} />
        <span className="c6-slots">
          {NEED.map((w, k) => (
            <span key={w} className={k < got ? 'set' : ''}>
              {k < got ? w : '…'}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

const chapter6 = { 26: HeartBeating, 27: StopLooking, 28: AccidentalKiss, 29: PersonalityTest, 30: Confession };
export default chapter6;
