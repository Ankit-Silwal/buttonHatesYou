'use client';

import Avatar from '@/components/Avatar';
import { Art, ART } from './art';
import { HOUSE_ITEM } from '@/economy/house';

// Paint order: things further back first.
const ORDER = ['ceiling', 'wall-left', 'wall-right', 'corner', 'bed', 'rug', 'floor-right', 'floor-left'];
const BEHIND = new Set(['ceiling', 'wall-left', 'wall-right', 'corner', 'bed', 'rug']);

const aspect = (id) => {
  const [, , w, h] = ART[id].vb.split(' ').map(Number);
  return `${w} / ${h}`;
};

function Piece({ spot, id, preview, onPick }) {
  return (
    <div
      className={`spot ${preview ? 'is-preview' : ''}`}
      onClick={() => onPick?.(id)}
      title={HOUSE_ITEM[id]?.name}
      data-spot={spot}
      data-item={id}
      style={{ '--w': ART[id].w, aspectRatio: aspect(id) }}
    >
      <Art id={id} />
      {preview && <span className="preview-tag">Preview</span>}
    </div>
  );
}

// Light from lamps, drawn above the dimmed room so it still glows at night.
function Glow({ spot, id }) {
  const g = ART[id].glow;
  if (!g) return null;
  return (
    <div className="spot glow-spot" data-spot={spot} data-item={id} style={{ '--w': ART[id].w, aspectRatio: aspect(id) }}>
      <i className="glow" style={{ left: `${g.x}%`, top: `${g.y}%`, '--r': g.r, '--gc': g.c }} />
    </div>
  );
}

const BACK = 'M0 80 V44 h14 V30 h12 V50 h10 V20 h16 V40 h10 V12 h14 V46 h12 V28 h16 V52 h10 V24 h14 V36 h12 V48 h10 V30 h14 V80z';
// Lit windows in the night city: a fixed scatter over the back buildings.
const LIT = [];
for (let i = 0; i < 70; i++) {
  const x = (i * 37) % 196;
  const y = 18 + ((i * 53) % 46);
  LIT.push([x + 2, y]);
}

// The view out of the window (or the porthole) for the themes that have one.
function WallScene({ wall }) {
  if (wall === 'wall-cozy' || wall === 'wall-beach' || wall === 'wall-city') {
    return (
      <div className={`window win-${wall}`}>
        <div className="win-view">
          {wall === 'wall-cozy' && (
            <>
              <i className="sun" />
              <i className="cloud c1" />
              <i className="cloud c2" />
              <i className="hill h1" />
              <i className="hill h2" />
            </>
          )}
          {wall === 'wall-beach' && (
            <>
              <i className="sun" />
              <i className="sea" />
              <i className="sand" />
              <i className="wave" />
              <svg className="palm" viewBox="0 0 60 80" aria-hidden="true">
                <path d="M34 80 Q30 50 36 22" stroke="#7a5230" strokeWidth="4" fill="none" />
                <path d="M36 22 q-20 -8 -32 4 q14 -4 32 -4 q-6 -14 -24 -18 q18 4 24 18 q10 -16 24 -14 q-16 2 -24 14 q16 -2 24 10 q-12 -8 -24 -10z" fill="#3f9a55" />
              </svg>
            </>
          )}
          {wall === 'wall-city' && (
            <>
              <i className="moon" />
              <i className="stars" />
              <svg className="skyline" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
                <clipPath id="hs-city">
                  <path d={BACK} />
                </clipPath>
                <path d={BACK} fill="#141a33" />
                <g className="lit" clipPath="url(#hs-city)">
                  {LIT.map(([x, y], i) => (
                    <rect key={i} x={x} y={y} width="2.2" height="2.6" rx="0.4" />
                  ))}
                </g>
                <path d="M0 80 V58 h20 V50 h18 V62 h16 V46 h20 V60 h22 V52 h18 V64 h20 V54 h22 V66 h20 V56 h24 V80z" fill="#0b1024" />
              </svg>
            </>
          )}
        </div>
        <i className="win-frame" />
        <i className="curtain left" />
        <i className="curtain right" />
        <i className="sill" />
      </div>
    );
  }
  if (wall === 'wall-space') {
    return (
      <div className="porthole">
        <div className="win-view">
          <i className="stars" />
          <i className="planet" />
          <i className="ring" />
        </div>
      </div>
    );
  }
  if (wall === 'wall-gamer') return <i className="rgb-strip" />;
  return null;
}

// The room: wallpaper, floor, furniture in its spots, and the button.
//   house     { wall, floor, place } to draw (already including any preview)
//   preview   the spot (or 'wall' / 'floor') being previewed, for the outline
//   mood, asleep, fx, eating: what the button is up to
export default function Room({ sleepy, house, preview, equipped, mood, asleep, fx, eating, offer, line, onPoke, onPick }) {
  const placed = ORDER.filter((s) => house.place[s] && ART[house.place[s]]);
  const bed = house.place.bed;
  return (
    <div className={`hs-room ${asleep ? 'asleep' : ''}`} data-fx={fx ?? undefined} data-bed={bed}>
      <div className={`hs-wall ${preview === 'wall' ? 'is-preview' : ''}`} data-wall={house.wall}>
        <WallScene wall={house.wall} />
      </div>
      <div className={`hs-floor ${preview === 'floor' ? 'is-preview' : ''}`} data-floor={house.floor}>
        <i className="plane" />
      </div>
      <i className="hs-shade" />

      {placed.filter((s) => BEHIND.has(s)).map((s) => (
        <Piece key={s} spot={s} id={house.place[s]} preview={preview === s} onPick={onPick} />
      ))}

      <div className={`resident ${eating ? 'chomp' : ''}`} onClick={onPoke}>
        <i className="res-shadow" />
        <Avatar size="var(--res-s)" equipped={equipped} mood={mood} sleepy={sleepy} className="has-legs" />
        {asleep && <i className="blanket" />}
        {eating && (
          <span className="bite" key={eating.n}>
            <Art id={eating.id} />
          </span>
        )}
        {offer && (
          <span className="offer" key={offer}>
            <Art id={offer} />
            <i className="preview-tag">Preview</i>
          </span>
        )}
        {fx === 'sugar' && <i className="fx-sparks" />}
        {fx === 'hiccup' && <i className="fx-hic">hic!</i>}
      </div>

      {placed.filter((s) => !BEHIND.has(s)).map((s) => (
        <Piece key={s} spot={s} id={house.place[s]} preview={preview === s} onPick={onPick} />
      ))}

      <i className="hs-dim" />
      {placed.map((s) => (
        <Glow key={s} spot={s} id={house.place[s]} />
      ))}
      {house.place.ceiling === 'disco-ball' && <i className="disco-specks" />}

      {asleep && (
        <span className="zzz" aria-hidden="true">
          <i>z</i>
          <i>z</i>
          <i>Z</i>
        </span>
      )}
      {line?.text && (
        <p className="hs-line" key={line.n} aria-live="polite">
          {line.text}
        </p>
      )}
      {(preview === 'wall' || preview === 'floor') && <span className="preview-banner">Previewing the {preview}</span>}
    </div>
  );
}
