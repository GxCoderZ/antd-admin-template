import { Line } from "@ant-design/plots";
import { theme } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { DashboardStatistics } from "#src/api/dashboard";
import { useThemeMode } from "../../../app/themeMode";

// Pro's OfflineData Line configuration, adapted for local data and theme tokens.
export default function LoginTrendChart({
	days,
	height,
}: {
	days: DashboardStatistics["loginTrend"];
	height: number;
}) {
	const { t, i18n } = useTranslation();
	const { token } = theme.useToken();
	const { isDarkMode } = useThemeMode();
	const dateFormat = useMemo(
		() =>
			new Intl.DateTimeFormat(i18n.language, {
				month: "numeric",
				day: "numeric",
				timeZone: "UTC",
			}),
		[i18n.language],
	);
	const data = useMemo(
		() =>
			days.flatMap((day) => [
				{
					date: day.date,
					value: day.totalCount,
					type: t("adminShell.dashboard.trendTotal"),
				},
				{
					date: day.date,
					value: day.abnormalCount,
					type: t("adminShell.dashboard.trendAbnormal"),
				},
			]),
		[days, t],
	);

	return (
		<div
			role="img"
			aria-label={days
				.map((day) =>
					t("adminShell.dashboard.trendDaySummary", {
						date: day.date,
						total: day.totalCount,
						abnormal: day.abnormalCount,
					}),
				)
				.join("; ")}
		>
			<Line
				height={height}
				data={data}
				xField="date"
				yField="value"
				colorField="type"
				animate={false}
				theme={{
					type: isDarkMode ? "dark" : "light",
					fontFamily: token.fontFamily,
				}}
				scale={{
					x: { type: "point" },
					y: { domainMin: 0, nice: true },
					color: { range: [token.colorPrimary, token.colorError] },
				}}
				axis={{
					x: {
						title: false,
						labelFormatter: (date: string) => dateFormat.format(new Date(date)),
					},
					y: {
						title: false,
						gridLineDash: null,
						gridStroke: token.colorBorderSecondary,
						gridStrokeOpacity: 1,
					},
				}}
				legend={{ color: { layout: { justifyContent: "center" } } }}
			/>
		</div>
	);
}
