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
    { type: 'pandan', name: 'Pandan row', kind: 'hedge', w: 1, d: 5, h: 0.9, color: '#4E9A4A', resize: true },
  ] },
  { cat: 'Buildings', items: [
    { type: 'hut', name: 'Hut', kind: 'building', w: 4, d: 3, h: 2.6, wall: '#E7D9C1', roof: '#8C9BA5' },
    { type: 'stall', name: 'Farm stall', kind: 'building', w: 3, d: 2, h: 2.2, wall: '#DCC9B2', roof: '#C8302A' },
    { type: 'rabbitry', name: 'Rabbitry', kind: 'building', w: 5, d: 3, h: 2.4, wall: '#EFE6D6', roof: '#8C9BA5' },
    { type: 'coop', name: 'Chicken coop', kind: 'building', w: 3, d: 2, h: 1.8, wall: '#C99E6B', roof: '#7B4B2A' },
    { type: 'duck', name: 'Duck house', kind: 'building', w: 2, d: 2, h: 1.3, wall: '#D8B98A', roof: '#5E7F8F' },
    { type: 'shed', name: 'Tool shed', kind: 'building', w: 2.5, d: 2, h: 2.2, wall: '#B9A88C', roof: '#6C7A82' },
    { type: 'nursery', name: 'Nursery bench', kind: 'box', w: 3, d: 1, h: 0.9, color: '#B08A5E', top: '#7DAA5E' },
  ] },
  { cat: 'Water', items: [
    { type: 'pond', name: 'Fish pond', kind: 'water', w: 10, d: 8, resize: true },
    { type: 'drain', name: 'Drain', kind: 'water', w: 0.6, d: 10, resize: true },
    { type: 'ibc', name: 'IBC tank', kind: 'box', w: 1.2, d: 1, h: 1.2, color: '#DCE3E6', top: '#F1F4F5' },
  ] },
  { cat: 'Animals', items: [
    { type: 'tractor', name: 'Chicken tractor', kind: 'box', w: 3, d: 1.5, h: 1, color: '#C99E6B', top: '#A9B7A0' },
    { type: 'hive', name: 'Kelulut hive', kind: 'box', w: 0.6, d: 0.6, h: 1, color: '#8A6A4A', top: '#C9A46A' },
  ] },
  { cat: 'Paths & utility', items: [
    { type: 'path', name: 'Path', kind: 'zone', w: 1.2, d: 10, fill: '#D9C7A3', resize: true },
    { type: 'road', name: 'Village road', kind: 'zone', w: 5, d: 40, fill: '#7B7F82', road: true, resize: true },
    { type: 'fence', name: 'Fence', kind: 'fence', w: 0.15, d: 10, h: 1.2, color: '#8A6A4A', resize: true },
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
let st = { plot: { w: 80, h: 66 }, items: [] };
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
  const cx = st.plot.w / 2, cy = st.plot.h / 2;
  const a = (cam.angle * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const dx = x - cx, dy = y - cy;
  return [dx * c - dy * s, dx * s + dy * c];
}
function unrot2(rx, ry) {
  const cx = st.plot.w / 2, cy = st.plot.h / 2;
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
const pts = (list) => list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))));
  return '#' + ((1 << 24) | (ch(n >> 16) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255)).toString(16).slice(1);
}

/* ---------------- Drawing ---------------- */
function box(r, z0, h, top, side) {
  let s = '';
  const c = cornersOf(r);
  if (cam.t > 0.01 && h > 0.001) {
    const a = (cam.angle * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const normals = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (let i = 0; i < 4; i++) {
      const [nx, ny] = normals[i];
      const rx = nx * ca - ny * sa, ry = nx * sa + ny * ca;
      if (rx + ry <= 0.001) continue; // faces away from the viewer
      const p = c[i], q = c[(i + 1) % 4];
      const f = rx - ry > 0 ? 0.7 : 0.86;
      s += `<polygon points="${pts([proj(p[0], p[1], z0), proj(q[0], q[1], z0), proj(q[0], q[1], z0 + h), proj(p[0], p[1], z0 + h)])}" fill="${shade(side, f)}"/>`;
    }
  }
  s += `<polygon points="${pts(c.map((p) => proj(p[0], p[1], z0 + h)))}" fill="${top}"/>`;
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
  let s = box(r, 0, T.h, T.wall, T.wall);
  const rr = inset(r, -0.25);
  s += box(rr, T.h, 0.18, T.roof, T.roof);
  const alongX = r.x1 - r.x0 >= r.y1 - r.y0;
  const z = T.h + 0.18;
  const l = alongX ? [proj(rr.x0, (r.y0 + r.y1) / 2, z), proj(rr.x1, (r.y0 + r.y1) / 2, z)]
    : [proj((r.x0 + r.x1) / 2, rr.y0, z), proj((r.x0 + r.x1) / 2, rr.y1, z)];
  return s + lineTag(l, shade(T.roof, 0.75), 0.15 * S, 'stroke-linecap="round"');
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

function topZ(T) {
  if (T.kind === 'building') return T.h + 0.18;
  if (T.kind === 'tree') return T.h;
  if (T.kind === 'zone' || T.kind === 'water') return 0.05;
  return (T.z0 || 0) + (T.h || 0);
}

function labelSVG(it, T) {
  if (!it.label) return '';
  const [x, y] = proj(it.x, it.y, topZ(T) + 0.05);
  const fs = (T.kind === 'building' || T.kind === 'zone' || T.kind === 'water' ? 1.3 : 0.85) * S;
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
    case 'fence':
    case 'hedge': return box(r, 0, T.h, shade(T.color, 1.18), T.color);
    case 'building': return buildingSVG(T, r);
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
  const z = topZ(T);
  const list = cornersOf(r).flatMap((p) => [proj(p[0], p[1], 0), proj(p[0], p[1], z)]);
  if (T.kind === 'tree') {
    const R = (Math.min(r.x1 - r.x0, r.y1 - r.y0) / 2) * S;
    const [cx, cy] = proj(it.x, it.y, T.h * 0.8);
    list.push([cx - R, cy - R], [cx + R, cy + R]);
  }
  return list;
}

function plotBounds() {
  const c = cornersOf({ x0: 0, y0: 0, x1: st.plot.w, y1: st.plot.h });
  return c.flatMap((p) => [proj(p[0], p[1], 0), proj(p[0], p[1], -1.2)]);
}

function bboxOf(list) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of list) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1 };
}

/* ---------------- Rules ---------------- */
const isSolid = (T) => T.kind !== 'zone';
const overlap = (a, b) => a.x0 < b.x1 - E && b.x0 < a.x1 - E && a.y0 < b.y1 - E && b.y0 < a.y1 - E;
function fits(it) {
  const T = TYPES[it.type];
  if (!isSolid(T)) return true;
  const r = rectOf(it);
  if (r.x0 < -E || r.y0 < -E || r.x1 > st.plot.w + E || r.y1 > st.plot.h + E) return false;
  return !st.items.some((o) => o.id !== it.id && isSolid(TYPES[o.type]) && overlap(r, rectOf(o)));
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
function requestRender() {
  if (!ui || ui.raf) return;
  ui.raf = requestAnimationFrame(() => { ui.raf = 0; render(); });
}

function render() {
  if (!els) return;
  const now = performance.now();
  const W = st.plot.w, H = st.plot.h;
  const out = [];
  const plotR = { x0: 0, y0: 0, x1: W, y1: H };
  // Diorama slab: soil sides under the grass.
  out.push(box(plotR, -1.2, 1.2, colors.grass, colors.soil));
  // Grid
  const showMinor = cam.zoom * S >= 7;
  const gl = [];
  for (let x = 0; x <= W + E; x += 1) {
    const major = Math.round(x) % 5 === 0;
    if (!major && !showMinor) continue;
    gl.push(lineTag([proj(x, 0), proj(x, H)], major ? colors.gridMajor : colors.grid, (major ? 1.2 : 0.8) / cam.zoom));
  }
  for (let y = 0; y <= H + E; y += 1) {
    const major = Math.round(y) % 5 === 0;
    if (!major && !showMinor) continue;
    gl.push(lineTag([proj(0, y), proj(W, y)], major ? colors.gridMajor : colors.grid, (major ? 1.2 : 0.8) / cam.zoom));
  }
  out.push(`<g class="grid">${gl.join('')}</g>`);

  const fx = (it) => {
    const opts = {};
    const p = ui.plops.get(it.id);
    if (p && now - p < 650) { opts.cls = 'plop'; opts.style = `animation-delay:-${Math.round(now - p)}ms`; }
    const sh = ui.shakes.get(it.id);
    if (sh && now - sh < 450) { opts.cls = 'shake'; opts.style = `animation-delay:-${Math.round(now - sh)}ms`; }
    if (ui.drag && ui.drag.id === it.id && ui.drag.mode !== 'pan') opts.cls = (opts.cls || '') + (ui.drag.valid === false ? ' bad' : ' lifted');
    return opts;
  };

  const zones = st.items.filter((i) => !isSolid(TYPES[i.type]))
    .sort((a, b) => b.w * b.d - a.w * a.d);
  const solids = st.items.filter((i) => isSolid(TYPES[i.type]))
    .map((i) => { const [rx, ry] = rot2(i.x, i.y); return { i, k: rx + ry }; })
    .sort((a, b) => a.k - b.k).map((o) => o.i);
  for (const it of zones) out.push(itemSVG(it, fx(it)));
  for (const it of solids) out.push(itemSVG(it, fx(it)));

  // Selection outline + resize handles
  const sel = st.items.find((i) => i.id === ui.sel);
  if (sel) {
    const r = rectOf(sel);
    const T = TYPES[sel.type];
    const bad = ui.drag && ui.drag.id === sel.id && ui.drag.valid === false;
    out.push(`<polygon class="sel-ring${bad ? ' bad' : ''}" points="${pts(cornersOf(r).map((p) => proj(p[0], p[1], 0.06)))}" fill="none" stroke-width="${2.5 / cam.zoom}" stroke-dasharray="${7 / cam.zoom} ${5 / cam.zoom}"/>`);
    if (T.resize && !(ui.drag && ui.drag.mode === 'move')) {
      for (const [axis, hx, hy] of [['x', r.x1, sel.y], ['y', sel.x, r.y1]]) {
        const [px, py] = proj(hx, hy, 0.06);
        out.push(`<g class="handle" data-handle="${axis}"><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${20 / cam.zoom}" fill="transparent"/><circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${8 / cam.zoom}" fill="#FFFFFF" stroke="#1E4A33" stroke-width="${2.5 / cam.zoom}"/><path d="M${(px - 3.5 / cam.zoom).toFixed(1)} ${py.toFixed(1)}h${(7 / cam.zoom).toFixed(1)}M${px.toFixed(1)} ${(py - 3.5 / cam.zoom).toFixed(1)}v${(7 / cam.zoom).toFixed(1)}" stroke="#1E4A33" stroke-width="${1.6 / cam.zoom}"/></g>`);
      }
    }
  }

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

function renderStats() {
  const beds = st.items.filter((i) => TYPES[i.type].kind === 'bed');
  const bedArea = beds.reduce((a, i) => a + i.w * i.d, 0);
  const acres = (st.plot.w * st.plot.h) / 4046.86;
  els.stats.innerHTML = `<b>${st.items.length}</b> items · <b>${beds.length}</b> beds (${fmt(bedArea)} m²) · plot ${fmt(st.plot.w)}×${fmt(st.plot.h)} m = <b>${acres.toFixed(2)}</b> ac`;
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
  if (reduceMotion()) { Object.assign(cam, target); apply(); render(); syncViewButtons(); saveSoon(); return; }
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
  const items = [];
  const seen = new Set();
  for (const r of raw.items.slice(0, 2000)) {
    if (!r || !TYPES[r.type]) continue;
    const x = num(r.x, -600, 1100), y = num(r.y, -600, 1100), w = num(r.w, 0.1, 500), d = num(r.d, 0.1, 500);
    if (x === null || y === null || w === null || d === null) continue;
    let id = typeof r.id === 'string' && /^[\w-]{1,40}$/.test(r.id) ? r.id : newId();
    if (seen.has(id)) id = newId();
    seen.add(id);
    const rot = [0, 90, 180, 270].includes(r.rot) ? r.rot : 0;
    const label = typeof r.label === 'string' ? r.label.slice(0, 24) : '';
    items.push({ id, type: r.type, x, y, w, d, rot, label });
  }
  return { plot: { w: pw, h: ph }, items };
}

function saveSoon() {
  if (!ui) return;
  clearTimeout(ui.saveTimer);
  ui.saveTimer = setTimeout(save, 250);
}
function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({ v: 1, plot: st.plot, items: st.items, cam: { t: Math.round(cam.t), angle: cam.angle } }));
  } catch { /* storage unavailable: layout lives for this session only */ }
}
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE) || 'null');
    const data = raw && sanitize(raw);
    if (data) st = data;
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
  select(it.id);
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
  const spot = findSpot(it, cx, cy) || findSpot(it, st.plot.w / 2, st.plot.h / 2);
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
function select(id) {
  ui.sel = id;
  renderInspector();
  requestRender();
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
      <div><div class="insp-name">${esc(T.name)}</div><div class="insp-size">${fmt(it.w)} × ${fmt(it.d)} m · ${fmt(it.w * it.d)} m²${T.resize ? ' · drag ⊕ to resize' : ''}</div></div>
      <button type="button" class="icon-btn" data-act="close" aria-label="Done">✕</button>
    </div>
    <label class="insp-label"><span>Label</span><input type="text" maxlength="24" placeholder="e.g. C1, Hut" value="${esc(it.label || '')}"></label>
    <div class="insp-actions">
      <button type="button" data-act="rotate"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Rotate</button>
      <button type="button" data-act="copy"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M16 4H6a2 2 0 0 0-2 2v10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>Copy</button>
      <button type="button" data-act="delete" class="danger"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Delete</button>
      ${blockC ? '<a class="insp-link" href="#/notes/05a-block-c-cash-beds">Block C schedule →</a>' : ''}
    </div>`;
  const input = box.querySelector('input');
  input.addEventListener('focus', () => pushUndo(), { once: true });
  input.addEventListener('input', () => { it.label = input.value.slice(0, 24); requestRender(); saveSoon(); });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
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
    if (ui.drag && (ui.drag.mode === 'move' || ui.drag.mode === 'resize')) cancelDrag();
    ui.drag = null;
    const [a, b] = [...ui.pointers.values()];
    ui.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
    return;
  }
  if (ui.pointers.size > 2) return;
  const handle = e.target.closest('[data-handle]');
  const g = e.target.closest('[data-id]');
  const start = { sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY };
  if (handle && ui.sel) {
    const it = st.items.find((i) => i.id === ui.sel);
    ui.drag = { ...start, mode: 'resize-pending', id: it.id, axis: handle.dataset.handle, orig: { ...it } };
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

  if (d.mode === 'pan') {
    cam.tx += e.clientX - d.lx;
    cam.ty += e.clientY - d.ly;
    requestRender();
  } else if (d.mode === 'move') {
    const it = st.items.find((i) => i.id === d.id);
    const [wx, wy] = clientToWorld(e.clientX, e.clientY);
    [it.x, it.y] = snapCenter(it, d.orig.x + wx - d.w0[0], d.orig.y + wy - d.w0[1]);
    d.valid = fits(it);
    requestRender();
  } else if (d.mode === 'resize') {
    const it = st.items.find((i) => i.id === d.id);
    const [wx, wy] = clientToWorld(e.clientX, e.clientY);
    const r0 = rectOf(d.orig);
    const swapped = (it.rot / 90) % 2 === 1;
    if (d.axis === 'x') {
      const ew = Math.max(SNAP, Math.min(400, snap(wx - r0.x0)));
      if (swapped) it.d = ew; else it.w = ew;
      it.x = r0.x0 + ew / 2;
    } else {
      const ed = Math.max(SNAP, Math.min(400, snap(wy - r0.y0)));
      if (swapped) it.w = ed; else it.d = ed;
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
  if (el) el.textContent = `${fmt(it.w)} × ${fmt(it.d)} m · ${fmt(it.w * it.d)} m² · drag ⊕ to resize`;
}

function cancelDrag() {
  const d = ui.drag;
  if (!d) return;
  if ((d.mode === 'move' || d.mode === 'resize') && d.orig) {
    const it = st.items.find((i) => i.id === d.id);
    if (it) Object.assign(it, d.orig);
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
  if (d.mode === 'move-pending') select(d.id);
  else if (d.mode === 'pan-pending') select(d.tap);
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
  if (!btn || ui.animating) return;
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
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (e.key === 'Escape') { if (ui.place) { ui.place = null; els.root.classList.remove('placing'); requestRender(); } else select(null); return; }
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
  const savedPlot = st.plot;
  cam = { t: 1, angle: 0, zoom: 1, tx: 0, ty: 0 };
  st = { ...st, plot: { w: 0, h: 0 } };
  const w = Math.min(T.w, 6), d = Math.min(T.d, 6);
  const it = { id: 'thumb', type: T.type, x: 0, y: 0, w, d, rot: 0, label: '' };
  const b = bboxOf(itemBounds(it));
  const pad = 4;
  const svg = `<svg viewBox="${(b.x0 - pad).toFixed(1)} ${(b.y0 - pad).toFixed(1)} ${(b.x1 - b.x0 + pad * 2).toFixed(1)} ${(b.y1 - b.y0 + pad * 2).toFixed(1)}" aria-hidden="true">${itemBody(it)}</svg>`;
  cam = saved;
  st = { ...st, plot: savedPlot };
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
          <button type="button" role="menuitem" data-act="plot">Plot size…</button>
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
      </div>
      <div class="lay-inspector card" hidden></div>
      <div class="lay-toast" role="status" hidden></div>
    </div>
    <div class="lay-tray">
      <div class="tray-tabs" role="tablist">${CATALOG.map((c, i) => `<button type="button" role="tab" data-cat="${i}" aria-selected="${i === 0}">${esc(c.cat)}</button>`).join('')}</div>
      <div class="tray-items"></div>
    </div>
    <input type="file" accept="application/json,.json" hidden>
    <dialog class="sheet plot-dlg">
      <form method="dialog">
        <h2>Plot size</h2>
        <p class="muted">Measure the land as a rectangle. 1.3 acres is about 80 × 66 m.</p>
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
    file: root.querySelector('input[type=file]'), plotDlg: root.querySelector('.plot-dlg'),
    undo: root.querySelector('[data-act=undo]'), redo: root.querySelector('[data-act=redo]'),
  };

  const thumbs = {};
  const renderTray = () => {
    els.tray.innerHTML = CATALOG[ui.cat].items.map((T, i) => {
      thumbs[T.type] ||= thumbSVG(TYPES[T.type]);
      return `<button type="button" class="tray-item" data-type="${T.type}" style="--i:${i}" title="Tap to add, or drag up onto the land">
        <span class="thumb">${thumbs[T.type]}</span><span class="nm">${esc(T.name)}</span><span class="sz">${fmt(T.w)}×${fmt(T.d)} m</span></button>`;
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
        if (!reduceMotion()) {
          const t0 = performance.now();
          st.items.forEach((it, i) => ui.plops.set(it.id, t0 + i * 45));
          keepAnimating(650 + st.items.length * 45);
        }
        saveSoon();
        break;
      case 'plot': openPlotDialog(); break;
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

  const form = els.plotDlg.querySelector('form');
  const area = els.plotDlg.querySelector('.plot-area');
  const showArea = () => {
    const w = Number(form.w.value), h = Number(form.h.value);
    area.textContent = w > 0 && h > 0 ? `${fmt(w * h)} m² ≈ ${((w * h) / 4046.86).toFixed(2)} acres` : '';
  };
  form.addEventListener('input', showArea);
  function openPlotDialog() {
    form.w.value = st.plot.w; form.h.value = st.plot.h; showArea();
    els.plotDlg.showModal();
  }
  els.plotDlg.addEventListener('close', () => {
    if (els.plotDlg.returnValue !== 'ok') return;
    const w = Math.max(5, Math.min(500, Number(form.w.value) || st.plot.w));
    const h = Math.max(5, Math.min(500, Number(form.h.value) || st.plot.h));
    if (w === st.plot.w && h === st.plot.h) return;
    pushUndo();
    st.plot = { w, h };
    fit(true);
    saveSoon();
    const outside = st.items.filter((i) => isSolid(TYPES[i.type]) && !fits(i)).length;
    if (outside) toast(`${outside} item${outside > 1 ? 's are' : ' is'} now outside the plot or overlapping. Move ${outside > 1 ? 'them' : 'it'} back in.`);
  });

  function toggleMenu(open) {
    els.menu.hidden = !open;
    root.querySelector('[data-act=menu]').setAttribute('aria-expanded', String(open));
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
