import { request } from "../client";
import type {
	CreatePlatformDepartmentInput,
	ListPlatformDepartmentsInput,
	PlatformDepartment,
	UpdatePlatformDepartmentInput,
} from "./types";

export * from "./types";

export const platformDepartmentsQueryKey = ["platform-departments"] as const;

export function listPlatformDepartments(
	input: ListPlatformDepartmentsInput = {},
	signal?: AbortSignal,
) {
	return request<PlatformDepartment[]>("/platform/departments", {
		query: { ...input },
		signal,
	});
}

export function createPlatformDepartment(input: CreatePlatformDepartmentInput) {
	return request<PlatformDepartment>("/platform/departments", {
		body: input,
		method: "POST",
	});
}

export function updatePlatformDepartment({
	departmentId,
	input,
}: {
	departmentId: string;
	input: UpdatePlatformDepartmentInput;
}) {
	return request<PlatformDepartment>(`/platform/departments/${departmentId}`, {
		body: input,
		method: "PATCH",
	});
}

export function deletePlatformDepartment(departmentId: string) {
	return request<void>(`/platform/departments/${departmentId}`, {
		method: "DELETE",
	});
}
