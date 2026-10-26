'use client';

// Building blocks every level uses: the cast, speech bubbles, dragging,
// timers that clean up after themselves, and sounds.

import { useCallback, useEffect, useRef, useState } from 'react';
import Avatar from '@/components/Avatar';
import { useProfile } from '@/profile/useProfile';
import { DEFAULT_LOOK } from '@/economy/catalog';
import { Sound } from '@/game/sound';

export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const px = (s) => (typeof s === 'number' ? `${s}px` : s);

/* ---------- the cast ---------- */

// Bobby is the player's own button, in whatever they bought in the wardrobe.
// love: heart eyes. blush/tears/sweat: little overlays. children: extra props
// stuck on him (positioned against his --s box).
export function Bobby({ mood = 'calm', size = 120, love, blush, tears, sweat, legs = true, className = '', style, children, ...rest }) {
  const { wallet } = useProfile();
  const equipped = love ? { ...wallet.equipped, eyes: 'eyes-hearts' } : wallet.equipped;
  return (
    <span className={`toon bobby ${className}`} style={{ '--s': px(size), ...style }} {...rest}>
      <Avatar size={size} equipped={equipped} mood={mood} className={legs ? 'has-legs' : ''} />
      {blush && <Blush />}
      {tears && <Tears />}
      {sweat && <span className="sweat">💦</span>}
      {children}
    </span>
  );
}

// Any other button: Bella, the fridge button, the power button...
export function Toon({ c, cd, mood = 'calm', size = 110, equipped, bow, lashes, legs = true, blush, className = '', style, children, ...rest }) {
  return (
    <span className={`toon ${className}`} style={{ '--s': px(size), ...style }} {...rest}>
      <Avatar
        size={size}
        equipped={{ ...DEFAULT_LOOK, ...equipped }}
        mood={mood}
        className={`${legs ? 'has-legs' : ''} ${lashes ? 'lashes' : ''}`}
        style={{ '--skin': c, '--skin-dark': cd }}
      />
      {bow && <span className="bow">🎀</span>}
      {blush && <Blush />}
      {children}
    </span>
  );
}

export const Bella = (props) => <Toon c="#f39ac0" cd="#cc6f97" bow lashes {...props} />;

// Chad the Toggle. Flexes by being ON. Sometimes OFF. Always wears shades.
export function Chad({ on = true, size = 110, className = '', style, ...rest }) {
  return (
    <span className={`chad ${on ? 'on' : 'off'} ${className}`} style={{ '--s': px(size), ...style }} {...rest}>
      <span className="track">{on ? 'ON' : 'OFF'}</span>
      <span className="knob">
        <span className="shades" />
        <span className="grin" />
      </span>
    </span>
  );
}

// The player's cursor as a character (chapter 6 onwards).
export function CursorGuy({ size = 60, mood = 'calm', className = '', style, ...rest }) {
  return (
    <span className={`cursor-guy ${className}`} data-mood={mood} style={{ '--s': px(size), ...style }} {...rest}>
      <svg viewBox="0 0 24 32" aria-hidden="true">
        <path d="M2 2 L2 26 L8 20 L12 30 L16 28 L12 18 L20 18 Z" />
      </svg>
      <span className="eyes"><i /><i /></span>
    </span>
  );
}

export const Blush = () => (
  <span className="blush">
    <i />
    <i />
  </span>
);

export const Tears = () => (
  <span className="tears">
    <i />
    <i />
  </span>
);

// A speech bubble. Put it inside a positioned parent; it sits above it.
export function Bubble({ children, side = 'top', className = '', style }) {
  if (!children) return null;
  return (
    <span className={`bubble ${side} ${className}`} style={style} key={String(children)}>
      {children}
    </span>
  );
}

/* ---------- hooks ---------- */

// setTimeout that is cancelled when the level unmounts.
export function useLater() {
  const ids = useRef(new Set());
  useEffect(() => {
    const set = ids.current;
    return () => set.forEach(clearTimeout);
  }, []);
  return useCallback((fn, ms) => {
    const id = setTimeout(() => {
      ids.current.delete(id);
      fn();
    }, ms);
    ids.current.add(id);
    return id;
  }, []);
}

// setInterval with the same clean-up; pass ms = null to pause.
export function useEvery(fn, ms) {
  const f = useRef(fn);
  f.current = fn;
  useEffect(() => {
    if (ms == null) return;
    const id = setInterval(() => f.current(), ms);
    return () => clearInterval(id);
  }, [ms]);
}

// A requestAnimationFrame loop: fn(dt in seconds, time in ms).
export function useFrame(fn, active = true) {
  const f = useRef(fn);
  f.current = fn;
  useEffect(() => {
    if (!active) return;
    let id;
    let last = performance.now();
    const loop = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      f.current(dt, t);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [active]);
}

// Size of an element, kept up to date.
export function useBox() {
  const ref = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box];
}

// Where the pointer is, relative to an element. A ref, so reading it every
// frame doesn't re-render; `inside` says whether it is over the element.
export function usePointer(ref) {
  const pos = useRef({ x: -9999, y: -9999, inside: false });
  useEffect(() => {
    const move = (e) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      pos.current = { x: e.clientX - r.left, y: e.clientY - r.top, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom };
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', move);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', move);
    };
  }, [ref]);
  return pos;
}

/* ---------- dragging ---------- */

// Is a viewport point inside an element?
export function over(pt, el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return pt.x >= r.left && pt.x <= r.right && pt.y >= r.top && pt.y <= r.bottom;
}

// Wraps anything to make it draggable. onDrop gets the viewport point of the
// item's center; return true to leave it where it was dropped, anything else
// snaps it back home.
export function Drag({ onDrop, onPick, children, className = '', style, disabled, ...rest }) {
  const [d, setD] = useState({ x: 0, y: 0, on: false });
  const grab = useRef(null);
  const el = useRef(null);
  return (
    <div
      ref={el}
      className={`drag ${d.on ? 'dragging' : ''} ${disabled ? 'off' : ''} ${className}`}
      style={{ ...style, translate: `${d.x}px ${d.y}px` }}
      onPointerDown={(e) => {
        if (disabled) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        grab.current = { x: e.clientX - d.x, y: e.clientY - d.y };
        setD((v) => ({ ...v, on: true }));
        onPick?.();
      }}
      onPointerMove={(e) => grab.current && setD({ x: e.clientX - grab.current.x, y: e.clientY - grab.current.y, on: true })}
      onPointerUp={() => {
        if (!grab.current) return;
        grab.current = null;
        const r = el.current.getBoundingClientRect();
        const keep = onDrop?.({ x: r.left + r.width / 2, y: r.top + r.height / 2 }) === true;
        setD((v) => (keep ? { ...v, on: false } : { x: 0, y: 0, on: false }));
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------- sounds ---------- */
export const sfx = {
  ...Sound,
  heart: () => {
    Sound.tone(90, 0.12, 'sine', 1, 60);
    Sound.tone(80, 0.14, 'sine', 0.8, 55, 0.16);
  },
  kiss: () => Sound.tone(1200, 0.12, 'sine', 0.6, 2400),
  aww: () => Sound.tone(600, 0.5, 'triangle', 0.5, 300),
  swoosh: () => Sound.tone(300, 0.15, 'sine', 0.4, 900),
  shutter: () => {
    Sound.tone(2000, 0.03, 'square', 0.3);
    Sound.tone(1200, 0.05, 'square', 0.25, null, 0.05);
  },
  ding: () => Sound.tone(1320, 0.3, 'sine', 0.5),
  zap: () => Sound.tone(900, 0.2, 'sawtooth', 0.35, 80),
};
