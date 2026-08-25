import { Button } from "antd";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { i18n } from "../i18n";
import { useTableActions } from "./tableActions";

const originalClipboard = Object.getOwnPropertyDescriptor(
	navigator,
	"clipboard",
);

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

afterEach(() => {
	if (originalClipboard) {
		Object.defineProperty(navigator, "clipboard", originalClipboard);
	} else {
		Reflect.deleteProperty(navigator, "clipboard");
	}
	vi.restoreAllMocks();
});

function mockClipboard(writeText: (value: string) => Promise<void>) {
	Object.defineProperty(navigator, "clipboard", {
		configurable: true,
		value: { writeText },
	});
}

function TableActionsHarness() {
	const { copyTableValue, messageContextHolder } = useTableActions();

	return (
		<>
			{messageContextHolder}
			<Button
				aria-label="复制测试值"
				onClick={() => void copyTableValue("audit-log-001")}
			>
				复制
			</Button>
		</>
	);
}

describe("useTableActions", () => {
	it("copies the value and reports success", async () => {
		const user = userEvent.setup();
		const writeText = vi.fn().mockResolvedValue(undefined);
		mockClipboard(writeText);

		render(<TableActionsHarness />);
		await user.click(screen.getByRole("button", { name: "复制测试值" }));

		expect(writeText).toHaveBeenCalledWith("audit-log-001");
		expect(await screen.findByText("已复制到剪贴板")).toBeInTheDocument();
	});

	it("reports failure when the clipboard rejects the write", async () => {
		const user = userEvent.setup();
		const writeText = vi.fn().mockRejectedValue(new Error("denied"));
		mockClipboard(writeText);

		render(<TableActionsHarness />);
		await user.click(screen.getByRole("button", { name: "复制测试值" }));

		expect(writeText).toHaveBeenCalledWith("audit-log-001");
		expect(await screen.findByText("复制失败，请重试")).toBeInTheDocument();
	});
});
