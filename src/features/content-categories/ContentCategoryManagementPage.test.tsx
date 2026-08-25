import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { i18n } from "../../i18n";
import { ContentCategoryManagementPage } from "./ContentCategoryManagementPage";

const mocks = vi.hoisted(() => ({
	createCategory: vi.fn(),
	createItem: vi.fn(),
	deleteCategory: vi.fn(),
	deleteItem: vi.fn(),
	listCategories: vi.fn(),
	listItems: vi.fn(),
	updateCategory: vi.fn(),
	updateItem: vi.fn(),
}));

vi.mock("#src/api/content-categories", () => ({
	contentCategoriesQueryKey: ["content-categories"],
	contentCategoryItemsQueryKey: ["content-category-items"],
	createContentCategory: mocks.createCategory,
	createContentCategoryItem: mocks.createItem,
	deleteContentCategory: mocks.deleteCategory,
	deleteContentCategoryItem: mocks.deleteItem,
	listContentCategories: mocks.listCategories,
	listContentCategoryItems: mocks.listItems,
	updateContentCategory: mocks.updateCategory,
	updateContentCategoryItem: mocks.updateItem,
}));

beforeAll(async () => i18n.changeLanguage("zh-CN"));
beforeEach(() => {
	mocks.listCategories.mockReset().mockResolvedValue([
		{
			children: [
				{
					children: [],
					code: "guides",
					id: "category-guides",
					itemCount: 8,
					name: "使用指南",
					parentId: "category-content",
					sortOrder: 1,
					status: "active",
				},
			],
			code: "content",
			id: "category-content",
			itemCount: 0,
			name: "内容中心",
			parentId: null,
			sortOrder: 1,
			status: "active",
		},
	]);
	mocks.listItems.mockReset().mockResolvedValue({
		items: [
			{
				categoryId: "category-content",
				categoryName: "内容中心",
				id: "content-1",
				owner: "Platform Admin",
				status: "published",
				title: "平台使用手册",
				updatedAt: "2026-08-26T00:00:00.000Z",
			},
		],
		page: 1,
		pageSize: 10,
		total: 1,
	});
});

function renderPage() {
	const client = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<ConfigProvider>
			<LocalePreferencesProvider
				value={{
					currency: "CNY",
					language: "zh-CN",
					onChangeCurrency: vi.fn(),
					onChangeTimeZone: vi.fn(),
					timeZone: "Asia/Shanghai",
				}}
			>
				<QueryClientProvider client={client}>
					<MemoryRouter>
						<ContentCategoryManagementPage />
					</MemoryRouter>
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);
}

describe("content category management template", () => {
	it("combines a category tree with the standard content table", async () => {
		renderPage();
		expect((await screen.findAllByText("内容中心")).length).toBeGreaterThan(0);
		expect(await screen.findByText("平台使用手册")).toBeVisible();
		expect(screen.getByText("分类结构")).toBeVisible();
		expect(screen.getByText("内容列表")).toBeVisible();
	});

	it("opens independent category and content create flows", async () => {
		renderPage();
		fireEvent.click(await screen.findByRole("button", { name: "新建分类" }));
		expect(await screen.findByText("新建分类", { selector: ".ant-drawer-title" })).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Close" }));
		fireEvent.click(await screen.findByRole("button", { name: "新建内容" }));
		expect(await screen.findByText("新建内容", { selector: ".ant-drawer-title" })).toBeVisible();
	});
});
