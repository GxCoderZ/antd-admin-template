export type PlatformDictionaryStatus = "active" | "disabled";

export interface PlatformDictionaryType {
	code: string;
	createdAt: string;
	description: string;
	id: string;
	itemCount: number;
	name: string;
	status: PlatformDictionaryStatus;
	updatedAt: string;
}

export interface PlatformDictionaryItem {
	color: PlatformDictionaryTagColor;
	createdAt: string;
	description: string;
	id: string;
	label: string;
	sort: number;
	status: PlatformDictionaryStatus;
	typeId: string;
	updatedAt: string;
	value: string;
}

export type PlatformDictionaryTagColor =
	"blue" | "cyan" | "default" | "green" | "orange" | "purple" | "red";

export interface ListPlatformDictionaryTypesInput {
	order?: "asc" | "desc";
	page: number;
	pageSize: number;
	q?: string;
	sort?: "code" | "item_count" | "name" | "status" | "updated_at";
	status?: PlatformDictionaryStatus;
}

export interface ListPlatformDictionaryItemsInput {
	order?: "asc" | "desc";
	page: number;
	pageSize: number;
	q?: string;
	sort?: "label" | "sort" | "status" | "updated_at" | "value";
	status?: PlatformDictionaryStatus;
}

export interface CreatePlatformDictionaryTypeInput {
	code: string;
	description: string;
	name: string;
	status: PlatformDictionaryStatus;
}

export type UpdatePlatformDictionaryTypeInput =
	CreatePlatformDictionaryTypeInput;

export interface CreatePlatformDictionaryItemInput {
	color: PlatformDictionaryTagColor;
	description: string;
	label: string;
	sort: number;
	status: PlatformDictionaryStatus;
	value: string;
}

export type UpdatePlatformDictionaryItemInput =
	CreatePlatformDictionaryItemInput;
