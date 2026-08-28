import { Drawer, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";
import type {
	PlatformDictionaryItem,
	PlatformDictionaryType,
} from "#src/api/dictionaries";
import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import {
	RecordDetails,
	type RecordDetailSection,
} from "../../../app/RecordDetails";
import { getStatusColor } from "./DictionariesPageModel";
import { DictionaryColorTag } from "./DictionariesPageParts";

interface DictionaryTypeDetailDrawerProps {
	dictionaryType: PlatformDictionaryType | null;
	onClose: () => void;
}

export function DictionaryTypeDetailDrawer({
	dictionaryType,
	onClose,
}: DictionaryTypeDetailDrawerProps) {
	const { t } = useTranslation();
	const formatPreferences = useLocalePreferences();
	const sections: RecordDetailSection[] = dictionaryType
		? [
				{
					key: "details",
					items: [
						{
							children: dictionaryType.name,
							label: t("adminShell.dictionaries.fields.name"),
						},
						{
							children: (
								<Typography.Text code>{dictionaryType.code}</Typography.Text>
							),
							label: t("adminShell.dictionaries.fields.code"),
						},
						{
							children: dictionaryType.itemCount,
							label: t("adminShell.dictionaries.columns.itemCount"),
						},
						{
							children: (
								<Tag color={getStatusColor(dictionaryType.status)}>
									{t(
										`adminShell.dictionaries.statuses.${dictionaryType.status}`,
									)}
								</Tag>
							),
							label: t("adminShell.dictionaries.fields.status"),
						},
						{
							children: dictionaryType.description || (
								<Typography.Text type="secondary">-</Typography.Text>
							),
							label: t("adminShell.dictionaries.fields.description"),
						},
						{
							children: formatDateTime(
								dictionaryType.createdAt,
								formatPreferences,
							),
							label: t("adminShell.dictionaries.columns.createdAt"),
						},
						{
							children: formatDateTime(
								dictionaryType.updatedAt,
								formatPreferences,
							),
							label: t("adminShell.dictionaries.columns.updatedAt"),
						},
						{
							children: dictionaryType.id,
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
			open={dictionaryType !== null}
			title={t("adminShell.dictionaries.typeDetailTitle")}
		>
			<RecordDetails sections={sections} />
		</Drawer>
	);
}

interface DictionaryItemDetailDrawerProps {
	dictionaryItem: PlatformDictionaryItem | null;
	onClose: () => void;
}

export function DictionaryItemDetailDrawer({
	dictionaryItem,
	onClose,
}: DictionaryItemDetailDrawerProps) {
	const { t } = useTranslation();
	const formatPreferences = useLocalePreferences();
	const sections: RecordDetailSection[] = dictionaryItem
		? [
				{
					key: "basic",
					title: t("adminShell.recordDetails.sections.basic"),
					items: [
						{
							children: dictionaryItem.label,
							label: t("adminShell.dictionaries.fields.label"),
						},
						{
							children: (
								<Typography.Text code>{dictionaryItem.value}</Typography.Text>
							),
							label: t("adminShell.dictionaries.fields.value"),
						},
						{
							children: (
								<DictionaryColorTag color={dictionaryItem.color}>
									{t(`adminShell.dictionaries.colors.${dictionaryItem.color}`)}
								</DictionaryColorTag>
							),
							label: t("adminShell.dictionaries.fields.color"),
						},
						{
							children: dictionaryItem.sort,
							label: t("adminShell.dictionaries.fields.sort"),
						},
						{
							children: (
								<Tag color={getStatusColor(dictionaryItem.status)}>
									{t(
										`adminShell.dictionaries.statuses.${dictionaryItem.status}`,
									)}
								</Tag>
							),
							label: t("adminShell.dictionaries.fields.status"),
						},
						{
							children: dictionaryItem.description || (
								<Typography.Text type="secondary">-</Typography.Text>
							),
							label: t("adminShell.dictionaries.fields.description"),
						},
					],
				},
				{
					key: "activity",
					title: t("adminShell.recordDetails.sections.activity"),
					items: [
						{
							children: dictionaryItem.typeId,
							label: t("adminShell.dictionaries.typeId"),
						},
						{
							children: formatDateTime(
								dictionaryItem.createdAt,
								formatPreferences,
							),
							label: t("adminShell.dictionaries.columns.createdAt"),
						},
						{
							children: formatDateTime(
								dictionaryItem.updatedAt,
								formatPreferences,
							),
							label: t("adminShell.dictionaries.columns.updatedAt"),
						},
						{
							children: dictionaryItem.id,
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
			open={dictionaryItem !== null}
			title={t("adminShell.dictionaries.itemDetailTitle")}
		>
			<RecordDetails sections={sections} />
		</Drawer>
	);
}
