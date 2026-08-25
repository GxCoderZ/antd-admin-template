import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { defaultPreferences } from "./preferenceStorage";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface FormatPreferences {
	currency: string;
	language: string;
	timeZone: string;
}

export function createDefaultFormatPreferences(
	language: string,
): FormatPreferences {
	return {
		currency: defaultPreferences.currency,
		language,
		timeZone: defaultPreferences.timeZone,
	};
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

export function formatNumber(
	value: number,
	preferences: FormatPreferences,
	options: Intl.NumberFormatOptions = {},
) {
	return new Intl.NumberFormat(preferences.language, options).format(value);
}

export function formatCurrency(
	value: number,
	preferences: FormatPreferences,
	options: Intl.NumberFormatOptions = {},
) {
	return new Intl.NumberFormat(preferences.language, {
		...options,
		currency: preferences.currency,
		style: "currency",
	}).format(value);
}
