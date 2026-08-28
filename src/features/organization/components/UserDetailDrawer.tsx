import { Alert, Badge, Drawer, Skeleton, Space, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import {
	RecordDetails,
	type RecordDetailSection,
} from "../../../app/RecordDetails";
import type { PlatformUser } from "#src/api/users";
import { getProblemFallback } from "../userProblems";

const { Text } = Typography;

interface UserDetailDrawerProps {
	error: unknown;
	loading: boolean;
	onClose: () => void;
	open: boolean;
	user: PlatformUser | null;
}

export function UserDetailDrawer({
	error,
	loading,
	onClose,
	open,
	user,
}: UserDetailDrawerProps) {
	const { t } = useTranslation();
	const formatPreferences = useLocalePreferences();
	const missingValue = <Text type="secondary">-</Text>;
	const sections: RecordDetailSection[] = user
		? [
				{
					key: "basic",
					title: t("adminShell.recordDetails.sections.basic"),
					items: [
						{
							children: user.username,
							label: t("adminShell.users.columns.username"),
						},
						{
							children: user.displayName,
							label: t("adminShell.users.columns.displayName"),
						},
						{
							children: user.email,
							label: t("adminShell.users.columns.email"),
						},
						{
							children: user.phone || missingValue,
							label: t("adminShell.users.columns.phone"),
						},
						{
							children: (
								<Badge
									status={
										user.status === "active"
											? "success"
											: user.status === "locked"
												? "error"
												: "default"
									}
									text={t(`adminShell.users.statuses.${user.status}`)}
								/>
							),
							label: t("adminShell.users.columns.status"),
						},
					],
				},
				{
					key: "access",
					title: t("adminShell.recordDetails.sections.access"),
					items: [
						{
							children: user.departmentName ?? "-",
							label: t("adminShell.users.columns.department"),
						},
						{
							children: user.jobTitle || missingValue,
							label: t("adminShell.users.columns.jobTitle"),
						},
						{
							children:
								user.roles.length > 0 ? (
									<Space wrap>
										{user.roles.map((role) => (
											<Tag key={role.id}>{role.displayName}</Tag>
										))}
									</Space>
								) : (
									missingValue
								),
							label: t("adminShell.users.columns.roles"),
						},
						{
							children: (
								<Tag>
									{t(`adminShell.users.authSources.${user.authSource}`)}
								</Tag>
							),
							label: t("adminShell.users.columns.authSource"),
						},
						{
							children: t(
								user.mfaEnabled
									? "adminShell.users.columnValues.enabled"
									: "adminShell.users.columnValues.disabled",
							),
							label: t("adminShell.users.columns.mfaEnabled"),
						},
						{
							children: t(
								user.mustChangePassword
									? "adminShell.users.columnValues.changeRequired"
									: "adminShell.users.columnValues.normal",
							),
							label: t("adminShell.users.columns.mustChangePassword"),
						},
					],
				},
				{
					key: "activity",
					title: t("adminShell.recordDetails.sections.activity"),
					items: [
						{
							children: user.lastLoginAt
								? formatDateTime(user.lastLoginAt, formatPreferences)
								: t("adminShell.users.columnValues.never"),
							label: t("adminShell.users.columns.lastLoginAt"),
						},
						{
							children: user.lastLoginIp ? (
								<Text code>{user.lastLoginIp}</Text>
							) : (
								missingValue
							),
							label: t("adminShell.users.columns.lastLoginIp"),
						},
						{
							children: formatDateTime(user.createdAt, formatPreferences),
							label: t("adminShell.users.columns.createdAt"),
						},
						{
							children: formatDateTime(user.updatedAt, formatPreferences),
							label: t("adminShell.users.columns.updatedAt"),
						},
						{
							children: <Text code>{user.id}</Text>,
							label: t("adminShell.users.columns.id"),
						},
						{
							children: user.departmentId ?? missingValue,
							label: t("adminShell.recordDetails.departmentId"),
						},
						{
							children: user.version ?? missingValue,
							label: t("adminShell.recordDetails.version"),
						},
					],
				},
			]
		: [];

	return (
		<Drawer
			destroyOnHidden
			onClose={onClose}
			open={open}
			size="min(560px, 100vw)"
			title={t("adminShell.users.detail.title", {
				name: user?.displayName ?? user?.username ?? "",
			})}
		>
			{error ? (
				<Alert
					description={getProblemFallback(
						error,
						t("adminShell.users.errors.fallback"),
					)}
					showIcon
					title={t("adminShell.users.detail.loadError")}
					type="error"
				/>
			) : loading ? (
				<Skeleton active paragraph={{ rows: 8 }} />
			) : (
				<RecordDetails sections={sections} />
			)}
		</Drawer>
	);
}
