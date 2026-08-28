import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider, Grid } from "antd";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAdminRouteMetadata } from "../../app/adminRoutes";
import { PermissionProvider } from "../../app/PermissionProvider";
import {
	platformPermissions,
	type PlatformPermission,
} from "../../app/permissions";
import type { MenuType, NavigationMode } from "../../app/preferenceStorage";
import { i18n } from "../../i18n";
import { AdminShellNavigation } from "./AdminShellNavigation";

beforeEach(async () => {
	await i18n.changeLanguage("zh-CN");
	vi.spyOn(Grid, "useBreakpoint").mockReturnValue({ sm: true, lg: true });
});

afterEach(() => vi.restoreAllMocks());

function renderNavigation(
	path: string,
	permissions: PlatformPermission[] = [platformPermissions.logsRead],
	navigationMode: NavigationMode = "side",
	menuType: MenuType = "single",
) {
	const onNavigate = vi.fn();
	render(
		<MemoryRouter>
			<ConfigProvider theme={{ token: { motion: false } }}>
				<PermissionProvider permissions={permissions}>
					<AdminShellNavigation
						currentPage={getAdminRouteMetadata(path)}
						headerActions={null}
						logo={null}
						menuType={menuType}
						navigationMode={navigationMode}
						onNavigate={onNavigate}
						siteTitle="React Antd Admin"
						shortTitle="Admin"
					>
						{() => null}
					</AdminShellNavigation>
				</PermissionProvider>
			</ConfigProvider>
		</MemoryRouter>,
	);
	return { onNavigate, user: userEvent.setup() };
}

describe("log navigation", () => {
	it.each(["top", "mixed"] as const)(
		"shows the complete site title beside the logo in %s navigation",
		(mode) => {
			renderNavigation("/dashboard", [], mode);
			const brand = within(screen.getByRole("banner")).getByRole("link", {
				name: "仪表盘",
			});
			expect(brand).toHaveTextContent("React Antd Admin");
			expect(brand).toHaveAttribute("href", "/dashboard");
		},
	);

	it.each(["single", "twoColumn", "serviceGrid", "splitServiceGrid"] as const)(
		"supports held and repeated full-item ripples in %s sidebar menus",
		(menuType) => {
			renderNavigation(
				"/organization/users",
				[platformPermissions.usersRead],
				"side",
				menuType,
			);
			const item = screen.getByRole("menuitem", {
				name: "用户管理",
			});
			fireEvent.pointerDown(item, { button: 0, clientX: 8, clientY: 10 });
			const ripple = item.querySelector('[data-rippling="true"]');
			expect(ripple).toHaveAttribute("data-ripple-state", "pressed");
			fireEvent.pointerUp(item);
			expect(ripple).toHaveAttribute("data-ripple-state", "released");
			fireEvent.pointerDown(item, { button: 0, clientX: 10, clientY: 12 });
			expect(ripple).toHaveAttribute("data-ripple-phase", "alternate");
			expect(ripple).toHaveAttribute("data-ripple-state", "pressed");
			fireEvent.pointerCancel(item);
			expect(ripple).toHaveAttribute("data-ripple-state", "released");
		},
	);

	it.each(["top", "mixed"] as const)(
		"supports held and repeated full-item ripples in %s horizontal navigation",
		(mode) => {
			renderNavigation("/dashboard", [], mode);
			const item = screen.getByRole("menuitem", { name: "仪表盘" });
			fireEvent.pointerDown(item, { button: 0, clientX: 2, clientY: 2 });
			const ripple = item.querySelector('[data-rippling="true"]');
			expect(ripple).toHaveAttribute("data-ripple-state", "pressed");
			fireEvent.pointerUp(item);
			expect(ripple).toHaveAttribute("data-ripple-state", "released");
			fireEvent.pointerDown(item, { button: 0, clientX: 4, clientY: 4 });
			expect(ripple).toHaveAttribute("data-ripple-phase", "alternate");
			expect(ripple).toHaveAttribute("data-ripple-state", "pressed");
			fireEvent.pointerCancel(item);
			expect(ripple).toHaveAttribute("data-ripple-state", "released");
		},
	);

	it("adds the ripple to the complete submenu title, not just its label", () => {
		renderNavigation("/operations/login-logs");
		const title = screen.getByRole("menuitem", {
			name: "日志管理",
		});
		fireEvent.pointerDown(title, { button: 0, clientX: 2, clientY: 2 });
		expect(title.querySelector('[data-rippling="true"]')).toHaveAttribute(
			"data-ripple-state",
			"pressed",
		);
	});

	it("keeps the new item's ripple held when the previously focused item blurs", () => {
		renderNavigation("/dashboard");
		const previous = screen.getByRole("menuitem", { name: "仪表盘" });
		const next = screen.getByRole("menuitem", { name: "系统管理" });
		fireEvent.focus(previous);
		fireEvent.pointerDown(next, { button: 0, clientX: 8, clientY: 10 });
		fireEvent.blur(previous, { relatedTarget: next });
		const ripple = next.querySelector('[data-rippling="true"]');
		expect(ripple).toHaveAttribute("data-ripple-state", "pressed");
		fireEvent.blur(next, { relatedTarget: document.body });
		expect(ripple).toHaveAttribute("data-ripple-state", "released");
	});

	it.each(["side", "mixed"] as const)(
		"shows a decorative log group icon in %s navigation",
		(mode) => {
			renderNavigation(
				"/operations/login-logs",
				[platformPermissions.logsRead],
				mode,
			);
			const group = screen.getByRole("menuitem", { name: "日志管理" });
			const icon = within(group).getByRole("img", { hidden: true });
			expect(icon).toBeVisible();
			expect(icon).toHaveAttribute("aria-hidden", "true");
		},
	);

	it("shows the same log group icon in the mobile navigation drawer", async () => {
		vi.mocked(Grid.useBreakpoint).mockReturnValue({ sm: false, lg: false });
		const { user } = renderNavigation("/operations/login-logs");
		await user.click(screen.getByRole("button", { name: "打开菜单" }));
		const group = await screen.findByRole("menuitem", { name: "日志管理" });
		expect(within(group).getByRole("img", { hidden: true })).toBeVisible();
	});

	it("places about last at the root and shows only its own breadcrumb", () => {
		renderNavigation("/system/about");
		expect(
			screen.getAllByRole("menuitem").map((item) => item.textContent),
		).toEqual(["仪表盘", "系统管理", "关于系统"]);
		const breadcrumb = within(screen.getByRole("banner")).getByRole(
			"navigation",
		);
		expect(breadcrumb.textContent).toBe("关于系统");
	});

	it.each(["side", "top", "mixed"] as const)(
		"opens the root about page in %s navigation",
		async (mode) => {
			const { user, onNavigate } = renderNavigation("/dashboard", [], mode);
			await user.click(screen.getByRole("menuitem", { name: "关于系统" }));
			expect(onNavigate).toHaveBeenCalledExactlyOnceWith("/system/about");
		},
	);

	it.each([
		["/operations/login-logs", "登录日志"],
		["/operations/audit-logs", "操作审计"],
	])(
		"opens the log ancestors and shows a three-level breadcrumb for %s",
		(path, title) => {
			renderNavigation(path);

			expect(
				screen.getByRole("menuitem", { name: "日志管理" }),
			).toHaveAttribute("aria-expanded", "true");
			expect(screen.getByRole("menuitem", { name: title })).toBeVisible();
			const breadcrumb = within(screen.getByRole("banner")).getByRole(
				"navigation",
			);
			expect(breadcrumb).toHaveTextContent(`系统管理/日志管理/${title}`);
		},
	);

	it("navigates between log pages using their unchanged URLs", async () => {
		const { user, onNavigate } = renderNavigation("/operations/login-logs");
		await user.click(screen.getByRole("menuitem", { name: "操作审计" }));
		expect(onNavigate).toHaveBeenCalledExactlyOnceWith(
			"/operations/audit-logs",
		);
	});

	it("hides the log group when its pages are not permitted", () => {
		renderNavigation("/organization/users", [platformPermissions.usersRead]);

		expect(screen.getByRole("menuitem", { name: "用户管理" })).toBeVisible();
		expect(
			screen.queryByRole("menuitem", { name: "日志管理" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("menuitem", { name: "登录日志" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("menuitem", { name: "操作审计" }),
		).not.toBeInTheDocument();
		const breadcrumb = within(screen.getByRole("banner")).getByRole(
			"navigation",
		);
		expect(breadcrumb).toHaveTextContent("系统管理/用户管理");
	});
});
