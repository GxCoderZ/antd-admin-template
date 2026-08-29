import { Card, Descriptions, Flex, theme, Typography } from "antd";
import type { DescriptionsProps } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";
import { getSystemInfo, systemInfoQueryKey } from "#src/api/system";

const { Text } = Typography;

export function AboutSystemPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const formatPreferences = useLocalePreferences();
	const systemInfoQuery = useQuery({
		queryKey: [systemInfoQueryKey],
		queryFn: ({ signal }) => getSystemInfo(signal),
	});
	const systemInfoItems: DescriptionsProps["items"] = systemInfoQuery.data
		? [
				{
					key: "service",
					label: t("adminShell.about.runtime.service"),
					children: systemInfoQuery.data.service,
				},
				{
					key: "version",
					label: t("adminShell.about.runtime.version"),
					children: systemInfoQuery.data.version,
				},
				{
					key: "environment",
					label: t("adminShell.about.runtime.environment"),
					children: t(
						`adminShell.about.runtime.environments.${systemInfoQuery.data.environment}`,
					),
				},
				{
					key: "commit",
					label: t("adminShell.about.runtime.commit"),
					children:
						systemInfoQuery.data.commitSha === "local"
							? t("adminShell.about.runtime.localCommit")
							: systemInfoQuery.data.commitSha.slice(0, 8),
				},
				{
					key: "builtAt",
					label: t("adminShell.about.runtime.builtAt"),
					span: "filled",
					children: formatDateTime(
						systemInfoQuery.data.builtAt,
						formatPreferences,
					),
				},
			]
		: [];

	return (
		<Flex gap={token.marginLG} vertical>
			<Card
				data-testid="about-runtime-service"
				loading={systemInfoQuery.isPending}
				title={t("adminShell.about.runtime.title")}
			>
				{systemInfoQuery.isError ? (
					<Text type="secondary">
						{t("adminShell.about.runtime.loadError")}
					</Text>
				) : (
					<Descriptions
						column={{ xs: 1, sm: 2, lg: 3 }}
						items={systemInfoItems}
						size="small"
					/>
				)}
			</Card>
		</Flex>
	);
}
