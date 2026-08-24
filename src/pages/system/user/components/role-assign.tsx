import type { RoleItemType } from "#src/api/system/role";

import { fetchRoleList } from "#src/api/system/role";
import { fetchBindUserRoles, fetchUserRoles } from "#src/api/system/user";

import { DrawerForm, ProFormCheckbox } from "@ant-design/pro-components";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Form } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface RoleAssignProps {
	open: boolean
	userId?: number
	onClose: () => void
}

export function RoleAssign(props: RoleAssignProps) {
	const { open, userId, onClose } = props;
	const { t } = useTranslation();
	const [form] = Form.useForm();

	/* Fetch all roles */
	const { data: roleListData } = useQuery({
		queryKey: ["role-list-all"],
		queryFn: async () => {
			const response = await fetchRoleList({ page: 1, page_size: 1000 });
			if (response.code !== 0) {
				window.$message?.error(response.msg || t("common.fail"));
				return [];
			}
			const data = Array.isArray(response.data) ? response.data : response.data?.items || [];
			return data;
		},
		enabled: open,
		initialData: [],
	});

	/* Fetch user's current roles */
	const { data: userRolesData, isLoading } = useQuery({
		queryKey: ["user-roles", userId],
		queryFn: () => fetchUserRoles({ user_id: userId! }),
		enabled: open && !!userId,
	});

	/* Handle errors */
	useEffect(() => {
		if (userRolesData && userRolesData.code !== 0) {
			window.$message?.error(userRolesData.msg || t("common.fail"));
			onClose();
		}
	}, [userRolesData, t, onClose]);

	/* Set form values */
	useEffect(() => {
		if (open && userRolesData?.data) {
			form.setFieldsValue({
				role_ids: userRolesData.data.role_ids || [],
			});
		}
		else if (open && !userId) {
			form.resetFields();
		}
	}, [open, userId, userRolesData, form]);

	/* Bind roles mutation */
	const bindRolesMutation = useMutation({
		mutationFn: fetchBindUserRoles,
	});

	const onFinish = async (values: { role_ids: number[] }) => {
		if (!userId) {
			return false;
		}

		try {
			const res = await bindRolesMutation.mutateAsync({
				user_id: userId,
				role_ids: values.role_ids || [],
			});

			if (res.code !== 0) {
				window.$message?.error(res.msg || t("common.fail"));
				return false;
			}

			window.$message?.success(t("common.success"));
			onClose();
			return true;
		}
		catch {
			return false;
		}
	};

	const roleOptions = roleListData.map((role: RoleItemType) => ({
		label: role.name,
		value: role.id,
	}));

	return (
		<DrawerForm
			title={t("system.user.assignRole")}
			open={open}
			loading={isLoading}
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
			<ProFormCheckbox.Group
				name="role_ids"
				label={t("system.user.selectRoles")}
				options={roleOptions}
			/>
		</DrawerForm>
	);
}
