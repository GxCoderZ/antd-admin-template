import { expect, test, type Page } from "@playwright/test";

const tables = [
	{
		path: "/organization/users",
		id: "admin-users-table-card",
		defaults: [
			"用户名",
			"显示名称",
			"部门",
			"角色",
			"状态",
			"最近登录",
			"操作",
		],
	},
	{
		path: "/access/roles",
		id: "admin-roles-table-card",
		defaults: [
			"角色名称",
			"角色标识",
			"成员数",
			"角色类型",
			"更新时间",
			"操作",
		],
	},
	{
		path: "/organization/departments",
		id: "admin-departments-table-card",
		defaults: ["部门名称", "部门标识", "状态", "成员数", "岗位数", "操作"],
	},
	{
		path: "/organization/positions",
		id: "admin-positions-table-card",
		defaults: ["岗位名称", "岗位标识", "所属部门", "状态", "成员数", "操作"],
	},
	{
		path: "/system/dictionaries",
		id: "admin-dictionaries-type-table",
		tab: "字典类型",
		defaults: ["类型名称", "类型标识", "状态", "字典项数", "操作"],
	},
	{
		path: "/system/dictionaries",
		id: "admin-dictionaries-item-table",
		tab: "字典项",
		defaults: ["显示标签", "字典值", "排序", "状态", "操作"],
	},
	{
		path: "/system/announcements",
		id: "admin-announcements-table-card",
		defaults: ["", "公告标题", "发布状态", "更新时间", "操作"],
		minimumHeaders: ["", "公告标题", "操作"],
		recommended: "发布状态",
		required: ["公告标题", "操作"],
	},
	{
		path: "/operations/audit-logs",
		id: "audit-log-table-card",
		defaults: ["操作人", "动作", "目标", "结果", "IP 地址", "发生时间", "操作"],
	},
	{
		path: "/operations/login-logs",
		id: "login-log-table-card",
		defaults: ["登录标识", "结果", "设备", "IP 地址", "登录时间", "操作"],
	},
];

async function signIn(page: Page) {
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
}

async function openTable(page: Page, table: (typeof tables)[number]) {
	await page.evaluate((path) => {
		history.pushState(null, "", path);
		dispatchEvent(new PopStateEvent("popstate"));
	}, table.path);
	if (table.tab)
		await page.getByRole("tab", { name: table.tab, exact: true }).click();
}

async function reloadTable(page: Page, table: (typeof tables)[number]) {
	await page.reload();
	const loginInput = page.locator('input[autocomplete="username"]');
	await expect(page.getByTestId(table.id).or(loginInput)).toBeVisible();
	// Production preview recreates its in-memory Fake login on document reload.
	if (await loginInput.isVisible()) {
		await signIn(page);
		await openTable(page, table);
	}
}

for (const table of tables) {
	test(`${table.id} uses recommended columns, optional settings and persistent reset`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto("/login");
		await signIn(page);
		await openTable(page, table);
		const panel = page.getByTestId(table.id);
		const headers = panel.getByRole("columnheader");
		await expect(headers).toHaveText(table.defaults);
		const settingsTrigger = panel.getByRole("img", {
			name: "setting",
			exact: true,
		});
		await settingsTrigger.click();
		const settings = page.locator(".ant-popover:visible");
		const requiredLabels = table.required ?? [table.defaults[0]!, "操作"];
		for (const label of requiredLabels) {
			await expect(
				settings.getByRole("checkbox", {
					name: new RegExp(`^(holder )?${label}$`),
				}),
			).toHaveCount(0);
		}
		const selectAll = settings.getByRole("checkbox").first();
		await selectAll.check();
		await selectAll.uncheck();
		await expect(headers).toHaveText(table.minimumHeaders ?? requiredLabels);
		await settings.getByText("重置", { exact: true }).click();
		await expect(headers).toHaveText(table.defaults);
		const recommended = table.recommended ?? table.defaults[1]!;
		await settings
			.getByRole("checkbox", { name: new RegExp(`^(holder )?${recommended}$`) })
			.click();
		const customized = table.defaults.filter((label) => label !== recommended);
		await expect(headers).toHaveText(customized);
		await settingsTrigger.click();
		await page.setViewportSize({ width: 390, height: 844 });
		await expect(headers).toHaveText(customized);
		await reloadTable(page, table);
		await expect(headers).toHaveText(customized);
		await expect
			.poll(() =>
				page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
			)
			.toBe(true);
		await settingsTrigger.click();
		const tree = settings.getByRole("tree");
		await tree.hover();
		await page.mouse.wheel(0, 900);
		const lastChoice = tree.getByRole("checkbox").last();
		await expect(settings).toBeVisible();
		expect(
			await settings.evaluate(
				(element) => element.getBoundingClientRect().height,
			),
		).toBeLessThanOrEqual(400);
		await lastChoice.scrollIntoViewIfNeeded();
		await expect(lastChoice).toBeInViewport();
		await settings.getByText("重置", { exact: true }).click();
		await expect(headers).toHaveText(table.defaults);
		await settingsTrigger.click();
		await reloadTable(page, table);
		await expect(headers).toHaveText(table.defaults);
	});
}
