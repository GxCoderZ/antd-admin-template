import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { PermissionContext, platformPermissions } from "../../app/permissions";
import { ThemeModeProvider } from "../../app/ThemeModeProvider";
import { i18n } from "../../i18n";
import { PlatformSettingsPage } from "./PlatformSettingsPage";

vi.mock("#src/api/settings", () => ({
	getPlatformSettings: vi.fn().mockResolvedValue({
		siteTitle: "Admin Temp",
		version: 1,
	}),
	platformSettingsQueryKey: ["platform-settings"],
	updatePlatformSettings: vi.fn(),
}));

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

function LocationProbe() {
	const location = useLocation();
	return (
		<output data-testid="location-search">
			{location.pathname}
			{location.search}
		</output>
	);
}

function renderPlatformSettings(initialEntry = "/system/settings") {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
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
						value={new Set([platformPermissions.settingsManage])}
					>
						<ThemeModeProvider
							value={{
								isColorBlindMode: false,
								isDarkMode: false,
								onChangeColorBlindMode: vi.fn(),
								onChangeThemeColor: vi.fn(),
								onChangeThemeMode: vi.fn(),
								themeColor: "#1677ff",
								themeMode: "light",
							}}
						>
							<MemoryRouter initialEntries={[initialEntry]}>
								<PlatformSettingsPage />
								<LocationProbe />
							</MemoryRouter>
						</ThemeModeProvider>
					</PermissionContext.Provider>
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);

	return user;
}

describe("PlatformSettingsPage", () => {
	it("renders page-level tabs outside the content panel without a duplicate title", async () => {
		renderPlatformSettings();

		const generalTab = await screen.findByRole("tab", { name: "基本设置" });
		const contentPanel = screen.getByRole("region", { name: "基本设置" });
		const contentCard = contentPanel.closest(".ant-card");

		expect(
			screen.queryByRole("heading", { name: "系统设置" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("heading", { name: "站点标题" }),
		).not.toBeInTheDocument();
		expect(contentCard).toHaveClass("ant-card");
		expect(contentCard).not.toHaveClass("ant-card-bordered");
		expect(contentCard).not.toContainElement(generalTab);
		expect(generalTab.closest(".ant-card")).toBeNull();
	});

	it("keeps platform settings sections in top tabs and in the URL", async () => {
		const user = renderPlatformSettings();

		expect(
			await screen.findByRole("tab", { name: "基本设置" }),
		).toHaveAttribute("aria-selected", "true");
		expect(screen.getByRole("tab", { name: "界面偏好" })).toBeVisible();

		await user.click(screen.getByRole("tab", { name: "界面偏好" }));
		expect(screen.getByTestId("location-search")).toHaveTextContent(
			"/system/settings/appearance",
		);
		expect(await screen.findByLabelText("主题模式")).toBeVisible();
		expect(screen.getByLabelText("界面语言")).toBeVisible();
		expect(screen.getByLabelText("时区")).toBeVisible();
		expect(screen.getByLabelText("表格密度")).toBeVisible();
	});

	it("restores the selected platform settings section from the URL", async () => {
		renderPlatformSettings("/system/settings/appearance");

		expect(
			await screen.findByRole("tab", { name: "界面偏好" }),
		).toHaveAttribute("aria-selected", "true");
	});
});
