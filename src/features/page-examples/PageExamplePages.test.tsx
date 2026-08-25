import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { i18n } from "../../i18n";
import { GenericDetailPage } from "./GenericDetailPage";
import {
	BasicListPage,
	CardListPage,
} from "./ListExamplePages";
import { FailureResultPage, SuccessResultPage } from "./ResultPages";
import {
	SearchApplicationsPage,
	SearchArticlesPage,
	SearchProjectsPage,
} from "./SearchListPages";

const mocks = vi.hoisted(() => ({ getDetail: vi.fn(), list: vi.fn() }));
vi.mock("#src/api/page-examples", () => ({
	exampleItemsQueryKey: ["example-items"],
	exampleRecordQueryKey: ["example-record"],
	getExampleRecord: mocks.getDetail,
	listExampleItems: mocks.list,
}));

const item = {
	activeUser: 108_000,
	avatar: "/pro-search/WdGqmHpayyMjiEhcKoVE.png",
	category: "category-1",
	cover: "/pro-search/uMfMFlvUuceEyPpotzlq.png",
	createdAt: "2026-08-20T00:00:00.000Z",
	description: "用于演示三种通用列表形态。",
	id: "example-1",
	like: 52,
	members: [
		{ avatar: "/pro-search/ZiESqWwCXBRQoaPONSJe.png", id: "1", name: "曲丽丽" },
	],
	message: 13,
	newUser: 1_200,
	owner: "Platform Admin",
	rate: "good" as const,
	star: 21,
	status: "active" as const,
	subDescription: "项目说明",
	title: "客户成功计划",
	updatedAt: "2026-08-24T00:00:00.000Z",
};

beforeAll(async () => i18n.changeLanguage("zh-CN"));
beforeEach(() => {
	mocks.list
		.mockReset()
		.mockResolvedValue({ items: [item], page: 1, pageSize: 10, total: 24 });
	mocks.getDetail.mockReset().mockResolvedValue({
		...item,
		activity: [],
		id: "record-001",
		participants: ["Platform Admin"],
		progress: 72,
		updatedAt: item.createdAt,
	});
});

function renderPage(page: React.ReactNode) {
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
					<MemoryRouter>{page}</MemoryRouter>
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);
}

describe("page example assets", () => {
	it("shows the official basic-list composition", async () => {
		renderPage(<BasicListPage />);
		expect(await screen.findByText("客户成功计划")).toBeVisible();
		expect(screen.getByText("我的待办")).toBeVisible();
		expect(screen.getByText("基本列表")).toBeVisible();
	});

	it("shows the official article search-list composition", async () => {
		renderPage(<SearchArticlesPage />);
		expect(await screen.findByText("客户成功计划")).toBeVisible();
		expect(screen.getByRole("tab", { name: "文章" })).toBeVisible();
		expect(screen.getByText("所属类目")).toBeVisible();
		expect(screen.getByText("只看自己的")).toBeVisible();
		expect(screen.getByRole("button", { name: "加载更多" })).toBeVisible();
	});

	it("renders the official project and application card compositions", async () => {
		const { unmount } = renderPage(<SearchProjectsPage />);
		expect(await screen.findByText("客户成功计划")).toBeVisible();
		expect(screen.getByTestId("search-project-grid")).toBeVisible();
		expect(screen.getByRole("tab", { name: "项目" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		unmount();

		renderPage(<SearchApplicationsPage />);
		expect(await screen.findByText("客户成功计划")).toBeVisible();
		expect(screen.getByText("活跃用户")).toBeVisible();
		expect(screen.getByText("新增用户")).toBeVisible();
	});

	it("shows list empty and failure states", async () => {
		mocks.list.mockResolvedValue({
			items: [],
			page: 1,
			pageSize: 10,
			total: 0,
		});
		const { unmount } = render(<div />);
		unmount();
		renderPage(<BasicListPage />);
		expect(await screen.findByText("暂无列表数据")).toBeVisible();
	});

	it("shows a retryable list failure", async () => {
		mocks.list.mockRejectedValue(new Error("offline"));
		renderPage(<BasicListPage />);
		expect(await screen.findByText("列表数据加载失败")).toBeVisible();
		expect(screen.getByRole("button", { name: /重\s*试/ })).toBeVisible();
	});

	it("renders the card grid with an add-product card", async () => {
		renderPage(<CardListPage />);
		expect(await screen.findByText("客户成功计划")).toBeVisible();
		expect(screen.getByRole("button", { name: /新增产品/ })).toBeVisible();
	});

	it("renders a generic detail record", async () => {
		renderPage(<GenericDetailPage />);
		expect(await screen.findByText("客户成功计划")).toBeVisible();
		expect(screen.getByText("72%")).toBeVisible();
	});

	it("renders both result page assets", () => {
		const { unmount } = render(
			<ConfigProvider>
				<SuccessResultPage />
			</ConfigProvider>,
		);
		expect(screen.getByText("提交成功")).toBeVisible();
		unmount();
		render(
			<ConfigProvider>
				<FailureResultPage />
			</ConfigProvider>,
		);
		expect(screen.getByText("提交失败")).toBeVisible();
	});
});
