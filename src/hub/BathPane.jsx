'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Avatar from '@/components/Avatar';
import RoomScene, { ShowerFront } from './RoomScene';
import { wash } from '@/profile/store';
import { faceOf } from '@/profile/needs';
import { DIRTY_AT } from '@/economy/needs';

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
const DONE_LINES = ['Squeaky clean. I smell like a meadow.', 'Fresh. Do not touch. You will smudge me.', 'New button, who dis?'];

// The bathroom: drag the soap over him to scrub, then drag him into the
// shower to rinse. Washing is what makes him fit to go to bed again.
export default function BathPane({ needs, wallet, active, sky, onPotions }) {
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
  function bodyDown(e) {
    if (phase !== 'lather') return;
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
    if (over(shower.current, e.clientX, e.clientY)) startShower();
    else {
      setCarry(null);
      say('Drag me into the shower, over there →');
    }
  }

  const showering = phase === 'shower';
  const foamN = phase === 'lather' || showering ? FOAM.length : Math.ceil(scrub * FOAM.length);
  const grimy = phase === 'idle' || (phase === 'idle' && scrub < 1);
  const grime = grimy ? ((needs.dirt ?? 0) / 100) * (1 - scrub) : 0;
  const level = grimy ? (grime * 100 >= DIRTY_AT * (1 - scrub) && face.dirty ? face.dirty : 0) : 0;
  const clean = phase === 'clean';

  const note = needs.asleep
    ? 'He is asleep. Wake him up first.'
    : phase === 'lather'
      ? 'Drag him into the shower (or press the shower button).'
      : (needs.dirt ?? 0) >= 75
        ? 'Filthy! He will refuse to sleep until he is washed.'
        : face.dirty
          ? 'Grubby from all the games. Drag the soap over him.'
          : 'Drag the soap over him to scrub, then put him in the shower.';
  const lathered = phase === 'lather' || showering ? 1 : clean ? 0 : scrub;

  const hero = (
    <div className="bath-me" style={carry ? { transform: `translate(${carry.x}px, ${carry.y}px)`, position: 'relative', zIndex: 6 } : undefined}>
      <div
        className={`bath-body ${phase === 'lather' ? 'grab' : ''} ${showering ? 'showering' : ''}`}
        ref={body}
        onPointerDown={bodyDown}
        onPointerMove={bodyMove}
        onPointerUp={bodyUp}
        onPointerCancel={bodyUp}
      >
        <Avatar size="var(--hero)" equipped={wallet.equipped} mood={showering ? 'scared' : clean ? 'smug' : needs.asleep ? 'sleep' : face.mood} sleepy={face.sleepy && !clean} dirty={clean || showering ? 0 : level} grime={grime} className="has-legs" />
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
          <div className="hud-steps" aria-label="Steps">
            <span className={phase === 'idle' ? 'on' : 'done'}>1 · Scrub</span>
            <span className={phase === 'lather' ? 'on' : showering || clean ? 'done' : ''}>2 · Shower</span>
          </div>
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
          <p className="rs-hint">{note}</p>
          <div className="rs-pills">
            <button className="pill alt" onClick={soapKey} style={{ '--i': 0 }}>
              <span className="ico">🧼</span> Scrub
            </button>
            <button className="pill" onClick={startShower} disabled={phase !== 'lather'} style={{ '--i': 1 }}>
              <span className="ico">🚿</span> Turn on the shower
            </button>
            <button className="pill house-btn" onClick={onPotions} style={{ '--i': 2 }}>
              <span className="ico">🧪</span> Potions
            </button>
          </div>
        </>
      }
    />
  );
}
