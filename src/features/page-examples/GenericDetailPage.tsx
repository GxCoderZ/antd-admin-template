import { useQuery } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Card,
	Descriptions,
	Flex,
	Progress,
	Skeleton,
	Table,
	Tag,
	theme,
	Typography,
} from "antd";
import { useTranslation } from "react-i18next";

import {
	exampleRecordQueryKey,
	getExampleRecord,
} from "#src/api/page-examples";

const { Title } = Typography;

export function GenericDetailPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const query = useQuery({
		queryFn: ({ signal }) => getExampleRecord("record-001", signal),
		queryKey: [...exampleRecordQueryKey, "record-001"],
	});
	return (
		<Flex gap={token.marginLG} vertical>
			<Title level={2} style={{ margin: 0 }}>
				{t("adminShell.pageExamples.detail.title")}
			</Title>
			<Card>
				{query.isPending ? (
					<Skeleton active paragraph={{ rows: 12 }} />
				) : query.isError ? (
					<Alert
						action={
							<Button onClick={() => void query.refetch()}>
								{t("adminShell.pageExamples.retry")}
							</Button>
						}
						title={t("adminShell.pageExamples.loadError")}
						showIcon
						type="error"
					/>
				) : (
					<Flex gap={token.marginLG} vertical>
						<section>
							<Title level={4}>
								{t("adminShell.pageExamples.detail.application")}
							</Title>
							<Descriptions
								column={{ xs: 1, sm: 2, md: 3 }}
								items={[
									{
										key: "id",
										label: t("adminShell.pageExamples.detail.recordId"),
										children: query.data.id,
									},
									{
										key: "status",
										label: t("adminShell.pageExamples.detail.status"),
										children: (
											<Tag color="success">
												{t(
													`adminShell.pageExamples.statuses.${query.data.status}`,
												)}
											</Tag>
										),
									},
									{
										key: "owner",
										label: t("adminShell.pageExamples.owner"),
										children: query.data.owner,
									},
									{
										key: "progress",
										label: t("adminShell.pageExamples.detail.progress"),
										children: (
											<Progress percent={query.data.progress} size="small" />
										),
									},
								]}
							/>
						</section>
						<section>
							<Title level={4}>
								{t("adminShell.pageExamples.detail.information")}
							</Title>
							<Descriptions
								column={{ xs: 1, sm: 2, md: 3 }}
								items={[
									{
										key: "title",
										label: t("adminShell.pageExamples.detail.name"),
										children: query.data.title,
									},
									{
										key: "created",
										label: t("adminShell.pageExamples.startTime"),
										children: new Date(query.data.createdAt).toLocaleString(),
									},
									{
										key: "updated",
										label: t("adminShell.pageExamples.detail.updatedAt"),
										children: new Date(query.data.updatedAt).toLocaleString(),
									},
									{
										key: "participants",
										label: t("adminShell.pageExamples.detail.participants"),
										children: query.data.participants.join("、"),
										span: 2,
									},
									{
										key: "description",
										label: t("adminShell.pageExamples.detail.description"),
										children: query.data.description,
										span: 3,
									},
								]}
							/>
						</section>
						<section>
							<Title level={4}>
								{t("adminShell.pageExamples.detail.activity")}
							</Title>
							<Table
								columns={[
									{
										dataIndex: "at",
										key: "at",
										title: t("adminShell.pageExamples.detail.time"),
									},
									{
										dataIndex: "content",
										key: "content",
										title: t("adminShell.pageExamples.detail.currentProgress"),
									},
									{
										key: "operator",
										render: () => query.data.owner,
										title: t("adminShell.pageExamples.detail.operator"),
									},
								]}
								dataSource={query.data.activity}
								pagination={false}
								rowKey="id"
								scroll={{ x: token.controlHeight * 14 }}
							/>
						</section>
					</Flex>
				)}
			</Card>
		</Flex>
	);
}
