import type { ReactNode } from "react";

import {
	LocalePreferencesContext,
	type LocalePreferences,
} from "./localePreferences";

export function LocalePreferencesProvider({
	children,
	value,
}: {
	children: ReactNode;
	value: LocalePreferences;
}) {
	return (
		<LocalePreferencesContext.Provider value={value}>
			{children}
		</LocalePreferencesContext.Provider>
	);
}
