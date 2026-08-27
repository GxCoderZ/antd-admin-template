import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfigProvider, Grid } from "antd";
import { useState } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesContext } from "../../app/localePreferences";
import { PermissionProvider } from "../../app/PermissionProvider";
import { defaultPreferences } from "../../app/preferenceStorage";
import { createAppQueryClient } from "../../app/queryClient";
import { useQuerySubmission } from "../../app/queryFilterLayout";
import { useRouteSessionState } from "../../app/routeSessionState";
import { PlatformBrandContext } from "../../app/usePlatformBrand";
import { i18n } from "../../i18n";
import { AdminShellPage } from "./AdminShellPage";

const { loadShell } = vi.hoisted(() => ({
	loadShell: vi.fn(() => Promise.resolve("shell data")),
}));

vi.mock("./AdminShellHeader", () => ({
	AdminShellHeader: function ShellProbe() {
		const [draft, setDraft] = useState("");
		const query = useQuery({ queryKey: ["refresh-shell"], queryFn: loadShell });
		return (
			<>
				<input
					aria-label="Shell draft"
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
				/>
				<output aria-label="Shell data">{query.data}</output>
			</>
		);
	},
}));

function PageProbe({ loadPage }: { loadPage: () => Promise<string> }) {
	const [draft, setDraft] = useRouteSessionState({
		routeKey: "/dashboard",
		stateKey: "refresh-query-draft",
		initialState: "",
	});
	const [detailsOpen, setDetailsOpen] = useState(false);
	const submission = useQuerySubmission();
	const query = useQuery({
		queryKey: ["refresh-page", submission.revision],
		queryFn: loadPage,
	});
	return (
		<>
			<input
				aria-label="Query draft"
				value={draft}
				onChange={(event) => setDraft(event.target.value)}
			/>
			<button onClick={() => setDetailsOpen(true)} type="button">
				Open details
			</button>
			<button onClick={submission.submit} type="button">
				Submit query
			</button>
			{detailsOpen ? <div role="dialog" aria-label="Page details" /> : null}
			{query.isError ? (
				<div role="alert">{query.error.message}</div>
			) : (
				<output aria-label="Page data">{query.data}</output>
			)}
		</>
	);
}

beforeEach(async () => {
	await i18n.changeLanguage("zh-CN");
	localStorage.clear();
	sessionStorage.clear();
	loadShell.mockClear();
	vi.spyOn(Grid, "useBreakpoint").mockReturnValue({ sm: true, lg: true });
});

afterEach(() => vi.restoreAllMocks());

async function renderShell(loadPage: () => Promise<string>) {
	const queryClient = createAppQueryClient();
	const loadInactive = vi.fn(() => Promise.resolve("cached inactive data"));
	await queryClient.prefetchQuery({
		queryKey: ["refresh-inactive"],
		queryFn: loadInactive,
	});
	const router = createMemoryRouter(
		[
			{
				element: (
					<AdminShellPage
						currentUserAvatarRevision={0}
						currentUserId="test-admin"
						currentUsername="Admin"
						isColorBlindMode={false}
						isDarkMode={false}
						onChangeColorBlindMode={vi.fn()}
						onChangeThemeColor={vi.fn()}
						onChangeThemeMode={vi.fn()}
						onLogout={vi.fn(() => Promise.resolve())}
						themeColor={defaultPreferences.themeColor}
						themeMode="light"
					/>
				),
				children: [
					{ path: "/dashboard", element: <PageProbe loadPage={loadPage} /> },
				],
			},
		],
		{ initialEntries: ["/dashboard?from=test#summary"] },
	);
	const view = render(
		<QueryClientProvider client={queryClient}>
			<ConfigProvider theme={{ token: { motion: false } }}>
				<PermissionProvider permissions={[]}>
					<LocalePreferencesContext
						value={{
							currency: defaultPreferences.currency,
							language: "zh-CN",
							timeZone: defaultPreferences.timeZone,
							onChangeCurrency: vi.fn(),
							onChangeTimeZone: vi.fn(),
						}}
					>
						<PlatformBrandContext
							value={{
								siteTitle: "Admin",
								shortTitle: "Admin",
								browserTitle: "Admin",
								copyright: "Admin",
								logoDataUrl: null,
							}}
						>
							<RouterProvider router={router} />
						</PlatformBrandContext>
					</LocalePreferencesContext>
				</PermissionProvider>
			</ConfigProvider>
		</QueryClientProvider>,
	);
	await waitFor(() =>
		expect(
			screen.getByRole("status", { name: "Shell data" }),
		).toHaveTextContent("shell data"),
	);
	return { ...view, queryClient, router, loadInactive };
}

describe("AdminShellPage refresh", () => {
	it("re-fetches after query submission even when the pre-submission key is cached", async () => {
		const loadPage = vi.fn(() => Promise.resolve("initial data"));
		const { queryClient, unmount } = await renderShell(loadPage);
		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Page data" }),
			).toHaveTextContent("initial data"),
		);
		loadPage.mockResolvedValue("submitted data");
		fireEvent.click(screen.getByRole("button", { name: "Submit query" }));
		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Page data" }),
			).toHaveTextContent("submitted data"),
		);
		loadPage.mockResolvedValue("refreshed data");
		fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Page data" }),
			).toHaveTextContent("refreshed data"),
		);
		expect(loadPage).toHaveBeenCalledTimes(3);
		unmount();
		queryClient.clear();
	});

	it("remounts only the current page and re-fetches fresh cached data while preserving route drafts", async () => {
		const loadPage = vi.fn(() => Promise.resolve("initial data"));
		const { router, queryClient, loadInactive, unmount } =
			await renderShell(loadPage);
		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Page data" }),
			).toHaveTextContent("initial data"),
		);
		fireEvent.change(screen.getByRole("textbox", { name: "Query draft" }), {
			target: { value: "saved filter" },
		});
		fireEvent.change(screen.getByRole("textbox", { name: "Shell draft" }), {
			target: { value: "shell stays mounted" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Open details" }));
		const location = router.state.location;
		const pageData = screen.getByRole("status", { name: "Page data" });
		const shellDraft = screen.getByRole("textbox", { name: "Shell draft" });

		loadPage.mockResolvedValue("refreshed data");
		fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Page data" }),
			).toHaveTextContent("refreshed data"),
		);
		expect(screen.getByRole("status", { name: "Page data" })).not.toBe(
			pageData,
		);
		expect(
			screen.queryByRole("dialog", { name: "Page details" }),
		).not.toBeInTheDocument();
		expect(screen.getByRole("textbox", { name: "Query draft" })).toHaveValue(
			"saved filter",
		);
		expect(screen.getByRole("textbox", { name: "Shell draft" })).toBe(
			shellDraft,
		);
		expect(shellDraft).toHaveValue("shell stays mounted");
		expect(router.state.location).toBe(location);
		expect(loadPage).toHaveBeenCalledTimes(2);
		expect(loadShell).toHaveBeenCalledTimes(1);
		expect(loadInactive).toHaveBeenCalledTimes(1);
		expect(queryClient.getQueryData(["refresh-inactive"])).toBe(
			"cached inactive data",
		);

		loadPage.mockResolvedValue("refreshed again");
		fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Page data" }),
			).toHaveTextContent("refreshed again"),
		);
		expect(loadPage).toHaveBeenCalledTimes(3);
		unmount();
		queryClient.clear();
	});

	it("shows a failed refresh and can retry through the same refresh command", async () => {
		const loadPage = vi.fn(() => Promise.resolve("initial data"));
		const { queryClient, unmount } = await renderShell(loadPage);
		await waitFor(() => expect(loadPage).toHaveBeenCalledTimes(1));
		loadPage.mockRejectedValueOnce(new Error("Refresh failed"));
		fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Refresh failed",
		);
		loadPage.mockResolvedValue("recovered data");
		fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
		await waitFor(() =>
			expect(
				screen.getByRole("status", { name: "Page data" }),
			).toHaveTextContent("recovered data"),
		);
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		expect(loadPage).toHaveBeenCalledTimes(3);
		unmount();
		queryClient.clear();
	});
});
