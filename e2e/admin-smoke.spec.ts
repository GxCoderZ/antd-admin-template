import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/login");

	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();

	await expect(page).toHaveURL(/\/dashboard$/);
}

async function showTableActions(page: Page) {
	await page
		.locator(".ant-table-content")
		.last()
		.evaluate((element) => {
			element.scrollLeft = element.scrollWidth;
		});
}

async function navigateWithinAdmin(page: Page, path: string) {
	await page.evaluate((nextPath) => {
		window.history.pushState(null, "", nextPath);
		window.dispatchEvent(new PopStateEvent("popstate"));
	}, path);
}

test("Fake 登录后可以查看关于系统信息", async ({ page }) => {
	await signIn(page);
	const currentUserButton = page.getByRole("button", {
		name: "Platform Admin",
	});
	await expect(currentUserButton.locator(".ant-avatar img")).toHaveCount(0);
	await expect(currentUserButton.locator(".anticon-user")).toBeVisible();
	await currentUserButton.click();
	for (const itemName of ["通知中心", "个人资料", "账号设置"]) {
		const menuItem = page.getByRole("menuitem", {
			name: itemName,
			exact: true,
		});
		await expect(menuItem.locator(".anticon")).toHaveCSS("margin-right", "8px");
	}
	await page.keyboard.press("Escape");
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "关于系统", exact: true }).click();
	await expect(page).toHaveURL(/\/system\/about$/);

	await expect(page.getByTestId("about-runtime-service")).toBeVisible();
	await expect(page.getByTestId("about-production-dependencies")).toHaveClass(
		/ant-table-medium/,
	);
	await expect(
		page.getByTestId("about-technology-item-Cloudflare Pages / GitHub"),
	).toBeVisible();
	await expect(
		page.getByTestId("about-technology-item-Playwright"),
	).toBeVisible();
	await expect(page.getByTestId("about-technology-item-Knip")).toBeVisible();
});

test("页面标签支持右键菜单关闭目标标签", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	await expect(page).toHaveURL(/\/organization\/users$/);

	const usersTab = page.getByRole("tab", { name: /用户管理/ });
	await usersTab.click({ button: "right" });

	const closeCurrent = page.getByRole("menuitem", {
		name: "关闭当前标签页",
	});
	await expect(closeCurrent).toBeVisible();
	await closeCurrent.click();

	await expect(page).toHaveURL(/\/dashboard$/);
	await expect(usersTab).toHaveCount(0);
});

test("管理表格在标签切换后保留查询草稿和每页条数", async ({ page }) => {
	await signIn(page);
	await navigateWithinAdmin(page, "/organization/users");
	await expect(page).toHaveURL(/\/organization\/users$/);

	const queryInput =
		page.getByPlaceholder("搜索用户名、显示名称、邮箱或手机号");
	await queryInput.fill("42");

	const usersTableCard = page.getByTestId("admin-users-table-card");
	const pageSizeChanger = usersTableCard.locator(
		".ant-pagination-options-size-changer",
	);
	await pageSizeChanger.click();
	await page.getByRole("option", { name: "10 条/页" }).click();
	await expect(pageSizeChanger).toContainText("10 条/页");

	await navigateWithinAdmin(page, "/access/roles");
	await expect(page).toHaveURL(/\/access\/roles$/);
	await expect(page.getByRole("tab", { name: /角色管理/ })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	await page.getByRole("tab", { name: /用户管理/ }).click();

	await expect(page).toHaveURL(/\/organization\/users$/);
	await expect(queryInput).toHaveValue("42");
	await expect(pageSizeChanger).toContainText("10 条/页");
});

test("操作审计在标签切换后保留查询草稿", async ({ page }) => {
	await signIn(page);
	await navigateWithinAdmin(page, "/operations/audit-logs");
	await expect(page).toHaveURL(/\/operations\/audit-logs$/);

	const actionInput = page.getByPlaceholder("请输入动作");
	await actionInput.fill("user.update");

	await navigateWithinAdmin(page, "/access/roles");
	await expect(page).toHaveURL(/\/access\/roles$/);
	await navigateWithinAdmin(page, "/operations/audit-logs");

	await expect(page).toHaveURL(/\/operations\/audit-logs$/);
	await expect(actionInput).toHaveValue("user.update");
	await page
		.getByTestId("audit-log-query-form")
		.getByRole("button", { name: /重.*置/ })
		.click();
	await expect(actionInput).toHaveValue("");

	await navigateWithinAdmin(page, "/access/roles");
	await navigateWithinAdmin(page, "/operations/audit-logs");
	await expect(actionInput).toHaveValue("");
});

test("登录日志在标签切换后保留查询草稿", async ({ page }) => {
	await signIn(page);
	await navigateWithinAdmin(page, "/operations/login-logs");
	await expect(page).toHaveURL(/\/operations\/login-logs$/);

	const queryForm = page.getByTestId("login-log-query-form");
	await queryForm.getByRole("combobox").first().click();
	await page
		.locator(".ant-select-dropdown:visible")
		.getByText("凭据无效", { exact: true })
		.click();
	const rangeStart = queryForm.getByPlaceholder("开始时间");
	const rangeEnd = queryForm.getByPlaceholder("结束时间");
	await rangeStart.fill("2026-08-01 00:00");
	await rangeStart.press("Tab");
	await rangeEnd.fill("2026-08-02 23:59");
	await rangeEnd.press("Enter");
	await expect(queryForm.getByTitle("凭据无效")).toBeVisible();

	await navigateWithinAdmin(page, "/access/roles");
	await expect(page).toHaveURL(/\/access\/roles$/);
	await navigateWithinAdmin(page, "/operations/login-logs");

	await expect(page).toHaveURL(/\/operations\/login-logs$/);
	await expect(queryForm.getByTitle("凭据无效")).toBeVisible();
	await expect(rangeStart).toHaveValue("2026-08-01 00:00");
	await expect(rangeEnd).toHaveValue("2026-08-02 23:59");
});

test("页面标签支持横向拖拽换位且保持当前路由", async ({ page }) => {
	await signIn(page);

	await navigateWithinAdmin(page, "/organization/users");
	await expect(page).toHaveURL(/\/organization\/users$/);
	await expect(page.getByRole("tab", { name: /用户管理/ })).toBeVisible();
	await navigateWithinAdmin(page, "/access/roles");
	await expect(page).toHaveURL(/\/access\/roles$/);

	const usersTab = page.getByRole("tab", { name: /用户管理/ });
	const rolesTab = page.getByRole("tab", { name: /角色管理/ });
	const usersBox = await usersTab.boundingBox();
	const rolesBox = await rolesTab.boundingBox();
	const usersTabNode = usersTab.locator("xpath=..");
	const rolesTabNode = rolesTab.locator("xpath=..");
	const rolesTabNodeBox = await rolesTabNode.boundingBox();

	expect(usersBox).not.toBeNull();
	expect(rolesBox).not.toBeNull();
	expect(rolesTabNodeBox).not.toBeNull();
	if (!usersBox || !rolesBox || !rolesTabNodeBox) {
		return;
	}

	await page.mouse.move(
		usersBox.x + usersBox.width / 2,
		usersBox.y + usersBox.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		usersBox.x + usersBox.width / 2,
		usersBox.y + usersBox.height / 2 + 12,
	);
	await page.waitForTimeout(30);
	const inactiveDragStyle = await usersTabNode.evaluate((element) => {
		const style = getComputedStyle(element);
		const alphaMatch = style.backgroundColor.match(
			/^rgba\([^,]+,[^,]+,[^,]+,\s*([^)]+)\)$/,
		);
		return {
			backgroundAlpha: alphaMatch ? Number(alphaMatch[1]) : 1,
			boxShadow: style.boxShadow,
		};
	});
	expect(inactiveDragStyle.backgroundAlpha).toBe(1);
	expect(inactiveDragStyle.boxShadow).not.toBe("none");
	await page.keyboard.press("Escape");

	await page.mouse.move(
		rolesBox.x + rolesBox.width / 2,
		rolesBox.y + rolesBox.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(rolesBox.x - 12, rolesBox.y + rolesBox.height / 2, {
		steps: 4,
	});
	await page.mouse.move(
		rolesBox.x + rolesBox.width / 2 - 80,
		rolesBox.y + rolesBox.height / 2 + 60,
	);
	await page.waitForTimeout(30);
	const responsiveBox = await rolesTabNode.boundingBox();
	expect(responsiveBox).not.toBeNull();
	expect(responsiveBox?.x).toBeLessThan(rolesTabNodeBox.x - 60);

	await page.waitForTimeout(320);
	const axisLockedBox = await rolesTabNode.boundingBox();
	expect(axisLockedBox).not.toBeNull();
	expect(axisLockedBox?.y).toBeCloseTo(rolesTabNodeBox.y, 0);

	await page.mouse.move(
		usersBox.x + usersBox.width / 2,
		usersBox.y + usersBox.height / 2 + 60,
		{ steps: 10 },
	);
	await page.mouse.up();

	await expect(page).toHaveURL(/\/access\/roles$/);
	await expect
		.poll(async () =>
			page
				.getByRole("tab")
				.evaluateAll((tabs) => tabs.map((tab) => tab.textContent?.trim())),
		)
		.toEqual(["仪表盘", "角色管理", "用户管理"]);
});

test("仪表盘标签固定首位且不参与拖拽让位", async ({ page }) => {
	await signIn(page);
	await navigateWithinAdmin(page, "/access/roles");
	await expect(page).toHaveURL(/\/access\/roles$/);

	const dashboardTab = page.getByRole("tab", { name: /仪表盘/ });
	const rolesTab = page.getByRole("tab", { name: /角色管理/ });
	await expect
		.poll(async () =>
			page
				.getByRole("tab")
				.evaluateAll((tabs) => tabs.map((tab) => tab.textContent?.trim())),
		)
		.toEqual(["仪表盘", "角色管理"]);

	const dashboardTabNode = dashboardTab.locator("xpath=..");
	const rolesTabNode = rolesTab.locator("xpath=..");
	const dashboardBox = await dashboardTabNode.boundingBox();
	const rolesBox = await rolesTab.boundingBox();
	const rolesTabNodeBox = await rolesTabNode.boundingBox();
	expect(dashboardBox).not.toBeNull();
	expect(rolesBox).not.toBeNull();
	expect(rolesTabNodeBox).not.toBeNull();
	if (!dashboardBox || !rolesBox || !rolesTabNodeBox) {
		return;
	}

	await page.mouse.move(
		rolesBox.x + rolesBox.width / 2,
		rolesBox.y + rolesBox.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		rolesBox.x + rolesBox.width / 2 - 12,
		rolesBox.y + rolesBox.height / 2,
	);
	await page.mouse.move(
		dashboardBox.x + dashboardBox.width / 2,
		dashboardBox.y + dashboardBox.height / 2,
		{ steps: 10 },
	);
	await page.waitForTimeout(100);
	const fixedDashboardBox = await dashboardTabNode.boundingBox();
	const draggedRolesBox = await rolesTabNode.boundingBox();
	expect(fixedDashboardBox?.x).toBeCloseTo(dashboardBox.x, 0);
	expect(fixedDashboardBox?.y).toBeCloseTo(dashboardBox.y, 0);
	expect(draggedRolesBox?.x).toBeLessThan(rolesTabNodeBox.x - 40);
	expect(
		await rolesTabNode.evaluate((element) => getComputedStyle(element).opacity),
	).toBe("1");
	await page.mouse.up();

	await expect
		.poll(async () =>
			page
				.getByRole("tab")
				.evaluateAll((tabs) => tabs.map((tab) => tab.textContent?.trim())),
		)
		.toEqual(["仪表盘", "角色管理"]);
	await dashboardTab.click({ button: "right" });
	await page.waitForTimeout(200);
	await expect(page.getByRole("menuitem", { name: "重新加载" })).toHaveCount(0);
});

test("用户管理查询栏在窄屏下保持核心筛选可见", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);

	const mobileMenuButton = page.getByRole("button", { name: "打开菜单" });
	const mobileMenuButtonMetrics = await mobileMenuButton.evaluate((button) => {
		const style = getComputedStyle(button);
		return {
			height: button.getBoundingClientRect().height,
			lineHeight: Number.parseFloat(style.lineHeight),
		};
	});
	expect(mobileMenuButtonMetrics.lineHeight).toBeLessThan(
		mobileMenuButtonMetrics.height,
	);
	await mobileMenuButton.click();
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	await expect(page).toHaveURL(/\/organization\/users$/);

	const statusFilter = page.getByRole("combobox", { name: "账号状态" });
	await expect(statusFilter).toBeHidden();
	await page.getByText("展开", { exact: true }).click();
	await expect(statusFilter).toBeVisible();
	await navigateWithinAdmin(page, "/access/roles");
	await navigateWithinAdmin(page, "/organization/users");
	await expect(statusFilter).toBeVisible();
	await expect(page.getByText("展开", { exact: true })).toHaveCount(0);
});

test("独立表格页面在窄屏下统一使用 24px 四周外层间距", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);

	const tablePagePaths = [
		"/organization/users",
		"/access/roles",
		"/organization/departments",
		"/organization/positions",
		"/system/dictionaries",
		"/system/announcements",
		"/operations/audit-logs",
		"/operations/login-logs",
	] as const;

	for (const path of tablePagePaths) {
		await navigateWithinAdmin(page, path);
		await expect(page).toHaveURL(new RegExp(`${path}$`));

		const pageContent = page.getByTestId("admin-shell-page-content");
		await expect(pageContent.locator(".ant-table").first()).toBeVisible();
		const padding = await pageContent.evaluate((element) => {
			const style = getComputedStyle(element);
			return [
				style.paddingTop,
				style.paddingRight,
				style.paddingBottom,
				style.paddingLeft,
			];
		});

		expect(padding, path).toEqual(["24px", "24px", "24px", "24px"]);
	}
});

test("角色管理支持查询、分页和标准表格工具", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "角色管理", exact: true }).click();
	await expect(page).toHaveURL(/\/access\/roles$/);

	await expect(page.getByPlaceholder("搜索角色名称或标识")).toBeVisible();
	const roleTableCard = page.getByTestId("admin-roles-table-card");
	const toolbarSettings = roleTableCard.locator(
		".ant-pro-table-list-toolbar-setting-item",
	);
	await expect(toolbarSettings).toHaveCount(3);
	for (const [index, tooltip] of ["刷新", "密度", "列设置"].entries()) {
		await toolbarSettings.nth(index).hover();
		await expect(page.getByRole("tooltip", { name: tooltip })).toBeVisible();
	}

	await page.getByPlaceholder("搜索角色名称或标识").fill("只读审计员");
	await page.getByRole("button", { name: /查\s*询/ }).click();
	await expect(page.getByRole("table")).toContainText("只读审计员");
	await expect(page.getByRole("table")).not.toContainText("平台管理员");

	await page.getByPlaceholder("搜索角色名称或标识").clear();
	await page.getByRole("button", { name: /查\s*询/ }).click();
	await showTableActions(page);
	await page
		.getByRole("row")
		.filter({ hasText: "资产审核员" })
		.getByRole("button", { name: "更多", exact: true })
		.click();
	await page.getByRole("menuitem", { name: "权限配置" }).click();
	const permissionDrawer = page
		.locator(".ant-drawer")
		.filter({ hasText: "平台权限" });
	await expect(
		permissionDrawer.getByRole("searchbox", { name: "搜索权限" }),
	).toBeVisible();
	await expect(permissionDrawer.getByText("系统管理菜单")).toBeVisible();
	await expect(permissionDrawer.getByText("用户管理页面")).toBeVisible();
	await expect(permissionDrawer.getByText(/已选 \d+\/10 项/)).toBeVisible();
	await expect(
		permissionDrawer.getByRole("button", { name: /保\s*存/ }),
	).toBeVisible();
	await permissionDrawer.getByRole("button", { name: /取\s*消/ }).click();
});

test("数据表按操作数量展示主要操作或更多菜单", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "编辑" }).first(),
	).toBeVisible();
	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await expect(
		page.getByRole("menuitem", { name: "角色", exact: true }),
	).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("menuitem", { name: "角色管理", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "编辑" }).first(),
	).toBeVisible();
	await showTableActions(page);
	await page
		.getByRole("row")
		.filter({ hasText: "资产审核员" })
		.getByRole("button", { name: "更多", exact: true })
		.click();
	await expect(page.getByRole("menuitem", { name: "权限配置" })).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("menuitem", { name: "公告管理", exact: true }).click();
	await expect(page.getByRole("table")).toContainText("系统维护通知");
	await expect(
		page.getByRole("button", { name: "编辑" }).first(),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "删除" }).first(),
	).toBeVisible();

	await page.getByRole("menuitem", { name: "日志管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "操作审计", exact: true }).click();
	await expect(
		page.getByRole("button", { name: /查看日志/ }).first(),
	).toBeVisible();
	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await expect(
		page.getByRole("menuitem", { name: "复制日志 ID" }),
	).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("menuitem", { name: "登录日志", exact: true }).click();
	await expect(
		page.getByRole("button", { name: /查看日志/ }).first(),
	).toBeVisible();
	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await expect(
		page.getByRole("menuitem", { name: "复制 IP 地址" }),
	).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("menuitem", { name: "关于系统", exact: true }).click();
	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await expect(page.getByRole("menuitem", { name: "复制包名" })).toBeVisible();
});

test("用户管理角色抽屉通过草稿选择统一保存", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	await expect(page).toHaveURL(/\/organization\/users$/);
	await expect(page.getByRole("table")).toContainText("owen.song");

	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await page.getByRole("menuitem", { name: "角色", exact: true }).click();

	const drawer = page
		.locator(".ant-drawer")
		.filter({ hasText: "owen.song 的角色" });
	await expect(
		drawer.getByRole("combobox", { name: "角色选择" }),
	).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
	await drawer.getByRole("combobox", { name: "角色选择" }).fill("auditor");
	await page.getByRole("option", { name: /只读审计员/ }).click();
	await expect(drawer.getByText("新增角色")).toBeVisible();
	await expect(drawer.getByText("只读审计员").first()).toBeVisible();
	await drawer.getByRole("button", { name: /保\s*存/ }).click();
	await expect(drawer.getByText("暂无未保存变更")).toBeVisible();
	await drawer.locator(".ant-drawer-close").click();
	await expect(drawer).toBeHidden();

	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await page.getByRole("menuitem", { name: "角色", exact: true }).click();
	const reopenedDrawer = page
		.locator(".ant-drawer")
		.filter({ hasText: "owen.song 的角色" });
	await expect(reopenedDrawer.getByText("只读审计员").first()).toBeVisible();
	await expect(reopenedDrawer.getByText("暂无未保存变更")).toBeVisible();
});

test("用户管理角色抽屉在 390px 窄屏下不溢出", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);

	await page.getByRole("button", { name: "打开菜单" }).click();
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	await expect(page).toHaveURL(/\/organization\/users$/);
	await page
		.getByPlaceholder("搜索用户名、显示名称、邮箱或手机号")
		.fill("admin");
	await page.getByRole("button", { name: /查\s*询/ }).click();
	await expect(page.getByRole("table")).toContainText("admin");

	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await page.getByRole("menuitem", { name: "角色", exact: true }).click();

	const drawer = page
		.locator(".ant-drawer")
		.filter({ hasText: "admin 的角色" })
		.locator(".ant-drawer-content-wrapper");
	await expect(drawer).toBeVisible();
	const drawerBounds = await drawer.boundingBox();
	expect(drawerBounds?.width).toBeLessThanOrEqual(390);
	await expect(page.getByRole("combobox", { name: "角色选择" })).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(390);
});

test("公告管理支持通过 Fake API 新建并查询公告", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "公告管理", exact: true }).click();
	await expect(page).toHaveURL(/\/system\/announcements$/);
	await expect(page.getByRole("table")).toContainText("系统维护通知");
	for (const actionName of ["reload", "column-height", "setting"]) {
		await expect(
			page.getByRole("img", { name: actionName, exact: true }),
		).toBeVisible();
	}
	await page.getByRole("img", { name: "setting", exact: true }).click();
	await expect(page.getByText("列展示", { exact: true })).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("button", { name: "新建公告" }).click();
	const drawer = page.locator(".ant-drawer").filter({ hasText: "新建公告" });
	await drawer.getByLabel("公告标题").fill("端到端公告演示");
	await drawer.getByLabel("公告内容").fill("验证公告创建和查询流程。");
	await drawer.getByRole("button", { name: /保\s*存/ }).click();
	await expect(drawer).toBeHidden();

	await page.getByPlaceholder("搜索公告标题").click();
	await page.getByPlaceholder("搜索公告标题").fill("端到端公告演示");
	await page.getByRole("button", { name: /查\s*询/ }).click();
	await expect(page.getByText("端到端公告演示", { exact: true })).toBeVisible();
});

test("公告管理在窄屏下保持可导航和可编辑", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);

	await page.getByRole("button", { name: "打开菜单" }).click();
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "公告管理", exact: true }).click();
	await expect(page).toHaveURL(/\/system\/announcements$/);
	await expect(page.getByRole("button", { name: "新建公告" })).toBeVisible();
	const statusFilter = page.getByRole("combobox", { name: "发布状态" });
	await expect(statusFilter).toHaveCount(0);
	await page.getByText("展开", { exact: true }).click();
	await expect(statusFilter).toBeVisible();

	await page.getByRole("button", { name: "新建公告" }).click();
	const drawer = page
		.locator(".ant-drawer")
		.filter({ hasText: "新建公告" })
		.locator(".ant-drawer-content-wrapper");
	await expect(drawer).toBeVisible();
	const drawerBounds = await drawer.boundingBox();
	expect(drawerBounds?.width).toBeLessThanOrEqual(390);
});

test("站内通知中心支持未读筛选和已读 Mutation", async ({ page }) => {
	await signIn(page);

	await page.getByRole("button", { name: "通知" }).click();
	const notificationPopover = page.getByTestId("notification-popover");
	await expect(notificationPopover).toBeVisible();
	await expect(
		notificationPopover.getByRole("button", { name: "查看全部消息" }),
	).toBeVisible();
	await notificationPopover
		.getByRole("button", { name: "查看全部消息" })
		.click();
	await expect(page).toHaveURL(/\/account\/notifications$/);
	await expect(page.getByRole("heading", { name: "通知中心" })).toBeVisible();
	const notificationCenter = page.locator("main");
	const firstUnreadItem = notificationCenter
		.locator('[data-testid^="notification-center-item-"]')
		.filter({ hasText: "待办事项即将到期 2" });
	await firstUnreadItem.getByRole("button", { name: "标记已读" }).click();
	await expect(
		firstUnreadItem.getByRole("button", { name: "标记已读" }),
	).toHaveCount(0);
	await page.getByText("未读", { exact: true }).click();
	await expect(page.getByText("暂无站内通知")).toHaveCount(0);
	await page.getByRole("button", { name: /全部已读/ }).click();
	await expect(page.getByText("暂无站内通知")).toBeVisible();
});
