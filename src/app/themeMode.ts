import { createContext, useContext } from "react";

import type { ThemeColor, ThemeMode } from "./preferenceStorage";

export interface ThemeChangeEvent {
	clientX?: number;
	clientY?: number;
	currentTarget?: EventTarget | null;
}

export interface ThemeModeContextValue {
	isColorBlindMode: boolean;
	isDarkMode: boolean;
	onChangeColorBlindMode: (enabled: boolean) => void;
	onChangeThemeColor: (nextThemeColor: ThemeColor) => void;
	themeMode: ThemeMode;
	onChangeThemeMode: (nextMode: ThemeMode, event?: ThemeChangeEvent) => void;
	themeColor: ThemeColor;
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(
	null,
);

export function useThemeMode() {
	const context = useContext(ThemeModeContext);

	if (!context) {
		throw new Error("ThemeModeContext is not available.");
	}

	return context;
}
