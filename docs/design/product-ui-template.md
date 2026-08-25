# Product UI Template

This repository contains the reusable UI shell for product administration projects. The implementation mirrors the current `react-antd-admin/apps/admin-web` navigation, pages, components, responsive behavior, theme controls, icons, and internationalization.

The repository is intentionally Fake-only. UI modules call domain functions in `src/api`, those functions request relative `/api` URLs, and `vite-plugin-fake-server` serves the corresponding in-memory routes from `fake/*.fake.ts` in both development and production preview. There is no real backend URL, proxy, authentication or session backend, CSRF implementation, or runtime Fake/Real mode.
