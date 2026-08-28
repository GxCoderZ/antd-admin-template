# Changelog

## Unreleased

### Template Boundaries

- Removed the default external deployment job. CI only verifies and builds.
- Added executable ESLint rule tests and dependency direction checks for UI,
  API, Fake and test boundaries. No real backend or deployment was added.

### Maintainability

- Extracted dictionary type/item columns into typed domain hooks. The route
  retains Query, Mutation and session ownership; the old inline definitions
  are removed rather than kept as an alternative path.
- Added a module-removal dependency map and add/remove/brand/upgrade recipes
  in `docs/template-handoff.md`.

### Acceptance

- Fixed the shared audit/login detail Drawer width using Ant Design's public
  `size` prop so it fills the 390px viewport without a CSS override.
- Added announcement query-error recovery and empty-result/reset coverage,
  alongside existing failed-save, draft, permission and CRUD tests.
- Added fixed-time browser captures, responsive desktop pixel restoration,
  overlay keyboard/focus checks and p50/p95 timing for four representative pages.
- Scope, results and local commit references are tracked in
  `docs/template-readiness-queue.md`. This is not a published release.
