import {
	LockOutlined,
	SafetyCertificateFilled,
	UserOutlined,
} from "@ant-design/icons";
import { ApiProblemError } from "#src/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Flex, Form, Input, theme, Typography } from "antd";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";

import { getBrowserTimeZone } from "../../../app/deviceInfo";
import { AuthPageShell } from "../components/AuthPageShell";
import { loginPlatform, platformSessionQueryKey } from "#src/api/auth";

const { Paragraph, Text, Title } = Typography;

interface LoginFormValues {
	username: string;
	password: string;
}

interface LoginPageProps {
	isDarkMode: boolean;
	onChangeThemeMode: (nextMode: "light" | "dark" | "system") => void;
	themeMode: "light" | "dark" | "system";
}

export function LoginPage({
	isDarkMode,
	onChangeThemeMode,
	themeMode,
}: LoginPageProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const location = useLocation();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const sessionExpired =
		(
			location.state as {
				sessionExpired?: boolean;
			} | null
		)?.sessionExpired === true;
	const loginMutation = useMutation({
		mutationFn: (values: LoginFormValues) => {
			const timeZone = getBrowserTimeZone();

			return loginPlatform({
				identifier: values.username,
				password: values.password,
				...(timeZone ? { timeZone } : {}),
			});
		},
		onSuccess: async (session) => {
			queryClient.setQueryData(platformSessionQueryKey, session);
			await navigate("/dashboard", { replace: true });
		},
	});

	const loginError = (() => {
		if (!loginMutation.error) {
			return null;
		}
		if (loginMutation.error instanceof ApiProblemError) {
			if (loginMutation.error.status === 401) {
				return t("login.invalidCredentials");
			}
			if (loginMutation.error.status === 429) {
				return t("login.rateLimited");
			}
		}

		return t("login.failed");
	})();

	return (
		<AuthPageShell
			isDarkMode={isDarkMode}
			onChangeThemeMode={onChangeThemeMode}
			themeMode={themeMode}
		>
			{sessionExpired ? (
				<Alert
					description={t("login.sessionExpired")}
					showIcon
					type="warning"
				/>
			) : null}
			<section aria-labelledby="login-title">
				<Title id="login-title" level={3}>
					{t("login.title")}
				</Title>
				<Paragraph type="secondary">{t("login.subtitle")}</Paragraph>

				<Form<LoginFormValues>
					layout="vertical"
					onFinish={(values) => loginMutation.mutate(values)}
					requiredMark={false}
				>
					<Form.Item
						label={t("login.username")}
						name="username"
						rules={[{ required: true, message: t("login.usernameRequired") }]}
					>
						<Input
							autoComplete="username"
							placeholder={t("login.usernamePlaceholder")}
							prefix={<UserOutlined />}
							size="large"
						/>
					</Form.Item>

					<Form.Item
						label={t("login.password")}
						name="password"
						rules={[{ required: true, message: t("login.passwordRequired") }]}
					>
						<Input.Password
							autoComplete="current-password"
							placeholder={t("login.passwordPlaceholder")}
							prefix={<LockOutlined />}
							size="large"
						/>
					</Form.Item>

					<Form.Item>
						<Flex justify="flex-end">
							<Button
								htmlType="button"
								onClick={() => void navigate("/forgot-password")}
								type="link"
							>
								{t("login.forgot")}
							</Button>
						</Flex>
					</Form.Item>

					{loginError ? (
						<Form.Item>
							<Alert description={loginError} showIcon type="error" />
						</Form.Item>
					) : null}

					<Button
						block
						htmlType="submit"
						loading={loginMutation.isPending}
						size="large"
						type="primary"
					>
						{t("login.submit")}
					</Button>
				</Form>
			</section>

			<Flex align="center" gap={4} justify="center">
				<SafetyCertificateFilled style={{ color: token.colorSuccess }} />
				<Text type="secondary">{t("login.authorizedOnly")}</Text>
			</Flex>
		</AuthPageShell>
	);
}
