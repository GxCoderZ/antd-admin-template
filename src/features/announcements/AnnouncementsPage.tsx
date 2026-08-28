import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Alert, Button, Modal, message } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { ManagementBatchToolbar } from "../../app/ManagementBatchToolbar";
import { platformPermissions, usePermission } from "../../app/permissions";
import { useQuerySubmission } from "../../app/queryFilterLayout";
import { useRouteSessionState } from "../../app/routeSessionState";
import { tableSortStateVersion } from "../../app/tableSorting";
import {
	createPlatformAnnouncement,
	deletePlatformAnnouncement,
	deletePlatformAnnouncements,
	listPlatformAnnouncements,
	platformAnnouncementsQueryKey,
	type CreatePlatformAnnouncementInput,
	type ListPlatformAnnouncementsInput,
	type PlatformAnnouncement,
	type PlatformAnnouncementStatus,
	updatePlatformAnnouncement,
	updatePlatformAnnouncementStatuses,
} from "#src/api/announcements";
import { AnnouncementFormDrawer } from "./components/AnnouncementFormDrawer";
import { AnnouncementDetailDrawer } from "./components/AnnouncementDetailDrawer";
import {
	useAnnouncementQuery,
	type AnnouncementFilterValues,
} from "./components/useAnnouncementQuery";
import {
	AnnouncementTablePanel,
	type AnnouncementTableState,
} from "./components/AnnouncementTablePanel";

const defaultAnnouncementFilterValues: AnnouncementFilterValues = {
	status: "all",
};
const announcementsRouteKey = "/system/announcements";
const defaultAnnouncementTableState: AnnouncementTableState = {
	order: undefined,
	page: 1,
	pageSize: 20,
	sort: undefined,
};

export function AnnouncementsPage() {
	const { t } = useTranslation();
	const [messageApi, messageContext] = message.useMessage();
	const queryClient = useQueryClient();
	const canManage = usePermission(platformPermissions.announcementsManage);
	const [filters, setFilters] = useRouteSessionState<AnnouncementFilterValues>({
		initialState: defaultAnnouncementFilterValues,
		routeKey: announcementsRouteKey,
		stateKey: "query-applied",
	});
	const [tableState, setTableState] =
		useRouteSessionState<AnnouncementTableState>({
			initialState: defaultAnnouncementTableState,
			routeKey: announcementsRouteKey,
			stateKey: "table",
			version: tableSortStateVersion,
		});
	const [selectedAnnouncementIds, setSelectedAnnouncementIds] =
		useRouteSessionState<string[]>({
			initialState: [],
			routeKey: announcementsRouteKey,
			stateKey: "selection",
		});
	const [formOpen, setFormOpen] = useState(false);
	const [editingAnnouncement, setEditingAnnouncement] =
		useState<PlatformAnnouncement | null>(null);
	const [viewingAnnouncement, setViewingAnnouncement] =
		useState<PlatformAnnouncement | null>(null);
	const [deletingAnnouncement, setDeletingAnnouncement] =
		useState<PlatformAnnouncement | null>(null);
	const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false);
	const querySubmission = useQuerySubmission();
	const selectedCount = selectedAnnouncementIds.length;
	const hasSelection = selectedCount > 0;
	const queryParams = useMemo<ListPlatformAnnouncementsInput>(() => {
		const q = filters.q?.trim();
		const params: ListPlatformAnnouncementsInput = {
			page: tableState.page,
			pageSize: tableState.pageSize,
			...(tableState.order && tableState.sort
				? { order: tableState.order, sort: tableState.sort }
				: {}),
		};

		if (q) {
			params.q = q;
		}
		if (filters.status !== "all") {
			params.status = filters.status;
		}

		return params;
	}, [filters, tableState]);
	const query = useQuery({
		placeholderData: keepPreviousData,
		queryFn: ({ signal }) => listPlatformAnnouncements(queryParams, signal),
		queryKey: [
			...platformAnnouncementsQueryKey,
			queryParams,
			querySubmission.revision,
		],
	});
	const refreshAnnouncements = () =>
		queryClient.invalidateQueries({ queryKey: platformAnnouncementsQueryKey });
	const clearSelection = () => setSelectedAnnouncementIds([]);
	const saveMutation = useMutation({
		mutationFn: (input: CreatePlatformAnnouncementInput) =>
			editingAnnouncement
				? updatePlatformAnnouncement({
						announcementId: editingAnnouncement.id,
						input,
					})
				: createPlatformAnnouncement(input),
		onSuccess: async () => {
			await refreshAnnouncements();
			setFormOpen(false);
			setEditingAnnouncement(null);
		},
	});
	const deleteMutation = useMutation({
		mutationFn: deletePlatformAnnouncement,
		onSuccess: async () => {
			await refreshAnnouncements();
			setDeletingAnnouncement(null);
			clearSelection();
		},
	});
	const batchStatusMutation = useMutation({
		mutationFn: updatePlatformAnnouncementStatuses,
		onError: () => {
			void messageApi.error(
				t("adminShell.announcements.errors.batchStatus"),
			);
		},
		onSuccess: async (_result, input) => {
			await refreshAnnouncements();
			clearSelection();
			void messageApi.success(
				t("adminShell.announcements.batchStatusSuccess", {
					count: input.ids.length,
					status: t(`adminShell.announcements.statuses.${input.status}`),
				}),
			);
		},
	});
	const batchDeleteMutation = useMutation({
		mutationFn: deletePlatformAnnouncements,
		onError: () => {
			void messageApi.error(t("adminShell.announcements.errors.batchDelete"));
		},
		onSuccess: async (_result, input) => {
			await refreshAnnouncements();
			setBatchDeleteConfirmOpen(false);
			clearSelection();
			void messageApi.success(
				t("adminShell.announcements.batchDeleteSuccess", {
					count: input.ids.length,
				}),
			);
		},
	});
	const batchMutating =
		batchStatusMutation.isPending ||
		batchDeleteMutation.isPending ||
		deleteMutation.isPending;

	const resetTablePage = () => {
		clearSelection();
		setTableState((currentState) => ({ ...currentState, page: 1 }));
		querySubmission.submit();
	};

	const tableQuery = useAnnouncementQuery({
		initialFilters: defaultAnnouncementFilterValues,
		loading: query.isFetching && !query.isPending,
		onApply: (nextFilters) => {
			setFilters(nextFilters);
			resetTablePage();
		},
		onReset: () => {
			setFilters(defaultAnnouncementFilterValues);
			setTableState((current) => ({
				...current,
				order: undefined,
				page: 1,
				sort: undefined,
			}));
			clearSelection();
		},
	});
	const updateSelectedStatus = (status: PlatformAnnouncementStatus) => {
		if (hasSelection) {
			batchStatusMutation.mutate({ ids: selectedAnnouncementIds, status });
		}
	};

	return (
		<>
			{messageContext}
			<AnnouncementTablePanel
				canManage={canManage}
				data={query.data}
				error={query.error}
				initialLoading={query.isPending}
				onChange={setTableState}
				onCreate={() => {
					saveMutation.reset();
					setEditingAnnouncement(null);
					setFormOpen(true);
				}}
				onDelete={(announcement) => {
					deleteMutation.reset();
					setDeletingAnnouncement(announcement);
				}}
				onEdit={(announcement) => {
					saveMutation.reset();
					setEditingAnnouncement(announcement);
					setFormOpen(true);
				}}
				onReload={() => void query.refetch()}
				onView={setViewingAnnouncement}
				query={tableQuery}
				refreshing={query.isFetching && !query.isPending}
				rowSelection={
					canManage
						? {
								getCheckboxProps: () => ({ disabled: batchMutating }),
								onChange: (keys) =>
									setSelectedAnnouncementIds(keys.map(String)),
								preserveSelectedRowKeys: true,
								selectedRowKeys: selectedAnnouncementIds,
							}
						: undefined
				}
				tableState={tableState}
			/>
			<ManagementBatchToolbar
				actions={
					<>
						<Button
							disabled={batchMutating}
							loading={
								batchStatusMutation.isPending &&
								batchStatusMutation.variables?.status === "published"
							}
							onClick={() => updateSelectedStatus("published")}
							type="primary"
						>
							{t("adminShell.announcements.batchPublish")}
						</Button>
						<Button
							disabled={batchMutating}
							loading={
								batchStatusMutation.isPending &&
								batchStatusMutation.variables?.status === "draft"
							}
							onClick={() => updateSelectedStatus("draft")}
						>
							{t("adminShell.announcements.batchUnpublish")}
						</Button>
						<Button
							danger
							disabled={batchMutating}
							loading={batchDeleteMutation.isPending}
							onClick={() => setBatchDeleteConfirmOpen(true)}
						>
							{t("adminShell.announcements.batchDelete")}
						</Button>
					</>
				}
				clearText={t("adminShell.announcements.clearSelection")}
				onClear={clearSelection}
				selectedCount={selectedCount}
				selectedText={t("adminShell.announcements.selectedCount", {
					count: selectedCount,
				})}
				testId="admin-announcements-batch-toolbar"
			/>

			<AnnouncementFormDrawer
				announcement={editingAnnouncement}
				error={saveMutation.isError}
				loading={saveMutation.isPending}
				onClose={() => {
					saveMutation.reset();
					setFormOpen(false);
					setEditingAnnouncement(null);
				}}
				onSubmit={(values) => saveMutation.mutate(values)}
				open={formOpen}
			/>
			<AnnouncementDetailDrawer
				announcement={viewingAnnouncement}
				onClose={() => setViewingAnnouncement(null)}
			/>

			<Modal
				cancelText={t("adminShell.announcements.cancel")}
				confirmLoading={deleteMutation.isPending}
				destroyOnHidden
				onCancel={() => setDeletingAnnouncement(null)}
				onOk={() => {
					if (deletingAnnouncement) {
						deleteMutation.mutate(deletingAnnouncement.id);
					}
				}}
				okButtonProps={{ danger: true }}
				okText={t("adminShell.announcements.confirmDelete")}
				open={deletingAnnouncement !== null}
				title={t("adminShell.announcements.deleteTitle")}
			>
				{deleteMutation.isError ? (
					<Alert
						description={t("adminShell.announcements.errors.fallback")}
						showIcon
						title={t("adminShell.announcements.errors.delete")}
						type="error"
					/>
				) : (
					t("adminShell.announcements.deleteDescription", {
						title: deletingAnnouncement?.title,
					})
				)}
			</Modal>
			<Modal
				cancelText={t("adminShell.announcements.cancel")}
				confirmLoading={batchDeleteMutation.isPending}
				destroyOnHidden
				onCancel={() => setBatchDeleteConfirmOpen(false)}
				onOk={() => {
					if (hasSelection) {
						batchDeleteMutation.mutate({ ids: selectedAnnouncementIds });
					}
				}}
				okButtonProps={{ danger: true, disabled: !hasSelection }}
				okText={t("adminShell.announcements.confirmDelete")}
				open={batchDeleteConfirmOpen}
				title={t("adminShell.announcements.batchDeleteTitle")}
			>
				{t("adminShell.announcements.batchDeleteDescription", {
					count: selectedCount,
				})}
			</Modal>
		</>
	);
}
