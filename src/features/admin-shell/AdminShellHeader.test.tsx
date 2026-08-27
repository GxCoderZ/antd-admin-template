import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider } from "antd";
import { beforeAll, describe, expect, it, vi } from "vitest";

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

vi.mock("./SettingsDrawer", () => ({
	SettingsDrawer: () => null,
}));

beforeAll(async () => i18n.changeLanguage("zh-CN"));

function renderHeader(onLogout: () => Promise<void>) {
	const onNavigate = vi.fn();
	render(
		<ConfigProvider>
			<PermissionProvider permissions={[]}>
				<AdminShellHeader
					currentUserAvatarRevision={0}
					currentUserId="user-1"
					currentUsername="测试用户"
					isColorBlindMode={false}
					isDarkMode={false}
					isFooterVisible
					menuType="single"
					navigationMode="side"
					onChangeColorBlindMode={vi.fn()}
					onChangeFooterVisibility={vi.fn()}
					onChangeMenuType={vi.fn()}
					onChangeNavigationMode={vi.fn()}
					onChangeThemeColor={vi.fn()}
					onChangeThemeMode={vi.fn()}
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

	return { onNavigate, user: userEvent.setup() };
}

describe("AdminShellHeader", () => {
	it("shows a localized error when logout fails", async () => {
		const onLogout = vi.fn().mockRejectedValue(new Error("logout failed"));
		const { user } = renderHeader(onLogout);

		await user.click(screen.getByRole("button", { name: "测试用户" }));
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
