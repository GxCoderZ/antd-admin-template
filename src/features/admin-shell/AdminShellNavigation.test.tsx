import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigProvider, Grid } from "antd";
import { MemoryRouter, useLocation } from "react-router";
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

function NavigationLocation() {
	const location = useLocation();
	return <output aria-label="Current route">{location.pathname}</output>;
}

function renderNavigation(
	path: string,
	permissions: PlatformPermission[] = [platformPermissions.logsRead],
	navigationMode: NavigationMode = "side",
	menuType: MenuType = "single",
) {
	const onNavigate = vi.fn();
	render(
		<MemoryRouter initialEntries={[path]}>
			<ConfigProvider theme={{ token: { motion: false } }}>
				<PermissionProvider permissions={permissions}>
					<AdminShellNavigation
						currentPage={getAdminRouteMetadata(path)}
						headerActions={null}
						logo={null}
						menuType={menuType}
						navigationMode={navigationMode}
						onNavigate={onNavigate}
						sidebarLogo={null}
						siteTitle="React Antd Admin"
						shortTitle="Admin"
					>
						{() => <NavigationLocation />}
					</AdminShellNavigation>
				</PermissionProvider>
			</ConfigProvider>
		</MemoryRouter>,
	);
	return { onNavigate, user: userEvent.setup() };
}

describe("log navigation", () => {
	it.each([
		["side", "single", "/system/about"],
		["side", "twoColumn", "/system/about"],
		["side", "serviceGrid", "/system/about"],
		["side", "splitServiceGrid", "/system/about"],
		["top", "single", "/system/about"],
		["mixed", "single", "/system/about"],
		["mixed", "single", "/operations/login-logs"],
	] as const)(
		"shares one held and repeatable brand ripple in %s %s at %s",
		async (mode, menuType, path) => {
			const { user } = renderNavigation(
				path,
				[platformPermissions.logsRead],
				mode,
				menuType,
			);
			const brand = screen.getByRole("link", { name: "仪表盘" });
			fireEvent.pointerEnter(brand);
			fireEvent.pointerDown(brand, { button: 2 });
			expect(brand).not.toHaveAttribute("data-rippling");
			const target = brand.firstElementChild ?? brand;
			fireEvent.pointerDown(target, { button: 0, clientX: 8, clientY: 10 });
			expect(brand).toHaveAttribute("data-ripple-state", "pressed");
			expect(brand).toHaveAttribute("data-ripple-phase", "primary");
			expect(brand.querySelector("[data-rippling]")).toBeNull();
			fireEvent.pointerUp(target);
			expect(brand).toHaveAttribute("data-ripple-state", "released");
			fireEvent.pointerDown(target, { button: 0, clientX: 12, clientY: 14 });
			expect(brand).toHaveAttribute("data-ripple-phase", "alternate");
			expect(brand).toHaveAttribute("data-ripple-state", "pressed");
			fireEvent.pointerCancel(brand);
			expect(brand).toHaveAttribute("data-ripple-state", "released");
			await user.click(brand);
			expect(screen.getByLabelText("Current route")).toHaveTextContent(
				"/dashboard",
			);
		},
	);

	it("uses native link keyboard activation and releases the brand ripple on blur", async () => {
		const { user } = renderNavigation("/system/about");
		const brand = screen.getByRole("link", { name: "仪表盘" });
		brand.focus();
		fireEvent.keyDown(brand, { key: " " });
		expect(brand).not.toHaveAttribute("data-rippling");
		await user.keyboard("{Enter>}");
		expect(brand).toHaveAttribute("data-ripple-state", "pressed");
		expect(screen.getByLabelText("Current route")).toHaveTextContent(
			"/dashboard",
		);
		fireEvent.keyDown(brand, { key: "Enter", repeat: true });
		expect(brand).toHaveAttribute("data-ripple-phase", "primary");
		await user.keyboard("{/Enter}");
		expect(brand).toHaveAttribute("data-ripple-state", "released");
		fireEvent.pointerDown(brand, { button: 0 });
		fireEvent.pointerLeave(brand);
		expect(brand).toHaveAttribute("data-ripple-state", "released");
		fireEvent.pointerDown(brand, { button: 0 });
		fireEvent.blur(brand);
		expect(brand).toHaveAttribute("data-ripple-state", "released");
	});

	it.each(["仪表盘", "系统管理", "关于系统"])(
		"keeps the first-level %s icon in the two-column menu",
		(title) => {
			renderNavigation(
				"/operations/login-logs",
				[platformPermissions.logsRead],
				"side",
				"serviceGrid",
			);
			const item = screen.getByRole("menuitem", { name: title });
			expect(within(item).getByRole("img", { hidden: true })).toBeVisible();
		},
	);

	it.each([
		["side", "serviceGrid"],
		["mixed", "serviceGrid"],
		["side", "splitServiceGrid"],
	] as const)(
		"omits second-level and deeper icons in %s %s menus without losing navigation",
		async (mode, menuType) => {
			const { user, onNavigate } = renderNavigation(
				"/operations/login-logs",
				[platformPermissions.logsRead, platformPermissions.usersRead],
				mode,
				menuType,
			);
			const menu = within(screen.getByTestId("admin-shell-service-grid-menu"));
			for (const title of ["用户管理", "日志管理", "登录日志", "操作审计"]) {
				const item = menu.getByRole("menuitem", { name: title });
				expect(item).toBeVisible();
				expect(within(item).queryByRole("img", { hidden: true })).toBeNull();
			}
			expect(menu.getByRole("menuitem", { name: "日志管理" })).toHaveAttribute(
				"aria-expanded",
				"true",
			);
			await user.click(menu.getByRole("menuitem", { name: "操作审计" }));
			expect(onNavigate).toHaveBeenCalledExactlyOnceWith(
				"/operations/audit-logs",
			);
		},
	);

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
