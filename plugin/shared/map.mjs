#!/usr/bin/env node
// Writes README.md at the top of a research project: every file the set can hold, in the order the work happens, with what is on file.
// The file is rewritten on each run and never edited by hand. A folder that does not exist yet is printed, not created,
// and a README.md this script did not write is left alone.
// Usage: node map.mjs <folder>   |   node map.mjs --self-test

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claimsHash, workFiles } from './check.mjs';
import { byDiscipline, disciplineName, homeDir, projectDir, RESEARCH, workDirs } from './layout.mjs';
import { command } from './names.mjs';
import { status } from './status.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const MAP_FILE = 'README.md';
const MARK = '<!-- Written by map.mjs when a command finishes. Do not edit it: the next run overwrites it. -->';

// `by` is a command name, or a sentence when no single command makes the file. `mode` is added after the idea when the command takes one.
const GROUPS = [
  { title: 'Frame', rows: [
    { path: 'brief.md', holds: 'The idea, who it is for, and the decision this research feeds', by: 'The first command you run on the idea' },
    { path: 'beliefs.md', holds: 'What you believe before any evidence, in your own words', by: 'research-discover' },
  ] },
  { title: 'Plan a study', rows: [
    { path: 'interview-script.md', holds: 'A guide for what people do today, and why', by: 'create-interview-script' },
    { path: 'survey.md', holds: 'Questions for how many people do or want something', by: 'create-survey' },
    { path: 'usability-plan.md', holds: 'Tasks for whether people can use what you made', by: 'create-usability-plan' },
    { path: 'diary-study.md', holds: 'A study for what plays out over days or weeks', by: 'create-diary-study' },
  ] },
  { title: 'Take in evidence', rows: [
    { path: 'inbox/', holds: 'Raw transcripts, notes and exports. Never published, never committed', by: 'You put files here' },
    { path: 'evidence/', holds: 'The anonymised copies every citation links to', by: 'research-debrief' },
    { path: 'primary.md', holds: 'Studies, participants and excerpts from your own research', by: 'research-debrief' },
    { path: 'sources.md', holds: 'The ledger: one numbered row per source', by: 'Every command adds its rows' },
  ] },
  { title: 'Make sense of it', rows: [
    { path: 'affinity.md', holds: 'The themes people share, from at least 20 notes', by: 'affinity-diagram' },
    { path: 'cardsort.md', holds: 'How people grouped your cards', by: 'analyze-card-sort' },
    { path: 'summary.md', holds: 'Findings, rated by how many people stand behind them', by: 'summarize-research' },
  ] },
  { title: 'Model people', rows: [
    { path: 'jobs.md', holds: 'What people are trying to get done, apart from any product', by: 'create-jtbd' },
    { path: 'personas.md', holds: 'Who behaves differently enough to design for separately', by: 'create-personas' },
    { path: 'journeys.md', holds: 'What happens today, and what should happen in future', by: 'create-journey-map' },
    { path: 'empathy.md', holds: 'What one person says, does, thinks and feels in one moment', by: 'create-empathy-map' },
  ] },
  { title: 'Design from it', rows: 'work' },
  { title: 'Decide', rows: [
    { path: 'decisions.md', holds: 'What was decided, what each decision rests on, and what would reverse it', by: 'record-decision' },
  ] },
  { title: 'Keep it', rows: [
    { path: 'book/', holds: 'The rendered book: beliefs in pencil, evidence in ink', by: 'Every command renders it' },
    { path: 'superseded/', holds: 'Files a later run replaced, kept by date', by: 'research-synthesize' },
    { path: 'repository.md', home: true, holds: 'What has been learned across every idea', by: 'create-research-repository' },
  ] },
];

const visible = (name) => !name.startsWith('.');
const files = (n) => `${n} file${n === 1 ? '' : 's'}`;
const isDir = (path) => existsSync(path) && statSync(path).isDirectory();

// One row per place work files go: work/ in a plain idea folder, or a folder per discipline beside research/.
function workRows(folder) {
  const holds = (what) => `${what} made from the research, each with its claims tagged`;
  if (!byDiscipline(folder)) return [{ path: 'work/', work: 'work', holds: holds('Design work'), by: 'run', args: '<job>' }];
  const sets = [...new Set(JSON.parse(readFileSync(join(HERE, 'picks.json'), 'utf8')).map((p) => p.set))];
  const rows = sets.map((set) => ({ path: `${disciplineName(set)}/`, project: true, work: `../${disciplineName(set)}`, holds: holds(`${set} work`), by: 'run', args: '<job>' }));
  for (const dir of workDirs(folder)) {
    if (!rows.some((row) => row.work === dir)) rows.push({ path: dir === 'work' ? 'work/' : `${dir.slice(3)}/`, project: dir !== 'work', work: dir, holds: holds('Work'), by: 'run', args: '--skill <pack:skill>' });
  }
  return rows;
}

// Where a row's file really is, and how the map, which sits in the project folder, links to it.
const realPath = (row, folder) => (row.home ? join(homeDir(folder), row.path) : row.project ? join(projectDir(folder), row.path) : join(folder, row.path));
const shownPath = (row, folder) => (row.home ? `../${row.path}` : row.project || !byDiscipline(folder) ? row.path : `${RESEARCH}/${row.path}`);

function stateOf(row, s, folder) {
  const path = realPath(row, folder);
  if (row.work) {
    const n = workFiles(folder).filter((file) => file.startsWith(`${row.work}/`)).length;
    return n ? files(n) : existsSync(path) ? 'empty' : 'not started';
  }
  if (!existsSync(path)) return 'not started';
  if (row.path === 'decisions.md' && s.decisions) return `${s.decisions.total} decision${s.decisions.total === 1 ? '' : 's'}, ${s.decisions.pencil} resting on pencil`;
  if (row.path === 'inbox/') {
    const pending = s.waiting.length + s.needsTranscript.length;
    return pending ? `${files(pending)} not taken in yet` : 'all taken in';
  }
  if (row.path === 'book/') return 'rendered';
  if (row.path.endsWith('/')) {
    const n = isDir(path) ? readdirSync(path).filter(visible).length : 0;
    return n ? files(n) : 'empty';
  }
  if (row.path === 'beliefs.md' && s.beliefs.length) return `${s.beliefs.length} belief${s.beliefs.length === 1 ? '' : 's'}, ${s.beliefs.filter((b) => b.settled).length} settled`;
  const mode = s.models[row.path];
  const base = mode === 'real' ? 'real, from research' : mode === 'proto' ? 'proto, from beliefs' : 'on file';
  return s.stale.includes(row.path) ? `${base}, older than the evidence` : base;
}

const cell = (text) => String(text).replace(/\|/g, '\\|');
const madeBy = (row, slug) => (/^[a-z-]+$/.test(row.by) ? `\`${command(row.by)}${row.args ? ` ${row.args}` : ''} ${slug}\`` : row.by);

export function render(folder) {
  const s = status(folder);
  const briefPath = join(folder, 'brief.md');
  const title = (existsSync(briefPath) && readFileSync(briefPath, 'utf8').match(/^# Brief:\s*(.+)$/m)?.[1]?.trim()) || s.slug;
  const now = s.choose ? `choose the study that tests ${s.testFirst?.id ?? 'the riskiest belief'}` : s.now ?? 'nothing is waiting';
  const lines = [
    `# ${title}`,
    '',
    MARK,
    '',
    `- **Decision:** ${s.decision ?? 'not set yet'}`,
    `- **Stage:** ${s.stage}`,
    `- **Now:** ${now}`,
    `- **Why:** ${s.why}`,
    `- **Evidence:** ${s.people} people from ${s.orgs} organisations. Real mode ${s.orgsNeeded ? `needs ${s.orgsNeeded} more` : 'is ready'}.`,
    '',
    'Every file this idea can hold, in the order the work happens. A file marked not started is made by the command beside it.',
  ];
  GROUPS.forEach((group, i) => {
    lines.push('', `## ${i + 1}. ${group.title}`, '', '| File | Holds | State | Made by |', '|---|---|---|---|');
    for (const row of group.rows === 'work' ? workRows(folder) : group.rows) {
      const shown = shownPath(row, folder);
      const name = existsSync(realPath(row, folder)) ? `[${shown}](${shown})` : `\`${shown}\``;
      lines.push(`| ${name} | ${cell(row.holds)} | ${stateOf(row, s, folder)} | ${cell(madeBy(row, s.slug))} |`);
    }
  });
  lines.push('', 'Proto files are assumptions. They become real once 5 people from different organisations have shown what they do.', '');
  return lines.join('\n');
}

// The map sits at the top of the project: beside research/ when the project is laid out by discipline, otherwise in the idea folder.
export const mapPath = (folder) => join(projectDir(folder), MAP_FILE);

// Returns true when the file changed, false when it was already right, and null when a README.md someone else wrote is in the way.
export function write(folder) {
  const text = render(folder);
  const path = mapPath(folder);
  if (existsSync(path) && !readFileSync(path, 'utf8').includes(MARK)) return null;
  if (existsSync(path) && readFileSync(path, 'utf8') === text) return false;
  writeFileSync(path, text);
  return true;
}

async function selfTest() {
  const { AUDIT_FILE, CLEAN, EVIDENCE, WORK_FILE } = await import('./fixtures/fixture.mjs');
  let failures = 0;
  const expect = (name, ok, detail) => {
    if (ok) console.log(`ok   ${name}`);
    else { failures++; console.log(`FAIL ${name}${detail === undefined ? '' : `: ${JSON.stringify(detail)}`}`); }
  };
  const roots = [];
  const make = (entries) => {
    const root = mkdtempSync(join(tmpdir(), 'research-map-'));
    roots.push(root);
    const folder = join(root, 'test-idea');
    mkdirSync(folder);
    for (const [name, text] of Object.entries(entries)) { mkdirSync(dirname(join(folder, name)), { recursive: true }); writeFileSync(join(folder, name), text); }
    return folder;
  };
  const check = (folder) => { const r = spawnSync(process.execPath, [join(HERE, 'check.mjs'), folder], { encoding: 'utf8' }); return `${r.status}\n${r.stdout}`; };
  const BRIEF = '# Brief: Test idea\n\n- **Idea:** A thing\n- **For:** Clinics\n- **Market:** UK\n- **Decision:** Build it or stop\n- **Book:** not published\n- **Created:** 2026-11-01\n';

  // Every template has a row, so a new deliverable cannot be added without a place on the map.
  const fixed = GROUPS.flatMap((g) => (g.rows === 'work' ? [] : g.rows));
  const mapped = fixed.map((r) => r.path);
  const unmapped = readdirSync(join(HERE, 'templates')).filter((t) => !['work.md', 'audit.md'].includes(t) && !mapped.includes(t));
  expect('every template has a row on the map', unmapped.length === 0, unmapped);
  const commands = [...fixed, ...workRows(tmpdir())].map((r) => r.by).filter((by) => /^[a-z-]+$/.test(by));
  const missing = commands.filter((name) => !existsSync(join(HERE, '..', 'skills', name, 'SKILL.md')));
  expect('every command the map names is a skill', missing.length === 0, missing);

  // A full folder
  const full = make({ ...CLEAN, ...EVIDENCE, 'brief.md': BRIEF });
  const before = check(full);
  expect('the first write changes the folder', write(full) === true);
  const text = readFileSync(join(full, MAP_FILE), 'utf8');
  expect('the title comes from the brief', text.startsWith('# Test idea\n'), text.slice(0, 40));
  expect('the decision is shown', text.includes('- **Decision:** Build it or stop'), text);
  expect('a file on file is linked', text.includes('| [personas.md](personas.md) |'), text);
  expect('a proto model says so', /\| \[personas\.md\]\(personas\.md\) \|[^\n]*\| proto, from beliefs[,|\s]/.test(text), text);
  expect('a model written before the evidence says so', /\| \[personas\.md\]\(personas\.md\) \|[^\n]*older than the evidence \|/.test(text), text);
  expect('a command that takes a job shows where it goes', text.includes('`/ux-os:run <job> test-idea`'), text);
  expect('evidence counts its files', /\| \[evidence\/\]\(evidence\/\) \|[^\n]*\| 1 file \|/.test(text), text);
  expect('work counts work files, not audits', /\| \[work\/\]\(work\/\) \|[^\n]*\| 1 file \|/.test(text), text);
  expect('decisions say how many rest on pencil', /\| \[decisions\.md\]\(decisions\.md\) \|[^\n]*\| 3 decisions, 1 resting on pencil \|/.test(text), text);
  expect('the map carries no tags', !/\[(S|B)\d/.test(text), text);
  expect('a second write changes nothing', write(full) === false);
  expect('the map does not change what the check says', check(full) === before, { before, after: check(full) });

  // Only a brief
  const fresh = make({ 'brief.md': BRIEF });
  const start = render(fresh);
  expect('a file not on file is named, not linked', start.includes('| `personas.md` |') && !start.includes('(personas.md)'), start);
  expect('a file not on file says not started and names its command', /\| `personas\.md` \|[^\n]*\| not started \| `\/ux-os:create-personas test-idea` \|/.test(start), start);
  expect('the repository sits beside the idea folder', start.includes('`../repository.md`'), start);

  // An inbox with a file waiting
  const waiting = make({ 'brief.md': BRIEF, 'inbox/call.txt': 'raw\n' });
  expect('a file in the inbox is counted as waiting', /\| \[inbox\/\]\(inbox\/\) \|[^\n]*\| 1 file not taken in yet \|/.test(render(waiting)), render(waiting));

  // A project laid out by discipline: research/ holds the idea folder, and work sits in a folder per discipline beside it
  const root = mkdtempSync(join(tmpdir(), 'research-map-'));
  roots.push(root);
  const laid = join(root, 'ux-os', 'test-idea', 'research');
  const moved = CLEAN[WORK_FILE].replaceAll('](../evidence/', '](../research/evidence/');
  const there = (name) => name.replace(/^work\//, '../interaction-design/');
  const entries = { ...CLEAN, ...EVIDENCE, 'brief.md': BRIEF };
  delete entries[WORK_FILE];
  delete entries[AUDIT_FILE];
  entries[there(WORK_FILE)] = moved;
  entries[there(AUDIT_FILE)] = CLEAN[AUDIT_FILE].replace(WORK_FILE, there(WORK_FILE)).replace(/(\*\*Claims hash:\*\*\s*)[0-9a-f]{12}/, `$1${claimsHash(moved)}`);
  for (const [name, body] of Object.entries(entries)) { mkdirSync(dirname(join(laid, name)), { recursive: true }); writeFileSync(join(laid, name), body); }
  const laidCheck = check(laid);
  expect('a project laid out by discipline passes the check', laidCheck.startsWith('0\n'), laidCheck);
  const laidStatus = status(laid);
  expect('its name is the project folder, not research', laidStatus.slug === 'test-idea', laidStatus.slug);
  expect('its work file is found in the discipline folder, with its audit', laidStatus.work.length === 1 && laidStatus.work[0].audit === 'audited', laidStatus.work);
  expect('the map is written at the top of the project', write(laid) === true && existsSync(join(root, 'ux-os', 'test-idea', MAP_FILE)) && !existsSync(join(laid, MAP_FILE)));
  const laidText = readFileSync(mapPath(laid), 'utf8');
  expect('research files are linked through research/', laidText.includes('| [research/personas.md](research/personas.md) |'), laidText);
  expect('a discipline folder is linked and counted', /\| \[interaction-design\/\]\(interaction-design\/\) \|[^\n]*\| 1 file \| `\/ux-os:run <job> test-idea` \|/.test(laidText), laidText);
  expect('the repository sits above every project', laidText.includes('`../repository.md`'), laidText);
  writeFileSync(join(laid, there(WORK_FILE)), moved.replaceAll('](../research/evidence/', '](../evidence/'));
  expect('a link that does not go through research/ fails the check', /LINK_OUTSIDE_EVIDENCE|BROKEN_EVIDENCE_LINK/.test(check(laid)), check(laid));
  const empty = join(root, 'ux-os', 'fresh', 'research');
  mkdirSync(empty, { recursive: true });
  writeFileSync(join(empty, 'brief.md'), BRIEF);
  expect('a discipline with nothing filed is named and not started', /\| `interaction-design\/` \|[^\n]*\| not started \|/.test(render(empty)), render(empty));

  // A plain idea folder that happens to be named research, in a repo with its own README
  const repo = join(root, 'repo');
  const plain = join(repo, 'research');
  for (const [name, body] of Object.entries({ ...CLEAN, ...EVIDENCE, 'brief.md': BRIEF })) { mkdirSync(dirname(join(plain, name)), { recursive: true }); writeFileSync(join(plain, name), body); }
  writeFileSync(join(repo, 'README.md'), '# My repo\n');
  mkdirSync(join(repo, 'notes'));
  writeFileSync(join(repo, 'notes', '2026-01-01-meeting.md'), '# Not a work file\n');
  expect('a folder only named research is a plain idea folder', status(plain).slug === 'research' && status(plain).work.length === 1 && mapPath(plain) === join(plain, MAP_FILE), status(plain).slug);
  expect('and folders beside it are not read as disciplines', check(plain).startsWith('0\n'), check(plain));
  writeFileSync(join(plain, MAP_FILE), '# Notes I wrote\n');
  expect('a README the script did not write is left alone', write(plain) === null && readFileSync(join(plain, MAP_FILE), 'utf8') === '# Notes I wrote\n' && readFileSync(join(repo, 'README.md'), 'utf8') === '# My repo\n');
  const linked = join(root, 'ux-os', 'fresh');
  symlinkSync(join(repo, 'notes'), join(linked, 'linked-notes'));
  expect('a link to a folder elsewhere is not a discipline folder', check(empty).startsWith('0\n') && !render(empty).includes('linked-notes'), check(empty));
  mkdirSync(join(linked, 'content-design'));
  writeFileSync(join(linked, 'content-design', '2026-11-01-form.md'), '# x\n');
  mkdirSync(join(linked, 'interaction-design'));
  writeFileSync(join(linked, 'interaction-design', '2026-11-01-form.md'), '# x\n');
  expect('same-named work files in two disciplines are told apart', status(empty).work.map((w) => w.file).join() === 'content-design/2026-11-01-form.md,interaction-design/2026-11-01-form.md', status(empty).work);

  // No folder yet
  const absent = join(tmpdir(), 'research-map-no-such-folder', 'new-idea');
  expect('a folder that does not exist can still be mapped', render(absent).includes('# new-idea') && !existsSync(absent));

  for (const root of roots) rmSync(root, { recursive: true, force: true });
  console.log(failures ? `\n${failures} self-test failure(s)` : '\nself-test passed');
  process.exit(failures ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2];
  if (arg === '--self-test') await selfTest();
  else if (!arg) { console.error('usage: node map.mjs <folder> | --self-test'); process.exit(2); }
  else if (!existsSync(arg)) console.log(render(arg));
  else { const wrote = write(arg); console.log(wrote === null ? `${mapPath(arg)} was not written by this script, so it was left alone and there is no map` : `${mapPath(arg)} ${wrote ? 'written' : 'unchanged'}`); }
}
