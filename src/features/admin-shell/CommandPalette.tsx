import { SearchOutlined } from "@ant-design/icons";
import { Empty, Input, Menu, Modal, theme } from "antd";
import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface CommandPaletteItem {
	icon?: ReactNode;
	key: string;
	label: string;
	searchTerms: readonly string[];
}

interface CommandPaletteProps {
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
	items,
	onNavigate,
	onOpenChange,
	open,
}: CommandPaletteProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const filteredItems = useMemo(
		() =>
			items.filter((item) =>
				item.searchTerms.some((term) => isFuzzyMatch(term, query)),
			),
		[items, query],
	);
	const activeIndex = Math.min(
		selectedIndex,
		Math.max(filteredItems.length - 1, 0),
	);
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
		onNavigate(key);
		closePalette();
	};
	const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (filteredItems.length === 0) {
			return;
		}

		if (event.key === "ArrowDown") {
			event.preventDefault();
			setSelectedIndex((index) => (index + 1) % filteredItems.length);
			return;
		}

		if (event.key === "ArrowUp") {
			event.preventDefault();
			setSelectedIndex(
				(index) => (index - 1 + filteredItems.length) % filteredItems.length,
			);
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
			style={{ top: "15vh" }}
			title={t("adminShell.commandPalette.title")}
		>
			<Input
				autoFocus
				onChange={(event) => {
					setQuery(event.target.value);
					setSelectedIndex(0);
				}}
				onKeyDown={handleInputKeyDown}
				placeholder={t("adminShell.commandPalette.placeholder")}
				prefix={<SearchOutlined aria-hidden />}
				value={query}
			/>
			{filteredItems.length > 0 ? (
				<Menu
					items={filteredItems.map((item) => ({
						icon: item.icon,
						key: item.key,
						label: item.label,
					}))}
					onClick={({ key }) => selectItem(String(key))}
					selectedKeys={[filteredItems[activeIndex]?.key ?? ""]}
					style={{
						borderInlineEnd: 0,
						marginTop: token.marginSM,
						maxHeight: token.controlHeightLG * 7,
						overflowY: "auto",
					}}
				/>
			) : (
				<Empty
					description={t("adminShell.commandPalette.empty")}
					image={Empty.PRESENTED_IMAGE_SIMPLE}
					style={{ marginBlock: token.marginXL }}
				/>
			)}
		</Modal>
	);
}
