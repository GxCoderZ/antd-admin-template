import { createIntl, ProConfigProvider } from "@ant-design/pro-components";
import {
	type QueryClient,
	QueryClientProvider,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { ConfigProvider, theme as antdTheme } from "antd";
import type { Locale } from "antd/es/locale";
import "dayjs/locale/bn-bd";
import "dayjs/locale/fa";
import "dayjs/locale/id";
import "dayjs/locale/ja";
import "dayjs/locale/pt-br";
import "dayjs/locale/zh-tw";
import type { ComponentType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	createBrowserRouter,
	Navigate,
	RouterProvider,
	useNavigate,
} from "react-router";

import { getPlatformAccount, platformAccountQueryKey } from "#src/api/account";
import {
	getPlatformSession,
	logoutPlatform,
	platformSessionQueryKey,
} from "#src/api/auth";
import { ApiProblemError } from "#src/api/client";
import { platformSettingsQueryKey } from "#src/api/settings";
import { AdminShellPage } from "../features/admin-shell/AdminShellPage";
import { LoginPage } from "../features/auth/login/LoginPage";
import { ForgotPasswordPage } from "../features/auth/forgot-password/ForgotPasswordPage";
import {
	ShellNotFoundPage,
	ShellRouteErrorPage,
} from "../features/exceptions/ShellExceptionPages";
import {
	getSupportedLanguageMetadata,
	type SupportedLanguageCode,
} from "../i18n";
import { bnBDProTranslation } from "../locales/pro-bn-BD";
import { adminRouteDefinitions } from "./adminRoutes";
import { appAntdCssVar } from "./antdCssVar";
import { ApplicationSkeleton } from "./LoadingSkeletons";
import { LocalePreferencesProvider } from "./LocalePreferencesProvider";
import { PermissionProvider } from "./PermissionProvider";
import { PlatformBrandProvider } from "./PlatformBrand";
import { useLocalePreferenceState } from "./localePreferences";
import {
	readColorBlindModePreference,
	readThemeColorPreference,
	readThemeModePreference,
	type ThemeColor,
	type ThemeMode,
	writeColorBlindModePreference,
	writeThemeColorPreference,
	writeThemeModePreference,
} from "./preferenceStorage";
import { createAppQueryClient } from "./queryClient";
import { ThemeModeProvider } from "./ThemeModeProvider";
import { type ThemeModeContextValue, useThemeMode } from "./themeMode";
import "./color-weak.css";

// Pro Components has no built-in Bengali locale; use its public intl extension.
const bnBDIntl = createIntl("bn-BD", bnBDProTranslation);
const proLightStyleMarkers = [
	"rgb(255,255,255)",
	"rgba(0,0,0",
	"#fff",
	"#ffffff",
] as const;
const proDarkStyleMarkers = [
	"rgb(20,20,20)",
	"rgba(255,255,255",
	"#141414",
	"#1d1d1d",
] as const;

const antdLocaleLoaders = {
	"bn-BD": () => import("antd/locale/bn_BD"),
	"fa-IR": () => import("antd/locale/fa_IR"),
	"id-ID": () => import("antd/locale/id_ID"),
	"ja-JP": () => import("antd/locale/ja_JP"),
	"pt-BR": () => import("antd/locale/pt_BR"),
	"zh-CN": () => import("antd/locale/zh_CN"),
	"zh-TW": () => import("antd/locale/zh_TW"),
	en: () => import("antd/locale/en_US"),
} satisfies Record<SupportedLanguageCode, () => Promise<{ default: Locale }>>;

function useAntdLocale(language: SupportedLanguageCode) {
	const [locale, setLocale] = useState<Locale>();

	useEffect(() => {
		let active = true;

		void antdLocaleLoaders[language]().then(({ default: nextLocale }) => {
			if (active) {
				setLocale(nextLocale);
			}
		});

		return () => {
			active = false;
		};
	}, [language]);

	return locale;
}

function removeStaleProThemeStyles(isDarkMode: boolean) {
	const staleMarkers = isDarkMode ? proLightStyleMarkers : proDarkStyleMarkers;
	const proStyles = Array.from(
		document.querySelectorAll<HTMLStyleElement>("style[data-css-hash]"),
	).filter((style) => style.textContent?.includes("ant-pro-"));
	for (const style of proStyles) {
		const cssText = style.textContent;
		if (cssText && staleMarkers.some((marker) => cssText.includes(marker))) {
			style.remove();
		}
	}
	const latestByComponent = new Map<string, HTMLStyleElement>();
	for (const style of proStyles) {
		if (!style.isConnected) continue;
		const component = style.textContent?.match(/\.ant-pro-[\w-]+/)?.[0];
		if (component) latestByComponent.set(component, style);
	}
	for (const style of proStyles) {
		if (!style.isConnected) continue;
		const component = style.textContent?.match(/\.ant-pro-[\w-]+/)?.[0];
		if (component && latestByComponent.get(component) !== style) style.remove();
	}
}

function getSystemIsDarkMode() {
	return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function ThemeModeRoute<Props extends object>({
	Page,
	selectProps,
}: {
	Page: ComponentType<Props>;
	selectProps: (themeMode: ThemeModeContextValue) => Props;
}) {
	const themeMode = useThemeMode();

	return <Page {...selectProps(themeMode)} />;
}

function selectAuthThemeProps(themeMode: ThemeModeContextValue) {
	return {
		isDarkMode: themeMode.isDarkMode,
		onChangeThemeMode: themeMode.onChangeThemeMode,
		themeMode: themeMode.themeMode,
	};
}

function clearQueriesPreservingPlatformSettings(queryClient: QueryClient) {
	queryClient.removeQueries({
		predicate: (query) => query.queryKey[0] !== platformSettingsQueryKey[0],
	});
	queryClient.getMutationCache().clear();
}

function AuthenticatedAdminShellRoute() {
	const themeMode = useThemeMode();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const sessionQuery = useQuery({
		queryFn: ({ signal }) => getPlatformSession(signal),
		queryKey: platformSessionQueryKey,
		staleTime: 0,
	});
	const accountQuery = useQuery({
		enabled: sessionQuery.isSuccess,
		queryFn: ({ signal }) => getPlatformAccount(signal),
		queryKey: platformAccountQueryKey,
	});
	const logoutMutation = useMutation({ mutationFn: logoutPlatform });

	if (sessionQuery.isPending) {
		return <ApplicationSkeleton />;
	}

	if (sessionQuery.isError) {
		return (
			<Navigate
				replace
				state={{
					sessionExpired:
						sessionQuery.error instanceof ApiProblemError &&
						sessionQuery.error.status === 401,
				}}
				to="/login"
			/>
		);
	}

	// Resolve the display name before mounting hover targets in the header.
	if (accountQuery.isPending) {
		return <ApplicationSkeleton />;
	}

	if (accountQuery.isError) {
		return <ShellRouteErrorPage />;
	}

	const handleLogout = async () => {
		await logoutMutation.mutateAsync();
		await navigate("/login", { replace: true });
		clearQueriesPreservingPlatformSettings(queryClient);
	};

	return (
		<PermissionProvider permissions={sessionQuery.data.permissions}>
			<AdminShellPage
				{...themeMode}
				currentUserAvatarRevision={accountQuery.dataUpdatedAt}
				currentUserId={sessionQuery.data.user.id}
				currentUsername={
					accountQuery.data.displayName.trim() || accountQuery.data.username
				}
				onLogout={handleLogout}
			/>
		</PermissionProvider>
	);
}

export function App({
	basename = import.meta.env.BASE_URL,
}: {
	basename?: string;
} = {}) {
	const { i18n } = useTranslation();
	const [isColorBlindMode, setIsColorBlindMode] = useState(
		readColorBlindModePreference,
	);
	const [themeMode, setThemeMode] = useState<ThemeMode>(
		readThemeModePreference,
	);
	const [themeColor, setThemeColor] = useState<ThemeColor>(
		readThemeColorPreference,
	);
	const [unauthorizedSignal, setUnauthorizedSignal] = useState(0);
	const [systemIsDarkMode, setSystemIsDarkMode] = useState(getSystemIsDarkMode);
	const languageMetadata = getSupportedLanguageMetadata(i18n.resolvedLanguage);
	const language = languageMetadata.code;
	const antdLocale = useAntdLocale(language);
	const localePreferences = useLocalePreferenceState(language);
	const isDarkMode =
		themeMode === "system" ? systemIsDarkMode : themeMode === "dark";

	useEffect(() => {
		const media = window.matchMedia?.("(prefers-color-scheme: dark)");

		if (!media) {
			return undefined;
		}

		const handleChange = () => setSystemIsDarkMode(media.matches);

		handleChange();
		media.addEventListener?.("change", handleChange);

		return () => media.removeEventListener?.("change", handleChange);
	}, []);

	useEffect(() => {
		document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
		removeStaleProThemeStyles(isDarkMode);
		queueMicrotask(() => removeStaleProThemeStyles(isDarkMode));
	}, [isDarkMode]);

	useEffect(() => {
		document.documentElement.lang = languageMetadata.code;
		document.documentElement.dir = languageMetadata.dir;
	}, [languageMetadata.code, languageMetadata.dir]);

	useEffect(() => {
		document.body.classList.toggle("colorWeak", isColorBlindMode);

		return () => document.body.classList.remove("colorWeak");
	}, [isColorBlindMode]);

	const changeThemeMode = useCallback((nextMode: ThemeMode) => {
		writeThemeModePreference(nextMode);
		setThemeMode(nextMode);
	}, []);
	const changeThemeColor = useCallback((nextThemeColor: ThemeColor) => {
		writeThemeColorPreference(nextThemeColor);
		setThemeColor(nextThemeColor);
	}, []);
	const changeColorBlindMode = useCallback((enabled: boolean) => {
		writeColorBlindModePreference(enabled);
		setIsColorBlindMode(enabled);
	}, []);
	const router = useMemo(
		() =>
			createBrowserRouter(
				[
					{
						path: "/",
						element: <Navigate replace to="/dashboard" />,
					},
					{
						element: <AuthenticatedAdminShellRoute />,
						ErrorBoundary: ShellRouteErrorPage,
						HydrateFallback: ApplicationSkeleton,
						children: [
							...adminRouteDefinitions.map((route) => ({
								handle: route,
								lazy: route.lazy,
								path: route.key,
								ErrorBoundary: ShellRouteErrorPage,
							})),
							{
								path: "*",
								Component: ShellNotFoundPage,
							},
						],
					},
					{
						path: "/login",
						element: (
							<ThemeModeRoute
								Page={LoginPage}
								selectProps={selectAuthThemeProps}
							/>
						),
					},
					{
						path: "/forgot-password",
						element: (
							<ThemeModeRoute
								Page={ForgotPasswordPage}
								selectProps={selectAuthThemeProps}
							/>
						),
					},
				],
				{ basename },
			),
		[basename],
	);
	const [queryClient] = useState(() =>
		createAppQueryClient({
			onUnauthorized: () => setUnauthorizedSignal((value) => value + 1),
		}),
	);
	useEffect(() => {
		if (unauthorizedSignal === 0) {
			return undefined;
		}
		if (router.state.location.pathname === "/login") {
			queryClient.removeQueries({ queryKey: platformSessionQueryKey });
			return undefined;
		}

		let active = true;
		const clearExpiredSessionQueries = () => {
			if (active) {
				clearQueriesPreservingPlatformSettings(queryClient);
			}
		};
		void router
			.navigate("/login", {
				replace: true,
				state: { sessionExpired: true },
			})
			.then(clearExpiredSessionQueries, clearExpiredSessionQueries);

		return () => {
			active = false;
		};
	}, [queryClient, router, unauthorizedSignal]);
	const themeModeValue = useMemo(
		() => ({
			isColorBlindMode,
			isDarkMode,
			onChangeColorBlindMode: changeColorBlindMode,
			onChangeThemeColor: changeThemeColor,
			onChangeThemeMode: changeThemeMode,
			themeColor,
			themeMode,
		}),
		[
			changeColorBlindMode,
			changeThemeColor,
			changeThemeMode,
			isColorBlindMode,
			isDarkMode,
			themeColor,
			themeMode,
		],
	);
	const antdThemeConfig = useMemo(
		() => ({
			algorithm: isDarkMode
				? antdTheme.darkAlgorithm
				: antdTheme.defaultAlgorithm,
			cssVar: appAntdCssVar,
			token: {
				borderRadius: 8,
				colorPrimary: themeColor,
			},
		}),
		[isDarkMode, themeColor],
	);

	return (
		<ConfigProvider
			direction={languageMetadata.dir}
			{...(antdLocale ? { locale: antdLocale } : {})}
			theme={antdThemeConfig}
		>
			<LocalePreferencesProvider value={localePreferences}>
				<QueryClientProvider client={queryClient}>
					<PlatformBrandProvider>
						<ThemeModeProvider value={themeModeValue}>
							<ProConfigProvider
								dark={isDarkMode}
								{...(languageMetadata.code === "bn-BD"
									? { intl: bnBDIntl }
									: {})}
							>
								<RouterProvider router={router} />
							</ProConfigProvider>
						</ThemeModeProvider>
					</PlatformBrandProvider>
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>
	);
}
