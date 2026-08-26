import { Button, Card, Result } from "antd";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

interface ExceptionResultPageProps {
	status: "403" | "404" | "500";
	subTitleKey: string;
}

function BackHomeButton() {
	const { t } = useTranslation();

	return (
		<Link to="/dashboard">
			<Button type="primary">{t("adminShell.exceptions.backHome")}</Button>
		</Link>
	);
}

export function ExceptionResultPage({
	status,
	subTitleKey,
}: ExceptionResultPageProps) {
	const { t } = useTranslation();

	return (
		<Card variant="borderless">
			<Result
				extra={<BackHomeButton />}
				status={status}
				subTitle={t(subTitleKey)}
				title={status}
			/>
		</Card>
	);
}
