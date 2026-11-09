#!/usr/bin/env node
// Modernia board: the shared workspace (state, tasks, questions, events).
// Zero dependencies. Run from the project root; use --ws to point elsewhere.
//
//   init   --name <n> --lang es|en [--code <path>[,<path>]] [--docs <path>[,<path>]] --plugin-root <dir> [--force]
//   show   [--json]
//   phase  <name>
//   step   <name> <todo|doing|done|blocked|skipped> [--note <text>]
//   gate   <name> <pending|approved|rejected> [--note <text>]      (sprint gates: sprint-<n>)
//   target <path> [--create]                                         where the modernized code lives
//   sprint <n>                                                       current sprint
//   story  move <US-n> <status> [--by <agent>] [--note <text>]
//   story  list [--sprint <n>] [--status <s>]
//   task   add --title <t> --owner <agent> [--phase <p>] [--depends T-1,T-2]
//   task   move <T-n> <todo|doing|blocked|done> [--note <text>]
//   task   list [--status <s>] [--phase <p>]
//   q      add --by <agent> --text <t> [--blocking] [--ref <ID>]
//   q      answer <Q-n> --text <t> [--by human]
//   q      list [--open]
//   log    --agent <a> --type <type> --msg <text> [--ref <ID>]

import fs from 'node:fs';
import path from 'node:path';

const PHASES = ['intake', 'understanding', 'architecture', 'planning', 'foundation', 'build', 'release', 'done'];
const GATES = ['sources', 'understanding', 'architecture', 'foundation', 'release'];
const STORY_STATUS = ['not-ready', 'todo', 'doing', 'testing', 'review', 'blocked', 'done'];
const STEP_STATUS = ['todo', 'doing', 'done', 'blocked', 'skipped'];
const TASK_STATUS = ['todo', 'doing', 'blocked', 'done'];
const GATE_STATUS = ['pending', 'approved', 'rejected'];
const EVENT_TYPES = ['start', 'done', 'finding', 'warning', 'decision', 'question', 'answer', 'task', 'gate', 'phase', 'info'];

function parse(args) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = args[i + 1];
      if (next === undefined || next.startsWith('--')) opt[key] = true;
      else { opt[key] = next; i++; }
    } else pos.push(a);
  }
  return { pos, opt };
}

const { pos, opt } = parse(process.argv.slice(2));
const WS = path.resolve(opt.ws || '.modernia');
const file = (name) => path.join(WS, name);
const now = () => new Date().toISOString();

function fail(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function read(name) {
  try {
    return JSON.parse(fs.readFileSync(file(name), 'utf8'));
  } catch {
    fail(`cannot read ${file(name)}. Run "init" first (or pass --ws).`);
  }
}

function write(name, data) {
  const target = file(name);
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmp, target);
}

function event(agent, type, msg, ref) {
  const entry = { ts: now(), agent, type, msg };
  if (ref) entry.ref = ref;
  fs.appendFileSync(file('events.jsonl'), JSON.stringify(entry) + '\n');
}

function nextId(list, prefix) {
  const max = list.reduce((m, x) => Math.max(m, Number(String(x.id).split('-')[1]) || 0), 0);
  return `${prefix}-${max + 1}`;
}

function need(value, label) {
  if (value === undefined || value === true || value === '') fail(`missing ${label}`);
  return value;
}

function oneOf(value, list, label) {
  if (!list.includes(value)) fail(`${label} must be one of: ${list.join(', ')}`);
  return value;
}

function paths(value) {
  if (!value || value === true) return [];
  return String(value).split(',').map((p) => p.trim()).filter(Boolean).map((p) => {
    const abs = path.resolve(p);
    if (!fs.existsSync(abs)) fail(`path not found: ${abs}`);
    return abs;
  });
}

function touchState(mutator) {
  const state = read('state.json');
  mutator(state);
  state.updatedAt = now();
  write('state.json', state);
  return state;
}

// ---------------------------------------------------------------- commands

function init() {
  if (fs.existsSync(file('config.json')) && !opt.force) {
    fail(`${WS} already exists. Use --force to recreate it.`);
  }
  const code = paths(opt.code);
  const docs = paths(opt.docs);
  if (!code.length && !docs.length) fail('give at least one --code or --docs path');
  const language = oneOf(opt.lang || 'es', ['es', 'en'], '--lang');
  const pluginRoot = path.resolve(need(opt['plugin-root'], '--plugin-root'));
  const mode = code.length && docs.length ? 'both' : code.length ? 'code' : 'docs';

  for (const dir of ['', 'sources', 'sources/text', 'deliverables', 'deliverables/04-architecture', 'deliverables/04-architecture/adr', 'deliverables/06-ux', 'deliverables/09-release', 'deliverables/sprints', 'reviews']) {
    fs.mkdirSync(file(dir), { recursive: true });
  }
  const createdAt = now();
  write('config.json', {
    version: 1,
    project: { name: need(opt.name, '--name') },
    language,
    mode,
    sources: { code, docs },
    target: null,
    pluginRoot,
    createdAt,
  });
  write('state.json', {
    phase: 'intake',
    sprint: null,
    phases: PHASES,
    steps: {},
    gates: Object.fromEntries(GATES.map((g) => [g, { status: 'pending' }])),
    createdAt,
    updatedAt: createdAt,
  });
  write('board.json', { tasks: [] });
  write('questions.json', { questions: [] });
  write('backlog.json', { epics: [], stories: [], sprints: [] });
  fs.writeFileSync(file('events.jsonl'), '');
  fs.writeFileSync(file('.gitignore'), '# Derived from client material: review before committing.\n');
  event('administrator', 'phase', `Workspace created (mode: ${mode})`);
  console.log(`Workspace ready: ${WS}`);
  console.log(`mode=${mode} language=${language} code=${code.length} docs=${docs.length}`);
}

function show() {
  const config = read('config.json');
  const state = read('state.json');
  const { tasks } = read('board.json');
  const { questions } = read('questions.json');
  const open = questions.filter((q) => q.status === 'open');
  if (opt.json) {
    console.log(JSON.stringify({ config, state, tasks, questions }, null, 2));
    return;
  }
  const count = (s) => tasks.filter((t) => t.status === s).length;
  console.log(`Project: ${config.project.name}  |  mode: ${config.mode}  |  language: ${config.language}`);
  console.log(`Phase: ${state.phase}${state.sprint ? ` · sprint ${state.sprint}` : ''}${config.target ? ` · target: ${config.target}` : ''}`);
  console.log(`Gates: ${Object.entries(state.gates).map(([g, v]) => `${g}=${v.status}`).join('  ')}`);
  const { stories = [] } = read('backlog.json');
  if (stories.length) {
    const by = {};
    for (const s of stories) by[s.status] = (by[s.status] || 0) + 1;
    const pts = stories.filter((s) => s.status === 'done').reduce((n, s) => n + (s.points || 0), 0);
    const total = stories.reduce((n, s) => n + (s.points || 0), 0);
    console.log(`Stories: ${stories.length} (${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(', ')}) · points ${pts}/${total}`);
  }
  const steps = Object.entries(state.steps);
  if (steps.length) console.log(`Steps: ${steps.map(([k, v]) => `${k}=${v.status}`).join('  ')}`);
  console.log(`Tasks: ${tasks.length} (todo ${count('todo')}, doing ${count('doing')}, blocked ${count('blocked')}, done ${count('done')})`);
  for (const t of tasks.filter((x) => x.status !== 'done')) {
    console.log(`  ${t.id} [${t.status}] ${t.owner}: ${t.title}`);
  }
  console.log(`Open questions: ${open.length} (blocking ${open.filter((q) => q.blocking).length})`);
  for (const q of open) console.log(`  ${q.id}${q.blocking ? ' [BLOCKING]' : ''} (${q.by}) ${q.text}`);
}

function phase() {
  const name = oneOf(pos[1], PHASES, 'phase');
  touchState((s) => { s.phase = name; });
  event('administrator', 'phase', `Phase: ${name}`);
  console.log(`phase=${name}`);
}

function step() {
  const name = need(pos[1], 'step name');
  const status = oneOf(pos[2], STEP_STATUS, 'step status');
  touchState((s) => {
    s.steps[name] = { status, at: now(), ...(opt.note ? { note: opt.note } : {}) };
  });
  console.log(`step ${name}=${status}`);
}

function gate() {
  const name = need(pos[1], 'gate name');
  if (!GATES.includes(name) && !/^sprint-\d+$/.test(name)) fail(`gate must be one of: ${GATES.join(', ')}, sprint-<n>`);
  const status = oneOf(pos[2], GATE_STATUS, 'gate status');
  touchState((s) => {
    s.gates[name] = { status, at: now(), ...(opt.note ? { note: opt.note } : {}) };
  });
  event('human', 'gate', `Gate ${name}: ${status}${opt.note ? ` — ${opt.note}` : ''}`);
  console.log(`gate ${name}=${status}`);
}

function target() {
  const abs = path.resolve(need(pos[1], 'target path'));
  const config = read('config.json');
  const norm = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
  const inside = (child, parent) => norm(child) === norm(parent) || norm(child).startsWith(norm(parent) + path.sep);
  const sources = [...config.sources.code, ...config.sources.docs];
  if (sources.some((s) => inside(abs, s))) fail('the target cannot be inside a source folder (sources are read-only)');
  if (!fs.existsSync(abs)) {
    if (opt.create) fs.mkdirSync(abs, { recursive: true });
    else fail(`path not found: ${abs} (use --create)`);
  }
  config.target = abs;
  write('config.json', config);
  event('administrator', 'decision', `Target repository: ${abs}`);
  console.log(`target=${abs}`);
}

function sprint() {
  const n = Number(need(pos[1], 'sprint number'));
  if (!Number.isInteger(n) || n < 1) fail('sprint must be a positive integer');
  touchState((s) => { s.sprint = n; });
  event('scrum-master', 'phase', `Sprint ${n} started`);
  console.log(`sprint=${n}`);
}

function story() {
  const backlog = read('backlog.json');
  const sub = pos[1];
  if (sub === 'move') {
    const s = backlog.stories.find((x) => x.id === pos[2]);
    if (!s) fail(`story not found: ${pos[2]}`);
    s.status = oneOf(pos[3], STORY_STATUS, 'story status');
    s.updatedAt = now();
    if (opt.note && opt.note !== true) (s.notes ??= []).push({ at: now(), text: opt.note });
    write('backlog.json', backlog);
    const by = opt.by && opt.by !== true ? opt.by : 'scrum-master';
    event(by, 'task', `${s.id} → ${s.status}${opt.note ? `: ${opt.note}` : ''}`, s.id);
    console.log(`${s.id}=${s.status}`);
  } else if (sub === 'list') {
    let list = backlog.stories;
    if (opt.sprint) list = list.filter((s) => String(s.sprint) === String(opt.sprint));
    if (opt.status) list = list.filter((s) => s.status === opt.status);
    for (const s of list) {
      const dep = s.dependsOn?.length ? ` (after ${s.dependsOn.join(', ')})` : '';
      console.log(`${s.id} [${s.status}] sprint ${s.sprint ?? '-'} · ${s.epic} · ${s.points ?? '?'} pts: ${s.title}${dep}`);
    }
    if (!list.length) console.log('(no stories)');
  } else fail('story move | list');
}

function task() {
  const board = read('board.json');
  const sub = pos[1];
  if (sub === 'add') {
    const id = nextId(board.tasks, 'T');
    const depends = opt.depends && opt.depends !== true ? String(opt.depends).split(',').map((d) => d.trim()) : [];
    const t = {
      id,
      title: need(opt.title, '--title'),
      owner: need(opt.owner, '--owner'),
      phase: opt.phase && opt.phase !== true ? opt.phase : read('state.json').phase,
      status: 'todo',
      dependsOn: depends,
      createdAt: now(),
      updatedAt: now(),
      notes: [],
    };
    board.tasks.push(t);
    write('board.json', board);
    event('scrum-master', 'task', `${id} created for ${t.owner}: ${t.title}`, id);
    console.log(id);
  } else if (sub === 'move') {
    const t = board.tasks.find((x) => x.id === pos[2]);
    if (!t) fail(`task not found: ${pos[2]}`);
    t.status = oneOf(pos[3], TASK_STATUS, 'task status');
    t.updatedAt = now();
    if (opt.note && opt.note !== true) t.notes.push({ at: now(), text: opt.note });
    write('board.json', board);
    event(t.owner, 'task', `${t.id} → ${t.status}${opt.note ? `: ${opt.note}` : ''}`, t.id);
    console.log(`${t.id}=${t.status}`);
  } else if (sub === 'list') {
    let list = board.tasks;
    if (opt.status) list = list.filter((t) => t.status === opt.status);
    if (opt.phase) list = list.filter((t) => t.phase === opt.phase);
    for (const t of list) {
      const dep = t.dependsOn.length ? ` (after ${t.dependsOn.join(', ')})` : '';
      console.log(`${t.id} [${t.status}] ${t.phase} · ${t.owner}: ${t.title}${dep}`);
    }
    if (!list.length) console.log('(no tasks)');
  } else fail('task add | move | list');
}

function questions() {
  const data = read('questions.json');
  const sub = pos[1];
  if (sub === 'add') {
    const id = nextId(data.questions, 'Q');
    const q = {
      id,
      by: need(opt.by, '--by'),
      text: need(opt.text, '--text'),
      blocking: opt.blocking === true,
      ref: opt.ref && opt.ref !== true ? opt.ref : null,
      status: 'open',
      askedAt: now(),
      answer: null,
    };
    data.questions.push(q);
    write('questions.json', data);
    event(q.by, 'question', `${id}${q.blocking ? ' (blocking)' : ''}: ${q.text}`, id);
    console.log(id);
  } else if (sub === 'answer') {
    const q = data.questions.find((x) => x.id === pos[2]);
    if (!q) fail(`question not found: ${pos[2]}`);
    q.answer = need(opt.text, '--text');
    q.answeredBy = opt.by && opt.by !== true ? opt.by : 'human';
    q.answeredAt = now();
    q.status = 'answered';
    write('questions.json', data);
    event(q.answeredBy, 'answer', `${q.id}: ${q.answer}`, q.id);
    console.log(`${q.id}=answered`);
  } else if (sub === 'list') {
    let list = data.questions;
    if (opt.open) list = list.filter((q) => q.status === 'open');
    for (const q of list) {
      const head = `${q.id} [${q.status}${q.blocking ? ', blocking' : ''}] (${q.by}${q.ref ? ` · ${q.ref}` : ''})`;
      console.log(`${head} ${q.text}${q.answer ? `\n    → ${q.answer}` : ''}`);
    }
    if (!list.length) console.log('(no questions)');
  } else fail('q add | answer | list');
}

function log() {
  const type = oneOf(need(opt.type, '--type'), EVENT_TYPES, '--type');
  event(need(opt.agent, '--agent'), type, need(opt.msg, '--msg'), opt.ref && opt.ref !== true ? opt.ref : undefined);
  console.log('logged');
}

const commands = { init, show, phase, step, gate, target, sprint, story, task, q: questions, log };
const cmd = commands[pos[0]];
if (!cmd) {
  console.log('usage: board.mjs <init|show|phase|step|gate|target|sprint|story|task|q|log> ... [--ws <dir>]');
  process.exit(pos[0] ? 1 : 0);
}
cmd();
