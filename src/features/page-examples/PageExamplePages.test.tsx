import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { i18n } from "../../i18n";
import { GenericDetailPage } from "./GenericDetailPage";
import {
	BasicListPage,
	CardListPage,
	SearchListPage,
} from "./ListExamplePages";
import { FailureResultPage, SuccessResultPage } from "./ResultPages";

const mocks = vi.hoisted(() => ({ getDetail: vi.fn(), list: vi.fn() }));
vi.mock("#src/api/page-examples", () => ({
	exampleItemsQueryKey: ["example-items"],
	exampleRecordQueryKey: ["example-record"],
	getExampleRecord: mocks.getDetail,
	listExampleItems: mocks.list,
}));

const item = {
	createdAt: "2026-08-20T00:00:00.000Z",
	description: "用于演示三种通用列表形态。",
	id: "example-1",
	owner: "Platform Admin",
	status: "active" as const,
	title: "客户成功计划",
};

beforeAll(async () => i18n.changeLanguage("zh-CN"));
beforeEach(() => {
	mocks.list
		.mockReset()
		.mockResolvedValue({ items: [item], page: 1, pageSize: 10, total: 1 });
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
	render(
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
				<QueryClientProvider client={client}>{page}</QueryClientProvider>
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

	it("shows the official search-list and card-list compositions", async () => {
		renderPage(<SearchListPage />);
		expect(await screen.findByText("客户成功计划")).toBeVisible();
		expect(screen.getByRole("tab", { name: "文章" })).toBeVisible();
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
		expect(screen.getByText("操作成功")).toBeVisible();
		unmount();
		render(
			<ConfigProvider>
				<FailureResultPage />
			</ConfigProvider>,
		);
		expect(screen.getByText("操作失败")).toBeVisible();
	});
});
