import { request, type ApiPage } from "../client";
import type {
	CreatePlatformPositionInput,
	ListPlatformPositionsInput,
	PlatformPosition,
	UpdatePlatformPositionInput,
} from "./types";

export * from "./types";

export const platformPositionsQueryKey = ["platform-positions"] as const;

export function listPlatformPositions(
	input: ListPlatformPositionsInput,
	signal?: AbortSignal,
) {
	const { departmentId, pageSize, ...query } = input;
	return request<ApiPage<PlatformPosition>>("/platform/positions", {
		query: {
			...query,
			...(departmentId ? { department_id: departmentId } : {}),
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

export function createPlatformPosition(input: CreatePlatformPositionInput) {
	return request<PlatformPosition>("/platform/positions", {
		body: input,
		method: "POST",
	});
}

export function updatePlatformPosition({
	input,
	positionId,
}: {
	input: UpdatePlatformPositionInput;
	positionId: string;
}) {
	return request<PlatformPosition>(`/platform/positions/${positionId}`, {
		body: input,
		method: "PATCH",
	});
}

export function deletePlatformPosition(positionId: string) {
	return request<void>(`/platform/positions/${positionId}`, {
		method: "DELETE",
	});
}
