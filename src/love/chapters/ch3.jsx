'use client';

// Chapter 3: Bobby Gets Rejected. Five increasingly disastrous attempts at Bella.

import { useEffect, useRef, useState } from 'react';
import { Bobby, Bella, Chad, Bubble, useLater, useEvery, useFrame, useBox, usePointer, rand, pick, sfx } from '../kit';
import './ch3.css';

/* ---------- 11. The Pickup Line Generator ---------- */
// The first entry of each wheel is the only combination that works.
const WHEELS = [
  ['Are you a keyboard?', 'Are you Wi-Fi?', 'Hey girl,', 'Excuse me,', 'Are you a parking ticket?'],
  ["Because you're", "I'm feeling", 'You look like', 'My heart is', 'I would like'],
  ['just my type.', 'a loading screen.', '404 not found.', 'a refund.', 'the Terms and Conditions.'],
];
const BELLA_SAYS = ['No.', 'Ew.', '…What?', 'Heh. Mildly amusing.'];
const SPIN_MS = 380;

function PickupLines({ win, say }) {
  const [idx, setIdx] = useState([0, 2, 4]);
  const [stopped, setStopped] = useState([false, false, false]);
  const [tries, setTries] = useState(0);
  const [bella, setBella] = useState('');
  const later = useLater();
  const all = stopped.every(Boolean);

  useEvery(() => setIdx((v) => v.map((n, k) => (stopped[k] ? n : (n + 1) % WHEELS[k].length))), all ? null : SPIN_MS);

  function stop(k) {
    if (stopped[k]) return;
    sfx.tick();
    setStopped((s) => s.map((v, j) => v || j === k));
  }

  function deliver() {
    const line = idx.map((n, k) => WHEELS[k][n]).join(' ');
    const score = idx.filter((n) => n === 0).length;
    setTries((t) => t + 1);
    say(`*with zero hesitation* ${line}`, 'smug');
    const reply = score === 3 ? BELLA_SAYS[3] : BELLA_SAYS[Math.min(2, score)];
    later(() => {
      setBella(reply);
      if (score === 3) {
        sfx.win();
        say('MILDLY AMUSED. Bro. BRO. That is basically a marriage proposal.', 'smug');
        later(() => win('She was mildly amused. I am framing this moment.'), 1600);
      } else {
        sfx.nope();
        say(pick(["She's playing hard to get.", 'That one was a warm-up.', 'She loved it. Internally.']), 'sad');
        later(() => {
          setBella('');
          setStopped([false, false, false]);
        }, 1400);
      }
    }, 900);
  }

  return (
    <div className="lv c3-pickup">
      <div className="c3-pair">
        <Bobby size={80} mood="smug" />
        <Bella size={80} mood={bella === BELLA_SAYS[3] ? 'smug' : bella ? 'annoyed' : 'calm'}>
          {bella && <Bubble>{bella}</Bubble>}
        </Bella>
      </div>
      <div className="c3-wheels">
        {WHEELS.map((w, k) => (
          <button
            key={k}
            className={`c3-wheel ${stopped[k] ? 'stopped' : ''} ${tries >= 3 && idx[k] === 0 ? 'hint' : ''}`}
            onClick={() => stop(k)}
          >
            <span key={idx[k]}>{w[idx[k]]}</span>
            <small>{stopped[k] ? 'locked' : 'tap to stop'}</small>
          </button>
        ))}
      </div>
      <button className="pill love-btn" disabled={!all || !!bella} onClick={deliver}>
        Deliver the line
      </button>
    </div>
  );
}

/* ---------- 12. Become Tall ---------- */
const BLOCKS = 10;
const BW = 92;

function BecomeTall({ win, say }) {
  const [ref, box] = useBox();
  const stack = useRef([]); // x centers of the stacked divs
  const slider = useRef({ x: 60, dir: 1 });
  const [, redraw] = useState(0);
  const [falling, setFalling] = useState(null);
  const done = useRef(false);
  const later = useLater();

  const bh = Math.max(14, Math.min(30, Math.floor((box.h - 190) / BLOCKS)));
  const ground = 24;
  const baseX = box.w ? Math.min(box.w * 0.38, box.w / 2 - 40) : 150;

  useFrame((dt) => {
    if (done.current || !box.w) return;
    const s = slider.current;
    const speed = 150 + stack.current.length * 22;
    s.x += s.dir * speed * dt;
    const lo = BW / 2 + 6;
    const hi = box.w * 0.62;
    if (s.x > hi) [s.x, s.dir] = [hi, -1];
    if (s.x < lo) [s.x, s.dir] = [lo, 1];
    redraw((n) => n + 1);
  });

  function drop() {
    if (done.current || falling) return;
    const top = stack.current.length ? stack.current[stack.current.length - 1] : baseX;
    const x = slider.current.x;
    if (BW - Math.abs(x - top) < BW * 0.4) {
      sfx.thud();
      setFalling({ x, n: Date.now() });
      later(() => setFalling(null), 600);
      return say(pick(['That div fell into the footer.', 'Respect the grid!', "Bro. Stack it, don't throw it."]), 'annoyed');
    }
    stack.current.push(x);
    sfx.click(stack.current.length * 8);
    const n = stack.current.length;
    if (n === 4) say('I can see her knees. Beautiful knees.', 'smug');
    if (n === 7) say('Getting dizzy. Worth it.', 'scared');
    if (n === BLOCKS) {
      done.current = true;
      say('Eye level. Hi. Hello. I am tall now. (I am standing on 40 divs.)', 'smug');
      later(() => win('I made it to eye level. She looked away. But I MADE IT.'), 1700);
    }
  }

  const n = stack.current.length;
  const top = n ? stack.current[n - 1] : baseX;
  // Her (stretched) eyes sit ~41% down her body; line them up with Bobby's on the last div.
  const bellaH = Math.round((BLOCKS * bh + 28) / 0.59);

  return (
    <div className="lv c3-tall" ref={ref} onPointerDown={drop}>
      <div className="c3-ground" style={{ height: ground }} />
      {stack.current.map((x, i) => (
        <div key={i} className="c3-div" style={{ left: x - BW / 2, bottom: ground + i * bh, width: BW, height: bh }}>
          {'<div>'}
        </div>
      ))}
      {!done.current && (
        <div className="c3-div moving" style={{ left: slider.current.x - BW / 2, top: 8, width: BW, height: bh }}>
          {'<div>'}
        </div>
      )}
      {falling && <div key={falling.n} className="c3-div fall" style={{ left: falling.x - BW / 2, top: 8, width: BW, height: bh }}>{'<div>'}</div>}
      <div className="c3-climber" style={{ left: top, bottom: ground + n * bh }}>
        <Bobby size={48} mood={n === BLOCKS ? 'smug' : 'scared'} />
      </div>
      <div className="c3-tall-bella" style={{ height: bellaH }}>
        <Bella size={80} mood="calm" style={{ transform: `scaleY(${bellaH / 80})` }} />
      </div>
      <p className="c3-count">
        {n} / {BLOCKS} divs · tap to drop
      </p>
    </div>
  );
}

/* ---------- 13. The Romantic Dance ---------- */
const LANES = ['←', '↑', '↓', '→'];
const KEYS = { ArrowLeft: 0, ArrowUp: 1, ArrowDown: 2, ArrowRight: 3 };
const NOTES = 16;
const NEED = 10;
const TRAVEL = 2.2; // seconds from top to the line
const WINDOW = 0.13; // how far from the line still counts, as a fraction of the trip

function RomanticDance({ win, fail, say }) {
  const notes = useRef([]);
  const spawned = useRef(0);
  const [, redraw] = useState(0);
  const [score, setScore] = useState({ hit: 0, miss: 0 });
  const [legOff, setLegOff] = useState(0);
  const [flash, setFlash] = useState(null);
  const [songOver, setSongOver] = useState(false);
  const ended = useRef(false);
  const later = useLater();

  useEvery(() => {
    if (spawned.current >= NOTES) return;
    spawned.current++;
    notes.current.push({ id: spawned.current, lane: Math.floor(Math.random() * 4), p: 0 });
  }, 750);

  function oops() {
    sfx.nope();
    setLegOff((n) => n + 1);
    say(pick(['MY LEG.', 'It snapped back. Nobody saw.', 'That was a dance move. A new one.', 'Leg says no.']), 'scared');
  }

  useFrame((dt) => {
    if (ended.current) return;
    let missed = 0;
    notes.current.forEach((x) => (x.p += dt / TRAVEL));
    notes.current = notes.current.filter((x) => (x.p > 1 + WINDOW ? (missed++, false) : true));
    redraw((n) => n + 1);
    if (missed) {
      setScore((s) => ({ ...s, miss: s.miss + missed }));
      oops();
    }
    if (spawned.current >= NOTES && !notes.current.length) {
      ended.current = true;
      setSongOver(true);
    }
  });

  // The song is over once every note is gone; score is current by then.
  useEffect(() => {
    if (!songOver) return;
    if (score.hit >= NEED) {
      say('She… She smiled. At the DJ. But still!', 'smug');
      later(() => win(`${score.hit} out of ${NOTES}. I am basically a backup dancer now.`), 1200);
    } else later(() => fail('She left during the slow song. With a ceiling fan.'), 600);
  }, [songOver]); // eslint-disable-line react-hooks/exhaustive-deps

  function hit(lane) {
    if (ended.current) return;
    const target = notes.current
      .filter((x) => x.lane === lane && Math.abs(x.p - 1) <= WINDOW)
      .sort((a, b) => Math.abs(a.p - 1) - Math.abs(b.p - 1))[0];
    setFlash({ lane, ok: !!target });
    later(() => setFlash(null), 160);
    if (!target) return oops();
    notes.current = notes.current.filter((x) => x !== target);
    sfx.click(lane * 20 + 40);
    setScore((s) => ({ ...s, hit: s.hit + 1 }));
  }

  useEffect(() => {
    const key = (e) => {
      if (e.code in KEYS || e.key in KEYS) {
        e.preventDefault();
        hit(KEYS[e.key]);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  return (
    <div className="lv c3-dance">
      <div className="c3-dancers">
        <Bobby size={74} mood={legOff % 2 ? 'scared' : 'smug'} className={`c3-dancer ${legOff ? `leg-off-${legOff % 2}` : ''}`} />
        <Bella size={66} mood="calm" />
      </div>
      <div className="c3-lanes">
        {LANES.map((a, k) => (
          <div key={k} className="c3-lane">
            {notes.current
              .filter((x) => x.lane === k)
              .map((x) => (
                <span key={x.id} className="c3-note" style={{ top: `${x.p * 86}%` }}>
                  {a}
                </span>
              ))}
            <span className="c3-line" />
          </div>
        ))}
      </div>
      <div className="c3-pads">
        {LANES.map((a, k) => (
          <button key={k} className={`c3-pad ${flash?.lane === k ? (flash.ok ? 'ok' : 'bad') : ''}`} onPointerDown={() => hit(k)}>
            {a}
          </button>
        ))}
      </div>
      <p className="c3-count">
        💃 {score.hit} / {NEED} needed · arrow keys or tap
      </p>
    </div>
  );
}

/* ---------- 14. Chad the Toggle Arrives ---------- */
const MOVES = [
  { id: 'on', label: 'ON', icon: '🟢' },
  { id: 'off', label: 'OFF', icon: '⚪' },
  { id: 'flex', label: 'FLEX', icon: '💪' },
  { id: 'wink', label: 'WINK', icon: '😉' },
];
const ROUNDS = [3, 4, 5];

function ChadArrives({ win, say }) {
  const [round, setRound] = useState(0);
  const [seq, setSeq] = useState(() => Array.from({ length: ROUNDS[0] }, () => pick(MOVES).id));
  const [showing, setShowing] = useState(-1); // index Chad is performing, -1 = player's turn
  const [input, setInput] = useState([]);
  const [chadOn, setChadOn] = useState(true);
  const [bellaLine, setBellaLine] = useState('');
  const later = useLater();

  // Chad performs the sequence.
  useEffect(() => {
    if (showing < 0) return;
    if (showing >= seq.length) {
      setShowing(-1);
      say('Your turn. Copy him. Exactly. With passion.', 'angry');
      return;
    }
    const m = seq[showing];
    if (m === 'on' || m === 'off') setChadOn(m === 'on');
    sfx.beep(300 + MOVES.findIndex((x) => x.id === m) * 120);
    const t = setTimeout(() => setShowing(showing + 1), 750);
    return () => clearTimeout(t);
  }, [showing, seq, say]);

  useEffect(() => {
    const t = setTimeout(() => setShowing(0), 900);
    return () => clearTimeout(t);
  }, []);

  function press(id) {
    if (showing >= 0) return;
    const next = [...input, id];
    const k = next.length - 1;
    sfx.beep(300 + MOVES.findIndex((x) => x.id === id) * 120);
    if (seq[k] !== id) {
      sfx.nope();
      setInput([]);
      say(pick(['I flexed the wrong thing.', 'That was a wink. I meant a flex. I can explain.', 'Chad is laughing. In binary.']), 'sad');
      return later(() => setShowing(0), 900);
    }
    setInput(next);
    if (next.length < seq.length) return;
    if (round === ROUNDS.length - 1) {
      sfx.win();
      setBellaLine('Wow, Chad, you are SO good at this.');
      say('I… did every move. Perfectly. She is talking to Chad.', 'sad');
      return later(() => win('She complimented Chad. For MY moves.'), 2200);
    }
    say(['Ha! Take that, Chad.', 'Chad is sweating. Toggles can sweat.'][round], 'smug');
    const r = round + 1;
    setRound(r);
    setInput([]);
    setSeq((s) => [...s, ...Array.from({ length: ROUNDS[r] - s.length }, () => pick(MOVES).id)]);
    later(() => setShowing(0), 900);
  }

  const performing = showing >= 0 && showing < seq.length ? seq[showing] : null;

  return (
    <div className="lv center c3-chad">
      <div className="c3-stage-row">
        <span className={`c3-chad-wrap ${performing ?? ''}`}>
          <Chad on={chadOn} size={62} />
          {performing === 'flex' && <span className="c3-pose">💪</span>}
          {performing === 'wink' && <span className="c3-pose">😉</span>}
        </span>
        <Bella size={70} mood={bellaLine ? 'smug' : 'calm'} blush={!!bellaLine}>
          {bellaLine && <Bubble>{bellaLine}</Bubble>}
        </Bella>
        <Bobby size={70} mood={showing >= 0 ? 'annoyed' : 'smug'} />
      </div>
      <div className="c3-seq">
        {seq.map((m, i) => (
          <i key={i} className={i < input.length ? 'done' : i === showing ? 'now' : ''} />
        ))}
      </div>
      <div className="c3-moves">
        {MOVES.map((m) => (
          <button key={m.id} className="c3-move" disabled={showing >= 0} onClick={() => press(m.id)}>
            <span>{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>
      <p className="c3-count">
        Round {round + 1} / {ROUNDS.length} · {showing >= 0 ? 'Chad is flexing… watch' : 'your turn'}
      </p>
    </div>
  );
}

/* ---------- 15. Rejected in 4K ---------- */
const PIECES = 8;

function Rejected4K({ win, say }) {
  const [ref, box] = useBox();
  const ptr = usePointer(ref);
  const pieces = useRef([]);
  const catcher = useRef(0.5);
  const [caught, setCaught] = useState(0);
  const [, redraw] = useState(0);
  const [mended, setMended] = useState(false);
  const n = useRef(0);
  const later = useLater();

  useEvery(() => {
    if (mended || pieces.current.length > 2) return;
    n.current++;
    pieces.current.push({ id: n.current, x: rand(0.1, 0.9), y: -0.05, v: rand(0.28, 0.4), r: rand(-180, 180) });
  }, mended ? null : 700);

  useFrame((dt) => {
    if (mended || !box.w) return;
    if (ptr.current.inside) catcher.current = Math.max(0.06, Math.min(0.94, ptr.current.x / box.w));
    let got = 0;
    pieces.current.forEach((p) => {
      p.y += p.v * dt;
      p.r += 120 * dt;
    });
    pieces.current = pieces.current.filter((p) => {
      if (p.y > 0.86 && p.y < 0.96 && Math.abs(p.x - catcher.current) * box.w < 60) {
        got++;
        return false;
      }
      return p.y < 1.05;
    });
    redraw((v) => v + 1);
    if (!got) return;
    sfx.pop();
    const c = caught + got;
    setCaught(c);
    if (c === 3) say('Piece by piece. Like a puzzle. A sad puzzle.', 'sad');
    if (c >= PIECES) {
      setMended(true);
      sfx.heart();
      say("It's whole again! You know what this means? I'm starting a PODCAST.", 'smug');
      later(() => win('Heart fixed. Podcast announced. Episode 1: "Why She Said No (In 4K)".'), 2000);
    }
  });

  return (
    <div className="lv c3-reject" ref={ref}>
      <div className="c3-no">NO.</div>
      <div className="c3-reject-cast">
        <Bella size={60} mood="annoyed" />
        <Bobby size={60} mood={mended ? 'smug' : 'sad'} tears={!mended}>
          {mended && <span className="c3-mended">❤️</span>}
        </Bobby>
      </div>
      {pieces.current.map((p) => (
        <span key={p.id} className="c3-shard" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, rotate: `${p.r}deg` }}>
          💔
        </span>
      ))}
      <div className="c3-catcher" style={{ left: `${catcher.current * 100}%` }}>
        🫶
      </div>
      <p className="c3-count">
        {Math.min(caught, PIECES)} / {PIECES} pieces · move to catch
      </p>
    </div>
  );
}

const chapter3 = { 11: PickupLines, 12: BecomeTall, 13: RomanticDance, 14: ChadArrives, 15: Rejected4K };
export default chapter3;
