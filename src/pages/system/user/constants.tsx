import type { UserItemType, UserStatus } from "#src/api/system/user";
import type { QueryFilterField } from "#src/components/query-filter-panel";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

import { BasicButton } from "#src/components/basic-button";

import { Avatar, Badge, Space } from "antd";

export interface UserColumnPermissions {
	assignRole: boolean
	edit: boolean
	forceLogout: boolean
	resetPassword: boolean
}

interface CreateUserColumnsOptions {
	currentUserId?: number
	onAssignRoles: (user: UserItemType) => void
	onEdit: (user: UserItemType) => void
	onForceLogout: (user: UserItemType) => void
	onResetPassword: (user: UserItemType) => void
	onView: (user: UserItemType) => void
	permissions: UserColumnPermissions
	t: TFunction
}

export const userStatusOptions: Array<{ label: string, value: UserStatus }> = [
	{ label: "启用", value: 1 },
	{ label: "锁定", value: 2 },
	{ label: "停用", value: 3 },
];

export function createUserSearchFields(t: TFunction): QueryFilterField[] {
	return [
		{ label: t("common.keyword"), name: "keyword", placeholder: t("system.user.searchPlaceholder"), type: "text" },
		{
			label: t("common.status"),
			name: "status",
			options: [
				{ label: t("system.user.status.active"), value: 1 },
				{ label: t("system.user.status.locked"), value: 2 },
				{ label: t("system.user.status.disabled"), value: 3 },
			],
			type: "select",
		},
	];
}

export function createUserColumns({
	currentUserId,
	onAssignRoles,
	onEdit,
	onForceLogout,
	onResetPassword,
	onView,
	permissions,
	t,
}: CreateUserColumnsOptions): ProColumns<UserItemType>[] {
	const statusMap: Record<UserStatus, { status: "default" | "success" | "warning", text: string }> = {
		1: { status: "success", text: t("system.user.status.active") },
		2: { status: "warning", text: t("system.user.status.locked") },
		3: { status: "default", text: t("system.user.status.disabled") },
	};

	return [
		{
			title: t("system.user.username"),
			dataIndex: "username",
			width: 150,
			ellipsis: true,
			sorter: true,
		},
		{
			title: t("system.user.displayName"),
			dataIndex: "display_name",
			width: 170,
			ellipsis: true,
			sorter: true,
			render: (_, record) => (
				<Space size={4}>
					<Avatar size="small">{(record.display_name || record.username).slice(0, 1).toUpperCase()}</Avatar>
					<BasicButton usage="table-action" onClick={() => onView(record)}>{record.display_name}</BasicButton>
				</Space>
			),
		},
		{
			title: t("system.user.email"),
			dataIndex: "email",
			width: 220,
			ellipsis: true,
			sorter: true,
		},
		{
			title: t("common.status"),
			dataIndex: "status",
			width: 110,
			sorter: true,
			render: (_, record) => <Badge status={statusMap[record.status].status} text={statusMap[record.status].text} />,
		},
		{
			title: t("common.createdAt"),
			dataIndex: "created_at",
			width: 180,
			sorter: true,
		},
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 360,
			fixed: "right",
			render: (_, record) => (
				<Space size={4}>
					{permissions.assignRole && <BasicButton usage="table-action" onClick={() => onAssignRoles(record)}>{t("system.user.assignRole")}</BasicButton>}
					{permissions.edit && <BasicButton usage="table-action" onClick={() => onEdit(record)}>{t("common.edit")}</BasicButton>}
					{permissions.resetPassword && <BasicButton usage="table-action" onClick={() => onResetPassword(record)}>{t("system.user.resetPassword")}</BasicButton>}
					{permissions.forceLogout && record.id !== currentUserId && (
						<BasicButton danger usage="table-action" onClick={() => onForceLogout(record)}>{t("system.user.forceLogout")}</BasicButton>
					)}
				</Space>
			),
		},
	];
}
