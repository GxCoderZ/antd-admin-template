# Template Readiness Queue

Baseline: `a57f14b` (2026-08-28). The worktree was clean before this queue.

This queue improves the existing Fake-only template. It does not add business
modules, a plugin system, a real backend, deployment, or a new framework.
Existing working features are reused, not rebuilt. Each logical change has its
own local commit. No push or external publication is authorized.

| Order | Status   | Owner / Deliverable              | Acceptance                                                                                                                                        |
| ----- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Complete | Baseline and bounded queue       | Existing checks inspected; 65 Vitest files / 283 tests pass; production build passes.                                                             |
| 2     | Complete | CI and architecture rules        | No default deployment; 22 executable lint tests reject forbidden dependencies and runtime workarounds; all six checks pass.                       |
| 3     | Complete | Representative UI baselines      | Four pages pass fixed-time captures, responsive pixel restoration, keyboard/focus, viewport bounds and timing thresholds.                         |
| 4     | Complete | State and interaction coverage   | Query-error recovery and empty/reset tests added; failed-save/draft/permission tests reused; keyboard/focus and long input checked in Chromium.   |
| 5     | Complete | Dictionary page responsibilities | Characterization test precedes moving columns; route reduced from 922 to 665 lines after formatting and retains Query/Mutation/session ownership. |
| 6     | Complete | Handoff and final acceptance     | Handoff, change record and concise verification rule delivered; all six checks and 118 E2E tests pass.                                            |

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
- Item 2: `25aff71`, `build: enforce template boundaries and remove default deployment`.
  Owners: ESLint, dependency-cruiser and GitLab CI configuration.
  Removed the deployment job/stage and the replaced regex-based Fake import check.
  New rule tests failed 19/22 before the change and passed 22/22 afterward.
  Fresh results: typecheck, lint, dependency checks (266 modules), unused-code
  checks and production build passed; Vitest 66 files / 305 tests passed.
  No external pipeline was executed and no application route or UI was changed.
- Items 3-4: `1a7eaf3`, representative browser acceptance, announcement state
  coverage and shared log Drawer sizing. Existing failed-save, draft, permission,
  CRUD and cross-route tests are reused; no second implementation was introduced.
- Item 5: `6b0eeef`, dictionary column rendering moved into typed domain hooks.
  The old inline definitions were removed; no compatibility path was added.
  Characterization and focused dictionary tests passed before/after extraction;
  final formatting leaves the route at 665 lines, down from 922.
- Visual inspection found the shared log detail Drawer retained Ant Design's
  378px default at a 390px viewport. The new browser assertion failed with
  expected 390 / received 378; `LogDetailsDrawer` now uses the public responsive
  `size` prop, shared by audit and login logs. No style override was added.
- Item 6: handoff dependency map, add/remove/brand/upgrade instructions,
  `CHANGELOG.md`, README links and one narrowly scoped AGENTS.md verification
  rule. No additional architecture exception or runtime workaround was added.

## Final Verification

- `pnpm run typecheck`: passed.
- `pnpm test -- --run`: 66 files / 308 tests passed.
- `pnpm run lint`: passed.
- `pnpm run check:circular-deps`: passed, 267 modules / 1170 dependencies.
- `pnpm run check:unused`: passed.
- `pnpm run build:prod`: passed with Fake Server enabled.
- `pnpm run test:e2e`: 118 tests passed in 8.4 minutes, without retries.
- Changed-source formatting and patch-pattern scan: passed, no forbidden hits.
- `git diff --check`: passed; documentation is checked separately from behavior.
- No dependency version changed; no external pipeline, push or deployment ran.

## Acceptance Scope

The user authorized this local browser acceptance on 2026-08-28: Playwright on
ports 3003/4173, Fake demo login, and user/announcement/dictionary/audit pages
with related overlays at 1440/768/390/1286px. No external account or publication
is included. All six items are complete. The local development address at port
3003 was also checked:
the 390px audit Drawer fills the viewport and reports no console errors.

## Browser Evidence

Production-preview Chromium run, 2026-08-28. Four page opens, twenty viewport
samples and twenty overlay opens; values below are rounded to milliseconds.

| Measurement         | p50 | p95 | Maximum |
| ------------------- | --: | --: | ------: |
| Page open           | 709 | 761 |     761 |
| Viewport change     | 337 | 375 |     392 |
| Overlay interaction | 608 | 646 |     656 |

All thresholds pass. Representative pages: users, announcements, dictionaries,
audit logs. Widths: 1440, 768, 390, 1286, then 1440 for restoration. Screenshots
were inspected for spacing, text, visible controls and overlay boundaries.
Page-level overflow, browser errors and failed requests were checked by tests.
The existing 1286px audit stability test also passes.

Artifacts are generated under `test-results/template-experience-*/`: page and
overlay PNGs, a long-input screenshot, and `experience-metrics.json`. Initial
and restored desktop table pixels are compared in the same run. This avoids
cross-OS font mismatches; it is not a persisted cross-platform golden-image test.
