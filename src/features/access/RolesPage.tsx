import { PlusOutlined } from "@ant-design/icons";
import { ApiProblemError } from "#src/api/client";
import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	Alert,
	Button,
	Checkbox,
	Col,
	Drawer,
	Flex,
	Form,
	Input,
	Modal,
	Space,
	Tag,
	type TableProps,
	theme,
	Tooltip,
	Tree,
	Typography,
} from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";

import { DangerConfirmationModal } from "../../app/DangerConfirmation";
import {
	platformPermissions,
	type PlatformPermission,
} from "../../app/permissions";
import {
	TableActionButton,
	TableActionMenu,
} from "../../app/TableActionButton";
import {
	useQueryFilterLayout,
	useQuerySubmission,
} from "../../app/queryFilterLayout";
import { resolveTableSort } from "../../app/tableSorting";
import { LogQueryPanel, LogTablePanel } from "../operations/LogTablePanel";
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
	type UpdatePlatformRoleInput,
	updatePlatformRole,
} from "#src/api/roles";

const { Text } = Typography;
type PermissionGroupKey =
	"announcements" | "roles" | "users" | "logs" | "settings";
type RenameRoleFormValues = Pick<UpdatePlatformRoleInput, "displayName">;
type RoleSort = NonNullable<ListPlatformRolesInput["sort"]>;

interface RoleFilterValues {
	q?: string;
}

interface RoleTableState {
	order: ListPlatformRolesInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformRolesInput["sort"];
}

const defaultRoleFilterValues: RoleFilterValues = {};
const roleTableSortToContractSort: Record<string, RoleSort> = {
	displayName: "display_name",
	memberCount: "member_count",
	roleKey: "role_key",
};

interface PermissionDefinition {
	groupKey: PermissionGroupKey;
	i18nKey:
		| "announcementsManage"
		| "announcementsRead"
		| "rolesManage"
		| "usersManage"
		| "usersRead"
		| "logsRead"
		| "settingsManage";
	permission: PlatformPermission;
}

const permissionDefinitionByValue = {
	[platformPermissions.announcementsRead]: {
		groupKey: "announcements",
		i18nKey: "announcementsRead",
		permission: platformPermissions.announcementsRead,
	},
	[platformPermissions.announcementsManage]: {
		groupKey: "announcements",
		i18nKey: "announcementsManage",
		permission: platformPermissions.announcementsManage,
	},
	[platformPermissions.rolesManage]: {
		groupKey: "roles",
		i18nKey: "rolesManage",
		permission: platformPermissions.rolesManage,
	},
	[platformPermissions.usersRead]: {
		groupKey: "users",
		i18nKey: "usersRead",
		permission: platformPermissions.usersRead,
	},
	[platformPermissions.usersManage]: {
		groupKey: "users",
		i18nKey: "usersManage",
		permission: platformPermissions.usersManage,
	},
	[platformPermissions.logsRead]: {
		groupKey: "logs",
		i18nKey: "logsRead",
		permission: platformPermissions.logsRead,
	},
	[platformPermissions.settingsManage]: {
		groupKey: "settings",
		i18nKey: "settingsManage",
		permission: platformPermissions.settingsManage,
	},
} satisfies Record<PlatformPermission, PermissionDefinition>;

const permissionGroups = (
	["roles", "users", "announcements", "logs", "settings"] as const
).map((groupKey) => ({
	groupKey,
	permissions: Object.values(permissionDefinitionByValue).filter(
		(definition) => definition.groupKey === groupKey,
	),
}));

const allPermissionValues = Object.keys(
	permissionDefinitionByValue,
) as PlatformPermission[];

const permissionValueSet = new Set<string>(allPermissionValues);

const permissionGroupNodeKeys = permissionGroups.map(
	(group) => `group:${group.groupKey}`,
);

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

function getErrorTitleKey(error: unknown) {
	if (!(error instanceof ApiProblemError)) {
		return "adminShell.roles.errors.request";
	}

	switch (error.status) {
		case 400:
			return "adminShell.roles.errors.invalid";
		case 403:
			return "adminShell.roles.errors.forbidden";
		case 409:
			return "adminShell.roles.errors.conflict";
		default:
			return "adminShell.roles.errors.request";
	}
}

function isApiProblemStatus(error: unknown, status: number) {
	return error instanceof ApiProblemError && error.status === status;
}

export function RolesPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
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
	const {
		canExpand: canExpandFilters,
		columnSpan: queryFilterSpan,
		containerRef: queryFilterContainerRef,
		formLayout: queryFilterLayout,
		submitterOffset: queryFilterSubmitterOffset,
	} = useQueryFilterLayout({ expanded: false, fieldCount: 1 });
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
	const pageError = rolesQuery.error;
	const renameConflict = isApiProblemStatus(renameMutation.error, 409);
	const permissionForbidden = isApiProblemStatus(permissionMutation.error, 403);
	const [expandedPermissionKeys, setExpandedPermissionKeys] = useState<
		string[]
	>(permissionGroupNodeKeys);
	const permissionTreeData = useMemo(
		() =>
			permissionGroups.map((group) => ({
				children: group.permissions.map((definition) => ({
					key: definition.permission,
					title: (
						<Tooltip
							title={t(
								`adminShell.roles.permissions.items.${definition.i18nKey}.description`,
							)}
						>
							<span>
								{t(
									`adminShell.roles.permissions.items.${definition.i18nKey}.name`,
								)}
							</span>
						</Tooltip>
					),
				})),
				key: `group:${group.groupKey}`,
				title: t(`adminShell.roles.permissions.groups.${group.groupKey}`),
			})),
		[t],
	);
	const applyPermissionSelection = (
		nextKeys: Array<bigint | number | string>,
	) => {
		if (!permissionRole) {
			return;
		}
		const nextLeaves = nextKeys
			.map(String)
			.filter((key) => permissionValueSet.has(key)) as PlatformPermission[];
		const nextSet = new Set<string>(nextLeaves);
		const currentSet = new Set<string>(permissionRole.permissions);
		for (const permission of nextLeaves) {
			if (!currentSet.has(permission)) {
				permissionMutation.mutate({
					granted: true,
					permission,
					roleId: permissionRole.id,
				});
			}
		}
		for (const permission of permissionRole.permissions) {
			if (!nextSet.has(permission)) {
				permissionMutation.mutate({
					granted: false,
					permission,
					roleId: permissionRole.id,
				});
			}
		}
	};
	const grantedPermissionCount = permissionRole?.permissions.length ?? 0;
	const allPermissionsGranted =
		grantedPermissionCount > 0 &&
		grantedPermissionCount === allPermissionValues.length;
	const somePermissionsGranted =
		grantedPermissionCount > 0 && !allPermissionsGranted;
	const allPermissionGroupsExpanded =
		expandedPermissionKeys.length === permissionGroupNodeKeys.length;
	const reloadRolesAfterConflict = () => {
		renameMutation.reset();
		setRenamingRole(null);
		void rolesQuery.refetch();
	};
	const columns = useMemo<
		NonNullable<TableProps<PlatformRole>["columns"]>
	>(() => {
		const sortOrder = (column: RoleSort) =>
			tableState.sort === column && tableState.order
				? tableState.order === "asc"
					? "ascend"
					: "descend"
				: null;

		return [
			{
				dataIndex: "displayName",
				key: "displayName",
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("display_name"),
				title: t("adminShell.roles.columns.displayName"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "roleKey",
				key: "roleKey",
				render: (roleKey: string) => <Text code>{roleKey}</Text>,
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("role_key"),
				title: t("adminShell.roles.columns.roleKey"),
				width: token.controlHeight * 5,
			},
			{
				align: "right",
				dataIndex: "memberCount",
				key: "memberCount",
				render: (memberCount?: number) => memberCount ?? 0,
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("member_count"),
				title: t("adminShell.roles.columns.memberCount"),
				width: token.controlHeight * 4,
			},
			{
				key: "permissions",
				render: (_: unknown, role: PlatformRole) => {
					const summaries = permissionGroups
						.map((group) => ({
							count: group.permissions.filter((definition) =>
								role.permissions.includes(definition.permission),
							).length,
							groupKey: group.groupKey,
						}))
						.filter((summary) => summary.count > 0);

					return summaries.length > 0 ? (
						<Space size={token.marginXXS} style={{ whiteSpace: "nowrap" }}>
							{summaries.map((summary) => (
								<Tag key={summary.groupKey}>
									{t(`adminShell.roles.permissions.groups.${summary.groupKey}`)}{" "}
									{summary.count}
								</Tag>
							))}
						</Space>
					) : (
						<Text type="secondary">
							{t("adminShell.roles.permissions.notConfigured")}
						</Text>
					);
				},
				title: t("adminShell.roles.columns.permissions"),
				width: token.controlHeight * 14,
			},
			{
				key: "actions",
				render: (_: unknown, role: PlatformRole) => {
					const isBuiltIn = role.roleKey === "super-admin";

					return (
						<Space size="medium">
							<TableActionButton
								disabled={renameMutation.isPending}
								onClick={() => {
									renameMutation.reset();
									renameForm.setFieldsValue({ displayName: role.displayName });
									setRenamingRole(role);
								}}
							>
								{t("adminShell.roles.rename")}
							</TableActionButton>
							<TableActionMenu
								items={[
									{
										key: "permissions",
										label: t("adminShell.roles.configurePermissions"),
										onClick: () => {
											permissionMutation.reset();
											setPermissionRoleId(role.id);
										},
									},
									{
										danger: true,
										disabled: isBuiltIn || deleteMutation.isPending,
										key: "delete",
										label: isBuiltIn ? (
											<Tooltip
												title={t("adminShell.roles.builtInDeleteReason")}
											>
												<span>{t("adminShell.roles.delete")}</span>
											</Tooltip>
										) : (
											t("adminShell.roles.delete")
										),
										onClick: () => {
											deleteMutation.reset();
											setDeletingRole(role);
										},
									},
								]}
								label={t("adminShell.tableActions.more")}
							/>
						</Space>
					);
				},
				title: t("adminShell.roles.columns.actions"),
				width: token.controlHeight * 4,
			},
		];
	}, [
		deleteMutation,
		permissionMutation,
		renameForm,
		renameMutation,
		tableState.order,
		tableState.sort,
		t,
		token.controlHeight,
		token.marginXXS,
	]);
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

	return (
		<>
			{deletingRole ? (
				<DangerConfirmationModal
					cancelText={t("adminShell.roles.cancel")}
					confirmText={t("adminShell.roles.confirmDelete")}
					feedback={
						deleteMutation.isError ? (
							<Alert
								description={
									getProblemDetail(deleteMutation.error) ??
									t("adminShell.roles.errors.fallback")
								}
								showIcon
								title={t(getErrorTitleKey(deleteMutation.error))}
								type="error"
							/>
						) : undefined
					}
					impact={
						<Flex gap={token.marginXXS} vertical>
							<Text>
								{t("adminShell.roles.deleteMemberDescription", {
									count: deletingRole.memberCount ?? 0,
								})}
							</Text>
							<Text type="secondary">
								{t("adminShell.roles.deleteDescription", {
									name: deletingRole.displayName,
								})}
							</Text>
						</Flex>
					}
					loading={deleteMutation.isPending}
					onCancel={() => {
						deleteMutation.reset();
						setDeletingRole(null);
					}}
					onConfirm={() => deleteMutation.mutate(deletingRole.id)}
					targetName={deletingRole.displayName}
					title={t("adminShell.roles.deleteTitle")}
				/>
			) : null}

			<Modal
				cancelText={t("adminShell.roles.cancel")}
				confirmLoading={createMutation.isPending}
				destroyOnHidden
				okText={t("adminShell.roles.create")}
				onCancel={() => {
					createMutation.reset();
					setCreateOpen(false);
				}}
				onOk={() => createForm.submit()}
				open={createOpen}
				title={t("adminShell.roles.createTitle")}
			>
				<Flex gap={token.margin} vertical>
					{createMutation.isError ? (
						<Alert
							description={
								getProblemDetail(createMutation.error) ??
								t("adminShell.roles.errors.fallback")
							}
							showIcon
							title={t(getErrorTitleKey(createMutation.error))}
							type="error"
						/>
					) : null}
					<Form<CreatePlatformRoleInput>
						form={createForm}
						layout="vertical"
						onFinish={(values) => createMutation.mutate(values)}
					>
						<Form.Item
							label={t("adminShell.roles.fields.displayName")}
							name="displayName"
							rules={[
								{
									max: 128,
									required: true,
									whitespace: true,
								},
							]}
						>
							<Input
								autoComplete="off"
								placeholder={t("adminShell.roles.placeholders.displayName")}
							/>
						</Form.Item>
						<Form.Item
							label={t("adminShell.roles.fields.roleKey")}
							name="roleKey"
							rules={[
								{
									max: 63,
									min: 2,
									pattern: /^[a-z][a-z0-9-]*$/,
									required: true,
								},
							]}
						>
							<Input
								autoComplete="off"
								placeholder={t("adminShell.roles.placeholders.roleKey")}
							/>
						</Form.Item>
					</Form>
				</Flex>
			</Modal>

			<Modal
				cancelText={t("adminShell.roles.cancel")}
				confirmLoading={renameMutation.isPending}
				destroyOnHidden
				okButtonProps={{ disabled: renameConflict }}
				okText={t("adminShell.roles.save")}
				onCancel={() => {
					renameMutation.reset();
					setRenamingRole(null);
				}}
				onOk={() => renameForm.submit()}
				open={renamingRole !== null}
				title={t("adminShell.roles.renameTitle", {
					name: renamingRole?.displayName,
				})}
			>
				<Flex gap={token.margin} vertical>
					{renameMutation.isError ? (
						<Alert
							action={
								renameConflict ? (
									<Button onClick={reloadRolesAfterConflict} size="small">
										{t("optimisticLock.reload")}
									</Button>
								) : undefined
							}
							description={
								renameConflict
									? t("optimisticLock.description")
									: (getProblemDetail(renameMutation.error) ??
										t("adminShell.roles.errors.fallback"))
							}
							showIcon
							title={
								renameConflict
									? t("optimisticLock.title")
									: t(getErrorTitleKey(renameMutation.error))
							}
							type="error"
						/>
					) : null}
					<Form<RenameRoleFormValues>
						form={renameForm}
						layout="vertical"
						onFinish={(values) => {
							if (!renamingRole || renamingRole.version === undefined) {
								void rolesQuery.refetch();
								return;
							}
							renameMutation.mutate({
								input: {
									...values,
									expectedVersion: renamingRole.version,
								},
								roleId: renamingRole.id,
							});
						}}
					>
						<Form.Item
							label={t("adminShell.roles.fields.displayName")}
							name="displayName"
							rules={[
								{
									max: 128,
									required: true,
									whitespace: true,
								},
							]}
						>
							<Input
								autoComplete="off"
								placeholder={t("adminShell.roles.placeholders.displayName")}
							/>
						</Form.Item>
					</Form>
				</Flex>
			</Modal>

			<Drawer
				destroyOnHidden
				onClose={() => {
					permissionMutation.reset();
					setPermissionRoleId(null);
				}}
				open={permissionRoleId !== null}
				title={t("adminShell.roles.permissionDrawerTitle", {
					name: permissionRole?.displayName,
				})}
			>
				{permissionRole ? (
					<Flex gap={token.marginSM} vertical>
						{permissionMutation.isError ? (
							<Alert
								closable
								description={
									getProblemDetail(permissionMutation.error) ??
									t(
										permissionForbidden
											? "adminShell.roles.errors.permissionForbiddenDescription"
											: "adminShell.roles.errors.fallback",
									)
								}
								onClose={() => permissionMutation.reset()}
								showIcon
								title={t(
									permissionForbidden
										? "adminShell.roles.errors.permissionForbidden"
										: getErrorTitleKey(permissionMutation.error),
								)}
								type="error"
							/>
						) : null}
						<Flex gap={token.marginSM} justify="space-between" wrap>
							<Checkbox
								checked={allPermissionGroupsExpanded}
								onChange={(event) =>
									setExpandedPermissionKeys(
										event.target.checked ? permissionGroupNodeKeys : [],
									)
								}
							>
								{t("adminShell.roles.permissions.expandAll")}
							</Checkbox>
							<Checkbox
								checked={allPermissionsGranted}
								disabled={permissionMutation.isPending}
								indeterminate={somePermissionsGranted}
								onChange={(event) =>
									applyPermissionSelection(
										event.target.checked ? allPermissionValues : [],
									)
								}
							>
								{t("adminShell.roles.permissions.selectAll")}
							</Checkbox>
						</Flex>
						<Tree
							checkable
							checkedKeys={permissionRole.permissions}
							disabled={permissionMutation.isPending}
							expandedKeys={expandedPermissionKeys}
							onCheck={(checked) =>
								applyPermissionSelection(
									Array.isArray(checked) ? checked : checked.checked,
								)
							}
							onExpand={(keys) => setExpandedPermissionKeys(keys.map(String))}
							selectable={false}
							treeData={permissionTreeData}
						/>
					</Flex>
				) : null}
			</Drawer>

			<Flex gap={token.marginLG} vertical>
				{pageError ? (
					<Alert
						action={
							rolesQuery.isError ? (
								<Button onClick={() => void rolesQuery.refetch()} size="small">
									{t("adminShell.roles.retry")}
								</Button>
							) : undefined
						}
						closable={!rolesQuery.isError}
						description={
							getProblemDetail(pageError) ??
							t("adminShell.roles.errors.fallback")
						}
						onClose={() => {
							deleteMutation.reset();
						}}
						showIcon
						title={t(getErrorTitleKey(pageError))}
						type="error"
					/>
				) : null}
				<LogTablePanel<PlatformRole>
					columns={columns}
					dataSource={rolesQuery.data?.items ?? []}
					description={
						<Flex align="baseline" gap={token.marginXS} wrap>
							<Text type="secondary">{t("adminShell.roles.memberGuide")}</Text>
							<RouterLink to="/organization/users">
								{t("adminShell.roles.memberGuideLink")}
							</RouterLink>
						</Flex>
					}
					emptyText={t("adminShell.roles.empty")}
					error={undefined}
					initialLoading={rolesQuery.isPending}
					minimumWidth={token.controlHeight * 39}
					onPageChange={(page, pageSize) =>
						setTableState((current) => ({ ...current, page, pageSize }))
					}
					onReload={() => void rolesQuery.refetch()}
					onTableChange={handleTableChange}
					page={tableState.page}
					pageSize={tableState.pageSize}
					primaryAction={
						<Button
							icon={<PlusOutlined aria-hidden />}
							onClick={() => {
								createMutation.reset();
								setCreateOpen(true);
							}}
							type="primary"
						>
							{t("adminShell.roles.create")}
						</Button>
					}
					queryPanel={
						<LogQueryPanel<RoleFilterValues>
							actionsTestId="admin-roles-query-actions"
							canExpand={canExpandFilters}
							columnSpan={queryFilterSpan}
							containerRef={queryFilterContainerRef}
							expanded={false}
							form={filterForm}
							formLayout={queryFilterLayout}
							initialValues={defaultRoleFilterValues}
							loading={rolesQuery.isFetching && !rolesQuery.isPending}
							onFinish={queryRoles}
							onReset={resetRoleFilters}
							onToggle={() => undefined}
							submitterOffset={queryFilterSubmitterOffset}
							testId="admin-roles-query-form"
						>
							<Col span={queryFilterSpan}>
								<Form.Item
									label={t("adminShell.roles.filters.q")}
									style={{ marginBottom: 0 }}
								>
									<Input
										allowClear
										onChange={(event) =>
											setDraftFilters({ q: event.target.value })
										}
										placeholder={t("adminShell.roles.placeholders.q")}
										style={{ width: "100%" }}
										value={draftFilters.q}
									/>
								</Form.Item>
							</Col>
						</LogQueryPanel>
					}
					refreshing={rolesQuery.isFetching && !rolesQuery.isPending}
					testId="admin-roles-table-card"
					title={t("adminShell.roles.tableTitle")}
					total={rolesQuery.data?.total ?? 0}
					workspaceTestId="admin-roles-table-workspace"
				/>
			</Flex>
		</>
	);
}
