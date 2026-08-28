# Changelog

## Unreleased

### Header Language Menu

- Ported Ant Design Pro's native language button and menu presentation, adapting
  its locale API to i18next and its colors/spacing to public Ant Design tokens.
- Removed the custom loading button and controlled dropdown state. Failed
  resource loads keep the current language; the latest selection wins.
- Matched the official eight-language menu: Bengali, English, Persian,
  Indonesian, Japanese, Brazilian Portuguese, Simplified and Traditional Chinese.
  Added complete app translations, component/date locales and Persian RTL;
  removed the previous Korean option and its unused translation bundle.
- Added coverage for pending/failed language loads, rapid choices, native menu
  transitions, touch input and 1440/768/390px layouts.

### Table Fields

- Reviewed all ten tables separately. Management lists keep required identity
  and action columns, default recommended columns, and opt-in comparison fields.
- Moved raw identifiers, complete permissions and long log payloads out of column
  settings; grouped the complete read-only record fields in detail drawers.
- Preserved existing column preferences and the native shared table implementation.
  The per-table checklist is `docs/table-field-review-queue.md`.
- Consolidated secondary department and dictionary type actions so fixed action
  columns no longer obscure record names on narrow screens.

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
