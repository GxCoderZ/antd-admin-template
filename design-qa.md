# Dashboard Design QA

## Target And State

- Scope: port the official Pro Card frame and workplace presentation, replacing
  content with the approved Fake-only system overview. Existing shell and product
  information order are retained, not claimed as a whole-page pixel clone.
- Source: Ant Design Pro commit `adfd44085738ca953573a13322c1ba84aca8b9e3`.
  Source mapping and MIT notice: [dashboard-workplace.md](docs/design/dashboard-workplace.md).
- Implementation: `http://127.0.0.1:3003/dashboard`, Fake admin preview.
- Viewports: 1440x1000 and 390x1000 CSS pixels; device scale factor 1; matching
  screenshot dimensions, no density scaling applied before comparison.
- States: Chinese light; English dark; recent logins and recent operations.

## Evidence

All paths below are relative to this repository; generated images are ignored by Git.

- Source full views: `.codex-audits/dashboard-style/reference-workplace-1440-top.png`
  and `reference-workplace-390-top.png` in the same directory.
- Implementation full views: `.codex-audits/dashboard-final-e2e/`, in the
  `dashboard-workspace-工作台布局和管理入口（1440px）-chromium` and corresponding
  `（390px）` directories: `dashboard-1440-top.png`, `dashboard-390-top.png`.
- Focused source: `.codex-audits/dashboard-style/reference-workplace-390-activity.png`.
- Focused implementation: `.codex-audits/dashboard-style/implementation-activity-390.png`.
- Dark localization: `.codex-audits/dashboard-style/implementation-en-dark-390-final.png`.
- Reference and implementation images were opened together for full-view and
  focused comparisons. Focused activity widths differ (310px source, 327px local)
  because the existing shells have different outer padding; inner frame metrics
  were measured independently rather than stretching either image.

## Findings And Iterations

1. P1: original unframed sections scattered text on the page background.
   Replaced section wrappers with upstream native borderless Card structure.
2. P1: the first revision flattened Card corners and removed its native shadow.
   Deleted those overrides. Scoped public Card tokens now reproduce the source's
   8px radius and three-part light shadow despite different installed defaults.
3. P2: activity presentation omitted the source's avatar/text/date arrangement.
   Restored 32px Avatar, 16px row gap, 16px/24px row padding and date placement.
   Deprecated List was adapted with semantic list elements and AntD primitives.
4. P2: four-column navigation crowded English labels at 390px.
   Preserved the copied link styles and added two columns below the AntD sm
   breakpoint. Final dark capture shows complete labels without touching.

Post-fix evidence is listed above; the earlier flat/compact revisions are not
accepted as the final target. No actionable P0/P1/P2 finding remains in this scope.

## Fidelity Surfaces

- Typography: native Card heading is 16px/600 with a 56px title bar. Existing
  application system fonts remain instead of adding Pro's external AlibabaSans;
  content and labels wrap without being hidden.
- Layout: 24px section/grid spacing, 16:8 desktop columns, stacked narrow layout,
  24px Card body padding; activity Card body is zero as in the source.
- Colors/tokens: theme-native background and separators; exact source Card radius
  and shadow checked by Playwright on desktop and mobile. Dark theme preserved.
- Assets: native AntD icons and Avatar; generic Fake users replace source user
  images. No remote assets, fabricated logos, charts, or decorative media added.
- Content: only system state, four administrative counts, authorized shortcuts,
  login/operation activity, announcements and lightweight reminders.

## Behavior Checks

- Five authorized navigation links and maintenance shortcut reach existing routes.
- Login/operation tabs switch correctly; browser page-error collection is empty.
- Geometry checks cover order, responsive columns, Card frame and overflow.
- Component/API/Fake tests cover permissions, loading, errors/retry, empty states,
  timezone aggregation and updated Fake data after management mutations.

## Repository Regression Note

The full E2E run passed 74 of 75 cases. The unrelated announcement-table column
test expected four headers but received an additional empty selection header from
the concurrent announcement batch-action change. Its owning task then updated
the test; a focused rerun passed. The feature and its tests are outside this
dashboard change and are not included in its commit. The dashboard-specific
desktop and mobile cases passed. The full first run was 74/75, followed by the
successful targeted recheck; it is not reported as a fresh single-run 75/75.

final result: passed
