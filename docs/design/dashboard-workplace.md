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
  four-column overview at the `xl` breakpoint and two columns below it.
- [Ant Design Statistic card example](https://github.com/ant-design/ant-design/blob/6.6.1/components/statistic/demo/card.tsx):
  one native borderless Card around each Statistic, using its title, value, and
  prefix slots and default typography without a separate title layout.

`DashboardOverview`, `DashboardQuickEntries`, and `DashboardActivityPanels` adapt
these layout patterns to the installed Ant Design version and theme tokens.
Native Card, Statistic, Tabs, Button, Badge, and icon components are reused rather
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
- Mobile metrics use two columns. Navigation keeps the upstream link grouping
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
