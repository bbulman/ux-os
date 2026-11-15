// Counts how often each registry entry has been used, from Claude Code transcripts on this machine.
//   node scripts/usage.mjs [--dir <transcripts folder>]
// Every transcript is read line by line and each record parsed; a line that does not parse is skipped.
// From the model's records (type "assistant") it counts tool calls: a Skill call by its skill, a call with
// a subagent_type by that agent, and an MCP tool call by its server. From what a person typed (type "user",
// not meta) it counts a <command-name> tag, once per message.
// Resumed and forked sessions copy earlier records into new transcripts, so a tool call counts once by its
// id and a typed command once by its record's uuid, across every file.
// Only registry ids, integers, two dates and one sentence are written to data/usage.json: no paths,
// prompts or project names.
import { createReadStream, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const dir = args.includes('--dir') ? args[args.indexOf('--dir') + 1] : join(homedir(), '.claude/projects');

const ABOUT = 'Times each entry was started: model = Claude chose it, typed = run by name, agent = handed work as a subagent. For an MCP server, model counts its tool calls. Counted from transcripts on one machine.';
const COMMAND = /<command-name>\s*\/?([^<\s]+)[^<]*<\/command-name>/;

function files(d, out = []) {
  for (const name of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, name.name);
    if (name.isDirectory()) files(p, out);
    else if (name.name.endsWith('.jsonl')) out.push(p);
  }
  return out;
}

const tally = { model: new Map(), typed: new Map(), agent: new Map(), mcp: new Map() };
const first = { model: new Map(), typed: new Map(), agent: new Map(), mcp: new Map() }; // name -> earliest ms
const seen = new Set();
let duplicates = 0;

function bump(kind, name, ms) {
  tally[kind].set(name, (tally[kind].get(name) || 0) + 1);
  if (Number.isFinite(ms) && !(first[kind].get(name) <= ms)) first[kind].set(name, ms);
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.filter((b) => b && b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n');
}

function record(line) {
  // Cheap tests first: most lines carry neither a tool call nor a typed command.
  const call = line.includes('"tool_use"');
  const typed = line.includes('<command-name>');
  if (!call && !typed) return;
  let rec;
  try { rec = JSON.parse(line); } catch { return; }
  if (!rec || typeof rec !== 'object') return;
  const ms = Date.parse(rec.timestamp);

  if (rec.type === 'assistant' && Array.isArray(rec.message?.content)) {
    rec.message.content.forEach((b, i) => {
      if (!b || b.type !== 'tool_use') return;
      const key = b.id ? `tool:${b.id}` : `tool:${rec.uuid}:${i}`;
      if (seen.has(key)) { duplicates++; return; }
      seen.add(key);
      const input = b.input && typeof b.input === 'object' ? b.input : {};
      if (b.name === 'Skill' && typeof input.skill === 'string' && input.skill.trim()) bump('model', input.skill.trim().replace(/^\//, ''), ms);
      if (typeof input.subagent_type === 'string' && input.subagent_type.trim()) bump('agent', input.subagent_type.trim(), ms);
      if (typeof b.name === 'string' && b.name.startsWith('mcp__')) {
        const server = b.name.slice(5).split('__')[0];
        if (server) bump('mcp', server, ms);
      }
    });
    return;
  }

  // A sidechain's first message is the prompt an agent was handed, and a compact summary retells the
  // conversation: neither was typed.
  if (rec.type === 'user' && rec.isMeta !== true && !rec.isSidechain && !rec.isCompactSummary) {
    const m = COMMAND.exec(textOf(rec.message?.content));
    if (!m) return;
    const key = rec.uuid ? `user:${rec.uuid}` : null;
    if (key && seen.has(key)) { duplicates++; return; }
    if (key) seen.add(key);
    bump('typed', m[1], ms);
  }
}

function scan(file) {
  return new Promise((resolve, reject) => {
    const input = createReadStream(file, { encoding: 'utf8', highWaterMark: 1 << 20 });
    const rl = createInterface({ input, crlfDelay: Infinity });
    rl.on('line', record);
    rl.on('close', resolve);
    input.on('error', reject);
  });
}

const all = files(dir);
for (const f of all) await scan(f);

const registry = JSON.parse(readFileSync(join(root, 'data/registry.json'), 'utf8'));
const namesOf = (e) => [e.invoke, ...(e.aliases || [])].filter(Boolean);
// A pack counts its members by prefix, except members another entry claims by name.
const claimedBy = new Map();
for (const e of registry.entries) for (const n of namesOf(e)) claimedBy.set(n, [...(claimedBy.get(n) || []), e.id]);
const claimedElsewhere = (name, e) => (claimedBy.get(name) || []).some((id) => id !== e.id);

const counts = {};
let since = Infinity;
for (const e of registry.entries) {
  if (!e.invoke) continue;
  const names = namesOf(e);
  const hit = (kind) => {
    let n = 0;
    for (const [name, c] of tally[kind]) {
      const mine = e.match === 'prefix' ? name.startsWith(`${e.invoke}:`) && !claimedElsewhere(name, e) : names.includes(name);
      if (!mine) continue;
      n += c;
      since = Math.min(since, first[kind].get(name) ?? Infinity);
    }
    return n;
  };
  const row = { model: hit('model'), typed: hit('typed'), agent: hit('agent') };
  if (e.type === 'mcp') {
    for (const server of new Set([e.invoke, e.invoke.replace(/-/g, '_')])) {
      row.model += tally.mcp.get(server) || 0;
      if (tally.mcp.has(server)) since = Math.min(since, first.mcp.get(server) ?? Infinity);
    }
  }
  row.total = row.model + row.typed + row.agent;
  if (row.total) counts[e.id] = row;
}

const today = new Date().toISOString().slice(0, 10);
const out = {
  asOf: today,
  since: Number.isFinite(since) ? new Date(since).toISOString().slice(0, 10) : today,
  about: ABOUT,
  counts: Object.fromEntries(Object.entries(counts).sort((a, b) => b[1].total - a[1].total || a[0].localeCompare(b[0]))),
};
writeFileSync(join(root, 'data/usage.json'), `${JSON.stringify(out, null, 2)}\n`);
const calls = [...seen].filter((k) => k.startsWith('tool:')).length;
console.log(`Read ${all.length} transcripts: ${calls} tool calls and ${seen.size - calls} typed commands, ${duplicates} copies skipped. Counted since ${out.since}.`);
console.log(`${Object.keys(counts).length} of ${registry.entries.length} entries have been used.`);
for (const [id, c] of Object.entries(out.counts).slice(0, 15)) console.log(`  ${String(c.total).padStart(4)}  ${id}`);
