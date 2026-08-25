import type { RoleCreateReq, RoleItemType } from "#src/api/system/role";

import { fetchAddRoleItem, fetchDeleteRoleItem, fetchRoleList, fetchUpdateRoleItem } from "#src/api/system/role";
import { BasicButton } from "#src/components/basic-button";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { DataTableSkeleton } from "#src/components/loading-skeletons";
import { usePermission } from "#src/hooks/use-permission";

import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Flex, theme, Typography } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { CreateRoleModal } from "./components/create-role-modal";
import { DeleteRoleModal } from "./components/delete-role-modal";
import { PermissionDrawer } from "./components/permission-drawer";
import { RenameRoleModal } from "./components/rename-role-modal";
import { createRoleColumns } from "./constants";

export default function Role() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = useState(false);
	const [renameRole, setRenameRole] = useState<RoleItemType>();
	const [permissionRole, setPermissionRole] = useState<RoleItemType>();
	const [deleteRole, setDeleteRole] = useState<RoleItemType>();
	const permissions = {
		add: usePermission("system:role:add"),
		edit: usePermission("system:role:edit"),
		delete: usePermission("system:role:delete"),
		permissions: usePermission("system:role:assign-permission"),
	};

	const rolesQuery = useQuery({
		queryKey: ["system-roles"],
		queryFn: async () => {
			const response = await fetchRoleList({ page: 1, page_size: 100 });
			if (response.code !== 0)
				throw new Error(response.msg);
			return Array.isArray(response.data) ? response.data : response.data.items;
		},
	});
	const createMutation = useMutation({ mutationFn: fetchAddRoleItem });
	const updateMutation = useMutation({ mutationFn: fetchUpdateRoleItem });
	const deleteMutation = useMutation({ mutationFn: fetchDeleteRoleItem });

	const refreshRoles = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["system-roles"] }),
			queryClient.invalidateQueries({ queryKey: ["system-users"] }),
			queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
			queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
		]);
	};

	const handleCreate = async (values: RoleCreateReq) => {
		const response = await createMutation.mutateAsync(values);
		if (response.code !== 0) {
			window.$message?.error(response.msg || t("common.fail"));
			return false;
		}
		setCreateOpen(false);
		await refreshRoles();
		window.$message?.success(t("system.role.createSuccess"));
		return true;
	};

	const handleRename = async (name: string) => {
		if (!renameRole)
			return false;
		const response = await updateMutation.mutateAsync({ id: renameRole.id, key: renameRole.key, name, status: renameRole.status, remark: renameRole.remark });
		if (response.code !== 0) {
			window.$message?.error(response.msg || t("common.fail"));
			return false;
		}
		setRenameRole(undefined);
		await refreshRoles();
		window.$message?.success(t("system.role.renameSuccess"));
		return true;
	};

	const handleDelete = async () => {
		if (!deleteRole || deleteRole.is_system)
			return;
		const response = await deleteMutation.mutateAsync(deleteRole.id);
		if (response.code !== 0) {
			window.$message?.error(response.msg || t("common.fail"));
			return;
		}
		setDeleteRole(undefined);
		await refreshRoles();
		window.$message?.success(t("common.deleteSuccess"));
	};

	const columns = useMemo(() => createRoleColumns({
		t,
		permissions,
		onRename: setRenameRole,
		onConfigure: setPermissionRole,
		onDelete: role => !role.is_system && setDeleteRole(role),
	}), [permissions.delete, permissions.edit, permissions.permissions, t]);

	return (
		<BasicContent className="h-full">
			<Flex gap={token.marginLG} vertical>
				{rolesQuery.isError && (
					<Alert
						action={<BasicButton icon={<ReloadOutlined />} onClick={() => rolesQuery.refetch()}>{t("common.retry")}</BasicButton>}
						description={rolesQuery.error.message}
						message={t("system.role.loadFailed")}
						showIcon
						type="error"
					/>
				)}
				<BasicTable<RoleItemType>
					columns={columns}
					dataSource={rolesQuery.data ?? []}
					headerTitle={t("common.menu.role")}
					loading={false}
					options={false}
					pagination={false}
					search={false}
					tableRender={(_, defaultDom) => (
						<Flex gap={token.margin} vertical>
							<Flex align="baseline" gap={token.marginXS} wrap>
								<Typography.Text type="secondary">{t("system.role.memberGuide")}</Typography.Text>
								<BasicButton usage="table-action" onClick={() => navigate("/system/user")}>{t("system.role.manageMembers")}</BasicButton>
							</Flex>
							{rolesQuery.isLoading
								? <DataTableSkeleton columnCount={columns.length} minimumWidth={1260} />
								: defaultDom}
						</Flex>
					)}
					toolBarRender={() => permissions.add
						? [<BasicButton key="add-role" icon={<PlusOutlined />} type="primary" usage="toolbar" onClick={() => setCreateOpen(true)}>{t("system.role.addRole")}</BasicButton>]
						: []}
				/>
			</Flex>

			{createOpen && <CreateRoleModal loading={createMutation.isPending} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} open />}
			{renameRole && <RenameRoleModal loading={updateMutation.isPending} onClose={() => setRenameRole(undefined)} onSubmit={handleRename} open role={renameRole} />}
			<PermissionDrawer onClose={() => setPermissionRole(undefined)} onSuccess={refreshRoles} open={Boolean(permissionRole)} role={permissionRole} />
			<DeleteRoleModal loading={deleteMutation.isPending} onClose={() => setDeleteRole(undefined)} onSubmit={handleDelete} open={Boolean(deleteRole)} role={deleteRole} />
		</BasicContent>
	);
}
