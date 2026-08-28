import { PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Flex, theme } from "antd";
import type { TableProps } from "antd";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
	ManagementProTable,
	type ManagementProTableColumn,
} from "../../../app/ManagementProTable";
import { getTableColumnSettingsStorageKey } from "../../../app/preferenceStorage";
import { useRouteSessionState } from "../../../app/routeSessionState";
import type { TableColumnConfig } from "../../../app/tableColumnVisibility";
import type { PlatformUser } from "#src/api/users";
import { getProblemFallback } from "../userProblems";
import {
	defaultUserFilterValues,
	type UserFilterValues,
	type UserTableState,
} from "../userTableTypes";
import { useUserTableColumns } from "./useUserTableColumns";

const userColumnVisibility: readonly TableColumnConfig[] = [
	{ key: "displayName", visibility: "recommended" },
	{ key: "username", visibility: "required" },
	{ key: "department", visibility: "recommended" },
	{ key: "jobTitle", visibility: "optional" },
	{ key: "roles", visibility: "recommended" },
	{ key: "email", visibility: "optional" },
	{ key: "phone", visibility: "optional" },
	{ key: "status", visibility: "recommended" },
	{ key: "authSource", visibility: "optional" },
	{ key: "mfaEnabled", visibility: "optional" },
	{ key: "mustChangePassword", visibility: "optional" },
	{ key: "lastLoginAt", visibility: "recommended" },
	{ key: "lastLoginIp", visibility: "optional" },
	{ key: "createdAt", visibility: "optional" },
	{ key: "updatedAt", visibility: "optional" },
	{ key: "actions", visibility: "required" },
];

interface UserPageData {
	items: PlatformUser[];
	page: number;
	pageSize: number;
	total: number;
}

interface UsersTablePanelProps {
	canManageUsers: boolean;
	currentUserId: string | undefined;
	data: UserPageData | undefined;
	draftFilters: UserFilterValues;
	error: unknown;
	initialLoading: boolean;
	onCreate: () => void;
	onDelete: (user: PlatformUser) => void;
	onDraftFiltersChange: (filters: UserFilterValues) => void;
	onEdit: (user: PlatformUser) => void;
	onForceLogout: (user: PlatformUser) => void;
	onManageRoles: (user: PlatformUser) => void;
	onPageChange: (page: number, pageSize: number) => void;
	onQuery: (filters: UserFilterValues) => void;
	onReload: () => void;
	onResetFilters: () => void;
	onResetPassword: (user: PlatformUser) => void;
	onTableChange: NonNullable<TableProps<PlatformUser>["onChange"]>;
	onView: (user: PlatformUser) => void;
	overlays: ReactNode;
	refreshing: boolean;
	tableState: UserTableState;
}

export function UsersTablePanel({
	canManageUsers,
	currentUserId,
	data,
	draftFilters,
	error,
	initialLoading,
	onCreate,
	onDelete,
	onDraftFiltersChange,
	onEdit,
	onForceLogout,
	onManageRoles,
	onPageChange,
	onQuery,
	onReload,
	onResetFilters,
	onResetPassword,
	onTableChange,
	onView,
	overlays,
	refreshing,
	tableState,
}: UsersTablePanelProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [filtersExpanded, setFiltersExpanded] = useRouteSessionState({
		initialState: false,
		routeKey: "/organization/users",
		stateKey: "query-expanded",
	});
	const tableColumns = useUserTableColumns({
		canManageUsers,
		currentUserId,
		onDelete,
		onEdit,
		onForceLogout,
		onManageRoles,
		onResetPassword,
		onView,
		tableState,
	});
	const columns = useMemo<ManagementProTableColumn<PlatformUser>[]>(
		() => [
			{
				dataIndex: "q",
				fieldProps: {
					allowClear: true,
					placeholder: t("adminShell.users.placeholders.q"),
				},
				hideInTable: true,
				initialValue: draftFilters.q,
				title: t("adminShell.users.filters.q"),
			},
			{
				dataIndex: "status",
				fieldProps: {
					options: [
						{ label: t("adminShell.users.allStatuses"), value: "all" },
						{
							label: t("adminShell.users.statuses.active"),
							value: "active",
						},
						{
							label: t("adminShell.users.statuses.locked"),
							value: "locked",
						},
						{
							label: t("adminShell.users.statuses.disabled"),
							value: "disabled",
						},
					],
				},
				hideInTable: true,
				initialValue: draftFilters.status,
				key: "statusFilter",
				title: t("adminShell.users.filters.status"),
				valueType: "select",
			},
			...tableColumns,
		],
		[draftFilters.q, draftFilters.status, t, tableColumns],
	);

	return (
		<>
			{overlays}
			<Flex gap={token.marginLG} vertical>
				{error ? (
					<Alert
						action={
							<Button onClick={onReload}>
								{t("adminShell.logs.common.retry")}
							</Button>
						}
						description={getProblemFallback(
							error,
							t("adminShell.users.errors.fallback"),
						)}
						showIcon
						title={t("adminShell.users.errors.request")}
						type="error"
					/>
				) : null}
				<ManagementProTable<PlatformUser, UserFilterValues>
					columnSettingsStorageKey={getTableColumnSettingsStorageKey("users")}
					columnVisibility={userColumnVisibility}
					columns={columns}
					dataSource={data?.items ?? []}
					emptyText={t("adminShell.users.empty")}
					initialLoading={initialLoading}
					onPageChange={onPageChange}
					onReload={onReload}
					onReset={onResetFilters}
					search={{
						collapsed: !filtersExpanded,
						onCollapse: (collapsed) => setFiltersExpanded(!collapsed),
					}}
					searchForm={{
						"data-testid": "admin-users-query-form",
						onValuesChange: (_, values: Partial<UserFilterValues>) => {
							const q = values.q?.trim();
							onDraftFiltersChange({
								status: values.status ?? defaultUserFilterValues.status,
								...(q ? { q } : {}),
							});
						},
					}}
					onSubmit={(values) => {
						const q = values.q?.trim();
						onQuery({
							status: values.status ?? defaultUserFilterValues.status,
							...(q ? { q } : {}),
						});
					}}
					onTableChange={onTableChange}
					page={data?.page ?? tableState.page}
					pageSize={data?.pageSize ?? tableState.pageSize}
					primaryAction={
						canManageUsers ? (
							<Button
								icon={<PlusOutlined aria-hidden />}
								onClick={onCreate}
								type="primary"
							>
								{t("adminShell.users.create")}
							</Button>
						) : undefined
					}
					refreshing={refreshing}
					testId="admin-users-table-card"
					title={t("adminShell.users.tableTitle")}
					total={data?.total ?? 0}
				/>
			</Flex>
		</>
	);
}
