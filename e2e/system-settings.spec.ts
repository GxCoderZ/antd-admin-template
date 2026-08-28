import { writeFile } from "node:fs/promises";
import { expect, test, type Locator, type Page } from "@playwright/test";

async function navigate(page: Page, path: string) {
	await page.evaluate((next) => {
		window.history.pushState(null, "", next);
		window.dispatchEvent(new PopStateEvent("popstate"));
	}, path);
}

async function signIn(page: Page) {
	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();
	await expect(page).toHaveURL(/\/dashboard$/);
}

async function setSwitch(page: Page, name: string, checked: boolean) {
	const control = page.getByLabel(name, { exact: true });
	if ((await control.isChecked()) !== checked) await control.click();
}

async function uploadLogo(page: Page, dataUrl: string) {
	const type = /^data:(image\/(?:png|jpeg|webp));base64,/.exec(dataUrl)?.[1];
	if (!type) throw new Error("Unexpected logo format");
	await page.locator('input[type="file"]').setInputFiles({
		name: "example-logo." + type.split("/")[1],
		mimeType: type,
		buffer: Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64"),
	});
	await expect(
		page.getByRole("img", { name: "Logo", exact: true }),
	).toHaveAttribute("src", dataUrl);
}

async function finishSettingsLayout(form: Locator) {
	await form.evaluate(async (node) => {
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
						(node.contains(target) || target.contains(node)) &&
						animation.effect?.getTiming().iterations !== Infinity
					);
				})
				.map((animation) => animation.finished),
		);
	});
}

function summarizeSettingsTimings(samples: number[]) {
	const sorted = [...samples].sort((left, right) => left - right);
	return {
		samples,
		p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
		p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
	};
}

test("system settings layout preview preserves the original and adapts across widths", async ({
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
	await signIn(page);
	await navigate(page, "/system/settings");
	const title = page.getByLabel("系统名称", { exact: true });
	const firstTab = page.getByRole("tab", { name: "基础信息", exact: true });
	const form = page.locator("form").filter({ has: title });
	await expect(title).toBeVisible();
	await finishSettingsLayout(form);
	const originalTab = await firstTab.boundingBox();
	const originalField = await title.boundingBox();
	if (!originalTab || !originalField)
		throw new Error("Missing original settings bounds");
	expect(originalField.x).toBeGreaterThan(originalTab.x);
	await page.screenshot({
		path: testInfo.outputPath("settings-original-1440.png"),
	});
	const openTimes: number[] = [];
	const resizeTimes: number[] = [];
	const interactionTimes: number[] = [];
	let desktopBounds: { x: number; width: number } | undefined;

	for (const width of [1440, 768, 390, 1440]) {
		let started = performance.now();
		await page.setViewportSize({ width, height: 900 });
		await finishSettingsLayout(form);
		resizeTimes.push(performance.now() - started);
		await navigate(page, "/dashboard");
		await expect(
			page.getByRole("heading", { name: "系统概览", exact: true }),
		).toBeVisible();
		started = performance.now();
		await navigate(page, "/system/settings?layoutPreview=integrated");
		await expect(title).toBeVisible();
		await finishSettingsLayout(form);
		openTimes.push(performance.now() - started);
		const tabBounds = await firstTab.boundingBox();
		const fieldBounds = await title.boundingBox();
		if (!tabBounds || !fieldBounds)
			throw new Error("Missing preview settings bounds");
		expect(Math.abs(tabBounds.x - fieldBounds.x)).toBeLessThanOrEqual(1);
		expect(tabBounds.y + tabBounds.height).toBeLessThan(fieldBounds.y);
		const formBounds = await form.boundingBox();
		if (!formBounds) throw new Error("Missing settings form bounds");
		const screenshot = await page.screenshot({ scale: "css" });
		const dividerReachesEdges = await page.evaluate(
			async ({ imageData, left, right, top, bottom }) => {
				const image = new Image();
				image.src = `data:image/png;base64,${imageData}`;
				await image.decode();
				const canvas = document.createElement("canvas");
				canvas.width = image.width;
				canvas.height = image.height;
				const context = canvas.getContext("2d");
				if (!context) throw new Error("Canvas is unavailable");
				context.drawImage(image, 0, 0);
				const colorAt = (x: number, y: number) =>
					Array.from(context.getImageData(x, y, 1, 1).data).join(",");
				const background = colorAt(left, top);
				for (let y = top + 1; y < bottom; y += 1) {
					const color = colorAt(left, y);
					if (
						color !== background &&
						color === colorAt(Math.round((left + right) / 2), y) &&
						color === colorAt(right, y)
					)
						return true;
				}
				return false;
			},
			{
				imageData: screenshot.toString("base64"),
				left: Math.ceil(formBounds.x) + 2,
				right: Math.floor(formBounds.x + formBounds.width) - 3,
				top: Math.ceil(tabBounds.y + tabBounds.height),
				bottom: Math.floor(fieldBounds.y),
			},
		);
		expect(
			dividerReachesEdges,
			"The tab divider must reach both card edges",
		).toBe(true);
		if (width === 1440) {
			const bounds = { x: fieldBounds.x, width: fieldBounds.width };
			if (desktopBounds) expect(bounds).toEqual(desktopBounds);
			else desktopBounds = bounds;
		}
		const originalTitle = await title.inputValue();
		await title.fill("布局预览草稿");
		for (const [section, label] of [
			["登录与安全", "登录入口"],
			["通知与公告", "消息保留天数"],
			["基础信息", "系统名称"],
		] as const) {
			started = performance.now();
			await page.getByRole("tab", { name: section, exact: true }).click();
			await expect(page.getByLabel(label, { exact: true })).toBeVisible();
			await finishSettingsLayout(form);
			interactionTimes.push(performance.now() - started);
			expect(new URL(page.url()).searchParams.get("layoutPreview")).toBe(
				"integrated",
			);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= innerWidth,
				),
			).toBe(true);
			expect(
				await form.evaluate((node) => node.scrollWidth <= node.clientWidth),
			).toBe(true);
			if (section === "基础信息") {
				await expect(title).toHaveValue("布局预览草稿");
				await title.fill(originalTitle);
			}
			await page.screenshot({
				path: testInfo.outputPath(`settings-preview-${section}-${width}.png`),
			});
		}
		const save = page.getByRole("button", { name: /保.*存/ });
		await save.scrollIntoViewIfNeeded();
		await expect(save).toBeInViewport({ ratio: 1 });
		await save.click({ trial: true });
	}
	await page.getByRole("button", { name: /保.*存/ }).click();
	await expect(page.getByText("系统设置已保存", { exact: true })).toBeVisible();
	const report = {
		open: summarizeSettingsTimings(openTimes),
		resize: summarizeSettingsTimings(resizeTimes),
		interaction: summarizeSettingsTimings(interactionTimes),
	};
	await writeFile(
		testInfo.outputPath("settings-layout-metrics.json"),
		JSON.stringify(report, null, 2),
	);
	await testInfo.attach("settings-layout-metrics", {
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

for (const width of [1440, 390]) {
	test(`system settings save and brand propagation at ${width}px`, async ({
		page,
	}, testInfo) => {
		await page.setViewportSize({ width, height: 900 });
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		await page.goto("/login");
		await signIn(page);
		await navigate(page, "/system/settings");
		await expect(page.getByLabel("系统名称", { exact: true })).toBeVisible();
		const original = new Map<string, string>();
		for (const label of [
			"系统名称",
			"系统简称",
			"浏览器标题",
			"版权信息",
			"维护提示文案",
			"密码最小长度",
			"消息保留天数",
		]) {
			original.set(
				label,
				await page.getByLabel(label, { exact: true }).inputValue(),
			);
		}
		const maintenance = await page
			.getByLabel("维护模式", { exact: true })
			.isChecked();
		const inbox = await page
			.getByLabel("站内通知", { exact: true })
			.isChecked();
		const reminder = await page
			.getByLabel("未读消息提醒", { exact: true })
			.isChecked();
		const logoImage = page.getByRole("img", { name: "Logo", exact: true });
		const originalLogo = (await logoImage.count())
			? await logoImage.getAttribute("src")
			: null;
		const restoreFields = async (labels: string[]) => {
			for (const label of labels) {
				const value = original.get(label);
				if (value === undefined) throw new Error("Missing original " + label);
				await page.getByLabel(label, { exact: true }).fill(value);
			}
		};

		try {
			await expect(
				page.getByRole("tab", { name: "界面偏好", exact: true }),
			).toHaveCount(0);
			await page.screenshot({
				path: testInfo.outputPath(`settings-general-${width}.png`),
				animations: "disabled",
			});
			await page.getByLabel("系统名称", { exact: true }).fill("示例管理中心");
			await page.getByLabel("系统简称", { exact: true }).fill("示例后台");
			await page.getByLabel("浏览器标题", { exact: true }).fill("示例控制台");
			await page
				.getByLabel("版权信息", { exact: true })
				.fill("Copyright 2026 Example");
			const logo = await page.evaluate(() => {
				const canvas = document.createElement("canvas");
				canvas.width = 48;
				canvas.height = 48;
				const context = canvas.getContext("2d");
				if (!context) throw new Error("Canvas is unavailable");
				context.fillStyle = "steelblue";
				context.fillRect(0, 0, 48, 48);
				return canvas.toDataURL("image/png");
			});
			await uploadLogo(page, logo);
			await page.getByRole("tab", { name: "登录与安全", exact: true }).click();
			await expect(page).toHaveURL(/section=security/);
			await setSwitch(page, "维护模式", true);
			await page
				.getByLabel("维护提示文案", { exact: true })
				.fill("演示维护提示");
			await page.getByLabel("预计恢复时间", { exact: true }).click();
			const datePopup = page.locator(".ant-picker-dropdown:visible");
			await expect(datePopup).toBeVisible();
			const popupBounds = await datePopup.boundingBox();
			expect(popupBounds).not.toBeNull();
			if (!popupBounds) throw new Error("Missing date popup bounds");
			expect(popupBounds.x).toBeGreaterThanOrEqual(0);
			expect(popupBounds.x + popupBounds.width).toBeLessThanOrEqual(width);
			await page.screenshot({
				path: testInfo.outputPath(`settings-date-${width}.png`),
				animations: "disabled",
			});
			await page.keyboard.press("Escape");
			await page.getByLabel("密码最小长度", { exact: true }).fill("12");
			await page.screenshot({
				path: testInfo.outputPath(`settings-security-${width}.png`),
				animations: "disabled",
			});
			await page
				.getByRole("button", { name: /保.*存/ })
				.scrollIntoViewIfNeeded();
			await page.screenshot({
				path: testInfo.outputPath(`settings-security-bottom-${width}.png`),
				animations: "disabled",
			});
			await page.getByRole("tab", { name: "通知与公告", exact: true }).click();
			await setSwitch(page, "站内通知", true);
			await page.getByLabel("消息保留天数", { exact: true }).fill("30");
			await setSwitch(page, "未读消息提醒", false);
			await page.screenshot({
				path: testInfo.outputPath(`settings-notifications-${width}.png`),
				animations: "disabled",
			});
			await page.getByRole("button", { name: /保.*存/ }).click();
			await expect(
				page.getByText("系统设置已保存", { exact: true }),
			).toBeVisible();
			await expect(page).toHaveTitle("示例控制台");
			if (width === 1440) {
				await expect(
					page.getByTestId("admin-shell-sidebar-logo"),
				).toContainText("示例管理中心");
				const renderedLogo = page
					.getByTestId("admin-shell-sidebar-logo")
					.locator("img");
				await expect(renderedLogo).toHaveAttribute("src", logo);
				expect(
					await renderedLogo.evaluate(
						(element: HTMLImageElement) =>
							element.complete && element.naturalWidth > 0,
					),
				).toBe(true);
			}
			await navigate(page, "/dashboard");
			await navigate(page, "/system/settings?section=security");
			await expect(
				page.getByLabel("密码最小长度", { exact: true }),
			).toHaveValue("12");
			await expect(
				page.getByRole("switch", { name: "维护模式", exact: true }),
			).toBeChecked();
			await page.getByRole("tab", { name: "基础信息", exact: true }).click();
			await expect(page.getByLabel("系统名称", { exact: true })).toHaveValue(
				"示例管理中心",
			);
			expect(
				await page.evaluate(
					() => document.documentElement.scrollWidth <= window.innerWidth,
				),
			).toBe(true);
			expect(
				await page
					.getByTestId("admin-shell-page-content")
					.evaluate((element) => element.scrollWidth <= element.clientWidth),
			).toBe(true);
			await page
				.getByRole("button", { name: "Platform Admin", exact: true })
				.click();
			await page.getByRole("menuitem", { name: "退出", exact: true }).click();
			await expect(page).toHaveURL(/\/login$/);
			await expect(
				page.getByRole("heading", { name: "示例管理中心", exact: true }),
			).toBeVisible();
			await expect(
				page.getByText("Copyright 2026 Example", { exact: true }),
			).toBeVisible();
			await expect(page).toHaveTitle("示例控制台");
			await page.screenshot({
				path: testInfo.outputPath(`settings-login-${width}.png`),
				animations: "disabled",
			});
			if (width === 390) {
				await page.setViewportSize({ width, height: 844 });
				await signIn(page);
				await navigate(page, "/system/settings");
				const longName = "系统".repeat(32);
				const longCopyright = "版权".repeat(64);
				await page.getByLabel("系统名称", { exact: true }).fill(longName);
				await page.getByLabel("版权信息", { exact: true }).fill(longCopyright);
				await page.getByRole("button", { name: /保.*存/ }).click();
				await expect(
					page.getByText("系统设置已保存", { exact: true }),
				).toBeVisible();
				await page
					.getByRole("button", { name: "Platform Admin", exact: true })
					.click();
				await page.getByRole("menuitem", { name: "退出", exact: true }).click();
				await expect(
					page.getByRole("heading", { name: longName, exact: true }),
				).toBeVisible();
				const card = await page.locator(".ant-card").boundingBox();
				const footer = await page
					.getByText(longCopyright, { exact: true })
					.boundingBox();
				if (!card || !footer) throw new Error("Missing login layout bounds");
				expect(footer.y).toBeGreaterThanOrEqual(card.y + card.height);
				expect(
					await page.evaluate(
						() => document.documentElement.scrollWidth <= innerWidth,
					),
				).toBe(true);
				await page.screenshot({
					path: testInfo.outputPath("settings-long-brand-390.png"),
					fullPage: true,
					animations: "disabled",
				});
			}
			expect(errors).toEqual([]);
		} finally {
			if (new URL(page.url()).pathname === "/login") await signIn(page);
			await page.keyboard.press("Escape");
			await navigate(page, "/system/settings");
			await restoreFields(["系统名称", "系统简称", "浏览器标题", "版权信息"]);
			if (originalLogo) await uploadLogo(page, originalLogo);
			else if (
				await page
					.getByRole("button", { name: "恢复默认", exact: true })
					.count()
			)
				await page
					.getByRole("button", { name: "恢复默认", exact: true })
					.click();
			await page.getByRole("tab", { name: "登录与安全", exact: true }).click();
			await setSwitch(page, "维护模式", true);
			await restoreFields(["维护提示文案", "密码最小长度"]);
			await setSwitch(page, "维护模式", maintenance);
			await page.getByRole("tab", { name: "通知与公告", exact: true }).click();
			await setSwitch(page, "站内通知", true);
			await setSwitch(page, "未读消息提醒", reminder);
			await setSwitch(page, "站内通知", inbox);
			await restoreFields(["消息保留天数"]);
			await page.getByRole("button", { name: /保.*存/ }).click();
			await expect(
				page.getByText("系统设置已保存", { exact: true }),
			).toBeVisible();
		}
	});
}
