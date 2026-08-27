import { Card, type CardProps } from "antd";
import type { ReactNode } from "react";

import styles from "./ChartCard.module.css";

// Ported from Pro Analysis ChartCard/Field; source and MIT notice are in docs/design/dashboard-workplace.md.
interface ChartCardProps extends CardProps {
	title: ReactNode;
	action?: ReactNode;
	total: ReactNode;
	footer?: ReactNode;
	contentHeight?: number;
}

export function ChartCard({
	title,
	action,
	total,
	footer,
	contentHeight,
	children,
	loading = false,
	...cardProps
}: ChartCardProps) {
	return (
		<Card
			title={title}
			loading={loading}
			styles={{ body: { padding: "20px 24px 8px 24px" } }}
			{...cardProps}
		>
			{loading ? (
				false
			) : (
				<div className={styles.chartCard}>
					<div
						className={[
							styles.chartTop,
							!children && !footer ? styles.chartTopMargin : "",
						].join(" ")}
					>
						<div className={styles.metaWrap}>
							<div className={styles.meta}>
								<span>{title}</span>
								<span className={styles.action}>{action}</span>
							</div>
							<div className={styles.total} data-testid="chart-card-total">
								{total}
							</div>
						</div>
					</div>
					{children && (
						<div
							className={styles.content}
							data-testid="chart-card-content"
							style={{ height: contentHeight || "auto" }}
						>
							<div className={contentHeight ? styles.contentFixed : undefined}>
								{children}
							</div>
						</div>
					)}
					{footer && (
						<div
							className={[
								styles.footer,
								!children ? styles.footerMargin : "",
							].join(" ")}
							data-testid="chart-card-footer"
						>
							{footer}
						</div>
					)}
				</div>
			)}
		</Card>
	);
}

export function ChartCardField({
	label,
	value,
}: {
	label: ReactNode;
	value: ReactNode;
}) {
	return (
		<div className={styles.field}>
			<span className={styles.label}>{label}</span>
			<span className={styles.number}>{value}</span>
		</div>
	);
}
