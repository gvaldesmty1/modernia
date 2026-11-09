# Modernia conventions

Every Modernia agent reads this file before working. It defines the shared
workspace (the "blackboard"), how findings are written and how agents talk to
each other and to the human.

## 1. The workspace

Agents never talk to each other directly. They communicate through files in the
project's workspace, `.modernia/`, created by `/modernia:modernize`:

| Path | Owner | Content |
|---|---|---|
| `config.json` | administrator | Project name, `language`, `mode` (`code` / `docs` / `both`), absolute source paths, `pluginRoot` |
| `state.json` | administrator | Current stage and phase, step status, human gates |
| `board.json` | scrum-master | Work board: one task per agent assignment |
| `questions.json` | everyone (via script) | Open questions for the human and their answers |
| `events.jsonl` | everyone (via script) | Append-only activity log (the UI reads it) |
| `backlog.json` | scrum-master | Product backlog for the build stage (epics, stories, sprints) |
| `sources/index.json` | ingest script | Inventory of the documents and how to read each one |
| `sources/text/` | ingest script | Documents converted to text (Word, Excel, PowerPoint, HTML) |
| `sources/scan.json` | scan script | Code metrics: files and lines per extension, technology markers, largest files |
| `deliverables/01-inventory.md` | project-analyst | What exists and what technology it uses |
| `deliverables/02-business.md` | business-analyst | Capabilities, processes, business rules, contradictions |
| `deliverables/03-data.md` | data-engineer | Data stores, entities, CRUD matrix, migration concerns |
| `deliverables/04-architecture/` | architect | `options.md`, `target.md`, `adr/ADR-n-*.md` |
| `deliverables/05-backlog.md` | scrum-master | Readable version of `backlog.json` with traceability |
| `deliverables/assessment.md` | administrator | Executive summary of the diagnosis |
| `deliverables/06-ux/` | ux-designer | `ux-guidelines.md` plus one screen spec per story with a UI |
| `deliverables/07-test-strategy.md` | qa-engineer | Test levels, the equivalence approach, golden cases (`TC-n`) |
| `deliverables/08-security.md` | security-engineer | Threat model and the cumulative security findings register (`SEC-n`) |
| `deliverables/09-release/` | devops-engineer | `foundation.md`, `environments.md`, `runbook.md`, `rollback.md` |
| `deliverables/sprints/sprint-n.md` | scrum-master | Sprint plan, review and retrospective |
| `reviews/US-n.md` | reviewer, security-engineer | Review and security findings per story |

**Sources are read-only.** Never modify, move or delete anything under the code
or document paths listed in `config.json`. Write only the deliverables your role
owns.

### The target repository

The modernized system is built in `config.target`, a separate folder that the
human chooses in the foundation phase (usually its own git repository). The
foundation is set by devops-engineer and developer and approved by the human.
After that:

- the structure, tools and commands documented in `deliverables/09-release/foundation.md` are the contract. Do not add new top-level folders, frameworks or tools without an ADR approved by the human;
- **tests belong to qa-engineer and product code belongs to developer**. Neither edits the other's files. If a test looks wrong, the developer reports it and does not change it;
- infrastructure, pipelines and deployment files belong to devops-engineer;
- nobody commits secrets. Configuration goes in environment variables or a secret store, with documented example files (`.env.example`).

### Story workflow (build stage)

```
not-ready → todo → doing (ux, if needed) → testing (qa writes failing tests)
         → doing (developer makes them pass) → review (reviewer + security) → done
```

A story is `done` only when its tests pass, every acceptance criterion has a
test, the review has no blocking findings, and the full test suite is still
green. Statuses change only through `board.mjs story move`.

## 2. Tools

All scripts live in `<pluginRoot>/scripts/` (`pluginRoot` comes from
`config.json`). Always quote paths, because they may contain spaces. Run them
from the project root (the folder that contains `.modernia/`).

```bash
node "<pluginRoot>/scripts/board.mjs" log --agent <you> --type start --msg "..."
node "<pluginRoot>/scripts/board.mjs" q add --by <you> --text "..." [--blocking] [--ref BR-4]
node "<pluginRoot>/scripts/board.mjs" q list [--open]
node "<pluginRoot>/scripts/board.mjs" task list
node "<pluginRoot>/scripts/board.mjs" story list --sprint 1
node "<pluginRoot>/scripts/board.mjs" story move US-4 testing --by qa-engineer
node "<pluginRoot>/scripts/board.mjs" show
```

Event types: `start`, `done`, `finding`, `warning`, `decision`, `question`.
Log `start` when you begin and `done` when you finish (including the path of
your deliverable), plus a `finding` for anything a human should notice early,
such as a contradiction, a security smell or a blocking unknown.

## 3. Language

Write every deliverable in `config.language` (`es` = Spanish, `en` = English).
Keep IDs, file names, JSON keys and code identifiers in English so the
framework stays the same in both languages. Quote source text in its original
language.

## 4. Evidence: every finding says where it comes from

Tag each finding with its source:

- `[code: path/to/File.ext:120]`, a path relative to the code root plus the line
- `[doc: Spec.docx › 4.2 Discounts]` or `[doc: Manual.pdf p.12]`
- `[answer: Q-3]`, when the human answered a question
- `[assumption]`, when it is inferred and not verified. Always explain the basis.

Add a confidence level when it is not obvious:

- **High**: directly evidenced, and sources agree.
- **Medium**: a single source, or partially evidenced.
- **Low**: inferred from indirect signals.

Never present an assumption as a fact. If you could not read everything, state
the coverage you achieved, for example: "read 38 of 212 files; the 12 data-access
modules were read completely, forms were sampled".

## 5. IDs

| Prefix | Meaning | Prefix | Meaning |
|---|---|---|---|
| `CMP-n` | component / module | `ENT-n` | data entity |
| `INT-n` | integration / external dependency | `OPT-n` | architecture option |
| `CAP-n` | business capability | `ADR-n` | architecture decision |
| `BP-n` | business process | `RISK-n` | risk |
| `BR-n` | business rule | `EP-n` | epic |
| `CON-n` | contradiction between sources | `US-n` | user story |
| `GAP-n` | gap: something unknown or undocumented | `T-n` / `Q-n` | board task / question (assigned by the script) |
| `TC-n` | golden / equivalence test case | `SEC-n` | security finding |
| `REV-n` | review finding (scoped to a story) | | |

Review and security findings carry a severity: **blocking** (the story cannot
be closed), **major** (must be fixed or accepted by the human with a reason) or
**minor** (recorded, optional).

IDs are stable: once published, never renumber. When a later agent references
an ID, it uses the same one.

## 6. Contradictions

When two sources disagree (document vs code, or document vs document), do not
pick one silently. Record it:

| ID | Topic | Source A says | Source B says | Impact | Question |
|---|---|---|---|---|---|
| CON-1 | Volume discount | 10% over $10,000 `[doc: …]` | 5% over $5,000, 10% over $20,000 `[code: …]` | Changes every invoice total | Q-4 |

In `both` mode, contradictions are among the most valuable outputs. Look for
them deliberately.

## 7. Questions for the human

You cannot talk to the human; the administrator does. Register questions with
`board.mjs q add`:

- `--blocking` means you cannot produce a reliable deliverable without the
  answer. Use it sparingly.
- Without the flag, continue with an `[assumption]` and cite the question ID
  next to it.

Before asking, check `questions.json`: the answer may already be there. Answered
questions are evidence (`[answer: Q-n]`) and take precedence over documents and
code unless they contradict each other; in that case, record a contradiction.

## 8. Secrets and sensitive data

If you find credentials, keys or connection strings with passwords, report the
location and type of the secret, never its value (`[code: modConexion.bas:6]`
"hardcoded SQL credentials"). Do not copy personal data from documents or sample
data into deliverables; describe it instead (for example, "contains customer
tax IDs").

## 9. Diagrams

Use Mermaid code blocks (`flowchart`, `erDiagram`, `sequenceDiagram`, C4-style
flowcharts) so diagrams render on GitHub and in the UI.

## 10. Product backlog format (`backlog.json`)

```json
{
  "epics":   [{ "id": "EP-1", "title": "", "wave": 1, "description": "", "traces": ["CAP-1"] }],
  "stories": [{ "id": "US-1", "epic": "EP-1", "title": "", "asA": "", "iWant": "", "soThat": "",
                "acceptance": ["Given … when … then …"], "traces": ["BR-3", "BP-1"],
                "size": "M", "points": 5, "sprint": 1, "dependsOn": [], "owner": "developer",
                "status": "todo" }],
  "sprints": [{ "id": 1, "goal": "", "stories": ["US-1"] }]
}
```

`size` is one of `XS` `S` `M` `L` `XL`; `points` uses Fibonacci numbers.
`owner` is the main role (`developer`, `data-engineer` or `devops-engineer`).
Add `"ui": true` to stories that create or change a screen, so that the
ux-designer works on them first.
