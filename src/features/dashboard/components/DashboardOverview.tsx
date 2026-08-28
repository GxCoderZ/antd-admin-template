import { InfoCircleOutlined } from "@ant-design/icons";
import { Col, Empty, Row, theme, Tooltip } from "antd";
import { useTranslation } from "react-i18next";

import type { DashboardStatistics } from "#src/api/dashboard";
import { useLocalePreferences } from "../../../app/localePreferences";
import {
	platformPermissions,
	usePermissionChecker,
} from "../../../app/permissions";
import { ChartCard, ChartCardField } from "./ChartCard";
import styles from "./ChartCard.module.css";
import { Trend } from "./Trend";

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
			comparison: statistics.metricComparisons.users,
			footerLabel: t("adminShell.dashboard.activeUserCount"),
			footerValue: statistics.activeUserCount,
			permission: platformPermissions.usersRead,
		},
		{
			key: "roles",
			label: t("adminShell.dashboard.roleCount"),
			value: statistics.roleCount,
			summary: t("adminShell.dashboard.roleSummary"),
			comparison: statistics.metricComparisons.roles,
			footerLabel: t("adminShell.dashboard.builtInRoleCount"),
			footerValue: statistics.builtInRoleCount,
			permission: platformPermissions.rolesManage,
		},
		{
			key: "permissions",
			label: t("adminShell.dashboard.permissionCount"),
			value: statistics.permissionCount,
			summary: t("adminShell.dashboard.permissionSummary"),
			comparison: statistics.metricComparisons.permissions,
			footerLabel: t("adminShell.dashboard.assignedPermissionCount"),
			footerValue: statistics.assignedPermissionCount,
			permission: platformPermissions.rolesManage,
		},
		{
			key: "logins",
			label: t("adminShell.dashboard.todayLoginCount"),
			value: statistics.todayLoginCount,
			summary: t("adminShell.dashboard.loginSummary"),
			comparison: statistics.metricComparisons.logins,
			hint: t("adminShell.dashboard.todayLoginHint", { timeZone }),
			footerLabel: t("adminShell.dashboard.todayAbnormalCount"),
			footerValue: statistics.todayAbnormalLoginCount,
			permission: platformPermissions.logsRead,
		},
	].filter((metric) => can(metric.permission));
	const formatPercent = new Intl.NumberFormat(language, {
		style: "percent",
		maximumFractionDigits: 1,
	});
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
								value={new Intl.NumberFormat(language).format(
									metric.footerValue,
								)}
							/>
						}
						contentHeight={46}
						style={{ height: "100%" }}
					>
						<Trend
							flag={metric.comparison.week >= 0 ? "up" : "down"}
							style={{ marginRight: 16 }}
						>
							{t("adminShell.dashboard.weekComparison")}
							<span className={styles.trendText}>
								{formatPercent.format(Math.abs(metric.comparison.week))}
							</span>
						</Trend>
						<Trend flag={metric.comparison.day >= 0 ? "up" : "down"}>
							{t("adminShell.dashboard.dayComparison")}
							<span className={styles.trendText}>
								{formatPercent.format(Math.abs(metric.comparison.day))}
							</span>
						</Trend>
					</ChartCard>
				</Col>
			))}
		</Row>
	);
}
