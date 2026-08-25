import { UploadOutlined } from "@ant-design/icons";
import {
	platformAccountQueryKey,
	type PlatformAccount,
	type UpdatePlatformAccountInput,
	updatePlatformAccount,
	uploadPlatformAccountAvatar,
} from "#src/api/account";
import { ApiProblemError } from "#src/api/client";
import { platformUsersQueryKey } from "#src/api/users";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ImgCrop from "antd-img-crop";
import {
	Alert,
	Button,
	Flex,
	Form,
	Grid,
	Input,
	Select,
	Space,
	theme,
	Typography,
	Upload,
} from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { PlatformUserAvatar } from "../../../app/PlatformUserAvatar";

const { Text } = Typography;
const avatarUploadLimitBytes = 2 * 1024 * 1024;
const supportedAvatarContentTypes = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
]);

interface BasicSettingsProps {
	account: PlatformAccount;
}

function getProblemDetail(error: unknown) {
	return error instanceof ApiProblemError ? error.problem?.detail : undefined;
}

export function BasicSettings({ account }: BasicSettingsProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const [form] = Form.useForm<UpdatePlatformAccountInput>();
	const [avatarError, setAvatarError] = useState<string>();
	const [avatarRevision, setAvatarRevision] = useState(account.version ?? 0);
	const [saved, setSaved] = useState(false);
	const queryClient = useQueryClient();
	const province = Form.useWatch("province", form);
	const updateMutation = useMutation({
		mutationFn: updatePlatformAccount,
		onSuccess: (updatedAccount) => {
			queryClient.setQueryData(platformAccountQueryKey, updatedAccount);
			form.setFieldsValue(updatedAccount);
			setSaved(true);
			void queryClient.invalidateQueries({ queryKey: platformUsersQueryKey });
		},
	});
	const uploadAvatarMutation = useMutation({
		mutationFn: uploadPlatformAccountAvatar,
		onSuccess: async () => {
			setAvatarRevision((value) => value + 1);
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: platformAccountQueryKey }),
				queryClient.invalidateQueries({ queryKey: platformUsersQueryKey }),
			]);
		},
	});

	useEffect(() => {
		form.setFieldsValue(account);
	}, [account, form]);

	const cityOptions =
		province === "jiangsu"
			? [
					{
						label: t("adminShell.account.settings.basic.cityNanjing"),
						value: "nanjing",
					},
					{
						label: t("adminShell.account.settings.basic.citySuzhou"),
						value: "suzhou",
					},
				]
			: province === "shanghai"
				? [
						{
							label: t("adminShell.account.settings.basic.cityShanghai"),
							value: "shanghai",
						},
					]
				: [
						{
							label: t("adminShell.account.settings.basic.cityHangzhou"),
							value: "hangzhou",
						},
						{
							label: t("adminShell.account.settings.basic.cityNingbo"),
							value: "ningbo",
						},
					];
	const isWide = screens.xl === true;
	const validateAvatarFile = (file: File) => {
		setAvatarError(undefined);
		if (!supportedAvatarContentTypes.has(file.type)) {
			setAvatarError(t("adminShell.account.settings.basic.avatarTypeError"));
			return false;
		}
		if (file.size > avatarUploadLimitBytes) {
			setAvatarError(t("adminShell.account.settings.basic.avatarSizeError"));
			return false;
		}
		return true;
	};

	return (
		<Flex
			gap={token.marginLG}
			style={{
				flexDirection: isWide ? "row" : "column-reverse",
				paddingTop: 12,
			}}
		>
			<Flex style={{ maxWidth: 448, minWidth: 0, width: "100%" }} vertical>
				{saved ? (
					<Alert
						closable
						onClose={() => setSaved(false)}
						showIcon
						style={{ marginBottom: token.margin }}
						title={t("adminShell.account.settings.basic.savedTitle")}
						type="success"
					/>
				) : null}
				{updateMutation.isError ? (
					<Alert
						closable
						description={
							getProblemDetail(updateMutation.error) ??
							t("adminShell.account.requestErrorFallback")
						}
						onClose={() => updateMutation.reset()}
						showIcon
						style={{ marginBottom: token.margin }}
						title={t("adminShell.account.settings.basic.updateError")}
						type="error"
					/>
				) : null}
				<Form<UpdatePlatformAccountInput>
					form={form}
					layout="vertical"
					onFinish={(values) => {
						setSaved(false);
						updateMutation.mutate({
							...values,
							...(account.version === undefined
								? {}
								: { expectedVersion: account.version }),
						});
					}}
					requiredMark={false}
				>
					<Form.Item
						label={t("adminShell.account.settings.basic.email")}
						name="email"
						rules={[
							{
								required: true,
								message: t("adminShell.account.settings.basic.emailRequired"),
							},
							{
								type: "email",
								message: t("adminShell.account.settings.basic.emailInvalid"),
							},
						]}
					>
						<Input autoComplete="email" />
					</Form.Item>
					<Form.Item
						label={t("adminShell.account.settings.basic.displayName")}
						name="displayName"
						rules={[
							{
								max: 64,
								message: t(
									"adminShell.account.settings.basic.displayNameLength",
								),
								required: true,
								whitespace: true,
							},
						]}
					>
						<Input maxLength={64} />
					</Form.Item>
					<Form.Item
						label={t("adminShell.account.settings.basic.bio")}
						name="bio"
						rules={[
							{
								required: true,
								message: t("adminShell.account.settings.basic.bioRequired"),
							},
						]}
					>
						<Input.TextArea
							autoSize={{ minRows: 3, maxRows: 6 }}
							maxLength={200}
						/>
					</Form.Item>
					<Form.Item
						label={t("adminShell.account.settings.basic.country")}
						name="country"
						rules={[{ required: true }]}
					>
						<Select
							options={[
								{
									label: t("adminShell.account.settings.basic.countryChina"),
									value: "china",
								},
							]}
						/>
					</Form.Item>
					<Flex gap={token.marginSM}>
						<Form.Item
							label={t("adminShell.account.settings.basic.region")}
							name="province"
							rules={[{ required: true }]}
							style={{ flex: 1 }}
						>
							<Select
								onChange={() => form.setFieldValue("city", undefined)}
								options={[
									{
										label: t(
											"adminShell.account.settings.basic.provinceZhejiang",
										),
										value: "zhejiang",
									},
									{
										label: t(
											"adminShell.account.settings.basic.provinceJiangsu",
										),
										value: "jiangsu",
									},
									{
										label: t(
											"adminShell.account.settings.basic.provinceShanghai",
										),
										value: "shanghai",
									},
								]}
							/>
						</Form.Item>
						<Form.Item
							label=" "
							name="city"
							rules={[{ required: true }]}
							style={{ flex: 1 }}
						>
							<Select disabled={!province} options={cityOptions} />
						</Form.Item>
					</Flex>
					<Form.Item
						label={t("adminShell.account.settings.basic.address")}
						name="address"
						rules={[
							{
								required: true,
								message: t("adminShell.account.settings.basic.addressRequired"),
							},
						]}
					>
						<Input />
					</Form.Item>
					<Form.Item
						label={t("adminShell.account.settings.basic.phone")}
						required
					>
						<Space.Compact block>
							<Form.Item
								name="phoneAreaCode"
								noStyle
								rules={[{ required: true }]}
							>
								<Input
									aria-label={t(
										"adminShell.account.settings.basic.phoneAreaCode",
									)}
									style={{ width: 88 }}
								/>
							</Form.Item>
							<Form.Item
								name="phoneNumber"
								noStyle
								rules={[{ required: true }]}
							>
								<Input
									aria-label={t(
										"adminShell.account.settings.basic.phoneNumber",
									)}
									autoComplete="tel"
								/>
							</Form.Item>
						</Space.Compact>
					</Form.Item>
					<Button
						htmlType="submit"
						loading={updateMutation.isPending}
						type="primary"
					>
						{t("adminShell.account.settings.basic.save")}
					</Button>
				</Form>
			</Flex>
			<Flex
				align={isWide ? "flex-start" : "center"}
				style={{ flex: 1, padding: isWide ? "0 0 0 104px" : 20 }}
				vertical
			>
				{isWide ? (
					<Text style={{ marginBottom: 8 }}>
						{t("adminShell.account.settings.basic.avatar")}
					</Text>
				) : null}
				<PlatformUserAvatar
					displayName={account.displayName || account.username}
					fallback="icon"
					revision={avatarRevision}
					size={144}
					userId={account.id}
				/>
				<ImgCrop
					aspect={1}
					beforeCrop={validateAvatarFile}
					cropShape="round"
					modalCancel={t("adminShell.account.settings.basic.avatarCropCancel")}
					modalOk={t("adminShell.account.settings.basic.avatarCropConfirm")}
					modalTitle={t("adminShell.account.settings.basic.avatarCropTitle")}
					quality={0.9}
					resetText={t("adminShell.account.settings.basic.avatarCropReset")}
					rotationSlider
					showGrid
					showReset
				>
					<Upload
						accept="image/png,image/jpeg,image/webp"
						beforeUpload={(file) =>
							validateAvatarFile(file) ? true : Upload.LIST_IGNORE
						}
						customRequest={({ file }) => {
							if (file instanceof File) uploadAvatarMutation.mutate(file);
						}}
						showUploadList={false}
					>
						<Button
							icon={<UploadOutlined aria-hidden />}
							loading={uploadAvatarMutation.isPending}
							style={{ marginTop: 12, width: 144 }}
						>
							{t("adminShell.account.settings.basic.uploadAvatar")}
						</Button>
					</Upload>
				</ImgCrop>
				{avatarError || uploadAvatarMutation.isError ? (
					<Text
						style={{
							marginTop: token.marginXS,
							maxWidth: 224,
							textAlign: "center",
						}}
						type="danger"
					>
						{avatarError ??
							t("adminShell.account.settings.basic.avatarUpdateError")}
					</Text>
				) : null}
			</Flex>
		</Flex>
	);
}
