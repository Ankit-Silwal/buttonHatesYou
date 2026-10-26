import { ITEM, DEFAULT_LOOK, SLOTS } from '@/economy/catalog';

// Turns an `equipped` map into what the character markup needs: the body
// colors as CSS variables and one data-attribute per accessory. The CSS in
// avatar.css draws the accessories from those attributes.
export function lookProps(equipped = DEFAULT_LOOK) {
  const style = {};
  const data = {};
  for (const { id: slot } of SLOTS) {
    const item = ITEM[equipped?.[slot]] ?? ITEM[DEFAULT_LOOK[slot]];
    if (slot === 'color') {
      style['--skin'] = item.look.c;
      style['--skin-dark'] = item.look.cd;
    } else if (item.look) {
      data[`data-${slot}`] = item.look;
    }
  }
  return { style, data };
}

// The same, applied to a plain DOM element (the game engine is not React).
export function dress(el, equipped) {
  const { style, data } = lookProps(equipped);
  for (const [k, v] of Object.entries(style)) el.style.setProperty(k, v);
  for (const { id: slot } of SLOTS) el.removeAttribute(`data-${slot}`);
  for (const [k, v] of Object.entries(data)) el.setAttribute(k, v);
}

// Inner markup of every character: ears sit behind the body, scarf and hat
// in front of it.
export const CHAR_HTML =
  '<span class="ears"><i></i><i></i></span>' +
  '<span class="legs"><i></i><i></i></span>' +
  '<span class="body"><span class="brows"><i></i><i></i></span>' +
  '<span class="eyes"><i></i><i></i></span><span class="mouth"></span></span>' +
  '<span class="scarf"><i></i></span><span class="hat"></span>';
