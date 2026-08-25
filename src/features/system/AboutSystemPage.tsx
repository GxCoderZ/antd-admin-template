import {
	Card,
	Col,
	Divider,
	Flex,
	Row,
	Table,
	Tag,
	theme,
	Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { getSystemInfo, systemInfoQueryKey } from "#src/api/system";

const { Text, Title } = Typography;

type TechnologyGroupKey = "fake" | "frontend" | "platform";
type TechnologyStatus = "approved" | "enabled" | "reserved";
type TechnologyType =
	| "apiClient"
	| "build"
	| "ci"
	| "componentLibrary"
	| "dependencyAutomation"
	| "i18n"
	| "language"
	| "mock"
	| "packageManager"
	| "routing"
	| "runtime"
	| "stateManagement"
	| "testing"
	| "visualization"
	| "webFramework";

interface TechnologyItem {
	name: string;
	status: TechnologyStatus;
	type: TechnologyType;
	versionPackages?: string[];
	workspaceTool?: keyof typeof __WORKSPACE_TOOL_VERSIONS__;
}

interface TechnologyGroup {
	items: TechnologyItem[];
	key: TechnologyGroupKey;
}

interface ProductionDependency {
	name: string;
	version: string;
}

const technologyGroups: TechnologyGroup[] = [
	{
		key: "frontend",
		items: [
			{
				name: "React / React DOM",
				status: "enabled",
				type: "webFramework",
				versionPackages: ["react", "react-dom"],
			},
			{
				name: "TypeScript strict",
				status: "enabled",
				type: "language",
				versionPackages: ["typescript"],
			},
			{
				name: "Vite / React plugin",
				status: "enabled",
				type: "build",
				versionPackages: ["vite", "@vitejs/plugin-react"],
			},
			{
				name: "React Router",
				status: "enabled",
				type: "routing",
				versionPackages: ["react-router"],
			},
			{
				name: "Ant Design",
				status: "enabled",
				type: "componentLibrary",
				versionPackages: ["antd"],
			},
			{
				name: "Ant Design Plots",
				status: "enabled",
				type: "visualization",
				versionPackages: ["@ant-design/plots"],
			},
			{
				name: "TanStack Query",
				status: "enabled",
				type: "stateManagement",
				versionPackages: ["@tanstack/react-query"],
			},
			{
				name: "Zustand",
				status: "enabled",
				type: "stateManagement",
				versionPackages: ["zustand"],
			},
			{
				name: "i18next / react-i18next",
				status: "enabled",
				type: "i18n",
				versionPackages: ["i18next", "react-i18next"],
			},
		],
	},
	{
		key: "fake",
		items: [
			{
				name: "Typed src/api modules",
				status: "enabled",
				type: "apiClient",
			},
			{
				name: "vite-plugin-fake-server",
				status: "enabled",
				type: "mock",
				versionPackages: ["vite-plugin-fake-server"],
			},
			{
				name: "In-memory Fake domain state",
				status: "enabled",
				type: "stateManagement",
			},
			{
				name: "Vitest / Testing Library",
				status: "enabled",
				type: "testing",
				versionPackages: ["vitest", "@testing-library/react"],
			},
		],
	},
	{
		key: "platform",
		items: [
			{
				name: "Node.js LTS",
				status: "enabled",
				type: "runtime",
				workspaceTool: "node",
			},
			{
				name: "pnpm",
				status: "enabled",
				type: "packageManager",
				workspaceTool: "pnpm",
			},
			{ name: "GitLab CI/CD", status: "enabled", type: "ci" },
			{
				name: "ESLint / Prettier",
				status: "enabled",
				type: "build",
				versionPackages: ["eslint", "prettier"],
			},
			{
				name: "dependency-cruiser",
				status: "enabled",
				type: "build",
				versionPackages: ["dependency-cruiser"],
			},
			{
				name: "Renovate",
				status: "approved",
				type: "dependencyAutomation",
			},
		],
	},
];

const productionDependencies: ProductionDependency[] = Object.entries(
	__ADMIN_WEB_DEPENDENCIES__,
).map(([name, version]) => ({ name, version }));

function resolveTechnologyVersion(item: TechnologyItem) {
	if (item.workspaceTool) {
		return __WORKSPACE_TOOL_VERSIONS__[item.workspaceTool];
	}

	const versions = item.versionPackages?.map(
		(packageName) => __INSTALLED_DEPENDENCIES__[packageName],
	);
	return versions?.every(Boolean) ? versions.join(" / ") : undefined;
}

export function AboutSystemPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const formatPreferences = useLocalePreferences();
	const systemInfoQuery = useQuery({
		queryKey: [systemInfoQueryKey],
		queryFn: ({ signal }) => getSystemInfo(signal),
	});
	const dependencyColumns: TableColumnsType<ProductionDependency> = [
		{
			dataIndex: "name",
			key: "name",
			title: t("adminShell.about.nameColumn"),
		},
		{
			dataIndex: "version",
			key: "version",
			title: t("adminShell.about.versionColumn"),
			width: token.controlHeight * 4,
		},
	];
	const statusColor = (status: TechnologyStatus) =>
		status === "enabled"
			? "success"
			: status === "approved"
				? "processing"
				: "default";

	return (
		<Flex gap={token.marginLG} vertical>
			<Card
				data-testid="about-runtime-service"
				loading={systemInfoQuery.isPending}
				title={t("adminShell.about.runtime.title")}
			>
				{systemInfoQuery.isError ? (
					<Text type="secondary">
						{t("adminShell.about.runtime.loadError")}
					</Text>
				) : (
					<Flex gap={token.marginXL} wrap>
						<Text>
							{t("adminShell.about.runtime.service")}：
							<Text strong>{systemInfoQuery.data?.service ?? "—"}</Text>
						</Text>
						<Text>
							{t("adminShell.about.runtime.version")}：
							<Text strong>{systemInfoQuery.data?.version ?? "—"}</Text>
						</Text>
						<Text>
							{t("adminShell.about.runtime.startedAt")}：
							<Text strong>
								{systemInfoQuery.data
									? formatDateTime(
											systemInfoQuery.data.startedAt,
											formatPreferences,
										)
									: "—"}
							</Text>
						</Text>
					</Flex>
				)}
			</Card>
			<section aria-labelledby="about-technology-landscape-title">
				<Title id="about-technology-landscape-title" level={4}>
					{t("adminShell.about.stackTitle")}
				</Title>
				<Row gutter={[token.marginLG, token.marginLG]}>
					{technologyGroups.map((group) => (
						<Col key={group.key} xs={24} xl={8}>
							<Card
								data-testid={`about-technology-${group.key}`}
								style={{ height: "100%" }}
								title={t(`adminShell.about.groups.${group.key}`)}
							>
								<Flex vertical>
									{group.items.map((item, index) => {
										const version = resolveTechnologyVersion(item);

										return (
											<Flex
												data-testid={`about-technology-item-${item.name}`}
												key={item.name}
												vertical
											>
												<Flex
													align="flex-start"
													gap={token.margin}
													justify="space-between"
												>
													<Flex
														gap={token.marginXXS}
														style={{ minWidth: 0 }}
														vertical
													>
														<Text strong>{item.name}</Text>
														<Flex gap={token.marginXS} wrap>
															<Text type="secondary">
																{t("adminShell.about.typeLabel", {
																	value: t(
																		`adminShell.about.types.${item.type}`,
																	),
																})}
															</Text>
															{version || item.status === "reserved" ? (
																<Text type="secondary">
																	{t("adminShell.about.versionLabel", {
																		value:
																			version ??
																			t("adminShell.about.notSelected"),
																	})}
																</Text>
															) : null}
														</Flex>
													</Flex>
													<Tag color={statusColor(item.status)}>
														{t(`adminShell.about.status.${item.status}`)}
													</Tag>
												</Flex>
												{index < group.items.length - 1 ? (
													<Divider style={{ marginBlock: token.marginSM }} />
												) : null}
											</Flex>
										);
									})}
								</Flex>
							</Card>
						</Col>
					))}
				</Row>
			</section>

			<Card title={t("adminShell.about.dependenciesTitle")}>
				<Table<ProductionDependency>
					columns={dependencyColumns}
					data-testid="about-production-dependencies"
					dataSource={productionDependencies}
					pagination={false}
					rowKey="name"
					size="small"
				/>
			</Card>
		</Flex>
	);
}
