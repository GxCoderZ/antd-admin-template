# Template Readiness Queue

Baseline: `a57f14b` (2026-08-28). The worktree was clean before this queue.

This queue improves the existing Fake-only template. It does not add business
modules, a plugin system, a real backend, deployment, or a new framework.
Existing working features are reused, not rebuilt. Each logical change has its
own local commit. No push or external publication is authorized.

| Order | Status      | Owner / Deliverable              | Acceptance                                                                                                                                    |
| ----- | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Complete    | Baseline and bounded queue       | Existing checks inspected; 65 Vitest files / 283 tests pass; production build passes.                                                         |
| 2     | Complete | CI and architecture rules        | No default deployment; 22 executable lint tests reject forbidden dependencies and runtime workarounds; all six checks pass.                      |
| 3     | Awaiting Authorization | Representative UI baselines      | Local browser login, interactions and screenshots require scoped approval before capture. |
| 4     | Pending     | State and interaction coverage   | Error/try-again, empty results, failed-save draft, keyboard/focus and long labels covered using existing owners.                              |
| 5     | Pending     | Dictionary page responsibilities | Characterization tests precede moving column rendering; route retains query/mutation/session orchestration; no duplicate implementation.      |
| 6     | Pending     | Handoff and final acceptance     | Core/optional modules, add/remove/brand/upgrade recipes, change record, full verification and local commit references.                        |

## Verification Contract

- Source/configuration changes: fresh typecheck, Vitest, lint, circular dependency,
  unused-code and production-build results before the logical change is committed.
- Cross-page and shell changes: full Playwright suite.
- UI changes: inspect rendered screenshots at 1440, 768 and 390 CSS pixels;
  measure page open, resize, and core actions against AGENTS.md thresholds.
- Freeze representative Fake data and time for screenshot comparisons. Do not
  hide a failing region or increase tolerances to conceal regressions.
- Browser control/manual checkpoints require the user's scoped authorization.
- Docs-only changes: `git diff --check`; do not claim application verification.

## Baseline Evidence

- `pnpm run typecheck`: passed.
- `pnpm test -- --run`: 65 files / 283 tests passed.
- `pnpm run lint`: no reported violations.
- `pnpm run check:circular-deps`: 235 modules, no violations.
- `pnpm run check:unused`: no reported findings.
- `pnpm run build:prod`: passed.
- Existing E2E covers CRUD, query state, sorting, drafts, table layout, navigation,
  themes and notification/search timing. Fresh full E2E is part of final acceptance.
- jsdom reports unsupported pseudo-element styles and CSS parsing warnings;
  these are not proof of browser correctness and are not suppressed by this queue.

## Change Log

- Item 1: `c7841c3`, baseline and queue. No runtime change or legacy path removed.
- Item 2: `build: enforce template boundaries and remove default deployment`.
  Owners: ESLint, dependency-cruiser and GitLab CI configuration.
  Removed the deployment job/stage and the replaced regex-based Fake import check.
  New rule tests failed 19/22 before the change and passed 22/22 afterward.
  Fresh results: typecheck, lint, dependency checks (266 modules), unused-code
  checks and production build passed; Vitest 66 files / 305 tests passed.
  No external pipeline was executed and no application route or UI was changed.

## Current Checkpoint

Approval requested for Playwright against local ports 3003/4173, Fake demo login,
and user/announcement/dictionary/audit pages with related overlays at
1440/768/390/1286px. No browser action has been taken under this queue.
Items 3-5 and final acceptance remain incomplete until this checkpoint is resolved.
