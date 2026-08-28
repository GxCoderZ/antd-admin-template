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

test("用户和角色表格点击及连续重置保持内容位置", async ({ page }) => {
	await page.setViewportSize({ height: 900, width: 1440 });
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);

	for (const { path, tableId } of [
		{
			path: "/organization/users",
			tableId: "admin-users-table-card",
		},
		{
			path: "/access/roles",
			tableId: "admin-roles-table-card",
		},
	]) {
		await navigateWithinAdmin(page, path);
		const panel = page.getByTestId(tableId);
		await expect(panel.locator("tbody tr[data-row-key]").first()).toBeVisible();
		await expect(panel.locator(".ant-spin-spinning")).toHaveCount(0);
		const surface = panel
			.locator(".ant-pro-card")
			.filter({ has: page.getByRole("table") });
		const scroll = page.locator(".admin-shell-scroll-content");
		const initialBox = await surface.boundingBox();
		await surface.click({ position: { x: 8, y: 8 } });
		expect(await surface.boundingBox()).toEqual(initialBox);
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await panel.getByRole("textbox").first().fill("未提交条件");
			const reset = panel.getByRole("button", { name: /^重\s*置$/ });
			// Capture after Playwright's preparatory scrolling, at the actual pointer event.
			const clickStart = reset.evaluate(
				(button) =>
					new Promise<{
						box: { x: number; y: number; width: number; height: number };
						scrollTop: number;
					}>((resolve, reject) => {
						const container = button.closest(".admin-shell-scroll-content");
						const card = container
							?.querySelector(".ant-table")
							?.closest(".ant-pro-card");
						if (!container || !card) {
							reject(new Error("Missing table scroll container"));
							return;
						}
						button.addEventListener(
							"pointerdown",
							() => {
								const { x, y, width, height } = card.getBoundingClientRect();
								resolve({
									box: { x, y, width, height },
									scrollTop: container.scrollTop,
								});
							},
							{ once: true },
						);
					}),
			);
			await reset.click();
			const beforeClick = await clickStart;
			if (attempt === 0) {
				await expect(panel.locator(".ant-spin-spinning")).toHaveCount(1);
				await expect(panel.locator(".ant-spin-spinning")).toHaveCount(0);
			} else {
				expect(await panel.locator(".ant-spin-spinning").count()).toBe(0);
			}
			expect(await scroll.evaluate((element) => element.scrollTop)).toBe(
				beforeClick.scrollTop,
			);
			expect(await surface.boundingBox()).toEqual(beforeClick.box);
		}
	}
});
