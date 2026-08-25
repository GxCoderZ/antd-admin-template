import type { UserCreateReq, UserItemType, UserListReq, UserSortField, UserUpdateReq } from "#src/api/system/user";
import type { TableProps } from "antd";

import {
	fetchBindUserRoles,
	fetchCreateUser,
	fetchDeleteUser,
	fetchForceLogoutUser,
	fetchResetUserPassword,
	fetchUpdateUser,
	fetchUserList,
} from "#src/api/system/user";
import { BasicButton } from "#src/components/basic-button";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { DangerConfirmation } from "#src/components/danger-confirmation";
import { usePermission } from "#src/hooks/use-permission";

import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Result } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { CreateUserDrawer } from "./components/create-user-drawer";
import { Detail } from "./components/detail";
import { EditUserModal } from "./components/edit-user-modal";
import { ForceLogoutModal } from "./components/force-logout-modal";
import { ResetPasswordModal } from "./components/reset-password-modal";
import { ResetPasswordResult } from "./components/reset-password-result";
import { RoleAssign } from "./components/role-assign";
import { createUserColumns } from "./constants";

type TableSize = "large" | "middle" | "small";

const initialQuery: UserListReq = { page: 1, page_size: 10, sort: "created_at", order: "descend" };
const userSortFields: UserSortField[] = ["username", "display_name", "email", "status", "created_at"];

export default function User() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [searchParams] = useSearchParams();
	const roleId = Number(searchParams.get("role_id")) || undefined;
	const [query, setQuery] = useState<UserListReq>(initialQuery);
	const [createOpen, setCreateOpen] = useState(false);
	const [detailUser, setDetailUser] = useState<UserItemType>();
	const [editUser, setEditUser] = useState<UserItemType>();
	const [roleUser, setRoleUser] = useState<UserItemType>();
	const [resetUser, setResetUser] = useState<UserItemType>();
	const [forceLogoutUser, setForceLogoutUser] = useState<UserItemType>();
	const [deleteUser, setDeleteUser] = useState<UserItemType>();
	const [resetResult, setResetResult] = useState<{ password: string, username: string }>();
	const densityStorageKey = `${import.meta.env.VITE_GLOB_APP_TITLE}:system-users:density`;
	const [tableSize, setTableSize] = useState<TableSize>(() => {
		const stored = localStorage.getItem(densityStorageKey);
		return stored === "small" || stored === "large" ? stored : "middle";
	});

	const permissions = {
		add: usePermission("system:user:add"),
		edit: usePermission("system:user:edit"),
		delete: usePermission("system:user:delete"),
		assignRole: usePermission("system:user:assign-role"),
		resetPassword: usePermission("system:user:reset-password"),
		forceLogout: usePermission("system:user:force-logout"),
	};

	const usersQuery = useQuery({
		queryKey: ["system-users", query, roleId],
		queryFn: async () => {
			const response = await fetchUserList({ ...query, role_id: roleId });
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data;
		},
	});

	const createMutation = useMutation({ mutationFn: fetchCreateUser });
	const updateMutation = useMutation({ mutationFn: fetchUpdateUser });
	const deleteMutation = useMutation({ mutationFn: fetchDeleteUser });
	const resetMutation = useMutation({ mutationFn: fetchResetUserPassword });
	const forceLogoutMutation = useMutation({ mutationFn: fetchForceLogoutUser });
	const bindRolesMutation = useMutation({ mutationFn: fetchBindUserRoles });

	const refreshAdministration = async () => {
		await Promise.all([
			queryClient.invalidateQueries({ queryKey: ["system-users"] }),
			queryClient.invalidateQueries({ queryKey: ["system-roles"] }),
			queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] }),
			queryClient.invalidateQueries({ queryKey: ["audit-logs"] }),
		]);
	};

	const showFailure = (message?: string) => window.$message?.error(message || t("common.fail"));

	const handleCreate = async (values: UserCreateReq) => {
		const response = await createMutation.mutateAsync(values);
		if (response.code !== 0) {
			showFailure(response.msg);
			return false;
		}
		setCreateOpen(false);
		await refreshAdministration();
		window.$message?.success(t("system.user.createSuccess"));
		return true;
	};

	const handleUpdate = async (values: UserUpdateReq) => {
		const response = await updateMutation.mutateAsync(values);
		if (response.code !== 0) {
			showFailure(response.msg);
			return false;
		}
		setEditUser(undefined);
		await refreshAdministration();
		window.$message?.success(t("system.user.updateSuccess"));
		return true;
	};

	const handleDelete = async () => {
		if (!deleteUser)
			return;
		const response = await deleteMutation.mutateAsync({ id: deleteUser.id });
		if (response.code !== 0) {
			showFailure(response.msg);
			return;
		}
		setDeleteUser(undefined);
		await refreshAdministration();
		window.$message?.success(t("common.deleteSuccess"));
	};

	const handleResetPassword = async (password: string) => {
		if (!resetUser)
			return false;
		const response = await resetMutation.mutateAsync({ id: resetUser.id, new_password: password });
		if (response.code !== 0) {
			showFailure(response.msg);
			return false;
		}
		setResetResult({ password: response.data.temporary_password, username: resetUser.username });
		setResetUser(undefined);
		await refreshAdministration();
		return true;
	};

	const handleForceLogout = async () => {
		if (!forceLogoutUser)
			return 0;
		const response = await forceLogoutMutation.mutateAsync({ id: forceLogoutUser.id });
		if (response.code !== 0) {
			showFailure(response.msg);
			throw new Error(response.msg);
		}
		await refreshAdministration();
		return response.data.revoked_sessions;
	};

	const handleBindRoles = async (roleIds: number[]) => {
		if (!roleUser)
			return false;
		const response = await bindRolesMutation.mutateAsync({ user_id: roleUser.id, role_ids: roleIds });
		if (response.code !== 0) {
			showFailure(response.msg);
			return false;
		}
		await Promise.all([
			refreshAdministration(),
			queryClient.invalidateQueries({ queryKey: ["system-user-roles", roleUser.id] }),
		]);
		setRoleUser(undefined);
		window.$message?.success(t("system.user.rolesUpdated"));
		return true;
	};

	const columns = useMemo(() => createUserColumns({
		t,
		permissions,
		onView: setDetailUser,
		onEdit: setEditUser,
		onAssignRoles: setRoleUser,
		onResetPassword: setResetUser,
		onForceLogout: setForceLogoutUser,
		onDelete: setDeleteUser,
	}), [permissions.assignRole, permissions.delete, permissions.edit, permissions.forceLogout, permissions.resetPassword, t]);

	const handleTableChange: NonNullable<TableProps<UserItemType>["onChange"]> = (pagination, _filters, sorter) => {
		const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
		const field = String(activeSorter.field ?? "");
		setQuery(current => ({
			...current,
			page: pagination.current ?? 1,
			page_size: pagination.pageSize ?? current.page_size,
			sort: userSortFields.includes(field as UserSortField) ? field as UserSortField : undefined,
			order: activeSorter.order === "ascend" || activeSorter.order === "descend" ? activeSorter.order : undefined,
		}));
	};

	return (
		<BasicContent className="h-full">
			<BasicTable<UserItemType>
				actionRef={undefined}
				adaptive
				columns={columns}
				columnsState={{ persistenceKey: `${import.meta.env.VITE_GLOB_APP_TITLE}:system-users:columns`, persistenceType: "localStorage" }}
				dataSource={usersQuery.data?.items ?? []}
				headerTitle={t("common.menu.user")}
				loading={usersQuery.isFetching}
				locale={usersQuery.isError
					? { emptyText: <Result extra={<BasicButton icon={<ReloadOutlined />} onClick={() => usersQuery.refetch()}>{t("common.retry")}</BasicButton>} status="error" subTitle={usersQuery.error.message} title={t("system.user.loadFailed")} /> }
					: undefined}
				onChange={handleTableChange}
				onReset={() => setQuery(initialQuery)}
				onSizeChange={(size) => {
					if (size) {
						setTableSize(size);
						localStorage.setItem(densityStorageKey, size);
					}
				}}
				onSubmit={values => setQuery(current => ({ ...current, page: 1, keyword: values.keyword || undefined, status: values.status || undefined }))}
				options={{ reload: () => usersQuery.refetch() }}
				pagination={{ current: query.page, pageSize: query.page_size, total: usersQuery.data?.total ?? 0 }}
				search={{ defaultCollapsed: false, labelWidth: "auto" }}
				size={tableSize}
				toolBarRender={() => permissions.add
					? [<BasicButton key="add-user" icon={<PlusOutlined />} type="primary" usage="toolbar" onClick={() => setCreateOpen(true)}>{t("system.user.addUser")}</BasicButton>]
					: []}
			/>

			<CreateUserDrawer loading={createMutation.isPending} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} open={createOpen} />
			<Detail onClose={() => setDetailUser(undefined)} open={Boolean(detailUser)} user={detailUser} />
			<EditUserModal loading={updateMutation.isPending} onClose={() => setEditUser(undefined)} onSubmit={handleUpdate} open={Boolean(editUser)} user={editUser} />
			<RoleAssign loading={bindRolesMutation.isPending} onClose={() => setRoleUser(undefined)} onSubmit={handleBindRoles} open={Boolean(roleUser)} user={roleUser} />
			<ResetPasswordModal loading={resetMutation.isPending} onClose={() => setResetUser(undefined)} onSubmit={handleResetPassword} open={Boolean(resetUser)} user={resetUser} />
			<ResetPasswordResult onClose={() => setResetResult(undefined)} open={Boolean(resetResult)} password={resetResult?.password ?? ""} username={resetResult?.username ?? ""} />
			<ForceLogoutModal loading={forceLogoutMutation.isPending} onClose={() => setForceLogoutUser(undefined)} onSubmit={handleForceLogout} open={Boolean(forceLogoutUser)} user={forceLogoutUser} />
			<DangerConfirmation
				impact={t("system.user.deleteImpact", { username: deleteUser?.username })}
				loading={deleteMutation.isPending}
				onCancel={() => setDeleteUser(undefined)}
				onConfirm={handleDelete}
				open={Boolean(deleteUser)}
				targetName={deleteUser?.username ?? ""}
				title={t("system.user.deleteUser")}
			/>
		</BasicContent>
	);
}
