import type { AuditItemType } from "#src/api/audit";

import { fetchAuditList } from "#src/api/audit";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";

import { useTranslation } from "react-i18next";

import { getAuditColumns } from "./constants";

export default function Audit() {
	const { t } = useTranslation();

	return (
		<BasicContent className="h-full">
			<BasicTable<AuditItemType>
				adaptive
				columns={getAuditColumns(t)}
				headerTitle={t("audit.title")}
				request={async (params) => {
					const response = await fetchAuditList({
						page: params.current || 1,
						page_size: params.pageSize || 10,
						keyword: params.keyword,
						module: params.module,
						result: params.result,
					});
					if (response.code !== 0) {
						window.$message?.error(response.msg || t("common.fail"));
						return { data: [], total: 0, success: false };
					}
					return { data: response.data.items, total: response.data.total, success: true };
				}}
				toolBarRender={false}
			/>
		</BasicContent>
	);
}
