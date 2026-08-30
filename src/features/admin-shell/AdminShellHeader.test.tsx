import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider } from "antd";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PermissionProvider } from "../../app/PermissionProvider";
import { defaultPreferences } from "../../app/preferenceStorage";
import { i18n } from "../../i18n";
import * as languageResources from "../../i18n";
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
afterEach(() => vi.restoreAllMocks());

function renderHeader(onLogout: () => Promise<void>, isDarkMode = false) {
	const onNavigate = vi.fn();
	const onChangeThemeMode = vi.fn();
	render(
		<ConfigProvider theme={{ token: { motion: false } }}>
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
	it.each(["搜索", "语言", "切换为深色模式", "测试用户"])(
		"adds the project ripple to %s without changing its size",
		(name) => {
			renderHeader(vi.fn().mockResolvedValue(undefined));
			const button = screen.getByRole("button", { name });
			const height = button.style.height;
			const padding = button.style.padding;

			fireEvent.pointerDown(button, { button: 0, clientX: 8, clientY: 10 });
			expect(button).toHaveAttribute("data-rippling", "true");
			expect(button.style.height).toBe(height);
			expect(button.style.padding).toBe(padding);
		},
	);

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
		await user.hover(screen.getByRole("button", { name: "语言" }));
		expect(
			await screen.findByRole("menuitem", { name: "简体中文" }),
		).toHaveAttribute("aria-current", "true");
		await waitFor(() =>
			expect(screen.getByText("\u{1F1FA}\u{1F1F8}")).toBeVisible(),
		);
		await user.click(await screen.findByRole("menuitem", { name: "English" }));
		expect(await screen.findByRole("button", { name: "Search" })).toBeVisible();
		expect(i18n.resolvedLanguage).toBe("en");
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("keeps the language control available without a spinner while resources load", async () => {
		let finishLoading!: () => void;
		const pending = new Promise<void>((resolve) => {
			finishLoading = resolve;
		});
		const load = vi
			.spyOn(languageResources, "loadLanguageResources")
			.mockReturnValueOnce(pending);
		const change = vi.spyOn(i18n, "changeLanguage");
		const { user } = renderHeader(vi.fn().mockResolvedValue(undefined));
		await user.hover(screen.getByRole("button", { name: "语言" }));
		await user.click(await screen.findByRole("menuitem", { name: "English" }));

		expect(load).toHaveBeenCalledWith("en");
		expect(change).not.toHaveBeenCalled();
		const button = screen.getByRole("button", { name: "语言" });
		expect(button).toBeEnabled();
		expect(within(button).queryByRole("img", { name: "loading" })).toBeNull();
		await user.hover(button);
		await waitFor(() =>
			expect(screen.getByRole("menuitem", { name: "简体中文" })).toBeVisible(),
		);

		await act(async () => {
			finishLoading();
			await pending;
		});
		expect(await screen.findByRole("button", { name: "Search" })).toBeVisible();
	});

	it.each([
		["zh-TW", "繁體中文"],
		["zh-CN", "简体中文"],
	])(
		"keeps the latest choice %s when an earlier load finishes later",
		async (code, label) => {
			let finishLoading!: () => void;
			const pending = new Promise<void>((resolve) => {
				finishLoading = resolve;
			});
			vi.spyOn(languageResources, "loadLanguageResources").mockReturnValueOnce(
				pending,
			);
			const { user } = renderHeader(vi.fn().mockResolvedValue(undefined));
			await user.hover(screen.getByRole("button", { name: "语言" }));
			await user.click(
				await screen.findByRole("menuitem", { name: "English" }),
			);
			await user.hover(screen.getByRole("button", { name: "语言" }));
			const choice = await screen.findByRole("menuitem", { name: label });
			await waitFor(() => expect(choice).toBeVisible());
			await user.click(choice);
			await waitFor(() => expect(i18n.resolvedLanguage).toBe(code));

			await act(async () => {
				finishLoading();
				await pending;
			});
			expect(i18n.resolvedLanguage).toBe(code);
		},
	);

	it("keeps the current language and reports resource loading errors", async () => {
		vi.spyOn(languageResources, "loadLanguageResources").mockRejectedValueOnce(
			new Error("language chunk unavailable"),
		);
		const { user } = renderHeader(vi.fn().mockResolvedValue(undefined));
		await user.hover(screen.getByRole("button", { name: "语言" }));
		await user.click(await screen.findByRole("menuitem", { name: "English" }));

		await waitFor(() =>
			expect(screen.getByText("语言切换失败，请重试")).toBeVisible(),
		);
		expect(i18n.resolvedLanguage).toBe("zh-CN");
		expect(screen.getByRole("button", { name: "语言" })).toBeEnabled();
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
		await user.click(screen.getByRole("button", { name: "测试用户" }));
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

		await user.click(screen.getByRole("button", { name: "测试用户" }));
		await user.click(await screen.findByRole("menuitem", { name: "退出" }));

		expect(onLogout).toHaveBeenCalledOnce();
		expect(await screen.findByText("退出失败，请重试")).toBeInTheDocument();
	});

	it("opens the account menu from a click without requiring hover", async () => {
		renderHeader(vi.fn().mockResolvedValue(undefined));

		fireEvent.click(screen.getByRole("button", { name: "测试用户" }));

		expect(
			await screen.findByRole("menuitem", { name: "个人资料" }),
		).toBeInTheDocument();
	});

	it("opens the account menu on click and navigates to the profile", async () => {
		const { onNavigate, user } = renderHeader(
			vi.fn().mockResolvedValue(undefined),
		);
		await user.click(screen.getByRole("button", { name: "测试用户" }));
		await user.click(await screen.findByRole("menuitem", { name: "个人资料" }));
		expect(onNavigate).toHaveBeenCalledWith("/account/profile");
	});
});
