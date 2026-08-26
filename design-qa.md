# Batch Operations Table Design QA

## Visual truth

- Source: `https://preview.pro.ant.design/list/table-list`
- Implementation: `http://127.0.0.1:3003/examples/lists/batch-operations`
- Viewports: 1440 x 900 and 390 x 844 CSS pixels, device scale factor 1
- States: default table and selected rows with the footer toolbar visible
- Evidence directory: `C:\Users\Administrator\.codex\visualizations\2026\08\26\01a03e93-9fad-7c90-af49-a21ab7619b8a`
- Side-by-side evidence: `compare-grid-desktop.png`, `compare-selected-desktop.png`, `compare-grid-mobile.png`, `compare-selected-mobile.png`

## Iterations

1. Replaced the custom query card, table panel, and fixed batch-action bar with the source structure: `PageContainer`, `ProTable`, and `FooterToolbar`.
2. Removed shell-owned padding only for the route that owns a `PageContainer`, restoring the source grid's 40px outer inset, 16px panel gap, 24px query padding, and 24px/16px table body padding.
3. Reduced the selected-state footer to the source's two actions after the previous four custom actions wrapped at 390px. Kept delete as danger per repository policy.
4. Restored intrinsic horizontal table scrolling on narrow screens and formatted the scheduled time explicitly so the visible value matches the source instead of shifting with the local timezone.

## Final comparison

- Typography and copy hierarchy: matched within the existing product shell and locale system.
- Spacing, margins, card geometry, toolbar alignment, and footer width: matched at both viewports.
- Colors, borders, radii, and shadows: supplied by the same Ant Design Pro components and theme tokens as the source.
- Image and asset quality: not applicable; this content surface has no image assets.
- Expected differences: repository branding/navigation, Fake data values, and the required danger treatment for destructive deletion.
- Actionable P0/P1/P2 findings remaining: none.

Final result: passed.
