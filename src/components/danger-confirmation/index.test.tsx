import { i18n, setupI18n } from "#src/locales";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { DangerConfirmation } from ".";

describe("danger confirmation", () => {
	beforeAll(async () => {
		setupI18n();
		await i18n.changeLanguage("zh-CN");
	});

	it("requires the exact target name before confirming", async () => {
		const user = userEvent.setup();
		const onConfirm = vi.fn();
		render(
			<DangerConfirmation
				impact="目标用户的其他会话将立即失效"
				onCancel={vi.fn()}
				onConfirm={onConfirm}
				open
				targetName="viewer"
				title="强制下线"
			/>,
		);

		const confirmButton = screen.getByRole("button", { name: /确\s*认/ });
		const input = screen.getByLabelText("确认对象");

		expect(confirmButton).toBeDisabled();
		await user.type(input, "view");
		expect(confirmButton).toBeDisabled();
		await user.type(input, "er");
		expect(confirmButton).toBeEnabled();
		await user.click(confirmButton);
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("blocks dismissal and resubmission while loading", () => {
		const onCancel = vi.fn();
		const onConfirm = vi.fn();
		render(
			<DangerConfirmation
				impact="目标用户的其他会话将立即失效"
				loading
				onCancel={onCancel}
				onConfirm={onConfirm}
				open
				targetName="viewer"
				title="强制下线"
			/>,
		);

		expect(screen.getByRole("button", { name: /取\s*消/ })).toBeDisabled();
		expect(screen.getByRole("button", { name: /确\s*认/ })).toBeDisabled();
		expect(onCancel).not.toHaveBeenCalled();
		expect(onConfirm).not.toHaveBeenCalled();
	});
});
