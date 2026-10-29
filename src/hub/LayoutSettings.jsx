'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { CONTROLS, useLayout, setActive, renameSlot, clearSlot } from './layout';
import './layout.css';

// Settings → Layout: which arrangement the home screen uses (Default or one
// of three saved slots), with a thumbnail of each, and the way into the editor.
export default function LayoutSettings() {
  const lay = useLayout();
  const [renaming, setRenaming] = useState(null); // the slot being renamed
  const [name, setName] = useState('');
  if (!lay) return null;

  const rows = [{ n: 0, name: 'Default', pos: {} }, ...lay.slots.map((s, i) => ({ n: i + 1, ...s }))];

  function rename(e, n) {
    e.preventDefault();
    renameSlot(n, name);
    setRenaming(null);
  }

  return (
    <section className="pf-card pf-layout">
      <h2>Layout</h2>
      <div className="pf-lay-list" role="radiogroup" aria-label="Home screen layout">
        {rows.map((r) => {
          const empty = r.pos === null;
          return (
            <div className="pf-lay-row" key={r.n}>
              {renaming === r.n ? (
                <form className="pf-lay-rename" onSubmit={(e) => rename(e, r.n)}>
                  <input autoFocus maxLength={20} value={name} onChange={(e) => setName(e.target.value)} aria-label="Layout name" onKeyDown={(e) => e.key === 'Escape' && setRenaming(null)} />
                  <button className="pill" type="submit">
                    Save
                  </button>
                </form>
              ) : (
                <label className={`pf-lay-pick ${empty ? 'empty' : ''}`}>
                  <input type="radio" name="hub-layout" checked={lay.active === r.n} disabled={empty} onChange={() => setActive(r.n)} />
                  <i className="pf-lay-radio" aria-hidden="true" />
                  <Thumb pos={r.pos ?? {}} />
                  <span className="pf-lay-name">
                    <b>{r.name}</b>
                    {empty && <span>Empty</span>}
                  </span>
                </label>
              )}
              {r.n > 0 && renaming !== r.n && (
                <span className="pf-lay-end">
                  <button
                    type="button"
                    className="pf-lay-icon"
                    aria-label={`Rename ${r.name}`}
                    onClick={() => {
                      setName(r.name);
                      setRenaming(r.n);
                    }}
                  >
                    ✎
                  </button>
                  {!empty && (
                    <button type="button" className="pf-lay-icon" aria-label={`Clear ${r.name}`} onClick={() => clearSlot(r.n)}>
                      ✕
                    </button>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <Link className="pill pf-lay-go" href="/?layout=edit">
        <Icon glyph="✋" size={18} tint="currentColor" /> Customize layout
      </Link>
    </section>
  );
}

// A tiny phone with a block for each control where it sits.
function Thumb({ pos }) {
  return (
    <span className="pf-lay-thumb" aria-hidden="true">
      {CONTROLS.map((c) => {
        const p = pos[c.id] ?? c.preview;
        return <i key={c.id} className={`${c.id} ${pos[c.id] ? 'moved' : ''}`} style={{ '--x': p.x, '--y': p.y, '--w': `${c.preview.w}%`, '--h': `${c.preview.h}%` }} />;
      })}
    </span>
  );
}
