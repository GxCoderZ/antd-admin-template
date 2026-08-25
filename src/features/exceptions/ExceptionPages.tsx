import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { ExceptionPage } from "./ExceptionPage";

function useBackHome() {
	const navigate = useNavigate();
	return () => void navigate("/dashboard");
}

export function ForbiddenPage() {
	const { t } = useTranslation();
	const backHome = useBackHome();

	return (
		<ExceptionPage
			backHomeLabel={t("adminShell.exceptions.backHome")}
			description={t("adminShell.exceptions.forbiddenDescription")}
			onBackHome={backHome}
			status="403"
		/>
	);
}

export function NotFoundPage() {
	const { t } = useTranslation();
	const backHome = useBackHome();

	return (
		<ExceptionPage
			backHomeLabel={t("adminShell.exceptions.backHome")}
			description={t("adminShell.exceptions.notFoundDescription")}
			onBackHome={backHome}
			status="404"
		/>
	);
}

export function ServerErrorPage() {
	const { t } = useTranslation();
	const backHome = useBackHome();

	return (
		<ExceptionPage
			backHomeLabel={t("adminShell.exceptions.backHome")}
			description={t("adminShell.exceptions.serverErrorDescription")}
			onBackHome={backHome}
			status="500"
		/>
	);
}

export function RouteErrorPage() {
	return <ServerErrorPage />;
}
