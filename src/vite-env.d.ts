/// <reference types="vite/client" />

declare const __ADMIN_WEB_DEPENDENCIES__: Readonly<Record<string, string>>;
declare const __INSTALLED_DEPENDENCIES__: Readonly<Record<string, string>>;
declare const __WORKSPACE_TOOL_VERSIONS__: Readonly<{
	node: string;
	pnpm: string;
}>;

declare module "*.css";
