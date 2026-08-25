import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface FormatPreferences {
	currency: string;
	language: string;
	timeZone: string;
}

export function formatDateTime(
	value: string,
	preferences: FormatPreferences,
	options: Intl.DateTimeFormatOptions = {},
) {
	const parsedValue = dayjs.utc(value);

	if (!parsedValue.isValid()) {
		return value;
	}

	return new Intl.DateTimeFormat(preferences.language, {
		dateStyle: "medium",
		timeStyle: "medium",
		...options,
		timeZone: preferences.timeZone,
	}).format(parsedValue.tz(preferences.timeZone).toDate());
}
