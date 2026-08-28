import {
	ArrowRightOutlined,
	CheckCircleOutlined,
	NotificationOutlined,
	ToolOutlined,
	UserOutlined,
	WarningOutlined,
} from "@ant-design/icons";
import {
	Avatar,
	Badge,
	Button,
	Card,
	Col,
	Empty,
	Flex,
	Row,
	Tabs,
	theme,
	Tooltip,
	Typography,
} from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { DashboardStatistics } from "#src/api/dashboard";
import type { PlatformSettings } from "#src/api/settings";
import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import {
	platformPermissions,
	usePermissionChecker,
} from "../../../app/permissions";

const { Text, Title } = Typography;

function DashboardLink({ label, path }: { label: string; path: string }) {
	const navigate = useNavigate();
	return (
		<Tooltip title={label}>
			<Button
				type="text"
				aria-label={label}
				icon={<ArrowRightOutlined />}
				onClick={() => void navigate(path)}
			/>
		</Tooltip>
	);
}

function ActivityRow({
	children,
	date,
	result,
}: {
	children: ReactNode;
	date: string;
	result?: "success" | "failure" | "limited" | "invalid";
}) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const preferences = useLocalePreferences();
	return (
		<Flex
			component="li"
			align="start"
			gap={token.margin}
			style={{
				padding: `${token.padding}px ${token.paddingLG}px`,
				borderBottom: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
			}}
		>
			{result && <Avatar icon={<UserOutlined />} style={{ flexShrink: 0 }} />}
			<Flex vertical gap={token.marginXXS} style={{ flex: 1, minWidth: 0 }}>
				<Flex align="start" gap={token.marginSM} justify="space-between">
					<Text style={{ minWidth: 0, overflowWrap: "anywhere" }}>
						{children}
					</Text>
					{result && (
						<Badge
							style={{ flexShrink: 0 }}
							status={
								result === "success"
									? "success"
									: result === "limited"
										? "warning"
										: "error"
							}
							text={t(`adminShell.logs.common.results.${result}`)}
						/>
					)}
				</Flex>
				<Text style={{ color: token.colorTextDisabled }}>
					{formatDateTime(date, preferences, { timeStyle: "short" })}
				</Text>
			</Flex>
		</Flex>
	);
}

function DashboardRecentActivity({
	statistics,
}: {
	statistics: DashboardStatistics;
}) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const listStyle = { listStyle: "none", margin: 0, padding: 0 };
	return (
		<Card
			role="region"
			aria-label={t("adminShell.dashboard.recentActivityTitle")}
			variant="borderless"
			styles={{ body: { padding: 0 } }}
		>
			<Tabs
				animated={{ inkBar: true, tabPane: false }}
				size="large"
				styles={{ header: { margin: 0, paddingInline: token.paddingLG } }}
				items={[
					{
						key: "logins",
						label: t("adminShell.dashboard.recentLogins"),
						children: (
							<>
								{statistics.recentLogins.length === 0 ? (
									<Empty
										image={Empty.PRESENTED_IMAGE_SIMPLE}
										description={t("adminShell.dashboard.emptyLogins")}
									/>
								) : (
									<Flex component="ul" vertical style={listStyle}>
										{statistics.recentLogins.map((item) => (
											<ActivityRow
												key={item.id}
												date={item.createdAt}
												result={item.result}
											>
												{item.identifier}
											</ActivityRow>
										))}
									</Flex>
								)}
								<Flex
									justify="end"
									style={{
										padding: `${token.paddingSM}px ${token.paddingLG}px`,
									}}
								>
									<DashboardLink
										label={t("adminShell.dashboard.viewLogins")}
										path="/operations/login-logs"
									/>
								</Flex>
							</>
						),
					},
					{
						key: "operations",
						label: t("adminShell.dashboard.recentOperations"),
						children: (
							<>
								{statistics.recentActivities.length === 0 ? (
									<Empty
										image={Empty.PRESENTED_IMAGE_SIMPLE}
										description={t("adminShell.dashboard.emptyOperations")}
									/>
								) : (
									<Flex component="ul" vertical style={listStyle}>
										{statistics.recentActivities.map((item) => (
											<ActivityRow
												key={item.id}
												date={item.createdAt}
												result={item.result}
											>
												{t("adminShell.dashboard.activitySummary", {
													actor: item.actor,
													action: t(
														`adminShell.dashboard.activityActions.${item.action}`,
														{ defaultValue: item.action },
													),
													target: item.target,
												})}
											</ActivityRow>
										))}
									</Flex>
								)}
								<Flex
									justify="end"
									style={{
										padding: `${token.paddingSM}px ${token.paddingLG}px`,
									}}
								>
									<DashboardLink
										label={t("adminShell.dashboard.viewOperations")}
										path="/operations/audit-logs"
									/>
								</Flex>
							</>
						),
					},
				]}
			/>
		</Card>
	);
}

function ReminderRow({
	title,
	description,
	icon,
	action,
}: {
	title: string;
	description: ReactNode;
	icon: ReactNode;
	action?: ReactNode;
}) {
	const { token } = theme.useToken();
	return (
		<Flex
			align="start"
			gap={token.marginSM}
			style={{
				padding: `${token.padding}px ${token.paddingLG}px`,
				borderBottom: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
			}}
		>
			<span
				style={{ fontSize: token.fontSizeLG, lineHeight: token.lineHeight }}
			>
				{icon}
			</span>
			<Flex
				vertical
				gap={token.marginXXS}
				style={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}
			>
				<Text>{title}</Text>
				<div style={{ color: token.colorTextSecondary }}>{description}</div>
			</Flex>
			{action}
		</Flex>
	);
}

export function DashboardActivityPanels({
	statistics,
	settings,
}: {
	statistics: DashboardStatistics | undefined;
	settings: PlatformSettings;
}) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const preferences = useLocalePreferences();
	const can = usePermissionChecker();
	const canReadLogs = can(platformPermissions.logsRead);
	const canReadAnnouncements = can(platformPermissions.announcementsRead);
	const { security } = settings;
	return (
		<Row gutter={[token.marginLG, token.marginLG]}>
			{canReadLogs && statistics && (
				<Col xs={24} xl={16}>
					<DashboardRecentActivity statistics={statistics} />
				</Col>
			)}
			<Col xs={24} xl={canReadLogs && statistics ? 8 : 24}>
				<Flex vertical gap={token.marginLG}>
					{canReadAnnouncements && statistics && (
						<Card
							role="region"
							aria-labelledby="dashboard-announcements-title"
							variant="borderless"
							styles={{ body: { padding: 0 } }}
							title={
								<Title
									level={5}
									id="dashboard-announcements-title"
									style={{ margin: 0 }}
								>
									{t("adminShell.dashboard.latestAnnouncements")}
								</Title>
							}
							extra={
								<DashboardLink
									label={t("adminShell.dashboard.viewAnnouncements")}
									path="/system/announcements"
								/>
							}
						>
							{!settings.notifications.announcementsEnabled ? (
								<Text
									type="secondary"
									style={{ display: "block", padding: token.paddingLG }}
								>
									{t("adminShell.dashboard.announcementsDisabled")}
								</Text>
							) : statistics.latestAnnouncements.length === 0 ? (
								<Empty
									image={Empty.PRESENTED_IMAGE_SIMPLE}
									description={t("adminShell.dashboard.emptyAnnouncements")}
								/>
							) : (
								<Flex
									component="ul"
									vertical
									style={{ listStyle: "none", margin: 0, padding: 0 }}
								>
									{statistics.latestAnnouncements.map((item) => (
										<ActivityRow key={item.id} date={item.updatedAt}>
											{item.title}
										</ActivityRow>
									))}
								</Flex>
							)}
						</Card>
					)}
					<Card
						role="region"
						aria-labelledby="dashboard-reminders-title"
						variant="borderless"
						styles={{ body: { padding: 0 } }}
						title={
							<Title
								level={5}
								id="dashboard-reminders-title"
								style={{ margin: 0 }}
							>
								{t("adminShell.dashboard.remindersTitle")}
							</Title>
						}
					>
						{canReadLogs && statistics && (
							<ReminderRow
								title={t("adminShell.dashboard.abnormalLogins")}
								description={t(
									`adminShell.dashboard.${statistics.todayAbnormalLoginCount > 0 ? "abnormalLoginCount" : "noAbnormalLogins"}`,
									{ count: statistics.todayAbnormalLoginCount },
								)}
								icon={
									statistics.todayAbnormalLoginCount > 0 ? (
										<WarningOutlined style={{ color: token.colorWarning }} />
									) : (
										<CheckCircleOutlined
											style={{ color: token.colorSuccess }}
										/>
									)
								}
								action={
									<DashboardLink
										label={t("adminShell.dashboard.viewLogins")}
										path="/operations/login-logs"
									/>
								}
							/>
						)}
						{canReadAnnouncements &&
							can(platformPermissions.announcementsManage) &&
							statistics && (
								<ReminderRow
									title={t("adminShell.dashboard.draftAnnouncements")}
									description={t(
										`adminShell.dashboard.${statistics.draftAnnouncementCount > 0 ? "draftAnnouncementCount" : "noDraftAnnouncements"}`,
										{ count: statistics.draftAnnouncementCount },
									)}
									icon={
										<NotificationOutlined
											style={{ color: token.colorTextSecondary }}
										/>
									}
									action={
										<DashboardLink
											label={t("adminShell.dashboard.viewAnnouncements")}
											path="/system/announcements"
										/>
									}
								/>
							)}
						<ReminderRow
							title={t("adminShell.dashboard.maintenanceNotice")}
							icon={
								<ToolOutlined
									style={{
										color: security.maintenanceEnabled
											? token.colorWarning
											: token.colorTextSecondary,
									}}
								/>
							}
							description={
								security.maintenanceEnabled ? (
									<Flex vertical gap={token.marginXXS}>
										<span>{security.maintenanceMessage}</span>
										{security.maintenanceEndsAt && (
											<span>
												{t("adminShell.dashboard.maintenanceEndsAt", {
													time: formatDateTime(
														security.maintenanceEndsAt,
														preferences,
														{ timeStyle: "short" },
													),
												})}
											</span>
										)}
									</Flex>
								) : (
									t("adminShell.dashboard.noMaintenance")
								)
							}
							action={
								can(platformPermissions.settingsManage) ? (
									<DashboardLink
										label={t("adminShell.dashboard.viewMaintenance")}
										path="/system/settings?section=security"
									/>
								) : undefined
							}
						/>
					</Card>
				</Flex>
			</Col>
		</Row>
	);
}
