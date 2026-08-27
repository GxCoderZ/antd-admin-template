import type { ProColumns, ProFormInstance } from "@ant-design/pro-components";
import { ApiProblemError } from "#src/api/client";
import { Alert, Button, Descriptions, Drawer } from "antd";
import type { DescriptionsProps } from "antd";
import type { ReactNode, RefObject } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	ManagementProTable,
	type ManagementProTableProps,
} from "../../app/ManagementProTable";

export const defaultLogPageSize = 10;

export interface ManagementQuery<Values extends object> {
	columns: {
		dataIndex: Extract<keyof Values, string>;
		title: ReactNode;
		formItemRender: () => ReactNode;
	}[];
	expanded: boolean;
	formRef: RefObject<ProFormInstance<Values> | undefined>;
	initialValues: Values;
	loading: boolean;
	onExpandedChange: (expanded: boolean) => void;
	onFinish: (values: Values) => void;
	onReset: () => void;
	onValuesChange?: (values: Values) => void;
	testId: string;
}

interface LogTablePanelProps<
	Row extends { id: string },
	Values extends object,
> extends ManagementProTableProps<Row, Values> {
	error: unknown;
	errorFallback?: string;
	errorTitle?: string;
	query: ManagementQuery<Values>;
	workspaceTestId: string;
}

// Domain pages own their queries; ProTable owns the complete search/table layout.
export function LogTablePanel<
	Row extends { id: string },
	Values extends object,
>({
	error,
	errorFallback,
	errorTitle,
	query,
	workspaceTestId,
	...table
}: LogTablePanelProps<Row, Values>) {
	const { t } = useTranslation();
	// ProForm consumes initialValues once; subsequent draft changes belong to the form.
	const [initialValues] = useState(() => query.initialValues);
	const columns: ProColumns<Row>[] = [
		...query.columns.map((column) => ({
			...column,
			key: `query:${column.dataIndex}`,
			hideInTable: true,
		})),
		...table.columns.map((column) => ({ ...column, search: false as const })),
	];
	const detail =
		error instanceof ApiProblemError ? error.problem?.detail : undefined;

	return (
		<div data-testid={workspaceTestId}>
			<ManagementProTable<Row, Values>
				{...table}
				columns={columns}
				dataSource={error ? [] : table.dataSource}
				onReset={query.onReset}
				onSubmit={query.onFinish}
				searchFormRef={query.formRef}
				search={{
					collapsed: !query.expanded,
					onCollapse: (collapsed) => query.onExpandedChange(!collapsed),
					resetText: t("adminShell.logs.common.reset"),
					searchText: t("adminShell.logs.common.query"),
				}}
				searchForm={{
					initialValues,
					onValuesChange: () => {
						if (query.formRef.current)
							query.onValuesChange?.(query.formRef.current.getFieldsValue());
					},
					submitter: { submitButtonProps: { loading: query.loading } },
					"data-testid": query.testId,
				}}
				emptyText={
					error ? (
						<Alert
							action={
								<Button onClick={table.onReload}>
									{t("adminShell.logs.common.retry")}
								</Button>
							}
							description={
								detail ??
								errorFallback ??
								t("adminShell.logs.common.errorFallback")
							}
							title={errorTitle ?? t("adminShell.logs.common.loadError")}
							showIcon
							type="error"
						/>
					) : (
						table.emptyText
					)
				}
			/>
		</div>
	);
}

export function LogDetailsDrawer({
	items,
	onClose,
	open,
	title,
}: {
	items: DescriptionsProps["items"] | undefined;
	onClose: () => void;
	open: boolean;
	title: string;
}) {
	return (
		<Drawer destroyOnHidden onClose={onClose} open={open} title={title}>
			{items ? (
				<Descriptions bordered column={1} items={items} size="small" />
			) : null}
		</Drawer>
	);
}
