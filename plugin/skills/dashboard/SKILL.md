---
name: dashboard
description: Opens the Modernia dashboard, a local, read-only web page that shows a modernization project live - phases and approvals, what each agent is doing, the board, the backlog and sprints, open questions, the estimate and every deliverable rendered with its diagrams. Use when the person wants to see the project, the agents or the deliverables visually, or asks for "the app", "the dashboard" or "the screen". / Abrir el tablero visual de Modernia en el navegador.
---

# Modernia · Dashboard

1. `PLUGIN_ROOT` = two levels above this skill's base directory. If
   `.modernia/config.json` does not exist in the current folder, tell the
   person that there is no Modernia project here and offer `/modernia:modernize`.
2. Start the server **in the background** (it keeps running while the agents
   work), from the project root:

   ```bash
   node "<PLUGIN_ROOT>/ui/server.mjs" --ws .modernia --open
   ```

   It listens only on `127.0.0.1`. It uses port 4747, or the next free port if
   that one is taken, and prints the URL. `--open` opens the default browser.
3. Tell the person, in `config.language`, in at most 4 lines:
   - the URL;
   - that the page updates by itself while the agents work;
   - that it is read-only: approvals and answers are still given here, in
     the conversation, with `/modernia:modernize`;
   - that the deliverables render with their Mermaid diagrams (this needs
     internet access to load the renderer; without it, the text is shown as is).
4. Do not start a second server if one is already running for this project.
   Give the same URL again.
