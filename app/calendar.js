// TaniSim calendar: dates from the farm notes (built into notes/index.json) plus
// the weekly rhythm and the user's own tasks (saved on this device).

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TASKS_KEY = 'tanisim.tasks.v1';
const UI_KEY = 'tanisim.calendar.ui';

export const KINDS = {
  sow: { label: 'Sow', color: '#4E9A44', group: 'beds' },
  plant: { label: 'Plant', color: '#2F7A50', group: 'beds' },
  harvest: { label: 'Harvest', color: '#D9722B', group: 'beds' },
  end: { label: 'Finishes', color: '#9A7F5E', group: 'beds' },
  grow: { label: 'Growing', color: '#8DB255', group: 'beds' },
  rest: { label: 'Chicken rest', color: '#8C6B42', group: 'beds' },
  build: { label: 'Build', color: '#5E6B73', group: 'beds' },
  nursery: { label: 'Nursery', color: '#6FAF8F', group: 'nursery' },
  milestone: { label: 'Milestone', color: '#B7811C', group: 'milestones' },
  holiday: { label: 'Festival', color: '#C8302A', group: 'festivals' },
  project: { label: 'AI project', color: '#4F7CAC', group: 'projects' },
  task: { label: 'My task', color: '#7A4FB0', group: 'tasks' },
};
const GROUPS = [
  ['beds', 'Beds'], ['nursery', 'Nursery'], ['milestones', 'Milestones'], ['festivals', 'Festivals'],
  ['projects', 'AI project'], ['rhythm', 'Weekly rhythm'], ['tasks', 'My tasks'],
];

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateOf = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayISO = () => isoOf(new Date());
const validISO = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && isoOf(dateOf(s)) === s;
const addDays = (s, n) => { const d = dateOf(s); d.setDate(d.getDate() + n); return isoOf(d); };
const monthKey = (s) => s.slice(0, 7);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; } catch { return fallback; }
}
function store(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
function loadTasks() {
  const raw = load(TASKS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((t) => t && typeof t.text === 'string' && validISO(t.date))
    .map((t) => ({ id: typeof t.id === 'string' ? t.id.slice(0, 40) : newId(), date: t.date, text: t.text.slice(0, 140), done: !!t.done }));
}

function relDays(iso) {
  const diff = Math.round((dateOf(iso) - dateOf(todayISO())) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return diff > 0 ? `In ${diff} days` : `${-diff} days ago`;
}
function niceDate(iso, withYear = true) {
  const d = dateOf(iso);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`;
}
const approxText = (e) => (e.kind === 'holiday' ? e.when : e.monthOnly ? `during ${e.when}` : `≈ ${e.when}`);

/* ---------- Event lookups (shared with the Today page) ---------- */
export function dayItems(events, iso) {
  const out = [];
  for (const e of events) {
    if (e.monthOnly) continue; // month-long items live in the month band, not on a made-up day
    if (e.start === iso) out.push({ e, role: e.end && e.end !== e.start ? 'start' : 'single' });
    else if (e.end === iso) out.push({ e, role: 'end' });
  }
  return out;
}
function ongoing(events, iso) {
  return events.filter((e) => e.end && !e.monthOnly && e.start < iso && e.end > iso);
}
const bedOrder = (a, b) => a.localeCompare(b, undefined, { numeric: true });
function monthBand(events, key) {
  const list = events.filter((e) => {
    if (!e.monthOnly) return false;
    const s = monthKey(e.start), en = e.end ? monthKey(e.end) : s;
    return s <= key && en >= key;
  });
  // "Build bed C1", "Build bed C2", … become one line: "Build beds C1, C2, …".
  const builds = list.filter((e) => e.kind === 'build' && e.bed);
  if (builds.length < 2) return list;
  const beds = builds.map((e) => e.bed).sort(bedOrder);
  const merged = { ...builds[0], title: `Build beds ${beds.join(', ')}`, bed: '' };
  return [merged, ...list.filter((e) => !builds.includes(e))];
}

// Next n days of dated items (used by the Today page).
export function upcoming(data, days = 7) {
  const events = data.calendar || [];
  const tasks = loadTasks();
  const start = todayISO();
  const out = [];
  for (let i = 0; i < days; i++) {
    const iso = addDays(start, i);
    for (const it of dayItems(events, iso)) out.push({ iso, title: it.e.title, kind: it.e.kind, bed: it.e.bed || '', role: it.role });
    for (const t of tasks.filter((x) => x.date === iso && !x.done)) out.push({ iso, title: t.text, kind: 'task', bed: '', role: 'single' });
  }
  return out;
}

/* ---------- Mounting ---------- */
let state = null;
export function unmount() { state = null; }

export function mount(view, data) {
  const ui = load(UI_KEY, {});
  const today = todayISO();
  state = {
    data, events: data.calendar || [], tasks: loadTasks(),
    view: ui.view === 'list' ? 'list' : 'month',
    hidden: new Set(Array.isArray(ui.hidden) ? ui.hidden.filter((g) => GROUPS.some(([k]) => k === g)) : []),
    month: today.slice(0, 7), sel: today, dir: 0,
  };
  // Open on the requested day (#/calendar/2027-03-09) if given.
  const m = location.hash.match(/#\/calendar\/(\d{4}-\d{2}-\d{2})/);
  if (m && validISO(m[1])) { state.sel = m[1]; state.month = m[1].slice(0, 7); }

  view.innerHTML = `
    <div class="cal">
      <div class="cal-head rise">
        <div class="cal-nav">
          <button type="button" class="tool" data-cal="prev" aria-label="Previous month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <h2 class="cal-title" aria-live="polite"></h2>
          <button type="button" class="tool" data-cal="next" aria-label="Next month"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
        <div class="cal-tools">
          <button type="button" class="btn ghost-btn cal-today" data-cal="today">Today</button>
          <div class="seg" role="group" aria-label="Calendar view">
            <button type="button" data-calview="month" aria-pressed="false">Month</button>
            <button type="button" data-calview="list" aria-pressed="false">List</button>
          </div>
        </div>
      </div>
      <div class="cal-filters rise" style="--i:1" role="group" aria-label="Show on the calendar"></div>
      <div class="cal-body">
        <div class="cal-main"></div>
        <aside class="cal-day card" aria-live="polite"></aside>
      </div>
      <p class="cal-note">Dates come from your notes. Words like "early", "mid" and "late" are shown as about the 5th, 15th and 25th (≈). Your own tasks are saved on this device.</p>
    </div>`;

  const root = view.querySelector('.cal');
  root.addEventListener('click', (e) => onClick(e, root));
  root.addEventListener('submit', (e) => onSubmit(e, root));
  root.addEventListener('change', (e) => onChange(e, root));
  root.addEventListener('keydown', (e) => onKey(e, root));
  renderAll(root);
}

function saveUI() {
  store(UI_KEY, { view: state.view, hidden: [...state.hidden] });
}
const visible = (kind) => !state.hidden.has(KINDS[kind]?.group);

function renderAll(root) {
  renderHead(root);
  renderFilters(root);
  renderMain(root);
  renderDay(root);
}

function renderHead(root) {
  const [y, m] = state.month.split('-').map(Number);
  root.querySelector('.cal-title').textContent = state.view === 'list' ? `From ${MONTH_NAMES[m - 1]} ${y}` : `${MONTH_NAMES[m - 1]} ${y}`;
  root.querySelectorAll('[data-calview]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.calview === state.view)));
}

function renderFilters(root) {
  root.querySelector('.cal-filters').innerHTML = GROUPS.map(([k, label]) => {
    const color = k === 'rhythm' ? 'var(--muted)' : Object.values(KINDS).find((x) => x.group === k).color;
    const on = !state.hidden.has(k);
    return `<button type="button" class="chip${on ? ' on' : ''}" data-group="${k}" aria-pressed="${on}" style="--c:${color}"><span class="sw"></span>${label}</button>`;
  }).join('');
}

function rhythmFor(iso) {
  if (state.hidden.has('rhythm')) return null;
  const day = DAYS[dateOf(iso).getDay()];
  return (state.data.rhythm || []).find((r) => r.day === day) || null;
}

function itemsFor(iso) {
  const items = dayItems(state.events, iso).filter((x) => visible(x.e.kind));
  const tasks = state.hidden.has('tasks') ? [] : state.tasks.filter((t) => t.date === iso);
  return { items, tasks };
}

function renderMain(root) {
  const main = root.querySelector('.cal-main');
  const anim = state.dir && !reduceMotion() ? ` slide-${state.dir > 0 ? 'next' : 'prev'}` : '';
  state.dir = 0;
  main.innerHTML = state.view === 'list' ? listHTML(anim) : monthHTML(anim);
}

function monthHTML(anim) {
  const [y, m] = state.month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const startIso = addDays(isoOf(first), -first.getDay());
  const today = todayISO();
  const band = monthBand(state.events, state.month).filter((e) => visible(e.kind));
  let cells = '';
  for (let i = 0; i < 42; i++) {
    const iso = addDays(startIso, i);
    const inMonth = iso.slice(0, 7) === state.month;
    if (i >= 35 && !inMonth && iso > `${state.month}-31`) break; // drop an all-next-month last row
    const { items, tasks } = itemsFor(iso);
    const r = rhythmFor(iso);
    const chips = [
      ...items.map((x) => ({ color: KINDS[x.e.kind].color, text: (x.role === 'end' ? '⇥ ' : '') + x.e.title + (x.e.bed ? ` · ${x.e.bed}` : '') })),
      ...tasks.map((t) => ({ color: KINDS.task.color, text: (t.done ? '✓ ' : '') + t.text, done: t.done })),
    ];
    const shown = chips.slice(0, 3);
    const more = chips.length - shown.length;
    const label = `${niceDate(iso)}${chips.length ? `, ${chips.length} item${chips.length > 1 ? 's' : ''}` : ''}${r ? `, ${r.job}` : ''}`;
    cells += `<button type="button" class="cell${inMonth ? '' : ' out'}${iso === today ? ' today' : ''}${iso === state.sel ? ' sel' : ''}" data-date="${iso}" aria-label="${esc(label)}" aria-pressed="${iso === state.sel}">
      <span class="num">${Number(iso.slice(8))}</span>
      ${r ? `<span class="rh" title="${esc(cap(r.job))}">${esc(r.job)}</span>` : ''}
      <span class="dots">${chips.slice(0, 5).map((c) => `<i style="--c:${c.color}"></i>`).join('')}</span>
      <span class="chips">${shown.map((c) => `<span class="ch${c.done ? ' done' : ''}" style="--c:${c.color}">${esc(c.text)}</span>`).join('')}${more > 0 ? `<span class="more">+${more} more</span>` : ''}</span>
    </button>`;
  }
  return `
    ${band.length ? `<div class="band card rise"><div class="band-h">During ${MONTH_NAMES[m - 1]}</div><ul>${band.map((e) => `<li style="--c:${KINDS[e.kind].color}"><span class="sw"></span><span><b>${esc(e.title)}</b>${e.bed ? ` <span class="bed">${esc(e.bed)}</span>` : ''}${e.end && monthKey(e.end) !== monthKey(e.start) ? ` <small>${esc(e.when)}</small>` : ''}${e.done ? ' <small>✓ done</small>' : ''}</span></li>`).join('')}</ul></div>` : ''}
    <div class="grid-wrap${anim}">
      <div class="dow">${DAYS.map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="grid" role="grid">${cells}</div>
    </div>`;
}

function listHTML(anim) {
  const start = `${state.month}-01` < todayISO() && todayISO().slice(0, 7) === state.month ? todayISO() : `${state.month}-01`;
  let html = '';
  let lastMonth = '';
  let count = 0;
  for (let i = 0; i < 92; i++) {
    const iso = addDays(start, i);
    const key = monthKey(iso);
    if (key !== lastMonth) {
      lastMonth = key;
      const [y, m] = key.split('-').map(Number);
      const band = monthBand(state.events, key).filter((e) => visible(e.kind));
      html += `<h3 class="ag-month">${MONTH_NAMES[m - 1]} ${y}</h3>`;
      if (band.length) html += `<ul class="ag-band">${band.map((e) => `<li style="--c:${KINDS[e.kind].color}"><span class="sw"></span>During the month: <b>${esc(e.title)}</b>${e.bed ? ` · ${esc(e.bed)}` : ''}</li>`).join('')}</ul>`;
    }
    const { items, tasks } = itemsFor(iso);
    if (!items.length && !tasks.length) continue;
    count++;
    html += `<button type="button" class="ag-day card${iso === state.sel ? ' sel' : ''}${iso === todayISO() ? ' today' : ''}" data-date="${iso}">
      <span class="ag-date"><b>${Number(iso.slice(8))}</b><small>${DAYS[dateOf(iso).getDay()]}</small></span>
      <span class="ag-items">${items.map((x) => `<span class="ag-it" style="--c:${KINDS[x.e.kind].color}"><span class="sw"></span>${x.role === 'end' ? 'Ends: ' : ''}${esc(x.e.title)}${x.e.bed ? ` <span class="bed">${esc(x.e.bed)}</span>` : ''}</span>`).join('')}
      ${tasks.map((t) => `<span class="ag-it${t.done ? ' done' : ''}" style="--c:${KINDS.task.color}"><span class="sw"></span>${t.done ? '✓ ' : ''}${esc(t.text)}</span>`).join('')}</span>
      <span class="ag-rel">${relDays(iso)}</span>
    </button>`;
  }
  if (!count) html += '<div class="card empty">Nothing dated in the next three months with these filters.</div>';
  return `<div class="agenda${anim}">${html}</div>`;
}

function renderDay(root) {
  const iso = state.sel;
  const box = root.querySelector('.cal-day');
  const { items, tasks } = itemsFor(iso);
  const on = ongoing(state.events, iso).filter((e) => visible(e.kind));
  const r = rhythmFor(iso);
  const noteLink = (e) => `<a href="#/notes/${esc(e.src)}">From the note</a>`;
  box.innerHTML = `
    <div class="cd-head">
      <div><div class="cd-date">${esc(niceDate(iso))}</div><div class="cd-rel">${relDays(iso)}</div></div>
    </div>
    ${r ? `<div class="cd-rhythm"><span class="sw"></span>Weekly rhythm: <b>${esc(cap(r.job))}</b></div>` : ''}
    ${items.length ? `<ul class="cd-list">${items.map((x) => `<li style="--c:${KINDS[x.e.kind].color}">
        <span class="sw"></span>
        <div><div class="cd-t">${x.role === 'end' ? 'Ends: ' : x.role === 'start' ? 'Starts: ' : ''}${esc(x.e.title)}${x.e.bed ? ` <span class="bed">${esc(x.e.bed)}</span>` : ''}</div>
        <div class="cd-m"><span class="kind">${KINDS[x.e.kind].label}</span> · ${esc(approxText(x.e))} · ${noteLink(x.e)}</div></div></li>`).join('')}</ul>` : ''}
    ${on.length ? `<div class="cd-sub">Ongoing</div><ul class="cd-list on">${on.map((e) => `<li style="--c:${KINDS[e.kind].color}"><span class="sw"></span><div><div class="cd-t">${esc(e.title)}${e.bed ? ` <span class="bed">${esc(e.bed)}</span>` : ''}</div><div class="cd-m">${esc(e.when)}</div></div></li>`).join('')}</ul>` : ''}
    ${!items.length && !on.length && !r ? '<p class="cd-empty">Nothing planned from the notes on this day.</p>' : ''}
    <div class="cd-sub">My tasks</div>
    ${state.hidden.has('tasks') ? '<p class="cd-empty">My tasks are hidden. Turn on the "My tasks" filter to see them.</p>' : `
    <ul class="cd-tasks">${tasks.map((t) => `<li class="${t.done ? 'done' : ''}">
      <label><input type="checkbox" data-task="${esc(t.id)}"${t.done ? ' checked' : ''}><span>${esc(t.text)}</span></label>
      <button type="button" class="icon-btn" data-deltask="${esc(t.id)}" aria-label="Delete task: ${esc(t.text)}">✕</button></li>`).join('')}</ul>
    <form class="cd-add" autocomplete="off">
      <input name="task" type="text" maxlength="140" placeholder="Add a task for this day" aria-label="New task for ${esc(niceDate(iso))}">
      <button class="btn" type="submit">Add</button>
    </form>`}`;
}

/* ---------- Events ---------- */
function shiftMonth(n) {
  const [y, m] = state.month.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  state.month = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  // Keep the selected day inside the shown month.
  if (state.sel.slice(0, 7) !== state.month) state.sel = state.month === todayISO().slice(0, 7) ? todayISO() : `${state.month}-01`;
  state.dir = n;
}

function onClick(e, root) {
  const nav = e.target.closest('[data-cal]');
  if (nav) {
    const a = nav.dataset.cal;
    if (a === 'prev') shiftMonth(-1);
    if (a === 'next') shiftMonth(1);
    if (a === 'today') { state.dir = state.month < todayISO().slice(0, 7) ? 1 : state.month > todayISO().slice(0, 7) ? -1 : 0; state.month = todayISO().slice(0, 7); state.sel = todayISO(); }
    renderAll(root);
    return;
  }
  const v = e.target.closest('[data-calview]');
  if (v) { state.view = v.dataset.calview; saveUI(); renderAll(root); return; }
  const g = e.target.closest('[data-group]');
  if (g) {
    const k = g.dataset.group;
    if (state.hidden.has(k)) state.hidden.delete(k); else state.hidden.add(k);
    saveUI();
    renderAll(root);
    return;
  }
  const del = e.target.closest('[data-deltask]');
  if (del) {
    state.tasks = state.tasks.filter((t) => t.id !== del.dataset.deltask);
    store(TASKS_KEY, state.tasks);
    renderMain(root); renderDay(root);
    return;
  }
  const cell = e.target.closest('[data-date]');
  if (cell) {
    state.sel = cell.dataset.date;
    if (state.view === 'month' && state.sel.slice(0, 7) !== state.month) {
      shiftMonth(state.sel > `${state.month}-31` ? 1 : -1);
      state.sel = cell.dataset.date;
      renderHead(root);
    }
    renderMain(root);
    renderDay(root);
    // On phones the day panel is below the grid: bring it into view.
    if (matchMedia('(max-width: 899px)').matches) root.querySelector('.cal-day').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }
}

function onSubmit(e, root) {
  const form = e.target.closest('.cd-add');
  if (!form) return;
  e.preventDefault();
  const text = form.task.value.trim().slice(0, 140);
  if (!text) return;
  state.tasks.push({ id: newId(), date: state.sel, text, done: false });
  if (!store(TASKS_KEY, state.tasks)) alert("Couldn't save on this device (storage is off or full).");
  renderMain(root);
  renderDay(root);
  root.querySelector('.cd-add input')?.focus();
}

function onChange(e, root) {
  const box = e.target.closest('[data-task]');
  if (!box) return;
  const t = state.tasks.find((x) => x.id === box.dataset.task);
  if (!t) return;
  t.done = box.checked;
  store(TASKS_KEY, state.tasks);
  renderMain(root);
  renderDay(root);
}

function onKey(e, root) {
  const cell = e.target.closest('.grid .cell');
  if (!cell) return;
  const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
  if (!step) return;
  e.preventDefault();
  const iso = addDays(cell.dataset.date, step);
  state.sel = iso;
  if (iso.slice(0, 7) !== state.month) { shiftMonth(iso > cell.dataset.date ? 1 : -1); state.sel = iso; renderHead(root); }
  renderMain(root);
  renderDay(root);
  root.querySelector(`.grid .cell[data-date="${iso}"]`)?.focus();
}
