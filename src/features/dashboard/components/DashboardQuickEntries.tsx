import { Card, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
	platformPermissions,
	usePermissionChecker,
} from "../../../app/permissions";
import styles from "./DashboardQuickEntries.module.css";

export function DashboardQuickEntries() {
	const { t } = useTranslation();
	const can = usePermissionChecker();
	const entries = [
		{
			path: "/organization/users",
			label: t("adminShell.navigation.users"),
			permission: platformPermissions.usersRead,
		},
		{
			path: "/access/roles",
			label: t("adminShell.navigation.roles"),
			permission: platformPermissions.rolesManage,
		},
		{
			path: "/system/dictionaries",
			label: t("adminShell.navigation.dictionaries"),
			permission: platformPermissions.dictionariesManage,
		},
		{
			path: "/system/settings",
			label: t("adminShell.navigation.settings"),
			permission: platformPermissions.settingsManage,
		},
		{
			path: "/operations/audit-logs",
			label: t("adminShell.dashboard.operationLogs"),
			permission: platformPermissions.logsRead,
		},
	].filter((entry) => can(entry.permission));
	if (entries.length === 0) return null;
	return (
		<Card
			role="region"
			aria-labelledby="dashboard-entries-title"
			variant="borderless"
			title={
				<Typography.Title
					level={5}
					id="dashboard-entries-title"
					style={{ margin: 0 }}
				>
					{t("adminShell.dashboard.quickEntryTitle")}
				</Typography.Title>
			}
		>
			<div className={styles.linkGroup}>
				{entries.map((entry) => (
					<Link key={entry.path} to={entry.path}>
						{entry.label}
					</Link>
				))}
			</div>
		</Card>
	);
}
