import { fetchDashboardSummary } from "#src/api/dashboard";
import { BasicContent } from "#src/components/basic-content";

import { ClockCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Alert, Card, Col, Empty, Flex, List, Row, Spin, Tag, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { OverviewCard } from "./components/overview-card";

export default function Dashboard() {
	const { t } = useTranslation();
	const summaryQuery = useQuery({
		queryKey: ["dashboard-summary"],
		queryFn: async () => {
			const response = await fetchDashboardSummary();
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data;
		},
	});

	return (
		<BasicContent>
			<Card className="mb-4" styles={{ body: { padding: 24 } }}>
				<Flex justify="space-between" align="flex-start" gap={16} wrap>
					<div>
						<Typography.Title level={3} className="!mb-2">
							{t("dashboard.title")}
						</Typography.Title>
						<Typography.Text type="secondary">{t("dashboard.description")}</Typography.Text>
					</div>
					<Tag color="processing" bordered={false}>{t("dashboard.fakeBadge")}</Tag>
				</Flex>
			</Card>

			{summaryQuery.isError && (
				<Alert className="mb-4" type="error" showIcon message={t("dashboard.loadFailed")} description={summaryQuery.error.message} />
			)}

			<Spin spinning={summaryQuery.isLoading}>
				{summaryQuery.data
					? (
						<>
							<Row gutter={[16, 16]}>
								{summaryQuery.data.metrics.map(metric => (
									<Col key={metric.key} xs={24} sm={12} xl={6}>
										<OverviewCard metric={metric} />
									</Col>
								))}
							</Row>
							<Card className="mt-4" title={t("dashboard.recentActivity")}>
								<List
									dataSource={summaryQuery.data.activities}
									locale={{ emptyText: <Empty description={t("common.noData")} /> }}
									renderItem={item => (
										<List.Item extra={<Typography.Text type="secondary">{item.created_at}</Typography.Text>}>
											<List.Item.Meta
												avatar={<ClockCircleOutlined className="text-colorPrimary" />}
												title={item.actor}
												description={`${item.action} · ${item.target}`}
											/>
										</List.Item>
									)}
								/>
							</Card>
						</>
					)
					: !summaryQuery.isLoading && <Empty description={t("common.noData")} />}
			</Spin>
		</BasicContent>
	);
}
