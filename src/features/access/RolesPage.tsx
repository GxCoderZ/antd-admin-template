import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Form, type TableProps } from "antd";
import { useMemo, useState } from "react";

import {
	resolveTableSort,
	tableSortStateVersion,
} from "../../app/tableSorting";
import { useQuerySubmission } from "../../app/queryFilterLayout";
import { useRouteSessionState } from "../../app/routeSessionState";
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
import { RoleDetailDrawer } from "./components/RoleDetailDrawer";
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
const rolesRouteKey = "/access/roles";
const defaultRoleTableState: RoleTableState = {
	order: undefined,
	page: 1,
	pageSize: 20,
	sort: undefined,
};
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
	const [renameForm] = Form.useForm<RenameRoleFormValues>();
	const [createOpen, setCreateOpen] = useState(false);
	const [renamingRole, setRenamingRole] = useState<PlatformRole | null>(null);
	const [viewingRole, setViewingRole] = useState<PlatformRole | null>(null);
	const [deletingRole, setDeletingRole] = useState<PlatformRole | null>(null);
	const [permissionRoleId, setPermissionRoleId] = useState<string | null>(null);
	const [draftFilters, setDraftFilters] =
		useRouteSessionState<RoleFilterValues>({
			initialState: defaultRoleFilterValues,
			routeKey: rolesRouteKey,
			stateKey: "query-draft",
		});
	const [filters, setFilters] = useRouteSessionState<RoleFilterValues>({
		initialState: defaultRoleFilterValues,
		routeKey: rolesRouteKey,
		stateKey: "query-applied",
	});
	const [tableState, setTableState] = useRouteSessionState<RoleTableState>({
		initialState: defaultRoleTableState,
		routeKey: rolesRouteKey,
		stateKey: "table",
		version: tableSortStateVersion,
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

	const queryRoles = (nextFilters: RoleFilterValues) => {
		setDraftFilters(nextFilters);
		setFilters(nextFilters);
		setTableState((current) => ({ ...current, page: 1 }));
		querySubmission.submit();
	};
	const resetRoleFilters = () => {
		setDraftFilters(defaultRoleFilterValues);
		setFilters(defaultRoleFilterValues);
		setTableState((current) => ({
			...current,
			order: undefined,
			page: 1,
			sort: undefined,
		}));
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
			<RoleDetailDrawer
				onClose={() => setViewingRole(null)}
				role={viewingRole}
			/>
			<RolePermissionDrawer
				error={permissionMutation.error}
				forbidden={permissionForbidden}
				key={permissionRole?.id ?? "closed"}
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
				onView={setViewingRole}
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
