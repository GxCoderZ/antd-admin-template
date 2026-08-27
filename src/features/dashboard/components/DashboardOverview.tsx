import { InfoCircleOutlined } from "@ant-design/icons";
import {
	Badge,
	Card,
	Col,
	Empty,
	Flex,
	Row,
	Tag,
	theme,
	Tooltip,
	Typography,
} from "antd";
import { useTranslation } from "react-i18next";

import type { DashboardStatistics } from "#src/api/dashboard";
import type { PlatformSettings } from "#src/api/settings";
import type { SystemInfoData } from "#src/api/system";
import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import {
	platformPermissions,
	usePermissionChecker,
} from "../../../app/permissions";
import { ChartCard, ChartCardField } from "./ChartCard";

const { Text, Title } = Typography;

export function DashboardSystemStatus({
	settings,
	system,
}: {
	settings: PlatformSettings;
	system: SystemInfoData;
}) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const formatPreferences = useLocalePreferences();
	const { security } = settings;
	const items = [
		{
			key: "runtime",
			label: t("adminShell.dashboard.runningStatus"),
			value: (
				<Badge status="success" text={t("adminShell.dashboard.running")} />
			),
		},
		{
			key: "maintenance",
			label: t("adminShell.dashboard.maintenanceStatus"),
			value: (
				<Badge
					status={security.maintenanceEnabled ? "warning" : "default"}
					text={t(
						`adminShell.dashboard.${security.maintenanceEnabled ? "maintenanceOn" : "maintenanceOff"}`,
					)}
				/>
			),
		},
		{
			key: "login",
			label: t("adminShell.dashboard.loginStatus"),
			value: (
				<Badge
					status={
						security.loginAccess === "all"
							? "success"
							: security.loginAccess === "adminOnly"
								? "warning"
								: "error"
					}
					text={t(
						`adminShell.platformSettings.loginAccess.${security.loginAccess}`,
					)}
				/>
			),
		},
		{
			key: "version",
			label: t("adminShell.dashboard.version"),
			value: (
				<Flex vertical gap={token.marginXXS}>
					<Text>{system.version}</Text>
					<Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
						{t("adminShell.dashboard.updatedAt", {
							time: formatDateTime(system.builtAt, formatPreferences, {
								timeStyle: "short",
							}),
						})}
					</Text>
				</Flex>
			),
		},
	];
	return (
		<Card
			role="region"
			aria-labelledby="dashboard-system-title"
			variant="borderless"
			title={
				<Title level={5} id="dashboard-system-title" style={{ margin: 0 }}>
					{t("adminShell.dashboard.systemTitle")}
				</Title>
			}
			extra={<Tag>{t("adminShell.dashboard.preview")}</Tag>}
		>
			<Row gutter={[token.marginLG, token.margin]}>
				{items.map((item) => (
					<Col xs={12} xl={6} key={item.key}>
						<Flex
							vertical
							gap={token.marginXS}
							style={{ overflowWrap: "anywhere" }}
						>
							<Text type="secondary">{item.label}</Text>
							{item.value}
						</Flex>
					</Col>
				))}
			</Row>
		</Card>
	);
}

export function DashboardOverview({
	statistics,
}: {
	statistics: DashboardStatistics | undefined;
}) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { language, timeZone } = useLocalePreferences();
	const can = usePermissionChecker();
	if (
		!statistics ||
		![
			platformPermissions.usersRead,
			platformPermissions.rolesManage,
			platformPermissions.logsRead,
		].some(can)
	) {
		return (
			<Empty
				image={Empty.PRESENTED_IMAGE_SIMPLE}
				description={t("adminShell.dashboard.noPermissionData")}
			/>
		);
	}
	const metrics = [
		{
			key: "users",
			label: t("adminShell.dashboard.userCount"),
			value: statistics.userCount,
			summary: t("adminShell.dashboard.userSummary"),
			footerLabel: t("adminShell.dashboard.metricScope"),
			footerValue: t("adminShell.dashboard.allStatuses"),
			permission: platformPermissions.usersRead,
		},
		{
			key: "roles",
			label: t("adminShell.dashboard.roleCount"),
			value: statistics.roleCount,
			summary: t("adminShell.dashboard.roleSummary"),
			footerLabel: t("adminShell.dashboard.metricScope"),
			footerValue: t("adminShell.dashboard.allStatuses"),
			permission: platformPermissions.rolesManage,
		},
		{
			key: "permissions",
			label: t("adminShell.dashboard.permissionCount"),
			value: statistics.permissionCount,
			summary: t("adminShell.dashboard.permissionSummary"),
			footerLabel: t("adminShell.dashboard.metricScope"),
			footerValue: t("adminShell.dashboard.allNodes"),
			permission: platformPermissions.rolesManage,
		},
		{
			key: "logins",
			label: t("adminShell.dashboard.todayLoginCount"),
			value: statistics.todayLoginCount,
			summary: t("adminShell.dashboard.loginSummary"),
			hint: t("adminShell.dashboard.todayLoginHint", { timeZone }),
			footerLabel: t("adminShell.dashboard.todayAbnormalCount"),
			footerValue: new Intl.NumberFormat(language).format(
				statistics.todayAbnormalLoginCount,
			),
			permission: platformPermissions.logsRead,
		},
	].filter((metric) => can(metric.permission));
	return (
		<Row gutter={[token.marginLG, token.marginLG]}>
			{metrics.map((metric) => (
				<Col xs={24} sm={12} md={12} lg={12} xl={6} key={metric.key}>
					<ChartCard
						data-testid={`dashboard-stat-${metric.key}`}
						variant="borderless"
						title={metric.label}
						action={
							<Tooltip
								title={metric.hint ?? metric.summary}
								trigger={["hover", "focus"]}
							>
								<InfoCircleOutlined tabIndex={0} aria-label={metric.label} />
							</Tooltip>
						}
						total={new Intl.NumberFormat(language).format(metric.value)}
						footer={
							<ChartCardField
								label={metric.footerLabel}
								value={metric.footerValue}
							/>
						}
						contentHeight={46}
						style={{ height: "100%" }}
					>
						{metric.summary}
					</ChartCard>
				</Col>
			))}
		</Row>
	);
}
