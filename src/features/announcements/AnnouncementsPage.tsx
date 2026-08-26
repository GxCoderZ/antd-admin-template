import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Alert, Button, Flex, Modal, theme } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { platformPermissions, usePermission } from "../../app/permissions";
import { useQuerySubmission } from "../../app/queryFilterLayout";
import { useRouteSessionState } from "../../app/routeSessionState";
import {
	createPlatformAnnouncement,
	deletePlatformAnnouncement,
	listPlatformAnnouncements,
	platformAnnouncementsQueryKey,
	type CreatePlatformAnnouncementInput,
	type ListPlatformAnnouncementsInput,
	type PlatformAnnouncement,
	updatePlatformAnnouncement,
} from "#src/api/announcements";
import { AnnouncementFormDrawer } from "./components/AnnouncementFormDrawer";
import {
	AnnouncementQueryPanel,
	type AnnouncementFilterValues,
} from "./components/AnnouncementQueryPanel";
import {
	AnnouncementTablePanel,
	type AnnouncementTableState,
} from "./components/AnnouncementTablePanel";

const defaultAnnouncementFilterValues: AnnouncementFilterValues = {
	status: "all",
};
const announcementsRouteKey = "/system/announcements";
const defaultAnnouncementTableState: AnnouncementTableState = {
	order: "desc",
	page: 1,
	pageSize: 20,
	sort: "updated_at",
};

export function AnnouncementsPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const canManage = usePermission(platformPermissions.announcementsManage);
	const [filters, setFilters] =
		useRouteSessionState<AnnouncementFilterValues>({
			initialState: defaultAnnouncementFilterValues,
			routeKey: announcementsRouteKey,
			stateKey: "query-applied",
		});
	const [tableState, setTableState] =
		useRouteSessionState<AnnouncementTableState>({
			initialState: defaultAnnouncementTableState,
			routeKey: announcementsRouteKey,
			stateKey: "table",
		});
	const [formOpen, setFormOpen] = useState(false);
	const [editingAnnouncement, setEditingAnnouncement] =
		useState<PlatformAnnouncement | null>(null);
	const [deletingAnnouncement, setDeletingAnnouncement] =
		useState<PlatformAnnouncement | null>(null);
	const [isTableFullscreen, setIsTableFullscreen] = useState(false);
	const querySubmission = useQuerySubmission();
	const tableWorkspaceRef = useRef<HTMLDivElement>(null);
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
		},
	});

	useEffect(() => {
		const syncTableFullscreenState = () => {
			setIsTableFullscreen(
				document.fullscreenElement === tableWorkspaceRef.current,
			);
		};

		document.addEventListener("fullscreenchange", syncTableFullscreenState);
		return () => {
			document.removeEventListener(
				"fullscreenchange",
				syncTableFullscreenState,
			);
		};
	}, []);

	const toggleTableFullscreen = () => {
		const tableWorkspace = tableWorkspaceRef.current;

		if (!tableWorkspace) {
			return;
		}

		if (document.fullscreenElement === tableWorkspace) {
			void document.exitFullscreen?.();
			return;
		}

		void tableWorkspace.requestFullscreen?.();
	};
	const resetTablePage = () => {
		setTableState((currentState) => ({ ...currentState, page: 1 }));
		querySubmission.submit();
	};

	return (
		<Flex
			gap={token.marginLG}
			ref={tableWorkspaceRef}
			style={
				isTableFullscreen
					? {
							background: token.colorBgLayout,
							boxSizing: "border-box",
							height: "100%",
							overflow: "auto",
							padding: token.paddingLG,
						}
					: undefined
			}
			vertical
		>
			{query.isError ? (
				<Alert
					action={
						<Button onClick={() => void query.refetch()} size="small">
							{t("adminShell.announcements.retry")}
						</Button>
					}
					description={t("adminShell.announcements.errors.fallback")}
					showIcon
					title={t("adminShell.announcements.errors.load")}
					type="error"
				/>
			) : null}

			<AnnouncementQueryPanel
				initialFilters={defaultAnnouncementFilterValues}
				loading={query.isFetching && !query.isPending}
				onApply={(nextFilters) => {
					setFilters(nextFilters);
					resetTablePage();
				}}
				onReset={() => {
					setFilters(defaultAnnouncementFilterValues);
					resetTablePage();
				}}
			/>

			<AnnouncementTablePanel
				canManage={canManage}
				data={query.data}
				isFullscreen={isTableFullscreen}
				loading={query.isFetching}
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
				onToggleFullscreen={toggleTableFullscreen}
				refreshing={query.isFetching && !query.isPending}
				tableState={tableState}
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
		</Flex>
	);
}
