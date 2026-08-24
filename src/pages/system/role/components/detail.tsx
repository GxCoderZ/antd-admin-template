import type { RoleItemType } from "#src/api/system/role";
import type { TreeDataNodeWithId } from "#src/components/basic-form";
import { fetchAddRoleItem, fetchBindRoleMenus, fetchUpdateRoleItem } from "#src/api/system/role";
import { FormTreeItem } from "#src/components/basic-form";

import {
	DrawerForm,
	ProFormRadio,
	ProFormText,
	ProFormTextArea,
} from "@ant-design/pro-components";
import { useMutation } from "@tanstack/react-query";
import { Form } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

interface DetailProps {
	treeData: TreeDataNodeWithId[]
	title: React.ReactNode
	open: boolean
	detailData: Partial<RoleItemType> & { menus?: number[] }
	onCloseChange: () => void
	refreshTable?: () => void
}

export function Detail({ title, open, onCloseChange, detailData, treeData, refreshTable }: DetailProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<RoleItemType & { menus?: (string | number)[] }>();

	const addRoleItemMutation = useMutation({
		mutationFn: fetchAddRoleItem,
	});
	const updateRoleItemMutation = useMutation({
		mutationFn: fetchUpdateRoleItem,
	});
	const bindRoleMenusMutation = useMutation({
		mutationFn: fetchBindRoleMenus,
	});

	const onFinish = async (values: RoleItemType & { menus?: (string | number)[] }) => {
		// console.info(values);
		/* 有 id 则为修改，否则为新增 */
		if (detailData.id) {
			// 更新角色信息
			const updateRes = await updateRoleItemMutation.mutateAsync({
				id: detailData.id,
				name: values.name,
				status: values.status,
				remark: values.remark,
			});
			if (updateRes.code !== 0) {
				window.$message?.error(updateRes.msg || t("common.fail"));
				return false;
			}

			// 绑定权限
			const bindRes = await bindRoleMenusMutation.mutateAsync({
				role_id: detailData.id,
				permission_ids: (values.menus || []).map(id => Number(id)).filter(id => !Number.isNaN(id) && id > 0),
			});
			if (bindRes.code !== 0) {
				window.$message?.error(bindRes.msg || t("common.fail"));
				return false;
			}

			window.$message?.success(t("common.updateSuccess"));
		}
		else {
			const res = await addRoleItemMutation.mutateAsync({
				name: values.name,
				remark: values.remark,
			});
			if (res.code !== 0) {
				window.$message?.error(res.msg || t("common.fail"));
				return false;
			}
			// 创建后绑定权限
			const selectedMenus = (values.menus || []).map(id => Number(id)).filter(id => !Number.isNaN(id) && id > 0);
			if (selectedMenus.length > 0) {
				const bindRes = await bindRoleMenusMutation.mutateAsync({
					role_id: res.data!.id,
					permission_ids: selectedMenus,
				});
				if (bindRes.code !== 0) {
					window.$message?.error(bindRes.msg || t("common.fail"));
					return false;
				}
			}
			window.$message?.success(t("common.addSuccess"));
		}
		/* 刷新表格 */
		refreshTable?.();
		// 不返回不会关闭弹框
		return true;
	};

	useEffect(() => {
		if (open) {
			form.setFieldsValue({
				...detailData,
				menus: (detailData.menus || []).map(id => String(id)),
			});
		}
	}, [open]);

	return (
		<DrawerForm<RoleItemType>
			title={title}
			open={open}
			onOpenChange={(visible) => {
				if (visible === false) {
					onCloseChange();
				}
			}}
			resize={{
				onResize() {
					// console.log('resize!');
				},
				maxWidth: window.innerWidth * 0.8,
				minWidth: 500,
			}}
			labelCol={{ span: 6 }}
			wrapperCol={{ span: 24 }}
			layout="horizontal"
			form={form}
			autoFocusFirstInput
			drawerProps={{
				destroyOnHidden: true,
			}}
			onFinish={onFinish}
			initialValues={{
				status: 1,
				menus: [],
			}}
		>

			<ProFormText
				allowClear
				rules={[
					{
						required: true,
					},
				]}
				width="md"
				name="name"
				label={t("system.role.name")}
				tooltip={t("form.length", { length: 24 })}
			/>

			<ProFormRadio.Group
				name="status"
				label={t("common.status")}
				radioType="button"
				options={[
					{
						label: t("common.enabled"),
						value: 1,
					},
					{
						label: t("common.deactivated"),
						value: 2,
					},
				]}
			/>

			<ProFormTextArea
				allowClear
				width="md"
				name="remark"
				label={t("common.remark")}
			/>

			<Form.Item name="menus" label={t("system.role.assignMenu")}>
				<FormTreeItem treeData={treeData} translateTitle={false} />
			</Form.Item>
		</DrawerForm>
	);
};
