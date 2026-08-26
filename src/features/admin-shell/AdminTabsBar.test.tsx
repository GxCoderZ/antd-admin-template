import { ConfigProvider } from "antd";
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import { beforeAll, describe, expect, it } from "vitest";
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

function TabsHarness() {
	const location = useLocation();
	const workspaceRef = createRef<HTMLDivElement>();

	return (
		<div ref={workspaceRef}>
			<AdminTabsBar
				currentPage={getAdminRouteMetadata(location.pathname)}
				workspaceRef={workspaceRef}
			/>
			<RouteStateProbe key={location.pathname} routeKey={location.pathname} />
		</div>
	);
}

describe("AdminTabsBar", () => {
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
