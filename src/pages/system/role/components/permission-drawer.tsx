import type { PermissionTreeNode, RoleItemType } from "#src/api/system/role";
import type { TreeDataNode } from "antd";

import type { Key } from "react";
import { fetchBindRoleMenus, fetchMenuByRoleId, fetchRoleMenu } from "#src/api/system/role";

import { BasicButton } from "#src/components/basic-button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Drawer, Empty, Flex, Skeleton, Tree, Typography } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { permissionModuleNames } from "../constants";

interface PermissionDrawerProps {
	onClose: () => void
	onSuccess: () => Promise<void> | void
	open: boolean
	role?: RoleItemType
}

interface KeyOverride {
	keys: Key[]
	roleId: number
}

export function PermissionDrawer({ onClose, onSuccess, open, role }: PermissionDrawerProps) {
	const { t } = useTranslation();
	const [checkedOverride, setCheckedOverride] = useState<KeyOverride>();
	const [expandedOverride, setExpandedOverride] = useState<KeyOverride>();
	const permissionTreeQuery = useQuery({
		queryKey: ["system-permission-tree"],
		enabled: open,
		queryFn: async () => {
			const response = await fetchRoleMenu();
			if (response.code !== 0)
				throw new Error(response.msg);
			return Array.isArray(response.data) ? response.data : response.data.tree;
		},
	});
	const rolePermissionsQuery = useQuery({
		queryKey: ["system-role-permissions", role?.id],
		enabled: open && Boolean(role),
		queryFn: async () => {
			const response = await fetchMenuByRoleId({ role_id: role!.id });
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data.permission_ids.map(String);
		},
	});
	const bindMutation = useMutation({ mutationFn: fetchBindRoleMenus });
	const treeData = useMemo<TreeDataNode[]>(() => (permissionTreeQuery.data ?? []).map((group: PermissionTreeNode) => ({
		key: `module:${group.module}`,
		title: permissionModuleNames[group.module] ?? group.module,
		children: group.permissions.map(permission => ({ key: String(permission.id), title: permission.name })),
	})), [permissionTreeQuery.data]);
	const allPermissionKeys = useMemo(() => (permissionTreeQuery.data ?? []).flatMap(group => group.permissions.map(permission => String(permission.id))), [permissionTreeQuery.data]);
	const allModuleKeys = useMemo(() => treeData.map(node => node.key), [treeData]);
	const checkedKeys = checkedOverride && checkedOverride.roleId === role?.id ? checkedOverride.keys : (rolePermissionsQuery.data ?? []);
	const expandedKeys = expandedOverride && expandedOverride.roleId === role?.id ? expandedOverride.keys : allModuleKeys;
	const error = permissionTreeQuery.error ?? rolePermissionsQuery.error;
	const isLoading = permissionTreeQuery.isLoading || rolePermissionsQuery.isLoading;

	const closeDrawer = () => {
		setCheckedOverride(undefined);
		setExpandedOverride(undefined);
		onClose();
	};

	const savePermissions = async () => {
		if (!role)
			return;
		const response = await bindMutation.mutateAsync({
			role_id: role.id,
			permission_ids: checkedKeys.map(Number).filter(id => Number.isInteger(id)),
		});
		if (response.code !== 0) {
			window.$message?.error(response.msg || t("common.fail"));
			return;
		}
		await onSuccess();
		window.$message?.success(t("system.role.permissionsUpdated"));
		closeDrawer();
	};

	return (
		<Drawer
			destroyOnHidden
			extra={(
				<Flex gap="small">
					<BasicButton disabled={bindMutation.isPending} onClick={closeDrawer}>{t("common.cancel")}</BasicButton>
					<BasicButton disabled={Boolean(error)} loading={bindMutation.isPending} type="primary" onClick={savePermissions}>{t("common.save")}</BasicButton>
				</Flex>
			)}
			onClose={closeDrawer}
			open={open}
			title={t("system.role.permissionTitle", { name: role?.name })}
			width={620}
		>
			<Flex gap="middle" vertical>
				<Typography.Paragraph type="secondary">{t("system.role.permissionDescription")}</Typography.Paragraph>
				<Flex gap="small" wrap>
					<BasicButton size="small" onClick={() => setExpandedOverride({ roleId: role!.id, keys: allModuleKeys })}>{t("common.expandAll")}</BasicButton>
					<BasicButton size="small" onClick={() => setExpandedOverride({ roleId: role!.id, keys: [] })}>{t("common.collapseAll")}</BasicButton>
					<BasicButton size="small" onClick={() => setCheckedOverride({ roleId: role!.id, keys: allPermissionKeys })}>{t("common.checkAll")}</BasicButton>
					<BasicButton size="small" onClick={() => setCheckedOverride({ roleId: role!.id, keys: [] })}>{t("common.cancelAll")}</BasicButton>
				</Flex>
				{error && <Alert description={error.message} showIcon type="error" />}
				{isLoading
					? <Skeleton active paragraph={{ rows: 8 }} />
					: treeData.length > 0
						? (
							<Tree
								checkable
								checkedKeys={checkedKeys}
								expandedKeys={expandedKeys}
								onCheck={keys => setCheckedOverride({ roleId: role!.id, keys: Array.isArray(keys) ? keys : keys.checked })}
								onExpand={keys => setExpandedOverride({ roleId: role!.id, keys })}
								treeData={treeData}
							/>
						)
						: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
			</Flex>
		</Drawer>
	);
}
