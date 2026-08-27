import type { ProFormInstance } from "@ant-design/pro-components";
import { Input, Select } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { useRouteSessionState } from "../../../app/routeSessionState";
import type { ManagementQuery } from "../../operations/LogTablePanel";
import {
	dictionariesRouteKey,
	type ItemFilterValues,
	type TypeFilterValues,
} from "./DictionariesPageModel";

export function useTypeQuery({
	initialFilters,
	loading,
	onApply,
	onReset,
}: {
	initialFilters: TypeFilterValues;
	loading: boolean;
	onApply: (filters: TypeFilterValues) => void;
	onReset: () => void;
}): ManagementQuery<TypeFilterValues> {
	const { t } = useTranslation();
	const form = useRef<ProFormInstance<TypeFilterValues>>(undefined);
	const [draftFilters, setDraftFilters] =
		useRouteSessionState<TypeFilterValues>({
			initialState: initialFilters,
			routeKey: dictionariesRouteKey,
			stateKey: "type-query-draft",
		});
	const [expanded, setExpanded] = useRouteSessionState({
		initialState: false,
		routeKey: dictionariesRouteKey,
		stateKey: "type-query-expanded",
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
		testId: "admin-dictionaries-type-query-form",
		columns: [
			{
				dataIndex: "q",
				title: t("adminShell.dictionaries.filters.q"),
				formItemRender: () => (
					<Input
						allowClear
						maxLength={100}
						placeholder={t("adminShell.dictionaries.placeholders.query")}
					/>
				),
			},
			{
				dataIndex: "status",
				title: t("adminShell.dictionaries.filters.status"),
				formItemRender: () => (
					<Select
						aria-label={t("adminShell.dictionaries.filters.status")}
						options={[
							{ label: t("adminShell.dictionaries.allStatuses"), value: "all" },
							{
								label: t("adminShell.dictionaries.statuses.active"),
								value: "active",
							},
							{
								label: t("adminShell.dictionaries.statuses.disabled"),
								value: "disabled",
							},
						]}
					/>
				),
			},
		],
	};
}

export function useItemQuery({
	initialFilters,
	loading,
	onApply,
	onReset,
}: {
	initialFilters: ItemFilterValues;
	loading: boolean;
	onApply: (filters: ItemFilterValues) => void;
	onReset: () => void;
}): ManagementQuery<ItemFilterValues> {
	const { t } = useTranslation();
	const form = useRef<ProFormInstance<ItemFilterValues>>(undefined);
	const [draftFilters, setDraftFilters] =
		useRouteSessionState<ItemFilterValues>({
			initialState: initialFilters,
			routeKey: dictionariesRouteKey,
			stateKey: "item-query-draft",
		});
	const [expanded, setExpanded] = useRouteSessionState({
		initialState: false,
		routeKey: dictionariesRouteKey,
		stateKey: "item-query-expanded",
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
		testId: "admin-dictionaries-item-query-form",
		columns: [
			{
				dataIndex: "q",
				title: t("adminShell.dictionaries.filters.q"),
				formItemRender: () => (
					<Input
						allowClear
						maxLength={100}
						placeholder={t("adminShell.dictionaries.placeholders.itemQuery")}
					/>
				),
			},
			{
				dataIndex: "status",
				title: t("adminShell.dictionaries.filters.status"),
				formItemRender: () => (
					<Select
						aria-label={t("adminShell.dictionaries.filters.status")}
						options={[
							{ label: t("adminShell.dictionaries.allStatuses"), value: "all" },
							{
								label: t("adminShell.dictionaries.statuses.active"),
								value: "active",
							},
							{
								label: t("adminShell.dictionaries.statuses.disabled"),
								value: "disabled",
							},
						]}
					/>
				),
			},
		],
	};
}
