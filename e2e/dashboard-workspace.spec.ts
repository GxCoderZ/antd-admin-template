import { expect, type Page, test } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	const started = performance.now();
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
	await expect(page.getByTestId("dashboard-stat-users")).toBeVisible();
	return performance.now() - started;
}

for (const timeZone of ["UTC", "Asia/Shanghai"]) {
	test.describe(`工作台浏览器时区 ${timeZone}`, () => {
		test.use({ timezoneId: timeZone });

		test("今日登录提示使用浏览器时区", async ({ page }) => {
			await signIn(page);
			await page
				.getByTestId("dashboard-stat-logins")
				.getByRole("img", { name: "今日登录", exact: true })
				.focus();
			await expect(page.getByRole("tooltip")).toContainText(
				`按 ${timeZone} 统计今日成功登录次数`,
			);
		});
	});
}

test("工作台指标卡保留英文和深色主题（390px）", async ({ page }, testInfo) => {
	await page.setViewportSize({ width: 390, height: 1000 });
	await page.addInitScript(() => {
		localStorage.setItem("react-antd-admin.preference.language", "en");
		localStorage.setItem("react-antd-admin.preference.theme-mode", "dark");
	});
	await signIn(page);
	const metrics = page.getByTestId(/^dashboard-stat-/);
	await expect(metrics).toHaveCount(4);
	await expect(metrics.first()).toContainText("Weekly");
	await expect(metrics.first()).toContainText("Daily");
	await expect(metrics.first()).toContainText("Active users");
	for (const metric of await metrics.all()) {
		await expect(metric).toHaveCSS("background-color", "rgb(20, 20, 20)");
		await expect(metric.getByTestId("chart-card-total")).toHaveCSS(
			"color",
			"rgba(255, 255, 255, 0.85)",
		);
		for (const part of ["chart-card-content", "chart-card-footer"]) {
			expect(
				await metric
					.getByTestId(part)
					.evaluate(
						(node) =>
							node.scrollWidth <= node.clientWidth &&
							node.scrollHeight <= node.clientHeight,
					),
			).toBe(true);
		}
	}
	await page.screenshot({
		path: testInfo.outputPath("dashboard-en-dark-390.png"),
		animations: "disabled",
	});
	await metrics.first().screenshot({
		path: testInfo.outputPath("dashboard-en-dark-390-metric.png"),
		animations: "disabled",
	});
	const announcements = page.getByRole("region", {
		name: "Latest announcements",
	});
	await expect(
		announcements.getByRole("link", { name: "All notices", exact: true }),
	).toHaveAttribute("href", "/system/announcements");
	await expect(announcements).toHaveCSS("background-color", "rgb(20, 20, 20)");
	expect(
		await announcements
			.getByText("Latest announcements", { exact: true })
			.evaluate((node) => node.scrollWidth <= node.clientWidth),
	).toBe(true);
	await announcements.screenshot({
		path: testInfo.outputPath("dashboard-en-dark-390-announcements.png"),
	});
});

for (const width of [1440, 768, 460, 390]) {
	test(`工作台布局和动态面板（${width}px）`, async ({ page }, testInfo) => {
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
		await page.setViewportSize({ width, height: 1000 });
		const openTimes = [await signIn(page)];
		const timeZone = await page.evaluate(
			() => Intl.DateTimeFormat().resolvedOptions().timeZone,
		);
		const chartCanvas = page
			.getByRole("region", { name: "近 7 天登录趋势" })
			.locator("canvas");
		await expect(chartCanvas).toBeVisible();
		const resizeTimes: number[] = [];
		for (const nextWidth of [1440, 768, 390, width]) {
			const started = performance.now();
			await page.setViewportSize({ width: nextWidth, height: 1000 });
			await page.evaluate(async () => {
				await new Promise<void>((resolve) =>
					requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
				);
				await Promise.allSettled(
					document
						.getAnimations()
						.filter(
							(animation) =>
								animation.effect?.getTiming().iterations !== Infinity,
						)
						.map((animation) => animation.finished),
				);
			});
			await expect
				.poll(() =>
					chartCanvas.evaluate((node) => {
						if (!(node instanceof HTMLCanvasElement))
							throw new Error("Missing chart canvas");
						const figure = node.closest('[role="img"]');
						if (!figure) throw new Error("Missing chart figure");
						return Math.abs(node.width / devicePixelRatio - figure.clientWidth);
					}),
				)
				.toBeLessThan(2);
			resizeTimes.push(performance.now() - started);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
		}
		const activity = page.getByRole("region", { name: "最近动态" });
		const announcements = page.getByRole("region", { name: "最新公告" });
		const allAnnouncements = announcements.getByRole("link", {
			name: "全部公告",
			exact: true,
		});
		await expect(allAnnouncements).toHaveText("全部公告");
		await expect(allAnnouncements).toHaveCSS("font-size", "14px");
		await expect(allAnnouncements).toHaveCSS("color", "rgb(22, 119, 255)");
		await expect(allAnnouncements).toHaveCSS("border-width", "0px");
		await expect(announcements.getByRole("button")).toHaveCount(0);
		const noticeBox = await announcements.boundingBox();
		const titleBox = await announcements
			.getByText("最新公告", { exact: true })
			.boundingBox();
		const linkBox = await allAnnouncements.boundingBox();
		const firstNoticeBox = await announcements
			.getByRole("listitem")
			.first()
			.boundingBox();
		if (!noticeBox || !titleBox || !linkBox || !firstNoticeBox)
			throw new Error("Missing announcements card bounds");
		expect(titleBox.x - noticeBox.x).toBeCloseTo(24, 0);
		expect(
			noticeBox.x + noticeBox.width - linkBox.x - linkBox.width,
		).toBeCloseTo(24, 0);
		// Native Card overlaps its 56px header separator by one pixel.
		expect(firstNoticeBox.y - noticeBox.y).toBeCloseTo(55, 0);
		// Inline link glyph bounds can differ from the centered title by a fraction of a pixel.
		expect(
			Math.abs(
				titleBox.y + titleBox.height / 2 - linkBox.y - linkBox.height / 2,
			),
		).toBeLessThan(1);
		const metrics = page.getByTestId(/^dashboard-stat-/);
		await expect(metrics).toHaveCount(4);
		for (const metric of await metrics.all()) {
			const content = metric.getByTestId("chart-card-content");
			await expect(content.getByText(/^周同比/)).toBeVisible();
			await expect(content.getByText(/^日同比/)).toBeVisible();
			expect(
				await content.evaluate(
					(node) =>
						node.scrollHeight <= node.clientHeight &&
						node.scrollWidth <= node.clientWidth,
				),
			).toBe(true);
			await expect(
				content.getByRole("img", { name: /caret-(up|down)/ }),
			).toHaveCount(2);
			await expect(metric.getByTestId("chart-card-total")).toHaveCSS(
				"font-size",
				"30px",
			);
			await expect(metric.getByTestId("chart-card-total")).toHaveCSS(
				"line-height",
				"38px",
			);
			await expect(metric.getByTestId("chart-card-content")).toHaveCSS(
				"height",
				"46px",
			);
			await expect(metric.getByTestId("chart-card-footer")).toHaveCSS(
				"border-top-width",
				"1px",
			);
			await expect(metric.getByTestId("chart-card-footer")).toHaveCSS(
				"padding-top",
				"9px",
			);
			const cardBox = (await metric.boundingBox())!;
			const totalBox = (await metric
				.getByTestId("chart-card-total")
				.boundingBox())!;
			expect(totalBox.x - cardBox.x).toBeCloseTo(24, 0);
			expect(totalBox.y - cardBox.y).toBeCloseTo(46, 0);
			expect(cardBox.height).toBeCloseTo(182, 0);
		}
		await expect(page.getByRole("region", { name: "快捷入口" })).toHaveCount(0);
		await expect(page.getByRole("region", { name: "系统概览" })).toHaveCount(0);
		for (const region of [activity, announcements, ...(await metrics.all())]) {
			await expect(region).toHaveCSS("background-color", "rgb(255, 255, 255)");
			await expect(region).toHaveCSS("border-top-left-radius", "8px");
			await expect(region).toHaveCSS("border-bottom-right-radius", "8px");
			await expect(region).toHaveCSS(
				"box-shadow",
				"rgba(0, 0, 0, 0.03) 0px 1px 2px 0px, rgba(0, 0, 0, 0.02) 0px 1px 6px -1px, rgba(0, 0, 0, 0.02) 0px 2px 4px 0px",
			);
		}
		await expect(
			page.getByRole("region", { name: "近 7 天登录趋势" }),
		).toBeVisible();
		await expect(page.getByRole("checkbox")).toHaveCount(0);

		const boxes = await metrics.evaluateAll((nodes) =>
			nodes.map((node) => {
				const { top, bottom, left, right } = node.getBoundingClientRect();
				return { top, bottom, left, right };
			}),
		);
		if (width === 1440) {
			for (const box of boxes.slice(1)) {
				expect(box.top).toBeCloseTo(boxes[0]!.top, 0);
				expect(box.bottom).toBeCloseTo(boxes[0]!.bottom, 0);
			}
			expect(boxes[1]!.left).toBeGreaterThanOrEqual(boxes[0]!.right);
		} else if (width >= 576) {
			expect(boxes[1]!.top).toBeCloseTo(boxes[0]!.top, 0);
			expect(boxes[2]!.top).toBeGreaterThanOrEqual(boxes[0]!.bottom);
			expect(boxes[3]!.top).toBeCloseTo(boxes[2]!.top, 0);
		} else {
			for (let index = 1; index < boxes.length; index++) {
				expect(boxes[index]!.top).toBeGreaterThanOrEqual(
					boxes[index - 1]!.bottom,
				);
				expect(boxes[index]!.left).toBeCloseTo(boxes[0]!.left, 0);
			}
		}
		await expect(metrics.first()).toBeInViewport();
		expect((await activity.boundingBox())!.y).toBeGreaterThanOrEqual(
			boxes[3]!.bottom,
		);
		const activityBox = (await activity.boundingBox())!;
		const announcementBox = (await announcements.boundingBox())!;
		if (width === 1440) {
			expect(announcementBox.x).toBeGreaterThan(
				activityBox.x + activityBox.width,
			);
			expect(announcementBox.y).toBeCloseTo(activityBox.y, 0);
			expect(activityBox.width + 24).toBeCloseTo(
				(announcementBox.width + 24) * 2,
				0,
			);
		} else {
			expect(announcementBox.y).toBeGreaterThan(
				activityBox.y + activityBox.height,
			);
		}
		expect(
			await page
				.getByTestId("admin-shell-page-content")
				.evaluate((node) => node.scrollWidth <= node.clientWidth + 1),
		).toBe(true);
		await page.screenshot({
			path: testInfo.outputPath(`dashboard-${width}-top.png`),
			animations: "disabled",
		});
		await metrics.first().screenshot({
			path: testInfo.outputPath(`dashboard-${width}-metric.png`),
			animations: "disabled",
		});
		const interactionStarted = performance.now();
		await page
			.getByTestId("dashboard-stat-logins")
			.getByRole("img", { name: "今日登录", exact: true })
			.focus();
		await expect(page.getByRole("tooltip")).toContainText(
			`按 ${timeZone} 统计今日成功登录次数`,
		);
		const interactionTimes = [performance.now() - interactionStarted];
		await activity.scrollIntoViewIfNeeded();
		await expect(activity.getByRole("heading")).toHaveCount(0);
		const headerBox = await activity.getByRole("tablist").boundingBox();
		const cardBox = await activity.boundingBox();
		if (!headerBox || !cardBox)
			throw new Error("Missing activity header bounds");
		expect(headerBox.y).toBeCloseTo(cardBox.y, 0);
		for (const name of ["最近操作", "最近登录", "最近操作"]) {
			const started = performance.now();
			await activity.getByRole("tab", { name, exact: true }).click();
			await expect(activity.getByRole("tabpanel", { name })).toBeVisible();
			await activity.evaluate(async (node) => {
				await new Promise<void>((resolve) =>
					requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
				);
				await Promise.allSettled(
					node
						.getAnimations({ subtree: true })
						.filter(
							(animation) =>
								animation.effect?.getTiming().iterations !== Infinity,
						)
						.map((animation) => animation.finished),
				);
			});
			interactionTimes.push(performance.now() - started);
			await expect(activity.getByRole("listitem")).toHaveCount(5);
			expect(
				await activity.evaluate((node) => node.scrollWidth <= node.clientWidth),
			).toBe(true);
		}
		await activity.screenshot({
			path: testInfo.outputPath(`dashboard-${width}-activity.png`),
		});
		const users = page.getByTestId("dashboard-stat-users");
		await expect(
			users.getByRole("img", { name: "caret-up", exact: true }),
		).toHaveCSS("color", "rgb(245, 34, 45)");
		await expect(
			users.getByRole("img", { name: "caret-down", exact: true }),
		).toHaveCSS("color", "rgb(82, 196, 26)");
		await announcements.screenshot({
			path: testInfo.outputPath(`dashboard-${width}-announcements.png`),
		});
		await allAnnouncements.focus();
		await expect(allAnnouncements).toBeFocused();
		const announcementNavigationStarted = performance.now();
		await allAnnouncements.press("Enter");
		await expect(page).toHaveURL("/system/announcements");
		await expect(
			page.getByTestId("admin-announcements-table-card"),
		).toBeVisible();
		interactionTimes.push(performance.now() - announcementNavigationStarted);
		await page.goBack();
		await expect(page).toHaveURL("/dashboard");
		await expect(allAnnouncements).toBeVisible();
		const summarize = (samples: number[]) => {
			const sorted = samples.toSorted((a, b) => a - b);
			return {
				samples,
				p50: sorted[Math.ceil(sorted.length * 0.5) - 1]!,
				p95: sorted[Math.ceil(sorted.length * 0.95) - 1]!,
			};
		};
		const metricsReport = {
			open: summarize(openTimes),
			resize: summarize(resizeTimes),
			interaction: summarize(interactionTimes),
		};
		console.log("dashboard-experience", width, JSON.stringify(metricsReport));
		await testInfo.attach("dashboard-experience-metrics", {
			body: JSON.stringify(metricsReport),
			contentType: "application/json",
		});
		expect(metricsReport.open.p50).toBeLessThan(1500);
		expect(metricsReport.open.p95).toBeLessThan(3000);
		expect(Math.max(...openTimes)).toBeLessThan(5000);
		expect(metricsReport.resize.p95).toBeLessThan(700);
		expect(Math.max(...resizeTimes)).toBeLessThan(800);
		expect(metricsReport.interaction.p95).toBeLessThan(800);
		expect(Math.max(...interactionTimes)).toBeLessThan(1000);
		await page
			.getByRole("region", { name: "轻量提醒" })
			.scrollIntoViewIfNeeded();
		await page.screenshot({
			path: testInfo.outputPath(`dashboard-${width}-reminders.png`),
			animations: "disabled",
		});

		await page.getByRole("button", { name: "维护设置", exact: true }).click();
		await expect(page).toHaveURL("/system/settings?section=security");
		await expect(
			page.getByRole("tab", { name: "登录与安全", exact: true }),
		).toHaveAttribute("aria-selected", "true");
		expect(errors).toEqual([]);
	});
}

for (const [language, title] of [
	["zh-TW", "最新公告"],
	["ja-JP", "最新のお知らせ"],
	["bn-BD", "সর্বশেষ ঘোষণা"],
	["fa-IR", "تازه‌ترین اعلان‌ها"],
	["id-ID", "Terakhir announcements"],
	["pt-BR", "Latest announcements"],
] as const) {
	test(`公告卡片窄屏文案完整显示 (${language})`, async ({ page }, testInfo) => {
		await page.setViewportSize({ width: 390, height: 1000 });
		await page.addInitScript((language) => {
			localStorage.setItem("react-antd-admin.preference.language", language);
		}, language);
		await signIn(page);
		const announcements = page.getByRole("region", {
			name: title,
			exact: true,
		});
		await announcements.screenshot({
			path: testInfo.outputPath(`announcements-${language}-390.png`),
		});
		await expect(announcements.getByRole("link")).toHaveAttribute(
			"href",
			"/system/announcements",
		);
		expect(
			await announcements
				.getByText(title, { exact: true })
				.evaluate((node) => node.scrollWidth <= node.clientWidth),
		).toBe(true);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);
	});
}
