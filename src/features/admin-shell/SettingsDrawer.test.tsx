import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider, Grid } from "antd";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	defaultPreferences,
	themeColorOptions,
} from "../../app/preferenceStorage";
import { i18n } from "../../i18n";
import { SettingsDrawer, type SettingsDrawerProps } from "./SettingsDrawer";

beforeEach(async () => {
	await i18n.changeLanguage("zh-CN");
	vi.spyOn(Grid, "useBreakpoint").mockReturnValue({ sm: true });
});

afterEach(() => vi.restoreAllMocks());

function renderSettings(overrides: Partial<SettingsDrawerProps> = {}) {
	const props: SettingsDrawerProps = {
		isColorBlindMode: false,
		isFooterVisible: true,
		language: "zh-CN",
		menuType: "single",
		navigationMode: "side",
		onChangeColorBlindMode: vi.fn(),
		onChangeFooterVisibility: vi.fn(),
		onChangeLanguage: vi.fn(),
		onChangeMenuType: vi.fn(),
		onChangeNavigationMode: vi.fn(),
		onChangeThemeColor: vi.fn(),
		onChangeThemeMode: vi.fn(),
		onChangeTimeZone: vi.fn(),
		onClose: vi.fn(),
		onResetPreferences: vi.fn(),
		open: true,
		themeColor: defaultPreferences.themeColor,
		themeMode: "light",
		timeZone: "UTC",
		...overrides,
	};
	const content = (next: SettingsDrawerProps) => (
		<ConfigProvider theme={{ token: { motion: false } }}>
			<SettingsDrawer {...next} />
		</ConfigProvider>
	);
	const view = render(content(props));
	return {
		props,
		user: userEvent.setup(),
		rerender: (next: Partial<SettingsDrawerProps>) =>
			view.rerender(content({ ...props, ...next })),
	};
}

describe("SettingsDrawer", () => {
	it("keeps structural layout choices out of user preferences", () => {
		renderSettings({ navigationMode: "top" });

		expect(screen.getByRole("switch", { name: "显示页脚" })).toBeVisible();
		expect(
			screen.queryByRole("combobox", { name: "内容区域宽度" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("switch", { name: "显示菜单头" }),
		).not.toBeInTheDocument();
	});

	it("keeps theme and navigation controlled by their existing owners", () => {
		const { props, rerender } = renderSettings();
		fireEvent.click(screen.getByRole("radio", { name: "深色模式" }));
		expect(props.onChangeThemeMode).toHaveBeenCalledWith("dark");
		rerender({ themeMode: "dark" });
		expect(screen.getByRole("radio", { name: "深色模式" })).toBeChecked();
		fireEvent.click(screen.getByRole("radio", { name: "跟随系统" }));
		expect(props.onChangeThemeMode).toHaveBeenLastCalledWith("system");
		fireEvent.click(screen.getByRole("radio", { name: "顶部菜单" }));
		expect(props.onChangeNavigationMode).toHaveBeenCalledWith("top");
		rerender({ navigationMode: "top" });
		expect(screen.getByRole("radio", { name: "顶部菜单" })).toBeChecked();
		expect(
			screen.queryByRole("radiogroup", { name: "侧边菜单样式" }),
		).not.toBeInTheDocument();
	});

	it("offers visual choices for all four supported menu modes and respects navigation constraints", async () => {
		const { props, user, rerender } = renderSettings();
		const menu = screen.getByRole("radiogroup", { name: "侧边菜单样式" });
		expect(within(menu).getAllByRole("radio")).toHaveLength(4);
		expect(within(menu).getByRole("radio", { name: "单列菜单" })).toBeChecked();
		await user.click(within(menu).getByRole("radio", { name: "分栏双列菜单" }));
		expect(props.onChangeMenuType).toHaveBeenCalledWith("splitServiceGrid");
		rerender({ menuType: "splitServiceGrid" });
		expect(
			within(menu).getByRole("radio", { name: "分栏双列菜单" }),
		).toBeChecked();
		rerender({ navigationMode: "mixed" });
		expect(within(menu).getAllByRole("radio")).toHaveLength(2);
		expect(
			within(menu).queryByRole("radio", { name: "分栏双列菜单" }),
		).not.toBeInTheDocument();
	});

	it("exposes selected swatches and labels them on hover", async () => {
		const { props, user, rerender } = renderSettings();
		expect(screen.getByRole("button", { name: "蓝" })).toHaveAttribute(
			"aria-pressed",
			"true",
		);
		const red = screen.getByRole("button", { name: "红" });
		await user.hover(red);
		expect(await screen.findByRole("tooltip")).toHaveTextContent("红");
		await user.click(red);
		const redColor = themeColorOptions[1].value;
		expect(props.onChangeThemeColor).toHaveBeenCalledWith(redColor);
		rerender({ themeColor: redColor });
		expect(red).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByRole("button", { name: "蓝" })).toHaveAttribute(
			"aria-pressed",
			"false",
		);
	});

	it("retains footer, accessibility, language and timezone controls", async () => {
		const { props, user } = renderSettings();
		await user.click(screen.getByRole("switch", { name: "显示页脚" }));
		expect(props.onChangeFooterVisibility).toHaveBeenCalledWith(
			false,
			expect.anything(),
		);
		await user.click(screen.getByRole("switch", { name: "色弱模式" }));
		expect(props.onChangeColorBlindMode).toHaveBeenCalledWith(
			true,
			expect.anything(),
		);
		await user.click(screen.getByRole("combobox", { name: "界面语言" }));
		await user.click(screen.getByText("English", { exact: true }));
		expect(props.onChangeLanguage).toHaveBeenCalledWith("en");
		await user.click(screen.getByRole("combobox", { name: "时区" }));
		await user.type(
			screen.getByRole("combobox", { name: "时区" }),
			"Asia/Shanghai",
		);
		await user.click(await screen.findByTitle("Asia/Shanghai"));
		expect(props.onChangeTimeZone).toHaveBeenCalledWith(
			"Asia/Shanghai",
			expect.objectContaining({ value: "Asia/Shanghai" }),
		);
	});

	it("confirms resetting preferences and can close without changing them", async () => {
		const { props, user } = renderSettings();
		await user.click(screen.getByRole("button", { name: "恢复默认设置" }));
		await user.click(await screen.findByRole("button", { name: /^取\s*消$/ }));
		expect(props.onResetPreferences).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "恢复默认设置" }));
		await user.click(await screen.findByRole("button", { name: "确认恢复" }));
		await waitFor(() =>
			expect(props.onResetPreferences).toHaveBeenCalledTimes(1),
		);
		await user.click(screen.getByRole("button", { name: "Close" }));
		expect(props.onClose).toHaveBeenCalledTimes(1);
	});
});
