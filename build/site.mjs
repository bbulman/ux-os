// Renders every page in memory first, so a failed render never touches docs/. Then it writes each page
// and asset in place and removes whatever under docs/ the build did not write, so no stale page survives.
// docs/ sits in an iCloud-synced folder, where deleting and recreating a folder leaves "<name> 2" copies
// behind, so docs/ itself is never removed and the build fails if any such copy is left.
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { loadData } from './load.mjs';
import { derive } from './derive.mjs';
import { home } from './pages/home.mjs';
import { jobs } from './pages/jobs.mjs';
import { registry } from './pages/registry.mjs';
import { entry } from './pages/entry.mjs';
import { disciplines, setPage } from './pages/sets.mjs';
import { workflows } from './pages/workflows.mjs';
import { projectFiles, projectFile } from './pages/project-files.mjs';
import { method } from './pages/method.mjs';
import { changelog } from './pages/changelog.mjs';
import { loadoutPage, loadoutJson } from './pages/loadout.mjs';
import { getStarted } from './pages/get-started.mjs';
import { readme, notionManifest } from './outputs.mjs';

const RESERVED = ['assets', 'registry', 'jobs', 'disciplines', 'workflows', 'project-files', 'method', 'changelog', 'loadout', 'get-started'];

export function buildSite(root) {
  const ctx = derive(loadData(root));

  for (const s of ctx.sets) if (RESERVED.includes(s.slug)) throw new Error(`set slug "${s.slug}" collides with a page of the same name`);

  const pages = new Map();
  pages.set('index.html', home(ctx));
  pages.set('jobs/index.html', jobs(ctx));
  pages.set('registry/index.html', registry(ctx));
  for (const e of ctx.entries) pages.set(`registry/${e.id}/index.html`, entry(e, ctx));
  pages.set('disciplines/index.html', disciplines(ctx));
  ctx.sets.forEach((s, i) => pages.set(`${s.slug}/index.html`, setPage(s, i, ctx)));
  pages.set('workflows/index.html', workflows(ctx));
  pages.set('project-files/index.html', projectFiles(ctx));
  ctx.projectFiles.forEach((f, i) => pages.set(`project-files/${f.id}/index.html`, projectFile(f, i, ctx, root)));
  pages.set('method/index.html', method(ctx));
  pages.set('changelog/index.html', changelog(ctx));
  pages.set('loadout/index.html', loadoutPage(ctx));
  pages.set('get-started/index.html', getStarted(ctx));

  const out = new Map(pages);
  out.set('loadout/settings.json', loadoutJson(ctx));
  const assets = join(root, 'build/assets');
  const copied = readdirSync(assets).filter((f) => !f.startsWith('.'));
  for (const f of copied) out.set(`assets/${f}`, readFileSync(join(assets, f)));
  out.set('.nojekyll', '');

  const docs = join(root, 'docs');
  mkdirSync(docs, { recursive: true });
  let written = 0;
  for (const [rel, content] of out) if (put(join(docs, rel), content)) written++;
  const removed = prune(docs, docs, new Set(out.keys()));

  const copies = list(docs).filter((rel) => rel.split('/').some((part) => / 2$/.test(part) || part.includes(' 2.')));
  if (copies.length) throw new Error(`docs/ still holds ${copies.length} sync duplicate${copies.length === 1 ? '' : 's'}:\n  ${copies.join('\n  ')}`);

  writeFileSync(join(root, 'README.md'), readme(ctx));
  writeFileSync(join(root, 'data/notion-manifest.json'), `${JSON.stringify(notionManifest(ctx), null, 2)}\n`);

  return { ctx, pages: pages.size, assets: copied.length, written, removed };
}

// Writes a file only when its bytes change, so an unchanged page gives the sync nothing to do.
function put(file, content) {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  let st = null;
  try { st = statSync(file); } catch { /* not there yet */ }
  if (st?.isDirectory()) rmSync(file, { recursive: true, force: true });
  else if (st && st.size === bytes.length && readFileSync(file).equals(bytes)) return false;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, bytes);
  return true;
}

// Removes every file and folder under dir that the build did not write. Returns how many it removed.
function prune(docs, dir, keep) {
  let removed = 0;
  for (const x of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, x.name);
    if (x.isDirectory()) {
      removed += prune(docs, p, keep);
      if (!readdirSync(p).length) { rmSync(p, { recursive: true, force: true }); removed++; }
    } else if (!keep.has(relative(docs, p).split(sep).join('/'))) {
      rmSync(p, { force: true });
      removed++;
    }
  }
  return removed;
}

function list(dir, base = dir, outList = []) {
  for (const x of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, x.name);
    outList.push(relative(base, p).split(sep).join('/'));
    if (x.isDirectory()) list(p, base, outList);
  }
  return outList;
}
