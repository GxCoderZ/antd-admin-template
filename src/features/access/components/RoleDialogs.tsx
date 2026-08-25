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

import { DangerConfirmationModal } from "../../../app/DangerConfirmation";
import type {
	CreatePlatformRoleInput,
	PlatformRole,
	UpdatePlatformRoleInput,
} from "#src/api/roles";
import { getRoleErrorTitleKey, getRoleProblemDetail } from "../roleProblems";

const { Text } = Typography;
export type RenameRoleFormValues = Pick<UpdatePlatformRoleInput, "displayName">;

interface CreateRoleModalProps {
	error: unknown;
	form: FormInstance<CreatePlatformRoleInput>;
	loading: boolean;
	onCancel: () => void;
	onSubmit: (values: CreatePlatformRoleInput) => void;
	open: boolean;
}

export function CreateRoleModal({
	error,
	form,
	loading,
	onCancel,
	onSubmit,
	open,
}: CreateRoleModalProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return (
		<Modal
			cancelText={t("adminShell.roles.cancel")}
			confirmLoading={loading}
			destroyOnHidden
			okText={t("adminShell.roles.create")}
			onCancel={onCancel}
			onOk={() => form.submit()}
			open={open}
			title={t("adminShell.roles.createTitle")}
		>
			<Flex gap={token.margin} vertical>
				{error ? (
					<Alert
						description={
							getRoleProblemDetail(error) ??
							t("adminShell.roles.errors.fallback")
						}
						showIcon
						title={t(getRoleErrorTitleKey(error))}
						type="error"
					/>
				) : null}
				<Form<CreatePlatformRoleInput>
					form={form}
					layout="vertical"
					onFinish={onSubmit}
				>
					<Form.Item
						label={t("adminShell.roles.fields.displayName")}
						name="displayName"
						rules={[{ max: 128, required: true, whitespace: true }]}
					>
						<Input
							autoComplete="off"
							placeholder={t("adminShell.roles.placeholders.displayName")}
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.roles.fields.roleKey")}
						name="roleKey"
						rules={[
							{
								max: 63,
								min: 2,
								pattern: /^[a-z][a-z0-9-]*$/,
								required: true,
							},
						]}
					>
						<Input
							autoComplete="off"
							placeholder={t("adminShell.roles.placeholders.roleKey")}
						/>
					</Form.Item>
				</Form>
			</Flex>
		</Modal>
	);
}

interface RenameRoleModalProps {
	conflict: boolean;
	error: unknown;
	form: FormInstance<RenameRoleFormValues>;
	loading: boolean;
	onCancel: () => void;
	onReloadConflict: () => void;
	onSubmit: (values: RenameRoleFormValues) => void;
	role: PlatformRole | null;
}

export function RenameRoleModal({
	conflict,
	error,
	form,
	loading,
	onCancel,
	onReloadConflict,
	onSubmit,
	role,
}: RenameRoleModalProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return (
		<Modal
			cancelText={t("adminShell.roles.cancel")}
			confirmLoading={loading}
			destroyOnHidden
			okButtonProps={{ disabled: conflict }}
			okText={t("adminShell.roles.save")}
			onCancel={onCancel}
			onOk={() => form.submit()}
			open={role !== null}
			title={t("adminShell.roles.renameTitle", { name: role?.displayName })}
		>
			<Flex gap={token.margin} vertical>
				{error ? (
					<Alert
						action={
							conflict ? (
								<Button onClick={onReloadConflict} size="small">
									{t("optimisticLock.reload")}
								</Button>
							) : undefined
						}
						description={
							conflict
								? t("optimisticLock.description")
								: (getRoleProblemDetail(error) ??
									t("adminShell.roles.errors.fallback"))
						}
						showIcon
						title={
							conflict
								? t("optimisticLock.title")
								: t(getRoleErrorTitleKey(error))
						}
						type="error"
					/>
				) : null}
				<Form<RenameRoleFormValues>
					form={form}
					layout="vertical"
					onFinish={onSubmit}
				>
					<Form.Item
						label={t("adminShell.roles.fields.displayName")}
						name="displayName"
						rules={[{ max: 128, required: true, whitespace: true }]}
					>
						<Input
							autoComplete="off"
							placeholder={t("adminShell.roles.placeholders.displayName")}
						/>
					</Form.Item>
				</Form>
			</Flex>
		</Modal>
	);
}

interface DeleteRoleModalProps {
	error: unknown;
	loading: boolean;
	onCancel: () => void;
	onConfirm: () => void;
	role: PlatformRole | null;
}

export function DeleteRoleModal({
	error,
	loading,
	onCancel,
	onConfirm,
	role,
}: DeleteRoleModalProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();

	return role ? (
		<DangerConfirmationModal
			cancelText={t("adminShell.roles.cancel")}
			confirmText={t("adminShell.roles.confirmDelete")}
			feedback={
				error ? (
					<Alert
						description={
							getRoleProblemDetail(error) ??
							t("adminShell.roles.errors.fallback")
						}
						showIcon
						title={t(getRoleErrorTitleKey(error))}
						type="error"
					/>
				) : undefined
			}
			impact={
				<Flex gap={token.marginXXS} vertical>
					<Text>
						{t("adminShell.roles.deleteMemberDescription", {
							count: role.memberCount ?? 0,
						})}
					</Text>
					<Text type="secondary">
						{t("adminShell.roles.deleteDescription", {
							name: role.displayName,
						})}
					</Text>
				</Flex>
			}
			loading={loading}
			onCancel={onCancel}
			onConfirm={onConfirm}
			targetName={role.displayName}
			title={t("adminShell.roles.deleteTitle")}
		/>
	) : null;
}
