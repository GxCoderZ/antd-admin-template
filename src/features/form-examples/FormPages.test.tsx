import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { i18n } from "../../i18n";
import { BasicFormPage } from "./BasicFormPage";
import { StepFormPage } from "./StepFormPage";

const mocks = vi.hoisted(() => ({
	submitBasicForm: vi.fn(),
	submitStepForm: vi.fn(),
}));

vi.mock("#src/api/form-examples", () => ({
	submitBasicForm: mocks.submitBasicForm,
	submitStepForm: mocks.submitStepForm,
}));

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

beforeEach(() => {
	mocks.submitBasicForm.mockReset().mockResolvedValue({
		id: "basic-001",
		submittedAt: "2026-08-26T00:00:00.000Z",
	});
	mocks.submitStepForm.mockReset().mockResolvedValue({
		id: "step-001",
		submittedAt: "2026-08-26T00:00:00.000Z",
	});
});

function renderPage(page: React.ReactNode) {
	const queryClient = new QueryClient({
		defaultOptions: { mutations: { retry: false } },
	});
	const user = userEvent.setup();

	render(
		<ConfigProvider>
			<QueryClientProvider client={queryClient}>{page}</QueryClientProvider>
		</ConfigProvider>,
	);

	return user;
}

describe("form example pages", () => {
	it("validates and submits the basic form", async () => {
		const user = renderPage(<BasicFormPage />);

		await user.click(screen.getByRole("button", { name: "提交" }));
		expect(await screen.findByText(/请输入事项标题/)).toBeInTheDocument();

		await user.type(screen.getByLabelText("事项标题"), "客户回访计划");
		await user.type(screen.getByLabelText("负责人"), "张伟");
		await user.type(
			screen.getByLabelText("事项说明"),
			"安排本季度重点客户回访。",
		);
		await user.click(screen.getByRole("button", { name: "提交" }));

		await waitFor(() => {
			expect(mocks.submitBasicForm.mock.calls[0]?.[0]).toEqual(
				expect.objectContaining({
					owner: "张伟",
					summary: "安排本季度重点客户回访。",
					title: "客户回访计划",
				}),
			);
		});
		expect(await screen.findByText("提交成功")).toBeVisible();
	});

	it("moves through the step form and submits after confirmation", async () => {
		const user = renderPage(<StepFormPage />);

		await user.type(screen.getByLabelText("事项名称"), "月度数据核对");
		await user.type(screen.getByLabelText("负责人"), "李娜");
		await user.type(screen.getByLabelText("补充说明"), "核对完成后归档。");
		await user.click(screen.getByRole("button", { name: "下一步" }));

		expect(await screen.findByText("月度数据核对")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "返回修改" }));
		expect(screen.getByLabelText("事项名称")).toHaveValue("月度数据核对");
		await user.click(screen.getByRole("button", { name: "下一步" }));
		await user.click(screen.getByRole("button", { name: "确认提交" }));

		await waitFor(() => {
			expect(mocks.submitStepForm.mock.calls[0]?.[0]).toEqual(
				expect.objectContaining({
					name: "月度数据核对",
					owner: "李娜",
				}),
			);
		});
		expect(await screen.findByText("提交完成")).toBeVisible();
		expect(screen.getByText(/step-001/)).toBeVisible();
	});
});
