import type { UserCreateReq, UserUpdateReq } from "#src/api/system/user";

import { fetchCreateUser, fetchUpdateUser, fetchUserDetail } from "#src/api/system/user";

import { DrawerForm, ProFormRadio, ProFormText } from "@ant-design/pro-components";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Form } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface DetailProps {
	title: string
	open: boolean
	userId?: number
	onClose: () => void
	onSuccess?: () => void
}

export function Detail(props: DetailProps) {
	const { title, open, userId, onClose, onSuccess } = props;
	const { t } = useTranslation();
	const [form] = Form.useForm<UserCreateReq & UserUpdateReq>();

	const createMutation = useMutation({
		mutationFn: fetchCreateUser,
	});

	const updateMutation = useMutation({
		mutationFn: fetchUpdateUser,
	});

	const { data: detailResp } = useQuery({
		queryKey: ["system-user-detail", userId],
		enabled: open && !!userId,
		queryFn: () => fetchUserDetail({ id: userId! }),
	});

	useEffect(() => {
		if (!open) {
			form.resetFields();
			return;
		}
		if (!userId) {
			form.setFieldsValue({ status: 1 } as any);
			return;
		}
		if (detailResp?.code === 0 && detailResp.data) {
			form.setFieldsValue({
				username: detailResp.data.username,
				status: detailResp.data.status,
			} as any);
		}
	}, [detailResp, form, open, userId]);

	const onFinish = async (values: any) => {
		try {
			const res = userId
				? await updateMutation.mutateAsync({
					id: userId,
					username: values.username,
					status: values.status,
				})
				: await createMutation.mutateAsync({
					username: values.username,
					password: values.password,
				});
			if (res.code !== 0) {
				window.$message?.error(res.msg || t("common.fail"));
				return false;
			}

			window.$message?.success(t("common.success"));
			onSuccess?.();
			onClose();
			return true;
		}
		catch {
			return false;
		}
	};

	return (
		<DrawerForm
			title={title}
			open={open}
			form={form}
			onOpenChange={(visible) => {
				if (visible === false) {
					onClose();
				}
			}}
			drawerProps={{
				destroyOnHidden: true,
			}}
			onFinish={onFinish}
			width={500}
		>
			<ProFormText
				name="username"
				label={t("system.user.username")}
				placeholder={t("system.user.pleaseInputUsername")}
				rules={[
					{ required: true, message: t("system.user.pleaseInputUsername") },
					{ min: 3, message: t("system.user.usernameMinLength") },
				]}
			/>
			{!userId && (
				<ProFormText.Password
					name="password"
					label={t("system.user.password")}
					placeholder={t("system.user.pleaseInputPassword")}
					rules={[
						{ required: true, message: t("system.user.pleaseInputPassword") },
						{ min: 6, message: t("system.user.passwordMinLength") },
					]}
				/>
			)}
			<ProFormRadio.Group
				name="status"
				label={t("common.status")}
				radioType="button"
				options={[
					{ label: t("common.enable"), value: 1 },
					{ label: t("common.disable"), value: 2 },
				]}
			/>
		</DrawerForm>
	);
}
