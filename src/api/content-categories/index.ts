import { request, type ApiPage } from "../client";
import type {
	ContentCategory,
	ContentCategoryItem,
	ListContentCategoryItemsInput,
	SaveContentCategoryInput,
	SaveContentCategoryItemInput,
} from "./types";

export * from "./types";

export const contentCategoriesQueryKey = ["content-categories"] as const;
export const contentCategoryItemsQueryKey = ["content-category-items"] as const;

export function listContentCategories(q?: string, signal?: AbortSignal) {
	return request<ContentCategory[]>("/examples/content-categories", {
		query: { q },
		signal,
	});
}

export function createContentCategory(input: SaveContentCategoryInput) {
	return request<ContentCategory>("/examples/content-categories", {
		body: input,
		method: "POST",
	});
}

export function updateContentCategory({
	categoryId,
	input,
}: {
	categoryId: string;
	input: SaveContentCategoryInput;
}) {
	return request<ContentCategory>(
		`/examples/content-categories/${categoryId}`,
		{ body: input, method: "PATCH" },
	);
}

export function deleteContentCategory(categoryId: string) {
	return request<void>(`/examples/content-categories/${categoryId}`, {
		method: "DELETE",
	});
}

export function listContentCategoryItems(
	input: ListContentCategoryItemsInput,
	signal?: AbortSignal,
) {
	const { categoryId, pageSize, ...query } = input;
	return request<ApiPage<ContentCategoryItem>>(
		"/examples/content-category-items",
		{
			query: {
				...query,
				category_id: categoryId,
				page_size: pageSize,
			},
			signal,
		},
	).then(({ items, page, page_size, total }) => ({
		items,
		page,
		pageSize: page_size,
		total,
	}));
}

export function createContentCategoryItem(input: SaveContentCategoryItemInput) {
	return request<ContentCategoryItem>("/examples/content-category-items", {
		body: input,
		method: "POST",
	});
}

export function updateContentCategoryItem({
	input,
	itemId,
}: {
	input: SaveContentCategoryItemInput;
	itemId: string;
}) {
	return request<ContentCategoryItem>(
		`/examples/content-category-items/${itemId}`,
		{ body: input, method: "PATCH" },
	);
}

export function deleteContentCategoryItem(itemId: string) {
	return request<void>(`/examples/content-category-items/${itemId}`, {
		method: "DELETE",
	});
}
