/// <reference types="vite/client" />

declare const __BUILD_METADATA__: Readonly<{
	builtAt: string;
	commitSha: string;
	environment: "cloudflare-pages" | "local-development" | "local-production";
	version: string;
}>;

declare module "*.css";
