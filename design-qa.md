# Dashboard ChartCard Fidelity Check

## Target

- Source visual: `C:/Users/ADMINI~1/AppData/Local/Temp/codex-clipboard-0c4ced66-6c99-4b96-a858-4f782da24d7a.png`.
- Source implementation: Ant Design Pro commit `adfd44085738ca953573a13322c1ba84aca8b9e3`, Analysis `IntroduceRow`, `Trend`, `ChartCard`, and `Field`.
- Scope: four existing system metrics, with the reference's weekly/daily comparisons, arrows and numeric footer. No sales domain or charts are added.
- Implementation: `D:/Dev/.codex-worktrees/antd-admin-template-pro-trends-20260829`.
- Intended viewports: 1440px, 768px and 390px; light Chinese and dark English.
- Implementation screenshot: not captured in this task. Browser operation authorization is pending.
- Source density, normalized CSS crop, full-view and focused comparisons: not verified without a matching browser capture.

## Confirmed Source Defect And Fix

The previous port retained ChartCard and Field but replaced IntroduceRow's Trend
children with summary text. The new tests reproduced missing comparisons and
missing numerical footer fields before implementation. Trend and its source
styles are now ported, with CSS Modules and the existing AntD token prefix replacing
upstream styling dependencies. The source's 16px comparison gap, 8px value gap and
22px line height are preserved. Summary text remains only in the information tooltip.

## Fidelity Surfaces

- Typography: source declarations retained; rendered fonts and wrapping await comparison.
- Spacing: existing 237px frame and 46px content area retained; browser geometry assertions updated but not run in this task.
- Colors: source red-6/green-6 tokens retained; computed light/dark colors await browser verification.
- Assets: source Ant Design CaretUpOutlined/CaretDownOutlined and existing InfoCircleOutlined are used, with no generated or hand-drawn substitutes.
- Content: system names and Fake values replace sales content; both period labels, percentages and numeric footer are present in component tests.

## Verification

- Initial regression run: two expected failures (missing comparisons and Fake footer fields).
- Focused regression: 19 tests passed, including the committed baseline's four language key sets.
- Fresh required checks passed: typecheck, all unit tests (68 files / 330 tests), lint, circular dependencies, unused code and production build.
- Playwright dashboard assertions now cover the comparison content, arrow colors, 768px layout, resize restoration and performance samples. They have not been executed in this task.
- No screenshot comparison result or p50/p95 result is claimed.

## Integration Checkpoint

The canonical workspace has an unrelated, uncommitted language migration from
four languages to eight, including removal of ko-KR and five new locale files.
This task changes dashboard labels in the committed baseline's locale files.
The language migration must be committed or its ownership coordinated before
integration, so all currently selected languages receive the new labels without
committing or overwriting another task's work.

## Remaining Work

1. Reconcile the new dashboard labels with the language migration and integrate using Git.
2. Obtain this task's browser/Playwright inspection authorization.
3. Run the updated page tests on a fresh build, compare the rendered card with the source at matched dimensions, and record timing and screenshot evidence.
4. Resolve any visual mismatches before marking the fidelity check passed.

## Historical Reports

The records below describe earlier accepted scopes. Their deliberate omission
of comparison content is superseded by the current screenshot requirement.

# Dashboard Design QA

## ChartCard Pass

- Scope: replace the four basic Card + Statistic metrics with Pro Analysis
  ChartCard/Field. This is not a clone of the entire sales-analysis page.
- Source visual: `C:/Users/ADMINI~1/AppData/Local/Temp/codex-clipboard-3c9d9462-bda2-4e3e-b26b-ad102ed7e322.png`,
  426x265 pixels, containing an approximately 397x237 CSS-pixel card.
- Source code: Pro commit `adfd44085738ca953573a13322c1ba84aca8b9e3`;
  [source mapping and MIT notice](docs/design/dashboard-workplace.md).
- Local route: `http://127.0.0.1:3003/dashboard`; Fake admin, Chinese light and
  English dark, Chromium, device scale factor 1, 1000px viewport height.
- Current screenshots: `.codex-audits/dashboard-chart-card/`, in the respective
  `dashboard-workspace-工作台布局和管理入口（1440px）-chromium`, `（460px）` and
  `（390px）` directories: `dashboard-1440-top.png`, `dashboard-390-top.png`,
  and focused `dashboard-460-metric.png`.
- The 460px viewport gives a 397px-wide card matching the reference card width.
  The element capture excludes the reference's surrounding margin/shadow area.
  No stretching or density scaling was applied. The reference, focused capture,
  desktop, mobile and dark page captures were opened in the same comparison input.
- Dark capture: `dashboard-workspace-工作台指标卡保留英文和深色主题（390px）-chromium/dashboard-en-dark-390.png`
  under the same current screenshot directory.

Findings and fixes:

1. P1: the previous basic Statistic omitted the screenshot's title bar, dedicated
   content region and footer divider. Replaced that path with the upstream
   ChartCard/Field structure and paired styles. Final captures show the full frame.
2. P2: keyboard focus did not reveal the information tooltip. A failing browser
   test reproduced it; native AntD hover/focus triggers fix it without custom
   state or timers. The final four browser cases pass.
3. Initial geometry assertions missed native Card's -1px header bottom margin.
   Confirmed the installed source and corrected the test expectations; no CSS
   compensation was added to the application.

Required fidelity surfaces:

- Typography: 30px/38px totals, 14px/22px meta and footer, native 16px bold title.
  Application/system fonts remain authoritative; glyph rasterization is not
  claimed to match the reference's different host fonts.
- Layout: 56px native title bar, `20px 24px 8px` body padding, 46px content region,
  12px content bottom margin, 9px footer padding, 1px separator, 237px total height.
  Desktop cards align; mobile cards form one column with 24px gaps.
- Tokens: existing 8px radius and Pro light shadow retained. Text, backgrounds
  and separators use theme tokens; English dark remains readable and unclipped.
- Assets: native AntD InfoCircleOutlined; no photographic assets are needed.
  Sales trend arrows are intentionally absent with the replaced sales content.
- Content: four existing Fake totals, abnormal-login footer, and counting scopes.
  No invented trends or API fields. New copy covers all four supported languages.

Verification: eight dashboard behavior tests; four browser cases cover 1440px,
460px, 390px and English dark, including typography, geometry, borders, overflow,
tooltip focus, activity tabs and five navigation links. No page errors in the
three Chinese cross-route cases. Shared shell edits are outside this pass.

No actionable P0/P1/P2 finding remains in the ChartCard scope.

Current repository checks: typecheck, all 268 unit tests, circular-dependency
check, unused-code check, production build and the changed-files lint pass.
Full repository lint is blocked by an unrelated concurrent change in
`src/features/admin-shell/AdminShellHeader.test.tsx:98`
(`@typescript-eslint/no-unsafe-assignment`). That file is not part of this
ChartCard change. The visual pass is not a claim that all repository gates pass.

## Previous Workplace Pass

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

Historical result: passed

final result: blocked
