import { Card, Empty, Flex, Skeleton } from "antd";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";

import type { DashboardStatistics } from "#src/api/dashboard";

const chartHeight = 400;
const LoginTrendChart = lazy(() => import("./LoginTrendChart"));

// Adapted from Ant Design Pro's analysis/OfflineData.tsx; see THIRD_PARTY_NOTICES.md.
export function DashboardLoginTrend({
	days,
}: {
	days: DashboardStatistics["loginTrend"];
}) {
	const { t } = useTranslation();
	const title = t("adminShell.dashboard.loginTrend");

	return (
		<Card
			title={title}
			variant="borderless"
			role="region"
			aria-label={title}
			style={{ minWidth: 0 }}
		>
			{days.some((day) => day.totalCount > 0) ? (
				<Suspense
					fallback={
						<div style={{ height: chartHeight }} aria-busy="true">
							<Skeleton active paragraph={{ rows: 8 }} />
						</div>
					}
				>
					<LoginTrendChart days={days} height={chartHeight} />
				</Suspense>
			) : (
				<Flex justify="center" align="center" style={{ height: chartHeight }}>
					<Empty
						image={Empty.PRESENTED_IMAGE_SIMPLE}
						description={t("adminShell.dashboard.emptyLoginTrend")}
					/>
				</Flex>
			)}
		</Card>
	);
}
