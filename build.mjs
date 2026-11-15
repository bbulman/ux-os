// Builds docs/, README.md and data/notion-manifest.json from data/, then checks every link. Run: node build.mjs
// The work lives in build/: load.mjs checks the data, derive.mjs works out every count,
// shell.mjs is the page frame, pages/ holds one module per page type. A broken link fails the build.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from './build/site.mjs';
import { checkLinks } from './scripts/check-links.mjs';

const root = dirname(fileURLToPath(import.meta.url));

try {
  const { ctx, pages, assets, written, removed } = buildSite(root);
  const t = ctx.totals;
  for (const w of ctx.warnings) console.warn(`warning: ${w}`);
  console.log(`Built ${pages} pages and ${assets} assets in docs/: ${written} file${written === 1 ? '' : 's'} changed, ${removed} stale removed.`);
  console.log(`${t.entries} entries in ${t.sets} sets: ${t.on} on, ${t.byName} by name, ${t.off} off. ${t.mine} mine, ${t.third} third-party. ${t.unused} never used.`);
  console.log(`${t.jobs} jobs (${t.rivals} with a rival), ${t.workflows} workflows, ${t.projectFiles} project files. Wrote README.md and data/notion-manifest.json.`);

  const links = checkLinks(join(root, 'docs'));
  if (links.problems.length) throw new Error(`The link check found ${links.problems.length} problem${links.problems.length === 1 ? '' : 's'}:\n  ${links.problems.join('\n  ')}`);
  console.log(`Checked ${links.checked} links across ${links.pages} pages, and all ${links.entries} entry pages are linked from registry/. No broken links.`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
