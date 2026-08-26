import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { PermissionContext, platformPermissions } from "../../app/permissions";
import { i18n } from "../../i18n";
import { UsersPage } from "./UsersPage";

const mocks = vi.hoisted(() => ({
	deletePlatformUser: vi.fn(),
	getPlatformUser: vi.fn(),
	listPlatformPositions: vi.fn(),
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
			id: "user-session",
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

vi.mock("#src/api/positions", () => ({
	listPlatformPositions: mocks.listPlatformPositions,
	platformPositionsQueryKey: ["platform-positions"],
}));

vi.mock("#src/api/users", () => ({
	createPlatformUser: vi.fn(),
	deletePlatformUser: mocks.deletePlatformUser,
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
	localStorage.clear();
	sessionStorage.clear();
	Object.defineProperty(document.body, "clientWidth", {
		configurable: true,
		value: 1_100,
	});
	mocks.deletePlatformUser.mockReset().mockResolvedValue(undefined);
	mocks.listPlatformPositions.mockReset().mockResolvedValue({
		items: [
			{
				code: "project_owner",
				createdAt: "2026-08-20T00:00:00.000Z",
				departmentId: "dept-platform",
				departmentName: "平台研发部",
				id: "position-project-owner",
				memberCount: 2,
				name: "项目负责人",
				status: "active",
				updatedAt: "2026-08-25T00:00:00.000Z",
			},
		],
		page: 1,
		pageSize: 100,
		total: 1,
	});
	mocks.listPlatformUsers.mockReset().mockResolvedValue({
		items: [adminUser],
		page: 1,
		pageSize: 20,
		total: 1,
	});
	mocks.getPlatformUser.mockReset().mockResolvedValue(adminUser);
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

async function openUserColumnSettings(
	user: ReturnType<typeof userEvent.setup>,
) {
	await user.click(screen.getByRole("img", { name: "setting" }));
	await screen.findByRole("checkbox", { name: /用户 ID$/ });
}

describe("UsersPage", () => {
	it("keeps edit visible and moves secondary row actions into more", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		expect(screen.getByRole("button", { name: "编辑" })).toBeVisible();
		expect(
			screen.queryByRole("button", { name: "重置密码" }),
		).not.toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: "更多" }));
		expect(
			screen.getByRole("menuitem", { name: "查看详情" }),
		).toBeInTheDocument();
		expect(screen.getByRole("menuitem", { name: "角色" })).toBeInTheDocument();
		expect(
			screen.getByRole("menuitem", { name: "重置密码" }),
		).toBeInTheDocument();
	});

	it("opens read-only user details from the display name", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		await user.click(screen.getByRole("button", { name: "Platform Admin" }));

		const dialog = await screen.findByRole("dialog");
		await waitFor(() => {
			expect(within(dialog).getByText("admin@example.com")).toBeInTheDocument();
		});
		expect(within(dialog).getByText("13800138000")).toBeInTheDocument();
		expect(mocks.getPlatformUser).toHaveBeenCalledWith(
			adminUser.id,
			expect.any(AbortSignal),
		);
	});

	it("requires the exact username before deleting another user", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		await user.click(screen.getByRole("button", { name: "更多" }));
		await user.click(screen.getByRole("menuitem", { name: "删除" }));

		await screen.findByText("删除用户");
		const dialog = screen.getByRole("dialog");
		const confirmationInput = within(dialog).getByRole("textbox", {
			name: "确认目标名称",
		});
		const deleteButton = within(dialog).getByRole("button", {
			name: "确认删除",
		});

		expect(deleteButton).toBeDisabled();
		await user.type(confirmationInput, adminUser.username);
		expect(deleteButton).toBeEnabled();
		await user.click(deleteButton);

		await waitFor(() => {
			expect(mocks.deletePlatformUser).toHaveBeenCalledWith(adminUser.id);
		});
	});

	it("uses managed positions when editing a user's job title", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		await user.click(screen.getByRole("button", { name: "编辑" }));

		const dialog = await screen.findByRole("dialog");
		expect(within(dialog).getByText(/编\s*辑 admin/)).toBeInTheDocument();
		await waitFor(() => {
			expect(mocks.listPlatformPositions).toHaveBeenCalledWith(
				expect.objectContaining({
					order: "asc",
					page: 1,
					pageSize: 100,
					sort: "name",
					status: "active",
				}),
				expect.any(AbortSignal),
			);
		});

		await user.click(within(dialog).getByRole("combobox", { name: "岗位" }));
		await screen.findByRole("option", { name: "项目负责人" });
		await user.click(screen.getAllByText("项目负责人").at(-1)!);
		await user.click(within(dialog).getByRole("button", { name: /保\s*存/ }));

		await waitFor(() => {
			expect(mocks.updatePlatformUser).toHaveBeenCalled();
		});
		expect(mocks.updatePlatformUser.mock.calls[0]?.[0]).toMatchObject({
			input: {
				expectedVersion: adminUser.version,
				jobTitle: "项目负责人",
			},
			userId: adminUser.id,
		});
	});

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

	it("provides protected and configurable user columns", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		await openUserColumnSettings(user);

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
			expect(
				screen.getByRole("checkbox", {
					name: new RegExp(`^(holder )?${column}$`),
				}),
			).toHaveAttribute("aria-disabled", "true");
		}
		for (const column of optionalColumns) {
			expect(
				screen.getByRole("checkbox", { name: new RegExp(`${column}$`) }),
			).toBeInTheDocument();
		}

		const userIdCheckbox = screen.getByRole("checkbox", {
			name: /用户 ID$/,
		});
		expect(userIdCheckbox).toBeChecked();
		await user.click(userIdCheckbox);
		expect(
			screen.queryByRole("columnheader", { name: "用户 ID" }),
		).not.toBeInTheDocument();
	});

	it("keeps all user columns visible by default", async () => {
		renderUsersPage();

		await screen.findByText("admin");

		for (const column of [
			"用户 ID",
			"用户名",
			"显示名称",
			"部门",
			"岗位",
			"角色",
			"手机号",
			"邮箱",
			"状态",
			"账号来源",
			"MFA 状态",
			"密码状态",
			"最近登录",
			"最近登录 IP",
			"创建时间",
			"更新时间",
			"操作",
		]) {
			expect(screen.getByRole("columnheader", { name: column })).toBeVisible();
		}
	});

	it("persists manually hidden user columns", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		await openUserColumnSettings(user);
		await user.click(screen.getByRole("checkbox", { name: /用户 ID$/ }));
		expect(
			screen.queryByRole("columnheader", { name: "用户 ID" }),
		).not.toBeInTheDocument();

		cleanup();
		renderUsersPage();

		await screen.findByText("admin");
		expect(
			screen.queryByRole("columnheader", { name: "用户 ID" }),
		).not.toBeInTheDocument();
	});

	it("keeps all default columns on spacious screens", async () => {
		Object.defineProperty(document.body, "clientWidth", {
			configurable: true,
			value: 1_520,
		});

		renderUsersPage();

		await screen.findByText("admin");
		for (const column of ["用户 ID", "手机号", "邮箱", "创建时间"]) {
			expect(screen.getByRole("columnheader", { name: column })).toBeVisible();
		}
	});
});
