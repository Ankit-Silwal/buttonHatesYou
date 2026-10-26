'use client';

// Chapter 10: The Final Love Story.

import { useRef, useState } from 'react';
import { Bobby, Toon, CursorGuy, Bubble, useBox, useLater, useEvery, useFrame, rand, pick, clamp, sfx } from '../kit';
import './ch10.css';

/* ---------- 46. The Second First Date ---------- */
// A heart, in percentages of the sky.
const HEART46 = [
  [50, 34], [40, 20], [26, 22], [19, 38], [28, 56], [50, 78], [72, 56], [81, 38], [74, 22], [60, 20],
];
const SKY46 = Array.from({ length: 16 }, () => [rand(4, 96), rand(4, 92), rand(0.4, 1)]);
const STAR_LINES46 = ['A star. For you. It’s technically a pixel.', 'Another one!', 'This is nice. Is this nice? It’s nice.', 'No chasing. Just stars.', 'I’m not nervous. My hands are just glowing.'];

function SecondDate({ win, say }) {
  const [got, setGot] = useState(0);
  const later = useLater();
  const done = got >= HEART46.length;

  function take(i) {
    if (done) return;
    if (i !== got) return say('That one’s shy. Try the twinkly one.', 'calm');
    sfx.beep(520 + i * 60);
    const n = got + 1;
    setGot(n);
    if (n === HEART46.length) {
      sfx.win();
      say('…it’s a heart. I didn’t plan that. (I planned that.)', 'smug');
      later(() => win('Best date ever. Nobody chased anybody. We just looked up.'), 2200);
    } else if (n % 2 === 0) say(pick(STAR_LINES46), 'smug');
  }

  const pts = HEART46.slice(0, got).map(([x, y]) => `${x},${y}`);
  if (done) pts.push(`${HEART46[0][0]},${HEART46[0][1]}`);
  return (
    <div className="lv c10-night">
      {SKY46.map(([x, y, s], i) => (
        <i key={i} className="c10-tiny" style={{ left: `${x}%`, top: `${y}%`, scale: s }} />
      ))}
      <svg className={`c10-lines ${done ? 'c10-full' : ''}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={pts.join(' ')} />
      </svg>
      {HEART46.map(([x, y], i) => (
        <button
          key={i}
          className={`c10-star ${i < got ? 'c10-got' : ''} ${i === got ? 'c10-next' : ''}`}
          style={{ left: `${x}%`, top: `${y}%` }}
          onClick={() => take(i)}
          aria-label={`Star ${i + 1}`}
        >
          ★
        </button>
      ))}
      <div className="c10-blanket">
        <Bobby size={56} mood="smug" love={done} blush />
        <CursorGuy size={34} />
      </div>
    </div>
  );
}

/* ---------- 47. The Antivirus Arrives ---------- */
const WALLS47 = [
  { x: 0.3, speed: 1.3, phase: 0 },
  { x: 0.5, speed: 1.9, phase: 2 },
  { x: 0.7, speed: 1.5, phase: 4 },
];
const CAUGHT47 = ['QUARANTINED. Back to the start, sweetie.', 'The firewall said no. Rude.', 'Scan complete: 1 threat (love). Try again!', 'Try going through the gap!'];

function Antivirus({ win, say }) {
  const [ref, box] = useBox();
  const tok = useRef(null); // { x, y } in px; null = at start
  const grab = useRef(false);
  const t = useRef(0);
  const done = useRef(false);
  const [, redraw] = useState(0);
  const later = useLater();
  const caught = useRef(0);

  const start = { x: box.w * 0.1, y: box.h * 0.6 };
  const goal = { x: box.w * 0.9, y: box.h * 0.6 };
  const gapH = Math.max(90, box.h * 0.3);
  const gapAt = (w, time) => box.h * 0.6 + Math.sin(time * w.speed + w.phase) * (box.h * 0.6 - gapH / 2 - 30);

  useFrame((dt) => {
    if (!box.w || done.current) return;
    t.current += dt;
    const p = tok.current ?? start;
    for (const w of WALLS47) {
      const wx = w.x * box.w;
      const gy = gapAt(w, t.current);
      if (Math.abs(p.x - wx) < 22 && Math.abs(p.y - gy) > gapH / 2 - 10) {
        tok.current = null;
        grab.current = false;
        sfx.zap();
        say(CAUGHT47[caught.current++ % CAUGHT47.length], 'scared');
        break;
      }
    }
    if (Math.hypot(p.x - goal.x, p.y - goal.y) < 50) {
      done.current = true;
      grab.current = false;
      sfx.kiss();
      say('YOU MADE IT. Through three firewalls. For me. I’m going to cry.', 'smug');
      later(() => win('Antivirus defeated by love. And by going through the gaps.'), 1600);
    }
    redraw((n) => n + 1);
  });

  function move(e) {
    if (!grab.current || done.current) return;
    const r = ref.current.getBoundingClientRect();
    tok.current = { x: clamp(e.clientX - r.left, 0, box.w), y: clamp(e.clientY - r.top, 0, box.h) };
  }

  const p = tok.current ?? start;
  return (
    <div
      ref={ref}
      className="lv c10-av"
      onPointerMove={move}
      onPointerUp={() => (grab.current = false)}
      onPointerCancel={() => (grab.current = false)}
    >
      <div className="c10-av-bar">🛡️ LoveGuard Antivirus · UNAUTHORIZED LOVE BETWEEN UI ELEMENTS DETECTED</div>
      {box.w > 0 &&
        WALLS47.map((w, i) => {
          const gy = gapAt(w, t.current);
          return (
            <div key={i} className="c10-wall" style={{ left: w.x * box.w }}>
              <span style={{ height: Math.max(0, gy - gapH / 2) }} />
              <span style={{ top: gy + gapH / 2 }} />
            </div>
          );
        })}
      <div className="c10-goal" style={{ left: goal.x, top: goal.y }}>
        <Bobby size={64} mood={done.current ? 'smug' : 'sad'} love={done.current} tears={!done.current} />
      </div>
      <div
        className={`c10-token ${grab.current ? 'c10-held' : ''}`}
        style={{ left: p.x, top: p.y }}
        onPointerDown={(e) => {
          e.currentTarget.parentElement.setPointerCapture(e.pointerId);
          grab.current = true;
        }}
      >
        <CursorGuy size={30} />
        {!tok.current && <Bubble>drag me!</Bubble>}
      </div>
    </div>
  );
}

/* ---------- 48. The Love.exe Boss Fight ---------- */
const BOSS_HP48 = 9;
const HEARTS48 = 5;
const SPOTS48 = ['eyeL', 'eyeR', 'core'];
const PHASE_LINES48 = {
  6: 'It’s mad! It turned red! I didn’t know robots could blush!',
  3: 'Last phase! Its weak points are panicking!',
};

function LoveExe({ win, fail, say }) {
  const [ref, box] = useBox();
  const shots = useRef([]);
  const bob = useRef(0);
  const target = useRef(null);
  const [, redraw] = useState(0);
  const [hp, setHp] = useState(BOSS_HP48);
  const [hearts, setHearts] = useState(HEARTS48);
  const [weak, setWeak] = useState(null);
  const [ouch, setOuch] = useState(0);
  const over = useRef(false);
  const n = useRef(0);
  const later = useLater();
  const phase = hp > 6 ? 0 : hp > 3 ? 1 : 2;

  useEvery(() => {
    if (over.current || !box.w) return;
    const x = box.w / 2 + rand(-40, 40);
    const aim = rand(box.w * 0.08, box.w * 0.92);
    shots.current.push({ id: ++n.current, x, y: 150, vx: (aim - x) / 2.2, vy: rand(150, 190) + phase * 40, kind: pick(['🐛', '💔', '⚠️']) });
  }, [950, 720, 540][phase]);

  useEvery(() => {
    if (over.current) return;
    setWeak(weak ? null : pick(SPOTS48.filter((s) => s !== weak)));
  }, weak ? 1900 : 800);

  useFrame((dt) => {
    if (!box.w || over.current) return;
    if (target.current != null) bob.current += (target.current - bob.current) * Math.min(1, dt * 12);
    else if (!bob.current) bob.current = box.w / 2;
    const by = box.h - 60;
    let hurt = 0;
    shots.current = shots.current.filter((s) => {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (Math.abs(s.x - bob.current) < 56 && s.y > by - 40 && s.y < by + 10) {
        sfx.thud();
        return false;
      }
      if (s.y > box.h - 6) {
        hurt++;
        return false;
      }
      return true;
    });
    if (hurt) {
      sfx.hit();
      const left = hearts - hurt;
      setHearts(left);
      setOuch((o) => o + 1);
      if (left <= 0) {
        over.current = true;
        return fail('We lost. But we lost TOGETHER. Rematch?');
      }
      say(pick(['It got through! Block with me!', 'Ow! Move me under them!', 'I’m your shield! Use me!']), 'scared');
    }
    redraw((v) => v + 1);
  });

  function aim(e) {
    const r = ref.current.getBoundingClientRect();
    target.current = clamp(e.clientX - r.left, 40, r.width - 40);
  }

  function strike(spot) {
    if (over.current) return;
    if (spot !== weak) {
      sfx.nope();
      return say('Armored! Hit the glowing bit!', 'annoyed');
    }
    sfx.hit();
    setWeak(null);
    const left = hp - 1;
    setHp(left);
    if (left <= 0) {
      over.current = true;
      shots.current = [];
      sfx.boom();
      say('LOVE.EXE HAS STOPPED WORKING. Love.exe was never meant to be an app!', 'smug');
      return later(() => win('We beat a giant robot. Me as a shield. You as the brain. Team.'), 1900);
    }
    say(PHASE_LINES48[left] ?? pick(['HIT! Bonk it again!', 'Its antivirus is crying!', 'Yes! Critical hit to the feelings!']), 'angry');
  }

  return (
    <div ref={ref} className={`lv c10-arena c10-phase${phase}`} onPointerMove={aim} onPointerDown={aim}>
      <div className={`c10-robot ${hp <= 0 ? 'c10-boom' : ''}`} key={hp > 0 ? 'r' : 'dead'}>
        <div className="c10-hpbar">
          <span>LOVE.EXE</span>
          <i style={{ width: `${(hp / BOSS_HP48) * 100}%` }} />
        </div>
        <div className="c10-head">
          <button className={`c10-spot c10-eyeL ${weak === 'eyeL' ? 'c10-open' : ''}`} onClick={() => strike('eyeL')} aria-label="Left eye" />
          <button className={`c10-spot c10-eyeR ${weak === 'eyeR' ? 'c10-open' : ''}`} onClick={() => strike('eyeR')} aria-label="Right eye" />
          <span className="c10-mouth">🛡️ SCANNING</span>
        </div>
        <div className="c10-body">
          <button className={`c10-spot c10-core ${weak === 'core' ? 'c10-open' : ''}`} onClick={() => strike('core')} aria-label="Core">
            ❤
          </button>
        </div>
      </div>

      {shots.current.map((s) => (
        <span key={s.id} className="c10-shot" style={{ left: s.x, top: s.y }}>
          {s.kind}
        </span>
      ))}

      <div className="c10-shieldbob" style={{ left: bob.current || '50%' }}>
        <span className="c10-plate" />
        <Bobby size={58} mood="angry" />
      </div>
      <div className="c10-team" key={ouch}>
        <CursorGuy size={20} /> {'❤️'.repeat(Math.max(0, hearts))}
        {'🖤'.repeat(HEARTS48 - Math.max(0, hearts))}
      </div>
    </div>
  );
}

/* ---------- 49. Will You Click Me Forever? ---------- */
const ENDINGS49 = {
  friend: {
    label: '💛 Best friends',
    props: '🍕🎮🛋️',
    lines: ['Friends. Best friends. BEST best friends.', 'We’re getting matching bracelets. Mine is a rubber band. Yours is a rubber band.', 'Honestly? This might be the best ending.'],
    end: "Achievement unlocked: It's Complicated. (It isn't. You're my best friend.)",
  },
  partner: {
    label: '💘 Partners',
    props: '💐💍🎉',
    lines: ['PARTNER?? Like PARTNER partner??', '*Bobby faints* … *Bobby wakes up* … *Bobby faints again*', 'OK. I’m calm. I’m telling EVERY button on the internet.'],
    end: '404 days single. 0 days single. Best math I ever did.',
  },
  wingman: {
    label: '🫡 Trusted wingman',
    props: '🕶️🤝🏆',
    lines: ['Wingman. Of course. Like the old days.', 'But now I’M your wingman too. Want me to find YOU someone? I have a fridge’s number.', 'Team Wingmen. Forever. Bro.'],
    end: 'Best wingman a button ever had. Bro.',
  },
};

// The lines show under the pair, so this level doesn't use say().
function ClickForever({ win }) {
  const [choice, setChoice] = useState(null);
  const [line, setLine] = useState(0);
  const later = useLater();
  const e = choice && ENDINGS49[choice];

  function next() {
    if (line + 1 < e.lines.length) {
      sfx.pop();
      setLine(line + 1);
    } else {
      sfx.win();
      later(() => win(e.end), 400);
    }
  }

  return (
    <div className="lv center c10-forever">
      <div className="c10-pair">
        <Bobby size={110} mood={e ? 'smug' : 'scared'} love={choice === 'partner'} blush sweat={!e} />
        <CursorGuy size={60} />
        {e && <span className="c10-props">{e.props}</span>}
      </div>
      {!e ? (
        <>
          <p className="c10-ask">Bobby: Whatever you pick… I’m just happy you’re here. So. What are we?</p>
          <div className="c10-choices">
            {Object.entries(ENDINGS49).map(([k, v]) => (
              <button
                key={k}
                className="pill love-btn"
                onClick={() => {
                  sfx.heart();
                  setChoice(k);
                  setLine(0);
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="c10-ask" key={line}>
            {e.lines[line]}
          </p>
          <button className="pill love-btn" onClick={next}>
            {line + 1 < e.lines.length ? 'Next →' : 'Happy ending 💘'}
          </button>
        </>
      )}
    </div>
  );
}

/* ---------- 50. Happily Ever After.exe ---------- */
const LESSONS50 = [
  { title: 'Lesson 1: First impressions', options: ['Click confidently', 'Never refresh the app 900 times', 'Do NOT swipe right on Delete Account'] },
  { title: 'Lesson 2: Dating apps', options: ['Your bio is not a CAPTCHA', '37 messages is too many. 36 is fine.', 'A fridge can be a friend'] },
  { title: 'Lesson 3: Love', options: ["Don't chase. Let it come to you.", 'Your soulmate might be a pointer', 'Be the button you want to press'] },
];
const STUDENT50 = ['*takes notes*', 'wow…', '*writes it on hand*', 'my dad says that too', '*underlines it 3 times*'];

function HappilyEverAfter({ win, say }) {
  const [step, setStep] = useState('years'); // years | lesson | ask | twist | end
  const [lesson, setLesson] = useState(0);
  const [student, setStudent] = useState('');
  const later = useLater();

  useEvery(() => step === 'years' && setStep('lesson'), step === 'years' ? 2200 : null);

  function teach(o) {
    sfx.click(lesson * 20);
    say(`Write this down, kid: “${o}”`, 'smug');
    setStudent(pick(STUDENT50));
    if (lesson + 1 < LESSONS50.length) return setLesson(lesson + 1);
    setStep('ask');
    later(() => {
      setStudent('Coach… Dad… can you find me a girlfriend?');
      sfx.aww();
    }, 900);
    later(() => {
      setStep('twist');
      say('BRO. PLEASE. FIND MY SON A GIRLFRIEND.', 'sad');
      sfx.sob();
    }, 3000);
    later(() => setStep('end'), 5600);
  }

  if (step === 'years') {
    return (
      <div className="lv center c10-years">
        <p>Years later…</p>
      </div>
    );
  }

  if (step === 'end') {
    return (
      <div className="lv center c10-credits">
        <small>coming soon to a website near you</small>
        <h2>BUTTON GIRLFRIEND SIMULATOR 2</h2>
        <b>— COMING NEVER —</b>
        <button className="pill love-btn" onClick={() => win('Thanks for being my wingman. And my cursor. And my bro.')}>
          The End 💘
        </button>
      </div>
    );
  }

  return (
    <div className={`lv c10-academy ${step === 'twist' ? 'c10-zoom' : ''}`}>
      <div className="c10-banner">⭐ Bobby&apos;s Love Academy · 10,000,000 followers ⭐</div>
      <div className="c10-stage">
        <div className="c10-coach">
          <Bobby size={step === 'twist' ? 150 : 100} mood={step === 'twist' ? 'sad' : 'smug'} tears={step === 'twist'}>
            <span className="c10-stache">
              <span className="stache" />
            </span>
          </Bobby>
          <span className="c10-podium">COACH</span>
        </div>
        <div className="c10-student">
          <Toon c="#5b9bd5" cd="#3b77ad" size={44} mood="scared" />
          {student && <Bubble>{student}</Bubble>}
        </div>
      </div>
      {step === 'lesson' && (
        <div className="c10-lesson">
          <b>{LESSONS50[lesson].title}</b>
          {LESSONS50[lesson].options.map((o) => (
            <button key={o} className="chip-btn" onClick={() => teach(o)}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const chapter10 = { 46: SecondDate, 47: Antivirus, 48: LoveExe, 49: ClickForever, 50: HappilyEverAfter };
export default chapter10;
