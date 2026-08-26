import { expect, test, type Page } from "@playwright/test";

async function navigateWithinAdmin(page: Page, path: string) {
	await page.evaluate((nextPath) => {
		window.history.pushState(null, "", nextPath);
		window.dispatchEvent(new PopStateEvent("popstate"));
	}, path);
}

test("ProTable 管理表格工具栏位于表格主体上方", async ({ page }) => {
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
		const proTable = card.querySelector(":scope > .ant-pro-table");
		const toolbar = proTable?.querySelector(".ant-pro-table-list-toolbar");
		const table = proTable?.querySelector(".ant-table-wrapper");
		if (!proTable || !toolbar || !table) {
			return null;
		}

		return {
			hasLegacyCardHead: Boolean(card.querySelector(":scope > .ant-card-head")),
			toolbarBeforeTable:
				toolbar.getBoundingClientRect().bottom <=
				table.getBoundingClientRect().top,
		};
	});

	expect(structure).toEqual({
		hasLegacyCardHead: false,
		toolbarBeforeTable: true,
	});
});
