import {
	type QueryClient,
	QueryClientProvider,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { ConfigProvider, theme as antdTheme } from "antd";
import enUS from "antd/locale/en_US";
import koKR from "antd/locale/ko_KR";
import zhCN from "antd/locale/zh_CN";
import zhTW from "antd/locale/zh_TW";
import type { ComponentType, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
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
import {
	getPlatformSettings,
	platformSettingsQueryKey,
	type PlatformSettings,
} from "#src/api/settings";
import { AdminShellPage } from "../features/admin-shell/AdminShellPage";
import { LoginPage } from "../features/auth/login/LoginPage";
import { ForgotPasswordPage } from "../features/auth/forgot-password/ForgotPasswordPage";
import {
	NotFoundPage,
	RouteErrorPage,
} from "../features/exceptions/ExceptionPages";
import { getSupportedLanguageMetadata } from "../i18n";
import { adminRouteDefinitions } from "./adminRoutes";
import { ApplicationSkeleton } from "./LoadingSkeletons";
import { LocalePreferencesProvider } from "./LocalePreferencesProvider";
import { PermissionProvider } from "./PermissionProvider";
import { PlatformDocumentTitle } from "./PlatformBrand";
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
import "./theme-transition.css";

const THEME_REVEAL_DURATION_MS = 450;
const THEME_REVEAL_EASING = "ease-in-out";
const antdLocales = {
	"zh-CN": zhCN,
	"zh-TW": zhTW,
	en: enUS,
	"ko-KR": koKR,
} as const;

function getThemeRevealOrigin(event?: MouseEvent<HTMLElement>) {
	const rect = event?.currentTarget?.getBoundingClientRect();
	const x =
		event?.clientX || (rect ? rect.left + rect.width / 2 : window.innerWidth);
	const y = event?.clientY || (rect ? rect.top + rect.height / 2 : 0);

	return { x, y };
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
	const platformSettings = queryClient.getQueryData<PlatformSettings>(
		platformSettingsQueryKey,
	);

	queryClient.clear();

	if (platformSettings) {
		queryClient.setQueryData(platformSettingsQueryKey, platformSettings);
	}
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
	useQuery({
		enabled: sessionQuery.isSuccess,
		queryFn: ({ signal }) => getPlatformSettings(signal),
		queryKey: platformSettingsQueryKey,
		staleTime: 0,
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
					accountQuery.data?.displayName.trim() ||
					accountQuery.data?.username ||
					sessionQuery.data.user.username
				}
				onLogout={handleLogout}
			/>
		</PermissionProvider>
	);
}

export function App() {
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
	}, [isDarkMode]);

	useEffect(() => {
		document.documentElement.lang = languageMetadata.code;
		document.documentElement.dir = languageMetadata.dir;
	}, [languageMetadata.code, languageMetadata.dir]);

	useEffect(() => {
		document.body.classList.toggle("colorWeak", isColorBlindMode);

		return () => document.body.classList.remove("colorWeak");
	}, [isColorBlindMode]);

	const changeThemeMode = useCallback(
		(nextMode: ThemeMode, event?: MouseEvent<HTMLElement>) => {
			writeThemeModePreference(nextMode);
			const prefersReducedMotion =
				window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ??
				false;
			const nextIsDarkMode =
				nextMode === "system" ? systemIsDarkMode : nextMode === "dark";
			const nextTheme = nextIsDarkMode ? "dark" : "light";

			if (nextMode === themeMode || nextIsDarkMode === isDarkMode) {
				document.documentElement.dataset.theme = nextTheme;
				setThemeMode(nextMode);
				return;
			}

			if (
				!document.startViewTransition ||
				!document.documentElement.animate ||
				prefersReducedMotion
			) {
				document.documentElement.dataset.theme = nextTheme;
				setThemeMode(nextMode);
				return;
			}

			const { x, y } = getThemeRevealOrigin(event);
			const endRadius = Math.hypot(
				Math.max(x, window.innerWidth - x),
				Math.max(y, window.innerHeight - y),
			);
			const transition = document.startViewTransition(() => {
				flushSync(() => {
					document.documentElement.dataset.theme = nextTheme;
					setThemeMode(nextMode);
				});
			});
			const clipPath = nextIsDarkMode
				? [
						`circle(0px at ${x}px ${y}px)`,
						`circle(${endRadius}px at ${x}px ${y}px)`,
					]
				: [
						`circle(${endRadius}px at ${x}px ${y}px)`,
						`circle(0px at ${x}px ${y}px)`,
					];

			void transition.ready
				.then(() => {
					document.documentElement.animate(
						{
							clipPath,
						},
						{
							duration: THEME_REVEAL_DURATION_MS,
							easing: THEME_REVEAL_EASING,
							fill: "forwards",
							pseudoElement: nextIsDarkMode
								? "::view-transition-new(root)"
								: "::view-transition-old(root)",
						},
					);
				})
				.catch(() => {
					transition.skipTransition();
				});
		},
		[isDarkMode, systemIsDarkMode, themeMode],
	);
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
			createBrowserRouter([
				{
					path: "/",
					element: <Navigate replace to="/dashboard" />,
				},
				{
					element: <AuthenticatedAdminShellRoute />,
					ErrorBoundary: RouteErrorPage,
					HydrateFallback: ApplicationSkeleton,
					children: [
						...adminRouteDefinitions.flatMap((route) =>
							[route.key, ...(route.aliases ?? [])].map((path) => ({
								path,
								handle: route,
								lazy: route.lazy,
								ErrorBoundary: RouteErrorPage,
							})),
						),
						{
							path: "*",
							Component: NotFoundPage,
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
			]),
		[],
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
		void router
			.navigate("/login", {
				replace: true,
				state: { sessionExpired: true },
			})
			.then(() => {
				if (active) {
					clearQueriesPreservingPlatformSettings(queryClient);
				}
			})
			.catch(() => undefined);

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

	return (
		<ConfigProvider
			direction={languageMetadata.dir}
			locale={antdLocales[language]}
			theme={{
				algorithm: isDarkMode
					? antdTheme.darkAlgorithm
					: antdTheme.defaultAlgorithm,
				cssVar: { prefix: "raa" },
				token: {
					borderRadius: 8,
					colorPrimary: themeColor,
				},
			}}
		>
			<LocalePreferencesProvider value={localePreferences}>
				<QueryClientProvider client={queryClient}>
					<PlatformDocumentTitle />
					<ThemeModeProvider value={themeModeValue}>
						<RouterProvider router={router} />
					</ThemeModeProvider>
				</QueryClientProvider>
			</LocalePreferencesProvider>
		</ConfigProvider>
	);
}
