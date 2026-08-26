import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/login");

	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();

	await expect(page).toHaveURL(/\/dashboard$/);
}

async function navigateWithinAdmin(page: Page, path: string) {
	await page.evaluate((nextPath) => {
		window.history.pushState(null, "", nextPath);
		window.dispatchEvent(new PopStateEvent("popstate"));
	}, path);
}

test("字典管理桌面端使用类型和字典项左右主从布局", async ({ page }) => {
	await page.setViewportSize({ height: 900, width: 1440 });
	await signIn(page);
	await navigateWithinAdmin(page, "/system/dictionaries");

	const typeWorkspace = page.getByTestId("admin-dictionaries-type-workspace");
	const itemWorkspace = page.getByTestId("admin-dictionaries-item-workspace");
	await expect(typeWorkspace.getByRole("table")).toBeVisible();
	await expect(itemWorkspace.getByRole("table")).toBeVisible();

	const typeBox = await typeWorkspace.boundingBox();
	const itemBox = await itemWorkspace.boundingBox();

	expect(typeBox).not.toBeNull();
	expect(itemBox).not.toBeNull();
	expect(itemBox!.x).toBeGreaterThan(typeBox!.x + typeBox!.width);
	expect(Math.abs(itemBox!.y - typeBox!.y)).toBeLessThan(4);
	await expect(
		page.evaluate(
			() => document.documentElement.scrollWidth > window.innerWidth,
		),
	).resolves.toBe(false);
});

test("字典管理窄屏保持上下布局", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);
	await navigateWithinAdmin(page, "/system/dictionaries");

	const typeWorkspace = page.getByTestId("admin-dictionaries-type-workspace");
	const itemWorkspace = page.getByTestId("admin-dictionaries-item-workspace");
	await expect(typeWorkspace.getByRole("table")).toBeVisible();

	await page.getByRole("button", { name: "管理字典项" }).first().click();
	await expect(page.getByRole("tab", { name: "字典项" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	await expect(itemWorkspace.getByRole("table")).toBeVisible();

	const itemBox = await itemWorkspace.boundingBox();

	expect(itemBox).not.toBeNull();
	expect(itemBox!.x).toBe(24);
	expect(itemBox!.y).toBeLessThan(220);
});
