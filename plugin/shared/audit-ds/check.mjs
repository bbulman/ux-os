#!/usr/bin/env node
// The gate for a design system audit written by /ux-os:audit-ds.
// It proves the report is well formed and that every place a finding names exists. It cannot prove a finding is right, or that none is missing.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PASSES = ['Inventory', 'Naming', 'Finish', 'Use', 'Access', 'Themes'];
export const SEVERITIES = ['1 Stops someone', '2 Misleads a builder', '3 Costs time', '4 Untidy'];
const HEADER = ['Project', 'Audited', 'Commit', 'Scope', 'Held to', 'Second reader'];
const SECTIONS = ['Verdict', 'Counts', 'Rules', 'What was read', 'Checks run', 'Findings', 'No rule on file', 'Fix order'];

const cells = (line) => line.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((cell) => cell.trim());
const isRule = (line) => /^\|[\s:|-]+\|$/.test(line.trim());
// A cell as its writer meant it: the template shows values in backticks, and some writers keep them.
const plain = (cell) => (cell ?? '').replace(/`/g, '').trim();
const TABLED = ['Counts', 'Rules', 'What was read', 'Checks run', 'Findings'];

// A section's table as rows of cells, without the heading row and the rule under it.
function table(lines) {
  const rows = lines.filter((line) => line.trim().startsWith('|'));
  return rows.length < 2 || !isRule(rows[1]) ? null : { head: cells(rows[0]), rows: rows.slice(2).map(cells) };
}

// Every section in the order written, so one that appears twice shows up as out of order. A heading inside a code fence is not one.
function sections(text) {
  const found = new Map();
  const names = [];
  let name = null;
  let fenced = false;
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const heading = !fenced && line.match(/^## (.+?)\s*$/);
    if (heading) {
      names.push((name = heading[1]));
      if (!found.has(name)) found.set(name, []);
    } else if (name) found.get(name).push(line);
  }
  return { found, names };
}

const today = () => new Date().toISOString().slice(0, 10);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;

// True when the file really sits in the project, so a link cannot lead a finding to a file outside it.
function inside(file, root) {
  try {
    const base = realpathSync(root);
    return realpathSync(file).startsWith(base + sep);
  } catch {
    return false;
  }
}
const isFileIn = (path, root) => Boolean(path) && !isAbsolute(path) && !normalize(path).split(sep).includes('..') && existsSync(join(root, path)) && statSync(join(root, path)).isFile() && inside(join(root, path), root);

// The place a finding names, checked against the project: a path inside it, and a line the file has.
function wherePlace(where, root) {
  const m = where.replace(/`/g, '').match(/^(.+?):(\d+)(?:-(\d+))?$/);
  if (!m) return { problem: 'is not written path:line' };
  const [, path, from, to] = m;
  if (isAbsolute(path) || normalize(path).split(sep).includes('..')) return { problem: `points outside the project (${path})` };
  const file = join(root, path);
  if (!existsSync(file) || !statSync(file).isFile()) return { problem: `names a file that is not there (${path})` };
  if (!inside(file, root)) return { problem: `points outside the project (${path})` };
  let all;
  try {
    all = readFileSync(file, 'utf8').split(/\r?\n/);
  } catch {
    return { problem: `names a file that cannot be read (${path})` };
  }
  const last = Number(to ?? from);
  if (Number(from) < 1 || last < Number(from) || last > all.length) return { problem: `names line ${to ? `${from}-${to}` : from}, and ${path} has ${all.length} lines` };
  if (last - Number(from) > 4) return { problem: `covers ${last - Number(from) + 1} lines, and a finding names one place of 5 lines at most` };
  return { lines: all.slice(Number(from) - 1, last) };
}

const squash = (text) => text.replace(/\s+/g, ' ').trim();

// A rule is the project's own file and section, two of its files disagreeing, or a WCAG success criterion.
const WCAG = /^WCAG(?: 2\.\d)?(?: SC)? [1-4]\.\d\.\d{1,2}\b/i;
const isWritten = (rule) => !/^files disagree\b/i.test(plain(rule)) && !WCAG.test(plain(rule));

// The file a written rule names: what comes before the section mark, or the longest run of leading words that is a file, so a path may hold a space.
function ruleFile(text, root) {
  const cut = text.search(/[§#]/);
  const tries = cut > 0 ? [text.slice(0, cut).trim()] : [];
  const words = text.split(/\s+/);
  for (let n = words.length; n > 0; n--) tries.push(words.slice(0, n).join(' '));
  return tries.find((path) => isFileIn(path, root)) ?? null;
}

function ruleProblem(rule, root, writtenOnly = false) {
  const text = plain(rule);
  if (!text) return 'Rule is empty: name the file and section, "files disagree", or the WCAG criterion';
  if (/^no rule/i.test(text)) return 'Rule says there is none, so this belongs under No rule on file, not in Findings';
  if (/^WCAG\b/i.test(text) && !WCAG.test(text)) return `Rule is ${text}, and a criterion is written like WCAG 1.4.3`;
  if (!isWritten(text)) return writtenOnly ? `${text} is not one of the project's written rules` : null;
  const file = ruleFile(text, root);
  if (!file) return `Rule names no file in the project (${text})`;
  const part = text.slice(file.length).trim();
  if (!part) return `Rule names ${file} and no section of it`;
  const numbered = part.match(/^§\s*(\d+(?:\.\d+)*)/);
  if (numbered && !new RegExp(`^#{1,6}\\s+§?\\s*${numbered[1].replace(/\./g, '\\.')}(?![\\d])`, 'm').test(readFileSync(join(root, file), 'utf8'))) return `Rule cites §${numbered[1]}, and ${file} has no heading numbered ${numbered[1]}`;
  return null;
}

export function checkReport(reportPath, root) {
  const problems = [];
  const fail = (text) => problems.push(text);
  const text = readFileSync(reportPath, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (/^\s*<!--/m.test(text)) fail('a template comment is still in the file');
  if (!/^# Design system audit: \S/m.test(text) || /^# .*<.*>/m.test(text)) fail('the title does not name the project');

  for (const key of HEADER) {
    const line = text.match(new RegExp(`^- \\*\\*${key}:\\*\\*[ \\t]*(.*)$`, 'm'));
    if (!line) fail(`the header has no ${key} line`);
    else if (!line[1].trim() || /^<.*>$/.test(line[1].trim())) fail(`the header's ${key} line is not filled in`);
    else if (key === 'Audited' && (!isDate(line[1].trim()) || line[1].trim() > today())) fail(`Audited is not a date up to today, as YYYY-MM-DD (${line[1].trim()})`);
  }

  const { found, names } = sections(text);
  if (names.join('|') !== SECTIONS.join('|')) fail(`the sections are not ${SECTIONS.join(', ')}, once each and in that order (found ${names.join(', ') || 'none'})`);
  const section = (name) => found.get(name) ?? [];
  // A row with no leading pipe still renders as a row, and the gate would never read it.
  for (const name of TABLED) for (const line of section(name)) if (line.trim() && !line.trim().startsWith('|')) fail(`${name} holds a line outside its table: "${line.trim().slice(0, 60)}"`);
  const bullets = (name) => section(name).filter((line) => /^\s*(?:[-*]|\d+\.)\s+\S/.test(line));

  if (!bullets('Verdict').length) fail('Verdict has no bullet');
  if (bullets('Verdict').length > 3) fail('Verdict has more than three bullets');
  if (!bullets('No rule on file').length) fail('No rule on file has no bullet: write "- None." when there is nothing');

  const read = table(section('What was read'));
  if (!read) fail('What was read has no table');
  else {
    if (read.rows.map((row) => row[0]).join('|') !== PASSES.join('|')) fail(`What was read does not have one row for each of ${PASSES.join(', ')}, in that order`);
    for (const row of read.rows) if (row.length < 4 || row.slice(0, 4).some((cell) => !cell)) fail(`What was read: the ${row[0] || 'unnamed'} row has an empty cell`);
  }

  const checks = new Set();
  const ran = table(section('Checks run'));
  if (!ran) fail('Checks run has no table');
  else if (!(ran.rows.length === 1 && ran.rows[0].every((cell) => cell.toLowerCase() === 'none'))) {
    if (!ran.rows.length) fail('Checks run is empty: write | none | none | none | when no command was run');
    ran.rows.forEach((cellsOf, i) => {
      const row = [plain(cellsOf[0]), cellsOf[1], cellsOf[2]];
      if (row[0] !== `C${i + 1}`) fail(`Checks run: row ${i + 1} is numbered ${row[0] || 'nothing'}, not C${i + 1}`);
      if (!row[1] || !row[2]) fail(`Checks run: ${row[0] || `row ${i + 1}`} has no command or no result`);
      checks.add(row[0]);
    });
  }

  const tally = SEVERITIES.map(() => ({ seen: 0, suspected: 0 }));
  const worst = [];
  const ids = new Set();
  const written = [];
  const findings = table(section('Findings'));
  if (!findings) fail('Findings has no table');
  else {
    let last = 0;
    findings.rows.forEach((row, i) => {
      const [, , , finding, rule, where, says] = row;
      const [id, severity, pass, basis] = [row[0], row[1], row[2], row[7]].map(plain);
      const at = id || `row ${i + 1}`;
      if (id !== `F${i + 1}`) fail(`Findings: row ${i + 1} is numbered ${id || 'nothing'}, not F${i + 1}`);
      ids.add(id);
      const level = Number(severity);
      if (!/^[1-4]$/.test(severity ?? '')) fail(`${at}: severity is ${severity || 'empty'}, not 1 to 4`);
      else {
        if (level < last) fail(`${at}: severity ${level} comes after a severity ${last}, and findings run worst first`);
        last = level;
      }
      if (!PASSES.includes(pass)) fail(`${at}: pass is ${pass || 'empty'}, not one of ${PASSES.join(', ')}`);
      if (!finding) fail(`${at}: the finding is empty`);
      const badRule = ruleProblem(rule ?? '', root);
      if (badRule) fail(`${at}: ${badRule}`);
      else if (isWritten(rule)) written.push([id, plain(rule)]);
      const counted = basis.match(/^counted (C\d+)$/);
      if (basis === 'suspected') {
        if (!where) fail(`${at}: Where is empty: a suspected finding still says where to look`);
        if (level === 1) fail(`${at}: a suspected finding cannot be severity 1: open it, or lower it`);
      } else if (basis === 'seen' || counted) {
        if (counted && !checks.has(counted[1])) fail(`${at}: ${counted[1]} is not a row in Checks run`);
        const { problem, lines } = wherePlace(where ?? '', root);
        const quoted = squash((says ?? '').replace(/^`+|`+$/g, '').replace(/\\\|/g, '|'));
        if (problem) fail(`${at}: Where ${problem}`);
        else if (!quoted || quoted === '-') fail(`${at}: Line says is empty: copy a few words from ${where}`);
        else if (quoted.replace(/\s/g, '').length < 4) fail(`${at}: Line says quotes too little to find ("${quoted}"): copy at least four characters`);
        else if (!lines.some((line) => squash(line).includes(quoted))) fail(`${at}: ${where} does not say "${quoted}"`);
      } else fail(`${at}: Basis is ${basis || 'empty'}, not seen, counted C<n> or suspected`);
      if (level >= 1 && level <= 4) {
        tally[level - 1][basis === 'suspected' ? 'suspected' : 'seen']++;
        if (level === 1) worst.push(id);
      }
    });
  }

  // Every written rule the audit held the system to, and how it came out.
  const broken = new Map();
  const rules = table(section('Rules'));
  if (!rules) fail('Rules has no table');
  else if (!(rules.rows.length === 1 && rules.rows[0].every((cell) => cell.toLowerCase() === 'none'))) {
    if (!rules.rows.length) fail('Rules is empty: write | none | none | none | when the project has no written rules');
    rules.rows.forEach((row, i) => {
      const [rule, says] = row;
      const outcome = plain(row[2]);
      const at = `Rules: row ${i + 1}`;
      const badRule = ruleProblem(rule ?? '', root, true);
      if (badRule) fail(`${at}: ${badRule}`);
      if (!says) fail(`${at}: Says is empty`);
      const cited = outcome.match(/^broken: (F\d+(?:, F\d+)*)$/);
      if (cited) for (const id of cited[1].split(', ')) {
        if (!ids.has(id)) fail(`${at}: ${id} is not a finding`);
        broken.set(id, [...(broken.get(id) ?? []), plain(rule)]);
      } else if (outcome !== 'held' && !/^not checked: \S/.test(outcome)) fail(`${at}: Outcome is ${outcome || 'empty'}, not held, broken: F<n> or not checked: <why>`);
    });
  }
  // A finding is marked broken by the row for its own rule. That row may say which part of the section it is, as in DESIGN.md §5 (contrast).
  for (const [id, rule] of written) {
    const rows = broken.get(id) ?? [];
    if (!rows.length) fail(`${id} cites ${rule}, and no row in Rules marks it broken`);
    else if (!rows.some((row) => row === rule || row.startsWith(`${rule} `) || rule.startsWith(`${row} `))) fail(`${id} cites ${rule}, and the row in Rules that marks it broken is for ${rows.join(' and ')}`);
  }

  const counts = table(section('Counts'));
  if (!counts) fail('Counts has no table');
  else {
    if (counts.rows.map((row) => row[0]).join('|') !== SEVERITIES.join('|')) fail(`Counts does not have one row for each of ${SEVERITIES.join(', ')}, in that order`);
    else counts.rows.map((row) => row.map(plain)).forEach((row, i) => {
      if (!/^\d+$/.test(row[1] ?? '') || !/^\d+$/.test(row[2] ?? '') || Number(row[1]) !== tally[i].seen || Number(row[2]) !== tally[i].suspected) fail(`Counts: ${row[0]} says ${row[1] || 'nothing'} seen and ${row[2] || 'nothing'} suspected, and Findings holds ${tally[i].seen} and ${tally[i].suspected}`);
    });
  }

  const order = bullets('Fix order').join('\n');
  const cited = new Set(order.match(/\bF\d+\b/g) ?? []);
  for (const id of cited) if (!ids.has(id)) fail(`Fix order names ${id}, which is not a finding`);
  for (const id of worst) if (!cited.has(id)) fail(`Fix order leaves out ${id}, a severity 1 finding`);
  if (ids.size && !bullets('Fix order').length) fail('Fix order is empty');

  const total = tally.reduce((sum, t) => sum + t.seen + t.suspected, 0);
  const suspected = tally.reduce((sum, t) => sum + t.suspected, 0);
  const summary = `${total} finding${total === 1 ? '' : 's'}: ${tally.map((t, i) => `${t.seen + t.suspected} severity ${i + 1}`).join(', ')}. ${total - suspected} seen, ${suspected} suspected.`;
  const reader = text.match(/^- \*\*Second reader:\*\*[ \t]*(.*)$/m)?.[1].trim() ?? '';
  const notes = /^not yet/i.test(reader) ? ['the second reader has not run yet'] : [];
  return { problems, summary, notes };
}

function selfTest() {
  const dir = mkdtempSync(join(tmpdir(), 'audit-ds-'));
  const self = fileURLToPath(import.meta.url);
  let failures = 0;
  const root = join(dir, 'project');
  mkdirSync(join(root, 'components'), { recursive: true });
  mkdirSync(join(root, 'ux-os', 'audits'), { recursive: true });
  writeFileSync(join(root, 'tokens.css'), ':root {\n  --ink: #111;\n  --paper: #fff;\n}\n');
  writeFileSync(join(root, 'components', 'button.css'), '.btn {\n  color: #111;\n}\n.btn:focus {\n  outline: none;\n}\n');
  writeFileSync(join(root, 'DESIGN.md'), '# Design\n\n## 1. Colour\n\nNo colour literal outside tokens.css.\n\n## 2. Type\n\nOne family.\n');

  const good = `# Design system audit: project

- **Project:** project
- **Audited:** ${today()}
- **Commit:** not a git repo
- **Scope:** the whole system
- **Held to:** DESIGN.md
- **Second reader:** checked every Where

## Verdict
- Small and mostly sound. Fix the focus ring first. Two findings seen, one suspected.

## Counts
| Severity | Seen | Suspected |
|---|---|---|
| 1 Stops someone | 1 | 0 |
| 2 Misleads a builder | 0 | 0 |
| 3 Costs time | 1 | 1 |
| 4 Untidy | 0 | 0 |

## Rules
| Rule | Says | Outcome |
|---|---|---|
| DESIGN.md §1 | No colour literal outside tokens.css | broken: F2, F3 |

## What was read
| Pass | Read | Sampled | Not read |
|---|---|---|---|
| Inventory | 2 files | nothing | nothing |
| Naming | 2 tokens | nothing | nothing |
| Finish | 1 component | nothing | nothing |
| Use | 1 stylesheet | nothing | nothing |
| Access | 1 component | nothing | nothing |
| Themes | skipped | nothing | one theme, and no rule asks for more |

## Checks run
| # | Command | Result |
|---|---|---|
| C1 | npm run lint:tokens | 1 colour literal, exit 1 |

## Findings
| # | Severity | Pass | Finding | Rule | Where | Line says | Basis |
|---|---|---|---|---|---|---|---|
| F1 | 1 | Access | The button removes its focus outline and puts nothing in its place. | WCAG 2.4.7 | components/button.css:5 | \`outline: none;\` | seen |
| F2 | 3 | Use | A colour literal where --ink holds the same value. | DESIGN.md §1 | components/button.css:2 | \`color: #111;\` | counted C1 |
| F3 | 3 | Use | Pages outside components/ may carry literals too. | DESIGN.md §1 | pages/ | - | suspected |

## No rule on file
- Does the system need a second theme?

## Fix order
1. F1: give .btn:focus-visible a 2px outline in --ink.
2. F2, F3: replace literals with tokens, then run the lint over pages.
`;
  const report = (name, text) => {
    const path = join(root, 'ux-os', 'audits', `${name}.md`);
    writeFileSync(path, text);
    return path;
  };
  const test = (name, fn) => {
    try { fn(); console.log(`ok   ${name}`); } catch (error) { failures++; console.log(`FAIL ${name}\n     ${error.message}`); }
  };
  const assert = (ok, detail) => { if (!ok) throw new Error(String(detail)); };
  const fails = (name, change, expected) => test(name, () => {
    const text = change(good);
    assert(text !== good, 'the change did not apply');
    const { problems } = checkReport(report('bad', text), root);
    assert(problems.some((p) => p.includes(expected)), `expected "${expected}" in: ${problems.join(' / ') || 'no problems'}`);
  });

  test('a filled report passes', () => {
    const { problems, summary } = checkReport(report('good', good), root);
    assert(!problems.length, problems.join(' / '));
    assert(summary === '3 findings: 1 severity 1, 0 severity 2, 2 severity 3, 0 severity 4. 2 seen, 1 suspected.', summary);
  });
  test('the command line exits 0 on a good report and 1 on a bad one', () => {
    const ok = spawnSync(process.execPath, [self, report('good', good), root], { encoding: 'utf8' });
    assert(ok.status === 0, `status ${ok.status}: ${ok.stdout}`);
    const bad = spawnSync(process.execPath, [self, report('bad', good.replace('button.css:5', 'button.css:50')), root], { encoding: 'utf8' });
    assert(bad.status === 1 && bad.stdout.includes('PROBLEM'), `status ${bad.status}: ${bad.stdout}`);
  });
  test('the template itself fails, so an unfilled report cannot pass', () => {
    const { problems } = checkReport(join(dirname(self), 'report.md'), root);
    assert(problems.some((p) => p.includes('template comment')) && problems.some((p) => p.includes('not filled in')), problems.join(' / '));
  });
  test('every heading and pass the gate expects is in the template', () => {
    const text = readFileSync(join(dirname(self), 'report.md'), 'utf8');
    for (const name of [...SECTIONS.map((s) => `## ${s}`), ...PASSES.map((p) => `| ${p} |`), ...SEVERITIES.map((s) => `| ${s} |`), ...HEADER.map((h) => `**${h}:**`)]) assert(text.includes(name), `${name} is missing from report.md`);
  });
  fails('a line the file does not have', (t) => t.replace('button.css:5', 'button.css:50'), 'names line 50');
  fails('a file that is not there', (t) => t.replace('components/button.css:2', 'components/card.css:2'), 'not there');
  fails('a place outside the project', (t) => t.replace('components/button.css:2', '../other/button.css:2'), 'outside the project');
  fails('a seen finding with no line', (t) => t.replace('components/button.css:5 | `outline: none;` | seen', 'components/button.css | `outline: none;` | seen'), 'not written path:line');
  fails('a line that does not say what the report quotes', (t) => t.replace('`outline: none;`', '`outline: 0;`'), 'does not say "outline: 0;"');
  fails('a line one off from the words quoted', (t) => t.replace('components/button.css:5 | `outline: none;`', 'components/button.css:4 | `outline: none;`'), 'does not say');
  fails('a seen finding that quotes nothing', (t) => t.replace('| `color: #111;` | counted C1', '| - | counted C1'), 'Line says is empty');
  fails('a finding filed against no rule', (t) => t.replace('| WCAG 2.4.7 |', '| no rule on file |'), 'belongs under No rule on file');
  fails('a rule in a file the project does not have', (t) => t.replace('| DESIGN.md §1 | components/button.css:2', '| STYLE.md §1 | components/button.css:2'), 'Rule names no file in the project (STYLE.md §1)');
  fails('a rule with no section', (t) => t.replaceAll('DESIGN.md §1', 'DESIGN.md'), 'Rule names DESIGN.md and no section of it');
  fails('a section number the rules file does not have', (t) => t.replaceAll('DESIGN.md §1', 'DESIGN.md §9'), 'has no heading numbered 9');
  fails('a WCAG criterion that does not exist in that form', (t) => t.replace('| WCAG 2.4.7 |', '| WCAG 9.9.99 |'), 'a criterion is written like WCAG 1.4.3');
  fails('a finding marked broken by another rule\'s row', (t) => t.replace('| DESIGN.md §1 | components/button.css:2', '| DESIGN.md §2 | components/button.css:2'), 'F2 cites DESIGN.md §2, and the row in Rules that marks it broken is for DESIGN.md §1');
  fails('a row with no leading pipe', (t) => t.replace('| F3 | 3 | Use | Pages outside', 'F3 | 3 | Use | Pages outside'), 'Findings holds a line outside its table');
  fails('a section written twice', (t) => t.replace('## No rule on file', '## Findings\n| # | Severity | Pass | Finding | Rule | Where | Line says | Basis |\n|---|---|---|---|---|---|---|---|\n\n## No rule on file'), 'once each and in that order');
  fails('a quote too short to find', (t) => t.replace('`outline: none;`', '`e;`'), 'quotes too little to find');
  fails('a place that covers the whole file', (t) => t.replace('components/button.css:5 |', 'components/button.css:1-6 |'), 'one place of 5 lines at most');
  fails('a date that is not on the calendar', (t) => t.replace(`**Audited:** ${today()}`, '**Audited:** 2026-02-31'), 'not a date up to today');
  fails('a count that is not a whole number', (t) => t.replace('| 1 Stops someone | 1 | 0 |', '| 1 Stops someone | 1.0 | 0x0 |'), 'Counts: 1 Stops someone says 1.0');
  fails('a link that leads out of the project', (t) => {
    writeFileSync(join(dir, 'outside.css'), '.x {\n  outline: none;\n}\n');
    if (!existsSync(join(root, 'components', 'link.css'))) symlinkSync(join(dir, 'outside.css'), join(root, 'components', 'link.css'));
    return t.replace('components/button.css:5 |', 'components/link.css:2 |');
  }, 'outside the project');
  test('backticks, a spaced path, a long WCAG form and a quoted HTML comment all pass', () => {
    mkdirSync(join(root, 'my docs'), { recursive: true });
    writeFileSync(join(root, 'my docs', 'rules.md'), '# Rules\n\n## Colour\n\nNo literals.\n');
    writeFileSync(join(root, 'components', 'card.html'), '<div class="card">\n  <!-- meta line --> <p>a || b</p>\n</div>\n');
    const text = good
      .replaceAll('DESIGN.md §1', '`my docs/rules.md` Colour')
      .replace('| WCAG 2.4.7 |', '| WCAG 2.2 SC 2.4.7 |')
      .replace('| seen |', '| `seen` |')
      .replace('components/button.css:2 | `color: #111;` | counted C1', 'components/card.html:2 | `<!-- meta line --> <p>a \\|\\| b</p>` | `counted C1`');
    const { problems } = checkReport(report('loose', `\uFEFF${text.replace(/\n/g, '\r\n')}`), root);
    assert(!problems.length, problems.join(' / '));
  });
  test('a report path that is a folder is a usage error, not a crash', () => {
    const run = spawnSync(process.execPath, [self, root, root], { encoding: 'utf8' });
    assert(run.status === 2 && run.stderr.includes('usage'), `status ${run.status}: ${run.stderr}`);
  });
  fails('a header with no second reader line', (t) => t.replace('- **Second reader:** checked every Where\n', ''), 'no Second reader line');
  fails('a finding its rule is never marked broken by', (t) => t.replace('broken: F2, F3', 'broken: F2'), 'F3 cites DESIGN.md §1, and no row in Rules marks it broken');
  fails('a rule outcome outside the three', (t) => t.replace('| broken: F2, F3 |', '| fails |'), 'Outcome is fails');
  fails('a rule marked broken by a finding that does not exist', (t) => t.replace('broken: F2, F3', 'broken: F2, F3, F8'), 'F8 is not a finding');
  fails('a WCAG criterion listed as a written rule', (t) => t.replace('| DESIGN.md §1 | No colour literal outside tokens.css |', '| WCAG 1.4.3 | Contrast |'), "not one of the project's written rules");
  test('a range of lines passes when one of them holds the words', () => {
    const { problems } = checkReport(report('range', good.replace('components/button.css:5 | `outline: none;`', 'components/button.css:4-5 | `outline: none;`')), root);
    assert(!problems.length, problems.join(' / '));
  });
  test('a second reader still to run is a note, not a failure', () => {
    const { problems, notes } = checkReport(report('unread', good.replace('checked every Where', 'not yet')), root);
    assert(!problems.length && notes.length === 1, `${problems.join(' / ')} ${notes.join(' / ')}`);
  });
  fails('a suspected severity 1', (t) => t.replace('components/button.css:5 | `outline: none;` | seen', 'components/button.css | - | suspected'), 'cannot be severity 1');
  fails('a count that disagrees with the findings', (t) => t.replace('| 3 Costs time | 1 | 1 |', '| 3 Costs time | 2 | 0 |'), 'Findings holds 1 and 1');
  fails('a check that was never run', (t) => t.replace('counted C1', 'counted C4'), 'C4 is not a row');
  fails('a severity 1 left out of the fix order', (t) => t.replace('1. F1: give', '1. Give'), 'leaves out F1');
  fails('a fix for a finding that does not exist', (t) => t.replace('2. F2, F3:', '2. F2, F9:'), 'F9, which is not a finding');
  fails('findings out of order', (t) => t.replace('| F2 | 3 | Use | A colour', '| F2 | 4 | Use | A colour').replace('| 3 Costs time | 1 | 1 |', '| 3 Costs time | 0 | 1 |').replace('| 4 Untidy | 0 | 0 |', '| 4 Untidy | 1 | 0 |'), 'worst first');
  fails('a pass with no row', (t) => t.replace('| Themes | skipped | nothing | one theme, and no rule asks for more |\n', ''), 'one row for each');
  fails('a pass nobody named', (t) => t.replace('| F2 | 3 | Use |', '| F2 | 3 | Tokens |'), 'pass is Tokens');
  fails('a basis outside the three', (t) => t.replace('| pages/ | - | suspected |', '| pages/ | - | likely |'), 'Basis is likely');
  fails('a finding with no rule', (t) => t.replace('| WCAG 2.4.7 |', '| |'), 'Rule is empty');
  fails('a date in the future', (t) => t.replace(`**Audited:** ${today()}`, '**Audited:** 2999-01-01'), 'not a date up to today');
  fails('a missing section', (t) => t.replace('## No rule on file\n- Does the system need a second theme?\n\n', ''), 'the sections are not');
  fails('a comment left in', (t) => t.replace('## Verdict\n', '## Verdict\n<!-- three bullets -->\n'), 'template comment');
  test('a report with no findings passes with an empty table and nothing to fix', () => {
    const none = good
      .replace(/\| F\d.*\n/g, '')
      .replace('| broken: F2, F3 |', '| held |')
      .replace('| 1 Stops someone | 1 | 0 |', '| 1 Stops someone | 0 | 0 |')
      .replace('| 3 Costs time | 1 | 1 |', '| 3 Costs time | 0 | 0 |')
      .replace(/## Fix order\n[\s\S]*$/, '## Fix order\n');
    const { problems } = checkReport(report('none', none), root);
    assert(!problems.length, problems.join(' / '));
  });

  rmSync(dir, { recursive: true, force: true });
  console.log(failures ? `\n${failures} self-test failure(s)` : '\nself-test passed');
  process.exit(failures ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [report, project] = process.argv.slice(2);
  if (report === '--self-test') selfTest();
  else if (report && project && existsSync(report) && statSync(report).isFile() && existsSync(project) && statSync(project).isDirectory()) {
    const { problems, summary, notes } = checkReport(resolve(report), resolve(project));
    console.log(summary);
    notes.forEach((n) => console.log(`NOTE ${n}`));
    problems.forEach((p) => console.log(`PROBLEM ${p}`));
    process.exit(problems.length ? 1 : 0);
  } else {
    console.error('usage: node check.mjs <report.md> <project folder> | --self-test');
    process.exit(2);
  }
}
