import { expect, type Page, test } from "@playwright/test";

async function login(page: Page) {
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
}

test("桌面导航可以打开 Ant Design Pro 成功结果页", async ({
	page,
}, testInfo) => {
	await login(page);
	await page.getByRole("menuitem", { name: "结果页", exact: true }).click();
	await page.getByRole("menuitem", { name: "成功页", exact: true }).click();

	await expect(page).toHaveURL(/\/result\/success$/);
	await expect(page.getByText("提交成功", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("button", { name: "返回列表", exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "查看项目", exact: true }),
	).toBeVisible();
	await expect(
		page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth,
		),
	).resolves.toBe(true);
	await page.screenshot({
		fullPage: true,
		path: testInfo.outputPath("result-success-desktop.png"),
	});
});

test("窄屏抽屉导航可以打开 Ant Design Pro 404 页面", async ({
	page,
}, testInfo) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await login(page);
	await page.getByRole("button", { name: "打开菜单" }).click();
	await page.getByRole("menuitem", { name: "异常页", exact: true }).click();
	await page.getByRole("menuitem", { name: "404", exact: true }).click();

	await expect(page).toHaveURL(/\/exception\/404$/);
	await expect(
		page.getByText("抱歉，您访问的页面不存在。", { exact: true }),
	).toBeVisible();
	await expect(
		page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth,
		),
	).resolves.toBe(true);
	await page.screenshot({
		fullPage: true,
		path: testInfo.outputPath("exception-404-mobile.png"),
	});
});
