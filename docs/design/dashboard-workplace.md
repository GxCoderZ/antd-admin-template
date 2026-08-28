# Dashboard Workplace Reference

The dashboard is a Fake-only system overview, not a business analytics or server
monitoring page. Its data contract remains in `src/api/dashboard`, with aggregates
derived from the existing Fake stores.

## Upstream Reference

Ant Design Pro, MIT license, commit
`adfd44085738ca953573a13322c1ba84aca8b9e3`:

- [Workplace](https://github.com/ant-design/ant-design-pro/blob/adfd44085738ca953573a13322c1ba84aca8b9e3/src/pages/dashboard/workplace/index.tsx):
  native Card title/body separation, 24px spacing, responsive 16:8 columns,
  activity rows, and quick navigation.
- [EditableLinkGroup](https://github.com/ant-design/ant-design-pro/blob/adfd44085738ca953573a13322c1ba84aca8b9e3/src/pages/dashboard/workplace/components/EditableLinkGroup/index.style.ts):
  copied four-column inline links and 13px row spacing; only route content and
  the project CSS variable prefix are substituted.
- [Analysis overview](https://github.com/ant-design/ant-design-pro/blob/adfd44085738ca953573a13322c1ba84aca8b9e3/src/pages/dashboard/analysis/components/IntroduceRow.tsx):
  four columns at `xl`, two at `sm` through `lg`, and one at `xs`.
- [ChartCard](https://github.com/ant-design/ant-design-pro/blob/adfd44085738ca953573a13322c1ba84aca8b9e3/src/pages/dashboard/analysis/components/Charts/ChartCard/index.tsx)
  and [styles](https://github.com/ant-design/ant-design-pro/blob/adfd44085738ca953573a13322c1ba84aca8b9e3/src/pages/dashboard/analysis/components/Charts/ChartCard/index.style.ts):
  ported title bar, body meta/action/total, fixed content region and footer divider
  into `ChartCard.tsx` and `ChartCard.module.css`. This replaces the earlier basic
  Card + Statistic implementation, which was not the screenshot's component.
- [Field](https://github.com/ant-design/ant-design-pro/blob/adfd44085738ca953573a13322c1ba84aca8b9e3/src/pages/dashboard/analysis/components/Charts/Field/index.tsx)
  and [styles](https://github.com/ant-design/ant-design-pro/blob/adfd44085738ca953573a13322c1ba84aca8b9e3/src/pages/dashboard/analysis/components/Charts/Field/index.style.ts):
  ported footer label/value and 8px spacing alongside ChartCard.
- [Trend](https://github.com/ant-design/ant-design-pro/blob/adfd44085738ca953573a13322c1ba84aca8b9e3/src/pages/dashboard/analysis/components/Trend/index.tsx)
  and [styles](https://github.com/ant-design/ant-design-pro/blob/adfd44085738ca953573a13322c1ba84aca8b9e3/src/pages/dashboard/analysis/components/Trend/index.style.ts):
  copied inline comparisons, CaretUpOutlined/CaretDownOutlined, 22px line height,
  red-6/green-6 colors and the source color variants. IntroduceRow supplies the
  16px comparison gap and 8px value spacing. Source HEAD was rechecked on 2026-08-29.

`DashboardOverview`, `DashboardQuickEntries`, and `DashboardActivityPanels` adapt
these layout patterns to the installed Ant Design version and theme tokens.
Native Card, Tabs, Button, Badge, and icon components are reused rather
than copying framework internals or upstream application dependencies.

## Intentional Adaptations

- Order: system status, four metrics, quick entries, activity and notices.
- Card outer frames use the upstream native borderless Card, including its
  8px radius, 56px title bar, 24px body padding, and three-part light shadow.
  The installed Ant Design version has a heavier default shadow and the app
  seed radius produces 12px Card corners, so those two public Card tokens are
  scoped to the dashboard to match the captured reference exactly.
- Activity Card body padding is zero, as in upstream Workplace; rows own the
  upstream 16px vertical / 24px horizontal padding and 32px avatar placement.
- ChartCard retains the source's title in both the native title bar and the body
  meta row, as explicitly requested in the screenshot. Body padding is
  `20px 24px 8px`, total typography is `30px/38px`, content height is 46px, and
  the footer has 9px top padding and the theme's 1px separator.
- Source styles are translated to existing CSS Modules and `--raa-*` tokens;
  no styling or class-name dependency is added. Unused avatar, function-total
  support and the unused `chartTopHasMargin` style are not imported. Custom
  ChartCard props are consumed locally rather than forwarded as DOM attributes.
- The first IntroduceRow card's complete content now appears in every metric:
  weekly comparison, daily comparison, arrows, and a numeric Field footer.
  The earlier summary-only content and counting-scope footers were incomplete
  ports and are removed. Summaries remain only in the existing information tooltip.
- The four totals still use the existing dashboard aggregate. Footer values are
  active users, built-in roles, assigned permission nodes, and abnormal logins,
  derived from the same Fake stores. Period comparisons are explicit fixed Fake
  samples in `fake/dashboard.fake.ts`, not invented client-side values or real
  historical analytics. Their signed ratios travel through the existing Query/API
  chain; locale-aware formatting shows the absolute percentage beside the arrow.
- Information tooltips retain hover and also support keyboard focus through the
  public AntD trigger API; no custom open-state or timing logic is introduced.
- Mobile metrics use the source's single-column layout. Navigation keeps the upstream link grouping
  above Ant Design's `sm` breakpoint and uses two columns below it so localized
  labels remain readable; its Card frame is unchanged.
- Existing application fonts, language, timezone, theme, and permissions remain
  authoritative. No external font or avatar requests are added.
- Ant Design 6 List is deprecated, so activity uses semantic lists and native
  Avatar/Flex/Typography, with the same row separation and content padding.
- Project/team data, charts, customization controls, real services, and polling
  from the official examples are not imported.

## Upstream License

MIT License

Copyright (c) 2019-present Alipay.inc

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
