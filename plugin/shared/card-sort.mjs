#!/usr/bin/env node
// Card sort numbers from a CSV with participant, card and category columns.
// Usage: node card-sort.mjs <csv> [--out file.json] [--threshold 0.5]   |   node card-sort.mjs --self-test

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FLOAT_BELOW = 0.4;
const round = (n) => Math.round(n * 1000) / 1000;

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export function readPlacements(text) {
  const [header, ...body] = parseCsv(text);
  const names = header.map((h) => h.trim().toLowerCase());
  const at = ['participant', 'card', 'category'].map((n) => names.indexOf(n));
  if (at.some((i) => i < 0)) throw new Error('the CSV needs participant, card and category columns');
  return body
    .map((r) => ({ participant: (r[at[0]] ?? '').trim(), card: (r[at[1]] ?? '').trim(), category: (r[at[2]] ?? '').trim() }))
    .filter((p) => p.participant && p.card && p.category);
}

export function analyse(placements, threshold = 0.5) {
  const participants = [...new Set(placements.map((p) => p.participant))];
  const cards = [...new Set(placements.map((p) => p.card))].sort((a, b) => a.localeCompare(b));
  const index = new Map(cards.map((c, i) => [c, i]));
  const n = cards.length;
  const blank = () => Array.from({ length: n }, () => Array(n).fill(0));

  const sorts = new Map();
  for (const p of placements) {
    if (!sorts.has(p.participant)) sorts.set(p.participant, new Map());
    sorts.get(p.participant).set(p.card, p.category);
  }

  const together = blank();
  const both = blank();
  for (const sort of sorts.values()) {
    const placed = [...sort.keys()].map((c) => index.get(c));
    for (let a = 0; a < placed.length; a++) {
      for (let b = a + 1; b < placed.length; b++) {
        const [i, j] = [placed[a], placed[b]];
        both[i][j]++; both[j][i]++;
        if (sort.get(cards[i]) === sort.get(cards[j])) { together[i][j]++; together[j][i]++; }
      }
    }
  }
  const matrix = cards.map((_, i) => cards.map((__, j) => (i === j ? 1 : both[i][j] ? round(together[i][j] / both[i][j]) : 0)));

  const linkage = (a, b) => {
    let sum = 0;
    for (const x of a.members) for (const y of b.members) sum += matrix[x][y];
    return sum / (a.members.length * b.members.length);
  };

  let clusters = cards.map((_, i) => ({ members: [i] }));
  let cut = null;
  const merges = [];
  while (clusters.length > 1) {
    let best = { value: -1, a: 0, b: 1 };
    for (let a = 0; a < clusters.length; a++) {
      for (let b = a + 1; b < clusters.length; b++) {
        const value = linkage(clusters[a], clusters[b]);
        if (value > best.value + 1e-9) best = { value, a, b };
      }
    }
    if (best.value < threshold && !cut) cut = clusters.map((c) => [...c.members]);
    const [left, right] = [clusters[best.a], clusters[best.b]];
    merges.push({ left: left.members.map((i) => cards[i]), right: right.members.map((i) => cards[i]), at: round(best.value) });
    clusters = clusters.filter((_, i) => i !== best.a && i !== best.b).concat({ members: [...left.members, ...right.members] });
  }
  if (!cut) cut = clusters.map((c) => [...c.members]);
  const order = clusters[0]?.members ?? [];

  const groupOf = new Map();
  cut.forEach((members, g) => members.forEach((m) => groupOf.set(m, g)));
  const meanTo = (i, members) => {
    const others = members.filter((m) => m !== i);
    return others.length ? others.reduce((s, m) => s + matrix[i][m], 0) / others.length : 0;
  };

  const groups = cut
    .map((members) => {
      let sum = 0;
      let pairs = 0;
      for (let a = 0; a < members.length; a++) {
        for (let b = a + 1; b < members.length; b++) { sum += matrix[members[a]][members[b]]; pairs++; }
      }
      return { cards: members.map((i) => cards[i]), agreement: pairs ? round(sum / pairs) : null };
    })
    .sort((a, b) => b.cards.length - a.cards.length || (b.agreement ?? 0) - (a.agreement ?? 0));

  const floaters = [];
  const torn = [];
  cards.forEach((card, i) => {
    const own = cut[groupOf.get(i)];
    let strongest = { with: null, share: 0 };
    matrix[i].forEach((share, j) => { if (j !== i && share > strongest.share) strongest = { with: cards[j], share }; });
    if (own.length === 1 || meanTo(i, own) < FLOAT_BELOW) floaters.push({ card, strongest_link: strongest.with, share: strongest.share });
    const pulls = cut
      .filter((members) => members !== own && members.length > 1)
      .map((members) => ({ cards: members.map((m) => cards[m]), share: round(meanTo(i, members)) }))
      .filter((p) => p.share >= FLOAT_BELOW);
    if (pulls.length && own.length > 1) torn.push({ card, also_pulled_to: pulls });
  });

  const pairs = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) if (both[i][j]) pairs.push({ a: cards[i], b: cards[j], share: matrix[i][j], together: together[i][j], of: both[i][j] });
  }
  pairs.sort((x, y) => y.share - x.share || x.a.localeCompare(y.a));

  const byLabel = new Map();
  for (const p of placements) {
    const key = p.category.toLowerCase();
    if (!byLabel.has(key)) byLabel.set(key, { label: p.category, people: new Set(), cards: new Map() });
    const entry = byLabel.get(key);
    entry.people.add(p.participant);
    entry.cards.set(p.card, (entry.cards.get(p.card) ?? 0) + 1);
  }
  const labels = [...byLabel.values()]
    .map((e) => ({ label: e.label, people: e.people.size, cards: [...e.cards.entries()].sort((a, b) => b[1] - a[1]).map(([card, count]) => ({ card, count })) }))
    .sort((a, b) => b.people - a.people || a.label.localeCompare(b.label));

  return {
    participants: participants.length,
    threshold,
    cards: order.map((i) => cards[i]),
    matrix: order.map((i) => order.map((j) => matrix[i][j])),
    groups,
    floaters,
    torn,
    top_pairs: pairs.slice(0, 15),
    labels,
    merges,
  };
}

function selfTest() {
  const rows = ['participant,card,category'];
  for (let p = 1; p <= 5; p++) {
    for (const card of ['Apple', 'Pear', 'Plum']) rows.push(`P${p},${card},Fruit`);
    for (const card of ['Hammer', 'Saw']) rows.push(`P${p},${card},Tools`);
    rows.push(`P${p},Tomato,${p <= 2 ? 'Fruit' : 'Salad'}`);
  }
  rows.push('P1,"Nail, steel",Tools', 'P2,"Nail, steel",Tools', 'P3,"Nail, steel",Tools', 'P4,"Nail, steel",Tools', 'P5,"Nail, steel",Tools');
  const result = analyse(readPlacements(rows.join('\n')));
  const fail = [];
  const has = (name, cards) => result.groups.some((g) => g.cards.length === cards.length && cards.every((c) => g.cards.includes(c))) || fail.push(name);
  if (result.participants !== 5) fail.push('participants');
  has('fruit group', ['Apple', 'Pear', 'Plum']);
  has('tools group, with a quoted comma in a card name', ['Hammer', 'Saw', 'Nail, steel']);
  has('tomato alone', ['Tomato']);
  if (!result.floaters.some((f) => f.card === 'Tomato')) fail.push('tomato floats');
  if (result.matrix.some((row, i) => row.some((v, j) => v !== result.matrix[j][i]))) fail.push('matrix is symmetrical');
  const a = result.cards.indexOf('Apple');
  const pe = result.cards.indexOf('Pear');
  if (result.matrix[a][pe] !== 1) fail.push('apple and pear always together');
  if (result.labels[0].people !== 5) fail.push('labels count people');
  let threw = false;
  try { readPlacements('name,card\nP1,Apple'); } catch { threw = true; }
  if (!threw) fail.push('rejects missing columns');
  console.log(fail.length ? `FAIL: ${fail.join('; ')}` : 'self-test passed');
  process.exit(fail.length ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args[0] === '--self-test') selfTest();
  else if (!args[0]) { console.error('usage: node card-sort.mjs <csv> [--out file.json] [--threshold 0.5]'); process.exit(2); }
  else {
    const value = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
    const result = analyse(readPlacements(readFileSync(args[0], 'utf8')), Number(value('--threshold') ?? 0.5));
    const text = JSON.stringify(result, null, 1);
    if (value('--out')) writeFileSync(value('--out'), text);
    else console.log(text);
    console.log(`${result.participants} participants, ${result.cards.length} cards, ${result.groups.length} groups, ${result.floaters.length} with no clear home, ${result.torn.length} pulled two ways.`);
  }
}
