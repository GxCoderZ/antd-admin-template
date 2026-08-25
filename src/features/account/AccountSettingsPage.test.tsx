import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { ThemeModeProvider } from "../../app/ThemeModeProvider";
import { i18n } from "../../i18n";
import { AccountSettingsPage } from "./AccountSettingsPage";

vi.mock("#src/api/account", () => ({
	deletePlatformAccountAvatar: vi.fn(),
	getPlatformAccount: vi.fn().mockResolvedValue({
		address: "西湖区工专路 77 号",
		bio: "专注于企业级产品设计与研发",
		city: "hangzhou",
		country: "china",
		createdAt: "2026-01-01T00:00:00.000Z",
		displayName: "Platform Admin",
		email: "admin@example.com",
		id: "user-admin",
		phoneAreaCode: "+86",
		phoneNumber: "18100000000",
		province: "zhejiang",
		roles: [],
		username: "admin",
		version: 1,
	}),
	getPlatformAccountNotifications: vi.fn().mockResolvedValue({
		systemMessage: true,
		todoTask: true,
		userMessage: true,
	}),
	getPlatformAccountSecurity: vi.fn().mockResolvedValue({
		backupEmail: "backup@example.com",
		securityPhoneAreaCode: "+86",
		securityPhoneNumber: "13900001234",
	}),
	platformAccountNotificationsQueryKey: ["platform-account", "notifications"],
	platformAccountQueryKey: ["platform-account"],
	platformAccountSecurityQueryKey: ["platform-account", "security"],
	changePlatformAccountPassword: vi.fn(),
	updatePlatformAccount: vi.fn(),
	updatePlatformAccountNotifications: vi.fn(),
	updatePlatformAccountSecurity: vi.fn(),
	uploadPlatformAccountAvatar: vi.fn(),
}));

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

function renderAccountSettings() {
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
						<MemoryRouter initialEntries={["/account/settings"]}>
							<AccountSettingsPage />
						</MemoryRouter>
					</ThemeModeProvider>
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);

	return user;
}

async function openSecuritySettings(user: ReturnType<typeof userEvent.setup>) {
	await user.click(await screen.findByRole("menuitem", { name: "安全设置" }));
}

describe("AccountSettingsPage", () => {
	it("uses the official account settings information architecture", async () => {
		const user = renderAccountSettings();

		expect(
			await screen.findByRole("menuitem", { name: "基本设置" }),
		).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "安全设置" })).toBeVisible();
		expect(screen.getByRole("menuitem", { name: "新消息通知" })).toBeVisible();
		expect(
			screen.queryByRole("menuitem", { name: "偏好设置" }),
		).not.toBeInTheDocument();
		expect(screen.queryByText("登录设备")).not.toBeInTheDocument();

		await user.click(screen.getByRole("menuitem", { name: "新消息通知" }));
		expect(
			await screen.findByRole("switch", { name: "用户消息" }),
		).toBeChecked();
	});

	it("requires password confirmation", async () => {
		const user = renderAccountSettings();
		await openSecuritySettings(user);
		await user.click(
			await screen.findByRole("button", { name: "修改账号密码" }),
		);
		const passwordDialog = await screen.findByRole("dialog", {
			name: "修改密码",
		});
		expect(passwordDialog).toBeInTheDocument();
		expect(
			within(passwordDialog).getByLabelText("确认新密码"),
		).toBeInTheDocument();
	});

	it("opens security phone without leaving security settings", async () => {
		const user = renderAccountSettings();
		await openSecuritySettings(user);
		await user.click(
			await screen.findByRole("button", { name: "修改密保手机" }),
		);
		expect(
			await screen.findByRole("dialog", { name: "修改密保手机" }),
		).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "安全设置" })).toBeVisible();
	});

	it("opens backup email without leaving security settings", async () => {
		const user = renderAccountSettings();
		await openSecuritySettings(user);
		await user.click(
			await screen.findByRole("button", { name: "修改备用邮箱" }),
		);
		expect(
			await screen.findByRole("dialog", { name: "修改备用邮箱" }),
		).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "安全设置" })).toBeVisible();
	});
});
