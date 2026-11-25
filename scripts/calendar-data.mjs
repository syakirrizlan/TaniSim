// Turns the plain-language dates in the farm notes into calendar events.
// The notes say things like "sow early Dec; cut early Jan → mid-Feb", so dates are
// approximate: early = 5th, mid = 15th, late = 25th, end = last day. A month on its
// own ("First pick ≈Mar") becomes a month-long item, not a made-up day.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TOKEN = /(early|mid|late|end)?[-\s]?\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b(?:\s+(\d{4}))?/gi;

const pad = (n) => String(n).padStart(2, '0');
const lastDay = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const iso = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const stripMd = (s) => s.replace(/\*\*/g, '').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a).trim();
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Split a markdown table starting at the header line into rows of cells.
function tables(body) {
  const lines = body.split('\n');
  const out = [];
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].trim().startsWith('|') || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) continue;
    const split = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    const header = split(lines[i]);
    const rows = [];
    let j = i + 2;
    while (j < lines.length && lines[j].trim().startsWith('|')) rows.push(split(lines[j++]));
    out.push({ header, rows });
    i = j;
  }
  return out;
}

// Pick the year for a month so it falls inside the plan's window.
function yearFor(month, win) {
  for (const y of [win.y0 - 1, win.y0, win.y0 + 1, win.y0 + 2]) {
    const idx = y * 12 + month;
    if (idx >= win.from && idx <= win.to) return y;
  }
  return win.y0;
}

function tokenDate(tok, win, edge = 'start') {
  const month = MONTHS.indexOf(tok.mon.toLowerCase());
  const year = tok.year ? Number(tok.year) : yearFor(month, win);
  const q = (tok.q || '').toLowerCase();
  if (!q) {
    return { date: iso(year, month, edge === 'end' ? lastDay(year, month) : 1), monthOnly: true, when: `${MONTH_NAMES[month]} ${year}` };
  }
  const day = q === 'early' ? 5 : q === 'mid' ? 15 : q === 'late' ? 25 : lastDay(year, month);
  return { date: iso(year, month, day), monthOnly: false, when: `${q} ${MONTH_NAMES[month]}` };
}

function findTokens(text) {
  const out = [];
  for (const m of text.matchAll(TOKEN)) out.push({ q: m[1], mon: m[2], year: m[3], index: m.index, end: m.index + m[0].length });
  return out;
}

const VERBS = [
  [/first pick/, 'First pick', 'harvest'], [/first cut/, 'First cut', 'harvest'], [/first bundles?/, 'First bundles', 'harvest'],
  [/transplant/, 'Transplant', 'plant'], [/plant/, 'Plant', 'plant'], [/sow/, 'Sow', 'sow'],
  [/pick/, 'Pick', 'harvest'], [/cut/, 'Cut', 'harvest'], [/pull/, 'Pull', 'harvest'], [/rest/, 'Chicken tractor rest', 'rest'],
];
function verbOf(text) {
  const t = text.toLowerCase();
  for (const [re, label, kind] of VERBS) if (re.test(t)) return { label, kind };
  return null;
}

/* ---------- Block C style bed timeline: | Bed | Built | Dec – Feb | ... | ---------- */
function bedTimeline(table, win, src) {
  const events = [];
  for (const row of table.rows) {
    const bed = stripMd(row[0]);
    const built = findTokens(row[1] || '')[0];
    if (built) {
      const d = tokenDate(built, win);
      events.push({ kind: 'build', title: `Build bed ${bed}`, bed, start: d.date, monthOnly: true, when: d.when, src, text: `Built ${row[1]}` });
    }
    let crop = '';
    for (const cell of row.slice(2)) {
      for (const rawSeg of cell.split(' · ')) {
        const bold = rawSeg.match(/\*\*([^*]+)\*\*/);
        let seg = rawSeg;
        if (bold) crop = bold[1].replace(/:$/, '').trim();
        else {
          // "Bendi picking early Apr", "Kangkung to end Mar": a plain crop name leads the text.
          const lead = rawSeg.match(/^([A-Z][a-z]+(?: (?!(?:to|from|cut|pick|picking|early|mid|late|end)\b)[a-z]+)?)\s+(?=picking|to |cut|pick|from|early|mid|late|end|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
          if (lead && !verbOf(lead[1]) && !/^(first|weekly)$/i.test(lead[1])) crop = lead[1];
        }
        // "**Kangkung** — sow early Dec; …": the dated part comes after the dash.
        seg = stripMd(seg);
        if (seg.includes('—')) seg = seg.slice(seg.indexOf('—') + 1);
        seg = seg.replace(/🐔/g, '').replace(/≈/g, '');
        const segTokens = findTokens(seg);
        if (!segTokens.length) {
          // "Serai slips planted", "kesum, pegaga from cuttings": planted in the month the bed is built.
          if (/plant|cutting|seed|slips/i.test(seg) && built) {
            const d = tokenDate(built, win);
            events.push({ kind: 'plant', title: `Plant ${crop || 'bed'}`, bed, crop, start: d.date, monthOnly: true, when: d.when, src, text: stripMd(rawSeg) });
          }
          continue;
        }
        for (const clause of seg.split(';')) {
          const toks = findTokens(clause);
          if (!toks.length) continue;
          const before = clause.slice(0, toks[0].index);
          const v = verbOf(before);
          const cropName = crop || '';
          const arrow = clause.indexOf('→');
          if (arrow > -1 && toks.length >= 2) {
            const a = toks.filter((t) => t.index < arrow).pop() || toks[0];
            const b = toks.find((t) => t.index > arrow) || toks[toks.length - 1];
            const s = tokenDate(a, win), e = tokenDate(b, win, 'end');
            const kind = v ? v.kind : 'grow';
            const title = v ? (v.kind === 'rest' ? v.label : `${v.label} ${cropName}`.trim()) : `${cropName} growing`;
            events.push({ kind, title, bed, crop: cropName, start: s.date, end: e.date, monthOnly: s.monthOnly, when: `${s.when} → ${e.when}`, src, text: stripMd(clause).trim() });
            continue;
          }
          if (/\bto\b/i.test(before) && !v) {
            const e = tokenDate(toks[0], win, 'end');
            events.push({ kind: 'end', title: `${cropName} finishes`, bed, crop: cropName, start: e.date, monthOnly: e.monthOnly, when: e.when, src, text: stripMd(clause).trim() });
            continue;
          }
          for (const t of toks) {
            const d = tokenDate(t, win);
            const from = /\bfrom\b/i.test(before);
            const kind = v ? v.kind : 'grow';
            let title = v ? (v.kind === 'rest' ? v.label : `${v.label} ${cropName}`.trim()) : cropName;
            if (from) title += ' begins';
            events.push({ kind, title, bed, crop: cropName, start: d.date, monthOnly: d.monthOnly, when: d.when, src, text: stripMd(clause).trim() });
          }
        }
      }
    }
  }
  return events;
}

/* ---------- Nursery: | Sow or collect | When | For | ---------- */
function nursery(table, win, src) {
  const events = [];
  for (const row of table.rows) {
    const what = stripMd(row[0]).replace(/\s*\([^)]*\)/g, '').replace(/\s*—.*$/, '').trim();
    const when = stripMd(row[1] || '');
    const toks = findTokens(when);
    if (!toks.length) continue;
    // A year written once at the end ("Nov – Dec 2026") applies to every month in the range.
    const year = toks.map((t) => t.year).filter(Boolean).pop();
    toks.forEach((t) => { t.year ||= year; });
    const s = tokenDate(toks[0], win);
    const range = toks.length > 1 && /[–-]/.test(when.slice(toks[0].end, toks[1].index));
    const e = range ? tokenDate(toks[1], win, 'end') : null;
    events.push({
      kind: 'nursery', title: what, bed: stripMd(row[2] || ''), start: s.date, end: e ? e.date : undefined,
      monthOnly: s.monthOnly, when: e ? `${s.when} → ${e.when}` : s.when, src, text: `${stripMd(row[0])} · ${when}`,
    });
  }
  return events;
}

/* ---------- Project stages: | Stage | When | ... | ---------- */
function stages(table, src) {
  const events = [];
  for (const row of table.rows) {
    const when = stripMd(row[1] || '').split(',')[0];
    const toks = findTokens(when);
    if (!toks.length) continue;
    const year = toks.map((t) => t.year).filter(Boolean).pop();
    if (!year) continue;
    toks.forEach((t) => { t.year ||= year; t.q = undefined; });
    const win = { y0: Number(year), from: 0, to: 1e9 };
    const s = tokenDate(toks[0], win);
    const e = toks.length > 1 ? tokenDate(toks[toks.length - 1], win, 'end') : tokenDate(toks[0], win, 'end');
    events.push({ kind: 'project', title: stripMd(row[0]).replace(/^\d+\.\s*/, ''), start: s.date, end: e.date, monthOnly: true, when: stripMd(row[1]), src, text: stripMd(row[2] || '') });
  }
  return events;
}

/* ---------- Festivals written like "Ramadan (~8 Feb 2027)" ---------- */
function festivals(body, src) {
  const events = [];
  const re = /\b([A-Z][a-z]+)\s*\(~\s*(\d{1,2})(?:\s*[–-]\s*(\d{1,2}))?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\)/g;
  const seen = new Set();
  for (const m of body.matchAll(re)) {
    const month = MONTHS.indexOf(m[4].toLowerCase());
    const y = Number(m[5]);
    const start = iso(y, month, Number(m[2]));
    const key = m[1] + start;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push({ kind: 'holiday', title: m[1], start, end: m[3] ? iso(y, month, Number(m[3])) : undefined, monthOnly: false, when: `≈ ${m[2]}${m[3] ? '–' + m[3] : ''} ${MONTH_NAMES[month]} ${y}`, src, text: m[0] });
  }
  return events;
}

// Window of a dated plan, from a title like "(Dec 2026 – Aug 2027)".
function planWindow(title) {
  const m = title.match(/\((\w{3})\w*\s+(\d{4})\s*[–-]\s*(\w{3})\w*\s+(\d{4})\)/);
  if (!m) return null;
  const a = MONTHS.indexOf(m[1].toLowerCase()), b = MONTHS.indexOf(m[3].toLowerCase());
  if (a < 0 || b < 0) return null;
  const from = Number(m[2]) * 12 + a, to = Number(m[4]) * 12 + b;
  return { y0: Number(m[2]), from: from - 2, to }; // allow nursery work a couple of months early
}

export function buildCalendar(notes) {
  const events = [];
  for (const n of notes) {
    const win = planWindow(n.title);
    for (const t of tables(n.body)) {
      const h = t.header.map((x) => stripMd(x).toLowerCase());
      if (win && h[0] === 'bed' && h[1] === 'built') events.push(...bedTimeline(t, win, n.slug));
      else if (win && h[0].startsWith('sow or collect') && h[1] === 'when') events.push(...nursery(t, win, n.slug));
      else if (h[0] === 'stage' && h[1] === 'when') events.push(...stages(t, n.slug));
    }
    events.push(...festivals(n.body, n.slug));
    for (const m of n.milestones || []) {
      events.push({ kind: 'milestone', title: m.text, start: iso(m.year, m.month, 1), monthOnly: true, when: m.when, done: m.done, src: n.slug, text: m.text });
    }
  }
  events.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
  events.forEach((e, i) => { e.id = `e${i}`; });
  return events;
}
