import type { ReactNode } from "react";

import { BasicModal } from "#src/components/basic-modal";

import { Alert, Flex, Input, theme, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

export interface DangerConfirmationProps {
	feedback?: ReactNode
	impact: ReactNode
	loading?: boolean
	onCancel: () => void
	onConfirm: () => Promise<void> | void
	open: boolean
	targetName: string
	title: string
}

interface DangerConfirmationContentProps {
	disabled?: boolean
	feedback?: ReactNode
	impact: ReactNode
	onChange: (value: string) => void
	targetName: string
	value: string
}

export function DangerConfirmationContent({ disabled = false, feedback, impact, onChange, targetName, value }: DangerConfirmationContentProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	return (
		<Flex gap={token.margin} vertical>
			{feedback}
			<Alert description={impact} message={t("common.dangerConfirmation.impactTitle")} showIcon type="warning" />
			<Flex gap={token.marginXS} vertical>
				<Text>{t("common.dangerConfirmation.inputHint", { targetName })}</Text>
				<Input
					aria-label={t("common.dangerConfirmation.inputLabel")}
					autoComplete="off"
					disabled={disabled}
					placeholder={t("common.dangerConfirmation.placeholder")}
					onChange={event => onChange(event.target.value)}
					value={value}
				/>
			</Flex>
		</Flex>
	);
}

export function DangerConfirmation({
	impact,
	feedback,
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
		<BasicModal
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
			<DangerConfirmationContent
				disabled={loading}
				feedback={feedback}
				impact={impact}
				onChange={value => setConfirmationState({ targetName, value })}
				targetName={targetName}
				value={confirmation}
			/>
		</BasicModal>
	);
}
