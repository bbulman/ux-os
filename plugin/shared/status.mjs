#!/usr/bin/env node
// Says where a research idea stands and what to run next. Reads the folder and writes nothing.
// Usage: node status.mjs <folder>   |   node status.mjs --self-test

import { createHash } from 'node:crypto';
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync, readSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assemble } from './book.mjs';
import { BAR_PEOPLE, participantIndex } from './check.mjs';
import { command } from './names.mjs';
import { firstTable, parseFile, parseMarkdown, tableRows, VERDICT_RANK } from './parse.mjs';

const MODELS = ['jobs.md', 'personas.md', 'journeys.md', 'empathy.md'];
const PLANS = ['interview-script.md', 'usability-plan.md', 'diary-study.md', 'survey.md'];
const READS_EVIDENCE = ['affinity.md', 'cardsort.md', 'summary.md', ...MODELS];
const AFFINITY_NOTES = 20;
const CLOCK_SLACK_MS = 60000;
const MEDIA = /\.(mp3|m4a|wav|aac|ogg|flac|mp4|mov|webm|mkv)$/i;

const visible = (name) => !name.startsWith('.');
const organisations = (n) => `${n} more organisation${n === 1 ? '' : 's'}`;
const people = (n) => `${n} more ${n === 1 ? 'person from a different organisation' : 'people from different organisations'}`;

function sha256(path) {
  const hash = createHash('sha256');
  const fd = openSync(path, 'r');
  const chunk = Buffer.alloc(1 << 20);
  try {
    for (let n = readSync(fd, chunk); n > 0; n = readSync(fd, chunk)) hash.update(chunk.subarray(0, n));
  } finally {
    closeSync(fd);
  }
  return hash.digest('hex');
}

function rowsOf(doc, name) {
  const section = doc?.sections.find((s) => s.name === name);
  const block = section && firstTable(section);
  return block ? tableRows(block) : [];
}

// Files in the inbox not yet taken in. Audio and video are listed apart, because the intake cannot take them in without a transcript.
function inboxState(folder, knownHashes) {
  const inbox = join(folder, 'inbox');
  if (!existsSync(inbox)) return { waiting: [], needsTranscript: [] };
  const known = knownHashes.map((h) => h.trim().toLowerCase()).filter(Boolean);
  const pending = readdirSync(inbox).filter((name) => {
    const path = join(inbox, name);
    if (!visible(name) || name === 'codes.md' || !statSync(path).isFile()) return false;
    const hash = sha256(path);
    return !known.some((k) => hash.startsWith(k));
  });
  return { waiting: pending.filter((name) => !MEDIA.test(name)), needsTranscript: pending.filter((name) => MEDIA.test(name)) };
}

function outcomesIn(folder) {
  const path = join(folder, 'beliefs.md');
  if (!existsSync(path)) return {};
  const block = firstTable(parseMarkdown(`## x\n${readFileSync(path, 'utf8').replace(/^# .*$/m, '')}`).sections[0]);
  return block ? Object.fromEntries(tableRows(block).filter((row) => row.Outcome).map((row) => [row.ID, row.Outcome])) : {};
}

function staleIn(folder) {
  const evidence = join(folder, 'evidence');
  if (!existsSync(evidence)) return [];
  const newest = Math.max(0, ...readdirSync(evidence).filter(visible).map((name) => statSync(join(evidence, name)).mtimeMs).filter((time) => time <= Date.now() + CLOCK_SLACK_MS));
  return READS_EVIDENCE.filter((file) => existsSync(join(folder, file)) && statSync(join(folder, file)).mtimeMs < newest);
}

// Each belief's verdict across every file, by the book's order of precedence.
function verdictsIn(built) {
  const seen = {};
  for (const [view, data] of Object.entries(built)) {
    if (!data || view === 'sources' || view === 'overview') continue;
    for (const claim of data.cl) for (const tag of claim.g) if (tag.k === 'b') (seen[tag.b] ??= new Set()).add(tag.v);
  }
  return Object.fromEntries(Object.entries(seen).map(([id, set]) => [id, VERDICT_RANK.find((v) => set.has(v))]));
}

function route(s, folder) {
  const has = (file) => existsSync(join(folder, file));
  const run = (skill, rest = '') => `${command(skill)} ${s.slug}${rest}`;
  const debrief = run('research-debrief', ' --evidence <file>');
  const synthesize = run('research-synthesize');

  if (s.waiting.length) {
    return { stage: 'evidence waiting', now: run('research-debrief'), why: `${s.waiting.length} file(s) in inbox/ not taken in yet`, then: [run('research-next'), synthesize] };
  }

  if (s.orgs >= BAR_PEOPLE) {
    const canSort = s.excerpts >= AFFINITY_NOTES;
    if ((canSort && !has('affinity.md')) || !has('summary.md') || Object.values(s.models).includes('proto') || s.stale.some((file) => file !== 'cardsort.md')) {
      const note = !canSort && !has('affinity.md') ? `Only ${s.excerpts} excerpts so far. The affinity diagram needs ${AFFINITY_NOTES} notes from 3 people, so it may be left out.` : null;
      return { stage: 'ready to synthesize', now: synthesize, why: `${s.orgs} organisations on file, which meets the bar`, then: [run('create-journey-map', ' real future'), run('create-usability-plan')], note };
    }
    const unbuilt = [['jobs.md', 'create-jtbd'], ['personas.md', 'create-personas'], ['journeys.md', 'create-journey-map']].filter(([file]) => !has(file));
    if (unbuilt.length) {
      return { stage: 'built on research', now: run(unbuilt[0][1], ' real'), why: `${unbuilt[0][0]} has never been built, and the evidence can carry it`, then: [...unbuilt.slice(1).map(([, skill]) => run(skill, ' real')), run('create-research-repository')].slice(0, 2) };
    }
    if (!/^## Future journey:/m.test(readFileSync(join(folder, 'journeys.md'), 'utf8'))) {
      return { stage: 'built on research', now: run('create-journey-map', ' real future'), why: 'the current journey rests on research, and nothing yet says what should change', then: [run('create-usability-plan'), command('create-research-repository')] };
    }
    if (!has('usability-plan.md')) {
      return { stage: 'built on research', now: run('create-usability-plan'), why: 'the future journey is a proposal until people have tried it', then: [command('create-research-repository')] };
    }
    if (!existsSync(join(dirname(folder), 'repository.md'))) {
      return { stage: 'built on research', now: command('create-research-repository'), why: 'what was learned is not yet kept anywhere', then: [] };
    }
    return { stage: 'kept', now: null, why: 'the models rest on research and nothing newer has arrived. If the usability test has not run yet, that comes next', then: [] };
  }

  if (!Object.keys(s.models).length && !s.plans.length) {
    const stage = s.beliefs.length ? 'beliefs, no models yet' : has('brief.md') ? 'brief only' : 'nothing on file';
    return { stage, now: run('research-discover'), why: s.beliefs.length ? 'beliefs are recorded but nothing is built from them yet' : 'there are no beliefs to test yet', then: [run('create-interview-script'), debrief] };
  }

  const surveyIn = s.plans.includes('survey.md') && s.studies > 0 && (s.people === 0 || s.respondents > s.people);
  const plansLeft = surveyIn ? s.plans.filter((file) => file !== 'survey.md') : s.plans;
  if (surveyIn && !has('summary.md')) {
    return { stage: 'survey in', now: run('summarize-research'), why: 'the survey results are in and nothing has summarised them', then: [run('research-next')] };
  }
  if (!plansLeft.length && (surveyIn || s.people === 0)) {
    return { stage: 'beliefs, no study yet', now: null, choose: true, why: surveyIn ? 'the survey is summarised, and other beliefs still need testing' : 'the models are assumptions, and no study is planned to test them', then: [debrief, synthesize] };
  }
  if (plansLeft.join() === 'survey.md') {
    return { stage: 'out testing', now: `Run the survey on file to the sample it sets, then ${debrief}`, why: 'a survey is planned and its results are not in yet', then: [run('summarize-research'), synthesize] };
  }
  const study = plansLeft.length ? `Run the study on file (${plansLeft.join(', ')})` : 'Carry on with the study you have started';
  return { stage: 'out testing', now: `${study} with ${people(s.orgsNeeded)}, then ${debrief}`, why: `${s.orgs} of ${BAR_PEOPLE} organisations so far`, then: [synthesize, command('create-research-repository')] };
}

export function status(folder) {
  const s = {
    folder, slug: basename(resolve(folder)), exists: existsSync(folder), decision: null, models: {}, plans: [], studies: 0, respondents: 0, people: 0, orgs: 0, orgsNeeded: BAR_PEOPLE,
    excerpts: 0, marked: 0, waiting: [], needsTranscript: [], stale: [], beliefs: [], testFirst: null, stage: '', now: null, choose: false, why: '', then: [], note: null, error: null,
  };

  if (s.exists) {
    const briefPath = join(folder, 'brief.md');
    if (existsSync(briefPath)) s.decision = readFileSync(briefPath, 'utf8').match(/\*\*Decision:\*\*\s*(.+)/)?.[1]?.trim() ?? null;
    for (const file of MODELS) {
      if (existsSync(join(folder, file))) s.models[file] = /^From research:/.test(parseFile(join(folder, file)).banner ?? '') ? 'real' : 'proto';
    }
    s.plans = PLANS.filter((file) => existsSync(join(folder, file)));

    const primaryPath = join(folder, 'primary.md');
    const doc = existsSync(primaryPath) ? parseFile(primaryPath) : null;
    const studies = rowsOf(doc, 'Studies');
    const excerpts = rowsOf(doc, 'Excerpts');
    const index = participantIndex(primaryPath);
    s.studies = studies.length;
    s.respondents = studies.reduce((sum, row) => sum + (parseInt(row.People, 10) || 0), 0);
    s.people = rowsOf(doc, 'Participants').length;
    s.orgs = new Set(index.orgs.values()).size;
    s.orgsNeeded = Math.max(0, BAR_PEOPLE - s.orgs);
    s.excerpts = excerpts.length;
    s.marked = excerpts.filter((row) => /\bB\d+\b/.test(row.Beliefs ?? '')).length;
    Object.assign(s, inboxState(folder, studies.map((row) => row.Hash ?? '')));
    s.stale = staleIn(folder);

    try {
      const { ctx, built } = assemble(folder);
      const verdicts = verdictsIn(built);
      const outcomes = outcomesIn(folder);
      s.beliefs = Object.entries(ctx.beliefs).map(([id, b]) => ({
        id, text: b.t, certainty: b.certainty ?? 'unknown',
        verdict: outcomes[id] ?? verdicts[id] ?? (/^No view:/i.test(b.t) ? 'no view' : 'not checked'),
        settled: Boolean(outcomes[id]),
        orgs: new Set([...(index.behaviour.get(id) ?? [])].map((p) => index.orgs.get(p)).filter(Boolean)).size,
      }));
      const next = built.overview?.next;
      if (next?.k === 'test') s.testFirst = { id: next.b, verdict: outcomes[next.b] ?? verdicts[next.b], certainty: next.certainty, drop: next.drop, text: ctx.beliefs[next.b]?.t ?? next.b };
    } catch (error) {
      s.error = error.message;
    }
  }
  return Object.assign(s, route(s, folder));
}

export function render(s) {
  const lines = [`Folder: ${s.folder}`];
  if (s.decision) lines.push(`Decision: ${s.decision}`);
  lines.push(`Stage: ${s.stage}`);
  lines.push(`Now: ${s.choose ? `choose the study that tests ${s.testFirst?.id ?? 'the riskiest belief'}` : s.now ?? 'nothing is waiting'}`);
  lines.push(`Why: ${s.why}`);
  lines.push(`Then: ${s.then.length ? s.then.join(' | ') : 'nothing'}`);
  lines.push(`Evidence: ${s.studies} studies, ${s.people} people, ${s.orgs} organisations, ${s.excerpts} excerpts, ${s.marked} marked against a belief`);
  lines.push(`Real mode: ${s.orgsNeeded ? `needs ${organisations(s.orgsNeeded)}` : 'ready'}`);
  if (Object.keys(s.models).length) lines.push(`Models: ${Object.entries(s.models).map(([file, mode]) => `${file} (${mode})`).join(', ')}`);
  if (s.plans.length) lines.push(`Plans: ${s.plans.join(', ')}`);
  if (s.waiting.length) lines.push(`Waiting in inbox: ${s.waiting.join(', ')}`);
  if (s.needsTranscript.length) lines.push(`Needs a transcript: ${s.needsTranscript.join(', ')}`);
  if (s.stale.length) lines.push(`Out of date: ${s.stale.join(', ')}`);
  if (s.note) lines.push(`Note: ${s.note}`);
  if (s.error) lines.push(`Note: the models could not be read, so beliefs are not shown: ${s.error}`);
  if (s.testFirst) lines.push(`Test first: ${s.testFirst.id} (${s.testFirst.verdict}, ${s.testFirst.certainty ?? 'unknown'}). ${s.testFirst.text}${s.testFirst.drop ? ` Would drop it if: ${s.testFirst.drop}` : ''}`);
  if (s.beliefs.length) {
    lines.push('Beliefs:');
    for (const b of s.beliefs) lines.push(`${b.id} | ${b.certainty} | ${b.verdict} | ${b.settled ? '' : `${Math.min(b.orgs, BAR_PEOPLE)} of ${BAR_PEOPLE} organisations | `}${b.text}`);
  }
  return lines.join('\n');
}

async function selfTest() {
  const { CLEAN } = await import('./fixtures/fixture.mjs');
  let failures = 0;
  const expect = (name, ok, detail) => {
    if (ok) console.log(`ok   ${name}`);
    else { failures++; console.log(`FAIL ${name}${detail === undefined ? '' : `: ${JSON.stringify(detail)}`}`); }
  };

  const BRIEF = '# Brief: Test idea\n\n- **Idea:** A thing\n- **For:** Clinics\n- **Market:** UK\n- **Decision:** Build it or stop\n- **Book:** not published\n- **Created:** 2026-11-01\n';
  const PLANS = ['interview-script.md', 'usability-plan.md', 'diary-study.md', 'survey.md'];

  // A primary.md with n people from n organisations, and one unprompted reported excerpt each, marked B1.
  const primary = (n, { excerpts = n } = {}) => {
    const people = Array.from({ length: n }, (_, i) => `| P${i + 1} | Owner | Solo | O${i + 1} | S4 |`).join('\n');
    const rows = Array.from({ length: excerpts }, (_, i) => `| "Paper diary ${i + 1}" | workaround | Paper | reported | no | B1 | [S4 P${(i % n) + 1}] |`).join('\n');
    return `# Primary research: Test idea\n\n## Studies\n| Study | Hash | Who ran it | When | People | How recruited | What was asked | Known bias |\n|---|---|---|---|---|---|---|---|\n| S4 | abc123 | Team | 2026-10 | ${n} | Referrals | Booking | Referrals only |\n\n## Participants\n| Code | Role | Segment | Org | Study |\n|---|---|---|---|---|\n${people}\n\n## Excerpts\n| Verbatim | Code | Theme | Grade | Prompted | Beliefs | Evidence |\n|---|---|---|---|---|---|---|\n${rows}\n`;
  };

  const realBanner = (text) => text.replace(/^Proto: .*$/m, 'From research: 5 people, 5 organisations. Every finding traces to what they did or said.');
  const MODELS = ['jobs.md', 'personas.md', 'journeys.md', 'empathy.md'];

  // The fixture's models and beliefs, without its plans or repository, with `n` organisations of evidence.
  const models = (n, extra = {}) => {
    const files = { ...CLEAN, 'brief.md': BRIEF, 'primary.md': primary(n) };
    for (const f of [...PLANS, 'repository.md', 'affinity.md', 'cardsort.md', 'summary.md']) delete files[f];
    return { ...files, ...extra };
  };
  const built = (extra = {}) => {
    const files = { ...CLEAN, 'brief.md': BRIEF, 'primary.md': primary(5, { excerpts: 25 }) };
    for (const f of [...PLANS, 'repository.md', 'cardsort.md']) delete files[f];
    for (const f of MODELS) files[f] = realBanner(files[f]);
    files['journeys.md'] = files['journeys.md'].replace(/^## Future journey:[\s\S]*?(?=^## |\Z)/m, '');
    return { ...files, ...extra };
  };

  const roots = [];
  const make = (files, { inbox = {}, evidence = {}, repository = false } = {}) => {
    const root = mkdtempSync(join(tmpdir(), 'research-status-'));
    roots.push(root);
    const folder = join(root, 'test-idea');
    mkdirSync(folder);
    for (const [name, text] of Object.entries(files)) writeFileSync(join(folder, name), text);
    if (Object.keys(inbox).length) { mkdirSync(join(folder, 'inbox')); for (const [n, t] of Object.entries(inbox)) writeFileSync(join(folder, 'inbox', n), t); }
    if (Object.keys(evidence).length) { mkdirSync(join(folder, 'evidence')); for (const [n, t] of Object.entries(evidence)) writeFileSync(join(folder, 'evidence', n), t); }
    if (repository) writeFileSync(join(root, 'repository.md'), '# Repository\n');
    return folder;
  };

  // Nothing on file
  let s = status(join(tmpdir(), 'research-status-no-such-folder', 'new-idea'));
  expect('a folder that does not exist yet is the start', s.exists === false && s.now === '/ux-os:research-discover new-idea', s);

  s = status(make({ 'brief.md': BRIEF }));
  expect('a brief alone goes to discover', s.now === '/ux-os:research-discover test-idea', s);
  expect('the decision is read from the brief', s.decision === 'Build it or stop', s.decision);

  // Evidence waiting beats everything
  s = status(make({ 'brief.md': BRIEF }, { inbox: { 'p1.txt': 'a transcript' } }));
  expect('a new file in the inbox goes to debrief', s.now === '/ux-os:research-debrief test-idea' && s.waiting.length === 1, s);

  const hash = createHash('sha256').update('a transcript').digest('hex');
  const taken = primary(1).replace('abc123', hash);
  s = status(make({ 'brief.md': BRIEF, 'primary.md': taken }, { inbox: { 'p1.txt': 'a transcript', 'codes.md': 'P1 is Sam', '.DS_Store': 'x' } }));
  expect('a file already taken in is not waiting, and the key file never counts', s.waiting.length === 0, s.waiting);

  const short = primary(1).replace('abc123', hash.slice(0, 12));
  s = status(make({ 'brief.md': BRIEF, 'primary.md': short }, { inbox: { 'p1.txt': 'a transcript' } }));
  expect('a shortened hash still matches', s.waiting.length === 0, s.waiting);

  s = status(make({ 'brief.md': BRIEF }, { inbox: { 'p1.m4a': 'audio', 'p2.MOV': 'video' } }));
  expect('audio cannot be taken in, so it is listed and does not jam the route', s.waiting.length === 0 && s.needsTranscript.length === 2 && s.now === '/ux-os:research-discover test-idea', s);

  // Beliefs recorded but no models
  s = status(make({ 'brief.md': BRIEF, 'beliefs.md': CLEAN['beliefs.md'] }));
  expect('beliefs with no models say so', s.stage === 'beliefs, no models yet' && s.now === '/ux-os:research-discover test-idea', s);

  // Surveys and analytics are not interviews
  const surveyOnly = models(0);
  delete surveyOnly['primary.md'];
  s = status(make({ ...surveyOnly, 'survey.md': CLEAN['survey.md'] }));
  expect('a survey plan is run to its sample, not to five organisations', /survey/.test(s.now) && !/organisations/.test(s.now), s);
  const surveyIn = { ...models(0), 'primary.md': primary(0, { excerpts: 0 }), 'survey.md': CLEAN['survey.md'] };
  s = status(make(surveyIn));
  expect('survey results with no summary go to the summary', s.now === '/ux-os:summarize-research test-idea', s);
  s = status(make({ ...surveyIn, 'summary.md': CLEAN['summary.md'] }));
  expect('a summarised survey moves on to the next study', s.choose === true, s);
  s = status(make({ ...models(0), 'primary.md': primary(0, { excerpts: 0 }) }));
  expect('an analytics snapshot is not a study in progress', s.choose === true && s.stage === 'beliefs, no study yet', s);

  const quoted = primary(1, { excerpts: 1 }).replace('| 2026-10 | 1 | Referrals', '| 2026-10 | 412 | Referrals');
  s = status(make({ ...models(0), 'primary.md': quoted, 'survey.md': CLEAN['survey.md'] }));
  expect('a survey with one quoted respondent still counts as results in', s.now === '/ux-os:summarize-research test-idea', s.now);
  s = status(make({ ...models(0), 'primary.md': quoted, 'survey.md': CLEAN['survey.md'], 'summary.md': CLEAN['summary.md'], 'interview-script.md': CLEAN['interview-script.md'] }));
  expect('after a summarised survey, a plan still on file is the next study', s.choose === false && /interview-script/.test(s.now) && !/survey/.test(s.now), s.now);

  s = status(make({ ...models(0), 'primary.md': quoted.replace('| 412 | Referrals', '| 412 responses, 46% | Referrals'), 'survey.md': CLEAN['survey.md'] }));
  expect('a sample written with its response rate is still read', s.now === '/ux-os:summarize-research test-idea', s.now);

  s = status(make({}));
  expect('a folder with no brief is nothing on file', s.stage === 'nothing on file', s.stage);

  // Beliefs, no study yet
  const noEvidence = models(3);
  delete noEvidence['primary.md'];
  s = status(make(noEvidence));
  expect('models with no plan and no evidence ask for a study to be chosen', s.choose === true && s.now === null, s);
  expect('the belief to test first comes from the book logic', s.testFirst?.id === 'B3' && s.testFirst.verdict === 'contradicted', s.testFirst);

  s = status(make(models(3)));
  expect('interviews on file with no plan means carry on, not choose', s.stage === 'out testing' && s.choose === false && /2 more/.test(s.now), s);
  expect('real mode counts organisations still needed', s.orgs === 3 && s.orgsNeeded === 2, s);

  // Out testing
  s = status(make(models(3, { 'interview-script.md': CLEAN['interview-script.md'] })));
  expect('a plan on file means go and run it', s.stage === 'out testing' && /2 more/.test(s.now) && /ux-os:research-debrief/.test(s.now), s);
  expect('the plan is named', s.plans.includes('interview-script.md'), s.plans);

  s = status(make(models(4)));
  expect('one more is said in the singular', /with 1 more person from a different organisation/.test(s.now), s.now);
  expect('the real mode line is singular too', /needs 1 more organisation\b/.test(render(s)), render(s));

  // Counting people the way check.mjs does
  const mixed = primary(2).replace('| reported | no | B1 | [S4 P2] |', '| opinion | no | B1 | [S4 P2] |');
  s = status(make(models(2, { 'primary.md': mixed })));
  expect('an opinion does not count towards the bar', s.beliefs.find((b) => b.id === 'B1').orgs === 1, s.beliefs);

  const sameOrg = primary(2).replace('| P2 | Owner | Solo | O2 |', '| P2 | Owner | Solo | O1 |');
  s = status(make(models(2, { 'primary.md': sameOrg })));
  expect('two people from one organisation count once', s.beliefs.find((b) => b.id === 'B1').orgs === 1 && s.people === 2 && s.orgs === 1, s);
  expect('marked excerpts are counted', s.marked === 2 && s.excerpts === 2, s);

  // Ready
  s = status(make(models(5)));
  expect('five organisations with proto models goes to synthesize', s.now === '/ux-os:research-synthesize test-idea', s);
  expect('too few excerpts for the affinity diagram is flagged', /excerpts/.test(s.note ?? ''), s.note);
  s = status(make({ ...models(5), 'primary.md': primary(5, { excerpts: 25 }) }));
  expect('enough excerpts raises no flag', !s.note, s.note);

  // Staleness
  const folder = make(models(3), { evidence: { 'S4-a.md': 'x' } });
  const past = new Date('2026-01-01T00:00:00Z');
  utimesSync(join(folder, 'jobs.md'), past, past);
  s = status(folder);
  expect('a model older than the newest evidence is out of date', s.stale.includes('jobs.md') && !s.stale.includes('primary.md'), s.stale);

  const fresh = make(models(3), { evidence: { 'S4-a.md': 'x' } });
  utimesSync(join(fresh, 'evidence', 'S4-a.md'), past, past);
  s = status(fresh);
  expect('a model newer than the evidence is not', s.stale.length === 0, s.stale);

  // Built on research
  const noWork = (folderPath) => {
    utimesSync(join(folderPath, 'evidence', 'S4-a.md'), past, past);
    return folderPath;
  };
  s = status(noWork(make(built(), { evidence: { 'S4-a.md': 'x' } })));
  expect('real models with no future journey go on to the future', s.now === '/ux-os:create-journey-map test-idea real future', s);

  const noJobs = built();
  delete noJobs['jobs.md'];
  s = status(noWork(make(noJobs, { evidence: { 'S4-a.md': 'x' } })));
  expect('a model never built is offered in real mode', s.now === '/ux-os:create-jtbd test-idea real', s);

  const stale = make(built(), { evidence: { 'S4-a.md': 'x' } });
  utimesSync(join(stale, 'personas.md'), past, past);
  s = status(stale);
  expect('a real model made stale by new evidence goes back to synthesize', s.now === '/ux-os:research-synthesize test-idea', s);

  const sparse = built({ 'primary.md': primary(5) });
  delete sparse['affinity.md'];
  s = status(noWork(make(sparse, { evidence: { 'S4-a.md': 'x' } })));
  expect('too few notes for an affinity diagram is not a dead end', s.now === '/ux-os:create-journey-map test-idea real future', s.now);

  const dated = make(models(3), { evidence: { 'S4-a.md': 'x' } });
  const soon = new Date(Date.now() + 30 * 86400000);
  utimesSync(join(dated, 'evidence', 'S4-a.md'), soon, soon);
  s = status(dated);
  expect('evidence dated in the future makes nothing out of date', s.stale.length === 0, s.stale);

  const onlyCardSort = make(built({ 'cardsort.md': CLEAN['cardsort.md'] }), { evidence: { 'S4-a.md': 'x' } });
  utimesSync(join(onlyCardSort, 'evidence', 'S4-a.md'), past, past);
  const earlier = new Date('2025-01-01T00:00:00Z');
  utimesSync(join(onlyCardSort, 'cardsort.md'), earlier, earlier);
  s = status(onlyCardSort);
  expect('a stale card sort does not send anyone to synthesize, which never rewrites it', s.stale.join() === 'cardsort.md' && s.now !== '/ux-os:research-synthesize test-idea', s);

  const settled = CLEAN['beliefs.md'].replace('| Recorded |', '| Recorded | Outcome |').replace('| 2026-11-01 |\n| B2', '| 2026-11-01 | confirmed S4 P1-P5 |\n| B2');
  s = status(noWork(make(built({ 'beliefs.md': settled }), { evidence: { 'S4-a.md': 'x' } })));
  expect('a recorded outcome survives the models being rebuilt', s.beliefs.find((b) => b.id === 'B1').verdict === 'confirmed S4 P1-P5', s.beliefs);
  expect('a belief with no outcome keeps the verdict its models carry', s.beliefs.find((b) => b.id === 'B2').verdict === 'supported', s.beliefs);
  expect('a line with an outcome carries no second count', /^B1 \| sure \| confirmed S4 P1-P5 \| Clinics/m.test(render(s)), render(s));
  const crowded = primary(7);
  s = status(make(models(7, { 'primary.md': crowded })));
  expect('a count never reads above the bar', /^B1 \| sure \| confirmed \| 5 of 5 organisations \|/m.test(render(s)), render(s));

  const unsettled = CLEAN['beliefs.md'].replace('| Recorded |', '| Recorded | Outcome |').replace(/\| 2026-11-01 \|/g, '| 2026-11-01 | not settled: 0 of 5 organisations |');
  s = status(make({ 'brief.md': BRIEF, 'beliefs.md': unsettled, 'primary.md': primary(5, { excerpts: 25 }) }));
  expect('with no belief tags left, the belief to test first comes from its outcome', /^Test first: B1 \(not settled: 0 of 5 organisations, sure\)/m.test(render(s)), render(s));

  const FUTURE = '\n## Future journey: x\n';
  const j = built()['journeys.md'] + FUTURE;
  s = status(noWork(make(built({ 'journeys.md': j }), { evidence: { 'S4-a.md': 'x' } })));
  expect('after the future journey comes the usability plan', s.now === '/ux-os:create-usability-plan test-idea', s);

  s = status(noWork(make(built({ 'journeys.md': j, 'usability-plan.md': CLEAN['usability-plan.md'] }), { evidence: { 'S4-a.md': 'x' } })));
  expect('then the repository', s.now === '/ux-os:create-research-repository', s);

  s = status(noWork(make(built({ 'journeys.md': j, 'usability-plan.md': CLEAN['usability-plan.md'] }), { evidence: { 'S4-a.md': 'x' }, repository: true })));
  expect('with everything done nothing is waiting', s.stage === 'kept' && s.now === null, s);

  const relative = make({ 'brief.md': BRIEF });
  const home = process.cwd();
  process.chdir(relative);
  s = status('.');
  process.chdir(home);
  expect('a relative folder still gives the idea name', s.now === '/ux-os:research-discover test-idea', s.now);

  // It writes nothing
  const quiet = make(models(3));
  const before = readdirSync(quiet).sort().join();
  status(quiet);
  render(status(quiet));
  expect('reading a folder changes nothing in it', readdirSync(quiet).sort().join() === before, readdirSync(quiet));

  // What the skill reads
  const text = render(status(make(models(3))));
  for (const label of ['Stage:', 'Now:', 'Then:', 'Evidence:', 'Real mode:', 'Test first:', 'Beliefs:']) expect(`the report has ${label}`, text.includes(label), text);
  expect('a belief line shows its progress', /B1 \| sure \| confirmed \| 3 of 5 organisations \|/.test(text), text);

  for (const root of roots) rmSync(root, { recursive: true, force: true });
  console.log(failures ? `\n${failures} self-test failure(s)` : '\nself-test passed');
  process.exit(failures ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2];
  if (arg === '--self-test') await selfTest();
  else if (!arg) { console.error('usage: node status.mjs <folder> | --self-test'); process.exit(2); }
  else console.log(render(status(arg)));
}
