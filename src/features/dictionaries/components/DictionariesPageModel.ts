import type { TableColumnConfig } from "../../../app/tableColumnVisibility";
import type {
	ListPlatformDictionaryItemsInput,
	ListPlatformDictionaryTypesInput,
	PlatformDictionaryStatus,
	PlatformDictionaryTagColor,
} from "#src/api/dictionaries";
export type TypeSort = NonNullable<ListPlatformDictionaryTypesInput["sort"]>;
export type ItemSort = NonNullable<ListPlatformDictionaryItemsInput["sort"]>;

export const typeColumnVisibility: readonly TableColumnConfig<string>[] = [
	{ key: "name", visibility: "required" },
	{ key: "code", visibility: "recommended" },
	{ key: "status", visibility: "recommended" },
	{ key: "itemCount", visibility: "recommended" },
	{ key: "updatedAt", visibility: "optional" },
	{ key: "actions", visibility: "required" },
];
export const itemColumnVisibility: readonly TableColumnConfig<string>[] = [
	{ key: "label", visibility: "required" },
	{ key: "value", visibility: "recommended" },
	{ key: "color", visibility: "optional" },
	{ key: "sort", visibility: "recommended" },
	{ key: "status", visibility: "recommended" },
	{ key: "updatedAt", visibility: "optional" },
	{ key: "actions", visibility: "required" },
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
	order: undefined,
	page: 1,
	pageSize: 10,
	sort: undefined,
};
export const defaultItemTableState: ItemTableState = {
	order: undefined,
	page: 1,
	pageSize: 10,
	sort: undefined,
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
