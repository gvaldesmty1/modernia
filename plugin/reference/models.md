# Modernia · Model routing

Modernia is not tied to one Claude model. The administrator chooses the model
for **every dispatch**, according to the difficulty, the risk and the volume of
that specific piece of work. The `model` in each agent's frontmatter is only the
fallback for when an agent is invoked directly.

## The four tiers

| Tier (Agent `model`) | Model | Price per million tokens, input / output* | Use it for |
|---|---|---|---|
| `haiku` | Claude Haiku 5.5 | $0.10 / $0.50 | Mechanical, well-specified, high-volume work, where an error is cheap and easy to detect |
| `sonnet` | Claude Sonnet 5.5 | $2 / $10 | Everyday analysis and coding: the default for most work |
| `opus` | Claude Opus 5.5 | $4 / $20 | Deep reasoning, ambiguity, judgment, high impact |
| `fable` | Claude Fable 5.1 | $10 / $50 | The hardest and highest-stakes work, and escalations after a lower tier failed |

\* Anthropic first-party prices as of October 2026. They change; the policy
does not depend on the exact numbers, only on their order.

Aliases always resolve to the current generation of each family.

## Baseline per role and task

| Agent · task | Baseline | Go up when | Go down when |
|---|---|---|---|
| scrum-master · `plan` | `haiku` | — | — |
| scrum-master · `sprint-start`, `sprint-review` | `sonnet` | many blocked stories or a re-estimate | — |
| scrum-master · `backlog` | `sonnet` | more than ~60 rules, or 3+ waves → `opus` | — |
| project-analyst | `sonnet` | an unfamiliar or obscure technology, or docs-only mode with poor material → `opus` | a small, conventional codebase (under ~20k lines) → `haiku` |
| business-analyst | `opus` | rules spread across very large or cryptic code (COBOL, RPG, 4GL), or many contradictions → `fable` | a revision round that only applies answers → `sonnet` |
| data-engineer · diagnosis | `sonnet` | no DDL and the schema must be inferred from code or documents → `opus` | — |
| data-engineer · `migration` | `sonnet` | money fields, legacy encodings or large volumes → `opus` | — |
| estimator · `initial`, `refine` | `opus` | docs-only mode, or the two methods differ by more than 25% → `fable` | — |
| architect · `options` | `opus` | regulated or critical systems, or the top options score within 5 points → `fable` | — |
| architect · `decision` | `opus` | — | — |
| ux-designer | `sonnet` | complex data-entry screens with many rules → `opus` | a simple form or list → `haiku` |
| qa-engineer · `strategy` | `sonnet` | many calculation rules (golden cases) → `opus` | — |
| qa-engineer · `story` | `sonnet` | the story traces calculation, money or authorization rules → `opus` | an XS story with no rules → `haiku` |
| developer · `foundation` | `sonnet` | — | — |
| developer · `story` | by size: XS/S → `sonnet`, M/L → `opus`, XL → `opus` | the second fix round, or core money/authorization logic → `fable` | an XS change with no business rules → `haiku` |
| developer · `fix` | the tier of the story | the findings persist after one round → one tier up | — |
| reviewer | `opus` | blocking findings disputed by the developer, or critical rules → `fable` | — |
| security-engineer · `threat-model`, `release` | `sonnet` | sensitive data (personal, financial, health) or regulated systems → `opus` | — |
| security-engineer · `story` | `sonnet` | authentication, authorization or payments → `opus` | — |
| devops-engineer | `sonnet` | multi-region, regulated or complex cut-over → `opus` | — |

The administrator itself runs on the model of the person's session; it does not
choose its own model.

## Escalation and de-escalation

- **Escalate one tier** (never two) when an agent returns something unusable,
  reports low confidence on items that block the gate, misses the deliverable
  format, or when a story needs a second fix round. Record the reason.
- **De-escalate** repetitive work after it went well: for example, the second
  half of a large inventory, or stories similar to one that was already approved.
- **Never de-escalate** for: estimation, architecture options, review of stories
  that trace money, legal or authorization rules, or the security release gate.
- A gate rejected by the human because of an analysis error is a signal: re-run
  that agent one tier up.

## The project's model policy

`config.modelPolicy` adjusts the baseline for the whole project. The person
chooses it, and may change it at any time ("make it cheaper", "maximum
quality"). It is set with `board.mjs policy`.

| Policy | Effect |
|---|---|
| `balanced` (default) | The table above |
| `economy` | Every baseline one tier down (with `haiku` as the floor), except the "never de-escalate" list, which stays at its baseline |
| `quality` | Every baseline one tier up (with `fable` as the ceiling) for analysis, estimation, architecture, review and security; coding stays at its baseline |

Per-role overrides (`board.mjs policy override <agent> <tier|auto>`) take
precedence over the policy, for example to pin the architect to `fable`.

## How to dispatch

1. Pick the tier: role and task baseline → the project policy → per-role
   override → escalation signals.
2. Pass it in the Agent tool's `model` parameter.
3. Log the choice before dispatching, so that the dashboard and the history show it:
   `node "<pluginRoot>/scripts/board.mjs" log --agent <agent> --type model --msg "<tier>: <one-line reason>"`.
4. Do not explain routine choices to the person. Mention the model only when
   you escalate to `fable`, or when the person asks.
