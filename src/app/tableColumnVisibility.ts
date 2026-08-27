import type { TableColumnsType } from "antd";
import { useMemo, useState } from "react";

import {
	clearTableColumnSettingsPreference,
	readTableColumnSettingsPreference,
	writeTableColumnSettingsPreference,
} from "./preferenceStorage";

export interface TableColumnConfig<Key extends string = string> {
	key: Key;
	visibility: "required" | "recommended" | "optional";
}

interface UseTableColumnsInput<Row> {
	columns: TableColumnsType<Row>;
	configs: readonly TableColumnConfig[];
	storageKey: string;
}

export function useTableColumns<Row>({
	columns,
	configs,
	storageKey,
}: UseTableColumnsInput<Row>) {
	const columnKeys = useMemo(
		() => columns.map((column) => String(column.key)),
		[columns],
	);
	const [settings, setSettings] = useState(() =>
		readTableColumnSettingsPreference(storageKey, columnKeys),
	);
	const requiredKeys = configs
		.filter((config) => config.visibility === "required")
		.map((config) => config.key);
	const recommendedKeys = configs
		.filter((config) => config.visibility !== "optional")
		.map((config) => config.key);
	const configurableColumnKeys = columnKeys.filter(
		(key) => !requiredKeys.includes(key),
	);
	const visibleColumnKeys = columnKeys.filter(
		(key) =>
			requiredKeys.includes(key) ||
			(settings?.visibleColumnKeys ?? recommendedKeys).includes(key),
	);
	const orderedKeys = [
		...new Set([...(settings?.columnOrder ?? []), ...columnKeys]),
	].filter((key) => key !== "actions");
	if (columnKeys.includes("actions")) orderedKeys.push("actions");
	const columnByKey = new Map(
		columns.map((column) => [String(column.key), column]),
	);
	const visibleColumns = orderedKeys.flatMap((key) => {
		const column = columnByKey.get(key);
		return column && visibleColumnKeys.includes(key) ? [column] : [];
	});
	const selectedCount = configurableColumnKeys.filter((key) =>
		visibleColumnKeys.includes(key),
	).length;

	return {
		configurableColumnKeys,
		isAllColumnsVisible:
			configurableColumnKeys.length > 0 &&
			selectedCount === configurableColumnKeys.length,
		isSomeColumnsVisible:
			selectedCount > 0 && selectedCount < configurableColumnKeys.length,
		minimumWidth: visibleColumns.reduce(
			(total, column) =>
				total + (typeof column.width === "number" ? column.width : 0),
			0,
		),
		resetColumnSettings: () => {
			setSettings(undefined);
			clearTableColumnSettingsPreference(storageKey);
		},
		setVisibleColumnKeys: (keys: readonly string[]) => {
			const nextSettings = {
				columnOrder: orderedKeys,
				visibleColumnKeys: columnKeys.filter(
					(key) => requiredKeys.includes(key) || keys.includes(key),
				),
			};
			setSettings(nextSettings);
			writeTableColumnSettingsPreference(storageKey, nextSettings);
		},
		visibleColumnKeys,
		visibleColumns,
	};
}
