import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
}

async function nextPaint(page: Page) {
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
	);
}

async function finishVisualTransitions(page: Page) {
	await nextPaint(page);
	await page.evaluate(async () => {
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

test("rapid theme toggles stay responsive across routes and viewport sizes", async ({
	page,
}, testInfo) => {
	test.setTimeout(60_000);
	const errors: string[] = [];
	page.on("crash", () => errors.push("Page crashed"));
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
	const toggle = header.getByRole("button", { name: /切换为(深|浅)色模式/ });
	await header.getByRole("button", { name: "搜索", exact: true }).click();
	const search = page.getByRole("dialog", { name: "导航搜索" });
	await search.getByRole("textbox").fill("用户管理");
	let started = performance.now();
	await search.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	const users = page.getByTestId("admin-users-table-card");
	await expect(users.getByRole("cell").first()).toBeVisible();
	timings.open.push(performance.now() - started);
	const lightTextColor = await users
		.getByRole("cell")
		.first()
		.evaluate((cell) => getComputedStyle(cell).color);
	const form = page.getByTestId("admin-users-query-form");
	await form.getByRole("textbox").fill("unsent filter");
	let dark = false;

	for (const [index, width] of [1440, 768, 390, 1440].entries()) {
		started = performance.now();
		await page.setViewportSize({ width, height: 900 });
		await expect(toggle).toBeInViewport();
		await nextPaint(page);
		timings.resize.push(performance.now() - started);
		for (let click = 0; click < 21; click += 1) {
			started = performance.now();
			await toggle.click();
			await nextPaint(page);
			dark = !dark;
			const state = await page.evaluate(() => ({
				theme: document.documentElement.dataset.theme,
				preference: localStorage.getItem(
					"react-antd-admin.preference.theme-mode",
				),
				pageTransitions: document
					.getAnimations()
					.filter(
						(animation) =>
							animation.effect instanceof KeyframeEffect &&
							animation.effect.pseudoElement?.startsWith("::view-transition"),
					).length,
			}));
			timings.interaction.push(performance.now() - started);
			expect(state).toEqual({
				theme: dark ? "dark" : "light",
				preference: dark ? "dark" : "light",
				pageTransitions: 0,
			});
		}
		await expect(toggle).toHaveAccessibleName(
			dark ? "切换为浅色模式" : "切换为深色模式",
		);
		const textColor = await users
			.getByRole("cell")
			.first()
			.evaluate((cell) => getComputedStyle(cell).color);
		if (dark) expect(textColor).not.toBe(lightTextColor);
		else expect(textColor).toBe(lightTextColor);
		await expect(form.getByRole("textbox")).toHaveValue("unsent filter");
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
		const controls = await header.getByRole("button").evaluateAll((buttons) =>
			buttons
				.filter((button) => button.getBoundingClientRect().width > 0)
				.map((button) => {
					const rect = button.getBoundingClientRect();
					return {
						left: rect.left,
						right: rect.right,
						top: rect.top,
						bottom: rect.bottom,
						hit: button.contains(
							document.elementFromPoint(
								rect.x + rect.width / 2,
								rect.y + rect.height / 2,
							),
						),
					};
				}),
		);
		for (const [controlIndex, control] of controls.entries()) {
			expect(control.left).toBeGreaterThanOrEqual(0);
			expect(control.right).toBeLessThanOrEqual(width);
			expect(control.hit).toBe(true);
			const previous = controls[controlIndex - 1];
			if (
				previous &&
				previous.top < control.bottom &&
				control.top < previous.bottom
			)
				expect(previous.right).toBeLessThanOrEqual(control.left + 1);
		}
		await page.mouse.move(width / 2, 400);
		await finishVisualTransitions(page);
		await page.screenshot({
			path: testInfo.outputPath(
				`theme-${index}-${width}-${dark ? "dark" : "light"}.png`,
			),
		});
		started = performance.now();
		await page.getByRole("tab", { name: "仪表盘", exact: true }).click();
		await expect(page.getByTestId("dashboard-stat-users")).toBeVisible();
		timings.open.push(performance.now() - started);
		await toggle.click();
		dark = !dark;
		started = performance.now();
		await page.getByRole("tab", { name: /用户管理/ }).click();
		await expect(users.getByRole("cell").first()).toBeVisible();
		timings.open.push(performance.now() - started);
		await expect(page.locator("html")).toHaveAttribute(
			"data-theme",
			dark ? "dark" : "light",
		);
		await expect(form.getByRole("textbox")).toHaveValue("unsent filter");
		await page.mouse.move(width / 2, 400);
		await finishVisualTransitions(page);
		await page.screenshot({
			path: testInfo.outputPath(
				`theme-restored-${index}-${width}-${dark ? "dark" : "light"}.png`,
			),
		});
	}

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
	await testInfo.attach("theme-experience-metrics", {
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

test("inactive dashboard and draggable tabs keep the same border during theme changes", async ({
	page,
}, testInfo) => {
	await signIn(page);
	for (const name of ["用户管理", "角色管理"]) {
		await page
			.getByRole("banner")
			.getByRole("button", { name: "搜索", exact: true })
			.click();
		const search = page.getByRole("dialog", { name: "导航搜索" });
		await search.getByRole("textbox").fill(name);
		await search.getByRole("menuitem", { name, exact: true }).click();
		await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
			"aria-selected",
			"true",
		);
	}
	const inactiveTabs = page
		.getByRole("tab")
		.filter({ hasText: /^(仪表盘|用户管理)$/ });
	await expect(inactiveTabs).toHaveCount(2);
	const frames: { border: string; transition: string }[][] = [];
	for (let click = 0; click < 6; click += 1) {
		await page
			.getByRole("banner")
			.getByRole("button", { name: /切换为(深|浅)色模式/ })
			.click();
		frames.push(
			...(await inactiveTabs.evaluateAll(async (tabs) => {
				const samples: { border: string; transition: string }[][] = [];
				for (let frame = 0; frame < 4; frame += 1) {
					await new Promise<void>((resolve) =>
						requestAnimationFrame(() => resolve()),
					);
					samples.push(
						tabs.map((tab) => {
							const node = tab.closest("[data-node-key]");
							if (!node) throw new Error("Tab surface is missing");
							const style = getComputedStyle(node);
							return {
								border: style.borderTopColor,
								transition: style.transition,
							};
						}),
					);
				}
				return samples;
			})),
		);
	}
	await testInfo.attach("tab-theme-frames", {
		body: JSON.stringify(frames, null, 2),
		contentType: "application/json",
	});
	for (const frame of frames) expect(frame[0]?.border).toBe(frame[1]?.border);
});

test("system preference follows OS changes and explicit mode survives reload", async ({
	page,
}) => {
	await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
	await page.goto("/login");
	await page.getByRole("combobox", { name: "主题模式", exact: true }).click();
	await page.getByText("跟随系统", { exact: true }).click();
	await page.emulateMedia({ colorScheme: "dark" });
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await page.emulateMedia({ colorScheme: "light" });
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
	expect(
		await page.evaluate(() =>
			localStorage.getItem("react-antd-admin.preference.theme-mode"),
		),
	).toBe("system");
	await signIn(page);
	await page
		.getByRole("banner")
		.getByRole("button", { name: "切换为深色模式", exact: true })
		.click();
	await page.reload();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
	await page.emulateMedia({ colorScheme: "dark" });
	await page.emulateMedia({ colorScheme: "light" });
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("Pro table colors follow the current theme after route remounts", async ({
	page,
}, testInfo) => {
	await signIn(page);
	const header = page.getByRole("banner");
	await header.getByRole("button", { name: "搜索", exact: true }).click();
	const search = page.getByRole("dialog", { name: "导航搜索" });
	await search.getByRole("textbox").fill("用户管理");
	await search.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	const users = page.getByTestId("admin-users-table-card");
	await expect(users.getByRole("cell").first()).toBeVisible();
	const surfaces = users.locator(".ant-pro-card, .ant-pro-table-search");
	const readColors = () =>
		surfaces.evaluateAll((nodes) =>
			nodes.map((node) => {
				const style = getComputedStyle(node);
				return { background: style.backgroundColor, color: style.color };
			}),
		);
	const lightColors = await readColors();
	expect(lightColors.length).toBeGreaterThan(1);
	await header.getByRole("button", { name: "切换为深色模式" }).click();
	await finishVisualTransitions(page);
	expect(await readColors()).not.toEqual(lightColors);
	await page.getByRole("tab", { name: "仪表盘", exact: true }).click();
	await expect(page.getByTestId("dashboard-stat-users")).toBeVisible();
	await header.getByRole("button", { name: "切换为浅色模式" }).click();
	await page.getByRole("tab", { name: /用户管理/ }).click();
	await expect(users.getByRole("cell").first()).toBeVisible();
	await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
	await finishVisualTransitions(page);
	await testInfo.attach("table-theme-css-rules", {
		body: JSON.stringify(
			await surfaces.first().evaluate((node) => {
				const matches: { selector: string; background: string }[] = [];
				function inspect(rules: CSSRuleList) {
					for (const rule of rules) {
						if (
							rule instanceof CSSStyleRule &&
							rule.style.backgroundColor &&
							node.matches(rule.selectorText)
						) {
							matches.push({
								selector: rule.selectorText,
								background: rule.style.backgroundColor,
							});
						} else if (rule instanceof CSSGroupingRule) {
							inspect(rule.cssRules);
						}
					}
				}
				for (const sheet of document.styleSheets) inspect(sheet.cssRules);
				return { classes: node.getAttribute("class") ?? "", matches };
			}),
			null,
			2,
		),
		contentType: "application/json",
	});
	expect(await readColors()).toEqual(lightColors);
});

test("repeated theme toggles reuse their styles", async ({
	page,
}, testInfo) => {
	await signIn(page);
	await page.evaluate(() => {
		history.pushState(null, "", "/organization/users");
		dispatchEvent(new PopStateEvent("popstate"));
	});
	await expect(
		page.getByTestId("admin-users-table-card").getByRole("cell").first(),
	).toBeVisible();
	const toggle = page
		.getByRole("banner")
		.getByRole("button", { name: /切换为(深|浅)色模式/ });
	const styleCounts: number[] = [];
	for (let cycle = 0; cycle < 8; cycle += 1) {
		await toggle.click();
		await nextPaint(page);
		await toggle.click();
		await nextPaint(page);
		styleCounts.push(await page.evaluate(() => document.styleSheets.length));
	}
	await testInfo.attach("theme-stylesheet-counts", {
		body: JSON.stringify(styleCounts),
		contentType: "application/json",
	});
	expect(styleCounts.at(-1)).toBe(styleCounts[1]);
});

const tableThemeCases = [
	{ path: "/organization/users", id: "admin-users-table-card" },
	{ path: "/access/roles", id: "admin-roles-table-card" },
	{ path: "/organization/departments", id: "admin-departments-table-card" },
	{ path: "/organization/positions", id: "admin-positions-table-card" },
	{
		path: "/system/dictionaries",
		id: "admin-dictionaries-type-table",
		tab: "字典类型",
	},
	{
		path: "/system/dictionaries",
		id: "admin-dictionaries-item-table",
		tab: "字典项",
	},
	{ path: "/system/announcements", id: "admin-announcements-table-card" },
	{ path: "/operations/audit-logs", id: "audit-log-table-card" },
	{ path: "/operations/login-logs", id: "login-log-table-card" },
];

for (const table of tableThemeCases) {
	test(`${table.id} keeps table, query and toolbar colors aligned at every viewport`, async ({
		page,
	}, testInfo) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		page.on("console", (entry) => {
			if (entry.type() === "error") errors.push(entry.text());
		});
		page.on("response", (response) => {
			if (response.status() >= 400)
				errors.push(`${response.status()} ${response.url()}`);
		});
		await page.setViewportSize({ width: 1440, height: 900 });
		await signIn(page);
		await page.evaluate((path) => {
			history.pushState(null, "", path);
			dispatchEvent(new PopStateEvent("popstate"));
		}, table.path);
		if (table.tab)
			await page.getByRole("tab", { name: table.tab, exact: true }).click();
		const panel = page.getByTestId(table.id);
		await expect(panel.getByRole("cell").first()).toBeVisible();
		const nativeTable = panel
			.locator(".ant-table")
			.or(panel.and(page.locator(".ant-table")));
		const surfaces = panel
			.locator(
				".ant-pro-card, .ant-pro-table-search, .ant-pro-table-list-toolbar-title",
			)
			.or(nativeTable);
		const readColors = () =>
			surfaces.evaluateAll((nodes) =>
				nodes.map((node) => {
					const style = getComputedStyle(node);
					return { background: style.backgroundColor, color: style.color };
				}),
			);
		const lightColors = await readColors();
		const toggle = page
			.getByRole("banner")
			.getByRole("button", { name: /切换为(深|浅)色模式/ });
		for (const [index, width] of [1440, 768, 390, 1440].entries()) {
			await page.setViewportSize({ width, height: 900 });
			for (const mode of ["dark", "light"]) {
				await toggle.click();
				await expect(page.locator("html")).toHaveAttribute("data-theme", mode);
				await page.mouse.move(width / 2, 400);
				await finishVisualTransitions(page);
				const colors = await readColors();
				if (mode === "light") expect(colors).toEqual(lightColors);
				else expect(colors).not.toEqual(lightColors);
				const tableBackground = await nativeTable.evaluate(
					(node) => getComputedStyle(node).backgroundColor,
				);
				const proBackgrounds = await panel
					.locator(".ant-pro-card, .ant-pro-table-search")
					.evaluateAll((nodes) =>
						nodes.map((node) => getComputedStyle(node).backgroundColor),
					);
				for (const background of proBackgrounds)
					expect(background).toBe(tableBackground);
				expect(
					await page.evaluate(
						() => document.documentElement.scrollWidth <= innerWidth,
					),
				).toBe(true);
				if (index < 3)
					await page.screenshot({
						path: testInfo.outputPath(`${table.id}-${width}-${mode}.png`),
					});
				const settings = panel.getByRole("img", {
					name: "setting",
					exact: true,
				});
				await settings.click();
				const popup = page.locator(".ant-popover:visible");
				await expect(popup.getByRole("tree")).toBeVisible();
				await finishVisualTransitions(page);
				const box = await popup.boundingBox();
				if (!box) throw new Error("Column settings popup is missing");
				expect(box.x).toBeGreaterThanOrEqual(0);
				expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
				expect(box.y).toBeGreaterThanOrEqual(0);
				expect(box.y + box.height).toBeLessThanOrEqual(901);
				await settings.click();
				await expect(popup).toHaveCount(0);
			}
		}
		expect(errors).toEqual([]);
	});
}
