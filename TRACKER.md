# Project Tracker — Employee Internal Transfer Digital Journey (SDD Assessment)

_Source: `docs/Requirement for SDD.docx` §4 (Developer Assignment), §5 (Evaluation Criteria), §6 (Recommended 10-Day Timeline), §7 (Milestones)._
_Last updated: 2026-09-16 (task decomposition complete)._

## How to use this file

Update the **Status**, **Date(s)**, and **Notes** columns as work happens — this is meant to be edited frequently, by either of us. It tracks progress against the *assessment's own* structure (deliverables, evaluation weighting, day-by-day timeline, milestones). It is **not** a replacement for `.ai-context/status.md`, which tracks the SDD artefact chain's internal state (each feature's spec/plan/task status) — this file is the outer, assessment-facing view; `status.md` is the inner, per-feature detail.

Status values used throughout: `Not Started` · `In Progress` · `Blocked` · `Done`.

---

## 1. Deliverables Checklist (§4)

The source document's own numbering skips from Deliverable 5 to Deliverable 7 — no "Deliverable 6" exists in the original; preserved as-is rather than renumbered or invented.

| # | Deliverable | Status | Artefact(s) | Notes |
|---|---|---|---|---|
| 1 | Requirement / Discovery Analysis | Done | `.ai-context/BRD.md`, `.ai-context/discovery-analysis.md` | 7 BRD entries; business-vs-technical decisions distinguished throughout; assumptions/dependencies/out-of-scope captured per entry. |
| 2 | Feature Specification (.md) + Acceptance Criteria | Done | `.ai-context/specs/*.spec.md` (7 files) | The journey's core spec is `internal-transfer-workflow.spec.md`; 6 supporting specs (auth, users, org structure, app constants, audit trail, admin oversight) also complete — broader than the brief's single-journey framing since the SOW itself covers the whole system, not just the transfer request. |
| 3 | Spec-Derived Test Cases | Done | `.ai-context/test_cases/*.test_cases.md` (7 files) + `_integration.md` | QA-expanded for all 7 specs — data/negative/boundary/role-matrix coverage beyond each spec's own inline table. Surfaced ~20 Open QA Questions across the set (several recurring, e.g. no project-wide case-sensitivity/whitespace rule for unique text fields — worth resolving once, centrally). `_integration.md` was stale (mismatched feature slug/design from before this session) — deleted and regenerated: 10 cross-feature scenarios grounded in the real 7-spec chain. |
| 4 | Technical Plan | Done | `.ai-context/plans/*.plan.md` (7 files) | All 7 specs have a drafted plan; Constitution Check completed for each. |
| 5 | Task Decomposition | Done | `.ai-context/tasks/*.tasks.md` (7 files) | All 7 specs decomposed: rbac-api-security (6), user-management-console (6), org-structure-management (2), application-constants-management (2), internal-transfer-workflow (9), transfer-audit-trail (3), transfer-admin-oversight (3) — 31 tasks total, every AC covered, no Coverage Gaps anywhere. |
| 6 | *(no Deliverable 6 in source document)* | — | — | Gap in the source numbering itself, not this tracker. |
| 7 | AI Prompts | Done | `prompts/*.md` (7 workflow-level + 31 per-task) | The 7 reusable workflow prompt files plus 31 real per-task prompt files, one per task, each scoped with explicit "do not touch" sibling-task boundaries. |
| 8 | Security Assessment | **Not Started** | — | No standalone security assessment document exists. Security considerations ARE embedded throughout specs/plans/constitution.md (RBAC, bcrypt+salt rounds, rate limiting, no-PII-in-logs, NoSQL-injection guards, append-only audit log) but nothing consolidates them into one reviewable document. |
| 9 | Gate 1 Review | Done | `.ai-context/gate-reviews/gate1-review-*.md` (7 files) | All 7 specs Approved. **Caveat worth flagging honestly:** all 7 reviews were recorded under the reviewer name "Test Reviewer" — confirmed within this session to represent a real, independent reviewer, but for actual assessment submission, verify this satisfies whatever "named peer reviewer" standard the evaluator expects. |
| 10 | Gate 2 Evidence | **Not Started** | — | No implementation exists yet, so no code review has happened. Blocked on Task Decomposition → Test-First → Implementation. |

---

## 2. Evaluation Criteria (§5) — self-check reference

| Area | Weight | Current Coverage | Notes |
|---|---|---|---|
| Business journey understanding | 10% | Strong | BRD/discovery captures the journey end-to-end from the SOW, including cross-role handoffs (Manager → HR → Payroll/IT/Facilities → HR). |
| Ambiguity & discovery | 15% | Strong | ~15 distinct open items logged in `discovery-analysis.md` across all 7 BRD entries, several resolved with explicit decisions and rationale as the chain progressed (e.g., JWT mechanism via ADR-0001, `dateOfJoining`/`managerId` fields, soft-delete semantics). |
| Specification quality | 20% | Strong | 7 specs, each with Intent/Context/API Contract/AC/Unit Test Cases/Out-of-Scope/NFRs; no invented ACs or payload shapes — every gap explicitly flagged rather than guessed. |
| Acceptance criteria & testability | 15% | Strong | Every AC is individually IDed, given/when/then; e.g. `internal-transfer-workflow` alone has 19. QA-expanded test cases now add ~20 further boundary/negative/role-matrix scenarios per spec on top of that. |
| Task decomposition | 10% | Strong | All 7 specs decomposed — 31 tasks total, every AC covered, no Coverage Gaps. |
| Test-first approach | 5% | **Not started** | No Red tests exist yet — the next actual step, now that every task across all 7 specs has a scoped prompt file ready. |
| Security & failure handling | 5% | Partial | Distributed across specs/plans (see Deliverable 8 above); not consolidated into a standalone assessment a reviewer could point to directly. |
| SDD traceability | 20% | Strong | Full chain intact: BRD → Spec → Gate 1 → Plan, every artefact cross-references its BRD ID / spec ID / AC ID; `status.md` and `discovery-analysis.md` kept current throughout. |
| **Total** | **100%** | — | Strongest so far: Specification quality, SDD traceability, Discovery. Weakest: Task decomposition, Test-first, Security assessment (all `Not Started` — the next phase of work). |

---

## 3. 10-Day Timeline Tracker (§6)

Days 1–6's artefacts were produced within a single extended working session rather than spread across separate calendar days — noted honestly below rather than fabricating a day-by-day history. **Actual calendar-day tracking should start fresh from here** — fill in real dates as work continues.

| Day | Activity | Expected Output | Approx Effort | Status | Actual Date(s) | Notes |
|---|---|---|---|---|---|---|
| 1 | Understand requirement + Discovery | Business understanding, questions, assumptions, open decisions | 2.5–3 hrs | Done | _(session date)_ | |
| 2 | BRD interpretation + SDD Spec | BRD interpretation + initial `.spec.md` | 3–4 hrs | Done | _(session date)_ | 7 specs, not 1 — broader scope than the brief anticipated. |
| 3 | Acceptance Criteria + API Contract + Test Cases | Complete specification + AC + API + spec-derived tests | 3–4 hrs | Done | 2026-09-16 | AC + API Contract + spec-derived QA test cases (7 files) all complete. |
| 4 | Gate 1 Peer Review | Review comments + revised/approved spec | 1.5–2 hrs | Done | _(session date)_ | All 7 specs Approved — see the reviewer-identity caveat under Deliverable 9. |
| 5 | Technical Plan + Architecture | `.plan.md`, integration approach, data model, failure handling, ADR candidates | 3–4 hrs | Done | _(session date)_ | 7 plans; 1 ADR (`ADR-0001`, JWT auth). All 7 plans' Constitution Checks human-confirmed (`Plan Reviewed`) 2026-09-16. |
| 6 | Task Decomposition + AI Prompts | `.tasks.md`, task-to-AC mapping, implementation prompts | 2.5–3 hrs | Done | 2026-09-16 | All 7 specs done — 31 tasks, 31 per-task prompt files, every AC covered. |
| 7 | Test-first implementation | RED tests + first implementation increment | 4–5 hrs | Not Started | | |
| 8 | Guided implementation | Remaining core implementation + integration | 4–5 hrs | Not Started | | |
| 9 | Validation + Security + Gate 2 preparation | GREEN tests, security review, traceability | 4–5 hrs | Not Started | | |
| 10 | Gate 2 + Final Presentation | Final artefact chain + demo + 10–15 min walkthrough | 2.5–3 hrs | Not Started | | |

---

## 4. Milestones (§7)

| Milestone | Days | Expectation | Status | Notes |
|---|---|---|---|---|
| 1 — Discovery & Specification | 1–2 (BRD→Spec→AC→API→Test Cases by end of Day 3) | Demonstrate no premature coding | Done | BRD → Spec → AC → API Contract → spec-derived Test Cases all complete for all 7 specs. |
| 2 — Gate 1 | Day 3 | A real peer review, not just a presentation | Done | All 7 specs Approved via `@generate-gate1-review.md`. See Deliverable 9's reviewer-identity caveat before treating this as assessment-ready. |
| 3 — Plan → Tasks | Days 4–5 | Plan complete, tasks decomposed | Done | All 7 plans Done and human-confirmed (`Plan Reviewed`). All 7 specs' task decomposition complete — 31 tasks total. |
| 4 — Implementation & Gate 2 | Days 6–8 | Task → Prompt → Test (RED) → Implementation → Test (GREEN) → Review | Not Started | Nothing in this milestone can start until Milestone 3's task decomposition lands. |

**Overall effort expectation:** ~30–35 hours over 8 working days. Log actual hours below as work continues — this can't be estimated from session history alone.

### Effort Log

| Date | Day # (from §6) | Hours logged | Running total | Notes |
|---|---|---|---|---|
| | | | | |

---

## Immediate next actions (in order)

1. ~~Close Deliverable 3 / Milestone 1: run `@generate-test-cases.md for <slug>` for each of the 7 specs.~~ **Done 2026-09-16.**
2. ~~Finish Milestone 3: run `@generate-tasks.md for <slug>` for the remaining 5 specs.~~ **Done 2026-09-16** — all 7 specs decomposed, 31 tasks, 31 per-task prompt files, Milestone 3 fully closed.
3. **Begin Day 7 (test-first)**: `@generate-tests.md for <slug>.T0#` per task, confirm Red, then implement. Pulls from both the spec's own UT table and the QA-expanded `test_cases/` file for each spec. 31 tasks across 7 specs to work through, one at a time.
4. Draft a standalone Security Assessment document (Deliverable 8) — consolidate what's already distributed across specs/constitution.md rather than starting from scratch.
5. Gate 2 review (`@code-review.md`) as tasks complete, building toward Day 9–10.
6. ~~Decide what to do with the stale `test_cases/_integration.md`.~~ **Done 2026-09-16** — deleted and regenerated: 10 cross-feature scenarios (INT-001–INT-010) grounded in the real 7-spec chain, including one full happy-path journey touching all 7 specs and 2 flagged Open Questions (both already-known gaps, not new).
