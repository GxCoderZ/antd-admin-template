# Third-Party Notices

## Ant Design ProComponents

The preference drawer presentation in `SettingsDrawer.tsx`,
`SettingsPreviewChoices.tsx`, `SettingsDrawer.module.css`, and `settings-icons/`
ports the SettingDrawer, BlockCheckbox, ThemeColor, SubIcon and GroupIcon from:
https://github.com/ant-design/pro-components/tree/master/src/layout/components/SettingDrawer

Adaptations retain this application's preferences and controls, use Ant Design
Radio for keyboard interaction, scope SVG IDs per instance, and centralize the
original thumbnail colors in `preferenceStorage.ts`. SVG geometry and the
upstream thumbnail dimensions, spacing and palette are retained.

`patches/@ant-design__pro-components@3.1.14-2.patch` also modifies the ESM and
CommonJS builds of the upstream provider and its `useStyle` function. It scopes
literal theme colors through cssinjs `hashId` and uses stable cache paths,
replacing the per-mount style-version counter. This fixes theme rules leaking
across route remounts and repeated toggles accumulating styles. See
`patches/README.md` for source references and the removal condition.

The MIT License (MIT) Copyright (c) 2023 <copyright holders>

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

## Ant Design Pro Dashboard Chart

`src/features/dashboard/components/DashboardLoginTrend.tsx` and its lazy-loaded
`LoginTrendChart.tsx` adapt the Card and Line chart configuration from
Ant Design Pro's `OfflineData.tsx`:
https://github.com/ant-design/ant-design-pro/blob/master/src/pages/dashboard/analysis/components/OfflineData.tsx

The port retains the line chart, axis configuration and centered legend, with
the chart height reduced from 400px to 320px for a compact seven-day trend.
Shop tabs, conversion rings and the time slider are omitted. Data, text and
theme colors use this template's Fake API, translations and Ant Design tokens.

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
