'use client';

import { useSyncExternalStore } from 'react';

// Where the home screen's controls sit: the default arrangement or one of
// three saved layouts. Kept in localStorage on this device; it isn't part of
// the economy.
//
// A position is { x, y }, each 0..100: how far along the free space of its
// container the control sits (0 = flush left/top, 100 = flush right/bottom).
// layout.css turns it into `left: x%; translate: -x%`, so a control is on
// screen at any size. A control that isn't in a layout stays where it is by
// default.
//
//   active   0 = Default, 1..3 = that slot
//   slots    three { name, pos }; pos is null while the slot is empty
//
// The editor (LayoutEditor.jsx) works on a draft that is only kept for the
// page's lifetime until it's saved into a slot.

const KEY = 'buttonHatesYou.layout.v1';
export const SLOTS = 3;

// sel: how the editor finds the control in the hub. gutter: the gap kept
// from the container's edges (layout.css has the same numbers).
// preview: a rough box (% of the screen) and default spot for Settings' thumbnails.
export const CONTROLS = [
  { id: 'top', name: 'Profile', sel: '.hub > .hub-top', gutter: 0, preview: { w: 46, h: 9, x: 0, y: 0 } },
  { id: 'rings', name: 'Needs', sel: '.hub > .need-rings', gutter: 8, preview: { w: 56, h: 7, x: 4, y: 12 } },
  { id: 'line', name: 'Speech', sel: '.hub .rs-line', gutter: 8, preview: { w: 52, h: 6, x: 50, y: 22 } },
  { id: 'mic', name: 'Mic', sel: '.hub .mic-btn', gutter: 8, preview: { w: 11, h: 6, x: 100, y: 36 } },
  { id: 'tray', name: 'Room buttons', sel: '.hub .rs-tray', gutter: 4, preview: { w: 76, h: 6, x: 50, y: 85 } },
  { id: 'dock', name: 'Rooms', sel: '.hub > .dock', gutter: 10, preview: { w: 92, h: 8, x: 50, y: 100 } },
];
const IDS = new Set(CONTROLS.map((c) => c.id));

const fresh = () => ({ active: 0, slots: Array.from({ length: SLOTS }, (_, i) => ({ name: `Layout ${i + 1}`, pos: null })) });

let state = null; // { active, slots }
let edit = { on: false, draft: {} };
let snap = null; // what useLayout returns, rebuilt on every change
const listeners = new Set();

const clamp = (v) => Math.round(Math.max(0, Math.min(100, Number(v) || 0)) * 10) / 10;

// Only known controls with numbers in range survive a reload.
function cleanPos(pos) {
  if (!pos || typeof pos !== 'object') return null;
  const out = {};
  for (const [id, p] of Object.entries(pos)) if (IDS.has(id) && p && Number.isFinite(p.x) && Number.isFinite(p.y)) out[id] = { x: clamp(p.x), y: clamp(p.y) };
  return out;
}

function load() {
  if (state) return state;
  state = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.slots)) {
      state.slots = state.slots.map((s, i) => {
        const v = saved.slots[i];
        const name = typeof v?.name === 'string' && v.name.trim() ? v.name.trim().slice(0, 20) : s.name;
        return { name, pos: cleanPos(v?.pos) };
      });
      const a = Number(saved.active);
      if (a >= 1 && a <= SLOTS && state.slots[a - 1].pos) state.active = a;
    }
  } catch {}
  return state;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function changed() {
  snap = null;
  listeners.forEach((fn) => fn());
}

// Another tab saved a layout.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    state = null;
    changed();
  });
}

export const activePos = (s) => (s.active ? s.slots[s.active - 1]?.pos : null) ?? {};

function getSnap() {
  if (snap) return snap;
  const s = load();
  const pos = edit.on ? edit.draft : activePos(s);
  snap = { ...s, editing: edit.on, draft: edit.draft, pos, dirty: edit.on && !same(edit.draft, activePos(s)) };
  return snap;
}

const same = (a, b) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));
const sorted = (p) => Object.fromEntries(Object.entries(p ?? {}).sort(([a], [b]) => (a < b ? -1 : 1)));

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// null on the server and in the first paint.
export const useLayout = () => useSyncExternalStore(subscribe, getSnap, () => null);

// Props for the hub's <main>: the positions as CSS variables, which controls
// are moved (`data-lay`), and whether it's being edited.
export function useHubLayout() {
  const s = useLayout();
  if (!s) return {};
  return hubProps(s.pos, s.editing);
}

const propsCache = new WeakMap();
function hubProps(pos, editing) {
  let p = propsCache.get(pos);
  if (!p) {
    const style = {};
    for (const [id, { x, y }] of Object.entries(pos)) {
      style[`--lay-${id}-x`] = x;
      style[`--lay-${id}-y`] = y;
    }
    const ids = Object.keys(pos).join(' ');
    p = { style, 'data-lay': ids || undefined };
    propsCache.set(pos, p);
  }
  return editing ? { ...p, 'data-lay-edit': '' } : p;
}

export function setActive(n) {
  const s = load();
  if (n && !s.slots[n - 1]?.pos) return;
  state = { ...s, active: n };
  save();
  changed();
}

export function renameSlot(n, name) {
  const s = load();
  const v = String(name ?? '').trim().slice(0, 20) || `Layout ${n}`;
  state = { ...s, slots: s.slots.map((slot, i) => (i === n - 1 ? { ...slot, name: v } : slot)) };
  save();
  changed();
}

export function clearSlot(n) {
  const s = load();
  state = { ...s, active: s.active === n ? 0 : s.active, slots: s.slots.map((slot, i) => (i === n - 1 ? { ...slot, pos: null } : slot)) };
  save();
  changed();
}

// --- the editor's draft ---

export function startEdit() {
  if (edit.on) return;
  edit = { on: true, draft: { ...activePos(load()) } };
  changed();
}

export function endEdit() {
  if (!edit.on) return;
  edit = { on: false, draft: {} };
  changed();
}

export function moveDraft(id, x, y) {
  if (!edit.on || !IDS.has(id)) return;
  edit = { ...edit, draft: { ...edit.draft, [id]: { x: clamp(x), y: clamp(y) } } };
  changed();
}

export function resetDraft() {
  if (!edit.on) return;
  edit = { ...edit, draft: {} };
  changed();
}

// Saves the draft into slot n and makes it the one in use.
export function saveDraft(n) {
  if (!edit.on) return;
  const s = load();
  const pos = { ...edit.draft };
  state = { ...s, active: n, slots: s.slots.map((slot, i) => (i === n - 1 ? { ...slot, pos } : slot)) };
  edit = { ...edit, draft: pos };
  save();
  changed();
}
