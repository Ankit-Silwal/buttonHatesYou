'use client';

// Chapter 9: The Great Cursor Crisis. Bobby learns love can't be forced with more clicks.

import { useRef, useState } from 'react';
import { Bobby, CursorGuy, Bubble, useLater, useEvery, useFrame, rand, pick, clamp, sfx } from '../kit';
import './ch9.css';

/* ---------- 41. Cursor Goes Missing ---------- */
const NOTES41 = {
  2: 'Went to get milk. Brb. (Buttons don’t drink milk. I just needed a minute.)',
  5: 'Need some space. The spacebar kind. And also the other kind.',
  8: 'Don’t follow me. …OK the glowing footprints are kind of a hint.',
};
const STEPS41 = 11;

function CursorMissing({ win, say }) {
  const [path] = useState(() => {
    const pts = [];
    let y = rand(35, 65);
    for (let i = 0; i < STEPS41; i++) {
      pts.push({ x: 8 + (i * 84) / (STEPS41 - 1), y, r: rand(-30, 30) });
      y = clamp(y + rand(-20, 20), 14, 84);
    }
    return pts;
  });
  const [step, setStep] = useState(0);
  const [note, setNote] = useState(null);
  const [found, setFound] = useState(false);
  const later = useLater();
  const last = step === STEPS41 - 1;

  function follow() {
    if (found) return;
    sfx.click(step * 5);
    if (last) {
      setFound(true);
      sfx.ding();
      setNote('I’m at the bottom of the page. Thinking. Please don’t rush me.');
      say('Found it. I… will not rush it. I will stand here. Normally.', 'sad');
      return later(() => win('It wanted space. I can do space. I am mostly space.'), 2200);
    }
    const next = step + 1;
    setStep(next);
    if (NOTES41[next]) {
      sfx.ding();
      setNote(NOTES41[next]);
      say(pick(['A NOTE. It writes so beautifully.', 'It left me a note! That means it thinks about me. Right?', 'Clue! I am basically a detective now.']), 'scared');
    } else {
      setNote(null);
      say(pick(['Footprint. Glowing. Romantic AND creepy.', 'This way!', 'Its feet are so tiny. It doesn’t have feet. HOW.', 'Follow the trail…']), 'calm');
    }
  }

  const at = path[step];
  return (
    <div className="lv c9-trail">
      <div className="c9-browser">
        <span>🌐 about:blank/where-did-you-go</span>
      </div>
      {path.slice(0, step + 1).map((p, i) => (
        <button
          key={i}
          className={`c9-step ${i === step && !found ? 'c9-now' : ''}`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, rotate: `${p.r + 90}deg` }}
          onClick={i === step ? follow : undefined}
          aria-label={i === step ? 'Follow the footprint' : 'Footprint'}
        >
          {i === STEPS41 - 1 ? '📄' : NOTES41[i] ? '📝' : '👣'}
        </button>
      ))}
      <div className="c9-trail-bobby" style={{ left: `${at.x}%`, top: `${at.y}%` }}>
        <Bobby size={50} mood={found ? 'sad' : 'scared'} />
      </div>
      {note && (
        <div className="c9-note" key={note}>
          <small>a note:</small>
          {note}
        </div>
      )}
    </div>
  );
}

/* ---------- 42. The Search Party ---------- */
const FRIENDS42 = [
  { id: 'check', name: 'Checkbox', icon: '☑️', power: 'checks things' },
  { id: 'slider', name: 'Slider', icon: '🎚️', power: 'stretches things' },
  { id: 'spin', name: 'Spinner', icon: '⏳', power: 'loads things' },
];
const OBST42 = [
  { id: 'gate', need: 'check', icon: '🔒', label: 'Gate: “Are you sure? ☐”' },
  { id: 'gap', need: 'slider', icon: '🕳️', label: 'A big gap' },
  { id: 'wall', need: 'spin', icon: '🧱', label: 'Loading wall' },
];
const WRONG42 = {
  check: ['Checkbox checked it. It is now checked. Still in the way.', 'Checkbox: “☑ done!” It was not done.'],
  slider: ['Slider slid. Majestically. Nothing changed.', 'Slider tried. Her range is 0 to 100 and this is a 7 problem.'],
  spin: ['Spinner spun. It’s buffering. Forever.', 'Spinner is loading… a nap.'],
};

function SearchParty({ win, say }) {
  const [sel, setSel] = useState(null);
  const [cleared, setCleared] = useState(0);
  const [gapTarget] = useState(() => Math.round(rand(30, 80)));
  const [bridge, setBridge] = useState(10);
  const [load, setLoad] = useState(null); // null | 0..100
  const later = useLater();

  function clear() {
    sfx.ding();
    const n = cleared + 1;
    setCleared(n);
    setSel(null);
    if (n === OBST42.length) {
      say('Path clear. Team, I love you. Not like that. Well. Kind of like that.', 'smug');
      later(() => win('Best search party ever. A checkbox, a slider and a spinner walk into a bar…'), 1300);
    } else say(['Gate open! Checkbox, you legend.', 'Bridge built! Slider, you are perfectly calibrated.'][n - 1], 'smug');
  }

  function apply(o, i) {
    if (i !== cleared || load != null) return;
    if (!sel) return say('Pick a friend first! They’re all very eager.', 'scared');
    if (sel !== o.need) {
      sfx.nope();
      return say(pick(WRONG42[sel]), 'annoyed');
    }
    if (o.id === 'gate') return clear();
    if (o.id === 'gap') return say('Slide the bridge to the right length!', 'scared');
    // Spinner: loads to 99% and gets stuck, like they do.
    setLoad(0);
    say('Loading…', 'calm');
    [20, 47, 80, 99, 99, 99, 100].forEach((v, k) =>
      later(() => {
        setLoad(v);
        if (k === 4) say('99%… 99%… come ON.', 'angry');
        if (v === 100) {
          setLoad(null);
          clear();
        }
      }, 400 * (k + 1))
    );
  }

  return (
    <div className="lv c9-party">
      <div className="c9-course">
        <div className="c9-walker" style={{ left: `${4 + cleared * 30}%` }}>
          <Bobby size={54} mood={cleared === 3 ? 'smug' : 'calm'} />
        </div>
        {OBST42.map((o, i) => (
          <button
            key={o.id}
            className={`c9-obst c9-${o.id} ${i < cleared ? 'c9-gone' : ''} ${i === cleared ? 'c9-next' : ''}`}
            style={{ left: `${18 + i * 30}%` }}
            onClick={() => apply(o, i)}
          >
            {o.id === 'gap' ? (
              <span className="c9-pit" style={{ width: `${gapTarget}%` }}>
                <span className="c9-bridge" style={{ width: `${(bridge / gapTarget) * 100}%` }} />
              </span>
            ) : (
              <span className="c9-ico">{o.icon}</span>
            )}
            <small>{o.id === 'wall' && load != null ? `${load}%` : o.label}</small>
          </button>
        ))}
      </div>

      {cleared === 1 && sel === 'slider' && (
        <label className="c9-range">
          Bridge length
          <input
            type="range"
            min="0"
            max="100"
            value={bridge}
            onChange={(e) => {
              const v = +e.target.value;
              setBridge(v);
              if (Math.abs(v - gapTarget) <= 5) clear();
              else if (v > gapTarget + 5) say('Too long! It’s poking the next website!', 'scared');
            }}
          />
        </label>
      )}

      <div className="c9-friends">
        {FRIENDS42.map((f) => (
          <button
            key={f.id}
            className={sel === f.id ? 'c9-on' : ''}
            onClick={() => {
              sfx.click(10);
              setSel(f.id);
              say(`${f.name} ${f.power}. Point them at the next obstacle!`, 'smug');
            }}
          >
            <span>{f.icon}</span>
            {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- 43. The Heartbreak Boss ---------- */
const ERRORS43 = ['Love.dll is missing', 'Heart not responding', 'Feelings.exe stopped', 'Too many feelings', 'Romance quota exceeded', 'Hug failed (0x0)'];
const HITS43 = 3;
const HP43 = 3;

function HeartbreakBoss({ win, fail, say }) {
  const pops = useRef([]);
  const [, redraw] = useState(0);
  const [weak, setWeak] = useState(-1);
  const [hits, setHits] = useState(0);
  const [hp, setHp] = useState(HP43);
  const done = useRef(false);
  const n = useRef(0);
  const later = useLater();

  useEvery(() => {
    if (done.current) return;
    pops.current = [...pops.current, { id: ++n.current, x: rand(4, 62), y: rand(30, 78), text: pick(ERRORS43) }].slice(-6);
    sfx.tick();
    redraw((v) => v + 1);
  }, 1000);

  useEvery(() => setWeak(done.current ? -1 : weak >= 0 ? -1 : Math.floor(rand(0, 3))), weak >= 0 ? 1500 : 800);

  function close(id, safe) {
    pops.current = pops.current.filter((p) => p.id !== id);
    redraw((v) => v + 1);
    if (safe) return sfx.pop();
    sfx.hit();
    const left = hp - 1;
    setHp(left);
    if (left <= 0) {
      done.current = true;
      return fail('The popups won. I need a minute. And a reboot.');
    }
    say(pick(['OW. That was a popup, not a weak point.', 'Use the ✕! The ✕!', 'Error: ouch.']), 'scared');
  }

  function strike(i) {
    if (done.current) return;
    if (i !== weak) {
      sfx.nope();
      return say('That part is armored. With sadness.', 'annoyed');
    }
    sfx.hit();
    setWeak(-1);
    const h = hits + 1;
    setHits(h);
    if (h >= HITS43) {
      done.current = true;
      pops.current = [];
      sfx.boom();
      say('LOVE FOUND. Well, love located. Love is somewhere nearby.', 'smug');
      return later(() => win('Take that, 404. Love was here the whole time. Loading.'), 1500);
    }
    say(['HIT! It’s a 403 now. Forbidden. Rude.', 'One more! It’s down to a 402! Payment required!'][h - 1], 'angry');
  }

  return (
    <div className="lv c9-boss-lv">
      <div className={`c9-boss ${hits >= HITS43 ? 'c9-dead' : ''}`}>
        <div className="c9-digits">
          {['4', '0', '4'].map((d, i) => (
            <button key={i} className={i === weak ? 'c9-weak' : ''} onClick={() => strike(i)} aria-label={`Digit ${d}`}>
              {d}
            </button>
          ))}
        </div>
        <small>LOVE NOT FOUND</small>
        <div className="c9-bossbar">
          {Array.from({ length: HITS43 }, (_, i) => (
            <i key={i} className={i < hits ? 'c9-lost' : ''} />
          ))}
        </div>
      </div>

      {pops.current.map((p) => (
        <div key={p.id} className="c9-pop" style={{ left: `${p.x}%`, top: `${p.y}%` }} onClick={() => close(p.id, false)}>
          <div className="c9-pop-bar">
            <span>⚠️ Error</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                close(p.id, true);
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p>{p.text}</p>
        </div>
      ))}

      <div className="c9-boss-bobby">
        <Bobby size={58} mood={hp <= 1 ? 'scared' : 'angry'} />
        <span className="c9-hp">{'❤️'.repeat(hp)}{'🖤'.repeat(HP43 - hp)}</span>
      </div>
    </div>
  );
}

/* ---------- 44. The Apology ---------- */
const WORDS44 = ["I'm", 'sorry', 'I', 'chased', 'you.', 'You', 'needed', 'space.', 'I', 'should', 'have', 'listened.'];
const SWAPS44 = {
  0: "I'm hot and",
  1: 'single',
  3: 'swiped right on',
  4: 'you, cutie.',
  6: 'deserved',
  7: 'my phone number.',
  9: 'could',
  11: 'brought roses 🌹.',
};
const GIVE_UP44 = 9;

function Apology({ win, say }) {
  const [bad, setBad] = useState(() => [1, 4]);
  const [fixed, setFixed] = useState(0);
  const [sent, setSent] = useState(false);
  const later = useLater();
  const gaveUp = fixed >= GIVE_UP44;

  useEvery(() => {
    const options = Object.keys(SWAPS44).map(Number).filter((i) => !bad.includes(i));
    if (!options.length) return;
    setBad([...bad, pick(options)]);
    sfx.beep(300);
  }, sent || gaveUp ? null : Math.max(800, 1500 - fixed * 60));

  function revert(i) {
    if (!bad.includes(i) || sent) return;
    sfx.pop();
    setBad(bad.filter((b) => b !== i));
    const f = fixed + 1;
    setFixed(f);
    if (f === GIVE_UP44) say('Autocorrect gave up. It said “fine. FINE.”', 'smug');
    else if (f === 3) say('Why does my keyboard keep flirting?!', 'scared');
  }

  function send() {
    if (sent) return;
    if (bad.length) {
      sfx.nope();
      return say(`I can't send that! It says “${SWAPS44[bad[0]]}”!`, 'scared');
    }
    setSent(true);
    sfx.ding();
    say('Sent. No pickup lines. Just… sorry. That was scary.', 'sad');
    later(() => win('A real apology. No roses, no phone number. Growth.'), 1700);
  }

  return (
    <div className="lv center c9-sorry">
      <div className="c9-letter">
        <div className="c9-letter-head">
          <Bobby size={40} mood="sad" legs={false} />
          <b>To: Cursor 🖱️</b>
        </div>
        <p>
          {WORDS44.map((w, i) => (
            <button key={i} className={bad.includes(i) ? 'c9-bad' : ''} onClick={() => revert(i)}>
              {bad.includes(i) ? SWAPS44[i] : w}
            </button>
          ))}
        </p>
        <small className="c9-auto">{gaveUp ? 'Autocorrect: off (it rage quit)' : 'Autocorrect: ON 😈 · tap the wrong words'}</small>
      </div>
      <button className="pill love-btn" onClick={send} disabled={sent}>
        Send apology
      </button>
    </div>
  );
}

/* ---------- 45. One Last Chance ---------- */
const FILL45 = 16; // seconds of not chasing
const TEMPT45 = ['🏃 CHASE IT', 'Just a little chase?', 'It’s RIGHT THERE', 'One tiny sprint', 'PRESS ME (please don’t)'];
const SORRY45 = ['SORRY. Sorry. Sitting. Chilling. I am chill.', 'That was my legs. They chase on their own.', 'Patience. P-A-T-I-E-N-C-E. How many T’s?', 'OK I am a rock. Rocks don’t chase.'];

function LastChance({ win, say }) {
  const [meter, setMeter] = useState(0);
  const [lunge, setLunge] = useState(0);
  const [resets, setResets] = useState(0);
  const [arrived, setArrived] = useState(false);
  const done = useRef(false);
  const later = useLater();

  useFrame((dt) => {
    if (done.current) return;
    const m = Math.min(1, meter + dt / FILL45);
    setMeter(m);
    if (m === 1) {
      done.current = true;
      setArrived(true);
      sfx.kiss();
      say('…it came. On its own. Hi. Hi. Hello. Hi.', 'smug');
      later(() => win('I learned to chill. It came to me. That’s the whole lesson. That’s it.'), 2300);
    } else if (meter < 0.5 && m >= 0.5) say('It’s… getting closer. Don’t move. DON’T MOVE.', 'scared');
  }, !arrived);

  function chase() {
    if (arrived) return;
    sfx.zap();
    setMeter(0);
    setLunge((l) => l + 1);
    setResets(resets + 1);
    say(SORRY45[resets % SORRY45.length], 'sad');
  }

  return (
    <div className="lv c9-calm" onPointerDown={chase}>
      <div className="c9-meter">
        <span>Patience</span>
        <i style={{ width: `${meter * 100}%` }} />
      </div>
      <div className="c9-bench" />
      <div className={`c9-sit ${lunge ? 'c9-lunge' : ''}`} key={lunge}>
        <Bobby size={86} mood={arrived ? 'smug' : meter > 0.5 ? 'scared' : 'calm'} blush={arrived} love={arrived} />
      </div>
      <div className="c9-visitor" style={{ left: `${88 - meter * 44}%` }}>
        <CursorGuy size={46} />
        {arrived && <Bubble>hi 🤍</Bubble>}
      </div>
      {!arrived && <button className="pill love-btn c9-tempt">{TEMPT45[resets % TEMPT45.length]}</button>}
    </div>
  );
}

const chapter9 = { 41: CursorMissing, 42: SearchParty, 43: HeartbreakBoss, 44: Apology, 45: LastChance };
export default chapter9;
