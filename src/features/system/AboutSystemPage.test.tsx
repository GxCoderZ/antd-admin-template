import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import * as systemApi from "#src/api/system";
import { LocalePreferencesContext } from "../../app/localePreferences";
import "../../i18n";
import { AboutSystemPage } from "./AboutSystemPage";

describe("AboutSystemPage", () => {
	it("uses the Ant Design default skeleton while runtime data loads", () => {
		vi.spyOn(systemApi, "getSystemInfo").mockReturnValue(
			new Promise(() => undefined),
		);
		const queryClient = new QueryClient({
			defaultOptions: { queries: { retry: false } },
		});
		const { getByTestId } = render(
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

		expect(
			getByTestId("about-runtime-service").querySelector(
				".ant-skeleton.ant-skeleton-active",
			),
		).toBeInTheDocument();
	});
});
