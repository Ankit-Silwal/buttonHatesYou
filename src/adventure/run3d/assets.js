import * as THREE from 'three';

// Shared WebGL bits for Button Run. One renderer serves every run and the card
// on the Games screen (browsers only allow a handful of WebGL contexts), and
// geometries, materials and textures are made once and reused.

let renderer;
export function getRenderer() {
  if (renderer === undefined) {
    try {
      renderer = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), antialias: true, preserveDrawingBuffer: true });
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
    } catch (err) {
      console.error('Button Run needs WebGL', err);
      renderer = null;
    }
  }
  return renderer;
}

const cache = new Map();
export function once(key, make) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
}

export const geo = once;

export function mat(color, o = {}) {
  return once(`mat:${color}:${JSON.stringify(o)}`, () => new THREE.MeshStandardMaterial({ color, roughness: 0.55, ...o }));
}

export const FONT = '"Fredoka", system-ui, sans-serif';

// A texture painted on a 2D canvas: paint(c, w, h).
export function canvasTexture(key, w, h, paint, repeat = false) {
  return once(`tex:${key}`, () => {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    paint(cv.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  });
}

export function mesh(geometry, material, { cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

// Words on a transparent plane, `w` x `h` meters, facing +z.
export function labelPlane(str, w, h, color = '#2b1d17', size = 0.62) {
  const tex = canvasTexture(`label:${str}:${color}:${size}`, 512, Math.round((512 * h) / w), (c, cw, ch) => {
    c.font = `700 ${Math.round(ch * size)}px ${FONT}`;
    c.fillStyle = color;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(str, cw / 2, ch / 2 + ch * 0.04, cw * 0.92);
  });
  const material = once(`labelmat:${str}:${color}:${size}`, () => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  return new THREE.Mesh(geo(`plane:${w}:${h}`, () => new THREE.PlaneGeometry(w, h)), material);
}

export function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

// The mouse pointer as a chunky 3D shape with a black outline. Its tip is at
// the group's origin, pointing up and to the left, facing +z.
export function cursor3d() {
  const g = new THREE.Group();
  const shape = once('cursor:geo', () => {
    const pts = [[0, 0], [0, 22], [5.5, 17], [9.5, 26], [13, 24.5], [9, 15.5], [16, 15.5]];
    const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, -y)));
    const geometry = new THREE.ExtrudeGeometry(s, { depth: 2.4, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 3 });
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    geometry.translate(-center.x, -center.y, -center.z);
    return { geometry, center };
  });
  const body = mesh(shape.geometry, mat('#ffffff', { roughness: 0.25 }));
  const line = mesh(shape.geometry, once('cursor:line', () => new THREE.MeshBasicMaterial({ color: '#111111', side: THREE.BackSide })), { cast: false });
  line.scale.setScalar(1.09);
  for (const m of [body, line]) {
    m.position.copy(shape.center);
    g.add(m);
  }
  g.scale.setScalar(0.075);
  return g;
}
