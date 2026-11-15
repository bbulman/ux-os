// Loads everything the site is built from and refuses to build on bad data.
// Every problem is collected first, so one run reports all of them.
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { checkPlugins } from './loadout.mjs';

export const TYPES = ['skill', 'pack', 'agent', 'command', 'mcp'];
export const ORIGINS = ['built', 'combined', 'third'];
export const STATUSES = ['available', 'name', 'off'];
export const SCOPES = ['any', 'workshopr'];
export const STAGES = ['trial', 'adopted', 'retired'];
export const GROUPS = ['core', 'research', 'craft'];

// A public site: nothing that names this machine, a private workspace or network, or a person's inbox.
const PRIVATE = [
  [/\/Users\//, 'a local path (/Users/)'],
  [/-Users-[A-Za-z]/, 'a local path in Claude Code\'s flattened form (-Users-)'],
  [/\/home\//, 'a local path (/home/)'],
  [/[A-Z]:\\Users\\/i, 'a Windows local path (C:\\Users\\)'],
  [/\/private\/(var|tmp)\//, 'a local temporary path (/private/)'],
  [/\/Volumes\//, 'a local disk path (/Volumes/)'],
  [/file:\/\//i, 'a file:// URL'],
  [/~\//, 'a home-folder path (~/)'],
  [/notion\.(so|site)/i, 'a Notion link'],
  [/localhost:\d+/i, 'a localhost address'],
  [/\b(?:127|10)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, 'a loopback or private IP address'],
  [/\b192\.168\.\d{1,3}\.\d{1,3}\b/, 'a private IP address'],
  [/\b172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/, 'a private IP address'],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, 'an email address'],
];

// A real calendar date written YYYY-MM-DD.
const isDate = (s) => {
  const m = typeof s === 'string' && s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
};
const SLUG = /^[a-z0-9-]+$/;
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function band(total) {
  if (!total) return 'unused';
  if (total >= 10) return 'heavy';
  if (total >= 3) return 'regular';
  return 'occasional';
}

function walkStrings(value, at, visit) {
  if (typeof value === 'string') visit(value, at);
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, `${at}[${i}]`, visit));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walkStrings(v, `${at}.${k}`, visit);
}

export function loadData(root) {
  const problems = [];
  const fail = (msg) => problems.push(msg);

  // Every data file is required: a missing one would build a site that is quietly wrong.
  const readJson = (rel, fallback) => {
    const p = join(root, rel);
    if (!existsSync(p)) { fail(`${rel} is missing`); return fallback; }
    try { return JSON.parse(readFileSync(p, 'utf8')); } catch (err) { fail(`${rel} is not valid JSON: ${err.message}`); return fallback; }
  };
  const listOf = (value, what) => {
    if (Array.isArray(value)) return value;
    fail(`${what} must be a list`);
    return [];
  };

  const registry = readJson('data/registry.json', {}) || {};
  const usage = readJson('data/usage.json', {}) || {};
  const jobs = listOf(readJson('data/jobs.json', []), 'data/jobs.json');
  const workflows = listOf(readJson('data/workflows.json', []), 'data/workflows.json');
  const projectFiles = listOf(readJson('data/project-files.json', []), 'data/project-files.json');
  const changes = listOf(readJson('data/changes.json', []), 'data/changes.json');
  const plugins = readJson('data/plugins.json', null);
  const sets = listOf(registry.sets, 'registry sets');
  const entries = listOf(registry.entries, 'registry entries');
  checkPlugins(plugins, entries, fail);
  if (!usage.counts || typeof usage.counts !== 'object' || Array.isArray(usage.counts)) { fail('usage: counts must be an object'); usage.counts = {}; }

  // dates
  if (!isDate(registry.asOf)) fail(`registry: asOf must be a YYYY-MM-DD date, not "${registry.asOf}"`);
  if (!isDate(usage.asOf)) fail(`usage: asOf must be a YYYY-MM-DD date, not "${usage.asOf}"`);
  if (!isDate(usage.since)) fail(`usage: since must be a YYYY-MM-DD date, not "${usage.since}"`);
  for (const c of changes) if (!isDate(c.date)) fail(`changes: date must be YYYY-MM-DD, not "${c.date}"`);

  // sets
  const setSlugs = new Set();
  for (const s of sets) {
    if (!SLUG.test(s.slug ?? '')) fail(`set "${s.slug}": slug must be lowercase letters, digits and hyphens`);
    if (setSlugs.has(s.slug)) fail(`set ${s.slug}: duplicate slug`);
    setSlugs.add(s.slug);
    for (const k of ['name', 'covers', 'why', 'missing']) if (!s[k]) fail(`set ${s.slug}: missing ${k}`);
  }

  // entries
  const ids = new Set();
  const byInvoke = new Map();
  for (const e of entries) {
    const at = `entry ${e.id ?? '(no id)'}`;
    if (!e.id || !/^[a-z0-9-]+$/.test(e.id)) fail(`${at}: id must be lowercase letters, digits and hyphens`);
    if (ids.has(e.id)) fail(`${at}: duplicate id`);
    ids.add(e.id);
    if (!e.name) fail(`${at}: missing name`);
    if (!TYPES.includes(e.type)) fail(`${at}: unknown type "${e.type}"`);
    if (!setSlugs.has(e.set)) fail(`${at}: unknown set "${e.set}"`);
    if (!ORIGINS.includes(e.origin)) fail(`${at}: unknown origin "${e.origin}"`);
    if (!STATUSES.includes(e.status)) fail(`${at}: unknown status "${e.status}"`);
    if (!SCOPES.includes(e.scope)) fail(`${at}: unknown scope "${e.scope}"`);
    if (!STAGES.includes(e.stage)) fail(`${at}: unknown stage "${e.stage}"`);
    if (!e.summary) fail(`${at}: missing summary`);
    if (!e.author) fail(`${at}: missing author`);
    if (e.story && !existsSync(join(root, 'data', e.story))) fail(`${at}: story ${e.story} does not exist`);
    if (e.source && !/^https:\/\//.test(e.source)) fail(`${at}: source must be an https URL`);
    for (const n of [e.invoke, ...(e.aliases || [])].filter(Boolean)) byInvoke.set(n, e.id);
  }
  const resolve = (ref) => (ids.has(ref) ? ref : byInvoke.get(String(ref).replace(/^\//, '')));

  // usage refers to registry ids only
  for (const id of Object.keys(usage.counts || {})) if (!ids.has(id)) fail(`usage: unknown entry "${id}"`);

  // jobs
  for (const j of jobs) {
    const at = `job "${j.need ?? '(no need)'}"`;
    if (!j.need || !j.why) fail(`${at}: needs "need" and "why"`);
    if (!setSlugs.has(j.set)) fail(`${at}: unknown set "${j.set}"`);
    if (!resolve(j.use)) fail(`${at}: "${j.use}" is not in the registry`);
    if (j.rival) {
      if (!j.rival.use || !j.rival.why) fail(`${at}: a rival needs "use" and "why"`);
      else if (!resolve(j.rival.use) && !j.rival.external) fail(`${at}: rival "${j.rival.use}" is not in the registry`);
    }
  }

  // workflows
  const wfSlugs = new Set();
  for (const w of workflows) {
    const at = `workflow ${w.slug ?? '(no slug)'}`;
    if (!w.slug || wfSlugs.has(w.slug)) fail(`${at}: missing or duplicate slug`);
    else if (!SLUG.test(w.slug)) fail(`${at}: slug must be lowercase letters, digits and hyphens`);
    wfSlugs.add(w.slug);
    if (!w.name || !w.summary || !Array.isArray(w.steps) || !w.steps.length) fail(`${at}: needs name, summary and steps`);
    for (const st of w.steps || []) {
      if (!st.use) fail(`${at}: step "${st.label ?? '(no label)'}" names no skill; every step is done by one`);
      else if (!resolve(st.use)) fail(`${at}: step "${st.label ?? st.use}" uses "${st.use}", not in the registry`);
    }
  }

  // project files: readBy may name things outside the registry (Workshopr's own agents), so only warn
  const warnings = [];
  const pfIds = new Set();
  // A template is published word for word and an example rendered, so each must be a file in its own folder.
  const PF_DIRS = { template: 'plugin/shared/project-files', example: 'examples' };
  const realIn = (p, dir) => {
    try { return realpathSync(join(root, p)).startsWith(realpathSync(join(root, dir)) + sep); } catch { return false; }
  };
  const pfFiles = [];
  for (const f of projectFiles) {
    if (!SLUG.test(f.id ?? '')) fail(`project file "${f.id}": id must be lowercase letters, digits and hyphens`);
    if (pfIds.has(f.id)) fail(`project file ${f.id}: duplicate id`);
    pfIds.add(f.id);
    for (const k of ['file', 'group', 'purpose', 'template']) if (!f[k]) fail(`project file ${f.id}: missing ${k}`);
    if (f.group && !GROUPS.includes(f.group)) fail(`project file ${f.id}: unknown group "${f.group}"`);
    for (const [k, dir] of Object.entries(PF_DIRS)) {
      const p = f[k];
      if (!p) continue;
      if (!existsSync(join(root, p))) fail(`project file ${f.id}: ${p} does not exist`);
      else if (!realIn(p, dir)) fail(`project file ${f.id}: ${k} ${p} is outside ${dir}/`);
      else pfFiles.push(p);
    }
    for (const r of f.readBy || []) if (!resolve(r)) warnings.push(`project file ${f.file}: read by "${r}", which is not in the registry`);
  }

  // privacy, over every published string, the stories, the templates and the examples.
  // A link into a repo the registry marks private would 404 for a visitor. The story renderer prints
  // those as plain text, so only links outside the stories fail.
  const privateRepos = [...new Set(entries.map((e) => e.privateRepo).filter(Boolean))];
  const privateLink = privateRepos.length
    ? new RegExp(`github\\.com/(?:${privateRepos.map(escRe).join('|')})(?:\\.git)?(?![A-Za-z0-9_.-])`, 'i')
    : null;
  const scan = (label, value, { links = true } = {}) => walkStrings(value, label, (s, at) => {
    for (const [re, what] of PRIVATE) if (re.test(s)) fail(`${at}: contains ${what}`);
    if (links && privateLink?.test(s)) fail(`${at}: links to private repo ${s.match(privateLink)[0].replace(/^github\.com\//i, '')}`);
  });
  scan('registry', registry);
  scan('jobs', jobs);
  scan('workflows', workflows);
  scan('project-files', projectFiles);
  scan('changes', changes);
  scan('usage', usage);
  const stories = {};
  if (existsSync(join(root, 'data/stories'))) {
    for (const f of readdirSync(join(root, 'data/stories')).filter((x) => x.endsWith('.md'))) {
      stories[f.slice(0, -3)] = readFileSync(join(root, 'data/stories', f), 'utf8');
      scan(`stories/${f}`, stories[f.slice(0, -3)], { links: false });
    }
  }
  const scanned = new Set();
  const scanFile = (p) => {
    const rel = relative(root, join(root, p)).split(sep).join('/');
    if (scanned.has(rel)) return;
    scanned.add(rel);
    scan(rel, readFileSync(join(root, rel), 'utf8'));
  };
  for (const p of pfFiles) scanFile(p);
  for (const d of Object.values(PF_DIRS)) {
    const dir = join(root, d);
    if (!existsSync(dir)) continue;
    const walk = (p) => readdirSync(p, { withFileTypes: true }).forEach((x) => {
      const q = join(p, x.name);
      if (x.isDirectory()) walk(q);
      else if (x.name.endsWith('.md')) scanFile(relative(root, q));
    });
    walk(dir);
  }

  if (problems.length) {
    const err = new Error(`The data has ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n  ${problems.join('\n  ')}`);
    err.problems = problems;
    throw err;
  }

  // derived: usage on every entry, and which project files each entry reads
  const reads = {};
  for (const f of projectFiles) for (const r of f.readBy || []) {
    const id = resolve(r);
    if (id) (reads[id] ||= []).push(f.id);
  }
  for (const e of entries) {
    const u = usage.counts?.[e.id] || { model: 0, typed: 0, agent: 0, total: 0 };
    e.usage = { ...u, band: band(u.total) };
    e.reads = reads[e.id] || [];
  }
  return { sets, entries, jobs, workflows, projectFiles, changes, plugins, stories, usage, warnings, asOf: registry.asOf, resolve };
}
