import { ConfigProvider } from "antd";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";

import { getAdminRouteMetadata } from "../../app/adminRoutes";
import { useRouteSessionState } from "../../app/routeSessionState";
import { i18n } from "../../i18n";
import { AdminTabsBar } from "./AdminTabsBar";

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

function RouteStateProbe({ routeKey }: Readonly<{ routeKey: string }>) {
	const [queryDraft, setQueryDraft] = useRouteSessionState({
		initialState: "",
		routeKey,
		stateKey: "test-query-draft",
	});
	return (
		<>
			<button onClick={() => setQueryDraft("42")} type="button">
				保存标签状态
			</button>
			<output aria-label="标签状态">{queryDraft}</output>
		</>
	);
}

function TabsHarness({ onReload = vi.fn() }: { onReload?: () => void }) {
	const location = useLocation();
	const workspaceRef = createRef<HTMLDivElement>();

	return (
		<div ref={workspaceRef}>
			<AdminTabsBar
				currentPage={getAdminRouteMetadata(location.pathname)}
				onReload={onReload}
				workspaceRef={workspaceRef}
			/>
			<RouteStateProbe key={location.pathname} routeKey={location.pathname} />
		</div>
	);
}

describe("AdminTabsBar", () => {
	it.each(["button", "more", "context"])(
		"reloads the active page through the shared command from %s",
		async (entry) => {
			const onReload = vi.fn();
			const router = createMemoryRouter(
				[{ path: "*", element: <TabsHarness onReload={onReload} /> }],
				{ initialEntries: ["/organization/users?source=tab#content"] },
			);
			render(
				<ConfigProvider theme={{ token: { motion: false } }}>
					<RouterProvider router={router} />
				</ConfigProvider>,
			);
			const originalLocation = router.state.location;
			if (entry === "button") {
				fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
			} else {
				if (entry === "more") {
					fireEvent.click(screen.getByRole("button", { name: "更多标签操作" }));
				} else {
					fireEvent.contextMenu(screen.getByText("用户管理"));
				}
				fireEvent.click(
					await screen.findByRole("menuitem", { name: "重新加载" }),
				);
			}
			expect(onReload).toHaveBeenCalledExactlyOnceWith();
			expect(router.state.location).toBe(originalLocation);
		},
	);

	it("disables refresh for an inactive context-menu target", async () => {
		const onReload = vi.fn();
		const router = createMemoryRouter(
			[{ path: "*", element: <TabsHarness onReload={onReload} /> }],
			{ initialEntries: ["/organization/users"] },
		);
		render(
			<ConfigProvider theme={{ token: { motion: false } }}>
				<RouterProvider router={router} />
			</ConfigProvider>,
		);
		await act(() => router.navigate("/access/roles"));
		fireEvent.contextMenu(screen.getByText("用户管理"));
		const reload = await screen.findByRole("menuitem", { name: "重新加载" });
		expect(reload).toHaveAttribute("aria-disabled", "true");
		fireEvent.click(reload);
		expect(onReload).not.toHaveBeenCalled();
		expect(router.state.location.pathname).toBe("/access/roles");
	});

	it("clears temporary route state when a tab is closed", async () => {
		sessionStorage.clear();
		const router = createMemoryRouter(
			[{ path: "*", element: <TabsHarness /> }],
			{ initialEntries: ["/organization/users"] },
		);

		render(
			<ConfigProvider>
				<RouterProvider router={router} />
			</ConfigProvider>,
		);

		fireEvent.click(screen.getByRole("button", { name: "保存标签状态" }));
		expect(screen.getByRole("status", { name: "标签状态" })).toHaveTextContent(
			"42",
		);
		fireEvent.contextMenu(screen.getByText("用户管理"));
		fireEvent.click(
			await screen.findByRole("menuitem", { name: "关闭当前标签页" }),
		);
		await router.navigate("/organization/users");

		expect(
			screen.getByRole("status", { name: "标签状态" }),
		).toBeEmptyDOMElement();
	});

	it("keeps the tab strip at a fixed border-box height", () => {
		const router = createMemoryRouter(
			[{ path: "*", element: <TabsHarness /> }],
			{ initialEntries: ["/access/roles"] },
		);

		const { container } = render(
			<ConfigProvider>
				<RouterProvider router={router} />
			</ConfigProvider>,
		);

		const tabs = container.querySelector(".ant-tabs");
		expect(tabs).toHaveStyle({
			boxSizing: "border-box",
			flex: "0 0 40px",
			height: "40px",
			minHeight: "40px",
		});
	});

	it("keeps the dashboard tab fixed without close, drag, or context actions", async () => {
		const router = createMemoryRouter(
			[{ path: "*", element: <TabsHarness /> }],
			{ initialEntries: ["/organization/users"] },
		);

		render(
			<ConfigProvider>
				<RouterProvider router={router} />
			</ConfigProvider>,
		);

		const dashboardTab = screen.getByRole("tab", { name: /仪表盘/ });
		const dashboardTabNode = dashboardTab.parentElement;
		expect(dashboardTabNode).not.toBeNull();
		expect(dashboardTabNode).not.toHaveAttribute("aria-roledescription");
		expect(dashboardTabNode?.querySelector("button")).toBeNull();

		act(() => {
			fireEvent.contextMenu(screen.getByText("仪表盘"));
		});
		await waitFor(() =>
			expect(screen.queryByRole("menuitem", { name: "重新加载" })).toBeNull(),
		);
	});

	it("closes the context-menu target and returns to the dashboard", async () => {
		const router = createMemoryRouter(
			[{ path: "*", element: <TabsHarness /> }],
			{ initialEntries: ["/organization/users"] },
		);

		render(
			<ConfigProvider>
				<RouterProvider router={router} />
			</ConfigProvider>,
		);

		const usersTab = screen.getByRole("tab", { name: /用户管理/ });
		const usersTabNode = usersTab.parentElement;
		expect(usersTabNode).not.toBeNull();

		fireEvent.contextMenu(usersTabNode!);
		fireEvent.click(
			await screen.findByRole("menuitem", { name: "关闭当前标签页" }),
		);

		expect(router.state.location.pathname).toBe("/dashboard");
		expect(screen.queryByRole("tab", { name: /用户管理/ })).toBeNull();
		expect(screen.getByRole("tab", { name: /仪表盘/ })).toBeVisible();
	});
});
