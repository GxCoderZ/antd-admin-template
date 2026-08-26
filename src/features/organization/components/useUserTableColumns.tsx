import {
	DeleteOutlined,
	EyeOutlined,
	KeyOutlined,
	LogoutOutlined,
	TeamOutlined,
} from "@ant-design/icons";
import { Badge, Space, Tag, theme, Tooltip, Typography } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import type { ManagementProTableColumn } from "../../../app/ManagementProTable";
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

	return useMemo<ManagementProTableColumn<PlatformUser>[]>(() => {
		const sortOrder = (column: ListPlatformUsersInput["sort"]) =>
			tableState.sort === column && tableState.order
				? tableState.order === "asc"
					? "ascend"
					: "descend"
				: null;
		const dataColumns: ManagementProTableColumn<PlatformUser>[] = [
			{
				dataIndex: "id",
				key: "id",
				render: (_, row) => <Text code>{row.id}</Text>,
				search: false,
				title: t("adminShell.users.columns.id"),
				width: token.controlHeight * userColumnWidthMultipliers.id,
			},
			{
				dataIndex: "username",
				disable: true,
				key: "username",
				search: false,
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("username"),
				title: t("adminShell.users.columns.username"),
				width: token.controlHeight * userColumnWidthMultipliers.username,
			},
			{
				dataIndex: "displayName",
				key: "displayName",
				search: false,
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("display_name"),
				render: (_, row) => (
					<Space size={token.marginXS}>
						<PlatformUserAvatar
							displayName={row.displayName || row.username}
							revision={row.updatedAt}
							size="small"
							userId={row.id}
						/>
						<TableActionButton onClick={() => onView(row)}>
							{row.displayName}
						</TableActionButton>
					</Space>
				),
				title: t("adminShell.users.columns.displayName"),
				width: token.controlHeight * userColumnWidthMultipliers.displayName,
			},
			{
				dataIndex: "department",
				key: "department",
				search: false,
				render: (_, row) => t(`adminShell.users.departments.${row.department}`),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("department"),
				title: t("adminShell.users.columns.department"),
				width: token.controlHeight * userColumnWidthMultipliers.department,
			},
			{
				dataIndex: "jobTitle",
				key: "jobTitle",
				render: (_, row) => row.jobTitle || <Text type="secondary">-</Text>,
				search: false,
				title: t("adminShell.users.columns.jobTitle"),
				width: token.controlHeight * userColumnWidthMultipliers.jobTitle,
			},
			{
				dataIndex: "roles",
				key: "roles",
				search: false,
				render: (_, row) =>
					row.roles.length > 0 ? (
						<Space size={[token.marginXXS, token.marginXXS]} wrap>
							{row.roles.slice(0, 2).map((role) => (
								<Tag key={role.id}>{role.displayName}</Tag>
							))}
							{row.roles.length > 2 ? (
								<Tooltip
									title={row.roles
										.slice(2)
										.map((role) => role.displayName)
										.join("、")}
								>
									<Tag>+{row.roles.length - 2}</Tag>
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
				render: (_, row) => row.phone || <Text type="secondary">-</Text>,
				search: false,
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("phone"),
				title: t("adminShell.users.columns.phone"),
				width: token.controlHeight * userColumnWidthMultipliers.phone,
			},
			{
				dataIndex: "email",
				key: "email",
				search: false,
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("email"),
				title: t("adminShell.users.columns.email"),
				width: token.controlHeight * userColumnWidthMultipliers.email,
			},
			{
				dataIndex: "status",
				disable: true,
				key: "status",
				render: (_, row) => (
					<Badge
						status={userStatusBadgeByStatus[row.status]}
						text={t(`adminShell.users.statuses.${row.status}`)}
					/>
				),
				search: false,
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("status"),
				title: t("adminShell.users.columns.status"),
				width: token.controlHeight * userColumnWidthMultipliers.status,
			},
			{
				dataIndex: "authSource",
				key: "authSource",
				search: false,
				render: (_, row) => (
					<Tag color={userAuthSourceTagColor[row.authSource]}>
						{t(`adminShell.users.authSources.${row.authSource}`)}
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
				search: false,
				render: (_, row) => (
					<Badge
						status={row.mfaEnabled ? "success" : "default"}
						text={t(
							row.mfaEnabled
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
				search: false,
				render: (_, row) => (
					<Badge
						status={row.mustChangePassword ? "warning" : "success"}
						text={t(
							row.mustChangePassword
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
				search: false,
				render: (_, row) =>
					row.lastLoginAt ? (
						formatDateTime(row.lastLoginAt, formatPreferences)
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
				search: false,
				render: (_, row) =>
					row.lastLoginIp ? (
						<Text code>{row.lastLoginIp}</Text>
					) : (
						<Text type="secondary">-</Text>
					),
				title: t("adminShell.users.columns.lastLoginIp"),
				width: token.controlHeight * userColumnWidthMultipliers.lastLoginIp,
			},
			{
				dataIndex: "createdAt",
				key: "createdAt",
				search: false,
				render: (_, row) => formatDateTime(row.createdAt, formatPreferences),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("created_at"),
				title: t("adminShell.users.columns.createdAt"),
				width: token.controlHeight * userColumnWidthMultipliers.createdAt,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				search: false,
				render: (_, row) => formatDateTime(row.updatedAt, formatPreferences),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("updated_at"),
				title: t("adminShell.users.columns.updatedAt"),
				width: token.controlHeight * userColumnWidthMultipliers.updatedAt,
			},
		];

		dataColumns.push({
			disable: true,
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
			search: false,
			title: t("adminShell.users.columns.actions"),
			valueType: "option",
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
