// "Go" on a buy mission opens a shop on the item it asks for: the level sheet
// leaves the item id here and the shop (Wardrobe, DecorSheet) takes it when
// it opens, so the shops need no new props.
let next = null;

export const focusItem = (id) => {
  next = id;
};

export const takeFocus = () => {
  const id = next;
  next = null;
  return id;
};

// What a level-locked thing says on its tile. `level` is the level it is
// available on, so it comes with clearing the one before (as the level
// sheet's "Coming up" lists it).
export const lockLabel = (item) => `Beat level ${item.level - 1}`;
