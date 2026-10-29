'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Avatar from '@/components/Avatar';
import RoomScene, { ShowerFront } from './RoomScene';
import { wash } from '@/profile/store';
import { faceOf } from '@/profile/needs';
import { DIRTY_AT } from '@/economy/needs';
import Hint from './Hint';
import { useUndressed, setUndressed, dressed, worn } from '@/profile/undress';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const SHOWER_MS = 2800;
const SCRUB_PX = 1500; // rubbing this far covers him in lather

// Foam bubbles on him: [left %, top %, size % of his width]
const FOAM = [
  [18, 18, 26], [52, 8, 30], [78, 24, 24], [30, 44, 30], [66, 46, 28], [10, 60, 22], [44, 64, 32], [82, 62, 24],
  [24, 80, 26], [60, 82, 28], [38, 28, 22], [70, 12, 20], [50, 40, 24], [14, 38, 20], [88, 44, 18], [34, 92, 22],
];

const DIRTY_LINES = ['I smell like a gym bag. Soap me.', 'There is something living on me. Soap. Now.', 'Do you see the flies? The flies are my friends now.'];
const CLEAN_LINES = ["I'm already clean. Don't be weird.", 'Squeaky. Nothing to scrub.'];
const SCRUB_LINES = ['Left a bit. Down. NO, the other left.', 'Ow. Gentle. I am a button.', 'That tickles! Stop. Keep going.', 'Foam on my face. Great.'];
const LATHER_LINES = ["Okay, I'm all foamy. Now drag me into the shower!", 'Peak bubbles. Shower time. Drag me in.'];
const SHY_LINES = ["Don't look at me!", 'Eyes UP here. Actually, eyes nowhere.', 'This is a private moment. Turn around.'];
const DRESSED_LINES = ['Clothes back on. Much better. Stop staring.', 'Dignity: restored. Mostly.', 'Finally. I was cold AND embarrassed.'];
const DONE_LINES = ['Squeaky clean. I smell like a meadow.', 'Fresh. Do not touch. You will smudge me.', 'New button, who dis?'];

// The bathroom: drag him to the stand to take his clothes off (he's shy
// about it), drag the soap over him to scrub, then drag him into the
// shower to rinse. His clothes stay on the stand until he's taken back to
// it; until then he wears nothing anywhere (see profile/undress.js). Washing is what makes him fit to go to bed again.
export default function BathPane({ needs, wallet, active, sky }) {
  const face = faceOf(needs);
  const [scrub, setScrub] = useState(0); // 0..1 how lathered he is
  const [phase, setPhase] = useState('idle'); // idle | lather | shower | clean
  const [line, setLine] = useState({ text: '', n: 0 });
  const [soap, setSoap] = useState(null); // { x, y } of the soap while dragged
  const [carry, setCarry] = useState(null); // { x, y } offset of him while dragged
  const stage = useRef(null);
  const body = useRef(null);
  const shower = useRef(null);
  const last = useRef(null);
  const talk = useRef(0);
  const timers = useRef([]);
  const dirty = (needs.dirt ?? 0) >= 5;
  const off = useUndressed();
  const clothed = dressed(wallet.equipped) && !off; // must undress before a wash
  const [shy, setShy] = useState(false);
  const stand = useRef(null);

  // (a fresh object each time, so the speech bubble pops again)
  const say = (text) => setLine((l) => ({ text, n: l.n + 1 }));
  const later = (ms, fn) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // A fresh remark each time this room comes into view.
  useEffect(() => {
    if (!active || phase !== 'idle') return;
    say(needs.asleep ? 'Zzz…' : face.dirty ? pick(DIRTY_LINES) : (needs.dirt ?? 0) >= 5 ? 'A little dusty. A wash never hurt.' : pick(CLEAN_LINES));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const over = (el, x, y) => {
    const r = el?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  const lather = useCallback(
    (amount) => {
      setScrub((s) => {
        const next = Math.min(1, s + amount);
        if (next >= 1 && s < 1) {
          setPhase('lather');
          say(pick(LATHER_LINES));
        }
        return next;
      });
    },
    []
  );

  function canScrub() {
    if (needs.asleep) return say('Zzz… (he is asleep. Wake him up in the Bedroom first)'), false;
    if (!dirty && phase === 'idle') return say(pick(CLEAN_LINES)), false;
    if (clothed && phase === 'idle') return say('Clothes off first. Take me to the stand. Not with you watching.'), false;
    return phase === 'idle';
  }

  /* ---- the soap ---- */
  function soapDown(e) {
    if (needs.asleep) return say('Zzz… (he is asleep. Wake him up in the Bedroom first)');
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = { x: e.clientX, y: e.clientY };
    const r = stage.current.getBoundingClientRect();
    setSoap({ x: e.clientX - r.left, y: e.clientY - r.top });
  }
  function soapMove(e) {
    if (!soap) return;
    const r = stage.current.getBoundingClientRect();
    setSoap({ x: e.clientX - r.left, y: e.clientY - r.top });
    const from = last.current;
    last.current = { x: e.clientX, y: e.clientY };
    if (!from || !over(body.current, e.clientX, e.clientY)) return;
    if (!canScrub()) return;
    lather(Math.hypot(e.clientX - from.x, e.clientY - from.y) / SCRUB_PX);
    talk.current += 1;
    if (talk.current % 40 === 0) say(pick(SCRUB_LINES));
  }
  function soapUp() {
    setSoap(null);
    last.current = null;
  }
  // Keyboard / one-tap alternative to dragging the soap.
  function soapKey() {
    if (canScrub()) {
      lather(0.18);
      say(pick(SCRUB_LINES));
    }
  }

  /* ---- the shower ---- */
  const startShower = useCallback(() => {
    setCarry(null);
    if (needs.asleep) return say('Zzz… (he is asleep. Wake him up in the Bedroom first)');
    if (phase !== 'lather') return say(scrub > 0 ? 'Not foamy enough yet. Keep scrubbing!' : 'Water alone will not cut it. Soap first!');
    setPhase('shower');
    say('AAH. Cold. No, hot. NOW COLD.');
    later(SHOWER_MS, () => {
      if (!wash()) {
        setPhase('idle');
        setScrub(0);
        return say('Something went wrong. Try again.');
      }
      setPhase('clean');
      setScrub(0);
      say(pick(DONE_LINES));
      later(3200, () => setPhase('idle'));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needs.asleep, phase, scrub]);

  /* ---- dragging him ---- */
  const grab = useRef(null);
  // he can be carried to the shower when foamy, and to the stand to
  // undress (before a wash) or dress (after one)
  const carryable = phase === 'lather' || ((clothed || off) && phase !== 'shower');
  function bodyDown(e) {
    if (!carryable || needs.asleep) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = { x: e.clientX, y: e.clientY };
    setCarry({ x: 0, y: 0 });
  }
  function bodyMove(e) {
    if (!grab.current) return;
    setCarry({ x: e.clientX - grab.current.x, y: e.clientY - grab.current.y });
  }
  function bodyUp(e) {
    if (!grab.current) return;
    grab.current = null;
    const x = e.clientX;
    const y = e.clientY;
    if (over(stand.current, x, y) && phase !== 'lather') {
      setCarry(null);
      if (clothed) {
        setUndressed(true);
        setShy(true);
        later(1800, () => setShy(false));
        return say(pick(SHY_LINES));
      }
      if (off) {
        setUndressed(false);
        return say(pick(DRESSED_LINES));
      }
    }
    if (phase === 'lather' && over(shower.current, x, y)) return startShower();
    setCarry(null);
    say(phase === 'lather' ? 'Drag me into the shower, over there →' : clothed ? 'To the stand. I am not undressing in the middle of the room.' : 'My clothes are on the stand.');
  }

  const showering = phase === 'shower';
  const foamN = phase === 'lather' || showering ? FOAM.length : Math.ceil(scrub * FOAM.length);
  const grimy = phase === 'idle' || (phase === 'idle' && scrub < 1);
  const grime = grimy ? ((needs.dirt ?? 0) / 100) * (1 - scrub) : 0;
  const level = grimy ? (grime * 100 >= DIRTY_AT * (1 - scrub) && face.dirty ? face.dirty : 0) : 0;
  const clean = phase === 'clean';

  const lathered = phase === 'lather' || showering ? 1 : clean ? 0 : scrub;

  const hero = (
    <div className="bath-me" style={carry ? { transform: `translate(${carry.x}px, ${carry.y}px)`, position: 'relative', zIndex: 6 } : undefined}>
      <div
        className={`bath-body ${carryable ? 'grab' : ''} ${showering ? 'showering' : ''}`}
        ref={body}
        onPointerDown={bodyDown}
        onPointerMove={bodyMove}
        onPointerUp={bodyUp}
        onPointerCancel={bodyUp}
      >
        <Avatar
          size="var(--hero)"
          equipped={worn(wallet.equipped, off)}
          mood={shy ? 'scared' : showering ? 'scared' : clean ? 'smug' : needs.asleep ? 'sleep' : face.mood}
          sleepy={face.sleepy && !clean}
          dirty={clean || showering ? 0 : level}
          grime={grime}
          className="has-legs"
          data-pose={shy ? 'shy' : undefined}
          data-bare={off || undefined}
        />
        <span className={`foam ${showering ? 'rinse' : ''}`} aria-hidden="true">
          {FOAM.slice(0, foamN).map(([x, y, s], i) => (
            <i key={i} style={{ left: `${x}%`, top: `${y}%`, width: `${s}%`, '--d': `${(i % 5) * 0.12}s` }} />
          ))}
        </span>
        {clean && (
          <span className="shine" aria-hidden="true">
            <i>✦</i>
            <i>✦</i>
            <i>✧</i>
          </span>
        )}
      </div>
    </div>
  );

  return (
    <RoomScene
      kind="bath"
      sky={sky}
      asleep={needs.asleep}
      line={line}
      hero={hero}
      sceneRef={stage}
      showerRef={shower}
      state={`${showering ? 'in showering' : ''} ${clean ? 'clean' : ''}`.trim() || undefined}
      hud={
        <>
          <div className="hud-chip nb nb-clean">
            <span aria-hidden="true">🫧</span>
            <div className="nb-track" role="meter" aria-label="Lather" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(lathered * 100)}>
              <i className="nb-fill" style={{ width: `${lathered * 100}%` }} />
            </div>
            <b>{Math.round(100 - (needs.dirt ?? 0))}% clean</b>
          </div>
        </>
      }
      extras={
        <>
          <ShowerFront />
          <div className={`clothes-stand ${off ? 'full' : ''}`} ref={stand} aria-label={off ? 'The stand, with his clothes on it' : 'A stand for his clothes'}>
            <ClothesStand full={off} />
          </div>
          <button
            type="button"
            className={`soap ${soap ? 'held' : ''}`}
            style={soap ? { left: soap.x, top: soap.y } : undefined}
            onPointerDown={soapDown}
            onPointerMove={soapMove}
            onPointerUp={soapUp}
            onPointerCancel={soapUp}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), soapKey())}
            aria-label="Soap. Drag it over the button to scrub him, or press Enter to scrub."
          >
            <span aria-hidden="true">🧼</span>
          </button>
        </>
      }
      tray={
        <>
          {/* stuck? scrub him with the soap, then drag him into the shower */}
          <Hint
            active={active && !needs.asleep && !soap && !carry}
            show={(dirty && phase === 'idle') || phase === 'lather' || (off && !dirty && phase === 'idle')}
            from={phase === 'lather' || clothed || (off && !dirty) ? '.bath-body' : '.soap'}
            to={phase === 'lather' ? '.t-shower' : clothed || (off && !dirty) ? '.clothes-stand' : '.bath-body'}
          />
          <div className="rs-pills">
            <button className="pill alt" onClick={soapKey} style={{ '--i': 0 }}>
              <span className="ico">🧼</span> Scrub
            </button>
            <button className="pill" onClick={startShower} disabled={phase !== 'lather'} style={{ '--i': 1 }}>
              <span className="ico">🚿</span> Turn on the shower
            </button>
          </div>
        </>
      }
    />
  );
}

// A wooden stand by the wall; with his clothes folded on it while he's out of them.
function ClothesStand({ full }) {
  return (
    <svg viewBox="0 0 90 110" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="cs-wood" x1="0" x2="1">
          <stop offset="0" stopColor="#c08a5c" />
          <stop offset="1" stopColor="#8a5a36" />
        </linearGradient>
      </defs>
      <ellipse cx="45" cy="106" rx="38" ry="4" fill="#2a1608" opacity="0.22" />
      <rect x="12" y="50" width="66" height="9" rx="3" fill="url(#cs-wood)" />
      <rect x="16" y="58" width="7" height="48" rx="2" fill="#7a4e2e" />
      <rect x="67" y="58" width="7" height="48" rx="2" fill="#7a4e2e" />
      <rect x="18" y="84" width="54" height="5" rx="2" fill="#8a5a36" />
      <rect x="42" y="6" width="6" height="46" rx="2" fill="#8a5a36" />
      <path d="M30 14 q15 -10 30 0" stroke="#8a5a36" strokeWidth="4" fill="none" strokeLinecap="round" />
      {full ? (
        <g>
          <rect x="18" y="38" width="54" height="13" rx="4" fill="#5f6672" />
          <rect x="22" y="28" width="46" height="11" rx="4" fill="#e2674f" />
          <path d="M26 28 q19 -9 38 0" fill="#f0c36d" />
          <rect x="22" y="40" width="46" height="2" fill="#fff" opacity="0.25" />
          <path d="M54 14 q8 2 6 14 l-6 -2z" fill="#9bbf9a" />
        </g>
      ) : (
        <path d="M36 14 q-4 12 0 22 M54 14 q4 12 0 22" stroke="#e8dcc6" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
      )}
    </svg>
  );
}

