import { expect, test, type Page } from "@playwright/test";

const managementPages: {
	path: string;
	tableId: string;
	queryId?: string;
	tab?: string;
}[] = [
	{ path: "/organization/users", tableId: "admin-users-table-card" },
	{ path: "/access/roles", tableId: "admin-roles-table-card" },
	{
		path: "/organization/departments",
		tableId: "admin-departments-table-card",
		queryId: "admin-departments-query-form",
	},
	{
		path: "/organization/positions",
		tableId: "admin-positions-table-card",
		queryId: "admin-positions-query-form",
	},
	{
		path: "/system/dictionaries",
		tableId: "admin-dictionaries-type-table",
		queryId: "admin-dictionaries-type-query-form",
		tab: "字典类型",
	},
	{
		path: "/system/dictionaries",
		tableId: "admin-dictionaries-item-table",
		queryId: "admin-dictionaries-item-query-form",
		tab: "字典项",
	},
	{
		path: "/system/announcements",
		tableId: "admin-announcements-table-card",
		queryId: "admin-announcements-query-form",
	},
	{
		path: "/operations/audit-logs",
		tableId: "audit-log-table-card",
		queryId: "audit-log-query-form",
	},
	{
		path: "/operations/login-logs",
		tableId: "login-log-table-card",
		queryId: "login-log-query-form",
	},
];

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

for (const width of [1440, 390]) {
	test(`管理搜索栏和表格栏统一无外框并保留行分隔线（${width}px）`, async ({
		page,
	}) => {
		await page.setViewportSize({ height: 900, width });
		await page.goto("/login");
		await page.locator('input[autocomplete="username"]').fill("admin");
		await page.locator('input[autocomplete="current-password"]').fill("admin");
		await page.locator('button[type="submit"]').click();
		await expect(page).toHaveURL(/\/dashboard$/);

		for (const { path, tableId, queryId, tab } of managementPages) {
			await test.step(`${path}${tab ? ` / ${tab}` : ""}`, async () => {
				await navigateWithinAdmin(page, path);
				if (tab) {
					await page.getByRole("tab", { name: tab, exact: true }).click();
				}
				const tablePanel = page.getByTestId(tableId);
				const cells = tablePanel.getByRole("cell");
				await expect(cells.first()).toBeVisible();
				const querySurface = queryId
					? page.getByTestId(queryId)
					: tablePanel.locator(".ant-pro-table-search");
				const tableSurface = queryId
					? tablePanel
					: tablePanel
							.locator(".ant-pro-card")
							.filter({ has: page.getByRole("table") });

				for (const surface of [querySurface, tableSurface]) {
					await expect(surface).toBeVisible();
					for (const side of ["top", "right", "bottom", "left"]) {
						await expect(surface).toHaveCSS(`border-${side}-width`, "0px");
					}
					await expect(surface).toHaveCSS("box-shadow", "none");
				}

				const toolbar = tableSurface.locator(".ant-pro-table-list-toolbar");
				const toolbarLayout = await toolbar.evaluate((element) => {
					const settings = Array.from(
						element.querySelectorAll(
							".ant-pro-table-list-toolbar-setting-item",
						),
					).map((item) => item.getBoundingClientRect());
					const body = element.parentElement;
					if (!body) throw new Error("Missing table body");
					const style = getComputedStyle(body);
					return {
						padding: [
							style.paddingTop,
							style.paddingRight,
							style.paddingBottom,
							style.paddingLeft,
						],
						settingWidths: settings.map((item) => item.width),
						settingGaps: settings.slice(1).map((item, index) => {
							const previous = settings[index];
							if (!previous) throw new Error("Missing previous table setting");
							return item.x - previous.x;
						}),
					};
				});
				expect(toolbarLayout.padding).toEqual(["0px", "24px", "16px", "24px"]);
				expect(toolbarLayout.settingWidths.length).toBeGreaterThanOrEqual(3);
				expect(toolbarLayout.settingWidths).toEqual(
					toolbarLayout.settingWidths.map(() => 16),
				);
				expect(toolbarLayout.settingGaps).toEqual(
					toolbarLayout.settingGaps.map(() => 32),
				);
				if (width === 1440) {
					await expect(toolbar).toHaveCSS("height", "64px");
				}
				const pagination = tableSurface.locator(".ant-pagination");
				if (await pagination.count()) {
					await expect(pagination).toHaveCSS("margin-bottom", "0px");
				}

				const borders = await cells.evaluateAll((elements) =>
					elements.map((element) => {
						const style = getComputedStyle(element);
						return [
							style.borderLeftWidth,
							style.borderBottomWidth,
							style.borderRightWidth,
						];
					}),
				);
				for (const border of borders) {
					expect(border).toEqual(["0px", "1px", "0px"]);
				}
			});
		}
	});
}
