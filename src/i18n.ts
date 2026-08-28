import i18n from "i18next";
import type { BackendModule, ReadCallback, ResourceKey } from "i18next";
import { initReactI18next } from "react-i18next";

import {
	isSupportedLanguageCode as isPreferenceLanguageCode,
	readLanguagePreference,
	type SupportedLanguageCode,
	writeLanguagePreference,
} from "./app/preferenceStorage";

export const supportedLanguages = [
	{ code: "bn-BD", dir: "ltr", labelKey: "language.bengali" },
	{ code: "en", dir: "ltr", labelKey: "language.english" },
	{ code: "fa-IR", dir: "rtl", labelKey: "language.persian" },
	{ code: "id-ID", dir: "ltr", labelKey: "language.indonesian" },
	{ code: "ja-JP", dir: "ltr", labelKey: "language.japanese" },
	{ code: "pt-BR", dir: "ltr", labelKey: "language.portuguese" },
	{ code: "zh-CN", dir: "ltr", labelKey: "language.chinese" },
	{ code: "zh-TW", dir: "ltr", labelKey: "language.traditionalChinese" },
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
	const baseLanguage = normalizedLanguage?.split("-")[0];
	return supportedLanguages.find(
		({ code }) => code.split("-")[0] === baseLanguage,
	)?.code;
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

const translationLoaders = {
	"bn-BD": () =>
		import("./locales/bn-BD").then((module) => module.bnBDTranslation),
	"fa-IR": () =>
		import("./locales/fa-IR").then((module) => module.faIRTranslation),
	"id-ID": () =>
		import("./locales/id-ID").then((module) => module.idIDTranslation),
	"ja-JP": () =>
		import("./locales/ja-JP").then((module) => module.jaJPTranslation),
	"pt-BR": () =>
		import("./locales/pt-BR").then((module) => module.ptBRTranslation),
	"zh-CN": () =>
		import("./locales/zh-CN").then((module) => module.zhCNTranslation),
	"zh-TW": () =>
		import("./locales/zh-TW").then((module) => module.zhTWTranslation),
	en: () => import("./locales/en").then((module) => module.enTranslation),
} satisfies Record<SupportedLanguageCode, () => Promise<ResourceKey>>;

export async function loadLanguageResources(language: string) {
	const supportedLanguage = resolveSupportedLanguage(language);

	if (i18n.hasResourceBundle(supportedLanguage, "translation")) {
		return;
	}

	const translation = await translationLoaders[supportedLanguage]();
	i18n.addResourceBundle(
		supportedLanguage,
		"translation",
		translation,
		true,
		true,
	);
}

const dynamicTranslationBackend: BackendModule = {
	type: "backend",
	init() {
		// i18next calls this hook when registering backend plugins.
	},
	read(language: string, namespace: string, callback: ReadCallback) {
		if (namespace !== "translation") {
			callback(null, {});
			return;
		}

		translationLoaders[resolveSupportedLanguage(language)]()
			.then((translation) => callback(null, translation))
			.catch((error: unknown) => {
				callback(
					error instanceof Error ? error : new Error(String(error)),
					null,
				);
			});
	},
};

i18n.on("languageChanged", (language) => {
	writeLanguagePreference(resolveSupportedLanguage(language));
});

export const i18nReady = i18n
	.use(dynamicTranslationBackend)
	.use(initReactI18next)
	.init({
		defaultNS: "translation",
		fallbackLng: "en",
		interpolation: {
			escapeValue: false,
		},
		lng: resolveInitialLanguage(),
		ns: "translation",
	});

export { i18n };
