import { marked } from './vendor/marked.esm.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const view = document.getElementById('view');
let data = null;
const noteCache = new Map();

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const monthIndex = (y, m) => y * 12 + m;

async function loadData() {
  const res = await fetch('notes/index.json');
  data = await res.json();
}

/* ---------------- Routing ---------------- */
function route() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const [, section, slug] = hash.split('/');
  const tab = ['notes', 'graphics', 'layout', 'calendar'].includes(section) ? section : section === 'about' ? '' : 'home';
  document.querySelectorAll('.tabbar a').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  const render = async () => {
    if (layoutMod && section !== 'layout') { layoutMod.unmount(); layoutMod = null; }
    if (calendarMod && section !== 'calendar') { calendarMod.unmount(); calendarMod = null; }
    document.body.classList.toggle('layout-mode', section === 'layout');
    document.querySelector('.info-btn')?.setAttribute('aria-current', section === 'about' ? 'page' : 'false');
    if (section === 'layout') return renderLayout();
    if (section === 'calendar') return renderCalendar();
    if (section === 'about') return renderAbout();
    if (section === 'notes' && slug) return renderNote(decodeURIComponent(slug));
    if (section === 'notes') return renderNotes();
    if (section === 'graphics') return renderGraphics();
    return renderHome();
  };
  const run = async () => {
    await render();
    if (section !== 'layout') window.scrollTo({ top: 0, behavior: 'instant' });
  };
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(run);
  } else run();
}

/* ---------------- Home ---------------- */
function relLabel(diff) {
  if (diff < 0) return { text: diff === -1 ? 'Last month' : `${-diff} months ago`, cls: 'now' };
  if (diff === 0) return { text: 'This month', cls: 'now' };
  if (diff === 1) return { text: 'Next month', cls: 'soon' };
  return { text: `In ${diff} months`, cls: '' };
}

function milestoneItem(m, note, i, nowIdx, extraClass = '') {
  const diff = monthIndex(m.year, m.month) - nowIdx;
  const rel = relLabel(diff);
  return `<li><a class="card ms rise ${extraClass}" style="--i:${i}" href="#/notes/${note.slug}">
    <div class="ms-date"><b>${MONTHS[m.month]}</b><i>${m.year}</i></div>
    <div>
      <div class="ms-text">${esc(m.text)}</div>
      <div class="ms-meta"><span class="tag ${rel.cls}">${rel.text}</span><span>${esc(shortTitle(note))}</span></div>
    </div></a></li>`;
}

function renderHome() {
  const now = new Date();
  const nowIdx = monthIndex(now.getFullYear(), now.getMonth());
  const all = data.notes.flatMap((n) => n.milestones.map((m) => ({ m, n })));
  const open = all.filter(({ m }) => !m.done).sort((a, b) => monthIndex(a.m.year, a.m.month) - monthIndex(b.m.year, b.m.month));
  const overdue = open.filter(({ m }) => monthIndex(m.year, m.month) < nowIdx);
  const upcoming = open.filter(({ m }) => monthIndex(m.year, m.month) >= nowIdx).slice(0, 5);
  const done = all.filter(({ m }) => m.done).length;

  const todayName = DAYS[now.getDay()];
  const rhythm = data.rhythm || [];
  const todayJob = rhythm.find((r) => r.day === todayName);
  const next = (() => {
    for (let k = 1; k <= 7; k++) {
      const d = DAYS[(now.getDay() + k) % 7];
      const r = rhythm.find((x) => x.day === d);
      if (r) return { ...r, inDays: k };
    }
    return null;
  })();

  const week = rhythm.length
    ? `<section class="section">
        <div class="section-head"><h2>This week's rhythm</h2><span>From Block C</span></div>
        <div class="week">${DAYS.map((d, i) => {
          const r = rhythm.find((x) => x.day === d);
          return `<div class="day rise ${r ? 'has-job' : ''} ${d === todayName ? 'is-today' : ''}" style="--i:${i}">
            <span class="d">${d}</span><span class="dot"></span>${r ? `<span class="job">${esc(r.job)}</span>` : ''}</div>`;
        }).join('')}</div>
        <div class="card today-callout rise" style="--i:7">
          <div>
            <div class="big">${todayJob ? `Today: ${esc(cap(todayJob.job))}` : 'Today: no fixed job'}</div>
            <small>${next ? `Next: ${esc(cap(next.job))} on ${next.day}${next.inDays === 1 ? ' (tomorrow)' : ''}` : ''}</small>
          </div>
        </div>
      </section>`
    : '';

  view.innerHTML = `
    <section class="hero rise">
      <div class="place">Sungai Lalah, Pedas · 1.3 acres</div>
      <h1>Farm plan</h1>
      <div class="today">${now.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
      ${heroArt()}
    </section>
    ${week}
    <section class="section">
      <div class="section-head"><h2>Up next</h2><span>${done} of ${all.length} milestones done</span></div>
      ${upcoming.length ? `<ul class="ms-list">${upcoming.map(({ m, n }, i) => milestoneItem(m, n, i, nowIdx)).join('')}</ul>` : '<div class="card empty">No dated milestones ahead.</div>'}
      ${overdue.length ? `<details class="overdue-box"><summary>${overdue.length} earlier milestone${overdue.length > 1 ? 's' : ''} not ticked yet</summary>
        <ul class="ms-list">${overdue.map(({ m, n }, i) => milestoneItem(m, n, i, nowIdx, 'overdue')).join('')}</ul></details>` : ''}
    </section>
    <section class="section" id="nextWeek"></section>
    <a class="about-foot" href="#/about">About TaniSim · version ${esc(data.app?.version || '')}</a>`;
  fillNextWeek();
}

// "Next 7 days" on Today, from the calendar.
async function fillNextWeek() {
  const box = document.getElementById('nextWeek');
  if (!box) return;
  try {
    const cal = await import('./calendar.js');
    if (!document.body.contains(box)) return;
    const items = cal.upcoming(data, 7).filter((x) => x.role !== 'end');
    const fmtDay = (iso) => { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(y, m - 1, d); return `${DAYS[dt.getDay()]} ${d} ${MONTHS[m - 1]}`; };
    box.innerHTML = `
      <div class="section-head"><h2>Next 7 days</h2><a href="#/calendar">Open calendar →</a></div>
      ${items.length ? `<ul class="nw-list">${items.slice(0, 6).map((x, i) => `<li class="card rise" style="--i:${i};--c:${cal.KINDS[x.kind].color}"><a href="#/calendar/${x.iso}"><span class="sw"></span><span class="nw-t">${esc(x.title)}${x.bed ? ` <span class="bed">${esc(x.bed)}</span>` : ''}</span><span class="nw-d">${fmtDay(x.iso)}</span></a></li>`).join('')}</ul>
        ${items.length > 6 ? `<p class="nw-more"><a href="#/calendar">${items.length - 6} more in the calendar</a></p>` : ''}`
        : '<div class="card empty">Nothing dated in the next 7 days. <a href="#/calendar">Open the calendar</a> to add a task.</div>'}`;
  } catch { box.innerHTML = ''; }
}

const shortTitle = (n) => n.title.replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s*\([^)]*\)\s*$/, '');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function heroArt() {
  // Two swaying chilli plants
  return `<svg class="hero-art" viewBox="0 0 160 130" aria-hidden="true">
    <rect x="0" y="118" width="160" height="12" rx="3" fill="#DCC9B2" opacity=".9"/>
    <g class="sway"><path d="M60 120V62" stroke="#8DC4A0" stroke-width="4" stroke-linecap="round"/>
      <path d="M60 88c-14-2-22-12-22-22 12 0 20 8 22 22Zm0-14c12-2 20-12 20-22-11 0-19 8-20 22Z" fill="#8DC4A0"/>
      <path d="M60 64c6 2 8 12 4 24-2-10-6-16-4-24Z" fill="#E5574F"/></g>
    <g class="sway b"><path d="M104 120V74" stroke="#B9DEC4" stroke-width="4" stroke-linecap="round"/>
      <path d="M104 96c-12-2-18-10-18-18 10 0 16 6 18 18Zm0-10c10-2 16-10 16-18-9 0-15 6-16 18Z" fill="#B9DEC4"/>
      <path d="M104 76c5 2 7 10 3 20-2-8-5-13-3-20Z" fill="#F08A7E"/></g>
  </svg>`;
}

/* ---------------- Notes ---------------- */
function noteProgress(n) {
  const total = n.milestones.length;
  const done = n.milestones.filter((m) => m.done).length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

function renderNotes() {
  view.innerHTML = `
    <div class="section-head rise"><h2 style="font-size:40px">Notes</h2><span>${data.notes.length} notes · saved offline</span></div>
    <div class="note-list">${data.notes.map((n, i) => {
      const p = noteProgress(n);
      return `<a class="card note-card rise" style="--i:${i}" href="#/notes/${n.slug}">
        <div class="note-meta">${n.status ? `<span class="tag status ${n.status.startsWith('draft') ? 'draft' : ''}">${esc(n.status)}</span>` : ''}
          ${n.tags.filter((t) => t !== 'draft').slice(0, 3).map((t) => `<span class="tag">#${esc(t)}</span>`).join('')}</div>
        <h3>${esc(n.title)}</h3>
        <p>Updated ${esc(n.updated || '—')}</p>
        ${p.total ? `<div class="row"><div class="progress"><span style="--p:${p.pct}%"></span></div><span>${p.done}/${p.total} milestones</span></div>` : ''}
      </a>`;
    }).join('')}</div>`;
}

function resolveWikilinks(md) {
  // Leave fenced code blocks (mermaid) alone.
  return md.split(/(```[\s\S]*?```)/g).map((part, i) => {
    if (i % 2) return part;
    return part.replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, target, alias) => {
      const label = alias || target;
      const hit = data.notes.find((n) => n.name.toLowerCase() === target.trim().toLowerCase());
      return hit
        ? `<a class="wikilink" href="#/notes/${hit.slug}">${esc(label)}</a>`
        : `<span class="wikilink" title="This note is in your vault but not in the app yet">${esc(label)}</span>`;
    });
  }).join('');
}

function enhance(root) {
  // Obsidian callouts: > [!type] Title
  root.querySelectorAll('blockquote').forEach((bq) => {
    const p = bq.firstElementChild;
    if (!p || p.tagName !== 'P') return;
    const m = p.innerHTML.match(/^\[!(\w+)\][+-]?\s*([^\n]*)\n?/);
    if (!m) return;
    const type = m[1].toLowerCase();
    const box = document.createElement('div');
    box.className = `callout callout-${type}`;
    box.innerHTML = `<div class="callout-title">${m[2] || cap(type)}</div>`;
    p.innerHTML = p.innerHTML.slice(m[0].length);
    if (!p.textContent.trim()) p.remove();
    box.append(...bq.childNodes);
    bq.replaceWith(box);
  });
  root.querySelectorAll('table').forEach((t) => {
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    t.replaceWith(wrap);
    wrap.append(t);
  });
  root.querySelectorAll('a[href^="http"]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
  const diagrams = [...root.querySelectorAll('pre > code.language-mermaid')];
  if (diagrams.length) renderMermaid(diagrams);
}

let mermaidReady = null;
function loadMermaid() {
  mermaidReady ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'vendor/mermaid.min.js';
    s.onload = () => {
      window.mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict', fontFamily: 'Barlow, sans-serif' });
      resolve(window.mermaid);
    };
    s.onerror = () => { mermaidReady = null; reject(new Error('offline')); };
    document.head.append(s);
  });
  return mermaidReady;
}

async function renderMermaid(blocks) {
  const boxes = blocks.map((code) => {
    const box = document.createElement('div');
    box.className = 'mermaid-box';
    box.innerHTML = '<div class="mermaid-wait">Drawing diagram…</div>';
    const src = code.textContent;
    code.parentElement.replaceWith(box);
    return { box, src };
  });
  try {
    const mermaid = await loadMermaid();
    for (const [i, { box, src }] of boxes.entries()) {
      const { svg } = await mermaid.render(`mmd-${Date.now()}-${i}`, src);
      box.innerHTML = svg;
    }
  } catch {
    boxes.forEach(({ box }) => {
      box.innerHTML = '<div class="mermaid-wait">This diagram needs a connection the first time. After that it works offline.</div>';
    });
  }
}

async function renderNote(slug) {
  const note = data.notes.find((n) => n.slug === slug);
  if (!note) {
    view.innerHTML = `<a class="back" href="#/notes">← Notes</a><div class="card empty">That note isn't in the app.</div>`;
    return;
  }
  if (!noteCache.has(slug)) noteCache.set(slug, await (await fetch(note.file)).text());
  const html = marked.parse(resolveWikilinks(noteCache.get(slug)), { gfm: true });
  view.innerHTML = `
    <a class="back rise" href="#/notes">← Notes</a>
    <div class="note-meta rise">${note.status ? `<span class="tag status ${note.status.startsWith('draft') ? 'draft' : ''}">${esc(note.status)}</span>` : ''}
      ${note.updated ? `<span class="tag">Updated ${esc(note.updated)}</span>` : ''}</div>
    <article class="prose rise" style="--i:1">${html}</article>`;
  enhance(view.querySelector('.prose'));
  document.title = `${shortTitle(note)} · TaniSim`;
}

/* ---------------- Layout (build mode) ---------------- */
let layoutMod = null;
async function renderLayout() {
  if (layoutMod) return;
  view.innerHTML = '<div class="card empty">Loading layout…</div>';
  try {
    const mod = await import('./layout.js');
    if (!location.hash.startsWith('#/layout')) return; // user moved on while loading
    layoutMod = mod;
    layoutMod.mount(view);
    document.title = 'Layout · TaniSim';
  } catch {
    view.innerHTML = '<div class="card empty">The layout builder couldn\'t load. Check your connection and try again.</div>';
  }
}

/* ---------------- Calendar ---------------- */
let calendarMod = null;
async function renderCalendar() {
  view.innerHTML = '<div class="card empty">Loading calendar…</div>';
  try {
    const mod = await import('./calendar.js');
    if (!location.hash.startsWith('#/calendar')) return;
    if (calendarMod) calendarMod.unmount();
    calendarMod = mod;
    mod.mount(view, data);
    document.title = 'Calendar · TaniSim';
  } catch {
    view.innerHTML = '<div class="card empty">The calendar couldn\'t load. Check your connection and try again.</div>';
  }
}

/* ---------------- About ---------------- */
function renderAbout() {
  const app = data.app || { version: '', commit: '', changelog: [] };
  const built = data.builtAt ? new Date(data.builtAt) : null;
  const builtText = built ? built.toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
  const log = app.changelog || [];
  const entry = (c, open) => `<details class="cl card"${open ? ' open' : ''}><summary><b>Version ${esc(c.version)}</b><span>${esc(new Date(c.date + 'T00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }))}</span></summary><ul>${c.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></details>`;
  view.innerHTML = `
    <section class="about-hero rise">
      <img src="icons/icon.svg" alt="" width="72" height="72">
      <div>
        <h1>TaniSim</h1>
        <p class="ver">Version <b>${esc(app.version)}</b></p>
        <p class="build">Build ${esc(app.commit || 'local')}${builtText ? ` · ${esc(builtText)}` : ''}</p>
      </div>
    </section>
    <section class="section">
      <div class="status-grid">
        <div class="card st rise" style="--i:1"><span class="st-k">Works offline</span><span class="st-v" id="stOffline">Checking…</span></div>
        <div class="card st rise" style="--i:2"><span class="st-k">Installed</span><span class="st-v" id="stInstalled">${isStandalone() ? 'Yes, running as an app' : 'No, in the browser'}</span></div>
        <div class="card st rise" style="--i:3"><span class="st-k">Connection</span><span class="st-v">${navigator.onLine ? 'Online' : 'Offline'}</span></div>
        <div class="card st rise" style="--i:4"><span class="st-k">Space used</span><span class="st-v" id="stStorage">…</span></div>
      </div>
      <div class="about-actions rise" style="--i:5">
        <button type="button" class="btn" id="checkUpdate">Check for updates</button>
        <span class="upd-msg" id="updMsg" role="status" aria-live="polite"></span>
      </div>
    </section>
    <section class="section">
      <div class="section-head"><h2>What's new</h2><span>${log.length} releases</span></div>
      <div class="cl-list">${log.map((c, i) => entry(c, i === 0)).join('')}</div>
    </section>
    <section class="section">
      <div class="section-head"><h2>About</h2></div>
      <div class="card about-text">
        <p>TaniSim is the planning app for the 1.3-acre farm at Sungai Lalah, Pedas: the farm notes, a calendar built from them, and a layout builder for sketching the land.</p>
        <p>The notes and the app itself are saved for offline use. Your <b>layout</b> and <b>calendar tasks</b> are saved on this device only. To move a layout to another device, use ⋯ → Export layout file in Layout.</p>
        <p class="credits">Built with <a href="https://marked.js.org/" target="_blank" rel="noopener">marked</a> and <a href="https://mermaid.js.org/" target="_blank" rel="noopener">Mermaid</a> (MIT licence), and the Barlow typeface (SIL Open Font Licence).</p>
      </div>
    </section>`;
  document.title = 'About · TaniSim';
  // Offline copy and storage
  refreshOfflineStatus();
  navigator.serviceWorker?.ready.then(() => setTimeout(refreshOfflineStatus, 300)).catch(() => {});
  (async () => {
    const stg = document.getElementById('stStorage');
    try {
      const est = await navigator.storage?.estimate?.();
      if (stg) stg.textContent = est ? `${(est.usage / 1048576).toFixed(1)} MB` : 'Unknown';
    } catch { if (stg) stg.textContent = 'Unknown'; }
  })();
  const btn = document.getElementById('checkUpdate');
  const msg = document.getElementById('updMsg');
  btn.addEventListener('click', async () => {
    if (!swReg) { msg.textContent = 'Updates need the installed app or a secure (https) page.'; return; }
    if (!navigator.onLine) { msg.textContent = "You're offline. Connect to the internet and try again."; return; }
    btn.disabled = true;
    msg.textContent = 'Checking…';
    try {
      await swReg.update();
      const w = swReg.installing || swReg.waiting;
      if (!w) { msg.textContent = `You're on the latest version (${app.version}).`; return; }
      msg.textContent = 'A new version is downloading…';
      const ready = () => {
        msg.innerHTML = 'A new version is ready. <button type="button" class="link-btn inline" id="applyUpd">Reload now</button>';
        document.getElementById('applyUpd').addEventListener('click', () => applyUpdate(swReg.waiting || w));
      };
      if (w.state === 'installed') ready();
      else w.addEventListener('statechange', () => { if (w.state === 'installed') ready(); });
    } catch {
      msg.textContent = "Couldn't check right now. Try again in a moment.";
    } finally {
      btn.disabled = false;
    }
  });
}

async function refreshOfflineStatus() {
  const off = document.getElementById('stOffline');
  if (!off) return;
  try {
    const keys = 'caches' in window ? await caches.keys() : [];
    const shell = keys.find((k) => k.startsWith('tanisim-shell-'));
    if (navigator.serviceWorker?.controller && shell) off.textContent = `Yes (copy ${shell.slice(14, 20)})`;
    else if (navigator.onLine && (swReg?.installing || !navigator.serviceWorker?.controller)) off.textContent = 'Saving for offline use…';
    else off.textContent = 'Not yet: open the app once online';
  } catch { off.textContent = 'Unknown'; }
}

/* ---------------- Graphics ---------------- */
function renderGraphics() {
  const icons = [
    '<svg viewBox="0 0 48 48" width="56" height="56"><path d="M8 38V20m8 18V14m8 24V22m8 16V10m8 28V18" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="10" width="14" height="12" rx="3"/><rect x="26" y="26" width="14" height="12" rx="3"/><path d="M22 16h6a5 5 0 0 1 5 5v5M15 22v10a4 4 0 0 0 4 4h7"/></svg>',
    '<svg viewBox="0 0 48 48" width="56" height="56"><circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="4"/><path d="M20 16l12 8-12 8Z" fill="currentColor"/></svg>',
  ];
  view.innerHTML = `
    <div class="section-head rise"><h2 style="font-size:40px">Graphics</h2><span>Live on claude.ai</span></div>
    <div class="gfx-grid">${data.graphics.map((g, i) => `
      <a class="card gfx rise" style="--i:${i}" href="${esc(g.url)}" target="_blank" rel="noopener">
        <div class="thumb">${icons[i % icons.length]}</div>
        <h3>${esc(g.title)}</h3>
        <small>Opens in your browser ↗</small>
      </a>`).join('')}</div>
    <div class="card hint rise" style="--i:4">These open on claude.ai, so they need a connection, and they're private until you share them. Your notes on the other tabs work offline.</div>`;
}

/* ---------------- Install ---------------- */
const installBtn = document.getElementById('installBtn');
const iosSheet = document.getElementById('iosSheet');
let deferredPrompt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!isStandalone()) installBtn.hidden = false;
});
if (isIOS && !isStandalone()) installBtn.hidden = false;

installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome === 'accepted') installBtn.hidden = true;
  } else if (isIOS) {
    iosSheet.showModal();
  }
});
window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
  toast('TaniSim is installed. Open it from your home screen.');
});

/* ---------------- Offline + updates ---------------- */
const netPill = document.getElementById('netPill');
const syncNet = () => { netPill.hidden = navigator.onLine; };
window.addEventListener('online', syncNet);
window.addEventListener('offline', syncNet);
syncNet();

const toastEl = document.getElementById('toast');
let toastTimer;
function toast(text, action) {
  clearTimeout(toastTimer);
  document.getElementById('toastText').textContent = text;
  const btn = document.getElementById('toastAction');
  btn.hidden = !action;
  if (action) { btn.textContent = action.label; btn.onclick = action.run; }
  toastEl.hidden = false;
  if (!action) toastTimer = setTimeout(() => { toastEl.hidden = true; }, 4000);
}

let swReg = null;
let reloadOnChange = false;
function applyUpdate(worker) {
  reloadOnChange = true;
  worker.postMessage('skipWaiting');
}
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      swReg = reg;
      const firstInstall = !navigator.serviceWorker.controller;
      const offerUpdate = (worker) => toast('A newer version of your notes is ready.', {
        label: 'Reload',
        run: () => applyUpdate(worker),
      });
      if (reg.waiting && !firstInstall) offerUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w.addEventListener('statechange', () => {
          if (w.state !== 'installed') return;
          if (navigator.serviceWorker.controller) offerUpdate(w);
          else { w.postMessage('skipWaiting'); toast('Saved for offline use.'); }
        });
      });
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload when the user asked for an update (also in the session of the first install).
        if ((reloadOnChange || !firstInstall) && !reloading) { reloading = true; location.reload(); }
        refreshOfflineStatus();
      });
      // Check for new notes when the app comes back to the foreground.
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update(); });
    } catch (err) {
      console.warn('Service worker not registered', err);
    }
  });
}

/* ---------------- Start ---------------- */
const topbar = document.querySelector('.topbar');
const syncTopbar = () => document.documentElement.style.setProperty('--topbar-h', `${topbar.offsetHeight}px`);
syncTopbar();
window.addEventListener('resize', syncTopbar);
new ResizeObserver(syncTopbar).observe(topbar);
window.addEventListener('hashchange', () => { document.title = 'TaniSim'; route(); });
loadData()
  .then(route)
  .catch(() => { view.innerHTML = '<div class="card empty">Couldn\'t load the notes. Check your connection and try again.</div>'; });
