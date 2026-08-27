import { ProForm } from "@ant-design/pro-components";
import { Form, Input, Select } from "antd";
import { useTranslation } from "react-i18next";

import { useRouteSessionState } from "../../../app/routeSessionState";
import type { PlatformAnnouncementStatus } from "#src/api/announcements";
import { LogQueryPanel } from "../../operations/LogTablePanel";

export interface AnnouncementFilterValues {
	q?: string;
	status: "all" | PlatformAnnouncementStatus;
}

interface AnnouncementQueryPanelProps {
	initialFilters: AnnouncementFilterValues;
	loading: boolean;
	onApply: (filters: AnnouncementFilterValues) => void;
	onReset: () => void;
}

const announcementsRouteKey = "/system/announcements";

export function AnnouncementQueryPanel({
	initialFilters,
	loading,
	onApply,
	onReset,
}: AnnouncementQueryPanelProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<AnnouncementFilterValues>();
	const [draftFilters, setDraftFilters] =
		useRouteSessionState<AnnouncementFilterValues>({
			initialState: initialFilters,
			routeKey: announcementsRouteKey,
			stateKey: "query-draft",
		});
	const [expanded, setExpanded] = useRouteSessionState({
		initialState: false,
		routeKey: announcementsRouteKey,
		stateKey: "query-expanded",
	});

	return (
		<LogQueryPanel<AnnouncementFilterValues>
			expanded={expanded}
			form={form}
			initialValues={initialFilters}
			loading={loading}
			onFinish={() => onApply(draftFilters)}
			onReset={() => {
				setDraftFilters(initialFilters);
				onReset();
			}}
			onExpandedChange={setExpanded}
			testId="admin-announcements-query-form"
		>
			<ProForm.Item key="q" label={t("adminShell.announcements.filters.q")}>
				<Input
					allowClear
					maxLength={100}
					onChange={(event) =>
						setDraftFilters((currentFilters) => ({
							...currentFilters,
							q: event.target.value,
						}))
					}
					placeholder={t("adminShell.announcements.placeholders.query")}
					style={{ width: "100%" }}
					value={draftFilters.q}
				/>
			</ProForm.Item>
			<ProForm.Item
				key="status"
				label={t("adminShell.announcements.filters.status")}
			>
				<Select
					aria-label={t("adminShell.announcements.filters.status")}
					onChange={(status: AnnouncementFilterValues["status"]) =>
						setDraftFilters((currentFilters) => ({
							...currentFilters,
							status,
						}))
					}
					options={[
						{
							label: t("adminShell.announcements.allStatuses"),
							value: "all",
						},
						{
							label: t("adminShell.announcements.statuses.draft"),
							value: "draft",
						},
						{
							label: t("adminShell.announcements.statuses.published"),
							value: "published",
						},
					]}
					style={{ width: "100%" }}
					value={draftFilters.status}
				/>
			</ProForm.Item>
		</LogQueryPanel>
	);
}
