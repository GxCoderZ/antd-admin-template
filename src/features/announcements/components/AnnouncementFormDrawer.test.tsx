import { ConfigProvider } from "antd";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

import { i18n } from "../../../i18n";
import { AnnouncementFormDrawer } from "./AnnouncementFormDrawer";

const announcement = {
	id: "draft",
	title: "Original",
	content: "Draft content",
	status: "draft" as const,
	createdAt: "2026-08-20",
	updatedAt: "2026-08-20",
};

function renderEditor() {
	const onClose = vi.fn();
	const onSubmit = vi.fn();
	render(
		<ConfigProvider theme={{ token: { motion: false } }}>
			<AnnouncementFormDrawer
				announcement={announcement}
				error={false}
				loading={false}
				open
				onClose={onClose}
				onSubmit={onSubmit}
			/>
		</ConfigProvider>,
	);
	return { user: userEvent.setup(), onClose, onSubmit };
}

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});
// rc-util uses a single test-id in test mode, breaking nested dialogs' accessible names.
beforeEach(() => vi.stubEnv("NODE_ENV", "development"));
afterEach(() => vi.unstubAllEnvs());

describe("Announcement draft exit", () => {
	it("keeps the draft until discard is explicitly confirmed", async () => {
		const { user, onClose, onSubmit } = renderEditor();
		const editor = await screen.findByRole("dialog");
		const title = within(editor).getByPlaceholderText("请输入公告标题");
		await user.clear(title);
		await user.type(title, "Unsaved title");
		await user.click(within(editor).getByRole("button", { name: /取\s*消/ }));
		expect(onClose).not.toHaveBeenCalled();
		let confirmation = await screen.findByRole("dialog", {
			name: "放弃未保存的更改？",
		});
		await user.click(
			within(confirmation).getByRole("button", { name: "继续编辑" }),
		);
		expect(title).toHaveValue("Unsaved title");
		await user.click(within(editor).getByRole("button", { name: /取\s*消/ }));
		confirmation = await screen.findByRole("dialog", {
			name: "放弃未保存的更改？",
		});
		await user.click(
			within(confirmation).getByRole("button", { name: "放弃更改" }),
		);
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("closes untouched or restored fields without confirmation", async () => {
		const { user, onClose } = renderEditor();
		const editor = await screen.findByRole("dialog");
		await user.click(within(editor).getByRole("button", { name: /取\s*消/ }));
		expect(onClose).toHaveBeenCalledTimes(1);
		const title = within(editor).getByPlaceholderText("请输入公告标题");
		await user.type(title, " changed");
		await user.clear(title);
		await user.type(title, announcement.title);
		await user.click(within(editor).getByRole("button", { name: /取\s*消/ }));
		expect(onClose).toHaveBeenCalledTimes(2);
		expect(
			screen.queryByRole("dialog", { name: "放弃未保存的更改？" }),
		).not.toBeInTheDocument();
	});
});
