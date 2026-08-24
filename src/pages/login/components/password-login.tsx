import { PASSWORD_RULES, USERNAME_RULES } from "#src/constants/rules";
import { useAuthStore } from "#src/store/auth";

import {
	Button,
	Card,
	Form,
	Input,
	message,
	Space,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

export function PasswordLogin() {
	const [loading, setLoading] = useState(false);
	const [passwordLoginForm] = Form.useForm();
	const { t } = useTranslation();
	const [messageLoadingApi, contextLoadingHolder] = message.useMessage();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const login = useAuthStore(state => state.login);

	const handleFinish = async (values: { username: string, password: string }) => {
		setLoading(true);
		messageLoadingApi?.loading(t("authority.loginInProgress"), 0);

		try {
			await login({
				username: values.username,
				password: values.password,
			});
			messageLoadingApi?.destroy();
			window.$message?.success(t("authority.loginSuccess"));
			const redirect = searchParams.get("redirect");
			const targetPath = redirect || import.meta.env.VITE_BASE_HOME_PATH;
			navigate(targetPath, { replace: true });
		}
		catch (err: any) {
			messageLoadingApi?.destroy();
			window.$message?.error(err?.message || "登录失败");
		}
		finally {
			setLoading(false);
		}
	};

	return (
		<>
			{contextLoadingHolder}
			<Space direction="vertical">
				<h2 className="text-colorText mb-3 text-3xl font-bold leading-9 tracking-tight lg:text-4xl">
					{t("authority.welcomeBack")}
					&nbsp;
					👋
				</h2>
				<p className="lg:text-base text-sm text-colorTextSecondary">
					{t("authority.loginDescription")}
				</p>
			</Space>

			<Form
				name="passwordLoginForm"
				form={passwordLoginForm}
				layout="vertical"
				initialValues={{ username: "admin", password: "admin123" }}
				onFinish={handleFinish}
			>
				<Form.Item
					label={t("authority.username")}
					name="username"
					rules={USERNAME_RULES(t)}
				>
					<Input placeholder={t("form.username.required")} />
				</Form.Item>

				<Form.Item
					label={t("authority.password")}
					name="password"
					rules={PASSWORD_RULES(t)}
				>
					<Input.Password placeholder={t("form.password.required")} />
				</Form.Item>

				<Form.Item>
					<Button block type="primary" htmlType="submit" loading={loading}>
						{t("authority.login")}
					</Button>
				</Form.Item>

				<Card size="small" title={t("authority.demoAccounts")}>
					<Space wrap>
						<Button
							size="small"
							onClick={() => passwordLoginForm.setFieldsValue({ username: "admin", password: "admin123" })}
						>
							{t("authority.administratorAccount")}
						</Button>
						<Button
							size="small"
							onClick={() => passwordLoginForm.setFieldsValue({ username: "viewer", password: "viewer123" })}
						>
							{t("authority.viewerAccount")}
						</Button>
					</Space>
				</Card>
			</Form>
		</>
	);
}
