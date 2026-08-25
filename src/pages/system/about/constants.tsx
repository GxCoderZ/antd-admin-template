import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

export type TechnologyGroupKey = "dataFlow" | "frontend" | "quality";
export type TechnologyStatus = "approved" | "enabled";

export interface TechnologyItem {
	name: string
	status: TechnologyStatus
	type: string
	version?: string
}

export interface TechnologyGroup {
	items: TechnologyItem[]
	key: TechnologyGroupKey
}

export interface ProductionDependency {
	name: string
	version: string
}

const dependencyVersions = {
	...__APP_INFO__.pkg.dependencies,
	...__APP_INFO__.pkg.devDependencies,
} as Record<string, string>;

function versionOf(name: string) {
	return dependencyVersions[name];
}

export const technologyGroups: TechnologyGroup[] = [
	{
		key: "frontend",
		items: [
			{ name: "React / React DOM", status: "enabled", type: "Web UI", version: `${versionOf("react")} / ${versionOf("react-dom")}` },
			{ name: "TypeScript strict", status: "enabled", type: "Language", version: versionOf("typescript") },
			{ name: "Vite", status: "enabled", type: "Build", version: versionOf("vite") },
			{ name: "React Router", status: "enabled", type: "Routing", version: versionOf("react-router") },
		],
	},
	{
		key: "dataFlow",
		items: [
			{ name: "Ant Design", status: "enabled", type: "Component library", version: versionOf("antd") },
			{ name: "Ant Design Pro Components", status: "enabled", type: "Admin UI", version: versionOf("@ant-design/pro-components") },
			{ name: "TanStack Query", status: "enabled", type: "Server state", version: versionOf("@tanstack/react-query") },
			{ name: "Zustand", status: "approved", type: "Shared state", version: versionOf("zustand") },
			{ name: "Ky + /api", status: "enabled", type: "Transport", version: versionOf("ky") },
		],
	},
	{
		key: "quality",
		items: [
			{ name: "Fake Server", status: "enabled", type: "Offline API", version: versionOf("vite-plugin-fake-server") },
			{ name: "Vitest", status: "enabled", type: "Testing", version: versionOf("vitest") },
			{ name: "Testing Library", status: "enabled", type: "UI testing", version: versionOf("@testing-library/react") },
			{ name: "ESLint", status: "enabled", type: "Static quality", version: versionOf("eslint") },
			{ name: "Circular dependency scanner", status: "enabled", type: "Architecture", version: versionOf("circular-dependency-scanner") },
		],
	},
];

export const productionDependencies: ProductionDependency[] = Object.entries(__APP_INFO__.pkg.dependencies).map(([name, version]) => ({ name, version }));

export function createDependencyColumns(t: TFunction): ProColumns<ProductionDependency>[] {
	return [
		{ title: t("system-info.nameColumn"), dataIndex: "name" },
		{ title: t("system-info.versionColumn"), dataIndex: "version", width: 180 },
	];
}
