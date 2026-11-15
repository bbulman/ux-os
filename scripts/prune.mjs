// Lists the third-party entries I have never used and that no job picks or names as a rival, with the
// setting that would switch each one off. It only reports: it never edits a settings file.
//   node scripts/prune.mjs          the report
//   node scripts/prune.mjs --json   the same, as JSON
// Run node scripts/scan.mjs and node scripts/usage.mjs first, so statuses and counts are current.
// With data/inventory.local.json present (scan writes it), it also says which packs load from a claude.ai
// synced copy and how many skills each one puts in Claude's list.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadData } from '../build/load.mjs';
import { loadout, pluginFor } from '../build/loadout.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const D = loadData(root);
const { plugins } = loadout(D.plugins, D.entries);
const inv = existsSync(join(root, 'data/inventory.local.json')) ? JSON.parse(readFileSync(join(root, 'data/inventory.local.json'), 'utf8')) : null;

// What a job depends on stays, whether it is the pick or the rival, and so does the plugin it lives in.
const keepIds = new Set();
const keepPlugins = new Set();
for (const j of D.jobs) {
  for (const ref of [j.use, j.rival?.use].filter(Boolean)) {
    const id = D.resolve(ref);
    if (id) keepIds.add(id);
    if (ref.includes(':')) keepPlugins.add(ref.split(':')[0]);
  }
}
for (const id of keepIds) {
  const p = pluginFor(D.entries.find((e) => e.id === id), plugins);
  if (p) keepPlugins.add(p.name);
}

const synced = (p) => p.kind === 'synced' || Boolean(inv?.plugins?.[p.name]?.via?.some((v) => v.endsWith('@synced')));
// Inventory keys read "<kind> <name>", such as "skill interaction-design:design-form".
const listed = (p) => (inv ? Object.entries(inv.items || {}).filter(([k, it]) => /^(skill|command) /.test(k) && k.split(' ')[1].startsWith(`${p.name}:`) && it.status === 'available').length : null);

const unused = D.entries.filter((e) => e.origin === 'third' && e.status !== 'off' && !e.usage.total);
const candidates = unused.filter((e) => !keepIds.has(e.id));

const off = [];   // a setting switches it off
const stuck = []; // no setting reaches it on its own
const kept = unused.filter((e) => keepIds.has(e.id)).map((e) => ({ entry: e.id, name: e.name, why: 'a job picks it or names it as the rival' }));
for (const e of candidates) {
  const p = pluginFor(e, plugins);
  if (!p) {
    if (!e.invoke) stuck.push({ entry: e.id, name: e.name, why: 'kept by skill name in your own settings: switch off each of its skills there' });
    else off.push({ entry: e.id, name: e.name, setting: { skillOverrides: { [e.invoke]: 'off' } } });
    continue;
  }
  if (p.kind === 'synced') { stuck.push({ entry: e.id, name: e.name, why: `the ${p.name} plugin comes only from claude.ai: switch it off there` }); continue; }
  if (p.kind === 'private') continue; // mine, not third-party
  const whole = p.owner === e || (p.entry && p.entry === e.id);
  if (whole && !keepPlugins.has(p.name)) {
    const keys = plugins.filter((q) => q.kind === 'public' && (q === p || (p.entry && q.entry === p.entry))).map((q) => q.key);
    off.push({ entry: e.id, name: e.name, setting: { enabledPlugins: Object.fromEntries(keys.map((k) => [k, false])) }, synced: synced(p), listed: listed(p) });
  } else if (whole) {
    kept.push({ entry: e.id, name: e.name, why: 'a job uses a skill inside it' });
  } else {
    stuck.push({ entry: e.id, name: e.name, why: `a skill inside ${p.name}, and skillOverrides does not reach plugin skills: keep it, or switch off the whole pack` });
  }
}

const report = {
  since: D.usage.since,
  unusedThirdParty: unused.length,
  switchOff: off,
  cannotSwitchAlone: stuck,
  kept,
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const day = new Date(`${D.usage.since}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  console.log(`Since ${day}: ${unused.length} third-party entries are switched on and have never run.`);
  console.log(`\nSwitch off (${off.length})`);
  for (const o of off) {
    const extra = [o.listed != null ? `puts ${o.listed} skills in Claude's list` : '', o.synced ? 'also loads from a claude.ai synced copy, so switch it off there too' : ''].filter(Boolean).join('; ');
    console.log(`  ${o.name}${extra ? `: ${extra}` : ''}`);
    console.log(`    ${JSON.stringify(o.setting)}`);
  }
  console.log(`\nNo setting switches these off on their own (${stuck.length})`);
  for (const s of stuck) console.log(`  ${s.name}: ${s.why}`);
  console.log(`\nKept, because a job depends on them (${kept.length})`);
  for (const k of kept) console.log(`  ${k.name}: ${k.why}`);
  console.log('\nThis only reports. Nothing was changed.');
  if (off.length + stuck.length + kept.length !== unused.length) throw new Error('prune: the three lists do not add up to every unused entry');
}
