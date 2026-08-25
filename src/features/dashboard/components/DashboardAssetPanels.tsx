import {
	ApartmentOutlined,
	AuditOutlined,
	ControlOutlined,
	FileOutlined,
	NotificationOutlined,
	TeamOutlined,
	UserOutlined,
} from "@ant-design/icons";
import {
	Badge,
	Button,
	Card,
	Checkbox,
	Col,
	Flex,
	Progress,
	Row,
	Space,
	Tag,
	theme,
	Timeline,
	Typography,
} from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import { platformPermissions, usePermission } from "../../../app/permissions";
import type {
	DashboardRecentActivity,
	DashboardStatistics,
	DashboardTodo,
} from "#src/api/dashboard";

const { Text } = Typography;

interface DashboardAssetPanelsProps {
	completingTodoId: string | undefined;
	loading: boolean;
	onCompleteTodo: (todo: DashboardTodo) => void;
	statistics: DashboardStatistics | undefined;
}

interface QuickEntry {
	icon: ReactNode;
	key: string;
	path: string;
	title: string;
	visible: boolean;
}

function ActivityItem({ activity }: { activity: DashboardRecentActivity }) {
	const { t } = useTranslation();
	const formatPreferences = useLocalePreferences();
	return (
		<Flex gap="small" vertical>
			<Text>
				{t("adminShell.analysis.activitySummary", {
					action: t(`adminShell.analysis.activityActions.${activity.action}`, {
						defaultValue: activity.action,
					}),
					actor: activity.actor,
					target: activity.target,
				})}
			</Text>
			<Space size="small" wrap>
				<Badge status={activity.result === "success" ? "success" : "error"} />
				<Text type="secondary">
					{formatDateTime(activity.createdAt, formatPreferences)}
				</Text>
			</Space>
		</Flex>
	);
}

export function DashboardAssetPanels({
	completingTodoId,
	loading,
	onCompleteTodo,
	statistics,
}: DashboardAssetPanelsProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const navigate = useNavigate();
	const canReadUsers = usePermission(platformPermissions.usersRead);
	const canReadRoles = usePermission(platformPermissions.rolesManage);
	const canReadLogs = usePermission(platformPermissions.logsRead);
	const canReadAnnouncements = usePermission(platformPermissions.announcementsRead);
	const canManageSettings = usePermission(platformPermissions.settingsManage);
	const formatPreferences = useLocalePreferences();
	const quickEntries: QuickEntry[] = [
		{ icon: <UserOutlined aria-hidden />, key: "users", path: "/organization/users", title: t("adminShell.analysis.quickEntries.users"), visible: canReadUsers },
		{ icon: <TeamOutlined aria-hidden />, key: "roles", path: "/access/roles", title: t("adminShell.analysis.quickEntries.roles"), visible: canReadRoles },
		{ icon: <NotificationOutlined aria-hidden />, key: "announcements", path: "/system/announcements", title: t("adminShell.analysis.quickEntries.announcements"), visible: canReadAnnouncements },
		{ icon: <AuditOutlined aria-hidden />, key: "audit", path: "/operations/audit-logs", title: t("adminShell.analysis.quickEntries.audit"), visible: canReadLogs },
		{ icon: <FileOutlined aria-hidden />, key: "files", path: "/examples/files", title: t("adminShell.analysis.quickEntries.files"), visible: true },
		{ icon: <ApartmentOutlined aria-hidden />, key: "categories", path: "/examples/tree-category", title: t("adminShell.analysis.quickEntries.categories"), visible: true },
		{ icon: <ControlOutlined aria-hidden />, key: "settings", path: "/system/settings", title: t("adminShell.analysis.quickEntries.settings"), visible: canManageSettings },
	].filter((entry) => entry.visible);

	return (
		<>
			<Row gutter={[token.marginLG, token.marginLG]}>
				<Col lg={16} xs={24}>
					<Card loading={loading} style={{ height: "100%" }} title={t("adminShell.analysis.trendTitle")}>
						<Flex vertical>
							{(statistics?.loginTrend ?? []).map((point) => {
								const total = point.success + point.failure;
								const percent = total === 0 ? 0 : Math.round((point.success / total) * 100);
								return (
									<Flex
										align="center"
										gap={token.margin}
										key={point.date}
										style={{ borderBottom: `${token.lineWidth}px solid ${token.colorBorderSecondary}`, paddingBlock: token.paddingSM }}
									>
										<Text style={{ flex: "0 0 64px" }}>{point.date.slice(5)}</Text>
										<Progress percent={percent} showInfo={false} style={{ flex: "1 1 auto" }} />
										<Text type="secondary">
											{t("adminShell.analysis.trendValue", { failure: point.failure, success: point.success })}
										</Text>
									</Flex>
								);
							})}
						</Flex>
					</Card>
				</Col>
				<Col lg={8} xs={24}>
					<Card loading={loading} style={{ height: "100%" }} title={t("adminShell.analysis.quickEntryTitle")}>
						<Row gutter={[token.marginXS, token.marginXS]}>
							{quickEntries.map((entry) => (
								<Col key={entry.key} span={8}>
									<Button
										block
										onClick={() => void navigate(entry.path)}
										style={{ height: token.controlHeightLG * 2 }}
										type="text"
									>
										<Flex align="center" gap={token.marginXXS} vertical>
											<span style={{ color: token.colorPrimary, fontSize: token.fontSizeLG }}>{entry.icon}</span>
											<Text>{entry.title}</Text>
										</Flex>
									</Button>
								</Col>
							))}
						</Row>
					</Card>
				</Col>
			</Row>
			<Row gutter={[token.marginLG, token.marginLG]}>
				<Col lg={12} xs={24}>
					<Card loading={loading} style={{ height: "100%" }} title={t("adminShell.analysis.todoTitle")}>
						<Flex vertical>
							{(statistics?.todos ?? []).map((todo) => (
								<Flex
									align="center"
									gap={token.margin}
									justify="space-between"
									key={todo.id}
									style={{ borderBottom: `${token.lineWidth}px solid ${token.colorBorderSecondary}`, paddingBlock: token.paddingSM }}
								>
									<Flex gap="small" vertical>
										<Checkbox
											checked={todo.status === "completed"}
											disabled={todo.status === "completed" || completingTodoId === todo.id}
											onChange={() => onCompleteTodo(todo)}
										>
											{todo.title}
										</Checkbox>
										<Text type="secondary">
											{t("adminShell.analysis.dueAt", { time: formatDateTime(todo.dueAt, formatPreferences) })}
										</Text>
									</Flex>
									<Tag color={todo.priority === "high" ? "error" : todo.priority === "medium" ? "warning" : "default"}>
										{t(`adminShell.analysis.priorities.${todo.priority}`)}
									</Tag>
								</Flex>
							))}
						</Flex>
					</Card>
				</Col>
				<Col lg={12} xs={24}>
					<Card loading={loading} style={{ height: "100%" }} title={t("adminShell.analysis.recentActivityTitle")}>
						<Timeline
							items={(statistics?.recentActivities ?? []).map((activity) => ({
								children: <ActivityItem activity={activity} />,
								color: activity.result === "success" ? "green" : "red",
								key: activity.id,
							}))}
						/>
					</Card>
				</Col>
			</Row>
		</>
	);
}
