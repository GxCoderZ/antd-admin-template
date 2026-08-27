import { ApiProblemError } from "#src/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Drawer, Flex, Form, Input, theme } from "antd";
import { useTranslation } from "react-i18next";
import { platformDepartmentsQueryKey } from "#src/api/departments";
import { UserDepartmentSelect } from "./components/UserDepartmentSelect";
import { hasFormChanges, useDiscardChanges } from "../../app/useDiscardChanges";

import {
	createPlatformUser,
	platformUsersQueryKey,
	type CreatePlatformUserInput,
} from "#src/api/users";

type CreateUserFormValues = CreatePlatformUserInput;

interface CreateUserDrawerProps {
	onClose: () => void;
	onSuccess: () => void;
	open: boolean;
}

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

function getErrorTitleKey(error: unknown) {
	if (!(error instanceof ApiProblemError)) {
		return "adminShell.users.errors.request";
	}

	switch (error.status) {
		case 400:
			return "adminShell.users.errors.invalid";
		case 409:
			return "adminShell.users.errors.conflict";
		default:
			return "adminShell.users.errors.request";
	}
}

export function CreateUserDrawer({
	onClose,
	onSuccess,
	open,
}: CreateUserDrawerProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const queryClient = useQueryClient();
	const [form] = Form.useForm<CreateUserFormValues>();
	const createUserMutation = useMutation({
		mutationFn: createPlatformUser,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: platformUsersQueryKey }),
				queryClient.invalidateQueries({
					queryKey: platformDepartmentsQueryKey,
				}),
			]);
		},
	});

	const closeDrawer = () => {
		form.resetFields();
		createUserMutation.reset();
		onClose();
	};
	const discard = useDiscardChanges({
		isDirty: () =>
			hasFormChanges(form, {
				username: "",
				displayName: "",
				email: "",
				password: "",
				departmentId: null,
			}),
		onDiscard: closeDrawer,
		saving: createUserMutation.isPending,
	});
	const createUser = (values: CreateUserFormValues) => {
		createUserMutation.mutate(values, {
			onSuccess: () => {
				form.resetFields();
				createUserMutation.reset();
				onSuccess();
			},
		});
	};

	return (
		<Drawer
			destroyOnHidden
			footer={
				<Flex gap={token.marginXS} justify="flex-end">
					<Button
						disabled={createUserMutation.isPending}
						onClick={discard.requestClose}
					>
						{t("adminShell.users.createForm.cancel")}
					</Button>
					<Button
						loading={createUserMutation.isPending}
						onClick={() => form.submit()}
						type="primary"
					>
						{t("adminShell.users.create")}
					</Button>
				</Flex>
			}
			onClose={discard.requestClose}
			closable={!createUserMutation.isPending}
			keyboard={!createUserMutation.isPending}
			mask={{ closable: !createUserMutation.isPending }}
			open={open}
			title={t("adminShell.users.create")}
		>
			{discard.contextHolder}
			<Flex gap={token.marginLG} vertical>
				{createUserMutation.isError ? (
					<Alert
						description={
							getProblemDetail(createUserMutation.error) ??
							t("adminShell.users.errors.fallback")
						}
						showIcon
						title={t(getErrorTitleKey(createUserMutation.error))}
						type="error"
					/>
				) : null}
				<Form<CreateUserFormValues>
					disabled={createUserMutation.isPending}
					form={form}
					layout="vertical"
					name="create-user"
					onFinish={createUser}
					scrollToFirstError
				>
					<Form.Item
						label={t("adminShell.users.createForm.username")}
						name="username"
						rules={[
							{
								max: 128,
								message: t(
									"adminShell.users.createForm.validation.usernameRequired",
								),
								required: true,
								whitespace: true,
							},
						]}
					>
						<Input
							autoComplete="off"
							placeholder={t(
								"adminShell.users.createForm.placeholders.username",
							)}
						/>
					</Form.Item>
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
						<Input
							autoComplete="name"
							placeholder={t(
								"adminShell.users.createForm.placeholders.displayName",
							)}
						/>
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
						<Input
							autoComplete="email"
							placeholder={t("adminShell.users.createForm.placeholders.email")}
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.users.createForm.password")}
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
							placeholder={t(
								"adminShell.users.createForm.placeholders.password",
							)}
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.users.columns.department")}
						name="departmentId"
					>
						<UserDepartmentSelect />
					</Form.Item>
				</Form>
			</Flex>
		</Drawer>
	);
}
