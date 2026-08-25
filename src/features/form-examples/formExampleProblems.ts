import { ApiProblemError } from "#src/api/client";

export function getFormExampleProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}
