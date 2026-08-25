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
