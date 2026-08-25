import type { DashboardMetricType } from "#src/api/dashboard";

import type { DashboardMetricMeta } from "../constants";

import { Card, Flex, Statistic, Tag, theme, Typography } from "antd";

interface OverviewCardProps {
	meta: DashboardMetricMeta
	metric: DashboardMetricType
}

export function OverviewCard({ meta, metric }: OverviewCardProps) {
	const { token } = theme.useToken();
	const trendColor = metric.trend > 0 ? "success" : metric.trend < 0 ? "error" : "default";

	return (
		<Card className="h-full" data-testid={`dashboard-stat-${metric.key}`}>
			<Flex vertical gap={token.marginSM}>
				<Statistic
					prefix={(
						<span className="mr-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-colorPrimaryBg text-colorPrimary">
							{meta.icon}
						</span>
					)}
					title={metric.title}
					value={metric.value}
					suffix={metric.suffix}
					valueStyle={{ fontWeight: 650 }}
				/>
				<Flex align="center" gap={token.marginXS}>
					<Tag bordered={false} color={trendColor}>{`${metric.trend > 0 ? "+" : ""}${metric.trend}%`}</Tag>
					<Typography.Text type="secondary" className="text-xs">{metric.trendLabel}</Typography.Text>
				</Flex>
			</Flex>
		</Card>
	);
}
