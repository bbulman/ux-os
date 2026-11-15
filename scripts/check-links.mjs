// Checks every relative link and asset in docs/ resolves to a file, that every #fragment names an id on
// the page it points at, and that the registry links every entry page.
//   node scripts/check-links.mjs         (node build.mjs runs it too)
// A link to a folder means its index.html. External URLs are skipped, and so is a fragment holding "=",
// which is a filter for the page's script (registry/#set=research), not an id.
// A root-relative link (/foo) counts as broken: the site is served under /ux-os/.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ATTR = /\s(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
const ID = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

export function checkLinks(docs) {
  if (!existsSync(docs)) return { problems: ['docs/ does not exist. Run node build.mjs first.'], checked: 0, pages: 0, entries: 0 };

  const html = [];
  (function walk(d) {
    for (const x of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, x.name);
      if (x.isDirectory()) walk(p);
      else if (x.name.endsWith('.html')) html.push(p);
    }
  })(docs);

  const texts = new Map(html.map((f) => [f, readFileSync(f, 'utf8')]));
  const idCache = new Map();
  const idsOf = (file) => {
    if (!idCache.has(file)) {
      const text = texts.get(file) ?? (existsSync(file) ? readFileSync(file, 'utf8') : '');
      idCache.set(file, new Set([...text.matchAll(ID)].map((m) => (m[1] ?? m[2]).replace(/&amp;/g, '&'))));
    }
    return idCache.get(file);
  };

  const problems = [];
  let checked = 0;

  const target = (from, ref) => {
    const p = resolve(dirname(from), ref);
    if (ref.endsWith('/') || (existsSync(p) && statSync(p).isDirectory())) return join(p, 'index.html');
    return p;
  };

  for (const [file, text] of texts) {
    const where = relative(docs, file);
    for (const m of text.matchAll(ATTR)) {
      const raw = (m[1] ?? m[2]).replace(/&amp;/g, '&');
      if (!raw) continue;
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('//')) continue;
      if (raw.startsWith('/')) { problems.push(`${where}: root-relative link "${raw}" breaks under /ux-os/`); continue; }
      const hashAt = raw.indexOf('#');
      const pathPart = (hashAt < 0 ? raw : raw.slice(0, hashAt)).split('?')[0];
      const fragment = hashAt < 0 ? null : raw.slice(hashAt + 1);
      checked++;

      let t = file;
      if (pathPart) {
        let ref;
        try { ref = decodeURI(pathPart); } catch { problems.push(`${where}: "${raw}" has a malformed % escape`); continue; }
        t = target(file, ref);
        if (!t.startsWith(docs + sep)) { problems.push(`${where}: "${raw}" points outside docs/`); continue; }
        if (!existsSync(t)) { problems.push(`${where}: "${raw}" is broken (no ${relative(docs, t)})`); continue; }
      }

      if (!fragment || fragment.includes('=') || !t.endsWith('.html')) continue;
      let id;
      try { id = decodeURIComponent(fragment); } catch { problems.push(`${where}: "${raw}" has a malformed % escape`); continue; }
      if (id.toLowerCase() === 'top') continue;
      if (!idsOf(t).has(id)) problems.push(`${where}: "${raw}" names #${id}, which is not an id on ${relative(docs, t)}`);
    }
  }

  // Every entry page must be reachable from the registry.
  let entries = 0;
  const registry = join(docs, 'registry', 'index.html');
  if (!existsSync(registry)) problems.push('registry/index.html does not exist');
  else {
    const text = readFileSync(registry, 'utf8');
    const linked = new Set();
    for (const m of text.matchAll(ATTR)) {
      const raw = m[1] ?? m[2];
      if (raw && !/^[a-z]+:/i.test(raw) && !raw.startsWith('#')) linked.add(relative(docs, target(registry, raw.split('#')[0])));
    }
    const dirs = readdirSync(join(docs, 'registry'), { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name);
    entries = dirs.length;
    for (const id of dirs) {
      if (!linked.has(join('registry', id, 'index.html'))) problems.push(`registry/${id}/ is not linked from registry/`);
    }
  }

  return { problems, checked, pages: html.length, entries };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  const { problems, checked, pages, entries } = checkLinks(join(root, 'docs'));
  if (entries) console.log(`${entries} entry pages, all checked against registry/.`);
  console.log(`Checked ${checked} links across ${pages} pages.`);
  if (problems.length) {
    console.error(`${problems.length} problem${problems.length === 1 ? '' : 's'}:\n  ${problems.join('\n  ')}`);
    process.exit(1);
  }
  console.log('No broken links.');
}
