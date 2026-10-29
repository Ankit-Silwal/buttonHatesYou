'use client';

import { useEffect, useRef, useState } from 'react';
import { Art, ART } from './art';
import { BANDS, HOUSE_ITEM, bandOf } from '@/economy/house';
import './pieces.css';

// A room's free-placed furniture (`items: [{ item, x, y }]`, see house.js),
// drawn in its bands. Each band is a strip of the room laid out by the
// room's own CSS (pieces.css: `.rs-scene` for the home screen, `.hs-room`
// for /house), and a piece sits at x%, y% of its band, so the numbers look
// the same at any size. Pieces nearer the front (higher y) are drawn later,
// so they stand in front.
//
//   items     what to draw (including any preview)
//   preview   the item id being previewed, for the dashed outline
//   edit      null, or { onMove(item, x, y), onRemove(item) }: the pieces can
//             be dragged (mouse, touch, pen) within their band, and the
//             selected one gets a × to take it out. One onMove per drag, at
//             the drop.
//   lit       false hides the lamps' glow
export default function Pieces({ items, preview, edit, lit = true }) {
  const bands = useRef({});
  const drag = useRef(null);
  const [live, setLive] = useState(null); // { item, x, y } while dragging (and until the drop lands)
  const [sel, setSel] = useState(null);

  // A drop is shown where it landed until the new items come in.
  useEffect(() => {
    if (!live?.dropped) return;
    const t = setTimeout(() => setLive(null), 400);
    return () => clearTimeout(t);
  }, [live]);
  useEffect(() => {
    setLive((l) => (l?.dropped ? null : l));
  }, [items]);

  // Leaving decorate mode, or tapping elsewhere, lets go of the selection.
  useEffect(() => {
    if (!edit) setSel(null);
  }, [edit]);
  useEffect(() => {
    if (!sel) return;
    const off = (e) => !e.target.closest?.('.pz-piece') && setSel(null);
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [sel]);

  // Back to front by where the pieces were placed (not where one is being
  // dragged: moving a node in the DOM would make it lose the pointer).
  const shown = (items ?? [])
    .filter((p) => ART[p.item] && bandOf(HOUSE_ITEM[p.item]))
    .sort((a, b) => a.y - b.y)
    .map((p) => (live?.item === p.item ? { ...p, x: live.x, y: live.y } : p));

  function down(e, p, band) {
    if (!edit || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const r = bands.current[band]?.getBoundingClientRect();
    if (!r) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    // keep the grab point under the finger: offset from the piece's anchor
    drag.current = { item: p.item, r, id: e.pointerId, sx: e.clientX, sy: e.clientY, dx: e.clientX - (r.left + (r.width * p.x) / 100), dy: e.clientY - (r.top + (r.height * p.y) / 100), moved: false, x: p.x, y: p.y };
    setSel(p.item);
  }

  function move(e) {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return;
    d.moved = true;
    const c = (v) => Math.min(100, Math.max(0, v));
    d.x = c(((e.clientX - d.dx - d.r.left) / Math.max(1, d.r.width)) * 100);
    d.y = d.r.height > 0 ? c(((e.clientY - d.dy - d.r.top) / d.r.height) * 100) : 0;
    setLive({ item: d.item, x: d.x, y: d.y });
  }

  function up(e) {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    if (!d.moved || e.type === 'pointercancel') return setLive(null);
    setLive({ item: d.item, x: d.x, y: d.y, dropped: true });
    edit?.onMove(d.item, d.x, d.y);
  }

  function key(e, p) {
    if (!edit) return;
    const step = e.shiftKey ? 10 : 2;
    const by = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (by) {
      e.preventDefault();
      const c = (v) => Math.min(100, Math.max(0, v));
      edit.onMove(p.item, c(p.x + by[0]), c(p.y + by[1]));
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      edit.onRemove(p.item);
    }
  }

  return (
    <div className="pz" data-edit={edit ? '' : undefined}>
      {BANDS.map((band) => (
        <div key={band} className="pz-band" data-band={band} ref={(el) => (bands.current[band] = el)}>
          {shown
            .filter((p) => bandOf(HOUSE_ITEM[p.item]) === band)
            .map((p) => {
              const art = ART[p.item];
              const name = HOUSE_ITEM[p.item].name;
              const style = { '--x': `${p.x}%`, '--y': p.y, top: `${p.y}%`, '--w': art.w, aspectRatio: aspect(p.item) };
              const dragging = live?.item === p.item && !live.dropped;
              return [
                <div
                  key={p.item}
                  className={`pz-piece ${preview === p.item ? 'is-preview' : ''} ${sel === p.item ? 'is-sel' : ''} ${dragging ? 'is-drag' : ''} ${band === 'floor' && p.y >= FRONT ? 'is-front' : ''}`}
                  data-item={p.item}
                  data-band={band}
                  style={style}
                  title={edit ? undefined : name}
                  {...(edit
                    ? {
                        role: 'button',
                        tabIndex: 0,
                        'aria-label': `Move the ${name}`,
                        onPointerDown: (e) => down(e, p, band),
                        onPointerMove: move,
                        onPointerUp: up,
                        onPointerCancel: up,
                        onLostPointerCapture: up,
                        onKeyDown: (e) => key(e, p),
                        onFocus: () => setSel(p.item),
                      }
                    : {})}
                >
                  <Art id={p.item} />
                  {preview === p.item && !edit && <i className="preview-tag">Preview</i>}
                  {edit && sel === p.item && !dragging && (
                    <button type="button" className="pz-x" aria-label={`Take the ${name} out`} onPointerDown={(e) => e.stopPropagation()} onClick={() => edit.onRemove(p.item)}>
                      ×
                    </button>
                  )}
                </div>,
                lit && art.glow ? (
                  <div key={`${p.item}-glow`} className="pz-piece pz-glow glow-spot" data-item={p.item} data-band={band} style={style} aria-hidden="true">
                    <i className="glow" style={{ left: `${art.glow.x}%`, top: `${art.glow.y}%`, '--r': art.glow.r, '--gc': art.glow.c }} />
                  </div>
                ) : null,
              ];
            })}
        </div>
      ))}
    </div>
  );
}

// Floor pieces this far forward stand in front of the button.
const FRONT = 40;

const aspect = (id) => {
  const [, , w, h] = ART[id].vb.split(' ').map(Number);
  return `${w} / ${h}`;
};

// Which of the room's built-in props the furniture covers, as the old spot
// names (for `data-has`, which hides a default prop when something stands
// where it is).
export function coveredSpots(items) {
  const out = new Set();
  for (const p of items ?? []) {
    const band = bandOf(HOUSE_ITEM[p.item]);
    if (band === 'ceiling' || band === 'rug' || band === 'counter') out.add(band);
    if (band === 'wall') out.add(p.x < 52 ? 'wall-left' : 'wall-right');
    if (band === 'floor' && p.y < 45) out.add(p.x >= 88 ? 'corner' : p.x < 40 ? 'floor-left' : p.x > 60 ? 'floor-right' : 'floor-mid');
  }
  return [...out];
}
