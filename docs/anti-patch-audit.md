# Anti-Patch Audit Checklist

Use this checklist before handing off feature or cleanup work. The goal is to
fix the owning layer, not to hide symptoms in downstream guards.

## Must Scan

- Delayed state workarounds: `setTimeout`, `setInterval`.
- Hidden errors: empty `catch {}`, or catches that only discard the error.
- Type escapes: `as any`, `: any`, `as unknown as`, `@ts-ignore`,
  `@ts-expect-error`.
- Disabled rules: `eslint-disable`.
- Style overrides: `!important`, broad global CSS, Ant Design internal class
  overrides.
- API boundary escapes: direct `fetch` outside `src/api/client.ts`, `axios`,
  hard-coded API hosts, page imports from `fake`.
- Duplicate truth: query results copied into unrelated local/global state.
- Dead code: commented-out code blocks, unused files and exports from `knip`.

## Current Boundaries

- Direct `fetch` is allowed only in `src/api/client.ts`.
- Theme color hex values are centralized in `src/app/preferenceStorage.ts`.
- Fake route tests use `fake/route-helpers.ts` instead of per-file route casts.
- Optional browser storage failures may fall back, but catch blocks must name the
  degradation path explicitly.
- Ant Design generated DOM may be targeted only from a narrow component-owned
  CSS module when no component API can express the layout.

## Review Questions

- Is there one source of truth for server data, route session state, selected
  rows, and drafts?
- Is the page using the shared management table/query/action utilities when it
  behaves like a management table?
- Is a fallback fixing a missing contract upstream, or only protecting display
  text from optional data?
- Can a new developer find the route, API, Fake implementation, locale strings,
  permissions, and tests without reading a giant mixed-responsibility file?
- Does the test assert user-visible behavior rather than the presence of a
  workaround?
