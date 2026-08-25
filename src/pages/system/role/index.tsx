import type { RoleCreateReq, RoleItemType, RoleListReq } from "#src/api/system/role";
import type { TableProps } from "antd";

import { fetchAddRoleItem, fetchDeleteRoleItem, fetchRoleList, fetchUpdateRoleItem } from "#src/api/system/role";
import { BasicButton } from "#src/components/basic-button";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { usePermission } from "#src/hooks/use-permission";

import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Result } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { CreateRoleModal } from "./components/create-role-modal";
import { DeleteRoleModal } from "./components/delete-role-modal";
import { Detail } from "./components/detail";
import { PermissionDrawer } from "./components/permission-drawer";
import { RenameRoleModal } from "./components/rename-role-modal";
import { createRoleColumns } from "./constants";

const initialQuery: RoleListReq = { page: 1, page_size: 10, sort: "created_at", order: "descend" };
const roleSortFields = ["name", "status", "user_count", "created_at"] as const;

export default function Role() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [query, setQuery] = useState<RoleListReq>(initialQuery);
	const [createOpen, setCreateOpen] = useState(false);
	const [detailRole, setDetailRole] = useState<RoleItemType>();
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
		queryKey: ["system-roles", query],
		queryFn: async () => {
			const response = await fetchRoleList(query);
			if (response.code !== 0)
				throw new Error(response.msg);
			const items = Array.isArray(response.data) ? response.data : response.data.items;
			return { items, total: Array.isArray(response.data) ? items.length : response.data.total };
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
		onView: setDetailRole,
		onRename: setRenameRole,
		onConfigure: setPermissionRole,
		onDelete: role => !role.is_system && setDeleteRole(role),
	}), [permissions.delete, permissions.edit, permissions.permissions, t]);

	const handleTableChange: NonNullable<TableProps<RoleItemType>["onChange"]> = (pagination, _filters, sorter) => {
		const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
		const field = String(activeSorter.field ?? "");
		setQuery(current => ({
			...current,
			page: pagination.current ?? 1,
			page_size: pagination.pageSize ?? current.page_size,
			sort: roleSortFields.includes(field as typeof roleSortFields[number]) ? field as RoleListReq["sort"] : undefined,
			order: activeSorter.order === "ascend" || activeSorter.order === "descend" ? activeSorter.order : undefined,
		}));
	};

	return (
		<BasicContent className="h-full">
			<BasicTable<RoleItemType>
				adaptive
				columns={columns}
				columnsState={{ persistenceKey: `${import.meta.env.VITE_GLOB_APP_TITLE}:system-roles:columns`, persistenceType: "localStorage" }}
				dataSource={rolesQuery.data?.items ?? []}
				headerTitle={t("common.menu.role")}
				loading={rolesQuery.isFetching}
				locale={rolesQuery.isError ? { emptyText: <Result extra={<BasicButton icon={<ReloadOutlined />} onClick={() => rolesQuery.refetch()}>{t("common.retry")}</BasicButton>} status="error" subTitle={rolesQuery.error.message} title={t("system.role.loadFailed")} /> } : undefined}
				onChange={handleTableChange}
				onReset={() => setQuery(initialQuery)}
				onSubmit={values => setQuery(current => ({ ...current, page: 1, name: values.name || undefined, status: values.status || undefined }))}
				options={{ reload: () => rolesQuery.refetch() }}
				pagination={{ current: query.page, pageSize: query.page_size, total: rolesQuery.data?.total ?? 0 }}
				search={{ defaultCollapsed: false, labelWidth: "auto" }}
				toolBarRender={() => permissions.add ? [<BasicButton key="add-role" icon={<PlusOutlined />} type="primary" usage="toolbar" onClick={() => setCreateOpen(true)}>{t("system.role.addRole")}</BasicButton>] : []}
			/>

			<CreateRoleModal loading={createMutation.isPending} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} open={createOpen} />
			<RenameRoleModal loading={updateMutation.isPending} onClose={() => setRenameRole(undefined)} onSubmit={handleRename} open={Boolean(renameRole)} role={renameRole} />
			<PermissionDrawer onClose={() => setPermissionRole(undefined)} onSuccess={refreshRoles} open={Boolean(permissionRole)} role={permissionRole} />
			<DeleteRoleModal loading={deleteMutation.isPending} onClose={() => setDeleteRole(undefined)} onSubmit={handleDelete} open={Boolean(deleteRole)} role={deleteRole} />
			<Detail
				onClose={() => setDetailRole(undefined)}
				onOpenMembers={role => navigate(`/system/user?role_id=${role.id}`)}
				open={Boolean(detailRole)}
				role={detailRole}
			/>
		</BasicContent>
	);
}
