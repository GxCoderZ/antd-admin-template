import { expect, test, type Locator } from "@playwright/test";

async function linePixels(canvas: Locator) {
	return canvas.evaluate((element) => {
		if (!(element instanceof HTMLCanvasElement))
			throw new Error("Missing chart canvas");
		const context = element.getContext("2d");
		if (!context) throw new Error("Missing chart context");
		const { data } = context.getImageData(0, 0, element.width, element.height);
		const bytes = new DataView(data.buffer, data.byteOffset, data.byteLength);
		let blue = 0;
		let red = 0;
		for (let index = 0; index < data.length; index += 4) {
			const r = bytes.getUint8(index);
			const g = bytes.getUint8(index + 1);
			const b = bytes.getUint8(index + 2);
			const a = bytes.getUint8(index + 3);
			if (a > 100 && b > r * 1.3 && b > g * 1.05) blue++;
			if (a > 100 && r > g * 1.3 && r > b * 1.2) red++;
		}
		return { blue, red };
	});
}

function summarize(samples: number[]) {
	const sorted = samples.toSorted((a, b) => a - b);
	return {
		p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
		p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
		max: Math.max(...samples),
	};
}

for (const language of ["zh-CN", "en"]) {
	test(`登录趋势保留官方整行结构、主题和交互 (${language})`, async ({
		page,
	}, testInfo) => {
		const english = language === "en";
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
				errors.push(request.url());
		});
		await page.setViewportSize({ width: 1440, height: 1000 });
		await page.addInitScript(
			({ language, english }) => {
				localStorage.setItem("react-antd-admin.preference.language", language);
				localStorage.setItem(
					"react-antd-admin.preference.theme-mode",
					english ? "dark" : "light",
				);
			},
			{ language, english },
		);
		await page.goto("/login");
		await page.locator('input[autocomplete="username"]').fill("admin");
		await page.locator('input[autocomplete="current-password"]').fill("admin");
		let started = performance.now();
		await page.locator('button[type="submit"]').click();
		const chart = page.getByRole("region", {
			name: english ? "Login trend, last 7 days" : "近 7 天登录趋势",
		});
		const canvas = chart.locator("canvas");
		await expect(canvas).toHaveCount(1);
		await expect
			.poll(async () => (await linePixels(canvas)).blue)
			.toBeGreaterThan(100);
		const opening = [performance.now() - started];
		const resizing: number[] = [];
		const interactions: number[] = [];
		for (const width of [1440, 768, 390, 1440]) {
			started = performance.now();
			await page.setViewportSize({ width, height: 1000 });
			await expect
				.poll(() =>
					canvas.evaluate((element) => {
						if (!(element instanceof HTMLCanvasElement))
							throw new Error("Missing chart canvas");
						const figure = element.closest('[role="img"]');
						if (!figure) throw new Error("Missing chart figure");
						return Math.abs(
							element.width / devicePixelRatio - figure.clientWidth,
						);
					}),
				)
				.toBeLessThan(2);
			await expect
				.poll(async () => (await linePixels(canvas)).blue)
				.toBeGreaterThan(100);
			resizing.push(performance.now() - started);
			const pixels = await linePixels(canvas);
			expect(pixels.red).toBeGreaterThan(30);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
			const chartBox = await chart.boundingBox();
			const firstMetric = await page
				.getByTestId("dashboard-stat-users")
				.boundingBox();
			const lastMetric = await page
				.getByTestId("dashboard-stat-logins")
				.boundingBox();
			const activity = await page
				.getByRole("region", { name: english ? "Recent activity" : "最近动态" })
				.boundingBox();
			if (!chartBox || !firstMetric || !lastMetric || !activity)
				throw new Error("Missing dashboard layout bounds");
			expect(chartBox.y).toBeCloseTo(lastMetric.y + lastMetric.height + 24, 0);
			expect(chartBox.x).toBeCloseTo(firstMetric.x, 0);
			expect(chartBox.width).toBeCloseTo(
				lastMetric.x + lastMetric.width - firstMetric.x,
				0,
			);
			expect(activity.y).toBeCloseTo(chartBox.y + chartBox.height + 24, 0);
			await expect(chart).toHaveCSS("border-top-left-radius", "8px");
			await expect(chart).toHaveCSS(
				"background-color",
				english ? "rgb(20, 20, 20)" : "rgb(255, 255, 255)",
			);
			await chart.scrollIntoViewIfNeeded();
			await chart.screenshot({
				path: testInfo.outputPath(`login-trend-${language}-${width}.png`),
			});
			await page.screenshot({
				path: testInfo.outputPath(`dashboard-trend-${language}-${width}.png`),
				fullPage: true,
			});

			const box = await canvas.boundingBox();
			if (!box) throw new Error("Missing canvas bounds");
			started = performance.now();
			await canvas.hover({ position: { x: box.width / 2, y: box.height / 2 } });
			const tooltip = chart.locator(".g2-tooltip");
			await expect(tooltip).toBeVisible();
			await expect(tooltip).toContainText(
				english ? "Total logins" : "登录总次数",
			);
			await expect(tooltip).toContainText(
				english ? "Abnormal logins" : "异常登录",
			);
			interactions.push(performance.now() - started);
			const tooltipBox = await tooltip.boundingBox();
			if (!tooltipBox) throw new Error("Missing tooltip bounds");
			expect(tooltipBox.x).toBeGreaterThanOrEqual(0);
			expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(width);
			await page.mouse.move(0, 0);
			await expect(tooltip).toBeHidden();
		}
		for (const name of english
			? ["Collapse menu", "Expand menu"]
			: ["折叠菜单", "展开菜单"]) {
			started = performance.now();
			await page.getByRole("button", { name, exact: true }).click();
			await expect
				.poll(() =>
					canvas.evaluate((element) => {
						if (!(element instanceof HTMLCanvasElement))
							throw new Error("Missing chart canvas");
						const figure = element.closest('[role="img"]');
						if (!figure) throw new Error("Missing chart figure");
						return Math.abs(
							element.width / devicePixelRatio - figure.clientWidth,
						);
					}),
				)
				.toBeLessThan(2);
			interactions.push(performance.now() - started);
		}
		for (let index = 0; index < 4; index++) {
			started = performance.now();
			await page
				.getByRole("button", { name: /切换为.*色模式|Switch to .* mode/ })
				.click();
			await expect
				.poll(async () => (await linePixels(canvas)).blue)
				.toBeGreaterThan(100);
			interactions.push(performance.now() - started);
		}
		const metrics = {
			opening: summarize(opening),
			resizing: summarize(resizing),
			interactions: summarize(interactions),
		};
		console.log("login-trend-timings", language, JSON.stringify(metrics));
		await testInfo.attach("login-trend-timings", {
			body: JSON.stringify(metrics),
			contentType: "application/json",
		});
		expect(metrics.opening.p50).toBeLessThan(1500);
		expect(metrics.opening.p95).toBeLessThan(3000);
		expect(metrics.opening.max).toBeLessThan(5000);
		expect(metrics.resizing.p95).toBeLessThan(700);
		expect(metrics.resizing.max).toBeLessThan(800);
		expect(metrics.interactions.p95).toBeLessThan(800);
		expect(metrics.interactions.max).toBeLessThan(1000);
		expect(errors).toEqual([]);
	});
}
