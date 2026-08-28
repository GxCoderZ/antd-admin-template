import { Drawer, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

import type { PlatformPosition } from "#src/api/positions";
import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import {
	RecordDetails,
	type RecordDetailSection,
} from "../../app/RecordDetails";

interface PositionDetailDrawerProps {
	position: PlatformPosition | undefined;
	onClose: () => void;
}

export function PositionDetailDrawer({
	position,
	onClose,
}: PositionDetailDrawerProps) {
	const { t } = useTranslation();
	const formatPreferences = useLocalePreferences();
	const sections: RecordDetailSection[] = position
		? [
				{
					key: "basic",
					title: t("adminShell.recordDetails.sections.basic"),
					items: [
						{
							label: t("adminShell.positions.fields.name"),
							children: position.name,
						},
						{
							label: t("adminShell.positions.fields.code"),
							children: position.code,
						},
						{
							label: t("adminShell.positions.columns.memberCount"),
							children: position.memberCount,
						},
						{
							label: t("adminShell.positions.fields.status"),
							children: (
								<Tag
									color={position.status === "active" ? "success" : "default"}
								>
									{t(`adminShell.positions.statuses.${position.status}`)}
								</Tag>
							),
						},
						{
							label: t("adminShell.positions.fields.department"),
							children: position.departmentName,
						},
					],
				},
				{
					key: "activity",
					title: t("adminShell.recordDetails.sections.activity"),
					items: [
						{
							label: t("adminShell.positions.departmentId"),
							children: position.departmentId,
						},
						{
							label: t("adminShell.recordDetails.createdAt"),
							children: formatDateTime(position.createdAt, formatPreferences),
						},
						{
							label: t("adminShell.positions.columns.updatedAt"),
							children: formatDateTime(position.updatedAt, formatPreferences),
						},
						{
							label: t("adminShell.recordDetails.id"),
							children: <Typography.Text code>{position.id}</Typography.Text>,
						},
					],
				},
			]
		: [];
	return (
		<Drawer
			destroyOnHidden
			size="min(560px, 100vw)"
			onClose={onClose}
			open={Boolean(position)}
			title={t("adminShell.positions.detailTitle")}
		>
			<RecordDetails sections={sections} />
		</Drawer>
	);
}
