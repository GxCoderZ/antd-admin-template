import { Descriptions, Drawer, Tag, Typography } from "antd";
import type { DescriptionsProps } from "antd";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import type { PlatformAnnouncement } from "#src/api/announcements";

const { Paragraph } = Typography;

interface AnnouncementDetailDrawerProps {
	announcement: PlatformAnnouncement | null;
	onClose: () => void;
}

export function AnnouncementDetailDrawer({
	announcement,
	onClose,
}: AnnouncementDetailDrawerProps) {
	const { t } = useTranslation();
	const formatPreferences = useLocalePreferences();
	const items: DescriptionsProps["items"] = announcement
		? [
				{
					children: announcement.title,
					label: t("adminShell.announcements.fields.title"),
				},
				{
					children: (
						<Tag
							color={
								announcement.status === "published" ? "success" : "default"
							}
						>
							{t(`adminShell.announcements.statuses.${announcement.status}`)}
						</Tag>
					),
					label: t("adminShell.announcements.fields.status"),
				},
				{
					children: (
						<Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
							{announcement.content}
						</Paragraph>
					),
					label: t("adminShell.announcements.fields.content"),
				},
				{
					children: formatDateTime(announcement.createdAt, formatPreferences),
					label: t("adminShell.announcements.columns.createdAt"),
				},
				{
					children: formatDateTime(announcement.updatedAt, formatPreferences),
					label: t("adminShell.announcements.columns.updatedAt"),
				},
			]
		: [];

	return (
		<Drawer
			destroyOnHidden
			onClose={onClose}
			open={announcement !== null}
			title={t("adminShell.announcements.detailTitle")}
		>
			<Descriptions bordered column={1} items={items} size="small" />
		</Drawer>
	);
}
