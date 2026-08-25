import {
	DesktopOutlined,
	FileTextOutlined,
	MobileOutlined,
	ReloadOutlined,
} from "@ant-design/icons";
import { Button, Card, Flex, Segmented, Slider, Space, theme, Tooltip } from "antd";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type PreviewMode = "content" | "desktop" | "mobile";

interface ResponsivePreviewPanelProps {
	children: ReactNode;
	mode: PreviewMode;
	onModeChange: (mode: PreviewMode) => void;
	onRefresh: () => void;
	onZoomChange: (zoom: number) => void;
	title: string;
	zoom: number;
}

const frameWidth: Record<PreviewMode, number | string> = {
	content: 680,
	desktop: "100%",
	mobile: 390,
};

export function ResponsivePreviewPanel({
	children,
	mode,
	onModeChange,
	onRefresh,
	onZoomChange,
	title,
	zoom,
}: ResponsivePreviewPanelProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const scale = zoom / 100;
	const baseHeight = mode === "mobile" ? 680 : 520;

	return (
		<Card title={title}>
			<Flex gap={token.margin} vertical>
				<Flex align="center" gap={token.margin} justify="space-between" wrap>
					<Segmented<PreviewMode>
						onChange={onModeChange}
						options={[
							{
								icon: <DesktopOutlined aria-hidden />,
								label: t("adminShell.previewWorkbench.modes.desktop"),
								value: "desktop",
							},
							{
								icon: <MobileOutlined aria-hidden />,
								label: t("adminShell.previewWorkbench.modes.mobile"),
								value: "mobile",
							},
							{
								icon: <FileTextOutlined aria-hidden />,
								label: t("adminShell.previewWorkbench.modes.content"),
								value: "content",
							},
						]}
						value={mode}
					/>
					<Space>
						<Slider
							aria-label={t("adminShell.previewWorkbench.zoom")}
							max={100}
							min={60}
							onChange={onZoomChange}
							style={{ width: token.controlHeight * 3 }}
							value={zoom}
						/>
						<span style={{ minWidth: token.controlHeight + token.marginXS }}>
							{zoom}%
						</span>
						<Tooltip title={t("adminShell.previewWorkbench.refresh")}>
							<Button
								aria-label={t("adminShell.previewWorkbench.refresh")}
								icon={<ReloadOutlined aria-hidden />}
								onClick={onRefresh}
							/>
						</Tooltip>
					</Space>
				</Flex>
				<div
					style={{
						background: token.colorBgLayout,
						border: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
						borderRadius: token.borderRadius,
						minHeight: baseHeight * scale + token.paddingLG * 2,
						overflow: "auto",
						padding: token.paddingLG,
					}}
				>
					<div
						data-preview-mode={mode}
						data-testid="preview-frame"
						style={{
							background: token.colorBgContainer,
							border: `${token.lineWidth}px solid ${token.colorBorderSecondary}`,
							borderRadius: token.borderRadius,
							boxShadow: token.boxShadowSecondary,
							marginInline: "auto",
							maxWidth: "100%",
							minHeight: baseHeight,
							overflow: "hidden",
							transform: `scale(${scale})`,
							transformOrigin: "top center",
							width: frameWidth[mode],
						}}
					>
						{children}
					</div>
				</div>
			</Flex>
		</Card>
	);
}
