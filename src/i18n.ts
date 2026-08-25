import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import {
	isSupportedLanguageCode as isPreferenceLanguageCode,
	readLanguagePreference,
	type SupportedLanguageCode,
	writeLanguagePreference,
} from "./app/preferenceStorage";
import { enTranslation } from "./locales/en";
import { koKRTranslation } from "./locales/ko-KR";
import { zhCNTranslation } from "./locales/zh-CN";
import { zhTWTranslation } from "./locales/zh-TW";

export const supportedLanguages = [
	{ code: "zh-CN", dir: "ltr", labelKey: "language.chinese" },
	{ code: "zh-TW", dir: "ltr", labelKey: "language.traditionalChinese" },
	{ code: "en", dir: "ltr", labelKey: "language.english" },
	{ code: "ko-KR", dir: "ltr", labelKey: "language.korean" },
] as const;

export type { SupportedLanguageCode } from "./app/preferenceStorage";

export function isSupportedLanguageCode(
	value: string,
): value is SupportedLanguageCode {
	return isPreferenceLanguageCode(value);
}

function matchSupportedLanguage(
	language?: string,
): SupportedLanguageCode | undefined {
	const normalizedLanguage = language?.toLowerCase();

	if (
		normalizedLanguage?.startsWith("zh-tw") ||
		normalizedLanguage?.startsWith("zh-hant")
	) {
		return "zh-TW";
	}
	if (normalizedLanguage?.startsWith("ko")) {
		return "ko-KR";
	}
	if (normalizedLanguage?.startsWith("en")) {
		return "en";
	}
	if (normalizedLanguage?.startsWith("zh")) {
		return "zh-CN";
	}
	return undefined;
}

export function resolveSupportedLanguage(
	language?: string,
): SupportedLanguageCode {
	return matchSupportedLanguage(language) ?? "zh-CN";
}

export function getSupportedLanguageMetadata(language?: string) {
	const supportedLanguage = resolveSupportedLanguage(language);
	return supportedLanguages.find(({ code }) => code === supportedLanguage)!;
}

export function resolveInitialLanguage(
	persistedLanguage:
		SupportedLanguageCode | null | undefined = readLanguagePreference(),
	browserLanguages = typeof navigator === "undefined"
		? []
		: [...navigator.languages, navigator.language],
): SupportedLanguageCode {
	if (persistedLanguage) {
		return persistedLanguage;
	}

	for (const browserLanguage of browserLanguages) {
		const supportedLanguage = matchSupportedLanguage(browserLanguage);
		if (supportedLanguage) {
			return supportedLanguage;
		}
	}

	return "zh-CN";
}

const resources = {
	"zh-CN": {
		translation: zhCNTranslation,
	},
	"zh-TW": {
		translation: zhTWTranslation,
	},
	en: {
		translation: enTranslation,
	},
	"ko-KR": {
		translation: koKRTranslation,
	},
} as const;

i18n.on("languageChanged", (language) => {
	writeLanguagePreference(resolveSupportedLanguage(language));
});

void i18n.use(initReactI18next).init({
	resources,
	lng: resolveInitialLanguage(),
	fallbackLng: "en",
	interpolation: {
		escapeValue: false,
	},
});

export { i18n };
