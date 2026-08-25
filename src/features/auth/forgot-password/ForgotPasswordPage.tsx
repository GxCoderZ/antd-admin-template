import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Flex, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { AuthPageShell } from "../components/AuthPageShell";

const { Paragraph, Title } = Typography;

interface ForgotPasswordPageProps {
	isDarkMode: boolean;
	onChangeThemeMode: (nextMode: "light" | "dark" | "system") => void;
	themeMode: "light" | "dark" | "system";
}

export function ForgotPasswordPage({
	isDarkMode,
	onChangeThemeMode,
	themeMode,
}: ForgotPasswordPageProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const navigate = useNavigate();

	return (
		<AuthPageShell
			isDarkMode={isDarkMode}
			onChangeThemeMode={onChangeThemeMode}
			themeMode={themeMode}
		>
			<section aria-labelledby="forgot-password-title">
				<Title id="forgot-password-title" level={3}>
					{t("forgotPassword.title")}
				</Title>
				<Paragraph type="secondary">
					{t("forgotPassword.contactAdministrator")}
				</Paragraph>

				<Flex
					data-testid="forgot-password-actions"
					gap={token.marginXS}
					vertical
				>
					<Button
						block
						icon={<ArrowLeftOutlined aria-hidden />}
						onClick={() => void navigate("/login")}
						size="large"
						type="primary"
					>
						{t("forgotPassword.backToLogin")}
					</Button>
				</Flex>
			</section>
		</AuthPageShell>
	);
}
