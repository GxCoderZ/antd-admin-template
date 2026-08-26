import { DownOutlined, EyeOutlined, PlusOutlined } from "@ant-design/icons";
import {
	Alert,
	Button,
	Dropdown,
	Flex,
	Space,
	Tag,
	type MenuProps,
	type TableProps,
	theme,
	Tooltip,
	Typography,
} from "antd";
import type { ChangeEvent } from "react";
import { useMemo } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import {
	ManagementProTable,
	type ManagementProTableColumn,
} from "../../../app/ManagementProTable";
import { TableActionButton } from "../../../app/TableActionButton";
import { getTableColumnSettingsStorageKey } from "../../../app/preferenceStorage";
import type { ListPlatformRolesInput, PlatformRole } from "#src/api/roles";
import { permissionGroups } from "../rolePermissions";
import { getRoleErrorTitleKey, getRoleProblemDetail } from "../roleProblems";

const { Text } = Typography;
type RoleSort = NonNullable<ListPlatformRolesInput["sort"]>;

export interface RoleFilterValues {
	q?: string;
}

interface RoleTablePanelProps {
	data: PlatformRole[];
	deletePending: boolean;
	draftFilters: RoleFilterValues;
	error: unknown;
	initialLoading: boolean;
	onConfigurePermissions: (role: PlatformRole) => void;
	onCreate: () => void;
	onDelete: (role: PlatformRole) => void;
	onDraftFiltersChange: (filters: RoleFilterValues) => void;
	onPageChange: (page: number, pageSize: number) => void;
	onQuery: (filters: RoleFilterValues) => void;
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

export function RoleTablePanel({
	data,
	deletePending,
	draftFilters,
	error,
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
	const columns = useMemo<ManagementProTableColumn<PlatformRole>[]>(() => {
		const sortOrder = (column: RoleSort) =>
			roleSort === column && roleOrder
				? roleOrder === "asc"
					? "ascend"
					: "descend"
				: null;

		return [
			{
				dataIndex: "q",
				fieldProps: {
					allowClear: true,
					onChange: (event: ChangeEvent<HTMLInputElement>) =>
						onDraftFiltersChange({ q: event.target.value }),
					placeholder: t("adminShell.roles.placeholders.q"),
				},
				hideInTable: true,
				initialValue: draftFilters.q,
				title: t("adminShell.roles.filters.q"),
			},
			{
				dataIndex: "displayName",
				disable: true,
				key: "displayName",
				search: false,
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("display_name"),
				title: t("adminShell.roles.columns.displayName"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "roleKey",
				key: "roleKey",
				render: (_, role) => <Text code>{role.roleKey}</Text>,
				search: false,
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
				render: (_, role) => role.memberCount ?? 0,
				search: false,
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
				search: false,
				title: t("adminShell.roles.columns.permissions"),
				width: token.controlHeight * 14,
			},
			{
				dataIndex: "id",
				key: "id",
				render: (_, role) => <Text code>{role.id}</Text>,
				search: false,
				title: t("adminShell.roles.columns.id"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "builtIn",
				key: "builtIn",
				render: (_, role) => (
					<Tag {...(role.builtIn ? { color: "processing" } : {})}>
						{t(`adminShell.roles.types.${role.builtIn ? "builtIn" : "custom"}`)}
					</Tag>
				),
				search: false,
				title: t("adminShell.roles.columns.builtIn"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "createdAt",
				key: "createdAt",
				render: (_, role) => formatDateTime(role.createdAt, formatPreferences),
				search: false,
				title: t("adminShell.roles.columns.createdAt"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				render: (_, role) => formatDateTime(role.updatedAt, formatPreferences),
				search: false,
				title: t("adminShell.roles.columns.updatedAt"),
				width: token.controlHeight * 5,
			},
			{
				disable: true,
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
				search: false,
				title: t("adminShell.roles.columns.actions"),
				valueType: "option",
				width: token.controlHeight * 4,
			},
		];
	}, [
		onConfigurePermissions,
		onDelete,
		onRename,
		onView,
		onDraftFiltersChange,
		deletePending,
		draftFilters.q,
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
			<ManagementProTable<PlatformRole, RoleFilterValues>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey("roles")}
				columns={columns}
				dataSource={data}
				emptyText={t("adminShell.roles.empty")}
				initialLoading={initialLoading}
				minimumWidth={token.controlHeight * 39}
				onPageChange={onPageChange}
				onReload={onReload}
				onReset={onResetFilters}
				onSubmit={(values) => {
					const q = values.q?.trim();
					onQuery(q ? { q } : {});
				}}
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
				refreshing={refreshing}
				testId="admin-roles-table-card"
				title={t("adminShell.roles.tableTitle")}
				total={total}
			/>
		</Flex>
	);
}
