import { expect, test, type Locator, type Page } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
}

async function expectFitsViewport(page: Page, surface: Locator) {
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= innerWidth,
		),
	).toBe(true);
	const box = await surface.boundingBox();
	const viewport = page.viewportSize();
	if (!box || !viewport) throw new Error("Missing visible surface or viewport");
	expect(box.x).toBeGreaterThanOrEqual(0);
	expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
	expect(box.y).toBeGreaterThanOrEqual(0);
	expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function finishVisualTransitions(page: Page) {
	await page.evaluate(async () => {
		// rc-motion activates enter animations across two animation frames.
		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
		);
		await Promise.allSettled(
			document
				.getAnimations()
				.filter(
					(animation) => animation.effect?.getTiming().iterations !== Infinity,
				)
				.map((animation) => animation.finished),
		);
	});
}

test("顶栏快捷入口和搜索历史跨页保留", async ({ page }) => {
	await signIn(page);
	const header = page.getByRole("banner");
	await header.getByRole("button", { name: "语言", exact: true }).hover();
	await page.getByRole("menuitem", { name: "English", exact: true }).click();
	await expect(page.locator("html")).toHaveAttribute("lang", "en");
	await header
		.getByRole("button", { name: "Switch to dark mode", exact: true })
		.click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await header
		.getByRole("button", { name: "Switch to light mode", exact: true })
		.click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
	await header.getByRole("button", { name: "Language", exact: true }).hover();
	await page.getByRole("menuitem", { name: "简体中文", exact: true }).click();
	await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");

	await page.keyboard.press("Control+k");
	const search = page.getByRole("dialog", { name: "导航搜索" });
	await expect(search).toBeVisible();
	await finishVisualTransitions(page);
	await search.getByRole("textbox").fill("用户管理");
	await search.getByRole("textbox").press("Enter");
	await expect(page).toHaveURL(/\/organization\/users$/);
	await expect(search).toBeHidden();
	await header.getByRole("button", { name: "搜索", exact: true }).click();
	await expect(search).toBeVisible();
	await finishVisualTransitions(page);
	await expect(
		search.getByRole("menuitem", { name: "用户管理", exact: true }),
	).toBeVisible();
	await search.getByRole("button", { name: "移除最近访问：用户管理" }).click();
	await expect(
		search.getByRole("menuitem", { name: "用户管理", exact: true }),
	).toHaveCount(0);
	await expect(search.getByText("暂无最近访问", { exact: true })).toBeVisible();
	await expect(page).toHaveURL(/\/organization\/users$/);
	await page.keyboard.press("Escape");
});

test("通知与搜索的响应式体验巡检", async ({ page }, testInfo) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (entry) => {
		if (entry.type() === "error") errors.push(entry.text());
	});
	page.on("response", (response) => {
		if (response.status() >= 400)
			errors.push(`${response.status()} ${response.url()}`);
	});
	page.on("requestfailed", (request) => {
		if (request.failure()?.errorText !== "net::ERR_ABORTED")
			errors.push(`${request.url()} ${request.failure()?.errorText}`);
	});
	const timings = {
		open: [] as number[],
		resize: [] as number[],
		interaction: [] as number[],
	};
	await page.setViewportSize({ width: 1440, height: 900 });
	await signIn(page);
	const header = page.getByRole("banner");
	const popover = page.getByTestId("notification-popover");
	let started = performance.now();
	await header.getByRole("button", { name: "通知", exact: true }).click();
	await popover.getByRole("button", { name: "查看全部消息" }).click();
	await expect(
		page.getByRole("heading", { name: "通知中心", exact: true }),
	).toBeVisible();
	timings.open.push(performance.now() - started);

	for (const width of [1440, 768, 390, 1440]) {
		started = performance.now();
		await page.setViewportSize({ width, height: 900 });
		await expect(
			header.getByRole("button", { name: "通知", exact: true }),
		).toBeVisible();
		await finishVisualTransitions(page);
		timings.resize.push(performance.now() - started);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
		if (width === 1440) {
			const scopeBox = await page.getByRole("radiogroup").boundingBox();
			const searchBox = await page
				.getByRole("searchbox", { name: "搜索通知" })
				.boundingBox();
			if (!scopeBox || !searchBox)
				throw new Error("Notification filters are missing");
			expect(
				Math.abs(
					scopeBox.y + scopeBox.height / 2 - searchBox.y - searchBox.height / 2,
				),
			).toBeLessThan(2);
		}
		await page.screenshot({
			path: testInfo.outputPath(`notifications-${width}.png`),
			animations: "disabled",
		});
		const firstRow = page.getByTestId(
			"notification-center-item-notification-1",
		);
		const titleBox = await firstRow
			.getByText("账号安全检查完成 1", { exact: true })
			.boundingBox();
		const summaryBox = await firstRow
			.getByText(/这是第 1 条站内通知/)
			.boundingBox();
		if (!titleBox || !summaryBox)
			throw new Error("Notification text is missing");
		expect(titleBox.width).toBeGreaterThan(100);
		expect(titleBox.y + titleBox.height).toBeLessThanOrEqual(summaryBox.y + 1);
		expect(
			await firstRow.evaluate((row) => row.scrollWidth <= row.clientWidth),
		).toBe(true);

		started = performance.now();
		await header.getByRole("button", { name: "搜索", exact: true }).click();
		const search = page.getByRole("dialog", { name: "导航搜索" });
		await expect(search.getByRole("textbox")).toBeFocused();
		await finishVisualTransitions(page);
		timings.interaction.push(performance.now() - started);
		await search.getByRole("textbox").fill("管理");
		await expect(
			search.getByRole("menuitem", { name: "用户管理", exact: true }),
		).toBeVisible();
		const { resultBox, labelBox } = await search
			.getByTestId("command-palette-result-title-/organization/users")
			.evaluate((label) => {
				const result = label.closest('[role="menuitem"]');
				if (!result) throw new Error("Search result is missing");
				const rowBounds = result.getBoundingClientRect();
				const labelBounds = label.getBoundingClientRect();
				return {
					resultBox: { y: rowBounds.y, height: rowBounds.height },
					labelBox: {
						y: labelBounds.y,
						height: labelBounds.height,
						width: labelBounds.width,
					},
				};
			});
		expect(labelBox.y).toBeGreaterThanOrEqual(resultBox.y - 1);
		expect(labelBox.y + labelBox.height).toBeLessThanOrEqual(
			resultBox.y + resultBox.height + 1,
		);
		expect(labelBox.width).toBeGreaterThan(40);
		await expectFitsViewport(page, search);
		await page.screenshot({
			path: testInfo.outputPath(`search-${width}.png`),
			animations: "disabled",
		});
		await page.keyboard.press("Escape");
		await expect(search).toBeHidden();

		started = performance.now();
		await header.getByRole("button", { name: "通知", exact: true }).click();
		await expect(popover).toBeVisible();
		await finishVisualTransitions(page);
		timings.interaction.push(performance.now() - started);
		await expectFitsViewport(page, popover);
		await page.getByTestId("notification-popover-list").evaluate((node) => {
			node.scrollTop = node.scrollHeight;
		});
		await expect(
			popover.getByRole("button", { name: "查看全部消息" }),
		).toBeInViewport();
		await finishVisualTransitions(page);
		await page.screenshot({
			path: testInfo.outputPath(`notification-popover-${width}.png`),
			animations: "disabled",
		});
		await header.getByRole("button", { name: "通知", exact: true }).click();
		await page.getByRole("tab", { name: "仪表盘", exact: true }).click();
		await header.getByRole("button", { name: "通知", exact: true }).click();
		started = performance.now();
		await popover.getByRole("button", { name: "查看全部消息" }).click();
		await expect(
			page.getByRole("heading", { name: "通知中心", exact: true }),
		).toBeVisible();
		timings.open.push(performance.now() - started);
	}

	await page.getByRole("searchbox", { name: "搜索通知" }).fill("安全检查");
	await page.getByRole("searchbox", { name: "搜索通知" }).press("Enter");
	await expect(
		page.getByTestId("notification-center-item-notification-1"),
	).toBeVisible();
	await page.getByRole("searchbox", { name: "搜索通知" }).fill("未提交草稿");
	await page.getByRole("tab", { name: "仪表盘", exact: true }).click();
	await page.getByRole("tab", { name: /通知中心/ }).click();
	await expect(page.getByRole("searchbox", { name: "搜索通知" })).toHaveValue(
		"未提交草稿",
	);
	await expect(
		page.getByTestId("notification-center-item-notification-1"),
	).toBeVisible();
	await page.getByRole("searchbox", { name: "搜索通知" }).fill("");
	await page.getByRole("searchbox", { name: "搜索通知" }).press("Enter");
	await header.getByRole("button", { name: "切换为深色模式" }).click();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await page.screenshot({
		path: testInfo.outputPath("notifications-dark.png"),
		animations: "disabled",
	});
	await header.getByRole("button", { name: "通知", exact: true }).click();
	await finishVisualTransitions(page);
	await page.screenshot({
		path: testInfo.outputPath("notification-popover-dark.png"),
		animations: "disabled",
	});
	await popover.getByRole("button", { name: /^清\s*空$/ }).click();
	const confirmation = page.getByRole("dialog", { name: "清空全部通知？" });
	await expect(confirmation.getByText(/不会删除公告/)).toBeVisible();
	await confirmation.getByRole("button", { name: "确认清空" }).click();
	await expect(confirmation).toBeHidden();
	await expect(page.locator("main").getByText("暂无站内通知")).toBeVisible();
	await header.getByRole("button", { name: "通知", exact: true }).click();
	await expect(
		popover.getByRole("button", { name: "全部已读" }),
	).toBeDisabled();
	await expect(
		popover.getByRole("button", { name: /^清\s*空$/ }),
	).toBeDisabled();

	const percentile = (values: number[], ratio: number) =>
		[...values].sort((a, b) => a - b)[Math.ceil(values.length * ratio) - 1];
	const report = Object.fromEntries(
		Object.entries(timings).map(([key, values]) => [
			key,
			{
				samples: values,
				p50: percentile(values, 0.5),
				p95: percentile(values, 0.95),
			},
		]),
	);
	await testInfo.attach("experience-metrics", {
		body: JSON.stringify(report, null, 2),
		contentType: "application/json",
	});
	expect(errors).toEqual([]);
	expect(Math.max(...timings.open)).toBeLessThan(5000);
	expect(report.open?.p50).toBeLessThan(1500);
	expect(report.open?.p95).toBeLessThan(3000);
	expect(Math.max(...timings.resize)).toBeLessThan(800);
	expect(report.resize?.p95).toBeLessThan(700);
	expect(Math.max(...timings.interaction)).toBeLessThan(1000);
	expect(report.interaction?.p95).toBeLessThan(800);
});
