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
