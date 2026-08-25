import type { MenuListReq } from "#src/api/system/menu";

import { fetchMenuList, fetchMenuTree } from "#src/api/system/menu";
import { BasicButton } from "#src/components/basic-button";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";

import { ReloadOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Col, Result, Row, theme } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { createPermissionColumns } from "./constants";
import TreeMenu from "./tree-menu";

export default function Menu() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const [selectedModule, setSelectedModule] = useState<string>();
	const [filters, setFilters] = useState<MenuListReq>({});
	const treeQuery = useQuery({
		queryKey: ["system-permission-tree-view"],
		queryFn: async () => {
			const response = await fetchMenuTree();
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data.tree;
		},
	});
	const permissionQuery = useQuery({
		queryKey: ["system-permissions", selectedModule, filters],
		queryFn: async () => {
			const response = await fetchMenuList({ ...filters, module: selectedModule });
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data.items;
		},
	});
	const columns = useMemo(() => createPermissionColumns(t), [t]);

	return (
		<BasicContent className="h-full">
			<Row className="h-full" gutter={[token.margin, token.margin]}>
				<Col xs={24} lg={7} xl={6}>
					<TreeMenu error={treeQuery.error} groups={treeQuery.data ?? []} loading={treeQuery.isLoading} onRetry={() => treeQuery.refetch()} onSelect={setSelectedModule} selectedModule={selectedModule} />
				</Col>
				<Col xs={24} lg={17} xl={18}>
					<BasicTable
						adaptive
						columns={columns}
						dataSource={permissionQuery.data ?? []}
						headerTitle={selectedModule ? t("system.menu.modulePermissions", { module: selectedModule }) : t("common.menu.permission")}
						loading={permissionQuery.isFetching}
						locale={permissionQuery.isError ? { emptyText: <Result extra={<BasicButton icon={<ReloadOutlined />} onClick={() => permissionQuery.refetch()}>{t("common.retry")}</BasicButton>} status="error" subTitle={permissionQuery.error.message} title={t("system.menu.loadFailed")} /> } : undefined}
						onReset={() => setFilters({})}
						onSubmit={values => setFilters({ status: values.status || undefined })}
						options={{ reload: () => Promise.all([treeQuery.refetch(), permissionQuery.refetch()]) }}
						pagination={false}
						search={{ defaultCollapsed: false, labelWidth: "auto" }}
					/>
				</Col>
			</Row>
		</BasicContent>
	);
}
