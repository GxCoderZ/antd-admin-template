import { theme } from "antd";
import type { FormProps } from "antd";
import { useLayoutEffect, useReducer, useRef, useState } from "react";

const antGridColumnCount = 24;

interface QueryFilterLayoutOptions {
	expanded: boolean;
	fieldCount: number;
}

export function useQuerySubmission() {
	const [revision, submit] = useReducer((value: number) => value + 1, 0);

	return { revision, submit };
}

export function useQueryFilterLayout({
	expanded,
	fieldCount,
}: QueryFilterLayoutOptions) {
	const { token } = theme.useToken();
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(() =>
		typeof document === "undefined"
			? token.screenLG
			: document.body.clientWidth || token.screenLG,
	);
	const columnCount =
		containerWidth < token.screenSMMin
			? 1
			: containerWidth < token.screenMDMin
				? 2
				: containerWidth < token.screenXXLMin
					? 3
					: 4;
	const columnSpan = antGridColumnCount / columnCount;
	const formLayout: FormProps["layout"] =
		containerWidth < token.screenMDMin ? "vertical" : "horizontal";
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

		const updateWidth = (width: number) => {
			if (width > token.margin + token.lineWidth) {
				setContainerWidth(width);
			}
		};
		const observer = new ResizeObserver(([entry]) => {
			updateWidth(entry?.contentRect.width ?? 0);
		});

		updateWidth(container.getBoundingClientRect().width);
		observer.observe(container);

		return () => observer.disconnect();
	}, [token.lineWidth, token.margin]);

	return {
		canExpand: collapsedFieldCount < fieldCount,
		collapsedFieldCount,
		columnSpan,
		containerRef,
		formLayout,
		submitterOffset,
	};
}
