import { expect, test, type Page } from "@playwright/test";

async function navigate(page: Page, path: string) {
	await page.mouse.move(0, 0);
	await page.evaluate((nextPath) => {
		window.history.pushState(null, "", nextPath);
		window.dispatchEvent(new PopStateEvent("popstate"));
	}, path);
}

for (const width of [1440, 390]) {
	test(`用户部门与部门管理保持一致 ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto("/login");
		await page.locator('input[autocomplete="username"]').fill("admin");
		await page.locator('input[autocomplete="current-password"]').fill("admin");
		await page.locator('button[type="submit"]').click();
		await expect(page).toHaveURL(/\/dashboard$/);
		await navigate(page, "/organization/departments");
		await page.getByRole("button", { name: "新建部门", exact: true }).click();
		let drawer = page.getByRole("dialog");
		await drawer.getByPlaceholder("请输入部门名称").fill("测试关联部门");
		await drawer.getByPlaceholder("请输入部门标识").fill("membership-test");
		await drawer.getByRole("button", { name: /保\s*存/ }).click();
		await expect(drawer).toBeHidden();
		await navigate(page, "/organization/users");
		await page.getByRole("button", { name: "新建用户", exact: true }).click();
		drawer = page.getByRole("dialog");
		await drawer.getByLabel("用户名", { exact: true }).fill("membership-test");
		await drawer.getByLabel("显示名称").fill("Membership Test");
		await drawer.getByLabel("邮箱").fill("membership@example.com");
		await drawer.getByLabel("初始密码").fill("fake-password-only");
		await drawer.getByRole("combobox", { name: "部门" }).click();
		await page.getByText("测试关联部门", { exact: true }).last().click();
		await expect(drawer).toBeInViewport({ ratio: 1 });
		await page.screenshot({
			path: `test-results/user-department-create-${width}.png`,
			animations: "disabled",
		});
		await drawer.getByRole("button", { name: "新建用户", exact: true }).click();
		await expect(drawer).toBeHidden();
		await navigate(page, "/organization/departments");
		const row = page.getByRole("row").filter({ hasText: "membership-test" });
		await expect(
			row.getByRole("cell", { name: "1", exact: true }),
		).toBeVisible();
		await row.getByRole("button", { name: "编辑", exact: true }).click();
		drawer = page.getByRole("dialog");
		await drawer.getByPlaceholder("请输入部门名称").fill("已更名的关联部门");
		await drawer.getByRole("button", { name: /保\s*存/ }).click();
		await expect(drawer).toBeHidden();
		await navigate(page, "/organization/users");
		await page
			.getByPlaceholder("搜索用户名、显示名称、邮箱或手机号")
			.fill("membership-test");
		await page.getByRole("button", { name: /查\s*询/ }).click();
		const userRow = page
			.getByRole("row")
			.filter({ hasText: "membership-test" });
		await expect(
			userRow.getByText("已更名的关联部门", { exact: true }),
		).toBeAttached();
		await userRow.getByRole("button", { name: "编辑", exact: true }).click();
		drawer = page.getByRole("dialog");
		await expect(drawer).toBeInViewport({ ratio: 1 });
		await expect(
			drawer.getByText("已更名的关联部门", { exact: true }),
		).toBeVisible();
		await page.screenshot({
			path: `test-results/user-department-edit-${width}.png`,
			animations: "disabled",
		});
	});
}
