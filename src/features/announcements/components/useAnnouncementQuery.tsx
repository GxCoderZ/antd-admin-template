import type { ProFormInstance } from "@ant-design/pro-components";
import { useRef } from "react";
import { Input, Select } from "antd";
import { useTranslation } from "react-i18next";

import { useRouteSessionState } from "../../../app/routeSessionState";
import type { PlatformAnnouncementStatus } from "#src/api/announcements";
import type { ManagementQuery } from "../../operations/LogTablePanel";

export interface AnnouncementFilterValues {
	q?: string;
	status: "all" | PlatformAnnouncementStatus;
}

export function useAnnouncementQuery({
	initialFilters,
	loading,
	onApply,
	onReset,
}: {
	initialFilters: AnnouncementFilterValues;
	loading: boolean;
	onApply: (filters: AnnouncementFilterValues) => void;
	onReset: () => void;
}): ManagementQuery<AnnouncementFilterValues> {
	const { t } = useTranslation();
	const form = useRef<ProFormInstance<AnnouncementFilterValues>>(undefined);
	const [draftFilters, setDraftFilters] =
		useRouteSessionState<AnnouncementFilterValues>({
			initialState: initialFilters,
			routeKey: "/system/announcements",
			stateKey: "query-draft",
		});
	const [expanded, setExpanded] = useRouteSessionState({
		initialState: false,
		routeKey: "/system/announcements",
		stateKey: "query-expanded",
	});

	return {
		expanded,
		formRef: form,
		initialValues: draftFilters,
		loading,
		onFinish: onApply,
		onReset: () => {
			form.current?.setFieldsValue({ q: "", ...initialFilters });
			setDraftFilters(initialFilters);
			onReset();
		},
		onValuesChange: (values) => setDraftFilters(values),
		onExpandedChange: setExpanded,
		testId: "admin-announcements-query-form",
		columns: [
			{
				dataIndex: "q",
				title: t("adminShell.announcements.filters.q"),
				formItemRender: () => (
					<Input
						allowClear
						maxLength={100}
						placeholder={t("adminShell.announcements.placeholders.query")}
					/>
				),
			},
			{
				dataIndex: "status",
				title: t("adminShell.announcements.filters.status"),
				formItemRender: () => (
					<Select
						aria-label={t("adminShell.announcements.filters.status")}
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
					/>
				),
			},
		],
	};
}
