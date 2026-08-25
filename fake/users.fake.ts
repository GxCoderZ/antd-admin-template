import { defineFakeRoute } from "vite-plugin-fake-server/client";

import type {
	CreatePlatformUserInput,
	PlatformUserDetail,
	UpdatePlatformUserInput,
} from "../src/api/users";
import { roles, session, userAvatarDataUrls, users } from "./store";
import { pageValue, resultError, resultSuccess, routeParam } from "./utils";

function getUser(userId: string | undefined) {
	return users.find((user) => user.id === userId);
}

export default defineFakeRoute([
	{
		url: "/platform/users",
		method: "get",
		response: ({ query }) => {
			const page = pageValue(query.page, 1);
			const pageSize = pageValue(query.page_size, 10);
			const keyword = String(query.q ?? "")
				.trim()
				.toLowerCase();
			const status = routeParam(query.status);
			const sort = routeParam(query.sort) ?? "created_at";
			const order = routeParam(query.order) ?? "desc";
			const sortValue = (user: PlatformUserDetail) => {
				switch (sort) {
					case "auth_source":
						return user.authSource;
					case "department":
						return user.department;
					case "display_name":
						return user.displayName;
					case "email":
						return user.email;
					case "last_login_at":
						return user.lastLoginAt ?? "";
					case "phone":
						return user.phone;
					case "status":
						return user.status;
					case "updated_at":
						return user.updatedAt;
					case "username":
						return user.username;
					default:
						return user.createdAt;
				}
			};
			const filtered = users.filter(
				(user) =>
					(!keyword ||
						user.username.toLowerCase().includes(keyword) ||
						user.displayName.toLowerCase().includes(keyword) ||
						user.email.toLowerCase().includes(keyword) ||
						user.phone.toLowerCase().includes(keyword) ||
						user.jobTitle.toLowerCase().includes(keyword)) &&
					(!status || user.status === status),
			);
			const sorted = [...filtered].sort((left, right) => {
				return (
					sortValue(left).localeCompare(sortValue(right)) *
					(order === "asc" ? 1 : -1)
				);
			});
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
		url: "/platform/users",
		method: "post",
		response: ({ body }) => {
			const input = body as unknown as CreatePlatformUserInput;
			if (users.some((user) => user.username === input.username)) {
				return resultError("Username already exists", 409);
			}
			const timestamp = new Date().toISOString();
			const user: PlatformUserDetail = {
				authSource: "local",
				department: "platform",
				id: `user-${Date.now()}`,
				username: input.username,
				email: input.email,
				displayName: input.displayName,
				jobTitle: "",
				lastLoginAt: null,
				lastLoginIp: null,
				mfaEnabled: false,
				phone: "",
				status: "active",
				createdAt: timestamp,
				updatedAt: timestamp,
				mustChangePassword: true,
				version: 1,
				roles: [],
			};
			users.unshift(user);
			return resultSuccess(user);
		},
	},
	{
		url: "/platform/users/:userId",
		method: "get",
		response: ({ params }) => {
			const user = getUser(routeParam(params.userId));
			return user ? resultSuccess(user) : resultError("User not found", 404);
		},
	},
	{
		url: "/platform/users/:userId",
		method: "patch",
		response: ({ body, params }) => {
			const user = getUser(routeParam(params.userId));
			if (!user) return resultError("User not found", 404);
			const input = body as unknown as UpdatePlatformUserInput;
			user.displayName = input.displayName;
			user.status = input.status;
			user.updatedAt = new Date().toISOString();
			user.version = (user.version ?? 0) + 1;
			return resultSuccess(user);
		},
	},
	{
		url: "/platform/users/:userId",
		method: "delete",
		response: ({ params }) => {
			const userId = routeParam(params.userId);
			const userIndex = users.findIndex((user) => user.id === userId);
			if (userIndex < 0) return resultError("User not found", 404);
			if (userId === session.user.id) {
				return resultError("Current user cannot be deleted", 409);
			}

			const [deletedUser] = users.splice(userIndex, 1);
			for (const assignedRole of deletedUser?.roles ?? []) {
				const role = roles.find((item) => item.id === assignedRole.id);
				if (role) {
					role.memberCount = Math.max(0, (role.memberCount ?? 0) - 1);
				}
			}
			if (userId) {
				delete userAvatarDataUrls[userId];
			}
			return resultSuccess(null);
		},
	},
	{
		url: "/platform/users/:userId/password",
		method: "post",
		response: ({ params }) => {
			const user = getUser(routeParam(params.userId));
			if (!user) return resultError("User not found", 404);
			user.mustChangePassword = true;
			return resultSuccess({ mustChangePassword: true });
		},
	},
	{
		url: "/platform/users/:userId/logout",
		method: "post",
		response: ({ params }) =>
			getUser(routeParam(params.userId))
				? resultSuccess(null)
				: resultError("User not found", 404),
	},
	{
		url: "/platform/users/:userId/roles/:roleId",
		method: "put",
		response: ({ params }) => {
			const user = getUser(routeParam(params.userId));
			const role = roles.find((item) => item.id === routeParam(params.roleId));
			if (!user || !role) return resultError("User or role not found", 404);
			if (!user.roles.some((item) => item.id === role.id)) {
				user.roles.push({
					id: role.id,
					roleKey: role.roleKey,
					displayName: role.displayName,
				});
				role.memberCount = (role.memberCount ?? 0) + 1;
			}
			return resultSuccess(null);
		},
	},
	{
		url: "/platform/users/:userId/roles/:roleId",
		method: "delete",
		response: ({ params }) => {
			const user = getUser(routeParam(params.userId));
			const role = roles.find((item) => item.id === routeParam(params.roleId));
			if (!user || !role) return resultError("User or role not found", 404);
			user.roles = user.roles.filter((item) => item.id !== role.id);
			role.memberCount = Math.max(0, (role.memberCount ?? 0) - 1);
			return resultSuccess(null);
		},
	},
	{
		url: "/platform/users/:userId/avatar",
		method: "get",
		response: ({ params }) => {
			const userId = routeParam(params.userId);
			if (!getUser(userId)) return resultError("User not found", 404);
			return resultSuccess({ dataUrl: userAvatarDataUrls[userId!] ?? null });
		},
	},
]);
