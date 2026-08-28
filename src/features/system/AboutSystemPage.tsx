import {
	Card,
	Col,
	Descriptions,
	Divider,
	Flex,
	Row,
	Table,
	Tag,
	theme,
	Typography,
} from "antd";
import type { DescriptionsProps, TableColumnsType } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { TableActionMenu } from "../../app/TableActionButton";
import { useTableActions } from "../../app/tableActions";
import { getSystemInfo, systemInfoQueryKey } from "#src/api/system";

const { Text, Title } = Typography;

type TechnologyGroupKey = "fake" | "frontend" | "platform";
type TechnologyStatus = "approved" | "enabled" | "reserved";
type TechnologyType =
	| "apiClient"
	| "architecture"
	| "build"
	| "ci"
	| "componentLibrary"
	| "deployment"
	| "dependencyAutomation"
	| "i18n"
	| "language"
	| "mock"
	| "packageManager"
	| "routing"
	| "runtime"
	| "serverState"
	| "testing"
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
				name: "TanStack Query",
				status: "enabled",
				type: "serverState",
				versionPackages: ["@tanstack/react-query"],
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
				type: "architecture",
			},
			{
				name: "Vitest / Testing Library",
				status: "enabled",
				type: "testing",
				versionPackages: ["vitest", "@testing-library/react"],
			},
			{
				name: "Playwright",
				status: "enabled",
				type: "testing",
				versionPackages: ["@playwright/test"],
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
				name: "Cloudflare Pages",
				status: "enabled",
				type: "deployment",
			},
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
				name: "Knip",
				status: "enabled",
				type: "build",
				versionPackages: ["knip"],
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
)
	.map(([name, version]) => ({ name, version }))
	.sort((left, right) => left.name.localeCompare(right.name));

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
	const { copyTableValue, messageContextHolder } = useTableActions();
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
		{
			key: "actions",
			render: (_: unknown, dependency: ProductionDependency) => (
				<TableActionMenu
					items={[
						{
							key: "copyPackageName",
							label: t("adminShell.tableActions.copyPackageName"),
							onClick: () => void copyTableValue(dependency.name),
						},
						{
							key: "copyVersion",
							label: t("adminShell.tableActions.copyVersion"),
							onClick: () => void copyTableValue(dependency.version),
						},
					]}
					label={t("adminShell.tableActions.more")}
				/>
			),
			title: t("adminShell.tableActions.actions"),
			width: token.controlHeight * 3,
		},
	];
	const statusColor = (status: TechnologyStatus) =>
		status === "enabled"
			? "success"
			: status === "approved"
				? "processing"
				: "default";
	const systemInfoItems: DescriptionsProps["items"] = systemInfoQuery.data
		? [
				{
					key: "service",
					label: t("adminShell.about.runtime.service"),
					children: systemInfoQuery.data.service,
				},
				{
					key: "version",
					label: t("adminShell.about.runtime.version"),
					children: systemInfoQuery.data.version,
				},
				{
					key: "environment",
					label: t("adminShell.about.runtime.environment"),
					children: t(
						`adminShell.about.runtime.environments.${systemInfoQuery.data.environment}`,
					),
				},
				{
					key: "commit",
					label: t("adminShell.about.runtime.commit"),
					children:
						systemInfoQuery.data.commitSha === "local"
							? t("adminShell.about.runtime.localCommit")
							: systemInfoQuery.data.commitSha.slice(0, 8),
				},
				{
					key: "builtAt",
					label: t("adminShell.about.runtime.builtAt"),
					span: "filled",
					children: formatDateTime(
						systemInfoQuery.data.builtAt,
						formatPreferences,
					),
				},
			]
		: [];

	return (
		<Flex gap={token.marginLG} vertical>
			{messageContextHolder}
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
					<Descriptions
						column={{ xs: 1, sm: 2, lg: 3 }}
						items={systemInfoItems}
						size="small"
					/>
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
					size="middle"
				/>
			</Card>
		</Flex>
	);
}
