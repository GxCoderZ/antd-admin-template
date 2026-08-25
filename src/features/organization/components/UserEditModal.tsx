import { Alert, Button, Flex, Form, Input, Modal, Select, theme } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type { PlatformUser, UpdatePlatformUserInput } from "#src/api/users";
import {
	getProblemFallback,
	getUserMutationErrorTitleKey,
	isApiProblemStatus,
} from "../userProblems";

export interface UserEditFormValues {
	displayName: string;
	status: UpdatePlatformUserInput["status"];
}

interface UserEditModalProps {
	error: unknown;
	loading: boolean;
	onCancel: () => void;
	onReloadConflict: () => void;
	onSubmit: (values: UserEditFormValues) => void;
	requestedStatus: UpdatePlatformUserInput["status"] | undefined;
	user: PlatformUser | null;
}

export function UserEditModal({
	error,
	loading,
	onCancel,
	onReloadConflict,
	onSubmit,
	requestedStatus,
	user,
}: UserEditModalProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<UserEditFormValues>();
	const editingStatus = Form.useWatch("status", form);
	const conflict = isApiProblemStatus(error, 409);
	const showsDisableWarning =
		user !== null && user.status !== "disabled" && editingStatus === "disabled";

	useEffect(() => {
		if (!user) {
			form.resetFields();
			return;
		}

		form.setFieldsValue({
			displayName: user.displayName,
			status: user.status === "locked" ? "disabled" : user.status,
		});
	}, [form, user]);

	return (
		<Modal
			cancelText={t("adminShell.users.editForm.cancel")}
			confirmLoading={loading}
			destroyOnHidden
			okButtonProps={{ disabled: loading || conflict }}
			okText={t("adminShell.users.editForm.submit")}
			onCancel={onCancel}
			onOk={() => form.submit()}
			open={user !== null}
			title={t("adminShell.users.editForm.title", {
				name: user?.username,
			})}
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
								: getProblemFallback(
										error,
										t("adminShell.users.errors.fallback"),
									)
						}
						showIcon
						title={
							conflict
								? t("optimisticLock.title")
								: t(
										getUserMutationErrorTitleKey(
											error,
											requestedStatus === "disabled"
												? "adminShell.users.errors.selfDisable"
												: "adminShell.users.errors.invalid",
										),
									)
						}
						type="error"
					/>
				) : null}
				<Form<UserEditFormValues>
					form={form}
					layout="vertical"
					onFinish={onSubmit}
				>
					<Form.Item
						label={t("adminShell.users.createForm.displayName")}
						name="displayName"
						rules={[
							{
								max: 128,
								message: t(
									"adminShell.users.createForm.validation.displayNameRequired",
								),
								required: true,
								whitespace: true,
							},
						]}
					>
						<Input autoComplete="name" />
					</Form.Item>
					<Form.Item
						label={t("adminShell.users.columns.status")}
						name="status"
						rules={[{ required: true }]}
					>
						<Select
							aria-label={t("adminShell.users.columns.status")}
							options={[
								{
									label: t("adminShell.users.statuses.active"),
									value: "active",
								},
								{
									label: t("adminShell.users.statuses.disabled"),
									value: "disabled",
								},
							]}
						/>
					</Form.Item>
					{showsDisableWarning ? (
						<Alert
							description={t("adminShell.users.editForm.disableImpact")}
							showIcon
							title={t("dangerConfirmation.impactTitle")}
							type="warning"
						/>
					) : null}
				</Form>
			</Flex>
		</Modal>
	);
}
