import { render, screen } from "@testing-library/react";
import { ConfigProvider } from "antd";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { i18n, i18nReady } from "../../../i18n";
import { useItemQuery } from "./useDictionaryQueries";

import { LogTablePanel } from "../../operations/LogTablePanel";

function ItemQueryTable() {
	const query = useItemQuery({
		initialFilters: { status: "all" },
		loading: false,
		onApply: vi.fn(),
		onReset: vi.fn(),
	});
	return (
		<LogTablePanel
			columnSettingsStorageKey="test-item-columns"
			columnVisibility={[]}
			columns={[]}
			dataSource={[]}
			emptyText="No data"
			error={undefined}
			initialLoading={false}
			onReload={vi.fn()}
			page={1}
			pageSize={10}
			refreshing={false}
			testId="test-table"
			title="Items"
			total={0}
			workspaceTestId="test-workspace"
			query={query}
		/>
	);
}

beforeAll(async () => {
	await i18nReady;
});

beforeEach(() => {
	sessionStorage.clear();
});

describe("Dictionary item query", () => {
	it.each([
		["zh-CN", "关键词", "搜索标签或字典值"],
		["zh-TW", "關鍵字", "搜尋標籤或字典值"],
		["en", "Keyword", "Search label or value"],
		["ko-KR", "키워드", "라벨 또는 값 검색"],
	])(
		"uses a concise label and keeps the search hint in %s",
		async (language, label, placeholder) => {
			await i18n.changeLanguage(language);
			render(
				<ConfigProvider>
					<ItemQueryTable />
				</ConfigProvider>,
			);

			expect(
				screen.getByText(label, { selector: "label" }),
			).toBeInTheDocument();
			expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
		},
	);
});
