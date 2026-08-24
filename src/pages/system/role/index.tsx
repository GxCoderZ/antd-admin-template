import type { RoleItemType } from "#src/api/system/role";
import type { ActionType, ProColumns, ProCoreActionType } from "@ant-design/pro-components";

import { fetchDeleteRoleItem, fetchMenuByRoleId, fetchRoleList, fetchRoleMenu } from "#src/api/system/role";
import { BasicButton } from "#src/components/basic-button";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";
import { usePermission } from "#src/hooks/use-permission";

import { PlusCircleOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Popconfirm } from "antd";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Detail } from "./components/detail";
import { getConstantColumns } from "./constants";

/** 模块 key → 中文名称映射 */
const moduleNameMap: Record<string, string> = {
	"dashboard": "工作台",
	"audit": "审计日志",
	"system:user": "用户管理",
	"system:role": "角色管理",
	"system:permission": "权限管理",
};

export default function Role() {
	const { t } = useTranslation();
	const canAdd = usePermission("system:role:add");
	const canEdit = usePermission("system:role:edit");
	const canDelete = usePermission("system:role:delete");

	const { data: menuItems } = useQuery({
		queryKey: ["role-menu"],
		queryFn: async () => {
			const responseData = await fetchRoleMenu();
			if (responseData.code !== 0) {
				window.$message?.error(responseData.msg || t("common.fail"));
				return [];
			}
			// Backend may return array directly or { tree: [...] }
			const tree = Array.isArray(responseData.data) ? responseData.data : (responseData?.data?.tree || []);
			return tree.map((moduleNode: { module: string, permissions?: { id: number, name: string }[] }) => ({
				id: `module-${moduleNode.module}`,
				title: moduleNameMap[moduleNode.module] || moduleNode.module,
				children: (moduleNode.permissions || []).map(perm => ({
					id: String(perm.id),
					title: perm.name,
					children: [],
				})),
			}));
		},
		initialData: [],
	});
	const deleteRoleItemMutation = useMutation({
		mutationFn: fetchDeleteRoleItem,
	});
	/* Detail Data */
	const [isOpen, setIsOpen] = useState(false);
	const [title, setTitle] = useState("");
	const [detailData, setDetailData] = useState<Partial<RoleItemType> & { menus?: number[] }>({});

	const actionRef = useRef<ActionType>(null);

	const handleDeleteRow = async (id: number, action?: ProCoreActionType<object>) => {
		const responseData = await deleteRoleItemMutation.mutateAsync(id);
		if (responseData.code !== 0) {
			window.$message?.error(responseData.msg || t("common.fail"));
			return;
		}
		await action?.reload?.();
		window.$message?.success(t("common.deleteSuccess"));
	};

	const columns: ProColumns<RoleItemType>[] = [
		...getConstantColumns(t),
		{
			title: t("common.action"),
			valueType: "option",
			key: "option",
			width: 120,
			fixed: "right",
			render: (text, record, _, action) => {
				return [
					!record.is_system && (
						<BasicButton
							key="editable"
							type="link"
							size="small"
							disabled={!canEdit}
							onClick={async () => {
							/* 请求角色菜单权限 */
								const responseData = await fetchMenuByRoleId({ role_id: record.id });
								if (responseData.code !== 0) {
									window.$message?.error(responseData.msg || t("common.fail"));
									return;
								}
								setIsOpen(true);
								setTitle(t("system.role.editRole"));
								setDetailData({ ...record, menus: responseData.data?.permission_ids || [] });
							}}
						>
							{t("common.edit")}
						</BasicButton>
					),
					!record.is_system && (
						<Popconfirm
							key="delete"
							title={t("common.confirmDelete")}
							onConfirm={() => handleDeleteRow(record.id, action)}
							okText={t("common.confirm")}
							cancelText={t("common.cancel")}
						>
							<BasicButton type="link" size="small" disabled={!canDelete}>{t("common.delete")}</BasicButton>
						</Popconfirm>
					),
				];
			},
		},
	];

	const onCloseChange = () => {
		setIsOpen(false);
		setDetailData({});
	};

	const refreshTable = () => {
		actionRef.current?.reload();
	};
	return (
		<BasicContent className="h-full">
			<BasicTable<RoleItemType>
				adaptive
				columns={columns}
				actionRef={actionRef}
				request={async (params) => {
					const responseData = await fetchRoleList({ page: params.current!, page_size: params.pageSize! });
					if (responseData.code !== 0) {
						window.$message?.error(responseData.msg || t("common.fail"));
						return {
							data: [],
							total: 0,
							success: false,
						};
					}
					// Backend may return array directly or { items, total }
					const data = Array.isArray(responseData.data) ? responseData.data : responseData.data?.items || [];
					return {
						data,
						total: Array.isArray(responseData.data) ? data.length : responseData.data?.total ?? data.length,
						success: true,
					};
				}}
				headerTitle={t("common.menu.role")}
				toolBarRender={() => [
					<BasicButton
						key="add-role"
						icon={<PlusCircleOutlined />}
						type="primary"
						disabled={!canAdd}
						onClick={() => {
							setIsOpen(true);
							setTitle(t("system.role.addRole"));
						}}
					>
						{t("common.add")}
					</BasicButton>,
				]}
			/>
			<Detail
				title={title}
				open={isOpen}
				onCloseChange={onCloseChange}
				detailData={detailData}
				refreshTable={refreshTable}
				treeData={menuItems || []}
			/>
		</BasicContent>
	);
};
