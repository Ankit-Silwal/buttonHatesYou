'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './hint.css';

const IDLE_MS = 5000; // how long nothing happens before the hand shows
const ROUNDS = 3; // gestures per showing; the next showing needs another idle spell

// A hand that shows what to do once the player seems stuck: `show` is true,
// this panel is in view (`active`) and nobody has touched anything for a few
// seconds. `from` and `to` are selectors inside this panel. With only `from`
// the hand taps it; with both it drags from one to the other. Any tap or key
// hides it again.
export default function Hint({ show, active = true, from, to }) {
  const anchor = useRef(null);
  const [at, setAt] = useState(null); // { x0, y0, x1, y1, n }
  const on = show && active && !!from;

  useEffect(() => {
    if (!on) return setAt(null);
    let timer = 0;
    let done = 0;
    const find = (sel) => {
      const el = anchor.current?.closest('.pane')?.querySelector(sel);
      const r = el?.getBoundingClientRect();
      return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
    };
    const place = () => {
      if (document.querySelector('.hub[data-panel]')) return setAt(null); // a sheet is open
      const a = find(from);
      const b = to ? find(to) : a;
      setAt(a && b ? { x0: a.x, y0: a.y, x1: b.x, y1: b.y, n: Date.now() } : null);
    };
    const wait = () => {
      setAt(null);
      clearTimeout(timer);
      timer = setTimeout(place, IDLE_MS);
    };
    const end = () => {
      done = setTimeout(wait, 50); // let the gesture finish, then wait for the next idle spell
    };
    wait();
    const events = ['pointerdown', 'keydown', 'wheel'];
    events.forEach((e) => window.addEventListener(e, wait, { passive: true }));
    window.addEventListener('resize', wait);
    anchor.current?.addEventListener('hintend', end);
    const el = anchor.current;
    return () => {
      clearTimeout(timer);
      clearTimeout(done);
      events.forEach((e) => window.removeEventListener(e, wait));
      window.removeEventListener('resize', wait);
      el?.removeEventListener('hintend', end);
    };
  }, [on, from, to]);

  return (
    <>
      <span ref={anchor} hidden />
      {at &&
        createPortal(
          <span
            key={at.n}
            className={`hint-hand ${to ? 'drag' : 'tap'}`}
            style={{ '--x0': `${at.x0}px`, '--y0': `${at.y0}px`, '--x1': `${at.x1}px`, '--y1': `${at.y1}px`, '--rounds': ROUNDS }}
            onAnimationEnd={(e) => e.target === e.currentTarget && anchor.current?.dispatchEvent(new Event('hintend'))}
            aria-hidden="true"
          >
            <svg viewBox="0 0 32 40" width="40" height="50">
              <path
                d="M11 3.5a3 3 0 0 1 6 0V17l1.2-.3a3 3 0 0 1 3.4 1.6 3 3 0 0 1 4 1.7l.2.4a3 3 0 0 1 3.6 2.4l.6 4.6c.6 4.6-1 8.4-4 10.6-1.6 1.2-3.7 1.6-6.3 1.6h-2.4c-3 0-5.4-1.3-7-3.8L3.5 26a3 3 0 0 1 4.6-3.8L11 25z"
                fill="#fffaf2"
                stroke="#4a3428"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <path d="M17 17v6M21.6 18.3v4.7M25.8 20.4v3.6" fill="none" stroke="#4a3428" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <i className="hint-ring" />
          </span>,
          document.body
        )}
    </>
  );
}
