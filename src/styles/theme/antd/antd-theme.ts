import type { ThemeConfig } from "antd";

/**
 * 自定义的Ant Design浅色主题配置
 *
 * English: Custom Ant Design light theme configuration
 *
 * @see https://ant.design/theme-editor-cn (中文版)
 * @see https://ant.design/docs/react/customize-theme-cn (中文版配置指南)
 * @see https://ant.design/theme-editor (English version)
 * @see https://ant.design/docs/react/customize-theme (English version configuration guide)
 */
export const customAntdLightTheme: ThemeConfig = {
	components: {
		Button: {
			dangerShadow: "none",
			defaultShadow: "none",
			fontWeight: 500,
			primaryShadow: "none",
		},
		Card: {
			headerFontSize: 16,
			headerHeight: 48,
		},
		Form: {
			itemMarginBottom: 20,
		},
		Modal: {
			titleFontSize: 18,
		},
		Table: {
			cellPaddingBlock: 14,
			cellPaddingInline: 16,
			headerBg: "#fafafa",
			headerColor: "#262626",
			headerSplitColor: "#f0f0f0",
		},
	},
};

/**
 * 自定义的Ant Design深色主题配置
 *
 * English: Custom Ant Design dark theme configuration
 *
 * @see https://ant.design/theme-editor-cn (中文版)
 * @see https://ant.design/docs/react/customize-theme-cn (中文版配置指南)
 * @see https://ant.design/theme-editor (English version)
 * @see https://ant.design/docs/react/customize-theme (English version configuration guide)
 */
export const customAntdDarkTheme: ThemeConfig = {
	components: {
		Button: {
			dangerShadow: "none",
			defaultShadow: "none",
			fontWeight: 500,
			primaryShadow: "none",
		},
		Card: {
			headerFontSize: 16,
			headerHeight: 48,
		},
		Form: {
			itemMarginBottom: 20,
		},
		Modal: {
			titleFontSize: 18,
		},
		Table: {
			cellPaddingBlock: 14,
			cellPaddingInline: 16,
			headerBg: "#1f1f1f",
			headerColor: "#f5f5f5",
			headerSplitColor: "#303030",
		},
	},
};
