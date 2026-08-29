import { ReloadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Button, ConfigProvider, Flex, Result, Skeleton, theme } from "antd";
import { useTranslation } from "react-i18next";

import {
	dashboardStatisticsQueryKey,
	getDashboardStatistics,
} from "#src/api/dashboard";
import {
	getPlatformSettings,
	platformSettingsQueryKey,
} from "#src/api/settings";
import { useLocalePreferences } from "../../app/localePreferences";
import {
	platformPermissions,
	usePermissionChecker,
} from "../../app/permissions";
import { appAntdCssVar } from "../../app/antdCssVar";
import { DashboardOverview } from "./components/DashboardOverview";
import { DashboardActivityPanels } from "./components/DashboardActivityPanels";

export function DashboardPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { timeZone } = useLocalePreferences();
	const can = usePermissionChecker();
	const hasStatistics = [
		platformPermissions.usersRead,
		platformPermissions.rolesManage,
		platformPermissions.logsRead,
		platformPermissions.announcementsRead,
	].some(can);
	const statisticsQuery = useQuery({
		enabled: hasStatistics,
		queryFn: ({ signal }) => getDashboardStatistics(timeZone, signal),
		queryKey: [...dashboardStatisticsQueryKey, timeZone],
		// Returning from a management page must reflect its in-memory mutations.
		staleTime: 0,
	});
	const settingsQuery = useQuery({
		queryFn: ({ signal }) => getPlatformSettings(signal),
		queryKey: platformSettingsQueryKey,
	});

	if (settingsQuery.isError || (hasStatistics && statisticsQuery.isError)) {
		return (
			<Result
				status="error"
				title={t("adminShell.dashboard.loadError")}
				extra={
					<Button
						type="primary"
						icon={<ReloadOutlined aria-hidden />}
						onClick={() => {
							if (settingsQuery.isError) void settingsQuery.refetch();
							if (hasStatistics && statisticsQuery.isError)
								void statisticsQuery.refetch();
						}}
					>
						{t("adminShell.dashboard.retry")}
					</Button>
				}
			/>
		);
	}

	if (settingsQuery.isPending || (hasStatistics && statisticsQuery.isPending)) {
		return (
			<Flex
				vertical
				gap={token.marginLG}
				data-testid="dashboard-skeleton"
				aria-busy="true"
			>
				<Skeleton active paragraph={{ rows: 3 }} />
				<Skeleton active paragraph={{ rows: 5 }} />
			</Flex>
		);
	}

	return (
		<ConfigProvider
			theme={{
				cssVar: appAntdCssVar,
				components: {
					Card: {
						// Match Pro's Card defaults without changing the application theme.
						borderRadiusLG: 8,
						boxShadowTertiary:
							"0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)",
					},
				},
			}}
		>
			<Flex vertical gap={token.marginLG}>
				<DashboardOverview
					statistics={hasStatistics ? statisticsQuery.data : undefined}
				/>
				<DashboardActivityPanels
					statistics={hasStatistics ? statisticsQuery.data : undefined}
					settings={settingsQuery.data}
				/>
			</Flex>
		</ConfigProvider>
	);
}
