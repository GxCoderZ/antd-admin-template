import { expect, test, type Page } from "@playwright/test";

const tables: {
	path: string;
	apiPath: RegExp;
	id: string;
	column: string;
	legacyState: Record<string, unknown>;
	tab?: string;
}[] = [
	{
		path: "/organization/users",
		apiPath: /^\/api\/platform\/users$/,
		id: "admin-users-table-card",
		column: "用户名",
		legacyState: {
			table: { order: "desc", page: 1, pageSize: 20, sort: "created_at" },
		},
	},
	{
		path: "/access/roles",
		apiPath: /^\/api\/platform\/roles$/,
		id: "admin-roles-table-card",
		column: "角色标识",
		legacyState: {
			table: { order: "asc", page: 1, pageSize: 20, sort: "role_key" },
		},
	},
	{
		path: "/organization/positions",
		apiPath: /^\/api\/platform\/positions$/,
		id: "admin-positions-table-card",
		column: "岗位名称",
		legacyState: {
			table: { order: "desc", page: 1, pageSize: 20, sort: "updated_at" },
		},
	},
	{
		path: "/system/dictionaries",
		id: "admin-dictionaries-type-table",
		apiPath: /^\/api\/platform\/dictionaries\/types$/,
		column: "类型标识",
		tab: "字典类型",
		legacyState: {
			"type-table": { order: "asc", page: 1, pageSize: 10, sort: "code" },
		},
	},
	{
		path: "/system/dictionaries",
		id: "admin-dictionaries-item-table",
		apiPath: /^\/api\/platform\/dictionaries\/types\/[^/]+\/items$/,
		column: "排序",
		tab: "字典项",
		legacyState: {
			"item-table": { order: "asc", page: 1, pageSize: 10, sort: "sort" },
		},
	},
	{
		path: "/system/announcements",
		apiPath: /^\/api\/platform\/announcements$/,
		id: "admin-announcements-table-card",
		column: "更新时间",
		legacyState: {
			table: { order: "desc", page: 1, pageSize: 20, sort: "updated_at" },
		},
	},
	{
		path: "/operations/audit-logs",
		apiPath: /^\/api\/platform\/audit-logs$/,
		id: "audit-log-table-card",
		column: "发生时间",
		legacyState: { sort: "created_at", order: "desc" },
	},
	{
		path: "/operations/login-logs",
		apiPath: /^\/api\/platform\/login-logs$/,
		id: "login-log-table-card",
		column: "登录时间",
		legacyState: { sort: "created_at", order: "desc" },
	},
];

async function signIn(page: Page) {
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
}

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
		await signIn(page);
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
		await page.reload();
		const login = page.locator('input[autocomplete="username"]');
		await expect(panel.or(login)).toBeVisible();
		// Production preview recreates its in-memory Fake login on document reload.
		if (await login.isVisible()) await signIn(page);
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

		await header.click();
		await expect(header).toHaveAttribute("aria-sort", "ascending");
		await page
			.getByRole("button", { name: "更多标签操作", exact: true })
			.click();
		await page
			.getByRole("menuitem", { name: "关闭当前标签页", exact: true })
			.click();
		await expect(panel).toHaveCount(0);
		await openTable(page, table);
		await expect(sortedHeaders).toHaveCount(0);
		await expect(panel.locator("td.ant-table-column-sort")).toHaveCount(0);
	});

	test(`${table.id} does not restore legacy default sorting`, async ({
		page,
	}) => {
		await signIn(page);
		await page.evaluate(
			({ path, legacyState }) => {
				for (const [stateKey, state] of Object.entries(legacyState)) {
					sessionStorage.setItem(
						`react-antd-admin.route-session.${encodeURIComponent(path)}.${stateKey}`,
						JSON.stringify({ hasState: true, state, version: 1 }),
					);
				}
			},
			{ path: table.path, legacyState: table.legacyState },
		);
		// Production Fake requests resolve in the browser without a network event.
		const requests = await page.evaluateHandle(() => {
			const urls: string[] = [];
			const originalFetch = window.fetch.bind(window);
			window.fetch = (...args) => {
				const [input] = args;
				urls.push(input instanceof Request ? input.url : String(input));
				return originalFetch(...args);
			};
			return urls;
		});
		await openTable(page, table);
		const panel = page.getByTestId(table.id);
		await expect(panel.locator("thead th[aria-sort]")).toHaveCount(0);
		await expect(panel.locator("td.ant-table-column-sort")).toHaveCount(0);
		const tableRequests = (await requests.jsonValue())
			.map((url) => new URL(url, page.url()))
			.filter((url) => table.apiPath.test(url.pathname));
		await requests.dispose();
		expect(tableRequests.length).toBeGreaterThan(0);
		for (const url of tableRequests) {
			expect(url.searchParams.has("sort"), url.href).toBe(false);
			expect(url.searchParams.has("order"), url.href).toBe(false);
		}
	});
}

test("non-sortable tables do not select a default sort", async ({ page }) => {
	await signIn(page);
	for (const table of [
		{ path: "/organization/departments", id: "admin-departments-table-card" },
		{ path: "/system/about", id: "about-production-dependencies" },
	]) {
		await openRoute(page, table.path);
		const panel = page.getByTestId(table.id);
		await expect(panel.locator("tbody tr.ant-table-row").first()).toBeVisible();
		await expect(panel.locator("thead th[aria-sort]")).toHaveCount(0);
		await expect(panel.locator("td.ant-table-column-sort")).toHaveCount(0);
	}
});
