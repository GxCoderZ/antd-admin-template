import type { MenuItemType } from "#src/api/system/menu";
import type { ActionType, ProColumns } from "@ant-design/pro-components";

import { fetchMenuList } from "#src/api/system/menu";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";

import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { getConstantColumns } from "./constants";

export default function Menu() {
	const { t } = useTranslation();
	const actionRef = useRef<ActionType>(null);

	const columns: ProColumns<MenuItemType>[] = [
		...getConstantColumns(t),
	];

	return (
		<BasicContent className="h-full">
			<BasicTable<MenuItemType>
				adaptive
				columns={columns}
				actionRef={actionRef}
				request={async () => {
					const responseData = await fetchMenuList({});
					if (responseData.code !== 0) {
						window.$message?.error(responseData.msg || t("common.fail"));
						return {
							data: [],
							success: false,
						};
					}
					// 后端返回树形 [{module, permissions: [{id,name,code}]}]，展平为列表
					const rawData = responseData.data as any;
					let items: MenuItemType[] = [];
					if (Array.isArray(rawData)) {
						for (const group of rawData) {
							if (group.permissions) {
								for (const p of group.permissions) {
									items.push({
										id: p.id,
										code: p.code,
										name: p.name,
										module: group.module || "",
										status: 1,
										remark: "",
										created_at: "",
									});
								}
							}
						}
					}
					else if (rawData?.items) {
						items = rawData.items;
					}
					return {
						data: items,
						success: true,
					};
				}}
				headerTitle={t("common.menu.permission")}
				toolBarRender={() => []}
			/>
		</BasicContent>
	);
};
