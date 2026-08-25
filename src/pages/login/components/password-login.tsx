import { BasicButton } from "#src/components/basic-button";
import { PASSWORD_RULES, USERNAME_RULES } from "#src/constants/rules";
import { forgotPasswordPath } from "#src/router/extra-info";
import { useAuthStore } from "#src/store/auth";

import { DownOutlined, LockOutlined, SafetyCertificateFilled, UserOutlined } from "@ant-design/icons";
import { Alert, Dropdown, Flex, Form, Input, message, theme, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

interface PasswordLoginValues {
	password: string
	username: string
}

export function PasswordLogin() {
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [passwordLoginForm] = Form.useForm<PasswordLoginValues>();
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [messageApi, contextHolder] = message.useMessage();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const login = useAuthStore(state => state.login);

	const handleFinish = async (values: PasswordLoginValues) => {
		setLoading(true);
		setErrorMessage("");
		const loadingMessage = messageApi.loading(t("authority.loginInProgress"), 0);

		try {
			await login(values);
			loadingMessage();
			messageApi.success(t("authority.loginSuccess"));
			const targetPath = searchParams.get("redirect") || import.meta.env.VITE_BASE_HOME_PATH;
			navigate(targetPath, { replace: true });
		}
		catch (error) {
			loadingMessage();
			setErrorMessage(error instanceof Error ? error.message : t("authority.loginFailed"));
		}
		finally {
			setLoading(false);
		}
	};

	const fillIdentity = (username: "admin" | "viewer") => {
		passwordLoginForm.setFieldsValue({
			username,
			password: username === "admin" ? "admin123" : "viewer123",
		});
		setErrorMessage("");
	};

	return (
		<>
			{contextHolder}
			<section aria-labelledby="login-title">
				<Typography.Title id="login-title" level={3} className="!mb-2">
					{t("authority.welcomeBack")}
				</Typography.Title>
				<Typography.Paragraph type="secondary" className="!mb-6">
					{t("authority.loginDescription")}
				</Typography.Paragraph>

				<Form<PasswordLoginValues>
					form={passwordLoginForm}
					initialValues={{ username: "admin", password: "admin123" }}
					layout="vertical"
					onFinish={handleFinish}
					requiredMark={false}
				>
					<Form.Item label={t("authority.username")} name="username" rules={USERNAME_RULES(t)}>
						<Input autoComplete="username" placeholder={t("form.username.required")} prefix={<UserOutlined />} size="large" />
					</Form.Item>

					<Form.Item label={t("authority.password")} name="password" rules={PASSWORD_RULES(t)}>
						<Input.Password autoComplete="current-password" placeholder={t("form.password.required")} prefix={<LockOutlined />} size="large" />
					</Form.Item>

					<Flex align="center" justify="space-between" className="-mt-2 mb-4">
						<Dropdown
							menu={{
								items: [
									{ key: "admin", label: t("authority.administratorAccount") },
									{ key: "viewer", label: t("authority.viewerAccount") },
								],
								onClick: ({ key }) => fillIdentity(key as "admin" | "viewer"),
							}}
							trigger={["click"]}
						>
							<BasicButton type="text" size="small" usage="table-action">
								{t("authority.demoAccounts")}
								<DownOutlined />
							</BasicButton>
						</Dropdown>
						<BasicButton type="link" size="small" onClick={() => navigate(forgotPasswordPath)}>
							{t("authority.forgotPassword")}
						</BasicButton>
					</Flex>

					{errorMessage && (
						<Alert className="mb-4" description={errorMessage} showIcon type="error" />
					)}

					<BasicButton block htmlType="submit" loading={loading} size="large" type="primary">
						{t("authority.login")}
					</BasicButton>
				</Form>
			</section>

			<Flex align="center" gap={6} justify="center">
				<SafetyCertificateFilled style={{ color: token.colorSuccess }} />
				<Typography.Text type="secondary" className="text-xs">
					{t("authority.authorizedOnly")}
				</Typography.Text>
			</Flex>
		</>
	);
}
