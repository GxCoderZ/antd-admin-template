import { ProForm } from "@ant-design/pro-components";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConfigProvider, Form, Input, Select } from "antd";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { i18n, i18nReady } from "../../i18n";
import { LogQueryPanel } from "./LogTablePanel";

interface QueryValues {
	q: string;
	status: string;
}

function QueryPanel({
	loading = false,
	onFinish,
	onReset,
}: {
	loading?: boolean;
	onFinish: (values: QueryValues) => void;
	onReset: () => void;
}) {
	const [form] = Form.useForm<QueryValues>();
	const [expanded, setExpanded] = useState(false);
	return (
		<ConfigProvider>
			<LogQueryPanel<QueryValues>
				expanded={expanded}
				form={form}
				initialValues={{ q: "initial", status: "all" }}
				loading={loading}
				onExpandedChange={setExpanded}
				onFinish={onFinish}
				onReset={onReset}
				testId="query-form"
			>
				<ProForm.Item key="q" label="Keyword" name="q">
					<Input />
				</ProForm.Item>
				<ProForm.Item key="status" label="Status" name="status">
					<Select options={[{ label: "All", value: "all" }]} />
				</ProForm.Item>
			</LogQueryPanel>
		</ConfigProvider>
	);
}

beforeAll(async () => {
	await i18nReady;
	await i18n.changeLanguage("zh-CN");
});

describe("LogQueryPanel", () => {
	it("uses the Pro reset and query actions without changing submitted values", async () => {
		const onFinish = vi.fn();
		const onReset = vi.fn();
		render(<QueryPanel onFinish={onFinish} onReset={onReset} />);

		const actions = screen.getAllByRole("button");
		expect(
			actions.map((button) => button.textContent?.replace(/\s/g, "")),
		).toEqual(["重置", "查询"]);
		fireEvent.change(screen.getByLabelText("Keyword"), {
			target: { value: "updated" },
		});
		fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));
		await waitFor(() =>
			expect(onFinish).toHaveBeenCalledWith({ q: "updated", status: "all" }),
		);
		fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));
		expect(onReset).toHaveBeenCalledOnce();
		expect(screen.getByLabelText("Keyword")).toHaveValue("initial");
	});

	it("keeps repeated reset available while a query is loading", () => {
		const onFinish = vi.fn();
		const onReset = vi.fn();
		render(<QueryPanel loading onFinish={onFinish} onReset={onReset} />);

		const reset = screen.getByRole("button", { name: /重\s*置/ });
		expect(reset).toBeEnabled();
		fireEvent.click(reset);
		fireEvent.click(reset);
		expect(onReset).toHaveBeenCalledTimes(2);
		expect(onFinish).not.toHaveBeenCalled();
	});
});
