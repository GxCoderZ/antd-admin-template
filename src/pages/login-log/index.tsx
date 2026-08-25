import type { LoginLogItemType, LoginLogListReq } from "#src/api/login-log";
import type { LogTableQuery } from "#src/components/log-table-panel";

import { fetchLoginLogList } from "#src/api/login-log";
import { LogTablePanel } from "#src/components/log-table-panel";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { LoginLogDetailDrawer } from "./components/login-log-detail-drawer";
import { createLoginLogColumns, createLoginLogSearchFields } from "./constants";

type LoginLogQuery = LoginLogListReq & LogTableQuery;

const initialQuery: LoginLogQuery = { page: 1, page_size: 10, sort: "created_at", order: "descend" };

export default function LoginLog() {
	const { t } = useTranslation();
	const [detailRecord, setDetailRecord] = useState<LoginLogItemType>();
	const columns = useMemo(() => createLoginLogColumns(t), [t]);
	const searchFields = useMemo(() => createLoginLogSearchFields(t), [t]);

	return (
		<>
			<LogTablePanel<LoginLogItemType, LoginLogQuery>
				columns={columns}
				initialQuery={initialQuery}
				minimumWidth={1360}
				onOpenDetail={setDetailRecord}
				persistenceKey={`${import.meta.env.VITE_GLOB_APP_TITLE}:login-log:columns`}
				queryKey="login-logs"
				request={async (query) => {
					const response = await fetchLoginLogList(query);
					if (response.code !== 0)
						throw new Error(response.msg);
					return response.data;
				}}
				searchFields={searchFields}
				sortFields={["identifier", "result", "ip", "created_at"]}
				title={t("login-log.title")}
			/>
			<LoginLogDetailDrawer onClose={() => setDetailRecord(undefined)} open={Boolean(detailRecord)} record={detailRecord} />
		</>
	);
}
