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

// What a level-locked thing says on its tile: items are sold from their
// level on; characters (and stories) come with clearing the level before.
export const lockLabel = (item) => (item.slot === 'char' ? `Beat level ${item.level - 1}` : `Level ${item.level}`);
