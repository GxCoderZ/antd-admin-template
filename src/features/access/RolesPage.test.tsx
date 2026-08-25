import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

import { i18n } from "../../i18n";
import { LocalePreferencesContext } from "../../app/localePreferences";
import { RolesPage } from "./RolesPage";

const mocks = vi.hoisted(() => ({
	listPlatformRoles: vi.fn(),
}));

vi.mock("#src/api/auth", () => ({
	platformSessionQueryKey: ["platform-session"],
}));

vi.mock("#src/api/roles", () => ({
	createPlatformRole: vi.fn(),
	deletePlatformRole: vi.fn(),
	listPlatformRoles: mocks.listPlatformRoles,
	platformRolesQueryKey: ["platform-roles"],
	setPlatformRolePermission: vi.fn(),
	updatePlatformRole: vi.fn(),
}));

const adminRole = {
	builtIn: true,
	createdAt: "2026-07-01T00:00:00.000Z",
	displayName: "超级管理员",
	id: "role-admin",
	memberCount: 2,
	permissions: ["platform.users.read", "platform.users.manage"],
	roleKey: "super-admin",
	updatedAt: "2026-08-25T00:00:00.000Z",
	version: 5,
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	mocks.listPlatformRoles.mockReset().mockResolvedValue([adminRole]);
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
			<LocalePreferencesContext.Provider
				value={{
					currency: "CNY",
					language: "zh-CN",
					onChangeCurrency: vi.fn(),
					onChangeTimeZone: vi.fn(),
					timeZone: "Asia/Shanghai",
				}}
			>
				<QueryClientProvider client={queryClient}>
					<MemoryRouter>
						<RolesPage />
					</MemoryRouter>
				</QueryClientProvider>
			</LocalePreferencesContext.Provider>
		</ConfigProvider>,
	);

	return user;
}

describe("RolesPage", () => {
	it("defaults to frequent columns and exposes low-frequency contract fields", async () => {
		const user = renderRolesPage();

		await screen.findByText("super-admin");
		expect(
			screen.queryByRole("columnheader", { name: "角色 ID" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("columnheader", { name: "权限点" }),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "角色类型" }),
		).toBeVisible();

		await user.click(screen.getByRole("button", { name: "列设置" }));

		expect(screen.getByRole("checkbox", { name: "角色名称" })).toBeDisabled();
		expect(screen.getByRole("checkbox", { name: "角色标识" })).toBeDisabled();
		expect(screen.getByRole("checkbox", { name: "操作" })).toBeDisabled();
		expect(screen.getByRole("checkbox", { name: "角色 ID" })).not.toBeChecked();
		expect(
			screen.getByRole("checkbox", { name: "数据版本" }),
		).not.toBeChecked();

		await user.click(screen.getByRole("checkbox", { name: "角色 ID" }));
		expect(screen.getByRole("columnheader", { name: "角色 ID" })).toBeVisible();
	});

	it("shows every role field and permission in the details drawer", async () => {
		const user = renderRolesPage();

		await user.click(await screen.findByRole("link", { name: "超级管理员" }));

		expect(await screen.findByText("角色详情")).toBeVisible();
		expect(screen.getByText("role-admin")).toBeVisible();
		expect(screen.getByText("查看用户")).toBeVisible();
		expect(screen.getByText("管理用户")).toBeVisible();
	});
});
