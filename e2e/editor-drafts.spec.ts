import { expect, test, type Page } from "@playwright/test";

const editors: {
	path: string;
	button: string;
	placeholder: string;
	tab?: string;
}[] = [
	{
		path: "/organization/users",
		button: "新建用户",
		placeholder: "请输入显示名称",
	},
	{ path: "/organization/users", button: "编辑", placeholder: "" },
	{
		path: "/organization/departments",
		button: "新建部门",
		placeholder: "请输入部门名称",
	},
	{
		path: "/organization/positions",
		button: "新建岗位",
		placeholder: "请输入岗位名称",
	},
	{
		path: "/system/announcements",
		button: "新建公告",
		placeholder: "请输入公告标题",
	},
	{
		path: "/system/dictionaries",
		button: "新建类型",
		placeholder: "请输入类型名称",
	},
	{
		path: "/system/dictionaries",
		button: "新建字典项",
		placeholder: "请输入显示标签",
		tab: "字典项",
	},
	{ path: "/access/roles", button: "新建角色", placeholder: "请输入角色名称" },
];

async function navigate(page: Page, path: string) {
	await page.mouse.move(0, 0);
	await page.evaluate((nextPath) => {
		window.history.pushState(null, "", nextPath);
		window.dispatchEvent(new PopStateEvent("popstate"));
	}, path);
}

for (const width of [1440, 390]) {
	test(`跨管理页退出编辑草稿 ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 720 });
		await page.goto("/login");
		await page.locator('input[autocomplete="username"]').fill("admin");
		await page.locator('input[autocomplete="current-password"]').fill("admin");
		await page.locator('button[type="submit"]').click();
		await expect(page).toHaveURL(/\/dashboard$/);
		for (const editor of editors) {
			await navigate(page, editor.path);
			if (editor.tab)
				await page.getByRole("tab", { name: editor.tab, exact: true }).click();
			const open = page
				.getByRole("button", {
					name: editor.button,
					exact: true,
				})
				.first();
			await open.click();
			const dialog = page.getByRole("dialog");
			const field = editor.placeholder
				? dialog.getByPlaceholder(editor.placeholder)
				: dialog.getByLabel("显示名称");
			const initialValue = await field.inputValue();
			if (editor.button !== "新建角色") {
				await expect(dialog).toBeInViewport({ ratio: 1 });
				const save = dialog.getByRole("button", {
					name: /^(保\s*存|新建用户)$/,
				});
				const buttonBox = await save.boundingBox();
				const drawerBox = await dialog.boundingBox();
				if (!buttonBox || !drawerBox)
					throw new Error("Missing editor geometry");
				expect(buttonBox.y).toBeGreaterThan(650);
				if (width === 390) expect(drawerBox.width).toBe(390);
				await dialog.locator(".ant-drawer-body").evaluate((body) => {
					body.scrollTop = body.scrollHeight;
				});
				await expect(save).toBeInViewport();
				expect(await save.boundingBox()).toEqual(buttonBox);
				await page.screenshot({
					path: `test-results/editor-${editor.button}-${width}.png`,
					animations: "disabled",
				});
			}
			await dialog.getByRole("button", { name: /取\s*消/ }).click();
			await expect(dialog).toBeHidden();
			await open.click();
			await field.fill("Unsaved draft");
			await page.keyboard.press("Escape");
			const confirmation = page.getByRole("dialog", {
				name: "放弃未保存的更改？",
			});
			await expect(confirmation).toBeVisible();
			if (editor.path === "/organization/users") {
				await expect(confirmation).toBeInViewport({ ratio: 1 });
				await expect(confirmation).toHaveCSS("opacity", "1");
				await expect(confirmation).toHaveCSS("transform", "none");
				await page.screenshot({
					path: `test-results/discard-confirmation-${width}.png`,
					animations: "disabled",
				});
			}
			await confirmation.getByRole("button", { name: "继续编辑" }).click();
			await expect(confirmation).toBeHidden();
			await expect(field).toHaveValue("Unsaved draft");
			await dialog.getByRole("button", { name: /取\s*消/ }).click();
			await confirmation.getByRole("button", { name: "放弃更改" }).click();
			await expect(dialog).toHaveCount(0);
			await open.click();
			await expect(field).toHaveValue(initialValue);
			await dialog.getByRole("button", { name: /取\s*消/ }).click();
			await expect(dialog).toHaveCount(0);
		}
	});
}
