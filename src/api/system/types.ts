export interface SystemInfoData {
	builtAt: string;
	commitSha: string;
	environment:
		| "cloudflare-pages"
		| "github-pages"
		| "local-development"
		| "local-production";
	service: string;
	version: string;
}
