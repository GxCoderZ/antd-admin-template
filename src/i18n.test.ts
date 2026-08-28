import { describe, expect, it } from "vitest";

import {
	getSupportedLanguageMetadata,
	i18n,
	loadLanguageResources,
	resolveSupportedLanguage,
	supportedLanguages,
} from "./i18n";
import { enTranslation } from "./locales/en";

function translationKeys(value: object, prefix = ""): string[] {
	return Object.entries(value).flatMap(([key, child]: [string, unknown]) => {
		const path = prefix ? `${prefix}.${key}` : key;
		return child && typeof child === "object" && !Array.isArray(child)
			? translationKeys(child, path)
			: [path];
	});
}

describe("internationalization", () => {
	it("keeps every supported language available on login and in the admin shell", async () => {
		expect(supportedLanguages.map(({ code }) => code)).toEqual([
			"bn-BD",
			"en",
			"fa-IR",
			"id-ID",
			"ja-JP",
			"pt-BR",
			"zh-CN",
			"zh-TW",
		]);
		for (const { code: language } of supportedLanguages) {
			await loadLanguageResources(language);
			expect(i18n.exists("login.title", { lng: language })).toBe(true);
			expect(
				i18n.exists("adminShell.navigation.dashboard", { lng: language }),
			).toBe(true);
			expect(i18n.exists("theme.dark", { lng: language })).toBe(true);
		}
	});

	it("keeps the complete translation key set aligned across all languages", async () => {
		const referenceKeys = translationKeys(enTranslation).sort();

		for (const { code: language } of supportedLanguages) {
			await loadLanguageResources(language);
			const translation: unknown = i18n.getResourceBundle(
				language,
				"translation",
			);
			if (
				!translation ||
				typeof translation !== "object" ||
				Array.isArray(translation)
			) {
				throw new Error(`Invalid translation bundle: ${language}`);
			}
			expect(translationKeys(translation).sort(), language).toEqual(
				referenceKeys,
			);
		}
	});

	it.each([
		["bn", "bn-BD", "ltr"],
		["en-US", "en", "ltr"],
		["fa", "fa-IR", "rtl"],
		["id", "id-ID", "ltr"],
		["ja", "ja-JP", "ltr"],
		["pt-PT", "pt-BR", "ltr"],
		["zh-Hant", "zh-TW", "ltr"],
	])("resolves %s and its layout direction", (input, code, dir) => {
		expect(resolveSupportedLanguage(input)).toBe(code);
		expect(getSupportedLanguageMetadata(input).dir).toBe(dir);
	});
});
