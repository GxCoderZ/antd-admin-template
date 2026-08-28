import { writeFile } from "node:fs/promises";
import { expect, test, type Locator, type Page } from "@playwright/test";

const pages = [
	{
		name: "用户管理",
		path: "/organization/users",
		table: "admin-users-table-card",
		open: "新建用户",
	},
	{
		name: "公告管理",
		path: "/system/announcements",
		table: "admin-announcements-table-card",
		open: "新建公告",
	},
	{
		name: "字典管理",
		path: "/system/dictionaries",
		table: "admin-dictionaries-type-table",
		open: "新建类型",
	},
	{
		name: "操作审计",
		path: "/operations/audit-logs",
		table: "audit-log-table-card",
		open: /查看日志/,
	},
];

async function finishTransitions(page: Page, surface?: Locator) {
	await (surface ?? page.locator("html")).evaluate(async (node) => {
		// rc-motion activates enter transitions over two animation frames.
		await new Promise<void>((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
		);
		await Promise.allSettled(
			document
				.getAnimations()
				.filter((animation) => {
					const target =
						animation.effect instanceof KeyframeEffect
							? animation.effect.target
							: null;
					return (
						target instanceof Element &&
						(target.contains(node) || node.contains(target)) &&
						animation.effect?.getTiming().iterations !== Infinity
					);
				})
				.map((animation) => animation.finished),
		);
	});
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

async function finishDrawerTransition(page: Page) {
	await page.waitForFunction(() =>
		/ant-drawer-panel-motion-right-(appear|enter)-active/.test(
			document.querySelector('[role="dialog"]')?.parentElement?.className ?? "",
		),
	);
	await page.waitForFunction(() => {
		const wrapper = document.querySelector('[role="dialog"]')?.parentElement;
		return (
			wrapper &&
			!/ant-drawer-panel-motion-right-(appear|enter)-active/.test(
				wrapper.className,
			)
		);
	});
}

async function finishDropdownTransition(page: Page, menu: Locator) {
	// The initial visible frame precedes rc-motion's actual enter phase.
	await page.waitForFunction(() =>
		/ant-slide-up-(appear|enter)-active/.test(
			document.querySelector(".ant-dropdown")?.className ?? "",
		),
	);
	await finishTransitions(page, menu);
}

function summarize(samples: number[]) {
	const sorted = [...samples].sort((a, b) => a - b);
	return {
		samples,
		p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
		p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
	};
}

for (const entry of pages) {
	test(`${entry.name}响应式、键盘和像素恢复验收`, async ({
		page,
	}, testInfo) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		page.on("console", (message) => {
			if (message.type() === "error") errors.push(message.text());
		});
		page.on("response", (response) => {
			if (response.status() >= 400)
				errors.push(`${response.status()} ${response.url()}`);
		});
		page.on("requestfailed", (request) => {
			if (request.failure()?.errorText !== "net::ERR_ABORTED")
				errors.push(`${request.url()} ${request.failure()?.errorText}`);
		});
		await page.clock.setFixedTime(new Date("2026-08-28T00:00:00Z"));
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto("/login");
		await page.locator('input[autocomplete="username"]').fill("admin");
		await page.locator('input[autocomplete="current-password"]').fill("admin");
		await page.locator('button[type="submit"]').click();
		await expect(page).toHaveURL(/\/dashboard$/);
		await expect(page.getByTestId("dashboard-stat-users")).toBeVisible();
		await page.keyboard.press("Control+k");
		const search = page.getByRole("dialog", { name: "导航搜索" });
		await search.getByRole("textbox").fill(entry.name);
		await expect(
			search.getByRole("menuitem", { name: entry.name, exact: true }),
		).toBeVisible();
		let started = performance.now();
		await search.getByRole("textbox").press("Enter");
		await expect(page).toHaveURL(entry.path);
		await expect(search).toBeHidden();
		const table = page.getByTestId(entry.table);
		await expect(table.getByRole("row").nth(1)).toBeVisible();
		await expect(table.locator(".ant-spin-spinning")).toHaveCount(0);
		await finishTransitions(page);
		const openTimes = [performance.now() - started];
		const resizeTimes: number[] = [];
		const interactionTimes: number[] = [];
		let desktopReference: Buffer | undefined;
		const scrollContainer = page.locator(".admin-shell-scroll-content");

		for (const [index, width] of [1440, 768, 390, 1286, 1440].entries()) {
			started = performance.now();
			await page.setViewportSize({ width, height: 900 });
			await finishTransitions(page);
			resizeTimes.push(performance.now() - started);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
			const trigger = table
				.getByRole("button", {
					name: entry.open,
					exact: typeof entry.open === "string",
				})
				.first();
			await expect(trigger).toBeInViewport();
			await trigger.focus();
			started = performance.now();
			await page.keyboard.press("Enter");
			const dialog = page.getByRole("dialog");
			// An initial untransformed frame precedes rc-motion's actual enter phase.
			await finishDrawerTransition(page);
			await expect(dialog).toBeInViewport({ ratio: 1 });
			await finishTransitions(page, dialog);
			interactionTimes.push(performance.now() - started);
			await expectFitsViewport(page, dialog);
			if (width === 390) expect((await dialog.boundingBox())?.width).toBe(390);
			// Drawer initially focuses its outer focus trap; Tab enters the visible panel.
			await page.keyboard.press("Tab");
			expect(
				await dialog.evaluate((node) => node.contains(document.activeElement)),
			).toBe(true);
			if (width === 390 && entry.name === "公告管理") {
				const title = dialog.getByPlaceholder("请输入公告标题");
				const content = dialog.getByPlaceholder("请输入公告内容");
				await title.fill("长标题验收".repeat(20));
				await content.fill("UnbrokenLongContent".repeat(100));
				await expectFitsViewport(page, dialog);
				await expect(
					dialog.getByRole("button", { name: /保\s*存/ }),
				).toBeInViewport();
				await page.screenshot({
					path: testInfo.outputPath("announcement-long-text-390.png"),
					animations: "disabled",
				});
				await title.fill("");
				await content.fill("");
			}
			await page.mouse.move(0, 0);
			await page.screenshot({
				path: testInfo.outputPath(`overlay-${width}.png`),
				animations: "disabled",
			});
			await page.keyboard.press("Escape");
			await expect(dialog).toBeHidden();
			await expect(trigger).toBeFocused();
			await finishTransitions(page);
			await page.screenshot({
				path: testInfo.outputPath(`page-${width}.png`),
				animations: "disabled",
			});
			if (width === 1440) {
				const scrollTop = await scrollContainer.evaluate(
					(node) => node.scrollTop,
				);
				const pixels = await table.screenshot({ animations: "disabled" });
				await scrollContainer.evaluate((node, top) => {
					node.scrollTop = top;
				}, scrollTop);
				if (index === 0) desktopReference = pixels;
				else {
					if (!desktopReference) throw new Error("Missing desktop reference");
					expect(pixels.equals(desktopReference)).toBe(true);
				}
			}
		}
		const report = {
			open: summarize(openTimes),
			resize: summarize(resizeTimes),
			interaction: summarize(interactionTimes),
		};
		await writeFile(
			testInfo.outputPath("experience-metrics.json"),
			JSON.stringify(report, null, 2),
		);
		await testInfo.attach("experience-metrics", {
			body: JSON.stringify(report, null, 2),
			contentType: "application/json",
		});
		expect(errors).toEqual([]);
		expect(Math.max(...openTimes)).toBeLessThan(5000);
		expect(report.open.p50).toBeLessThan(1500);
		expect(report.open.p95).toBeLessThan(3000);
		expect(Math.max(...resizeTimes)).toBeLessThan(800);
		expect(report.resize.p95).toBeLessThan(700);
		expect(Math.max(...interactionTimes)).toBeLessThan(1000);
		expect(report.interaction.p95).toBeLessThan(800);
	});
}

type TableDetailEntry = {
	path: string;
	table: string;
	tab?: string;
	sections: number;
} & ({ kind: "cell"; cell: number } | { kind: "menu" | "log" | "readonly" });

test("公告详情保留长正文、换行与查询条件", async ({ page }, testInfo) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "公告管理", exact: true }).click();
	await page.getByRole("button", { name: "新建公告", exact: true }).click();
	const editor = page.getByRole("dialog");
	const title = "详情长内容验收";
	const content = `${"LongUnbrokenContent".repeat(70)}\n第二段保留完整内容和换行。`;
	await editor.getByPlaceholder("请输入公告标题").fill(title);
	await editor.getByPlaceholder("请输入公告内容").fill(content);
	await editor.getByRole("button", { name: /保\s*存/ }).click();
	await expect(editor).toBeHidden();
	const query = page.getByPlaceholder("搜索公告标题");
	await query.fill(title);
	await page.getByRole("button", { name: /查\s*询/ }).click();
	await page.getByRole("button", { name: title, exact: true }).click();
	const dialog = page.getByRole("dialog");
	await finishDrawerTransition(page);

	for (const width of [390, 768, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await finishTransitions(page, dialog);
		await expectFitsViewport(page, dialog);
		const text = dialog.getByText(content, { exact: true });
		await expect(text).toHaveCSS("white-space", "pre-wrap");
		const labelBox = await dialog
			.getByText("公告内容", { exact: true })
			.boundingBox();
		const contentBox = await text.boundingBox();
		if (!labelBox || !contentBox) throw new Error("Missing content or label");
		expect(labelBox.y).toBeLessThanOrEqual(contentBox.y + labelBox.height);
		expect(await text.textContent()).toBe(content);
		expect(
			await dialog
				.getByTestId("record-details")
				.evaluate((node) => node.scrollWidth <= node.clientWidth),
		).toBe(true);
		await page.screenshot({
			path: testInfo.outputPath(`long-detail-${width}.png`),
		});
	}
	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
	await expect(query).toHaveValue(title);
	await expect(
		page.getByRole("button", { name: title, exact: true }),
	).toBeVisible();
});

const detailTables: TableDetailEntry[] = [
	{
		path: "/organization/users",
		table: "admin-users-table-card",
		kind: "cell",
		cell: 0,
		sections: 3,
	},
	{
		path: "/access/roles",
		table: "admin-roles-table-card",
		kind: "menu",
		sections: 2,
	},
	{
		path: "/organization/departments",
		table: "admin-departments-table-card",
		sections: 2,
		kind: "cell",
		cell: 0,
	},
	{
		path: "/organization/positions",
		table: "admin-positions-table-card",
		sections: 2,
		kind: "cell",
		cell: 0,
	},
	{
		path: "/system/dictionaries",
		table: "admin-dictionaries-type-table",
		sections: 1,
		kind: "cell",
		cell: 0,
		tab: "字典类型",
	},
	{
		path: "/system/dictionaries",
		table: "admin-dictionaries-item-table",
		sections: 2,
		kind: "cell",
		cell: 0,
		tab: "字典项",
	},
	{
		path: "/system/announcements",
		table: "admin-announcements-table-card",
		kind: "cell",
		sections: 1,
		cell: 1,
	},
	{
		path: "/operations/audit-logs",
		table: "audit-log-table-card",
		kind: "log",
		sections: 3,
	},
	{
		path: "/operations/login-logs",
		table: "login-log-table-card",
		kind: "log",
		sections: 3,
	},
	{
		path: "/system/about",
		table: "about-production-dependencies",
		kind: "readonly",
		sections: 0,
	},
];

for (const entry of detailTables) {
	test(`${entry.table}逐表字段与详情体验验收`, async ({ page }, testInfo) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		page.on("console", (message) => {
			if (message.type() === "error") errors.push(message.text());
		});
		page.on("response", (response) => {
			if (response.status() >= 400)
				errors.push(`${response.status()} ${response.url()}`);
		});
		page.on("requestfailed", (request) => {
			if (request.failure()?.errorText !== "net::ERR_ABORTED")
				errors.push(`${request.url()} ${request.failure()?.errorText}`);
		});
		await page.clock.setFixedTime(new Date("2026-08-28T00:00:00Z"));
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto("/login");
		await page.locator('input[autocomplete="username"]').fill("admin");
		await page.locator('input[autocomplete="current-password"]').fill("admin");
		await page.locator('button[type="submit"]').click();
		await expect(page).toHaveURL(/\/dashboard$/);
		await finishTransitions(page);
		let started = performance.now();
		await page.evaluate((path) => {
			history.pushState(null, "", path);
			dispatchEvent(new PopStateEvent("popstate"));
		}, entry.path);
		if (entry.tab)
			await page.getByRole("tab", { name: entry.tab, exact: true }).click();
		const table = page.getByTestId(entry.table);
		await expect(table.getByRole("row").nth(1)).toBeVisible();
		await expect(table.locator(".ant-spin-spinning")).toHaveCount(0);
		await finishTransitions(page);
		const openTimes = [performance.now() - started];
		const resizeTimes: number[] = [];
		const interactionTimes: number[] = [];
		const defaultHeaders = await table
			.getByRole("columnheader")
			.allTextContents();
		const workflowTimes: number[] = [];
		for (const width of [1440, 768, 390, 1286, 1440]) {
			started = performance.now();
			await page.setViewportSize({ width, height: 900 });
			await finishTransitions(page);
			resizeTimes.push(performance.now() - started);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
			await expect(table.getByRole("columnheader")).toHaveText(defaultHeaders);
			const trigger =
				entry.kind === "cell"
					? table
							.getByRole("row")
							.nth(1)
							.getByRole("cell")
							.nth(entry.cell)
							.getByRole("button")
							.last()
					: table
							.getByRole("button", {
								name: entry.kind === "log" ? /查看日志/ : "更多",
								exact: entry.kind !== "log",
							})
							.first();
			await trigger.scrollIntoViewIfNeeded();
			if (width === 390 && entry.kind === "cell" && entry.cell === 0) {
				const nameBox = await trigger.boundingBox();
				const actionsBox = await table
					.getByRole("row")
					.nth(1)
					.getByRole("cell")
					.last()
					.boundingBox();
				if (!nameBox || !actionsBox) throw new Error("Missing name or actions");
				expect(nameBox.x + nameBox.width).toBeLessThanOrEqual(actionsBox.x);
			}
			await trigger.focus();
			started = performance.now();
			const workflowStarted = started;
			await page.keyboard.press("Enter");
			if (entry.kind === "readonly") {
				const menu = page
					.getByRole("menu")
					.filter({ has: page.getByRole("menuitem", { name: "复制包名" }) });
				await expect(menu).toBeVisible();
				await finishDropdownTransition(page, menu);
				interactionTimes.push(performance.now() - started);
				await expectFitsViewport(page, menu);
				await page.keyboard.press("Escape");
				await expect(menu).toBeHidden();
			} else {
				if (entry.kind === "menu") {
					const viewDetails = page.getByRole("menuitem", {
						name: "查看详情",
						exact: true,
					});
					await expect(viewDetails).toBeVisible();
					await finishDropdownTransition(page, viewDetails);
					interactionTimes.push(performance.now() - started);
					started = performance.now();
					await viewDetails.click();
				}
				await finishDrawerTransition(page);
				const dialog = page.getByRole("dialog");
				await expect(dialog).toBeInViewport({ ratio: 1 });
				await finishTransitions(page, dialog);
				interactionTimes.push(performance.now() - started);
				if (entry.kind === "menu")
					workflowTimes.push(performance.now() - workflowStarted);
				await expectFitsViewport(page, dialog);
				if (width === 390)
					expect((await dialog.boundingBox())?.width).toBe(390);
				const details = dialog.getByTestId("record-details");
				await expect(details.getByRole("table")).toHaveCount(entry.sections);
				if (entry.sections > 1) {
					await expect(
						details.getByText("基本信息", { exact: true }),
					).toBeVisible();
				} else {
					await expect(
						details.getByText("基本信息", { exact: true }),
					).toHaveCount(0);
				}
				const labelWidths = await details
					.locator(".ant-descriptions-item-label")
					.evaluateAll((labels) =>
						labels.map((label) => label.getBoundingClientRect().width),
					);
				expect(
					Math.max(...labelWidths) - Math.min(...labelWidths),
				).toBeLessThanOrEqual(1);
				const overflowingFields = await details
					.locator(
						".ant-descriptions-item-label, .ant-descriptions-item-content",
					)
					.evaluateAll((fields) =>
						fields
							.filter((field) => field.scrollWidth > field.clientWidth + 1)
							.map((field) => field.textContent),
					);
				expect(overflowingFields).toEqual([]);
				expect(
					await dialog
						.locator(".ant-drawer-body")
						.evaluate((node) => node.scrollWidth <= node.clientWidth),
				).toBe(true);
				await page.keyboard.press("Tab");
				expect(
					await dialog.evaluate((node) =>
						node.contains(document.activeElement),
					),
				).toBe(true);
				await page.screenshot({
					path: testInfo.outputPath(`detail-${width}.png`),
					animations: "disabled",
				});
				await dialog
					.locator(".ant-descriptions")
					.last()
					.scrollIntoViewIfNeeded();
				await expect(
					dialog.locator(".ant-descriptions").last(),
				).toBeInViewport();
				await page.screenshot({
					path: testInfo.outputPath(`detail-records-${width}.png`),
					animations: "disabled",
				});
				await page.keyboard.press("Escape");
				await expect(dialog).toBeHidden();
			}
			await finishTransitions(page);
			await page.mouse.move(0, 0);
			await page.screenshot({
				path: testInfo.outputPath(`fields-${width}.png`),
				animations: "disabled",
			});
			await expect(table.getByRole("columnheader")).toHaveText(defaultHeaders);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
		}
		const report = {
			open: summarize(openTimes),
			resize: summarize(resizeTimes),
			interaction: summarize(interactionTimes),
		};
		const metrics = {
			...report,
			...(workflowTimes.length ? { workflow: summarize(workflowTimes) } : {}),
		};
		await writeFile(
			testInfo.outputPath("field-experience-metrics.json"),
			JSON.stringify(metrics, null, 2),
		);
		await testInfo.attach("field-experience-metrics", {
			body: JSON.stringify(metrics, null, 2),
			contentType: "application/json",
		});
		expect(errors).toEqual([]);
		expect(Math.max(...openTimes)).toBeLessThan(5000);
		expect(report.open.p50).toBeLessThan(1500);
		expect(report.open.p95).toBeLessThan(3000);
		expect(Math.max(...resizeTimes)).toBeLessThan(800);
		expect(report.resize.p95).toBeLessThan(700);
		expect(Math.max(...interactionTimes)).toBeLessThan(1000);
		expect(report.interaction.p95).toBeLessThan(800);
	});
}
