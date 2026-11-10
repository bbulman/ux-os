#!/usr/bin/env node
// Reads a project's .research-profile.md, which carries the book's look and the design system connection.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { command } from './names.mjs';
import { parseMarkdown } from './parse.mjs';

const LOOK_LINE = /^(Display font|Text font|Accent|Paper|Sheet|Sunk|Ink|Rule)\s*[:–—-]\s*(.+)$/i;
const SYSTEM_LINE = /^(Tokens hash|Tokens|Catalogue|Finder)\s*[:–—-]\s*(.+)$/i;
const SYSTEM_KEYS = { tokens: 'tokens', 'tokens hash': 'tokensHash', catalogue: 'catalogue', finder: 'finder' };
const FINDER = /^npm run ([a-z0-9:_-]+) -- "<need>"( --json)?$/i;
const tokenHash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 12);

export function findProfile(folder) {
  let dir = resolve(folder);
  for (let i = 0; i < 12; i++) {
    const p = join(dir, '.research-profile.md');
    if (existsSync(p)) return p;
    if (existsSync(join(dir, '.git'))) return null;
    const up = dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
  return null;
}

const bullets = (section) => (section?.blocks ?? []).filter((b) => b.type === 'bullet');

export function readProfile(folder) {
  const path = findProfile(folder);
  const profile = { path, look: {}, designSystem: null };
  if (!path) return profile;
  const doc = parseMarkdown(readFileSync(path, 'utf8'));
  for (const b of bullets(doc.sections.find((s) => /^book look$/i.test(s.name)))) {
    const m = b.text.replace(/\*\*/g, '').match(LOOK_LINE);
    if (m) profile.look[m[1].toLowerCase().replace(' font', '')] = m[2].replace(/[`"']/g, '').trim();
  }
  const system = doc.sections.find((s) => /^design system$/i.test(s.name));
  if (system) {
    profile.designSystem = {};
    for (const b of bullets(system)) {
      const m = b.text.replace(/\*\*/g, '').match(SYSTEM_LINE);
      if (m) profile.designSystem[SYSTEM_KEYS[m[1].toLowerCase()]] = m[2].replace(/^`|`$/g, '').trim();
    }
  }
  return profile;
}

// A nudge, once per render, when the tokens have moved on since the profile was written.
export function driftNote(profile) {
  const { tokens, tokensHash } = profile.designSystem ?? {};
  if (!tokens || !tokensHash) return null;
  const path = join(dirname(profile.path), tokens);
  if (!existsSync(path) || tokenHash(path) === tokensHash) return null;
  return `The design system has changed since ${command('init')} last ran. Run it again to refresh the book's look.`;
}

export function catalogueNames(profile) {
  try {
    const { components } = JSON.parse(readFileSync(join(dirname(profile.path), profile.designSystem.catalogue), 'utf8'));
    return components && typeof components === 'object' && !Array.isArray(components) ? new Set(Object.keys(components)) : null;
  } catch {
    return null;
  }
}

const LOOK_LABELS = [['display', 'Display font'], ['text', 'Text font'], ['accent', 'Accent'], ['paper', 'Paper'], ['sheet', 'Sheet'], ['sunk', 'Sunk'], ['ink', 'Ink'], ['rule', 'Rule']];
const SYSTEM_LABELS = [['tokens', 'Tokens'], ['tokensHash', 'Tokens hash'], ['catalogue', 'Catalogue'], ['finder', 'Finder']];
const sectionBody = (values, labels) => labels.filter(([key]) => values?.[key]).map(([key, label]) => `- ${label}: ${values[key]}`).join('\n');

function putSection(text, heading, body) {
  if (!body) return text;
  const block = `## ${heading}\n\n${body}\n`;
  const found = new RegExp(`^## ${heading}[ \\t]*$`, 'mi').exec(text);
  if (!found) return `${text.replace(/\n*$/, '\n')}\n${block}`;
  const rest = text.slice(found.index + found[0].length);
  const next = rest.search(/^## /m);
  return `${text.slice(0, found.index)}${block}${next === -1 ? '' : `\n${rest.slice(next)}`}`;
}

// Rewrites only the two sections this connection owns, and leaves the file alone when nothing differs.
export function writeConnection(projectDir, { look, designSystem }) {
  const path = join(projectDir, '.research-profile.md');
  const exists = existsSync(path);
  const before = exists ? readFileSync(path, 'utf8') : `# Research profile: ${basename(resolve(projectDir))}\n`;
  const tokensPath = designSystem?.tokens ? join(projectDir, designSystem.tokens) : null;
  const system = tokensPath && existsSync(tokensPath) ? { ...designSystem, tokensHash: tokenHash(tokensPath) } : designSystem;
  const after = putSection(putSection(before, 'Book look', sectionBody(look, LOOK_LABELS)), 'Design system', sectionBody(system, SYSTEM_LABELS));
  const changed = !exists || after !== before;
  if (changed) writeFileSync(path, after);
  return { changed, path };
}

export function checkConnection(project) {
  const profile = readProfile(project);
  if (!profile.path) return { problems: ['no .research-profile.md found'], summary: [] };
  const system = profile.designSystem;
  if (!system) return { problems: ['the profile has no ## Design system section'], summary: [] };
  const problems = [];
  if (system.tokens && !existsSync(join(dirname(profile.path), system.tokens))) problems.push(`Tokens: ${system.tokens} does not exist`);
  const names = system.catalogue ? catalogueNames(profile) : null;
  if (!system.catalogue) problems.push('no Catalogue line');
  else if (!names?.size) problems.push(`Catalogue: ${system.catalogue} cannot be read as JSON with a components object`);
  if (system.finder) {
    const script = system.finder.match(FINDER)?.[1];
    let scripts = {};
    try { scripts = JSON.parse(readFileSync(join(dirname(profile.path), 'package.json'), 'utf8')).scripts ?? {}; } catch { scripts = {}; }
    if (!script || !scripts[script]) problems.push('Finder: only npm run <a script in package.json> -- "<need>" is allowed');
  }
  const summary = [`Look: ${Object.keys(profile.look).length} values`, `Tokens: ${system.tokens ?? 'none'}`, `Catalogue: ${names?.size ?? 0} components`, `Finder: ${system.finder ?? 'none'}`];
  return { problems, summary };
}

function selfTest() {
  const dir = mkdtempSync(join(tmpdir(), 'ux-os-profile-'));
  const self = fileURLToPath(import.meta.url);
  let failures = 0;
  const test = (name, fn) => {
    try { fn(); console.log(`ok    ${name}`); } catch (e) { failures++; console.log(`FAIL  ${name}: ${e.message}`); }
  };
  const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
  const project = (name, files = {}) => {
    const root = join(dir, name);
    mkdirSync(root, { recursive: true });
    for (const [f, c] of Object.entries(files)) writeFileSync(join(root, f), c);
    return root;
  };
  const CONNECTION = { look: { display: 'Fraunces', text: 'Inter', accent: '#E54D4D', paper: '#FAFAF9', ink: '#1C1917' }, designSystem: { tokens: 'tokens.css', catalogue: 'catalogue.json', finder: 'npm run ds:find -- "<need>" --json' } };
  const profileIn = (root) => readFileSync(join(root, '.research-profile.md'), 'utf8');

  test('no profile: writes a new one with a title and both sections', () => {
    const root = project('fresh');
    const result = writeConnection(root, CONNECTION);
    assert(result.changed === true, 'changed should be true');
    const text = profileIn(root);
    assert(/^# Research profile: fresh\n/.test(text), 'no title');
    assert(text.includes('## Book look') && text.includes('## Design system'), 'sections missing');
  });
  test('what it writes reads back the same', () => {
    const root = project('round');
    writeConnection(root, CONNECTION);
    const read = readProfile(root);
    assert(read.look.accent === '#E54D4D' && read.look.display === 'Fraunces', 'look did not read back');
    assert(read.designSystem.finder === CONNECTION.designSystem.finder, `finder read back as ${read.designSystem.finder}`);
    assert(read.designSystem.catalogue === 'catalogue.json', 'catalogue did not read back');
  });
  test('every other section survives byte for byte', () => {
    const before = '# Research profile: Mine\n\n## Output\n\n- Folder:  `docs/x`\n\n## Belief files\n\nSome  text   with odd spacing.\n\n';
    const after = '## Primary sources\n\n- PostHog, read only.\n';
    const root = project('keep', { '.research-profile.md': `${before}## Book look\n\n- Accent: #000000\n\n${after}` });
    writeConnection(root, CONNECTION);
    const text = profileIn(root);
    assert(text.startsWith(before), 'text before the section changed');
    assert(text.includes(after), 'text after the section changed');
    assert(!text.includes('#000000'), 'old accent still there');
    assert((text.match(/## Book look/g) ?? []).length === 1, 'Book look duplicated');
  });
  test('an identical write changes nothing and leaves the file time alone', () => {
    const root = project('same');
    writeConnection(root, CONNECTION);
    const path = join(root, '.research-profile.md');
    const old = new Date(Date.now() - 3600000);
    utimesSync(path, old, old);
    const before = statSync(path).mtimeMs;
    const result = writeConnection(root, CONNECTION);
    assert(result.changed === false, 'changed should be false');
    assert(statSync(path).mtimeMs === before, 'file time moved');
  });
  test('a changed value rewrites only its own lines', () => {
    const root = project('change', { '.research-profile.md': '# Research profile: Mine\n\n## Output\n\n- Folder: x\n' });
    writeConnection(root, CONNECTION);
    const result = writeConnection(root, { ...CONNECTION, look: { ...CONNECTION.look, accent: '#123456' } });
    assert(result.changed === true, 'changed should be true');
    const text = profileIn(root);
    assert(text.includes('- Accent: #123456') && !text.includes('#E54D4D'), 'accent not replaced');
    assert(text.includes('## Output\n\n- Folder: x\n'), 'Output changed');
  });
  test('book look lines keep a fixed order', () => {
    const root = project('order');
    writeConnection(root, { look: { rule: '#111111', paper: '#222222', display: 'Inter' }, designSystem: {} });
    const lines = profileIn(root).split('\n').filter((l) => l.startsWith('- '));
    assert(lines.join('|') === '- Display font: Inter|- Paper: #222222|- Rule: #111111', lines.join('|'));
  });
  test('--check exits 0 on a good connection', () => {
    const root = project('good', { 'tokens.css': ':root{}', 'catalogue.json': '{"components":{"ws_a":{}}}', 'package.json': '{"scripts":{"ds:find":"node x.mjs"}}' });
    writeConnection(root, CONNECTION);
    const run = spawnSync(process.execPath, [self, '--check', root], { encoding: 'utf8' });
    assert(run.status === 0, `status ${run.status}: ${run.stdout}`);
  });
  test('--check exits 1 on a missing token file', () => {
    const root = project('notokens', { 'catalogue.json': '{"components":{"ws_a":{}}}' });
    writeConnection(root, CONNECTION);
    assert(spawnSync(process.execPath, [self, '--check', root], { encoding: 'utf8' }).status === 1, 'should exit 1');
  });
  test('--check exits 1 on an unreadable catalogue', () => {
    const root = project('badcat', { 'tokens.css': ':root{}', 'catalogue.json': '{not json' });
    writeConnection(root, CONNECTION);
    assert(spawnSync(process.execPath, [self, '--check', root], { encoding: 'utf8' }).status === 1, 'should exit 1');
  });
  test('a changed token file clears once init runs again', () => {
    const root = project('hash', { 'tokens.css': ':root{--a:1}', 'catalogue.json': '{"components":{"ws_a":{}}}' });
    writeConnection(root, CONNECTION);
    assert(driftNote(readProfile(root)) === null, 'note before any change');
    writeFileSync(join(root, 'tokens.css'), ':root{--a:2}');
    assert(/init/.test(driftNote(readProfile(root)) ?? ''), 'no note after a token change');
    assert(writeConnection(root, CONNECTION).changed === true, 'should rewrite the hash');
    assert(driftNote(readProfile(root)) === null, 'note did not clear');
    assert(writeConnection(root, CONNECTION).changed === false, 'second run should change nothing');
  });
  const finderStatus = (name, finder, pkg) => {
    const files = { 'tokens.css': ':root{}', 'catalogue.json': '{"components":{"ws_a":{}}}' };
    if (pkg) files['package.json'] = pkg;
    const root = project(name, files);
    writeConnection(root, { ...CONNECTION, designSystem: { ...CONNECTION.designSystem, finder } });
    return spawnSync(process.execPath, [self, '--check', root], { encoding: 'utf8' }).status;
  };
  test('--check refuses a finder that is not an npm script', () => assert(finderStatus('rmfinder', 'rm -rf ~ "<need>"', '{"scripts":{}}') === 1, 'should exit 1'));
  test('--check refuses a finder whose script does not exist', () => assert(finderStatus('nofinder', 'npm run nope -- "<need>"', '{"scripts":{}}') === 1, 'should exit 1'));
  test('--check refuses a catalogue that is an array', () => {
    const root = project('arraycat', { 'tokens.css': ':root{}', 'catalogue.json': '{"components":["ws_a"]}', 'package.json': '{"scripts":{"ds:find":"x"}}' });
    writeConnection(root, CONNECTION);
    assert(spawnSync(process.execPath, [self, '--check', root], { encoding: 'utf8' }).status === 1, 'should exit 1');
  });
  test('--write takes a connection file', () => {
    const root = project('cli');
    const file = join(dir, 'connection.json');
    writeFileSync(file, JSON.stringify(CONNECTION));
    const run = spawnSync(process.execPath, [self, '--write', root, file], { encoding: 'utf8' });
    assert(run.status === 0, `status ${run.status}: ${run.stderr}`);
    assert(existsSync(join(root, '.research-profile.md')), 'no profile written');
  });
  rmSync(dir, { recursive: true, force: true });
  console.log(failures ? `\n${failures} self-test failure(s)` : '\nself-test passed');
  process.exit(failures ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [arg, project, file] = process.argv.slice(2);
  if (arg === '--self-test') selfTest();
  else if (arg === '--write' && project && file) {
    const result = writeConnection(project, JSON.parse(readFileSync(file, 'utf8')));
    console.log(`${result.changed ? 'Updated' : 'Nothing changed in'} ${result.path}`);
  } else if (arg === '--check' && project) {
    const { problems, summary } = checkConnection(project);
    [...summary, ...problems.map((p) => `PROBLEM ${p}`)].forEach((line) => console.log(line));
    process.exit(problems.length ? 1 : 0);
  } else {
    console.error('usage: node profile.mjs --write <project> <connection.json> | --check <project> | --self-test');
    process.exit(2);
  }
}
