---
name: status
description: Shows how a Modernia modernization project is going, in plain language - current phase, what each agent did, the decisions taken, open questions waiting for the human and the next step. Use when the person asks how it is going, what is pending, what is next or what the agents found. / Estado de un proyecto Modernia: fase, avance, preguntas pendientes y siguiente paso.
---

# Modernia · Status

1. `PLUGIN_ROOT` = two levels above this skill's base directory. If
   `.modernia/config.json` does not exist in the current folder, tell the
   person that there is no Modernia project here and offer `/modernia:modernize`.
2. Run `node "<PLUGIN_ROOT>/scripts/board.mjs" show` and read the last 30 lines
   of `.modernia/events.jsonl`.
3. Answer in `config.language`, in everyday terms, without internal IDs or JSON:
   - **Where we are**: the phase in one sentence, and the gates already approved.
   - **What has been done**: one line per completed deliverable, with its key finding and a link to the file.
   - **Decisions taken**: the gate notes, and the chosen architecture if there is one.
   - **Waiting for you**: the open questions, blocking ones first, written as questions.
   - **Next step**: what `/modernia:modernize` will do when it continues.
4. Keep it under 25 lines. Do not dispatch agents or change anything.
