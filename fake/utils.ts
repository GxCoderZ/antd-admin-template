export function resultSuccess<T>(data: T, msg = "OK") {
	return { code: 0, msg, data };
}

export function resultError(msg: string, code = 400) {
	return { code, msg, data: null };
}

export function routeParam(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value;
}

export function pageValue(
	value: string | string[] | undefined,
	fallback: number,
) {
	const parsed = Number(routeParam(value));
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
