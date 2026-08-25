export interface ProblemDetails {
	type: string;
	title: string;
	status: number;
	detail?: string;
	instance?: string;
	[key: string]: unknown;
}

export interface ApiPage<T> {
	items: T[];
	total: number;
	page: number;
	page_size: number;
}

interface ApiEnvelope<T> {
	code: number;
	msg: string;
	data: T;
}

interface RequestOptions {
	method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
	query?:
		Record<string, boolean | number | string | null | undefined> | undefined;
	body?: unknown;
	signal?: AbortSignal | undefined;
}

export class ApiProblemError extends Error {
	readonly problem: ProblemDetails | null;
	readonly status: number;

	constructor(status: number, message: string, problem?: ProblemDetails) {
		super(problem?.detail ?? problem?.title ?? message);
		this.name = "ApiProblemError";
		this.problem = problem ?? null;
		this.status = status;
	}
}

function buildSearch(
	query?: Record<string, boolean | number | string | null | undefined>,
) {
	const search = new URLSearchParams();
	Object.entries(query ?? {}).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== "") {
			search.set(key, String(value));
		}
	});
	const value = search.toString();
	return value ? `?${value}` : "";
}

function isProblemDetails(value: unknown): value is ProblemDetails {
	if (!value || typeof value !== "object") {
		return false;
	}
	const candidate = value as Partial<ProblemDetails>;
	return (
		typeof candidate.status === "number" &&
		typeof candidate.title === "string" &&
		typeof candidate.type === "string"
	);
}

function isApiEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
	if (!value || typeof value !== "object") {
		return false;
	}
	const candidate = value as Partial<ApiEnvelope<T>>;
	return (
		typeof candidate.code === "number" &&
		typeof candidate.msg === "string" &&
		"data" in candidate
	);
}

export async function request<T>(
	path: string,
	{ method = "GET", query, body, signal }: RequestOptions = {},
): Promise<T> {
	const rawBody = body instanceof Blob || body instanceof FormData;
	const response = await fetch(`/api${path}${buildSearch(query)}`, {
		method,
		...(body === undefined
			? {}
			: { body: rawBody ? body : JSON.stringify(body) }),
		...(rawBody ? {} : { headers: { "Content-Type": "application/json" } }),
		...(signal ? { signal } : {}),
	});

	const payload = (await response.json()) as
		ApiEnvelope<T> | ProblemDetails | undefined;

	if (!response.ok) {
		const problem = isProblemDetails(payload) ? payload : undefined;
		throw new ApiProblemError(
			response.status,
			response.statusText || "Request failed",
			problem,
		);
	}

	if (!isApiEnvelope<T>(payload)) {
		throw new ApiProblemError(500, "Invalid Fake Server response");
	}

	if (payload.code !== 0) {
		const status =
			payload.code >= 400 && payload.code < 600 ? payload.code : 400;
		throw new ApiProblemError(status, payload.msg, {
			type: "about:blank",
			title: payload.msg,
			status,
			detail: payload.msg,
		});
	}

	return payload.data;
}
