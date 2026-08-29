import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
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

	it("reports only the concise build and runtime information", async () => {
		vi.spyOn(systemApi, "getSystemInfo").mockResolvedValue({
			builtAt: "2026-08-25T10:00:00.000Z",
			commitSha: "93376d3f00ab",
			environment: "cloudflare-pages",
			service: "antd-admin-template-fake-ui",
			version: "0.1.0",
		});

		renderAboutSystemPage();

		const runtime = within(screen.getByTestId("about-runtime-service"));
		expect(await runtime.findByText("Cloudflare Pages")).toBeVisible();
		expect(screen.getByText("93376d3f")).toBeVisible();
		expect(
			screen.queryByRole("heading", { name: "技术栈与工程能力" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByTestId("about-production-dependencies"),
		).not.toBeInTheDocument();
	});
});
