import type { ResponsiveTableColumnConfig } from "../../../app/tableColumnVisibility";
import type {
	ListPlatformDictionaryItemsInput,
	ListPlatformDictionaryTypesInput,
	PlatformDictionaryStatus,
	PlatformDictionaryTagColor,
} from "#src/api/dictionaries";
export type TypeSort = NonNullable<ListPlatformDictionaryTypesInput["sort"]>;
export type ItemSort = NonNullable<ListPlatformDictionaryItemsInput["sort"]>;

export const typeColumnVisibility: readonly ResponsiveTableColumnConfig<string>[] =
	[
		{ key: "name", priority: "compact", required: true },
		{ key: "code", priority: "regular" },
		{ key: "status", priority: "compact" },
		{ key: "itemCount", priority: "spacious" },
		{ key: "updatedAt", priority: "optional" },
		{ key: "actions", priority: "compact", required: true },
	];
export const itemColumnVisibility: readonly ResponsiveTableColumnConfig<string>[] =
	[
		{ key: "label", priority: "compact", required: true },
		{ key: "value", priority: "regular" },
		{ key: "color", priority: "spacious" },
		{ key: "sort", priority: "spacious" },
		{ key: "status", priority: "compact" },
		{ key: "updatedAt", priority: "optional" },
		{ key: "actions", priority: "compact", required: true },
	];

export interface PageData<Row> {
	items: Row[];
	page: number;
	pageSize: number;
	total: number;
}

export interface TypeFilterValues {
	q?: string;
	status: "all" | PlatformDictionaryStatus;
}

export interface ItemFilterValues {
	q?: string;
	status: "all" | PlatformDictionaryStatus;
}

export interface TypeTableState {
	order: ListPlatformDictionaryTypesInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformDictionaryTypesInput["sort"];
}

export interface ItemTableState {
	order: ListPlatformDictionaryItemsInput["order"];
	page: number;
	pageSize: number;
	sort: ListPlatformDictionaryItemsInput["sort"];
}

export const defaultTypeFilters: TypeFilterValues = { status: "all" };
export const defaultItemFilters: ItemFilterValues = { status: "all" };
export const dictionariesRouteKey = "/system/dictionaries";
export const defaultTypeTableState: TypeTableState = {
	order: "asc",
	page: 1,
	pageSize: 10,
	sort: "code",
};
export const defaultItemTableState: ItemTableState = {
	order: "asc",
	page: 1,
	pageSize: 10,
	sort: "sort",
};
export const colorOptions: PlatformDictionaryTagColor[] = [
	"default",
	"green",
	"blue",
	"cyan",
	"orange",
	"purple",
	"red",
];
export const typeSortMap: Record<string, TypeSort> = {
	code: "code",
	itemCount: "item_count",
	name: "name",
	status: "status",
	updatedAt: "updated_at",
};
export const itemSortMap: Record<string, ItemSort> = {
	label: "label",
	sort: "sort",
	status: "status",
	updatedAt: "updated_at",
	value: "value",
};

export function getStatusColor(status: PlatformDictionaryStatus) {
	return status === "active" ? "success" : "default";
}
