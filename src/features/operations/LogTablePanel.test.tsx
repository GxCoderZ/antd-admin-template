import { ConfigProvider } from "antd";
import type { TableColumnsType } from "antd";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { i18n } from "../../i18n";
import { LogTablePanel } from "./LogTablePanel";

interface LogRow {
	action: string;
	actor: string;
	id: string;
	requestId: string;
}

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

describe("LogTablePanel", () => {
	it("lists every column while preserving required and default-visible columns", async () => {
		const user = userEvent.setup();
		const columns: TableColumnsType<LogRow> = [
			{ dataIndex: "actor", key: "actor", title: "操作人" },
			{ key: "actions", render: () => "查看", title: "操作" },
			{ dataIndex: "action", key: "action", title: "动作" },
			{ dataIndex: "requestId", key: "requestId", title: "请求 ID" },
		];

		render(
			<ConfigProvider>
				<LogTablePanel
					columns={columns}
					dataSource={[
						{
							action: "user.update",
							actor: "admin",
							id: "1",
							requestId: "req-1",
						},
					]}
					defaultVisibleColumnKeys={["actor", "action", "actions"]}
					emptyText="暂无日志"
					error={null}
					initialLoading={false}
					minimumWidth={320}
					onPageChange={vi.fn()}
					onReload={vi.fn()}
					onTableChange={vi.fn()}
					page={1}
					pageSize={10}
					queryPanel={null}
					refreshing={false}
					requiredColumnKeys={["actor", "actions"]}
					testId="log-table-card"
					title="审计日志"
					total={1}
					workspaceTestId="log-table-workspace"
				/>
			</ConfigProvider>,
		);

		await user.click(screen.getByRole("button", { name: "列设置" }));

		const requiredColumn = screen.getByRole("checkbox", { name: "操作人" });
		const optionalColumn = screen.getByRole("checkbox", { name: "动作" });
		const hiddenOptionalColumn = screen.getByRole("checkbox", {
			name: "请求 ID",
		});
		expect(requiredColumn).toBeChecked();
		expect(requiredColumn).toBeDisabled();
		expect(optionalColumn).toBeChecked();
		expect(optionalColumn).toBeEnabled();
		expect(hiddenOptionalColumn).not.toBeChecked();
		expect(hiddenOptionalColumn).toBeEnabled();
		expect(screen.queryByRole("columnheader", { name: "请求 ID" })).toBeNull();

		await user.click(hiddenOptionalColumn);
		expect(screen.getByRole("columnheader", { name: "请求 ID" })).toBeVisible();
		expect(
			screen
				.getAllByRole("columnheader")
				.map((columnHeader) => columnHeader.textContent),
		).toEqual(["操作人", "动作", "请求 ID", "操作"]);
		await user.click(screen.getByRole("button", { name: "重置" }));
		expect(screen.queryByRole("columnheader", { name: "请求 ID" })).toBeNull();

		const columnDisplay = screen.getByRole("checkbox", { name: "列显示" });
		await user.click(columnDisplay);
		await user.click(columnDisplay);

		expect(screen.getByRole("columnheader", { name: "操作人" })).toBeVisible();
		expect(screen.queryByRole("columnheader", { name: "动作" })).toBeNull();
	});
});
