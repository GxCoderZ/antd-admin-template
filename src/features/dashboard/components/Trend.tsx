import { CaretDownOutlined, CaretUpOutlined } from "@ant-design/icons";
import type { CSSProperties, ReactNode } from "react";

import styles from "./Trend.module.css";

// Pro Analysis Trend; CSS Modules replace upstream clsx/antd-style only.
interface TrendProps {
	colorful?: boolean;
	flag: "up" | "down";
	style?: CSSProperties;
	reverseColor?: boolean;
	className?: string;
	children?: ReactNode;
	title?: string;
}

export function Trend({
	colorful = true,
	reverseColor = false,
	flag,
	children,
	className,
	title = "",
	...rest
}: TrendProps) {
	const classString = [
		styles.trendItem,
		!colorful ? styles.trendItemGrey : undefined,
		reverseColor && colorful ? styles.reverseColor : undefined,
		className,
	]
		.filter(Boolean)
		.join(" ");
	return (
		<div {...rest} className={classString} title={title}>
			<span>{children}</span>
			{flag && (
				<span className={styles[flag]}>
					{flag === "up" ? <CaretUpOutlined /> : <CaretDownOutlined />}
				</span>
			)}
		</div>
	);
}
