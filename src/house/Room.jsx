'use client';

import Avatar from '@/components/Avatar';
import { Art, ART } from './art';
import { HOUSE_ITEM, ROOMS } from '@/economy/house';
import './room.css';

// Paint order: things further back first.
const ORDER = ['ceiling', 'wall-left', 'wall-right', 'corner', 'bed', 'nightstand', 'counter', 'rug', 'floor-right', 'floor-left'];
const BEHIND = new Set(['ceiling', 'wall-left', 'wall-right', 'corner', 'bed', 'nightstand', 'counter', 'rug']);

// Morning / day / evening / night for the windows and the lighting.
export function skyOf(h) {
  if (h >= 7 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  if (h >= 5 && h < 7) return 'dawn';
  return 'night';
}

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

// The kitchen's built-ins: a fridge, a run of cabinets with a sink.
function KitchenFixtures() {
  return (
    <>
      <svg className="kfix kfix-fridge" viewBox="0 0 60 140" aria-hidden="true" focusable="false">
        <rect x="3" y="3" width="54" height="134" rx="8" fill="#cfe6e4" />
        <rect x="3" y="3" width="54" height="134" rx="8" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
        <path d="M3 46 H57" stroke="#8fb3b0" strokeWidth="2" />
        <rect x="44" y="14" width="4" height="26" rx="2" fill="#f4f1e8" />
        <rect x="44" y="56" width="4" height="46" rx="2" fill="#f4f1e8" />
        <rect x="12" y="62" width="14" height="14" fill="#fff8e6" transform="rotate(-5 19 69)" />
        <circle cx="19" cy="60" r="3" fill="#e2674f" />
        <rect x="14" y="84" width="9" height="9" rx="2" fill="#5b8fd6" />
        <path d="M26 82 l4 -2 4 2 -1 5h-6z" fill="#ffd36b" />
        <path d="M10 8 q-2 60 0 120" stroke="#fff" strokeOpacity="0.45" strokeWidth="4" strokeLinecap="round" fill="none" />
      </svg>
      <div className="kfix kfix-counter">
        <span className="top" />
        <span className="doors">
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>
      <svg className="kfix kfix-sink" viewBox="0 0 70 44" aria-hidden="true" focusable="false">
        <path d="M6 34 q0 -6 6 -6 h46 q6 0 6 6 v4 h-58z" fill="#aab3c0" />
        <path d="M10 34 h50" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.5" />
        <path d="M44 28 V14 q0 -8 -8 -8 h-6" stroke="#c9d1db" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <rect x="26" y="4" width="8" height="6" rx="2" fill="#aab3c0" />
        <circle cx="44" cy="28" r="3" fill="#8e97a4" />
      </svg>
    </>
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
const DAY_WINDOW = ['wall-cozy', 'wall-kitchen-tile', 'wall-kitchen-sage', 'wall-kitchen-sun', 'wall-kitchen-noir'];
const BEDROOM_WINDOW = ['wall-bedroom-blue', 'wall-bedroom-plum', 'wall-bedroom-forest'];

function WallScene({ wall }) {
  if (BEDROOM_WINDOW.includes(wall)) {
    // the night outside: the moon shines in when the lamp goes off
    return (
      <div className="window win-bedroom">
        <div className="win-view">
          <i className="stars" />
          <i className="moon" />
          <i className="hill h1" />
          <i className="hill h2" />
        </div>
        <i className="win-frame" />
        <i className="curtain left" />
        <i className="curtain right" />
        <i className="sill" />
      </div>
    );
  }
  if (DAY_WINDOW.includes(wall) || wall === 'wall-beach' || wall === 'wall-city') {
    return (
      <div className={`window win-${wall} ${wall.startsWith('wall-kitchen') ? 'win-kitchen' : ''}`}>
        <div className="win-view">
          {DAY_WINDOW.includes(wall) && (
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
  if (wall === 'wall-space' || wall === 'wall-bedroom-galaxy') {
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
//   room      'living' | 'kitchen' | 'bedroom' (which spots it has, what it adds)
//   house     { wall, floor, place } to draw (already including any preview)
//   preview   the spot (or 'wall' / 'floor') being previewed, for the outline
//   mood, asleep, fx, eating: what the button is up to. Asleep = night: the
//             room dims; with a bed he is tucked into it, without one he dozes
//   lamp      { on, label, onToggle }: makes the nightstand lamp a
//             real button (the bedroom turns it off to go to sleep)
//   sky       'day' | 'dusk' | 'dawn' | 'night': what the windows show
export default function Room({ room = 'living', sky, sleepy, house, preview, equipped, mood, dirty, grime, asleep, fx, eating, offer, line, lamp, onPoke, onPick }) {
  const spots = ROOMS[room].spots;
  const placed = ORDER.filter((s) => spots.includes(s) && house.place[s] && ART[house.place[s]]);
  const bed = house.place.bed;
  const tucked = asleep && !!bed;
  const lampOn = !asleep;
  const lampId = house.place.nightstand;
  const poke = onPoke && {
    role: 'button',
    tabIndex: 0,
    'aria-label': "The button. It would rather you didn't.",
    onClick: onPoke,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPoke();
      }
    },
  };
  return (
    <div className={`hs-room ${asleep ? 'asleep' : ''} ${tucked ? 'tucked' : ''}`} data-room={room} data-sky={sky ?? undefined} data-fx={fx ?? undefined} data-bed={bed}>
      <div className={`hs-wall ${preview === 'wall' ? 'is-preview' : ''}`} data-wall={house.wall}>
        <WallScene wall={house.wall} />
      </div>
      <div className={`hs-floor ${preview === 'floor' ? 'is-preview' : ''}`} data-floor={house.floor}>
        <i className="plane" />
      </div>
      <i className="hs-shade" />
      {room === 'kitchen' && <KitchenFixtures />}

      {placed.filter((s) => BEHIND.has(s)).map((s) => (
        <Piece key={s} spot={s} id={house.place[s]} preview={preview === s} onPick={onPick} />
      ))}

      <div className={`resident ${eating ? 'chomp' : ''}`} {...poke}>
        <i className="res-shadow" />
        <Avatar size="var(--res-s)" equipped={equipped} mood={mood} sleepy={sleepy} dirty={dirty} grime={grime} className="has-legs" />
        {tucked && <i className="blanket" />}
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
      {room === 'bedroom' && <i className="hs-warm" />}
      {room === 'bedroom' && <i className="hs-moonlight" />}
      {placed.map((s) => (s === 'nightstand' && !lampOn ? null : <Glow key={s} spot={s} id={house.place[s]} />))}
      {house.place.ceiling === 'disco-ball' && <i className="disco-specks" />}

      {lamp && lampId && ART[lampId] && (
        <button
          type="button"
          className={`spot lamp-hit ${lamp.on ? 'is-on' : 'is-off'}`}
          data-spot="nightstand"
          aria-label={lamp.label}
          onClick={lamp.onToggle}
          style={{ '--w': ART[lampId].w, aspectRatio: aspect(lampId) }}
        >
          <i className="lamp-ring" />
        </button>
      )}

      {asleep && (
        <span className={`zzz ${tucked ? '' : 'doze'}`} aria-hidden="true">
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
