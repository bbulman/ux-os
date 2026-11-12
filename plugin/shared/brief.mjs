#!/usr/bin/env node
// Prints what a third-party skill is given when /ux-os:run runs it. Reads the folder and writes nothing.
// Usage: node brief.mjs <folder> <job | --skill pack:skill>   |   node brief.mjs --self-test
// UX_OS_SKILL_ROOTS, folders split like PATH, replaces the places searched for the skill, in that order.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readWork, workFiles } from './check.mjs';
import { byDiscipline, disciplineName, evidencePrefix, ideaSlug, WORK } from './layout.mjs';
import { insideRoot, readProfile } from './profile.mjs';
import { firstTable, parseFile, parseMarkdown, tableRows, VERDICT_RANK } from './parse.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MODELS = ['personas.md', 'jobs.md', 'journeys.md'];
const SKILL_NAME = /^([a-z0-9][a-z0-9-]*):([a-z0-9][a-z0-9-]*)$/;

export const loadPicks = (path = join(HERE, 'picks.json')) => JSON.parse(readFileSync(path, 'utf8'));

// The desktop app loads the synced copy and the terminal loads the cache, so the surface running now goes first.
export function defaultRoots(entrypoint = process.env.CLAUDE_CODE_ENTRYPOINT) {
  const [synced, cache, marketplaces] = ['synced', 'cache', 'marketplaces'].map((d) => join(homedir(), '.claude', 'plugins', d));
  return entrypoint === 'claude-desktop' ? [synced, cache, marketplaces] : [cache, synced, marketplaces];
}

function pluginDirs(dir, pack, depth = 0) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  const manifest = join(dir, '.claude-plugin', 'plugin.json');
  if (existsSync(manifest)) {
    try {
      const { name, version } = JSON.parse(readFileSync(manifest, 'utf8'));
      return name === pack ? [{ dir, version: String(version ?? '0') }] : [];
    } catch { return []; }
  }
  if (depth >= 3) return [];
  return readdirSync(dir).filter((n) => !n.startsWith('.') && n !== 'node_modules').flatMap((n) => pluginDirs(join(dir, n), pack, depth + 1));
}

const skillIn = (dir, name) => [join(dir, 'skills', name, 'SKILL.md'), join(dir, 'commands', `${name}.md`)].find((p) => existsSync(p)) ?? null;
// A command hands work to other skills in its pack by writing "using `name` skill".
const HANDOFF = /`([a-z0-9][a-z0-9-]*)`\s+skill\b/g;

// One copy of a skill: the file that runs, the files it hands off to inside the same copy, and a version over all of them.
function copyOf(dir, name) {
  const file = skillIn(dir, name);
  if (!file) return null;
  const text = readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '');
  const names = [...new Set([...text.matchAll(HANDOFF)].map((m) => m[1]))].filter((n) => n !== name).sort();
  const also = names.map((n) => ({ name: n, path: skillIn(dir, n) }));
  const hash = createHash('sha256').update(readFileSync(file));
  for (const a of also) { hash.update(`\0${a.name}\0`); if (a.path) hash.update(readFileSync(a.path)); }
  return { file, also, version: hash.digest('hex').slice(0, 12) };
}

const numbers = (v) => (String(v).match(/\d+/g) ?? []).map(Number);
function compareNumbers(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (b[i] ?? 0) - (a[i] ?? 0);
  return 0;
}

// Every copy of the skill, in the order the contract sets: highest plugin version, then the order of the roots, then the highest
// generation (~g2) within one root. Generations are numbered within one root only, so they never outrank another root.
export function findSkill(skill, roots) {
  const m = skill.match(SKILL_NAME);
  if (!m) return [];
  const [, pack, name] = m;
  const seen = new Set();
  return roots.flatMap((root, rootIndex) => pluginDirs(root, pack).map((p) => ({ ...p, rootIndex })))
    .filter((p) => !seen.has(p.dir) && seen.add(p.dir))
    .map((p) => ({ ...p, generation: Number(p.dir.match(/~g(\d+)$/)?.[1] ?? 0), copy: copyOf(p.dir, name) }))
    .filter((p) => p.copy)
    .sort((a, b) => compareNumbers(numbers(a.version), numbers(b.version)) || a.rootIndex - b.rootIndex || b.generation - a.generation || a.dir.localeCompare(b.dir))
    .map((p) => p.copy);
}

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let last = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const was = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = was;
    }
  }
  return row[b.length];
}

export function nearest(picks, word, count = 3) {
  const w = word.toLowerCase();
  return picks
    .map((p) => {
      const phrases = [p.job, ...p.says].map((s) => s.toLowerCase());
      return { job: p.job, d: Math.min(...[...phrases, ...phrases.flatMap((s) => s.split(/[\s-]+/))].map((s) => distance(w, s))) };
    })
    .sort((a, b) => a.d - b.d || a.job.localeCompare(b.job))
    .slice(0, count)
    .map((x) => x.job);
}

const modeOf = (doc) => (/^From research:/.test(doc.banner ?? '') ? 'real' : /^Proto:/.test(doc.banner ?? '') ? 'proto' : 'no banner');
const bulletLines = (container) => (container?.blocks ?? []).filter((b) => b.type === 'bullet').flatMap((b) => [`    - ${b.text}`, ...(b.component ? [`      Component: ${b.component}`] : [])]);

function implications(file, doc) {
  if (file === 'jobs.md') return bulletLines(doc.sections.find((s) => s.name === 'Design implications'));
  if (file === 'personas.md') {
    return doc.sections.filter((s) => s.name.startsWith('Persona: ')).flatMap((s) => {
      const lines = bulletLines(s.subsections.find((x) => x.name === 'Design implications'));
      return lines.length ? [`    ${s.name}`, ...lines] : [];
    });
  }
  return [];
}

// Each belief with the verdict the folder already gives it, so a work file can carry the same one.
function beliefLines(folder) {
  const path = join(folder, 'beliefs.md');
  if (!existsSync(path)) return [];
  const block = firstTable(parseMarkdown(`## x\n${readFileSync(path, 'utf8').replace(/^# .*$/m, '')}`).sections[0]);
  if (!block) return [];
  const seen = {};
  for (const name of readdirSync(folder).filter((n) => n.endsWith('.md') && !['beliefs.md', 'brief.md', 'sources.md'].includes(n))) {
    for (const section of parseFile(join(folder, name)).sections) {
      for (const container of [section, ...section.subsections]) {
        for (const b of container.blocks) {
          for (const tag of b.type === 'table' ? b.rows.flatMap((r) => r.tags) : b.tags ?? []) {
            if (tag.kind === 'belief' && tag.verdict) for (const id of tag.beliefs) (seen[id] ??= new Set()).add(tag.verdict);
          }
        }
      }
    }
  }
  return tableRows(block).map((row) => {
    const verdict = row.Outcome || (seen[row.ID] ? VERDICT_RANK.find((v) => seen[row.ID].has(v)) : 'not yet checked');
    return `  ${row.ID} (${verdict}): ${row.Belief}`;
  });
}

// In a project laid out by discipline the file goes in the discipline's own folder, beside research/.
function workName(folder, today, kind, discipline) {
  const dir = byDiscipline(folder) ? `../${disciplineName(discipline)}` : WORK;
  for (let n = 1; ; n++) {
    const name = `${dir}/${today}-${kind}${n === 1 ? '' : `-${n}`}.md`;
    if (!existsSync(join(folder, name))) return name;
  }
}

export function brief(folder, target, { picks = loadPicks(), roots = defaultRoots(), today = new Date().toISOString().slice(0, 10) } = {}) {
  let pick;
  let skill;
  if (target.skill) {
    skill = target.skill;
    pick = picks.find((p) => p.skill === skill) ?? null;
  } else {
    pick = picks.find((p) => p.job === target.job);
    if (!pick) return { code: 1, text: `No job "${target.job}" in picks.json. Nearest: ${nearest(picks, target.job).join(', ')}` };
    skill = pick.skill;
  }
  if (!SKILL_NAME.test(skill)) return { code: 1, text: `"${skill}" is not written pack:skill, such as interaction-design:design-form` };
  const found = findSkill(skill, roots);
  if (!found.length) return { code: 1, text: `No SKILL.md or command file for ${skill} under ${roots.join(', ')}` };

  const [pack, name] = skill.split(':');
  const { file: runs, also, version } = found[0];
  const out = [];
  out.push(pick
    ? `Say: Using ${skill}, not ${pick.rival.skill}, because ${pick.rival.why_not}.`
    : `Say: Using ${skill}. No job in picks.json picks it, so this run is recorded as unpicked.`);
  const where = [`Runs: ${runs}`];
  if (also.length) where.push('Also runs:', ...also.map((a) => `  ${a.name}: ${a.path ?? `not found in this copy`}`));
  if (found.length > 1) where.push('Also found, not run:', ...found.slice(1).map((c) => `  ${c.file} (${c.version})`));

  // A run from the other surface resolves another copy, so only a version no copy has now counts as a change.
  const earlier = workFiles(folder).map((file) => ({ file, ...readWork(join(folder, file)).header })).filter((h) => h.Skill === skill)
    .sort((a, b) => (a.Ran ?? '').localeCompare(b.Ran ?? '') || a.file.localeCompare(b.file)).at(-1);
  if (earlier?.Version && !found.some((c) => c.version === earlier.Version)) where.push(`Note: skill changed since ${earlier.Ran}. ${basename(earlier.file)} ran version ${earlier.Version}, which no copy found now has. This run is ${version}.`);

  const given = [];
  const briefPath = join(folder, 'brief.md');
  const briefLines = [];
  let idea = ideaSlug(folder);
  if (existsSync(briefPath)) {
    given.push('brief.md');
    const doc = parseMarkdown(readFileSync(briefPath, 'utf8'));
    idea = doc.title?.replace(/^Brief:\s*/, '') || idea;
    briefLines.push(`  ${resolve(briefPath)}`);
    for (const { text } of doc.preamble) briefLines.push(`  ${text.replace(/^\s*-\s*/, '').replace(/\*\*/g, '')}`);
  }
  const modelLines = [];
  for (const file of MODELS) {
    const path = join(folder, file);
    if (!existsSync(path)) continue;
    const doc = parseFile(path);
    given.push(`${file} (${modeOf(doc)})`);
    modelLines.push(`  ${resolve(path)} (${modeOf(doc)})${doc.banner ? `: ${doc.banner}` : ''}`);
    const lines = implications(file, doc);
    modelLines.push(...(lines.length ? ['    Design implications:', ...lines] : ['    No Design implications section']));
  }
  const beliefs = beliefLines(folder);
  if (beliefs.length) given.push('beliefs.md');
  // Evidence links are copied from primary.md, and every source id is checked against sources.md.
  const evidence = ['primary.md', 'sources.md'].filter((file) => existsSync(join(folder, file)));
  given.push(...evidence);

  const profile = readProfile(folder);
  const root = profile.path ? dirname(profile.path) : null;
  const rules = profile.houseRules.map((file) => {
    const path = join(root, file);
    return { file, path, state: !insideRoot(root, file) ? 'outside the project root, not given' : existsSync(path) ? null : 'missing' };
  });
  const usable = rules.filter((r) => !r.state);
  if (usable.length) given.push(`house rules (${usable.map((r) => r.file).join(', ')})`);

  const kind = pick?.kind ?? name;
  // The header lines in the order the template sets, then where the work file goes and what runs.
  out.push(`Title: ${kind[0].toUpperCase()}${kind.slice(1)}: ${idea}`, `Skill: ${skill}`, `Pack: ${pack}`, `Version: ${version}`, `Given: ${given.length ? given.join(', ') : 'nothing on file'}`, `Pick: ${pick ? 'picked' : 'unpicked'}`, `Ran: ${today}`);
  const file = workName(folder, today, kind, pick?.set ?? pack);
  out.push(`File: ${file}`, `Evidence links start: ${evidencePrefix(file)}`, ...where);
  out.push('', 'Brief:', ...(briefLines.length ? briefLines : ['  none on file']));
  out.push('', 'Models, to read in full:', ...(modelLines.length ? modelLines : ['  none on file']));
  out.push('', `Beliefs:${beliefs.length ? ` ${resolve(join(folder, 'beliefs.md'))}` : ''}`, ...(beliefs.length ? beliefs : ['  none on file']));
  out.push('', 'Evidence, to read in full:', ...(evidence.length ? evidence.map((file) => `  ${resolve(join(folder, file))}`) : ['  none on file']));
  out.push('', `Finder: ${profile.designSystem?.finder ?? 'none'}`);
  out.push('House rules, to read in full:', ...(rules.length ? rules.map((r) => `  ${r.file}: ${r.path}${r.state ? ` (${r.state})` : ''}`) : ['  none']));
  return { code: 0, text: out.join('\n'), runs, version };
}

function selfTest() {
  return import('./fixtures/fixture.mjs').then(({ CLEAN, WORK_FILE }) => {
    const self = fileURLToPath(import.meta.url);
    const dir = mkdtempSync(join(tmpdir(), 'ux-os-brief-'));
    let failures = 0;
    const expect = (name, ok, detail) => {
      if (ok) console.log(`ok   ${name}`);
      else { failures++; console.log(`FAIL ${name}${detail === undefined ? '' : `:\n${detail}`}`); }
    };
    const write = (root, files) => { for (const [f, c] of Object.entries(files)) { mkdirSync(dirname(join(root, f)), { recursive: true }); writeFileSync(join(root, f), c); } return root; };
    const sha = (...parts) => { const h = createHash('sha256'); parts.forEach((x) => h.update(x)); return h.digest('hex').slice(0, 12); };

    const real = loadPicks();
    const fields = ['job', 'set', 'says', 'skill', 'pack', 'rival', 'kind', 'checked'];
    const shapeProblems = real.flatMap((p) => [
      ...fields.filter((f) => !(f in p)).map((f) => `${p.job}: no ${f}`),
      ...(!/^[a-z0-9-]+$/.test(p.job ?? '') ? [`${p.job}: job is not kebab-case`] : []),
      ...(!/^[a-z0-9-]+$/.test(p.kind ?? '') ? [`${p.job}: kind is not kebab-case`] : []),
      ...(p.skill?.split(':')[0] !== p.pack ? [`${p.job}: skill is not in its pack`] : []),
      ...(!SKILL_NAME.test(p.rival?.skill ?? '') || p.rival?.skill === p.skill || !p.rival?.why_not ? [`${p.job}: rival needs another skill and a why_not`] : []),
      ...(!Array.isArray(p.says) || !p.says.length ? [`${p.job}: says is empty`] : []),
    ]);
    expect('picks.json: every job has its fields, and ids are unique', !shapeProblems.length && new Set(real.map((p) => p.job)).size === real.length, shapeProblems.join('\n'));

    // Fake vendor packs, so nothing here depends on what is installed.
    const COMMAND = '---\ndescription: uses `fitts-law` skill in its front matter only\n---\n# /design-form\n1. Structure using `form-design` skill.\n2. Choices using `hicks-law` skill.\n3. Again using `form-design` skill.\n';
    const pack = (where, folder, version, text = COMMAND, extra = {}) => write(join(dir, where), {
      [`${folder}/.claude-plugin/plugin.json`]: JSON.stringify({ name: 'interaction-design', version }),
      [`${folder}/commands/design-form.md`]: text,
      [`${folder}/skills/form-design/SKILL.md`]: `# Form design, ${where}\n`,
      'other/.claude-plugin/plugin.json': '{"name":"something-else"}',
      'other/commands/design-form.md': '# Not this one\n',
      ...extra,
    });
    const synced = pack('synced', 'interaction-design~g2', '1.0.0');
    const cache = pack('cache', 'interaction-design/1.0.0', '1.0.0', `${COMMAND}Cache copy.\n`);
    const picks = [{ job: 'form-design', set: 'Interaction design', says: ['design a form', 'signup form'], skill: 'interaction-design:design-form', pack: 'interaction-design', rival: { skill: 'interaction-design:form-design', why_not: 'it stops at validation' }, kind: 'form' },
      { job: 'error-flow', set: 'Interaction design', says: ['error flow'], skill: 'interaction-design:error-flow', pack: 'interaction-design', rival: { skill: 'interaction-design:error-handling-ux', why_not: 'it is product-wide' }, kind: 'errors' }];
    const BRIEF = '# Brief: Test idea\n\n- **Idea:** A booking app\n- **For:** Clinics\n- **Decision:** Build it or stop\n';
    const PROFILE = '# Research profile: Test\n\n## Design system\n\n- Catalogue: catalogue.json\n- Finder: npm run ds:find -- "<need>" --json\n\n## House rules\n\n- DESIGN.md\n- taste.md\n- ../outside.md\n';
    const project = write(join(dir, 'project'), { '.research-profile.md': PROFILE, 'DESIGN.md': '# Design\n' });
    const folder = write(join(project, 'research', 'test-idea'), { ...CLEAN, 'brief.md': BRIEF });
    const opts = { picks, roots: [synced, cache], today: '2026-11-12' };

    const vendorPath = join(synced, 'interaction-design~g2', 'commands', 'design-form.md');
    const handOff = join(synced, 'interaction-design~g2', 'skills', 'form-design', 'SKILL.md');
    const expected = sha(readFileSync(vendorPath), '\0form-design\0', readFileSync(handOff), '\0hicks-law\0');
    const listing = () => JSON.stringify(readdirSync(folder, { recursive: true }).sort());
    const filesBefore = listing();
    const before = readFileSync(vendorPath, 'utf8');
    const r = brief(folder, { job: 'form-design' }, opts);
    const has = (line) => r.text.split('\n').includes(line);
    expect('a picked job says the pick, the rival and why', r.code === 0 && r.text.startsWith('Say: Using interaction-design:design-form, not interaction-design:form-design, because it stops at validation.'), r.text);
    expect('equal versions and generations fall to the order of the roots, and a same-named command in another pack is ignored', r.runs === vendorPath, r.runs);
    expect('hand-offs are listed once each, from the same copy, and a missing one says so', has('Also runs:') && has(`  form-design: ${handOff}`) && has('  hicks-law: not found in this copy') && !r.text.includes('fitts-law'), r.text);
    expect('the version covers the run file and its hand-offs in a fixed order', r.version === expected && has(`Version: ${expected}`), `${r.version} vs ${expected}`);
    expect('the other copy is listed with its own version, not run', r.text.includes('Also found, not run:') && r.text.includes(join(cache, 'interaction-design', '1.0.0', 'commands', 'design-form.md')), r.text);
    expect('the header lines are ready to copy, in the order the template sets', r.text.split('\n').slice(1, 9).join('|') === `Title: Form: Test idea|Skill: interaction-design:design-form|Pack: interaction-design|Version: ${expected}|${r.text.split('\n')[5]}|Pick: picked|Ran: 2026-11-12|File: work/2026-11-12-form.md` && /^Given: /.test(r.text.split('\n')[5]), r.text);
    expect('primary.md and sources.md are given by absolute path', r.text.includes(`Evidence, to read in full:\n  ${join(folder, 'primary.md')}\n  ${join(folder, 'sources.md')}`), r.text);
    expect('Given names what the skill reads, and only house rules that can be read', has('Given: brief.md, personas.md (proto), jobs.md (proto), journeys.md (proto), beliefs.md, primary.md, sources.md, house rules (DESIGN.md)'), r.text);
    expect('the brief and each model are given by absolute path', has(`  ${join(folder, 'brief.md')}`) && r.text.includes(`  ${join(folder, 'personas.md')} (proto): Proto: 1 of 2`) && /^  Decision: Build it or stop$/m.test(r.text), r.text);
    expect('design implications keep their ids', r.text.includes('    - Lead with reminders. [inference S4, S5]') && r.text.includes('    Persona: Sam\n    - Works one-handed. [inference S4, S1]'), r.text);
    expect('a model with no implications says so', /journeys\.md \(proto\).*\n    No Design implications section/.test(r.text), r.text);
    expect('beliefs carry the verdict the folder gives them', r.text.includes('  B1 (confirmed): Clinics run bookings on paper') && r.text.includes('  B3 (contradicted): Patients never reschedule'), r.text);
    expect('the finder and the house rules come from the profile, a missing one and one outside the project marked', r.text.includes('Finder: npm run ds:find -- "<need>" --json') && has(`  DESIGN.md: ${join(project, 'DESIGN.md')}`) && r.text.includes('taste.md (missing)') && r.text.includes('outside.md (outside the project root, not given)'), r.text);
    expect('a version no copy has now is flagged as a change', r.text.includes(`Note: skill changed since 2026-11-01. 2026-11-01-form.md ran version 0123456789ab, which no copy found now has. This run is ${expected}.`), r.text);
    expect('the vendor file and the idea folder are untouched', readFileSync(vendorPath, 'utf8') === before && listing() === filesBefore);

    const other = findSkill('interaction-design:design-form', opts.roots)[1].version;
    const switched = write(join(dir, 'switched'), { ...CLEAN, [WORK_FILE]: CLEAN[WORK_FILE].replace('0123456789ab', other) });
    expect('a version another copy has now is a change of surface, not of skill', !/^Note:/m.test(brief(switched, { job: 'form-design' }, opts).text));
    const same = write(join(dir, 'same'), { ...CLEAN, [WORK_FILE]: CLEAN[WORK_FILE].replace('0123456789ab', expected), 'work/2026-11-12-form.md': CLEAN[WORK_FILE].replace('0123456789ab', expected) });
    const r2 = brief(same, { job: 'form-design' }, opts);
    expect('the same version raises no note, and a taken name gets -2', !/^Note:/m.test(r2.text) && r2.text.includes('File: work/2026-11-12-form-2.md'), r2.text);

    const order = (roots) => findSkill('interaction-design:design-form', roots)[0].file;
    const newer = pack('market', 'interaction-design', '1.2.0');
    expect('a higher plugin version wins even from the last root', order([synced, cache, newer]) === join(newer, 'interaction-design', 'commands', 'design-form.md'));
    expect('with equal versions the earlier root wins, whatever its generations', order([cache, synced]).startsWith(cache));
    expect('the desktop app searches synced first, the terminal the cache, the marketplace last', defaultRoots('claude-desktop')[0].endsWith(join('plugins', 'synced')) && defaultRoots('cli')[0].endsWith(join('plugins', 'cache')) && defaultRoots('cli')[2].endsWith(join('plugins', 'marketplaces')));

    const skill = brief(folder, { skill: 'interaction-design:form-design' }, opts);
    expect('--skill with no pick runs a SKILL.md, recorded unpicked, with no hand-offs and a plain hash', skill.code === 0 && skill.text.includes('Pick: unpicked') && skill.text.includes('File: work/2026-11-12-form-design.md') && skill.runs === handOff && !skill.text.includes('Also runs:') && skill.version === sha(readFileSync(handOff)), skill.text);
    const named = brief(folder, { skill: 'interaction-design:design-form' }, opts);
    expect('--skill naming a picked skill is recorded as picked', named.text.includes('Pick: picked'), named.text);

    const missing = brief(folder, { job: 'error-flow' }, opts);
    expect('a skill that is not installed is an error', missing.code === 1 && /No SKILL\.md or command file for interaction-design:error-flow/.test(missing.text), missing.text);
    const bad = brief(folder, { skill: 'design-form' }, opts);
    expect('a skill without its pack is an error', bad.code === 1, bad.text);

    const bare = write(join(dir, 'bare'), { 'brief.md': BRIEF });
    const empty = brief(bare, { job: 'form-design' }, opts);
    expect('a folder with only a brief still briefs', empty.code === 0 && empty.text.includes('Given: brief.md\n') && empty.text.includes('Models, to read in full:\n  none on file'), empty.text);
    const workIsAFile = write(join(dir, 'workfile'), { 'brief.md': BRIEF, work: 'not a folder\n' });
    expect('a file named work does not stop the briefing', brief(workIsAFile, { job: 'form-design' }, opts).code === 0);

    const env = { ...process.env, UX_OS_SKILL_ROOTS: [synced, cache].join(delimiter) };
    const run = spawnSync(process.execPath, [self, folder, 'frm-desing'], { encoding: 'utf8', env });
    expect('an unknown job exits 1 and names the nearest', run.status === 1 && /^No job "frm-desing" in picks\.json\. Nearest: form-design, /m.test(run.stdout), `${run.status} ${run.stdout}${run.stderr}`);
    const cli = spawnSync(process.execPath, [self, folder, '--skill', 'interaction-design:design-form'], { encoding: 'utf8', env });
    expect('the command line takes --skill and the roots from the environment', cli.status === 0 && cli.stdout.includes(`Runs: ${vendorPath}`), `${cli.status} ${cli.stdout}${cli.stderr}`);
    expect('a missing folder is a usage error', spawnSync(process.execPath, [self, join(dir, 'nope'), 'form-design'], { encoding: 'utf8' }).status === 2);

    // Last, because it adds a copy every later call would find.
    write(synced, { 'interaction-design~g10/.claude-plugin/plugin.json': JSON.stringify({ name: 'interaction-design', version: '1.0.0' }), 'interaction-design~g10/commands/design-form.md': '# Newer generation\n' });
    expect('within one root the higher generation wins', order([synced, cache]) === join(synced, 'interaction-design~g10', 'commands', 'design-form.md'));
    rmSync(dir, { recursive: true, force: true });
    console.log(failures ? `\n${failures} self-test failure(s)` : '\nself-test passed');
    process.exit(failures ? 1 : 0);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [folder, second, third] = process.argv.slice(2);
  if (folder === '--self-test') await selfTest();
  else if (!folder || !second || !existsSync(folder) || (second === '--skill' && !third)) {
    console.error('usage: node brief.mjs <folder> <job | --skill pack:skill> | --self-test');
    process.exit(2);
  } else {
    const roots = process.env.UX_OS_SKILL_ROOTS ? process.env.UX_OS_SKILL_ROOTS.split(delimiter).filter(Boolean).map((r) => resolve(r)) : defaultRoots();
    const result = brief(folder, second === '--skill' ? { skill: third } : { job: second }, { roots });
    console.log(result.text);
    process.exit(result.code);
  }
}
