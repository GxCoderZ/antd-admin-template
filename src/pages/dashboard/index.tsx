import { fetchDashboardSummary } from "#src/api/dashboard";
import { BasicButton } from "#src/components/basic-button";
import { BasicContent } from "#src/components/basic-content";
import { usePermission } from "#src/hooks/use-permission";
import { useUserStore } from "#src/store/user";

import { ReloadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Card, Col, Empty, Flex, Result, Row, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";

import { OverviewCard } from "./components/overview-card";
import { createDashboardMetrics } from "./constants";

export default function Dashboard() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const username = useUserStore(state => state.nickname?.trim() || state.username);
	const canViewAudit = usePermission("audit:view");
	const summaryQuery = useQuery({
		queryKey: ["dashboard-summary"],
		queryFn: async () => {
			const response = await fetchDashboardSummary();
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data;
		},
	});
	const metrics = createDashboardMetrics(summaryQuery.data?.metrics ?? [], canViewAudit);

	return (
		<BasicContent>
			<Flex vertical gap={token.marginLG}>
				<div>
					<Typography.Title level={4} className="!mb-1">
						{t("dashboard.greeting", { name: username || t("dashboard.defaultUser") })}
					</Typography.Title>
					<Typography.Text type="secondary">{t("dashboard.description")}</Typography.Text>
				</div>

				{summaryQuery.isError
					? (
						<Card>
							<Result
								extra={<BasicButton icon={<ReloadOutlined />} type="primary" onClick={() => summaryQuery.refetch()}>{t("dashboard.retry")}</BasicButton>}
								status="error"
								subTitle={summaryQuery.error.message}
								title={t("dashboard.loadFailed")}
							/>
						</Card>
					)
					: (
						<Row gutter={[token.marginLG, token.marginLG]}>
							{summaryQuery.isLoading
								? Array.from({ length: canViewAudit ? 4 : 3 }, (_, index) => (
									<Col data-testid="dashboard-statistic-skeleton" key={index} lg={6} sm={12} xs={24}>
										<Card loading className="h-full" />
									</Col>
								))
								: metrics.map(({ meta, metric }) => (
									<Col key={metric.key} lg={6} sm={12} xs={24}>
										<OverviewCard meta={meta} metric={metric} />
									</Col>
								))}
						</Row>
					)}

				{!summaryQuery.isLoading && !summaryQuery.isError && metrics.length === 0 && (
					<Card><Empty description={t("dashboard.noPermissionData")} /></Card>
				)}
			</Flex>
		</BasicContent>
	);
}
