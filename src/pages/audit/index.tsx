import type { AuditItemType, AuditListReq } from "#src/api/audit";
import type { LogTableQuery } from "#src/components/log-table-panel";

import { fetchAuditList } from "#src/api/audit";
import { LogTablePanel } from "#src/components/log-table-panel";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { AuditDetailDrawer } from "./components/audit-detail-drawer";
import { createAuditColumns, createAuditSearchFields } from "./constants";

type AuditLogQuery = AuditListReq & LogTableQuery;

const initialQuery: AuditLogQuery = { page: 1, page_size: 10, sort: "created_at", order: "descend" };

export default function Audit() {
	const { t } = useTranslation();
	const [detailRecord, setDetailRecord] = useState<AuditItemType>();
	const columns = useMemo(() => createAuditColumns(t), [t]);
	const searchFields = useMemo(() => createAuditSearchFields(t), [t]);

	return (
		<>
			<LogTablePanel<AuditItemType, AuditLogQuery>
				columns={columns}
				initialQuery={initialQuery}
				minimumWidth={1160}
				onOpenDetail={setDetailRecord}
				persistenceKey={`${import.meta.env.VITE_GLOB_APP_TITLE}:audit-log:columns`}
				queryKey="audit-logs"
				request={async (query) => {
					const response = await fetchAuditList(query);
					if (response.code !== 0)
						throw new Error(response.msg);
					return response.data;
				}}
				searchFields={searchFields}
				sortFields={["action", "result", "created_at"]}
				title={t("audit.title")}
			/>
			<AuditDetailDrawer onClose={() => setDetailRecord(undefined)} open={Boolean(detailRecord)} record={detailRecord} />
		</>
	);
}
