import {
	BgColorsOutlined,
	GlobalOutlined,
	MoonOutlined,
	SunOutlined,
} from "@ant-design/icons";
import { Card, Flex, Grid, Select, theme, Typography } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { PlatformLogo } from "../../../app/PlatformLogo";
import { usePlatformBrand } from "../../../app/usePlatformBrand";
import { resolveSupportedLanguage, supportedLanguages } from "../../../i18n";
import styles from "./AuthPageShell.module.css";

const { Text, Title } = Typography;

interface AuthPageShellProps {
	children: ReactNode;
	isDarkMode: boolean;
	onChangeThemeMode: (nextMode: "light" | "dark" | "system") => void;
	themeMode: "light" | "dark" | "system";
}

export function AuthPageShell({
	children,
	isDarkMode,
	onChangeThemeMode,
	themeMode,
}: AuthPageShellProps) {
	const { t, i18n } = useTranslation();
	const { token } = theme.useToken();
	const brand = usePlatformBrand();
	const screens = Grid.useBreakpoint();
	const language = resolveSupportedLanguage(i18n.resolvedLanguage);
	const isWide = screens.sm === true;
	const background = `radial-gradient(circle at 18% 18%, ${token.colorPrimaryBg} 0, transparent 34%), ${token.colorBgLayout}`;
	const pagePaddingInline = isWide ? token.paddingLG : token.padding;
	const pagePaddingBlockStart =
		pagePaddingInline +
		token.controlHeight +
		(isWide ? token.marginXL : token.marginLG);
	const toolbarInset = pagePaddingInline;
	const selectWidth = token.controlHeight * 4 + (isWide ? token.marginXS : 0);
	const cardMaxWidth = token.screenXS - token.marginXL * 2;
	const logoSize = token.controlHeightLG + token.marginXS;

	return (
		<main
			className={styles.page}
			style={{
				background,
				paddingBlockEnd: pagePaddingInline,
				paddingBlockStart: pagePaddingBlockStart,
				paddingInline: pagePaddingInline,
				rowGap: token.marginLG,
			}}
		>
			<Flex
				className={styles.toolbar}
				gap={token.marginXS}
				style={{ insetInlineEnd: toolbarInset, top: toolbarInset }}
			>
				<Select
					aria-label={t("language.label")}
					onChange={(nextLanguage) => void i18n.changeLanguage(nextLanguage)}
					options={supportedLanguages.map(({ code, labelKey }) => ({
						value: code,
						label: t(labelKey),
					}))}
					prefix={<GlobalOutlined />}
					style={{ width: selectWidth }}
					value={language}
				/>
				<Select<"light" | "dark" | "system">
					aria-label={t("theme.label")}
					onChange={(nextMode) => onChangeThemeMode(nextMode)}
					options={[
						{ value: "system", label: t("theme.system") },
						{ value: "light", label: t("theme.light") },
						{ value: "dark", label: t("theme.dark") },
					]}
					prefix={
						themeMode === "system" ? (
							<BgColorsOutlined />
						) : isDarkMode ? (
							<SunOutlined />
						) : (
							<MoonOutlined />
						)
					}
					style={{ width: selectWidth }}
					value={themeMode}
				/>
			</Flex>

			<Card
				className={styles.card}
				style={{
					boxShadow: isWide ? token.boxShadowSecondary : "none",
					maxWidth: cardMaxWidth,
				}}
				styles={{
					body: { padding: isWide ? token.paddingXL : token.paddingLG },
				}}
			>
				<Flex vertical gap={token.marginLG}>
					<header className={styles.header}>
						<PlatformLogo size={logoSize} src={brand.logoDataUrl} />
						<Title
							level={4}
							style={{
								marginBlockEnd: token.marginXXS,
								overflowWrap: "anywhere",
							}}
						>
							{brand.siteTitle}
						</Title>
						<Text type="secondary">{t("app.description")}</Text>
					</header>

					{children}
				</Flex>
			</Card>

			<Text className={styles.footer} type="secondary">
				{brand.copyright}
			</Text>
		</main>
	);
}
