import type { UserItemType } from "#src/api/system/user";
import type { ActionType, ProColumns, ProCoreActionType } from "@ant-design/pro-components";

import { fetchDeleteUser, fetchResetUserPassword, fetchUserList } from "#src/api/system/user";
import { BasicButton } from "#src/components/basic-button";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { usePermission } from "#src/hooks/use-permission";

import { PlusCircleOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { Form, Input, Modal, Popconfirm } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Detail } from "./components/detail";
import { RoleAssign } from "./components/role-assign";
import { getConstantColumns } from "./constants";

export default function User() {
	const { t } = useTranslation();
	const [form] = Form.useForm();
	const canAdd = usePermission("system:user:add");
	const canEdit = usePermission("system:user:edit");
	const canDelete = usePermission("system:user:delete");
	const canAssignRole = usePermission("system:user:assign-role");
	const canResetPassword = usePermission("system:user:reset-password");

	/* Delete Mutation */
	const deleteUserMutation = useMutation({
		mutationFn: fetchDeleteUser,
	});

	/* Reset Password Mutation */
	const resetPasswordMutation = useMutation({
		mutationFn: fetchResetUserPassword,
	});

	/* Detail Drawer */
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const [detailTitle, setDetailTitle] = useState("");
	const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);

	/* Role Assign Drawer */
	const [isRoleAssignOpen, setIsRoleAssignOpen] = useState(false);
	const [roleAssignUserId, setRoleAssignUserId] = useState<number | undefined>(undefined);

	/* Reset Password Modal */
	const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
	const [resetPasswordUserId, setResetPasswordUserId] = useState<number | undefined>(undefined);

	const actionRef = useRef<ActionType>(null);

	const handleDeleteRow = async (id: number, action?: ProCoreActionType<object>) => {
		const responseData = await deleteUserMutation.mutateAsync({ id });
		if (responseData.code !== 0) {
			window.$message?.error(responseData.msg || t("common.fail"));
			return;
		}
		await action?.reload?.();
		window.$message?.success(t("common.deleteSuccess"));
	};

	const handleResetPassword = async () => {
		try {
			const values = await form.validateFields();
			if (!resetPasswordUserId) {
				return;
			}

			const responseData = await resetPasswordMutation.mutateAsync({
				id: resetPasswordUserId,
				new_password: values.new_password,
			});

			if (responseData.code !== 0) {
				window.$message?.error(responseData.msg || t("common.fail"));
				return;
			}

			window.$message?.success(t("system.user.resetPasswordSuccess"));
			setIsResetPasswordModalOpen(false);
			form.resetFields();
		}
		catch {
			// Form validation failed
		}
	};

	const columns: ProColumns<UserItemType>[] = [
		...getConstantColumns(t),
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 200,
			fixed: "right",
			render: (text, record, _, action) => {
				const actions = [];

				if (canEdit) {
					actions.push(
						<BasicButton
							key="edit"
							type="link"
							size="small"
							onClick={() => {
								setIsDetailOpen(true);
								setDetailTitle(t("system.user.editUser"));
								setCurrentUserId(record.id);
							}}
						>
							{t("common.edit")}
						</BasicButton>,
					);
				}

				if (canAssignRole) {
					actions.push(
						<BasicButton
							key="role"
							type="link"
							size="small"
							onClick={() => {
								setIsRoleAssignOpen(true);
								setRoleAssignUserId(record.id);
							}}
						>
							{t("system.user.assignRole")}
						</BasicButton>,
					);
				}

				if (canResetPassword) {
					actions.push(
						<BasicButton
							key="resetPassword"
							type="link"
							size="small"
							onClick={() => {
								setIsResetPasswordModalOpen(true);
								setResetPasswordUserId(record.id);
							}}
						>
							{t("system.user.resetPassword")}
						</BasicButton>,
					);
				}

				if (canDelete) {
					actions.push(
						<Popconfirm
							key="delete"
							title={t("common.confirmDelete")}
							onConfirm={() => handleDeleteRow(record.id, action)}
							okText={t("common.confirm")}
							cancelText={t("common.cancel")}
						>
							<BasicButton type="link" size="small" danger>{t("common.delete")}</BasicButton>
						</Popconfirm>,
					);
				}

				return actions;
			},
		},
	];

	const onDetailClose = () => {
		setIsDetailOpen(false);
		setCurrentUserId(undefined);
	};

	const onRoleAssignClose = () => {
		setIsRoleAssignOpen(false);
		setRoleAssignUserId(undefined);
	};

	const refreshTable = () => {
		actionRef.current?.reload();
	};

	return (
		<BasicContent className="h-full">
			<BasicTable<UserItemType>
				adaptive
				columns={columns}
				actionRef={actionRef}
				request={async (params) => {
					const responseData = await fetchUserList({
						page: params.current!,
						page_size: params.pageSize!,
					});

					if (responseData.code !== 0) {
						window.$message?.error(responseData.msg || t("common.fail"));
						return {
							data: [],
							total: 0,
							success: false,
						};
					}

					return {
						data: responseData.data.items,
						total: responseData.data.total,
						success: true,
					};
				}}
				headerTitle={t("common.menu.user")}
				toolBarRender={() => canAdd
					? [
						<BasicButton
							key="add-user"
							icon={<PlusCircleOutlined />}
							type="primary"
							onClick={() => {
								setIsDetailOpen(true);
								setDetailTitle(t("system.user.addUser"));
								setCurrentUserId(undefined);
							}}
						>
							{t("common.add")}
						</BasicButton>,
					]
					: []}
			/>

			{/* Create/Edit User Drawer */}
			<Detail
				title={detailTitle}
				open={isDetailOpen}
				userId={currentUserId}
				onClose={onDetailClose}
				onSuccess={refreshTable}
			/>

			{/* Role Assign Drawer */}
			<RoleAssign
				open={isRoleAssignOpen}
				userId={roleAssignUserId}
				onClose={onRoleAssignClose}
			/>

			{/* Reset Password Modal */}
			<Modal
				title={t("system.user.resetPassword")}
				open={isResetPasswordModalOpen}
				onOk={handleResetPassword}
				onCancel={() => {
					setIsResetPasswordModalOpen(false);
					form.resetFields();
				}}
				okText={t("common.confirm")}
				cancelText={t("common.cancel")}
				destroyOnClose
			>
				<Form form={form} layout="vertical">
					<Form.Item
						name="new_password"
						label={t("system.user.newPassword")}
						rules={[
							{ required: true, message: t("system.user.pleaseInputPassword") },
							{ min: 6, message: t("system.user.passwordMinLength") },
						]}
					>
						<Input.Password placeholder={t("system.user.pleaseInputPassword")} />
					</Form.Item>
				</Form>
			</Modal>
		</BasicContent>
	);
}
