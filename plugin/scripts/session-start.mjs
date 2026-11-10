#!/usr/bin/env node
// Modernia SessionStart hook. When the session opens inside a Modernia
// project, it tells Claude where the project stands and how to continue.
// Anywhere else it prints nothing. It never fails the session.

import fs from 'node:fs';
import path from 'node:path';

function readStdin() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

try {
  const input = readStdin();
  const cwd = input.cwd || process.cwd();
  const ws = path.join(cwd, '.modernia');
  const config = readJson(path.join(ws, 'config.json'));
  if (!config) process.exit(0);

  const state = readJson(path.join(ws, 'state.json')) || {};
  const questions = (readJson(path.join(ws, 'questions.json')) || {}).questions || [];
  const open = questions.filter((q) => q.status === 'open');
  const blocking = open.filter((q) => q.blocking).length;
  const phase = state.phase || 'intake';
  const gate = state.gates?.[phase]?.status || 'pending';
  const es = config.language !== 'en';

  const lines = es
    ? [
        `[Modernia] Esta carpeta es el proyecto de modernización «${config.project?.name}» (modo: ${config.mode}, política de modelos: ${config.modelPolicy || 'balanced'}).`,
        `Fase actual: ${phase} (aprobación: ${gate}). Preguntas abiertas: ${open.length}${blocking ? `, ${blocking} bloqueantes` : ''}.`,
        'Si la persona quiere seguir, avanzar o pregunta por el proyecto, usa /modernia:modernize; para el estado, /modernia:status; para verlo en el navegador, /modernia:dashboard.',
      ]
    : [
        `[Modernia] This folder is the modernization project "${config.project?.name}" (mode: ${config.mode}, model policy: ${config.modelPolicy || 'balanced'}).`,
        `Current phase: ${phase} (approval: ${gate}). Open questions: ${open.length}${blocking ? `, ${blocking} blocking` : ''}.`,
        'If the person wants to continue or asks about the project, use /modernia:modernize; for status, /modernia:status; to see it in the browser, /modernia:dashboard.',
      ];
  process.stdout.write(lines.join('\n') + '\n');
} catch {
  // never block the session
}
process.exit(0);
