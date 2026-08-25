import { Flex, Skeleton, Spin, theme } from "antd";

interface DataTableSkeletonProps {
	columnCount: number
	minimumWidth: number
	rowCount?: number
}

export function DataTableSkeleton({ columnCount, minimumWidth, rowCount = 5 }: DataTableSkeletonProps) {
	const { token } = theme.useToken();
	const columns = Array.from({ length: columnCount }, (_, index) => `column-${index}`);
	const rows = Array.from({ length: rowCount }, (_, index) => `row-${index}`);
	const renderRow = (rowKey: string, header = false) => (
		<Flex
			align="center"
			gap={token.margin}
			key={rowKey}
			style={{
				background: header ? token.colorFillAlter : undefined,
				borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
				minHeight: header ? token.controlHeightLG : token.controlHeightLG + token.marginXS,
				paddingInline: token.padding,
			}}
		>
			{columns.map((columnKey, columnIndex) => (
				<div key={`${rowKey}-${columnKey}`} style={{ flex: columnIndex === 0 ? "1.25 1 0" : "1 1 0", minWidth: 0 }}>
					<Skeleton.Input active block size="small" />
				</div>
			))}
		</Flex>
	);

	return (
		<div data-testid="data-table-skeleton" className="overflow-x-auto">
			<div style={{ minWidth: minimumWidth }}>
				{renderRow("header", true)}
				{rows.map(rowKey => renderRow(rowKey))}
			</div>
			<Flex gap={token.marginXS} justify="flex-end" style={{ paddingBlockStart: token.padding }}>
				<Skeleton.Button active size="small" />
				<Skeleton.Button active size="small" />
			</Flex>
		</div>
	);
}

export function FormSkeleton() {
	const { token } = theme.useToken();
	return (
		<Flex data-testid="form-skeleton" gap={token.margin} vertical>
			<Skeleton.Input active size="small" style={{ width: token.controlHeight * 3 }} />
			<Skeleton.Input active block />
			<Skeleton.Button active />
		</Flex>
	);
}

export function RouteContentSkeleton() {
	return <Flex align="center" data-testid="route-content-skeleton" justify="center" className="min-h-[40vh] w-full"><Spin size="large" /></Flex>;
}

export function ApplicationSkeleton() {
	const { token } = theme.useToken();
	return <Flex align="center" data-testid="application-skeleton" justify="center" style={{ background: token.colorBgLayout, minHeight: "100dvh" }}><Spin size="large" /></Flex>;
}
