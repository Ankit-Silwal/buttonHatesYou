'use client';

import { useNeeds } from '@/profile/needs';
import Icon from '@/components/Icon';
import './chip.css';

// The little meters on the home screen: hunger, energy and how clean he is.
// Tapping them opens the room that fixes the lowest (`go` is the pager's).
// `compact` is the Android app's chip: three thin bars, no numbers.
export default function EnergyChip({ go, compact = false }) {
  const n = useNeeds();
  if (!n.ready) return null;
  const e = Math.floor(n.energy);
  const h = Math.floor(n.hunger);
  const clean = Math.round(100 - (n.dirt ?? 0));
  const label = n.asleep ? `Asleep. Hunger ${h} of 100, clean ${clean} of 100` : `Hunger ${h} of 100, energy ${e} of 100, clean ${clean} of 100`;
  const low = e < 25 || h < 25 || clean < 25;
  const fix = () => go?.(clean < 25 && clean <= Math.min(e, h) ? 4 : n.asleep || e <= h ? 3 : 2);
  if (compact) {
    const line = (glyph, v) => (
      <span className="nc-line">
        <Icon glyph={glyph} size={11} tint="var(--ink-soft)" />
        <span className="nc-bar">
          <i style={{ width: `${v}%`, background: v < 25 ? 'var(--bad)' : v < 50 ? 'var(--warn)' : 'var(--good)' }} />
        </span>
      </span>
    );
    return (
      <button type="button" className={`chip needs-chip ${low ? 'low' : ''}`} title={label} aria-label={`${label}. Open the room that helps`} onClick={fix}>
        {line('🍔', h)}
        {line(n.asleep ? '💤' : '⚡', e)}
        {line('🫧', clean)}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`chip energy-chip ${low ? 'low' : ''} ${n.asleep ? 'asleep' : ''}`}
      title={label}
      aria-label={`${label}. ${h < e ? 'Open kitchen' : 'Open bedroom'}`}
      onClick={fix}
    >
      <span className={`ec-one hunger ${h < 25 ? 'low' : ''}`}>
        <span aria-hidden="true">🍔</span>
        <span className="ec-bar" aria-hidden="true">
          <i style={{ width: `${h}%` }} />
        </span>
        <b>{h}</b>
      </span>
      <span className={`ec-one energy ${e < 25 ? 'low' : ''} ${n.asleep ? 'asleep' : ''}`}>
        <span aria-hidden="true">{n.asleep ? '💤' : '⚡'}</span>
        <span className="ec-bar" aria-hidden="true">
          <i style={{ width: `${e}%` }} />
        </span>
        <b>{e}</b>
      </span>
      <span className={`ec-one clean ${clean < 25 ? 'low' : ''}`}>
        <span aria-hidden="true">🫧</span>
        <span className="ec-bar" aria-hidden="true">
          <i style={{ width: `${clean}%` }} />
        </span>
        <b>{clean}</b>
      </span>
    </button>
  );
}
