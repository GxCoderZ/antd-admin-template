import type { RoleItemType } from "#src/api/system/role";
import type { UserItemType } from "#src/api/system/user";

import { fetchRoleList } from "#src/api/system/role";
import { fetchUserRoles } from "#src/api/system/user";
import { BasicButton } from "#src/components/basic-button";
import { BasicDrawer } from "#src/components/basic-drawer";

import { useQuery } from "@tanstack/react-query";
import { Alert, Empty, Flex, List, Skeleton, Switch, Tag, Typography } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface RoleAssignProps {
	loading?: boolean
	onClose: () => void
	onSubmit: (roleIds: number[]) => Promise<boolean>
	open: boolean
	user?: UserItemType
}

export function RoleAssign({ loading = false, onClose, onSubmit, open, user }: RoleAssignProps) {
	const { t } = useTranslation();
	const [selectionOverride, setSelectionOverride] = useState<{ roleIds: number[], userId: number }>();
	const rolesQuery = useQuery({
		queryKey: ["system-roles", "all"],
		enabled: open,
		queryFn: async () => {
			const response = await fetchRoleList({ page: 1, page_size: 1000 });
			if (response.code !== 0)
				throw new Error(response.msg);
			return Array.isArray(response.data) ? response.data : response.data.items;
		},
	});
	const userRolesQuery = useQuery({
		queryKey: ["system-user-roles", user?.id],
		enabled: open && Boolean(user),
		queryFn: async () => {
			const response = await fetchUserRoles({ user_id: user!.id });
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data.role_ids;
		},
	});

	const selectedRoleIds = selectionOverride && selectionOverride.userId === user?.id ? selectionOverride.roleIds : (userRolesQuery.data ?? []);
	const handleClose = () => {
		setSelectionOverride(undefined);
		onClose();
	};

	const selectedRoles = useMemo(() => (rolesQuery.data ?? []).filter(role => selectedRoleIds.includes(role.id)), [rolesQuery.data, selectedRoleIds]);
	const isPending = rolesQuery.isLoading || userRolesQuery.isLoading;
	const error = rolesQuery.error ?? userRolesQuery.error;

	return (
		<BasicDrawer
			extra={(
				<Flex gap="small">
					<BasicButton disabled={loading} onClick={handleClose}>{t("common.cancel")}</BasicButton>
					<BasicButton disabled={Boolean(error)} loading={loading} type="primary" onClick={() => onSubmit(selectedRoleIds)}>{t("common.confirm")}</BasicButton>
				</Flex>
			)}
			onClose={handleClose}
			open={open}
			title={t("system.user.assignRoleTitle", { username: user?.username })}
			width={560}
		>
			<Flex gap="middle" vertical>
				<div>
					<Typography.Text type="secondary">{t("system.user.assignedRoles")}</Typography.Text>
					<Flex className="mt-2 min-h-6" gap={6} wrap>
						{selectedRoles.length > 0
							? selectedRoles.map(role => <Tag key={role.id} color="blue">{role.name}</Tag>)
							: <Typography.Text type="secondary">{t("system.user.noRoleAssigned")}</Typography.Text>}
					</Flex>
				</div>

				{error && <Alert description={error.message} showIcon type="error" />}
				{isPending
					? <Skeleton active paragraph={{ rows: 5 }} />
					: (
						<List<RoleItemType>
							bordered
							dataSource={rolesQuery.data}
							locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
							renderItem={role => (
								<List.Item
									extra={(
										<Switch
											checked={selectedRoleIds.includes(role.id)}
											disabled={role.status !== 1}
											onChange={checked => setSelectionOverride({
												userId: user!.id,
												roleIds: checked ? [...selectedRoleIds, role.id] : selectedRoleIds.filter(id => id !== role.id),
											})}
										/>
									)}
								>
									<List.Item.Meta
										description={t("system.user.roleMemberCount", { count: role.user_count })}
										title={(
											<Flex align="center" gap={6}>
												{role.name}
												{role.is_system && <Tag>{t("system.role.builtIn")}</Tag>}
											</Flex>
										)}
									/>
								</List.Item>
							)}
						/>
					)}
			</Flex>
		</BasicDrawer>
	);
}
