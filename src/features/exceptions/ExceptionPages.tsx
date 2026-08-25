import { Button, Card, Result } from "antd";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

function BackHomeButton() {
	const { t } = useTranslation();

	return (
		<Link to="/dashboard">
			<Button type="primary">{t("adminShell.exceptions.backHome")}</Button>
		</Link>
	);
}

export function ForbiddenPage() {
	const { t } = useTranslation();

	return (
		<Card variant="borderless">
			<Result
				extra={<BackHomeButton />}
				status="403"
				subTitle={t("adminShell.exceptions.forbiddenDescription")}
				title="403"
			/>
		</Card>
	);
}

export const NotFoundPage: FC = () => {
	const { t } = useTranslation();

	return (
		<Card variant="borderless">
			<Result
				extra={<BackHomeButton />}
				status="404"
				subTitle={t("adminShell.exceptions.notFoundDescription")}
				title="404"
			/>
		</Card>
	);
};

export function ServerErrorPage() {
	const { t } = useTranslation();

	return (
		<Card variant="borderless">
			<Result
				extra={<BackHomeButton />}
				status="500"
				subTitle={t("adminShell.exceptions.serverErrorDescription")}
				title="500"
			/>
		</Card>
	);
}

export function RouteErrorPage() {
	return <ServerErrorPage />;
}
