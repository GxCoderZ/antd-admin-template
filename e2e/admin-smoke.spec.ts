import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page) {
	await page.goto("/login");

	await page.locator('input[autocomplete="username"]').fill("admin");
	await page.locator('input[autocomplete="current-password"]').fill("admin");
	await page.locator('button[type="submit"]').click();

	await expect(page).toHaveURL(/\/dashboard$/);
}

async function showTableActions(page: Page) {
	await page
		.locator(".ant-table-content")
		.last()
		.evaluate((element) => {
			element.scrollLeft = element.scrollWidth;
		});
}

async function navigateWithinAdmin(page: Page, path: string) {
	await page.evaluate((nextPath) => {
		window.history.pushState(null, "", nextPath);
		window.dispatchEvent(new PopStateEvent("popstate"));
	}, path);
}

test("Fake 登录后可以查看关于系统信息", async ({ page }) => {
	await signIn(page);
	const currentUserButton = page.getByRole("button", {
		name: "Platform Admin",
	});
	await expect(currentUserButton.locator(".ant-avatar img")).toHaveCount(0);
	await expect(currentUserButton.locator(".anticon-user")).toBeVisible();
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "关于系统", exact: true }).click();
	await expect(page).toHaveURL(/\/system\/about$/);

	await expect(page.getByTestId("about-runtime-service")).toBeVisible();
	await expect(
		page.getByTestId("about-technology-item-Cloudflare Pages / GitHub"),
	).toBeVisible();
	await expect(
		page.getByTestId("about-technology-item-Playwright"),
	).toBeVisible();
	await expect(page.getByTestId("about-technology-item-Knip")).toBeVisible();
});

test("页面标签支持右键菜单关闭目标标签", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	await expect(page).toHaveURL(/\/organization\/users$/);

	const usersTab = page.getByRole("tab", { name: /用户管理/ });
	await usersTab.click({ button: "right" });

	const closeCurrent = page.getByRole("menuitem", {
		name: "关闭当前标签页",
	});
	await expect(closeCurrent).toBeVisible();
	await closeCurrent.click();

	await expect(page).toHaveURL(/\/dashboard$/);
	await expect(usersTab).toHaveCount(0);
});

test("用户管理查询栏在窄屏下自适应收起", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);

	await page.getByRole("button", { name: "打开菜单" }).click();
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	await expect(page).toHaveURL(/\/organization\/users$/);

	const statusFilter = page.getByRole("combobox", { name: "状态" });
	await expect(statusFilter).toHaveCount(0);
	await page.getByText("展开", { exact: true }).click();
	await expect(statusFilter).toBeVisible();
});

test("角色管理支持查询、分页和标准表格工具", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "角色管理", exact: true }).click();
	await expect(page).toHaveURL(/\/access\/roles$/);

	await expect(page.getByPlaceholder("搜索角色名称或标识")).toBeVisible();
	for (const actionName of ["刷新", "表格密度", "列设置", "表格全屏"]) {
		await expect(page.getByRole("button", { name: actionName })).toBeVisible();
	}
	await expect(page.getByRole("button", { name: "right" })).toBeEnabled();

	await page.getByPlaceholder("搜索角色名称或标识").fill("只读审计员");
	await page.getByRole("button", { name: /查\s*询/ }).click();
	await expect(page.getByRole("table")).toContainText("只读审计员");
	await expect(page.getByRole("table")).not.toContainText("平台管理员");

	await page.getByPlaceholder("搜索角色名称或标识").clear();
	await page.getByRole("button", { name: /查\s*询/ }).click();
	await showTableActions(page);
	await page
		.getByRole("row")
		.filter({ hasText: "资产审核员" })
		.getByRole("button", { name: "更多", exact: true })
		.click();
	await page.getByRole("menuitem", { name: "权限配置" }).click();
	const permissionDrawer = page
		.locator(".ant-drawer")
		.filter({ hasText: "平台权限" });
	await expect(
		permissionDrawer.getByRole("searchbox", { name: "搜索权限" }),
	).toBeVisible();
	await expect(permissionDrawer.getByText("系统管理菜单")).toBeVisible();
	await expect(permissionDrawer.getByText("用户管理页面")).toBeVisible();
	await expect(permissionDrawer.getByText(/已选 \d+\/10 项/)).toBeVisible();
	await expect(
		permissionDrawer.getByRole("button", { name: /保\s*存/ }),
	).toBeVisible();
	await permissionDrawer.getByRole("button", { name: /取\s*消/ }).click();
});

test("数据表按操作数量展示主要操作或更多菜单", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "编辑" }).first(),
	).toBeVisible();
	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await expect(
		page.getByRole("menuitem", { name: "角色", exact: true }),
	).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("menuitem", { name: "角色管理", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "编辑" }).first(),
	).toBeVisible();
	await showTableActions(page);
	await page
		.getByRole("row")
		.filter({ hasText: "资产审核员" })
		.getByRole("button", { name: "更多", exact: true })
		.click();
	await expect(page.getByRole("menuitem", { name: "权限配置" })).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("menuitem", { name: "公告管理", exact: true }).click();
	await expect(
		page.getByRole("button", { name: "编辑" }).first(),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "删除" }).first(),
	).toBeVisible();

	await page.getByRole("menuitem", { name: "审计日志", exact: true }).click();
	await page.getByRole("menuitem", { name: "操作审计", exact: true }).click();
	await expect(
		page.getByRole("button", { name: /查看日志/ }).first(),
	).toBeVisible();
	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await expect(
		page.getByRole("menuitem", { name: "复制日志 ID" }),
	).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("menuitem", { name: "登录日志", exact: true }).click();
	await expect(
		page.getByRole("button", { name: /查看日志/ }).first(),
	).toBeVisible();
	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await expect(
		page.getByRole("menuitem", { name: "复制 IP 地址" }),
	).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "关于系统", exact: true }).click();
	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await expect(page.getByRole("menuitem", { name: "复制包名" })).toBeVisible();
});

test("用户管理角色抽屉通过草稿选择统一保存", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	await expect(page).toHaveURL(/\/organization\/users$/);
	await page
		.getByPlaceholder("搜索用户名、显示名称、邮箱或手机号")
		.fill("admin");
	await page.getByRole("button", { name: /查\s*询/ }).click();
	await expect(page.getByRole("table")).toContainText("admin");

	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await page.getByRole("menuitem", { name: "角色", exact: true }).click();

	const drawer = page
		.locator(".ant-drawer")
		.filter({ hasText: "admin 的角色" });
	await expect(
		drawer.getByRole("combobox", { name: "角色选择" }),
	).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth));
	await drawer.getByRole("combobox", { name: "角色选择" }).fill("auditor");
	await page.getByRole("option", { name: /只读审计员/ }).click();
	await expect(drawer.getByText("新增角色")).toBeVisible();
	await expect(drawer.getByText("只读审计员").first()).toBeVisible();
	await drawer.getByRole("button", { name: /保\s*存/ }).click();
	await expect(drawer.getByText("暂无未保存变更")).toBeVisible();
	await expect(page.getByRole("table")).toContainText("只读审计员");
});

test("用户管理角色抽屉在 390px 窄屏下不溢出", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);

	await page.getByRole("button", { name: "打开菜单" }).click();
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "用户管理", exact: true }).click();
	await expect(page).toHaveURL(/\/organization\/users$/);
	await page
		.getByPlaceholder("搜索用户名、显示名称、邮箱或手机号")
		.fill("admin");
	await page.getByRole("button", { name: /查\s*询/ }).click();
	await expect(page.getByRole("table")).toContainText("admin");

	await page.getByRole("button", { name: "更多", exact: true }).first().click();
	await page.getByRole("menuitem", { name: "角色", exact: true }).click();

	const drawer = page
		.locator(".ant-drawer")
		.filter({ hasText: "admin 的角色" })
		.locator(".ant-drawer-content-wrapper");
	await expect(drawer).toBeVisible();
	const drawerBounds = await drawer.boundingBox();
	expect(drawerBounds?.width).toBeLessThanOrEqual(390);
	await expect(page.getByRole("combobox", { name: "角色选择" })).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(390);
});

test("表单示例通过 Fake API 完成基础与分步提交", async ({ page }) => {
	await signIn(page);

	await navigateWithinAdmin(page, "/examples/forms/basic");
	await expect(page).toHaveURL(/\/examples\/forms\/basic$/);
	await page.getByLabel("标题").fill("端到端客户目标");
	await page.getByPlaceholder("开始日期").fill("2026-09-01");
	await page.getByPlaceholder("结束日期").fill("2026-09-30");
	await page.getByLabel("目标描述").fill("提升重点客户满意度。");
	await page.getByLabel("衡量标准").fill("满意度达到 95%。");
	await page.getByRole("button", { name: /提\s*交/ }).click();
	await expect(page.getByText("提交成功", { exact: true })).toBeVisible();

	await navigateWithinAdmin(page, "/examples/forms/step");
	await expect(page).toHaveURL(/\/examples\/forms\/step$/);
	await page.getByRole("button", { name: "下一步" }).click();
	await expect(
		page.getByText("test@example.com", { exact: true }),
	).toBeVisible();
	await page.getByLabel("支付密码").fill("123456");
	await page.getByRole("button", { name: /提\s*交/ }).click();
	await expect(page.getByText("操作成功", { exact: true })).toBeVisible();

	await navigateWithinAdmin(page, "/examples/forms/advanced");
	await expect(page).toHaveURL(/\/examples\/forms\/advanced$/);
	await expect(
		page.getByRole("heading", { name: "基础信息", exact: true }),
	).toBeVisible();
	await page.getByLabel("项目编码").fill("E2E-ADVANCED-1");
	await page.getByRole("button", { name: "保存草稿" }).click();
	await expect(page.getByText("草稿已保存").first()).toBeVisible();
	await page.getByRole("button", { name: /提\s*交/ }).click();
	await expect(page.getByText("正式提交成功").first()).toBeVisible();
});

test("表单示例在窄屏下保持完整可用", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);

	await navigateWithinAdmin(page, "/examples/forms/basic");
	await expect(page).toHaveURL(/\/examples\/forms\/basic$/);
	await expect(page.getByLabel("标题")).toBeVisible();
	await expect(page.getByRole("button", { name: /提\s*交/ })).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(390);

	await navigateWithinAdmin(page, "/examples/forms/step");
	await expect(page).toHaveURL(/\/examples\/forms\/step$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "分步表单" }),
	).toBeVisible();
	await expect(page.getByLabel("收款账户")).toBeVisible();
	await expect(page.getByRole("button", { name: "下一步" })).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(390);

	await navigateWithinAdmin(page, "/examples/forms/advanced");
	await expect(page).toHaveURL(/\/examples\/forms\/advanced$/);
	await expect(
		page.getByRole("heading", { level: 1, name: "高级表单" }),
	).toBeVisible();
	await expect(page.getByLabel("项目名称")).toBeVisible();
	await expect(page.getByRole("button", { name: "保存草稿" })).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(390);
});

test("公告管理支持通过 Fake API 新建并查询公告", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "公告管理", exact: true }).click();
	await expect(page).toHaveURL(/\/system\/announcements$/);
	await expect(page.getByRole("table")).toContainText("系统维护通知");
	for (const actionName of ["刷新", "表格密度", "表格设置", "表格全屏"]) {
		await expect(page.getByRole("button", { name: actionName })).toBeVisible();
	}
	await page.getByRole("button", { name: "表格设置" }).click();
	await expect(page.getByText("列展示", { exact: true })).toBeVisible();
	await page.keyboard.press("Escape");

	await page.getByRole("button", { name: "新建公告" }).click();
	const drawer = page.locator(".ant-drawer").filter({ hasText: "新建公告" });
	await drawer.getByLabel("公告标题").fill("端到端公告演示");
	await drawer.getByLabel("公告内容").fill("验证公告创建和查询流程。");
	await drawer.getByRole("button", { name: /保\s*存/ }).click();
	await expect(drawer).toBeHidden();

	await page.getByPlaceholder("搜索公告标题").fill("端到端公告演示");
	await page.getByRole("button", { name: /查\s*询/ }).click();
	await expect(page.getByText("端到端公告演示", { exact: true })).toBeVisible();
});

test("公告管理在窄屏下保持可导航和可编辑", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);

	await page.getByRole("button", { name: "打开菜单" }).click();
	await page.getByRole("menuitem", { name: "系统管理", exact: true }).click();
	await page.getByRole("menuitem", { name: "公告管理", exact: true }).click();
	await expect(page).toHaveURL(/\/system\/announcements$/);
	await expect(page.getByRole("button", { name: "新建公告" })).toBeVisible();
	const statusFilter = page.getByRole("combobox", { name: "发布状态" });
	await expect(statusFilter).toHaveCount(0);
	await page.getByText("展开", { exact: true }).click();
	await expect(statusFilter).toBeVisible();

	await page.getByRole("button", { name: "新建公告" }).click();
	const drawer = page
		.locator(".ant-drawer")
		.filter({ hasText: "新建公告" })
		.locator(".ant-drawer-content-wrapper");
	await expect(drawer).toBeVisible();
	const drawerBounds = await drawer.boundingBox();
	expect(drawerBounds?.width).toBeLessThanOrEqual(390);
});

test("站内通知中心支持未读筛选和已读 Mutation", async ({ page }) => {
	await signIn(page);

	await page.getByRole("button", { name: "Platform Admin" }).click();
	await page.getByRole("menuitem", { name: "通知中心" }).click();
	await expect(page).toHaveURL(/\/account\/notifications$/);
	await expect(page.getByRole("heading", { name: "通知中心" })).toBeVisible();
	const markReadButtons = page.getByRole("button", { name: "标记已读" });
	await expect(markReadButtons.first()).toBeVisible();
	const unreadCount = await markReadButtons.count();
	await markReadButtons.first().click();
	await expect(markReadButtons).toHaveCount(unreadCount - 1);
	await page.getByText("未读", { exact: true }).click();
	await expect(page.getByText("暂无站内通知")).toHaveCount(0);
	await page.getByRole("button", { name: /全部已读/ }).click();
	await expect(page.getByText("暂无站内通知")).toBeVisible();
});

test("页面示例按官方 Ant Design Pro 页面结构提供搜索列表", async ({ page }) => {
	await signIn(page);

	await page.getByRole("menuitem", { name: "页面示例", exact: true }).click();
	await page.getByRole("menuitem", { name: "列表示例", exact: true }).click();
	await page.getByRole("menuitem", { name: "标准列表", exact: true }).click();
	await expect(page).toHaveURL(/\/examples\/lists\/basic$/);
	await expect(page.getByText("我的待办", { exact: true })).toBeVisible();
	await expect(page.getByText("基本列表", { exact: true })).toBeVisible();

	await page.getByRole("menuitem", { name: "卡片列表", exact: true }).click();
	await expect(page).toHaveURL(/\/examples\/lists\/cards$/);
	await expect(page.getByRole("button", { name: /新增产品/ })).toBeVisible();

	await page.getByRole("menuitem", { name: "搜索列表", exact: true }).click();
	await page.getByRole("menuitem", { name: "文章", exact: true }).click();
	await expect(page).toHaveURL(/\/examples\/lists\/search\/articles$/);
	const searchContent = page.getByTestId("admin-shell-page-content");
	await expect(
		searchContent.getByRole("tab", { name: "文章" }),
	).toHaveAttribute("aria-selected", "true");
	await expect(page.getByText("所属类目", { exact: true })).toBeVisible();

	await searchContent.getByRole("tab", { name: "项目" }).click();
	await expect(page).toHaveURL(/\/examples\/lists\/search\/projects$/);
	await expect(page.getByTestId("search-project-grid")).toBeVisible();

	await searchContent.getByRole("tab", { name: "应用" }).click();
	await expect(page).toHaveURL(/\/examples\/lists\/search\/applications$/);
	await expect(page.getByText("活跃用户").first()).toBeVisible();

	await page.getByRole("menuitem", { name: "通用详情页", exact: true }).click();
	await expect(page.getByText("记录摘要", { exact: true })).toBeVisible();
	await expect(page.getByText("处理进度", { exact: true })).toBeVisible();

	await page.getByRole("menuitem", { name: "结果页", exact: true }).click();
	await page.getByRole("menuitem", { name: "成功结果页", exact: true }).click();
	await expect(page).toHaveURL(/\/result\/success$/);
	await expect(page.getByText("提交成功", { exact: true })).toBeVisible();

	await page.getByRole("menuitem", { name: "异常页", exact: true }).click();
	await page.getByRole("menuitem", { name: "403", exact: true }).click();
	await expect(page).toHaveURL(/\/exception\/403$/);
	await expect(
		page.getByTestId("admin-shell-page-content").getByText("403", {
			exact: true,
		}),
	).toBeVisible();
});

test("搜索列表在窄屏下保持完整且无页面级横向溢出", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);
	await page.getByRole("button", { name: "打开菜单" }).click();
	await page.getByRole("menuitem", { name: "页面示例", exact: true }).click();
	await page.getByRole("menuitem", { name: "列表示例", exact: true }).click();
	await page.getByRole("menuitem", { name: "搜索列表", exact: true }).click();
	await page.getByRole("menuitem", { name: "文章", exact: true }).click();

	await expect(
		page
			.getByTestId("admin-shell-page-content")
			.getByRole("tab", { name: "文章" }),
	).toBeVisible();
	await expect(page.getByText("所属类目", { exact: true })).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(390);
});

test("Fake 文件管理支持搜索、上传和删除且窄屏不溢出", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);

	await page.getByRole("button", { name: "打开菜单" }).click();
	await page.getByRole("menuitem", { name: "页面示例", exact: true }).click();
	await page.getByRole("menuitem", { name: "文件管理", exact: true }).click();
	await expect(page).toHaveURL(/\/examples\/files$/);
	await expect(page.getByText("Fake 文件列表", { exact: true })).toBeVisible();
	await expect(page.getByText("文件类型", { exact: true })).toHaveCount(0);
	await page.getByText("展开", { exact: true }).click();
	await expect(page.getByRole("combobox", { name: "文件类型" })).toBeVisible();

	await page.locator('input[type="file"]').setInputFiles({
		buffer: Buffer.from("fake-only demo"),
		mimeType: "text/plain",
		name: "端到端验收.txt",
	});
	await expect(page.getByText("Fake 文件已上传")).toBeVisible();
	await page.getByPlaceholder("搜索文件名").fill("端到端验收");
	await page.getByRole("button", { name: /查\s*询/ }).click();
	await expect(page.getByRole("table")).toContainText("端到端验收.txt");
	const uploadedRow = page
		.getByRole("row")
		.filter({ hasText: "端到端验收.txt" });
	await uploadedRow.getByRole("button", { name: /删除/ }).click();
	await page.getByRole("button", { name: /确认删除/ }).click();
	await expect(page.getByText("暂无文件")).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(390);
});

test("批量操作表格支持选择、导出、状态修改和删除确认", async ({ page }) => {
	await page.setViewportSize({ height: 844, width: 390 });
	await signIn(page);

	await page.getByRole("button", { name: "打开菜单" }).click();
	await page.getByRole("menuitem", { name: "页面示例", exact: true }).click();
	await page.getByRole("menuitem", { name: "列表示例", exact: true }).click();
	await page
		.getByRole("menuitem", { name: "批量操作表格", exact: true })
		.click();
	await expect(page).toHaveURL(/\/examples\/lists\/batch-operations$/);
	await expect(page.getByText("批量操作表格", { exact: true })).toBeVisible();
	await expect(page.getByText("已选择 0 项")).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(390);

	await page.getByRole("checkbox", { name: "Select row 1", exact: true }).click();
	await page.getByRole("checkbox", { name: "Select row 2", exact: true }).click();
	await expect(page.getByText("已选择 2 项")).toBeVisible();

	await page.getByRole("button", { name: "批量导出" }).click();
	await expect(page.getByText(/已生成 2 项导出/)).toBeVisible();
	await page.getByRole("button", { name: "批量停用" }).click();
	await expect(page.getByText("已选择 0 项")).toBeVisible();

	await page.getByRole("checkbox", { name: "Select row 1", exact: true }).click();
	await page.getByRole("button", { name: "批量删除" }).click();
	await expect(page.getByText("确认批量删除")).toBeVisible();
	await page.getByRole("button", { name: "确认删除" }).click();
	await expect(page.getByText("已删除 1 项记录")).toBeVisible();
	expect(
		await page.evaluate(() => document.documentElement.scrollWidth),
	).toBeLessThanOrEqual(390);
});
