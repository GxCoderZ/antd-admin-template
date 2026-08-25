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

test("公告管理支持通过 Fake API 新建并查询公告", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "公告管理", exact: true }).click();
	await expect(page).toHaveURL(/\/system\/announcements$/);
	await expect(page.getByRole("table")).toContainText("系统维护通知");

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

	await page.getByRole("button", { name: "新建公告" }).click();
	const drawer = page.locator(".ant-drawer-content-wrapper");
	await expect(drawer).toBeVisible();
	const drawerBounds = await drawer.boundingBox();
	expect(drawerBounds?.width).toBeLessThanOrEqual(390);
});
