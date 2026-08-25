import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/login");

	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();

	await expect(page).toHaveURL(/\/dashboard$/);
}

test("Fake 登录后可以查看关于系统信息", async ({ page }) => {
	await signIn(page);
	const currentUserButton = page.getByRole("button", {
		name: "Platform Admin",
	});
	await expect(currentUserButton.locator(".ant-avatar img")).toHaveCount(0);
	await expect(currentUserButton.locator(".anticon-user")).toBeVisible();
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "关于系统", exact: true }).click();
	await expect(page).toHaveURL(/\/system\/about$/);

	await expect(page.getByTestId("about-runtime-service")).toBeVisible();
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

test("用户管理查询栏在窄屏下自适应收起", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);

	await page.getByRole("button", { name: "打开菜单" }).click();
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	await expect(page).toHaveURL(/\/organization\/users$/);

	const statusFilter = page.getByRole("combobox", { name: "状态" });
	await expect(statusFilter).toHaveCount(0);
	await page.getByText("展开", { exact: true }).click();
	await expect(statusFilter).toBeVisible();
});

test("角色管理支持查询、分页和标准表格工具", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "角色管理", exact: true }).click();
	await expect(page).toHaveURL(/\/access\/roles$/);

	await expect(page.getByPlaceholder("搜索角色名称或标识")).toBeVisible();
	for (const actionName of ["刷新", "表格密度", "列设置", "表格全屏"]) {
		await expect(page.getByRole("button", { name: actionName })).toBeVisible();
	}
	await expect(page.getByRole("button", { name: "right" })).toBeEnabled();

	await page.getByPlaceholder("搜索角色名称或标识").fill("只读审计员");
	await page.getByRole("button", { name: /查\s*询/ }).click();
	await expect(page.getByRole("table")).toContainText("只读审计员");
	await expect(page.getByRole("table")).not.toContainText("平台管理员");
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
	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await expect(page.getByRole("menuitem", { name: "权限配置" })).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("menuitem", { name: "公告管理", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "编辑" }).first(),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "删除" }).first(),
	).toBeVisible();

	await page.getByRole("menuitem", { name: "审计日志", exact: true }).click();
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

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "关于系统", exact: true }).click();
	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await expect(page.getByRole("menuitem", { name: "复制包名" })).toBeVisible();
});

test("表单示例通过 Fake API 完成基础与分步提交", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "页面示例", exact: true }).click();
	await page.getByRole("menuitem", { name: "基础表单", exact: true }).click();
	await expect(page).toHaveURL(/\/examples\/forms\/basic$/);
	await page.getByLabel("标题").fill("端到端客户目标");
	await page.getByPlaceholder("开始日期").fill("2026-09-01");
	await page.getByPlaceholder("结束日期").fill("2026-09-30");
	await page.getByLabel("目标描述").fill("提升重点客户满意度。");
	await page.getByLabel("衡量标准").fill("满意度达到 95%。");
	await page.getByRole("button", { name: /提\s*交/ }).click();
	await expect(page.getByText("提交成功", { exact: true })).toBeVisible();

	await page.getByRole("menuitem", { name: "分步表单", exact: true }).click();
	await expect(page).toHaveURL(/\/examples\/forms\/step$/);
	await page.getByRole("button", { name: "下一步" }).click();
	await expect(
		page.getByText("test@example.com", { exact: true }),
	).toBeVisible();
	await page.getByLabel("支付密码").fill("123456");
	await page.getByRole("button", { name: /提\s*交/ }).click();
	await expect(page.getByText("操作成功", { exact: true })).toBeVisible();
});

test("表单示例在窄屏下保持完整可用", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);

	await page.getByRole("button", { name: "打开菜单" }).click();
	await page.getByRole("menuitem", { name: "页面示例", exact: true }).click();
	await page.getByRole("menuitem", { name: "基础表单", exact: true }).click();
	await expect(page).toHaveURL(/\/examples\/forms\/basic$/);
	await expect(page.getByLabel("标题")).toBeVisible();
	await expect(page.getByRole("button", { name: /提\s*交/ })).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(390);

	await page.getByRole("button", { name: "打开菜单" }).click();
	await page.getByRole("menuitem", { name: "页面示例", exact: true }).click();
	await page.getByRole("menuitem", { name: "分步表单", exact: true }).click();
	await expect(page).toHaveURL(/\/examples\/forms\/step$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "分步表单" }),
	).toBeVisible();
	await expect(page.getByLabel("收款账户")).toBeVisible();
	await expect(page.getByRole("button", { name: "下一步" })).toBeVisible();
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
	for (const actionName of ["刷新", "表格密度", "表格设置", "表格全屏"]) {
		await expect(page.getByRole("button", { name: actionName })).toBeVisible();
	}
	await page.getByRole("button", { name: "表格设置" }).click();
	await expect(page.getByText("列展示", { exact: true })).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("button", { name: "新建公告" }).click();
	const drawer = page.locator(".ant-drawer").filter({ hasText: "新建公告" });
	await drawer.getByLabel("公告标题").fill("端到端公告演示");
	await drawer.getByLabel("公告内容").fill("验证公告创建和查询流程。");
	await drawer.getByRole("button", { name: /保\s*存/ }).click();
	await expect(drawer).toBeHidden();

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
