import { CloseOutlined, SearchOutlined } from "@ant-design/icons";
import {
	Button,
	ConfigProvider,
	Empty,
	Flex,
	Grid,
	Input,
	Menu,
	Modal,
	theme,
	Tooltip,
} from "antd";
import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
	readNavigationSearchHistory,
	writeNavigationSearchHistory,
} from "../../app/preferenceStorage";
import styles from "./CommandPalette.module.css";

interface CommandPaletteItem {
	icon?: ReactNode;
	key: string;
	label: string;
	searchTerms: readonly string[];
}

interface CommandPaletteProps {
	historyScope: string;
	items: readonly CommandPaletteItem[];
	onNavigate: (key: string) => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
}

function normalizeSearchText(value: string) {
	return value.normalize("NFKC").toLocaleLowerCase();
}

function isFuzzyMatch(value: string, query: string) {
	const normalizedValue = normalizeSearchText(value);
	const normalizedQuery = normalizeSearchText(query.trim());

	if (!normalizedQuery || normalizedValue.includes(normalizedQuery)) {
		return true;
	}

	let queryIndex = 0;
	for (const character of normalizedValue) {
		if (character === normalizedQuery[queryIndex]) {
			queryIndex += 1;
			if (queryIndex === normalizedQuery.length) {
				return true;
			}
		}
	}

	return false;
}

export function CommandPalette({
	historyScope,
	items,
	onNavigate,
	onOpenChange,
	open,
}: CommandPaletteProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const isMobile = screens.sm !== true;
	const resultRefs = useRef(new Map<string, HTMLElement>());
	const [query, setQuery] = useState("");
	const [history, setHistory] = useState(() =>
		readNavigationSearchHistory(historyScope),
	);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const isSearching = query.trim().length > 0;
	const filteredItems = useMemo(
		() =>
			isSearching
				? items.filter((item) =>
						item.searchTerms.some((term) => isFuzzyMatch(term, query)),
					)
				: history.flatMap((key) => {
						const item = items.find((item) => item.key === key);
						return item ? [item] : [];
					}),
		[history, isSearching, items, query],
	);
	const activeIndex = Math.min(
		selectedIndex,
		Math.max(filteredItems.length - 1, 0),
	);
	const activeItem = filteredItems[activeIndex];
	const closePalette = useCallback(() => {
		setQuery("");
		setSelectedIndex(0);
		onOpenChange(false);
	}, [onOpenChange]);

	useEffect(() => {
		const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
			if (
				(event.ctrlKey || event.metaKey) &&
				event.key.toLocaleLowerCase() === "k"
			) {
				event.preventDefault();
				onOpenChange(true);
			}
		};

		document.addEventListener("keydown", handleGlobalKeyDown);
		return () => document.removeEventListener("keydown", handleGlobalKeyDown);
	}, [onOpenChange]);

	const selectItem = (key: string) => {
		const nextHistory = [key, ...history.filter((path) => path !== key)].slice(
			0,
			10,
		);
		setHistory(nextHistory);
		writeNavigationSearchHistory(historyScope, nextHistory);
		onNavigate(key);
		closePalette();
	};
	const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.nativeEvent.isComposing || filteredItems.length === 0) {
			return;
		}

		if (event.key === "ArrowDown") {
			event.preventDefault();
			const nextIndex = (activeIndex + 1) % filteredItems.length;
			setSelectedIndex(nextIndex);
			const nextItem = filteredItems[nextIndex];
			if (nextItem)
				resultRefs.current
					.get(nextItem.key)
					?.scrollIntoView({ block: "nearest" });
			return;
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			const nextIndex =
				(activeIndex - 1 + filteredItems.length) % filteredItems.length;
			setSelectedIndex(nextIndex);
			const nextItem = filteredItems[nextIndex];
			if (nextItem)
				resultRefs.current
					.get(nextItem.key)
					?.scrollIntoView({ block: "nearest" });
			return;
		}

		if (event.key === "Enter") {
			event.preventDefault();
			const selectedItem = filteredItems[activeIndex];
			if (selectedItem) {
				selectItem(selectedItem.key);
			}
		}
	};

	return (
		<Modal
			centered={false}
			destroyOnHidden
			footer={null}
			onCancel={closePalette}
			open={open}
			width={isMobile ? "100%" : 580}
			style={
				isMobile
					? { top: 0, maxWidth: "100%", margin: 0, paddingBottom: 0 }
					: {}
			}
			styles={{
				container: {
					padding: 0,
					display: "flex",
					flexDirection: "column",
					...(isMobile ? { height: "100dvh" } : {}),
				},
				header: {
					marginBottom: 0,
					padding: token.padding,
					paddingInlineEnd: token.padding + token.controlHeight,
					borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
				},
				body: {
					minHeight: 0,
					overflowY: "auto",
					padding: `0 ${token.padding}px ${token.padding}px`,
					...(isMobile ? { flex: 1 } : { maxHeight: 450 }),
				},
			}}
			title={
				<>
					<span className={styles.titleLabel}>
						{t("adminShell.commandPalette.title")}
					</span>
					<Input
						autoFocus
						allowClear
						aria-label={t("adminShell.commandPalette.placeholder")}
						onChange={(event) => {
							setQuery(event.target.value);
							setSelectedIndex(0);
						}}
						onKeyDown={handleInputKeyDown}
						placeholder={t("adminShell.commandPalette.placeholder")}
						prefix={<SearchOutlined aria-hidden />}
						value={query}
					/>
				</>
			}
		>
			{activeItem ? (
				<ConfigProvider
					theme={{
						components: {
							Menu: {
								itemHeight: 56,
								itemMarginInline: 0,
								itemMarginBlock: token.marginXS,
								itemSelectedBg: token.colorPrimary,
								itemSelectedColor: token.colorTextLightSolid,
								itemBorderRadius: token.borderRadius,
							},
						},
					}}
				>
					<Menu
						styles={{
							item: { display: "flex", alignItems: "center" },
							itemContent: { flex: 1, minWidth: 0 },
						}}
						items={filteredItems.map((item, index) => ({
							icon: item.icon,
							key: item.key,
							"aria-label": item.label,
							onMouseEnter: () => setSelectedIndex(index),
							label: (
								<Flex
									align="center"
									gap={token.marginXS}
									justify="space-between"
									ref={(node) => {
										if (node) resultRefs.current.set(item.key, node);
										else resultRefs.current.delete(item.key);
									}}
									style={{ minWidth: 0 }}
								>
									<span className={styles.resultTitle}>{item.label}</span>
									<span className={styles.resultPath}>{item.key}</span>
									{!isSearching ? (
										<Tooltip
											title={t("adminShell.commandPalette.removeRecent", {
												name: item.label,
											})}
										>
											<Button
												aria-label={t(
													"adminShell.commandPalette.removeRecent",
													{ name: item.label },
												)}
												icon={<CloseOutlined />}
												size="small"
												type="text"
												style={{ color: "inherit", flexShrink: 0 }}
												onClick={(event) => {
													event.stopPropagation();
													const nextHistory = history.filter(
														(path) => path !== item.key,
													);
													setHistory(nextHistory);
													writeNavigationSearchHistory(
														historyScope,
														nextHistory,
													);
													setSelectedIndex(0);
												}}
											/>
										</Tooltip>
									) : null}
								</Flex>
							),
							style: {
								background:
									index === activeIndex
										? token.colorPrimary
										: token.colorFillQuaternary,
							},
						}))}
						onClick={({ key }) => selectItem(String(key))}
						selectedKeys={[activeItem.key]}
						style={{
							borderInlineEnd: 0,
							background: "transparent",
						}}
					/>
				</ConfigProvider>
			) : (
				<Empty
					description={t(
						isSearching
							? "adminShell.commandPalette.empty"
							: "adminShell.commandPalette.noRecent",
					)}
					image={Empty.PRESENTED_IMAGE_SIMPLE}
					style={{ marginBlock: token.marginXL }}
				/>
			)}
		</Modal>
	);
}
