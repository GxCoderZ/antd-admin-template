import { ConfigProvider, Form, Input, InputNumber, Switch, Button } from "antd";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { i18n } from "../i18n";
import { hasFormChanges, useDiscardChanges } from "./useDiscardChanges";

function Editor({
	saving = false,
	onDiscard,
}: {
	saving?: boolean;
	onDiscard: () => void;
}) {
	const [form] = Form.useForm<{
		name: string;
		sort: number;
		enabled: boolean;
	}>();
	const initialValues = { name: "", sort: 0, enabled: false };
	const discard = useDiscardChanges({
		isDirty: () => hasFormChanges(form, initialValues),
		onDiscard,
		saving,
	});
	return (
		<ConfigProvider theme={{ token: { motion: false } }}>
			{discard.contextHolder}
			<Form form={form} initialValues={initialValues}>
				<Form.Item name="name">
					<Input aria-label="name" />
				</Form.Item>
				<Form.Item name="sort">
					<InputNumber aria-label="sort" />
				</Form.Item>
				<Form.Item name="enabled" valuePropName="checked">
					<Switch aria-label="enabled" />
				</Form.Item>
			</Form>
			<Button onClick={discard.requestClose}>Close editor</Button>
		</ConfigProvider>
	);
}

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

describe("discard confirmation", () => {
	it("keeps false and zero distinct from edited values and prevents stacked confirmations", async () => {
		const onDiscard = vi.fn();
		const user = userEvent.setup();
		render(<Editor onDiscard={onDiscard} />);
		await user.click(screen.getByRole("switch", { name: "enabled" }));
		const close = screen.getByRole("button", { name: "Close editor" });
		await user.dblClick(close);
		expect(screen.getAllByRole("button", { name: "放弃更改" })).toHaveLength(1);
		expect(onDiscard).not.toHaveBeenCalled();
		await user.click(screen.getByRole("button", { name: "继续编辑" }));
		await user.click(screen.getByRole("switch", { name: "enabled" }));
		await user.click(close);
		expect(onDiscard).toHaveBeenCalledTimes(1);
	});

	it("ignores exit requests while saving", async () => {
		const onDiscard = vi.fn();
		const user = userEvent.setup();
		render(<Editor onDiscard={onDiscard} saving />);
		await user.type(screen.getByRole("textbox", { name: "name" }), "draft");
		await user.click(screen.getByRole("button", { name: "Close editor" }));
		expect(onDiscard).not.toHaveBeenCalled();
		expect(
			screen.queryByRole("button", { name: "放弃更改" }),
		).not.toBeInTheDocument();
	});
});
