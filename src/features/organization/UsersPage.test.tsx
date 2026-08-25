import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { PermissionContext, platformPermissions } from "../../app/permissions";
import { i18n } from "../../i18n";
import { UsersPage } from "./UsersPage";

const mocks = vi.hoisted(() => ({
	getPlatformUser: vi.fn(),
	listPlatformUsers: vi.fn(),
	updatePlatformUser: vi.fn(),
}));

vi.mock("#src/api/auth", () => ({
	getPlatformSession: vi.fn().mockResolvedValue({
		permissions: [
			"platform.users.read",
			"platform.users.manage",
			"platform.roles.manage",
		],
		user: {
			email: "admin@example.com",
			id: "user-admin",
			username: "admin",
		},
	}),
	platformSessionQueryKey: ["platform-session"],
}));

vi.mock("#src/api/roles", () => ({
	listPlatformRoles: vi.fn().mockResolvedValue([]),
	platformRolesQueryKey: ["platform-roles"],
	setPlatformUserRole: vi.fn(),
}));

vi.mock("#src/api/users", () => ({
	createPlatformUser: vi.fn(),
	forceLogoutPlatformUser: vi.fn(),
	getPlatformUser: mocks.getPlatformUser,
	listPlatformUsers: mocks.listPlatformUsers,
	platformUserDetailQueryKey: (userId: string) => ["platform-users", userId],
	platformUsersQueryKey: ["platform-users"],
	resetPlatformUserPassword: vi.fn(),
	updatePlatformUser: mocks.updatePlatformUser,
}));

vi.mock("../../app/PlatformUserAvatar", () => ({
	PlatformUserAvatar: ({ displayName }: { displayName: string }) => (
		<span data-testid="user-avatar">{displayName}</span>
	),
}));

const adminUser = {
	createdAt: "2026-08-01T00:00:00.000Z",
	displayName: "Platform Admin",
	email: "admin@example.com",
	id: "user-admin",
	lastLoginAt: "2026-08-25T12:00:00.000Z",
	roles: [
		{
			displayName: "超级管理员",
			id: "role-admin",
			roleKey: "super-admin",
		},
	],
	status: "active" as const,
	mustChangePassword: true,
	updatedAt: "2026-08-25T00:00:00.000Z",
	username: "admin",
	version: 3,
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	mocks.getPlatformUser.mockReset().mockResolvedValue({
		...adminUser,
		roles: [
			{
				displayName: "超级管理员",
				id: "role-admin",
				roleKey: "super-admin",
			},
		],
	});
	mocks.listPlatformUsers.mockReset().mockResolvedValue({
		items: [adminUser],
		page: 1,
		pageSize: 20,
		total: 1,
	});
	mocks.updatePlatformUser.mockReset().mockResolvedValue({
		...adminUser,
		displayName: "平台管理员",
		version: 4,
	});
});

function renderUsersPage() {
	const queryClient = new QueryClient({
		defaultOptions: {
			mutations: { retry: false },
			queries: { retry: false },
		},
	});
	const user = userEvent.setup();

	render(
		<ConfigProvider>
			<LocalePreferencesProvider
				value={{
					currency: "CNY",
					language: "zh-CN",
					onChangeCurrency: vi.fn(),
					onChangeTimeZone: vi.fn(),
					timeZone: "Asia/Shanghai",
				}}
			>
				<QueryClientProvider client={queryClient}>
					<PermissionContext.Provider
						value={
							new Set([
								platformPermissions.usersRead,
								platformPermissions.usersManage,
								platformPermissions.rolesManage,
							])
						}
					>
						<UsersPage />
					</PermissionContext.Provider>
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);

	return user;
}

describe("UsersPage", () => {
	it("submits keyword filters through the users API", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		await user.type(screen.getByPlaceholderText("搜索用户名或邮箱"), "olivia");
		await user.click(screen.getByRole("button", { name: /查\s*询/ }));

		await waitFor(() => {
			expect(mocks.listPlatformUsers).toHaveBeenLastCalledWith(
				expect.objectContaining({ q: "olivia" }),
				expect.any(AbortSignal),
			);
		});
	});

	it("keeps frequent columns visible and offers every account field in column settings", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		expect(
			screen.queryByRole("columnheader", { name: "用户 ID" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("columnheader", { name: "更新时间" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("columnheader", { name: "创建时间" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "已分配角色" }),
		).toBeVisible();
		expect(
			screen.getByRole("columnheader", { name: "最近登录" }),
		).toBeVisible();

		await user.click(screen.getByRole("button", { name: "表格设置" }));

		expect(screen.getByRole("checkbox", { name: "用户名" })).toHaveAttribute(
			"aria-disabled",
			"true",
		);
		expect(screen.getByRole("checkbox", { name: "状态" })).toHaveAttribute(
			"aria-disabled",
			"true",
		);
		expect(screen.getByRole("checkbox", { name: "操作" })).toHaveAttribute(
			"aria-disabled",
			"true",
		);
		expect(screen.getByRole("checkbox", { name: /用户 ID/ })).not.toBeChecked();
		expect(
			screen.getByRole("checkbox", { name: /下次登录修改密码/ }),
		).not.toBeChecked();
		expect(
			screen.getByRole("checkbox", { name: /数据版本/ }),
		).not.toBeChecked();

		await user.click(screen.getByRole("checkbox", { name: /用户 ID/ }));
		expect(screen.getByRole("columnheader", { name: "用户 ID" })).toBeVisible();
	});

	it("shows the complete account contract from the user details entry", async () => {
		const user = renderUsersPage();

		await user.click(
			await screen.findByRole("link", { name: "Platform Admin" }),
		);

		expect(await screen.findByText("用户详情")).toBeVisible();
		expect(screen.getByText("user-admin")).toBeVisible();
		expect(screen.getByText("下次登录修改密码")).toBeVisible();
		expect(screen.getAllByText("超级管理员").length).toBeGreaterThan(0);
	});
});
