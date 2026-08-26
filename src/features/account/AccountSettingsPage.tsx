import { getPlatformAccount, platformAccountQueryKey } from "#src/api/account";
import { ApiProblemError } from "#src/api/client";
import { useQuery } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Flex,
	Grid,
	Menu,
	Skeleton,
	theme,
	Typography,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { BasicSettings } from "./settings/BasicSettings";
import { NotificationSettings } from "./settings/NotificationSettings";
import { SecuritySettings } from "./settings/SecuritySettings";

const { Title } = Typography;
const settingsSections = ["basic", "security", "notification"] as const;
type SettingsSection = (typeof settingsSections)[number];

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

export function AccountSettingsPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const [selectedSection, setSelectedSection] =
		useState<SettingsSection>("basic");
	const accountQuery = useQuery({
		queryFn: ({ signal }) => getPlatformAccount(signal),
		queryKey: platformAccountQueryKey,
	});
	const sectionLabels: Record<SettingsSection, string> = {
		basic: t("adminShell.account.settings.sections.basic"),
		notification: t("adminShell.account.settings.sections.notification"),
		security: t("adminShell.account.settings.sections.security"),
	};
	const compact = screens.md === false;
	let content;

	switch (selectedSection) {
		case "basic":
			content = (
				<>
					{accountQuery.isPending ? (
						<Skeleton active paragraph={{ rows: 8 }} />
					) : null}
					{accountQuery.isError ? (
						<Alert
							action={
								<Button onClick={() => void accountQuery.refetch()}>
									{t("adminShell.account.retry")}
								</Button>
							}
							description={
								getProblemDetail(accountQuery.error) ??
								t("adminShell.account.requestErrorFallback")
							}
							showIcon
							title={t("adminShell.account.profile.loadError")}
							type="error"
						/>
					) : null}
					{accountQuery.data ? (
						<BasicSettings account={accountQuery.data} />
					) : null}
				</>
			);
			break;
		case "security":
			content = <SecuritySettings />;
			break;
		case "notification":
			content = <NotificationSettings />;
			break;
	}

	return (
		<Flex
			style={{
				background: token.colorBgContainer,
				minHeight: 520,
				width: "100%",
			}}
			vertical={compact}
		>
			<nav
				aria-label={t("adminShell.account.settings.navigationLabel")}
				style={{
					borderBottom: compact
						? `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`
						: undefined,
					borderInlineEnd: compact
						? undefined
						: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
					flex: "0 0 auto",
					paddingBlock: compact ? 0 : token.paddingLG,
					width: compact ? "100%" : token.controlHeight * 6,
				}}
			>
				<Menu
					items={settingsSections.map((section) => ({
						key: section,
						label: sectionLabels[section],
					}))}
					mode={compact ? "horizontal" : "inline"}
					onClick={({ key }) => setSelectedSection(key as SettingsSection)}
					selectedKeys={[selectedSection]}
					style={{ border: 0 }}
				/>
			</nav>
			<section
				style={{
					flex: "1 1 auto",
					minWidth: 0,
					padding: token.paddingLG,
				}}
			>
				<Title
					level={4}
					style={{ fontSize: 20, lineHeight: "28px", margin: "0 0 12px" }}
				>
					{sectionLabels[selectedSection]}
				</Title>
				{content}
			</section>
		</Flex>
	);
}
