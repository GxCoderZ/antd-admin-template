# AntD Admin Template

`antd-admin-template` is a Fake-only React administration UI template. Its visual shell and pages follow `platform/react-antd-admin/apps/admin-web`, while every data request stays local through `src/api -> /api -> fake/*.fake.ts`.

## Stack

- React 19, TypeScript 6, Vite 8, React Router 8
- Ant Design 6, TanStack Query 5
- i18next, vite-plugin-fake-server
- Vitest, Testing Library, Playwright, Knip

## Commands

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm run typecheck
pnpm test -- --run
pnpm run test:e2e
pnpm run lint
pnpm run check:circular-deps
pnpm run check:unused
pnpm run build:prod
pnpm preview
```
