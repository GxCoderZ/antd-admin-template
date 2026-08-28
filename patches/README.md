# ProComponents Theme Registration

## Scope

`@ant-design__pro-components@3.1.14-2.patch` changes only
`es/provider/index.js`, `es/provider/useStyle/index.js`, and their CommonJS
counterparts.
pnpm applies it from `pnpm-workspace.yaml`; the lockfile pins its hash.
No application component, AntD CSS selector override, timer, remount key,
parallel theme state, or extra dependency is involved.

## Official Comparison

- [Pro useStyle](https://github.com/ant-design/pro-components/blob/358de7cdd602b68dad491ef82e93661a96c42901/src/provider/useStyle/index.ts)
- [AntD useStyleRegister scoping](https://github.com/ant-design/cssinjs/blob/master/src/hooks/useStyleRegister.tsx)
- [AntD theme configuration](https://ant.design/docs/react/customize-theme/)

The installed `3.1.14-2` and official `3.1.14-6` source both register literal
Pro token colors without passing `hashId` to `useStyleRegister`. Their local
version counter restarts when a route remounts and increases on each toggle.
Old dark selectors can override cached light rules, and repeated switching
keeps adding styles. The application's `defaultAlgorithm` / `darkAlgorithm`
configuration and native AntD components were already updating correctly.

The provider derives its hash from cssinjs's token fingerprint. Both direct
context consumers (such as the query wrapper) and style hooks use that scope;
standalone ProCard retains its existing token-based fallback. The style hook
passes the scope to cssinjs and returns it for component markup. This
isolates cached themes while reusing their stable style paths. It removes
the version counter and the silent fingerprint-serialization fallback.
The upstream explicit `hashed: false` opt-out is retained; the application
uses the default hashed mode.

## Development Cache

After applying or updating this dependency patch, restart an already-running
development server with `pnpm dev --force`, then reload the page. Vite can keep
the previous dependency code in `node_modules/.vite` while the server stays
running; a production build does not use that development cache. See the
[Vite dependency cache documentation](https://vite.dev/guide/dep-pre-bundling#caching).
This is a one-time development step, not an application refresh mechanism.

## Validation and Removal

`e2e/theme-switching.spec.ts` checks theme colors after route remounts, bounded
style counts, rapid toggles, preference persistence, all nine management
tables and the native dependency table at 1440px, 768px and 390px.

Remove this patch and its pnpm registration when an official release passes
these tests unmodified, including independent theme scoping and repeated
toggle cache reuse. Do not replace it with page-specific background colors.
