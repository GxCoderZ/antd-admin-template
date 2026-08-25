import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { PermissionContext, platformPermissions } from "../../app/permissions";
import { i18n } from "../../i18n";
import { RolesPage } from "./RolesPage";

const mocks = vi.hoisted(() => ({
	deletePlatformRole: vi.fn(),
	listPlatformRolePage: vi.fn(),
	setPlatformRolePermission: vi.fn(),
	updatePlatformRole: vi.fn(),
}));

vi.mock("#src/api/auth", () => ({
	platformSessionQueryKey: ["platform-session"],
}));

vi.mock("#src/api/roles", () => ({
	createPlatformRole: vi.fn(),
	deletePlatformRole: mocks.deletePlatformRole,
	listPlatformRolePage: mocks.listPlatformRolePage,
	platformRolesQueryKey: ["platform-roles"],
	setPlatformRolePermission: mocks.setPlatformRolePermission,
	updatePlatformRole: mocks.updatePlatformRole,
}));

const role = {
	displayName: "运营管理员",
	id: "role-operator",
	memberCount: 0,
	permissions: [platformPermissions.announcementsRead],
	roleKey: "operator",
	version: 3,
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	mocks.listPlatformRolePage.mockReset().mockResolvedValue({
		items: [role],
		page: 1,
		pageSize: 20,
		total: 1,
	});
	mocks.updatePlatformRole.mockReset().mockResolvedValue({
		...role,
		displayName: "运营负责人",
		version: 4,
	});
	mocks.setPlatformRolePermission.mockReset().mockResolvedValue(undefined);
	mocks.deletePlatformRole.mockReset().mockResolvedValue(undefined);
});

function renderRolesPage() {
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
				<MemoryRouter>
					<QueryClientProvider client={queryClient}>
						<PermissionContext.Provider
							value={new Set([platformPermissions.rolesManage])}
						>
							<RolesPage />
						</PermissionContext.Provider>
					</QueryClientProvider>
				</MemoryRouter>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);

	return user;
}

async function openRoleActions(user: ReturnType<typeof userEvent.setup>) {
	await screen.findByText(role.displayName);
	await user.click(screen.getByRole("button", { name: "更多" }));
}

describe("RolesPage", () => {
	it("saves routine role edits without typed-name confirmation", async () => {
		const user = renderRolesPage();

		await screen.findByText(role.displayName);
		await user.click(screen.getByRole("button", { name: "编辑" }));

		await screen.findByText(`编辑角色“${role.displayName}”`);
		const dialog = screen.getByRole("dialog");
		expect(
			within(dialog).queryByRole("textbox", { name: "确认目标名称" }),
		).not.toBeInTheDocument();
		expect(
			within(dialog).queryByText(new RegExp(`输入.*${role.displayName}.*确认`)),
		).not.toBeInTheDocument();

		const displayNameInput = within(dialog).getByRole("textbox", {
			name: "角色名称",
		});
		await user.clear(displayNameInput);
		await user.type(displayNameInput, "运营负责人");
		await user.click(within(dialog).getByRole("button", { name: /保\s*存/ }));

		await waitFor(() => {
			expect(mocks.updatePlatformRole).toHaveBeenCalled();
		});
		expect(mocks.updatePlatformRole.mock.calls[0]?.[0]).toEqual({
			input: {
				displayName: "运营负责人",
				expectedVersion: 3,
			},
			roleId: role.id,
		});
	});

	it("updates role permissions from the permission drawer", async () => {
		const user = renderRolesPage();

		await openRoleActions(user);
		await user.click(screen.getByRole("menuitem", { name: "权限配置" }));

		await screen.findByText(`配置“${role.displayName}”的权限`);
		const drawer = screen.getByRole("dialog");
		expect(
			within(drawer).queryByRole("textbox", { name: "角色名称" }),
		).not.toBeInTheDocument();
		expect(within(drawer).queryByText("角色状态")).not.toBeInTheDocument();
		expect(within(drawer).getByText("平台权限")).toBeInTheDocument();
		expect(within(drawer).getByText("系统管理菜单")).toBeInTheDocument();
		expect(within(drawer).getByText("用户管理页面")).toBeInTheDocument();
		expect(
			within(drawer).getByRole("searchbox", { name: "搜索权限" }),
		).toBeInTheDocument();
		expect(within(drawer).getByText("已选 1/11 项")).toBeInTheDocument();

		await user.click(within(drawer).getByRole("button", { name: "全选" }));
		expect(mocks.setPlatformRolePermission).not.toHaveBeenCalled();
		expect(within(drawer).getByText("已选 11/11 项")).toBeInTheDocument();
		await user.click(within(drawer).getByRole("button", { name: /保\s*存/ }));

		await waitFor(() => {
			expect(mocks.setPlatformRolePermission).toHaveBeenCalledTimes(10);
		});
		expect(mocks.setPlatformRolePermission).toHaveBeenCalledWith(
			{
				granted: true,
				permission: platformPermissions.rolesManage,
				roleId: role.id,
			},
			expect.any(Object),
		);
		expect(mocks.setPlatformRolePermission).not.toHaveBeenCalledWith(
			{
				granted: true,
				permission: platformPermissions.announcementsRead,
				roleId: role.id,
			},
			expect.any(Object),
		);
	});

	it("filters the permission tree and can disable parent-child linkage", async () => {
		const user = renderRolesPage();

		await openRoleActions(user);
		await user.click(screen.getByRole("menuitem", { name: "权限配置" }));

		const drawer = await screen.findByRole("dialog");
		await user.type(
			within(drawer).getByRole("searchbox", { name: "搜索权限" }),
			"公告",
		);

		expect(within(drawer).getByText("公告管理页面")).toBeInTheDocument();
		expect(within(drawer).getByText("查看公告")).toBeInTheDocument();
		expect(within(drawer).getByText("管理公告")).toBeInTheDocument();
		expect(within(drawer).queryByText("用户管理页面")).not.toBeInTheDocument();

		await user.click(within(drawer).getByRole("switch", { name: "父子联动" }));
		await user.click(within(drawer).getByRole("button", { name: "清空" }));
		await user.click(
			within(drawer).getByRole("checkbox", { name: /公告管理页面/ }),
		);
		expect(within(drawer).getByText("已选 0/11 项")).toBeInTheDocument();
	});

	it("requires the exact role name before deleting a role", async () => {
		const user = renderRolesPage();

		await openRoleActions(user);
		await user.click(screen.getByRole("menuitem", { name: "删除" }));

		await screen.findByText("删除角色");
		const dialog = screen.getByRole("dialog");
		const instruction = within(dialog).getByText(
			`请输入“${role.displayName}”以确认此操作。`,
		);
		expect(instruction).toBeInTheDocument();
		const confirmationInput = within(dialog).getByRole("textbox", {
			name: "确认目标名称",
		});
		const deleteButton = within(dialog).getByRole("button", {
			name: "确认删除",
		});

		expect(deleteButton).toBeDisabled();
		await user.type(confirmationInput, `${role.displayName}x`);
		expect(deleteButton).toBeDisabled();
		expect(mocks.deletePlatformRole).not.toHaveBeenCalled();

		await user.clear(confirmationInput);
		await user.type(confirmationInput, role.displayName);
		expect(deleteButton).toBeEnabled();
		await user.click(deleteButton);

		await waitFor(() => {
			expect(mocks.deletePlatformRole).toHaveBeenCalled();
		});
		expect(mocks.deletePlatformRole.mock.calls[0]?.[0]).toBe(role.id);
	});
});
