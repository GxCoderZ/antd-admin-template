import { Col, Form, Input, Select } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useQueryFilterLayout } from "../../../app/queryFilterLayout";
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

const fieldCount = 2;

export function AnnouncementQueryPanel({
	initialFilters,
	loading,
	onApply,
	onReset,
}: AnnouncementQueryPanelProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<AnnouncementFilterValues>();
	const [draftFilters, setDraftFilters] =
		useState<AnnouncementFilterValues>(initialFilters);
	const [expanded, setExpanded] = useState(false);
	const {
		canExpand,
		collapsedFieldCount,
		columnSpan,
		containerRef,
		formLayout,
		submitterOffset,
	} = useQueryFilterLayout({ expanded, fieldCount });
	const showStatusFilter = expanded || collapsedFieldCount >= 2;

	return (
		<LogQueryPanel<AnnouncementFilterValues>
			actionsTestId="admin-announcements-query-actions"
			canExpand={canExpand}
			columnSpan={columnSpan}
			containerRef={containerRef}
			expanded={expanded}
			form={form}
			formLayout={formLayout}
			initialValues={initialFilters}
			loading={loading}
			onFinish={() => onApply(draftFilters)}
			onReset={() => {
				setDraftFilters(initialFilters);
				onReset();
			}}
			onToggle={() => setExpanded((currentExpanded) => !currentExpanded)}
			submitterOffset={submitterOffset}
			testId="admin-announcements-query-form"
		>
			<Col span={columnSpan}>
				<Form.Item
					label={t("adminShell.announcements.filters.q")}
					style={{ marginBottom: 0 }}
				>
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
				</Form.Item>
			</Col>
			{showStatusFilter ? (
				<Col span={columnSpan}>
					<Form.Item
						label={t("adminShell.announcements.filters.status")}
						style={{ marginBottom: 0 }}
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
					</Form.Item>
				</Col>
			) : null}
		</LogQueryPanel>
	);
}
