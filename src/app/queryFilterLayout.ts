import { theme } from "antd";
import type { FormProps } from "antd";
import { useLayoutEffect, useReducer, useRef, useState } from "react";

const antGridColumnCount = 24;
type QueryFilterLayoutMode = "compact" | "narrow" | "regular" | "wide";

interface QueryFilterLayoutOptions {
	expanded: boolean;
	fieldCount: number;
}

export function useQuerySubmission() {
	const [revision, submit] = useReducer((value: number) => value + 1, 0);

	return { revision, submit };
}

export function resolveQueryFilterLayoutMode(
	width: number,
	screenSMMin: number,
	screenMDMin: number,
	screenXXLMin: number,
): QueryFilterLayoutMode {
	if (width < screenSMMin) {
		return "compact";
	}
	if (width < screenMDMin) {
		return "narrow";
	}
	if (width < screenXXLMin) {
		return "regular";
	}
	return "wide";
}

function getColumnCount(mode: QueryFilterLayoutMode) {
	if (mode === "compact") {
		return 1;
	}
	if (mode === "narrow") {
		return 2;
	}
	if (mode === "regular") {
		return 3;
	}
	return 4;
}

export function useQueryFilterLayout({
	expanded,
	fieldCount,
}: QueryFilterLayoutOptions) {
	const { token } = theme.useToken();
	const containerRef = useRef<HTMLDivElement>(null);
	const [layoutMode, setLayoutMode] = useState(() =>
		resolveQueryFilterLayoutMode(
			typeof document === "undefined"
				? token.screenLG
				: document.body.clientWidth || token.screenLG,
			token.screenSMMin,
			token.screenMDMin,
			token.screenXXLMin,
		),
	);
	const columnCount = getColumnCount(layoutMode);
	const columnSpan = antGridColumnCount / columnCount;
	const formLayout: FormProps["layout"] =
		layoutMode === "compact" || layoutMode === "narrow"
			? "vertical"
			: "horizontal";
	const collapsedFieldCount = Math.min(
		fieldCount,
		Math.max(1, columnCount - 1),
	);
	const visibleFieldCount = expanded ? fieldCount : collapsedFieldCount;
	const lastRowSpan = (visibleFieldCount * columnSpan) % antGridColumnCount;
	const submitterOffset =
		lastRowSpan + columnSpan > antGridColumnCount
			? antGridColumnCount - columnSpan
			: antGridColumnCount - lastRowSpan - columnSpan;

	useLayoutEffect(() => {
		const container = containerRef.current;

		if (!container) {
			return undefined;
		}

		const updateLayoutMode = (width: number) => {
			if (width > token.margin + token.lineWidth) {
				setLayoutMode(
					resolveQueryFilterLayoutMode(
						width,
						token.screenSMMin,
						token.screenMDMin,
						token.screenXXLMin,
					),
				);
			}
		};
		const observer = new ResizeObserver(([entry]) => {
			updateLayoutMode(entry?.contentRect.width ?? 0);
		});

		updateLayoutMode(container.getBoundingClientRect().width);
		observer.observe(container);

		return () => observer.disconnect();
	}, [
		token.lineWidth,
		token.margin,
		token.screenMDMin,
		token.screenSMMin,
		token.screenXXLMin,
	]);

	return {
		canExpand: collapsedFieldCount < fieldCount,
		collapsedFieldCount,
		columnSpan,
		containerRef,
		formLayout,
		submitterOffset,
	};
}
