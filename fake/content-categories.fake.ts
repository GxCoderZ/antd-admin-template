import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	ContentCategory,
	ContentCategoryItem,
	SaveContentCategoryInput,
	SaveContentCategoryItemInput,
} from "../src/api/content-categories";
import { contentCategories, contentCategoryItems } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

function categoryById(categoryId: string | undefined) {
	return contentCategories.find((category) => category.id === categoryId);
}

function categoryTree(q = "") {
	const keyword = q.trim().toLowerCase();
	const directCount = new Map<string, number>();
	contentCategoryItems.forEach((item) => {
		directCount.set(item.categoryId, (directCount.get(item.categoryId) ?? 0) + 1);
	});
	const build = (parentId: string | null): ContentCategory[] =>
		contentCategories
			.filter((category) => category.parentId === parentId)
			.sort((left, right) => left.sortOrder - right.sortOrder)
			.flatMap((category) => {
				const children = build(category.id);
				const matches =
					!keyword ||
					category.name.toLowerCase().includes(keyword) ||
					category.code.toLowerCase().includes(keyword);
				return matches || children.length > 0
					? [{ ...category, children, itemCount: directCount.get(category.id) ?? 0 }]
					: [];
			});
	return build(null);
}

function validCategoryInput(
	input: Partial<SaveContentCategoryInput>,
): input is SaveContentCategoryInput {
	return (
		typeof input.code === "string" &&
		input.code.trim().length > 0 &&
		typeof input.name === "string" &&
		input.name.trim().length > 0 &&
		(input.parentId === null || typeof input.parentId === "string") &&
		(input.status === "active" || input.status === "disabled")
	);
}

function validItemInput(
	input: Partial<SaveContentCategoryItemInput>,
): input is SaveContentCategoryItemInput {
	return (
		typeof input.categoryId === "string" &&
		Boolean(categoryById(input.categoryId)) &&
		typeof input.owner === "string" &&
		input.owner.trim().length > 0 &&
		typeof input.title === "string" &&
		input.title.trim().length > 0 &&
		(input.status === "draft" || input.status === "published")
	);
}

function saveItem(
	item: ContentCategoryItem,
	input: SaveContentCategoryItemInput,
) {
	const category = categoryById(input.categoryId)!;
	item.categoryId = category.id;
	item.categoryName = category.name;
	item.owner = input.owner.trim();
	item.status = input.status;
	item.title = input.title.trim();
	item.updatedAt = new Date().toISOString();
	return item;
}

export default defineFakeRoute([
	{
		method: "get",
		url: "/examples/content-categories",
		response: ({ query }) => resultSuccess(categoryTree(String(query.q ?? ""))),
	},
	{
		method: "post",
		url: "/examples/content-categories",
		response: ({ body }) => {
			const input = body as Partial<SaveContentCategoryInput>;
			if (!validCategoryInput(input) || (input.parentId && !categoryById(input.parentId))) {
				return resultError("Invalid category input", 422);
			}
			const category = {
				code: input.code.trim(),
				id: `content-category-${Date.now()}`,
				itemCount: 0,
				name: input.name.trim(),
				parentId: input.parentId,
				sortOrder:
					Math.max(
						0,
						...contentCategories
							.filter((item) => item.parentId === input.parentId)
							.map((item) => item.sortOrder),
					) + 1,
				status: input.status,
			};
			contentCategories.push(category);
			return resultSuccess({ ...category, children: [] });
		},
	},
	{
		method: "patch",
		url: "/examples/content-categories/:categoryId",
		response: ({ body, params }) => {
			const category = categoryById(routeParam(params.categoryId));
			const input = body as Partial<SaveContentCategoryInput>;
			if (!category) return resultError("Category not found", 404);
			if (!validCategoryInput(input) || input.parentId === category.id) {
				return resultError("Invalid category input", 422);
			}
			category.code = input.code.trim();
			category.name = input.name.trim();
			category.parentId = input.parentId;
			category.status = input.status;
			contentCategoryItems
				.filter((item) => item.categoryId === category.id)
				.forEach((item) => {
					item.categoryName = category.name;
				});
			return resultSuccess({ ...category, children: [] });
		},
	},
	{
		method: "delete",
		url: "/examples/content-categories/:categoryId",
		response: ({ params }) => {
			const categoryId = routeParam(params.categoryId);
			const index = contentCategories.findIndex((item) => item.id === categoryId);
			if (index < 0) return resultError("Category not found", 404);
			if (
				contentCategories.some((item) => item.parentId === categoryId) ||
				contentCategoryItems.some((item) => item.categoryId === categoryId)
			) {
				return resultError("Category is not empty", 409);
			}
			contentCategories.splice(index, 1);
			return resultSuccess(null);
		},
	},
	{
		method: "get",
		url: "/examples/content-category-items",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const categoryId = routeParam(query.category_id);
			const keyword = String(query.q ?? "").trim().toLowerCase();
			const status = routeParam(query.status);
			const sort = routeParam(query.sort) ?? "updated_at";
			const order = routeParam(query.order) === "asc" ? 1 : -1;
			const sortValue = (item: ContentCategoryItem) => {
				switch (sort) {
					case "category": return item.categoryName;
					case "owner": return item.owner;
					case "status": return item.status;
					case "title": return item.title;
					default: return item.updatedAt;
				}
			};
			const filtered = contentCategoryItems.filter(
				(item) =>
					(!categoryId || item.categoryId === categoryId) &&
					(!keyword || item.title.toLowerCase().includes(keyword) || item.owner.toLowerCase().includes(keyword)) &&
					(!status || item.status === status),
			);
			const sorted = [...filtered].sort(
				(left, right) => sortValue(left).localeCompare(sortValue(right)) * order,
			);
			const start = (page - 1) * pageSize;
			return resultSuccess({
				items: sorted.slice(start, start + pageSize),
				page,
				page_size: pageSize,
				total: sorted.length,
			});
		},
	},
	{
		method: "post",
		url: "/examples/content-category-items",
		response: ({ body }) => {
			const input = body as Partial<SaveContentCategoryItemInput>;
			if (!validItemInput(input)) return resultError("Invalid content input", 422);
			const item = saveItem(
				{
					categoryId: input.categoryId,
					categoryName: "",
					id: `content-category-item-${Date.now()}`,
					owner: input.owner,
					status: input.status,
					title: input.title,
					updatedAt: "",
				},
				input,
			);
			contentCategoryItems.unshift(item);
			return resultSuccess(item);
		},
	},
	{
		method: "patch",
		url: "/examples/content-category-items/:itemId",
		response: ({ body, params }) => {
			const item = contentCategoryItems.find((candidate) => candidate.id === routeParam(params.itemId));
			const input = body as Partial<SaveContentCategoryItemInput>;
			if (!item) return resultError("Content not found", 404);
			if (!validItemInput(input)) return resultError("Invalid content input", 422);
			return resultSuccess(saveItem(item, input));
		},
	},
	{
		method: "delete",
		url: "/examples/content-category-items/:itemId",
		response: ({ params }) => {
			const index = contentCategoryItems.findIndex((item) => item.id === routeParam(params.itemId));
			if (index < 0) return resultError("Content not found", 404);
			contentCategoryItems.splice(index, 1);
			return resultSuccess(null);
		},
	},
]);
