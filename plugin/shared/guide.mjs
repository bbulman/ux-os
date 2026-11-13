#!/usr/bin/env node
// Writes a guide to the research files into <home>/templates/: what each file is for, a blank copy of every template, and a link to a filled example.
// Everything it writes is rebuilt from the map and the templates on each run, so it is never edited by hand.
// Usage: node guide.mjs <home folder, such as ux-os> [example project]   |   node guide.mjs --self-test

import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOME, RESEARCH } from './layout.mjs';
import { GROUPS } from './map.mjs';
import { command } from './names.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(HERE, 'templates');
export const GUIDE = 'templates';
const MARK = '<!-- Written by guide.mjs. Do not edit it: the next run overwrites it. -->';

// Work files and their audits are not in the map's fixed rows, so they are described here.
const EXTRA = [
  { path: 'work.md', holds: 'Design work a third-party skill made from the research, with a table of every claim it rests on', by: 'run', args: '<job>' },
  { path: 'audit.md', holds: 'An independent reading of one work file: is the claims table complete, and does each citation hold', by: 'The claims auditor, at the end of a run' },
];

const madeBy = (row) => (/^[a-z-]+$/.test(row.by) ? `\`${command(row.by)}${row.args ? ` ${row.args}` : ''} <idea>\`` : row.by);
const cell = (text) => String(text).replace(/\|/g, '\\|');

// Says why the guide cannot be written here, or null when it can. It only ever writes into a templates/ folder it made itself, inside a folder named ux-os.
export function refusal(home, example = null) {
  const out = join(home, GUIDE);
  const readme = join(out, 'README.md');
  if (basename(resolve(home)) !== HOME) return `${home} is not a folder named ${HOME}, which is the only place the guide goes`;
  if (example !== null && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(example) || !existsSync(join(home, example, RESEARCH)))) return `${example} is not a project in ${home} with a ${RESEARCH}/ folder`;
  if (!existsSync(out)) return null;
  if (lstatSync(out).isSymbolicLink()) return `${out} is a link to a folder elsewhere, so it was left alone`;
  const mine = existsSync(readme) && readFileSync(readme, 'utf8').includes(MARK);
  if (!mine && readdirSync(out).length) return `${out} holds files this script did not write, so nothing was changed`;
  return null;
}

// Returns the path it wrote, or null when refusal() gives a reason.
export function write(home, example = null) {
  if (refusal(home, example)) return null;
  const out = join(home, GUIDE);
  const readme = join(out, 'README.md');
  rmSync(join(out, 'blank'), { recursive: true, force: true });
  mkdirSync(join(out, 'blank'), { recursive: true });
  for (const name of readdirSync(TEMPLATES)) copyFileSync(join(TEMPLATES, name), join(out, 'blank', name));

  const exampleDir = example && join(home, example, RESEARCH);
  const line = (row) => {
    const name = row.path.replace(/^.*\//, '');
    const blank = name && existsSync(join(TEMPLATES, name)) ? `[blank](blank/${name})` : 'none';
    const filled = exampleDir && !row.home && existsSync(join(exampleDir, row.path)) ? `[${example}](../${example}/${RESEARCH}/${row.path})` : 'none yet';
    return `| \`${row.path}\` | ${cell(row.holds)} | ${cell(madeBy(row))} | ${blank} | ${filled} |`;
  };
  const lines = [
    '# The research files',
    '',
    MARK,
    '',
    'Every file a UX-OS project can hold, in the order the work happens: what it is for, the command that makes it, a blank copy of its template, and a filled example.',
    '',
    `Each project is a folder here: \`<idea>/${RESEARCH}/\` holds the files below, flat, and design work goes in a folder per discipline beside it. \`<idea>/README.md\` is that project's own map.`,
    '',
    'In every file, each line is tagged for what it rests on. A belief and a finding never look the same on the page.',
  ];
  GROUPS.forEach((group, i) => {
    const rows = group.rows === 'work' ? EXTRA : group.rows;
    lines.push('', `## ${i + 1}. ${group.title}`, '', '| File | What it is for | Made by | Template | Example |', '|---|---|---|---|---|', ...rows.map(line));
  });
  lines.push('', `The blank templates are copies of the ones the commands fill. Run \`node guide.mjs ${home}${example ? ` ${example}` : ''}\` again after the plugin changes.`, '');
  writeFileSync(readme, lines.join('\n'));
  return readme;
}

function selfTest() {
  let failures = 0;
  const expect = (name, ok, detail) => { if (ok) console.log(`ok   ${name}`); else { failures++; console.log(`FAIL ${name}${detail === undefined ? '' : `: ${JSON.stringify(detail)}`}`); } };
  const root = mkdtempSync(join(tmpdir(), 'research-guide-'));
  const home = join(root, HOME);
  mkdirSync(join(home, 'demo', RESEARCH), { recursive: true });
  writeFileSync(join(home, 'demo', RESEARCH, 'personas.md'), '# Personas: Demo\n');
  const text = readFileSync(write(home, 'demo'), 'utf8');
  const blanks = readdirSync(join(home, GUIDE, 'blank'));
  expect('every template is copied blank', blanks.length === readdirSync(TEMPLATES).length, blanks);
  const unlisted = blanks.filter((name) => !text.includes(`(blank/${name})`));
  expect('every blank template is linked from the guide', unlisted.length === 0, unlisted);
  expect('a file the example holds is linked', text.includes('[demo](../demo/research/personas.md)'), text);
  expect('a folder has no template', /`inbox\/` \|[^\n]*\| none \| none yet \|/.test(text), text);
  expect('a file the example lacks says so', /`jobs\.md` \|[^\n]*\| none yet \|/.test(text), text);
  writeFileSync(join(home, GUIDE, 'README.md'), '# Mine\n');
  expect('a README the script did not write is left alone', write(home, 'demo') === null && readFileSync(join(home, GUIDE, 'README.md'), 'utf8') === '# Mine\n');
  const other = join(root, 'repo');
  mkdirSync(join(other, GUIDE, 'blank'), { recursive: true });
  writeFileSync(join(other, GUIDE, 'blank', 'keep.txt'), 'mine\n');
  expect('a folder not named ux-os is refused, and its templates are untouched', write(other) === null && existsSync(join(other, GUIDE, 'blank', 'keep.txt')), refusal(other));
  const second = join(root, 'two', HOME);
  mkdirSync(join(second, GUIDE, 'blank'), { recursive: true });
  writeFileSync(join(second, GUIDE, 'blank', 'keep.txt'), 'mine\n');
  expect('a templates folder with files and no guide README is left alone', write(second) === null && existsSync(join(second, GUIDE, 'blank', 'keep.txt')), refusal(second));
  const third = join(root, 'three', HOME);
  mkdirSync(third, { recursive: true });
  symlinkSync(join(other, GUIDE), join(third, GUIDE));
  expect('a linked templates folder is left alone', write(third) === null && existsSync(join(other, GUIDE, 'blank', 'keep.txt')), refusal(third));
  expect('an example that is not a project is refused', write(home, 'nosuch') === null && write(home, '..') === null);
  rmSync(root, { recursive: true, force: true });
  console.log(failures ? `\n${failures} self-test failure(s)` : '\nself-test passed');
  process.exit(failures ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [home, example] = process.argv.slice(2);
  if (home === '--self-test') selfTest();
  else if (!home || !existsSync(home)) { console.error('usage: node guide.mjs <home folder> [example project] | --self-test'); process.exit(2); }
  else { const why = refusal(home, example); if (why) { console.error(why); process.exit(1); } console.log(write(home, example)); }
}
