import { expect, test, type Page } from "@playwright/test";

const tables = [
	{
		path: "/organization/users",
		id: "admin-users-table-card",
		column: "用户名",
	},
	{
		path: "/access/roles",
		id: "admin-roles-table-card",
		column: "角色标识",
	},
	{
		path: "/organization/positions",
		id: "admin-positions-table-card",
		column: "岗位名称",
	},
	{
		path: "/system/dictionaries",
		id: "admin-dictionaries-type-table",
		column: "类型标识",
		tab: "字典类型",
	},
	{
		path: "/system/dictionaries",
		id: "admin-dictionaries-item-table",
		column: "排序",
		tab: "字典项",
	},
	{
		path: "/system/announcements",
		id: "admin-announcements-table-card",
		column: "更新时间",
	},
	{
		path: "/operations/audit-logs",
		id: "audit-log-table-card",
		column: "发生时间",
	},
	{
		path: "/operations/login-logs",
		id: "login-log-table-card",
		column: "登录时间",
	},
];

async function openRoute(page: Page, path: string) {
	await page.evaluate((nextPath) => {
		history.pushState(null, "", nextPath);
		dispatchEvent(new PopStateEvent("popstate"));
	}, path);
	await expect(page).toHaveURL(new RegExp(`${path}$`));
}

async function openTable(page: Page, table: (typeof tables)[number]) {
	await openRoute(page, table.path);
	if (table.tab) {
		await page.getByRole("tab", { name: table.tab, exact: true }).click();
	}
	const panel = page.getByTestId(table.id);
	await expect(panel.locator("tbody tr.ant-table-row").first()).toBeVisible();
	await expect(panel.locator(".ant-spin-spinning")).toHaveCount(0);
}

for (const table of tables) {
	test(`${table.id} sorts only on request, restores across routes and clears on reset`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto("/login");
		await page.locator('input[autocomplete="username"]').fill("admin");
		await page.locator('input[autocomplete="current-password"]').fill("admin");
		await page.locator('button[type="submit"]').click();
		await expect(page).toHaveURL(/\/dashboard$/);
		await openTable(page, table);

		const panel = page.getByTestId(table.id);
		const sortedHeaders = panel.locator("thead th[aria-sort]");
		const header = panel.getByRole("columnheader", {
			name: table.column,
			exact: true,
		});
		await expect(sortedHeaders).toHaveCount(0);
		await header.click();
		await expect(header).toHaveAttribute("aria-sort", "ascending");
		await header.click();
		await expect(header).toHaveAttribute("aria-sort", "descending");
		await header.click();
		await expect(sortedHeaders).toHaveCount(0);

		await header.click();
		await expect(header).toHaveAttribute("aria-sort", "ascending");
		await openRoute(page, "/dashboard");
		await expect(panel).toHaveCount(0);
		await openTable(page, table);
		await expect(header).toHaveAttribute("aria-sort", "ascending");

		await page.getByRole("button", { name: /^查\s*询$/ }).click();
		await expect(panel.locator(".ant-spin-spinning")).toHaveCount(0);
		await expect(header).toHaveAttribute("aria-sort", "ascending");
		await page.getByRole("button", { name: /^重\s*置$/ }).click();
		await expect(sortedHeaders).toHaveCount(0);
		await openRoute(page, "/dashboard");
		await expect(panel).toHaveCount(0);
		await openTable(page, table);
		await expect(sortedHeaders).toHaveCount(0);
	});
}
