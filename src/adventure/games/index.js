import flap from './flap';
import pop from './pop';
import catchGame from './catch';
import simon from './simon';
import hop from './hop';
import whack from './whack';
import run from './run';
import stack from './stack';
import slice from './slice';

// Every Adventure game is a function that takes
//   { look, sound, keys }   the outfit (see lookOf), the Sound kit, and the
//                           set of key codes held right now
// and returns an object with
//   update(dt), draw(c)     called every frame; draw on the 480x800 canvas
//   score, over             read by the shell every frame; once `over` turns
//                           true the run ends and `score` is what counts
// and, optionally, the input it cares about (game coordinates):
//   down(x, y), move(x, y), up(x, y), key(code)
export const CREATE = { flap, pop, catch: catchGame, simon, hop, whack, run, stack, slice };
