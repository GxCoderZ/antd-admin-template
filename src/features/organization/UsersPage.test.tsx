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
	getPlatformUser: vi.fn().mockResolvedValue({ roles: [] }),
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
	authSource: "local" as const,
	createdAt: "2026-08-01T00:00:00.000Z",
	department: "platform" as const,
	displayName: "Platform Admin",
	email: "admin@example.com",
	id: "user-admin",
	jobTitle: "平台管理员",
	lastLoginAt: "2026-08-25T08:30:00.000Z",
	lastLoginIp: "192.168.1.10",
	mfaEnabled: true,
	mustChangePassword: false,
	phone: "13800138000",
	roles: [
		{
			displayName: "超级管理员",
			id: "role-admin",
			roleKey: "admin",
		},
	],
	status: "active" as const,
	updatedAt: "2026-08-25T00:00:00.000Z",
	username: "admin",
	version: 3,
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
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
		await user.type(
			screen.getByPlaceholderText("搜索用户名、显示名称、邮箱或手机号"),
			"olivia",
		);
		await user.click(screen.getByRole("button", { name: /查\s*询/ }));

		await waitFor(() => {
			expect(mocks.listPlatformUsers).toHaveBeenLastCalledWith(
				expect.objectContaining({ q: "olivia" }),
				expect.any(AbortSignal),
			);
		});
	});

	it("provides required, recommended, and optional user columns", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		await user.click(screen.getByRole("button", { name: "表格设置" }));

		const requiredColumns = ["用户名", "状态", "操作"];
		const optionalColumns = [
			"用户 ID",
			"岗位",
			"账号来源",
			"MFA 状态",
			"密码状态",
			"最近登录 IP",
			"更新时间",
		];

		for (const column of requiredColumns) {
			expect(screen.getByRole("checkbox", { name: column })).toHaveAttribute(
				"aria-disabled",
				"true",
			);
		}
		for (const column of optionalColumns) {
			expect(
				screen.getByRole("checkbox", { name: new RegExp(`${column}$`) }),
			).toBeInTheDocument();
		}

		const userIdCheckbox = screen.getByRole("checkbox", {
			name: /用户 ID$/,
		});
		expect(userIdCheckbox).not.toBeChecked();
		await user.click(userIdCheckbox);
		expect(
			screen.getByRole("columnheader", { name: "用户 ID" }),
		).toBeVisible();
	});
});
