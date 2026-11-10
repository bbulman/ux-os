// Parses a research output into the structure check.mjs and book.mjs share.

import { readFileSync } from 'node:fs';

export const VERDICTS = ['supported', 'contradicted', 'no evidence', 'confirmed', 'refuted', 'mixed'];
// Which verdict a belief shows when its files disagree.
export const VERDICT_RANK = ['confirmed', 'refuted', 'mixed', 'contradicted', 'supported', 'no evidence'];
const BAR_VERDICTS = ['confirmed', 'refuted', 'mixed'];
// A tag may be written as a Markdown link: [S20 P3](evidence/S20-interview.md#p3-excerpt-4).
const TAG = /\[(S\d+[^\]]*|B\d+[^\]]*|inference[^\]]*|proposed[^\]]*|gap)\](?:\(([^()\s]+)\))?/g;

function references(text) {
  const sources = [...text.matchAll(/\bS\d+\b/g)].map((m) => m[0]);
  const participants = new Set();
  for (const m of text.matchAll(/\bP(\d+)-P?(\d+)\b/g)) {
    for (let i = Number(m[1]); i <= Number(m[2]); i++) participants.add(`P${i}`);
  }
  const withoutRanges = text.replace(/\bP\d+-P?\d+\b/g, '');
  for (const m of withoutRanges.matchAll(/\bP\d+\b/g)) participants.add(m[0]);
  return { sources: [...new Set(sources)], participants: [...participants] };
}

const REF = /^(?:S\d+(?:\s+P\d+(?:-P?\d+)?)?|P\d+(?:-P?\d+)?)$/;

function wellFormed(text) {
  return /\bS\d+\b/.test(text) && text.split(',').every((part) => REF.test(part.trim()));
}

function toLink(target) {
  if (!target) return null;
  const hash = target.indexOf('#');
  return hash === -1 ? { file: target, anchor: null } : { file: target.slice(0, hash), anchor: target.slice(hash + 1) };
}

export function parseTag(body, target = null) {
  const tag = { raw: `[${body}]`, kind: 'source', sources: [], participants: [], beliefs: [], verdict: null, threshold: false, valid: true, link: toLink(target) };
  if (body === 'gap') return { ...tag, kind: 'gap' };
  if (/^B\d+/.test(body)) {
    const belief = body.match(/^(B\d+):\s*(.*)$/);
    if (!belief) return { ...tag, kind: 'belief', beliefs: [body.match(/^B\d+/)[0]], valid: false };
    const rest = belief[2];
    const verdict = VERDICTS.find((v) => rest.toLowerCase().startsWith(v)) ?? null;
    const after = verdict ? rest.slice(verdict.length).trim() : rest;
    const threshold = /\bthreshold\s*$/.test(after);
    const refs = after.replace(/\s*\bthreshold\s*$/, '').trim();
    const valid = verdict === 'no evidence' ? after === '' : verdict !== null && wellFormed(refs);
    return { ...tag, kind: 'belief', beliefs: [belief[1]], verdict, threshold, valid, ...references(rest) };
  }
  if (body.startsWith('proposed')) {
    const rest = body.slice('proposed'.length).trim();
    return { ...tag, kind: 'proposed', valid: rest === '' || wellFormed(rest), ...references(rest) };
  }
  if (body.startsWith('inference')) {
    return { ...tag, kind: 'inference', valid: wellFormed(body.slice('inference'.length).trim()), ...references(body) };
  }
  return { ...tag, kind: 'source', valid: wellFormed(body), ...references(body) };
}

export function tagsIn(text) {
  return [...text.matchAll(TAG)].map((m) => parseTag(m[1], m[2] ?? null));
}

export function stripTags(text) {
  return text.replace(TAG, '').replace(/\s+/g, ' ').trim();
}

export function needsBar(tag) {
  return BAR_VERDICTS.includes(tag.verdict);
}

function splitRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim());
}

const isSeparator = (line) => /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes('-');

export function parseMarkdown(source) {
  const uncommented = source.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ''));
  const lines = uncommented.split('\n');
  const doc = { title: null, banner: null, bannerLine: 0, sections: [], preamble: [] };
  let section = null;
  let sub = null;
  let table = null;

  lines.forEach((raw, index) => {
    const n = index + 1;
    const line = raw.trimEnd();
    const holder = () => sub ?? section;
    const isTable = /^\s*\|/.test(line);
    if (!isTable) table = null;
    if (line.trim() === '') return;

    if (/^# /.test(line) && doc.title === null) { doc.title = line.slice(2).trim(); return; }
    if (/^## /.test(line)) {
      section = { name: line.slice(3).trim(), line: n, blocks: [], subsections: [], confidence: null, confidenceLine: 0 };
      sub = null;
      doc.sections.push(section);
      return;
    }
    if (/^### /.test(line) && section) {
      sub = { name: line.slice(4).trim(), line: n, blocks: [] };
      section.subsections.push(sub);
      return;
    }
    if (!section) {
      if (doc.banner === null && /^(Proto:|From research:)/.test(line)) { doc.banner = line.trim(); doc.bannerLine = n; return; }
      doc.preamble.push({ text: line, line: n });
      return;
    }
    const confidence = line.match(/^Confidence:\s*(.*)$/i);
    if (confidence) { section.confidence = confidence[1].trim().toLowerCase(); section.confidenceLine = n; return; }

    if (isTable) {
      if (!table) {
        table = { type: 'table', line: n, header: splitRow(line), rows: [] };
        holder().blocks.push(table);
        return;
      }
      if (table.rows.length === 0 && isSeparator(line)) return;
      const text = line.trim();
      table.rows.push({ cells: splitRow(line), text, tags: tagsIn(text), line: n });
      return;
    }
    const bullet = line.match(/^(\s*)(?:[-*+]|\d+\.)\s+(.*)$/);
    if (bullet) {
      // A component line belongs to the proposal above it. It is a lookup, not a claim.
      const component = bullet[2].match(/^\*\*Component:\*\*\s*(.+)$/);
      const last = holder().blocks.at(-1);
      if (component && bullet[1].length >= 2 && last?.type === 'bullet') { last.component = component[1].trim(); return; }
      holder().blocks.push({ type: 'bullet', depth: Math.floor(bullet[1].length / 2), text: bullet[2], tags: tagsIn(bullet[2]), line: n });
      return;
    }
    const quote = line.match(/^\s*>\s?(.*)$/);
    if (quote) {
      holder().blocks.push({ type: 'quote', text: quote[1], tags: tagsIn(quote[1]), line: n });
      return;
    }
    holder().blocks.push({ type: 'para', text: line.trim(), tags: tagsIn(line), line: n });
  });
  return doc;
}

export function parseFile(path) {
  return parseMarkdown(readFileSync(path, 'utf8'));
}

// Every claim-bearing line in a section, flattened.
export function claims(container) {
  const out = [];
  for (const block of container.blocks) {
    if (block.type === 'table') out.push(...block.rows.map((row) => ({ ...row, type: 'row' })));
    else out.push(block);
  }
  for (const subsection of container.subsections ?? []) out.push(...claims(subsection));
  return out;
}

export function tableRows(block) {
  return block.rows.map((row) => Object.fromEntries(block.header.map((h, i) => [h, row.cells[i] ?? ''])));
}

export function firstTable(container) {
  return container.blocks.find((b) => b.type === 'table') ?? null;
}
