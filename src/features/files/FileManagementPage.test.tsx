import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LocalePreferencesProvider } from "../../app/LocalePreferencesProvider";
import { i18n } from "../../i18n";
import { FileManagementPage } from "./FileManagementPage";

const mocks = vi.hoisted(() => ({
	remove: vi.fn(),
	list: vi.fn(),
	upload: vi.fn(),
}));
vi.mock("#src/api/files", () => ({
	deletePlatformFile: mocks.remove,
	listPlatformFiles: mocks.list,
	platformFilesQueryKey: ["platform-files"],
	uploadPlatformFile: mocks.upload,
}));

const file = {
	createdAt: "2026-08-26T00:00:00.000Z",
	id: "file-1",
	name: "运营周报.pdf",
	size: 2048,
	type: "application/pdf",
	uploader: "Platform Admin",
};
beforeAll(async () => i18n.changeLanguage("zh-CN"));
beforeEach(() => {
	sessionStorage.clear();
	mocks.list
		.mockReset()
		.mockResolvedValue({ items: [file], page: 1, pageSize: 10, total: 1 });
	mocks.upload.mockReset().mockResolvedValue(file);
	mocks.remove.mockReset().mockResolvedValue(undefined);
});

function renderPage() {
	const client = new QueryClient({
		defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
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
				<QueryClientProvider client={client}>
					<FileManagementPage />
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>,
	);
	return userEvent.setup();
}

describe("FileManagementPage", () => {
	it("uses the standard query and table tools", async () => {
		renderPage();
		expect(await screen.findByText("运营周报.pdf")).toBeVisible();
		expect(screen.getByTestId("file-management-query-form")).toBeVisible();
		for (const action of ["刷新", "表格密度", "列设置"])
			expect(screen.getByRole("button", { name: action })).toBeVisible();
	});

	it("uploads and deletes only through Fake API mutations", async () => {
		const user = renderPage();
		await screen.findByText("运营周报.pdf");
		const input =
			document.querySelector<HTMLInputElement>('input[type="file"]');
		expect(input).not.toBeNull();
		await user.upload(
			input!,
			new File(["demo"], "验收.txt", { type: "text/plain" }),
		);
		await waitFor(() => expect(mocks.upload).toHaveBeenCalled());
		await user.click(screen.getByRole("button", { name: /删除/ }));
		await user.click(await screen.findByRole("button", { name: /确认删除/ }));
		await waitFor(() => expect(mocks.remove.mock.calls[0]?.[0]).toBe("file-1"));
	});

	it("shows empty and request failure states", async () => {
		mocks.list.mockResolvedValue({
			items: [],
			page: 1,
			pageSize: 10,
			total: 0,
		});
		renderPage();
		expect(await screen.findByText("暂无文件")).toBeVisible();
	});

	it("shows the shared retryable table failure state", async () => {
		mocks.list.mockRejectedValue(new Error("offline"));
		renderPage();
		expect(await screen.findByText("文件列表加载失败")).toBeVisible();
		expect(screen.getByRole("button", { name: "重新加载" })).toBeVisible();
	});
});
