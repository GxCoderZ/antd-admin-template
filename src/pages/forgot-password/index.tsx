import { BasicButton } from "#src/components/basic-button";
import { loginPath } from "#src/router/extra-info";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Result } from "antd";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { AuthPageShell } from "../login/components/auth-page-shell";

export default function ForgotPassword() {
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<AuthPageShell>
			<Result
				status="info"
				title={t("authority.forgotPassword")}
				subTitle={t("authority.contactAdministrator")}
				extra={(
					<BasicButton block icon={<ArrowLeftOutlined />} size="large" type="primary" onClick={() => navigate(loginPath)}>
						{t("authority.backToLogin")}
					</BasicButton>
				)}
			/>
		</AuthPageShell>
	);
}
