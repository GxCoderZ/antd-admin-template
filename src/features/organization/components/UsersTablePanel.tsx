import { PlusOutlined } from "@ant-design/icons";
import { Button, Col, Form, Input, Select } from "antd";
import type { FormInstance, TableProps } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { getTableColumnSettingsStorageKey } from "../../../app/preferenceStorage";
import { useQueryFilterLayout } from "../../../app/queryFilterLayout";
import { LogQueryPanel, LogTablePanel } from "../../operations/LogTablePanel";
import type { PlatformUser } from "#src/api/users";
import { getProblemFallback } from "../userProblems";
import {
	defaultUserFilterValues,
	type UserFilterValues,
	type UserTableState,
	userColumnVisibility,
} from "../userTableTypes";
import { useUserTableColumns } from "./useUserTableColumns";

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
	filterForm: FormInstance<UserFilterValues>;
	filtersExpanded: boolean;
	initialLoading: boolean;
	onCreate: () => void;
	onDelete: (user: PlatformUser) => void;
	onDraftFiltersChange: (filters: UserFilterValues) => void;
	onEdit: (user: PlatformUser) => void;
	onForceLogout: (user: PlatformUser) => void;
	onFiltersExpandedChange: (expanded: boolean) => void;
	onManageRoles: (user: PlatformUser) => void;
	onPageChange: (page: number, pageSize: number) => void;
	onQuery: () => void;
	onReload: () => void;
	onResetFilters: () => void;
	onResetPassword: (user: PlatformUser) => void;
	onTableChange: NonNullable<TableProps<PlatformUser>["onChange"]>;
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
	filterForm,
	filtersExpanded,
	initialLoading,
	onCreate,
	onDelete,
	onDraftFiltersChange,
	onEdit,
	onForceLogout,
	onFiltersExpandedChange,
	onManageRoles,
	onPageChange,
	onQuery,
	onReload,
	onResetFilters,
	onResetPassword,
	onTableChange,
	overlays,
	refreshing,
	tableState,
}: UsersTablePanelProps) {
	const { t } = useTranslation();
	const {
		canExpand,
		collapsedFieldCount,
		columnSpan,
		containerRef,
		formLayout,
		submitterOffset,
	} = useQueryFilterLayout({ expanded: filtersExpanded, fieldCount: 2 });
	const showStatusFilter = filtersExpanded || collapsedFieldCount >= 2;
	const columns = useUserTableColumns({
		canManageUsers,
		currentUserId,
		onDelete,
		onEdit,
		onForceLogout,
		onManageRoles,
		onResetPassword,
		tableState,
	});
	const queryPanel = (
		<LogQueryPanel<UserFilterValues>
			actionsTestId="admin-users-query-actions"
			canExpand={canExpand}
			columnSpan={columnSpan}
			containerRef={containerRef}
			expanded={filtersExpanded}
			form={filterForm}
			formLayout={formLayout}
			initialValues={defaultUserFilterValues}
			loading={refreshing}
			onFinish={onQuery}
			onReset={onResetFilters}
			onToggle={() => onFiltersExpandedChange(!filtersExpanded)}
			submitterOffset={submitterOffset}
			testId="admin-users-query-form"
		>
			<Col span={columnSpan}>
				<Form.Item
					label={t("adminShell.users.filters.q")}
					style={{ marginBottom: 0 }}
				>
					<Input
						allowClear
						onChange={(event) =>
							onDraftFiltersChange({
								...draftFilters,
								q: event.target.value,
							})
						}
						placeholder={t("adminShell.users.placeholders.q")}
						style={{ width: "100%" }}
						value={draftFilters.q}
					/>
				</Form.Item>
			</Col>
			{showStatusFilter ? (
				<Col span={columnSpan}>
					<Form.Item
						label={t("adminShell.users.filters.status")}
						style={{ marginBottom: 0 }}
					>
						<Select
							aria-label={t("adminShell.users.filters.status")}
							onChange={(status: UserFilterValues["status"]) =>
								onDraftFiltersChange({ ...draftFilters, status })
							}
							options={[
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
							]}
							style={{ width: "100%" }}
							value={draftFilters.status}
						/>
					</Form.Item>
				</Col>
			) : null}
		</LogQueryPanel>
	);

	return (
		<>
			{overlays}
			<LogTablePanel<PlatformUser>
				columnSettingsStorageKey={getTableColumnSettingsStorageKey("users")}
				columnVisibility={userColumnVisibility}
				columns={columns}
				dataSource={data?.items ?? []}
				emptyText={t("adminShell.users.empty")}
				error={error}
				errorFallback={getProblemFallback(
					error,
					t("adminShell.users.errors.fallback"),
				)}
				errorTitle={t("adminShell.users.errors.request")}
				initialLoading={initialLoading}
				onPageChange={onPageChange}
				onReload={onReload}
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
				queryPanel={queryPanel}
				refreshing={refreshing}
				testId="admin-users-table-card"
				title={t("adminShell.users.tableTitle")}
				total={data?.total ?? 0}
				workspaceTestId="admin-users-table-workspace"
			/>
		</>
	);
}
