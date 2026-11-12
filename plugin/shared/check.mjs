#!/usr/bin/env node
// Completion check for a research idea folder. Exits 0 when the folder keeps the contract.
// Usage: node check.mjs <folder>   |   node check.mjs --claims-hash <work file>   |   node check.mjs --self-test

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromWork, isWorkFile, workDirs } from './layout.mjs';
import { command } from './names.mjs';
import { catalogueNames, readProfile } from './profile.mjs';
import { claims, claimsHash, firstTable, needsBar, parseFile, parseMarkdown, parseTag, stripTags, tableRows, tagsIn } from './parse.mjs';

export { claimsHash };

const HERE = dirname(fileURLToPath(import.meta.url));
const OUTPUTS = ['primary.md', 'affinity.md', 'cardsort.md', 'empathy.md', 'jobs.md', 'personas.md', 'journeys.md', 'interview-script.md', 'usability-plan.md', 'diary-study.md', 'survey.md', 'summary.md', 'decisions.md', 'repository.md'];
const PROTO = ['jobs.md', 'personas.md', 'journeys.md', 'empathy.md'];
const KINDS = ['original', 'secondary', 'vendor', 'opinion', 'forum', 'first-party'];
const STATUSES = ['verified', 'unverified'];
const LEVELS = { low: 0, medium: 1, high: 2 };
export const BAR_PEOPLE = 5;
const RECOMMENDS = ['Design implications', 'How we would know this is wrong', 'What this means for the structure', 'What this changes', 'Cards without a clear home'];

const ANCHOR = /^p\d+-excerpt-\d+$/;
const IN_EVIDENCE = /^evidence\/S\d+-[a-z0-9-]+(\.[a-z0-9]+)?$/;

// What a third-party skill made, filed by /ux-os:run.
const WORK_NAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const HEADER = ['Skill', 'Pack', 'Version', 'Given', 'Pick', 'Ran'];
const HEADER_LINE = /^-\s+\*\*([A-Za-z]+):\*\*\s*(.*)$/;
const pickedSkills = () => new Set(JSON.parse(readFileSync(join(HERE, 'picks.json'), 'utf8')).map((p) => p.skill));
const realDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

const filesIn = (folder, pattern) => workDirs(folder).flatMap((dir) => readdirSync(join(folder, dir)).filter((name) => pattern.test(name) && statSync(join(folder, dir, name)).isFile()).sort().map((name) => `${dir}/${name}`));

// Only files named YYYY-MM-DD-<kind>.md, or with -2 and so on before the extension, are work files. Anything else in a work folder is left alone.
export const workFiles = (folder) => filesIn(folder, WORK_NAME);

// Only what sits above ## Output is read as claims. Below it are the skill's own words, headings and all.
function claimPart(text) {
  const cut = text.search(/^## Output[ \t]*$/m);
  return cut === -1 ? text : `${text.slice(0, cut)}## Output\n`;
}

export function readWork(path) {
  const doc = parseMarkdown(claimPart(readFileSync(path, 'utf8')));
  const header = {};
  for (const { text } of doc.preamble) {
    const m = text.trim().match(HEADER_LINE);
    if (m && !(m[1] in header)) header[m[1]] = m[2].trim();
  }
  const section = doc.sections.find((s) => s.name === 'Claims');
  const block = section && firstTable(section);
  return { header, rows: block ? tableRows(block).map((row, i) => ({ ...row, tags: block.rows[i].tags })) : [] };
}

// An audit of one work file, written by the claims auditor beside it: work/<work file name>.audit.md.
const AUDIT_NAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.audit\.md$/;
const AUDIT_HEADER = ['Work file', 'Claims hash', 'Audited'];
const AUDIT_LINE = /^-\s+\*\*([A-Za-z ]+):\*\*\s*(.*)$/;
const VERDICTS_AUDIT = ['sound', 'two claims', 'unsupported', 'partly supported', 'wrong verdict', 'wrong tag', 'not stated by the skill', 'under-cited', 'could not check'];
// Under-cited is advice: a row that could cite more, not a row that is wrong. Could not check is a source the auditor cannot open, such as a web page.
const SETTLED = ['sound', 'under-cited', 'could not check'];

export const auditFiles = (folder) => filesIn(folder, AUDIT_NAME);

const auditFor = (workFile) => workFile.replace(/\.md$/, '.audit.md');

// Reads one audit and says where it leaves its work file: audited, audit open or audit out of date, with the problems behind it.
function readAudit(folder, file) {
  const problems = [];
  const add = (code, line, msg) => problems.push({ code, file, line, msg });
  const workFile = file.replace(/\.audit\.md$/, '.md');
  const doc = parseFile(join(folder, file));
  if (!doc.title) add('MISSING_SECTION', 1, 'no # title');
  const seen = new Map();
  for (const { text, line } of doc.preamble) {
    const m = text.trim().match(AUDIT_LINE);
    if (!m || !AUDIT_HEADER.includes(m[1])) { add('AUDIT_HEADER', line, `"${text.trim().slice(0, 60)}" is not one of the header lines ${AUDIT_HEADER.join(', ')}`); continue; }
    if (seen.has(m[1])) { add('AUDIT_HEADER', line, `**${m[1]}:** appears twice`); continue; }
    seen.set(m[1], { value: m[2].trim(), line });
  }
  for (const key of AUDIT_HEADER) if (!seen.has(key)) add('AUDIT_HEADER', 1, `no **${key}:** line`);
  const at = (key) => seen.get(key)?.line ?? 1;
  const value = (key) => seen.get(key)?.value ?? '';
  if (seen.has('Work file') && value('Work file') !== workFile) add('AUDIT_HEADER', at('Work file'), `**Work file:** "${value('Work file')}" is not ${workFile}, the file this audit sits beside`);
  if (seen.has('Claims hash') && !/^[0-9a-f]{12}$/.test(value('Claims hash'))) add('AUDIT_HEADER', at('Claims hash'), `**Claims hash:** "${value('Claims hash')}" is not the 12-character hash check.mjs --claims-hash prints`);
  if (seen.has('Audited') && !realDate(value('Audited'))) add('AUDIT_HEADER', at('Audited'), `**Audited:** "${value('Audited')}" is not a real YYYY-MM-DD date`);
  const template = templateFor('audit.md');
  for (const entry of template) if (!entry.optional && !doc.sections.some((s) => s.name === entry.heading)) add('MISSING_SECTION', 1, `no "## ${entry.heading}" section`);
  for (const section of doc.sections) if (!template.some((e) => e.heading === section.name)) add('EXTRA_SECTION', section.line, `"${section.name}" is not in the audit template`);

  const workPath = join(folder, workFile);
  if (!existsSync(workPath)) {
    add('AUDIT_STALE', 1, `${workFile} is not on file, so this audit is of nothing`);
    return { state: 'audit out of date', problems };
  }
  const now = claimsHash(readFileSync(workPath, 'utf8'));
  if (seen.has('Claims hash') && value('Claims hash') !== now) {
    add('AUDIT_STALE', at('Claims hash'), `the Claims table has changed since this audit, which read ${value('Claims hash')} and is now ${now}. Ask for a fresh audit`);
    return { state: 'audit out of date', problems };
  }

  const section = (name) => doc.sections.find((s) => s.name === name);
  const table = (name, columns) => {
    const s = section(name);
    if (!s) return null;
    const block = firstTable(s);
    if (!block || block.header.join('|') !== columns.join('|')) { add('BAD_VALUE', s.line, `"## ${name}" holds one table with the columns ${columns.join(', ')}`); return null; }
    return { block, rows: tableRows(block) };
  };
  const open = [];
  const rows = table('Rows', ['#', 'Verdict', 'Note']);
  if (rows) {
    const numbers = readWork(workPath).rows.map((row) => row['#']);
    const judged = new Set();
    rows.rows.forEach((row, i) => {
      const line = rows.block.rows[i].line;
      if (!numbers.includes(row['#'])) add('BAD_VALUE', line, `row "${row['#']}" is not a row of ${workFile}`);
      else if (judged.has(row['#'])) add('BAD_VALUE', line, `row ${row['#']} is judged twice`);
      judged.add(row['#']);
      if (!VERDICTS_AUDIT.includes(row.Verdict)) add('BAD_VALUE', line, `verdict "${row.Verdict}" is not one of ${VERDICTS_AUDIT.join(', ')}`);
      else if (!SETTLED.includes(row.Verdict)) open.push([line, `row ${row['#']} is ${row.Verdict}: ${row.Note}`]);
    });
    for (const n of numbers) if (!judged.has(n)) add('BAD_VALUE', rows.block.line, `row ${n} of ${workFile} has no verdict`);
  }
  const missing = table('Missing', ['Claim', 'Suggested basis', 'Pointer']);
  if (missing) {
    const none = missing.rows.filter((row) => row.Claim === 'none' && row['Suggested basis'] === 'none' && row.Pointer === 'none');
    if (!missing.rows.length || (none.length && missing.rows.length > 1)) add('BAD_VALUE', missing.block.line, 'Missing lists each missing claim, or holds the single row | none | none | none |');
    else if (!none.length) missing.rows.forEach((row, i) => open.push([missing.block.rows[i].line, `missing claim: ${row.Claim}`]));
  }
  const departures = section('Departures and conflicts');
  if (departures && !departures.blocks.some((b) => b.type === 'bullet')) add('BAD_VALUE', departures.line, 'Departures and conflicts holds a bullet for each, or the single bullet None found.');
  for (const [line, msg] of open) add('AUDIT_OPEN', line, msg);
  return { state: problems.length ? 'audit open' : 'audited', problems };
}

// Where a work file's audit stands. A work file with no audit passes the gate.
export function auditOf(folder, workFile) {
  const file = auditFor(workFile);
  return existsSync(join(folder, file)) ? { file, ...readAudit(folder, file) } : { file, state: 'not audited', problems: [] };
}

// Pencil is what has not met the bar: an unsettled belief, an inference, a general practice, a proposal or a gap.
// Ink is a direct source or participant citation, or a belief confirmed, refuted or mixed.
export const inPencil = (tag) => (tag.kind === 'belief' && !needsBar(tag)) || ['inference', 'practice', 'proposed', 'gap'].includes(tag.kind);

function workHeader(doc, add) {
  const seen = new Map();
  for (const { text, line } of doc.preamble) {
    const m = text.trim().match(HEADER_LINE);
    if (!m || !HEADER.includes(m[1])) { add('WORK_HEADER', line, `"${text.trim().slice(0, 60)}" is not one of the header lines ${HEADER.join(', ')}`); continue; }
    if (seen.has(m[1])) { add('WORK_HEADER', line, `**${m[1]}:** appears twice`); continue; }
    seen.set(m[1], { value: m[2].trim(), line });
  }
  for (const key of HEADER) if (!seen.has(key)) add('WORK_HEADER', 1, `no **${key}:** line`);
  const value = (key) => seen.get(key)?.value ?? '';
  const pick = pickedSkills().has(value('Skill')) ? 'picked' : 'unpicked';
  const rules = [
    ['Skill', (v) => /^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9-]*$/.test(v), 'is not written pack:skill'],
    ['Pack', (v) => v === value('Skill').split(':')[0], 'is not the pack the Skill line names'],
    ['Version', (v) => /^[0-9a-f]{12}$/.test(v), 'is not the 12-character hash brief.mjs prints'],
    ['Given', (v) => v !== '', 'is empty'],
    ['Pick', (v) => v === pick, `does not match picks.json, which makes this run ${pick}`],
    ['Ran', realDate, 'is not a real YYYY-MM-DD date'],
  ];
  for (const [key, ok, msg] of rules) if (seen.has(key) && !ok(value(key))) add('WORK_HEADER', seen.get(key).line, `**${key}:** "${value(key)}" ${msg}`);
}

// One tag, or one first-party source cited person by person, each with its own link.
function oneCitation(tags) {
  if (tags.length === 1) return true;
  const ids = new Set(tags.flatMap((t) => t.sources));
  const people = tags.map((t) => t.participants[0]);
  return tags.every((t) => t.kind === 'source' && t.sources.length === 1 && t.participants.length === 1 && t.link) && ids.size === 1 && new Set(people).size === people.length;
}

function workClaims(doc, add) {
  const section = doc.sections.find((s) => s.name === 'Claims');
  if (!section) return;
  const block = firstTable(section);
  for (const other of [...section.blocks.filter((b) => b !== block), ...section.subsections]) add('WORK_NOT_A_TABLE', other.line, 'Claims holds one table and nothing else, so every claim is a row with one Basis');
  if (!block?.rows.length) { add('WORK_NO_CLAIMS', section.line, 'the Claims table has no rows. Name every claim the output rests on'); return; }
  if (block.header.join('|') !== '#|Claim|Basis') { add('BAD_VALUE', block.line, 'the Claims table has the columns #, Claim and Basis'); return; }
  tableRows(block).forEach((row, i) => {
    const { line, tags } = block.rows[i];
    if (!(row.Claim ?? '').trim()) add('BAD_VALUE', line, 'the Claim cell is empty');
    const basis = tagsIn(row.Basis ?? '');
    if (tags.length && (tagsIn(row.Claim ?? '').length || !basis.length || !oneCitation(basis) || stripTags(row.Basis) !== '')) add('BAD_TAG', line, 'Basis holds one tag and nothing else, or one source cited person by person with a link each, and the Claim cell holds no tag');
  });
}

// Where each passage lives, as the intake recorded it in primary.md.
function recordedExcerpts(folder, issues) {
  const map = new Map();
  const path = join(folder, 'primary.md');
  if (!existsSync(path)) return map;
  const section = parseFile(path).sections.find((s) => s.name === 'Excerpts');
  const block = section && firstTable(section);
  if (!block) return map;
  for (const row of block.rows) {
    for (const tag of row.tags) {
      if (!tag.link?.anchor) continue;
      const key = `${tag.link.file}#${tag.link.anchor}`;
      if (map.has(key)) issues.push({ code: 'LINK_NOT_RECORDED', file: 'primary.md', line: row.line, msg: `#${tag.link.anchor} is recorded twice, and each excerpt needs its own anchor` });
      map.set(key, { source: tag.sources[0], person: tag.participants[0] });
    }
  }
  return map;
}

function anchorReader(folder) {
  const cache = new Map();
  return (file) => {
    if (!cache.has(file)) {
      const path = join(folder, file);
      cache.set(file, existsSync(path) ? new Set([...readFileSync(path, 'utf8').matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1])) : null);
    }
    return cache.get(file);
  };
}

function linkProblem(tag, file, anchorsIn, recorded) {
  const { file: target, anchor } = tag.link;
  if (!IN_EVIDENCE.test(target)) return null; // looseLinks reports it, for every link in the file.
  const anchors = anchorsIn(target);
  if (!anchors) return ['BROKEN_EVIDENCE_LINK', `${target} is not in this folder`];
  if (anchor === null) return null;
  if (!ANCHOR.test(anchor)) return ['BROKEN_EVIDENCE_LINK', `#${anchor} is not a p<N>-excerpt-<M> anchor, and an anchor never holds a name`];
  if (!anchors.has(anchor)) return ['BROKEN_EVIDENCE_LINK', `#${anchor} is not in ${target}`];
  if (anchor.match(/^p(\d+)-/)[1] !== tag.participants[0]?.slice(1)) return ['LINK_NOT_RECORDED', `${tag.raw} links to #${anchor}, which belongs to someone else`];
  if (file === 'primary.md') return null;
  const entry = recorded.get(`${target}#${anchor}`);
  if (!entry || entry.person !== tag.participants[0] || entry.source !== tag.sources[0]) return ['LINK_NOT_RECORDED', `${tag.raw} links to #${anchor}, which primary.md does not record against that person and source`];
  return null;
}

const mustLink = (file, doc) => ['primary.md', 'affinity.md', 'summary.md', 'decisions.md'].includes(file) || (PROTO.includes(file) && /^From research:/.test(doc.banner ?? ''));

function lacksLink(tag, sources) {
  if (tag.kind !== 'source' || !tag.sources.length || !tag.sources.every((id) => sources.get(id)?.Kind === 'first-party')) return false;
  if (!tag.link || tag.sources.length > 1 || tag.participants.length > 1) return true;
  return tag.participants.length === 1 ? tag.link.anchor === null : tag.link.file.endsWith('.md');
}

const onlyGaps = (tags) => tags.length > 0 && tags.every((t) => t.kind === 'gap');

// The lines that propose something to build, each with the component it names, if any.
function proposalLines(file, doc) {
  const bullets = (container) => (container?.blocks ?? []).filter((b) => b.type === 'bullet' && b.depth === 0 && !onlyGaps(b.tags)).map((b) => ({ value: b.component, line: b.line }));
  if (file === 'personas.md') return doc.sections.filter((s) => s.name.startsWith('Persona: ')).flatMap((s) => bullets(s.subsections.find((x) => x.name === 'Design implications')));
  if (file === 'jobs.md') return bullets(doc.sections.find((s) => s.name === 'Design implications'));
  if (file !== 'journeys.md') return [];
  return doc.sections.filter((s) => s.name.startsWith('Future journey: ')).flatMap((s) => {
    const stages = s.subsections.find((x) => x.name === 'Stages');
    const block = stages && firstTable(stages);
    if (!block) return [];
    return tableRows(block).map((row, i) => ({ value: row.Component, line: block.rows[i].line, tags: block.rows[i].tags })).filter((r) => !onlyGaps(r.tags));
  });
}

const componentName = (value) => (value ?? '').replace(/`/g, '').trim();

function componentIssues(file, doc, names, requireLines, add) {
  const verify = (value, line) => {
    const name = componentName(value);
    if (name && !/^no component fits$/i.test(name) && !names.has(name)) add('UNKNOWN_COMPONENT', line, `${name} is not in the catalogue`);
  };
  const proposals = proposalLines(file, doc);
  for (const { value, line } of proposals) {
    verify(value, line);
    if (requireLines && !componentName(value)) add('NO_COMPONENT_LINE', line, 'a design system is connected and this proposal names no component. Name one, or write no component fits');
  }
  // A component named anywhere else still has to exist, because the book shows it.
  const counted = new Set(proposals.map((p) => p.line));
  const visit = (container) => { for (const b of container.blocks) if (b.type === 'bullet' && b.component && !counted.has(b.line)) verify(b.component, b.line); };
  for (const section of doc.sections) { visit(section); section.subsections.forEach(visit); }
}

// Every local link in the raw file, tag or not, in every section, has to land in evidence/.
function looseLinks(text, add, at = (target) => target) {
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/\]\(([^)]*)\)/g)) {
      const target = m[1].trim();
      if (/^(https?:|mailto:|#)/i.test(target)) continue;
      if (!IN_EVIDENCE.test(at(target.split('#')[0]))) add('LINK_OUTSIDE_EVIDENCE', i + 1, `a link points at ${target}, and a link may only point at a file in evidence/ named like S20-interview.md`);
    }
  });
}

function namesInKey(folder) {
  const path = join(folder, 'inbox', 'codes.md');
  const found = { people: [], orgs: [] };
  if (!existsSync(path)) return found;
  const block = firstTable(parseMarkdown(`## x\n${readFileSync(path, 'utf8').replace(/^# .*$/m, '')}`).sections[0]);
  if (!block) return found;
  for (const row of tableRows(block)) {
    for (const [header, value] of Object.entries(row)) {
      const name = value.trim();
      if (name.length < 3) continue;
      if (/^(person|name)$/i.test(header)) found.people.push(name);
      if (/^organi[sz]ation$/i.test(header)) found.orgs.push(name);
    }
  }
  return found;
}

const NAME_MSG = 'the name of a person or organisation from inbox/codes.md appears here';

// The key in inbox/ is the only place a real name may live.
function nameLeaks(folder, issues) {
  const { people, orgs } = namesInKey(folder);
  const whole = [...people, ...orgs].map((n) => n.toLowerCase());
  if (!whole.length) return;
  const scan = (file, text) => text.toLowerCase().split('\n').forEach((line, i) => {
    if (whole.some((n) => line.includes(n))) issues.push({ code: 'NAME_LEAK', file, line: i + 1, msg: NAME_MSG });
  });
  for (const file of [...OUTPUTS, 'sources.md', 'beliefs.md', ...workFiles(folder), ...auditFiles(folder)]) if (existsSync(join(folder, file))) scan(file, readFileSync(join(folder, file), 'utf8'));
  const evidence = join(folder, 'evidence');
  if (!existsSync(evidence)) return;
  const nameWords = people.flatMap((n) => n.toLowerCase().split(/\s+/)).filter((w) => w.length >= 4);
  for (const name of readdirSync(evidence)) {
    const path = join(evidence, name);
    if (!statSync(path).isFile()) continue;
    const spaced = name.toLowerCase().replace(/[-_.]/g, ' ');
    const tokens = spaced.split(/\s+/);
    if (nameWords.some((w) => tokens.includes(w)) || whole.some((n) => spaced.includes(n))) issues.push({ code: 'NAME_LEAK', file: `evidence/${name}`, line: 1, msg: NAME_MSG });
    scan(`evidence/${name}`, readFileSync(path, 'utf8'));
  }
}

function templateFor(file) {
  const text = readFileSync(join(HERE, 'templates', file), 'utf8');
  const sections = [];
  let current = null;
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const words = (lines[i + 1] ?? '').match(/<!--\s*check:\s*([\w ]+?)\s*-->/)?.[1]?.split(' ') ?? [];
    const directive = words.includes('none') ? 'none' : words.includes('tags') ? 'tags' : 'full';
    if (line.startsWith('## ')) {
      current = { heading: line.slice(3).trim(), mode: line.slice(3).trim() === 'Run notes' ? 'none' : directive, optional: words.includes('optional'), subs: [] };
      sections.push(current);
    } else if (line.startsWith('### ') && current) {
      current.subs.push(line.slice(4).trim());
    }
  });
  return sections;
}

const matcher = (heading) => new RegExp(`^${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/<[^>]+>/g, '.+')}$`);
const isPattern = (heading) => /<[^>]+>/.test(heading);

function ledger(folder, issues) {
  const path = join(folder, 'sources.md');
  const map = new Map();
  if (!existsSync(path)) return map;
  const table = parseMarkdown(`## x\n${readFileSync(path, 'utf8').replace(/^# .*$/m, '')}`).sections[0];
  const block = firstTable(table);
  if (!block) return map;
  tableRows(block).forEach((row, i) => {
    const line = block.rows[i].line;
    if (map.has(row.ID)) issues.push({ code: 'BAD_LEDGER', file: 'sources.md', line, msg: `duplicate id ${row.ID}` });
    if (!KINDS.includes(row.Kind)) issues.push({ code: 'BAD_LEDGER', file: 'sources.md', line, msg: `unknown kind "${row.Kind}"` });
    if (!STATUSES.includes(row.Status)) issues.push({ code: 'BAD_LEDGER', file: 'sources.md', line, msg: `unknown status "${row.Status}"` });
    if (/(^|\/)inbox\//.test(row.Where ?? '')) issues.push({ code: 'BAD_LEDGER', file: 'sources.md', line, msg: `${row.ID} points into inbox/, which holds raw material` });
    if (row.Kind === 'first-party' && !row.Where?.startsWith('evidence/')) issues.push({ code: 'BAD_LEDGER', file: 'sources.md', line, msg: `first-party source ${row.ID} must point into evidence/` });
    map.set(row.ID, row);
  });
  return map;
}

export function participantIndex(path) {
  const orgs = new Map();
  const behaviour = new Map();
  if (!existsSync(path)) return { orgs, behaviour };
  const doc = parseFile(path);
  const people = doc.sections.find((s) => s.name === 'Participants');
  const peopleTable = people && firstTable(people);
  if (peopleTable) tableRows(peopleTable).forEach((row) => { if (!/^(not recorded|unknown)?$/i.test(row.Org ?? '')) orgs.set(row.Code, row.Org); });
  const excerpts = doc.sections.find((s) => s.name === 'Excerpts');
  const excerptTable = excerpts && firstTable(excerpts);
  if (excerptTable) tableRows(excerptTable).forEach((row, i) => {
    if (!['observed', 'reported'].includes(row.Grade?.toLowerCase()) || row.Prompted?.toLowerCase() === 'yes') return;
    const who = excerptTable.rows[i].tags.flatMap((t) => t.participants);
    if (who.length !== 1) return;
    for (const belief of row.Beliefs?.match(/B\d+/g) ?? []) {
      if (!behaviour.has(belief)) behaviour.set(belief, new Set());
      behaviour.get(belief).add(who[0]);
    }
  });
  return { orgs, behaviour };
}

function valueChecks(file, doc, add, people) {
  const section = (name) => doc.sections.filter((s) => matcher(name).test(s.name));
  const sub = (s, name) => s.subsections.find((x) => x.name === name);
  const each = (container, fn) => {
    const block = container && firstTable(container);
    if (block) tableRows(block).forEach((row, i) => fn(row, block.rows[i].line));
  };
  const inRange = (value, low, high) => /^\d+$/.test(value) && Number(value) >= low && Number(value) <= high;
  const ratedOrUnknown = (value, low, high) => value?.toLowerCase() === 'unknown' || inRange(value, low, high);
  const oneOf = (value, list, what, line) => { if (!list.includes((value ?? '').toLowerCase())) add('BAD_VALUE', line, `${what} "${value}" is not one of ${list.join(', ')}`); };
  if (file === 'journeys.md') {
    for (const journey of section('Journey: <x>')) {
      const phases = [];
      each(sub(journey, 'Stages'), (row, line) => {
        phases.push(row.Phase);
        if (!ratedOrUnknown(row.Emotion, 1, 5)) add('BAD_VALUE', line, `Emotion "${row.Emotion}" is not a whole number from 1 to 5, or unknown`);
      });
      for (const moment of sub(journey, 'Moments that matter')?.blocks ?? []) {
        const phase = moment.text.match(/^\*\*(.+?):?\*\*:?/)?.[1];
        if (moment.type === 'bullet' && !phases.includes(phase)) add('BAD_VALUE', moment.line, `moment "${phase}" is not a Phase in this journey`);
      }
    }
  }
  if (file === 'journeys.md') {
    for (const future of section('Future journey: <x>')) {
      each(sub(future, 'Stages'), (row, line) => {
        if (!ratedOrUnknown(row.Emotion, 1, 5)) add('BAD_VALUE', line, `Emotion "${row.Emotion}" is not a whole number from 1 to 5, or unknown`);
      });
    }
  }
  if (file === 'repository.md') {
    each(section('Insights')[0], (row, line) => oneOf(row.Strength, ['strong', 'some', 'hint'], 'Strength', line));
  }
  if (file === 'summary.md') {
    const block = section('What we found')[0] && firstTable(section('What we found')[0]);
    if (block) tableRows(block).forEach((row, i) => {
      const { line, tags } = block.rows[i];
      oneOf(row.Strength, ['strong', 'some', 'hint'], 'Strength', line);
      const orgs = new Set(tags.flatMap((t) => t.participants).map((p) => people.orgs.get(p)).filter(Boolean));
      const needed = { strong: BAR_PEOPLE, some: 2 }[row.Strength?.toLowerCase()] ?? 0;
      if (orgs.size < needed) add('BAD_VALUE', line, `Strength "${row.Strength}" needs ${needed} organisations cited, this row cites ${orgs.size}`);
    });
  }
  if (file === 'decisions.md') {
    let n = 0;
    let last = '';
    const today = new Date().toISOString().slice(0, 10);
    const table = section('Decisions')[0] && firstTable(section('Decisions')[0]);
    if (table && table.header.join('|') !== '#|Date|Decision|Rests on|Would reverse it') add('BAD_VALUE', table.line, 'the Decisions table has the columns #, Date, Decision, Rests on and Would reverse it');
    else each(section('Decisions')[0], (row, line) => {
      n++;
      const basis = row['Rests on'] ?? '';
      if (!tagsIn(basis).length || stripTags(basis).replace(/[\s,]/g, '') !== '') add('BAD_TAG', line, 'Rests on holds the tags the decision stands on and nothing else');
      if (tagsIn(`${row.Decision ?? ''} ${row['Would reverse it'] ?? ''}`).length) add('BAD_TAG', line, 'a tag belongs in Rests on, never in Decision or Would reverse it');
      if (realDate(row.Date ?? '')) {
        if (row.Date > today) add('BAD_VALUE', line, `Date "${row.Date}" is in the future`);
        if (row.Date < last) add('BAD_VALUE', line, `Date "${row.Date}" is earlier than the row above. Decisions are added at the bottom, oldest first`);
        last = row.Date;
      }
      const replaced = (row.Decision ?? '').match(/^Replaces (\d+):/);
      if (replaced && Number(replaced[1]) >= n) add('BAD_VALUE', line, `"Replaces ${replaced[1]}" has to name an earlier decision`);
      if (row['#'] !== String(n)) add('BAD_VALUE', line, `# "${row['#']}" should be ${n}. Decisions are numbered in order, and a row is never removed`);
      if (!realDate(row.Date ?? '')) add('BAD_VALUE', line, `Date "${row.Date}" is not a real YYYY-MM-DD date`);
      if (!(row.Decision ?? '').trim()) add('BAD_VALUE', line, 'the Decision cell is empty');
      if (!(row['Would reverse it'] ?? '').trim()) add('BAD_VALUE', line, 'Would reverse it is empty. A decision nothing could change is not resting on evidence');
    });
  }
  if (file === 'primary.md') {
    each(section('Participants')[0], (row, line) => {
      if (!/^(O\d+|not recorded|unknown)$/i.test(row.Org ?? '')) add('BAD_VALUE', line, `Org "${row.Org}" must be an anonymised code such as O1, because this table feeds a published page`);
    });
  }
  if (file === 'repository.md') {
    each(section('Studies')[0], (row, line) => {
      if (/(^|\/)inbox\//.test(row.Where ?? '')) add('BAD_VALUE', line, 'Where points into inbox/, which holds raw material');
    });
  }
  if (file === 'cardsort.md') {
    each(section('Pairs people keep together')[0], (row, line) => {
      if (Number.isNaN(Number(row.Together)) || Number(row.Together) > 1 || Number(row.Together) < 0) add('BAD_VALUE', line, `Together "${row.Together}" is not a share from 0 to 1`);
    });
    const type = section('Study')[0]?.blocks.find((b) => b.type === 'bullet' && b.text.startsWith('**Type:**'));
    if (type && !/\b(open|closed|hybrid)\b/i.test(type.text)) add('BAD_VALUE', type.line, 'Type is open, closed or hybrid');
  }
  if (file === 'personas.md') {
    const seg = section('Segmentation')[0];
    each(seg, (row, line) => { if (!ratedOrUnknown(row.Position, 0, 100)) add('BAD_VALUE', line, `Position "${row.Position}" is not 0 to 100 or unknown`); });
    if (seg && !seg.blocks.some((b) => b.type === 'bullet' && b.text.startsWith('**Primary:**'))) add('BAD_VALUE', seg.line, 'no **Primary:** bullet');
  }
  if (file === 'jobs.md') {
    const map = section('The job map')[0];
    const found = [];
    each(map, (row) => found.push(row.Stage));
    if (map && (found.length < 4 || found.length > 8)) add('BAD_VALUE', map.line, `the job map has ${found.length} stages, it needs 4 to 8`);
    each(section('Top underserved outcomes')[0], (row, line) => {
      if (!ratedOrUnknown(row.Importance, 1, 5) || !ratedOrUnknown(row.Satisfaction, 1, 5)) add('BAD_VALUE', line, 'Importance and Satisfaction are 1 to 5 or unknown');
    });
  }
}

function idsFromTable(path, heading) {
  if (!existsSync(path)) return new Set();
  const doc = parseMarkdown(heading ? readFileSync(path, 'utf8') : `## x\n${readFileSync(path, 'utf8').replace(/^# .*$/m, '')}`);
  const section = heading ? doc.sections.find((s) => s.name === heading) : doc.sections[0];
  const block = section && firstTable(section);
  return new Set(block ? block.rows.map((r) => r.cells[0]) : []);
}

// The confidence a single line can support, from the contract's definitions.
function levelOf(tags, sources, orgMap) {
  if (tags.length === 0 || tags.every((t) => t.kind === 'proposed')) return null;
  if (tags.some((t) => t.verdict === 'no evidence')) return 'low';
  if (tags.every((t) => t.kind === 'gap')) return 'medium';
  const isStrong = (s) => ['original', 'first-party'].includes(s.Kind);
  const cited = new Set(tags.flatMap((t) => t.sources));
  const people = new Set(tags.flatMap((t) => t.participants));
  const verified = [...cited].map((id) => sources.get(id)).filter((s) => s?.Status === 'verified');
  const count = (...kinds) => verified.filter((s) => kinds.includes(s.Kind)).length;
  const strong = count('original', 'first-party');
  let level = 'low';
  const orgs = new Set([...people].map((p) => orgMap.get(p) ?? p));
  if (strong >= 1 && (verified.length >= 2 || orgs.size >= 2)) level = 'high';
  else if (strong >= 1 || count('secondary') >= 2 || count('forum') >= 3) level = 'medium';
  if (tags.some((t) => t.kind === 'inference')) level = verified.length === cited.size && verified.every(isStrong) ? 'medium' : 'low';
  else if (level === 'high' && tags.some((t) => t.kind === 'gap')) level = 'medium';
  return level;
}

export function checkFolder(folder) {
  const issues = [];
  const sources = ledger(folder, issues);
  const beliefs = idsFromTable(join(folder, 'beliefs.md'));
  const participants = idsFromTable(join(folder, 'primary.md'), 'Participants');
  const people = participantIndex(join(folder, 'primary.md'));
  const recorded = recordedExcerpts(folder, issues);
  const anchorsIn = anchorReader(folder);
  const profile = readProfile(folder);
  const names = profile.designSystem?.catalogue ? catalogueNames(profile) : null;
  if (profile.designSystem && !names) issues.push({ code: 'BAD_CATALOGUE', file: '.research-profile.md', line: 1, msg: `${profile.designSystem.catalogue ?? 'There is no Catalogue line, and it'} cannot be read as JSON with a components object. Run ${command('init')} again` });
  const beliefVerdicts = new Map();
  const stats = { files: 0, claims: 0, evidenced: 0, inference: 0, belief: 0, contradicted: 0, confirmed: 0, proposed: 0, practice: 0, gap: 0 };

  const plannedBeliefs = new Set();
  const surveyPath = join(folder, 'survey.md');
  if (existsSync(surveyPath)) {
    const plan = parseFile(surveyPath).sections.find((s) => s.name === 'Analysis plan');
    const planTable = plan && firstTable(plan);
    if (planTable) planTable.rows.forEach((row) => (row.text.match(/\bB\d+\b/g) ?? []).forEach((id) => plannedBeliefs.add(id)));
  }

  for (const file of [...OUTPUTS, ...workFiles(folder)]) {
    const path = join(folder, file);
    if (!existsSync(path)) continue;
    stats.files++;
    const add = (code, line, msg) => issues.push({ code, file, line, msg });
    const isWork = isWorkFile(file);
    const text = isWork ? claimPart(readFileSync(path, 'utf8')) : readFileSync(path, 'utf8');
    const doc = parseMarkdown(text);
    const template = templateFor(isWork ? 'work.md' : file);
    const inFile = new Map();
    const citedPeople = new Set();
    const citedSources = new Set();
    const linksRequired = isWork || mustLink(file, doc);

    if (!doc.title) add('MISSING_SECTION', 1, 'no # title');
    for (const entry of template) {
      const found = doc.sections.filter((s) => matcher(entry.heading).test(s.name));
      if (found.length === 0 && !entry.optional) add('MISSING_SECTION', 1, `no "## ${entry.heading}" section`);
      for (const section of found) {
        for (const sub of entry.subs) {
          if (!section.subsections.some((s) => matcher(sub).test(s.name))) add('MISSING_SUBSECTION', section.line, `"${section.name}" has no "### ${sub}"`);
        }
      }
    }

    for (const section of doc.sections) {
      const entry = template.find((e) => matcher(e.heading).test(section.name));
      if (!entry) { add('EXTRA_SECTION', section.line, `"${section.name}" is not in the template, so the book would lose it`); continue; }
      if (entry.mode === 'none') continue;
      if (entry.subs.length && !entry.subs.some(isPattern)) {
        for (const sub of section.subsections) {
          if (!entry.subs.some((s) => matcher(s).test(sub.name))) add('EXTRA_SECTION', sub.line, `"### ${sub.name}" is not in the template`);
        }
      }

      const lines = claims(section);
      const isFuture = /^Future journey:/.test(section.name);
      const mayPropose = new Set();
      if (isWork || RECOMMENDS.includes(section.name)) lines.forEach((c) => mayPropose.add(c.line));
      section.subsections.filter((s) => RECOMMENDS.includes(s.name)).forEach((s) => claims(s).forEach((c) => mayPropose.add(c.line)));
      let weakest = null;
      for (const claim of lines) {
        if (claim.type === 'para') { add('LOOSE_PARAGRAPH', claim.line, 'claims go in bullets, table rows or blockquotes'); continue; }
        if (claim.tags.length === 0) { add('NO_TAG', claim.line, `no evidence tag: ${claim.text.slice(0, 60)}`); continue; }
        if (isFuture && !claim.tags.every((t) => t.kind === 'proposed')) add('NOT_PROPOSED', claim.line, 'a future journey is a proposal, so every line is tagged [proposed]');
        if (!isFuture && claim.tags.some((t) => t.kind === 'proposed') && !mayPropose.has(claim.line)) add('PROPOSED_OUT_OF_PLACE', claim.line, '[proposed] belongs in a future journey or a recommendation, not among findings');
        if (!isWork && claim.tags.some((t) => t.kind === 'practice')) add('PRACTICE_OUT_OF_PLACE', claim.line, '[practice] belongs only in a work file from a third-party skill, never among research findings');
        stats.claims++;
        for (const tag of claim.tags) {
          tag.sources.forEach((id) => { citedSources.add(id); if (!sources.has(id)) add('UNKNOWN_SOURCE', claim.line, `${id} is not in sources.md`); });
          tag.beliefs.forEach((id) => { if (!beliefs.has(id)) add('UNKNOWN_BELIEF', claim.line, `${id} is not in beliefs.md`); });
          tag.participants.forEach((id) => { citedPeople.add(id); if (!participants.has(id)) add('UNKNOWN_PARTICIPANT', claim.line, `${id} is not in primary.md`); });
          if (!tag.valid) add('BAD_TAG', claim.line, `${tag.raw} is not a tag the contract allows`);
          if (tag.link && tag.kind !== 'source') add('BAD_TAG', claim.line, `${tag.raw} carries a link, and only a source or participant citation may`);
          const linked = isWork && tag.link ? { ...tag, link: { ...tag.link, file: fromWork(file)(tag.link.file) } } : tag;
          const problem = linked.link && linkProblem(linked, file, anchorsIn, recorded);
          if (problem) add(problem[0], claim.line, problem[1]);
          if (linksRequired && lacksLink(linked, sources)) add('NO_EVIDENCE_LINK', claim.line, `${tag.raw} needs a link to its passage, one link per person, or to its file if that file cannot hold anchors`);
          if (tag.kind === 'belief') {
            if (!tag.verdict) add('BAD_VERDICT', claim.line, `${tag.raw} has no valid verdict`);
            else tag.beliefs.forEach((id) => { if (!beliefVerdicts.has(id)) beliefVerdicts.set(id, new Set()); beliefVerdicts.get(id).add(tag.verdict); });
            tag.beliefs.forEach((id) => {
              const seen = inFile.get(id) ?? new Set();
              if (tag.verdict) seen.add(tag.verdict);
              inFile.set(id, seen);
            });
            if (needsBar(tag) && tag.threshold) {
              const measured = tag.sources.some((id) => sources.get(id)?.Status === 'verified' && sources.get(id)?.Kind === 'first-party');
              if (!measured || !tag.beliefs.every((id) => plannedBeliefs.has(id))) add('UNDER_BAR', claim.line, `${tag.raw} needs a verified first-party result and this belief named in the Analysis plan of survey.md`);
            } else if (needsBar(tag)) {
              const backers = people.behaviour.get(tag.beliefs[0]) ?? new Set();
              const orgs = new Set(tag.participants.filter((p) => backers.has(p) && people.orgs.has(p)).map((p) => people.orgs.get(p)));
              if (orgs.size < BAR_PEOPLE) add('UNDER_BAR', claim.line, `${tag.raw} needs ${BAR_PEOPLE} people from different organisations whose excerpts name this belief and record what they did, has ${orgs.size}`);
            }
          }
        }
        const verdicts = claim.tags.map((t) => t.verdict);
        if (claim.tags.some((t) => t.kind === 'gap')) stats.gap++;
        else if (verdicts.includes('confirmed')) stats.confirmed++;
        else if (verdicts.includes('contradicted') || verdicts.includes('refuted')) stats.contradicted++;
        else if (verdicts.includes('no evidence')) stats.belief++;
        else if (claim.tags.some((t) => t.kind === 'proposed')) stats.proposed++;
        else if (claim.tags.some((t) => t.kind === 'practice')) stats.practice++;
        else if (claim.tags.some((t) => t.kind === 'inference')) stats.inference++;
        else stats.evidenced++;
        const level = levelOf(claim.tags, sources, people.orgs);
        if (level !== null && (weakest === null || LEVELS[level] < LEVELS[weakest])) weakest = level;
      }
      if (lines.length && lines.every((c) => c.tags.length && c.tags.every((t) => t.kind === 'gap' || t.kind === 'proposed'))) weakest = 'low';

      if (entry.mode === 'full' && lines.length === 0) add('EMPTY_SECTION', section.line, `"${section.name}" has no claims and no [gap]`);
      if (entry.mode === 'full') {
        if (section.confidence === null) add('NO_CONFIDENCE', section.line, `"${section.name}" has no Confidence line`);
        else if (!(section.confidence in LEVELS)) add('BAD_CONFIDENCE', section.confidenceLine, `"${section.confidence}" is not high, medium or low`);
        else if (weakest !== null && LEVELS[section.confidence] > LEVELS[weakest]) {
          add('CONFIDENCE_NOT_EARNED', section.confidenceLine, `"${section.name}" says ${section.confidence}, its weakest claim supports ${weakest}`);
        }
      }
    }

    if (isWork) { workHeader(doc, add); workClaims(doc, add); }
    valueChecks(file, doc, add, people);
    // A file written before the project was connected need not have component lines, but what it names still has to exist.
    if (names) componentIssues(file, doc, names, statSync(path).mtimeMs >= statSync(profile.path).mtimeMs, add);
    looseLinks(text, add, isWork ? fromWork(file) : undefined);

    if (['affinity.md', 'cardsort.md'].includes(file)) {
      for (const id of citedSources) if (sources.get(id)?.Kind !== 'first-party') add('REAL_HAS_DESK', 1, `${id} is desk research, and this file is built only from real data`);
    }
    if (file === 'summary.md' && ![...citedSources].some((id) => sources.get(id)?.Kind === 'first-party')) add('REAL_HAS_DESK', 1, 'a research summary has to cite primary research');

    if (PROTO.includes(file)) {
      const proto = doc.banner?.match(/^Proto: (\d+) of (\d+) beliefs validated(?:, (\d+) refuted)?\./);
      const real = doc.banner?.match(/^From research: (\d+) (?:people|person), (\d+) organisations?\./);
      if (real) {
        const orgs = new Set([...citedPeople].map((p) => people.orgs.get(p) ?? p));
        if (Number(real[1]) !== citedPeople.size || Number(real[2]) !== orgs.size) add('BANNER_COUNT', doc.bannerLine, `banner says ${real[1]} people and ${real[2]} organisations, the file cites ${citedPeople.size} and ${orgs.size}`);
        if (citedPeople.size === 0) add('UNDER_BAR', doc.bannerLine, 'a file built in real mode has to cite the people it came from');
        const allOrgs = new Set(people.orgs.values());
        if (allOrgs.size < BAR_PEOPLE) add('UNDER_BAR', doc.bannerLine, `real mode needs ${BAR_PEOPLE} organisations in primary.md, it holds ${allOrgs.size}`);
        for (const id of citedSources) if (sources.get(id)?.Kind !== 'first-party') add('REAL_HAS_DESK', doc.bannerLine, `${id} is desk research, and a file built in real mode cites only primary research`);
        if (inFile.size) add('REAL_HAS_BELIEF', doc.bannerLine, 'a file built in real mode cites beliefs; it should cite only what people did and said');
      } else if (!proto) add('NO_BANNER', 1, 'no Proto or From research banner after the title');
      else {
        const m = inFile.size;
        const n = [...inFile.values()].filter((v) => v.has('confirmed')).length;
        const r = [...inFile.values()].filter((v) => v.has('refuted')).length;
        if (Number(proto[1]) !== n || Number(proto[2]) !== m || Number(proto[3] ?? 0) !== r) add('BANNER_COUNT', doc.bannerLine, `banner says ${proto[1]} of ${proto[2]} and ${proto[3] ?? 0} refuted, the file has ${n} of ${m} and ${r} refuted`);
      }
    }
  }
  const beliefsPath = join(folder, 'beliefs.md');
  if (existsSync(beliefsPath)) {
    const block = firstTable(parseMarkdown(`## x\n${readFileSync(beliefsPath, 'utf8').replace(/^# .*$/m, '')}`).sections[0]);
    if (block?.header.includes('Outcome')) tableRows(block).forEach((row, i) => {
      if (/^No view:/i.test(row.Belief ?? '')) return;
      const add = (code, msg) => issues.push({ code, file: 'beliefs.md', line: block.rows[i].line - 1, msg });
      const outcome = (row.Outcome ?? '').trim();
      const unsettled = outcome.match(new RegExp(`^not settled: (\\d+) of ${BAR_PEOPLE} organisations$`, 'i'));
      if (unsettled && Number(unsettled[1]) < BAR_PEOPLE) return;
      const tag = parseTag(`${row.ID}: ${outcome}`);
      if (!needsBar(tag)) { add('BAD_VERDICT', `${row.ID} has the outcome "${outcome}". It has to be confirmed, refuted or mixed with its evidence, or not settled: N of ${BAR_PEOPLE} organisations with N below ${BAR_PEOPLE}`); return; }
      if (!tag.valid) { add('BAD_TAG', `${row.ID} has the outcome "${outcome}", and its evidence is not written as a tag would write it`); return; }
      tag.sources.forEach((id) => { if (!sources.has(id)) add('UNKNOWN_SOURCE', `${id} is not in sources.md`); });
      tag.participants.forEach((id) => { if (!participants.has(id)) add('UNKNOWN_PARTICIPANT', `${id} is not in primary.md`); });
      if (!beliefVerdicts.has(row.ID)) beliefVerdicts.set(row.ID, new Set());
      beliefVerdicts.get(row.ID).add(tag.verdict);
      if (tag.threshold) {
        const measured = tag.sources.some((id) => sources.get(id)?.Status === 'verified' && sources.get(id)?.Kind === 'first-party');
        if (!measured || !plannedBeliefs.has(row.ID)) add('UNDER_BAR', `${row.ID} claims a threshold, which needs a verified first-party result and this belief named in the Analysis plan of survey.md`);
        return;
      }
      const backers = people.behaviour.get(row.ID) ?? new Set();
      const orgs = new Set(tag.participants.filter((p) => backers.has(p) && people.orgs.has(p)).map((p) => people.orgs.get(p)));
      if (orgs.size < BAR_PEOPLE) add('UNDER_BAR', `${row.ID} has an outcome that needs ${BAR_PEOPLE} organisations whose excerpts name it and record what they did, has ${orgs.size}`);
    });
  }
  for (const [id, seen] of beliefVerdicts) {
    if (seen.size > 1) issues.push({ code: 'CONFLICTING_VERDICT', file: 'beliefs.md', line: 1, msg: `${id} carries more than one verdict: ${[...seen].join(', ')}` });
  }
  // Every audit is read, including one whose work file has gone.
  for (const file of auditFiles(folder)) issues.push(...readAudit(folder, file).problems);
  nameLeaks(folder, issues);
  return { issues, stats };
}

async function selfTest() {
  const { CLEAN, EVIDENCE, MUTATIONS } = await import('./fixtures/fixture.mjs');
  let failures = 0;
  const run = (files, opts = {}) => {
    const dir = mkdtempSync(join(tmpdir(), 'research-check-'));
    for (const [name, text] of Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1))) {
      mkdirSync(dirname(join(dir, name)), { recursive: true });
      writeFileSync(join(dir, name), text);
    }
    if (opts.profileNewer) { const later = new Date(Date.now() + 60000); utimesSync(join(dir, '.research-profile.md'), later, later); }
    const result = checkFolder(dir);
    rmSync(dir, { recursive: true, force: true });
    return result;
  };
  const clean = run({ ...EVIDENCE, ...CLEAN });
  if (clean.issues.length) {
    failures++;
    console.log('FAIL clean fixture should pass:');
    clean.issues.forEach((i) => console.log(`  ${i.file}:${i.line} ${i.code} ${i.msg}`));
  } else console.log(`ok   clean fixture passes (${clean.stats.claims} claims)`);

  for (const m of MUTATIONS) {
    const files = { ...EVIDENCE, ...CLEAN, ...(m.add ?? {}) };
    for (const name of m.drop ?? []) delete files[name];
    if (!files[m.file].includes(m.find)) { failures++; console.log(`FAIL ${m.expect}: fixture no longer contains "${m.find}"`); continue; }
    files[m.file] = files[m.file].replace(m.find, m.replace);
    for (const [find, replace] of Array.isArray(m.also) ? m.also : []) files[m.file] = files[m.file].replace(find, replace);
    for (const [file, find, replace] of m.more ?? []) files[file] = files[file].replace(find, replace);
    const { issues } = run(files, m);
    if (m.expect === 'CLEAN') {
      if (issues.length) { failures++; console.log(`FAIL ${m.name} should pass: ${issues.map((i) => i.code).join(', ')}`); } else console.log(`ok   ${m.name} passes`);
      continue;
    }
    if (issues.some((i) => i.code === m.expect)) console.log(`ok   ${m.expect}`);
    else { failures++; console.log(`FAIL ${m.expect}: got ${issues.map((i) => i.code).join(', ') || 'no issues'}`); }
  }
  console.log(failures ? `\n${failures} self-test failure(s)` : '\nself-test passed');
  process.exit(failures ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2];
  if (arg === '--self-test') await selfTest();
  else if (arg === '--claims-hash') {
    const file = process.argv[3];
    if (!file || !existsSync(file)) { console.error('usage: node check.mjs --claims-hash <work file>'); process.exit(2); }
    console.log(claimsHash(readFileSync(file, 'utf8')));
  }
  else if (!arg || !existsSync(arg)) { console.error('usage: node check.mjs <folder> | --claims-hash <work file> | --self-test'); process.exit(2); }
  else {
    const { issues, stats } = checkFolder(arg);
    issues.forEach((i) => console.log(`${i.file}:${i.line} ${i.code} ${i.msg}`));
    if (issues.length) { console.log(`\n${issues.length} issue(s)`); process.exit(1); }
    console.log(`OK: ${stats.files} files, ${stats.claims} claims. Evidenced ${stats.evidenced}, confirmed ${stats.confirmed}, inference ${stats.inference}, belief with no evidence ${stats.belief}, contradicted ${stats.contradicted}, proposed ${stats.proposed}, practice ${stats.practice}, gap ${stats.gap}.`);
  }
}
