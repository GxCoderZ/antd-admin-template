import { Descriptions, Drawer, Flex, Tag, Typography } from "antd";
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
	const sections: (DescriptionsProps & { key: string })[] = announcement
		? [
				{
					key: "basic",
					title: t("adminShell.recordDetails.sections.basic"),
					items: [
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
									{t(
										`adminShell.announcements.statuses.${announcement.status}`,
									)}
								</Tag>
							),
							label: t("adminShell.announcements.fields.status"),
						},
					],
				},
				{
					key: "content",
					title: t("adminShell.recordDetails.sections.content"),
					items: [
						{
							children: (
								<Paragraph style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
									{announcement.content}
								</Paragraph>
							),
							label: t("adminShell.announcements.fields.content"),
						},
					],
				},
				{
					key: "activity",
					title: t("adminShell.recordDetails.sections.activity"),
					items: [
						{
							children: formatDateTime(
								announcement.createdAt,
								formatPreferences,
							),
							label: t("adminShell.announcements.columns.createdAt"),
						},
						{
							children: formatDateTime(
								announcement.updatedAt,
								formatPreferences,
							),
							label: t("adminShell.announcements.columns.updatedAt"),
						},
						{
							children: announcement.id,
							label: t("adminShell.recordDetails.id"),
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
			open={announcement !== null}
			title={t("adminShell.announcements.detailTitle")}
		>
			<Flex vertical gap="large">
				{sections.map(({ key, ...section }) => (
					<Descriptions
						key={key}
						{...section}
						bordered
						column={1}
						size="small"
						styles={{ content: { overflowWrap: "anywhere" } }}
					/>
				))}
			</Flex>
		</Drawer>
	);
}
