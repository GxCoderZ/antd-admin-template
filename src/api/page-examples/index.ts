import { request, type ApiPage } from "../client";
import type {
	ExampleListItem,
	ExampleRecordDetail,
	ListExampleItemsInput,
} from "./types";

export * from "./types";

export const exampleItemsQueryKey = ["example-items"] as const;
export const exampleRecordQueryKey = ["example-record"] as const;

export function listExampleItems(
	input: ListExampleItemsInput,
	signal?: AbortSignal,
) {
	const { category, owner, pageSize, ...query } = input;
	return request<ApiPage<ExampleListItem>>("/examples/items", {
		query: {
			...query,
			...(category?.length ? { category: category.join(",") } : {}),
			...(owner?.length ? { owner: owner.join(",") } : {}),
			page_size: pageSize,
		},
		signal,
	}).then(({ items, page, page_size, total }) => ({
		items,
		page,
		pageSize: page_size,
		total,
	}));
}

export function getExampleRecord(recordId: string, signal?: AbortSignal) {
	return request<ExampleRecordDetail>(`/examples/records/${recordId}`, {
		signal,
	});
}
