import { expect, test, type Page } from "@playwright/test";

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

test("字典管理标准桌面端不把查询栏压到折叠布局", async ({ page }) => {
	await page.setViewportSize({ height: 900, width: 1440 });
	await signIn(page);
	await navigateWithinAdmin(page, "/system/dictionaries");

	const typeWorkspace = page.getByTestId("admin-dictionaries-type-workspace");
	await expect(typeWorkspace.getByRole("table")).toBeVisible();
	await expect(
		typeWorkspace.getByRole("combobox", { name: "状态" }),
	).toBeVisible();
	await expect(page.getByRole("tab", { name: "字典类型" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	await expect(page.getByRole("tab", { name: "字典项" })).toBeVisible();

	const typeBox = await typeWorkspace.boundingBox();

	expect(typeBox).not.toBeNull();
	expect(typeBox!.width).toBeGreaterThan(760);
	await expect(
		page.evaluate(
			() => document.documentElement.scrollWidth > window.innerWidth,
		),
	).resolves.toBe(false);
});

test("字典管理宽屏端仍使用标签布局", async ({ page }) => {
	await page.setViewportSize({ height: 900, width: 2048 });
	await signIn(page);
	await navigateWithinAdmin(page, "/system/dictionaries");

	const typeWorkspace = page.getByTestId("admin-dictionaries-type-workspace");
	const itemWorkspace = page.getByTestId("admin-dictionaries-item-workspace");
	await expect(typeWorkspace.getByRole("table")).toBeVisible();
	await expect(itemWorkspace).not.toBeVisible();
	await expect(
		typeWorkspace.getByRole("combobox", { name: "状态" }),
	).toBeVisible();
	await expect(page.getByRole("tab", { name: "字典类型" })).toHaveAttribute(
		"aria-selected",
		"true",
	);

	const typeBox = await typeWorkspace.boundingBox();

	expect(typeBox).not.toBeNull();
	expect(typeBox!.width).toBeGreaterThan(1600);

	await typeWorkspace
		.getByRole("row")
		.filter({ hasText: "审批结果" })
		.getByRole("button", { name: "管理字典项" })
		.click();
	await expect(page.getByRole("tab", { name: "字典项" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	await expect(itemWorkspace.getByRole("table")).toBeVisible();
	await expect(typeWorkspace).not.toBeVisible();
	await expect(
		itemWorkspace.getByText("审批结果", { exact: true }),
	).toBeVisible();
	await expect(itemWorkspace).not.toContainText("当前类型：");
	const itemBox = await itemWorkspace.boundingBox();

	expect(itemBox).not.toBeNull();
	expect(itemBox!.width).toBeGreaterThan(1600);
	await expect(
		page.evaluate(
			() => document.documentElement.scrollWidth > window.innerWidth,
		),
	).resolves.toBe(false);
});

test("字典管理窄屏保持标签布局", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);
	await navigateWithinAdmin(page, "/system/dictionaries");

	const typeWorkspace = page.getByTestId("admin-dictionaries-type-workspace");
	const itemWorkspace = page.getByTestId("admin-dictionaries-item-workspace");
	await expect(typeWorkspace.getByRole("table")).toBeVisible();

	await page.getByRole("button", { name: "管理字典项" }).first().click();
	await expect(page.getByRole("tab", { name: "字典项" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	await expect(itemWorkspace.getByRole("table")).toBeVisible();

	const itemBox = await itemWorkspace.boundingBox();

	expect(itemBox).not.toBeNull();
	expect(itemBox!.x).toBe(24);
	expect(itemBox!.y).toBeLessThan(220);
});

for (const width of [1440, 390]) {
	test(`字典标签切换后表格位置保持稳定（${width}px）`, async ({ page }) => {
		await page.setViewportSize({ height: 900, width });
		await signIn(page);
		await navigateWithinAdmin(page, "/system/dictionaries");
		await expect(
			page.getByRole("button", { name: "管理字典项" }).first(),
		).toBeVisible();

		for (const [name, kind] of [
			["字典项", "item"],
			["字典类型", "type"],
			["字典项", "item"],
		] as const) {
			const positionsPromise = page.evaluate(async (tableKind) => {
				const positions: number[] = [];
				for (let frame = 0; frame < 30; frame += 1) {
					await new Promise(requestAnimationFrame);
					const card = document.querySelector(
						`[data-testid="admin-dictionaries-${tableKind}-table"]`,
					);
					const table = card?.querySelector("table");
					if (card && table && table.getClientRects().length > 0) {
						positions.push(
							Math.round(
								table.getBoundingClientRect().top -
									card.getBoundingClientRect().top,
							),
						);
					}
				}
				return positions;
			}, kind);
			await page.getByRole("tab", { name, exact: true }).click();
			const positions = await positionsPromise;
			expect(positions.length).toBeGreaterThan(1);
			expect(new Set(positions).size).toBe(1);
		}
	});
}

test("字典标签切换后恢复各自查询草稿与列设置", async ({ page }) => {
	await page.setViewportSize({ height: 900, width: 1440 });
	await signIn(page);
	await navigateWithinAdmin(page, "/system/dictionaries");
	const typeWorkspace = page.getByTestId("admin-dictionaries-type-workspace");
	const itemWorkspace = page.getByTestId("admin-dictionaries-item-workspace");
	await expect(
		typeWorkspace.getByRole("button", { name: "管理字典项" }).first(),
	).toBeVisible();
	await typeWorkspace.getByRole("textbox").fill("类型草稿");
	await typeWorkspace.getByRole("button", { name: "列设置" }).click();
	await page.getByRole("checkbox", { name: "类型标识" }).uncheck();
	await page.getByRole("tab", { name: "字典项", exact: true }).click();
	await itemWorkspace.getByRole("textbox").fill("项目草稿");
	await expect(
		itemWorkspace.getByRole("columnheader", { name: "字典值" }),
	).toBeVisible();

	await page.getByRole("tab", { name: "字典类型", exact: true }).click();
	await expect(typeWorkspace.getByRole("textbox")).toHaveValue("类型草稿");
	await expect(
		typeWorkspace.getByRole("columnheader", { name: "类型标识" }),
	).toHaveCount(0);
	await page.getByRole("tab", { name: "字典项", exact: true }).click();
	await expect(itemWorkspace.getByRole("textbox")).toHaveValue("项目草稿");
});
