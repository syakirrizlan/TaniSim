// Builds the TaniSim PWA into dist/.
// - copies the app shell from app/
// - copies notes/*.md and writes notes/index.json (titles, tags, dated milestones)
// - reads the "Live versions" links from README.md
// - vendors marked + mermaid so the app works offline
// - stamps sw.js with a content hash and the precache list
import { createHash } from 'node:crypto';
import { cp, mkdir, readdir, readFile, rm, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');

function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map((x) => x.trim()).filter(Boolean);
    meta[kv[1]] = v;
  }
  return { meta, body: src.slice(m[0].length) };
}

// "- [ ] First cili padi pick (Mar 2027)" -> { text, done, year, month }
function parseMilestones(body) {
  const list = [];
  const re = /^\s*-\s\[( |x|X)\]\s+(.+?)\s*\(([^()]*?)\b([A-Za-z]{3})[a-z]*\s+(\d{4})\)\s*$/gm;
  for (const m of body.matchAll(re)) {
    const month = MONTHS.indexOf(m[4].toLowerCase());
    if (month < 0) continue;
    list.push({
      text: m[2].replace(/\*\*/g, '').trim(),
      when: `${m[3]}${m[4]} ${m[5]}`.trim(),
      done: m[1] !== ' ',
      year: Number(m[5]),
      month,
    });
  }
  return list;
}

// "**Sun** sow · **Wed** post the harvest list · ..." -> [{ day, job }]
function parseRhythm(body) {
  const line = body.split('\n').find((l) => /\*\*Sun\*\*/.test(l) && l.includes('·'));
  if (!line) return null;
  const items = [...line.matchAll(/\*\*(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\*\*\s+([^·*]+)/g)];
  return items.map((m) => ({ day: m[1], job: m[2].trim().replace(/[.\s]+$/, '') }));
}

function parseLiveLinks(readme) {
  const section = readme.split(/^## Live versions/m)[1] || '';
  return [...section.matchAll(/^-\s+(.+?):\s+(https:\/\/\S+)/gm)].map((m) => ({ title: m[1].trim(), url: m[2] }));
}

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(p)));
    else files.push(p);
  }
  return files;
}

async function main() {
  await rm(out, { recursive: true, force: true });
  await mkdir(path.join(out, 'notes'), { recursive: true });
  await mkdir(path.join(out, 'vendor'), { recursive: true });

  await cp(path.join(root, 'app'), out, { recursive: true });

  // Notes
  const noteFiles = (await readdir(path.join(root, 'notes'))).filter((f) => f.endsWith('.md')).sort();
  const notes = [];
  let rhythm = null;
  for (const file of noteFiles) {
    const src = await readFile(path.join(root, 'notes', file), 'utf8');
    const { meta, body } = parseFrontmatter(src);
    const name = file.replace(/\.md$/, '');
    const slug = slugify(name);
    const h1 = body.match(/^#\s+(.+)$/m);
    const title = h1 ? h1[1].trim() : name;
    rhythm = rhythm || parseRhythm(body);
    notes.push({
      slug,
      name, // the Obsidian name, used to resolve [[wikilinks]]
      title,
      file: `notes/${slug}.md`,
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      status: meta.status || '',
      created: meta.created || '',
      updated: meta.updated || meta.created || '',
      milestones: parseMilestones(body),
    });
    await writeFile(path.join(out, 'notes', `${slug}.md`), body);
  }

  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  const data = { builtAt: new Date().toISOString(), notes, rhythm, graphics: parseLiveLinks(readme) };
  await writeFile(path.join(out, 'notes', 'index.json'), JSON.stringify(data, null, 2));

  // Vendored libraries
  await cp(path.join(root, 'node_modules/marked/lib/marked.esm.js'), path.join(out, 'vendor/marked.esm.js'));
  await cp(path.join(root, 'node_modules/mermaid/dist/mermaid.min.js'), path.join(out, 'vendor/mermaid.min.js'));

  // Service worker: precache everything except the big diagram library (cached on first use)
  const all = (await walk(out)).map((f) => path.relative(out, f).split(path.sep).join('/'));
  const precache = ['./', ...all.filter((f) => f !== 'sw.js' && f !== 'vendor/mermaid.min.js' && !f.endsWith('.map')).map((f) => `./${f}`)];
  const hash = createHash('sha256');
  for (const f of all.sort()) if (f !== 'sw.js') hash.update(f).update(await readFile(path.join(out, f)));
  const version = hash.digest('hex').slice(0, 12);

  const swPath = path.join(out, 'sw.js');
  const sw = (await readFile(swPath, 'utf8'))
    .replace('__VERSION__', version)
    .replace('__PRECACHE__', JSON.stringify(precache, null, 2));
  await writeFile(swPath, sw);

  let bytes = 0;
  for (const f of all) bytes += (await stat(path.join(out, f))).size;
  console.log(`Built dist/ — ${notes.length} notes, ${precache.length} precached files, version ${version}, ${(bytes / 1024).toFixed(0)} KB total`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
