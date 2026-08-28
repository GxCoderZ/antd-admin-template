import type { ProColumns } from "@ant-design/pro-components";
import {
	CheckCircleOutlined,
	DeleteOutlined,
	EditOutlined,
	StopOutlined,
} from "@ant-design/icons";
import { Space, Tag, theme } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../../app/formatting";
import { useLocalePreferences } from "../../../app/localePreferences";
import {
	TableActionButton,
	TableActionMenu,
} from "../../../app/TableActionButton";
import type {
	PlatformDictionaryItem,
	PlatformDictionaryStatus,
	PlatformDictionaryTagColor,
	PlatformDictionaryType,
} from "#src/api/dictionaries";
import { DictionaryColorTag } from "./DictionariesPageParts";
import {
	getStatusColor,
	type ItemSort,
	type ItemTableState,
	type TypeSort,
	type TypeTableState,
} from "./DictionariesPageModel";

interface UseDictionaryTypeTableColumnsInput {
	canManage: boolean;
	onDelete: (dictionaryType: PlatformDictionaryType) => void;
	onEdit: (dictionaryType: PlatformDictionaryType) => void;
	onManageItems: (dictionaryType: PlatformDictionaryType) => void;
	onToggle: (dictionaryType: PlatformDictionaryType) => void;
	onView: (dictionaryType: PlatformDictionaryType) => void;
	tableState: TypeTableState;
}

interface UseDictionaryItemTableColumnsInput {
	canManage: boolean;
	onDelete: (dictionaryItem: PlatformDictionaryItem) => void;
	onEdit: (dictionaryItem: PlatformDictionaryItem) => void;
	onToggle: (dictionaryItem: PlatformDictionaryItem) => void;
	onView: (dictionaryItem: PlatformDictionaryItem) => void;
	tableState: ItemTableState;
}

export function useDictionaryTypeTableColumns({
	canManage,
	onDelete,
	onEdit,
	onManageItems,
	onToggle,
	onView,
	tableState,
}: UseDictionaryTypeTableColumnsInput) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const formatPreferences = useLocalePreferences();

	return useMemo<ProColumns<PlatformDictionaryType>[]>(() => {
		const sortOrder = (column: TypeSort) =>
			tableState.sort === column && tableState.order
				? tableState.order === "asc"
					? "ascend"
					: "descend"
				: null;
		const renderStatus = (status: PlatformDictionaryStatus) => (
			<Tag color={getStatusColor(status)}>
				{t(`adminShell.dictionaries.statuses.${status}`)}
			</Tag>
		);
		const columns: ProColumns<PlatformDictionaryType>[] = [
			{
				dataIndex: "name",
				key: "name",
				renderText: (name: string, dictionaryType) => (
					<TableActionButton onClick={() => onView(dictionaryType)}>
						{name}
					</TableActionButton>
				),
				sorter: true,
				sortOrder: sortOrder("name"),
				title: t("adminShell.dictionaries.columns.name"),
				width: token.controlHeight * 4,
			},
			{
				dataIndex: "code",
				key: "code",
				sorter: true,
				sortOrder: sortOrder("code"),
				title: t("adminShell.dictionaries.columns.code"),
				width: token.controlHeight * 5,
			},
			{
				dataIndex: "itemCount",
				key: "itemCount",
				sorter: true,
				sortOrder: sortOrder("item_count"),
				title: t("adminShell.dictionaries.columns.itemCount"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "status",
				key: "status",
				renderText: renderStatus,
				sorter: true,
				sortOrder: sortOrder("status"),
				title: t("adminShell.dictionaries.columns.status"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				renderText: (value: string) => formatDateTime(value, formatPreferences),
				sorter: true,
				sortOrder: sortOrder("updated_at"),
				title: t("adminShell.dictionaries.columns.updatedAt"),
				width: token.controlHeight * 5,
			},
		];

		if (canManage) {
			columns.push({
				key: "actions",
				render: (_value, dictionaryType) => (
					<Space size="middle">
						<TableActionButton onClick={() => onManageItems(dictionaryType)}>
							{t("adminShell.dictionaries.manageItems")}
						</TableActionButton>
						<TableActionMenu
							items={[
								{
									icon: <EditOutlined aria-hidden />,
									key: "edit",
									label: t("adminShell.dictionaries.edit"),
									onClick: () => onEdit(dictionaryType),
								},
								{
									icon:
										dictionaryType.status === "active" ? (
											<StopOutlined aria-hidden />
										) : (
											<CheckCircleOutlined aria-hidden />
										),
									key: "toggle",
									label: t(
										dictionaryType.status === "active"
											? "adminShell.dictionaries.disable"
											: "adminShell.dictionaries.enable",
									),
									onClick: () => onToggle(dictionaryType),
								},
								{
									danger: true,
									icon: <DeleteOutlined aria-hidden />,
									key: "delete",
									label: t("adminShell.dictionaries.delete"),
									onClick: () => onDelete(dictionaryType),
								},
							]}
							label={t("adminShell.dictionaries.more")}
						/>
					</Space>
				),
				title: t("adminShell.dictionaries.columns.actions"),
				width: token.controlHeight * 5,
			});
		}

		return columns;
	}, [
		canManage,
		formatPreferences,
		onDelete,
		onEdit,
		onManageItems,
		onToggle,
		onView,
		t,
		tableState.order,
		tableState.sort,
		token.controlHeight,
	]);
}

export function useDictionaryItemTableColumns({
	canManage,
	onDelete,
	onEdit,
	onToggle,
	onView,
	tableState,
}: UseDictionaryItemTableColumnsInput) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const formatPreferences = useLocalePreferences();

	return useMemo<ProColumns<PlatformDictionaryItem>[]>(() => {
		const sortOrder = (column: ItemSort) =>
			tableState.sort === column && tableState.order
				? tableState.order === "asc"
					? "ascend"
					: "descend"
				: null;
		const renderStatus = (status: PlatformDictionaryStatus) => (
			<Tag color={getStatusColor(status)}>
				{t(`adminShell.dictionaries.statuses.${status}`)}
			</Tag>
		);
		const columns: ProColumns<PlatformDictionaryItem>[] = [
			{
				dataIndex: "label",
				key: "label",
				renderText: (label: string, dictionaryItem) => (
					<TableActionButton onClick={() => onView(dictionaryItem)}>
						{label}
					</TableActionButton>
				),
				sorter: true,
				sortOrder: sortOrder("label"),
				title: t("adminShell.dictionaries.columns.label"),
				width: token.controlHeight * 4,
			},
			{
				dataIndex: "value",
				key: "value",
				sorter: true,
				sortOrder: sortOrder("value"),
				title: t("adminShell.dictionaries.columns.value"),
				width: token.controlHeight * 4,
			},
			{
				dataIndex: "color",
				key: "color",
				renderText: (color: PlatformDictionaryTagColor, dictionaryItem) => (
					<DictionaryColorTag color={color}>
						{dictionaryItem.label}
					</DictionaryColorTag>
				),
				title: t("adminShell.dictionaries.columns.color"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "sort",
				key: "sort",
				sorter: true,
				sortOrder: sortOrder("sort"),
				title: t("adminShell.dictionaries.columns.sort"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "status",
				key: "status",
				renderText: renderStatus,
				sorter: true,
				sortOrder: sortOrder("status"),
				title: t("adminShell.dictionaries.columns.status"),
				width: token.controlHeight * 3,
			},
			{
				dataIndex: "updatedAt",
				key: "updatedAt",
				renderText: (value: string) => formatDateTime(value, formatPreferences),
				sorter: true,
				sortOrder: sortOrder("updated_at"),
				title: t("adminShell.dictionaries.columns.updatedAt"),
				width: token.controlHeight * 5,
			},
		];

		if (canManage) {
			columns.push({
				key: "actions",
				render: (_value, dictionaryItem) => (
					<Space size="middle">
						<TableActionButton onClick={() => onEdit(dictionaryItem)}>
							{t("adminShell.dictionaries.edit")}
						</TableActionButton>
						<TableActionMenu
							items={[
								{
									icon:
										dictionaryItem.status === "active" ? (
											<StopOutlined aria-hidden />
										) : (
											<CheckCircleOutlined aria-hidden />
										),
									key: "toggle",
									label: t(
										dictionaryItem.status === "active"
											? "adminShell.dictionaries.disable"
											: "adminShell.dictionaries.enable",
									),
									onClick: () => onToggle(dictionaryItem),
								},
								{
									danger: true,
									icon: <DeleteOutlined aria-hidden />,
									key: "delete",
									label: t("adminShell.dictionaries.delete"),
									onClick: () => onDelete(dictionaryItem),
								},
							]}
							label={t("adminShell.dictionaries.more")}
						/>
					</Space>
				),
				title: t("adminShell.dictionaries.columns.actions"),
				width: token.controlHeight * 5,
			});
		}

		return columns;
	}, [
		canManage,
		formatPreferences,
		onDelete,
		onEdit,
		onToggle,
		onView,
		t,
		tableState.order,
		tableState.sort,
		token.controlHeight,
	]);
}
