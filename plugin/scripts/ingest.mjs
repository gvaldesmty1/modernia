#!/usr/bin/env node
// Modernia document ingestion. Zero dependencies.
//
//   node ingest.mjs <file-or-folder>... [--out .modernia/sources]
//
// Converts Office Open XML documents (.docx .xlsx .pptx) and HTML to Markdown
// under <out>/text/, and writes <out>/index.json telling agents how to read
// every document:
//   converted   → read the Markdown in `output`
//   text        → read the original file directly
//   native      → PDF or image: Claude reads it directly (Read tool)
//   unsupported → legacy binary format (.doc .xls .ppt …): ask for a modern copy
//   error       → could not be processed (see `note`)

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const args = process.argv.slice(2);
const inputs = [];
let outDir = '.modernia/sources';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') outDir = args[++i];
  else inputs.push(args[i]);
}
if (!inputs.length) {
  console.log('usage: ingest.mjs <file-or-folder>... [--out .modernia/sources]');
  process.exit(1);
}
outDir = path.resolve(outDir);
const textDir = path.join(outDir, 'text');
fs.mkdirSync(textDir, { recursive: true });

const NATIVE = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp']);
const TEXT = new Set(['.md', '.markdown', '.txt', '.csv', '.tsv', '.json', '.xml', '.yaml', '.yml', '.ini', '.log', '.sql', '.puml', '.mmd', '.drawio']);
const HTML = new Set(['.html', '.htm']);
const OOXML = { '.docx': docx, '.docm': docx, '.xlsx': xlsx, '.xlsm': xlsx, '.pptx': pptx, '.pptm': pptx };
const MAX_ROWS = 5000;

// ------------------------------------------------------------------ zip

function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('corrupt zip directory');
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    entries.set(name, { method, size, local });
    p += 46 + nameLen + extraLen + commentLen;
  }
  const get = (name) => {
    const e = entries.get(name);
    if (!e) return null;
    const start = e.local + 30 + buf.readUInt16LE(e.local + 26) + buf.readUInt16LE(e.local + 28);
    const data = buf.subarray(start, start + e.size);
    if (e.method === 0) return data.toString('utf8');
    if (e.method === 8) return zlib.inflateRawSync(data).toString('utf8');
    throw new Error(`unsupported compression ${e.method} in ${name}`);
  };
  return { names: [...entries.keys()], get };
}

// ------------------------------------------------------------------ xml helpers

function decode(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&');
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`));
  return m ? decode(m[1]) : null;
}

function rels(zip, relsPath, baseDir) {
  const xml = zip.get(relsPath);
  const map = new Map();
  if (!xml) return map;
  for (const tag of xml.match(/<Relationship\b[^>]*>/g) || []) {
    const target = attr(tag, 'Target');
    const resolved = target.startsWith('/') ? target.slice(1) : path.posix.normalize(`${baseDir}/${target}`);
    map.set(attr(tag, 'Id'), resolved);
  }
  return map;
}

const cellText = (s) => s.replace(/\s+/g, ' ').trim().replace(/\|/g, '\\|');

// ------------------------------------------------------------------ Word

function docx(zip) {
  const xml = zip.get('word/document.xml');
  if (!xml) throw new Error('word/document.xml missing');
  const out = [];
  let para = '';
  let style = null;
  let list = false;
  let depth = 0;
  let row = null;
  let cell = '';
  let firstRow = true;
  const re = /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:br\b[^>]*\/>|<w:pStyle w:val="([^"]+)"\/>|<w:numPr>|<\/w:p>|<w:tbl\b[^>]*>|<\/w:tbl>|<w:tr\b[^>]*>|<\/w:tc>|<\/w:tr>/g;
  let m;
  while ((m = re.exec(xml))) {
    const tok = m[0];
    if (m[1] !== undefined) para += decode(m[1]);
    else if (tok === '<w:tab/>') para += '\t';
    else if (tok.startsWith('<w:br')) para += '\n';
    else if (m[2] !== undefined) style = m[2];
    else if (tok === '<w:numPr>') list = true;
    else if (tok === '</w:p>') {
      const text = para.trim();
      if (depth > 0) {
        if (text) cell += (cell ? ' ' : '') + text;
      } else if (text) {
        const h = style && style.match(/^(?:heading|t[ií]tulo|titulo|ttulo|berschrift)\s?(\d)$/i);
        if (h) out.push(`${'#'.repeat(Math.min(Number(h[1]) + 1, 6))} ${text}`);
        else if (style && /^(title|t[ií]tulo|titulo|ttulo)$/i.test(style)) out.push(`# ${text}`);
        else if (list) out.push(`- ${text}`);
        else out.push(text);
        out.push('');
      }
      para = ''; style = null; list = false;
    } else if (tok.startsWith('<w:tbl')) {
      depth++;
      if (depth === 1) firstRow = true;
    } else if (tok === '</w:tbl>') {
      depth--;
      if (depth === 0) out.push('');
    } else if (tok.startsWith('<w:tr')) {
      if (depth === 1) row = [];
    } else if (tok === '</w:tc>') {
      if (depth === 1 && row) { row.push(cellText(cell)); cell = ''; }
    } else if (tok === '</w:tr>' && depth === 1 && row) {
      out.push(`| ${row.join(' | ')} |`);
      if (firstRow) { out.push(`|${row.map(() => '---').join('|')}|`); firstRow = false; }
      row = null;
    }
  }
  return out.join('\n');
}

// ------------------------------------------------------------------ Excel

function colIndex(ref) {
  const letters = (ref || '').match(/^[A-Z]+/i);
  if (!letters) return -1;
  return [...letters[0].toUpperCase()].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
}

function xlsx(zip) {
  const shared = [];
  const sst = zip.get('xl/sharedStrings.xml');
  if (sst) {
    for (const si of sst.match(/<si>[\s\S]*?<\/si>/g) || []) {
      shared.push(decode((si.match(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g) || []).map((t) => t.replace(/<[^>]+>/g, '')).join('')));
    }
  }
  const book = zip.get('xl/workbook.xml') || '';
  const relMap = rels(zip, 'xl/_rels/workbook.xml.rels', 'xl');
  const out = [];
  for (const tag of book.match(/<sheet\b[^>]*>/g) || []) {
    const name = attr(tag, 'name');
    const target = relMap.get(attr(tag, 'r:id'));
    const xml = target && zip.get(target);
    out.push(`## Sheet: ${name}`, '');
    if (!xml) { out.push('(empty)', ''); continue; }
    const rows = [];
    let truncated = false;
    for (const r of xml.match(/<row\b[^>]*>[\s\S]*?<\/row>/g) || []) {
      if (rows.length >= MAX_ROWS) { truncated = true; break; }
      const cells = [];
      for (const c of r.match(/<c\b[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []) {
        const open = c.match(/^<c\b[^>]*>/)[0];
        const idx = colIndex(attr(open, 'r'));
        const type = attr(open, 't');
        const v = c.match(/<v>([^<]*)<\/v>/);
        let value = '';
        if (type === 's' && v) value = shared[Number(v[1])] ?? '';
        else if (type === 'inlineStr') value = decode((c.match(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g) || []).map((t) => t.replace(/<[^>]+>/g, '')).join(''));
        else if (type === 'b' && v) value = v[1] === '1' ? 'TRUE' : 'FALSE';
        else if (v) value = decode(v[1]);
        cells[idx >= 0 ? idx : cells.length] = cellText(value);
      }
      if (cells.some((x) => x)) rows.push(cells);
    }
    if (!rows.length) { out.push('(empty)', ''); continue; }
    const width = Math.max(...rows.map((r) => r.length));
    rows.forEach((r, i) => {
      out.push(`| ${Array.from({ length: width }, (_, k) => r[k] ?? '').join(' | ')} |`);
      if (i === 0) out.push(`|${Array.from({ length: width }, () => '---').join('|')}|`);
    });
    if (truncated) out.push('', `(truncated at ${MAX_ROWS} rows)`);
    out.push('');
  }
  return out.join('\n');
}

// ------------------------------------------------------------------ PowerPoint

function slideText(xml) {
  let text = '';
  const re = /<a:t>([^<]*)<\/a:t>|<\/a:p>|<a:br\/>/g;
  let m;
  while ((m = re.exec(xml))) text += m[1] !== undefined ? decode(m[1]) : '\n';
  return text.replace(/\n{2,}/g, '\n').trim();
}

function pptx(zip) {
  const slides = zip.names
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/(\d+)\.xml$/)[1]) - Number(b.match(/(\d+)\.xml$/)[1]));
  const out = [];
  slides.forEach((name, i) => {
    out.push(`## Slide ${i + 1}`, '', slideText(zip.get(name)) || '(no text)', '');
    const relMap = rels(zip, name.replace('slides/', 'slides/_rels/') + '.rels', 'ppt/slides');
    const notes = [...relMap.values()].find((t) => t.includes('notesSlide'));
    const notesText = notes && zip.get(notes) ? slideText(zip.get(notes)).replace(/^\d+$/m, '').trim() : '';
    if (notesText) out.push('**Notes:**', '', notesText, '');
  });
  return out.join('\n');
}

// ------------------------------------------------------------------ HTML

function html(raw) {
  return decode(
    raw
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<h([1-6])[^>]*>/gi, (_, n) => `\n${'#'.repeat(Number(n))} `)
      .replace(/<li[^>]*>/gi, '\n- ')
      .replace(/<\/(td|th)>/gi, ' | ')
      .replace(/<(br|\/p|\/div|\/tr|\/h[1-6]|\/li|\/table)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  ).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ------------------------------------------------------------------ main

function walk(p, acc) {
  const st = fs.statSync(p);
  if (st.isFile()) { acc.push(p); return acc; }
  for (const entry of fs.readdirSync(p, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.startsWith('~$')) continue;
    walk(path.join(p, entry.name), acc);
  }
  return acc;
}

const files = [];
const roots = inputs.map((i) => path.resolve(i));
for (const root of roots) {
  if (!fs.existsSync(root)) { console.error(`not found: ${root}`); process.exit(1); }
  const isDir = fs.statSync(root).isDirectory();
  const base = isDir ? root : path.dirname(root);
  for (const f of walk(root, [])) files.push({ abs: f, root, isDir, rel: path.relative(base, f) });
}

const index = { generatedAt: new Date().toISOString(), inputs: roots, files: [] };
for (const f of files) {
  const ext = path.extname(f.abs).toLowerCase();
  const entry = { source: f.abs, relative: f.rel.split(path.sep).join('/'), format: ext || '(none)', kind: 'unsupported', output: null, chars: null, note: null };
  try {
    let text = null;
    if (OOXML[ext]) text = OOXML[ext](unzip(fs.readFileSync(f.abs)));
    else if (HTML.has(ext)) text = html(fs.readFileSync(f.abs, 'utf8'));
    else if (TEXT.has(ext)) { entry.kind = 'text'; entry.chars = fs.statSync(f.abs).size; }
    else if (NATIVE.has(ext)) { entry.kind = 'native'; entry.note = ext === '.pdf' ? 'read with the Read tool (use pages for long PDFs)' : 'image: read with the Read tool'; }
    else entry.note = 'legacy or unknown format: ask for a .docx/.xlsx/.pptx/.pdf copy';

    if (text !== null) {
      const label = roots.length > 1 && f.isDir ? `${path.basename(f.root)}__` : '';
      const outName = `${label}${entry.relative.replace(/[\\/:]/g, '__')}.md`;
      fs.writeFileSync(path.join(textDir, outName), `<!-- converted by Modernia from ${entry.relative} -->\n\n${text}\n`);
      entry.kind = 'converted';
      entry.output = `text/${outName}`;
      entry.chars = text.length;
      if (!text.trim()) entry.note = 'no text found (scanned document or images only?)';
    }
  } catch (err) {
    entry.kind = 'error';
    entry.note = err.message;
  }
  index.files.push(entry);
}

fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2) + '\n');

const by = (k) => index.files.filter((x) => x.kind === k);
console.log(`Documents: ${index.files.length}  converted ${by('converted').length} · text ${by('text').length} · native ${by('native').length} · unsupported ${by('unsupported').length} · error ${by('error').length}`);
for (const x of [...by('unsupported'), ...by('error')]) console.log(`  ! ${x.relative}: ${x.note}`);
for (const x of by('converted').filter((y) => y.note)) console.log(`  ? ${x.relative}: ${x.note}`);
console.log(`Index: ${path.join(outDir, 'index.json')}`);
