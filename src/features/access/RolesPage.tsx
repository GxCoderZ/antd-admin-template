import {
	EditOutlined,
	EyeOutlined,
	PlusOutlined,
	SafetyCertificateOutlined,
} from "@ant-design/icons";
import { ApiProblemError } from "#src/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Card,
	Checkbox,
	Descriptions,
	Drawer,
	Flex,
	Form,
	Grid,
	Input,
	Modal,
	Space,
	Table,
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
import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import {
	platformPermissions,
	type PlatformPermission,
} from "../../app/permissions";
import { TableActionButton } from "../../app/TableActionButton";
import { TableColumnSettings } from "../../app/TableColumnSettings";
import { platformSessionQueryKey } from "#src/api/auth";
import {
	createPlatformRole,
	deletePlatformRole,
	listPlatformRoles,
	platformRolesQueryKey,
	setPlatformRolePermission,
	type CreatePlatformRoleInput,
	type PlatformRole,
	type UpdatePlatformRoleInput,
	updatePlatformRole,
} from "#src/api/roles";

const { Link, Text } = Typography;
type PermissionGroupKey = "roles" | "users" | "logs" | "settings";
type RenameRoleFormValues = Pick<UpdatePlatformRoleInput, "displayName">;

const roleColumnKeys = [
	"id",
	"displayName",
	"roleKey",
	"builtIn",
	"memberCount",
	"permissions",
	"createdAt",
	"updatedAt",
	"version",
	"actions",
] as const;
const defaultVisibleRoleColumnKeys: RoleColumnKey[] = [
	"displayName",
	"roleKey",
	"builtIn",
	"memberCount",
	"actions",
];
const requiredRoleColumnKeys: RoleColumnKey[] = [
	"displayName",
	"roleKey",
	"actions",
];

type RoleColumnKey = (typeof roleColumnKeys)[number];

interface PermissionDefinition {
	groupKey: PermissionGroupKey;
	i18nKey:
		"rolesManage" | "usersManage" | "usersRead" | "logsRead" | "settingsManage";
	permission: PlatformPermission;
}

const permissionDefinitionByValue = {
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

const permissionGroups = (["roles", "users", "logs", "settings"] as const).map(
	(groupKey) => ({
		groupKey,
		permissions: Object.values(permissionDefinitionByValue).filter(
			(definition) => definition.groupKey === groupKey,
		),
	}),
);

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
	const screens = Grid.useBreakpoint();
	const queryClient = useQueryClient();
	const formatPreferences = useLocalePreferences();
	const [createForm] = Form.useForm<CreatePlatformRoleInput>();
	const [renameForm] = Form.useForm<RenameRoleFormValues>();
	const [createOpen, setCreateOpen] = useState(false);
	const [renamingRole, setRenamingRole] = useState<PlatformRole | null>(null);
	const [deletingRole, setDeletingRole] = useState<PlatformRole | null>(null);
	const [viewingRole, setViewingRole] = useState<PlatformRole | null>(null);
	const [permissionRoleId, setPermissionRoleId] = useState<string | null>(null);
	const [visibleRoleColumnKeys, setVisibleRoleColumnKeys] = useState<
		RoleColumnKey[]
	>(defaultVisibleRoleColumnKeys);
	const rolesQuery = useQuery({
		queryFn: ({ signal }) => listPlatformRoles(signal),
		queryKey: platformRolesQueryKey,
	});
	const permissionRole =
		rolesQuery.data?.find((role) => role.id === permissionRoleId) ?? null;
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
	const columns = useMemo<NonNullable<TableProps<PlatformRole>["columns"]>>(
		() => [
			{
				dataIndex: "id",
				key: "id",
				render: (id: string) => <Text code>{id}</Text>,
				title: t("adminShell.roles.columns.id"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "displayName",
				key: "displayName",
				render: (displayName: string, role: PlatformRole) => (
					<Link
						href="#role-details"
						onClick={(event) => {
							event.preventDefault();
							setViewingRole(role);
						}}
					>
						{displayName}
					</Link>
				),
				title: t("adminShell.roles.columns.displayName"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "roleKey",
				key: "roleKey",
				render: (roleKey: string) => <Text code>{roleKey}</Text>,
				title: t("adminShell.roles.columns.roleKey"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "builtIn",
				key: "builtIn",
				render: (builtIn: boolean) => (
					<Tag {...(builtIn ? { color: "processing" } : {})}>
						{t(`adminShell.roles.types.${builtIn ? "builtIn" : "custom"}`)}
					</Tag>
				),
				title: t("adminShell.roles.columns.builtIn"),
				width: token.controlHeight * 3,
			},
			{
				align: "right",
				dataIndex: "memberCount",
				key: "memberCount",
				render: (memberCount?: number) => memberCount ?? 0,
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
				dataIndex: "createdAt",
				key: "createdAt",
				render: (createdAt: string) =>
					formatDateTime(createdAt, formatPreferences),
				title: t("adminShell.roles.columns.createdAt"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				render: (updatedAt: string) =>
					formatDateTime(updatedAt, formatPreferences),
				title: t("adminShell.roles.columns.updatedAt"),
				width: token.controlHeight * 5,
			},
			{
				align: "right",
				dataIndex: "version",
				key: "version",
				render: (version?: number) => version ?? "-",
				title: t("adminShell.roles.columns.version"),
				width: token.controlHeight * 3,
			},
			{
				key: "actions",
				render: (_: unknown, role: PlatformRole) => {
					const isBuiltIn = role.builtIn;
					const deleteButton = (
						<TableActionButton
							danger
							disabled={isBuiltIn || deleteMutation.isPending}
							onClick={() => {
								deleteMutation.reset();
								setDeletingRole(role);
							}}
						>
							{t("adminShell.roles.delete")}
						</TableActionButton>
					);

					return (
						<Space size={token.marginXS}>
							<TableActionButton
								icon={<EyeOutlined aria-hidden />}
								onClick={() => setViewingRole(role)}
							>
								{t("adminShell.roles.view")}
							</TableActionButton>
							<TableActionButton
								icon={<SafetyCertificateOutlined aria-hidden />}
								onClick={() => {
									permissionMutation.reset();
									setPermissionRoleId(role.id);
								}}
							>
								{t("adminShell.roles.configurePermissions")}
							</TableActionButton>
							<TableActionButton
								disabled={renameMutation.isPending}
								icon={<EditOutlined aria-hidden />}
								onClick={() => {
									renameMutation.reset();
									renameForm.setFieldsValue({ displayName: role.displayName });
									setRenamingRole(role);
								}}
							>
								{t("adminShell.roles.rename")}
							</TableActionButton>
							{isBuiltIn ? (
								<Tooltip title={t("adminShell.roles.builtInDeleteReason")}>
									<span>{deleteButton}</span>
								</Tooltip>
							) : (
								deleteButton
							)}
						</Space>
					);
				},
				title: t("adminShell.roles.columns.actions"),
				width: token.controlHeight * 11,
			},
		],
		[
			deleteMutation,
			formatPreferences,
			permissionMutation,
			renameForm,
			renameMutation,
			t,
			token.controlHeight,
			token.marginXXS,
			token.marginXS,
		],
	);
	const visibleRoleColumns = columns.filter((column) =>
		visibleRoleColumnKeys.includes(String(column.key) as RoleColumnKey),
	);
	const roleColumnOptions = roleColumnKeys.map((key) => ({
		key,
		label: t(`adminShell.roles.columns.${key}`),
	}));

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
				onClose={() => setViewingRole(null)}
				open={viewingRole !== null}
				title={t("adminShell.roles.detailsTitle")}
			>
				{viewingRole ? (
					<Descriptions
						bordered
						column={1}
						items={[
							{
								key: "id",
								label: t("adminShell.roles.columns.id"),
								children: <Text code>{viewingRole.id}</Text>,
							},
							{
								key: "displayName",
								label: t("adminShell.roles.columns.displayName"),
								children: viewingRole.displayName,
							},
							{
								key: "roleKey",
								label: t("adminShell.roles.columns.roleKey"),
								children: <Text code>{viewingRole.roleKey}</Text>,
							},
							{
								key: "builtIn",
								label: t("adminShell.roles.columns.builtIn"),
								children: t(
									`adminShell.roles.types.${viewingRole.builtIn ? "builtIn" : "custom"}`,
								),
							},
							{
								key: "memberCount",
								label: t("adminShell.roles.columns.memberCount"),
								children: viewingRole.memberCount ?? 0,
							},
							{
								key: "permissions",
								label: t("adminShell.roles.columns.permissions"),
								children:
									viewingRole.permissions.length > 0 ? (
										<Flex gap={token.marginXXS} wrap>
											{viewingRole.permissions.map((permission) => {
												const definition =
													permissionDefinitionByValue[permission];

												return (
													<Tag key={permission}>
														{t(
															`adminShell.roles.permissions.items.${definition.i18nKey}.name`,
														)}
													</Tag>
												);
											})}
										</Flex>
									) : (
										t("adminShell.roles.permissions.notConfigured")
									),
							},
							{
								key: "createdAt",
								label: t("adminShell.roles.columns.createdAt"),
								children: formatDateTime(
									viewingRole.createdAt,
									formatPreferences,
								),
							},
							{
								key: "updatedAt",
								label: t("adminShell.roles.columns.updatedAt"),
								children: formatDateTime(
									viewingRole.updatedAt,
									formatPreferences,
								),
							},
							{
								key: "version",
								label: t("adminShell.roles.columns.version"),
								children: viewingRole.version ?? "-",
							},
						]}
						size="small"
					/>
				) : null}
			</Drawer>

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
				<Card
					extra={
						<Space size={token.marginXXS}>
							<TableColumnSettings
								ariaLabel={t("adminShell.roles.tableSettings")}
								columns={roleColumnOptions}
								defaultVisibleKeys={defaultVisibleRoleColumnKeys}
								onChange={(keys) =>
									setVisibleRoleColumnKeys(keys as RoleColumnKey[])
								}
								requiredKeys={requiredRoleColumnKeys}
								resetLabel={t("adminShell.roles.columnSettings.reset")}
								selectAllLabel={t("adminShell.roles.columnSettings.title")}
								visibleKeys={visibleRoleColumnKeys}
							/>
							<Tooltip title={t("adminShell.roles.create")}>
								<Button
									aria-label={t("adminShell.roles.create")}
									icon={<PlusOutlined aria-hidden />}
									onClick={() => {
										createMutation.reset();
										setCreateOpen(true);
									}}
									type="primary"
								>
									{screens.sm ? t("adminShell.roles.create") : null}
								</Button>
							</Tooltip>
						</Space>
					}
					title={t("adminShell.roles.tableTitle")}
				>
					<Flex gap={token.margin} vertical>
						<Flex align="baseline" gap={token.marginXS} wrap>
							<Text type="secondary">{t("adminShell.roles.memberGuide")}</Text>
							<RouterLink to="/organization/users">
								{t("adminShell.roles.memberGuideLink")}
							</RouterLink>
						</Flex>
						<Table<PlatformRole>
							columns={visibleRoleColumns}
							dataSource={rolesQuery.data ?? []}
							loading={rolesQuery.isFetching}
							locale={{ emptyText: t("adminShell.roles.empty") }}
							pagination={false}
							rowKey="id"
							scroll={{ x: token.controlHeight * 39 }}
							tableLayout="fixed"
						/>
					</Flex>
				</Card>
			</Flex>
		</>
	);
}
