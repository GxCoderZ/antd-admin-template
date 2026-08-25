import {
	AuditOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	TeamOutlined,
	UserOutlined,
} from "@ant-design/icons";
import { ApiProblemError } from "#src/api/client";
import { skipToken, useQuery } from "@tanstack/react-query";
import {
	Button,
	Card,
	Col,
	Empty,
	Flex,
	Result,
	Row,
	Statistic,
	theme,
	Typography,
} from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { platformPermissions, usePermission } from "../../app/permissions";
import {
	dashboardStatisticsQueryKey,
	getDashboardStatistics,
} from "#src/api/dashboard";
import {
	platformAccountQueryKey,
	type PlatformAccount,
} from "#src/api/account";
import { platformSessionQueryKey, type PlatformSession } from "#src/api/auth";

interface DashboardMetric {
	icon: ReactNode;
	key: string;
	title: string;
	value: number;
}

const { Title } = Typography;

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

export function DashboardPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const canReadUsers = usePermission(platformPermissions.usersRead);
	const canReadRoles = usePermission(platformPermissions.rolesManage);
	const canReadLogs = usePermission(platformPermissions.logsRead);
	const accountQuery = useQuery<PlatformAccount>({
		queryFn: skipToken,
		queryKey: platformAccountQueryKey,
	});
	const sessionQuery = useQuery<PlatformSession>({
		queryFn: skipToken,
		queryKey: platformSessionQueryKey,
	});
	const hasVisibleStatistics = canReadUsers || canReadRoles || canReadLogs;
	const currentUserName =
		accountQuery.data?.displayName.trim() ||
		sessionQuery.data?.user.username ||
		accountQuery.data?.username;
	const statisticsQuery = useQuery({
		enabled: hasVisibleStatistics,
		queryFn: ({ signal }) => getDashboardStatistics(signal),
		queryKey: dashboardStatisticsQueryKey,
	});
	const greeting = currentUserName ? (
		<Title level={4} style={{ margin: 0 }}>
			{t("adminShell.analysis.greeting", { name: currentUserName })}
		</Title>
	) : null;

	if (!hasVisibleStatistics) {
		return (
			<Flex gap={token.marginLG} vertical>
				{greeting}
				<Card>
					<Empty description={t("adminShell.analysis.noPermissionData")} />
				</Card>
			</Flex>
		);
	}

	if (statisticsQuery.isError) {
		return (
			<Flex gap={token.marginLG} vertical>
				{greeting}
				<Card>
					<Result
						extra={
							<Button
								onClick={() => void statisticsQuery.refetch()}
								type="primary"
							>
								{t("adminShell.analysis.retry")}
							</Button>
						}
						status="error"
						subTitle={getProblemDetail(statisticsQuery.error)}
						title={t("adminShell.analysis.loadError")}
					/>
				</Card>
			</Flex>
		);
	}

	const statistics = statisticsQuery.data;
	const metrics: DashboardMetric[] = [
		...(canReadUsers && statistics?.userCount !== undefined
			? [
					{
						icon: <UserOutlined aria-hidden />,
						key: "users",
						title: t("adminShell.analysis.userCount"),
						value: statistics.userCount,
					},
				]
			: []),
		...(canReadRoles && statistics?.roleCount !== undefined
			? [
					{
						icon: <TeamOutlined aria-hidden />,
						key: "roles",
						title: t("adminShell.analysis.roleCount"),
						value: statistics.roleCount,
					},
				]
			: []),
		...(canReadLogs && statistics?.loginSuccessCount !== undefined
			? [
					{
						icon: <CheckCircleOutlined aria-hidden />,
						key: "login-success",
						title: t("adminShell.analysis.loginSuccessCount", {
							days: statistics.periodDays,
						}),
						value: statistics.loginSuccessCount,
					},
				]
			: []),
		...(canReadLogs && statistics?.loginFailureCount !== undefined
			? [
					{
						icon: <CloseCircleOutlined aria-hidden />,
						key: "login-failure",
						title: t("adminShell.analysis.loginFailureCount", {
							days: statistics.periodDays,
						}),
						value: statistics.loginFailureCount,
					},
				]
			: []),
		...(canReadLogs && statistics?.auditOperationCount !== undefined
			? [
					{
						icon: <AuditOutlined aria-hidden />,
						key: "audit-operations",
						title: t("adminShell.analysis.auditOperationCount", {
							days: statistics.periodDays,
						}),
						value: statistics.auditOperationCount,
					},
				]
			: []),
	];
	const loadingCardCount =
		Number(canReadUsers) + Number(canReadRoles) + Number(canReadLogs) * 3;

	return (
		<Flex gap={token.marginLG} vertical>
			{greeting}
			<Row gutter={[token.marginLG, token.marginLG]}>
				{statisticsQuery.isPending
					? Array.from({ length: loadingCardCount }, (_, index) => (
							<Col
								data-testid="dashboard-statistic-skeleton"
								key={index}
								lg={8}
								sm={12}
								xs={24}
							>
								<Card loading style={{ height: "100%" }} />
							</Col>
						))
					: metrics.map((metric) => (
							<Col key={metric.key} lg={8} sm={12} xs={24}>
								<Card
									data-testid={`dashboard-stat-${metric.key}`}
									style={{ height: "100%" }}
								>
									<Statistic
										prefix={metric.icon}
										title={metric.title}
										value={metric.value}
									/>
								</Card>
							</Col>
						))}
			</Row>
		</Flex>
	);
}
