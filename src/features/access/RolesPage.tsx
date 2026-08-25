import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Form, type TableProps } from "antd";
import { useMemo, useState } from "react";

import { resolveTableSort } from "../../app/tableSorting";
import { useQuerySubmission } from "../../app/queryFilterLayout";
import { platformSessionQueryKey } from "#src/api/auth";
import {
	createPlatformRole,
	deletePlatformRole,
	listPlatformRolePage,
	platformRolesQueryKey,
	setPlatformRolePermission,
	type CreatePlatformRoleInput,
	type ListPlatformRolesInput,
	type PlatformRole,
	updatePlatformRole,
} from "#src/api/roles";
import {
	CreateRoleModal,
	DeleteRoleModal,
	RenameRoleModal,
	type RenameRoleFormValues,
} from "./components/RoleDialogs";
import { RolePermissionDrawer } from "./components/RolePermissionDrawer";
import {
	RoleTablePanel,
	type RoleFilterValues,
} from "./components/RoleTablePanel";
import { isRoleProblemStatus } from "./roleProblems";

interface RoleTableState {
	order: ListPlatformRolesInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformRolesInput["sort"];
}

const defaultRoleFilterValues: RoleFilterValues = {};
const roleTableSortToContractSort: Record<
	string,
	NonNullable<ListPlatformRolesInput["sort"]>
> = {
	displayName: "display_name",
	memberCount: "member_count",
	roleKey: "role_key",
};

export function RolesPage() {
	const queryClient = useQueryClient();
	const [createForm] = Form.useForm<CreatePlatformRoleInput>();
	const [filterForm] = Form.useForm<RoleFilterValues>();
	const [renameForm] = Form.useForm<RenameRoleFormValues>();
	const [createOpen, setCreateOpen] = useState(false);
	const [renamingRole, setRenamingRole] = useState<PlatformRole | null>(null);
	const [deletingRole, setDeletingRole] = useState<PlatformRole | null>(null);
	const [permissionRoleId, setPermissionRoleId] = useState<string | null>(null);
	const [draftFilters, setDraftFilters] = useState<RoleFilterValues>(
		defaultRoleFilterValues,
	);
	const [filters, setFilters] = useState<RoleFilterValues>(
		defaultRoleFilterValues,
	);
	const [tableState, setTableState] = useState<RoleTableState>({
		order: "asc",
		page: 1,
		pageSize: 20,
		sort: "role_key",
	});
	const querySubmission = useQuerySubmission();
	const queryParams = useMemo<ListPlatformRolesInput>(() => {
		const q = filters.q?.trim();
		return {
			page: tableState.page,
			pageSize: tableState.pageSize,
			...(tableState.order && tableState.sort
				? { order: tableState.order, sort: tableState.sort }
				: {}),
			...(q ? { q } : {}),
		};
	}, [filters.q, tableState]);
	const rolesQuery = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) => listPlatformRolePage(queryParams, signal),
		queryKey: [
			...platformRolesQueryKey,
			"page",
			queryParams,
			querySubmission.revision,
		],
	});
	const permissionRole =
		rolesQuery.data?.items.find((role) => role.id === permissionRoleId) ?? null;
	const refreshRoles = () =>
		queryClient.invalidateQueries({ queryKey: platformRolesQueryKey });
	const refreshRolesAndAuthorization = () =>
		Promise.all([
			refreshRoles(),
			queryClient.invalidateQueries({ queryKey: platformSessionQueryKey }),
		]);
	const createMutation = useMutation({
		mutationFn: createPlatformRole,
		onSuccess: async () => {
			await refreshRoles();
			setCreateOpen(false);
			createForm.resetFields();
		},
	});
	const deleteMutation = useMutation({
		mutationFn: deletePlatformRole,
		onSuccess: async () => {
			await refreshRolesAndAuthorization();
			setDeletingRole(null);
		},
	});
	const renameMutation = useMutation({
		mutationFn: updatePlatformRole,
		onSuccess: async () => {
			await refreshRoles();
			setRenamingRole(null);
			renameForm.resetFields();
		},
	});
	const permissionMutation = useMutation({
		mutationFn: setPlatformRolePermission,
		onSuccess: refreshRolesAndAuthorization,
	});
	const renameConflict = isRoleProblemStatus(renameMutation.error, 409);
	const permissionForbidden = isRoleProblemStatus(
		permissionMutation.error,
		403,
	);

	const queryRoles = () => {
		setFilters(draftFilters);
		setTableState((current) => ({ ...current, page: 1 }));
		querySubmission.submit();
	};
	const resetRoleFilters = () => {
		setDraftFilters(defaultRoleFilterValues);
		setFilters(defaultRoleFilterValues);
		setTableState((current) => ({ ...current, page: 1 }));
		querySubmission.submit();
	};
	const handleTableChange: TableProps<PlatformRole>["onChange"] = (
		_pagination,
		_filters,
		sorter,
		extra,
	) => {
		if (extra.action !== "sort") {
			return;
		}
		const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter;
		const nextSorting = resolveTableSort(
			currentSorter?.columnKey,
			currentSorter?.order,
			roleTableSortToContractSort,
		);
		setTableState((current) => ({
			...current,
			order: nextSorting.order,
			page: 1,
			sort: nextSorting.sort,
		}));
	};
	const submitRoleRename = (values: RenameRoleFormValues) => {
		if (!renamingRole || renamingRole.version === undefined) {
			void rolesQuery.refetch();
			return;
		}
		renameMutation.mutate({
			input: { ...values, expectedVersion: renamingRole.version },
			roleId: renamingRole.id,
		});
	};

	return (
		<>
			<DeleteRoleModal
				error={deleteMutation.error}
				loading={deleteMutation.isPending}
				onCancel={() => {
					deleteMutation.reset();
					setDeletingRole(null);
				}}
				onConfirm={() => {
					if (deletingRole) {
						deleteMutation.mutate(deletingRole.id);
					}
				}}
				role={deletingRole}
			/>
			<CreateRoleModal
				error={createMutation.error}
				form={createForm}
				loading={createMutation.isPending}
				onCancel={() => {
					createMutation.reset();
					setCreateOpen(false);
				}}
				onSubmit={(values) => createMutation.mutate(values)}
				open={createOpen}
			/>
			<RenameRoleModal
				conflict={renameConflict}
				error={renameMutation.error}
				form={renameForm}
				loading={renameMutation.isPending}
				onCancel={() => {
					renameMutation.reset();
					setRenamingRole(null);
				}}
				onReloadConflict={() => {
					renameMutation.reset();
					setRenamingRole(null);
					void rolesQuery.refetch();
				}}
				onSubmit={submitRoleRename}
				role={renamingRole}
			/>
			<RolePermissionDrawer
				error={permissionMutation.error}
				forbidden={permissionForbidden}
				loading={permissionMutation.isPending}
				onChange={(permission, granted) => {
					if (permissionRole) {
						permissionMutation.mutate({
							granted,
							permission,
							roleId: permissionRole.id,
						});
					}
				}}
				onClose={() => {
					permissionMutation.reset();
					setPermissionRoleId(null);
				}}
				onDismissError={() => permissionMutation.reset()}
				open={permissionRoleId !== null}
				role={permissionRole}
			/>
			<RoleTablePanel
				data={rolesQuery.data?.items ?? []}
				deletePending={deleteMutation.isPending}
				draftFilters={draftFilters}
				error={rolesQuery.error}
				filterForm={filterForm}
				initialLoading={rolesQuery.isPending}
				onConfigurePermissions={(role) => {
					permissionMutation.reset();
					setPermissionRoleId(role.id);
				}}
				onCreate={() => {
					createMutation.reset();
					setCreateOpen(true);
				}}
				onDelete={(role) => {
					deleteMutation.reset();
					setDeletingRole(role);
				}}
				onDraftFiltersChange={setDraftFilters}
				onPageChange={(page, pageSize) =>
					setTableState((current) => ({ ...current, page, pageSize }))
				}
				onQuery={queryRoles}
				onReload={() => void rolesQuery.refetch()}
				onRename={(role) => {
					renameMutation.reset();
					renameForm.setFieldsValue({ displayName: role.displayName });
					setRenamingRole(role);
				}}
				onResetFilters={resetRoleFilters}
				onTableChange={handleTableChange}
				page={tableState.page}
				pageSize={tableState.pageSize}
				refreshing={rolesQuery.isFetching && !rolesQuery.isPending}
				roleOrder={tableState.order}
				roleSort={tableState.sort}
				renamePending={renameMutation.isPending}
				total={rolesQuery.data?.total ?? 0}
			/>
		</>
	);
}
