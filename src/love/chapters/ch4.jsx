'use client';

// Chapter 4: The Villain Arc. Rejection, but make it evil.

import { useEffect, useRef, useState } from 'react';
import { Bobby, Chad, Bubble, Drag, over, useLater, useEvery, useFrame, useBox, rand, pick, sfx } from '../kit';
import { lookProps } from '@/avatar/look';
import { useProfile } from '@/profile/useProfile';
import './ch4.css';

/* ---------- 16. Bobby Goes to the Gym ---------- */
const REPS = 30;
const GYM_LINES = { 5: 'I can feel it. A muscle. Somewhere.', 12: 'LOOK AT THESE ARMS.', 20: 'My legs? We do not talk about my legs.', 26: 'ONE MORE. FIVE MORE. INFINITY MORE.' };

function Gym({ win, say }) {
  const [pump, setPump] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [spot, setSpot] = useState({ x: 22, y: 40 });
  const done = pump >= REPS;
  const later = useLater();
  const skin = lookProps(useProfile().wallet.equipped).style; // the arms match his outfit

  // Muscles fade if you stop.
  useEvery(() => setPump(Math.max(0, pump - 1)), done || pump === 0 ? null : 700);

  function lift() {
    if (done) return;
    const p = pump + 1;
    const c = clicks + 1;
    setPump(p);
    setClicks(c);
    sfx.click(p * 3);
    if (GYM_LINES[p]) say(GYM_LINES[p], 'smug');
    if (c % 5 === 0) setSpot({ x: Math.random() < 0.5 ? rand(10, 30) : rand(70, 90), y: rand(22, 66) });
    if (p === REPS) {
      sfx.win();
      say('HUGE. I am huge. My legs are still 2 pixels. Balance is a myth.', 'smug');
      later(() => win('Arms: enormous. Legs: decorative. Confidence: dangerous.'), 1500);
    }
  }

  return (
    <div className="lv c4-gym">
      <div className="c4-lifter">
        <Bobby size={110} mood={done ? 'smug' : pump > 10 ? 'angry' : 'tired'} sweat={pump > 6 && !done} className="c4-tiny" style={{ ...skin, '--pump': 1 + (pump / REPS) * 2.4 }}>
          <span className="c4-arm l" />
          <span className="c4-arm r" />
        </Bobby>
      </div>
      <button className="c4-bell" style={{ left: `${spot.x}%`, top: `${spot.y}%` }} onPointerDown={lift} aria-label="Lift">
        🏋️
      </button>
      <div className="c4-meter">
        <i style={{ width: `${(Math.min(pump, REPS) / REPS) * 100}%` }} />
      </div>
      <p className="c4-count">
        💪 {Math.min(pump, REPS)} / {REPS} · click the dumbbell fast
      </p>
    </div>
  );
}

/* ---------- 17. Become an Alpha Button ---------- */
const ADVICE = [
  ['Never blink. Blinking is weakness.', 'Introduce yourself with your Wi-Fi password.', "Walk in sideways. It's mysterious."],
  ['Text back in 3 to 5 business days.', 'Refer to yourself in the third person. Bobby likes that.', 'Wear sunglasses indoors. And in the shower.'],
  ['Tell her her pixels look slightly blurry.', 'Flex while sitting completely still.', 'Say "interesting" to everything. Even "hi".'],
  ['Buy a boat. Or a picture of a boat.', 'Name your legs. Mine are Greg and Also Greg.', 'Growl softly when someone says hello.'],
];
const GAIN = 36;

function AlphaSeminar({ win, say }) {
  const [round, setRound] = useState(0);
  const [ego, setEgo] = useState(18);
  const later = useLater();
  const done = round >= ADVICE.length;

  function take(card) {
    if (done) return;
    const e = ego + GAIN;
    setEgo(e);
    sfx.ding();
    say(`${card} …Genius. Writing it on my forehead.`, 'smug');
    const r = round + 1;
    setRound(r);
    if (r === ADVICE.length) {
      sfx.win();
      later(() => say(`Ego at ${e}%. The meter is crying. I am ALPHA.`, 'angry'), 1300);
      later(() => win(`${e}% alpha. I paid 400 coins for this. Best money I ever spent.`), 2900);
    }
  }

  return (
    <div className="lv c4-seminar">
      <div className="c4-podium">
        <Bobby size={84} mood={done ? 'angry' : 'smug'} />
        <span className="c4-coach">
          🎤<small>Coach Bigbutton</small>
        </span>
      </div>
      <div className={`c4-ego ${ego > 100 ? 'over' : ''}`}>
        <i style={{ width: `${ego}%` }} />
        <b>Ego {ego}%</b>
      </div>
      {!done && (
        <div className="c4-cards" key={round}>
          {ADVICE[round].map((a) => (
            <button key={a} className="c4-advice" onClick={() => take(a)}>
              <small>Lesson {round + 1}</small>
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- 18. Delete Chad ---------- */
const RESTORE_MS = 1500;
const LAST_CHANCE_MS = 2600;

function DeleteChad({ win, say }) {
  const bin = useRef(null);
  const [pos, setPos] = useState({ x: 34, y: 45 });
  const [inBin, setInBin] = useState(false);
  const [drops, setDrops] = useState(0);
  const [toast, setToast] = useState('');
  const [deleted, setDeleted] = useState(false);
  const restore = useRef(null);
  const later = useLater();

  function dropped(pt) {
    if (!over(pt, bin.current)) {
      say('The BIN. Drag him into the BIN.', 'angry');
      return false;
    }
    const d = drops + 1;
    setDrops(d);
    setInBin(true);
    sfx.thud();
    setToast('🗑️ Chad moved to Recycle Bin');
    say(d < 3 ? 'Goodbye, Chad. Forever. (Please be forever.)' : 'EMPTY IT. EMPTY THE BIN. NOW.', d < 3 ? 'smug' : 'scared');
    restore.current = later(
      () => {
        setInBin(false);
        setPos({ x: rand(25, 60), y: rand(25, 70) });
        sfx.ring();
        setToast('♻️ Chad was restored. He toggled himself back on.');
        say(pick(['HE TOGGLED BACK.', 'Of course he did. ON. OFF. ON.', 'Restored?? Who restores CHAD?']), 'angry');
      },
      d < 3 ? RESTORE_MS : LAST_CHANCE_MS
    );
    return false;
  }

  function empty() {
    clearTimeout(restore.current);
    setDeleted(true);
    setInBin(false);
    sfx.crash();
    setToast('Recycle Bin emptied. 1 toggle permanently deleted.');
    say('He is gone. I am the only button now. …It is very quiet.', 'smug');
    later(() => win('Chad has been deleted. (He has a backup on the cloud. I know he does.)'), 1800);
  }

  return (
    <div className="lv c4-desk">
      <div className="c4-icons">
        <span>
          📁<small>My Feelings</small>
        </span>
        <span>
          📄<small>revenge.txt</small>
        </span>
      </div>
      {toast && (
        <div className="c4-toast" key={toast + drops}>
          {toast}
        </div>
      )}
      {!inBin && !deleted && (
        <div className="c4-chad-spot" style={{ left: `${pos.x}%`, top: `${pos.y}%` }} key={`${pos.x}-${drops}`}>
          <Drag onDrop={dropped} onPick={() => say('Grab him. Gently. Like a criminal.')}>
            <Chad on size={52} />
          </Drag>
        </div>
      )}
      <div className={`c4-bin ${inBin ? 'full' : ''}`} ref={bin}>
        <span>{deleted ? '✨' : '🗑️'}</span>
        Recycle Bin
        {inBin && drops >= 3 && (
          <button className="c4-empty" onClick={empty}>
            Empty bin
          </button>
        )}
        {inBin && drops < 3 && <small>emptying… not supported in trial</small>}
      </div>
      <div style={{ position: 'absolute', left: '36%', bottom: 18 }}>
        <Bobby size={66} mood={deleted ? 'smug' : 'angry'} />
      </div>
    </div>
  );
}

/* ---------- 19. Evil Laugh Training ---------- */
const PX = 120; // pixels per second the wave scrolls
const NEEDED = 0.6;

function makeWave() {
  const segs = [];
  let t = 0;
  let hi = false;
  while (t < 8) {
    const d = rand(0.5, 1.1);
    segs.push({ from: t, to: t + d, hi });
    t += d;
    hi = !hi;
  }
  return segs;
}

function EvilLaugh({ win, fail, say }) {
  const [ref, box] = useBox();
  const [wave] = useState(makeWave);
  const end = wave[wave.length - 1].to;
  const t = useRef(-1.2);
  const holding = useRef(false);
  const trace = useRef([]);
  const score = useRef({ good: 0, total: 0 });
  const squeak = useRef(0);
  const [down, setDown] = useState(false);
  const [, redraw] = useState(0);
  const finished = useRef(false);
  const later = useLater();

  const setHold = (v) => {
    holding.current = v;
    setDown(v);
  };

  useEffect(() => {
    const up = () => setHold(false);
    const key = (e) => e.code === 'Space' && (e.preventDefault(), setHold(e.type === 'keydown'));
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', key);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', key);
    };
  }, []);

  useFrame((dt) => {
    if (finished.current) return;
    t.current += dt;
    const now = t.current;
    if (now >= 0 && now <= end) {
      const seg = wave.find((s) => now >= s.from && now < s.to);
      score.current.total += dt;
      if (seg && seg.hi === holding.current) score.current.good += dt;
      trace.current.push({ t: now, hi: holding.current });
      if (trace.current.length > 400) trace.current.shift();
      squeak.current -= dt;
      if (holding.current && squeak.current <= 0) {
        squeak.current = 0.22;
        sfx.tone(rand(900, 1300), 0.08, 'square', 0.25, rand(600, 800));
      }
    }
    redraw((n) => n + 1);
    if (now > end + 0.4) {
      finished.current = true;
      const r = score.current.good / Math.max(0.01, score.current.total);
      const pct = Math.round(r * 100);
      if (r >= NEEDED) {
        say(`${pct}% evil. MWAHAHA. (It came out as "meep meep meep".)`, 'angry');
        later(() => win(`${pct}% evil laugh. Chad will be terrified. Or confused. Either works.`), 1400);
      } else later(() => fail(`${pct}% match. I sounded like a rubber duck. A sad one.`), 400);
    }
  });

  const W = box.w || 400;
  const head = W * 0.3;
  const xAt = (s) => head + (s - t.current) * PX;
  const r = score.current.total ? Math.round((score.current.good / score.current.total) * 100) : 0;

  return (
    <div className="lv c4-laugh">
      <Bobby size={80} mood={down ? 'angry' : 'smug'}>
        <Bubble>{t.current < 0 ? 'Ready… hold for HA, let go for quiet.' : down ? 'MWA-HA-HA!' : '…'}</Bubble>
      </Bobby>
      <div className="c4-scope" ref={ref}>
        <small style={{ top: 10 }}>HOLD</small>
        <small style={{ bottom: 10 }}>LET GO</small>
        {wave.map((s, i) => {
          const x1 = xAt(s.from);
          const x2 = xAt(s.to);
          if (x2 < 0 || x1 > W) return null;
          return <span key={i} className={`c4-seg ${s.hi ? 'hi' : 'lo'}`} style={{ left: x1, width: x2 - x1 }} />;
        })}
        <svg className="c4-trace" viewBox={`0 0 ${W} 150`} preserveAspectRatio="none" aria-hidden="true">
          <polyline points={trace.current.map((s) => `${xAt(s.t).toFixed(1)},${s.hi ? 33 : 117}`).join(' ')} />
        </svg>
        <span className="c4-playhead" />
      </div>
      <div className="c4-row">
        <span className="c4-match">
          <b>{r}%</b>match
        </span>
        <button
          className={`c4-hold ${down ? 'down' : ''}`}
          onPointerDown={(e) => {
            e.preventDefault();
            setHold(true);
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          HOLD
          <br />
          to laugh
        </button>
        <span className="c4-match">
          <b>{Math.round(NEEDED * 100)}%</b>needed
        </span>
      </div>
    </div>
  );
}

/* ---------- 20. The Revenge Plan ---------- */
const SLOTS = [
  { id: 'trigger', label: 'Trigger' },
  { id: 'mechanism', label: 'Mechanism' },
  { id: 'payload', label: 'Payload' },
];
const PARTS = [
  { id: 'checkbox', icon: '☑️', name: 'Checkbox' },
  { id: 'slider', icon: '🎚️', name: 'Slider ramp' },
  { id: 'h1', icon: '🔠', name: 'Giant <h1>' },
  { id: 'popup', icon: '🪟', name: 'Popup' },
  { id: 'spring', icon: '🌀', name: 'CSS spring' },
  { id: 'banana', icon: '🍌', name: 'Banana (not UI)' },
];

function RevengePlan({ win, say }) {
  const slotEls = useRef({});
  const [set, setSet] = useState({});
  const [phase, setPhase] = useState('build'); // build | count | boom
  const [count, setCount] = useState(3);
  const later = useLater();
  const ready = SLOTS.every((s) => set[s.id]);

  function place(part, pt) {
    const slot = SLOTS.find((s) => over(pt, slotEls.current[s.id]));
    if (!slot) return false;
    setSet((v) => ({ ...v, [slot.id]: part }));
    sfx.pop();
    say(
      part.id === 'banana'
        ? 'A banana. Classic. Timeless. Not technically UI. Allowed.'
        : `${part.name} as the ${slot.label.toLowerCase()}. Diabolical.`,
      'smug'
    );
    return false;
  }

  function activate() {
    setPhase('count');
    say('Chad walks in… the trap triggers… and…', 'angry');
    [2, 1].forEach((n, i) => later(() => (setCount(n), sfx.tick()), (i + 1) * 600));
    later(() => {
      setPhase('boom');
      sfx.boom();
      say('WAIT THAT IS FACING THE WRONG WAYYYYYyyyy', 'scared');
    }, 1800);
    later(() => win("It backfired. I'm on a recipe website now. It's 4000 words about lasagna."), 3600);
  }

  return (
    <div className="lv c4-plan">
      <div className="c4-scene">
        <span className={`c4-bobby ${phase === 'boom' ? 'launch' : ''}`} style={{ display: 'inline-block' }}>
          <Bobby size={72} mood={phase === 'boom' ? 'scared' : 'angry'} />
          {phase === 'boom' && <span className="c4-boing">BOING</span>}
        </span>
        {phase === 'count' && <b style={{ fontSize: 40, color: 'var(--btn-dark)' }}>{count}</b>}
        <Chad on={phase !== 'boom'} size={46} />
      </div>
      <div className="c4-slots">
        {SLOTS.map((s) => (
          <div key={s.id} ref={(el) => (slotEls.current[s.id] = el)} className={`c4-slot ${set[s.id] ? 'set' : ''}`}>
            <small>{s.label}</small>
            {set[s.id] ? (
              <>
                <b>{set[s.id].icon}</b>
                {set[s.id].name}
              </>
            ) : (
              'drop here'
            )}
          </div>
        ))}
      </div>
      {phase === 'build' && (
        <>
          <div className="c4-parts">
            {PARTS.map((p) => (
              <Drag key={p.id} className="c4-part" onDrop={(pt) => place(p, pt)}>
                <span>{p.icon}</span>
                {p.name}
              </Drag>
            ))}
          </div>
          <button className="pill love-btn" disabled={!ready} onClick={activate}>
            Activate the trap
          </button>
        </>
      )}
    </div>
  );
}

const chapter4 = { 16: Gym, 17: AlphaSeminar, 18: DeleteChad, 19: EvilLaugh, 20: RevengePlan };
export default chapter4;
