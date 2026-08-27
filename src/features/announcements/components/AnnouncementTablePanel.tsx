import type { ProColumns } from "@ant-design/pro-components";
import { PlusOutlined } from "@ant-design/icons";
import { Button, Space, Tag, theme } from "antd";
import type { TableProps } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import { getTableColumnSettingsStorageKey } from "../../../app/preferenceStorage";
import { resolveTableSort } from "../../../app/tableSorting";
import type { TableColumnConfig } from "../../../app/tableColumnVisibility";
import { TableActionButton } from "../../../app/TableActionButton";
import type {
	ListPlatformAnnouncementsInput,
	PlatformAnnouncement,
	PlatformAnnouncementStatus,
} from "#src/api/announcements";
import {
	type ManagementQuery,
	LogTablePanel,
} from "../../operations/LogTablePanel";

import type { AnnouncementFilterValues } from "./useAnnouncementQuery";

type AnnouncementSort = NonNullable<ListPlatformAnnouncementsInput["sort"]>;

export interface AnnouncementTableState {
	order: ListPlatformAnnouncementsInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformAnnouncementsInput["sort"];
}

interface AnnouncementTableData {
	items: PlatformAnnouncement[];
	page: number;
	pageSize: number;
	total: number;
}

interface AnnouncementTablePanelProps {
	canManage: boolean;
	data: AnnouncementTableData | undefined;
	error: unknown;
	initialLoading: boolean;
	onChange: (state: AnnouncementTableState) => void;
	onCreate: () => void;
	onDelete: (announcement: PlatformAnnouncement) => void;
	onEdit: (announcement: PlatformAnnouncement) => void;
	onReload: () => void;
	onView: (announcement: PlatformAnnouncement) => void;
	query: ManagementQuery<AnnouncementFilterValues>;
	refreshing: boolean;
	tableState: AnnouncementTableState;
}

const announcementColumnVisibility: readonly TableColumnConfig<string>[] = [
	{ key: "title", visibility: "required" },
	{ key: "status", visibility: "recommended" },
	{ key: "updatedAt", visibility: "recommended" },
	{ key: "actions", visibility: "required" },
];

const tableSortToContractSort: Record<string, AnnouncementSort> = {
	status: "status",
	title: "title",
	updatedAt: "updated_at",
};

export function AnnouncementTablePanel({
	canManage,
	data,
	error,
	initialLoading,
	onChange,
	onCreate,
	onDelete,
	onEdit,
	onReload,
	onView,
	query,
	refreshing,
	tableState,
}: AnnouncementTablePanelProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const formatPreferences = useLocalePreferences();
	const columns = useMemo<ProColumns<PlatformAnnouncement>[]>(() => {
		const sortOrder = (column: AnnouncementSort) =>
			tableState.sort === column && tableState.order
				? tableState.order === "asc"
					? "ascend"
					: "descend"
				: null;
		const dataColumns: ProColumns<PlatformAnnouncement>[] = [
			{
				dataIndex: "title",
				key: "title",
				renderText: (title: string, announcement) => (
					<TableActionButton onClick={() => onView(announcement)}>
						{title}
					</TableActionButton>
				),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("title"),
				title: t("adminShell.announcements.columns.title"),
				width: token.controlHeight * 8,
			},
			{
				dataIndex: "status",
				key: "status",
				renderText: (status: PlatformAnnouncementStatus) => (
					<Tag color={status === "published" ? "success" : "default"}>
						{t(`adminShell.announcements.statuses.${status}`)}
					</Tag>
				),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("status"),
				title: t("adminShell.announcements.columns.status"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				renderText: (value: string) => formatDateTime(value, formatPreferences),
				sortDirections: ["ascend", "descend"],
				sorter: true,
				sortOrder: sortOrder("updated_at"),
				title: t("adminShell.announcements.columns.updatedAt"),
				width: token.controlHeight * 5,
			},
		];

		if (canManage) {
			dataColumns.push({
				key: "actions",
				render: (_: unknown, announcement: PlatformAnnouncement) => (
					<Space size="medium">
						<TableActionButton onClick={() => onEdit(announcement)}>
							{t("adminShell.announcements.edit")}
						</TableActionButton>
						<TableActionButton danger onClick={() => onDelete(announcement)}>
							{t("adminShell.announcements.delete")}
						</TableActionButton>
					</Space>
				),
				title: t("adminShell.announcements.columns.actions"),
				width: token.controlHeight * 4,
			});
		}

		return dataColumns;
	}, [
		canManage,
		formatPreferences,
		onDelete,
		onEdit,
		onView,
		t,
		tableState.order,
		tableState.sort,
		token.controlHeight,
	]);
	const handleTableChange: NonNullable<
		TableProps<PlatformAnnouncement>["onChange"]
	> = (pagination, _filters, sorterState) => {
		const currentSorter = Array.isArray(sorterState)
			? sorterState[0]
			: sorterState;
		const nextSorting = resolveTableSort(
			currentSorter?.columnKey,
			currentSorter?.order,
			tableSortToContractSort,
		);
		onChange({
			order: nextSorting.order,
			page: pagination.current ?? tableState.page,
			pageSize: pagination.pageSize ?? tableState.pageSize,
			sort: nextSorting.sort,
		});
	};

	return (
		<LogTablePanel<PlatformAnnouncement, AnnouncementFilterValues>
			columnSettingsStorageKey={getTableColumnSettingsStorageKey(
				"announcements",
			)}
			columnVisibility={announcementColumnVisibility}
			columns={columns}
			dataSource={data?.items ?? []}
			emptyText={t("adminShell.announcements.empty")}
			error={error}
			errorFallback={t("adminShell.announcements.errors.fallback")}
			errorTitle={t("adminShell.announcements.errors.load")}
			initialLoading={initialLoading}
			onPageChange={(page, pageSize) =>
				onChange({ ...tableState, page, pageSize })
			}
			onReload={onReload}
			onTableChange={handleTableChange}
			page={data?.page ?? tableState.page}
			pageSize={data?.pageSize ?? tableState.pageSize}
			primaryAction={
				canManage ? (
					<Button
						icon={<PlusOutlined aria-hidden />}
						onClick={onCreate}
						type="primary"
					>
						{t("adminShell.announcements.create")}
					</Button>
				) : undefined
			}
			query={query}
			refreshing={refreshing}
			testId="admin-announcements-table-card"
			title={t("adminShell.announcements.tableTitle")}
			total={data?.total ?? 0}
			workspaceTestId="admin-announcements-table-workspace"
		/>
	);
}
