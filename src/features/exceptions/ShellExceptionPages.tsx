import { ExceptionResultPage } from "./ExceptionResultPage";

export function ShellForbiddenPage() {
	return (
		<ExceptionResultPage
			status="403"
			subTitleKey="adminShell.exceptions.forbiddenDescription"
		/>
	);
}

export function ShellNotFoundPage() {
	return (
		<ExceptionResultPage
			status="404"
			subTitleKey="adminShell.exceptions.notFoundDescription"
		/>
	);
}

export function ShellRouteErrorPage() {
	return (
		<ExceptionResultPage
			status="500"
			subTitleKey="adminShell.exceptions.serverErrorDescription"
		/>
	);
}
