'use client';

// Chapter 5: Love Across the Internet. Bobby dates the rest of the web.

import { useRef, useState } from 'react';
import { Bobby, Bubble, useFrame, useLater, useEvery, rand, pick, shuffle, clamp, sfx } from '../kit';
import './ch5.css';

/* ---------- the dates ---------- */
export function CheckboxGirl({ size = 80, checked = false, mood = 'calm' }) {
  return (
    <span className={`c5-checkgirl ${checked ? 'checked' : ''}`} data-mood={mood} style={{ '--s': `${size}px` }}>
      <span className="c5-tick">✓</span>
      <span className="c5-eyes">
        <i />
        <i />
      </span>
      <span className="c5-bow">🎀</span>
    </span>
  );
}

export function SpinnerGirl({ size = 90, spinning = true }) {
  return (
    <span className={`c5-spinnergirl ${spinning ? 'spin' : ''}`} style={{ '--s': `${size}px` }}>
      <span className="c5-ring" />
      <span className="c5-eyes">
        <i />
        <i />
      </span>
      <span className="c5-bow">🎀</span>
    </span>
  );
}

/* ---------- 21. Dating a Checkbox ---------- */
const DATE_IDEAS = ['🧺 Picnic', '🎬 Movie night', '🍝 Spaghetti dinner', '🎳 Bowling', '🌅 Sunset walk', '🍍 Pineapple pizza', '🧾 Doing taxes', '🎢 Rollercoaster'];
const HER_DOUBTS = ['Hmm. Actually no.', 'Wait, let me think.', 'Unchecking. Just in case.', 'Maybe? No. Maybe.', 'I changed my mind. Twice.'];

function DatingCheckbox({ win, say }) {
  const [wants] = useState(() => shuffle(DATE_IDEAS).slice(0, 3));
  const [checked, setChecked] = useState([]);
  const [doubt, setDoubt] = useState('');
  const [done, setDone] = useState(false);
  const later = useLater();

  // She unchecks something every so often. She can't help it.
  useEvery(() => {
    if (!checked.length) return;
    const gone = pick(checked);
    setChecked(checked.filter((c) => c !== gone));
    setDoubt(pick(HER_DOUBTS));
    sfx.tick();
  }, done ? null : 1700);

  function toggle(idea) {
    if (done) return;
    sfx.click(DATE_IDEAS.indexOf(idea) * 6);
    const next = checked.includes(idea) ? checked.filter((c) => c !== idea) : [...checked, idea];
    setChecked(next);
    if (!wants.includes(idea) && !checked.includes(idea)) say(pick(['She did NOT ask for that.', "That's not on her list, bro.", 'Taxes?? On a first date??']), 'scared');
    if (next.length === wants.length && wants.every((w) => next.includes(w))) {
      setDone(true);
      setDoubt('…yes. YES. Final answer. Probably.');
      sfx.ding();
      say('She committed! To a date! With ME!', 'smug');
      later(() => win('She said yes. She has since unchecked it twice. Still counts.'), 1400);
    }
  }

  return (
    <div className="lv center c5-checkbox">
      <div className="c5-her">
        <CheckboxGirl checked={done} />
        <Bubble>{doubt || "Plan our date! I'll decide. Eventually."}</Bubble>
      </div>
      <p className="c5-wants">
        She wants: <b>{wants.join(' · ')}</b>
      </p>
      <ul className="c5-options">
        {DATE_IDEAS.map((idea) => (
          <li key={idea}>
            <button className={checked.includes(idea) ? 'on' : ''} onClick={() => toggle(idea)}>
              <span className="c5-box">{checked.includes(idea) ? '✓' : ''}</span>
              {idea}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- 22. Dating a Slider ---------- */
const STANDARDS = [
  { label: 'Height', unit: 'px' },
  { label: 'Sense of humor', unit: '%' },
  { label: 'Wi-Fi strength', unit: ' bars' },
];
const BAND = 26;

function DatingSlider({ win, say }) {
  const [values, setValues] = useState([15, 50, 85]);
  const bands = useRef(STANDARDS.map(() => ({ at: rand(10, 64), v: pick([-1, 1]) * rand(5, 9) })));
  const approval = useRef(0);
  const [, redraw] = useState(0);
  const done = useRef(false);
  const lastHappy = useRef(null);
  const later = useLater();

  useFrame((dt) => {
    if (done.current) return;
    bands.current.forEach((b) => {
      b.at += b.v * dt;
      if (b.at < 0 || b.at > 100 - BAND) b.v *= -1;
      if (Math.random() < dt * 0.4) b.v *= -1; // she changes her mind
      b.at = clamp(b.at, 0, 100 - BAND);
    });
    const happy = values.every((v, i) => v >= bands.current[i].at && v <= bands.current[i].at + BAND);
    approval.current = clamp(approval.current + (happy ? dt * 24 : -dt * 9), 0, 100);
    if (happy !== lastHappy.current) {
      lastHappy.current = happy;
      say(happy ? pick(['She likes it! Hold it there!', 'Yes! Within standards!']) : pick(['She moved the standards again!', 'Out of range! OUT OF RANGE!']), happy ? 'smug' : 'scared');
    }
    if (approval.current >= 100) {
      done.current = true;
      sfx.win();
      later(() => win("I'm within her standards. For now. They're sliding as we speak."), 600);
    }
    redraw((n) => n + 1);
  });

  return (
    <div className="lv center c5-slider">
      <div className="c5-approval">
        <span>Her approval</span>
        <div className="c5-meter">
          <i style={{ width: `${approval.current}%` }} />
        </div>
      </div>
      {STANDARDS.map((s, i) => {
        const b = bands.current[i];
        const ok = values[i] >= b.at && values[i] <= b.at + BAND;
        return (
          <label key={s.label} className={`c5-standard ${ok ? 'ok' : ''}`}>
            <span className="c5-label">
              {s.label} <b>{values[i]}{s.unit}</b>
            </span>
            <span className="c5-track">
              <i className="c5-band" style={{ left: `${b.at}%`, width: `${BAND}%` }} />
              <input
                type="range"
                min="0"
                max="100"
                value={values[i]}
                onChange={(e) => setValues((v) => v.map((x, k) => (k === i ? +e.target.value : x)))}
              />
            </span>
          </label>
        );
      })}
      <Bobby size={70} mood={lastHappy.current ? 'smug' : 'scared'} sweat={!lastHappy.current} />
    </div>
  );
}

/* ---------- 23. Dating a Loading Spinner ---------- */
const ON_TIME = 22; // degrees either side of 12 o'clock

function DatingSpinner({ win, say }) {
  const clocks = useRef([0, 1, 2].map(() => ({ a: rand(0, 360), v: rand(170, 230), stopped: false, miss: 0 })));
  const [, redraw] = useState(0);
  const [arrived, setArrived] = useState(false);
  const later = useLater();

  useFrame((dt) => {
    clocks.current.forEach((c) => {
      if (!c.stopped) c.a = (c.a + c.v * dt) % 360;
      if (c.miss > 0) c.miss -= dt;
    });
    redraw((n) => n + 1);
  }, !arrived);

  function stop(i) {
    const c = clocks.current[i];
    if (c.stopped || arrived) return;
    const off = Math.min(c.a, 360 - c.a);
    if (off > ON_TIME) {
      sfx.nope();
      c.miss = 0.4;
      c.v += 35;
      return say(pick(['Too late! She is buffering harder now.', "That's 4:37. She said noon-ish.", 'Missed! The clock is laughing at us.']), 'scared');
    }
    c.stopped = true;
    c.a = 0;
    sfx.ding();
    const left = clocks.current.filter((x) => !x.stopped).length;
    if (left) return say(left === 2 ? 'One clock down! She is 66% late now.' : 'Last one! She is almost loaded!', 'smug');
    setArrived(true);
    say('SHE IS HERE. 100% LOADED.', 'smug');
    later(() => win('"Sorry I’m late, I was buffering." She is perfect. She is also leaving. To buffer.'), 1500);
  }

  return (
    <div className="lv center c5-spinner-lv">
      <div className="c5-her">
        <SpinnerGirl spinning={!arrived} />
        <Bubble>{arrived ? 'Hi! Sorry, I was buffering.' : 'On my way!! (since Tuesday)'}</Bubble>
      </div>
      <div className="c5-clocks">
        {clocks.current.map((c, i) => (
          <button key={i} className={`c5-clock ${c.stopped ? 'stopped' : ''} ${c.miss > 0 ? 'miss' : ''}`} onClick={() => stop(i)} aria-label={`Clock ${i + 1}`}>
            <i className="c5-noon" />
            <i className="c5-hand" style={{ rotate: `${c.a}deg` }} />
          </button>
        ))}
      </div>
      <p className="hint">Stop each clock when the hand points straight up</p>
    </div>
  );
}

/* ---------- 24. Dating a Popup ---------- */
const ADS = [
  ['🎁 YOU WON!', 'Claim your free iPad (it is a picture of an iPad)'],
  ['🔥 HOT SINGLES', 'There are 0 buttons in your area'],
  ['🍪 Cookies', 'We use cookies. And crumbs. Mostly crumbs.'],
  ['⚠️ Virus found', 'Your computer has 39 viruses and 1 crush'],
  ['📰 Newsletter', 'Subscribe for daily button facts'],
  ['💸 Loan approved', 'You owe us. Emotionally.'],
  ['🔔 Notifications', 'Allow us to bother you forever?'],
  ['🎰 Spin to win', 'Every spin wins! (a sad noise)'],
];
const MAX_ADS = 16;

function DatingPopup({ win, say }) {
  const n = useRef(0);
  const newAd = () => {
    n.current++;
    const [title, body] = ADS[n.current % ADS.length];
    return { id: n.current, title, body, x: rand(28, 72), y: rand(26, 70) };
  };
  const [ads, setAds] = useState(() => Array.from({ length: 8 }, newAd));
  const [found, setFound] = useState(false);
  const later = useLater();

  useEvery(() => {
    if (ads.length < MAX_ADS) setAds([...ads, newAd()]);
  }, found || !ads.length ? null : 4200);

  function close(id) {
    sfx.pop();
    const next = ads.filter((a) => a.id !== id);
    setAds(next);
    if (!next.length) say('There she is. Under all that. Classic popup.', 'smug');
    else if (next.length === 3) say('Almost! I can see her title bar!', 'smug');
  }

  function trap() {
    sfx.bad();
    setAds([...ads, newAd(), newAd()].slice(0, MAX_ADS));
    say(pick(["That's not the close button. That's a DOWNLOAD button.", 'Two more popped up. They have friends.', 'Never click the big CLOSE. Never.']), 'scared');
  }

  return (
    <div className="lv c5-popups">
      <div className={`c5-window her ${found ? 'found' : ''}`} style={{ left: '50%', top: '48%' }}>
        <div className="c5-bar">
          <span>💌 hi :)</span>
        </div>
        <div className="c5-body">
          <p>{found ? 'you found me. nobody ever finds me.' : 'it’s me. the real one.'}</p>
          <button
            className="pill love-btn"
            onClick={() => {
              if (found) return;
              setFound(true);
              sfx.kiss();
              say('Hi. I am Bobby. Please do not close.', 'smug');
              later(() => win('We talked for 3 seconds. Then she minimized me. It was beautiful.'), 1500);
            }}
          >
            Say hi
          </button>
        </div>
      </div>
      {ads.map((a, i) => (
        <div key={a.id} className="c5-window ad" style={{ left: `${a.x}%`, top: `${a.y}%`, zIndex: 10 + i }}>
          <div className="c5-bar">
            <span>{a.title}</span>
            <button className="c5-x" onClick={() => close(a.id)} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="c5-body">
            <p>{a.body}</p>
            <button className="c5-fake" onClick={trap}>
              CLOSE ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- 25. Speed Dating Championship ---------- */
const DATES = [
  { who: 'checkbox', name: 'Checkbox', ask: 'Quick! Pizza or pasta?', right: 'Can I get back to you?', wrong: ['Pizza', 'Pasta'] },
  { who: '🎚️', name: 'Slider', ask: 'Rate me from 1 to 10.', right: 'Whatever value you want', wrong: ['7', 'A solid 10'] },
  { who: 'spinner', name: 'Spinner', ask: 'Sorry I’m late!', right: 'I just got here too', wrong: ['You are 4 hours late', 'Are you buffering?'] },
  { who: '🪟', name: 'Popup', ask: 'Would you like to subscribe to my newsletter?', right: 'Remind me later', wrong: ['Yes', 'No'] },
  { who: '🤖', name: 'CAPTCHA', ask: 'Prove you love me.', right: 'I select all squares with you', wrong: ["I'm not a robot", 'beep boop'] },
];
const PER_DATE = 12;
const TOTAL = 60;

function SpeedDating({ win, fail, say }) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(TOTAL);
  const [dateLeft, setDateLeft] = useState(PER_DATE);
  const [answers] = useState(() => DATES.map((d) => shuffle([d.right, ...d.wrong])));
  const [ended, setEnded] = useState(false);
  const later = useLater();
  const date = DATES[i];

  function next(ok) {
    const s = score + (ok ? 1 : 0);
    setScore(s);
    if (i + 1 >= DATES.length) return finish(s);
    setI(i + 1);
    setDateLeft(PER_DATE);
  }

  function finish(s) {
    setEnded(true);
    if (s >= 3) {
      sfx.win();
      say(`${s} out of 5 went well. And yet... I don't like any of them.`, 'sad');
      later(() => win('I won the championship. I feel nothing. Something is wrong with me.'), 1600);
    } else {
      say(`${s} out of 5. The Popup blocked me.`, 'sad');
      later(() => fail(`${s} for 5. A new personal record. Downwards.`), 1200);
    }
  }

  useEvery(() => {
    if (left <= 1) return finish(score);
    setLeft(left - 1);
    if (dateLeft <= 1) {
      sfx.nope();
      say('Time! *ding* Next table!', 'scared');
      return next(false);
    }
    setDateLeft(dateLeft - 1);
  }, ended ? null : 1000);

  function answer(a) {
    if (ended) return;
    const ok = a === date.right;
    ok ? sfx.ding() : sfx.nope();
    say(ok ? pick(['Nailed it. She smiled. I think.', 'Smooth. So smooth.', 'Rizz level: medium.']) : pick(['She left. Mid-sentence.', 'She threw a drink at me. A tiny one.', 'She swiped left in real life.']), ok ? 'smug' : 'sad');
    next(ok);
  }

  return (
    <div className="lv center c5-speed">
      <div className="c5-clockbar">
        <span>⏱ {left}s</span>
        <span>
          Date {Math.min(i + 1, DATES.length)} / {DATES.length}
        </span>
        <span>💘 {score}</span>
      </div>
      {!ended && (
        <>
          <div className="c5-table">
            <Bobby size={80} mood="smug" legs={false} />
            <span className="c5-candle">🕯️</span>
            <span className="c5-date">
              {date.who === 'checkbox' ? <CheckboxGirl size={70} /> : date.who === 'spinner' ? <SpinnerGirl size={74} /> : <span className="c5-emoji">{date.who}</span>}
              <Bubble>{date.ask}</Bubble>
              <small>{date.name}</small>
            </span>
          </div>
          <div className="c5-timer">
            <i style={{ width: `${(dateLeft / PER_DATE) * 100}%` }} />
          </div>
          <div className="c5-answers">
            {answers[i].map((a) => (
              <button key={a} className="chip-btn" onClick={() => answer(a)}>
                {a}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const chapter5 = { 21: DatingCheckbox, 22: DatingSlider, 23: DatingSpinner, 24: DatingPopup, 25: SpeedDating };
export default chapter5;
