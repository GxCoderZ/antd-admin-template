import { request, type ApiPage } from "../client";
import type {
	ListPlatformFilesInput,
	PlatformFile,
	UploadPlatformFileInput,
} from "./types";

export * from "./types";

export const platformFilesQueryKey = ["platform-files"] as const;

export function listPlatformFiles(
	input: ListPlatformFilesInput,
	signal?: AbortSignal,
) {
	const { pageSize, ...query } = input;
	return request<ApiPage<PlatformFile>>("/platform/files", {
		query: { ...query, page_size: pageSize },
		signal,
	}).then(({ items, page, page_size, total }) => ({
		items,
		page,
		pageSize: page_size,
		total,
	}));
}

export function uploadPlatformFile({ file }: UploadPlatformFileInput) {
	const formData = new FormData();
	formData.append("file", file);
	return request<PlatformFile>("/platform/files", {
		body: formData,
		method: "POST",
	});
}

export function deletePlatformFile(fileId: string) {
	return request<void>(`/platform/files/${fileId}`, { method: "DELETE" });
}
