import {
	DeleteOutlined,
	EyeOutlined,
	KeyOutlined,
	LogoutOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import { Badge, Space, Tag, theme, Tooltip, Typography } from "antd";
import type { TableProps } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import { PlatformUserAvatar } from "../../../app/PlatformUserAvatar";
import {
	TableActionButton,
	TableActionMenu,
} from "../../../app/TableActionButton";
import type { ListPlatformUsersInput, PlatformUser } from "#src/api/users";
import {
	type UserTableState,
	userColumnWidthMultipliers,
} from "../userTableTypes";

const { Text } = Typography;
const userStatusBadgeByStatus: Record<
	PlatformUser["status"],
	"default" | "error" | "success"
> = {
	active: "success",
	disabled: "default",
	locked: "error",
};
const userAuthSourceTagColor: Record<
	PlatformUser["authSource"],
	"blue" | "cyan" | "default"
> = {
	ldap: "cyan",
	local: "default",
	sso: "blue",
};

interface UseUserTableColumnsInput {
	canManageUsers: boolean;
	currentUserId: string | undefined;
	onDelete: (user: PlatformUser) => void;
	onEdit: (user: PlatformUser) => void;
	onForceLogout: (user: PlatformUser) => void;
	onManageRoles: (user: PlatformUser) => void;
	onResetPassword: (user: PlatformUser) => void;
	onView: (user: PlatformUser) => void;
	tableState: UserTableState;
}

export function useUserTableColumns({
	canManageUsers,
	currentUserId,
	onDelete,
	onEdit,
	onForceLogout,
	onManageRoles,
	onResetPassword,
	onView,
	tableState,
}: UseUserTableColumnsInput) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const formatPreferences = useLocalePreferences();

	return useMemo<NonNullable<TableProps<PlatformUser>["columns"]>>(() => {
		const sortOrder = (column: ListPlatformUsersInput["sort"]) =>
			tableState.sort === column && tableState.order
				? tableState.order === "asc"
					? "ascend"
					: "descend"
				: null;
		const dataColumns: NonNullable<TableProps<PlatformUser>["columns"]> = [
			{
				dataIndex: "id",
				key: "id",
				render: (id: string) => <Text code>{id}</Text>,
				title: t("adminShell.users.columns.id"),
				width: token.controlHeight * userColumnWidthMultipliers.id,
			},
			{
				dataIndex: "username",
				key: "username",
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("username"),
				title: t("adminShell.users.columns.username"),
				width: token.controlHeight * userColumnWidthMultipliers.username,
			},
			{
				dataIndex: "displayName",
				key: "displayName",
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("display_name"),
				render: (displayName: string, row: PlatformUser) => (
					<Space size={token.marginXS}>
						<PlatformUserAvatar
							displayName={displayName || row.username}
							revision={row.updatedAt}
							size="small"
							userId={row.id}
						/>
						<TableActionButton onClick={() => onView(row)}>
							{displayName}
						</TableActionButton>
					</Space>
				),
				title: t("adminShell.users.columns.displayName"),
				width: token.controlHeight * userColumnWidthMultipliers.displayName,
			},
			{
				dataIndex: "department",
				key: "department",
				render: (department: PlatformUser["department"]) =>
					t(`adminShell.users.departments.${department}`),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("department"),
				title: t("adminShell.users.columns.department"),
				width: token.controlHeight * userColumnWidthMultipliers.department,
			},
			{
				dataIndex: "jobTitle",
				key: "jobTitle",
				render: (jobTitle: string) =>
					jobTitle || <Text type="secondary">-</Text>,
				title: t("adminShell.users.columns.jobTitle"),
				width: token.controlHeight * userColumnWidthMultipliers.jobTitle,
			},
			{
				dataIndex: "roles",
				key: "roles",
				render: (roles: PlatformUser["roles"]) =>
					roles.length > 0 ? (
						<Space size={[token.marginXXS, token.marginXXS]} wrap>
							{roles.slice(0, 2).map((role) => (
								<Tag key={role.id}>{role.displayName}</Tag>
							))}
							{roles.length > 2 ? (
								<Tooltip
									title={roles
										.slice(2)
										.map((role) => role.displayName)
										.join("、")}
								>
									<Tag>+{roles.length - 2}</Tag>
								</Tooltip>
							) : null}
						</Space>
					) : (
						<Text type="secondary">-</Text>
					),
				title: t("adminShell.users.columns.roles"),
				width: token.controlHeight * userColumnWidthMultipliers.roles,
			},
			{
				dataIndex: "phone",
				key: "phone",
				render: (phone: string) => phone || <Text type="secondary">-</Text>,
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("phone"),
				title: t("adminShell.users.columns.phone"),
				width: token.controlHeight * userColumnWidthMultipliers.phone,
			},
			{
				dataIndex: "email",
				key: "email",
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("email"),
				title: t("adminShell.users.columns.email"),
				width: token.controlHeight * userColumnWidthMultipliers.email,
			},
			{
				dataIndex: "status",
				key: "status",
				render: (status: PlatformUser["status"]) => (
					<Badge
						status={userStatusBadgeByStatus[status]}
						text={t(`adminShell.users.statuses.${status}`)}
					/>
				),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("status"),
				title: t("adminShell.users.columns.status"),
				width: token.controlHeight * userColumnWidthMultipliers.status,
			},
			{
				dataIndex: "authSource",
				key: "authSource",
				render: (authSource: PlatformUser["authSource"]) => (
					<Tag color={userAuthSourceTagColor[authSource]}>
						{t(`adminShell.users.authSources.${authSource}`)}
					</Tag>
				),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("auth_source"),
				title: t("adminShell.users.columns.authSource"),
				width: token.controlHeight * userColumnWidthMultipliers.authSource,
			},
			{
				dataIndex: "mfaEnabled",
				key: "mfaEnabled",
				render: (enabled: boolean) => (
					<Badge
						status={enabled ? "success" : "default"}
						text={t(
							enabled
								? "adminShell.users.columnValues.enabled"
								: "adminShell.users.columnValues.disabled",
						)}
					/>
				),
				title: t("adminShell.users.columns.mfaEnabled"),
				width: token.controlHeight * userColumnWidthMultipliers.mfaEnabled,
			},
			{
				dataIndex: "mustChangePassword",
				key: "mustChangePassword",
				render: (mustChangePassword?: boolean) => (
					<Badge
						status={mustChangePassword ? "warning" : "success"}
						text={t(
							mustChangePassword
								? "adminShell.users.columnValues.changeRequired"
								: "adminShell.users.columnValues.normal",
						)}
					/>
				),
				title: t("adminShell.users.columns.mustChangePassword"),
				width:
					token.controlHeight * userColumnWidthMultipliers.mustChangePassword,
			},
			{
				dataIndex: "lastLoginAt",
				key: "lastLoginAt",
				render: (lastLoginAt: string | null) =>
					lastLoginAt ? (
						formatDateTime(lastLoginAt, formatPreferences)
					) : (
						<Text type="secondary">
							{t("adminShell.users.columnValues.never")}
						</Text>
					),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("last_login_at"),
				title: t("adminShell.users.columns.lastLoginAt"),
				width: token.controlHeight * userColumnWidthMultipliers.lastLoginAt,
			},
			{
				dataIndex: "lastLoginIp",
				key: "lastLoginIp",
				render: (lastLoginIp: string | null) =>
					lastLoginIp ? (
						<Text code>{lastLoginIp}</Text>
					) : (
						<Text type="secondary">-</Text>
					),
				title: t("adminShell.users.columns.lastLoginIp"),
				width: token.controlHeight * userColumnWidthMultipliers.lastLoginIp,
			},
			{
				dataIndex: "createdAt",
				key: "createdAt",
				render: (createdAt: string) =>
					formatDateTime(createdAt, formatPreferences),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("created_at"),
				title: t("adminShell.users.columns.createdAt"),
				width: token.controlHeight * userColumnWidthMultipliers.createdAt,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				render: (updatedAt: string) =>
					formatDateTime(updatedAt, formatPreferences),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("updated_at"),
				title: t("adminShell.users.columns.updatedAt"),
				width: token.controlHeight * userColumnWidthMultipliers.updatedAt,
			},
		];

		dataColumns.push({
			key: "actions",
			render: (_: unknown, row: PlatformUser) => (
				<Space size="medium">
					{canManageUsers ? (
						<TableActionButton onClick={() => onEdit(row)}>
							{t("adminShell.users.edit")}
						</TableActionButton>
					) : null}
					<TableActionMenu
						items={[
							{
								icon: <EyeOutlined aria-hidden />,
								key: "view",
								label: t("adminShell.users.detail.view"),
								onClick: () => onView(row),
							},
							{
								icon: <TeamOutlined aria-hidden />,
								key: "roles",
								label: t("adminShell.users.roles.action"),
								onClick: () => onManageRoles(row),
							},
							...(canManageUsers
								? [
										{
											icon: <KeyOutlined aria-hidden />,
											key: "resetPassword",
											label: t("adminShell.users.resetPassword"),
											onClick: () => onResetPassword(row),
										},
									]
								: []),
							...(canManageUsers && currentUserId && row.id !== currentUserId
								? [
										{
											danger: true,
											icon: <LogoutOutlined aria-hidden />,
											key: "forceLogout",
											label: t("adminShell.users.forceLogout.action"),
											onClick: () => onForceLogout(row),
										},
										{
											danger: true,
											icon: <DeleteOutlined aria-hidden />,
											key: "delete",
											label: t("adminShell.users.delete"),
											onClick: () => onDelete(row),
										},
									]
								: []),
						]}
						label={t("adminShell.tableActions.more")}
					/>
				</Space>
			),
			title: t("adminShell.users.columns.actions"),
			width: token.controlHeight * userColumnWidthMultipliers.actions,
		});

		return dataColumns;
	}, [
		canManageUsers,
		currentUserId,
		formatPreferences,
		onDelete,
		onEdit,
		onForceLogout,
		onManageRoles,
		onResetPassword,
		onView,
		t,
		tableState.order,
		tableState.sort,
		token.controlHeight,
		token.marginXXS,
		token.marginXS,
	]);
}
