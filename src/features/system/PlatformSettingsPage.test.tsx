import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { MemoryRouter, useLocation } from "react-router";

import { ApiProblemError } from "#src/api/client";
import {
	getPlatformSettings,
	updatePlatformSettings,
	type PlatformSettings,
} from "#src/api/settings";
import { PermissionContext, platformPermissions } from "../../app/permissions";
import { PlatformBrandProvider } from "../../app/PlatformBrand";
import { i18n } from "../../i18n";
import { PlatformSettingsPage } from "./PlatformSettingsPage";

vi.mock("#src/api/settings", async (importOriginal) => ({
	...(await importOriginal<typeof import("#src/api/settings")>()),
	getPlatformSettings: vi.fn(),
	updatePlatformSettings: vi.fn(),
}));

const settings: PlatformSettings = {
	general: {
		siteTitle: "AntD Admin Template",
		shortTitle: "Admin",
		logoDataUrl: null,
		browserTitle: "Admin Console",
		copyright: "Copyright 2026 Example",
	},
	security: {
		loginAccess: "all",
		maintenanceEnabled: false,
		maintenanceMessage: "Maintenance in progress",
		maintenanceEndsAt: null,
		captchaEnabled: false,
		passwordMinLength: 8,
		passwordRequirements: ["lowercase", "number"],
		loginFailureLimit: 5,
		lockoutMinutes: 15,
		idleTimeoutMinutes: 30,
		forceInitialPasswordChange: false,
	},
	notifications: {
		announcementsEnabled: true,
		inboxEnabled: true,
		unreadReminderEnabled: true,
		retentionDays: 90,
	},
	version: 1,
};

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});
afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
	vi.mocked(getPlatformSettings)
		.mockReset()
		.mockResolvedValue(structuredClone(settings));
	vi.mocked(updatePlatformSettings)
		.mockReset()
		.mockImplementation((input) =>
			Promise.resolve({
				general: input.general,
				security: input.security,
				notifications: input.notifications,
				version: input.expectedVersion + 1,
			}),
		);
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

function renderSettings(
	initialEntry = "/system/settings",
	canManage = true,
	withBrand = false,
) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	const user = userEvent.setup({ applyAccept: false });
	render(
		<ConfigProvider>
			<QueryClientProvider client={queryClient}>
				<PermissionContext.Provider
					value={new Set(canManage ? [platformPermissions.settingsManage] : [])}
				>
					<MemoryRouter initialEntries={[initialEntry]}>
						{withBrand ? (
							<PlatformBrandProvider>
								<PlatformSettingsPage />
							</PlatformBrandProvider>
						) : (
							<PlatformSettingsPage />
						)}
						<LocationProbe />
					</MemoryRouter>
				</PermissionContext.Provider>
			</QueryClientProvider>
		</ConfigProvider>,
	);
	return user;
}

describe("PlatformSettingsPage", () => {
	it("updates the browser title from the saved brand configuration", async () => {
		const user = renderSettings("/system/settings", true, true);
		const title = await screen.findByLabelText("浏览器标题");
		expect(document.title).toBe("Admin Console");
		await user.clear(title);
		await user.type(title, "Example Workspace");
		await user.click(screen.getByRole("button", { name: /保.*存/ }));
		await waitFor(() => expect(document.title).toBe("Example Workspace"));
	});

	it("rejects unsupported logos without changing the settings", async () => {
		const user = renderSettings();
		await screen.findByLabelText("系统名称");
		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]');
		if (!input) throw new Error("Missing logo input");
		await user.upload(
			input,
			new File(["<svg />"], "logo.svg", { type: "image/svg+xml" }),
		);
		expect(
			await screen.findByText("请选择不超过 1 MB 的 PNG、JPEG 或 WebP 图片。"),
		).toBeVisible();
		expect(updatePlatformSettings).not.toHaveBeenCalled();
	});

	it("blocks save during logo decoding and reports a corrupt image", async () => {
		let rejectDecode: ((error: Error) => void) | undefined;
		const decode = new Promise<ImageBitmap>((_resolve, reject) => {
			rejectDecode = reject;
		});
		vi.stubGlobal("createImageBitmap", vi.fn().mockReturnValue(decode));
		const user = renderSettings();
		await screen.findByLabelText("系统名称");
		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]');
		if (!input) throw new Error("Missing logo input");
		await user.upload(
			input,
			new File(["invalid"], "logo.png", { type: "image/png" }),
		);
		expect(screen.getByRole("button", { name: /保.*存/ })).toBeDisabled();
		if (!rejectDecode) throw new Error("Decoder not initialized");
		rejectDecode(new Error("Invalid image"));
		expect(
			await screen.findByText("图片读取失败，请选择有效图片后重试。"),
		).toBeVisible();
		expect(screen.getByRole("button", { name: /保.*存/ })).toBeEnabled();
	});

	it("shows only the three system sections and restores the URL section", async () => {
		renderSettings("/system/settings?section=security");
		expect(
			await screen.findByRole("tab", { name: "登录与安全" }),
		).toHaveAttribute("aria-selected", "true");
		expect(screen.getByRole("tab", { name: "基础信息" })).toBeVisible();
		expect(screen.getByRole("tab", { name: "通知与公告" })).toBeVisible();
		expect(
			screen.queryByRole("tab", { name: "界面偏好" }),
		).not.toBeInTheDocument();
		expect(screen.getByLabelText("登录入口")).toBeVisible();
	});

	it.each(["", "?layoutPreview=integrated"])(
		"preserves drafts and saves all groups together with %s",
		async (search) => {
			const user = renderSettings(`/system/settings${search}`);
			const title = await screen.findByLabelText("系统名称");
			await user.clear(title);
			await user.type(title, "Example Console");
			await user.click(screen.getByRole("tab", { name: "通知与公告" }));
			expect(screen.getByTestId("location-search")).toHaveTextContent(
				`${search || "?"}${search ? "&" : ""}section=notifications`,
			);
			await user.click(screen.getByRole("switch", { name: "未读消息提醒" }));
			await user.click(screen.getByRole("tab", { name: "基础信息" }));
			expect(screen.getByTestId("location-search")).toHaveTextContent(
				`/system/settings${search}`,
			);
			expect(screen.getByLabelText("系统名称")).toHaveValue("Example Console");
			await user.click(screen.getByRole("button", { name: /保.*存/ }));
			await waitFor(() =>
				expect(updatePlatformSettings).toHaveBeenCalledWith(
					expect.objectContaining({
						expectedVersion: 1,
						general: { ...settings.general, siteTitle: "Example Console" },
						security: settings.security,
						notifications: {
							...settings.notifications,
							unreadReminderEnabled: false,
						},
					}),
					expect.anything(),
				),
			);
			expect(await screen.findByText("系统设置已保存")).toBeVisible();
		},
	);

	it.each(["", "?layoutPreview=integrated"])(
		"returns to the invalid section without saving incomplete values with %s",
		async (search) => {
			const user = renderSettings(`/system/settings${search}`);
			await user.clear(await screen.findByLabelText("系统名称"));
			await user.click(screen.getByRole("tab", { name: "通知与公告" }));
			await user.click(screen.getByRole("button", { name: /保.*存/ }));
			await waitFor(() =>
				expect(
					screen.getByText("请输入 1 至 64 个字符。", { exact: true }),
				).toBeVisible(),
			);
			expect(screen.getByRole("tab", { name: "基础信息" })).toHaveAttribute(
				"aria-selected",
				"true",
			);
			expect(updatePlatformSettings).not.toHaveBeenCalled();
		},
	);

	it("requires a maintenance message only while maintenance is enabled", async () => {
		const user = renderSettings("/system/settings?section=security");
		const toggle = await screen.findByRole("switch", { name: "维护模式" });
		expect(screen.getByLabelText("维护提示文案")).toBeDisabled();
		await user.click(toggle);
		await user.clear(screen.getByLabelText("维护提示文案"));
		await user.click(screen.getByRole("button", { name: /保.*存/ }));
		expect(
			await screen.findByText("请输入 1 至 200 个字符。", { exact: true }),
		).toBeVisible();
		expect(updatePlatformSettings).not.toHaveBeenCalled();
	});

	it("keeps failed edits and requires an explicit reload after a conflict", async () => {
		vi.mocked(updatePlatformSettings).mockRejectedValueOnce(
			new ApiProblemError(409, "Conflict"),
		);
		const user = renderSettings();
		const title = await screen.findByLabelText("系统名称");
		await user.clear(title);
		await user.type(title, "Unsaved name");
		await user.click(screen.getByRole("button", { name: /保.*存/ }));
		expect(
			await screen.findByRole("button", { name: "重新加载" }),
		).toBeVisible();
		expect(title).toHaveValue("Unsaved name");
		expect(screen.getByRole("button", { name: /保.*存/ })).toBeDisabled();
		vi.mocked(getPlatformSettings).mockResolvedValueOnce({
			...settings,
			version: 2,
		});
		await user.click(screen.getByRole("button", { name: "重新加载" }));
		await waitFor(() =>
			expect(screen.getByLabelText("系统名称")).toHaveValue(
				settings.general.siteTitle,
			),
		);
	});

	it("shows load errors without an editable empty form and supports retry", async () => {
		vi.mocked(getPlatformSettings).mockRejectedValueOnce(new Error("Offline"));
		const user = renderSettings();
		expect(await screen.findByText("系统设置加载失败")).toBeVisible();
		expect(screen.queryByLabelText("系统名称")).not.toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: /重.*试/ }));
		expect(await screen.findByLabelText("系统名称")).toHaveValue(
			settings.general.siteTitle,
		);
	});

	it.each(["", "?layoutPreview=integrated"])(
		"disables editing and omits save without manage permission with %s",
		async (search) => {
			const user = renderSettings(`/system/settings${search}`, false);
			expect(await screen.findByLabelText("系统名称")).toBeDisabled();
			expect(
				screen.queryByRole("button", { name: /保.*存/ }),
			).not.toBeInTheDocument();
			await user.click(screen.getByRole("tab", { name: "登录与安全" }));
			expect(screen.getByRole("switch", { name: "维护模式" })).toBeDisabled();
		},
	);
});
