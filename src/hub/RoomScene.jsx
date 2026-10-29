'use client';

import { useState } from 'react';
import Avatar from '@/components/Avatar';
import { Art, ART } from '@/house/art';
import { skyOf } from '@/house/Room';
import Pieces, { coveredSpots } from '@/house/Pieces';
import { DEFAULT_HOUSE, DEFAULT_ROOMS, HOUSE_ITEM, ROOMS } from '@/economy/house';
import { MOTES, Window, Frame, Clock, Shelf, Plant, Sofa, FloorLamp, Fridge, Counter, Stove, Hood, WallShelf, Table, Pendant, StringLights, Wardrobe, Poster, Mirror, Vanity, Towels, Duck } from './scene-art';
import './scene.css';

export { skyOf };

// The one chassis all four rooms stand on: the wall with its wainscot, a
// window onto the real time of day, the floor in perspective, a shaft of
// light, dust motes, a vignette, the button on the floor with his contact
// shadow and a speech bubble above him. Each `kind` adds its own hand-drawn
// props; what the player decorated (wallpaper, floor, furniture) is layered
// on top. A row of pills (the `tray`) sits at the bottom, above the dock.
//
//   kind      'living' | 'kitchen' | 'bedroom' | 'bath'
//   house     { wall, floor, place, items } to draw, including any preview
//   preview   what is being previewed, for the outline: 'wall' / 'floor', the
//             'bed' / 'nightstand' spot, or a free-placed piece's item id
//   edit      decorating: { onMove, onRemove } makes the furniture draggable (see Pieces)
//   sky       'day' | 'dusk' | 'dawn' | 'night' (the real time of day)
//   asleep    the room dims; in the bedroom he is tucked into bed
//   lamp      { on, label, onToggle }: the bedside lamp is a real button
//   hero      replaces the button (the bathroom drags him around)
//   hud       a small meter on the scene;  extras: more scene children
//   talking   his mouth flaps (he's repeating what you said)
//   state     a word for CSS, e.g. 'showering' in the bathroom
export default function RoomScene({ kind, sky, house, preview, asleep, equipped, mood, sleepy, dirty, grime, fx, eating, line, onPoke, lamp, hero, hud, extras, tray, state, sceneRef, showerRef, talking, edit }) {
  const [pressed, setPressed] = useState(false);
  const cfg = ROOMS[kind];
  const defaults = kind === 'living' ? DEFAULT_HOUSE : DEFAULT_ROOMS[kind];
  const place = house?.place ?? {};
  const themedWall = !!house && house.wall !== defaults?.wall && !!HOUSE_ITEM[house.wall];
  const themedFloor = !!house && house.floor !== defaults?.floor && !!HOUSE_ITEM[house.floor];
  const has = cfg ? coveredSpots(house?.items).join(' ') : '';
  const bedId = kind === 'bedroom' && ART[place.bed] ? place.bed : null;
  const tucked = kind === 'bedroom' && !!asleep && !!bedId;
  const lampId = kind === 'bedroom' && ART[place.nightstand] ? place.nightstand : null;
  const winSky = kind === 'bedroom' && asleep ? 'night' : sky;

  function poke() {
    setPressed(true);
    setTimeout(() => setPressed(false), 140);
    onPoke?.();
  }

  return (
    <div className={`rs ${hud ? 'has-hud' : ''}`} data-kind={kind} data-sky={sky ?? undefined} data-asleep={asleep || undefined} data-tucked={tucked || undefined} data-bed={tucked ? bedId : undefined} data-fx={fx ?? undefined} data-has={has} data-state={state ?? undefined} style={bedId || lampId ? { '--bedw': ART[bedId]?.w, '--nsw': ART[lampId]?.w } : undefined}>
      <div className="rs-scene" ref={sceneRef}>
        <div className="rs-back" aria-hidden="true">
          <div className={`rs-wall ${preview === 'wall' ? 'is-preview' : ''}`} data-wall={themedWall ? house.wall : undefined}>
            <i className="rs-wain" />
          </div>
          <div className={`rs-floor ${themedFloor ? 'themed' : ''} ${preview === 'floor' ? 'is-preview' : ''}`} data-floor={themedFloor ? house.floor : undefined}>
            {themedFloor && <i className="plane" />}
          </div>
          <i className="rs-shaft" />
          <i className="rs-glow" />

          <div className="rs-hz">
            {kind === 'living' && <LivingProps sky={sky} />}
            {kind === 'kitchen' && <KitchenProps sky={sky} />}
            {kind === 'bedroom' && <BedroomProps sky={winSky} />}
            {kind === 'bath' && <BathProps showerRef={showerRef} />}
          </div>

          <div className="rs-motes">
            {MOTES.map(([x, d, t, sz], i) => (
              <i key={i} style={{ '--x': `${x}%`, '--d': `-${d}s`, '--t': `${t}s`, '--sz': `${sz}px` }} />
            ))}
          </div>
          <i className="rs-night" />
          <i className="rs-vignette" />
        </div>

        {/* what the player decorated */}
        <div className="rs-decor" aria-hidden={edit ? undefined : 'true'}>
          {kind === 'bedroom' && bedId && (
            <div className={`rs-bed ${preview === 'bed' ? 'is-preview' : ''}`} data-item={bedId} style={{ '--w': ART[bedId].w, aspectRatio: aspect(bedId) }}>
              <Art id={bedId} />
              {preview === 'bed' && <i className="preview-tag">Preview</i>}
            </div>
          )}
          {cfg && <Pieces items={house?.items} preview={preview} edit={edit} />}
          {lampId && ART[lampId]?.glow && !asleep && <Glow spot="nightstand" id={lampId} />}
          {(preview === 'wall' || preview === 'floor') && <span className="preview-banner">Previewing the {preview}</span>}
        </div>

        {/* the bedside lamp: a nightstand that is also the sleep switch */}
        {lampId && ART[lampId] && (
          <button type="button" className={`rs-lamp ${lamp?.on === false ? 'is-off' : 'is-on'} ${preview === 'nightstand' ? 'is-preview' : ''}`} data-item={lampId} aria-label={lamp?.label ?? 'Bedside lamp'} onClick={lamp?.onToggle} disabled={!lamp} style={{ '--w': ART[lampId].w, aspectRatio: aspect(lampId) }}>
            <Art id={lampId} />
            <i className="lamp-ring" />
          </button>
        )}

        <p className="rs-line" key={line?.n ?? 0} aria-live="polite">
          {line?.text}
        </p>

        <div className={`rs-stage ${eating ? 'chomp' : ''}`}>
          {hero ?? (
            <Avatar
              as="button"
              type="button"
              className={`hero has-legs ${pressed ? 'press' : ''}`}
              size="var(--hero)"
              equipped={equipped}
              mood={mood}
              sleepy={sleepy}
              dirty={dirty}
              grime={grime}
              data-talking={talking || undefined}
              onClick={poke}
              aria-label="The button. It would rather you didn't."
            />
          )}
          {tucked && <i className="rs-blanket" />}
          {asleep && (
            <span className="hero-zz" aria-hidden="true">
              <i>z</i>
              <i>z</i>
              <i>Z</i>
            </span>
          )}
          {eating && (
            <span className="rs-bite" key={eating.n} aria-hidden="true">
              <Art id={eating.id} />
            </span>
          )}
          {fx === 'sugar' && <i className="fx-sparks" />}
          {fx === 'hiccup' && <i className="fx-hic">hic!</i>}
        </div>

        {hud && <div className="rs-hud">{hud}</div>}
        {extras}
      </div>
      {tray && <div className="rs-tray">{tray}</div>}
    </div>
  );
}

const aspect = (id) => {
  const [, , w, h] = ART[id].vb.split(' ').map(Number);
  return `${w} / ${h}`;
};

// Light from the bedside lamp, drawn above the dimmed room so it still glows at night.
function Glow({ spot, id }) {
  const g = ART[id].glow;
  return (
    <div className="rs-spot glow-spot" data-spot={spot} data-item={id} style={{ '--w': ART[id].w, aspectRatio: aspect(id) }}>
      <i className="glow" style={{ left: `${g.x}%`, top: `${g.y}%`, '--r': g.r, '--gc': g.c }} />
    </div>
  );
}

/* ---------------------------- the rooms' own props --------------------------- */

function LivingProps({ sky }) {
  return (
    <>
      <i className="rs-rug" />
      <Window sky={sky} />
      <Frame />
      <Clock />
      <Shelf />
      <Plant />
      <FloorLamp />
      <Sofa />
      <i className="rs-lampglow" />
    </>
  );
}

function KitchenProps({ sky }) {
  return (
    <>
      <i className="rs-rug" />
      <Window sky={sky} dress="valance" />
      <WallShelf />
      <Pendant />
      <Fridge />
      <Counter />
      <Hood />
      <Stove />
      <Table />
      <i className="rs-lampglow" />
    </>
  );
}

function BedroomProps({ sky }) {
  return (
    <>
      <i className="rs-rug" />
      <StringLights />
      <Window sky={sky} dress="night" />
      <Poster />
      <Wardrobe />
      <i className="rs-warm" />
      <i className="rs-moonlight" />
    </>
  );
}

function BathProps({ showerRef }) {
  return (
    <>
      <i className="rs-mat" />
      <Mirror />
      <Vanity />
      <Towels />
      <Duck />
      <div className="t-shower" ref={showerRef} aria-hidden="true">
        <span className="shower-pipe" />
        <span className="shower-head" />
        <span className="shower-floor" />
        <span className="shower-frame" />
      </div>
    </>
  );
}

// The shower's water and the glass in front of the button, drawn above him.
export function ShowerFront() {
  return (
    <div className="t-shower-front" aria-hidden="true">
      <span className="shower-water">
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} style={{ '--i': i }} />
        ))}
      </span>
      <span className="shower-glass" />
    </div>
  );
}
