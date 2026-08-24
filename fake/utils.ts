export function resultSuccess<T>(data: T, msg = "操作成功") {
	return {
		code: 0,
		msg,
		data,
	};
}

export function resultError(msg: string, code = 1001) {
	return {
		code,
		msg,
		data: null,
	};
}
