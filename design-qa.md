# Dashboard ChartCard Fidelity Check

## Target

- Source visual: `C:/Users/ADMINI~1/AppData/Local/Temp/codex-clipboard-0c4ced66-6c99-4b96-a858-4f782da24d7a.png`.
- Source implementation: Ant Design Pro commit `adfd44085738ca953573a13322c1ba84aca8b9e3`, Analysis `IntroduceRow`, `Trend`, `ChartCard`, and `Field`.
- Scope: four existing system metrics, with the reference's weekly/daily comparisons, arrows and numeric footer. No sales domain or charts are added.
- Implementation: `D:/Dev/antd-admin-template`, local route `http://127.0.0.1:3003/dashboard`.
- Integration: `0c57400` contains the trend/footers port; `3ba5dd6` integrates it with the eight-language UI; `a1f28a1` aligns browser assertions with native markup. Acceptance started at `ec04667` with unrelated shell work left untouched.
- Authorized acceptance: local Fake login, browser inspection, Playwright and screenshots on 2026-08-29. No external publishing or real account operations.
- Viewports: 1440x1000, 768x1000 and 390x1000, plus 460x1000 for the matched-width card crop. Chromium device scale factor 1; Chinese light and English dark.
- Fresh-build screenshot root: `.codex-audits/dashboard-trace-verification/`. The `dashboard-workspace-工作台布局和管理入口（WIDTHpx）-chromium-repeat1` directories contain `dashboard-WIDTH-top.png`, `dashboard-WIDTH-metric.png`, `dashboard-WIDTH-activity.png` and `dashboard-WIDTH-reminders.png`.
- English dark evidence: `dashboard-workspace-工作台指标卡保留英文和深色主题（390px）-chromium-repeat1/dashboard-en-dark-390.png` under the same root.
- The source and 460px-viewport metric crop were opened together with desktop, tablet, mobile and dark captures in one comparison input. The reference's approximately 397x237 CSS-pixel card matches the element's 397px width and measured 237px height. No image stretching or density scaling was applied; the element screenshot excludes the surrounding margin and shadow area.

## Confirmed Source Defect And Fix

The previous port retained ChartCard and Field but replaced IntroduceRow's Trend
children with summary text. The new tests reproduced missing comparisons and
missing numerical footer fields before implementation. Trend and its source
styles are now ported, with CSS Modules and the existing AntD token prefix replacing
upstream styling dependencies. The source's 16px comparison gap, 8px value gap and
22px line height are preserved. Summary text remains only in the information tooltip.

## Fidelity Surfaces

- Typography: 30px/38px totals, 14px/22px comparison content and footer, native Card heading. The host font rasterization is not claimed as pixel-identical to the reference. Chinese and English content is unclipped at 390px.
- Spacing: measured 237px frame, 56px native title bar, 24px horizontal body padding, 46px comparison area, 16px comparison gap, 8px value gap, 1px footer divider and 9px footer top padding. Four/two/one-column layouts and width restoration passed.
- Colors: source red-6/green-6 arrows resolve to `rgb(245, 34, 45)` and `rgb(82, 196, 26)` in the light browser checks. Dark card/text/background remain token-driven and readable. The 8px radius and Pro shadow match the source frame.
- Assets: source Ant Design CaretUpOutlined/CaretDownOutlined and existing InfoCircleOutlined are used, with no generated or hand-drawn substitutes.
- Content: system names and Fake values replace sales content; period labels, percentages and numeric footer are visible in all four cards. Summary text is only in native hover/focus tooltips. The earlier summary-only comparison area and counting-scope footer are replaced, not retained as a parallel path.

## Verification

- Initial regression run: two expected failures (missing comparisons and Fake footer fields).
- Focused regression: 19 tests passed, including the committed baseline's four language key sets.
- The original isolated implementation passed all six required checks (68 files / 330 unit tests). The fresh canonical typecheck, unit tests (381 passed), lint, circular-dependency check, unused-code check and production build all passed. Logs: `.codex-audits/dashboard-current-{typecheck,unit,lint,circular,unused,build}.log`.
- Initial current-build dashboard run: 6/7 passed. The English dark case reached `/dashboard` but only the shell/footer rendered, without the metric card. Its screenshot and error context are retained in `.codex-audits/dashboard-acceptance/`; that run did not collect a trace for the failed case.
- Diagnostic rerun of English dark with a trace: 1/1 passed. A subsequent bounded two-round traced suite passed 14/14, including both timezones, all viewport cases, native tooltips, activity tabs, five management links and maintenance navigation. No timeouts were enlarged, assertions disabled or application workaround added.
- In-app inspection at 1440px, 768px and 390px confirmed the card layout and theme/language changes. The captured console had no warnings or errors. Chinese/light and the default viewport were restored after inspection.
- The 14-test run reported no browser errors or failed requests in the cross-route cases, no page-level overflow, no comparison/footer clipping and no interaction threshold failures. JSON evidence: `.codex-audits/dashboard-trace-verification.json`.

| Measurement | Samples | p50 (ms) | p95 (ms) | Maximum (ms) |
| --- | ---: | ---: | ---: | ---: |
| Dashboard available after Fake sign-in | 8 | 1124.5 | 1167.0 | 1167.0 |
| Viewport change and layout restoration | 32 | 72.6 | 327.9 | 330.0 |
| Tooltip and activity-tab interaction | 32 | 366.5 | 402.2 | 418.9 |

## Remaining Acceptance Risk

No actionable visual mismatch remains in the comparison-card scope. However,
the initial English-dark empty-content event has not been explained: subsequent
traced runs and in-app switching did not reproduce it. Reviewing the dashboard,
shell outlet and app assembly did not establish a root cause. Concurrent shell
work was present, but is not proven to have caused the event.

The feature is integrated and visually verified; overall acceptance remains
blocked on capturing and resolving that intermittent first-entry behavior.
Passing diagnostic reruns are not represented as a fix or as an initial 7/7 pass.
No speculative shell, routing or theme change was made in this acceptance pass.

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
