import { expect, test, type Locator } from "@playwright/test";

test("双列菜单的一级图标对齐并在宽窄屏切换后恢复", async ({
	page,
}, testInfo) => {
	const errors: string[] = [];
	const timings = {
		open: [] as number[],
		resize: [] as number[],
		interaction: [] as number[],
	};
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (entry) => {
		if (entry.type() === "error") errors.push(entry.text());
	});
	page.on("requestfailed", (request) => {
		if (request.failure()?.errorText !== "net::ERR_ABORTED")
			errors.push(request.url());
	});
	page.on("response", (response) => {
		if (response.status() >= 400)
			errors.push(`${response.status()} ${response.url()}`);
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	let started = performance.now();
	await page.goto("/login");
	await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
	timings.open.push(performance.now() - started);
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	started = performance.now();
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
	await expect(page.getByRole("banner")).toBeVisible();
	timings.open.push(performance.now() - started);
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	started = performance.now();
	await page.getByRole("menuitem", { name: "角色管理", exact: true }).click();
	await expect(page.getByTestId("admin-roles-table-card")).toBeVisible();
	timings.open.push(performance.now() - started);
	const header = page.getByRole("banner");
	await header
		.getByRole("button", { name: "Platform Admin", exact: true })
		.click();
	await page.getByRole("menuitem", { name: "偏好设置", exact: true }).click();
	const preferences = page.getByRole("dialog", {
		name: "偏好设置",
		exact: true,
	});
	started = performance.now();
	await preferences
		.getByRole("radio", { name: "双列菜单", exact: true })
		.check();
	const grid = page.getByTestId("admin-shell-service-grid-menu");
	await expect(grid).toBeVisible();
	timings.interaction.push(performance.now() - started);
	await preferences.getByRole("button", { name: "关闭", exact: true }).click();
	await expect(preferences).toBeHidden();
	await grid.getByRole("menuitem", { name: "日志管理", exact: true }).click();
	await expect(
		grid.getByRole("menuitem", { name: "登录日志", exact: true }),
	).toBeVisible();
	await grid.evaluate(async (menu) => {
		await new Promise(requestAnimationFrame);
		await Promise.allSettled(
			menu
				.getAnimations({ subtree: true })
				.map((animation) => animation.finished),
		);
	});

	async function checkRootAlignment(menu: Locator) {
		const iconPositions: number[] = [];
		const labelPositions: number[] = [];
		for (const name of ["仪表盘", "系统管理", "关于系统"]) {
			const item = menu.getByRole("menuitem", { name, exact: true });
			const icon = item.locator('[role="img"]');
			await expect(icon).toBeVisible();
			const iconBox = await icon.boundingBox();
			const labelBox = await item
				.getByText(name, { exact: true })
				.boundingBox();
			if (!iconBox || !labelBox)
				throw new Error(`Missing navigation geometry: ${name}`);
			iconPositions.push(iconBox.x);
			labelPositions.push(labelBox.x);
			expect(iconBox.x + iconBox.width).toBeLessThanOrEqual(labelBox.x);
		}
		expect(new Set(iconPositions).size).toBe(1);
		expect(new Set(labelPositions).size).toBe(1);
		expect(iconPositions).toEqual([28, 28, 28]);
		expect(labelPositions).toEqual([52, 52, 52]);
		for (const name of [
			"用户管理",
			"角色管理",
			"部门管理",
			"岗位管理",
			"字典管理",
			"公告管理",
			"系统设置",
			"登录日志",
			"操作审计",
		]) {
			const item = menu.getByRole("menuitem", { name, exact: true });
			const itemBox = await item.boundingBox();
			const label = item.getByText(name, { exact: true });
			const labelBox = await label.boundingBox();
			if (!itemBox || !labelBox)
				throw new Error(`Missing submenu geometry: ${name}`);
			expect(labelBox.x - itemBox.x).toBe(24);
			expect(
				await label.evaluate((node) => node.scrollWidth <= node.clientWidth),
			).toBe(true);
		}
		const groupBox = await menu
			.getByText("日志管理", { exact: true })
			.boundingBox();
		expect(groupBox?.x).toBe(28);
	}

	await checkRootAlignment(grid);
	await page.screenshot({ path: testInfo.outputPath("two-column-1440.png") });
	started = performance.now();
	await grid.getByRole("menuitem", { name: "操作审计", exact: true }).click();
	await expect(page).toHaveURL(/\/operations\/audit-logs$/);
	timings.interaction.push(performance.now() - started);
	for (const width of [768, 390, 1440]) {
		started = performance.now();
		await page.setViewportSize({ width, height: 900 });
		if (width === 1440) {
			await expect(grid).toBeVisible();
		} else {
			await expect(grid).toHaveCount(0);
			await expect(
				header.getByRole("button", {
					name: width === 390 ? "打开菜单" : "展开菜单",
					exact: true,
				}),
			).toBeVisible();
		}
		timings.resize.push(performance.now() - started);
		started = performance.now();
		let menu: Locator;
		if (width === 390) {
			await header
				.getByRole("button", { name: "打开菜单", exact: true })
				.click();
			menu = page.getByRole("dialog");
			await expect(menu).toBeVisible();
			await expect(
				menu.getByRole("menuitem", { name: "系统管理", exact: true }),
			).toHaveAttribute("aria-expanded", "true");
			await expect(
				menu.getByRole("menuitem", { name: "日志管理", exact: true }),
			).toHaveAttribute("aria-expanded", "true");
		} else {
			if (width === 768)
				await header
					.getByRole("button", { name: "展开菜单", exact: true })
					.click();
			menu = page.locator("aside");
		}
		await expect(
			menu.getByRole("menuitem", { name: "操作审计", exact: true }),
		).toBeVisible();
		await menu
			.getByRole("menuitem", { name: "关于系统", exact: true })
			.click({ trial: true });
		timings.interaction.push(performance.now() - started);
		if (width === 1440) await checkRootAlignment(grid);
		for (const name of ["用户管理", "日志管理", "登录日志", "操作审计"]) {
			const icon = menu
				.getByRole("menuitem", { name, exact: true })
				.locator('[role="img"]');
			if (width === 1440) await expect(icon).toHaveCount(0);
			else await expect(icon).toBeVisible();
		}
		const geometry = await menu.getByRole("menuitem").evaluateAll((items) =>
			items
				.filter((item) => item.getClientRects().length > 0)
				.map((item) => {
					const box = item.getBoundingClientRect();
					return {
						left: box.left,
						right: box.right,
						top: box.top,
						bottom: box.bottom,
						unobstructed: item.contains(
							document.elementFromPoint(
								box.x + box.width / 2,
								box.y + box.height / 2,
							),
						),
					};
				}),
		);
		for (const box of geometry) {
			expect(box.left).toBeGreaterThanOrEqual(0);
			expect(box.right).toBeLessThanOrEqual(width);
			expect(box.bottom).toBeLessThanOrEqual(900);
			expect(box.unobstructed).toBe(true);
		}
		for (let index = 0; index < geometry.length; index += 1) {
			const box = geometry[index];
			if (!box) throw new Error("Missing menu item geometry");
			for (const other of geometry.slice(index + 1)) {
				expect(
					box.right <= other.left ||
						other.right <= box.left ||
						box.bottom <= other.top ||
						other.bottom <= box.top,
				).toBe(true);
			}
		}
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
		await page.screenshot({
			path: testInfo.outputPath(`two-column-restored-${width}.png`),
		});
		started = performance.now();
		await menu.getByRole("menuitem", { name: "操作审计", exact: true }).click();
		await expect(page).toHaveURL(/\/operations\/audit-logs$/);
		// Measure visibility each frame without locator assertion backoff.
		if (width === 390)
			await page.waitForFunction(() =>
				Array.from(document.querySelectorAll('[role="dialog"]')).every(
					(dialog) => !dialog.checkVisibility(),
				),
			);
		timings.interaction.push(performance.now() - started);
	}
	const percentile = (values: number[], ratio: number) =>
		[...values].sort((a, b) => a - b)[Math.ceil(values.length * ratio) - 1];
	const report = Object.fromEntries(
		Object.entries(timings).map(([name, samples]) => [
			name,
			{
				samples,
				p50: percentile(samples, 0.5),
				p95: percentile(samples, 0.95),
			},
		]),
	);
	console.log("two-column-navigation-timings", JSON.stringify(report));
	await testInfo.attach("two-column-navigation-metrics", {
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
