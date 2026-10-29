'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import Avatar from './Avatar';
import './loading.css';

const LINES = ['Remembering you…', 'Counting your coins…', 'Finding the furniture…', 'Ugh. Loading feelings…'];
const MIN_MS = 900; // long enough to read, so it doesn't just flicker
const FADE_MS = 400;

const SEEN = 'bhy.loaded';
let seen = false; // this page has shown it already (coming back from a game, say)
const seenBefore = () => {
  if (seen) return true;
  try {
    return sessionStorage.getItem(SEEN) === '1';
  } catch {
    return false;
  }
};

// Covers the hub while the saved profile is read back, so the first paint
// isn't the default wallet and outfit. `done` once the profile is ready.
// Only the first time the app opens in a tab: after that the profile is
// already in memory (or quick to read), so the hub just appears.
export default function Loading({ done }) {
  const [shown, setShown] = useState(() => !seen); // (matches the server's first render on a fresh page)
  useLayoutEffect(() => {
    if (seenBefore()) setShown(false);
  }, []);
  const [min, setMin] = useState(false);
  const [n, setN] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setMin(true), MIN_MS);
    const lines = setInterval(() => setN((i) => (i + 1) % LINES.length), 700);
    return () => {
      clearTimeout(t);
      clearInterval(lines);
    };
  }, []);

  const leaving = done && min;
  useEffect(() => {
    if (!leaving) return;
    seen = true;
    try {
      sessionStorage.setItem(SEEN, '1');
    } catch {}
    const t = setTimeout(() => setShown(false), FADE_MS);
    return () => clearTimeout(t);
  }, [leaving]);

  if (!shown) return null;
  return (
    <div className={`loading ${leaving ? 'out' : ''}`} role="status" aria-live="polite" aria-busy={!leaving}>
      <div className="loading-bob">
        <Avatar size={120} mood="annoyed" />
      </div>
      <p className="loading-line" key={n}>{LINES[n]}</p>
      <div className="loading-bar" aria-hidden="true">
        <i className={done ? 'full' : ''} />
      </div>
    </div>
  );
}
