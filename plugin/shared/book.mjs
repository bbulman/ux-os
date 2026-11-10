#!/usr/bin/env node
// Builds the research book for one idea folder. No model is involved: the same folder always gives the same book.
// Usage: node book.mjs <folder>   |   node book.mjs --self-test
// Writes <folder>/book/index.html (an Artifact fragment), open-me.html (the same page as a normal document) and data/<view>.js.

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { command } from './names.mjs';
import { driftNote, readProfile } from './profile.mjs';
import { claims as claimsOf, firstTable, needsBar, parseFile, parseMarkdown, parseTag, stripTags, tagsIn, VERDICT_RANK } from './parse.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHELL = join(HERE, 'book-shell');

export const VIEWS = ['overview', 'summary', 'affinity', 'cardsort', 'empathy', 'personas', 'jobs', 'journeys', 'interview', 'usability', 'diary', 'survey', 'sources'];
const OUTPUT_VIEWS = ['summary', 'affinity', 'cardsort', 'empathy', 'personas', 'jobs', 'journeys', 'interview', 'usability', 'diary', 'survey'];
const PLAN_VIEWS = ['interview', 'usability', 'diary', 'survey'];
const FILE = {
  summary: 'summary.md', affinity: 'affinity.md', cardsort: 'cardsort.md', empathy: 'empathy.md',
  jobs: 'jobs.md', personas: 'personas.md', journeys: 'journeys.md',
  interview: 'interview-script.md', usability: 'usability-plan.md', diary: 'diary-study.md', survey: 'survey.md',
};
const SKILL = {
  summary: command('summarize-research'),
  affinity: command('affinity-diagram'), cardsort: command('analyze-card-sort'), empathy: command('create-empathy-map'),
  jobs: command('create-jtbd'), personas: command('create-personas'), journeys: command('create-journey-map'),
  interview: command('create-interview-script'), usability: command('create-usability-plan'), diary: command('create-diary-study'), survey: command('create-survey'),
};
const STATES = ['evidenced', 'inference', 'backed', 'mixed', 'untested', 'contradicted', 'confirmed', 'proposed', 'gap'];
const PRIORITY = ['contradicted', 'mixed', 'untested', 'confirmed', 'backed', 'proposed', 'inference', 'evidenced', 'gap'];
const RAW_TAG = /\[(?:S\d+|B\d+|inference|proposed|gap)[^\]]*\]/;

// ---------- small helpers ----------

const read = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : null);

function clean(text) {
  return stripTags(String(text ?? ''))
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\\\|/g, '|')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|[\s(])\*(?!\s)(.+?)\*(?=[\s).,;:]|$)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const CITE = /\b(?:1|2)\d{3}\b|\bseen\b|\bstale\b|vendor figure|country not|countries not|no geography|no region|region not|interviews?\b|\bupdated\b|\breviewed\b|first-person|\bopinion\b|vendor case study|not stated|\bglobal\b/i;
const TAIL = /^(.*?)\s*[,;]\s*((?:(?:stale|vendor figure|small sample|two people|one person|first-person account|vendor case study)(?:\s*,\s*|\s+and\s+)?)+)\s*(\.?)\s*$/is;

// Moves trailing dates, countries, "seen", "stale" and similar out of the sentence, into a separate cite.
export function splitCite(text) {
  const original = String(text ?? '').trim();
  let t = original;
  const cites = [];
  for (let i = 0; i < 6; i++) {
    const before = t;
    const m = t.match(/^(.*?)\s*\(([^()]*)\)\s*([.;:,]?)\s*$/s);
    if (m && m[1].trim() && CITE.test(m[2])) {
      cites.unshift(m[2].trim().replace(/\.$/, ''));
      t = m[1] + (m[3] && m[3] !== ',' ? m[3] : '');
    } else {
      const k = t.match(TAIL);
      if (k && k[1].trim()) { cites.unshift(k[2].replace(/[,\s]+$/, '')); t = k[1] + k[3]; }
    }
    if (t === before) break;
  }
  t = t.replace(/\s+([.,;:])/g, '$1').trim();
  if (!t) return { t: original, cite: '', mark: '' };
  const joined = cites.join('; ');
  return { t, cite: joined, mark: /\bstale\b/i.test(joined) ? 'stale' : /vendor figure/i.test(joined) ? 'vendor' : '' };
}

function labelOf(raw) {
  const m = String(raw).match(/^\*\*([^*]+?):?\*\*:?\s*([\s\S]*)$/);
  return m ? { label: m[1].trim(), rest: m[2] } : { label: null, rest: String(raw) };
}

function unquote(text) {
  const m = String(text).trim().match(/^["“”‘'](.*)["”“’']$/s);
  return m ? { text: m[1].trim(), quoted: true } : { text: String(text).trim(), quoted: false };
}

// An excerpt in the book stops here, so the published page cannot add up to a transcript.
const clipWords = (text, max = 60) => {
  const words = String(text).trim().split(/\s+/);
  return words.length <= max ? String(text).trim() : `${words.slice(0, max).join(' ')}…`;
};

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const num = (s) => { const n = Number(String(s).replace(/[,\s]/g, '')); return Number.isFinite(n) && String(s).trim() !== '' ? n : null; };
const sentence = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const KEEP = new Set(['Component', 'Evidence', 'Published', 'Fetched', 'Position', 'Emotion', 'Importance', 'Satisfaction', 'Status', 'Kind', 'ID', 'Where', 'Code', 'Hash', 'People', 'When']);

function tableOf(container) {
  const block = container && firstTable(container);
  if (!block) return [];
  return block.rows.map((row) => {
    const cells = Object.fromEntries(block.header.map((h, i) => [h, row.cells[i] ?? '']));
    const cites = [];
    let mark = '';
    for (const h of block.header) {
      if (KEEP.has(h)) continue;
      const plain = clean(cells[h]);
      if (plain.length < 25) continue;
      const sc = splitCite(plain);
      cells[h] = sc.t;
      if (sc.cite) cites.push(sc.cite);
      if (sc.mark === 'stale' || (sc.mark && !mark)) mark = sc.mark;
    }
    return { row, cells, cite: cites.join('; '), mark };
  });
}

const bulletsOf = (container, depth = 0) => (container?.blocks ?? []).filter((b) => (b.type === 'bullet' && b.depth === depth) || b.type === 'quote');
const section = (doc, name) => doc?.sections.find((s) => s.name === name) ?? null;
const subsection = (sec, name) => sec?.subsections.find((s) => s.name === name) ?? null;

// ---------- states ----------

function tagState(t) {
  if (t.kind === 'gap') return 'gap';
  if (t.kind === 'inference') return 'inference';
  if (t.kind === 'proposed') return 'proposed';
  if (t.kind === 'belief') {
    switch (t.verdict) {
      case 'supported': return 'backed';
      case 'contradicted': case 'refuted': return 'contradicted';
      case 'confirmed': return 'confirmed';
      case 'mixed': return 'mixed';
      default: return 'untested';
    }
  }
  return 'evidenced';
}

function stateOf(tags) {
  if (!tags.length) return { s: 'untested', a: ['untested'], untagged: true };
  const all = [...new Set(tags.map(tagState))];
  return { s: PRIORITY.find((x) => all.includes(x)), a: all };
}

function compactTags(tags) {
  return tags.map((t) => {
    const o = { k: t.kind === 'gap' ? 'g' : t.kind === 'belief' ? 'b' : t.kind === 'inference' ? 'i' : t.kind === 'proposed' ? 'p' : 's' };
    if (t.kind === 'belief') { o.b = t.beliefs[0]; o.v = t.verdict ?? 'no evidence'; }
    if (t.sources?.length) o.s = t.sources;
    if (t.participants?.length) o.p = t.participants;
    if (t.threshold) o.th = 1;
    if (t.link?.anchor) o.a = t.link.anchor;
    return o;
  });
}

// ---------- the shared ledger, beliefs and participants ----------

function loadContext(folder) {
  const ctx = { folder, ledger: {}, beliefs: {}, participants: {}, excerpts: {}, anchorFile: {}, studies: [], docs: {}, brief: {} };

  const sources = read(join(folder, 'sources.md'));
  if (sources) {
    const doc = parseMarkdown(`## x\n${sources.replace(/^# .*$/m, '')}`);
    for (const { cells } of tableOf(doc.sections[0])) {
      if (!cells.ID) continue;
      ctx.ledger[cells.ID] = {
        t: clean(cells.Title), p: clean(cells.Publisher), d: clean(cells.Published), f: clean(cells.Fetched),
        k: clean(cells.Kind), v: clean(cells.Status), u: clean(cells.Kind) === 'first-party' ? '' : cells.Where.trim(),
      };
    }
  }

  const beliefs = read(join(folder, 'beliefs.md'));
  if (beliefs) {
    const doc = parseMarkdown(`## x\n${beliefs.replace(/^# .*$/m, '')}`);
    for (const { cells } of tableOf(doc.sections[0])) {
      if (!/^B\d+$/.test(cells.ID)) continue;
      const b = { t: clean(cells.Belief) };
      if (cells.Basis) b.basis = clean(cells.Basis);
      if (cells.Certainty) b.certainty = clean(cells.Certainty);
      if (cells['Would drop it if']) b.drop = clean(cells['Would drop it if']);
      if (cells.Origin) b.origin = clean(cells.Origin);
      if (cells.Recorded) b.recorded = clean(cells.Recorded);
      if (cells.Outcome) b.outcome = clean(cells.Outcome);
      ctx.beliefs[cells.ID] = b;
    }
  }

  if (existsSync(join(folder, 'primary.md'))) {
    const doc = parseFile(join(folder, 'primary.md'));
    for (const { cells } of tableOf(section(doc, 'Participants'))) {
      if (/^P\d+$/.test(cells.Code)) ctx.participants[cells.Code] = { role: clean(cells.Role), segment: clean(cells.Segment), study: clean(cells.Study), org: clean(cells.Org) };
    }
    for (const { cells } of tableOf(section(doc, 'Excerpts'))) {
      const evidence = tagsIn(cells.Evidence ?? '');
      const people = [...new Set(evidence.flatMap((t) => t.participants))];
      const ex = { v: clipWords(unquote(clean(cells.Verbatim)).text), code: clean(cells.Code), theme: clean(cells.Theme), grade: clean(cells.Grade), prompted: clean(cells.Prompted), s: [...new Set(evidence.flatMap((t) => t.sources))] };
      if (cells.Beliefs) ex.b = clean(cells.Beliefs);
      const cited = evidence.find((t) => t.link?.anchor)?.link;
      if (cited) { ex.a = cited.anchor; ctx.anchorFile[cited.anchor] = cited.file; }
      for (const p of people) (ctx.excerpts[p] ??= []).push(ex);
    }
    for (const { cells } of tableOf(section(doc, 'Studies'))) {
      ctx.studies.push({
        id: clean(cells.Study), by: clean(cells['Who ran it']), when: clean(cells.When), people: clean(cells.People),
        recruited: clean(cells['How recruited']), asked: clean(cells['What was asked']), bias: clean(cells['Known bias']),
      });
    }
    ctx.hasPrimary = true;
  }

  const brief = read(join(folder, 'brief.md'));
  if (brief) {
    const doc = parseMarkdown(brief);
    ctx.brief.title = (doc.title ?? '').replace(/^Brief:\s*/, '').trim();
    for (const b of doc.preamble) {
      const m = b.text.match(/^[-*]\s+\*\*([^*:]+):?\*\*:?\s*(.*)$/);
      if (m) ctx.brief[m[1].trim().toLowerCase()] = clean(m[2]);
    }
  }

  for (const [view, file] of Object.entries(FILE)) {
    if (existsSync(join(folder, file))) ctx.docs[view] = parseFile(join(folder, file));
  }
  ctx.name = ctx.brief.title || sentence(basename(resolve(folder)).replace(/[-_]+/g, ' '));
  return ctx;
}

// ---------- one view's claim registry ----------

class Registry {
  constructor(ctx) { this.ctx = ctx; this.lines = new Set(); this.more = []; this.cl = []; this.src = new Set(); this.bel = new Set(); this.ptc = new Set(); this.tagRows = []; this.cited = new Set(); }

  claim(text, tags, extra = {}, line = null) {
    const { s, a, untagged } = stateOf(tags);
    for (const t of tags) {
      t.sources?.forEach((x) => this.src.add(x));
      t.participants?.forEach((x) => this.ptc.add(x));
      t.beliefs?.forEach((x) => this.bel.add(x));
      if (t.link?.anchor) this.cited.add(t.link.anchor);
    }
    const sc = splitCite(clean(text));
    const item = { t: sc.t, s, g: compactTags(tags) };
    if (sc.cite) item.c = sc.cite;
    if (sc.mark) item.m = sc.mark;
    for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== '') item[k] = k === 'c' && item.c ? `${v}; ${item.c}` : v;
    if (a.length > 1) item.a = a;
    if (untagged) item.u = 1;
    this.cl.push(item);
    if (line !== null) this.lines.add(line);
    return this.cl.length - 1;
  }

  fromBullet(block, extra = {}) {
    const { label, rest } = labelOf(block.text);
    const id = this.claim(rest, block.tags, block.component ? { ...extra, cmp: clean(block.component) } : extra, block.line);
    return { c: id, label: label ? clean(label) : null, text: this.cl[id].t };
  }

  fromRow({ row, cells, cite, mark }, firstKey, extra = {}) {
    return this.claim(cells[firstKey] ?? row.text, row.tags, { r: 1, ...(cite ? { c: cite } : {}), ...(mark ? { m: mark } : {}), ...extra }, row.line);
  }

  // Every tagged line in the file has to reach the page. Whatever a view did not place is kept here, with where it came from.
  sweep(doc) {
    const visit = (container, sec, sub) => {
      for (const block of container.blocks) {
        const items = block.type === 'table'
          ? block.rows.map((r) => ({ row: true, text: clean(r.cells[0]), line: r.line, tags: r.tags }))
          : [{ row: false, text: block.text, line: block.line, tags: block.tags }];
        for (const it of items) {
          if (!it.tags.length || this.lines.has(it.line)) continue;
          const { label, rest } = it.row ? { label: null, rest: it.text } : labelOf(it.text);
          const id = this.claim(rest, it.tags, it.row ? { r: 1 } : {}, it.line);
          this.more.push({ c: id, sec, sub, label: label ? clean(label) : null });
        }
      }
    };
    for (const sec of doc.sections) {
      if (sec.name === 'Run notes') continue;
      visit(sec, sec.name, null);
      for (const sub of sec.subsections) visit(sub, sec.name, sub.name);
    }
  }

  finish(body) {
    const ctx = this.ctx;
    const src = {};
    for (const id of [...this.src].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))) if (ctx.ledger[id]) src[id] = ctx.ledger[id];
    const bel = {};
    for (const id of [...this.bel].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))) if (ctx.beliefs[id]) bel[id] = ctx.beliefs[id];
    const ptc = {};
    for (const id of [...this.ptc].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))) {
      if (ctx.participants[id] || ctx.excerpts[id]) ptc[id] = { ...(ctx.participants[id] ?? {}), ex: (ctx.excerpts[id] ?? []).filter((e, i) => i < 6 || this.cited.has(e.a)) };
    }
    return { v: 1, ...body, cl: this.cl, src, bel, ptc, ...(this.more.length ? { more: this.more } : {}) };
  }
}

const confOf = (sec) => (sec?.confidence ? sec.confidence : undefined);
const bannerOf = (doc) => {
  const real = doc?.banner?.match(/^From research:\s*(\d+) people?,\s*(\d+) organisations?/i);
  if (real) return { proto: false, real: true, n: Number(real[1]), m: Number(real[2]), text: doc.banner.trim() };
  const m = doc?.banner?.match(/^Proto:\s*(\d+) of (\d+)/);
  return m ? { proto: true, n: Number(m[1]), m: Number(m[2]), text: doc.banner.split('. ')[0].replace(/\.$/, '') + '.' } : null;
};

// ---------- views ----------

function jobsView(ctx) {
  const doc = ctx.docs.jobs; if (!doc) return null;
  const r = new Registry(ctx);
  const out = { name: ctx.name, banner: bannerOf(doc) };

  const core = section(doc, 'The core job');
  const quote = core?.blocks.find((b) => b.type === 'quote');
  if (quote) out.core = { c: r.claim(quote.text, quote.tags, {}, quote.line), conf: confOf(core) };
  out.triggers = bulletsOf(core).filter((b) => b.type === 'bullet').map((b) => r.fromBullet(b));

  const dims = section(doc, 'The three dimensions');
  out.dims = { conf: confOf(dims), rows: tableOf(dims).map((x) => ({ c: r.fromRow(x, 'What they want'), dim: clean(x.cells.Dimension), want: clean(x.cells['What they want']) })) };

  const map = section(doc, 'The job map');
  out.map = { conf: confOf(map), rows: tableOf(map).map((x) => ({ c: r.fromRow(x, 'Stage'), stage: clean(x.cells.Stage), does: clean(x.cells['What they do']), hurts: clean(x.cells['Where it hurts']) })) };

  const hired = section(doc, 'What gets hired today');
  out.hired = { conf: confOf(hired), rows: tableOf(hired).map((x) => ({
    c: r.fromRow(x, 'Solution'), solution: clean(x.cells.Solution), for: clean(x.cells['Hired for']), fired: clean(x.cells['Fired because']),
    ...(x.cells['Why they stay'] ? { stay: clean(x.cells['Why they stay']) } : {}),
  })) };

  const outc = section(doc, 'Top underserved outcomes');
  const outcomes = tableOf(outc).map((x, i) => {
    const imp = num(x.cells.Importance), sat = num(x.cells.Satisfaction);
    return { c: r.fromRow(x, 'Outcome'), outcome: clean(x.cells.Outcome), imp, sat, gap: imp !== null && sat !== null ? imp - sat : null, i };
  });
  outcomes.sort((a, b) => (b.gap ?? -99) - (a.gap ?? -99) || a.i - b.i);
  out.outcomes = { conf: confOf(outc), rows: outcomes.map(({ i, ...rest }) => rest), notes: bulletsOf(outc).map((b) => r.fromBullet(b)) };

  const segs = section(doc, 'Job statements by segment');
  out.segments = { conf: confOf(segs), rows: tableOf(segs).map((x) => ({ c: r.fromRow(x, 'Job statement'), segment: clean(x.cells.Segment), statement: clean(x.cells['Job statement']) })) };
  const impl = section(doc, 'Design implications');
  out.implications = { conf: confOf(impl), items: bulletsOf(impl).map((b) => r.fromBullet(b)) };
  r.sweep(doc);
  return r.finish(out);
}

function personasView(ctx) {
  const doc = ctx.docs.personas; if (!doc) return null;
  const r = new Registry(ctx);
  const out = { name: ctx.name, banner: bannerOf(doc) };

  const seg = section(doc, 'Segmentation');
  const segBullets = bulletsOf(seg).map((b) => r.fromBullet(b));
  const byLabel = (l) => segBullets.find((b) => (b.label ?? '').toLowerCase() === l);
  const segRows = tableOf(seg).map((x) => ({
    c: r.fromRow(x, 'Why here'), name: clean(x.cells.Persona), pos: num(x.cells.Position), why: clean(x.cells['Why here']),
  }));
  const primaryText = byLabel('primary')?.text ?? '';
  out.seg = {
    conf: confOf(seg), variable: byLabel('variable') ?? null, low: byLabel('low end') ?? null, high: byLabel('high end') ?? null, primary: byLabel('primary') ?? null,
    rows: segRows, notes: segBullets.filter((b) => !b.label),
  };

  const GROUPS = ['Day in the life', 'Goals', 'Needs', 'Motivations', 'Frustrations', 'Previous experience', 'Technology', 'Design implications'];
  out.people = doc.sections.filter((s) => s.name.startsWith('Persona: ')).map((p) => {
    const name = p.name.slice('Persona: '.length).trim();
    const hq = p.blocks.find((b) => b.type === 'quote');
    let hero = null;
    if (hq) {
      const note = hq.text.match(/\(\s*(Paraphrase[^)]*)\)/i)?.[1];
      const bare = hq.text.replace(/\s*\(\s*Paraphrase[^)]*\)\.?/i, '');
      const q = unquote(clean(bare));
      q.text = splitCite(q.text).t;
      const people = [...new Set(hq.tags.flatMap((t) => t.participants))];
      hero = {
        c: r.claim(bare, hq.tags, {}, hq.line), text: q.text, kind: q.quoted && people.length ? 'participant' : 'public', p: people,
        ...(note ? { note: clean(note).replace(/^Paraphrase:?\s*/i, '').replace(/\.$/, '') } : {}),
      };
    }
    const groups = GROUPS.map((g) => {
      const sub = subsection(p, g);
      return sub ? { name: g, items: sub.blocks.filter((b) => b.type === 'bullet').map((b) => r.fromBullet(b)) } : null;
    }).filter(Boolean);
    const one = (n) => { const b = subsection(p, n)?.blocks.find((x) => x.type === 'bullet'); return b ? r.fromBullet(b) : null; };
    return {
      name, key: p.name, slug: slug(name), primary: !!primaryText && primaryText.toLowerCase().startsWith(name.toLowerCase()), conf: confOf(p), hero, groups,
      least: one('Least evidenced claim'), wrong: one('How we would know this is wrong'),
    };
  });
  r.sweep(doc);
  return r.finish(out);
}

function journeysView(ctx) {
  const doc = ctx.docs.journeys; if (!doc) return null;
  const r = new Registry(ctx);
  const out = { name: ctx.name, banner: bannerOf(doc) };
  const riskOrder = ['contradicted', 'untested', 'mixed', 'backed', 'confirmed'];

  out.items = doc.sections.filter((s) => s.name.startsWith('Journey: ')).map((j) => {
    const head = j.name.slice('Journey: '.length);
    const comma = head.indexOf(',');
    const who = comma > 0 ? head.slice(0, comma).trim() : head.trim();
    const title = sentence(comma > 0 ? head.slice(comma + 1).trim() : head.trim());
    const bullets = (n) => (subsection(j, n)?.blocks ?? []).filter((b) => b.type === 'bullet').map((b) => r.fromBullet(b));

    const stageRows = tableOf(subsection(j, 'Stages'));
    const stages = stageRows.map((x) => {
      const people = [...new Set(x.row.tags.flatMap((t) => t.participants))];
      return {
        c: r.fromRow(x, 'Phase'), phase: clean(x.cells.Phase), goal: clean(x.cells.Goal), doing: clean(x.cells.Doing), touch: clean(x.cells.Touchpoints), thinking: clean(x.cells.Thinking),
        emotion: num(x.cells.Emotion), pain: clean(x.cells['Pain points']), opp: clean(x.cells.Opportunities), ...(people.length ? { backed: 1 } : {}),
      };
    });

    const moments = (subsection(j, 'Moments that matter')?.blocks ?? []).filter((b) => b.type === 'bullet').map((b) => {
      const { label, rest } = labelOf(b.text);
      return { c: r.claim(rest, b.tags, {}, b.line), phase: label ? clean(label) : null, text: clean(rest) };
    });

    let low = null;
    stages.forEach((s, i) => { if (s.emotion !== null && (low === null || s.emotion < stages[low].emotion)) low = i; });
    let lowInfo = null;
    if (low !== null) {
      const tags = r.cl[stages[low].c].g.filter((t) => t.k === 'b');
      const states = tags.map((t) => tagState({ kind: 'belief', verdict: t.v === 'no evidence' ? null : t.v }));
      const worst = riskOrder.find((s) => states.includes(s));
      const pick = tags[states.indexOf(worst)];
      lowInfo = { i: low, belief: pick ? { id: pick.b, v: pick.v } : null };
    }
    return { who, key: j.name, slug: slug(`${who}-${title}`).slice(0, 40), title, conf: confOf(j), scenario: bullets('Scenario'), bounds: bullets('Boundaries').map((b) => b), stages, moments, low: lowInfo, future: null };
  });

  // A future journey is a proposal. It sits beside the journey it improves, matched on the persona's name.
  for (const f of doc.sections.filter((s) => s.name.startsWith('Future journey: '))) {
    const head = f.name.slice('Future journey: '.length);
    const comma = head.indexOf(',');
    const who = comma > 0 ? head.slice(0, comma).trim() : head.trim();
    const title = sentence(comma > 0 ? head.slice(comma + 1).trim() : head.trim());
    const stages = tableOf(subsection(f, 'Stages')).map((x) => ({
      c: r.fromRow(x, 'What changes', x.cells.Component ? { cmp: clean(x.cells.Component) } : {}), phase: clean(x.cells.Phase), pain: clean(x.cells["Today's pain"]), changes: clean(x.cells['What changes']), doing: clean(x.cells.Doing),
      thinking: clean(x.cells.Thinking), emotion: num(x.cells.Emotion), risk: clean(x.cells.Risk),
    }));
    const truths = (subsection(f, 'What has to be true')?.blocks ?? []).filter((b) => b.type === 'bullet').map((b) => {
      const { label, rest } = labelOf(b.text);
      const riskiest = !!label && /^riskiest$/i.test(clean(label));
      return { c: r.claim(rest, b.tags, {}, b.line), text: clean(rest), riskiest, label: riskiest ? null : label ? clean(label) : null };
    });
    truths.sort((a, b) => Number(b.riskiest) - Number(a.riskiest));
    const future = { key: f.name, title, stages, truths };
    const match = out.items.find((it) => !it.future && it.who.toLowerCase() === who.toLowerCase());
    if (match) match.future = future;
    else out.items.push({ who, key: f.name, slug: slug(`${who}-${title}`).slice(0, 40), title, conf: confOf(f), scenario: [], bounds: [], stages: [], moments: [], low: null, future });
  }
  r.sweep(doc);
  return r.finish(out);
}

function sourcesView(ctx, cited) {
  if (!Object.keys(ctx.ledger).length && !ctx.studies.length) return null;
  const r = new Registry(ctx);
  const rows = Object.entries(ctx.ledger).map(([id, s]) => ({ id, ...s, ...(cited[id] ? { in: [...cited[id]] } : {}) }));
  return { v: 1, name: ctx.name, rows, studies: ctx.studies, people: Object.keys(ctx.participants).length, cl: r.cl, src: {}, bel: {}, ptc: {} };
}

function overviewView(ctx, built) {
  const b = ctx.brief;
  const r = new Registry(ctx);
  const out = { name: ctx.name, idea: b.idea ?? '', forWho: b.for ?? '', market: b.market ?? '', decision: b.decision ?? '', created: b.created ?? '' };

  // beliefs, folded across every file
  const agg = {};
  const rank = VERDICT_RANK;
  const claimStates = {};
  let claimTotal = 0;
  for (const [view, data] of Object.entries(built)) {
    if (!data || view === 'sources' || view === 'overview') continue;
    for (const c of data.cl) {
      claimTotal++;
      claimStates[c.s] = (claimStates[c.s] ?? 0) + 1;
      for (const t of c.g) {
        if (t.k !== 'b') continue;
        const e = (agg[t.b] ??= { verdicts: new Set(), files: new Set(), seen: [], tags: [] });
        e.verdicts.add(t.v);
        e.files.add(view);
        e.tags.push(t);
        if (t.v === 'contradicted' || t.v === 'refuted') e.seen.push({ v: view, t: c.t, row: !!c.r });
      }
    }
  }
  // A file built in real mode cites no beliefs, so where each belief ended up is in the Outcome column of beliefs.md.
  for (const [id, b] of Object.entries(ctx.beliefs)) {
    if (!b.outcome) continue;
    const e = (agg[id] ??= { verdicts: new Set(), files: new Set(), seen: [], tags: [] });
    const tag = parseTag(`${id}: ${b.outcome}`);
    if (!needsBar(tag)) { e.verdicts.add('no evidence'); continue; }
    e.verdicts.add(tag.verdict);
    e.tags.push(...compactTags([tag]));
    const said = tag.participants.flatMap((p) => ctx.excerpts[p] ?? []).find((x) => new RegExp(`\\b${id}\\b`).test(x.b ?? '') && /^(observed|reported)$/i.test(x.grade) && !/^yes$/i.test(x.prompted));
    if (said && tag.verdict === 'refuted') e.seen.push({ v: 'summary', t: said.v, row: false });
  }
  const verdictOf = (e) => rank.find((v) => e.verdicts.has(v));
  const ids = Object.keys(agg).sort((x, y) => Number(x.slice(1)) - Number(y.slice(1)));
  const tally = { total: ids.length, confirmed: 0, refuted: 0, mixed: 0, contradicted: 0, backed: 0, untested: 0 };
  for (const id of ids) {
    const v = verdictOf(agg[id]);
    tally[v === 'supported' ? 'backed' : v === 'no evidence' ? 'untested' : v]++;
  }
  out.beliefs = { ...tally, recorded: Object.keys(ctx.beliefs).length };
  out.claims = { total: claimTotal, states: claimStates };

  const sureness = { 'sure': 0, 'fairly sure': 1, 'guessing': 2 };
  const WRONG = ['contradicted', 'refuted'];
  // One belief as a line of the overview, carrying only the tags behind these verdicts.
  const beliefClaim = (id, verdicts, s) => {
    const seenTag = new Set();
    const tags = agg[id].tags.filter((t) => { const k = JSON.stringify(t); if (!verdicts.includes(t.v) || seenTag.has(k)) return false; seenTag.add(k); return true; });
    r.bel.add(id);
    tags.forEach((t) => { t.s?.forEach((x) => r.src.add(x)); t.p?.forEach((x) => r.ptc.add(x)); });
    r.cl.push({ t: ctx.beliefs[id]?.t ?? id, s, g: tags });
    return r.cl.length - 1;
  };
  out.contradicted = ids.filter((id) => WRONG.includes(verdictOf(agg[id]))).map((id) => {
    const e = agg[id];
    const best = e.seen.find((x) => !x.row) ?? e.seen[0];
    return { c: beliefClaim(id, WRONG, 'contradicted'), b: id, verdict: verdictOf(e), files: [...e.files], seen: best ? [best] : [], certainty: ctx.beliefs[id]?.certainty ?? null };
  }).sort((x, y) => (sureness[x.certainty] ?? 3) - (sureness[y.certainty] ?? 3));

  out.contents = OUTPUT_VIEWS.filter((v) => built[v]).map((v) => {
    const d = built[v];
    const st = {};
    d.cl.forEach((c) => { st[c.s] = (st[c.s] ?? 0) + 1; });
    return { v, skill: SKILL[v], has: true, n: d.cl.length, plan: PLAN_VIEWS.includes(v), states: st, banner: d.banner ?? null };
  });
  out.hasPrimary = !!ctx.hasPrimary;
  out.suggest = suggestions(ctx, built);

  // Test first: the belief the evidence is against, then one nothing backs. Among equals, the one the founder is surest of, then the one most files lean on.
  const RISK = ['contradicted', 'no evidence', 'mixed'];
  const hold = (id) => sureness[ctx.beliefs[id]?.certainty] ?? 3;
  const riskiest = ids.filter((id) => RISK.includes(verdictOf(agg[id])))
    .sort((x, y) => RISK.indexOf(verdictOf(agg[x])) - RISK.indexOf(verdictOf(agg[y])) || hold(x) - hold(y) || agg[y].files.size - agg[x].files.size)[0];
  if (riskiest) {
    const verdict = verdictOf(agg[riskiest]);
    const s = tagState({ kind: 'belief', verdict: verdict === 'no evidence' ? null : verdict });
    out.next = { k: 'test', b: riskiest, c: beliefClaim(riskiest, [verdict], s), files: [...agg[riskiest].files], certainty: ctx.beliefs[riskiest]?.certainty ?? null, drop: ctx.beliefs[riskiest]?.drop ?? null, outcome: ctx.beliefs[riskiest]?.outcome ?? null };
  } else {
    const first = out.suggest[0];
    out.next = { k: 'skill', skill: first.skill, view: first.view };
  }
  return r.finish(out);
}


const peopleOf = (tags) => [...new Set(tags.flatMap((t) => t.participants ?? []))];
const rate = (s) => { const n = num(String(s).replace(/%$/, '')); if (n === null) return null; return n > 1 ? Math.min(1, n / 100) : n; };

function summaryView(ctx) {
  const doc = ctx.docs.summary; if (!doc) return null;
  const r = new Registry(ctx);
  const lines = (name) => { const s = section(doc, name); return { conf: confOf(s), items: bulletsOf(s).map((b) => r.fromBullet(b)) }; };
  const out = { name: ctx.name, short: lines('The short version') };
  const found = section(doc, 'What we found');
  const order = { strong: 0, some: 1, hint: 2 };
  const rows = tableOf(found).map((x, i) => {
    const strength = clean(x.cells.Strength).toLowerCase();
    const against = clean(x.cells.Against);
    return {
      c: r.fromRow(x, 'Finding'), finding: clean(x.cells.Finding), strength: strength in order ? strength : '', people: num(x.cells.People), orgs: num(x.cells.Orgs),
      against, none: against === '' || /^(none|no one|nobody|nothing)\b/i.test(against), i,
    };
  });
  rows.sort((a, b) => (order[a.strength] ?? 3) - (order[b.strength] ?? 3) || a.i - b.i);
  out.found = { conf: confOf(found), rows: rows.map(({ i, ...rest }) => rest), notes: bulletsOf(found).map((b) => r.fromBullet(b)) };
  out.disagree = lines('Where people disagreed');
  out.changes = lines('What this changes');
  out.unknown = lines('What we still do not know');
  r.sweep(doc);
  return r.finish(out);
}

function affinityView(ctx) {
  const doc = ctx.docs.affinity; if (!doc) return null;
  const r = new Registry(ctx);
  const out = { name: ctx.name };
  const themes = section(doc, 'Themes');
  out.themes = { conf: confOf(themes), rows: tableOf(themes).map((x) => ({
    c: r.fromRow(x, 'Theme'), theme: clean(x.cells.Theme), clusters: num(x.cells.Clusters), people: num(x.cells.People), orgs: num(x.cells.Orgs), tells: clean(x.cells['What it tells us']),
  })) };
  out.clusters = doc.sections.filter((s) => s.name.startsWith('Cluster: ')).map((sec) => {
    const notes = tableOf(sec).map((x) => ({ c: r.fromRow(x, 'Note'), who: clean(x.cells.Who), p: peopleOf(x.row.tags) }));
    const people = [...new Set(notes.flatMap((n) => n.p))];
    const orgs = [...new Set(people.map((p) => ctx.participants[p]?.org).filter(Boolean))];
    return { name: sentence(clean(sec.name.slice('Cluster: '.length))), conf: confOf(sec), notes, people: people.length, orgs: orgs.length };
  });
  const outl = section(doc, 'Outliers');
  out.outliers = { conf: confOf(outl), rows: tableOf(outl).map((x) => ({ c: r.fromRow(x, 'Note'), who: clean(x.cells.Who), why: clean(x.cells['Why it stands apart']) })) };
  const sur = section(doc, 'What surprised us');
  out.surprised = { conf: confOf(sur), items: bulletsOf(sur).map((b) => r.fromBullet(b)) };
  r.sweep(doc);
  return r.finish(out);
}

function loadCardSort(folder) {
  const raw = read(join(folder, 'cardsort.json'));
  if (!raw) return null;
  try {
    const j = JSON.parse(raw);
    const cards = j.cards, m = j.matrix;
    if (!Array.isArray(cards) || !Array.isArray(m) || cards.length < 2 || cards.length > 80 || m.length !== cards.length) return null;
    if (!m.every((row) => Array.isArray(row) && row.length === cards.length && row.every((v) => Number.isFinite(Number(v))))) return null;
    const names = cards.map((c) => String(c).slice(0, 80));
    const group = names.map(() => -1);
    (Array.isArray(j.groups) ? j.groups : []).forEach((g, gi) => (Array.isArray(g?.cards) ? g.cards : []).forEach((c) => { const at = names.indexOf(String(c).slice(0, 80)); if (at >= 0) group[at] = gi; }));
    return {
      cards: names, group, participants: Number.isFinite(Number(j.participants)) ? Number(j.participants) : null,
      matrix: m.map((row) => row.map((v) => Math.round(Math.max(0, Math.min(1, Number(v))) * 1000) / 1000)),
    };
  } catch { return null; }
}

function cardsortView(ctx) {
  const doc = ctx.docs.cardsort; if (!doc) return null;
  const r = new Registry(ctx);
  const out = { name: ctx.name };
  const study = section(doc, 'Study');
  out.study = { conf: confOf(study), items: bulletsOf(study).map((b) => r.fromBullet(b)) };
  const groups = section(doc, 'Groups');
  out.groups = { conf: confOf(groups), rows: tableOf(groups).map((x) => ({
    c: r.fromRow(x, 'Suggested label'), group: clean(x.cells.Group), label: clean(x.cells['Suggested label']), cards: clean(x.cells.Cards).split(/\s*[,;]\s*/).filter(Boolean), agreement: rate(x.cells.Agreement),
  })) };
  const home = section(doc, 'Cards without a clear home');
  out.homeless = { conf: confOf(home), rows: tableOf(home).map((x) => ({
    c: r.fromRow(x, 'Card'), card: clean(x.cells.Card), closest: clean(x.cells['Closest to']), share: rate(x.cells.Share), todo: clean(x.cells['What to do']),
  })) };
  const pairs = section(doc, 'Pairs people keep together');
  out.pairs = { conf: confOf(pairs), rows: tableOf(pairs).map((x) => {
    const a = clean(x.row.cells[0]), b = clean(x.row.cells[1]);
    return { c: r.claim(`${a} and ${b}`, x.row.tags, { r: 1 }, x.row.line), a, b, together: rate(x.cells.Together) };
  }) };
  const labels = section(doc, 'Labels people used');
  out.labels = { conf: confOf(labels), rows: tableOf(labels).map((x) => ({ c: r.fromRow(x, 'Label'), label: clean(x.cells.Label), people: num(x.cells.People), cards: clean(x.cells['Cards it held']) })) };
  const means = section(doc, 'What this means for the structure');
  out.means = { conf: confOf(means), items: bulletsOf(means).map((b) => r.fromBullet(b)) };
  out.map = loadCardSort(ctx.folder);
  r.sweep(doc);
  return r.finish(out);
}

function empathyView(ctx) {
  const doc = ctx.docs.empathy; if (!doc) return null;
  const r = new Registry(ctx);
  const out = { name: ctx.name, banner: bannerOf(doc) };
  const used = new Set();
  out.maps = doc.sections.filter((s) => s.name.startsWith('Map: ')).map((m) => {
    const head = m.name.slice('Map: '.length);
    const comma = head.indexOf(',');
    const who = comma > 0 ? head.slice(0, comma).trim() : head.trim();
    const moment = sentence(comma > 0 ? head.slice(comma + 1).trim() : head.trim());
    let sl = slug(`${who}-${moment}`).slice(0, 40) || 'map';
    while (used.has(sl)) sl += '-x';
    used.add(sl);
    const bullets = (n) => (subsection(m, n)?.blocks ?? []).filter((b) => b.type === 'bullet' || b.type === 'quote').map((b) => r.fromBullet(b));
    return { who, moment, key: m.name, slug: sl, conf: confOf(m), says: bullets('Says'), does: bullets('Does'), thinks: bullets('Thinks'), feels: bullets('Feels'), gaps: bullets('Say-do gaps') };
  });
  r.sweep(doc);
  return r.finish(out);
}

// The four study plans carry no evidence tags. Their text is kept as plain cells, read by heading and column name.
function planView(ctx, view) {
  const doc = ctx.docs[view]; if (!doc) return null;
  const r = new Registry(ctx);
  const items = (container) => (container?.blocks ?? []).filter((b) => b.type === 'bullet' || b.type === 'quote' || b.type === 'para').map((b) => {
    const { label, rest } = b.type === 'bullet' ? labelOf(b.text) : { label: null, rest: b.text };
    return { label: label ? clean(label) : null, text: clean(rest), depth: b.depth ?? 0 };
  }).filter((x) => x.text || x.label);
  const tables = (container) => (container?.blocks ?? []).filter((b) => b.type === 'table').map((b) => ({
    header: b.header.map(clean), rows: b.rows.map((row) => b.header.map((_, i) => clean(row.cells[i] ?? ''))),
  }));
  const sections = doc.sections.filter((s) => s.name !== 'Run notes').map((sec) => ({
    name: sec.name, items: items(sec), tables: tables(sec),
    subs: sec.subsections.map((sub) => ({ name: clean(sub.name), items: items(sub), tables: tables(sub) })),
  }));
  r.sweep(doc);
  return r.finish({ name: ctx.name, sections });
}

// The one or two skills worth running next, from what the folder already holds.
function suggestions(ctx, built) {
  const has = (v) => !!built[v];
  const want = [];
  if (ctx.hasPrimary && (has('affinity') || has('cardsort')) && !has('summary')) want.push('summary');
  if (ctx.hasPrimary && !has('affinity') && !has('cardsort')) want.push('affinity');
  if (!has('personas')) want.push('personas');
  if (!has('jobs')) want.push('jobs');
  if (!has('journeys')) want.push('journeys');
  if (!has('interview')) want.push('interview');
  if (has('interview') && !has('usability')) want.push('usability');
  if (!want.length) return [{ skill: command('create-research-repository') }];
  return want.slice(0, 2).map((v) => ({ view: v, skill: SKILL[v] }));
}

// ---------- the profile's book look ----------

const safeFont = (n) => (n && /^[A-Za-z0-9 ]{2,40}$/.test(n) ? n : null);
const safeColour = (c) => (c && (/^#[0-9a-fA-F]{3,8}$/.test(c) || /^(rgb|hsl)a?\([\d\s.,%/-]+\)$/.test(c)) ? c : null);

function luminance(hex) {
  const m = String(hex).match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return la === null || lb === null ? null : (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const BOOK_PENCIL = '#5e6a7b';
const BOOK_PAPER = '#f4f6f9';
const BOOK_INK = '#111b2e';
const COLOUR_SLOTS = [['paper', '--paper'], ['sheet', '--sheet'], ['sunk', '--sunk'], ['ink', '--ink'], ['rule', '--rule']];

// A belief is drawn in pencil and a finding in ink. A design system's colours must not close that gap.
export function safeLook(look, pencil = BOOK_PENCIL) {
  const out = { ...look };
  const notes = [];
  if (out.paper && luminance(out.paper) === null) {
    delete out.paper;
    notes.push('Book look: the Paper colour has to be a six-digit hex value, so the book keeps its own.');
  }
  if (out.ink) {
    const toPencil = contrast(out.ink, pencil);
    if (toPencil === null) {
      delete out.ink;
      notes.push('Book look: the Ink colour has to be a six-digit hex value, so the book keeps its own ink.');
    } else if (toPencil < 2) {
      delete out.ink;
      notes.push("Book look: the Ink colour is too close to the book's pencil colour to tell apart, so the book keeps its own ink.");
    }
  }
  if (contrast(out.ink ?? BOOK_INK, out.paper ?? BOOK_PAPER) < 4.5) {
    if (out.ink) {
      delete out.ink;
      notes.push('Book look: the Ink colour is too faint on the page colour to read, so the book keeps its own ink.');
    } else {
      delete out.paper;
      notes.push("Book look: the book's ink cannot be read on the Paper colour, so the book keeps its own page colour.");
    }
  }
  return { look: out, notes };
}

function lighten(hex) {
  const m = hex?.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (v) => Math.round(v + (255 - v) * 0.4).toString(16).padStart(2, '0');
  return `#${mix(n >> 16)}${mix((n >> 8) & 255)}${mix(n & 255)}`;
}

// ---------- the page ----------

function titleFor(name) {
  const words = name.replace(/[^A-Za-z0-9' -]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 3);
  return `${words.join(' ') || 'Research'} book`;
}

const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function compose(name, rawLook, opts = {}) {
  const { look, notes } = safeLook(rawLook);
  const css = readFileSync(join(SHELL, 'style.css'), 'utf8');
  const app = readFileSync(join(SHELL, opts.app ?? 'app.js'), 'utf8');
  const body = readFileSync(join(SHELL, opts.body ?? 'body.html'), 'utf8');
  const display = safeFont(look.display), text = safeFont(look.text), accent = safeColour(look.accent);

  const families = [];
  const add = (f, spec) => { if (!families.some((x) => x.startsWith(f.replace(/ /g, '+')))) families.push(`${f.replace(/ /g, '+')}${spec}`); };
  const std = ':wght@400;500;600;700';
  if (!display && !text) add('Newsreader', ':ital,opsz,wght@0,6..72,300..700;1,6..72,300..700');
  else {
    if (display) add(display, std);
    if (text) add(text, `:ital,wght@0,400;0,500;0,600;1,400`);
    if (!display) add('Newsreader', ':opsz,wght@6..72,300..700');
  }
  const fontHref = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`;
  const fam = (f) => `"${f}", `;
  const textStack = `${text ? fam(text) : '"Newsreader", '}"Iowan Old Style", "Charter", "Georgia", serif`;
  const displayStack = `${display ? fam(display) : text ? '' : '"Newsreader", '}${display ? '' : text ? fam(text) : ''}"Iowan Old Style", "Charter", "Georgia", serif`;

  const overrides = [`--f-text: ${textStack};`, `--f-display: ${displayStack};`];
  const colours = COLOUR_SLOTS.filter(([key]) => safeColour(look[key])).map(([key, token]) => `\n  ${token}: ${safeColour(look[key])};`).join('');
  const lightOverride = `${colours}${accent ? `\n  --correction: ${accent};` : ''}`;
  const darkAccent = accent ? `\n    --correction: ${lighten(accent)};` : '';
  const style = css
    .replace('/*FONTS*/', () => overrides.join('\n  '))
    .replace('/*ACCENT-LIGHT*/', () => lightOverride)
    .replace(/\/\*ACCENT-DARK\*\//g, () => darkAccent);

  const title = opts.title ?? titleFor(name);
  const scripts = (opts.views ?? VIEWS).map((v) => `<script src="data/${v}.js"></script>`).join('\n');
  const bodyHtml = body.replace('{{NAME}}', () => escAttr(name));
  const head = [
    `<title>${escAttr(title)}</title>`,
    '<meta name="claude:viewport-fit-sides" content="cover">',
    `<link rel="stylesheet" href="${fontHref.replace(/&/g, '&amp;')}">`,
    `<style>\n${style}</style>`,
  ].join('\n');
  const rest = `${bodyHtml}\n${scripts}\n<script>\n${app}</script>\n`;
  const fragment = `${head}\n${rest}`;
  const document = `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<meta name="color-scheme" content="light dark">\n${head}\n</head>\n<body>\n${rest}</body>\n</html>\n`;
  return { fragment, document, notes };
}

function jsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function writeIfChanged(path, content) {
  if (existsSync(path) && readFileSync(path, 'utf8') === content) return false;
  writeFileSync(path, content);
  return true;
}

// ---------- build ----------

// Reads the folder and works out every view, writing nothing.
export function assemble(folder) {
  const ctx = loadContext(folder);
  const built = {};
  built.summary = summaryView(ctx);
  built.affinity = affinityView(ctx);
  built.cardsort = cardsortView(ctx);
  built.empathy = empathyView(ctx);
  built.jobs = jobsView(ctx);
  built.personas = personasView(ctx);
  built.journeys = journeysView(ctx);
  for (const v of PLAN_VIEWS) built[v] = planView(ctx, v);

  const cited = {};
  for (const [view, data] of Object.entries(built)) {
    if (!data) continue;
    for (const id of Object.keys(data.src)) (cited[id] ??= new Set()).add(view);
  }
  for (const id of Object.keys(cited)) cited[id] = [...cited[id]].sort((a, b) => OUTPUT_VIEWS.indexOf(a) - OUTPUT_VIEWS.indexOf(b));
  built.sources = sourcesView(ctx, cited);
  built.overview = ctx.brief.title || Object.values(built).some(Boolean) ? overviewView(ctx, built) : null;
  return { ctx, built };
}

// Each excerpt is clipped, but on a short source they can still add up to most of it.
function shareNotes(folder, ctx, built) {
  const words = (text) => text.trim().split(/\s+/).filter(Boolean).length;
  const seen = new Map();
  for (const data of Object.values(built)) for (const p of Object.values(data?.ptc ?? {})) for (const e of p.ex ?? []) if (e.a && ctx.anchorFile[e.a]) seen.set(e.a, e.v);
  const published = {};
  for (const [anchor, text] of seen) published[ctx.anchorFile[anchor]] = (published[ctx.anchorFile[anchor]] ?? 0) + words(text);
  return Object.entries(published).flatMap(([file, count]) => {
    const path = join(folder, file);
    if (!existsSync(path)) return [];
    const share = Math.min(1, count / Math.max(words(readFileSync(path, 'utf8').replace(/<a id="[^"]*"><\/a>/g, '')), 1));
    return share > 0.5 ? [`Book: about ${Math.round(share * 100)}% of ${file} reaches the published page. If that is more than you want published, write Book: local only in brief.md.`] : [];
  });
}

export function build(folder) {
  const { ctx, built } = assemble(folder);

  const out = join(folder, 'book');
  const dataDir = join(out, 'data');
  mkdirSync(dataDir, { recursive: true });
  const changed = [];
  for (const view of VIEWS) {
    const file = join(dataDir, `${view}.js`);
    const data = built[view];
    if (!data) { if (existsSync(file)) { rmSync(file); changed.push(`data/${view}.js (removed)`); } continue; }
    const content = `window.BOOK=window.BOOK||{};\nwindow.BOOK.${view}=${jsonForScript(data)};\n`;
    if (writeIfChanged(file, content)) changed.push(`data/${view}.js`);
  }
  for (const f of readdirSync(dataDir)) if (!VIEWS.includes(f.replace(/\.js$/, ''))) { rmSync(join(dataDir, f)); changed.push(`data/${f} (removed)`); }

  const profile = readProfile(folder);
  const { fragment, document, notes } = compose(ctx.name, profile.look);
  for (const note of [...notes, driftNote(profile), ...shareNotes(folder, ctx, built)].filter(Boolean)) console.log(note);
  if (writeIfChanged(join(out, 'index.html'), fragment)) changed.push('index.html');
  if (writeIfChanged(join(out, 'open-me.html'), document)) changed.push('open-me.html');
  return { built, ctx, changed, out };
}

// ---------- the repository page ----------

export function repositoryData(folder) {
  const doc = parseFile(join(folder, 'repository.md'));
  const rowsOf = (name) => {
    const block = section(doc, name) && firstTable(section(doc, name));
    return block ? block.rows.map((row) => Object.fromEntries(block.header.map((h, i) => [h, row.cells[i] ?? '']))) : [];
  };
  const plain = (cells, key) => clean(cells[key] ?? '');
  const level = (v) => { const x = clean(v).toLowerCase(); return ['strong', 'some', 'hint'].includes(x) ? x : ''; };
  const project = (doc.title ?? '').replace(/^Research repository:\s*/i, '').trim() || sentence(basename(resolve(folder)).replace(/[-_]+/g, ' '));
  return {
    v: 1, name: project,
    how: bulletsOf(section(doc, 'How this works')).map((b) => { const { label, rest } = labelOf(b.text); return { label: label ? clean(label) : null, text: clean(rest) }; }),
    studies: rowsOf('Studies').map((c) => ({ study: plain(c, 'Study'), idea: plain(c, 'Idea'), when: plain(c, 'When'), method: plain(c, 'Method'), people: plain(c, 'People'), orgs: plain(c, 'Orgs'), where: plain(c, 'Where'), review: plain(c, 'Review by') })),
    insights: rowsOf('Insights').map((c) => ({
      insight: plain(c, 'Insight'), idea: plain(c, 'Idea'), strength: level(c.Strength), people: num(c.People), orgs: num(c.Orgs),
      tags: clean(c.Tags ?? '').split(/\s*[,;]\s*/).filter((t) => t && !/^(none|unknown)$/i.test(t)), source: plain(c, 'Source'), checked: plain(c, 'Last checked'),
    })),
    tags: rowsOf('Tags').map((c) => ({ tag: plain(c, 'Tag'), means: plain(c, 'Means') })),
    questions: rowsOf('Open questions').map((c) => ({ question: plain(c, 'Question'), idea: plain(c, 'Idea'), impact: plain(c, 'Impact').toLowerCase(), source: plain(c, 'Source') })),
    consent: rowsOf('Consent and retention').map((c) => ({ study: plain(c, 'Study'), agreed: plain(c, 'Participants agreed to'), until: plain(c, 'Raw files kept until'), status: plain(c, 'Status') })),
  };
}

export function buildRepository(root) {
  const data = repositoryData(root);
  const out = join(root, 'repository-book');
  const dataDir = join(out, 'data');
  mkdirSync(dataDir, { recursive: true });
  const changed = [];
  if (writeIfChanged(join(dataDir, 'repository.js'), `window.BOOK=window.BOOK||{};\nwindow.BOOK.repository=${jsonForScript(data)};\n`)) changed.push('data/repository.js');
  const words = data.name.replace(/[^A-Za-z0-9' -]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2);
  const { fragment, document } = compose(data.name, readProfile(root).look, { app: 'repository.js', body: 'repository.html', views: ['repository'], title: `${words.join(' ') || 'Research'} research repository` });
  if (writeIfChanged(join(out, 'index.html'), fragment)) changed.push('index.html');
  if (writeIfChanged(join(out, 'open-me.html'), document)) changed.push('open-me.html');
  return { data, changed, out };
}

// ---------- self test ----------

function walkStrings(value, fn, path = '') {
  if (typeof value === 'string') fn(value, path);
  else if (Array.isArray(value)) value.forEach((v, i) => walkStrings(v, fn, `${path}[${i}]`));
  else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) walkStrings(v, fn, `${path}.${k}`);
}

function loadData(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(readFileSync(file, 'utf8'), sandbox);
  return sandbox.window.BOOK;
}

// ---------- self-test helpers ----------

const ALLOWED_TAGS = new Set('a article aside b blockquote button cite code dd details div dl dt h1 h2 h3 header i input li nav ol p q section small span summary sup svg path circle rect polyline line table tbody td th thead tr ul'.split(' '));

// Everything the page writes is parsed back. Only our own tags and attributes may exist, so a payload that became markup shows up here.
function inertProblems(html) {
  const problems = [];
  const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s=>"'<]+(?:="[^"<>]*")?)*)\s*(\/?)>/g;
  const rest = html.replace(TAG, (m, close, name, attrs) => {
    if (!ALLOWED_TAGS.has(name.toLowerCase())) problems.push(`tag <${name}>`);
    for (const a of attrs.matchAll(/\s([^\s=>"']+)(?:="([^"]*)")?/g)) {
      const an = a[1], av = a[2] ?? '';
      if (/^on/i.test(an) || /^(srcdoc|formaction|action)$/i.test(an)) problems.push(`attribute ${an}`);
      if (/^(href|src)$/i.test(an) && !/^(https?:\/\/|#)/i.test(av)) problems.push(`${an}="${av.slice(0, 30)}"`);
      if (an === 'style' && !/^[a-z0-9\s:;.%\-()#,]*$/i.test(av)) problems.push('style value');
    }
    return '';
  });
  if (/[<>]/.test(rest)) problems.push('stray angle bracket in text');
  return problems;
}

const FIXED_SUBS = new Set(['Says', 'Does', 'Thinks', 'Feels', 'Say-do gaps', 'What has to be true', 'Scenario', 'Boundaries', 'Stages', 'Moments that matter', 'Day in the life', 'Goals', 'Needs', 'Motivations', 'Frustrations', 'Previous experience', 'Technology', 'Design implications', 'Least evidenced claim', 'How we would know this is wrong']);

// Puts a payload in every cell, label, bullet and name of a file, keeping tags and structure.
function poison(md, P) {
  const lines = md.split('\n');
  return lines.map((line, i) => {
    if (/^\s*\|/.test(line)) {
      if (/^\s*\|[\s:|-]+\|\s*$/.test(line) || /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')) return line;
      const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/);
      return '| ' + cells.map((c, k) => {
        const tags = (c.match(/\[[^\]]*\]/g) ?? []).join(' ');
        return k === 0 && /^[SBP]\d+$/.test(c.trim()) ? c.trim() : `${P} ${tags}`.trim();
      }).join(' | ') + ' |';
    }
    const h2 = line.match(/^## (Persona: |Journey: |Future journey: |Map: |Cluster: )/);
    if (h2) return `## ${h2[1]}${/^(Journey|Future journey|Map): $/.test(h2[1]) ? `${P}, ${P}` : P}`;
    const h3 = line.match(/^### (.*)$/);
    if (h3) return FIXED_SUBS.has(h3[1].trim()) ? line : `### ${P}`;
    const b = line.match(/^(\s*(?:[-*+]|\d+\.)\s+|\s*>\s?)(.*)$/);
    if (b) {
      const tags = (b[2].match(/\[[^\]]*\]/g) ?? []).join(' ');
      return `${b[1]}${/^\*\*/.test(b[2]) ? `**${P}:** ` : ''}${P} ${tags}`.trim();
    }
    return line;
  }).join('\n');
}

// A bullet under the last row of every table, as authors write them.
function addNotesUnderTables(md) {
  const lines = md.split('\n');
  const out = [];
  lines.forEach((line, i) => {
    out.push(line);
    if (/^\s*\|/.test(line) && !/^\s*\|/.test(lines[i + 1] ?? '')) out.push('- A note under the table. [S1]');
  });
  return out.join('\n');
}

// Runs the page's own script against a stub DOM and returns every string it writes as markup.
function renderEverything(folder) {
  const BOOK = {};
  for (const v of VIEWS) { const f = join(folder, 'book', 'data', `${v}.js`); if (existsSync(f)) Object.assign(BOOK, loadData(f)); }
  const recorded = [];
  const els = new Map();
  let onHash = null;
  const mk = (sel) => {
    const e = {
      hidden: false, textContent: '', style: {}, parentNode: null,
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute() {}, getAttribute() { return null; }, removeAttribute() {}, addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; },
      closest() { return null; }, contains() { return false; }, appendChild() {}, insertAdjacentElement() {}, focus() {}, remove() {}, scrollIntoView() {}, getBoundingClientRect() { return { top: 0, bottom: 0 }; },
    };
    Object.defineProperty(e, 'innerHTML', { set(v) { recorded.push({ sel, html: String(v) }); }, get() { return ''; } });
    return e;
  };
  const document = {
    querySelector: (s) => { if (!els.has(s)) els.set(s, mk(s)); return els.get(s); },
    querySelectorAll: () => [], addEventListener() {}, createElement: () => mk('created'), createRange: () => ({ selectNodeContents() {} }),
  };
  const location = { hash: '' };
  const hook = {};
  const win = {
    BOOK, __BOOK_TEST: hook, addEventListener: (t, f) => { if (t === 'hashchange') onHash = f; }, matchMedia: () => ({ matches: false }),
    scrollTo() {}, getSelection: () => ({ removeAllRanges() {}, addRange() {} }), innerHeight: 800,
  };
  vm.runInNewContext(readFileSync(join(SHELL, 'app.js'), 'utf8'), { window: win, document, location, navigator: {}, URL, setTimeout: () => 0, console });
  const pages = [];
  hook.nav = () => [];
  const grab = (name, hash) => { recorded.length = 0; location.hash = hash; onHash(); pages.push(...recorded.map((r) => ({ name, ...r }))); };
  for (const v of VIEWS) {
    grab(v, `#${v}`);
    if (v === 'personas') for (const x of BOOK.personas?.people ?? []) grab(`personas/${x.slug}`, `#personas/${x.slug}`);
    if (v === 'journeys') for (const x of BOOK.journeys?.items ?? []) { grab(`journeys/${x.slug}`, `#journeys/${x.slug}`); if (x.future) grab(`journeys/${x.slug}/future`, `#journeys/${x.slug}/future`); }
    if (v === 'empathy') for (const x of BOOK.empathy?.maps ?? []) grab(`empathy/${x.slug}`, `#empathy/${x.slug}`);
  }
  const notes = [];
  for (const [v, d] of Object.entries(BOOK)) for (const c of d.cl) notes.push({ name: `${v} note`, html: hook.noteHTML(c, d) });
  return { pages, notes, BOOK, navViews: hook.navViews ? hook.navViews() : [] };
}

function renderRepository(folder) {
  const BOOK = loadData(join(folder, 'repository-book', 'data', 'repository.js'));
  const recorded = [];
  const mk = (sel) => {
    const e = {
      hidden: false, textContent: '', style: {}, value: '',
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      setAttribute() {}, getAttribute() { return null; }, hasAttribute() { return false; }, addEventListener() {}, closest() { return null; },
    };
    Object.defineProperty(e, 'innerHTML', { set(v) { recorded.push({ sel, html: String(v) }); }, get() { return ''; } });
    return e;
  };
  const els = new Map();
  const document = { querySelector: (s) => { if (!els.has(s)) els.set(s, mk(s)); return els.get(s); }, querySelectorAll: () => [], addEventListener() {} };
  vm.runInNewContext(readFileSync(join(SHELL, 'repository.js'), 'utf8'), { window: { BOOK }, document, console });
  return recorded;
}

async function selfTest() {
  const { CLEAN } = await import('./fixtures/fixture.mjs');
  const { analyse, readPlacements } = await import('./card-sort.mjs');
  const sortJson = (cards = ['Book', 'Cancel', 'Move', 'Invoices', 'Reports', 'Profile']) => {
    const rows = ['participant,card,category'];
    for (let p = 1; p <= 6; p++) cards.forEach((c, i) => rows.push(`P${p},${c},${i < cards.length / 2 ? 'Appointments' : p < 3 ? 'Money' : 'Admin'}`));
    return JSON.stringify(analyse(readPlacements(rows.join('\n'))));
  };
  let failures = 0;
  const fail = (msg) => { failures++; console.log(`FAIL  ${msg}`); };
  const pass = (msg) => console.log(`ok    ${msg}`);

  const dir = mkdtempSync(join(tmpdir(), 'book-self-'));
  const write = (folder, files) => { mkdirSync(folder, { recursive: true }); for (const [f, c] of Object.entries(files)) writeFileSync(join(folder, f), c); };
  try {
    // 1. the full fixture: every view has data, no raw tag, every claim has a state
    const full = join(dir, 'full');
    write(full, { ...CLEAN, 'cardsort.json': sortJson(), 'brief.md': '# Brief: Test idea\n\n- **Idea:** A test.\n- **For:** Nobody.\n- **Decision:** Whether to ship.\n- **Book:** not published\n' });
    const first = build(full);
    const data = {};
    for (const view of VIEWS) {
      const file = join(full, 'book', 'data', `${view}.js`);
      if (!existsSync(file)) { fail(`${view}: no data file from the full fixture`); continue; }
      Object.assign(data, loadData(file));
    }
    for (const view of VIEWS) {
      const d = data[view];
      if (!d) { fail(`${view}: data file did not define window.BOOK.${view}`); continue; }
      let bad = 0;
      walkStrings(d, (s, p) => { if (RAW_TAG.test(s) && !p.includes('.u')) { bad++; fail(`${view}: raw tag survives in ${p}: ${s.slice(0, 60)}`); } });
      for (const [i, c] of (d.cl ?? []).entries()) if (!STATES.includes(c.s)) { bad++; fail(`${view}: claim ${i} has no state`); }
      // every id a claim cites resolves inside its own file
      for (const c of d.cl ?? []) for (const t of c.g) {
        for (const s of t.s ?? []) if (!d.src[s]) { bad++; fail(`${view}: ${s} cited but its record is missing from the file`); }
        if (t.b && !d.bel[t.b]) { bad++; fail(`${view}: ${t.b} cited but its record is missing from the file`); }
      }
      if (!bad) pass(`${view}: data present, ${(d.cl ?? []).length} claims, all with a state, no raw tags, cited records included`);
    }
    if (data.personas && !data.personas.people.length) fail('personas: no persona found');
    if (data.journeys && !(data.journeys.items[0]?.stages.length)) fail('journeys: no stages');
    if (data.overview && !data.overview.next) fail('overview: no next step');
    if (data.overview?.next?.k !== 'test' || data.overview.next.b !== 'B3') fail('overview: the contradicted belief should be the one to test first'); else pass('overview: the contradicted belief is the one to test first');
    // the new views
    if (!data.summary?.found.rows.length || data.summary.found.rows[0].strength !== 'strong') fail('summary: the rated finding did not come through'); else pass('summary: strength is read as strong');
    if (!data.affinity?.clusters.length || !data.affinity.themes.rows.length) fail('affinity: themes or clusters missing'); else pass('affinity: themes and a cluster');
    if (!data.cardsort?.map || data.cardsort.map.cards.length !== data.cardsort.map.matrix.length) fail('cardsort: the matrix from cardsort.json did not come through'); else pass(`cardsort: a ${data.cardsort.map.cards.length} card matrix from cardsort.json`);
    if (!data.empathy?.maps.length) fail('empathy: no map'); else pass('empathy: a map with its four quadrants');
    for (const v of PLAN_VIEWS) if (!data[v]?.sections.length) fail(`${v}: no sections`); else pass(`${v}: ${data[v].sections.length} sections read by heading`);
    if (!data.journeys?.items[0]?.future?.stages.length) fail('journeys: the future journey did not pair with today'); else pass('journeys: a future journey sits beside today');
    if (!data.journeys?.cl.some((c) => c.s === 'proposed')) fail('journeys: no claim has the proposed state'); else pass('journeys: future lines carry the proposed state');
    const noCard = join(dir, 'nocard');
    write(noCard, { 'cardsort.md': CLEAN['cardsort.md'], 'brief.md': '# Brief: Test idea\n\n- **Idea:** x\n- **Decision:** y\n' });
    build(noCard);
    if (loadData(join(noCard, 'book', 'data', 'cardsort.js')).cardsort.map !== null) fail('cardsort: with no JSON the map should be null'); else pass('cardsort: with no cardsort.json the tables stand alone');
    const stub = renderEverything(noCard);
    if (/class="heat"/.test(stub.pages.map((x) => x.html).join(''))) fail('cardsort: a heatmap was drawn without data'); else pass('cardsort: no heatmap is drawn without cardsort.json');
    // real mode reads plainly
    const real = join(dir, 'real');
    const realize = (f) => CLEAN[f].replace(/^Proto: .*$/m, 'From research: 5 people, 5 organisations. Every line traces to what they did or said.');
    write(real, { 'brief.md': '# Brief: Test idea\n\n- **Idea:** x\n- **Decision:** y\n', 'sources.md': CLEAN['sources.md'], 'primary.md': CLEAN['primary.md'], 'personas.md': realize('personas.md'), 'jobs.md': realize('jobs.md'), 'journeys.md': realize('journeys.md'), 'empathy.md': realize('empathy.md') });
    build(real);
    const rr = renderEverything(real);
    for (const v of ['personas', 'jobs', 'journeys', 'empathy']) {
      const html = rr.pages.filter((x) => x.name.startsWith(v)).map((x) => x.html).join('');
      if (!/From research: 5 people, 5 organisations/.test(html)) fail(`${v}: the real-mode line is not shown`);
      else if (/beliefs validated|class="proto"|class="tally"/.test(html)) fail(`${v}: real mode still shows pencil counts`);
      else pass(`${v}: real mode shows its line and no pencil counts`);
    }
    // a real-mode book still says where each belief ended up
    const settled = join(dir, 'settled');
    const withOutcomes = CLEAN['beliefs.md'].replace('| Recorded |', '| Recorded | Outcome |')
      .replace('| create-jtbd | 2026-11-01 |', '| create-jtbd | 2026-11-01 | confirmed S4 P1-P5 |')
      .replace('| create-persona | 2026-11-01 |', '| create-persona | 2026-11-01 | not settled: 0 of 5 organisations |')
      .replace('| create-journey-map | 2026-11-01 |', '| create-journey-map | 2026-11-01 | refuted S4 P1-P5 |');
    const noBeliefTags = (f) => realize(f).replace(/\[B\d+: ([a-z ]+)(?: (S\d+[^\]]*))?\]/g, (m, v, refs) => (refs ? `[${refs}]` : '[gap]'));
    write(settled, { 'brief.md': '# Brief: Test idea\n\n- **Idea:** x\n- **Decision:** y\n', 'sources.md': CLEAN['sources.md'], 'primary.md': CLEAN['primary.md'].replace('| no | B1 | [S4 P1](', '| no | B1, B3 | [S4 P1]('), 'beliefs.md': withOutcomes, 'personas.md': noBeliefTags('personas.md') });
    const settledOverview = build(settled).built.overview;
    const counts = settledOverview.beliefs;
    if (counts.total !== 3 || counts.confirmed !== 1 || counts.refuted !== 1 || counts.untested !== 1) fail(`overview: outcomes were not counted: ${JSON.stringify(counts)}`); else pass('overview: a settled or unsettled outcome is counted');
    if (settledOverview.contradicted[0]?.b !== 'B3' || !settledOverview.contradicted[0].verdict.startsWith('refuted')) fail('overview: a refuted outcome is not listed as wrong'); else pass('overview: a refuted outcome is listed as wrong');
    if (!/still write it in the diary/.test(settledOverview.contradicted[0]?.seen[0]?.t ?? '')) fail('overview: a refuted outcome does not say what people did'); else pass('overview: a refuted outcome says what people did');
    const unmarked = join(dir, 'unmarked');
    write(unmarked, { 'brief.md': '# Brief: Test idea\n\n- **Idea:** x\n- **Decision:** y\n', 'sources.md': CLEAN['sources.md'], 'primary.md': CLEAN['primary.md'], 'beliefs.md': CLEAN['beliefs.md'], 'personas.md': noBeliefTags('personas.md') });
    build(unmarked);
    if (!/3 beliefs recorded, none with an outcome yet/.test(renderEverything(unmarked).pages.filter((x) => x.name === 'overview').map((x) => x.html).join(''))) fail('overview: recorded beliefs with no outcome are denied'); else pass('overview: recorded beliefs with no outcome are said to exist');
    if (settledOverview.next?.b !== 'B2') fail(`overview: the belief to test first should be the unsettled one, got ${settledOverview.next?.b}`); else pass('overview: an unsettled outcome is the one to test first');
    const settledHtml = renderEverything(settled).pages.filter((x) => x.name === 'overview').map((x) => x.html).join('');
    if (!/1<\/span> of 3 beliefs validated/.test(settledHtml) || !/Patients never reschedule/.test(settledHtml) || /undefined/.test(settledHtml)) fail('overview: outcomes do not render cleanly'); else pass('overview: outcomes render in the book');

    // a job map of any length from 3 to 10 stages
    const ten = join(dir, 'ten');
    const rowsTen = Array.from({ length: 10 }, (_, i) => `| Stage ${i + 1} | Does ${i} | Hurts | [S4 P1-P2] |`).join('\n');
    write(ten, { 'brief.md': '# Brief: Test idea\n\n- **Idea:** x\n- **Decision:** y\n', 'sources.md': CLEAN['sources.md'], 'primary.md': CLEAN['primary.md'], 'jobs.md': CLEAN['jobs.md'].replace(/(\| Stage \| What they do \| Where it hurts \| Evidence \|\n\|---\|---\|---\|---\|\n)(?:\|.*\n)+/, `$1${rowsTen}\n`) });
    build(ten);
    const tj = renderEverything(ten).pages.filter((x) => x.name === 'jobs').map((x) => x.html).join('');
    if ((tj.match(/class="seg8"/g) ?? []).length !== 10 || !/--ns:5/.test(tj)) fail('jobs: ten stages were not all drawn in the strip'); else pass('jobs: a ten stage map is drawn from its rows');

    // 2. fragment and document contracts
    const index = readFileSync(join(full, 'book', 'index.html'), 'utf8');
    const open = readFileSync(join(full, 'book', 'open-me.html'), 'utf8');
    if (!index.startsWith('<title>')) fail('index.html does not start with <title>');
    else if (/<(?:!doctype|html|head|body)[\s>]/i.test(index)) fail('index.html carries doctype, html, head or body tags');
    else if (!index.includes('<meta name="claude:viewport-fit-sides" content="cover">')) fail('index.html lacks the viewport-fit-sides meta');
    else if (!/^<title>[^<]+<\/title>\n<meta[^>]*>\n<link[^>]*>\n<style>/.test(index)) fail('index.html does not open with title, meta, fonts link, style');
    else pass('index.html is a clean fragment');
    if (!open.startsWith('<!doctype html>')) fail('open-me.html is not a normal document');
    else pass('open-me.html is a normal document');
    const externals = [...index.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('https://fonts.googleapis.com/'));
    if (externals.length) fail(`external requests other than Google Fonts: ${externals.join(', ')}`); else pass('no external requests beyond Google Fonts');

    // 3. a second run changes nothing
    const again = build(full);
    if (again.changed.length) fail(`a second run rewrote: ${again.changed.join(', ')}`); else pass('a second run rewrites nothing');

    // 4. views with no output have no data file and an empty state in the page
    const sparse = join(dir, 'sparse');
    write(sparse, { 'brief.md': '# Brief: Sparse idea\n\n- **Idea:** x\n- **Decision:** y\n', 'sources.md': CLEAN['sources.md'], 'personas.md': CLEAN['personas.md'] });
    const s2 = build(sparse);
    const sparsePages = renderEverything(sparse).pages;
    for (const view of OUTPUT_VIEWS.filter((v) => v !== 'personas' && SKILL[v])) {
      const page = sparsePages.filter((x) => x.name === view).map((x) => x.html).join('');
      if (existsSync(join(sparse, 'book', 'data', `${view}.js`))) fail(`${view}: a data file exists though the folder has no ${view} output`);
      else if (!/Nothing here yet/.test(page) || !page.includes(SKILL[view])) fail(`${view}: the page has no empty state naming ${SKILL[view]}`);
      else pass(`${view}: no data file, and the page names ${SKILL[view]} for its empty state`);
    }
    const navSparse = renderEverything(sparse).navViews;
    if (navSparse.join() !== 'overview,personas,sources') fail(`the navigation lists views with no output: ${navSparse.join()}`); else pass('the navigation lists only views with content');
    if ((s2.built.overview?.suggest ?? []).length < 1 || (s2.built.overview.suggest.length > 2)) fail('overview: it should suggest one or two skills'); else pass(`overview: suggests ${s2.built.overview.suggest.map((x) => x.skill).join(' and ')}`);
    if (s2.built.overview?.next?.k !== 'skill') fail('overview: with outputs missing, the next step should be a skill');
    else pass(`overview: next step is ${s2.built.overview.next.skill} when outputs are missing`);
    const untested = join(dir, 'untested');
    write(untested, { 'brief.md': '# Brief: Sparse idea\n\n- **Idea:** x\n- **Decision:** y\n', 'sources.md': CLEAN['sources.md'], 'personas.md': CLEAN['personas.md'].replace('[B2: supported S2]', '[B2: no evidence]') });
    const untestedNext = build(untested).built.overview.next;
    if (untestedNext.k !== 'test' || untestedNext.b !== 'B2') fail('overview: a belief with no evidence should be the one to test first'); else pass('overview: a belief with no evidence is tested first when none is contradicted');
    if (!renderEverything(untested).pages.some((x) => x.name === 'overview' && /Test this first/.test(x.html))) fail('overview: the belief to test first is not shown'); else pass('overview: the belief to test first is shown');

    // 5. the title is a real name of two to four words
    const words = index.match(/^<title>(.*)<\/title>/)[1].split(/\s+/).length;
    if (words < 2 || words > 4) fail(`title has ${words} words`); else pass(`title has ${words} words`);

    // 6. every tagged line reaches the data, including bullets that sit under a table
    const FILES = FILE;
    const brief = '# Brief: Test idea\n\n- **Idea:** A test.\n- **For:** Nobody.\n- **Decision:** Whether to ship.\n- **Book:** not published\n';
    const noted = join(dir, 'noted');
    write(noted, { ...Object.fromEntries(Object.entries(CLEAN).map(([f, c]) => [f, Object.values(FILE).includes(f) ? addNotesUnderTables(c) : c])), 'brief.md': brief });
    build(noted);
    let sawMore = false;
    for (const [label, folder] of [['the fixture', full], ['the fixture with a note under every table', noted]]) {
      for (const view of OUTPUT_VIEWS) {
        const doc = parseFile(join(folder, FILES[view]));
        const expected = doc.sections.filter((x) => x.name !== 'Run notes').flatMap((x) => claimsOf(x)).filter((c) => c.tags.length).length;
        const d = loadData(join(folder, 'book', 'data', `${view}.js`))[view];
        if (d.more?.length) sawMore = true;
        if (d.cl.length !== expected) fail(`${view} in ${label}: the file has ${expected} claims, the data has ${d.cl.length}`);
        else pass(`${view} in ${label}: ${expected} claims in the file, ${d.cl.length} in the data`);
      }
    }
    if (!sawMore) fail('bullets under tables never reached a "more" list, so the test proves nothing');

    // a citation lands on the passage it cites, and the book never adds up to a transcript
    const cited = join(dir, 'cited');
    const longFile = 'evidence/S4-interviews.md';
    const longWords = Array.from({ length: 90 }, (_, i) => `word${i}`).join(' ');
    const moreRows = [2, 3, 4, 5, 6, 7, 8].map((n) => `| "${n === 2 ? longWords : `Excerpt number ${n}`}" | workaround | Paper | reported | no | none | [S4 P1](${longFile}#p1-excerpt-${n}) |`).join('\n');
    write(cited, { 'brief.md': '# Brief: Test idea\n\n- **Idea:** x\n- **Decision:** y\n', 'sources.md': CLEAN['sources.md'], 'beliefs.md': CLEAN['beliefs.md'], 'primary.md': `${CLEAN['primary.md'].trimEnd()}\n${moreRows}\n`, 'personas.md': CLEAN['personas.md'].replace('- Answers the phone between patients. [S4 P1-P2]', `- Answers the phone between patients. [S4 P1](${longFile}#p1-excerpt-7)`).replace('- Fewer calls. [S4 P1-P2]', '- Fewer calls, see [the transcript](inbox/maya-raw.md). [S4 P1-P2]') });
    build(cited);
    const citedData = loadData(join(cited, 'book', 'data', 'personas.js')).personas;
    const kept = (citedData.ptc.P1?.ex ?? []).map((e) => e.a);
    if (kept.join() !== [1, 2, 3, 4, 5, 6, 7].map((n) => `p1-excerpt-${n}`).join()) fail(`citation: expected excerpts 1 to 7 for P1, got ${kept.join()}`); else pass('citation: the limit of 6 never hides a cited excerpt');
    if (!citedData.cl.some((c) => c.g.some((t) => t.a === 'p1-excerpt-7'))) fail('citation: the claim does not carry its anchor'); else pass('citation: the claim carries its anchor');
    const clipped = citedData.ptc.P1?.ex?.[1]?.v ?? '';
    if (clipped.split(/\s+/).length !== 60 || !clipped.endsWith('…')) fail(`citation: a long excerpt was not clipped to 60 words: ${clipped.split(/\s+/).length}`); else pass('citation: a long excerpt stops at 60 words');
    const published = readdirSync(join(cited, 'book', 'data')).map((f) => readFileSync(join(cited, 'book', 'data', f), 'utf8')).join('');
    if (/evidence\/|inbox\//.test(published)) fail('citation: a first-party file path reached the published data'); else pass('citation: no first-party file path is published');

    // a component line reaches the page
    const named = join(dir, 'named');
    write(named, { 'brief.md': '# Brief: Test idea\n\n- **Idea:** x\n- **Decision:** y\n', 'sources.md': CLEAN['sources.md'], 'primary.md': CLEAN['primary.md'], 'beliefs.md': CLEAN['beliefs.md'], 'personas.md': CLEAN['personas.md'].replace('- Works one-handed. [inference S4, S1]', '- Works one-handed. [inference S4, S1]\n  - **Component:** `ws_accordion`') });
    build(named);
    const namedClaim = loadData(join(named, 'book', 'data', 'personas.js')).personas.cl.find((c) => /one-handed/.test(c.t));
    if (namedClaim?.cmp !== 'ws_accordion') fail(`component: the claim carries ${namedClaim?.cmp}`); else pass('component: the claim carries its component');

    // the look comes from the project's profile, and never makes a belief and a finding look alike
    const lookProject = (name, lines, extra = {}) => {
      const root = join(dir, name);
      write(root, { '.research-profile.md': `# Research profile: Test\n\n## Book look\n\n${lines.map((l) => `- ${l}`).join('\n')}\n`, ...extra });
      const folder = join(root, 'idea');
      write(folder, { 'brief.md': '# Brief: Test idea\n\n- **Idea:** x\n- **Decision:** y\n', 'sources.md': CLEAN['sources.md'], 'primary.md': CLEAN['primary.md'], 'personas.md': CLEAN['personas.md'], 'beliefs.md': CLEAN['beliefs.md'] });
      const logged = [];
      const realLog = console.log;
      console.log = (...args) => logged.push(args.join(' '));
      let built;
      try { built = build(folder); } finally { console.log = realLog; }
      return { css: readFileSync(join(folder, 'book', 'index.html'), 'utf8').split('</style>')[0], logged, built };
    };
    const full8 = lookProject('look8', ['Display font: Fraunces', 'Text font: Inter', 'Accent: #E54D4D', 'Paper: #FAFAF9', 'Sheet: #FFFFFF', 'Sunk: #F5F5F4', 'Ink: #1C1917', 'Rule: #D6D3D1']);
    for (const want of ['--paper: #FAFAF9;', '--sheet: #FFFFFF;', '--sunk: #F5F5F4;', '--ink: #1C1917;', '--rule: #D6D3D1;', '--correction: #E54D4D;']) {
      if (!full8.css.includes(want)) fail(`look: the page has no ${want}`); else pass(`look: the page has ${want}`);
    }
    if ((full8.css.match(/--paper: #FAFAF9;/g) ?? []).length !== 1) fail('look: paper reached the dark palette too'); else pass('look: dark values change only the accent');
    const nearPencil = lookProject('nearpencil', ['Ink: #5e6a7c']);
    if (nearPencil.css.includes('--ink: #5e6a7c;')) fail('look: an ink too close to pencil was applied'); else pass('look: an ink too close to pencil is dropped');
    if (!nearPencil.logged.some((l) => /pencil/i.test(l))) fail('look: dropping the ink says nothing'); else pass('look: dropping the ink is reported');
    const badPaper = lookProject('badpaper', ['Paper: url(x)']);
    if (badPaper.css.includes('url(x)')) fail('look: an unsafe value reached the CSS'); else pass('look: an unsafe value is ignored');
    const drift = lookProject('drift', ['Accent: #E54D4D'], {});
    if (drift.logged.some((l) => /init/.test(l))) fail('look: no tokens named, yet a drift note printed'); else pass('look: no drift note without a token file');
    const driftRoot = join(dir, 'drift2');
    write(driftRoot, { '.research-profile.md': '# Research profile: Test\n\n## Design system\n\n- Tokens: tokens.css\n- Tokens hash: 000000000000\n', 'tokens.css': ':root{}' });
    const driftFolder = join(driftRoot, 'idea');
    write(driftFolder, { 'brief.md': '# Brief: Test idea\n\n- **Idea:** x\n- **Decision:** y\n', 'sources.md': CLEAN['sources.md'] });
    const driftLog = [];
    const keepLog = console.log;
    console.log = (...args) => driftLog.push(args.join(' '));
    try { build(driftFolder); } finally { console.log = keepLog; }
    if (driftLog.filter((l) => /\/ux-os:init/.test(l)).length !== 1) fail(`look: expected one drift note, got ${driftLog.filter((l) => /\/ux-os:init/.test(l)).length}`); else pass('look: a changed token file prints one note');
    rmSync(join(driftRoot, 'tokens.css'));
    try { build(driftFolder); pass('look: a missing token file does not stop the book'); } catch (e) { fail(`look: a missing token file crashed the book: ${e.message}`); }

    for (const [name, line, value] of [['rgbink', 'Ink: rgb(94, 106, 124)', '--ink: rgb('], ['shortink', 'Ink: #5e6a', '--ink: #5e6a'], ['darkpaper', 'Paper: #111111', '--paper: #111111']]) {
      const seen = lookProject(name, [line]);
      if (seen.css.includes(value)) fail(`look: ${line} was applied`); else pass(`look: ${line} is dropped`);
      if (!seen.logged.some((l) => /^Book look:/.test(l))) fail(`look: dropping ${line} says nothing`); else pass(`look: dropping ${line} is reported`);
    }
    const shareOf = (name, evidenceText) => {
      const folder = join(dir, name);
      write(folder, { 'brief.md': '# Brief: Test idea\n\n- **Idea:** x\n- **Decision:** y\n', 'sources.md': CLEAN['sources.md'], 'primary.md': CLEAN['primary.md'], 'personas.md': CLEAN['personas.md'], 'beliefs.md': CLEAN['beliefs.md'] });
      mkdirSync(join(folder, 'evidence'), { recursive: true });
      writeFileSync(join(folder, 'evidence', 'S4-interviews.md'), evidenceText);
      const logged = [];
      const realLog = console.log;
      console.log = (...args) => logged.push(args.join(' '));
      try { build(folder); } finally { console.log = realLog; }
      return logged.filter((l) => /reaches the published page/.test(l));
    };
    if (shareOf('shareshort', 'I still write it in the diary').length !== 1) fail('share: a short file that mostly reaches the page says nothing'); else pass('share: a short file that mostly reaches the page is reported');
    if (shareOf('sharelong', Array.from({ length: 2000 }, (_, i) => `word${i}`).join(' ')).length !== 0) fail('share: a long file is reported'); else pass('share: a long file is not reported');

    // 7. nothing from the markdown can become markup
    const PAYLOAD = '<img src=x onerror=window.__pwn=1>"\'><script>window.__pwn=2</script>" onmouseover="window.__pwn=3';
    const evil = join(dir, 'evil');
    write(evil, { ...Object.fromEntries(Object.entries(CLEAN).map(([f, c]) => [f, poison(c, PAYLOAD)])), 'cardsort.json': sortJson([`${PAYLOAD} a`, `${PAYLOAD} b`, `${PAYLOAD} c`, `${PAYLOAD} d`]), 'brief.md': `# Brief: ${PAYLOAD}\n\n- **Idea:** ${PAYLOAD}\n- **For:** ${PAYLOAD}\n- **Market:** ${PAYLOAD}\n- **Decision:** ${PAYLOAD}\n- **Book:** not published\n` });
    build(evil);
    const rendered = renderEverything(evil);
    const everything = [...rendered.pages, ...rendered.notes];
    const broken = rendered.pages.filter((x) => /could not be drawn/.test(x.html));
    if (broken.length) fail(`a view failed to draw with payload data: ${broken.map((x) => x.name).join(', ')}`);
    let leaks = 0;
    for (const x of everything) for (const prob of inertProblems(x.html)) { leaks++; fail(`${x.name}: payload became markup (${prob})`); }
    if (!everything.some((x) => x.html.includes('&lt;img'))) fail('the payload never reached the page, so the injection test proves nothing');
    if (!leaks) pass(`a payload in every cell, label and name stays text across ${rendered.pages.length} pages and ${rendered.notes.length} notes`);
    if (!everything.some((x) => /class="heat"/.test(x.html) && x.html.includes('&lt;img'))) fail('the payload never reached the card sort map, so that part of the test proves nothing');
    for (const view of VIEWS) {
      const file = join(evil, 'book', 'data', `${view}.js`);
      if (existsSync(file) && /<\/script/i.test(readFileSync(file, 'utf8'))) fail(`${view}: data file can close its own script tag`);
    }
    const evilIndex = readFileSync(join(evil, 'book', 'index.html'), 'utf8');
    const evilTitle = evilIndex.match(/^<title>(.*)<\/title>/)[1];
    const evilName = evilIndex.match(/<p class="who"><b>(.*?)<\/b>/s)[1];
    if (/[<>"]/.test(evilTitle) || /[<>"]/.test(evilName)) fail('the idea name became markup in the page shell'); else pass('the idea name stays text in the title and header');

    // 8. unknown values are listed, not drawn, and first-party paths never ship
    const unk = join(dir, 'unknown');
    write(unk, {
      ...CLEAN, 'brief.md': brief,
      'personas.md': CLEAN['personas.md'].replace('| Sam | 90 |', '| Sam | unknown |'),
      'jobs.md': CLEAN['jobs.md'].replace('| Fewer no-shows | 5 | 2 |', '| Fewer no-shows | unknown | 2 |'),
    });
    build(unk);
    const u = {};
    for (const v of ['personas', 'jobs']) Object.assign(u, loadData(join(unk, 'book', 'data', `${v}.js`)));
    if (u.personas.seg.rows[0].pos !== null) fail('an unknown Position was given a number'); else pass('an unknown Position is kept as unknown');
    if (u.jobs.outcomes.rows[0].gap !== null) fail('an unknown Importance was given a gap'); else pass('an unknown Importance is not rated');
    const shown = renderEverything(unk);
    const textOf = (n) => shown.pages.filter((x) => x.name.startsWith(n)).map((x) => x.html).join('\n');
    if (!/position unknown, not placed/.test(textOf('personas'))) fail('an unplaced persona is not listed'); else pass('an unplaced persona is listed');
    if (!/Not rated/.test(textOf('jobs'))) fail('an unrated outcome does not say Not rated'); else pass('an unrated outcome says Not rated');
    const ledger = loadData(join(full, 'book', 'data', 'sources.js')).sources.rows.find((r) => r.k === 'first-party');
    if (!ledger || ledger.u !== '') fail('a first-party source still carries its Where path'); else pass('a first-party source carries no path');
    const own = renderEverything(full).pages.filter((x) => x.name === 'sources').map((x) => x.html).join('');
    if (/evidence\/S4/.test(own) || !/own research/.test(own)) fail('the sources view shows a first-party path or lacks "own research"'); else pass('the sources view says "own research" for first-party rows');

    // 9. the repository page
    const repo = join(dir, 'repo');
    write(repo, { 'repository.md': CLEAN['repository.md'] });
    const rb = buildRepository(repo);
    const rindex = readFileSync(join(repo, 'repository-book', 'index.html'), 'utf8');
    const ropen = readFileSync(join(repo, 'repository-book', 'open-me.html'), 'utf8');
    if (!rindex.startsWith('<title>') || /<(?:!doctype|html|head|body)[\s>]/i.test(rindex) || !ropen.startsWith('<!doctype html>')) fail('repository: the fragment or the document is not shaped as the host expects'); else pass('repository: index.html is a fragment and open-me.html a document');
    const rwords = rindex.match(/^<title>(.*)<\/title>/)[1].split(/\s+/).length;
    if (rwords < 2 || rwords > 4) fail(`repository: title has ${rwords} words`); else pass(`repository: title has ${rwords} words`);
    if (rb.data.insights.length !== 1 || rb.data.studies.length !== 1 || rb.data.questions.length !== 1 || rb.data.consent.length !== 1 || rb.data.insights[0].strength !== 'strong' || rb.data.insights[0].tags[0] !== 'habits') fail('repository: the tables did not come through by column name'); else pass('repository: insights, studies, open questions and consent read by column name');
    if (buildRepository(repo).changed.length) fail('repository: a second run rewrote files'); else pass('repository: a second run rewrites nothing');
    const repoExt = [...rindex.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('https://fonts.googleapis.com/'));
    if (repoExt.length) fail(`repository: external requests ${repoExt.join(', ')}`); else pass('repository: no external requests beyond Google Fonts');
    const evilRepo = join(dir, 'evilrepo');
    write(evilRepo, { 'repository.md': poison(CLEAN['repository.md'], PAYLOAD).replace(/^# .*$/m, `# Research repository: ${PAYLOAD}`) });
    buildRepository(evilRepo);
    const rr2 = renderRepository(evilRepo);
    let rleaks = 0;
    for (const x of rr2) for (const prob of inertProblems(x.html)) { rleaks++; fail(`repository: payload became markup (${prob})`); }
    if (!rr2.some((x) => x.html.includes('&lt;img'))) fail('repository: the payload never reached the page'); else if (!rleaks) pass('repository: a payload in every cell stays text');
    const rdata = readFileSync(join(evilRepo, 'repository-book', 'data', 'repository.js'), 'utf8');
    if (/<\/script/i.test(rdata)) fail('repository: data file can close its own script tag');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(failures ? `\n${failures} self-test failure(s)` : '\nself-test passed');
  process.exit(failures ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2];
  if (arg === '--self-test') await selfTest();
  else if (arg === '--repository') {
    const root = process.argv[3];
    if (!root || !existsSync(join(root, 'repository.md'))) { console.error('usage: node book.mjs --repository <research root>, a folder holding repository.md'); process.exit(2); }
    const { changed, out, data } = buildRepository(resolve(root));
    console.log(`repository page written to ${out}`);
    console.log(`${data.insights.length} insights, ${data.studies.length} studies, ${data.questions.length} open questions`);
    console.log(changed.length ? `changed: ${changed.join(', ')}` : 'nothing changed');
  }
  else if (!arg || !existsSync(arg)) { console.error('usage: node book.mjs <folder> | --repository <research root> | --self-test'); process.exit(2); }
  else {
    const { changed, built } = build(resolve(arg));
    const have = VIEWS.filter((v) => built[v]);
    console.log(`book written to ${join(resolve(arg), 'book')}`);
    console.log(`views with data: ${have.join(', ')}`);
    console.log(`views showing their empty state: ${VIEWS.filter((v) => !built[v]).join(', ') || 'none'}`);
    console.log(changed.length ? `changed: ${changed.join(', ')}` : 'nothing changed');
  }
}
