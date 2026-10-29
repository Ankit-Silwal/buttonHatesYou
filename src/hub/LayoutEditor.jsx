'use client';

import { useEffect, useState } from 'react';
import { CONTROLS, SLOTS, useLayout, startEdit, endEdit, moveDraft, resetDraft, saveDraft } from './layout';
import './layout.css';

// The home screen in layout-edit mode (`/?layout=edit`, from Settings): every
// movable control gets a dashed outline and follows a drag; taps on the hub
// do nothing; a bar saves the arrangement into one of the three slots.
export default function LayoutEditor() {
  const lay = useLayout();
  const editing = !!lay?.editing;
  const [leaving, setLeaving] = useState(false); // Done with unsaved changes
  const [savedTo, setSavedTo] = useState(0);
  const [barLow, setBarLow] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('layout') === 'edit') startEdit();
    return endEdit;
  }, []);

  useEffect(() => {
    if (!editing) return;
    return attach();
  }, [editing]);

  useEffect(() => {
    if (!savedTo) return;
    const t = setTimeout(() => setSavedTo(0), 1400);
    return () => clearTimeout(t);
  }, [savedTo]);

  if (!editing) return null;

  const done = () => {
    setLeaving(false);
    endEdit();
    try {
      history.replaceState(null, '', location.pathname);
    } catch {}
  };

  return (
    <div className={`lay-bar ${barLow ? 'low' : ''}`} role="toolbar" aria-label="Layout">
      {leaving ? (
        <>
          <b className="lay-note">Not saved</b>
          <button type="button" className="lay-btn" onClick={() => setLeaving(false)}>
            Back
          </button>
          <button type="button" className="lay-btn warn" onClick={done}>
            Discard
          </button>
        </>
      ) : (
        <>
          <span className="lay-save" role="group" aria-label="Save to">
            <span className="lay-label">Save</span>
            {Array.from({ length: SLOTS }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={`lay-slot ${lay.active === n ? 'on' : ''} ${savedTo === n ? 'saved' : ''}`}
                aria-label={`Save to ${lay.slots[n - 1].name}`}
                title={lay.slots[n - 1].name}
                onClick={() => (saveDraft(n), setSavedTo(n))}
              >
                {savedTo === n ? '✓' : n}
              </button>
            ))}
          </span>
          <button type="button" className="lay-btn" onClick={resetDraft} disabled={!Object.keys(lay.draft).length}>
            Reset
          </button>
          <button type="button" className="lay-btn main" onClick={() => (lay.dirty ? setLeaving(true) : done())}>
            Done
          </button>
          <button type="button" className="lay-btn icon" onClick={() => setBarLow((t) => !t)} aria-label={barLow ? 'Move this bar up' : 'Move this bar down'}>
            {barLow ? '↑' : '↓'}
          </button>
        </>
      )}
    </div>
  );
}

// --- dragging ---

const controlOf = (target) => {
  if (!(target instanceof Element) || target.closest('.lay-bar')) return null;
  for (const c of CONTROLS) {
    const el = target.closest(c.sel);
    if (el) return { c, el };
  }
  return null;
};

// The control's container and the free space it can move in.
function frame(el, gutter) {
  const box = el.offsetParent ?? el.parentElement;
  const r = box.getBoundingClientRect();
  return {
    left: r.left + box.clientLeft + gutter,
    top: r.top + box.clientTop + gutter,
    fw: box.clientWidth - 2 * gutter - el.offsetWidth,
    fh: box.clientHeight - 2 * gutter - el.offsetHeight,
  };
}
const pct = (v, free) => (free > 0 ? Math.max(0, Math.min(100, (v / free) * 100)) : 50);

// Where a control is now, as a layout position.
function posOf(el, gutter) {
  const f = frame(el, gutter);
  const r = el.getBoundingClientRect();
  return { x: pct(r.left - f.left, f.fw), y: pct(r.top - f.top, f.fh) };
}

function attach() {
  let drag = null; // { id, el, gutter, gx, gy, x, y, raf }
  const hub = document.querySelector('main.hub');
  const inHub = (t) => t instanceof Element && hub?.contains(t) && !t.closest('.lay-bar');

  // Show a position without going through React (committed on release).
  const show = (id, x, y) => {
    if (!hub) return;
    hub.style.setProperty(`--lay-${id}-x`, x);
    hub.style.setProperty(`--lay-${id}-y`, y);
    const ids = new Set((hub.dataset.lay ?? '').split(' ').filter(Boolean));
    if (!ids.has(id)) hub.dataset.lay = [...ids, id].join(' ');
  };

  const down = (e) => {
    const hit = controlOf(e.target);
    if (!hit || !inHub(e.target)) return;
    if (e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    const { c, el } = hit;
    const r = el.getBoundingClientRect();
    drag = { id: c.id, el, gutter: c.gutter, gx: (e.clientX - r.left) / Math.max(1, r.width), gy: (e.clientY - r.top) / Math.max(1, r.height), pointer: e.pointerId };
    // the control switches to its positioned form at the same spot
    const p = posOf(el, c.gutter);
    drag.x = p.x;
    drag.y = p.y;
    show(c.id, p.x, p.y);
    el.classList.add('lay-dragging');
    try {
      el.setPointerCapture(e.pointerId);
    } catch {}
  };

  const move = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    e.preventDefault();
    e.stopPropagation();
    const { el, gutter } = drag;
    const f = frame(el, gutter);
    drag.x = pct(e.clientX - drag.gx * el.offsetWidth - f.left, f.fw);
    drag.y = pct(e.clientY - drag.gy * el.offsetHeight - f.top, f.fh);
    cancelAnimationFrame(drag.raf);
    const { id, x, y } = drag;
    drag.raf = requestAnimationFrame(() => show(id, Math.round(x * 10) / 10, Math.round(y * 10) / 10));
  };

  const up = (e) => {
    if (!drag || e.pointerId !== drag.pointer) return;
    e.stopPropagation();
    cancelAnimationFrame(drag.raf);
    drag.el.classList.remove('lay-dragging');
    try {
      drag.el.releasePointerCapture(e.pointerId);
    } catch {}
    moveDraft(drag.id, drag.x, drag.y);
    drag = null;
  };

  // No control does what it does while it's being arranged.
  const block = (e) => {
    if (!inHub(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
  };
  const blockOnControls = (e) => controlOf(e.target) && block(e);

  // Arrow keys nudge the focused control.
  const key = (e) => {
    const hit = controlOf(e.target);
    if (!hit || !inHub(e.target)) return;
    const step = e.shiftKey ? 10 : 2;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    e.stopPropagation();
    const p = posOf(hit.el, hit.c.gutter);
    moveDraft(hit.c.id, p.x + d[0], p.y + d[1]);
  };

  const opts = { capture: true, passive: false };
  window.addEventListener('pointerdown', down, opts);
  window.addEventListener('pointermove', move, opts);
  window.addEventListener('pointerup', up, opts);
  window.addEventListener('pointercancel', up, opts);
  window.addEventListener('click', block, opts);
  window.addEventListener('dblclick', block, opts);
  window.addEventListener('contextmenu', blockOnControls, opts);
  window.addEventListener('keydown', key, opts);
  return () => {
    if (drag) {
      cancelAnimationFrame(drag.raf);
      drag.el.classList.remove('lay-dragging');
    }
    window.removeEventListener('pointerdown', down, opts);
    window.removeEventListener('pointermove', move, opts);
    window.removeEventListener('pointerup', up, opts);
    window.removeEventListener('pointercancel', up, opts);
    window.removeEventListener('click', block, opts);
    window.removeEventListener('dblclick', block, opts);
    window.removeEventListener('contextmenu', blockOnControls, opts);
    window.removeEventListener('keydown', key, opts);
  };
}
