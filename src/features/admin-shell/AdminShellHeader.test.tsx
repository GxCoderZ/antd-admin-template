import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider } from "antd";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionProvider } from "../../app/PermissionProvider";
import { defaultPreferences } from "../../app/preferenceStorage";
import { i18n } from "../../i18n";
import { AdminShellHeader } from "./AdminShellHeader";

vi.mock("../../app/PlatformUserAvatar", () => ({
	PlatformUserAvatar: () => null,
}));

vi.mock("./CommandPalette", () => ({
	CommandPalette: () => null,
}));

vi.mock("./NotificationPopover", () => ({
	NotificationPopover: () => null,
}));

beforeEach(async () => i18n.changeLanguage("zh-CN"));

function renderHeader(onLogout: () => Promise<void>, isDarkMode = false) {
	const onNavigate = vi.fn();
	const onChangeThemeMode = vi.fn();
	render(
		<ConfigProvider>
			<PermissionProvider permissions={[]}>
				<AdminShellHeader
					currentUserAvatarRevision={0}
					currentUserId="user-1"
					currentUsername="测试用户"
					isColorBlindMode={false}
					isDarkMode={isDarkMode}
					isFooterVisible
					menuType="single"
					navigationMode="side"
					onChangeColorBlindMode={vi.fn()}
					onChangeFooterVisibility={vi.fn()}
					onChangeMenuType={vi.fn()}
					onChangeNavigationMode={vi.fn()}
					onChangeThemeColor={vi.fn()}
					onChangeThemeMode={onChangeThemeMode}
					onChangeTimeZone={vi.fn()}
					onLogout={onLogout}
					onNavigate={onNavigate}
					onResetPreferences={vi.fn().mockResolvedValue(undefined)}
					themeColor={defaultPreferences.themeColor}
					themeMode="light"
					timeZone="UTC"
				/>
			</PermissionProvider>
		</ConfigProvider>,
	);

	return { onChangeThemeMode, onNavigate, user: userEvent.setup() };
}

describe("AdminShellHeader", () => {
	it("uses the official 36px action size for every toolbar button", () => {
		renderHeader(vi.fn().mockResolvedValue(undefined));
		for (const name of ["搜索", "语言", "切换为深色模式"]) {
			expect(screen.getByRole("button", { name })).toHaveStyle({
				height: "36px",
				minWidth: "36px",
				paddingBlock: "0px",
				paddingInline: "8px",
			});
		}
		expect(screen.getByRole("button", { name: "测试用户" })).toHaveStyle({
			height: "44px",
		});
	});

	it("keeps search, language and theme directly available", () => {
		renderHeader(vi.fn().mockResolvedValue(undefined));

		expect(screen.getByRole("button", { name: "搜索" })).toBeVisible();
		expect(screen.getByRole("button", { name: "语言" })).toBeVisible();
		expect(
			screen.getByRole("button", { name: "切换为深色模式" }),
		).toBeVisible();
		for (const name of ["设置", "更多操作"]) {
			expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
		}
	});

	it("changes language from the toolbar without opening preferences", async () => {
		const { user } = renderHeader(vi.fn().mockResolvedValue(undefined));
		await user.click(screen.getByRole("button", { name: "语言" }));
		await user.click(await screen.findByRole("menuitem", { name: "English" }));
		expect(await screen.findByRole("button", { name: "Search" })).toBeVisible();
		expect(i18n.resolvedLanguage).toBe("en");
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it.each([false, true])(
		"toggles the resolved theme directly (dark: %s)",
		async (isDarkMode) => {
			const { user, onChangeThemeMode } = renderHeader(
				vi.fn().mockResolvedValue(undefined),
				isDarkMode,
			);
			await user.click(
				screen.getByRole("button", {
					name: isDarkMode ? "切换为浅色模式" : "切换为深色模式",
				}),
			);
			expect(onChangeThemeMode).toHaveBeenCalledWith(
				isDarkMode ? "light" : "dark",
			);
		},
	);

	it("opens preferences separately from account settings and keeps language and theme controls", async () => {
		const { onChangeThemeMode, onNavigate, user } = renderHeader(
			vi.fn().mockResolvedValue(undefined),
		);
		await user.hover(screen.getByRole("button", { name: "测试用户" }));
		expect(
			await screen.findByRole("menuitem", { name: "账号设置" }),
		).toBeInTheDocument();
		await user.click(await screen.findByRole("menuitem", { name: "偏好设置" }));

		const drawer = await screen.findByRole("dialog", { name: "偏好设置" });
		expect(onNavigate).not.toHaveBeenCalled();
		await user.click(
			within(drawer).getByRole("radio", { name: i18n.t("theme.dark") }),
		);
		expect(onChangeThemeMode).toHaveBeenCalledWith("dark");
		await user.click(
			within(drawer).getByRole("combobox", { name: "界面语言" }),
		);
		await user.click(screen.getByText("English", { exact: true }));
		expect(
			await screen.findByRole("dialog", { name: "Preferences" }),
		).toBeVisible();
		expect(i18n.resolvedLanguage).toBe("en");
	});

	it("shows a localized error when logout fails", async () => {
		const onLogout = vi.fn().mockRejectedValue(new Error("logout failed"));
		const { user } = renderHeader(onLogout);

		await user.hover(screen.getByRole("button", { name: "测试用户" }));
		await user.click(await screen.findByRole("menuitem", { name: "退出" }));

		expect(onLogout).toHaveBeenCalledOnce();
		expect(await screen.findByText("退出失败，请重试")).toBeInTheDocument();
	});

	it("opens the account menu on hover and navigates to the profile", async () => {
		const { onNavigate, user } = renderHeader(
			vi.fn().mockResolvedValue(undefined),
		);
		await user.hover(screen.getByRole("button", { name: "测试用户" }));
		await user.click(await screen.findByRole("menuitem", { name: "个人资料" }));
		expect(onNavigate).toHaveBeenCalledWith("/account/profile");
	});
});
