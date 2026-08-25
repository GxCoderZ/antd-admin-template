import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

import type { FormatPreferences } from "./formatting";
import {
	readCurrencyPreference,
	readTimeZonePreference,
	type CurrencyCode,
	type SupportedLanguageCode,
	type TimeZone,
	writeCurrencyPreference,
	writeTimeZonePreference,
} from "./preferenceStorage";

export interface LocalePreferences extends FormatPreferences {
	currency: CurrencyCode;
	language: SupportedLanguageCode;
	onChangeCurrency: (currency: CurrencyCode) => void;
	onChangeTimeZone: (timeZone: TimeZone) => void;
}

export const LocalePreferencesContext = createContext<LocalePreferences | null>(
	null,
);

export function useLocalePreferenceState(
	language: SupportedLanguageCode,
): LocalePreferences {
	const [currency, setCurrency] = useState(readCurrencyPreference);
	const [timeZone, setTimeZone] = useState(readTimeZonePreference);
	const changeCurrency = useCallback((nextCurrency: CurrencyCode) => {
		writeCurrencyPreference(nextCurrency);
		setCurrency(nextCurrency);
	}, []);
	const changeTimeZone = useCallback((nextTimeZone: TimeZone) => {
		writeTimeZonePreference(nextTimeZone);
		setTimeZone(nextTimeZone);
	}, []);

	return useMemo(
		() => ({
			currency,
			language,
			onChangeCurrency: changeCurrency,
			onChangeTimeZone: changeTimeZone,
			timeZone,
		}),
		[changeCurrency, changeTimeZone, currency, language, timeZone],
	);
}

export function useLocalePreferences() {
	const context = useContext(LocalePreferencesContext);

	if (!context) {
		throw new Error("LocalePreferencesContext is not available.");
	}

	return context;
}
