# Modernia · Administrator · Build stage

Read this file when `state.phase` is `foundation`, `build` or `release`. The
setup, the dispatching rules and the general rules of `SKILL.md` still apply.

---

## Phase 6 · foundation

1. **Target repository**: ask the human where the modernized system should
   live. Suggest a sibling folder of the project named `<project>-modern`,
   which must not be inside a source folder. Ask whether it already exists as
   an empty git repository (for example, one they created in GitHub or Azure
   DevOps). Then run `BOARD target "<path>" [--create]`.
2. Dispatch `modernia:scrum-master` in mode `plan` for phase `foundation`.
3. Dispatch `modernia:devops-engineer` in mode `foundation`, then
   `modernia:developer` in mode `foundation`. They run in that order because
   the developer builds on the repository and tooling that devops creates.
4. In parallel with step 3 (in one message): `modernia:qa-engineer` in mode
   `strategy`, `modernia:security-engineer` in mode `threat-model` and, if the
   system has a UI, `modernia:ux-designer` in mode `guidelines`.
5. Verify yourself: run the build and test commands from
   `10-release/foundation.md` in the target. If they fail, send the output
   back to the owner (devops or developer) once.
6. **Gate `foundation`**: show the human the structure, the commands, the
   pipeline, the environments with their approximate cost, the test strategy
   (with the golden cases that need their confirmation) and the threat model
   summary. Ask the human to confirm the golden cases marked "needs human"
   now, or to run them against the legacy system if they can. Record the
   answers as questions. Ask explicitly for approval to start building. If the
   human approves, run `BOARD gate foundation approved` and `BOARD phase build`,
   and commit the foundation in the target
   (`chore: foundation`).

## Phase 7 · build (one sprint at a time)

### Sprint start

Dispatch `modernia:scrum-master` in mode `sprint-start` for the next sprint.
Show the human the sprint goal, the stories, the points and the stories left
out because they are not ready (with the reason and the question they wait
for). Ask the questions that would unblock them. Continue when the human says
go. This is a light confirmation, not a gate.

### Story loop

Take the `todo` stories of the sprint **one at a time**, in the plan order.
Stories share the target repository, so never build two at once.

1. **UX** (only if `"ui": true`): `modernia:ux-designer` in mode `story`.
2. **Tests first**: `BOARD story move US-n testing --by administrator`, then
   `modernia:qa-engineer` in mode `story`. Its tests must fail for the right
   reason.
3. **Implementation**: `modernia:developer` in mode `story` (or
   `modernia:data-engineer` in mode `migration` when the story's owner is
   `data-engineer`, or `modernia:devops-engineer` when the owner is
   `devops-engineer`). If the developer reports that a test is wrong, send the
   explanation to `modernia:qa-engineer` and let QA decide. If they disagree,
   ask the human.
4. **Review**, in parallel (one message): `modernia:reviewer` and, when the
   story touches authentication, authorization, sensitive data, input from
   users or external systems, or adds dependencies,
   `modernia:security-engineer` in mode `story`. Save both reports in
   `.modernia/reviews/US-n.md`.
5. **Fix round**: if there are blocking or major findings, dispatch the
   implementer in mode `fix` with those findings (the second round goes one
   model tier up, per `reference/models.md`), then review again. After 2
   rounds with blocking findings still open, mark the story `blocked`, tell the
   human what is stuck and move on to the next story. A major finding can be
   accepted only by the human, with a reason that you record in the review file.
6. **Close**: run the full test suite and the build yourself. If they are
   green, commit in the target (`feat(US-n): <title>`, with the rule IDs in the
   body), then `BOARD story move US-n done --by administrator`. Tell the human in
   one line.

Do not stop between stories unless a story is blocked or a blocking question
appears. Relay blocking questions immediately, one at a time.

### Sprint review · gate `sprint-n`

1. Dispatch `modernia:scrum-master` in mode `sprint-review`.
2. Present the review to the human: what was done, how to try it (the demo
   script), the metrics, the retrospective adjustments and the re-plan. Ask
   for acceptance of the sprint. Rejected stories go back to `todo` with the
   human's comments as notes, so that QA updates the tests first.
3. Run `BOARD gate sprint-n approved`.
4. If this sprint **completes a migration wave** (see `05-architecture/target.md`),
   or there are no stories left, go to the gate `build`. Otherwise, start the next sprint.

### Gate `build` · the wave is ready to release

Present the wave as a whole: the stories done, the business rules now covered
by the new system, the test results (the full suite and the equivalence
cases), the open review or security findings and the stories that were
deferred. Ask the human whether this wave is complete and can move on to the
release (strangler releases happen per wave).

- Approved → `BOARD gate build approved --note "Wave n"`, then `BOARD phase release`.
- Not yet → `BOARD gate build rejected --note "<what is missing>"`, and continue with more sprints.

## Phase 8 · release (per wave)

1. Dispatch `modernia:scrum-master` in mode `plan` for phase `release`.
2. In parallel: `modernia:security-engineer` in mode `release` and
   `modernia:devops-engineer` in mode `release` (prepare only).
3. **Gate `release`**: present the security verdict (GO or NO-GO with the
   reasons), the runbook, the data migration with its validation, the
   rollback plan and what will change for the users. Ask the human:
   - whether they approve the release;
   - **which environment** to deploy to now: none (they will run the runbook
     themselves), non-production only, or non-production and then production;
   - whether the credentials for that environment are available in this
     session (for example, a cloud CLI that is already logged in). Never ask
     them to paste secrets into the chat.
   With NO-GO from security, the release cannot be approved until the
   blocking items are fixed (create the stories) or the human explicitly
   accepts each one with a reason.
4. If they approve, run `BOARD gate release approved --note "<wave, environments>"` and
   dispatch `modernia:devops-engineer` in mode `release` with the explicit
   approval and the environments. Production always needs a second explicit
   "yes" after non-production succeeds.
5. Tag the release in the target (`git tag wave-n`). If backlog remains, run
   `BOARD phase build --reason "Next wave"` (this resets the `build` and
   `release` gates, which the next wave must earn again) and continue with the
   next sprint. If nothing remains, run `BOARD phase done`, update
   `deliverables/assessment.md` with a **Delivery** section (what was built,
   released and retired, the final metrics and the open items), and close the
   project with the human.
