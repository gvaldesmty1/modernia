#!/usr/bin/env node
// Modernia code scan. Zero dependencies. Technology-agnostic: it measures, it
// does not interpret. The project-analyst agent interprets the result.
//
//   node scan.mjs <folder>... [--out .modernia/sources/scan.json]
//
// Output: files and lines per extension, binary files, top-level folders, the
// largest text files and "markers" (file names that usually reveal a
// technology). Markers are hints only: unknown technologies still show up in
// the extension table.

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const inputs = [];
let out = '.modernia/sources/scan.json';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--out') out = args[++i];
  else inputs.push(args[i]);
}
if (!inputs.length) {
  console.log('usage: scan.mjs <folder>... [--out .modernia/sources/scan.json]');
  process.exit(1);
}

const IGNORE = new Set(['.git', '.svn', '.hg', 'node_modules', 'bin', 'obj', 'packages', '.vs', '.idea', '.vscode', '.modernia', 'dist', 'build', 'target', '__pycache__', '.venv', 'venv', '.gradle']);
const MAX_TEXT = 10 * 1024 * 1024;

const MARKERS = [
  [/\.(vbp|vbg)$/i, 'Visual Basic 6 project'],
  [/\.(frm|bas|cls|ctl)$/i, 'Visual Basic 6 / VBA source'],
  [/\.sln$/i, 'Visual Studio solution'],
  [/\.(cs|vb|fs)proj$/i, '.NET project'],
  [/^(web|app)\.config$/i, '.NET configuration'],
  [/\.(asp|aspx|asmx|ascx)$/i, 'ASP / ASP.NET'],
  [/^pom\.xml$/i, 'Java (Maven)'],
  [/^build\.gradle(\.kts)?$/i, 'Java/Kotlin (Gradle)'],
  [/\.jsp$/i, 'Java Server Pages'],
  [/^package\.json$/i, 'Node.js'],
  [/^(requirements\.txt|pyproject\.toml|setup\.py)$/i, 'Python'],
  [/^composer\.json$/i, 'PHP (Composer)'],
  [/^Gemfile$/, 'Ruby'],
  [/^go\.mod$/, 'Go'],
  [/^Cargo\.toml$/, 'Rust'],
  [/\.(cbl|cob|cpy)$/i, 'COBOL'],
  [/\.jcl$/i, 'JCL (mainframe batch)'],
  [/\.(rpgle|sqlrpgle|clle|dspf|pf|lf)$/i, 'IBM i (RPG/CL/DDS)'],
  [/\.(pbl|pbt|srw|srd|sru)$/i, 'PowerBuilder'],
  [/\.(dpr|dproj|dfm|pas)$/i, 'Delphi / Pascal'],
  [/\.(fmb|fmx|rdf|pll|pks|pkb)$/i, 'Oracle Forms / Reports / PL-SQL'],
  [/\.(prg|scx|vcx|frx)$/i, 'Visual FoxPro'],
  [/\.(4gl|per)$/i, 'Informix 4GL'],
  [/\.(mdb|accdb)$/i, 'MS Access database'],
  [/\.(sql|ddl)$/i, 'SQL scripts'],
  [/\.rpt$/i, 'Crystal Reports'],
  [/\.(ocx|dll|tlb)$/i, 'Binary component (COM / ActiveX / DLL)'],
  [/\.(wsdl|xsd)$/i, 'Web service / XML contract'],
  [/^Dockerfile$/i, 'Docker'],
  [/\.(ini|cfg|properties)$/i, 'Configuration files'],
  [/\.(bat|cmd|ps1|sh|ksh)$/i, 'Scripts (batch / shell)'],
];

function isBinary(fd) {
  const buf = Buffer.alloc(8000);
  const n = fs.readSync(fd, buf, 0, buf.length, 0);
  return buf.subarray(0, n).includes(0);
}

const byExt = {};
const markers = new Map();
const topDirs = {};
const textFiles = [];
let totalFiles = 0;
let totalLines = 0;
let totalBytes = 0;

function visit(root, dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE.has(entry.name)) visit(root, abs);
      continue;
    }
    if (!entry.isFile()) continue;
    const rel = path.relative(root, abs).split(path.sep).join('/');
    const label = inputs.length > 1 ? `${path.basename(root)}/${rel}` : rel;
    const ext = path.extname(entry.name).toLowerCase() || `(${entry.name})`;
    const size = fs.statSync(abs).size;
    const bucket = (byExt[ext] ??= { files: 0, lines: 0, bytes: 0, binary: 0 });
    bucket.files++;
    bucket.bytes += size;
    totalFiles++;
    totalBytes += size;

    const top = label.includes('/') ? label.split('/').slice(0, inputs.length > 1 ? 2 : 1).join('/') : '(root)';
    topDirs[top] = (topDirs[top] || 0) + 1;

    for (const [re, name] of MARKERS) {
      if (re.test(entry.name)) {
        const m = markers.get(name) || { technology: name, count: 0, examples: [] };
        m.count++;
        if (m.examples.length < 15) m.examples.push(label);
        markers.set(name, m);
      }
    }

    let fd;
    try {
      fd = fs.openSync(abs, 'r');
      if (size === 0) continue;
      if (isBinary(fd)) { bucket.binary++; continue; }
      if (size > MAX_TEXT) continue;
      const content = fs.readFileSync(abs, 'latin1');
      const lines = content.split('\n').length;
      bucket.lines += lines;
      totalLines += lines;
      textFiles.push({ path: label, lines, bytes: size });
    } catch {
      // unreadable file: counted, not measured
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }
  }
}

for (const input of inputs) {
  const root = path.resolve(input);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    console.error(`not a folder: ${root}`);
    process.exit(1);
  }
  visit(root, root);
}

const extensions = Object.entries(byExt)
  .map(([ext, v]) => ({ ext, ...v }))
  .sort((a, b) => b.lines - a.lines || b.files - a.files);
const result = {
  generatedAt: new Date().toISOString(),
  roots: inputs.map((i) => path.resolve(i)),
  totals: { files: totalFiles, textLines: totalLines, bytes: totalBytes },
  extensions,
  markers: [...markers.values()].sort((a, b) => b.count - a.count),
  topFolders: Object.entries(topDirs).map(([folder, files]) => ({ folder, files })).sort((a, b) => b.files - a.files),
  largestFiles: textFiles.sort((a, b) => b.lines - a.lines).slice(0, 30),
  ignoredFolders: [...IGNORE],
};

const outPath = path.resolve(out);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(result, null, 2) + '\n');

console.log(`Files: ${totalFiles} · text lines: ${totalLines} · ${(totalBytes / 1024).toFixed(0)} KB`);
console.log('Top extensions:');
for (const e of extensions.slice(0, 12)) console.log(`  ${e.ext.padEnd(14)} ${String(e.files).padStart(6)} files ${String(e.lines).padStart(9)} lines${e.binary ? ` (${e.binary} binary)` : ''}`);
if (result.markers.length) console.log(`Markers: ${result.markers.map((m) => `${m.technology} (${m.count})`).join(', ')}`);
console.log(`Scan: ${outPath}`);
