import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/login");
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
}

test("tab refresh re-fetches the current page without losing query state or reloading the app", async ({
	page,
}, testInfo) => {
	test.setTimeout(60_000);
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	page.on("console", (entry) => {
		if (entry.type() === "error") errors.push(entry.text());
	});
	page.on("requestfailed", (request) => {
		if (request.failure()?.errorText !== "net::ERR_ABORTED")
			errors.push(request.url());
	});
	const timings = {
		open: [] as number[],
		resize: [] as number[],
		interaction: [] as number[],
	};
	await page.setViewportSize({ width: 1440, height: 900 });
	await signIn(page);
	const timeOrigin = await page.evaluate(() => performance.timeOrigin);
	// Production Fake requests resolve in-page, without browser network events.
	const requests = await page.evaluateHandle(() => {
		const log = { completed: [] as string[], errors: [] as string[] };
		const originalFetch = window.fetch.bind(window);
		window.fetch = async (...args) => {
			const response = await originalFetch(...args);
			const [input] = args;
			const url = input instanceof Request ? input.url : String(input);
			log.completed.push(url);
			if (!response.ok) log.errors.push(`${response.status} ${url}`);
			return response;
		};
		return log;
	});
	const userRequests = async () =>
		(await requests.jsonValue()).completed
			.map((url) => new URL(url, page.url()))
			.filter((url) => url.pathname === "/api/platform/users");
	let started = performance.now();
	await page.evaluate(() => {
		history.pushState(null, "", "/organization/users");
		dispatchEvent(new PopStateEvent("popstate"));
	});
	const panel = page.getByTestId("admin-users-table-card");
	const form = page.getByTestId("admin-users-query-form");
	const reload = page.getByRole("button", { name: "重新加载", exact: true });
	const content = page.getByTestId("admin-shell-page-content");
	await expect(panel.locator("tbody tr.ant-table-row").first()).toBeVisible();
	await expect(panel.locator(".ant-spin-spinning")).toHaveCount(0);
	timings.open.push(performance.now() - started);

	// The submission key changes even with unchanged filters. Refresh must not
	// reuse the still-fresh cache from before that submission.
	const initialCount = (await userRequests()).length;
	await form.getByRole("button", { name: /^查\s*询$/ }).click();
	await expect
		.poll(async () => (await userRequests()).length)
		.toBe(initialCount + 1);
	await expect(panel.locator(".ant-spin-spinning")).toHaveCount(0);
	await form.getByRole("textbox").fill("未提交筛选");
	await reload.click();
	await expect
		.poll(async () => (await userRequests()).length)
		.toBe(initialCount + 2);
	await expect(form.getByRole("textbox")).toHaveValue("未提交筛选");
	await expect(panel.locator(".ant-spin-spinning")).toHaveCount(0);

	const usernameHeader = panel.getByRole("columnheader", {
		name: "用户名",
		exact: true,
	});
	await usernameHeader.click();
	await expect(usernameHeader).toHaveAttribute("aria-sort", "ascending");
	await expect(panel.locator(".ant-spin-spinning")).toHaveCount(0);
	await panel
		.locator(".ant-pagination")
		.getByTitle("2", { exact: true })
		.click();
	await expect(panel.locator(".ant-pagination-item-active")).toHaveText("2");
	await expect(panel.locator(".ant-spin-spinning")).toHaveCount(0);
	const expectedRequest = (await userRequests()).at(-1);
	if (!expectedRequest) throw new Error("Missing users query");
	expect(expectedRequest.searchParams.get("page")).toBe("2");
	expect(expectedRequest.searchParams.get("order")).toBe("asc");
	expect(expectedRequest.searchParams.has("q")).toBe(false);

	for (const entry of ["more", "context"]) {
		const count = (await userRequests()).length;
		if (entry === "more") {
			await page
				.getByRole("button", { name: "更多标签操作", exact: true })
				.click();
		} else {
			await page
				.getByRole("tab", { name: /用户管理/ })
				.click({ button: "right" });
		}
		await page.getByRole("menuitem", { name: "重新加载", exact: true }).click();
		await expect
			.poll(async () => (await userRequests()).length)
			.toBe(count + 1);
		await expect(panel.locator(".ant-spin-spinning")).toHaveCount(0);
		expect((await userRequests()).at(-1)?.href).toBe(expectedRequest.href);
	}

	for (const width of [1440, 768, 390, 1440]) {
		started = performance.now();
		await page.setViewportSize({ width, height: 900 });
		await page.evaluate(async () => {
			await new Promise<void>((resolve) =>
				requestAnimationFrame(() => resolve()),
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
		timings.resize.push(performance.now() - started);
		await expect(reload).toBeInViewport();
		const reloadBox = await reload.boundingBox();
		const fullscreenBox = await page
			.getByRole("button", { name: "全屏", exact: true })
			.boundingBox();
		if (!reloadBox || !fullscreenBox)
			throw new Error("Tab controls are missing");
		expect(reloadBox.x).toBeGreaterThanOrEqual(0);
		expect(reloadBox.x + reloadBox.width).toBeLessThanOrEqual(
			fullscreenBox.x + 1,
		);
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth,
			),
		).toBe(true);

		// Hold a real response to inspect the loading phase without adding
		// an artificial minimum duration to the application or timing samples.
		const gate = await page.evaluateHandle(() => {
			const originalFetch = window.fetch.bind(window);
			let releaseResponse!: () => void;
			const responseReady = new Promise<void>((resolve) => {
				releaseResponse = resolve;
			});
			window.fetch = async (...args) => {
				const response = await originalFetch(...args);
				const input = args[0];
				const url = new URL(
					input instanceof Request ? input.url : String(input),
					location.href,
				);
				if (url.pathname === "/api/platform/users") await responseReady;
				return response;
			};
			return {
				release: () => {
					window.fetch = originalFetch;
					releaseResponse();
				},
			};
		});
		await reload.click();
		await expect(content).toHaveAttribute("aria-busy", "true");
		await expect(content.locator(".ant-skeleton")).toBeVisible();
		await expect(form).toBeHidden();
		await expect(reload).toBeDisabled();
		await expect(page.getByRole("tab", { name: /用户管理/ })).toBeVisible();
		await page.screenshot({
			path: testInfo.outputPath(`tabs-refresh-loading-${width}.png`),
		});
		await gate.evaluate((control) => control.release());
		await gate.dispose();
		await expect(content).toHaveAttribute("aria-busy", "false");
		await expect(form).toBeVisible();
		await expect(reload).toBeEnabled();

		const count = (await userRequests()).length;
		started = performance.now();
		await reload.click();
		await expect
			.poll(async () => (await userRequests()).length)
			.toBe(count + 1);
		await expect(panel.locator(".ant-spin-spinning")).toHaveCount(0);
		await expect(content).toHaveAttribute("aria-busy", "false");
		timings.interaction.push(performance.now() - started);
		expect((await userRequests()).at(-1)?.href).toBe(expectedRequest.href);
		await expect(form.getByRole("textbox")).toHaveValue("未提交筛选");
		await expect(panel.locator(".ant-pagination-item-active")).toHaveText("2");
		await expect(usernameHeader).toHaveAttribute("aria-sort", "ascending");
		expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
		await page.screenshot({
			path: testInfo.outputPath(`tabs-refresh-${width}.png`),
			animations: "disabled",
		});

		await page.getByRole("tab", { name: "仪表盘", exact: true }).click();
		await expect(panel).toHaveCount(0);
		started = performance.now();
		await page.getByRole("tab", { name: /用户管理/ }).click();
		await expect(panel.locator("tbody tr.ant-table-row").first()).toBeVisible();
		await expect(panel.locator(".ant-spin-spinning")).toHaveCount(0);
		timings.open.push(performance.now() - started);
	}

	await page.getByRole("tab", { name: "仪表盘", exact: true }).click();
	await page.getByRole("tab", { name: /用户管理/ }).click({ button: "right" });
	await expect(
		page.getByRole("menuitem", { name: "重新加载", exact: true }),
	).toBeDisabled();
	await expect(page).toHaveURL(/\/dashboard$/);
	expect((await requests.jsonValue()).errors).toEqual([]);
	await requests.dispose();
	expect(errors).toEqual([]);
	const percentile = (values: number[], ratio: number) =>
		[...values].sort((a, b) => a - b)[Math.ceil(values.length * ratio) - 1];
	const report = Object.fromEntries(
		Object.entries(timings).map(([key, samples]) => [
			key,
			{
				samples,
				p50: percentile(samples, 0.5),
				p95: percentile(samples, 0.95),
			},
		]),
	);
	await testInfo.attach("tab-refresh-metrics", {
		body: JSON.stringify(report, null, 2),
		contentType: "application/json",
	});
	expect(Math.max(...timings.open)).toBeLessThan(5000);
	expect(report.open?.p50).toBeLessThan(1500);
	expect(report.open?.p95).toBeLessThan(3000);
	expect(Math.max(...timings.resize)).toBeLessThan(800);
	expect(report.resize?.p95).toBeLessThan(700);
	expect(Math.max(...timings.interaction)).toBeLessThan(1000);
	expect(report.interaction?.p95).toBeLessThan(800);
});
