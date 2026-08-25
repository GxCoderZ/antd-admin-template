import { describe, expect, it } from "vitest";

import { i18n, supportedLanguages } from "./i18n";
import { enTranslation } from "./locales/en";
import { koKRTranslation } from "./locales/ko-KR";
import { zhCNTranslation } from "./locales/zh-CN";
import { zhTWTranslation } from "./locales/zh-TW";

function translationKeys(
	value: Record<string, unknown>,
	prefix = "",
): string[] {
	return Object.entries(value).flatMap(([key, child]) => {
		const path = prefix ? `${prefix}.${key}` : key;
		return child && typeof child === "object" && !Array.isArray(child)
			? translationKeys(child as Record<string, unknown>, path)
			: [path];
	});
}

describe("internationalization", () => {
	it("keeps every supported language available on login and in the admin shell", () => {
		expect(supportedLanguages.map(({ code }) => code)).toEqual([
			"zh-CN",
			"zh-TW",
			"en",
			"ko-KR",
		]);
		for (const { code: language } of supportedLanguages) {
			expect(i18n.exists("login.title", { lng: language })).toBe(true);
			expect(
				i18n.exists("adminShell.navigation.dashboard", { lng: language }),
			).toBe(true);
			expect(i18n.exists("theme.dark", { lng: language })).toBe(true);
		}
	});

	it("keeps the complete translation key set aligned across all languages", () => {
		const translations = {
			"zh-CN": zhCNTranslation,
			"zh-TW": zhTWTranslation,
			en: enTranslation,
			"ko-KR": koKRTranslation,
		};
		const referenceKeys = translationKeys(enTranslation).sort();

		for (const [language, translation] of Object.entries(translations)) {
			expect(translationKeys(translation).sort(), language).toEqual(
				referenceKeys,
			);
		}
	});
});
