import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { PermissionContext, platformPermissions } from "../../app/permissions";
import { getTableColumnSettingsStorageKey } from "../../app/preferenceStorage";
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

vi.mock("#src/api/departments", () => ({
	listPlatformDepartments: vi.fn().mockResolvedValue([
		{
			id: "dept-platform",
			name: "平台研发部",
			status: "active",
			children: [],
		},
	]),
	platformDepartmentsQueryKey: ["platform-departments"],
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
	departmentId: "dept-platform",
	departmentName: "平台研发部",
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
	await screen.findByRole("checkbox", { name: /显示名称/ });
}

describe("UsersPage", () => {
	it("keeps saved column choices when a technical ID moves to details", async () => {
		const key = `${getTableColumnSettingsStorageKey("users")}:pro-table`;
		const choices = {
			id: { show: true, order: 0 },
			username: { show: true, order: 1 },
			phone: { show: true, order: 2 },
			displayName: { show: false, order: 3 },
			department: { show: false, order: 4 },
			roles: { show: false, order: 5 },
			status: { show: true, order: 6 },
			lastLoginAt: { show: false, order: 7 },
			actions: { show: true, fixed: "right", order: 8 },
		};
		localStorage.setItem(key, JSON.stringify(choices));
		renderUsersPage();
		await screen.findByText("admin");
		expect(
			screen.getAllByRole("columnheader").map((header) => header.textContent),
		).toEqual(["用户名", "手机号", "状态", "操作"]);
		cleanup();
		renderUsersPage();
		await screen.findByText("admin");
		expect(
			screen.getAllByRole("columnheader").map((header) => header.textContent),
		).toEqual(["用户名", "手机号", "状态", "操作"]);
	});
	it("requests the initial user list without an explicit sort", async () => {
		renderUsersPage();

		await screen.findByText("admin");
		expect(mocks.listPlatformUsers).toHaveBeenLastCalledWith(
			{ page: 1, pageSize: 20 },
			expect.any(AbortSignal),
		);
	});

	it("clears manual sorting when user filters are reset", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		const usernameHeader = screen.getByRole("columnheader", { name: "用户名" });
		await user.click(usernameHeader);
		await waitFor(() => {
			expect(mocks.listPlatformUsers).toHaveBeenLastCalledWith(
				{ order: "asc", page: 1, pageSize: 20, sort: "username" },
				expect.any(AbortSignal),
			);
		});

		mocks.listPlatformUsers.mockClear();
		await user.click(screen.getByRole("button", { name: /重\s*置/ }));
		await waitFor(() => {
			expect(mocks.listPlatformUsers).toHaveBeenLastCalledWith(
				{ page: 1, pageSize: 20 },
				expect.any(AbortSignal),
			);
		});
		expect(usernameHeader).not.toHaveAttribute("aria-sort");
	});

	it("keeps edit visible and moves secondary row actions into more", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		const table = within(screen.getByRole("table"));
		expect(table.getByText("编辑", { exact: true })).toBeVisible();
		expect(
			table.queryByText("重置密码", { exact: true }),
		).not.toBeInTheDocument();

		await user.click(table.getByText("更多", { exact: true }));
		const menu = within(screen.getByRole("menu"));
		for (const label of ["查看详情", "角色", "重置密码"]) {
			expect(menu.getByRole("menuitem", { name: label })).toBeInTheDocument();
		}
	});

	it("opens read-only user details from the display name", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		await user.click(
			within(screen.getByRole("table")).getByRole("button", {
				name: "Platform Admin",
			}),
		);

		const dialog = await screen.findByRole("dialog");
		await waitFor(() => {
			expect(within(dialog).getByText("admin@example.com")).toBeInTheDocument();
		});
		expect(within(dialog).getByText("13800138000")).toBeInTheDocument();
		expect(within(dialog).getAllByRole("table")).toHaveLength(3);
		for (const label of [
			"基本信息",
			"账号与权限",
			"时间与记录",
			"用户 ID",
			"用户名",
			"显示名称",
			"邮箱",
			"手机号",
			"部门",
			"部门 ID",
			"岗位",
			"角色",
			"状态",
			"账号来源",
			"MFA 状态",
			"密码状态",
			"最近登录",
			"最近登录 IP",
			"创建时间",
			"更新时间",
			"数据版本",
		]) {
			expect(
				within(dialog).getByText(label, { exact: true }),
			).toBeInTheDocument();
		}
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

		const requiredColumns = ["用户名", "操作"];
		const optionalColumns = [
			"岗位",
			"账号来源",
			"MFA 状态",
			"密码状态",
			"最近登录 IP",
		];

		for (const column of requiredColumns) {
			expect(
				screen.queryByRole("checkbox", {
					name: new RegExp(`^(holder )?${column}$`),
				}),
			).not.toBeInTheDocument();
		}
		for (const column of optionalColumns) {
			expect(
				screen.getByRole("checkbox", { name: new RegExp(column) }),
			).toBeInTheDocument();
		}
		expect(
			screen.queryByRole("checkbox", { name: /用户 ID/ }),
		).not.toBeInTheDocument();
		fireEvent.wheel(screen.getByRole("checkbox", { name: /显示名称/ }), {
			deltaY: 600,
		});
		const updatedAtCheckbox = await screen.findByRole("checkbox", {
			name: /更新时间/,
		});
		expect(updatedAtCheckbox).toBeInTheDocument();
		fireEvent.wheel(updatedAtCheckbox, { deltaY: -600 });

		const jobTitleCheckbox = await screen.findByRole("checkbox", {
			name: /岗位/,
		});
		expect(jobTitleCheckbox).not.toBeChecked();
		await user.click(jobTitleCheckbox);
		expect(screen.getByRole("columnheader", { name: "岗位" })).toBeVisible();
	});

	it("shows the display name before the username in the default columns", async () => {
		renderUsersPage();

		await screen.findByText("admin");

		expect(
			screen.getAllByRole("columnheader").map((header) => header.textContent),
		).toEqual([
			"显示名称",
			"用户名",
			"部门",
			"角色",
			"状态",
			"最近登录",
			"操作",
		]);
	});

	it("keeps a saved column order until the user resets column settings", async () => {
		localStorage.setItem(
			`${getTableColumnSettingsStorageKey("users")}:pro-table`,
			JSON.stringify({
				username: { show: true, order: 0 },
				displayName: { show: true, order: 1 },
				department: { show: true, order: 2 },
				roles: { show: true, order: 3 },
				status: { show: true, order: 4 },
				lastLoginAt: { show: true, order: 5 },
				actions: { show: true, fixed: "right", order: 6 },
			}),
		);
		const user = renderUsersPage();
		await screen.findByText("admin");
		expect(
			screen.getAllByRole("columnheader").map((header) => header.textContent),
		).toEqual([
			"用户名",
			"显示名称",
			"部门",
			"角色",
			"状态",
			"最近登录",
			"操作",
		]);

		await openUserColumnSettings(user);
		await user.click(screen.getByText("重置", { exact: true }));
		const expectedColumns = [
			"显示名称",
			"用户名",
			"部门",
			"角色",
			"状态",
			"最近登录",
			"操作",
		];
		expect(
			screen.getAllByRole("columnheader").map((header) => header.textContent),
		).toEqual(expectedColumns);

		cleanup();
		renderUsersPage();
		await screen.findByText("admin");
		expect(
			screen.getAllByRole("columnheader").map((header) => header.textContent),
		).toEqual(expectedColumns);
	});

	it("persists manually enabled optional user columns", async () => {
		const user = renderUsersPage();

		await screen.findByText("admin");
		await openUserColumnSettings(user);
		await user.click(screen.getByRole("checkbox", { name: /岗位/ }));
		expect(screen.getByRole("columnheader", { name: "岗位" })).toBeVisible();

		cleanup();
		renderUsersPage();

		await screen.findByText("admin");
		expect(screen.getByRole("columnheader", { name: "岗位" })).toBeVisible();
	});

	it("does not add supplementary columns on spacious screens", async () => {
		Object.defineProperty(document.body, "clientWidth", {
			configurable: true,
			value: 1_520,
		});

		renderUsersPage();

		await screen.findByText("admin");
		for (const column of ["用户 ID", "手机号", "邮箱", "创建时间"]) {
			expect(
				screen.queryByRole("columnheader", { name: column }),
			).not.toBeInTheDocument();
		}
	});
});
