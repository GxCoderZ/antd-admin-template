import { ConfigProvider } from "antd";
import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";

import { getAdminRouteMetadata } from "../../app/adminRoutes";
import { i18n } from "../../i18n";
import { AdminTabsBar } from "./AdminTabsBar";

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

function TabsHarness() {
	const location = useLocation();
	const workspaceRef = createRef<HTMLDivElement>();

	return (
		<div ref={workspaceRef}>
			<AdminTabsBar
				currentPage={getAdminRouteMetadata(location.pathname)}
				workspaceRef={workspaceRef}
			/>
		</div>
	);
}

describe("AdminTabsBar", () => {
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

		fireEvent.contextMenu(screen.getByText("用户管理"));
		fireEvent.click(
			await screen.findByRole("menuitem", { name: "关闭当前标签页" }),
		);

		expect(router.state.location.pathname).toBe("/dashboard");
		expect(screen.queryByRole("tab", { name: /用户管理/ })).toBeNull();
		expect(screen.getByRole("tab", { name: /仪表盘/ })).toBeVisible();
	});
});
