import { Alert, Button, Drawer, Flex, Form, Input, Select, theme } from "antd";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { PlatformUser, UpdatePlatformUserInput } from "#src/api/users";
import { UserDepartmentSelect } from "./UserDepartmentSelect";
import {
	hasFormChanges,
	useDiscardChanges,
} from "../../../app/useDiscardChanges";
import {
	getProblemFallback,
	getUserMutationErrorTitleKey,
	isApiProblemStatus,
} from "../userProblems";

export type UserEditFormValues = Omit<
	UpdatePlatformUserInput,
	"expectedVersion"
>;

interface UserPositionOption {
	label: string;
	value: string;
}

interface UserEditDrawerProps {
	error: unknown;
	loading: boolean;
	onCancel: () => void;
	onReloadConflict: () => void;
	onSubmit: (values: UserEditFormValues) => void;
	positionOptions: UserPositionOption[];
	positionsLoading: boolean;
	requestedStatus: UpdatePlatformUserInput["status"] | undefined;
	user: PlatformUser | null;
}

export function UserEditDrawer({
	error,
	loading,
	onCancel,
	onReloadConflict,
	onSubmit,
	positionOptions,
	positionsLoading,
	requestedStatus,
	user,
}: UserEditDrawerProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [form] = Form.useForm<UserEditFormValues>();
	const editingStatus = Form.useWatch("status", form);
	const conflict = isApiProblemStatus(error, 409);
	const currentJobTitle = user?.jobTitle ?? "";
	const jobTitleOptions = useMemo(() => {
		if (
			!currentJobTitle ||
			positionOptions.some((option) => option.value === currentJobTitle)
		) {
			return positionOptions;
		}
		return [
			{ label: currentJobTitle, value: currentJobTitle },
			...positionOptions,
		];
	}, [currentJobTitle, positionOptions]);
	const showsDisableWarning =
		user !== null && user.status !== "disabled" && editingStatus === "disabled";
	const initialValues = useMemo<UserEditFormValues | null>(
		() =>
			user
				? {
						departmentId: user.departmentId,
						displayName: user.displayName,
						email: user.email,
						jobTitle: user.jobTitle,
						phone: user.phone,
						status: user.status === "locked" ? "disabled" : user.status,
					}
				: null,
		[user],
	);
	const discard = useDiscardChanges({
		isDirty: () =>
			initialValues !== null && hasFormChanges(form, initialValues),
		onDiscard: onCancel,
		saving: loading,
	});

	useEffect(() => {
		if (!initialValues) {
			form.resetFields();
			return;
		}

		form.setFieldsValue(initialValues);
	}, [form, initialValues]);

	return (
		<Drawer
			destroyOnHidden
			footer={
				<Flex gap={token.marginXS} justify="flex-end">
					<Button disabled={loading} onClick={discard.requestClose}>
						{t("adminShell.users.editForm.cancel")}
					</Button>
					<Button
						disabled={loading || conflict}
						loading={loading}
						onClick={() => form.submit()}
						type="primary"
					>
						{t("adminShell.users.editForm.submit")}
					</Button>
				</Flex>
			}
			onClose={discard.requestClose}
			closable={!loading}
			keyboard={!loading}
			mask={{ closable: !loading }}
			open={user !== null}
			title={t("adminShell.users.editForm.title", {
				name: user?.username,
			})}
		>
			{discard.contextHolder}
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
					disabled={loading}
					form={form}
					layout="vertical"
					name="edit-user"
					onFinish={onSubmit}
					scrollToFirstError
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
						<Input autoComplete="name" maxLength={128} />
					</Form.Item>
					<Form.Item
						label={t("adminShell.users.columns.email")}
						name="email"
						rules={[
							{
								message: t(
									"adminShell.users.createForm.validation.emailRequired",
								),
								required: true,
							},
							{
								message: t(
									"adminShell.users.createForm.validation.emailInvalid",
								),
								type: "email",
							},
						]}
					>
						<Input autoComplete="email" maxLength={254} />
					</Form.Item>
					<Form.Item label={t("adminShell.users.columns.phone")} name="phone">
						<Input autoComplete="tel" maxLength={32} />
					</Form.Item>
					<Form.Item
						label={t("adminShell.users.columns.department")}
						name="departmentId"
					>
						<UserDepartmentSelect />
					</Form.Item>
					<Form.Item
						label={t("adminShell.users.columns.jobTitle")}
						name="jobTitle"
					>
						<Select
							aria-label={t("adminShell.users.columns.jobTitle")}
							loading={positionsLoading}
							optionFilterProp="label"
							options={jobTitleOptions}
							showSearch
						/>
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
		</Drawer>
	);
}
