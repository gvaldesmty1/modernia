// Modernia dashboard. Read-only view of a .modernia workspace, updated live.
'use strict';

// ------------------------------------------------------------------ i18n

const T = {
  es: {
    overview: 'Resumen', phases: 'Fases y aprobaciones', agents: 'Agentes', board: 'Tablero', backlog: 'Backlog y sprints',
    questions: 'Preguntas', estimate: 'Estimación', docs: 'Entregables', activity: 'Actividad',
    live: 'En vivo', offline: 'Sin conexión, reintentando', snapshot: 'Instantánea', mode: { code: 'Código', docs: 'Documentos', both: 'Código + documentos' },
    phase: {
      intake: 'Insumos', understanding: 'Entendimiento', estimation: 'Estimación', architecture: 'Arquitectura',
      planning: 'Planificación', foundation: 'Fundación', build: 'Construcción', release: 'Liberación', done: 'Terminado',
    },
    gateAsk: {
      intake: '¿Es el material correcto y no falta nada importante?',
      understanding: '¿Esto es lo que hace el sistema?',
      estimation: '¿Apruebas la estimación de tiempo, equipo y costo?',
      architecture: '¿Qué opción de arquitectura eliges?',
      planning: '¿Apruebas el plan? ¿Se construye o se para en el diagnóstico?',
      foundation: '¿Apruebas el esqueleto del sistema nuevo?',
      build: '¿La ola está completa y lista para liberar?',
      release: '¿Apruebas la liberación y en qué ambientes?',
    },
    gate: { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Con cambios' },
    current: 'En curso', currentPhase: 'Fase actual', waiting: 'Esperando tu aprobación',
    waitingHow: 'Responde en Claude Code con /modernia:modernize.',
    allClear: 'No hay nada esperando tu respuesta', allClearSub: 'Los agentes están trabajando o el proyecto está al día.',
    openQuestions: 'Preguntas abiertas', blocking: 'bloqueantes', blockingSingle: 'bloqueante', blockingOne: 'Bloqueante',
    type: { start: 'inicio', done: 'terminado', finding: 'hallazgo', warning: 'alerta', decision: 'decisión', question: 'pregunta', answer: 'respuesta', task: 'tarea', gate: 'aprobación', phase: 'fase', info: 'info', model: 'modelo' },
    policy: { balanced: 'Modelos: equilibrado', economy: 'Modelos: económico', quality: 'Modelos: máxima calidad' }, modelsUsed: 'Modelos usados', modelNow: 'Modelo',
    tasks: 'Tareas', stories: 'Historias', points: 'puntos', estimateKpi: 'Estimación (P50)',
    noEstimate: 'Todavía no hay estimación', recentActivity: 'Actividad reciente', seeAll: 'Ver todo',
    working: 'Trabajando', idle: 'En espera', notStarted: 'Aún no participa', lastAction: 'Última acción',
    deliverablesDone: 'entregables', nowWorking: 'Trabajando ahora', nobodyWorking: 'Ningún agente está trabajando en este momento.',
    allPhases: 'Todas las fases', allSprints: 'Todos los sprints', sprint: 'Sprint', epics: 'Épicas',
    taskStatus: { todo: 'Por hacer', doing: 'En curso', blocked: 'Bloqueada', done: 'Hecha' },
    storyStatus: { 'not-ready': 'No lista', todo: 'Por hacer', doing: 'Desarrollo', testing: 'Pruebas', review: 'Revisión', blocked: 'Bloqueada', done: 'Hecha' },
    open: 'Abiertas', answered: 'Respondidas', askedBy: 'Pregunta de', answer: 'Respuesta',
    noQuestions: 'No hay preguntas.', noTasks: 'No hay tareas en el tablero todavía.', noStories: 'El backlog se arma en la fase de planificación.',
    scenario: 'Escenario', team: 'Equipo', weeks: 'Semanas', hours: 'Horas', cost: 'Costo', range: 'Rango P50 → P80',
    recommended: 'Recomendado', confidence: 'Confianza', conf: { low: 'baja', medium: 'media', high: 'alta' }, agentsCount: 'roles trabajando sobre el mismo pizarrón', version: { initial: 'Inicial (antes del diseño)', refined: 'Refinada (con la arquitectura)' },
    waves: 'Por ola', wave: 'Ola', ratesPending: 'tarifas pendientes', readFull: 'Leer la estimación completa',
    noDocs: 'Todavía no hay entregables.', chooseDoc: 'Elige un entregable de la lista.', updated: 'Actualizado',
    reviews: 'Revisiones', sprints: 'Sprints', architecture: 'Arquitectura', ux: 'UX', release: 'Liberación', general: 'Diagnóstico y plan',
    allAgents: 'Todos los agentes', history: 'Historial', reset: 'reabierta', note: 'Nota', target: 'Repositorio destino',
    gateHistory: 'Aprobaciones anteriores', sprintGates: 'Sprints aceptados', readOnly: 'Solo lectura',
    progress: 'Avance', of: 'de', you: 'Tú',
  },
  en: {
    overview: 'Overview', phases: 'Phases and approvals', agents: 'Agents', board: 'Board', backlog: 'Backlog and sprints',
    questions: 'Questions', estimate: 'Estimate', docs: 'Deliverables', activity: 'Activity',
    live: 'Live', offline: 'Offline, retrying', snapshot: 'Snapshot', mode: { code: 'Code', docs: 'Documents', both: 'Code + documents' },
    phase: {
      intake: 'Intake', understanding: 'Understanding', estimation: 'Estimation', architecture: 'Architecture',
      planning: 'Planning', foundation: 'Foundation', build: 'Build', release: 'Release', done: 'Done',
    },
    gateAsk: {
      intake: 'Is this the right material, with nothing important missing?',
      understanding: 'Is this what the system does?',
      estimation: 'Do you approve the time, team and cost estimate?',
      architecture: 'Which architecture option do you choose?',
      planning: 'Do you approve the plan? Build, or stop with the diagnosis?',
      foundation: 'Do you approve the skeleton of the new system?',
      build: 'Is the wave complete and ready to release?',
      release: 'Do you approve the release, and to which environments?',
    },
    gate: { pending: 'Pending', approved: 'Approved', rejected: 'Changes requested' },
    current: 'In progress', currentPhase: 'Current phase', waiting: 'Waiting for your approval',
    waitingHow: 'Answer in Claude Code with /modernia:modernize.',
    allClear: 'Nothing is waiting for you', allClearSub: 'The agents are working or the project is up to date.',
    openQuestions: 'Open questions', blocking: 'blocking', blockingSingle: 'blocking', blockingOne: 'Blocking',
    type: { start: 'start', done: 'done', finding: 'finding', warning: 'warning', decision: 'decision', question: 'question', answer: 'answer', task: 'task', gate: 'approval', phase: 'phase', info: 'info', model: 'model' },
    policy: { balanced: 'Models: balanced', economy: 'Models: economy', quality: 'Models: maximum quality' }, modelsUsed: 'Models used', modelNow: 'Model',
    tasks: 'Tasks', stories: 'Stories', points: 'points', estimateKpi: 'Estimate (P50)',
    noEstimate: 'No estimate yet', recentActivity: 'Recent activity', seeAll: 'See all',
    working: 'Working', idle: 'Waiting', notStarted: 'Not involved yet', lastAction: 'Last action',
    deliverablesDone: 'deliverables', nowWorking: 'Working now', nobodyWorking: 'No agent is working right now.',
    allPhases: 'All phases', allSprints: 'All sprints', sprint: 'Sprint', epics: 'Epics',
    taskStatus: { todo: 'To do', doing: 'Doing', blocked: 'Blocked', done: 'Done' },
    storyStatus: { 'not-ready': 'Not ready', todo: 'To do', doing: 'Development', testing: 'Testing', review: 'Review', blocked: 'Blocked', done: 'Done' },
    open: 'Open', answered: 'Answered', askedBy: 'Asked by', answer: 'Answer',
    noQuestions: 'No questions.', noTasks: 'No tasks on the board yet.', noStories: 'The backlog is built in the planning phase.',
    scenario: 'Scenario', team: 'Team', weeks: 'Weeks', hours: 'Hours', cost: 'Cost', range: 'Range P50 → P80',
    recommended: 'Recommended', confidence: 'Confidence', conf: { low: 'low', medium: 'medium', high: 'high' }, agentsCount: 'roles working on the same blackboard', version: { initial: 'Initial (before design)', refined: 'Refined (with the architecture)' },
    waves: 'By wave', wave: 'Wave', ratesPending: 'rates pending', readFull: 'Read the full estimate',
    noDocs: 'No deliverables yet.', chooseDoc: 'Choose a deliverable from the list.', updated: 'Updated',
    reviews: 'Reviews', sprints: 'Sprints', architecture: 'Architecture', ux: 'UX', release: 'Release', general: 'Diagnosis and plan',
    allAgents: 'All agents', history: 'History', reset: 'reopened', note: 'Note', target: 'Target repository',
    gateHistory: 'Earlier approvals', sprintGates: 'Accepted sprints', readOnly: 'Read-only',
    progress: 'Progress', of: 'of', you: 'You',
  },
};

const AGENTS = {
  administrator: { es: 'Administrador', en: 'Administrator', roleEs: 'Dirige el proceso y habla contigo', roleEn: 'Runs the process and talks to you', color: '#4f46e5' },
  'scrum-master': { es: 'Scrum Master', en: 'Scrum Master', roleEs: 'Tablero, backlog y sprints', roleEn: 'Board, backlog and sprints', color: '#0891b2' },
  'project-analyst': { es: 'Analista de proyecto', en: 'Project Analyst', roleEs: 'Inventario técnico del sistema', roleEn: 'Technical inventory of the system', color: '#0d9488' },
  'business-analyst': { es: 'Analista de negocio', en: 'Business Analyst', roleEs: 'Procesos, reglas y contradicciones', roleEn: 'Processes, rules and contradictions', color: '#16a34a' },
  'data-engineer': { es: 'Ingeniero de datos', en: 'Data Engineer', roleEs: 'Modelo de datos y migración', roleEn: 'Data model and migration', color: '#65a30d' },
  estimator: { es: 'Estimador', en: 'Estimator', roleEs: 'Tiempo, equipo y costo', roleEn: 'Time, team and cost', color: '#ca8a04' },
  architect: { es: 'Arquitecto', en: 'Architect', roleEs: 'Opciones, ADR y olas de migración', roleEn: 'Options, ADRs and migration waves', color: '#ea580c' },
  'ux-designer': { es: 'Diseñador UX', en: 'UX Designer', roleEs: 'Pantallas modernas y accesibles', roleEn: 'Modern, accessible screens', color: '#db2777' },
  'qa-engineer': { es: 'QA', en: 'QA Engineer', roleEs: 'Equivalencia y tests primero', roleEn: 'Equivalence and tests first', color: '#9333ea' },
  developer: { es: 'Desarrollador', en: 'Developer', roleEs: 'Implementa cada historia', roleEn: 'Implements each story', color: '#2563eb' },
  reviewer: { es: 'Revisor', en: 'Reviewer', roleEs: 'Revisión independiente', roleEn: 'Independent review', color: '#475569' },
  'security-engineer': { es: 'Seguridad', en: 'Security Engineer', roleEs: 'Amenazas, revisión y GO/NO-GO', roleEn: 'Threats, review and GO/NO-GO', color: '#dc2626' },
  'devops-engineer': { es: 'DevOps', en: 'DevOps Engineer', roleEs: 'CI/CD, infraestructura y despliegue', roleEn: 'CI/CD, infrastructure and deployment', color: '#7c3aed' },
};

// ?static shows a single snapshot without the live connection (printing, screenshots).
const STATIC = new URLSearchParams(location.search).has('static');

// Unique avatar codes [es, en].
const SHORT = {
  administrator: ['ADM', 'ADM'], 'scrum-master': ['SM', 'SM'], 'project-analyst': ['AP', 'PA'], 'business-analyst': ['AN', 'BA'],
  'data-engineer': ['DAT', 'DAT'], estimator: ['EST', 'EST'], architect: ['ARQ', 'ARC'], 'ux-designer': ['UX', 'UX'],
  'qa-engineer': ['QA', 'QA'], developer: ['DEV', 'DEV'], reviewer: ['REV', 'REV'], 'security-engineer': ['SEG', 'SEC'], 'devops-engineer': ['OPS', 'OPS'],
};

const PHASES = ['intake', 'understanding', 'estimation', 'architecture', 'planning', 'foundation', 'build', 'release'];
const TABS = ['overview', 'phases', 'agents', 'board', 'backlog', 'questions', 'estimate', 'docs', 'activity'];

// ------------------------------------------------------------------ state

const app = {
  snap: null,
  lang: null,
  tab: 'overview',
  doc: null,
  docCache: new Map(),
  filter: { phase: '', sprint: '', agent: '' },
};

const t = (k) => k.split('.').reduce((o, p) => (o == null ? o : o[p]), T[app.lang]) ?? k;
const $ = (sel) => document.querySelector(sel);

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function agentName(id) {
  if (id === 'human') return t('you');
  const a = AGENTS[id];
  return a ? a[app.lang] : id;
}

function initials(id) {
  if (id === 'human') return '★';
  const code = SHORT[id];
  if (code) return code[app.lang === 'es' ? 0 : 1];
  return String(id).slice(0, 2).toUpperCase();
}

function avatar(id, small = false) {
  const color = AGENTS[id]?.color || (id === 'human' ? '#b45309' : '#64748b');
  return `<span class="avatar${small ? ' sm' : ''}" style="background:${color}" aria-hidden="true">${esc(initials(id))}</span>`;
}

function ago(iso) {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(app.lang, { numeric: 'auto' });
  if (s < 60) return rtf.format(-Math.round(s), 'second');
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute');
  if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
  return new Date(iso).toLocaleDateString(app.lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString(app.lang, { maximumFractionDigits: 1 }));

function money(n, currency) {
  if (n == null) return null;
  try { return Number(n).toLocaleString(app.lang, { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }); }
  catch { return `${fmt(n)} ${currency || ''}`; }
}

function gateChip(status, current) {
  if (status === 'approved') return `<span class="chip ok">✓ ${t('gate.approved')}</span>`;
  if (status === 'rejected') return `<span class="chip bad">↺ ${t('gate.rejected')}</span>`;
  if (current) return `<span class="chip accent">● ${t('current')}</span>`;
  return `<span class="chip">${t('gate.pending')}</span>`;
}

// ------------------------------------------------------------------ derived data

function gateOf(name) {
  const g = app.snap.state.gates || {};
  return g[name] || (name === 'intake' ? g.sources : null) || { status: 'pending' };
}

function openQuestions() {
  return (app.snap.questions.questions || []).filter((q) => q.status === 'open')
    .sort((a, b) => Number(b.blocking) - Number(a.blocking));
}

function modelLabel(tier) {
  return { haiku: 'Haiku', sonnet: 'Sonnet', opus: 'Opus', fable: 'Fable' }[String(tier).toLowerCase()] || tier;
}

function modelsUsed() {
  const count = {};
  for (const e of app.snap.events) if (e.type === 'model') { const k = modelLabel(e.msg.split(':')[0].trim()); count[k] = (count[k] || 0) + 1; }
  return Object.entries(count);
}

function agentStatus(id) {
  const events = app.snap.events.filter((e) => e.agent === id);
  const last = events[events.length - 1];
  const tasks = (app.snap.board.tasks || []).filter((x) => x.owner === id);
  const doingTask = tasks.find((x) => x.status === 'doing');
  let lastStart = -1;
  let lastDone = -1;
  events.forEach((e, i) => { if (e.type === 'start') lastStart = i; if (e.type === 'done') lastDone = i; });
  const working = Boolean(doingTask) || lastStart > lastDone;
  return {
    working,
    started: events.length > 0 || tasks.length > 0,
    last,
    doingTask,
    done: events.filter((e) => e.type === 'done').length,
    model: [...events].reverse().find((e) => e.type === 'model')?.msg.split(':')[0].trim(),
  };
}

// ------------------------------------------------------------------ frame

function renderFrame() {
  const { config, state } = app.snap;
  document.documentElement.lang = app.lang;
  document.title = `${config.project?.name || 'Modernia'} · Modernia`;
  $('#project').innerHTML = `<strong>${esc(config.project?.name)}</strong>
    <span class="chip">${esc(t(`mode.${config.mode}`))}</span>
    <span class="chip accent">${esc(t(`phase.${state.phase}`))}</span>
    <span class="chip">${esc(t(`policy.${config.modelPolicy || 'balanced'}`))}</span>`;
  setLive(Boolean(app.live));
  $('#lang').textContent = app.lang === 'es' ? 'EN' : 'ES';
  $('#lang').title = app.lang === 'es' ? 'Switch to English' : 'Cambiar a español';

  const open = openQuestions().length;
  const badge = { questions: open || '' };
  $('#nav').innerHTML = TABS.map((k) => `<a href="#${k}" class="${app.tab === k ? 'active' : ''}"${app.tab === k ? ' aria-current="page"' : ''}>
    <span>${esc(t(k))}</span>${badge[k] ? `<span class="count">${badge[k]}</span>` : ''}</a>`).join('');
}

function setLive(on) {
  app.live = on;
  const el = $('#live');
  el.classList.toggle('on', on);
  el.querySelector('span').textContent = !app.lang ? '' : STATIC ? t('snapshot') : on ? t('live') : t('offline');
}

// ------------------------------------------------------------------ views

function viewOverview() {
  const { state, board, backlog, estimate, events } = app.snap;
  const phase = state.phase;
  const qs = openQuestions();
  const blocking = qs.filter((q) => q.blocking).length;
  const blockingWord = blocking === 1 ? t('blockingSingle') : t('blocking');
  const gate = gateOf(phase);

  const waiting = phase !== 'done' && gate.status !== 'approved';
  const callout = waiting || qs.length
    ? `<div class="callout"><span class="icon">⏳</span><div>
        <strong>${waiting ? `${t('waiting')}: ${esc(t(`phase.${phase}`))}` : `${qs.length} ${t('openQuestions').toLowerCase()}`}</strong>
        <p>${waiting ? esc(t(`gateAsk.${phase}`)) + ' ' : ''}${qs.length ? `${qs.length} ${t('openQuestions').toLowerCase()}${blocking ? ` (${blocking} ${blockingWord})` : ''}. ` : ''}${esc(t('waitingHow'))}</p>
      </div></div>`
    : `<div class="callout ok"><span class="icon">✓</span><div><strong>${t('allClear')}</strong><p>${t('allClearSub')}</p></div></div>`;

  const tasks = board.tasks || [];
  const stories = backlog.stories || [];
  const pts = (list) => list.reduce((n, s) => n + (Number(s.points) || 0), 0);
  const ptsDone = pts(stories.filter((s) => s.status === 'done'));
  const sc = estimate?.scenarios?.find((s) => s.id === estimate.recommendedScenario) || estimate?.scenarios?.[0];

  const working = Object.keys(AGENTS).filter((id) => agentStatus(id).working);

  return `
    <div class="page-head"><div><h1>${t('overview')}</h1>
      <p>${t('currentPhase')}: <strong>${esc(t(`phase.${phase}`))}</strong>${state.sprint ? ` · ${t('sprint')} ${state.sprint}` : ''}</p></div>
      <span class="chip">${t('readOnly')}</span></div>
    <div class="grid">
      ${callout}
      <section class="card"><h2>${t('phases')} <a href="#phases">${t('seeAll')}</a></h2>${stepper()}</section>
      <div class="grid kpis">
        ${kpi(t('tasks'), `${tasks.filter((x) => x.status === 'done').length}/${tasks.length}`, tasks.filter((x) => x.status === 'blocked').length ? `${tasks.filter((x) => x.status === 'blocked').length} ${t('taskStatus.blocked').toLowerCase()}` : '')}
        ${kpi(t('openQuestions'), qs.length, blocking ? `${blocking} ${blockingWord}` : '')}
        ${kpi(t('stories'), stories.length ? `${stories.filter((s) => s.status === 'done').length}/${stories.length}` : '—', stories.length ? `${ptsDone}/${pts(stories)} ${t('points')}` : '')}
        ${kpi(t('estimateKpi'), sc ? `${fmt(sc.weeks?.p50)} ${t('weeks').toLowerCase()}` : '—', sc ? (money(sc.cost?.p50, estimate.currency) || `${fmt(sc.hours?.p50)} h`) : t('noEstimate'))}
      </div>
      <div class="grid cols-2">
        <section class="card"><h2>${t('nowWorking')} <a href="#agents">${t('agents')}</a></h2>
          ${working.length ? `<ul class="feed">${working.map((id) => {
            const st = agentStatus(id);
            return `<li>${avatar(id)}<div><span class="who">${esc(agentName(id))}</span> <span class="pulse"></span>${st.model ? ` <span class="chip">${esc(modelLabel(st.model))}</span>` : ''}
              <div class="msg muted small">${esc(st.doingTask?.title || st.last?.msg || '')}</div></div><time>${ago(st.last?.ts)}</time></li>`;
          }).join('')}</ul>` : `<p class="muted">${t('nobodyWorking')}</p>`}
        </section>
        <section class="card"><h2>${t('recentActivity')} <a href="#activity">${t('seeAll')}</a></h2>${feed(events.slice(-8).reverse())}</section>
      </div>
    </div>`;
}

function kpi(label, value, sub) {
  return `<div class="card kpi"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="sub">${esc(sub || '')}</div></div>`;
}

function stepper() {
  const current = app.snap.state.phase;
  const ci = PHASES.indexOf(current);
  return `<div class="stepper">${PHASES.map((p, i) => {
    const g = gateOf(p);
    const isCurrent = p === current;
    const cls = g.status === 'approved' ? 'approved' : g.status === 'rejected' ? 'rejected' : isCurrent ? 'current' : '';
    return `<div class="step ${cls}${isCurrent ? ' current' : ''}" title="${esc(t(`gateAsk.${p}`))}">
      <div class="n">${i + 1}</div><div class="name">${esc(t(`phase.${p}`))}</div>
      <div class="st">${gateChip(g.status, isCurrent && current !== 'done')}</div></div>`;
  }).join('')}</div>${current === 'done' ? `<p class="muted small" style="margin:10px 0 0">✓ ${t('phase.done')}${ci < 0 ? '' : ''}</p>` : ''}`;
}

function feed(events) {
  if (!events.length) return `<p class="muted">—</p>`;
  return `<ul class="feed">${events.map((e) => `<li>${avatar(e.agent)}<div><span class="who">${esc(agentName(e.agent))}</span>
    ${typeChip(e.type)}<div class="msg">${esc(e.msg)}</div></div><time title="${esc(e.ts)}">${ago(e.ts)}</time></li>`).join('')}</ul>`;
}

function typeChip(type) {
  const cls = { done: 'ok', start: 'info', finding: 'warn', warning: 'bad', decision: 'accent', question: 'warn', answer: 'ok', gate: 'accent' }[type] || '';
  return `<span class="chip ${cls}">${esc(t(`type.${type}`))}</span>`;
}

function viewPhases() {
  const { state } = app.snap;
  const rows = PHASES.map((p, i) => {
    const g = gateOf(p);
    return `<tr><td class="num faint">${i + 1}</td><td><strong>${esc(t(`phase.${p}`))}</strong><div class="muted small">${esc(t(`gateAsk.${p}`))}</div></td>
      <td>${gateChip(g.status, p === state.phase)}</td><td>${esc(g.note || '')}</td><td class="small faint">${g.at ? ago(g.at) : ''}</td></tr>`;
  }).join('');
  const sprintGates = Object.entries(state.gates || {}).filter(([k]) => /^sprint-\d+$/.test(k));
  const history = state.gateHistory || [];
  return `
    <div class="page-head"><div><h1>${t('phases')}</h1><p>${t('currentPhase')}: <strong>${esc(t(`phase.${state.phase}`))}</strong></p></div></div>
    <div class="grid">
      <section class="card">${stepper()}</section>
      <section class="card table-wrap"><table><thead><tr><th></th><th>${t('phases')}</th><th></th><th>${t('note')}</th><th></th></tr></thead><tbody>${rows}</tbody></table></section>
      ${sprintGates.length ? `<section class="card"><h2>${t('sprintGates')}</h2><div class="filters">${sprintGates.map(([k, v]) => `<span class="chip ${v.status === 'approved' ? 'ok' : v.status === 'rejected' ? 'bad' : ''}">${esc(k)} · ${esc(t(`gate.${v.status}`))}</span>`).join('')}</div></section>` : ''}
      ${history.length ? `<section class="card table-wrap"><h2>${t('gateHistory')}</h2><table><tbody>${history.slice().reverse().map((h) => `<tr><td>${esc(t(`phase.${h.gate}`))}</td><td>${gateChip(h.status)}</td><td>${esc(h.note || '')}</td><td class="small muted">${t('reset')}: ${esc(h.reason)}</td><td class="small faint">${ago(h.resetAt)}</td></tr>`).join('')}</tbody></table></section>` : ''}
    </div>`;
}

function viewAgents() {
  const ids = ['administrator', ...Object.keys(AGENTS).filter((x) => x !== 'administrator')];
  return `
    <div class="page-head"><div><h1>${t('agents')}</h1><p>${Object.keys(AGENTS).length} ${t('agentsCount')}</p></div>
      ${modelsUsed().length ? `<div class="filters"><span class="small muted">${t('modelsUsed')}:</span>${modelsUsed().map(([m, n]) => `<span class="chip">${esc(m)} × ${n}</span>`).join('')}</div>` : ''}</div>
    <div class="agents">${ids.map((id) => {
      const a = AGENTS[id];
      const st = agentStatus(id);
      const status = st.working ? `<span class="chip accent"><span class="pulse"></span> ${t('working')}</span>`
        : st.started ? `<span class="chip">${t('idle')}</span>` : `<span class="chip faint">${t('notStarted')}</span>`;
      return `<article class="card agent${st.working ? ' working' : ''}">${avatar(id)}
        <div><h3>${esc(a[app.lang])}</h3><div class="role">${esc(app.lang === 'es' ? a.roleEs : a.roleEn)}</div>
        <div class="filters">${status}${st.model ? `<span class="chip" title="${esc(t('modelNow'))}">${esc(modelLabel(st.model))}</span>` : ''}${st.done ? `<span class="chip ok">${st.done} ✓</span>` : ''}</div></div>
        ${st.doingTask || st.last ? `<div class="last"><strong>${t('lastAction')}:</strong> ${esc(st.doingTask?.title || st.last?.msg)} <span class="faint">· ${ago(st.last?.ts || st.doingTask?.updatedAt)}</span></div>` : ''}
      </article>`;
    }).join('')}</div>`;
}

function viewBoard() {
  const tasks = (app.snap.board.tasks || []).filter((x) => !app.filter.phase || x.phase === app.filter.phase);
  const phases = [...new Set((app.snap.board.tasks || []).map((x) => x.phase))];
  const cols = ['todo', 'doing', 'blocked', 'done'];
  return `
    <div class="page-head"><div><h1>${t('board')}</h1></div>
      <div class="filters"><select data-filter="phase"><option value="">${t('allPhases')}</option>${phases.map((p) => `<option value="${esc(p)}"${app.filter.phase === p ? ' selected' : ''}>${esc(t(`phase.${p}`))}</option>`).join('')}</select></div></div>
    ${(app.snap.board.tasks || []).length ? `<div class="kanban">${cols.map((c) => {
      const list = tasks.filter((x) => x.status === c);
      return `<section class="column"><header><span>${t(`taskStatus.${c}`)}</span><span class="chip">${list.length}</span></header>
        ${list.map((x) => `<div class="item"><div class="id">${esc(x.id)}</div><div class="title">${esc(x.title)}</div>
          <div class="meta">${avatar(x.owner, true)}<span class="small muted">${esc(agentName(x.owner))}</span>
          <span class="chip">${esc(t(`phase.${x.phase}`))}</span>${x.dependsOn?.length ? `<span class="chip">↳ ${esc(x.dependsOn.join(', '))}</span>` : ''}</div>
          ${x.notes?.length ? `<div class="note">${esc(x.notes[x.notes.length - 1].text)}</div>` : ''}</div>`).join('')}
      </section>`;
    }).join('')}</div>` : `<div class="empty">${t('noTasks')}</div>`}`;
}

function viewBacklog() {
  const { stories = [], epics = [] } = app.snap.backlog;
  if (!stories.length) return `<div class="page-head"><h1>${t('backlog')}</h1></div><div class="empty">${t('noStories')}</div>`;
  const sprints = [...new Set(stories.map((s) => s.sprint).filter((x) => x != null))].sort((a, b) => a - b);
  const list = stories.filter((s) => !app.filter.sprint || String(s.sprint) === app.filter.sprint);
  const cols = ['not-ready', 'todo', 'doing', 'testing', 'review', 'blocked', 'done'];
  const pts = (l) => l.reduce((n, s) => n + (Number(s.points) || 0), 0);
  const sprintRows = sprints.map((n) => {
    const l = stories.filter((s) => s.sprint === n);
    const done = pts(l.filter((s) => s.status === 'done'));
    const total = pts(l);
    return `<tr><td>${t('sprint')} ${n}${app.snap.state.sprint === n ? ' <span class="chip accent">●</span>' : ''}</td><td class="num">${done}/${total}</td><td style="width:45%"><div class="bar"><i style="width:${total ? (100 * done) / total : 0}%"></i></div></td></tr>`;
  }).join('');
  return `
    <div class="page-head"><div><h1>${t('backlog')}</h1><p>${stories.length} ${t('stories').toLowerCase()} · ${pts(stories)} ${t('points')}</p></div>
      <div class="filters"><select data-filter="sprint"><option value="">${t('allSprints')}</option>${sprints.map((n) => `<option value="${n}"${app.filter.sprint === String(n) ? ' selected' : ''}>${t('sprint')} ${n}</option>`).join('')}</select></div></div>
    <div class="grid">
      <div class="kanban">${cols.map((c) => {
        const l = list.filter((s) => (s.status || 'todo') === c);
        if (!l.length && ['not-ready', 'blocked'].includes(c)) return '';
        return `<section class="column"><header><span>${t(`storyStatus.${c}`)}</span><span class="chip">${l.length}</span></header>
          ${l.map((s) => `<div class="item"><div class="id">${esc(s.id)} · ${esc(s.epic || '')}</div><div class="title">${esc(s.title)}</div>
            <div class="meta">${s.points != null ? `<span class="chip accent">${esc(s.points)} pts</span>` : ''}${s.sprint != null ? `<span class="chip">${t('sprint')} ${esc(s.sprint)}</span>` : ''}${s.ui ? '<span class="chip">UI</span>' : ''}${(s.traces || []).slice(0, 4).map((r) => `<span class="chip">${esc(r)}</span>`).join('')}</div>
            ${s.notes?.length ? `<div class="note">${esc(s.notes[s.notes.length - 1].text)}</div>` : ''}</div>`).join('')}
        </section>`;
      }).join('')}</div>
      <div class="grid cols-2">
        <section class="card table-wrap"><h2>${t('sprints')}</h2><table><tbody>${sprintRows}</tbody></table></section>
        <section class="card table-wrap"><h2>${t('epics')}</h2><table><tbody>${epics.map((e) => {
          const l = stories.filter((s) => s.epic === e.id);
          const done = pts(l.filter((s) => s.status === 'done'));
          const total = pts(l);
          return `<tr><td><span class="mono">${esc(e.id)}</span> ${esc(e.title || '')}${e.wave != null ? ` <span class="chip">${t('wave')} ${esc(e.wave)}</span>` : ''}</td><td class="num">${done}/${total}</td><td style="width:35%"><div class="bar"><i style="width:${total ? (100 * done) / total : 0}%"></i></div></td></tr>`;
        }).join('')}</tbody></table></section>
      </div>
    </div>`;
}

function viewQuestions() {
  const all = app.snap.questions.questions || [];
  const open = openQuestions();
  const answered = all.filter((q) => q.status !== 'open').reverse();
  const item = (q) => `<div class="question"><div class="filters"><span class="mono faint">${esc(q.id)}</span>
      ${q.blocking && q.status === 'open' ? `<span class="chip bad">${t('blockingOne')}</span>` : ''}
      <span class="small muted">${t('askedBy')} ${esc(agentName(q.by))}</span>${q.ref ? `<span class="chip">${esc(q.ref)}</span>` : ''}<span class="small faint">${ago(q.askedAt)}</span></div>
    <div class="text">${esc(q.text)}</div>
    ${q.answer ? `<div class="answer"><strong>${t('answer')}:</strong> ${esc(q.answer)}</div>` : ''}</div>`;
  return `
    <div class="page-head"><div><h1>${t('questions')}</h1><p>${esc(t('waitingHow'))}</p></div></div>
    <div class="grid">
      <section class="card"><h2>${t('open')} <span class="chip ${open.length ? 'warn' : ''}">${open.length}</span></h2>${open.length ? open.map(item).join('') : `<p class="muted">${t('noQuestions')}</p>`}</section>
      <section class="card"><h2>${t('answered')} <span class="chip">${answered.length}</span></h2>${answered.length ? answered.map(item).join('') : `<p class="muted">${t('noQuestions')}</p>`}</section>
    </div>`;
}

function viewEstimate() {
  const e = app.snap.estimate;
  if (!e) return `<div class="page-head"><h1>${t('estimate')}</h1></div><div class="empty">${t('noEstimate')}</div>`;
  const scenarios = e.scenarios || [];
  const max = Math.max(1, ...scenarios.map((s) => Number(s.weeks?.p80) || 0));
  const range = (r) => (r && r.p50 != null ? `<div class="range" title="P50 ${fmt(r.p50)} · P80 ${fmt(r.p80)}">
      <i style="left:${(100 * r.p50) / max}%;width:${Math.max(1, (100 * ((r.p80 ?? r.p50) - r.p50)) / max)}%"></i><b style="left:${(100 * r.p50) / max}%"></b></div>` : '');
  const cost = (c) => (c?.p50 != null ? `${money(c.p50, e.currency)} – ${money(c.p80, e.currency)}` : `<span class="faint">${t('ratesPending')}</span>`);
  const doc = app.snap.files.find((f) => f.path.endsWith('04-estimate.md'));
  return `
    <div class="page-head"><div><h1>${t('estimate')}</h1>
      <p>${esc(t(`version.${e.version}`) || e.version)} · ${t('confidence')}: <strong>${esc(e.confidence ? t(`conf.${e.confidence}`) : '—')}</strong>${e.cone ? ` · ${Math.round(e.cone.low * 100)}% / +${Math.round(e.cone.high * 100)}%` : ''}</p></div>
      ${doc ? `<a href="#docs:${encodeURIComponent(doc.path)}">${t('readFull')} →</a>` : ''}</div>
    <div class="grid">
      <section class="card table-wrap"><table><thead><tr><th>${t('scenario')}</th><th>${t('team')}</th><th class="num">${t('weeks')}</th><th>${t('range')}</th><th class="num">${t('hours')}</th><th>${t('cost')}</th></tr></thead><tbody>
        ${scenarios.map((s) => `<tr><td><strong>${esc(s.id)}</strong>${s.id === e.recommendedScenario ? ` <span class="chip accent">${t('recommended')}</span>` : ''}</td>
          <td class="small">${(s.team || []).map((m) => `${esc(m.role)} × ${fmt(m.fte)}`).join('<br>')}</td>
          <td class="num">${fmt(s.weeks?.p50)} – ${fmt(s.weeks?.p80)}</td><td style="min-width:200px">${range(s.weeks)}</td>
          <td class="num">${fmt(s.hours?.p50)} – ${fmt(s.hours?.p80)}</td><td>${cost(s.cost)}</td></tr>`).join('')}
      </tbody></table></section>
      ${e.waves?.length ? `<section class="card table-wrap"><h2>${t('waves')}</h2><table><thead><tr><th>${t('wave')}</th><th class="num">${t('weeks')}</th><th class="num">${t('hours')}</th></tr></thead><tbody>
        ${e.waves.map((w) => `<tr><td>${t('wave')} ${esc(w.wave)}</td><td class="num">${fmt(w.weeks?.p50)} – ${fmt(w.weeks?.p80)}</td><td class="num">${fmt(w.hours?.p50)} – ${fmt(w.hours?.p80)}</td></tr>`).join('')}
      </tbody></table></section>` : ''}
    </div>`;
}

function docGroup(p) {
  if (p.startsWith('reviews/')) return 'reviews';
  if (p.includes('/sprints/')) return 'sprints';
  if (p.includes('/05-architecture/')) return 'architecture';
  if (p.includes('/07-ux/')) return 'ux';
  if (p.includes('/10-release/')) return 'release';
  return 'general';
}

function viewDocs() {
  const files = app.snap.files;
  if (!files.length) return `<div class="page-head"><h1>${t('docs')}</h1></div><div class="empty">${t('noDocs')}</div>`;
  const groups = ['general', 'architecture', 'ux', 'sprints', 'reviews', 'release'];
  const list = groups.map((g) => {
    const l = files.filter((f) => docGroup(f.path) === g);
    if (!l.length) return '';
    return `<h3>${t(g)}</h3>${l.map((f) => `<a href="#docs:${encodeURIComponent(f.path)}" class="${app.doc === f.path ? 'active' : ''}" title="${esc(f.path)}">${esc(f.path.split('/').pop())}</a>`).join('')}`;
  }).join('');
  const current = files.find((f) => f.path === app.doc);
  return `
    <div class="page-head"><div><h1>${t('docs')}</h1><p>${files.length}</p></div></div>
    <div class="docs">
      <nav class="card doc-list">${list}</nav>
      <article class="card doc">${current
        ? `<div class="doc-meta"><span class="mono">${esc(current.path)}</span><span>${t('updated')} ${ago(current.mtime)}</span></div><div id="doc-body" class="md">…</div>`
        : `<p class="muted">${t('chooseDoc')}</p>`}</article>
    </div>`;
}

function viewActivity() {
  const agents = [...new Set(app.snap.events.map((e) => e.agent))];
  const list = app.snap.events.filter((e) => !app.filter.agent || e.agent === app.filter.agent).slice().reverse();
  return `
    <div class="page-head"><div><h1>${t('activity')}</h1><p>${app.snap.events.length}</p></div>
      <div class="filters"><select data-filter="agent"><option value="">${t('allAgents')}</option>${agents.map((a) => `<option value="${esc(a)}"${app.filter.agent === a ? ' selected' : ''}>${esc(agentName(a))}</option>`).join('')}</select></div></div>
    <section class="card">${feed(list)}</section>`;
}

const VIEWS = { overview: viewOverview, phases: viewPhases, agents: viewAgents, board: viewBoard, backlog: viewBacklog, questions: viewQuestions, estimate: viewEstimate, docs: viewDocs, activity: viewActivity };

// ------------------------------------------------------------------ markdown

let mermaidReady = false;
function renderMarkdown(text, path) {
  if (path.endsWith('.json')) {
    try { text = JSON.stringify(JSON.parse(text), null, 2); } catch { /* keep raw */ }
    return `<pre class="raw">${esc(text)}</pre>`;
  }
  if (!window.marked || !window.DOMPurify || path.endsWith('.txt')) return `<pre class="raw">${esc(text)}</pre>`;
  const html = window.DOMPurify.sanitize(window.marked.parse(text, { gfm: true }));
  return html;
}

async function showDoc() {
  const body = document.getElementById('doc-body');
  if (!body || !app.doc) return;
  const file = app.snap.files.find((f) => f.path === app.doc);
  const key = `${app.doc}@${file?.mtime}`;
  let text = app.docCache.get(key);
  if (text == null) {
    const res = await fetch(`/api/file?path=${encodeURIComponent(app.doc)}`);
    text = res.ok ? await res.text() : '';
    app.docCache.set(key, text);
  }
  if (app.doc.endsWith('.html')) {
    body.innerHTML = '';
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', '');
    frame.style.cssText = 'width:100%;height:70vh;border:1px solid var(--line);border-radius:8px;background:#fff';
    frame.srcdoc = text;
    body.appendChild(frame);
    return;
  }
  body.innerHTML = renderMarkdown(text, app.doc);
  const blocks = body.querySelectorAll('pre > code.language-mermaid');
  if (blocks.length && window.mermaid) {
    if (!mermaidReady) {
      window.mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' });
      mermaidReady = true;
    }
    blocks.forEach((code) => {
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.textContent = code.textContent;
      code.parentElement.replaceWith(div);
    });
    try { await window.mermaid.run({ nodes: body.querySelectorAll('.mermaid') }); } catch { /* leave the source visible */ }
  }
}

// ------------------------------------------------------------------ render loop

function readHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (h.startsWith('docs:')) { app.tab = 'docs'; app.doc = h.slice(5); return; }
  app.tab = TABS.includes(h) ? h : 'overview';
}

function render() {
  if (!app.snap) return;
  renderFrame();
  const scroll = window.scrollY;
  $('#view').innerHTML = VIEWS[app.tab]();
  window.scrollTo(0, scroll);
  if (app.tab === 'docs') showDoc();
}

async function refresh() {
  try {
    const res = await fetch('/api/snapshot', { cache: 'no-store' });
    app.snap = await res.json();
    if (!app.lang) app.lang = localStorageGet('modernia.lang') || (app.snap.config.language === 'en' ? 'en' : 'es');
    if (app.tab === 'docs' && !app.doc && app.snap.files[0]) app.doc = app.snap.files[0].path;
    render();
  } catch {
    setLive(false);
  }
}

function localStorageGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } }

function connect() {
  let poll = null;
  const startPolling = () => { if (!poll) poll = setInterval(refresh, 5000); };
  if (!window.EventSource) { startPolling(); return; }
  const es = new EventSource('/api/live');
  es.onopen = () => { setLive(true); clearInterval(poll); poll = null; refresh(); };
  es.addEventListener('change', refresh);
  es.onerror = () => { setLive(false); startPolling(); };
}

window.addEventListener('hashchange', () => {
  readHash();
  if (app.tab === 'docs' && !app.doc && app.snap?.files[0]) app.doc = app.snap.files[0].path;
  render();
  if (app.tab !== 'docs') window.scrollTo(0, 0);
});

document.addEventListener('change', (ev) => {
  const key = ev.target.dataset?.filter;
  if (!key) return;
  app.filter[key] = ev.target.value;
  render();
});

document.getElementById('lang').addEventListener('click', () => {
  app.lang = app.lang === 'es' ? 'en' : 'es';
  localStorageSet('modernia.lang', app.lang);
  render();
});

// Relative times keep moving even when nothing changes.
setInterval(() => { if (app.tab !== 'docs') render(); }, 60000);

readHash();
refresh();
if (!STATIC) connect();
