import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	CreatePlatformDictionaryItemInput,
	CreatePlatformDictionaryTypeInput,
	PlatformDictionaryItem,
	PlatformDictionaryStatus,
	PlatformDictionaryTagColor,
	PlatformDictionaryType,
	UpdatePlatformDictionaryItemInput,
	UpdatePlatformDictionaryTypeInput,
} from "../src/api/dictionaries";
import { dictionaryItems, dictionaryTypes } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

const colors = new Set<PlatformDictionaryTagColor>([
	"blue",
	"cyan",
	"default",
	"green",
	"orange",
	"purple",
	"red",
]);

function getDictionaryType(typeId: string | undefined) {
	return dictionaryTypes.find((dictionaryType) => dictionaryType.id === typeId);
}

function getDictionaryItem(itemId: string | undefined) {
	return dictionaryItems.find((dictionaryItem) => dictionaryItem.id === itemId);
}

function isStatus(value: unknown): value is PlatformDictionaryStatus {
	return value === "active" || value === "disabled";
}

function isTagColor(value: unknown): value is PlatformDictionaryTagColor {
	return (
		typeof value === "string" && colors.has(value as PlatformDictionaryTagColor)
	);
}

function isTypeInput(
	input: Partial<CreatePlatformDictionaryTypeInput>,
): input is CreatePlatformDictionaryTypeInput {
	return (
		typeof input.code === "string" &&
		input.code.trim().length > 0 &&
		typeof input.name === "string" &&
		input.name.trim().length > 0 &&
		typeof input.description === "string" &&
		isStatus(input.status)
	);
}

function isItemInput(
	input: Partial<CreatePlatformDictionaryItemInput>,
): input is CreatePlatformDictionaryItemInput {
	return (
		typeof input.value === "string" &&
		input.value.trim().length > 0 &&
		typeof input.label === "string" &&
		input.label.trim().length > 0 &&
		typeof input.description === "string" &&
		typeof input.sort === "number" &&
		Number.isFinite(input.sort) &&
		isStatus(input.status) &&
		isTagColor(input.color)
	);
}

function syncItemCount(typeId: string) {
	const dictionaryType = getDictionaryType(typeId);
	if (dictionaryType) {
		dictionaryType.itemCount = dictionaryItems.filter(
			(item) => item.typeId === typeId,
		).length;
		dictionaryType.updatedAt = new Date().toISOString();
	}
}

function compareValues(left: string | number, right: string | number) {
	if (typeof left === "number" && typeof right === "number") {
		return left - right;
	}
	return String(left).localeCompare(String(right));
}

export default defineFakeRoute([
	{
		method: "get",
		url: "/platform/dictionaries/types",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const keyword = String(query.q ?? "")
				.trim()
				.toLowerCase();
			const status = routeParam(query.status);
			const sort = routeParam(query.sort) ?? "updated_at";
			const order = routeParam(query.order) ?? "desc";
			const sortValue = (dictionaryType: PlatformDictionaryType) => {
				switch (sort) {
					case "code":
						return dictionaryType.code;
					case "item_count":
						return dictionaryType.itemCount;
					case "name":
						return dictionaryType.name;
					case "status":
						return dictionaryType.status;
					default:
						return dictionaryType.updatedAt;
				}
			};
			const filtered = dictionaryTypes.filter(
				(dictionaryType) =>
					(!keyword ||
						dictionaryType.name.toLowerCase().includes(keyword) ||
						dictionaryType.code.toLowerCase().includes(keyword) ||
						dictionaryType.description.toLowerCase().includes(keyword)) &&
					(!status || dictionaryType.status === status),
			);
			const sorted = [...filtered].sort(
				(left, right) =>
					compareValues(sortValue(left), sortValue(right)) *
					(order === "asc" ? 1 : -1),
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
		url: "/platform/dictionaries/types",
		response: ({ body }) => {
			const input = body as Partial<CreatePlatformDictionaryTypeInput>;
			if (!isTypeInput(input)) {
				return resultError("Invalid dictionary type input", 422);
			}

			const timestamp = new Date().toISOString();
			const dictionaryType: PlatformDictionaryType = {
				code: input.code.trim(),
				createdAt: timestamp,
				description: input.description.trim(),
				id: `dict-${Date.now()}`,
				itemCount: 0,
				name: input.name.trim(),
				status: input.status,
				updatedAt: timestamp,
			};
			dictionaryTypes.unshift(dictionaryType);
			return resultSuccess(dictionaryType);
		},
	},
	{
		method: "patch",
		url: "/platform/dictionaries/types/:typeId",
		response: ({ body, params }) => {
			const dictionaryType = getDictionaryType(routeParam(params.typeId));
			if (!dictionaryType) {
				return resultError("Dictionary type not found", 404);
			}

			const input = body as Partial<UpdatePlatformDictionaryTypeInput>;
			if (!isTypeInput(input)) {
				return resultError("Invalid dictionary type input", 422);
			}

			dictionaryType.code = input.code.trim();
			dictionaryType.description = input.description.trim();
			dictionaryType.name = input.name.trim();
			dictionaryType.status = input.status;
			dictionaryType.updatedAt = new Date().toISOString();
			return resultSuccess(dictionaryType);
		},
	},
	{
		method: "delete",
		url: "/platform/dictionaries/types/:typeId",
		response: ({ params }) => {
			const typeId = routeParam(params.typeId);
			const index = dictionaryTypes.findIndex(
				(dictionaryType) => dictionaryType.id === typeId,
			);
			if (index < 0 || !typeId) {
				return resultError("Dictionary type not found", 404);
			}

			dictionaryTypes.splice(index, 1);
			for (
				let itemIndex = dictionaryItems.length - 1;
				itemIndex >= 0;
				itemIndex -= 1
			) {
				if (dictionaryItems[itemIndex]?.typeId === typeId) {
					dictionaryItems.splice(itemIndex, 1);
				}
			}
			return resultSuccess(null);
		},
	},
	{
		method: "get",
		url: "/platform/dictionaries/types/:typeId/items",
		response: ({ params, query }) => {
			const typeId = routeParam(params.typeId);
			if (!getDictionaryType(typeId)) {
				return resultError("Dictionary type not found", 404);
			}

			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const keyword = String(query.q ?? "")
				.trim()
				.toLowerCase();
			const status = routeParam(query.status);
			const sort = routeParam(query.sort) ?? "sort";
			const order = routeParam(query.order) ?? "asc";
			const sortValue = (dictionaryItem: PlatformDictionaryItem) => {
				switch (sort) {
					case "label":
						return dictionaryItem.label;
					case "status":
						return dictionaryItem.status;
					case "updated_at":
						return dictionaryItem.updatedAt;
					case "value":
						return dictionaryItem.value;
					default:
						return dictionaryItem.sort;
				}
			};
			const filtered = dictionaryItems.filter(
				(dictionaryItem) =>
					dictionaryItem.typeId === typeId &&
					(!keyword ||
						dictionaryItem.label.toLowerCase().includes(keyword) ||
						dictionaryItem.value.toLowerCase().includes(keyword) ||
						dictionaryItem.description.toLowerCase().includes(keyword)) &&
					(!status || dictionaryItem.status === status),
			);
			const sorted = [...filtered].sort(
				(left, right) =>
					compareValues(sortValue(left), sortValue(right)) *
					(order === "asc" ? 1 : -1),
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
		url: "/platform/dictionaries/types/:typeId/items",
		response: ({ body, params }) => {
			const typeId = routeParam(params.typeId);
			if (!getDictionaryType(typeId) || !typeId) {
				return resultError("Dictionary type not found", 404);
			}

			const input = body as Partial<CreatePlatformDictionaryItemInput>;
			if (!isItemInput(input)) {
				return resultError("Invalid dictionary item input", 422);
			}

			const timestamp = new Date().toISOString();
			const dictionaryItem: PlatformDictionaryItem = {
				color: input.color,
				createdAt: timestamp,
				description: input.description.trim(),
				id: `${typeId}-item-${Date.now()}`,
				label: input.label.trim(),
				sort: input.sort,
				status: input.status,
				typeId,
				updatedAt: timestamp,
				value: input.value.trim(),
			};
			dictionaryItems.push(dictionaryItem);
			syncItemCount(typeId);
			return resultSuccess(dictionaryItem);
		},
	},
	{
		method: "patch",
		url: "/platform/dictionaries/items/:itemId",
		response: ({ body, params }) => {
			const dictionaryItem = getDictionaryItem(routeParam(params.itemId));
			if (!dictionaryItem) {
				return resultError("Dictionary item not found", 404);
			}

			const input = body as Partial<UpdatePlatformDictionaryItemInput>;
			if (!isItemInput(input)) {
				return resultError("Invalid dictionary item input", 422);
			}

			dictionaryItem.color = input.color;
			dictionaryItem.description = input.description.trim();
			dictionaryItem.label = input.label.trim();
			dictionaryItem.sort = input.sort;
			dictionaryItem.status = input.status;
			dictionaryItem.updatedAt = new Date().toISOString();
			dictionaryItem.value = input.value.trim();
			syncItemCount(dictionaryItem.typeId);
			return resultSuccess(dictionaryItem);
		},
	},
	{
		method: "delete",
		url: "/platform/dictionaries/items/:itemId",
		response: ({ params }) => {
			const itemId = routeParam(params.itemId);
			const index = dictionaryItems.findIndex((item) => item.id === itemId);
			if (index < 0) {
				return resultError("Dictionary item not found", 404);
			}

			const [deleted] = dictionaryItems.splice(index, 1);
			if (deleted) {
				syncItemCount(deleted.typeId);
			}
			return resultSuccess(null);
		},
	},
]);
