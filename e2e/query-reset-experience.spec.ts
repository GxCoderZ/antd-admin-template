import { expect, test, type Locator } from "@playwright/test";

const queries = [
	{ path: "/organization/users", formId: "admin-users-query-form" },
	{ path: "/access/roles", formId: "admin-roles-query-form" },
	{ path: "/organization/departments", formId: "admin-departments-query-form" },
	{ path: "/organization/positions", formId: "admin-positions-query-form" },
	{
		path: "/system/dictionaries",
		formId: "admin-dictionaries-type-query-form",
	},
	{
		path: "/system/dictionaries",
		formId: "admin-dictionaries-item-query-form",
	},
	{ path: "/system/announcements", formId: "admin-announcements-query-form" },
	{ path: "/operations/audit-logs", formId: "audit-log-query-form" },
	{ path: "/operations/login-logs", formId: "login-log-query-form" },
];

function summarize(samples: number[]) {
	const sorted = [...samples].sort((a, b) => a - b);
	return {
		samples,
		p50: sorted[Math.ceil(sorted.length * 0.5) - 1]!,
		p95: sorted[Math.ceil(sorted.length * 0.95) - 1]!,
	};
}

async function finishLayout(surface: Locator) {
	await surface.evaluate(async (node) => {
		// rc-motion activates transitions after React and ResizeObserver have rendered.
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
						// Button waves fade for 2s but do not change control layout or availability.
						animation instanceof CSSTransition &&
						/^(width|height|min-|max-|margin|padding|flex|grid|inset|left|right|top|bottom|transform)/.test(
							animation.transitionProperty,
						) &&
						target instanceof Element &&
						(target.contains(node) || node.contains(target)) &&
						animation.effect?.getTiming().iterations !== Infinity
					);
				})
				.map((animation) => animation.finished),
		);
	});
}

for (const entry of queries) {
	test(`${entry.formId} reset stays usable across viewport changes`, async ({
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
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto("/login");
		await page.locator('input[autocomplete="username"]').fill("admin");
		await page.locator('input[autocomplete="current-password"]').fill("admin");
		await page.locator('button[type="submit"]').click();
		await expect(page.getByRole("heading", { name: "系统概览" })).toBeVisible();
		const opened = performance.now();
		await page.evaluate((path) => {
			history.pushState(null, "", path);
			dispatchEvent(new PopStateEvent("popstate"));
		}, entry.path);
		if (entry.formId === "admin-dictionaries-item-query-form")
			await page.getByRole("tab", { name: "字典项", exact: true }).click();
		const form = page.getByTestId(entry.formId);
		const reset = form.getByRole("button", { name: /重\s*置/ });
		const submit = form.getByRole("button", { name: /查\s*询/ });
		await expect(reset).toBeVisible();
		await expect(page.locator(".ant-spin-spinning")).toHaveCount(0);
		await finishLayout(form);
		const openTimes = [performance.now() - opened];
		const resizeTimes: number[] = [];
		const interactionTimes: number[] = [];
		let desktopBox;
		for (const [index, width] of [1440, 768, 390, 1440].entries()) {
			const resizing = performance.now();
			await page.setViewportSize({ width, height: 900 });
			await finishLayout(form);
			// Compare the same scroll position; resizing preserves the focused action's scroll anchor.
			await page.locator(".admin-shell-scroll-content").evaluate((node) => {
				node.scrollTop = 0;
			});
			await expect(reset).toBeInViewport({ ratio: 1 });
			await expect(submit).toBeInViewport({ ratio: 1 });
			resizeTimes.push(performance.now() - resizing);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
			const resetBox = await reset.boundingBox();
			const submitBox = await submit.boundingBox();
			if (!resetBox || !submitBox)
				throw new Error("Query actions must have visible bounds");
			expect(resetBox.x + resetBox.width).toBeLessThanOrEqual(submitBox.x);
			if (width === 1440) {
				if (desktopBox) expect(resetBox).toEqual(desktopBox);
				else desktopBox = resetBox;
			}
			const clicking = performance.now();
			await reset.click();
			if (index === 0) {
				await expect(page.locator(".ant-spin-spinning")).toHaveCount(1);
				await expect(page.locator(".ant-spin-spinning")).toHaveCount(0);
			}
			await reset.click();
			await expect(reset).toBeEnabled();
			expect(await page.locator(".ant-spin-spinning").count()).toBe(0);
			interactionTimes.push(performance.now() - clicking);
			await page.screenshot({
				path: testInfo.outputPath(`reset-${width}.png`),
			});
		}
		const report = {
			open: summarize(openTimes),
			resize: summarize(resizeTimes),
			interaction: summarize(interactionTimes),
		};
		await testInfo.attach("query-reset-metrics", {
			body: JSON.stringify(report, null, 2),
			contentType: "application/json",
		});
		console.log(entry.formId, JSON.stringify(report));
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
