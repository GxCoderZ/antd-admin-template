import type { UserCreateReq, UserItemType, UserListReq, UserSortField, UserStatus, UserUpdateReq } from "#src/api/system/user";
import type { TableProps } from "antd";

import {
	fetchBindUserRoles,
	fetchCreateUser,
	fetchForceLogoutUser,
	fetchResetUserPassword,
	fetchUpdateUser,
	fetchUserList,
} from "#src/api/system/user";
import { BasicButton } from "#src/components/basic-button";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { DataTableSkeleton } from "#src/components/loading-skeletons";
import { QueryFilterPanel } from "#src/components/query-filter-panel";
import { usePermission } from "#src/hooks/use-permission";
import { useUserStore } from "#src/store/user";

import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, ConfigProvider, Flex, Form, theme } from "antd";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { CreateUserDrawer } from "./components/create-user-drawer";
import { Detail } from "./components/detail";
import { EditUserModal } from "./components/edit-user-modal";
import { ForceLogoutModal } from "./components/force-logout-modal";
import { ResetPasswordModal } from "./components/reset-password-modal";
import { ResetPasswordResult } from "./components/reset-password-result";
import { RoleAssign } from "./components/role-assign";
import { createUserColumns, createUserSearchFields } from "./constants";

type TableSize = "large" | "middle" | "small";

const initialQuery: UserListReq = { page: 1, page_size: 10, sort: "created_at", order: "descend" };
const userSortFields: UserSortField[] = ["username", "display_name", "email", "status", "created_at"];

export default function User() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const currentUserId = useUserStore(state => state.id);
	const [searchParams] = useSearchParams();
	const roleId = Number(searchParams.get("role_id")) || undefined;
	const [filterForm] = Form.useForm();
	const [query, setQuery] = useState<UserListReq>(initialQuery);
	const [createOpen, setCreateOpen] = useState(false);
	const [detailUser, setDetailUser] = useState<UserItemType>();
	const [editUser, setEditUser] = useState<UserItemType>();
	const [roleUser, setRoleUser] = useState<UserItemType>();
	const [resetUser, setResetUser] = useState<UserItemType>();
	const [forceLogoutUser, setForceLogoutUser] = useState<UserItemType>();
	const [resetResult, setResetResult] = useState<{ password: string, username: string }>();
	const workspaceRef = useRef<HTMLDivElement>(null);
	const subscribeFullscreen = useCallback((callback: () => void) => {
		document.addEventListener("fullscreenchange", callback);
		return () => document.removeEventListener("fullscreenchange", callback);
	}, []);
	const getFullscreenSnapshot = useCallback(() => document.fullscreenElement === workspaceRef.current, []);
	const isFullscreen = useSyncExternalStore(subscribeFullscreen, getFullscreenSnapshot, () => false);
	const densityStorageKey = `${import.meta.env.VITE_GLOB_APP_TITLE}:system-users:density`;
	const [tableSize, setTableSize] = useState<TableSize>(() => {
		const stored = localStorage.getItem(densityStorageKey);
		return stored === "small" || stored === "large" ? stored : "middle";
	});

	const permissions = {
		add: usePermission("system:user:add"),
		edit: usePermission("system:user:edit"),
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
		currentUserId,
		permissions,
		onView: setDetailUser,
		onEdit: setEditUser,
		onAssignRoles: setRoleUser,
		onResetPassword: setResetUser,
		onForceLogout: setForceLogoutUser,
	}), [currentUserId, permissions.assignRole, permissions.edit, permissions.forceLogout, permissions.resetPassword, t]);
	const searchFields = useMemo(() => createUserSearchFields(t), [t]);

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

	const resetFilters = () => {
		filterForm.resetFields();
		setQuery(initialQuery);
	};

	const toggleFullscreen = async () => {
		if (document.fullscreenElement === workspaceRef.current)
			await document.exitFullscreen?.();
		else
			await workspaceRef.current?.requestFullscreen?.();
	};

	return (
		<BasicContent className="h-full">
			<ConfigProvider getPopupContainer={() => isFullscreen ? (workspaceRef.current ?? document.body) : document.body}>
				<Flex
					data-testid="admin-users-table-workspace"
					gap={token.marginLG}
					ref={workspaceRef}
					style={isFullscreen
						? { background: token.colorBgLayout, boxSizing: "border-box", height: "100%", overflow: "auto", padding: token.paddingLG }
						: undefined}
					vertical
				>
					{usersQuery.isError && (
						<Alert
							action={<BasicButton icon={<ReloadOutlined />} onClick={() => usersQuery.refetch()}>{t("common.retry")}</BasicButton>}
							description={usersQuery.error.message}
							message={t("system.user.loadFailed")}
							showIcon
							type="error"
						/>
					)}
					<QueryFilterPanel
						fields={searchFields}
						form={filterForm}
						loading={usersQuery.isFetching && !usersQuery.isLoading}
						onFinish={values => setQuery(current => ({
							...current,
							keyword: typeof values.keyword === "string" && values.keyword ? values.keyword : undefined,
							page: 1,
							status: values.status as UserStatus | undefined,
						}))}
						onReset={resetFilters}
					/>

					<BasicTable<UserItemType>
						columns={columns}
						columnsState={{ persistenceKey: `${import.meta.env.VITE_GLOB_APP_TITLE}:system-users:columns:v2`, persistenceType: "localStorage" }}
						dataSource={usersQuery.data?.items ?? []}
						headerTitle={t("common.menu.user")}
						loading={usersQuery.isFetching && !usersQuery.isLoading}
						onChange={handleTableChange}
						onSizeChange={(size) => {
							if (size) {
								setTableSize(size);
								localStorage.setItem(densityStorageKey, size);
							}
						}}
						options={{ fullScreen: toggleFullscreen, reload: () => usersQuery.refetch() }}
						pagination={{ current: query.page, pageSize: query.page_size, total: usersQuery.data?.total ?? 0 }}
						search={false}
						size={tableSize}
						tableRender={(_, defaultDom) => usersQuery.isLoading
							? <DataTableSkeleton columnCount={columns.length} minimumWidth={1190} />
							: defaultDom}
						toolBarRender={() => permissions.add
							? [<BasicButton key="add-user" icon={<PlusOutlined />} type="primary" usage="toolbar" onClick={() => setCreateOpen(true)}>{t("system.user.addUser")}</BasicButton>]
							: []}
					/>
				</Flex>
			</ConfigProvider>

			{createOpen && <CreateUserDrawer loading={createMutation.isPending} onClose={() => setCreateOpen(false)} onSubmit={handleCreate} open />}
			<Detail onClose={() => setDetailUser(undefined)} open={Boolean(detailUser)} user={detailUser} />
			{editUser && <EditUserModal loading={updateMutation.isPending} onClose={() => setEditUser(undefined)} onSubmit={handleUpdate} open user={editUser} />}
			<RoleAssign loading={bindRolesMutation.isPending} onClose={() => setRoleUser(undefined)} onSubmit={handleBindRoles} open={Boolean(roleUser)} user={roleUser} />
			{resetUser && <ResetPasswordModal loading={resetMutation.isPending} onClose={() => setResetUser(undefined)} onSubmit={handleResetPassword} open user={resetUser} />}
			<ResetPasswordResult onClose={() => setResetResult(undefined)} open={Boolean(resetResult)} password={resetResult?.password ?? ""} username={resetResult?.username ?? ""} />
			<ForceLogoutModal loading={forceLogoutMutation.isPending} onClose={() => setForceLogoutUser(undefined)} onSubmit={handleForceLogout} open={Boolean(forceLogoutUser)} user={forceLogoutUser} />
		</BasicContent>
	);
}
