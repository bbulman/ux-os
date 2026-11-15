// A small, safe markdown renderer for the stories and the worked examples.
// Supports headings, paragraphs, ordered and unordered lists (nested), tables, blockquotes,
// fenced code, horizontal rules, inline code, bold, italic and links. Raw HTML is escaped,
// and a link survives only if it is http(s) or stays on this site, and never points at this
// machine or a private network.

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const LIST = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
// A backtick fence's info string may not hold a backtick, or "```a```" would open a block.
const FENCE = /^\s{0,3}(`{3,}(?!.*`)|~{3,})(.*)$/;
// The closing #s need a space before them, so "# C#" keeps its #.
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/;
const RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const QUOTE = /^\s{0,3}>\s?(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

const indentOf = (line) => line.match(/^\s*/)[0].replace(/\t/g, '    ').length;
const isBlank = (line) => line.trim() === '';
// The line that closes a fence: the same character, at least as many, and nothing after.
const fenceCloser = (mark) => new RegExp(`^\\s{0,3}${mark[0]}{${mark.length},}\\s*$`);

// The character references CommonMark decodes in a link destination. An unknown name stays as typed,
// and esc() later turns its & into &amp;, so it can never become a character.
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
function decodeRefs(s) {
  return s.replace(/&(#[0-9]{1,7}|#[xX][0-9a-fA-F]{1,6}|[A-Za-z][A-Za-z0-9]{1,31});/g, (m, body) => {
    if (body[0] !== '#') return NAMED[body] ?? m;
    const code = /^#x/i.test(body) ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : '�';
  });
}

// This machine and the private networks: loopback, 10/8, 172.16/12, 192.168/16, link-local, and
// IPv6 loopback, unique-local and link-local, including IPv4 written inside IPv6.
function isPrivateHost(hostname) {
  let h = hostname.toLowerCase().replace(/\.+$/, '');
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h.startsWith('[')) {
    h = h.slice(1, -1);
    if (h === '::1' || h === '::') return true;
    const v4 = h.match(/^::(?:ffff:)?([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (!v4) return /^f[cd]/.test(h) || /^fe[89ab]/.test(h);
    const hi = parseInt(v4[1], 16);
    const lo = parseInt(v4[2], 16);
    h = `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  const ip = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!ip) return false;
  const a = +ip[1];
  const b = +ip[2];
  return a === 127 || a === 10 || a === 0 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254);
}

// Returns the URL to print, or null to print the link's text alone. Browsers drop leading control
// characters ("\u0001javascript:") and read a backslash as a slash ("/\host"), so anything at or
// below U+0020, U+007F or a backslash (a real one is written %5C) is refused outright, and the URL
// is judged by where it resolves.
const BASE = 'x.invalid';
function safeHref(raw) {
  const url = decodeRefs(raw);
  if (!url || /[\u0000- \u007f\\]/.test(url)) return null;
  if (/^[\\/]{2}/.test(url)) return null;
  let u;
  try { u = new URL(url, `https://${BASE}/`); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    if (!/^https?:\/\//i.test(url) || u.hostname === BASE) return null;
  } else if (u.host !== BASE) return null;
  if (isPrivateHost(u.hostname)) return null;
  return url;
}

export function inline(src, opts = {}) {
  // Finished pieces are held aside as \0n\0 and put back at the end. A NUL in the source becomes
  // U+FFFD first, so the only NULs left are these.
  const held = [];
  const hold = (html) => `\u0000${held.push(html) - 1}\u0000`;
  let text = String(src ?? '').replace(/\u0000/g, '�');
  // Code spans first, so nothing inside them is touched.
  text = text.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, _ticks, body) => hold(`<code>${esc(body.trim())}</code>`));
  // Links next, each held whole, so emphasis never reaches into a tag or its URL: [text](url "title")
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_, label, href) => {
    const url = safeHref(href);
    const body = emphasis(esc(label));
    return hold(url && !(opts.unlink && opts.unlink(url)) ? `<a href="${esc(url)}">${body}</a>` : body);
  });
  text = emphasis(esc(text));
  // A link's text can hold a code span, so a second pass puts that back too.
  for (let pass = 0; pass < 3 && text.includes('\u0000'); pass++) text = text.replace(/\u0000(\d+)\u0000/g, (_, i) => held[+i] ?? '');
  return text;
}

function emphasis(text) {
  return text
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '$1<strong>$2</strong>')
    .replace(/(^|[^*\w])\*(?=[^\s*])([\s\S]*?[^\s*])\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_(?=\S)([\s\S]*?\S)_(?!\w)/g, '$1<em>$2</em>');
}

function splitRow(line) {
  let row = line.trim();
  if (row.startsWith('|')) row = row.slice(1);
  if (row.endsWith('|') && !row.endsWith('\\|')) row = row.slice(0, -1);
  const cells = [];
  let cur = '';
  let inCode = false;
  for (let i = 0; i < row.length; i++) {
    const c = row[i];
    if (c === '\\' && row[i + 1] === '|') { cur += '|'; i++; continue; }
    if (c === '`') inCode = !inCode;
    if (c === '|' && !inCode) { cells.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  cells.push(cur.trim());
  return cells;
}

function table(lines, opts) {
  const head = splitRow(lines[0]);
  const align = splitRow(lines[1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : c.startsWith(':') ? 'left' : ''));
  const cell = (tag, text, i) => `<${tag}${align[i] ? ` style="text-align:${align[i]}"` : ''}>${inline(text, opts)}</${tag}>`;
  const rows = lines.slice(2).map((l) => {
    const cells = splitRow(l);
    while (cells.length < head.length) cells.push('');
    return `<tr>${cells.slice(0, head.length).map((c, i) => cell('td', c, i)).join('')}</tr>`;
  });
  return `<div class="table"><table><thead><tr>${head.map((c, i) => cell('th', c, i)).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

function dedent(lines) {
  const n = Math.min(...lines.filter((l) => !isBlank(l)).map(indentOf));
  return lines.map((l) => (isBlank(l) ? '' : l.replace(/\t/g, '    ').slice(n)));
}

const startsBlock = (line) => FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line) || LIST.test(line);

function list(lines, i, opts) {
  const first = LIST.exec(lines[i]);
  const base = indentOf(lines[i]);
  const ordered = /\d/.test(first[2]);
  const start = ordered ? parseInt(first[2], 10) : 1;
  const items = [];
  while (i < lines.length) {
    if (isBlank(lines[i])) {
      let j = i + 1;
      while (j < lines.length && isBlank(lines[j])) j++;
      const next = j < lines.length && LIST.exec(lines[j]);
      if (next && indentOf(lines[j]) === base && /\d/.test(next[2]) === ordered) { i = j; continue; }
      break;
    }
    const m = LIST.exec(lines[i]);
    if (!m || indentOf(lines[i]) !== base || /\d/.test(m[2]) !== ordered) break;
    const text = [m[3]];
    const child = [];
    i++;
    while (i < lines.length) {
      const l = lines[i];
      if (isBlank(l)) {
        let j = i + 1;
        while (j < lines.length && isBlank(lines[j])) j++;
        if (j < lines.length && indentOf(lines[j]) > base) { child.push(''); i++; continue; }
        break;
      }
      if (indentOf(l) > base) { child.push(l); i++; continue; }
      if (!child.length && !startsBlock(l)) { text.push(l.trim()); i++; continue; }
      break;
    }
    const body = child.length ? blocks(dedent(child), opts) : '';
    items.push(`<li>${inline(text.join(' '), opts)}${body}</li>`);
  }
  const tag = ordered ? 'ol' : 'ul';
  return { html: `<${tag}${ordered && start !== 1 ? ` start="${start}"` : ''}>${items.join('')}</${tag}>`, i };
}

function blocks(lines, opts) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }

    const fence = FENCE.exec(line);
    if (fence) {
      const mark = fence[1];
      const body = [];
      i++;
      const closer = fenceCloser(mark);
      while (i < lines.length && !closer.test(lines[i])) body.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(body.join('\n'))}</code></pre>`);
      continue;
    }

    const h = HEADING.exec(line);
    if (h) {
      const level = Math.min(6, Math.max(1, h[1].length + opts.shift));
      out.push(`<h${level}>${inline(h[2], opts)}</h${level}>`);
      i++;
      continue;
    }

    if (RULE.test(line)) { out.push('<hr>'); i++; continue; }

    if (QUOTE.test(line)) {
      const body = [];
      while (i < lines.length && !isBlank(lines[i]) && (QUOTE.test(lines[i]) || body.length)) {
        const q = QUOTE.exec(lines[i]);
        if (!q && startsBlock(lines[i])) break;
        body.push(q ? q[1] : lines[i]);
        i++;
      }
      out.push(`<blockquote>${blocks(body, opts)}</blockquote>`);
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const rows = [line, lines[i + 1]];
      i += 2;
      while (i < lines.length && !isBlank(lines[i]) && lines[i].includes('|')) rows.push(lines[i++]);
      out.push(table(rows, opts));
      continue;
    }

    if (LIST.test(line)) {
      const r = list(lines, i, opts);
      out.push(r.html);
      i = r.i;
      continue;
    }

    const para = [line.trim()];
    i++;
    while (i < lines.length && !isBlank(lines[i]) && !startsBlock(lines[i]) && !(lines[i].includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]))) para.push(lines[i++].trim());
    out.push(`<p>${inline(para.join(' '), opts)}</p>`);
  }
  return out.join('\n');
}

// minLevel: the level the document's top heading becomes, so a story's "##" or an example's "#"
// sits under the page's own h2 instead of competing with its h1.
// unlink(url): return true to print a link's text without the link, for places a reader cannot follow.
export function md(src, { minLevel = 2, unlink = null } = {}) {
  const lines = String(src ?? '').replace(/\u0000/g, '\ufffd').replace(/\r\n?/g, '\n').split('\n');
  // The top heading outside code. A fence closes only on its own character, so a ``` line inside a
  // ~~~ block is code, not a fence.
  let top = 7;
  let closer = null;
  for (const l of lines) {
    if (closer) { if (closer.test(l)) closer = null; continue; }
    const f = FENCE.exec(l);
    if (f) { closer = fenceCloser(f[1]); continue; }
    const h = HEADING.exec(l);
    if (h) top = Math.min(top, h[1].length);
  }
  const shift = top === 7 ? 0 : minLevel - top;
  return blocks(lines, { shift, unlink });
}
