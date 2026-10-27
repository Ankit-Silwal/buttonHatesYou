import { glow, sprite, stamp } from './art';

// Small drawing helpers that give How I Met Your Cursor's characters and foes
// volume: soft contact shadows, top-lit gradients, glossy highlights and
// glowing eyes. Gradients are tiny objects; shadows and glows are cached.

// A soft contact shadow centred on (x, y), w wide.
export function shadow(c, x, y, w, a = 0.3) {
  const img = sprite('shadow', 64, 64, (k) => {
    const gr = k.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(10,8,20,1)');
    gr.addColorStop(0.5, 'rgba(10,8,20,0.55)');
    gr.addColorStop(1, 'rgba(10,8,20,0)');
    k.fillStyle = gr;
    k.fillRect(0, 0, 64, 64);
  });
  c.globalAlpha = a;
  c.drawImage(img, x - w / 2, y - w * 0.12, w, w * 0.24);
  c.globalAlpha = 1;
}

// A vertical top-light gradient between two colours.
export function lit(c, y, h, top, bottom) {
  const gr = c.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, top);
  gr.addColorStop(1, bottom);
  return gr;
}

// A radial "ball" gradient lit from the upper left.
export function ball(c, x, y, r, hi, mid, lo) {
  const gr = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, hi);
  gr.addColorStop(0.55, mid);
  gr.addColorStop(1, lo);
  return gr;
}

// A white glossy streak (a thin crescent near the top left).
export function gloss(c, x, y, w, h, a = 0.55) {
  c.fillStyle = `rgba(255,255,255,${a})`;
  c.beginPath();
  c.ellipse(x, y, w, h, -0.5, 0, Math.PI * 2);
  c.fill();
}

// Additive glow (for eyes, cores, magic).
export function shine(c, rgb, x, y, r, a = 1) {
  const op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  stamp(c, glow(rgb), x, y, r, a);
  c.globalCompositeOperation = op;
  c.globalAlpha = 1;
}

// A pair of glowing eyes.
export function glowEyes(c, x1, x2, y, r, rgb, core = '#fff') {
  shine(c, rgb, x1, y, r * 4, 0.8);
  shine(c, rgb, x2, y, r * 4, 0.8);
  c.fillStyle = core;
  c.beginPath();
  c.arc(x1, y, r, 0, Math.PI * 2);
  c.arc(x2, y, r, 0, Math.PI * 2);
  c.fill();
}
