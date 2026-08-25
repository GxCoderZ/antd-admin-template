import { ConfigProvider } from "antd";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";

import { i18n } from "../../i18n";
import { PreviewWorkbenchPage } from "./PreviewWorkbenchPage";

beforeAll(async () => i18n.changeLanguage("zh-CN"));

describe("preview workbench template", () => {
	it("updates the preview content from the editor in real time", () => {
		render(
			<ConfigProvider>
				<PreviewWorkbenchPage />
			</ConfigProvider>,
		);
		const titleInput = screen.getByRole("textbox", { name: "内容标题" });
		fireEvent.change(titleInput, { target: { value: "新的预览标题" } });
		expect(screen.getByRole("heading", { name: "新的预览标题" })).toBeVisible();
	});

	it("provides desktop, mobile and content preview modes", () => {
		render(
			<ConfigProvider>
				<PreviewWorkbenchPage />
			</ConfigProvider>,
		);
		expect(screen.getByText("实时预览")).toBeVisible();
		fireEvent.click(screen.getByText("移动端"));
		expect(screen.getByTestId("preview-frame")).toHaveAttribute(
			"data-preview-mode",
			"mobile",
		);
		fireEvent.click(screen.getByText("内容"));
		expect(screen.getByTestId("preview-frame")).toHaveAttribute(
			"data-preview-mode",
			"content",
		);
	});
});
