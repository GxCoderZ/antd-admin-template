import type { DashboardMetricType } from "#src/api/dashboard";

import { ArrowDownOutlined, ArrowUpOutlined, MinusOutlined } from "@ant-design/icons";
import { Card, Flex, Statistic, Tag, Typography } from "antd";

interface OverviewCardProps {
	metric: DashboardMetricType
}

export function OverviewCard({ metric }: OverviewCardProps) {
	const trendColor = metric.trend > 0 ? "success" : metric.trend < 0 ? "error" : "default";
	const TrendIcon = metric.trend > 0 ? ArrowUpOutlined : metric.trend < 0 ? ArrowDownOutlined : MinusOutlined;

	return (
		<Card className="h-full" styles={{ body: { padding: 20 } }}>
			<Flex vertical gap={14}>
				<Typography.Text type="secondary">{metric.title}</Typography.Text>
				<Statistic value={metric.value} suffix={metric.suffix} valueStyle={{ fontWeight: 650 }} />
				<Flex align="center" gap={8}>
					<Tag color={trendColor} bordered={false} icon={<TrendIcon />}>
						{`${Math.abs(metric.trend)}%`}
					</Tag>
					<Typography.Text type="secondary" className="text-xs">
						{metric.trendLabel}
					</Typography.Text>
				</Flex>
			</Flex>
		</Card>
	);
}
