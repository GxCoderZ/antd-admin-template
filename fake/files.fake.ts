import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type { PlatformFile } from "../src/api/files";
import { platformFiles } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

interface UploadBody {
	name?: string;
	size?: number;
	type?: string;
}

function readUpload(body: FormData | UploadBody | undefined): UploadBody {
	if (body instanceof FormData) {
		const file = body.get("file");
		return file instanceof File
			? { name: file.name, size: file.size, type: file.type }
			: {};
	}
	return body ?? {};
}

export default defineFakeRoute([
	{
		method: "get",
		url: "/platform/files",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const keyword = String(query.q ?? "")
				.trim()
				.toLowerCase();
			const type = routeParam(query.type);
			const sort = routeParam(query.sort) ?? "created_at";
			const direction = routeParam(query.order) === "asc" ? 1 : -1;
			const filtered = platformFiles.filter(
				(file) =>
					(!keyword || file.name.toLowerCase().includes(keyword)) &&
					(!type || file.type.startsWith(type)),
			);
			const value = (file: PlatformFile) =>
				sort === "name"
					? file.name
					: sort === "size"
						? file.size
						: file.createdAt;
			const sorted = [...filtered].sort((left, right) =>
				typeof value(left) === "number"
					? (Number(value(left)) - Number(value(right))) * direction
					: String(value(left)).localeCompare(String(value(right))) * direction,
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
		url: "/platform/files",
		response: ({ body }) => {
			const upload = readUpload(body);
			if (!upload.name?.trim() || !upload.size || !upload.type) {
				return resultError("Invalid file upload", 422);
			}
			const file: PlatformFile = {
				createdAt: new Date().toISOString(),
				id: `file-${Date.now()}`,
				name: upload.name.trim(),
				size: upload.size,
				type: upload.type,
				uploader: "Platform Admin",
			};
			platformFiles.unshift(file);
			return resultSuccess(file);
		},
	},
	{
		method: "delete",
		url: "/platform/files/:fileId",
		response: ({ params }) => {
			const index = platformFiles.findIndex(
				(file) => file.id === routeParam(params.fileId),
			);
			if (index < 0) return resultError("File not found", 404);
			platformFiles.splice(index, 1);
			return resultSuccess(null);
		},
	},
]);
