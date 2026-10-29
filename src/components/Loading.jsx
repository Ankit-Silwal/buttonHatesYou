'use client';

import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import './loading.css';

const LINES = ['Remembering you…', 'Counting your coins…', 'Finding the furniture…', 'Ugh. Loading feelings…'];
const MIN_MS = 900; // long enough to read, so it doesn't just flicker
const FADE_MS = 400;

// Covers the hub while the saved profile is read back, so the first paint
// isn't the default wallet and outfit. `done` once the profile is ready.
export default function Loading({ done }) {
  const [shown, setShown] = useState(true);
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
