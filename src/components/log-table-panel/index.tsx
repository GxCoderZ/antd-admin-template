import type { QueryFilterField } from "#src/components/query-filter-panel";
import type { ProColumns } from "@ant-design/pro-components";
import type { TableProps } from "antd";

import { BasicButton } from "#src/components/basic-button";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { DataTableSkeleton } from "#src/components/loading-skeletons";
import { QueryFilterPanel } from "#src/components/query-filter-panel";

import { ReloadOutlined } from "@ant-design/icons";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Alert, ConfigProvider, Flex, Form, theme } from "antd";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

export interface LogTableQuery extends Record<string, unknown> {
	order?: "ascend" | "descend"
	page: number
	page_size: number
	sort?: string
}

interface LogTablePanelProps<RecordType extends Record<string, any>, QueryType extends LogTableQuery> {
	columns: ProColumns<RecordType>[]
	initialQuery: QueryType
	minimumWidth?: number
	onOpenDetail?: (record: RecordType) => void
	persistenceKey: string
	queryKey: string
	request: (query: QueryType) => Promise<PageResult<RecordType>>
	searchFields: QueryFilterField[]
	sortFields: readonly string[]
	title: string
}

export function LogTablePanel<RecordType extends Record<string, any>, QueryType extends LogTableQuery>({
	columns,
	initialQuery,
	minimumWidth = 960,
	onOpenDetail,
	persistenceKey,
	queryKey,
	request,
	searchFields,
	sortFields,
	title,
}: LogTablePanelProps<RecordType, QueryType>) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm();
	const [query, setQuery] = useState<QueryType>(initialQuery);
	const workspaceRef = useRef<HTMLDivElement>(null);
	const subscribeFullscreen = useCallback((callback: () => void) => {
		document.addEventListener("fullscreenchange", callback);
		return () => document.removeEventListener("fullscreenchange", callback);
	}, []);
	const getFullscreenSnapshot = useCallback(() => document.fullscreenElement === workspaceRef.current, []);
	const isFullscreen = useSyncExternalStore(subscribeFullscreen, getFullscreenSnapshot, () => false);
	const dataQuery = useQuery({ placeholderData: keepPreviousData, queryKey: [queryKey, query], queryFn: () => request(query) });
	const tableColumns = useMemo<ProColumns<RecordType>[]>(() => [
		...columns,
		...(onOpenDetail
			? [{
				title: t("common.action"),
				valueType: "option" as const,
				key: "option",
				width: 90,
				fixed: "right" as const,
				render: (_: unknown, record: RecordType) => (
					<BasicButton usage="table-action" onClick={() => onOpenDetail(record)}>
						{t("common.view")}
					</BasicButton>
				),
			}]
			: []),
	], [columns, onOpenDetail, t]);

	const handleTableChange: NonNullable<TableProps<RecordType>["onChange"]> = (pagination, _filters, sorter) => {
		const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
		const field = String(activeSorter.field ?? "");
		setQuery(current => ({
			...current,
			page: pagination.current ?? 1,
			page_size: pagination.pageSize ?? current.page_size,
			sort: sortFields.includes(field) ? field : undefined,
			order: activeSorter.order === "ascend" || activeSorter.order === "descend" ? activeSorter.order : undefined,
		}));
	};

	const submitFilters = (values: Record<string, unknown>) => {
		const nextFilters = searchFields.reduce<Record<string, unknown>>((result, field) => {
			const value = values[field.name];
			if (field.transform)
				return { ...result, ...field.transform(value) };
			return { ...result, [field.name]: value === "" ? undefined : value };
		}, {});
		setQuery(current => ({ ...current, ...nextFilters, page: 1 }));
	};

	const resetFilters = () => {
		form.resetFields();
		setQuery(initialQuery);
	};

	const toggleFullscreen = async () => {
		if (document.fullscreenElement === workspaceRef.current)
			await document.exitFullscreen?.();
		else
			await workspaceRef.current?.requestFullscreen?.();
	};

	return (
		<BasicContent className="h-full">
			<ConfigProvider getPopupContainer={() => isFullscreen ? (workspaceRef.current ?? document.body) : document.body}>
				<Flex
					gap={token.marginLG}
					ref={workspaceRef}
					style={isFullscreen
						? {
							background: token.colorBgLayout,
							boxSizing: "border-box",
							height: "100%",
							overflow: "auto",
							padding: token.paddingLG,
						}
						: undefined}
					vertical
				>
					<QueryFilterPanel
						fields={searchFields}
						form={form}
						loading={dataQuery.isFetching}
						onFinish={submitFilters}
						onReset={resetFilters}
					/>

					<BasicTable<RecordType>
						columns={tableColumns}
						columnsState={{ persistenceKey, persistenceType: "localStorage" }}
						dataSource={dataQuery.data?.items ?? []}
						headerTitle={title}
						loading={dataQuery.isFetching && !dataQuery.isLoading}
						onChange={handleTableChange}
						options={{ fullScreen: toggleFullscreen, reload: () => dataQuery.refetch() }}
						pagination={{ current: query.page, pageSize: query.page_size, total: dataQuery.data?.total ?? 0 }}
						search={false}
						tableRender={(_, defaultDom) => {
							if (dataQuery.isLoading)
								return <DataTableSkeleton columnCount={tableColumns.length} minimumWidth={minimumWidth} />;
							if (dataQuery.isError) {
								return (
									<Alert
										action={<BasicButton icon={<ReloadOutlined />} onClick={() => dataQuery.refetch()}>{t("common.retry")}</BasicButton>}
										description={dataQuery.error instanceof Error ? dataQuery.error.message : undefined}
										message={t("common.loadFailed")}
										showIcon
										type="error"
									/>
								);
							}
							return defaultDom;
						}}
					/>
				</Flex>
			</ConfigProvider>
		</BasicContent>
	);
}
