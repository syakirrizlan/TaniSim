// TaniSim build mode: drag farm items from the tray onto a 1 m grid.
// World units are metres. Items are axis-aligned rectangles (rotation in 90° steps)
// stored by centre, so overlap checks stay simple and exact.

const S = 10; // screen px per metre at zoom 1
const SNAP = 0.5;
const STORE = 'tanisim.layout.v1';
const E = 1e-6;

const CATALOG = [
  { cat: 'Growing', items: [
    { type: 'bed', name: 'Raised bed', kind: 'bed', w: 1.2, d: 6, h: 0.35, resize: true },
    { type: 'bed-chilli', name: 'Cili padi bed', kind: 'bed', crop: 'chilli', w: 1.2, d: 6, h: 0.35, resize: true },
    { type: 'bed-greens', name: 'Greens bed', kind: 'bed', crop: 'greens', w: 1.2, d: 6, h: 0.35, resize: true },
    { type: 'bed-serai', name: 'Serai bed', kind: 'bed', crop: 'serai', w: 1.2, d: 6, h: 0.35, resize: true },
    { type: 'bed-herbs', name: 'Ulam & herb bed', kind: 'bed', crop: 'herbs', w: 1.2, d: 6, h: 0.35, resize: true },
    { type: 'trellis', name: 'Trellis', kind: 'fence', w: 0.3, d: 4, h: 1.8, color: '#9C7B55', resize: true },
    { type: 'field', name: 'Staple field', kind: 'zone', w: 20, d: 14, fill: '#CDB78A', rows: '#6E9E4A', resize: true },
    { type: 'paddy', name: 'Paddy plot', kind: 'zone', w: 14, d: 10, fill: '#8FBF73', rows: '#5E9A55', wet: true, resize: true },
  ] },
  { cat: 'Trees', items: [
    { type: 'fruit-tree', name: 'Fruit tree', kind: 'tree', style: 'round', w: 4, d: 4, h: 4.5, canopy: '#3C7A52' },
    { type: 'banana', name: 'Banana clump', kind: 'tree', style: 'banana', w: 3, d: 3, h: 3.2, canopy: '#7DBA4A' },
    { type: 'coconut', name: 'Coconut palm', kind: 'tree', style: 'palm', w: 4, d: 4, h: 7, canopy: '#5E9A3A' },
    { type: 'rubber', name: 'Rubber tree', kind: 'tree', style: 'round', w: 5, d: 5, h: 6, canopy: '#2F6640' },
    { type: 'durian', name: 'Durian tree', kind: 'tree', style: 'round', w: 7, d: 7, h: 9, canopy: '#46743A' },
    { type: 'bamboo', name: 'Bamboo clump', kind: 'tree', style: 'bamboo', w: 3, d: 3, h: 7, canopy: '#7FAF4A' },
    { type: 'pandan', name: 'Pandan row', kind: 'hedge', w: 1, d: 5, h: 0.9, color: '#4E9A4A', resize: true },
  ] },
  { cat: 'Buildings', items: [
    { type: 'hut', name: 'Hut', kind: 'building', w: 4, d: 3, h: 2.6, wall: '#E7D9C1', roof: '#8C9BA5' },
    { type: 'greenhouse', name: 'Greenhouse', kind: 'greenhouse', w: 5, d: 10, h: 2.4, resize: true },
    { type: 'shadehouse', name: 'Shade-net house', kind: 'shadehouse', w: 4, d: 6, h: 2.2, resize: true },
    { type: 'pondok', name: 'Pondok (open hut)', kind: 'pondok', w: 3, d: 3, h: 2.3 },
    { type: 'stall', name: 'Farm stall', kind: 'building', w: 3, d: 2, h: 2.2, wall: '#DCC9B2', roof: '#C8302A' },
    { type: 'rabbitry', name: 'Rabbitry', kind: 'building', w: 5, d: 3, h: 2.4, wall: '#EFE6D6', roof: '#8C9BA5' },
    { type: 'coop', name: 'Chicken coop', kind: 'building', w: 3, d: 2, h: 1.8, wall: '#C99E6B', roof: '#7B4B2A' },
    { type: 'duck', name: 'Duck house', kind: 'building', w: 2, d: 2, h: 1.3, wall: '#D8B98A', roof: '#5E7F8F' },
    { type: 'shed', name: 'Tool shed', kind: 'building', w: 2.5, d: 2, h: 2.2, wall: '#B9A88C', roof: '#6C7A82' },
    { type: 'mushroom', name: 'Mushroom house', kind: 'building', w: 4, d: 6, h: 2.4, wall: '#E3D7C0', roof: '#5E6B5E', resize: true },
    { type: 'goat', name: 'Goat shed', kind: 'building', w: 4, d: 3, h: 2.2, wall: '#B58A5C', roof: '#6E7F86' },
    { type: 'nursery', name: 'Nursery bench', kind: 'box', w: 3, d: 1, h: 0.9, color: '#B08A5E', top: '#7DAA5E' },
  ] },
  { cat: 'Water', items: [
    { type: 'well', name: 'Well', kind: 'well', w: 1.6, d: 1.6, h: 2.6 },
    { type: 'pond', name: 'Fish pond', kind: 'water', w: 10, d: 8, resize: true },
    { type: 'fishtank', name: 'Tarpaulin fish tank', kind: 'cyl', w: 3, d: 3, h: 1, color: '#2F6FA8', top: '#4F9BC9', water: true },
    { type: 'tank', name: 'Water tank', kind: 'cyl', w: 2, d: 2, h: 2, color: '#3E5A48', top: '#56705F' },
    { type: 'drain', name: 'Drain', kind: 'water', w: 0.6, d: 10, resize: true },
    { type: 'ibc', name: 'IBC tank', kind: 'box', w: 1.2, d: 1, h: 1.2, color: '#DCE3E6', top: '#F1F4F5' },
  ] },
  { cat: 'Animals', items: [
    { type: 'tractor', name: 'Chicken tractor', kind: 'box', w: 3, d: 1.5, h: 1, color: '#C99E6B', top: '#A9B7A0' },
    { type: 'hive', name: 'Kelulut hive', kind: 'box', w: 0.6, d: 0.6, h: 1, color: '#8A6A4A', top: '#C9A46A' },
  ] },
  { cat: 'Fences', items: [
    { type: 'fence', name: 'Wooden fence', kind: 'fence', style: 'wood', w: 0.15, d: 10, h: 1.2, resize: 'long' },
    { type: 'fence-barbed', name: 'Barbed-wire fence', kind: 'fence', style: 'barbed', w: 0.15, d: 10, h: 1.3, resize: 'long' },
    { type: 'fence-electric', name: 'Electric fence', kind: 'fence', style: 'electric', w: 0.15, d: 10, h: 1.1, resize: 'long' },
    { type: 'fence-chain', name: 'Chain-link fence', kind: 'fence', style: 'chain', w: 0.15, d: 10, h: 1.8, resize: 'long' },
    { type: 'fence-brc', name: 'BRC mesh fence', kind: 'fence', style: 'brc', w: 0.15, d: 10, h: 1.6, resize: 'long' },
    { type: 'fence-bamboo', name: 'Bamboo fence', kind: 'fence', style: 'bamboo', w: 0.15, d: 10, h: 1.6, resize: 'long' },
    { type: 'fence-picket', name: 'Picket fence', kind: 'fence', style: 'picket', w: 0.15, d: 10, h: 1.0, resize: 'long' },
    { type: 'wall', name: 'Brick wall', kind: 'fence', style: 'wall', w: 0.25, d: 10, h: 1.8, resize: 'long' },
    { type: 'hedge-fence', name: 'Living hedge (pagar hidup)', kind: 'fence', style: 'hedge', w: 0.8, d: 10, h: 1.4, resize: 'long' },
    { type: 'gate', name: 'Gate', kind: 'fence', style: 'gate', w: 0.2, d: 3, h: 1.6 },
  ] },
  { cat: 'Paths & utility', items: [
    { type: 'path', name: 'Path', kind: 'zone', w: 1.2, d: 10, fill: '#D9C7A3', resize: true },
    { type: 'road', name: 'Village road', kind: 'zone', w: 5, d: 40, fill: '#7B7F82', road: true, resize: true },
    { type: 'compost', name: 'Compost bays', kind: 'box', w: 3, d: 1.5, h: 1, color: '#6B4F35', top: '#4E3A27' },
    { type: 'solar', name: 'Solar panel', kind: 'box', w: 2, d: 1, h: 0.12, z0: 0.8, color: '#33506E', top: '#2B4A6B' },
    { type: 'sensor', name: 'Sensor (ESP32)', kind: 'box', w: 0.5, d: 0.5, h: 1.2, color: '#C8302A', top: '#E5574F' },
  ] },
];
const TYPES = Object.fromEntries(CATALOG.flatMap((c) => c.items.map((i) => [i.type, { ...i, cat: c.cat }])));

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const snap = (v) => Math.round(v / SNAP) * SNAP;
const fmt = (v) => (Math.round(v * 10) / 10).toString();
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- State ---------------- */
const rectPts = (w, h) => [[0, 0], [w, 0], [w, h], [0, h]];
let st = { plot: { pts: rectPts(80, 66) }, items: [] };
let pivot = [40, 33]; // camera turns around this point; changed only by setPivot()
let cam = { t: 1, angle: 0, zoom: 1, tx: 0, ty: 0 };
let ui = null;
let undoStack = [];
let redoStack = [];
let els = null;
let colors = {};
let cleanup = [];

function freshUI() {
  return {
    sel: null, drag: null, place: null, pointers: new Map(), pinch: null,
    animating: false, plops: new Map(), shakes: new Map(), puffs: [], cat: 0, raf: 0, saveTimer: 0,
  };
}

/* ---------------- Geometry & projection ---------------- */
function dims(it) { return (it.rot / 90) % 2 ? [it.d, it.w] : [it.w, it.d]; }
function rectOf(it) {
  const [ew, ed] = dims(it);
  return { x0: it.x - ew / 2, y0: it.y - ed / 2, x1: it.x + ew / 2, y1: it.y + ed / 2 };
}
const cornersOf = (r) => [[r.x0, r.y0], [r.x1, r.y0], [r.x1, r.y1], [r.x0, r.y1]];
const inset = (r, k) => ({ x0: r.x0 + k, y0: r.y0 + k, x1: r.x1 - k, y1: r.y1 - k });

function rot2(x, y) {
  const [cx, cy] = pivot;
  const a = (cam.angle * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const dx = x - cx, dy = y - cy;
  return [dx * c - dy * s, dx * s + dy * c];
}
function unrot2(rx, ry) {
  const [cx, cy] = pivot;
  const a = (-cam.angle * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [rx * c - ry * s + cx, rx * s + ry * c + cy];
}
// Plan (t=0) is top-down; 3D (t=1) is an isometric diorama. In-between values animate the switch.
function proj(x, y, z = 0) {
  const [rx, ry] = rot2(x, y);
  const t = cam.t;
  const px = (1 - t) * rx + t * (rx - ry) * 0.866;
  const py = (1 - t) * ry + t * (rx + ry) * 0.5 - t * z;
  return [px * S, py * S];
}
function unproj(sx, sy) {
  const px = sx / S, py = sy / S;
  let rx, ry;
  if (cam.t < 0.5) { rx = px; ry = py; } else {
    const a = px / 0.866, b = py / 0.5;
    rx = (a + b) / 2; ry = (b - a) / 2;
  }
  return unrot2(rx, ry);
}
function clientToWorld(cx, cy) {
  const r = els.svg.getBoundingClientRect();
  return unproj((cx - r.left - cam.tx) / cam.zoom, (cy - r.top - cam.ty) / cam.zoom);
}
/* Land polygon helpers. Vertices go the same way round as cornersOf (positive signed area). */
function polyArea(p) {
  let a = 0;
  for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; }
  return a / 2;
}
function polyBox(p) {
  const xs = p.map((v) => v[0]), ys = p.map((v) => v[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}
function pointInPoly(x, y, p) {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const orient = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
function segsCross(a, b, c, d) {
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
  return o1 * o2 < -1e-12 && o3 * o4 < -1e-12;
}
// A rectangle is on the land if its (slightly shrunk) corners are inside and no land edge cuts through it.
function rectInPoly(r, p) {
  const q = inset(r, 1e-3);
  const c = cornersOf(q);
  if (!c.every(([x, y]) => pointInPoly(x, y, p))) return false;
  if (p.some(([x, y]) => x > q.x0 && x < q.x1 && y > q.y0 && y < q.y1)) return false;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    for (let k = 0; k < 4; k++) if (segsCross(a, b, c[k], c[(k + 1) % 4])) return false;
  }
  return true;
}
// Point c lies on segment a-b (collinear and inside its extent).
function onSeg(a, b, c) {
  if (Math.abs(orient(a, b, c)) > 1e-9) return false;
  return c[0] >= Math.min(a[0], b[0]) - 1e-9 && c[0] <= Math.max(a[0], b[0]) + 1e-9
    && c[1] >= Math.min(a[1], b[1]) - 1e-9 && c[1] <= Math.max(a[1], b[1]) + 1e-9;
}
// True when the land outline is not a simple shape: sides cross, touch, fold back
// over each other, or two corners sit (almost) on the same spot.
function selfCrosses(p) {
  const n = p.length;
  if (n < 3) return true;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1]) < 0.25) return true;
    }
  }
  for (let i = 0; i < n; i++) {
    // A corner whose two sides double back along the same line makes a zero-width spike.
    const a = p[(i - 1 + n) % n], b = p[i], c = p[(i + 1) % n];
    if (Math.abs(orient(a, b, c)) < 1e-9 && (a[0] - b[0]) * (c[0] - b[0]) + (a[1] - b[1]) * (c[1] - b[1]) > 0) return true;
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue; // neighbouring sides share a corner
      const a = p[i], b = p[(i + 1) % n], c = p[j], d = p[(j + 1) % n];
      if (segsCross(a, b, c, d) || onSeg(a, b, c) || onSeg(a, b, d) || onSeg(c, d, a) || onSeg(c, d, b)) return true;
    }
  }
  return false;
}
function circlePoly(cx, cy, R, n = 20) {
  const out = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; out.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
  return out;
}
// Keep the picture still on screen when the turning point moves.
function setPivot(x, y) {
  if (!els) { pivot = [x, y]; return; }
  const before = proj(0, 0, 0);
  pivot = [x, y];
  const after = proj(0, 0, 0);
  cam.tx += (before[0] - after[0]) * cam.zoom;
  cam.ty += (before[1] - after[1]) * cam.zoom;
}

const pts = (list) => list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))));
  return '#' + ((1 << 24) | (ch(n >> 16) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255)).toString(16).slice(1);
}

/* ---------------- Drawing ---------------- */
// Camera-space facing of a horizontal normal: > 0 means it faces the viewer.
function facing(nx, ny) {
  const a = (cam.angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
  const rx = nx * ca - ny * sa, ry = nx * sa + ny * ca;
  return { k: rx + ry, side: rx - ry };
}
// Extrude a footprint polygon (any shape, same winding as cornersOf) from z0 up by h.
// `all` draws the hidden back faces too (for see-through walls).
function prism(poly, z0, h, top, side, extra = '', all = false) {
  let s = '';
  if (cam.t > 0.01 && h > 0.001) {
    const faces = [];
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length];
      const dx = q[0] - p[0], dy = q[1] - p[1];
      const len = Math.hypot(dx, dy);
      if (len < E) continue;
      const f = facing(dy / len, -dx / len);
      if (f.k <= 0.001 && !all) continue; // faces away from the viewer
      const light = 0.78 - 0.08 * Math.max(-1, Math.min(1, f.side / 1.414));
      const [mx, my] = rot2((p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
      faces.push({ d: mx + my, svg: `<polygon points="${pts([proj(p[0], p[1], z0), proj(q[0], q[1], z0), proj(q[0], q[1], z0 + h), proj(p[0], p[1], z0 + h)])}" fill="${shade(side, light)}" ${extra}/>` });
    }
    faces.sort((a, b) => a.d - b.d);
    s += faces.map((f) => f.svg).join('');
  }
  s += `<polygon points="${pts(poly.map((p) => proj(p[0], p[1], z0 + h)))}" fill="${top}" ${extra}/>`;
  return s;
}
const box = (r, z0, h, top, side, extra = '', all = false) => prism(cornersOf(r), z0, h, top, side, extra, all);
// All side walls (front and back), no top: for see-through structures with a roof.
const walls = (poly, z0, h, side, extra = '') => prism(poly, z0, h, 'none', side, extra, true).replace(/<polygon[^>]*fill="none"[^>]*\/>$/, '');

const roofRise = (r) => Math.min(1.4, 0.35 * Math.min(r.x1 - r.x0, r.y1 - r.y0));
// Pitched roof over rectangle r: eaves at height z, ridge along the long side.
function gable(r, z, color, endColor, extra = '') {
  const rise = roofRise(r);
  const zr = z + rise;
  const alongX = r.x1 - r.x0 >= r.y1 - r.y0;
  const P = (list) => pts(list.map((v) => proj(v[0], v[1], v[2])));
  let planes, ends;
  if (alongX) {
    const ym = (r.y0 + r.y1) / 2;
    planes = [
      { n: [0, -1], v: [[r.x0, r.y0, z], [r.x1, r.y0, z], [r.x1, ym, zr], [r.x0, ym, zr]] },
      { n: [0, 1], v: [[r.x0, r.y1, z], [r.x1, r.y1, z], [r.x1, ym, zr], [r.x0, ym, zr]] },
    ];
    ends = [
      { n: [-1, 0], v: [[r.x0, r.y0, z], [r.x0, r.y1, z], [r.x0, ym, zr]] },
      { n: [1, 0], v: [[r.x1, r.y0, z], [r.x1, r.y1, z], [r.x1, ym, zr]] },
    ];
  } else {
    const xm = (r.x0 + r.x1) / 2;
    planes = [
      { n: [-1, 0], v: [[r.x0, r.y0, z], [r.x0, r.y1, z], [xm, r.y1, zr], [xm, r.y0, zr]] },
      { n: [1, 0], v: [[r.x1, r.y0, z], [r.x1, r.y1, z], [xm, r.y1, zr], [xm, r.y0, zr]] },
    ];
    ends = [
      { n: [0, -1], v: [[r.x0, r.y0, z], [r.x1, r.y0, z], [xm, r.y0, zr]] },
      { n: [0, 1], v: [[r.x0, r.y1, z], [r.x1, r.y1, z], [xm, r.y1, zr]] },
    ];
  }
  planes.forEach((pl) => { pl.f = facing(pl.n[0], pl.n[1]); });
  planes.sort((a, b) => a.f.k - b.f.k);
  let s = `<polygon points="${P(planes[0].v)}" fill="${shade(color, 0.82)}" ${extra}/>`;
  if (cam.t > 0.01) {
    for (const en of ends) {
      const f = facing(en.n[0], en.n[1]);
      if (f.k > 0.001) s += `<polygon points="${P(en.v)}" fill="${shade(endColor, 0.8)}" ${extra}/>`;
    }
  }
  s += `<polygon points="${P(planes[1].v)}" fill="${color}" ${extra}/>`;
  return s;
}

function rowsAlongLongAxis(r, z, step, offset = step / 2) {
  const lines = [];
  const alongX = r.x1 - r.x0 >= r.y1 - r.y0;
  if (alongX) for (let y = r.y0 + offset; y < r.y1 - E; y += step) lines.push([proj(r.x0, y, z), proj(r.x1, y, z)]);
  else for (let x = r.x0 + offset; x < r.x1 - E; x += step) lines.push([proj(x, r.y0, z), proj(x, r.y1, z)]);
  return lines;
}
const lineTag = (l, stroke, w, extra = '') =>
  `<line x1="${l[0][0].toFixed(1)}" y1="${l[0][1].toFixed(1)}" x2="${l[1][0].toFixed(1)}" y2="${l[1][1].toFixed(1)}" stroke="${stroke}" stroke-width="${w}" ${extra}/>`;

function zoneSVG(T, r) {
  let s = `<polygon points="${pts(cornersOf(r).map((p) => proj(p[0], p[1], 0.02)))}" fill="${T.fill}" stroke="${shade(T.fill, 0.82)}" stroke-width="${0.12 * S}"/>`;
  if (T.wet) s += `<polygon points="${pts(cornersOf(inset(r, 0.4)).map((p) => proj(p[0], p[1], 0.02)))}" fill="#BFE0EA" opacity=".35"/>`;
  if (T.rows) s += rowsAlongLongAxis(r, 0.02, 1).map((l) => lineTag(l, T.rows, 0.2 * S, 'stroke-linecap="round" opacity=".85"')).join('');
  if (T.road) {
    const alongX = r.x1 - r.x0 >= r.y1 - r.y0;
    const l = alongX ? [proj(r.x0, (r.y0 + r.y1) / 2, 0.03), proj(r.x1, (r.y0 + r.y1) / 2, 0.03)]
      : [proj((r.x0 + r.x1) / 2, r.y0, 0.03), proj((r.x0 + r.x1) / 2, r.y1, 0.03)];
    s += lineTag(l, '#F1E9D2', 0.18 * S, `stroke-dasharray="${1.5 * S} ${1.5 * S}"`);
  }
  return s;
}

function waterSVG(r) {
  let s = `<polygon points="${pts(cornersOf(r).map((p) => proj(p[0], p[1], 0.02)))}" fill="#2F6F96"/>`;
  const k = Math.min(0.3, (Math.min(r.x1 - r.x0, r.y1 - r.y0)) / 4);
  s += `<polygon points="${pts(cornersOf(inset(r, k)).map((p) => proj(p[0], p[1], 0.03)))}" fill="#4F9BC9"/>`;
  if (Math.min(r.x1 - r.x0, r.y1 - r.y0) >= 2) {
    const ri = inset(r, Math.min(1.2, Math.min(r.x1 - r.x0, r.y1 - r.y0) / 4));
    s += `<polygon class="ripple" style="animation-delay:-${(performance.now() % 3000) / 1000}s" points="${pts(cornersOf(ri).map((p) => proj(p[0], p[1], 0.04)))}" fill="none" stroke="#A9D3EC" stroke-width="${0.14 * S}" stroke-dasharray="${0.8 * S} ${0.6 * S}" stroke-linecap="round"/>`;
  }
  return s;
}

function cropSVG(T, r) {
  if (!T.crop) return '';
  const z = T.h;
  const wx = r.x1 - r.x0, wy = r.y1 - r.y0;
  const alongX = wx >= wy;
  const across = Math.min(wx, wy), len = Math.max(wx, wy);
  const nAcross = across >= 0.9 ? 2 : 1;
  const step = T.crop === 'chilli' ? 0.6 : 0.5;
  const nAlong = Math.min(60, Math.max(1, Math.floor((len - 0.2) / step)));
  const startAlong = (len - (nAlong - 1) * step) / 2;
  let s = '';
  for (let i = 0; i < nAlong; i++) {
    for (let j = 0; j < nAcross; j++) {
      const a = startAlong + i * step;
      const b = nAcross === 1 ? across / 2 : across * (j === 0 ? 0.27 : 0.73);
      const x = alongX ? r.x0 + a : r.x0 + b;
      const y = alongX ? r.y0 + b : r.y0 + a;
      const [px, py] = proj(x, y, z);
      if (T.crop === 'chilli') {
        s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${0.24 * S}" fill="#3F8A4A"/><circle cx="${(px + 0.08 * S).toFixed(1)}" cy="${(py - 0.06 * S).toFixed(1)}" r="${0.1 * S}" fill="#E0352B"/>`;
      } else if (T.crop === 'greens') {
        s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${0.25 * S}" fill="#5DAA4B"/>`;
      } else if (T.crop === 'serai') {
        s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${0.22 * S}" fill="#B6CF78"/><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${0.08 * S}" fill="#7E9F48"/>`;
      } else {
        s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${0.2 * S}" fill="${(i + j) % 2 ? '#2F7A50' : '#78B86C'}"/>`;
      }
    }
  }
  return s;
}

function buildingSVG(T, r) {
  return box(r, 0, T.h, T.wall, T.wall) + gable(inset(r, -0.25), T.h, T.roof, T.wall);
}

function floorPlants(r, z = 0.05) {
  let s = '';
  const ri = inset(r, 0.5);
  if (ri.x1 <= ri.x0 || ri.y1 <= ri.y0) return s;
  for (const l of rowsAlongLongAxis(ri, z, 0.9, 0.2)) s += lineTag(l, '#5DAA4B', 0.32 * S, 'stroke-linecap="round" stroke-dasharray="3 5"');
  return s;
}

function greenhouseSVG(T, r) {
  const glass = 'fill-opacity=".42" stroke="#FFFFFF" stroke-opacity=".8" stroke-width="' + 0.06 * S + '"';
  return `<polygon points="${pts(cornersOf(r).map((p) => proj(p[0], p[1], 0.02)))}" fill="#C9B48E"/>` + floorPlants(r)
    + walls(cornersOf(r), 0, T.h, '#CFE6EC', glass)
    + gable(r, T.h, '#E8F5F7', '#D6ECF1', glass);
}

function shadehouseSVG(T, r) {
  const net = 'fill-opacity=".38" stroke="#24382B" stroke-opacity=".5" stroke-width="' + 0.05 * S + '"';
  return `<polygon points="${pts(cornersOf(r).map((p) => proj(p[0], p[1], 0.02)))}" fill="#BCA98A"/>` + floorPlants(r)
    + box(r, 0, T.h, '#2F4F3A', '#3C5E46', net, true);
}

function postsSVG(r, z0, z1, k = 0.15) {
  const ri = inset(r, k);
  return cornersOf(ri).map((c) => lineTag([proj(c[0], c[1], z0), proj(c[0], c[1], z1)], '#6B4A2E', 0.16 * S, 'stroke-linecap="round"')).join('');
}

function pondokSVG(T, r) {
  const deck = inset(r, 0.1);
  return box(deck, 0, 0.5, '#B38A5A', '#8E6A44') + postsSVG(r, 0.5, T.h) + gable(inset(r, -0.3), T.h, '#A8875A', '#8C6B42');
}

function cylSVG(T, it, r) {
  const R = Math.min(r.x1 - r.x0, r.y1 - r.y0) / 2 * 0.96;
  const z0 = T.z0 || 0;
  let s = prism(circlePoly(it.x, it.y, R), z0, T.h, T.top, T.color);
  if (T.water) s += `<polygon points="${pts(circlePoly(it.x, it.y, R * 0.86).map((p) => proj(p[0], p[1], z0 + T.h + 0.01)))}" fill="#4F9BC9" stroke="#A9D3EC" stroke-width="${0.08 * S}"/>`;
  else s += `<polygon points="${pts(circlePoly(it.x, it.y, R * 0.35, 12).map((p) => proj(p[0], p[1], z0 + T.h + 0.01)))}" fill="${shade(T.top, 0.8)}"/>`;
  return s;
}

function wellSVG(T, it) {
  let s = prism(circlePoly(it.x, it.y, 0.7), 0, 0.8, '#B9B3A8', '#9C968B');
  s += `<polygon points="${pts(circlePoly(it.x, it.y, 0.45, 16).map((p) => proj(p[0], p[1], 0.81)))}" fill="#2F5F7A"/>`;
  s += lineTag([proj(it.x - 0.6, it.y, 0.8), proj(it.x - 0.6, it.y, 2.1)], '#6B4A2E', 0.14 * S, 'stroke-linecap="round"');
  s += lineTag([proj(it.x + 0.6, it.y, 0.8), proj(it.x + 0.6, it.y, 2.1)], '#6B4A2E', 0.14 * S, 'stroke-linecap="round"');
  s += lineTag([proj(it.x - 0.6, it.y, 1.75), proj(it.x + 0.6, it.y, 1.75)], '#8A6A4A', 0.1 * S);
  s += gable({ x0: it.x - 0.8, y0: it.y - 0.65, x1: it.x + 0.8, y1: it.y + 0.65 }, 2.1, '#8C5A3C', '#7A4C32');
  return s;
}

function star(cx, cy, R, r, n, rot = -Math.PI / 2) {
  const out = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    const rad = i % 2 ? r : R;
    out.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return pts(out);
}

function treeSVG(T, it, r) {
  const R = Math.min(r.x1 - r.x0, r.y1 - r.y0) / 2;
  const shadow = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    shadow.push(proj(it.x + 0.35 + Math.cos(a) * R * 0.92, it.y + 0.35 + Math.sin(a) * R * 0.92, 0.01));
  }
  if (T.style === 'bamboo') return bambooSVG(T, it, R);
  const crownZ = T.h * (T.style === 'palm' ? 0.92 : 0.7);
  const base = proj(it.x, it.y, 0), top = proj(it.x, it.y, crownZ);
  const rs = R * S * (1 - 0.12 * cam.t);
  let s = `<polygon points="${pts(shadow)}" fill="rgba(20,30,20,.22)"/>`;
  if (cam.t > 0.01) s += lineTag([base, top], '#6B4A2E', (T.style === 'palm' ? 0.28 : 0.38) * S, 'stroke-linecap="round"');
  const delay = `animation-delay:-${((performance.now() + it.x * 137) % 6000) / 1000}s`;
  s += `<g class="sway" style="${delay}">`;
  const [cx, cy] = top;
  if (T.style === 'palm') {
    s += `<polygon points="${star(cx, cy, rs, rs * 0.22, 9)}" fill="${T.canopy}" stroke="${shade(T.canopy, 0.7)}" stroke-width="${0.08 * S}" stroke-linejoin="round"/>`;
    s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(rs * 0.18).toFixed(1)}" fill="#8A6A3A"/>`;
  } else if (T.style === 'banana') {
    s += `<polygon points="${star(cx, cy, rs, rs * 0.5, 7)}" fill="${T.canopy}" stroke="${shade(T.canopy, 0.72)}" stroke-width="${0.08 * S}" stroke-linejoin="round"/>`;
    s += `<polygon points="${star(cx, cy, rs * 0.6, rs * 0.3, 7, 0)}" fill="${shade(T.canopy, 1.25)}"/>`;
  } else {
    s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rs.toFixed(1)}" fill="${T.canopy}" stroke="${shade(T.canopy, 0.72)}" stroke-width="${0.1 * S}"/>`;
    s += `<circle cx="${(cx - rs * 0.25).toFixed(1)}" cy="${(cy - rs * 0.28).toFixed(1)}" r="${(rs * 0.5).toFixed(1)}" fill="${shade(T.canopy, 1.22)}" opacity=".6"/>`;
  }
  return s + '</g>';
}

function bambooSVG(T, it, R) {
  let s = `<polygon points="${pts(circlePoly(it.x + 0.3, it.y + 0.3, R * 0.8, 14).map((p) => proj(p[0], p[1], 0.01)))}" fill="rgba(20,30,20,.2)"/>`;
  const delay = `animation-delay:-${((performance.now() + it.y * 211) % 6000) / 1000}s`;
  s += `<g class="sway" style="${delay}">`;
  const culms = [[-0.5, -0.3, -1.1, -0.6], [0.3, -0.4, 0.8, -1], [0, 0.4, 0.2, 1.1], [-0.3, 0.2, -1, 0.7], [0.5, 0.3, 1.2, 0.5]];
  for (const [bx, by, tx, ty] of culms) {
    s += lineTag([proj(it.x + bx * R * 0.5, it.y + by * R * 0.5, 0), proj(it.x + tx * R * 0.6, it.y + ty * R * 0.6, T.h)], '#8DB255', 0.16 * S, 'stroke-linecap="round"');
  }
  for (const [, , tx, ty] of culms) {
    const [cx, cy] = proj(it.x + tx * R * 0.6, it.y + ty * R * 0.6, T.h);
    s += `<polygon points="${star(cx, cy, R * S * 0.42, R * S * 0.12, 6)}" fill="${T.canopy}" opacity=".9"/>`;
  }
  return s + '</g>';
}

/* Fence styles, shared by fence items (drawn along their centre line) and the boundary fence
   (drawn along each side of the land, at any angle). */
const FENCE_STYLES = {
  wood: { name: 'Wooden fence', h: 1.2, t: 0.15, post: 2.4 },
  barbed: { name: 'Barbed-wire fence', h: 1.3, t: 0.15, post: 2.5 },
  electric: { name: 'Electric fence', h: 1.1, t: 0.15, post: 4 },
  chain: { name: 'Chain-link fence', h: 1.8, t: 0.15, post: 2.5 },
  brc: { name: 'BRC mesh fence', h: 1.6, t: 0.15, post: 2.5 },
  bamboo: { name: 'Bamboo fence', h: 1.6, t: 0.15, post: 2 },
  picket: { name: 'Picket fence', h: 1.0, t: 0.15, post: 2 },
  wall: { name: 'Brick wall', h: 1.8, t: 0.25, post: 3 },
  hedge: { name: 'Living hedge (pagar hidup)', h: 1.4, t: 0.8, post: 0 },
};

function slabAround(a, b, t) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (-(b[1] - a[1]) / L) * (t / 2), ny = ((b[0] - a[0]) / L) * (t / 2);
  const poly = [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]];
  return polyArea(poly) < 0 ? poly.reverse() : poly;
}

function fenceRun(a, b, style, h, t) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (L < 0.05) return '';
  const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
  const at = (sv, z) => proj(a[0] + ux * sv, a[1] + uy * sv, z);
  const ln = (s0, z0, s1, z1, stroke, w, extra = '') => lineTag([at(s0, z0), at(s1, z1)], stroke, w, extra);
  const plane = (z0, z1, fill, extra = '') => `<polygon points="${pts([at(0, z0), at(L, z0), at(L, z1), at(0, z1)])}" fill="${fill}" ${extra}/>`;
  const every = (step, cap, fn) => {
    const n = Math.min(cap, Math.max(1, Math.round(L / step)));
    let out = '';
    for (let i = 0; i <= n; i++) out += fn((i * L) / n, i);
    return out;
  };
  const posts = (step, color, w, top = h) => every(step, 400, (sv) => ln(sv, 0, sv, top, color, w, 'stroke-linecap="round"'));
  const hit = plane(0, h, 'transparent'); // easy to tap even where the fence is only wires
  // A footprint on the ground keeps every fence visible and tappable in Plan view.
  const foot = `<polygon points="${pts(slabAround(a, b, Math.max(t, 0.3)).map((v) => proj(v[0], v[1], 0.02)))}" fill="transparent"/>`;
  return foot + fenceBody();
  function fenceBody() {
  switch (style) {
    case 'wood':
      return plane(0.05, h, '#9A7652') + ln(0, 0.3, L, 0.3, '#7E5E40', 0.06 * S) + ln(0, h - 0.2, L, h - 0.2, '#7E5E40', 0.06 * S) + every(0.3, 300, (sv) => ln(sv, 0.05, sv, h, '#7E5E40', 0.03 * S))
        + posts(2.4, '#6B4A2E', 0.16 * S, h + 0.1);
    case 'barbed':
      return hit + posts(2.5, '#7A5A3C', 0.13 * S)
        + [0.35, 0.75, 1.15].map((z) => ln(0, z, L, z, '#8E9499', 0.04 * S) + ln(0, z, L, z, '#6F767B', 0.12 * S, `stroke-dasharray="${0.04 * S} ${0.3 * S}"`)).join('');
    case 'electric':
      return hit + posts(4, '#5E6B73', 0.09 * S)
        + [0.3, 0.62, 0.95].map((z) => ln(0, z, L, z, '#F0C23B', 0.05 * S)).join('')
        + every(4, 200, (sv) => [0.3, 0.62, 0.95].map((z) => { const [x, y] = at(sv, z); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${0.06 * S}" fill="#FFFFFF"/>`; }).join(''));
    case 'chain': {
      let mesh = '';
      const meshStep = Math.max(0.5, (L + h) / 300);
      for (let s0 = -h; s0 < L; s0 += meshStep) {
        const a0 = Math.max(s0, 0), a1 = Math.min(s0 + h, L);
        if (a1 > a0) mesh += ln(a0, a0 - s0, a1, a1 - s0, '#8E989E', 0.02 * S, 'opacity=".7"');
        const b0 = Math.max(s0, 0), b1 = Math.min(s0 + h, L);
        if (b1 > b0) mesh += ln(b0, h - (b0 - s0), b1, h - (b1 - s0), '#8E989E', 0.02 * S, 'opacity=".7"');
      }
      return plane(0, h, '#A9B3BA', 'fill-opacity=".22"') + mesh + posts(2.5, '#7D868C', 0.1 * S) + ln(0, h, L, h, '#7D868C', 0.06 * S);
    }
    case 'brc': {
      let grid = every(0.2, 400, (sv) => ln(sv, 0.05, sv, h - 0.1, '#B8C2C8', 0.025 * S));
      for (let z = 0.05; z < h; z += 0.3) grid += ln(0, z, L, z, '#B8C2C8', 0.025 * S);
      return hit + grid + ln(0, h - 0.1, L, h - 0.1, '#C9D2D7', 0.07 * S) + posts(2.5, '#9AA5AD', 0.1 * S);
    }
    case 'bamboo':
      return plane(0, h, '#B8A05C', 'fill-opacity=".35"') + every(0.1, 400, (sv, i) => ln(sv, 0, sv, h - (i % 3) * 0.06, i % 2 ? '#C9B26A' : '#AE9650', 0.09 * S))
        + ln(0, 0.4, L, 0.4, '#6E5A2E', 0.06 * S) + ln(0, h - 0.3, L, h - 0.3, '#6E5A2E', 0.06 * S);
    case 'picket':
      return hit + ln(0, 0.3, L, 0.3, '#E4DACB', 0.06 * S) + ln(0, 0.75, L, 0.75, '#E4DACB', 0.06 * S)
        + every(0.14, 400, (sv) => ln(sv, 0.08, sv, h, '#F4EFE6', 0.07 * S)) + posts(2, '#D8CDBA', 0.11 * S, h + 0.05);
    case 'wall':
      return prism(slabAround(a, b, t), 0, h, '#C9C2B6', '#B5776A') + prism(slabAround(a, b, t + 0.06), h, 0.08, '#9C968B', '#8F897F');
    case 'hedge': {
      let s2 = prism(slabAround(a, b, t), 0, h * 0.85, '#4A8B4E', '#3F7F45');
      s2 += every(0.6, 300, (sv) => { const [x, y] = at(sv, h * 0.85); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.36 * S).toFixed(1)}" fill="${'#5AA05E'}"/>`; });
      return s2;
    }
    case 'gate':
      return plane(0.1, h, '#6E7B84', 'fill-opacity=".2"') + every(0.25, 100, (sv) => ln(sv, 0.1, sv, h, '#7D8A93', 0.04 * S))
        + ln(0, 0.1, L, 0.1, '#5E6B73', 0.07 * S) + ln(0, h, L, h, '#5E6B73', 0.07 * S) + ln(0.1, 0.1, L - 0.1, h, '#5E6B73', 0.05 * S)
        + ln(0, 0, 0, h + 0.15, '#4C575E', 0.18 * S, 'stroke-linecap="round"') + ln(L, 0, L, h + 0.15, '#4C575E', 0.18 * S, 'stroke-linecap="round"');
    default:
      return plane(0, h, '#8A6A4A');
  }
  }
}

// A fence item runs along the long side of its footprint.
function fenceItemSVG(T, r) {
  const alongX = r.x1 - r.x0 >= r.y1 - r.y0;
  const cx = (r.x0 + r.x1) / 2, cy = (r.y0 + r.y1) / 2;
  let a = alongX ? [r.x0, cy] : [cx, r.y0];
  let b = alongX ? [r.x1, cy] : [cx, r.y1];
  // Draw from the far end to the near end so posts overlap the right way.
  const [ar, as] = rot2(a[0], a[1]), [br, bs] = rot2(b[0], b[1]);
  if (ar + as > br + bs) [a, b] = [b, a];
  return fenceRun(a, b, T.style, T.h, Math.min(r.x1 - r.x0, r.y1 - r.y0));
}

// The boundary fence follows every side of the land. Sides facing away are drawn
// before the items, sides facing the viewer after them.
// Move every corner of the land inward by k, mitred so neighbouring sides still meet
// (no gaps at inside corners, no overhang at outside corners).
function insetCorners(p, k) {
  const n = p.length;
  const normal = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[1] - a[1]) / L, -(b[0] - a[0]) / L]; };
  return p.map((v, i) => {
    const n1 = normal(p[(i - 1 + n) % n], v), n2 = normal(v, p[(i + 1) % n]);
    const denom = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    let mx = n1[0] + n2[0], my = n1[1] + n2[1];
    let f = denom > 1e-6 ? k / denom : k;
    // Very sharp corners: cap the mitre so the fence doesn't shoot off.
    if (Math.hypot(mx * f, my * f) > 4 * k) { const L = Math.hypot(mx, my) || 1; mx /= L; my /= L; f = 4 * k; }
    return [v[0] - mx * f, v[1] - my * f];
  });
}

// One drawable per side of the land, placed into the same back-to-front sort as items.
function boundarySides() {
  const style = st.plot.fence;
  if (!style || !Object.hasOwn(FENCE_STYLES, style)) return [];
  const F = FENCE_STYLES[style];
  const p = st.plot.pts;
  const q = insetCorners(p, F.t / 2 + 0.05);
  const sides = [];
  for (let i = 0; i < p.length; i++) {
    const a = q[i], b = q[(i + 1) % q.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 0.05) continue;
    const P = p[i], Q = p[(i + 1) % p.length];
    const PL = Math.hypot(Q[0] - P[0], Q[1] - P[1]) || 1;
    const n = [(Q[1] - P[1]) / PL, -(Q[0] - P[0]) / PL]; // outward normal
    // Draw from the far end so posts overlap the right way.
    let [s0, s1] = [a, b];
    const [ar, as] = rot2(a[0], a[1]), [br, bs] = rot2(b[0], b[1]);
    if (ar + as > br + bs) [s0, s1] = [b, a];
    sides.push({ side: true, a, b, n, L, svg: () => `<g class="bfence">${fenceRun(s0, s1, style, F.h, F.t)}</g>` });
  }
  return sides;
}

function perimeter() {
  const p = st.plot.pts;
  let L = 0;
  for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; L += Math.hypot(q[0] - p[i][0], q[1] - p[i][1]); }
  return L;
}

function topZ(T, r) {
  if (T.kind === 'building') return T.h + (r ? roofRise(inset(r, -0.25)) : 1);
  if (T.kind === 'greenhouse') return T.h + (r ? roofRise(r) : 1);
  if (T.kind === 'pondok') return T.h + (r ? roofRise(inset(r, -0.3)) : 1);
  if (T.kind === 'well') return 2.6;
  if (T.kind === 'building') return T.h + 0.18;
  if (T.kind === 'tree') return T.h;
  if (T.kind === 'zone' || T.kind === 'water') return 0.05;
  return (T.z0 || 0) + (T.h || 0);
}

function labelSVG(it, T) {
  if (!it.label) return '';
  const [x, y] = proj(it.x, it.y, topZ(T, rectOf(it)) + 0.05);
  const big = ['building', 'zone', 'water', 'greenhouse', 'shadehouse', 'pondok'].includes(T.kind);
  const fs = (big ? 1.3 : 0.85) * S;
  return `<text class="lbl" x="${x.toFixed(1)}" y="${(y + fs * 0.35).toFixed(1)}" font-size="${fs}" text-anchor="middle" font-family="Barlow, Arial, sans-serif" font-weight="700" fill="#18241C" stroke="#FFFFFF" stroke-width="${fs * 0.28}" stroke-linejoin="round" paint-order="stroke">${esc(it.label)}</text>`;
}

function itemBody(it) {
  const T = TYPES[it.type];
  const r = rectOf(it);
  switch (T.kind) {
    case 'zone': return zoneSVG(T, r);
    case 'water': return waterSVG(r);
    case 'bed': return box(r, 0, T.h, '#8A6A4A', '#6E5136') + cropSVG(T, r);
    case 'box': return box(r, T.z0 || 0, T.h, T.top || T.color, T.color);
    case 'fence': return T.style ? fenceItemSVG(T, r) : box(r, 0, T.h, shade(T.color, 1.18), T.color);
    case 'hedge': return box(r, 0, T.h, shade(T.color, 1.18), T.color);
    case 'building': return buildingSVG(T, r);
    case 'greenhouse': return greenhouseSVG(T, r);
    case 'shadehouse': return shadehouseSVG(T, r);
    case 'pondok': return pondokSVG(T, r);
    case 'cyl': return cylSVG(T, it, r);
    case 'well': return wellSVG(T, it);
    case 'tree': return treeSVG(T, it, r);
    default: return '';
  }
}

function itemSVG(it, { cls = '', style = '' } = {}) {
  return `<g class="it ${cls}" data-id="${esc(it.id)}"${style ? ` style="${style}"` : ''}>${itemBody(it)}${labelSVG(it, TYPES[it.type])}</g>`;
}

function itemBounds(it) {
  const T = TYPES[it.type];
  const r = rectOf(it);
  const z = topZ(T, r);
  // Roofs overhang the walls, so the top of the bounds uses the roof's footprint.
  const rr = T.kind === 'building' ? inset(r, -0.25) : T.kind === 'pondok' ? inset(r, -0.3) : r;
  const list = [...cornersOf(r).map((p) => proj(p[0], p[1], 0)),
    ...cornersOf(rr).flatMap((p) => [proj(p[0], p[1], T.h || 0), proj(p[0], p[1], z)])];
  if (T.kind === 'tree') {
    const R = (Math.min(r.x1 - r.x0, r.y1 - r.y0) / 2) * S;
    const [cx, cy] = proj(it.x, it.y, T.h * 0.8);
    list.push([cx - R, cy - R], [cx + R, cy + R]);
  }
  return list;
}

function plotBounds() {
  return st.plot.pts.flatMap((p) => [proj(p[0], p[1], 0), proj(p[0], p[1], -1.2)]);
}

function bboxOf(list) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of list) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1 };
}

/* ---------------- Rules ---------------- */
const isSolid = (T) => T.kind !== 'zone';
const onLand = (it) => !isSolid(TYPES[it.type]) || rectInPoly(rectOf(it), st.plot.pts);
const overlap = (a, b) => a.x0 < b.x1 - E && b.x0 < a.x1 - E && a.y0 < b.y1 - E && b.y0 < a.y1 - E;
function fits(it) {
  const T = TYPES[it.type];
  if (!isSolid(T)) return true;
  const r = rectOf(it);
  if (!rectInPoly(r, st.plot.pts)) return false;
  const fenceLike = T.kind === 'fence' && T.style;
  return !st.items.some((o) => {
    if (o.id === it.id) return false;
    const O = TYPES[o.type];
    if (!isSolid(O)) return false;
    const ro = rectOf(o);
    if (fenceLike && O.kind === 'fence' && O.style) {
      // Fences may cross and join end to end, and a gate may sit in a fence line,
      // but two fences can't run along each other in the same place.
      if (!overlap(r, ro)) return false;
      if ((T.style === 'gate') !== (O.style === 'gate')) return false;
      const alongA = r.x1 - r.x0 >= r.y1 - r.y0, alongB = ro.x1 - ro.x0 >= ro.y1 - ro.y0;
      if (alongA !== alongB) return false;
      const shared = alongA ? Math.min(r.x1, ro.x1) - Math.max(r.x0, ro.x0) : Math.min(r.y1, ro.y1) - Math.max(r.y0, ro.y0);
      return shared > 0.5 + E;
    }
    return overlap(r, ro);
  });
}
function snapCenter(it, x, y) {
  const [ew, ed] = dims(it);
  return [snap(x - ew / 2) + ew / 2, snap(y - ed / 2) + ed / 2];
}
function findSpot(it, x, y) {
  const probe = { ...it };
  for (let ring = 0; ring <= 80; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        [probe.x, probe.y] = snapCenter(probe, x + dx, y + dy);
        if (fits(probe)) return [probe.x, probe.y];
      }
    }
  }
  return null;
}

/* ---------------- Render ---------------- */
// Back-to-front order for solids. Footprints are separated along a camera axis
// (the viewer looks from +rx+ry), so "A is behind B" is decided per pair from the
// rotated footprints, then resolved with a topological sort. The centre depth only
// breaks ties, so a long fence in front of a hut is drawn after the hut.
// Boundary-fence sides take part too: a side is drawn after the items on its inner
// side when it faces the viewer, and before them when it faces away. Items beyond the
// side's ends are left to the centre-depth tie-break.
function sideVsItem(sd, B) {
  const ux = (sd.b[0] - sd.a[0]) / sd.L, uy = (sd.b[1] - sd.a[1]) / sd.L;
  const it = B.it;
  const half = Math.max(it.w, it.d) / 2;
  const t = (it.x - sd.a[0]) * ux + (it.y - sd.a[1]) * uy;
  if (t < -half || t > sd.L + half) return 0;
  const inner = (it.x - sd.a[0]) * sd.n[0] + (it.y - sd.a[1]) * sd.n[1] < 0;
  const front = facing(sd.n[0], sd.n[1]).k > 0;
  return front === inner ? 1 : -1; // 1: item first, -1: side first
}
function depthOrder(items, sides = []) {
  const entries = [
    ...items.map((it) => {
      const c = cornersOf(rectOf(it)).map((p) => rot2(p[0], p[1]));
      const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]);
      const [cx, cy] = rot2(it.x, it.y);
      return { it, rx0: Math.min(...xs), rx1: Math.max(...xs), ry0: Math.min(...ys), ry1: Math.max(...ys), k: cx + cy };
    }),
    ...sides.map((sd) => {
      const [mx, my] = rot2((sd.a[0] + sd.b[0]) / 2, (sd.a[1] + sd.b[1]) / 2);
      return { sd, k: mx + my };
    }),
  ];
  const boxes = entries;
  const n = entries.length;
  const after = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  const T = 1e-4;
  for (let a = 0; a < n; a++) {
    for (let b = a + 1; b < n; b++) {
      const A = boxes[a], B = boxes[b];
      let first = -1;
      if (A.sd || B.sd) {
        if (A.sd && B.sd) continue;
        const r = A.sd ? sideVsItem(A.sd, B) : -sideVsItem(B.sd, A);
        // r is from the side's point of view when A is the side: 1 = item (B) first.
        if (A.sd) { if (r === 1) first = b; else if (r === -1) first = a; }
        else { if (r === -1) first = a; else if (r === 1) first = b; }
        if (first < 0) continue;
        const second = first === a ? b : a;
        after[first].push(second);
        indeg[second]++;
        continue;
      }
      if (A.rx1 <= B.rx0 + T) first = a;
      else if (B.rx1 <= A.rx0 + T) first = b;
      else if (A.ry1 <= B.ry0 + T) first = a;
      else if (B.ry1 <= A.ry0 + T) first = b;
      if (first < 0) continue;
      const second = first === a ? b : a;
      after[first].push(second);
      indeg[second]++;
    }
  }
  const out = [];
  const done = new Array(n).fill(false);
  for (let step = 0; step < n; step++) {
    let pick = -1;
    for (let i = 0; i < n; i++) if (!done[i] && indeg[i] === 0 && (pick < 0 || boxes[i].k < boxes[pick].k)) pick = i;
    if (pick < 0) { // cycle (only possible mid-rotation): fall back to centre depth
      boxes.map((b, i) => i).filter((i) => !done[i]).sort((x, y) => boxes[x].k - boxes[y].k).forEach((i) => out.push(boxes[i].sd || boxes[i].it));
      return out;
    }
    done[pick] = true;
    out.push(boxes[pick].sd || boxes[pick].it);
    for (const j of after[pick]) indeg[j]--;
  }
  return out;
}

// Resize knobs sit just outside the item, so a finger on the item itself always moves it.
function handlePositions(sel) {
  const r = rectOf(sel);
  const off = 22 / cam.zoom;
  let axes = [['x', r.x1, sel.y, 1, 0], ['y', sel.x, r.y1, 0, 1]];
  if (TYPES[sel.type].resize === 'long') axes = axes.filter(([ax]) => ax === (r.x1 - r.x0 >= r.y1 - r.y0 ? 'x' : 'y'));
  return axes.map(([axis, hx, hy, ux, uy]) => {
    const [ex, ey] = proj(hx, hy, 0.06);
    const [ax, ay] = proj(hx + ux, hy + uy, 0.06);
    const len = Math.hypot(ax - ex, ay - ey) || 1;
    return { axis, ex, ey, kx: ex + ((ax - ex) / len) * off, ky: ey + ((ay - ey) / len) * off };
  });
}
function requestRender() {
  if (!ui || ui.raf) return;
  ui.raf = requestAnimationFrame(() => { ui.raf = 0; render(); });
}

function render() {
  if (!els) return;
  const now = performance.now();
  const out = [];
  const land = st.plot.pts;
  // Diorama slab: soil sides under the grass, in the land's real shape.
  out.push(prism(land, -1.2, 1.2, colors.grass, colors.soil));
  // Grid, clipped to the land
  const lb = polyBox(land);
  const gx0 = Math.floor(lb.x0), gx1 = Math.ceil(lb.x1), gy0 = Math.floor(lb.y0), gy1 = Math.ceil(lb.y1);
  const showMinor = cam.zoom * S >= 7;
  const gl = [];
  for (let x = gx0; x <= gx1; x += 1) {
    const major = ((x % 5) + 5) % 5 === 0;
    if (!major && !showMinor) continue;
    gl.push(lineTag([proj(x, gy0), proj(x, gy1)], major ? colors.gridMajor : colors.grid, (major ? 1.2 : 0.8) / cam.zoom));
  }
  for (let y = gy0; y <= gy1; y += 1) {
    const major = ((y % 5) + 5) % 5 === 0;
    if (!major && !showMinor) continue;
    gl.push(lineTag([proj(gx0, y), proj(gx1, y)], major ? colors.gridMajor : colors.grid, (major ? 1.2 : 0.8) / cam.zoom));
  }
  out.push(`<clipPath id="landclip"><polygon points="${pts(land.map((p) => proj(p[0], p[1], 0)))}"/></clipPath>`);
  out.push(`<g class="grid" clip-path="url(#landclip)">${gl.join('')}</g>`);

  const fx = (it) => {
    const opts = {};
    const p = ui.plops.get(it.id);
    if (p && now - p < 650) { opts.cls = 'plop'; opts.style = `animation-delay:-${Math.round(now - p)}ms`; }
    const sh = ui.shakes.get(it.id);
    if (sh && now - sh < 450) { opts.cls = 'shake'; opts.style = `animation-delay:-${Math.round(now - sh)}ms`; }
    if (ui.drag && ui.drag.id === it.id && ui.drag.mode !== 'pan') opts.cls = (opts.cls || '') + (ui.drag.valid === false ? ' bad' : ' lifted');
    else if (!onLand(it)) opts.cls = (opts.cls || '') + ' bad';
    return opts;
  };

  const zones = st.items.filter((i) => !isSolid(TYPES[i.type]))
    .sort((a, b) => b.w * b.d - a.w * a.d);
  const solids = depthOrder(st.items.filter((i) => isSolid(TYPES[i.type])), boundarySides());
  for (const it of zones) out.push(itemSVG(it, fx(it)));
  for (const it of solids) out.push(it.side ? it.svg() : itemSVG(it, fx(it)));

  // Selection outline + resize handles
  const sel = st.items.find((i) => i.id === ui.sel);
  if (sel) {
    const r = rectOf(sel);
    const T = TYPES[sel.type];
    const bad = ui.drag && ui.drag.id === sel.id && ui.drag.valid === false;
    out.push(`<polygon class="sel-ring${bad ? ' bad' : ''}" points="${pts(cornersOf(r).map((p) => proj(p[0], p[1], 0.06)))}" fill="none" stroke-width="${2.5 / cam.zoom}" stroke-dasharray="${7 / cam.zoom} ${5 / cam.zoom}"/>`);
    if (T.resize && !(ui.drag && ui.drag.mode === 'move')) {
      for (const { axis, ex, ey, kx: px, ky: py } of handlePositions(sel)) {
        out.push(`<g class="handle" data-handle="${axis}"><line x1="${ex.toFixed(1)}" y1="${ey.toFixed(1)}" x2="${px.toFixed(1)}" y2="${py.toFixed(1)}" stroke="#F2B33D" stroke-width="${2 / cam.zoom}"/><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${14 / cam.zoom}" fill="transparent"/><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${8 / cam.zoom}" fill="#FFFFFF" stroke="#1E4A33" stroke-width="${2.5 / cam.zoom}"/><path d="M${(px - 3.5 / cam.zoom).toFixed(1)} ${py.toFixed(1)}h${(7 / cam.zoom).toFixed(1)}M${px.toFixed(1)} ${(py - 3.5 / cam.zoom).toFixed(1)}v${(7 / cam.zoom).toFixed(1)}" stroke="#1E4A33" stroke-width="${1.6 / cam.zoom}"/></g>`);
      }
    }
  }

  if (ui.shape) out.push(shapeOverlay());

  // Ghost while dragging from the tray
  if (ui.place && ui.place.over) {
    const g = ui.place.item;
    const ok = fits(g);
    ui.place.valid = ok;
    out.push(`<g class="ghost">${itemSVG(g, { cls: 'ghost-item' })}<polygon points="${pts(cornersOf(rectOf(g)).map((p) => proj(p[0], p[1], 0.07)))}" fill="${ok ? 'rgba(80,200,120,.22)' : 'rgba(225,60,50,.28)'}" stroke="${ok ? '#3BB273' : '#E0352B'}" stroke-width="${2.5 / cam.zoom}"/></g>`);
  }

  // Dust puffs
  ui.puffs = ui.puffs.filter((p) => now - p.t0 < 700);
  for (const p of ui.puffs) {
    const [px, py] = proj(p.x, p.y, 0.1);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      out.push(`<circle class="puff" style="--dx:${(Math.cos(a) * 18).toFixed(1)}px;--dy:${(Math.sin(a) * 10).toFixed(1)}px;animation-delay:-${Math.round(now - p.t0)}ms" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${3.5 / Math.sqrt(cam.zoom)}" fill="${p.color}"/>`);
    }
  }

  els.world.innerHTML = out.join('');
  els.cam.setAttribute('transform', `translate(${cam.tx.toFixed(2)} ${cam.ty.toFixed(2)}) scale(${cam.zoom.toFixed(4)})`);
  renderStats();
}

function shapeOverlay() {
  const p = st.plot.pts;
  const z = 0.08;
  const bad = ui.drag && ui.drag.mode === 'vertex' && ui.drag.valid === false;
  let s = `<polygon class="land-edge${bad ? ' bad' : ''}" points="${pts(p.map((v) => proj(v[0], v[1], z)))}" fill="none" stroke-width="${3 / cam.zoom}"/>`;
  const fs = 12 / cam.zoom;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const [mx, my] = proj((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z);
    // Side length, pushed outward a little so it doesn't sit on the + knob.
    const nx = (b[1] - a[1]) / (len || 1), ny = -(b[0] - a[0]) / (len || 1);
    const [ox, oy] = proj((a[0] + b[0]) / 2 + nx, (a[1] + b[1]) / 2 + ny, z);
    const ol = Math.hypot(ox - mx, oy - my) || 1;
    const ux = (ox - mx) / ol, uy = (oy - my) / ol;
    const txt = `${fmt(len)} m`;
    const off = 14 / cam.zoom + Math.abs(ux) * (txt.length * fs * 0.3) + Math.abs(uy) * fs * 0.6;
    const lx = mx + ux * off, ly = my + uy * off;
    s += `<text class="edge-len" x="${lx.toFixed(1)}" y="${(ly + fs * 0.35).toFixed(1)}" font-size="${fs.toFixed(2)}" text-anchor="middle" font-family="Barlow, Arial, sans-serif" font-weight="700" fill="#18241C" stroke="#FFFFFF" stroke-width="${(fs * 0.3).toFixed(2)}" stroke-linejoin="round" paint-order="stroke">${txt}</text>`;
    s += `<g class="mid-knob" data-mid="${i}"><circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="${14 / cam.zoom}" fill="transparent"/><circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="${7 / cam.zoom}" fill="#FFFFFF" stroke="#1E4A33" stroke-width="${1.8 / cam.zoom}"/><path d="M${(mx - 3.5 / cam.zoom).toFixed(1)} ${my.toFixed(1)}h${(7 / cam.zoom).toFixed(1)}M${mx.toFixed(1)} ${(my - 3.5 / cam.zoom).toFixed(1)}v${(7 / cam.zoom).toFixed(1)}" stroke="#1E4A33" stroke-width="${1.6 / cam.zoom}"/></g>`;
  }
  p.forEach((v, i) => {
    const [x, y] = proj(v[0], v[1], z);
    const on = ui.shape.selV === i;
    s += `<g class="vertex${on ? ' on' : ''}" data-vertex="${i}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${18 / cam.zoom}" fill="transparent"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(on ? 10 : 8) / cam.zoom}" fill="${on ? '#E0352B' : '#F2B33D'}" stroke="#FFFFFF" stroke-width="${2.5 / cam.zoom}"/></g>`;
  });
  return s;
}

function renderStats() {
  const beds = st.items.filter((i) => TYPES[i.type].kind === 'bed');
  const bedArea = beds.reduce((a, i) => a + i.w * i.d, 0);
  const area = Math.abs(polyArea(st.plot.pts));
  const off = st.items.filter((i) => !onLand(i)).length;
  els.stats.innerHTML = `<b>${st.items.length}</b> items · <b>${beds.length}</b> beds (${fmt(bedArea)} m²) · land ${Math.round(area).toLocaleString('en-MY')} m² = <b>${(area / 4046.86).toFixed(2)}</b> ac${off ? ` · <span class="off">${off} off the land</span>` : ''}`;
  if (els.shapeBar) {
    els.shapeBar.hidden = !ui.shape;
    if (ui.shape) {
      const rm = els.shapeBar.querySelector('[data-act=rmcorner]');
      rm.disabled = ui.shape.selV == null || st.plot.pts.length <= 3;
    }
  }
  els.empty.hidden = st.items.length > 0 || !!ui.place;
  els.undo.disabled = !undoStack.length;
  els.redo.disabled = !redoStack.length;
}

/* ---------------- Camera ---------------- */
function viewSize() {
  const r = els.svg.getBoundingClientRect();
  return { w: r.width, h: r.height, left: r.left, top: r.top };
}
function fit(animate = false, itemsOnly = false) {
  const v = viewSize();
  if (!v.w || !v.h) return;
  const lb = polyBox(st.plot.pts);
  setPivot((lb.x0 + lb.x1) / 2, (lb.y0 + lb.y1) / 2);
  const b = bboxOf(itemsOnly && st.items.length ? st.items.flatMap(itemBounds) : [...plotBounds(), ...st.items.flatMap(itemBounds)]);
  const pad = itemsOnly ? 48 : 28;
  const zoom = Math.max(0.15, Math.min(6, Math.min((v.w - pad * 2) / (b.x1 - b.x0), (v.h - pad * 2) / (b.y1 - b.y0))));
  const target = { zoom, tx: (v.w - (b.x1 - b.x0) * zoom) / 2 - b.x0 * zoom, ty: (v.h - (b.y1 - b.y0) * zoom) / 2 - b.y0 * zoom };
  if (!animate || reduceMotion()) { Object.assign(cam, target); requestRender(); return; }
  const from = { zoom: cam.zoom, tx: cam.tx, ty: cam.ty };
  tween(380, (k) => {
    cam.zoom = from.zoom + (target.zoom - from.zoom) * k;
    cam.tx = from.tx + (target.tx - from.tx) * k;
    cam.ty = from.ty + (target.ty - from.ty) * k;
  });
}
function zoomAt(px, py, factor) {
  const nz = Math.max(0.15, Math.min(8, cam.zoom * factor));
  cam.tx = px - (px - cam.tx) * (nz / cam.zoom);
  cam.ty = py - (py - cam.ty) * (nz / cam.zoom);
  cam.zoom = nz;
  requestRender();
}
function tween(ms, step, done) {
  ui.animating = true;
  const t0 = performance.now();
  const ease = (k) => 1 - Math.pow(1 - k, 3);
  const frame = (now) => {
    if (!ui) return;
    const k = Math.min(1, (now - t0) / ms);
    step(ease(k));
    render();
    if (k < 1) requestAnimationFrame(frame);
    else { ui.animating = false; done && done(); saveSoon(); }
  };
  requestAnimationFrame(frame);
}
// Switch view or rotate while keeping the ground point at the screen centre still.
function moveCamera(target) {
  if (ui.animating) return;
  const v = viewSize();
  const [wx, wy] = clientToWorld(v.left + v.w / 2, v.top + v.h / 2);
  const from = { t: cam.t, angle: cam.angle };
  const apply = () => {
    const [px, py] = proj(wx, wy, 0);
    cam.tx = v.w / 2 - px * cam.zoom;
    cam.ty = v.h / 2 - py * cam.zoom;
  };
  if (reduceMotion()) { Object.assign(cam, target); cam.angle = ((cam.angle % 360) + 360) % 360; apply(); render(); syncViewButtons(); saveSoon(); return; }
  tween(480, (k) => {
    cam.t = from.t + ((target.t ?? from.t) - from.t) * k;
    cam.angle = from.angle + ((target.angle ?? from.angle) - from.angle) * k;
    apply();
  }, () => { cam.angle = ((cam.angle % 360) + 360) % 360; syncViewButtons(); });
  syncViewButtons(target.t);
}
function syncViewButtons(t = cam.t) {
  els.root.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.view) === Math.round(t))));
}

/* ---------------- History & storage ---------------- */
const snapshot = () => JSON.stringify({ plot: st.plot, items: st.items });
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 100) undoStack.shift();
  redoStack = [];
}
function restore(json) {
  const data = sanitize(JSON.parse(json));
  if (!data) return;
  st = data;
  if (ui.shape && ui.shape.selV != null && ui.shape.selV >= st.plot.pts.length) ui.shape.selV = null;
  if (!st.items.some((i) => i.id === ui.sel)) select(null);
  else select(ui.sel);
  requestRender();
  saveSoon();
}
function undo() { if (!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
function redo() { if (!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.items)) return null;
  const num = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : null);
  const pw = num(raw.plot?.w, 5, 500) ?? 80, ph = num(raw.plot?.h, 5, 500) ?? 66;
  let land = null;
  const rp = raw.plot && raw.plot.pts;
  if (Array.isArray(rp) && rp.length >= 3 && rp.length <= 100) {
    land = rp.map((v) => (Array.isArray(v) ? [num(v[0], -1000, 1000), num(v[1], -1000, 1000)] : [null, null]));
    if (land.some((v) => v[0] === null || v[1] === null) || Math.abs(polyArea(land)) < 1) land = null;
  }
  if (land) {
    // Drop repeated corners, including a closing corner that repeats the first one.
    const clean = [];
    for (const v of land) {
      const prev = clean[clean.length - 1];
      if (!prev || Math.hypot(prev[0] - v[0], prev[1] - v[1]) >= 0.25) clean.push(v);
    }
    while (clean.length > 3 && Math.hypot(clean[0][0] - clean[clean.length - 1][0], clean[0][1] - clean[clean.length - 1][1]) < 0.25) clean.pop();
    land = clean.length >= 3 && !selfCrosses(clean) && Math.abs(polyArea(clean)) >= 25 ? clean : null;
  }
  if (!land) land = rectPts(pw, ph);
  if (polyArea(land) < 0) land.reverse();
  const items = [];
  const seen = new Set();
  for (const r of raw.items.slice(0, 2000)) {
    if (!r || typeof r.type !== 'string' || !Object.hasOwn(TYPES, r.type)) continue;
    const x = num(r.x, -600, 1100), y = num(r.y, -600, 1100), w = num(r.w, 0.1, 500), d = num(r.d, 0.1, 500);
    if (x === null || y === null || w === null || d === null) continue;
    let id = typeof r.id === 'string' && /^[\w-]{1,40}$/.test(r.id) ? r.id : newId();
    if (seen.has(id)) id = newId();
    seen.add(id);
    const rot = [0, 90, 180, 270].includes(r.rot) ? r.rot : 0;
    const label = typeof r.label === 'string' ? r.label.slice(0, 24) : '';
    items.push({ id, type: r.type, x, y, w, d, rot, label });
  }
  const fence = typeof raw.plot?.fence === 'string' && Object.hasOwn(FENCE_STYLES, raw.plot.fence) ? raw.plot.fence : '';
  return { plot: { pts: land, fence }, items };
}

function saveSoon() {
  if (!ui) return;
  clearTimeout(ui.saveTimer);
  ui.saveTimer = setTimeout(save, 250);
}
function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({ v: 1, plot: st.plot, items: st.items, cam: { t: Math.round(cam.t), angle: ((Math.round(cam.angle / 90) * 90 % 360) + 360) % 360 } }));
  } catch { /* storage unavailable: layout lives for this session only */ }
}
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || 'null');
    const data = raw && sanitize(raw);
    if (data) st = data;
    const lb = polyBox(st.plot.pts);
    pivot = [(lb.x0 + lb.x1) / 2, (lb.y0 + lb.y1) / 2];
    if (raw && raw.cam) {
      cam.t = raw.cam.t === 0 ? 0 : 1;
      cam.angle = [0, 90, 180, 270].includes(raw.cam.angle) ? raw.cam.angle : 0;
    }
  } catch { /* ignore */ }
}

/* ---------------- Editing ---------------- */
function addItem(type, x, y, extra = {}) {
  const T = TYPES[type];
  const it = { id: newId(), type, x: 0, y: 0, w: T.w, d: T.d, rot: 0, label: '', ...extra };
  [it.x, it.y] = snapCenter(it, x, y);
  return it;
}
function commitNew(it) {
  pushUndo();
  st.items.push(it);
  celebrate(it);
  select(it.id, { reveal: true });
  saveSoon();
}
function celebrate(it) {
  if (reduceMotion()) { requestRender(); return; }
  ui.plops.set(it.id, performance.now());
  const T = TYPES[it.type];
  ui.puffs.push({ x: it.x, y: it.y, t0: performance.now(), color: T.kind === 'water' ? '#A9D3EC' : '#D8C6A2' });
  keepAnimating(700);
}
function keepAnimating(ms) {
  const end = performance.now() + ms;
  const loop = () => { if (!ui) return; render(); if (performance.now() < end) requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}
function shake(id) {
  if (reduceMotion()) return;
  ui.shakes.set(id, performance.now());
  keepAnimating(460);
}
function quickPlace(type) {
  const v = viewSize();
  const [cx, cy] = clientToWorld(v.left + v.w / 2, v.top + v.h / 2);
  const it = addItem(type, cx, cy);
  const spot = findSpot(it, cx, cy) || findSpot(it, pivot[0], pivot[1]);
  if (!spot) { toast('No room left on the plot for that.'); return; }
  [it.x, it.y] = spot;
  commitNew(it);
}
function rotateSel() {
  const it = st.items.find((i) => i.id === ui.sel);
  if (!it) return;
  const before = { ...it };
  it.rot = (it.rot + 90) % 360;
  [it.x, it.y] = snapCenter(it, it.x, it.y);
  if (!fits(it)) {
    Object.assign(it, before);
    shake(it.id);
    toast('No room to turn it here. Move it first.');
    return;
  }
  Object.assign(it, before);
  pushUndo();
  it.rot = (it.rot + 90) % 360;
  [it.x, it.y] = snapCenter(it, it.x, it.y);
  celebrate(it);
  renderInspector();
  saveSoon();
}
function duplicateSel() {
  const it = st.items.find((i) => i.id === ui.sel);
  if (!it) return;
  const copy = { ...it, id: newId() };
  const [ew] = dims(it);
  const spot = findSpot(copy, it.x + ew + 0.5, it.y);
  if (!spot) { toast('No room left for a copy.'); return; }
  [copy.x, copy.y] = spot;
  commitNew(copy);
}
function deleteSel() {
  const it = st.items.find((i) => i.id === ui.sel);
  if (!it) return;
  pushUndo();
  st.items = st.items.filter((i) => i.id !== it.id);
  if (!reduceMotion()) { ui.puffs.push({ x: it.x, y: it.y, t0: performance.now(), color: '#B9B2A2' }); keepAnimating(700); }
  select(null);
  saveSoon();
}
function select(id, { reveal = false } = {}) {
  ui.sel = id;
  els.inspector.classList.remove('show-label');
  renderInspector();
  els.root.classList.toggle('has-sel', !!st.items.find((i) => i.id === id));
  requestRender();
  if (reveal && id) requestAnimationFrame(() => requestAnimationFrame(() => revealSelected(id)));
}

// If the info card hides the selected item or its resize knob, slide the view up.
function revealSelected(id) {
  if (!els || !ui || ui.sel !== id || ui.drag || ui.animating) return;
  const g = els.world.querySelector(`[data-id="${CSS.escape(id)}"]`);
  if (!g || els.inspector.hidden) return;
  const it = g.getBoundingClientRect();
  let { left, right, top, bottom } = it;
  els.world.querySelectorAll('.handle').forEach((h) => {
    const r = h.getBoundingClientRect();
    left = Math.min(left, r.left); right = Math.max(right, r.right); top = Math.min(top, r.top); bottom = Math.max(bottom, r.bottom);
  });
  // The panel is a few floating parts; take the box around the visible ones.
  let pl = Infinity, pr = -Infinity, pt = Infinity, pb = -Infinity;
  els.inspector.querySelectorAll(':scope > *').forEach((c) => {
    const r = c.getBoundingClientRect();
    if (!r.width || !r.height) return;
    pl = Math.min(pl, r.left); pr = Math.max(pr, r.right); pt = Math.min(pt, r.top); pb = Math.max(pb, r.bottom);
  });
  if (!(pr > pl)) return;
  const hidden = left < pr + 8 && right > pl - 8 && top < pb + 8 && bottom > pt - 8;
  if (!hidden) return;
  const stage = els.svg.getBoundingClientRect();
  let dx = 0, dy = 0;
  const roomRight = stage.right - 64; // keep clear of the zoom buttons
  if (right + (pr + 16 - left) <= roomRight) dx = pr + 16 - left;
  else if (top + (pb + 16 - top) < stage.bottom - 40) dy = pb + 16 - top;
  else return;
  // A gentle slide that never blocks taps or drags (unlike camera turns).
  if (reduceMotion()) { cam.tx += dx; cam.ty += dy; requestRender(); saveSoon(); return; }
  const t0 = performance.now();
  let done = 0;
  const step = (now) => {
    if (!ui || ui.drag || ui.pinch) return; // the user took over
    const k = Math.min(1, (now - t0) / 300);
    const e = 1 - Math.pow(1 - k, 3);
    cam.tx += dx * (e - done);
    cam.ty += dy * (e - done);
    done = e;
    render();
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function sizeText(it) {
  const T = TYPES[it.type];
  if (T.kind === 'fence' && T.style) {
    const len = Math.max(it.w, it.d);
    const F = FENCE_STYLES[T.style];
    const posts = F && F.post ? ` · about ${Math.round(len / F.post) + 1} posts` : '';
    return `${fmt(len)} m ${T.style === 'gate' ? 'wide' : 'long'}${posts}${T.resize ? '<span class="hint"> · drag ⊕ to lengthen</span>' : ''}`;
  }
  return `${fmt(it.w)} × ${fmt(it.d)} m · ${fmt(it.w * it.d)} m²${T.resize ? '<span class="hint"> · drag ⊕ to resize</span>' : ''}`;
}

function renderInspector() {
  const it = st.items.find((i) => i.id === ui.sel);
  const box = els.inspector;
  if (!it) { box.hidden = true; return; }
  const T = TYPES[it.type];
  const blockC = /^C(\d{1,2})$/i.test(it.label || '');
  box.hidden = false;
  box.innerHTML = `
    <div class="insp-head">
      <div class="insp-title"><div class="insp-name">${esc(T.name)}</div><div class="insp-size">${sizeText(it)}</div></div>
      <button type="button" class="icon-btn" data-act="close" aria-label="Done">✕</button>
    </div>
    <label class="insp-label"><span>Label</span><input type="text" maxlength="24" placeholder="e.g. C1, Hut" value="${esc(it.label || '')}"></label>
    <div class="insp-actions">
      <button type="button" data-act="rotate" title="Rotate (R)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Rotate</span></button>
      <button type="button" data-act="copy" title="Copy"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16 4H6a2 2 0 0 0-2 2v10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg><span>Copy</span></button>
      <button type="button" data-act="labeltoggle" class="only-rail" title="Label" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Label</span></button>
      ${blockC ? '<a class="insp-link" href="#/notes/05a-block-c-cash-beds" title="Block C schedule"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 10h16M9 3v4M15 3v4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg><span>Block C schedule</span></a>' : ''}
      <button type="button" data-act="delete" class="danger" title="Delete (Del)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Delete</span></button>
    </div>`;
  const input = box.querySelector('input');
  let pushed = false;
  input.addEventListener('input', () => {
    if (!pushed) { pushUndo(); pushed = true; }
    it.label = input.value.slice(0, 24);
    requestRender();
    saveSoon();
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
  const lt = box.querySelector('[data-act=labeltoggle]');
  lt.addEventListener('click', () => {
    const open = !box.classList.contains('show-label');
    box.classList.toggle('show-label', open);
    lt.setAttribute('aria-expanded', String(open));
    if (open) input.focus();
  });
}

/* ---------------- Land shape mode ---------------- */
function enterShape() {
  if (ui.shape) return;
  if (ui.place) { ui.place = null; els.root.classList.remove('placing'); }
  select(null);
  ui.shape = { selV: null };
  els.root.classList.add('shaping');
  if (cam.t > 0.5) moveCamera({ t: 0 }); // corners are easiest to place from above
  requestRender();
}
function exitShape() {
  if (!ui.shape) return;
  ui.shape = null;
  els.root.classList.remove('shaping');
  fit(true);
  reportOffLand();
  requestRender();
}
function removeCorner() {
  const sh = ui.shape;
  if (!sh || sh.selV == null || st.plot.pts.length <= 3) return;
  const next = st.plot.pts.filter((_, i) => i !== sh.selV);
  if (selfCrosses(next) || Math.abs(polyArea(next)) < 25) { toast("Can't remove that corner: the sides would cross."); return; }
  pushUndo();
  st.plot = { ...st.plot, pts: next };
  sh.selV = null;
  saveSoon();
  requestRender();
}
function reportOffLand() {
  const off = st.items.filter((i) => !onLand(i)).length;
  if (off) toast(`${off} item${off > 1 ? 's are' : ' is'} now off the land (shown in red). Move ${off > 1 ? 'them' : 'it'} back on.`);
}

/* ---------------- Templates ---------------- */
function blockCStarter() {
  const items = [];
  const mk = (type, x0, y0, w, d, label = '') => {
    const it = { id: newId(), type, x: x0 + w / 2, y: y0 + d / 2, w, d, rot: 0, label };
    items.push(it);
  };
  // Only the stall frontage; stretch the road or path with their handles if needed.
  mk('road', 0, -5.5, 30, 5, 'Village road');
  mk('path', 0, 0, 30, 1.2);
  mk('stall', 1.5, 1.5, 3, 2, 'Stall');
  const lengths = [4.5, 5, 5, 5.5, 5.5, 6, 6, 6.5, 6.5, 7, 7];
  lengths.forEach((len, i) => {
    const type = i < 4 ? 'bed-chilli' : i < 9 ? 'bed-greens' : i === 9 ? 'bed-serai' : 'bed-herbs';
    mk(type, 6 + i * 2, 1.5, 1.2, len, `C${i + 1}`);
  });
  return items;
}

/* ---------------- Export / import ---------------- */
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function exportFile() {
  download(new Blob([JSON.stringify({ app: 'TaniSim', v: 1, plot: st.plot, items: st.items }, null, 2)], { type: 'application/json' }), 'tanisim-layout.json');
  toast('Layout file saved. Open it on another device with Import.');
}
async function importFile(file) {
  try {
    const data = sanitize(JSON.parse(await file.text()));
    if (!data) throw new Error('bad');
    pushUndo();
    st = data;
    select(null);
    fit(true);
    saveSoon();
    toast(`Imported ${data.items.length} items.`);
  } catch {
    toast("That file isn't a TaniSim layout.");
  }
}
function exportPNG() {
  const prevSel = ui.sel;
  ui.sel = null;
  render();
  const b = bboxOf([...plotBounds(), ...st.items.flatMap(itemBounds)]);
  const pad = 30;
  const w = b.x1 - b.x0 + pad * 2, h = b.y1 - b.y0 + pad * 2;
  const scale = Math.min(4, 2400 / w);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(w * scale)}" height="${Math.round(h * scale)}" viewBox="${b.x0 - pad} ${b.y0 - pad} ${w} ${h}"><rect x="${b.x0 - pad}" y="${b.y0 - pad}" width="${w}" height="${h}" fill="${colors.bg}"/>${els.world.innerHTML}</svg>`;
  ui.sel = prevSel;
  requestRender();
  const img = new Image();
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    c.toBlob((blob) => { if (blob) { download(blob, 'tanisim-layout.png'); toast('Picture saved.'); } }, 'image/png');
  };
  img.onerror = () => toast("Couldn't make the picture on this device.");
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* ---------------- Toast ---------------- */
let toastTimer = 0;
function toast(text) {
  const t = els.toast;
  t.textContent = text;
  t.hidden = false;
  t.classList.remove('show');
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { if (els) els.toast.hidden = true; }, 2600);
}

/* ---------------- Pointer input ---------------- */
function onStageDown(e) {
  if (ui.animating || ui.place) return;
  els.svg.setPointerCapture(e.pointerId);
  ui.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ui.pointers.size === 2) {
    // Second finger: cancel any drag and start pinch-zoom.
    if (ui.drag && (ui.drag.mode === 'move' || ui.drag.mode === 'resize' || ui.drag.mode === 'vertex')) cancelDrag();
    ui.drag = null;
    const [a, b] = [...ui.pointers.values()];
    ui.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
    return;
  }
  if (ui.pointers.size > 2) return;
  if (ui.shape) {
    const start = { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY };
    const vtx = e.target.closest('[data-vertex]');
    const mid = e.target.closest('[data-mid]');
    const w0 = clientToWorld(e.clientX, e.clientY);
    if (vtx) {
      const i = Number(vtx.dataset.vertex);
      ui.drag = { ...start, mode: 'vertex-pending', i, orig: st.plot.pts.map((v) => [...v]), base: [...st.plot.pts[i]], w0 };
    } else if (mid) {
      // Tap or drag a + knob: a new corner appears in the middle of that side.
      const i = Number(mid.dataset.mid);
      const p = st.plot.pts, a = p[i], b = p[(i + 1) % p.length];
      const v = [snap((a[0] + b[0]) / 2), snap((a[1] + b[1]) / 2)];
      const orig = p.map((q) => [...q]);
      const next = [...p.slice(0, i + 1), v, ...p.slice(i + 1)];
      if (selfCrosses(next)) { ui.drag = { ...start, mode: 'pan-pending', tap: null }; return; }
      pushUndo();
      st.plot = { ...st.plot, pts: next };
      ui.shape.selV = i + 1;
      ui.drag = { ...start, mode: 'vertex', i: i + 1, orig, base: [...v], w0, pushed: true, valid: true };
      requestRender();
    } else {
      ui.drag = { ...start, mode: 'pan-pending', tap: null };
    }
    return;
  }
  const handle = e.target.closest('[data-handle]');
  const g = e.target.closest('[data-id]');
  const start = { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY };
  if (handle && ui.sel) {
    const it = st.items.find((i) => i.id === ui.sel);
    ui.drag = { ...start, mode: 'resize-pending', id: it.id, axis: handle.dataset.handle, orig: { ...it }, w0: clientToWorld(e.clientX, e.clientY) };
  } else if (g) {
    const it = st.items.find((i) => i.id === g.dataset.id);
    if (!it) return;
    const solid = isSolid(TYPES[it.type]);
    if (solid || it.id === ui.sel) {
      ui.drag = { ...start, mode: 'move-pending', id: it.id, orig: { ...it }, w0: clientToWorld(e.clientX, e.clientY) };
    } else {
      ui.drag = { ...start, mode: 'pan-pending', tap: it.id };
    }
  } else {
    ui.drag = { ...start, mode: 'pan-pending', tap: null };
  }
}

function onStageMove(e) {
  if (!ui.pointers.has(e.pointerId)) return;
  ui.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ui.pinch && ui.pointers.size >= 2) {
    const [a, b] = [...ui.pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const v = viewSize();
    if (ui.pinch.dist > 0) zoomAt((a.x + b.x) / 2 - v.left, (a.y + b.y) / 2 - v.top, dist / ui.pinch.dist);
    ui.pinch.dist = dist;
    return;
  }
  const d = ui.drag;
  if (!d) return;
  const moved = Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 5;
  if (d.mode === 'pan-pending' && moved) d.mode = 'pan';
  if (d.mode === 'move-pending' && moved) {
    d.mode = 'move';
    pushUndo();
    d.pushed = true;
    if (ui.sel !== d.id) select(d.id);
    els.root.classList.add('dragging');
  }
  if (d.mode === 'resize-pending' && moved) { d.mode = 'resize'; pushUndo(); d.pushed = true; }
  if (d.mode === 'vertex-pending' && moved) { d.mode = 'vertex'; pushUndo(); d.pushed = true; ui.shape.selV = d.i; }
  if (d.mode === 'vertex') {
    const [wx, wy] = clientToWorld(e.clientX, e.clientY);
    const next = st.plot.pts.map((v) => [...v]);
    next[d.i] = [snap(d.base[0] + wx - d.w0[0]), snap(d.base[1] + wy - d.w0[1])];
    st.plot = { ...st.plot, pts: next };
    d.valid = !selfCrosses(next) && Math.abs(polyArea(next)) >= 25;
    requestRender();
  }

  if (d.mode === 'pan') {
    cam.tx += e.clientX - d.lx;
    cam.ty += e.clientY - d.ly;
    requestRender();
  } else if (d.mode === 'move') {
    const it = st.items.find((i) => i.id === d.id);
    if (!it) { ui.drag = null; return; }
    const [wx, wy] = clientToWorld(e.clientX, e.clientY);
    [it.x, it.y] = snapCenter(it, d.orig.x + wx - d.w0[0], d.orig.y + wy - d.w0[1]);
    d.valid = fits(it);
    requestRender();
  } else if (d.mode === 'resize') {
    const it = st.items.find((i) => i.id === d.id);
    if (!it) { ui.drag = null; return; }
    const [wx, wy] = clientToWorld(e.clientX, e.clientY);
    const r0 = rectOf(d.orig);
    const swapped = (it.rot / 90) % 2 === 1;
    if (d.axis === 'x') {
      const minX = TYPES[it.type].resize === 'long' ? r0.y1 - r0.y0 + SNAP : SNAP;
      const ew = Math.max(minX, Math.min(400, snap(r0.x1 - r0.x0 + wx - d.w0[0])));
      if (swapped) it.d = Math.round(ew * 1000) / 1000; else it.w = Math.round(ew * 1000) / 1000;
      it.x = r0.x0 + ew / 2;
    } else {
      const minY = TYPES[it.type].resize === 'long' ? r0.x1 - r0.x0 + SNAP : SNAP;
      const ed = Math.max(minY, Math.min(400, snap(r0.y1 - r0.y0 + wy - d.w0[1])));
      if (swapped) it.w = Math.round(ed * 1000) / 1000; else it.d = Math.round(ed * 1000) / 1000;
      it.y = r0.y0 + ed / 2;
    }
    d.valid = fits(it);
    renderInspectorSize(it);
    requestRender();
  }
  d.lx = e.clientX;
  d.ly = e.clientY;
}

function renderInspectorSize(it) {
  const el = els.inspector.querySelector('.insp-size');
  if (el) el.innerHTML = sizeText(it);
}

function cancelDrag() {
  const d = ui.drag;
  if (!d) return;
  if ((d.mode === 'move' || d.mode === 'resize') && d.orig) {
    const it = st.items.find((i) => i.id === d.id);
    if (it) Object.assign(it, d.orig);
    if (d.pushed) undoStack.pop();
  }
  if (d.mode === 'vertex' && d.orig) {
    st.plot = { ...st.plot, pts: d.orig };
    if (d.pushed) undoStack.pop();
  }
  ui.drag = null;
  els.root.classList.remove('dragging');
  requestRender();
}

function onStageUp(e) {
  ui.pointers.delete(e.pointerId);
  if (ui.pinch) {
    if (ui.pointers.size < 2) ui.pinch = null;
    ui.drag = null;
    saveSoon();
    return;
  }
  const d = ui.drag;
  ui.drag = null;
  els.root.classList.remove('dragging');
  if (!d) return;
  if (e.type === 'pointercancel') { ui.drag = d; cancelDrag(); return; }
  if (d.mode === 'vertex-pending') { ui.shape.selV = d.i; requestRender(); return; }
  if (d.mode === 'vertex') {
    if (d.valid === false) {
      st.plot = { ...st.plot, pts: d.orig };
      if (d.pushed) undoStack.pop();
      toast("The land's sides can't cross each other.");
    } else saveSoon();
    requestRender();
    return;
  }
  if (ui.shape && d.mode === 'pan-pending') { ui.shape.selV = null; requestRender(); return; }
  if (d.mode === 'move-pending') select(d.id, { reveal: true });
  else if (d.mode === 'pan-pending') select(d.tap, { reveal: true });
  else if (d.mode === 'move' || d.mode === 'resize') {
    const it = st.items.find((i) => i.id === d.id);
    if (it && !fits(it)) {
      Object.assign(it, d.orig);
      if (d.pushed) undoStack.pop();
      shake(it.id);
      toast(d.mode === 'move' ? "Doesn't fit there: it overlaps something or leaves the plot." : "Can't stretch it that far: something is in the way.");
    } else if (it) {
      if (d.mode === 'move' && !reduceMotion()) { ui.plops.set(it.id, performance.now()); keepAnimating(650); }
      renderInspector();
      saveSoon();
    }
  }
  saveSoon();
  requestRender();
}

function onWheel(e) {
  e.preventDefault();
  const v = viewSize();
  zoomAt(e.clientX - v.left, e.clientY - v.top, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
  saveSoon();
}

/* Dragging from the tray */
function onTrayDown(e) {
  const btn = e.target.closest('[data-type]');
  if (!btn || ui.animating || ui.shape) return;
  ui.trayPress = { type: btn.dataset.type, sx: e.clientX, sy: e.clientY, id: e.pointerId, btn };
}
function onWindowMove(e) {
  const p = ui.trayPress;
  if (p && !ui.place && e.pointerId === p.id) {
    const dy = e.clientY - p.sy, dx = e.clientX - p.sx;
    // Upward drag lifts an item out of the tray; sideways swipes keep scrolling the tray.
    if (dy < -10 && Math.abs(dy) > Math.abs(dx)) {
      ui.place = { item: addItem(p.type, 0, 0), over: false, valid: false, id: e.pointerId };
      els.root.classList.add('placing');
      select(null);
    }
  }
  if (ui.place && e.pointerId === ui.place.id) {
    e.preventDefault();
    const v = viewSize();
    const over = e.clientX >= v.left && e.clientX <= v.left + v.w && e.clientY >= v.top && e.clientY <= v.top + v.h;
    ui.place.over = over;
    if (over) {
      const g = ui.place.item;
      // Hold the item a little above the finger so it isn't hidden under it.
      const lift = e.pointerType === 'touch' ? 40 : 0;
      const [wx, wy] = clientToWorld(e.clientX, e.clientY - lift);
      [g.x, g.y] = snapCenter(g, wx, wy);
    }
    requestRender();
  }
}
function onWindowUp(e) {
  const p = ui.trayPress;
  if (ui.place && e.pointerId === ui.place.id) {
    const pl = ui.place;
    ui.place = null;
    ui.trayPress = null;
    els.root.classList.remove('placing');
    if (e.type !== 'pointercancel' && pl.over) {
      if (fits(pl.item)) commitNew(pl.item);
      else toast("Doesn't fit there: it overlaps something or leaves the plot.");
    }
    requestRender();
    return;
  }
  if (p && e.pointerId === p.id) {
    ui.trayPress = null;
    const moved = Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 8;
    if (e.type !== 'pointercancel' && !moved && p.btn.contains(e.target)) quickPlace(p.type);
  }
}

function onKey(e) {
  if (e.target.closest && e.target.closest('input, textarea, select, dialog')) return;
  if (e.key === 'Escape' && !els.menu.hidden) { closeMenu(true); return; }
  const busy = ui.place || ui.trayPress || (ui.drag && ['move', 'resize', 'move-pending', 'resize-pending', 'vertex', 'vertex-pending'].includes(ui.drag.mode));
  if (busy) {
    if (e.key === 'Escape') {
      if (ui.place) { ui.place = null; els.root.classList.remove('placing'); }
      ui.trayPress = null;
      cancelDrag();
      requestRender();
    }
    return;
  }
  if (ui.shape && !(e.ctrlKey || e.metaKey)) {
    if (e.key === 'Escape' || e.key === 'Enter') exitShape();
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeCorner(); }
    return;
  }
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (e.key === 'Escape') { select(null); return; }
  const it = st.items.find((i) => i.id === ui.sel);
  if (!it) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSel(); }
  else if (e.key.toLowerCase() === 'r' && !mod) rotateSel();
  else if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    // Arrows move along the screen direction in the current camera angle.
    const step = e.shiftKey ? 2 : SNAP;
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    const steps = Math.round(((cam.angle % 360) + 360) % 360 / 90) % 4;
    let [dx, dy] = dir;
    for (let i = 0; i < steps; i++) [dx, dy] = [dy, -dx];
    const before = { x: it.x, y: it.y };
    it.x += dx * step; it.y += dy * step;
    if (!fits(it)) { Object.assign(it, before); shake(it.id); return; }
    const after = { x: it.x, y: it.y };
    Object.assign(it, before); pushUndo(); Object.assign(it, after);
    requestRender(); saveSoon();
  }
}

function closeMenu(refocus) {
  els.menu.hidden = true;
  const btn = els.root.querySelector('[data-act=menu]');
  btn.setAttribute('aria-expanded', 'false');
  if (refocus) btn.focus();
}

/* ---------------- Mount ---------------- */
function readColors() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n, f) => (cs.getPropertyValue(n).trim() || f);
  colors = {
    grass: v('--lay-grass', '#A8C98A'), soil: v('--lay-soil', '#8A6A4A'), grid: v('--lay-grid', 'rgba(30,74,51,.16)'),
    gridMajor: v('--lay-grid-major', 'rgba(30,74,51,.34)'), bg: v('--bg', '#EEF1E6'),
  };
}

function thumbSVG(T) {
  const saved = { ...cam };
  const savedPivot = pivot;
  cam = { t: 1, angle: 0, zoom: 1, tx: 0, ty: 0 };
  pivot = [0, 0];
  const w = Math.min(T.w, 6), d = Math.min(T.d, 6);
  const it = { id: 'thumb', type: T.type, x: 0, y: 0, w, d, rot: 0, label: '' };
  const b = bboxOf(itemBounds(it));
  const pad = 4;
  const svg = `<svg viewBox="${(b.x0 - pad).toFixed(1)} ${(b.y0 - pad).toFixed(1)} ${(b.x1 - b.x0 + pad * 2).toFixed(1)} ${(b.y1 - b.y0 + pad * 2).toFixed(1)}" aria-hidden="true">${itemBody(it)}</svg>`;
  cam = saved;
  pivot = savedPivot;
  return svg;
}

const ICONS = {
  undo: '<path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  redo: '<path d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  turn: '<path d="M3 12a9 9 0 0 1 15.5-6.2M21 4v5h-5M21 12a9 9 0 0 1-15.5 6.2M3 20v-5h5" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  more: '<circle cx="5" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="19" cy="12" r="2" fill="currentColor"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  minus: '<path d="M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
};
const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;

export function mount(host) {
  ui = freshUI();
  undoStack = [];
  redoStack = [];
  load();
  readColors();
  host.innerHTML = `
  <div class="lay">
    <div class="lay-bar" role="toolbar" aria-label="Layout tools">
      <button type="button" class="tool" data-act="undo" aria-label="Undo">${icon('undo')}</button>
      <button type="button" class="tool" data-act="redo" aria-label="Redo">${icon('redo')}</button>
      <div class="seg" role="group" aria-label="View">
        <button type="button" data-view="0" aria-pressed="false">Plan</button>
        <button type="button" data-view="1" aria-pressed="true">3D</button>
      </div>
      <button type="button" class="tool" data-act="turn" aria-label="Turn the view">${icon('turn')}</button>
      <div class="menu-wrap">
        <button type="button" class="tool" data-act="menu" aria-label="More" aria-haspopup="true" aria-expanded="false">${icon('more')}</button>
        <div class="menu" hidden role="menu">
          <button type="button" role="menuitem" data-act="starter">Start from Block C</button>
          <button type="button" role="menuitem" data-act="shape">Edit land shape</button>
          <button type="button" role="menuitem" data-act="bfence">Boundary fence…</button>
          <button type="button" role="menuitem" data-act="plot">Land as a rectangle…</button>
          <button type="button" role="menuitem" data-act="png">Save picture (PNG)</button>
          <button type="button" role="menuitem" data-act="export">Export layout file</button>
          <button type="button" role="menuitem" data-act="import">Import layout file</button>
          <button type="button" role="menuitem" data-act="clear" class="danger">Clear layout</button>
        </div>
      </div>
    </div>
    <div class="lay-stage">
      <svg class="lay-svg" role="application" aria-label="Farm layout. Drag items from the tray onto the land.">
        <g class="cam"><g class="world"></g></g>
      </svg>
      <div class="lay-stats" aria-live="polite"></div>
      <div class="shape-bar card" hidden>
        <p><b>Edit land shape.</b> Drag the corners to match your land. Tap <span class="mini-plus">+</span> on a side to add a corner.</p>
        <div class="shape-actions">
          <button type="button" data-act="rmcorner" disabled>Remove corner</button>
          <button type="button" class="btn" data-act="shapedone">Done</button>
        </div>
      </div>
      <div class="lay-zoom">
        <button type="button" class="tool" data-act="zin" aria-label="Zoom in">${icon('plus')}</button>
        <button type="button" class="tool" data-act="zout" aria-label="Zoom out">${icon('minus')}</button>
        <button type="button" class="tool" data-act="fit" aria-label="Fit the plot on screen">${icon('fit')}</button>
      </div>
      <div class="lay-empty card" hidden>
        <svg class="hand" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M12 4v15m0 0-6-6m6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <h3>Build your farm</h3>
        <p>Drag things up from the tray onto your land, or tap one to drop it in the middle.</p>
        <button type="button" class="btn" data-act="starter">Start from Block C</button>
        <button type="button" class="link-btn" data-act="shape">Land not a rectangle? Edit its shape</button>
      </div>
      <div class="lay-inspector card" hidden></div>
      <div class="lay-toast" role="status" hidden></div>
    </div>
    <div class="lay-tray">
      <div class="tray-tabs" role="tablist">${CATALOG.map((c, i) => `<button type="button" role="tab" data-cat="${i}" aria-selected="${i === 0}">${esc(c.cat)}</button>`).join('')}</div>
      <div class="tray-items"></div>
    </div>
    <input type="file" accept="application/json,.json" hidden>
    <dialog class="sheet fence-dlg">
      <form method="dialog">
        <h2>Boundary fence</h2>
        <p class="muted fence-perim"></p>
        <div class="fence-opts" role="radiogroup" aria-label="Fence type"></div>
        <div class="dlg-actions"><button value="cancel" formnovalidate class="btn ghost-btn">Cancel</button><button value="ok" class="btn">Save</button></div>
      </form>
    </dialog>
    <dialog class="sheet plot-dlg">
      <form method="dialog">
        <h2>Land as a rectangle</h2>
        <p class="muted">Sets the land to a simple rectangle (1.3 acres is about 80 × 66 m). If your land is another shape, use <b>Edit land shape</b> afterwards to move the corners.</p>
        <div class="plot-fields">
          <label>Width (m)<input name="w" type="number" min="5" max="500" step="0.5" required></label>
          <label>Length (m)<input name="h" type="number" min="5" max="500" step="0.5" required></label>
        </div>
        <p class="plot-area"></p>
        <div class="dlg-actions"><button value="cancel" formnovalidate class="btn ghost-btn">Cancel</button><button value="ok" class="btn">Save</button></div>
      </form>
    </dialog>
  </div>`;

  const root = host.querySelector('.lay');
  els = {
    root, svg: root.querySelector('.lay-svg'), cam: root.querySelector('.cam'), world: root.querySelector('.world'),
    stats: root.querySelector('.lay-stats'), inspector: root.querySelector('.lay-inspector'), empty: root.querySelector('.lay-empty'),
    toast: root.querySelector('.lay-toast'), tray: root.querySelector('.tray-items'), menu: root.querySelector('.menu'),
    file: root.querySelector('input[type=file]'), plotDlg: root.querySelector('.plot-dlg'), shapeBar: root.querySelector('.shape-bar'),
    undo: root.querySelector('[data-act=undo]'), redo: root.querySelector('[data-act=redo]'),
  };

  const thumbs = {};
  const renderTray = () => {
    els.tray.innerHTML = CATALOG[ui.cat].items.map((T, i) => {
      thumbs[T.type] ||= thumbSVG(TYPES[T.type]);
      return `<button type="button" class="tray-item" data-type="${T.type}" style="--i:${i}" title="Tap to add, or drag up onto the land">
        <span class="thumb">${thumbs[T.type]}</span><span class="nm">${esc(T.name)}</span><span class="sz">${T.kind === 'fence' && T.style ? `${fmt(T.d)} m ${T.style === 'gate' ? 'wide' : 'long'}` : `${fmt(T.w)}×${fmt(T.d)} m`}</span></button>`;
    }).join('');
    root.querySelectorAll('.tray-tabs [data-cat]').forEach((b) => b.setAttribute('aria-selected', String(Number(b.dataset.cat) === ui.cat)));
  };
  renderTray();

  const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); cleanup.push(() => target.removeEventListener(type, fn, opts)); };

  on(els.svg, 'pointerdown', onStageDown);
  on(els.svg, 'pointermove', onStageMove);
  on(els.svg, 'pointerup', onStageUp);
  on(els.svg, 'pointercancel', onStageUp);
  on(els.svg, 'wheel', onWheel, { passive: false });
  on(els.tray, 'pointerdown', onTrayDown);
  on(els.tray, 'click', (e) => {
    const b = e.target.closest('[data-type]');
    if (b && e.detail === 0 && !ui.animating && !ui.shape) quickPlace(b.dataset.type);
  });
  on(window, 'pointermove', onWindowMove, { passive: false });
  on(window, 'pointerup', onWindowUp);
  on(window, 'pointercancel', onWindowUp);
  on(window, 'keydown', onKey);
  on(window, 'resize', () => requestRender());
  const mq = matchMedia('(prefers-color-scheme: dark)');
  on(mq, 'change', () => { readColors(); requestRender(); });
  // Stop the browser's own drag ghost / context menu interfering with long presses.
  on(els.tray, 'contextmenu', (e) => e.preventDefault());
  on(els.tray, 'dragstart', (e) => e.preventDefault());
  on(document, 'click', (e) => {
    if (!els.menu.hidden && !e.target.closest('.menu-wrap')) toggleMenu(false);
  });

  root.querySelector('.tray-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    ui.cat = Number(b.dataset.cat);
    renderTray();
    els.tray.scrollLeft = 0;
  });

  root.addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]');
    if (v) { moveCamera({ t: Number(v.dataset.view) }); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    if (act !== 'menu' && b.closest('.menu')) toggleMenu(false);
    const vs = viewSize();
    switch (act) {
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'turn': moveCamera({ angle: cam.angle + 90 }); break;
      case 'fit': fit(true); break;
      case 'zin': zoomAt(vs.w / 2, vs.h / 2, 1.3); saveSoon(); break;
      case 'zout': zoomAt(vs.w / 2, vs.h / 2, 1 / 1.3); saveSoon(); break;
      case 'menu': toggleMenu(els.menu.hidden); break;
      case 'starter':
        if (st.items.length && !confirm('Replace your current layout with the Block C starter? You can undo this.')) break;
        pushUndo();
        st.items = blockCStarter();
        select(null);
        fit(true, true);
        reportOffLand();
        if (!reduceMotion()) {
          const t0 = performance.now();
          st.items.forEach((it, i) => ui.plops.set(it.id, t0 + i * 45));
          keepAnimating(650 + st.items.length * 45);
        }
        saveSoon();
        break;
      case 'plot': openPlotDialog(); break;
      case 'shape': enterShape(); break;
      case 'shapedone': exitShape(); break;
      case 'rmcorner': removeCorner(); break;
      case 'bfence': openFenceDialog(); break;
      case 'png': exportPNG(); break;
      case 'export': exportFile(); break;
      case 'import': els.file.click(); break;
      case 'clear':
        if (!st.items.length || !confirm('Remove everything from the layout? You can undo this.')) break;
        pushUndo(); st.items = []; select(null); saveSoon(); requestRender();
        break;
      case 'rotate': rotateSel(); break;
      case 'copy': duplicateSel(); break;
      case 'delete': deleteSel(); break;
      case 'close': select(null); break;
      default: break;
    }
  });

  els.file.addEventListener('change', () => {
    const f = els.file.files && els.file.files[0];
    if (f) importFile(f);
    els.file.value = '';
  });

  const fenceDlg = root.querySelector('.fence-dlg');
  function fenceThumb(style) {
    const saved = { ...cam }, savedPivot = pivot;
    cam = { t: 1, angle: 0, zoom: 1, tx: 0, ty: 0 };
    pivot = [0, 0];
    const F = FENCE_STYLES[style];
    const svg = fenceRun([0, 0], [0, 4], style, F.h, F.t);
    const b = bboxOf([proj(0, 0, 0), proj(0, 4, 0), proj(0, 0, F.h + 0.4), proj(0, 4, F.h + 0.4), proj(-F.t, 0, 0), proj(F.t, 4, 0)]);
    cam = saved; pivot = savedPivot;
    return `<svg viewBox="${(b.x0 - 4).toFixed(1)} ${(b.y0 - 4).toFixed(1)} ${(b.x1 - b.x0 + 8).toFixed(1)} ${(b.y1 - b.y0 + 8).toFixed(1)}" aria-hidden="true">${svg}</svg>`;
  }
  function openFenceDialog() {
    const L = perimeter();
    const cur = st.plot.fence || '';
    fenceDlg.querySelector('.fence-perim').textContent = `Runs along every side of your land: ${fmt(L)} m in total.`;
    fenceDlg.querySelector('.fence-opts').innerHTML = [['', 'No boundary fence'], ...Object.entries(FENCE_STYLES).map(([k, F]) => [k, F.name])].map(([k, name]) => {
      const F = FENCE_STYLES[k];
      const posts = F && F.post ? ` · about ${Math.ceil(L / F.post)} posts` : '';
      return `<label class="fence-opt"><input type="radio" name="bfence" value="${k}"${k === cur ? ' checked' : ''}>
        <span class="fo-thumb">${k ? fenceThumb(k) : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'}</span>
        <span class="fo-text"><b>${esc(name)}</b>${F ? `<small>${fmt(F.h)} m high${posts}</small>` : ''}</span></label>`;
    }).join('');
    fenceDlg.showModal();
  }
  fenceDlg.addEventListener('close', () => {
    if (fenceDlg.returnValue !== 'ok') return;
    const v = fenceDlg.querySelector('input[name=bfence]:checked')?.value ?? '';
    if (v === (st.plot.fence || '') || (v && !Object.hasOwn(FENCE_STYLES, v))) return;
    pushUndo();
    st.plot = { ...st.plot, fence: v };
    saveSoon();
    requestRender();
    toast(v ? `${FENCE_STYLES[v].name} around ${fmt(perimeter())} m of boundary.` : 'Boundary fence removed.');
  });

  const form = els.plotDlg.querySelector('form');
  const area = els.plotDlg.querySelector('.plot-area');
  const showArea = () => {
    const w = Number(form.w.value), h = Number(form.h.value);
    area.textContent = w > 0 && h > 0 ? `${fmt(w * h)} m² ≈ ${((w * h) / 4046.86).toFixed(2)} acres` : '';
  };
  form.addEventListener('input', showArea);
  function openPlotDialog() {
    const lb = polyBox(st.plot.pts);
    form.w.value = fmt(lb.x1 - lb.x0); form.h.value = fmt(lb.y1 - lb.y0); showArea();
    els.plotDlg.showModal();
  }
  els.plotDlg.addEventListener('close', () => {
    if (els.plotDlg.returnValue !== 'ok') return;
    const w = Math.max(5, Math.min(500, Number(form.w.value) || 80));
    const h = Math.max(5, Math.min(500, Number(form.h.value) || 66));
    pushUndo();
    st.plot = { ...st.plot, pts: rectPts(w, h) };
    fit(true);
    saveSoon();
    reportOffLand();
  });

  function toggleMenu(open) {
    els.menu.hidden = !open;
    root.querySelector('[data-act=menu]').setAttribute('aria-expanded', String(open));
    if (open) els.menu.querySelector('button')?.focus();
  }

  syncViewButtons();
  // Size the camera once the stage has its real size.
  requestAnimationFrame(() => { if (els) { fit(false); render(); } });
}

export function unmount() {
  save();
  cleanup.forEach((f) => f());
  cleanup = [];
  if (ui) { cancelAnimationFrame(ui.raf); clearTimeout(ui.saveTimer); }
  ui = null;
  els = null;
}
