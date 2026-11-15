// Reads what is installed on this machine and whether Claude can load it, then checks data/registry.json against it.
//   node scripts/scan.mjs                     report drift against user-level settings
//   node scripts/scan.mjs --project <dir>     layer a project's settings and its skills, agents and MCP servers
//   node scripts/scan.mjs --write             also set each entry's status to what the machine says
// What it reads stays on this machine: data/inventory.local.json is gitignored.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const HOME = homedir();
const CLAUDE = join(HOME, '.claude');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const project = opt('--project');

const readJson = (p, fallback = {}) => {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fallback; }
};
const isDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };
const list = (p) => (isDir(p) ? readdirSync(p) : []);

function frontmatter(file) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { return {}; }
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

// ---- settings: user, then project shared, then project local ----
const layers = [join(CLAUDE, 'settings.json')];
if (project) layers.push(join(project, '.claude/settings.json'), join(project, '.claude/settings.local.json'));
const enabledPlugins = {};
const overrides = {};
for (const file of layers) {
  const s = readJson(file);
  Object.assign(enabledPlugins, s.enabledPlugins || {});
  Object.assign(overrides, s.skillOverrides || {});
}

// ---- plugins: local installs, then copies synced from claude.ai ----
// A synced copy whose installation_preference is "available" loads in the desktop app even when
// enabledPlugins says "<name>@synced": false, which is what this machine showed on 14 Nov 2026.
const plugins = new Map(); // name -> { roots: [], loaded, via: [] }
const plugin = (name) => {
  if (!plugins.has(name)) plugins.set(name, { roots: [], loaded: false, via: [] });
  return plugins.get(name);
};
const installed = readJson(join(CLAUDE, 'plugins/installed_plugins.json')).plugins || {};
// A plugin can hold several records (user, project and local installs); every install path is a candidate.
for (const [key, recs] of Object.entries(installed)) {
  const [name] = key.split('@');
  const p = plugin(name);
  for (const rec of [recs].flat()) if (rec?.installPath && !p.roots.includes(rec.installPath)) p.roots.push(rec.installPath);
  if (enabledPlugins[key] === true) { p.loaded = true; p.via.push(key); }
}
// A directory-source marketplace is read in place, not from the cache copy installed_plugins.json names.
for (const mk of Object.values(readJson(join(CLAUDE, 'plugins/known_marketplaces.json')))) {
  if (mk?.source?.source !== 'directory') continue;
  const base = mk.source.path;
  for (const entry of readJson(join(base, '.claude-plugin/marketplace.json')).plugins || []) {
    if (typeof entry.source === 'string' && plugins.has(entry.name)) plugins.get(entry.name).roots.unshift(join(base, entry.source));
  }
}
for (const account of list(join(CLAUDE, 'plugins/synced'))) {
  const dir = join(CLAUDE, 'plugins/synced', account);
  if (!isDir(dir)) continue;
  for (const entry of list(dir)) {
    const pdir = join(dir, entry);
    if (!isDir(pdir)) continue;
    const meta = readJson(`${pdir}.meta.json`, null);
    const manifest = readJson(join(pdir, '.claude-plugin/plugin.json'), null) || readJson(join(pdir, 'plugin.json'), null);
    const name = manifest?.name || entry.replace(/~g\d+$/, '');
    const p = plugin(name);
    p.roots.unshift(pdir); // the synced copy is what the desktop app reads
    if (meta?.installation_preference === 'available') { p.loaded = true; p.via.push(`${name}@synced`); }
  }
}

// Some packs nest skills a level down (mattpocock-skills keeps skills/engineering/prototype/SKILL.md).
function findSkills(dir, depth) {
  if (!isDir(dir) || depth < 0) return [];
  if (existsSync(join(dir, 'SKILL.md'))) return [join(dir, 'SKILL.md')];
  return list(dir).flatMap((d) => findSkills(join(dir, d), depth - 1));
}

// ---- inventory of loadable things ----
// Keyed by kind and name, so a plugin and a skill that share a name never share a slot.
const items = new Map(); // "<kind> <full name>" -> { kind, name, status, where }
const slot = (kind, name) => `${kind} ${name}`;
// skillOverrides is keyed by a skill's own name and does not reach plugin skills, so a plugin skill
// passes bare = null: an override on Bill's loading-states must not hide interaction-design:loading-states.
function statusFor(name, bare, fm, pluginLoaded = true) {
  if (!pluginLoaded) return 'off';
  const o = overrides[name] ?? (bare ? overrides[bare] : undefined);
  if (o === 'off') return 'off';
  if (o === 'user-invocable-only') return 'name';
  if (String(fm['disable-model-invocation']) === 'true' || String(fm['user-invocable-only']) === 'true') return 'name';
  return 'available';
}
function addItem(name, kind, status, where) {
  const prev = items.get(slot(kind, name));
  // the first location found wins, except that a loaded copy beats one that is off
  if (prev && !(prev.status === 'off' && status !== 'off')) return;
  items.set(slot(kind, name), { kind, name, status, where });
}

for (const [name, p] of plugins) {
  const rootDir = p.roots.find(isDir);
  if (!rootDir) continue;
  addItem(name, 'pack', p.loaded ? 'available' : 'off', rootDir);
  const manifest = readJson(join(rootDir, '.claude-plugin/plugin.json'), null) || readJson(join(rootDir, 'plugin.json'), {});
  const skillRoots = [manifest.skills || 'skills'].flat().map((s) => join(rootDir, s));
  for (const file of skillRoots.flatMap((d) => findSkills(d, 3))) {
    const fm = frontmatter(file);
    const bare = fm.name || basename(dirname(file));
    addItem(`${name}:${bare}`, 'skill', statusFor(`${name}:${bare}`, null, fm, p.loaded), file);
  }
  for (const c of list(join(rootDir, 'commands'))) {
    if (!c.endsWith('.md')) continue;
    const file = join(rootDir, 'commands', c);
    addItem(`${name}:${c.slice(0, -3)}`, 'command', statusFor(`${name}:${c.slice(0, -3)}`, null, frontmatter(file), p.loaded), file);
  }
  for (const a of list(join(rootDir, 'agents'))) {
    if (!a.endsWith('.md')) continue;
    const fm = frontmatter(join(rootDir, 'agents', a));
    addItem(`${name}:${fm.name || a.slice(0, -3)}`, 'agent', p.loaded ? 'available' : 'off', join(rootDir, 'agents', a));
  }
}

const skillDirs = [join(CLAUDE, 'skills')];
const agentDirs = [join(CLAUDE, 'agents')];
if (project) { skillDirs.unshift(join(project, '.claude/skills')); agentDirs.unshift(join(project, '.claude/agents')); }
for (const d of skillDirs) {
  for (const s of list(d)) {
    const file = join(d, s, 'SKILL.md');
    if (!existsSync(file)) continue;
    const fm = frontmatter(file);
    const name = fm.name || s;
    addItem(name, 'skill', statusFor(name, s, fm), file);
  }
}
for (const d of agentDirs) {
  for (const a of list(d)) {
    if (!a.endsWith('.md')) continue;
    const fm = frontmatter(join(d, a));
    addItem(fm.name || a.slice(0, -3), 'agent', 'available', join(d, a));
  }
}
if (project) {
  for (const server of Object.keys(readJson(join(project, '.mcp.json')).mcpServers || {})) {
    addItem(server, 'mcp', 'available', join(project, '.mcp.json'));
  }
}

// ---- compare with the registry ----
const regPath = join(root, 'data/registry.json');
const registry = readJson(regPath, null);
if (!registry) { console.error('Cannot read data/registry.json'); process.exit(2); }
const config = readJson(join(root, 'data/scan-config.json'));

// The kinds that can stand for an entry of each type, best first. A skill and a command are both typed
// as /name and a plugin ships either form; an agent entry can be started by its command. A pack is only
// ever a plugin and an MCP server only a server, so neither matches a skill of the same name.
const KINDS = { skill: ['skill', 'command'], command: ['command', 'skill'], agent: ['agent', 'skill', 'command'], pack: ['pack'], mcp: ['mcp'] };
const missing = [];
const changed = [];
const derived = {};
for (const e of registry.entries) {
  if (!e.invoke) continue; // groups such as "Taste skills" are kept by hand
  if (e.type === 'mcp' && !project) continue;
  const found = [e.invoke, ...(e.aliases || [])].flatMap((n) => (KINDS[e.type] || []).map((k) => items.get(slot(k, n)))).find(Boolean);
  if (!found) { missing.push(e.id); continue; }
  derived[e.id] = found.status;
  if (found.status !== e.status) changed.push(`${e.id}: registry says ${e.status}, machine says ${found.status}`);
}

// Watched sources: every item in them should be in the registry or listed as ignored.
const known = new Set(registry.entries.flatMap((e) => [e.invoke, ...(e.aliases || [])]).filter(Boolean));
const packs = new Set(registry.entries.filter((e) => e.type === 'pack').map((e) => e.invoke));
const ignore = new Set(config.ignore || []);
const unregistered = new Set(); // a skill and a command of one name are one row
for (const it of items.values()) {
  const { name } = it;
  // A pack is accounted for only by a pack entry, not by a skill that happens to share its name.
  if (ignore.has(name) || (it.kind !== 'pack' && known.has(name))) continue;
  const [pfx] = name.split(':');
  const watchedPlugin = (config.watchPlugins || []).includes(pfx) && name.includes(':');
  if (watchedPlugin) unregistered.add(name);
  else if (it.kind === 'pack' && (config.watchMarketplaces || []).some((m) => plugins.get(name)?.via.some((v) => v.endsWith(`@${m}`)))) {
    if (!packs.has(name)) unregistered.add(name);
  }
}

writeFileSync(join(root, 'data/inventory.local.json'), JSON.stringify({
  scannedAt: new Date().toISOString(), project: project ? basename(project) : null,
  plugins: Object.fromEntries([...plugins].map(([n, p]) => [n, { loaded: p.loaded, via: p.via }])),
  items: Object.fromEntries([...items.values()].map(({ name, ...it }) => [slot(it.kind, name), it])),
}, null, 2));

const section = (title, rows) => {
  console.log(`\n${title} (${rows.length})`);
  for (const r of rows) console.log(`  ${r}`);
};
console.log(`Scanned ${items.size} skills, commands, agents and packs from ${plugins.size} plugins${project ? ` and ${basename(project)}` : ''}.`);
section('Status differs', changed);
section('In the registry, not found here', missing);
section('Installed in a watched source, not in the registry', [...unregistered].sort());

if (flag('--write') && changed.length) {
  for (const e of registry.entries) if (derived[e.id]) e.status = derived[e.id];
  writeFileSync(regPath, `${JSON.stringify(registry, null, 2)}\n`);
  console.log(`\nWrote ${changed.length} status changes to data/registry.json.`);
}
process.exitCode = changed.length || missing.length || unregistered.size ? 1 : 0;
