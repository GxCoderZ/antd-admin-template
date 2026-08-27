import {
	AntDesignOutlined,
	DeleteOutlined,
	UploadOutlined,
} from "@ant-design/icons";
import { platformSettingsLimits } from "#src/api/settings";
import { Alert, Button, Flex, Image, theme, Upload } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface SystemLogoInputProps {
	disabled: boolean;
	id?: string;
	loading: boolean;
	onChange?: (value: string | null) => void;
	onLoading: (loading: boolean) => void;
	value?: string | null;
}

export function SystemLogoInput({
	disabled,
	id,
	onChange,
	onLoading,
	loading,
	value,
}: SystemLogoInputProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [error, setError] = useState<string>();
	const logoSize = token.controlHeightLG * 2;
	return (
		<Flex gap={token.marginSM} vertical>
			<Flex align="center" gap={token.margin} wrap>
				{value ? (
					<Image
						alt={t("adminShell.platformSettings.general.logo")}
						height={logoSize}
						preview={false}
						src={value}
						style={{ objectFit: "contain" }}
						width={logoSize}
					/>
				) : (
					<AntDesignOutlined
						aria-hidden
						style={{ color: token.colorPrimary, fontSize: logoSize }}
					/>
				)}
				<Upload
					accept="image/png,image/jpeg,image/webp"
					beforeUpload={async (file) => {
						setError(undefined);
						if (
							!["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
							file.size > platformSettingsLimits.logoBytes
						) {
							setError(t("adminShell.platformSettings.logo.invalid"));
							return Upload.LIST_IGNORE;
						}
						onLoading(true);
						try {
							const bitmap = await createImageBitmap(file);
							bitmap.close();
							const dataUrl = await new Promise<string>((resolve, reject) => {
								const reader = new FileReader();
								reader.onerror = () => reject(new Error("Logo read failed"));
								reader.onload = () =>
									typeof reader.result === "string"
										? resolve(reader.result)
										: reject(new Error("Invalid logo data"));
								reader.readAsDataURL(file);
							});
							onChange?.(dataUrl);
						} catch {
							setError(t("adminShell.platformSettings.logo.readError"));
						} finally {
							onLoading(false);
						}
						return Upload.LIST_IGNORE;
					}}
					disabled={disabled || loading}
					showUploadList={false}
				>
					<Button
						disabled={disabled}
						icon={<UploadOutlined aria-hidden />}
						id={id}
						loading={loading}
					>
						{t("adminShell.platformSettings.logo.upload")}
					</Button>
				</Upload>
				{value && !disabled ? (
					<Button
						icon={<DeleteOutlined aria-hidden />}
						disabled={loading}
						onClick={() => {
							onChange?.(null);
							setError(undefined);
						}}
					>
						{t("adminShell.platformSettings.logo.reset")}
					</Button>
				) : null}
			</Flex>
			{error ? <Alert showIcon title={error} type="error" /> : null}
		</Flex>
	);
}
