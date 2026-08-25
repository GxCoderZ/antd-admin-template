import type { Dayjs } from "dayjs";

export function transformDateTimeRange(value: unknown) {
	const range = value as [Dayjs, Dayjs] | undefined;
	return {
		date_from: range?.[0]?.format("YYYY-MM-DD HH:mm:ss"),
		date_to: range?.[1]?.format("YYYY-MM-DD HH:mm:ss"),
	};
}
