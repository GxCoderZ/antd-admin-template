import { CheckOutlined, DesktopOutlined } from "@ant-design/icons";
import { Radio, theme, Tooltip } from "antd";
import type { CSSProperties } from "react";

import type {
	MenuType,
	NavigationMode,
	ThemeMode,
} from "../../app/preferenceStorage";
import { settingsPreviewColors } from "../../app/preferenceStorage";
import styles from "./SettingsDrawer.module.css";
import { ProGroupIcon } from "./settings-icons/ProGroupIcon";
import { ProSubIcon } from "./settings-icons/ProSubIcon";

type PreviewValue = ThemeMode | NavigationMode | MenuType;

interface SettingsPreviewChoicesProps<Value extends PreviewValue> {
	label: string;
	onChange: (value: Value) => void;
	options: readonly { label: string; value: Value }[];
	value: Value;
}

function PreviewIcon({ value }: { value: PreviewValue }) {
	if (value === "system") return <DesktopOutlined />;
	if (value === "single" || value === "twoColumn") return <ProSubIcon />;
	if (value === "serviceGrid" || value === "splitServiceGrid")
		return <ProGroupIcon />;
	return null;
}

export function SettingsPreviewChoices<Value extends PreviewValue>({
	label,
	onChange,
	options,
	value,
}: SettingsPreviewChoicesProps<Value>) {
	const { token } = theme.useToken();
	const previewStyle: CSSProperties & Record<`--settings-${string}`, string> = {
		"--settings-primary": token.colorPrimary,
		"--settings-preview-gap": `${token.marginSM}px`,
		"--settings-preview-light": settingsPreviewColors.white,
		"--settings-preview-content": token.colorBgElevated,
		"--settings-preview-header": token.colorBgContainer,
		"--settings-preview-navigation": settingsPreviewColors.navigation,
		"--settings-preview-dark": settingsPreviewColors.dark,
		"--settings-preview-dark-sidebar": settingsPreviewColors.darkSidebar,
		"--settings-preview-dark-header": settingsPreviewColors.darkHeader,
		"--settings-preview-text": settingsPreviewColors.darkSidebar,
		"--settings-preview-shadow": token.boxShadow,
	};

	return (
		<Radio.Group
			aria-label={label}
			className={styles.choices}
			onChange={(event) => {
				const selected = options.find(
					(option) => option.value === event.target.value,
				);
				if (selected) onChange(selected.value);
			}}
			style={previewStyle}
			value={value}
		>
			{options.map((option) => (
				<Tooltip
					key={option.value}
					title={option.label}
					trigger={["hover", "focus"]}
				>
					<Radio
						aria-label={option.label}
						className={styles.choice}
						styles={{
							icon: {
								position: "absolute",
								inset: 0,
								width: "100%",
								height: "100%",
								opacity: 0,
								zIndex: 1,
							},
							label: {
								display: "block",
								paddingInline: 0,
								width: "100%",
								height: "100%",
							},
							root: { marginInlineEnd: 0, borderRadius: 4 },
						}}
						value={option.value}
					>
						<span
							aria-hidden
							className={styles.preview}
							data-preview={option.value}
						>
							<span className={styles.previewIcon}>
								<PreviewIcon value={option.value} />
							</span>
							{value === option.value ? (
								<CheckOutlined className={styles.selectedIcon} />
							) : null}
						</span>
					</Radio>
				</Tooltip>
			))}
		</Radio.Group>
	);
}
