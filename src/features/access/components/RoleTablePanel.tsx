import { DownOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import {
	Alert,
	Button,
	Col,
	Dropdown,
	Flex,
	Form,
	Input,
	Space,
	Tag,
	type FormInstance,
	type MenuProps,
	type TableProps,
	theme,
	Tooltip,
	Typography,
} from "antd";
import { useMemo } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import { TableActionButton } from "../../../app/TableActionButton";
import { getTableColumnSettingsStorageKey } from "../../../app/preferenceStorage";
import { useQueryFilterLayout } from "../../../app/queryFilterLayout";
import type { ResponsiveTableColumnConfig } from "../../../app/tableColumnVisibility";
import { LogQueryPanel, LogTablePanel } from "../../operations/LogTablePanel";
import type { ListPlatformRolesInput, PlatformRole } from "#src/api/roles";
import { permissionGroups } from "../rolePermissions";
import { getRoleErrorTitleKey, getRoleProblemDetail } from "../roleProblems";

const { Text } = Typography;
type RoleSort = NonNullable<ListPlatformRolesInput["sort"]>;
const roleColumnVisibility: readonly ResponsiveTableColumnConfig<string>[] = [
	{ key: "displayName", priority: "compact", required: true },
	{ key: "roleKey", priority: "compact" },
	{ key: "memberCount", priority: "compact" },
	{ key: "permissions", priority: "regular" },
	{ key: "id", priority: "optional" },
	{ key: "builtIn", priority: "optional" },
	{ key: "createdAt", priority: "optional" },
	{ key: "updatedAt", priority: "optional" },
	{ key: "actions", priority: "compact", required: true },
];

export interface RoleFilterValues {
	q?: string;
}

interface RoleTablePanelProps {
	data: PlatformRole[];
	deletePending: boolean;
	draftFilters: RoleFilterValues;
	error: unknown;
	filterForm: FormInstance<RoleFilterValues>;
	initialLoading: boolean;
	onConfigurePermissions: (role: PlatformRole) => void;
	onCreate: () => void;
	onDelete: (role: PlatformRole) => void;
	onDraftFiltersChange: (filters: RoleFilterValues) => void;
	onPageChange: (page: number, pageSize: number) => void;
	onQuery: () => void;
	onReload: () => void;
	onRename: (role: PlatformRole) => void;
	onResetFilters: () => void;
	onTableChange: NonNullable<TableProps<PlatformRole>["onChange"]>;
	onView: (role: PlatformRole) => void;
	page: number;
	pageSize: number;
	refreshing: boolean;
	roleOrder: ListPlatformRolesInput["order"];
	roleSort: ListPlatformRolesInput["sort"];
	renamePending: boolean;
	total: number;
}

const defaultRoleFilterValues: RoleFilterValues = {};

export function RoleTablePanel({
	data,
	deletePending,
	draftFilters,
	error,
	filterForm,
	initialLoading,
	onConfigurePermissions,
	onCreate,
	onDelete,
	onDraftFiltersChange,
	onPageChange,
	onQuery,
	onReload,
	onRename,
	onResetFilters,
	onTableChange,
	onView,
	page,
	pageSize,
	refreshing,
	roleOrder,
	roleSort,
	renamePending,
	total,
}: RoleTablePanelProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const formatPreferences = useLocalePreferences();
	const [openActionRoleId, setOpenActionRoleId] = useState<string | null>(null);
	const { canExpand, columnSpan, containerRef, formLayout, submitterOffset } =
		useQueryFilterLayout({ expanded: false, fieldCount: 1 });
	const columns = useMemo<
		NonNullable<TableProps<PlatformRole>["columns"]>
	>(() => {
		const sortOrder = (column: RoleSort) =>
			roleSort === column && roleOrder
				? roleOrder === "asc"
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
				dataIndex: "id",
				key: "id",
				render: (id: string) => <Text code>{id}</Text>,
				title: t("adminShell.roles.columns.id"),
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
				key: "actions",
				render: (_: unknown, role: PlatformRole) => {
					const isBuiltIn = role.builtIn;
					const actionItems: NonNullable<MenuProps["items"]> = [
						{
							icon: <EyeOutlined aria-hidden />,
							key: "view",
							label: t("adminShell.roles.view"),
							onClick: () => {
								setOpenActionRoleId(null);
								onView(role);
							},
						},
						{
							key: "permissions",
							label: t("adminShell.roles.configurePermissions"),
							onClick: () => {
								setOpenActionRoleId(null);
								onConfigurePermissions(role);
							},
						},
						{
							danger: true,
							disabled: isBuiltIn || deletePending,
							key: "delete",
							label: isBuiltIn ? (
								<Tooltip title={t("adminShell.roles.builtInDeleteReason")}>
									<span>{t("adminShell.roles.delete")}</span>
								</Tooltip>
							) : (
								t("adminShell.roles.delete")
							),
							onClick: () => {
								setOpenActionRoleId(null);
								onDelete(role);
							},
						},
					];

					return (
						<Space size="medium">
							<TableActionButton
								disabled={renamePending}
								onClick={() => onRename(role)}
							>
								{t("adminShell.roles.rename")}
							</TableActionButton>
							<Dropdown
								menu={{ items: actionItems }}
								onOpenChange={(nextOpen) =>
									setOpenActionRoleId(nextOpen ? role.id : null)
								}
								open={openActionRoleId === role.id}
								placement="bottomRight"
								trigger={["click"]}
							>
								<TableActionButton
									icon={<DownOutlined aria-hidden />}
									iconPlacement="end"
								>
									{t("adminShell.tableActions.more")}
								</TableActionButton>
							</Dropdown>
						</Space>
					);
				},
				title: t("adminShell.roles.columns.actions"),
				width: token.controlHeight * 4,
			},
		];
	}, [
		onConfigurePermissions,
		onDelete,
		onRename,
		onView,
		deletePending,
		openActionRoleId,
		renamePending,
		roleOrder,
		roleSort,
		formatPreferences,
		t,
		token.controlHeight,
		token.marginXXS,
	]);

	return (
		<Flex gap={token.marginLG} vertical>
			{error ? (
				<Alert
					action={
						<Button onClick={onReload} size="small">
							{t("adminShell.roles.retry")}
						</Button>
					}
					description={
						getRoleProblemDetail(error) ?? t("adminShell.roles.errors.fallback")
					}
					showIcon
					title={t(getRoleErrorTitleKey(error))}
					type="error"
				/>
			) : null}
			<LogTablePanel<PlatformRole>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey("roles")}
				columnVisibility={roleColumnVisibility}
				columns={columns}
				dataSource={data}
				emptyText={t("adminShell.roles.empty")}
				error={undefined}
				initialLoading={initialLoading}
				minimumWidth={token.controlHeight * 39}
				onPageChange={onPageChange}
				onReload={onReload}
				onTableChange={onTableChange}
				page={page}
				pageSize={pageSize}
				primaryAction={
					<Button
						icon={<PlusOutlined aria-hidden />}
						onClick={onCreate}
						type="primary"
					>
						{t("adminShell.roles.create")}
					</Button>
				}
				queryPanel={
					<LogQueryPanel<RoleFilterValues>
						actionsTestId="admin-roles-query-actions"
						canExpand={canExpand}
						columnSpan={columnSpan}
						containerRef={containerRef}
						expanded={false}
						form={filterForm}
						formLayout={formLayout}
						initialValues={defaultRoleFilterValues}
						loading={refreshing}
						onFinish={onQuery}
						onReset={onResetFilters}
						onToggle={() => undefined}
						submitterOffset={submitterOffset}
						testId="admin-roles-query-form"
					>
						<Col span={columnSpan}>
							<Form.Item
								label={t("adminShell.roles.filters.q")}
								style={{ marginBottom: 0 }}
							>
								<Input
									allowClear
									onChange={(event) =>
										onDraftFiltersChange({ q: event.target.value })
									}
									placeholder={t("adminShell.roles.placeholders.q")}
									style={{ width: "100%" }}
									value={draftFilters.q}
								/>
							</Form.Item>
						</Col>
					</LogQueryPanel>
				}
				refreshing={refreshing}
				testId="admin-roles-table-card"
				title={t("adminShell.roles.tableTitle")}
				total={total}
				workspaceTestId="admin-roles-table-workspace"
			/>
		</Flex>
	);
}
