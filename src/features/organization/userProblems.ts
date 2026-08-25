import { ApiProblemError } from "#src/api/client";

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

export function getUserMutationErrorTitleKey(
	error: unknown,
	invalidTitleKey = "adminShell.users.errors.invalid",
	conflictTitleKey = "adminShell.users.errors.conflict",
) {
	if (!(error instanceof ApiProblemError)) {
		return "adminShell.users.errors.request";
	}

	switch (error.status) {
		case 400:
			return invalidTitleKey;
		case 403:
			return "adminShell.users.errors.forbidden";
		case 409:
			return conflictTitleKey;
		default:
			return "adminShell.users.errors.request";
	}
}

export function getProblemFallback(error: unknown, fallback: string) {
	return getProblemDetail(error) ?? fallback;
}

export function isApiProblemStatus(error: unknown, status: number) {
	return error instanceof ApiProblemError && error.status === status;
}
