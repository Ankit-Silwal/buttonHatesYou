'use client';

import { useSyncExternalStore } from 'react';
import { DEFAULT_LOOK } from '@/economy/catalog';

// He takes his clothes off for a bath (at the stand in the bathroom) and
// only gets them back by being taken to the stand again. Until then he's
// wearing nothing, everywhere, and the wardrobe can't dress him. Kept on
// this device: it's how he looks, not part of the economy (what he owns and
// has equipped doesn't change).

const KEY = 'buttonHatesYou.undressed.v1';
// what comes off: clothes, hats, neckwear, ear things and eyewear (eye
// shapes like Sleepy or Googly are his own eyes, so they stay)
export const CLOTHES = ['outfit', 'hat', 'scarf', 'ears'];
const EYEWEAR = new Set(['eyes-shades', 'eyes-glasses', 'eyes-aviators', 'eyes-visor', 'eyes-monocle', 'eyes-3d']);

let undressed = null;
const listeners = new Set();

function read() {
  if (undressed != null) return undressed;
  try {
    undressed = localStorage.getItem(KEY) === '1';
  } catch {
    undressed = false;
  }
  return undressed;
}

export function setUndressed(on) {
  undressed = !!on;
  try {
    if (on) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((fn) => fn());
}

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const useUndressed = () => useSyncExternalStore(subscribe, read, () => false);

// Is he wearing anything that would come off?
export const dressed = (equipped) => CLOTHES.some((s) => equipped?.[s] && equipped[s] !== DEFAULT_LOOK[s]) || EYEWEAR.has(equipped?.eyes);

// The look as he's actually wearing it right now.
export function worn(equipped, off) {
  if (!off || !equipped) return equipped;
  const look = { ...equipped };
  for (const s of CLOTHES) look[s] = DEFAULT_LOOK[s];
  if (EYEWEAR.has(look.eyes)) look.eyes = DEFAULT_LOOK.eyes;
  return look;
}
export const useWorn = (equipped) => worn(equipped, useUndressed());
