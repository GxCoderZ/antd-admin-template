import { expect, test, type Page } from "@playwright/test";

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
