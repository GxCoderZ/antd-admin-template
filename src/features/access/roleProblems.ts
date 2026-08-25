import { ApiProblemError } from "#src/api/client";

export function getRoleProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

export function getRoleErrorTitleKey(error: unknown) {
	if (!(error instanceof ApiProblemError)) {
		return "adminShell.roles.errors.request";
	}

	switch (error.status) {
		case 400:
			return "adminShell.roles.errors.invalid";
		case 403:
			return "adminShell.roles.errors.forbidden";
		case 409:
			return "adminShell.roles.errors.conflict";
		default:
			return "adminShell.roles.errors.request";
	}
}

export function isRoleProblemStatus(error: unknown, status: number) {
	return error instanceof ApiProblemError && error.status === status;
}
