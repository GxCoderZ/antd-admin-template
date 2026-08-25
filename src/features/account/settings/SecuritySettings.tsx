import { LockOutlined } from "@ant-design/icons";
import {
	changePlatformAccountPassword,
	type ChangePlatformAccountPasswordInput,
	getPlatformAccountSecurity,
	platformAccountSecurityQueryKey,
	type PlatformAccountSecurity,
	updatePlatformAccountSecurity,
} from "#src/api/account";
import { ApiProblemError } from "#src/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Button,
	Flex,
	Form,
	Input,
	Listy,
	Modal,
	Skeleton,
	Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

interface PasswordFormValues extends ChangePlatformAccountPasswordInput {
	confirmPassword: string;
}

type SecurityPhoneFormValues = Pick<
	PlatformAccountSecurity,
	"securityPhoneAreaCode" | "securityPhoneNumber"
>;

type BackupEmailFormValues = Pick<PlatformAccountSecurity, "backupEmail">;
type ActiveModal = "password" | "phone" | "email";

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

function maskPhone(areaCode: string, phoneNumber: string) {
	const suffix = phoneNumber.slice(-4);
	return `${areaCode} ${phoneNumber.slice(0, 3)}****${suffix}`;
}

function maskEmail(email: string) {
	const [name = "", domain = ""] = email.split("@");
	return `${name.slice(0, 3)}***@${domain}`;
}

export function SecuritySettings() {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const [passwordForm] = Form.useForm<PasswordFormValues>();
	const [phoneForm] = Form.useForm<SecurityPhoneFormValues>();
	const [emailForm] = Form.useForm<BackupEmailFormValues>();
	const [activeModal, setActiveModal] = useState<ActiveModal>();
	const [passwordUpdated, setPasswordUpdated] = useState(false);
	const [securityUpdated, setSecurityUpdated] = useState(false);
	const securityQuery = useQuery({
		queryFn: ({ signal }) => getPlatformAccountSecurity(signal),
		queryKey: platformAccountSecurityQueryKey,
	});
	const changePasswordMutation = useMutation({
		mutationFn: changePlatformAccountPassword,
		onSuccess: () => {
			passwordForm.resetFields();
			setActiveModal(undefined);
			setPasswordUpdated(true);
		},
	});
	const updateSecurityMutation = useMutation({
		mutationFn: updatePlatformAccountSecurity,
		onSuccess: (data) => {
			queryClient.setQueryData(platformAccountSecurityQueryKey, data);
			setActiveModal(undefined);
			setSecurityUpdated(true);
		},
	});

	useEffect(() => {
		if (!securityQuery.data) {
			return;
		}
		if (activeModal === "phone") {
			phoneForm.setFieldsValue({
				securityPhoneAreaCode: securityQuery.data.securityPhoneAreaCode,
				securityPhoneNumber: securityQuery.data.securityPhoneNumber,
			});
		}
		if (activeModal === "email") {
			emailForm.setFieldsValue({
				backupEmail: securityQuery.data.backupEmail,
			});
		}
	}, [activeModal, emailForm, phoneForm, securityQuery.data]);

	function openModal(modal: ActiveModal) {
		changePasswordMutation.reset();
		updateSecurityMutation.reset();
		setActiveModal(modal);
	}

	function closeModal() {
		changePasswordMutation.reset();
		updateSecurityMutation.reset();
		setActiveModal(undefined);
	}

	function updateSecurityContact(
		values: SecurityPhoneFormValues | BackupEmailFormValues,
	) {
		if (!securityQuery.data) {
			return;
		}
		updateSecurityMutation.mutate({ ...securityQuery.data, ...values });
	}

	const items = securityQuery.data
		? [
				{
					key: "password",
					title: t("adminShell.account.settings.security.password"),
					description: (
						<>
							{t("adminShell.account.settings.security.passwordStrength")}
							<Text type="success">
								{t("adminShell.account.settings.security.passwordStrong")}
							</Text>
						</>
					),
					action: (
						<Button
							aria-label={t(
								"adminShell.account.settings.security.modifyPassword",
							)}
							onClick={() => openModal("password")}
							type="link"
						>
							{t("adminShell.account.settings.security.modify")}
						</Button>
					),
				},
				{
					key: "phone",
					title: t("adminShell.account.settings.security.securityPhone"),
					description: t(
						"adminShell.account.settings.security.securityPhoneDescription",
						{
							phone: maskPhone(
								securityQuery.data.securityPhoneAreaCode,
								securityQuery.data.securityPhoneNumber,
							),
						},
					),
					action: (
						<Button
							aria-label={t(
								"adminShell.account.settings.security.modifySecurityPhone",
							)}
							onClick={() => openModal("phone")}
							type="link"
						>
							{t("adminShell.account.settings.security.modify")}
						</Button>
					),
				},
				{
					key: "email",
					title: t("adminShell.account.settings.security.backupEmail"),
					description: t(
						"adminShell.account.settings.security.backupEmailDescription",
						{ email: maskEmail(securityQuery.data.backupEmail) },
					),
					action: (
						<Button
							aria-label={t(
								"adminShell.account.settings.security.modifyBackupEmail",
							)}
							onClick={() => openModal("email")}
							type="link"
						>
							{t("adminShell.account.settings.security.modify")}
						</Button>
					),
				},
			]
		: [];

	return (
		<>
			{passwordUpdated ? (
				<Alert
					closable
					onClose={() => setPasswordUpdated(false)}
					showIcon
					title={t("adminShell.account.settings.security.passwordChangedTitle")}
					type="success"
				/>
			) : null}
			{securityUpdated ? (
				<Alert
					closable
					onClose={() => setSecurityUpdated(false)}
					showIcon
					title={t(
						"adminShell.account.settings.security.securityContactsUpdatedTitle",
					)}
					type="success"
				/>
			) : null}
			{securityQuery.isPending ? (
				<Skeleton active paragraph={{ rows: 3 }} />
			) : null}
			{securityQuery.isError ? (
				<Alert
					action={
						<Button onClick={() => void securityQuery.refetch()}>
							{t("adminShell.account.retry")}
						</Button>
					}
					description={
						getProblemDetail(securityQuery.error) ??
						t("adminShell.account.requestErrorFallback")
					}
					showIcon
					title={t("adminShell.account.settings.security.loadError")}
					type="error"
				/>
			) : null}
			{securityQuery.data ? (
				<Listy
					itemRender={(item) => (
						<Flex align="center" gap="middle" justify="space-between" wrap>
							<Flex gap={2} vertical>
								<Text strong>{item.title}</Text>
								<Text type="secondary">{item.description}</Text>
							</Flex>
							{item.action}
						</Flex>
					)}
					items={items}
					rowKey="key"
					styles={{ item: { padding: "14px 0" } }}
				/>
			) : null}
			<Modal
				cancelText={t("adminShell.account.settings.security.cancel")}
				confirmLoading={changePasswordMutation.isPending}
				destroyOnHidden
				okText={t("adminShell.account.settings.security.changePassword")}
				onCancel={closeModal}
				onOk={() => passwordForm.submit()}
				open={activeModal === "password"}
				title={t("adminShell.account.settings.security.changePassword")}
			>
				{changePasswordMutation.isError ? (
					<Alert
						description={
							getProblemDetail(changePasswordMutation.error) ??
							t("adminShell.account.requestErrorFallback")
						}
						showIcon
						title={t(
							"adminShell.account.settings.security.passwordChangeError",
						)}
						type="error"
					/>
				) : null}
				<Form<PasswordFormValues>
					form={passwordForm}
					layout="vertical"
					onFinish={({ currentPassword, newPassword }) =>
						changePasswordMutation.mutate({ currentPassword, newPassword })
					}
					preserve={false}
				>
					<Form.Item
						label={t("adminShell.account.settings.security.currentPassword")}
						name="currentPassword"
						rules={[
							{
								required: true,
								message: t(
									"adminShell.account.settings.security.currentPasswordRequired",
								),
							},
						]}
					>
						<Input.Password
							autoComplete="current-password"
							prefix={<LockOutlined aria-hidden />}
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.account.settings.security.newPassword")}
						name="newPassword"
						rules={[
							{
								required: true,
								message: t(
									"adminShell.account.settings.security.newPasswordRequired",
								),
							},
							{
								min: 12,
								max: 1024,
								message: t(
									"adminShell.account.settings.security.newPasswordLength",
								),
							},
						]}
					>
						<Input.Password
							autoComplete="new-password"
							prefix={<LockOutlined aria-hidden />}
						/>
					</Form.Item>
					<Form.Item
						dependencies={["newPassword"]}
						label={t("adminShell.account.settings.security.confirmNewPassword")}
						name="confirmPassword"
						rules={[
							{
								required: true,
								message: t(
									"adminShell.account.settings.security.confirmNewPasswordRequired",
								),
							},
							({ getFieldValue }) => ({
								validator: (_, value) =>
									!value || getFieldValue("newPassword") === value
										? Promise.resolve()
										: Promise.reject(
												new Error(
													t(
														"adminShell.account.settings.security.newPasswordMismatch",
													),
												),
											),
							}),
						]}
					>
						<Input.Password
							autoComplete="new-password"
							prefix={<LockOutlined aria-hidden />}
						/>
					</Form.Item>
				</Form>
			</Modal>
			<Modal
				cancelText={t("adminShell.account.settings.security.cancel")}
				confirmLoading={updateSecurityMutation.isPending}
				destroyOnHidden
				okText={t("adminShell.account.settings.security.modify")}
				onCancel={closeModal}
				onOk={() => phoneForm.submit()}
				open={activeModal === "phone"}
				title={t("adminShell.account.settings.security.modifySecurityPhone")}
			>
				{updateSecurityMutation.isError ? (
					<Alert
						description={
							getProblemDetail(updateSecurityMutation.error) ??
							t("adminShell.account.requestErrorFallback")
						}
						showIcon
						title={t(
							"adminShell.account.settings.security.securityContactsUpdateError",
						)}
						type="error"
					/>
				) : null}
				<Form<SecurityPhoneFormValues>
					form={phoneForm}
					layout="vertical"
					onFinish={updateSecurityContact}
					preserve={false}
				>
					<Form.Item
						label={t(
							"adminShell.account.settings.security.securityPhoneAreaCode",
						)}
						name="securityPhoneAreaCode"
						rules={[
							{
								required: true,
								message: t(
									"adminShell.account.settings.security.securityPhoneRequired",
								),
							},
						]}
					>
						<Input autoComplete="tel-country-code" />
					</Form.Item>
					<Form.Item
						label={t(
							"adminShell.account.settings.security.securityPhoneNumber",
						)}
						name="securityPhoneNumber"
						rules={[
							{
								required: true,
								message: t(
									"adminShell.account.settings.security.securityPhoneRequired",
								),
							},
						]}
					>
						<Input autoComplete="tel" />
					</Form.Item>
				</Form>
			</Modal>
			<Modal
				cancelText={t("adminShell.account.settings.security.cancel")}
				confirmLoading={updateSecurityMutation.isPending}
				destroyOnHidden
				okText={t("adminShell.account.settings.security.modify")}
				onCancel={closeModal}
				onOk={() => emailForm.submit()}
				open={activeModal === "email"}
				title={t("adminShell.account.settings.security.modifyBackupEmail")}
			>
				{updateSecurityMutation.isError ? (
					<Alert
						description={
							getProblemDetail(updateSecurityMutation.error) ??
							t("adminShell.account.requestErrorFallback")
						}
						showIcon
						title={t(
							"adminShell.account.settings.security.securityContactsUpdateError",
						)}
						type="error"
					/>
				) : null}
				<Form<BackupEmailFormValues>
					form={emailForm}
					layout="vertical"
					onFinish={updateSecurityContact}
					preserve={false}
				>
					<Form.Item
						label={t("adminShell.account.settings.security.backupEmail")}
						name="backupEmail"
						rules={[
							{
								required: true,
								message: t(
									"adminShell.account.settings.security.backupEmailRequired",
								),
							},
							{
								type: "email",
								message: t(
									"adminShell.account.settings.security.backupEmailInvalid",
								),
							},
						]}
					>
						<Input autoComplete="email" />
					</Form.Item>
				</Form>
			</Modal>
		</>
	);
}
