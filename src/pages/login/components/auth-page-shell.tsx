import type { ReactNode } from "react";
import { LanguageButton } from "#src/layout/layout-header/components/language-button";

import { ThemeButton } from "#src/layout/layout-header/components/theme-button";
import { SafetyCertificateFilled } from "@ant-design/icons";
import { Avatar, Card, Flex, Grid, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";

interface AuthPageShellProps {
	children: ReactNode
}

export function AuthPageShell({ children }: AuthPageShellProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const isWide = screens.sm === true;

	return (
		<main
			className="relative flex min-h-screen items-center justify-center"
			style={{
				background: `radial-gradient(circle at 18% 18%, ${token.colorPrimaryBg} 0, transparent 34%), ${token.colorBgLayout}`,
				padding: isWide ? token.paddingXL : token.padding,
			}}
		>
			<Flex className="absolute right-4 top-4" gap={token.marginXS}>
				<ThemeButton aria-label={t("authority.changeTheme")} />
				<LanguageButton aria-label={t("authority.changeLanguage")} />
			</Flex>

			<Card
				className="w-full"
				style={{ maxWidth: 440, boxShadow: isWide ? token.boxShadowSecondary : "none" }}
				styles={{ body: { padding: isWide ? token.paddingXL : token.paddingLG } }}
			>
				<Flex vertical gap={token.marginLG}>
					<header className="text-center">
						<Avatar
							icon={<SafetyCertificateFilled />}
							shape="square"
							size={48}
							style={{ backgroundColor: token.colorPrimary, fontSize: token.fontSizeHeading3, marginBottom: token.marginSM }}
						/>
						<Typography.Title level={4} className="!mb-1">
							{import.meta.env.VITE_GLOB_APP_TITLE}
						</Typography.Title>
						<Typography.Text type="secondary">{t("authority.shellDescription")}</Typography.Text>
					</header>

					{children}
				</Flex>
			</Card>

			<Typography.Text className="absolute bottom-4 text-center text-xs" type="secondary">
				{t("authority.copyright", { app: import.meta.env.VITE_GLOB_APP_TITLE })}
			</Typography.Text>
		</main>
	);
}
