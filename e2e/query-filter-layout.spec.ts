import { expect, test, type Page } from "@playwright/test";

const queryPages = [
	{
		path: "/organization/departments",
		fields: 2,
		formId: "admin-departments-query-form",
	},
	{
		path: "/organization/positions",
		fields: 4,
		formId: "admin-positions-query-form",
	},
	{
		path: "/system/dictionaries",
		fields: 2,
		formId: "admin-dictionaries-type-query-form",
	},
	{
		path: "/system/announcements",
		fields: 2,
		formId: "admin-announcements-query-form",
	},
	{ path: "/operations/audit-logs", fields: 3, formId: "audit-log-query-form" },
	{ path: "/operations/login-logs", fields: 2, formId: "login-log-query-form" },
];

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

test("管理查询栏统一使用官方示例的 120px 标签宽度", async ({ page }) => {
	await page.setViewportSize({ height: 900, width: 1440 });
	await signIn(page);
	for (const { path, fields, formId } of queryPages) {
		await navigateWithinAdmin(page, path);
		const form = page.getByTestId(formId);
		await expect(form).toBeVisible();
		await expect
			.poll(() =>
				form
					.locator("label:visible")
					.evaluateAll((labels) =>
						labels
							.filter((label) => label.textContent?.trim())
							.map(
								(label) => label.parentElement?.getBoundingClientRect().width,
							),
					),
			)
			.toEqual(Array.from({ length: Math.min(fields, 2) }, () => 120));
	}
});

test("管理查询栏窄屏使用官方展开布局且内容不溢出", async ({ page }) => {
	await page.setViewportSize({ height: 900, width: 390 });
	await signIn(page);
	for (const { path, fields, formId } of queryPages) {
		await navigateWithinAdmin(page, path);
		const form = page.getByTestId(formId);
		await expect(form).toBeVisible();
		const visibleLabels = () =>
			form
				.locator("label:visible")
				.evaluateAll(
					(labels) =>
						labels.filter((label) => label.textContent?.trim()).length,
				);
		await expect.poll(visibleLabels).toBe(1);
		await form.getByText("展开", { exact: true }).click();
		await expect.poll(visibleLabels).toBe(fields);
		await expect(
			form.evaluate((element) => element.scrollWidth <= element.clientWidth),
		).resolves.toBe(true);
		await form.getByText("收起", { exact: true }).click();
		await expect.poll(visibleLabels).toBe(1);
	}
});
