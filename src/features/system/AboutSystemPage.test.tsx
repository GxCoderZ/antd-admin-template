import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import * as systemApi from "#src/api/system";
import { LocalePreferencesContext } from "../../app/localePreferences";
import { i18n } from "../../i18n";
import { AboutSystemPage } from "./AboutSystemPage";

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

afterEach(() => {
	vi.restoreAllMocks();
});

function renderAboutSystemPage() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});

	return render(
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
				<AboutSystemPage />
			</QueryClientProvider>
		</LocalePreferencesContext.Provider>,
	);
}

describe("AboutSystemPage", () => {
	it("uses the Ant Design default skeleton while runtime data loads", () => {
		vi.spyOn(systemApi, "getSystemInfo").mockReturnValue(
			new Promise(() => undefined),
		);
		const { getByTestId } = renderAboutSystemPage();

		expect(
			getByTestId("about-runtime-service").querySelector(
				".ant-skeleton.ant-skeleton-active",
			),
		).toBeInTheDocument();
	});

	it("reports the actual build, deployment, and enabled stack", async () => {
		vi.spyOn(systemApi, "getSystemInfo").mockResolvedValue({
			builtAt: "2026-08-25T10:00:00.000Z",
			commitSha: "93376d3f00ab",
			environment: "cloudflare-pages",
			service: "antd-admin-template-fake-ui",
			version: "0.1.0",
		});

		renderAboutSystemPage();

		expect(await screen.findByText("Cloudflare Pages")).toBeVisible();
		expect(screen.getByText("93376d3f")).toBeVisible();
		expect(screen.getByText("Cloudflare Pages / GitHub")).toBeVisible();
		expect(screen.getByText(/服务端状态与请求缓存/)).toBeVisible();
		expect(screen.queryByText("Zustand")).not.toBeInTheDocument();
		expect(screen.queryByText("Ant Design Plots")).not.toBeInTheDocument();
	});

	it("offers dependency copy actions from the standard more menu", async () => {
		const user = userEvent.setup();
		vi.spyOn(systemApi, "getSystemInfo").mockResolvedValue({
			builtAt: "2026-08-25T10:00:00.000Z",
			commitSha: "93376d3f00ab",
			environment: "cloudflare-pages",
			service: "antd-admin-template-fake-ui",
			version: "0.1.0",
		});

		renderAboutSystemPage();

		const moreButtons = await screen.findAllByRole("button", { name: "更多" });
		await user.click(moreButtons[0]!);
		expect(
			screen.getByRole("menuitem", { name: "复制包名" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("menuitem", { name: "复制版本" }),
		).toBeInTheDocument();
	});
});
