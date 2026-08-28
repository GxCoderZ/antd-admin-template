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
		await expect(page.getByRole("heading", { name: "系统概览" })).toBeVisible();
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
			await page.waitForFunction(() =>
				/ant-drawer-panel-motion-right-(appear|enter)-active/.test(
					document.querySelector('[role="dialog"]')?.parentElement?.className ??
						"",
				),
			);
			await page.waitForFunction(() => {
				const wrapper =
					document.querySelector('[role="dialog"]')?.parentElement;
				return (
					wrapper &&
					!/ant-drawer-panel-motion-right-(appear|enter)-active/.test(
						wrapper.className,
					)
				);
			});
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
