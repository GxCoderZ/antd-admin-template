import { request } from "#src/utils/request";

export function fetchUserPermissions() {
	return request.post<ApiResponse<{ permissions: string[] }>>(
		"/api/rbac/permissions",
		{ json: {} },
	).json();
}
