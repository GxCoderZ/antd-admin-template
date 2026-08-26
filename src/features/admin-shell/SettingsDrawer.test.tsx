import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { defaultPreferences } from "../../app/preferenceStorage";
import { i18n } from "../../i18n";
import { SettingsDrawer } from "./SettingsDrawer";

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

describe("SettingsDrawer", () => {
	it("keeps structural layout choices out of user preferences", () => {
		render(
			<SettingsDrawer
				isColorBlindMode={false}
				isFooterVisible
				language="zh-CN"
				menuType="single"
				navigationMode="top"
				onChangeColorBlindMode={vi.fn()}
				onChangeFooterVisibility={vi.fn()}
				onChangeLanguage={vi.fn()}
				onChangeMenuType={vi.fn()}
				onChangeNavigationMode={vi.fn()}
				onChangeThemeColor={vi.fn()}
				onChangeThemeMode={vi.fn()}
				onChangeTimeZone={vi.fn()}
				onClose={vi.fn()}
				onResetPreferences={vi.fn()}
				open
				themeColor={defaultPreferences.themeColor}
				themeMode="light"
				timeZone="UTC"
			/>,
		);

		expect(screen.getByRole("switch", { name: "显示页脚" })).toBeVisible();
		expect(
			screen.queryByRole("combobox", { name: "内容区域宽度" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("switch", { name: "显示菜单头" }),
		).not.toBeInTheDocument();
	});
});
