import type { UserItemType, UserStatus } from "#src/api/system/user";
import type { ProColumns } from "@ant-design/pro-components";
import type { TFunction } from "i18next";

import { BasicButton } from "#src/components/basic-button";

import { MoreOutlined } from "@ant-design/icons";
import { Badge, Dropdown, Flex } from "antd";

export interface UserColumnPermissions {
	assignRole: boolean
	delete: boolean
	edit: boolean
	forceLogout: boolean
	resetPassword: boolean
}

interface CreateUserColumnsOptions {
	onAssignRoles: (user: UserItemType) => void
	onDelete: (user: UserItemType) => void
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

export function createUserColumns({
	onAssignRoles,
	onDelete,
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
			title: t("common.keyword"),
			dataIndex: "keyword",
			hideInTable: true,
			fieldProps: { allowClear: true, placeholder: t("system.user.searchPlaceholder") },
		},
		{
			title: t("system.user.username"),
			dataIndex: "username",
			width: 150,
			ellipsis: true,
			hideInSearch: true,
			sorter: true,
			render: (_, record) => (
				<BasicButton type="link" usage="table-action" onClick={() => onView(record)}>{record.username}</BasicButton>
			),
		},
		{
			title: t("system.user.displayName"),
			dataIndex: "display_name",
			width: 150,
			ellipsis: true,
			hideInSearch: true,
			sorter: true,
		},
		{
			title: t("system.user.email"),
			dataIndex: "email",
			width: 220,
			ellipsis: true,
			hideInSearch: true,
			sorter: true,
		},
		{
			title: t("common.status"),
			dataIndex: "status",
			width: 110,
			valueType: "select",
			valueEnum: {
				1: { text: t("system.user.status.active") },
				2: { text: t("system.user.status.locked") },
				3: { text: t("system.user.status.disabled") },
			},
			sorter: true,
			render: (_, record) => <Badge status={statusMap[record.status].status} text={statusMap[record.status].text} />,
		},
		{
			title: t("common.createdAt"),
			dataIndex: "created_at",
			width: 180,
			hideInSearch: true,
			sorter: true,
		},
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 210,
			fixed: "right",
			render: (_, record) => {
				const moreItems = [
					permissions.resetPassword ? { key: "reset", label: t("system.user.resetPassword") } : null,
					permissions.forceLogout ? { key: "force", label: t("system.user.forceLogout") } : null,
					permissions.delete ? { key: "delete", danger: true, label: t("common.delete") } : null,
				].filter(item => item !== null);
				return (
					<Flex align="center" gap={4}>
						{permissions.edit && (
							<BasicButton type="link" usage="table-action" onClick={() => onEdit(record)}>{t("common.edit")}</BasicButton>
						)}
						{permissions.assignRole && (
							<BasicButton type="link" usage="table-action" onClick={() => onAssignRoles(record)}>{t("system.user.assignRole")}</BasicButton>
						)}
						{moreItems.length > 0 && (
							<Dropdown
								menu={{
									items: moreItems,
									onClick: ({ key }) => {
										if (key === "reset")
											onResetPassword(record);
										if (key === "force")
											onForceLogout(record);
										if (key === "delete")
											onDelete(record);
									},
								}}
								trigger={["click"]}
							>
								<BasicButton aria-label={t("common.more")} icon={<MoreOutlined />} type="text" usage="table-action" />
							</Dropdown>
						)}
					</Flex>
				);
			},
		},
	];
}
