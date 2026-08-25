import { CopyOutlined } from "@ant-design/icons";
import {
	Alert,
	Button,
	Flex,
	Form,
	Input,
	Modal,
	theme,
	Typography,
} from "antd";
import type { FormInstance } from "antd";
import { useTranslation } from "react-i18next";

import { DangerConfirmationContent } from "../../../app/DangerConfirmation";
import type {
	PlatformUser,
	ResetPlatformUserPasswordInput,
	ResetPlatformUserPasswordResult,
} from "#src/api/users";
import {
	getProblemFallback,
	getUserMutationErrorTitleKey,
} from "../userProblems";

const { Text } = Typography;

export interface ResetPasswordResultView extends ResetPlatformUserPasswordResult {
	password: string;
	username: string;
}

interface ResetPasswordModalProps {
	confirmationName: string;
	error: unknown;
	form: FormInstance<ResetPlatformUserPasswordInput>;
	loading: boolean;
	onCancel: () => void;
	onConfirmationNameChange: (value: string) => void;
	onSubmit: (values: ResetPlatformUserPasswordInput) => void;
	user: PlatformUser | null;
}

export function ResetPasswordModal({
	confirmationName,
	error,
	form,
	loading,
	onCancel,
	onConfirmationNameChange,
	onSubmit,
	user,
}: ResetPasswordModalProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return (
		<Modal
			cancelText={t("adminShell.users.resetPasswordForm.cancel")}
			confirmLoading={loading}
			destroyOnHidden
			okButtonProps={{
				disabled: loading || confirmationName !== user?.username,
			}}
			okText={t("adminShell.users.resetPasswordForm.submit")}
			onCancel={onCancel}
			onOk={() => form.submit()}
			open={user !== null}
			title={t("adminShell.users.resetPasswordForm.title", {
				name: user?.username,
			})}
		>
			<Flex gap={token.margin} vertical>
				{error ? (
					<Alert
						description={getProblemFallback(
							error,
							t("adminShell.users.errors.fallback"),
						)}
						showIcon
						title={t(getUserMutationErrorTitleKey(error))}
						type="error"
					/>
				) : null}
				<Form<ResetPlatformUserPasswordInput>
					form={form}
					layout="vertical"
					onFinish={onSubmit}
				>
					<Form.Item
						label={t("adminShell.users.resetPasswordForm.password")}
						name="password"
						rules={[
							{
								message: t(
									"adminShell.users.createForm.validation.passwordRequired",
								),
								required: true,
							},
							{
								min: 12,
								message: t(
									"adminShell.users.createForm.validation.passwordLength",
								),
							},
						]}
					>
						<Input.Password
							autoComplete="new-password"
							placeholder={t("adminShell.users.resetPasswordForm.placeholder")}
						/>
					</Form.Item>
					{user ? (
						<DangerConfirmationContent
							impact={t("adminShell.users.resetPasswordForm.impact")}
							onChange={onConfirmationNameChange}
							targetName={user.username}
							value={confirmationName}
						/>
					) : null}
				</Form>
			</Flex>
		</Modal>
	);
}

interface ResetPasswordResultModalProps {
	copied: boolean;
	onClose: () => void;
	onCopy: () => void;
	result: ResetPasswordResultView | null;
}

export function ResetPasswordResultModal({
	copied,
	onClose,
	onCopy,
	result,
}: ResetPasswordResultModalProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return result ? (
		<Modal
			destroyOnHidden
			footer={
				<Button onClick={onClose} type="primary">
					{t("adminShell.users.resetPasswordResult.done")}
				</Button>
			}
			onCancel={onClose}
			open
			title={t("adminShell.users.resetPasswordResult.title", {
				name: result.username,
			})}
		>
			<Flex gap={token.margin} vertical>
				<Alert
					description={t(
						result.mustChangePassword
							? "adminShell.users.resetPasswordResult.mustChangePassword"
							: "adminShell.users.resetPasswordResult.passwordChanged",
					)}
					showIcon
					title={t("adminShell.users.resetPasswordResult.success")}
					type="success"
				/>
				<Flex gap={token.marginXS} vertical>
					<Text strong>
						{t("adminShell.users.resetPasswordResult.passwordLabel")}
					</Text>
					<Flex align="center" gap={token.marginXS} wrap="wrap">
						<Text code>{result.password}</Text>
						<Button
							aria-label={t(
								"adminShell.users.resetPasswordResult.copyPassword",
							)}
							icon={<CopyOutlined aria-hidden />}
							onClick={onCopy}
							size="small"
						>
							{t(
								copied
									? "adminShell.users.resetPasswordResult.copied"
									: "adminShell.users.resetPasswordResult.copy",
							)}
						</Button>
					</Flex>
					<Text type="secondary">
						{t("adminShell.users.resetPasswordResult.passwordHint")}
					</Text>
				</Flex>
			</Flex>
		</Modal>
	) : null;
}
