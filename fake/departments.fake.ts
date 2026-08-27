import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	CreatePlatformDepartmentInput,
	PlatformDepartment,
	PlatformDepartmentStatus,
	UpdatePlatformDepartmentInput,
} from "../src/api/departments";
import { departments, positions, users } from "./store";
import { resultError, resultSuccess, routeParam } from "./utils";

function getDepartment(departmentId: string | undefined) {
	return departments.find((department) => department.id === departmentId);
}

function isDepartmentStatus(value: unknown): value is PlatformDepartmentStatus {
	return value === "active" || value === "disabled";
}

function isValidInput(
	input: Partial<CreatePlatformDepartmentInput>,
): input is CreatePlatformDepartmentInput {
	return (
		typeof input.name === "string" &&
		input.name.trim().length > 0 &&
		typeof input.code === "string" &&
		input.code.trim().length > 0 &&
		isDepartmentStatus(input.status) &&
		(input.parentId === undefined ||
			input.parentId === null ||
			typeof input.parentId === "string")
	);
}

function countDepartmentPositions(departmentId: string) {
	return positions.filter((position) => position.departmentId === departmentId)
		.length;
}

function countDepartmentMembers(departmentId: string) {
	return users.filter((user) => user.departmentId === departmentId).length;
}

function withDerivedCounts(
	department: (typeof departments)[number],
): PlatformDepartment {
	return {
		...department,
		children: [],
		memberCount: countDepartmentMembers(department.id),
		positionCount: countDepartmentPositions(department.id),
	};
}

function buildDepartmentTree(items: typeof departments) {
	const byId = new Map(
		items.map((department) => [department.id, withDerivedCounts(department)]),
	);
	const roots: PlatformDepartment[] = [];

	byId.forEach((department) => {
		if (department.parentId && byId.has(department.parentId)) {
			byId.get(department.parentId)!.children.push(department);
			return;
		}
		roots.push(department);
	});

	const sortTree = (nodes: PlatformDepartment[]) => {
		nodes.sort((left, right) => left.name.localeCompare(right.name));
		nodes.forEach((node) => sortTree(node.children));
	};
	sortTree(roots);
	return roots;
}

export default defineFakeRoute([
	{
		method: "get",
		url: "/platform/departments",
		response: ({ query }) => {
			const name = String(query.name ?? "")
				.trim()
				.toLowerCase();
			const status = routeParam(query.status);
			const filtered = departments.filter(
				(department) =>
					(!name ||
						department.name.toLowerCase().includes(name) ||
						department.code.toLowerCase().includes(name)) &&
					(!status || department.status === status),
			);

			return resultSuccess(buildDepartmentTree(filtered));
		},
	},
	{
		method: "post",
		url: "/platform/departments",
		response: ({ body }) => {
			const input = body as Partial<CreatePlatformDepartmentInput>;
			if (!isValidInput(input)) {
				return resultError("Invalid department input", 422);
			}
			if (input.parentId && !getDepartment(input.parentId)) {
				return resultError("Parent department not found", 404);
			}
			if (
				departments.some(
					(department) =>
						department.code.toLowerCase() === input.code.trim().toLowerCase(),
				)
			) {
				return resultError("Department code already exists", 409);
			}

			const timestamp = new Date().toISOString();
			const department: (typeof departments)[number] = {
				code: input.code.trim(),
				createdAt: timestamp,
				id: `dept-${Date.now()}`,
				name: input.name.trim(),
				parentId: input.parentId ?? null,
				status: input.status,
				updatedAt: timestamp,
			};
			departments.push(department);
			return resultSuccess(withDerivedCounts(department));
		},
	},
	{
		method: "patch",
		url: "/platform/departments/:departmentId",
		response: ({ body, params }) => {
			const department = getDepartment(routeParam(params.departmentId));
			if (!department) {
				return resultError("Department not found", 404);
			}

			const input = body as Partial<UpdatePlatformDepartmentInput>;
			if (!isValidInput(input)) {
				return resultError("Invalid department input", 422);
			}
			if (input.parentId && !getDepartment(input.parentId)) {
				return resultError("Parent department not found", 404);
			}
			if (input.parentId === department.id) {
				return resultError("Department cannot be its own parent", 422);
			}
			if (
				departments.some(
					(candidate) =>
						candidate.id !== department.id &&
						candidate.code.toLowerCase() === input.code.trim().toLowerCase(),
				)
			) {
				return resultError("Department code already exists", 409);
			}

			department.code = input.code.trim();
			department.name = input.name.trim();
			department.parentId = input.parentId ?? null;
			department.status = input.status;
			department.updatedAt = new Date().toISOString();

			positions
				.filter((position) => position.departmentId === department.id)
				.forEach((position) => {
					position.departmentName = department.name;
				});

			return resultSuccess(withDerivedCounts(department));
		},
	},
	{
		method: "delete",
		url: "/platform/departments/:departmentId",
		response: ({ params }) => {
			const departmentId = routeParam(params.departmentId);
			const index = departments.findIndex(
				(department) => department.id === departmentId,
			);
			if (index < 0) {
				return resultError("Department not found", 404);
			}

			const department = departments[index]!;
			const hasChildren = departments.some(
				(candidate) => candidate.parentId === department.id,
			);
			const positionCount = countDepartmentPositions(department.id);
			if (
				hasChildren ||
				positionCount > 0 ||
				countDepartmentMembers(department.id) > 0
			) {
				return resultError(
					"Department has children, positions or members and cannot be deleted",
					409,
				);
			}

			departments.splice(index, 1);
			return resultSuccess(null);
		},
	},
]);
