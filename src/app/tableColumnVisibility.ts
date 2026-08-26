import { theme } from "antd";
import type { TableColumnsType } from "antd";
import type { RefObject } from "react";
import { useLayoutEffect, useMemo, useState } from "react";

import {
	clearTableColumnSettingsPreference,
	readTableColumnSettingsPreference,
	writeTableColumnSettingsPreference,
} from "./preferenceStorage";

type ResponsiveTableColumnPriority =
	"compact" | "regular" | "spacious" | "optional";

export interface ResponsiveTableColumnConfig<Key extends string> {
	key: Key;
	priority: ResponsiveTableColumnPriority;
	required?: boolean;
}

interface UseResponsiveTableColumnsInput<Row, Key extends string> {
	availableColumnKeys?: readonly Key[];
	columnKeys: readonly Key[];
	columns: TableColumnsType<Row>;
	configs: readonly ResponsiveTableColumnConfig<Key>[];
	containerRef: RefObject<HTMLElement | null>;
	storageKey: string;
}

const priorityRank: Record<ResponsiveTableColumnPriority, number> = {
	compact: 0,
	regular: 1,
	spacious: 2,
	optional: 3,
};

function uniqueKnownKeys<Key extends string>(
	keys: readonly string[],
	allowedKeys: readonly Key[],
) {
	return allowedKeys.filter((allowedKey) => keys.includes(allowedKey));
}

function withRequiredKeys<Key extends string>(
	keys: readonly Key[],
	requiredKeys: readonly Key[],
	availableKeys: readonly Key[],
) {
	const nextKeys = new Set(keys);
	requiredKeys.forEach((key) => {
		if (availableKeys.includes(key)) {
			nextKeys.add(key);
		}
	});
	return availableKeys.filter((key) => nextKeys.has(key));
}

function getColumnWidth<Row>(column: TableColumnsType<Row>[number]) {
	return typeof column.width === "number" ? column.width : 0;
}

function getTableColumnsMinimumWidth<Row>(columns: TableColumnsType<Row>) {
	return columns.reduce((total, column) => total + getColumnWidth(column), 0);
}

export function useResponsiveTableColumns<Row, Key extends string>({
	availableColumnKeys,
	columnKeys,
	columns,
	configs,
	containerRef,
	storageKey,
}: UseResponsiveTableColumnsInput<Row, Key>) {
	const { token } = theme.useToken();
	const initialWidth =
		typeof document === "undefined"
			? token.screenXLMin
			: document.body.clientWidth || token.screenXLMin;
	const [containerWidth, setContainerWidth] = useState(initialWidth);
	const allowedColumnKeys = useMemo(() => [...columnKeys], [columnKeys]);
	const availableKeys = useMemo(
		() =>
			availableColumnKeys
				? uniqueKnownKeys(availableColumnKeys, allowedColumnKeys)
				: allowedColumnKeys,
		[allowedColumnKeys, availableColumnKeys],
	);
	const configByKey = useMemo(
		() => new Map(configs.map((config) => [config.key, config])),
		[configs],
	);
	const requiredColumnKeys = useMemo(
		() =>
			availableKeys.filter(
				(columnKey) => configByKey.get(columnKey)?.required === true,
			),
		[availableKeys, configByKey],
	);
	const storedSettings = useMemo(
		() => readTableColumnSettingsPreference(storageKey, allowedColumnKeys),
		[allowedColumnKeys, storageKey],
	);
	const [columnOrder, setColumnOrderState] = useState<Key[]>(
		() => storedSettings?.columnOrder ?? allowedColumnKeys,
	);
	const [manualVisibleColumnKeys, setManualVisibleColumnKeys] = useState<
		Key[] | null
	>(() =>
		storedSettings
			? withRequiredKeys(
					storedSettings.visibleColumnKeys,
					requiredColumnKeys,
					availableKeys,
				)
			: null,
	);

	useLayoutEffect(() => {
		const container = containerRef.current;
		if (!container) {
			return undefined;
		}

		const updateWidth = (width: number) => {
			if (width > token.margin + token.lineWidth) {
				setContainerWidth(width);
			}
		};
		const observer = new ResizeObserver(([entry]) => {
			updateWidth(entry?.contentRect.width ?? 0);
		});

		updateWidth(container.getBoundingClientRect().width);
		observer.observe(container);

		return () => observer.disconnect();
	}, [containerRef, token.lineWidth, token.margin]);

	const responsiveVisibleColumnKeys = useMemo(() => {
		const maximumPriority =
			containerWidth < token.screenLGMin ? "compact" : "regular";
		const maximumRank = priorityRank[maximumPriority];

		return availableKeys.filter((columnKey) => {
			const config = configByKey.get(columnKey);
			if (config?.required) {
				return true;
			}
			if (!config || config.priority === "optional") {
				return false;
			}
			return priorityRank[config.priority] <= maximumRank;
		});
	}, [availableKeys, configByKey, containerWidth, token.screenLGMin]);

	const visibleColumnKeys = withRequiredKeys(
		manualVisibleColumnKeys ?? responsiveVisibleColumnKeys,
		requiredColumnKeys,
		availableKeys,
	);
	const orderedColumnKeys = useMemo(
		() => [
			...columnOrder.filter((columnKey) => availableKeys.includes(columnKey)),
			...availableKeys.filter((columnKey) => !columnOrder.includes(columnKey)),
		],
		[availableKeys, columnOrder],
	);
	const visibleColumns = useMemo(() => {
		const visibleColumnKeySet = new Set(visibleColumnKeys);
		const columnByKey = new Map(
			columns.map((column) => [String(column.key) as Key, column]),
		);

		return orderedColumnKeys.flatMap((columnKey) => {
			const column = columnByKey.get(columnKey);
			return column && visibleColumnKeySet.has(columnKey) ? [column] : [];
		});
	}, [columns, orderedColumnKeys, visibleColumnKeys]);
	const minimumWidth = getTableColumnsMinimumWidth(visibleColumns);
	const persistSettings = (nextOrder: Key[], nextVisibleKeys: Key[]) => {
		writeTableColumnSettingsPreference(storageKey, {
			columnOrder: nextOrder,
			visibleColumnKeys: nextVisibleKeys,
		});
	};
	const setVisibleColumnKeys = (nextKeys: readonly Key[]) => {
		const nextVisibleKeys = withRequiredKeys(
			nextKeys,
			requiredColumnKeys,
			availableKeys,
		);
		setManualVisibleColumnKeys(nextVisibleKeys);
		persistSettings(columnOrder, nextVisibleKeys);
	};
	const setColumnOrder = (
		nextOrder: Key[] | ((currentOrder: Key[]) => Key[]),
	) => {
		setColumnOrderState((currentOrder) => {
			const resolvedOrder =
				typeof nextOrder === "function" ? nextOrder(currentOrder) : nextOrder;
			const normalizedOrder = [
				...uniqueKnownKeys(resolvedOrder, allowedColumnKeys),
				...allowedColumnKeys.filter((key) => !resolvedOrder.includes(key)),
			];
			persistSettings(normalizedOrder, visibleColumnKeys);
			return normalizedOrder;
		});
	};
	const resetColumnSettings = () => {
		setColumnOrderState(allowedColumnKeys);
		setManualVisibleColumnKeys(null);
		clearTableColumnSettingsPreference(storageKey);
	};

	return {
		availableColumnKeys: availableKeys,
		columnOrder: orderedColumnKeys,
		isAllColumnsVisible: availableKeys.every((key) =>
			visibleColumnKeys.includes(key),
		),
		isSomeColumnsVisible:
			visibleColumnKeys.length > 0 &&
			visibleColumnKeys.length < availableKeys.length,
		minimumWidth,
		requiredColumnKeys,
		resetColumnSettings,
		setColumnOrder,
		setVisibleColumnKeys,
		visibleColumnKeys,
		visibleColumns,
	};
}
