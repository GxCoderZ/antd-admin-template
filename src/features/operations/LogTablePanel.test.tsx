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
}

beforeAll(async () => {
	await i18n.changeLanguage("zh-CN");
});

describe("LogTablePanel", () => {
	it("lists required and optional columns while keeping required columns visible", async () => {
		const user = userEvent.setup();
		const columns: TableColumnsType<LogRow> = [
			{ dataIndex: "actor", key: "actor", title: "操作人" },
			{ dataIndex: "action", key: "action", title: "动作" },
		];

		render(
			<ConfigProvider>
				<LogTablePanel
					columns={columns}
					dataSource={[{ action: "user.update", actor: "admin", id: "1" }]}
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
					requiredColumnKeys={["actor"]}
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
		expect(requiredColumn).toBeChecked();
		expect(requiredColumn).toBeDisabled();
		expect(optionalColumn).toBeChecked();
		expect(optionalColumn).toBeEnabled();

		await user.click(screen.getByRole("checkbox", { name: "列显示" }));

		expect(screen.getByRole("columnheader", { name: "操作人" })).toBeVisible();
		expect(screen.queryByRole("columnheader", { name: "动作" })).toBeNull();
	});
});
