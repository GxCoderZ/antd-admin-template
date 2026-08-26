import { expect, test, type Page } from "@playwright/test";

async function navigateWithinAdmin(page: Page, path: string) {
	await page.evaluate((nextPath) => {
		window.history.pushState(null, "", nextPath);
		window.dispatchEvent(new PopStateEvent("popstate"));
	}, path);
}

test("管理表格工具栏位于 Card 正文顶部", async ({ page }) => {
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
	const structure = await tableCard.evaluate((card) => {
		const body = card.querySelector(":scope > .ant-card-body");
		const toolbar = body?.querySelector(":scope > .ant-pro-table-list-toolbar");
		if (!body || !toolbar) {
			return null;
		}

		return {
			hasCardHead: Boolean(card.querySelector(":scope > .ant-card-head")),
			toolbarTopInset:
				toolbar.getBoundingClientRect().top - body.getBoundingClientRect().top,
		};
	});

	expect(structure).toEqual({ hasCardHead: false, toolbarTopInset: 0 });
});
