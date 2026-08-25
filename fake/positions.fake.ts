import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	CreatePlatformPositionInput,
	PlatformPosition,
	PlatformPositionStatus,
	UpdatePlatformPositionInput,
} from "../src/api/positions";
import { departments, positions } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

function getDepartmentName(departmentId: string) {
	return departments.find((department) => department.id === departmentId)?.name;
}

function getPosition(positionId: string | undefined) {
	return positions.find((position) => position.id === positionId);
}

function isPositionStatus(value: unknown): value is PlatformPositionStatus {
	return value === "active" || value === "disabled";
}

function isValidInput(
	input: Partial<CreatePlatformPositionInput>,
): input is CreatePlatformPositionInput {
	return (
		typeof input.name === "string" &&
		input.name.trim().length > 0 &&
		typeof input.code === "string" &&
		input.code.trim().length > 0 &&
		typeof input.departmentId === "string" &&
		input.departmentId.length > 0 &&
		isPositionStatus(input.status)
	);
}

export default defineFakeRoute([
	{
		method: "get",
		url: "/platform/positions",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const name = String(query.name ?? "")
				.trim()
				.toLowerCase();
			const code = String(query.code ?? "")
				.trim()
				.toLowerCase();
			const departmentId = routeParam(query.department_id);
			const status = routeParam(query.status);
			const sort = routeParam(query.sort) ?? "updated_at";
			const order = routeParam(query.order) ?? "desc";
			const sortValue = (position: PlatformPosition) => {
				switch (sort) {
					case "code":
						return position.code;
					case "department":
						return position.departmentName;
					case "member_count":
						return String(position.memberCount).padStart(8, "0");
					case "name":
						return position.name;
					case "status":
						return position.status;
					default:
						return position.updatedAt;
				}
			};
			const filtered = positions.filter(
				(position) =>
					(!name || position.name.toLowerCase().includes(name)) &&
					(!code || position.code.toLowerCase().includes(code)) &&
					(!departmentId || position.departmentId === departmentId) &&
					(!status || position.status === status),
			);
			const sorted = [...filtered].sort(
				(left, right) =>
					sortValue(left).localeCompare(sortValue(right), "zh-CN") *
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
		url: "/platform/positions",
		response: ({ body }) => {
			const input = body as Partial<CreatePlatformPositionInput>;
			if (!isValidInput(input)) {
				return resultError("Invalid position input", 422);
			}
			const departmentName = getDepartmentName(input.departmentId);
			if (!departmentName) {
				return resultError("Department not found", 404);
			}
			if (
				positions.some(
					(position) =>
						position.code.toLowerCase() === input.code.trim().toLowerCase(),
				)
			) {
				return resultError("Position code already exists", 409);
			}

			const timestamp = new Date().toISOString();
			const position: PlatformPosition = {
				code: input.code.trim(),
				createdAt: timestamp,
				departmentId: input.departmentId,
				departmentName,
				id: `position-${Date.now()}`,
				memberCount: 0,
				name: input.name.trim(),
				status: input.status,
				updatedAt: timestamp,
			};
			positions.unshift(position);
			return resultSuccess(position);
		},
	},
	{
		method: "patch",
		url: "/platform/positions/:positionId",
		response: ({ body, params }) => {
			const position = getPosition(routeParam(params.positionId));
			if (!position) {
				return resultError("Position not found", 404);
			}

			const input = body as Partial<UpdatePlatformPositionInput>;
			if (!isValidInput(input)) {
				return resultError("Invalid position input", 422);
			}
			const departmentName = getDepartmentName(input.departmentId);
			if (!departmentName) {
				return resultError("Department not found", 404);
			}
			if (
				positions.some(
					(candidate) =>
						candidate.id !== position.id &&
						candidate.code.toLowerCase() === input.code.trim().toLowerCase(),
				)
			) {
				return resultError("Position code already exists", 409);
			}

			position.code = input.code.trim();
			position.departmentId = input.departmentId;
			position.departmentName = departmentName;
			position.name = input.name.trim();
			position.status = input.status;
			position.updatedAt = new Date().toISOString();
			return resultSuccess(position);
		},
	},
	{
		method: "delete",
		url: "/platform/positions/:positionId",
		response: ({ params }) => {
			const positionId = routeParam(params.positionId);
			const index = positions.findIndex(
				(position) => position.id === positionId,
			);
			if (index < 0) {
				return resultError("Position not found", 404);
			}

			positions.splice(index, 1);
			return resultSuccess(null);
		},
	},
]);
