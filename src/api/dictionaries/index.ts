import { request, type ApiPage } from "../client";
import type {
	CreatePlatformDictionaryItemInput,
	CreatePlatformDictionaryTypeInput,
	ListPlatformDictionaryItemsInput,
	ListPlatformDictionaryTypesInput,
	PlatformDictionaryItem,
	PlatformDictionaryType,
	UpdatePlatformDictionaryItemInput,
	UpdatePlatformDictionaryTypeInput,
} from "./types";

export * from "./types";

export const platformDictionaryTypesQueryKey = [
	"platform-dictionary-types",
] as const;

export const platformDictionaryItemsQueryKey = [
	"platform-dictionary-items",
] as const;

export function listPlatformDictionaryTypes(
	input: ListPlatformDictionaryTypesInput,
	signal?: AbortSignal,
) {
	const { pageSize, ...query } = input;
	return request<ApiPage<PlatformDictionaryType>>(
		"/platform/dictionaries/types",
		{
			query: { ...query, page_size: pageSize },
			signal,
		},
	).then(({ items, page, page_size, total }) => ({
		items,
		page,
		pageSize: page_size,
		total,
	}));
}

export function createPlatformDictionaryType(
	input: CreatePlatformDictionaryTypeInput,
) {
	return request<PlatformDictionaryType>("/platform/dictionaries/types", {
		body: input,
		method: "POST",
	});
}

export function updatePlatformDictionaryType({
	input,
	typeId,
}: {
	input: UpdatePlatformDictionaryTypeInput;
	typeId: string;
}) {
	return request<PlatformDictionaryType>(
		`/platform/dictionaries/types/${typeId}`,
		{
			body: input,
			method: "PATCH",
		},
	);
}

export function deletePlatformDictionaryType(typeId: string) {
	return request<void>(`/platform/dictionaries/types/${typeId}`, {
		method: "DELETE",
	});
}

export function listPlatformDictionaryItems(
	typeId: string,
	input: ListPlatformDictionaryItemsInput,
	signal?: AbortSignal,
) {
	const { pageSize, ...query } = input;
	return request<ApiPage<PlatformDictionaryItem>>(
		`/platform/dictionaries/types/${typeId}/items`,
		{
			query: { ...query, page_size: pageSize },
			signal,
		},
	).then(({ items, page, page_size, total }) => ({
		items,
		page,
		pageSize: page_size,
		total,
	}));
}

export function createPlatformDictionaryItem({
	input,
	typeId,
}: {
	input: CreatePlatformDictionaryItemInput;
	typeId: string;
}) {
	return request<PlatformDictionaryItem>(
		`/platform/dictionaries/types/${typeId}/items`,
		{
			body: input,
			method: "POST",
		},
	);
}

export function updatePlatformDictionaryItem({
	input,
	itemId,
}: {
	input: UpdatePlatformDictionaryItemInput;
	itemId: string;
}) {
	return request<PlatformDictionaryItem>(
		`/platform/dictionaries/items/${itemId}`,
		{
			body: input,
			method: "PATCH",
		},
	);
}

export function deletePlatformDictionaryItem(itemId: string) {
	return request<void>(`/platform/dictionaries/items/${itemId}`, {
		method: "DELETE",
	});
}
