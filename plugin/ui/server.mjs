#!/usr/bin/env node
// Modernia dashboard server. Zero dependencies, read-only.
//
//   node server.mjs [--ws .modernia] [--port 4747] [--open]
//
// Serves the dashboard on http://127.0.0.1:<port> and streams a "change"
// event (Server-Sent Events) whenever something in the workspace changes, so
// the page follows the agents live. It never writes to the workspace.

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};

const WS = path.resolve(arg('ws', '.modernia'));
const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
let port = Number(arg('port', 4747));

if (!fs.existsSync(path.join(WS, 'config.json'))) {
  console.error(`No Modernia workspace at ${WS}. Run /modernia:modernize first, or pass --ws <path to .modernia>.`);
  process.exit(1);
}

// ------------------------------------------------------------------ data

function readJson(name, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(WS, name), 'utf8'));
  } catch {
    return fallback;
  }
}

function readEvents(limit = 600) {
  try {
    const lines = fs.readFileSync(path.join(WS, 'events.jsonl'), 'utf8').split('\n').filter(Boolean);
    return lines.slice(-limit).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  } catch {
    return [];
  }
}

const VIEWABLE = new Set(['.md', '.json', '.html', '.txt']);

function listFiles(dir) {
  const root = path.join(WS, dir);
  const out = [];
  const walk = (d) => {
    let entries = [];
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const abs = path.join(d, e.name);
      if (e.isDirectory()) walk(abs);
      else if (VIEWABLE.has(path.extname(e.name).toLowerCase())) {
        const st = fs.statSync(abs);
        out.push({ path: path.relative(WS, abs).split(path.sep).join('/'), size: st.size, mtime: st.mtime.toISOString() });
      }
    }
  };
  walk(root);
  return out.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true }));
}

function snapshot() {
  const config = readJson('config.json', {});
  return {
    generatedAt: new Date().toISOString(),
    workspace: WS,
    config,
    state: readJson('state.json', {}),
    board: readJson('board.json', { tasks: [] }),
    questions: readJson('questions.json', { questions: [] }),
    backlog: readJson('backlog.json', { epics: [], stories: [], sprints: [] }),
    estimate: readJson('estimate.json', null),
    events: readEvents(),
    files: [...listFiles('deliverables'), ...listFiles('reviews')],
  };
}

// Only files inside the workspace, and only text formats.
function safeFile(rel) {
  if (!rel) return null;
  const abs = path.resolve(WS, rel);
  if (!abs.startsWith(WS + path.sep)) return null;
  if (!VIEWABLE.has(path.extname(abs).toLowerCase())) return null;
  return fs.existsSync(abs) && fs.statSync(abs).isFile() ? abs : null;
}

// ------------------------------------------------------------------ live updates

const clients = new Set();
let timer = null;
function notify() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    for (const res of clients) res.write(`event: change\ndata: ${Date.now()}\n\n`);
  }, 250);
}
try {
  fs.watch(WS, { recursive: true }, (_, file) => {
    if (!file || !String(file).endsWith('.tmp')) notify();
  });
} catch {
  // recursive watch unavailable: the page falls back to polling
}

// ------------------------------------------------------------------ http

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method !== 'GET') return send(res, 405, '{"error":"read-only"}');

  if (url.pathname === '/api/snapshot') return send(res, 200, JSON.stringify(snapshot()));

  if (url.pathname === '/api/file') {
    const abs = safeFile(url.searchParams.get('path'));
    if (!abs) return send(res, 404, '{"error":"not found"}');
    return send(res, 200, fs.readFileSync(abs, 'utf8'), 'text/plain; charset=utf-8');
  }

  if (url.pathname === '/api/live') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write('retry: 3000\n\n');
    clients.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 25000);
    req.on('close', () => { clearInterval(ping); clients.delete(res); });
    return;
  }

  const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const abs = path.resolve(PUBLIC, name);
  if (!abs.startsWith(PUBLIC + path.sep) || !fs.existsSync(abs)) return send(res, 404, 'Not found', 'text/plain');
  send(res, 200, fs.readFileSync(abs), TYPES[path.extname(abs)] || 'application/octet-stream');
});

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && port < 4767) {
    port += 1;
    server.listen(port, '127.0.0.1');
  } else {
    console.error(err.message);
    process.exit(1);
  }
});

server.on('listening', () => {
  const url = `http://127.0.0.1:${port}`;
  console.log(`Modernia dashboard: ${url}`);
  console.log(`Workspace: ${WS} (read-only)`);
  if (args.includes('--open')) openBrowser(url);
});

server.listen(port, '127.0.0.1');
