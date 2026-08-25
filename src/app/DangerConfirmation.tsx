import { Alert, Flex, Input, Modal, theme, Typography } from "antd";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface DangerConfirmationContentProps {
	impact: ReactNode;
	onChange: (value: string) => void;
	targetName: string;
	value: string;
}

export function DangerConfirmationContent({
	impact,
	onChange,
	targetName,
	value,
}: DangerConfirmationContentProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return (
		<Flex gap={token.margin} vertical>
			<Alert
				description={impact}
				showIcon
				title={t("dangerConfirmation.impactTitle")}
				type="warning"
			/>
			<Flex gap={token.marginXS} vertical>
				<Text>{t("dangerConfirmation.instruction", { name: targetName })}</Text>
				<Input
					aria-label={t("dangerConfirmation.inputLabel")}
					autoComplete="off"
					onChange={(event) => onChange(event.target.value)}
					placeholder={t("dangerConfirmation.placeholder")}
					value={value}
				/>
			</Flex>
		</Flex>
	);
}

interface DangerConfirmationModalProps {
	cancelText: string;
	confirmText: string;
	feedback?: ReactNode;
	impact: ReactNode;
	loading: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	targetName: string;
	title: string;
}

export function DangerConfirmationModal({
	cancelText,
	confirmText,
	feedback,
	impact,
	loading,
	onCancel,
	onConfirm,
	targetName,
	title,
}: DangerConfirmationModalProps) {
	const { token } = theme.useToken();
	const [confirmationName, setConfirmationName] = useState("");
	const isConfirmed = confirmationName === targetName;

	return (
		<Modal
			cancelButtonProps={{ disabled: loading }}
			cancelText={cancelText}
			closable={!loading}
			confirmLoading={loading}
			destroyOnHidden
			keyboard={!loading}
			mask={{ closable: !loading }}
			okButtonProps={{ danger: true, disabled: loading || !isConfirmed }}
			okText={confirmText}
			onCancel={onCancel}
			onOk={() => {
				if (isConfirmed && !loading) {
					onConfirm();
				}
			}}
			open
			title={title}
		>
			<Flex gap={token.margin} vertical>
				{feedback}
				<DangerConfirmationContent
					impact={impact}
					onChange={setConfirmationName}
					targetName={targetName}
					value={confirmationName}
				/>
			</Flex>
		</Modal>
	);
}
