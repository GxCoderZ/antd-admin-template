import { expect, test, type Page } from "@playwright/test";

async function navigateWithinAdmin(page: Page, path: string) {
	await page.evaluate((nextPath) => {
		window.history.pushState(null, "", nextPath);
		window.dispatchEvent(new PopStateEvent("popstate"));
	}, path);
}

test("ProTable 管理表格使用官方内容间距", async ({ page }) => {
	await page.setViewportSize({ height: 900, width: 1440 });
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);

	await navigateWithinAdmin(page, "/organization/users");
	await expect(page).toHaveURL(/\/organization\/users$/);
	const tableCard = page.getByTestId("admin-users-table-card");
	await expect(tableCard.getByRole("table")).toBeVisible();
	const bodyPadding = await tableCard
		.locator(".ant-pro-card-body")
		.last()
		.evaluate((body) => {
			const style = getComputedStyle(body);
			return [
				style.paddingTop,
				style.paddingRight,
				style.paddingBottom,
				style.paddingLeft,
			];
		});

	expect(bodyPadding).toEqual(["0px", "24px", "16px", "24px"]);
});
