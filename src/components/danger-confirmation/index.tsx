import { Alert, Flex, Input, Modal, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export interface DangerConfirmationProps {
	impact: string
	loading?: boolean
	onCancel: () => void
	onConfirm: () => Promise<void> | void
	open: boolean
	targetName: string
	title: string
}

export function DangerConfirmation({
	impact,
	loading = false,
	onCancel,
	onConfirm,
	open,
	targetName,
	title,
}: DangerConfirmationProps) {
	const { t } = useTranslation();
	const [confirmationState, setConfirmationState] = useState({
		targetName,
		value: "",
	});
	const confirmation = confirmationState.targetName === targetName
		? confirmationState.value
		: "";

	const canConfirm = confirmation === targetName && !loading;
	const resetConfirmation = () => {
		setConfirmationState({ targetName, value: "" });
	};

	return (
		<Modal
			afterOpenChange={(nextOpen) => {
				if (!nextOpen)
					resetConfirmation();
			}}
			cancelButtonProps={{ disabled: loading }}
			cancelText={t("common.cancel")}
			closable={!loading}
			confirmLoading={loading}
			keyboard={!loading}
			maskClosable={!loading}
			onCancel={() => {
				if (!loading) {
					resetConfirmation();
					onCancel();
				}
			}}
			onOk={async () => {
				if (canConfirm) {
					await onConfirm();
					resetConfirmation();
				}
			}}
			okButtonProps={{ danger: true, disabled: !canConfirm }}
			okText={t("common.confirm")}
			open={open}
			title={title}
		>
			<Flex gap="middle" vertical>
				<Alert description={impact} showIcon type="error" />
				<Flex gap="small" vertical>
					<Text>{t("common.dangerConfirmation.inputHint", { targetName })}</Text>
					<Input
						aria-label={t("common.dangerConfirmation.inputLabel")}
						autoComplete="off"
						disabled={loading}
						onChange={event => setConfirmationState({
							targetName,
							value: event.target.value,
						})}
						value={confirmation}
					/>
				</Flex>
			</Flex>
		</Modal>
	);
}
