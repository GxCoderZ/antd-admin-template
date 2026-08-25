import type { ReactNode } from "react";

import { ThemeModeContext, type ThemeModeContextValue } from "./themeMode";

export function ThemeModeProvider({
	children,
	value,
}: {
	children: ReactNode;
	value: ThemeModeContextValue;
}) {
	return (
		<ThemeModeContext.Provider value={value}>
			{children}
		</ThemeModeContext.Provider>
	);
}
