import { Descriptions, Flex, Typography } from "antd";
import type { DescriptionsProps } from "antd";
import { useTranslation } from "react-i18next";

import type { PlatformAuditLog, PlatformLoginLog } from "#src/api/operations";
import {
	formatDeviceInfo,
	getDeviceDetails,
	getPrimaryLanguage,
} from "../../app/deviceInfo";
import { formatDateTime } from "../../app/formatting";
import { useLocalePreferences } from "../../app/localePreferences";

function LogDetailSection({
	items,
	title,
}: {
	items: NonNullable<DescriptionsProps["items"]>;
	title: string;
}) {
	return (
		<Descriptions
			bordered
			column={1}
			items={items}
			size="small"
			styles={{ content: { overflowWrap: "anywhere" } }}
			title={title}
		/>
	);
}

function formatTarget(log: PlatformAuditLog) {
	return log.targetId ? `${log.targetType}:${log.targetId}` : log.targetType;
}

function AuditChangeValue({
	emptyText,
	value,
}: {
	emptyText: string;
	value: Record<string, unknown> | undefined;
}) {
	return value && Object.keys(value).length > 0 ? (
		<Typography.Text
			code
			style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
		>
			{JSON.stringify(value, null, 2)}
		</Typography.Text>
	) : (
		<Typography.Text type="secondary">{emptyText}</Typography.Text>
	);
}

export function AuditLogDetails({ log }: { log: PlatformAuditLog }) {
	const { t } = useTranslation();
	const formatPreferences = useLocalePreferences();
	const notRecorded = t("adminShell.deviceInfo.notRecorded");
	const unknownDevice = t("adminShell.deviceInfo.unknownDevice");
	const deviceDetails = getDeviceDetails(log.userAgent);

	return (
		<Flex gap="large" vertical>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.basic")}
				items={[
					{
						key: "action",
						label: t("adminShell.logs.audit.columns.action"),
						children: log.action,
					},
					{
						key: "module",
						label: t("adminShell.logs.audit.columns.module"),
						children: log.module,
					},
					{
						key: "result",
						label: t("adminShell.logs.audit.columns.result"),
						children: t(`adminShell.logs.common.results.${log.result}`),
					},
					{
						key: "occurredAt",
						label: t("adminShell.logs.audit.columns.occurredAt"),
						children: formatDateTime(log.createdAt, formatPreferences),
					},
				]}
			/>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.organization")}
				items={[
					{
						key: "actor",
						label: t("adminShell.logs.audit.columns.actor"),
						children: log.actorUsername,
					},
					{
						key: "actorId",
						label: t("adminShell.logs.audit.columns.actorId"),
						children: log.actorId || notRecorded,
					},
					{
						key: "target",
						label: t("adminShell.logs.audit.columns.target"),
						children: formatTarget(log),
					},
					{
						key: "targetType",
						label: t("adminShell.logs.audit.columns.targetType"),
						children: log.targetType,
					},
					{
						key: "targetId",
						label: t("adminShell.logs.audit.columns.targetId"),
						children: log.targetId || notRecorded,
					},
				]}
			/>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.activity")}
				items={[
					{
						key: "durationMs",
						label: t("adminShell.logs.common.duration"),
						children: `${log.durationMs} ms`,
					},
					{
						key: "failureReason",
						label: t("adminShell.logs.common.failureReason"),
						children: log.failureReason ?? notRecorded,
					},
				]}
			/>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.request")}
				items={[
					{
						key: "requestId",
						label: t("adminShell.logs.common.requestId"),
						children: log.requestId,
					},
					{
						key: "ipAddress",
						label: t("adminShell.logs.audit.columns.ipAddress"),
						children: log.requestIp,
					},
					{
						key: "requestMethod",
						label: t("adminShell.logs.audit.columns.requestMethod"),
						children: log.requestMethod,
					},
					{
						key: "requestPath",
						label: t("adminShell.logs.audit.columns.requestPath"),
						children: log.requestPath,
					},
				]}
			/>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.device")}
				items={[
					{
						key: "device",
						label: t("adminShell.deviceInfo.device"),
						children: formatDeviceInfo(log.userAgent, unknownDevice),
					},
					{
						key: "browser",
						label: t("adminShell.logs.common.browser"),
						children: deviceDetails.browser ?? notRecorded,
					},
					{
						key: "operatingSystem",
						label: t("adminShell.logs.common.operatingSystem"),
						children: deviceDetails.operatingSystem ?? notRecorded,
					},
				]}
			/>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.changes")}
				items={[
					{
						key: "before",
						label: t("adminShell.logs.audit.columns.before"),
						children: (
							<AuditChangeValue emptyText={notRecorded} value={log.before} />
						),
					},
					{
						key: "after",
						label: t("adminShell.logs.audit.columns.after"),
						children: (
							<AuditChangeValue emptyText={notRecorded} value={log.after} />
						),
					},
				]}
			/>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.technical")}
				items={[
					{
						key: "id",
						label: t("adminShell.logs.common.recordId"),
						children: log.id,
					},
					{
						key: "userAgent",
						label: t("adminShell.logs.common.userAgent"),
						children: log.userAgent ?? notRecorded,
					},
				]}
			/>
		</Flex>
	);
}

export function LoginLogDetails({ log }: { log: PlatformLoginLog }) {
	const { t } = useTranslation();
	const formatPreferences = useLocalePreferences();
	const notRecorded = t("adminShell.deviceInfo.notRecorded");
	const unknownDevice = t("adminShell.deviceInfo.unknownDevice");
	const deviceDetails = getDeviceDetails(log.userAgent);

	return (
		<Flex gap="large" vertical>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.basic")}
				items={[
					{
						key: "identifier",
						label: t("adminShell.logs.login.columns.identifier"),
						children: log.identifier,
					},
					{
						key: "result",
						label: t("adminShell.logs.login.columns.result"),
						children: t(`adminShell.logs.common.results.${log.result}`),
					},
					{
						key: "occurredAt",
						label: t("adminShell.logs.login.columns.occurredAt"),
						children: formatDateTime(log.createdAt, formatPreferences),
					},
				]}
			/>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.access")}
				items={[
					{
						key: "authMethod",
						label: t("adminShell.logs.login.columns.authMethod"),
						children: t(`adminShell.logs.login.authMethods.${log.authMethod}`),
					},
					{
						key: "mfaUsed",
						label: t("adminShell.logs.login.columns.mfaUsed"),
						children: t(`adminShell.logs.common.${log.mfaUsed ? "yes" : "no"}`),
					},
				]}
			/>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.activity")}
				items={[
					{
						key: "durationMs",
						label: t("adminShell.logs.common.duration"),
						children: `${log.durationMs} ms`,
					},
					{
						key: "failureReason",
						label: t("adminShell.logs.common.failureReason"),
						children: log.failureReason ?? notRecorded,
					},
				]}
			/>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.request")}
				items={[
					{
						key: "id",
						label: t("adminShell.logs.common.recordId"),
						children: log.id,
					},
					{
						key: "userId",
						label: t("adminShell.logs.login.columns.userId"),
						children: log.userId ?? notRecorded,
					},
					{
						key: "requestId",
						label: t("adminShell.logs.common.requestId"),
						children: log.requestId,
					},
					{
						key: "ipAddress",
						label: t("adminShell.logs.login.columns.ipAddress"),
						children: log.requestIp,
					},
					{
						key: "location",
						label: t("adminShell.logs.login.columns.location"),
						children: log.location ?? notRecorded,
					},
				]}
			/>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.device")}
				items={[
					{
						key: "device",
						label: t("adminShell.deviceInfo.device"),
						children: formatDeviceInfo(log.userAgent, unknownDevice),
					},
					{
						key: "browser",
						label: t("adminShell.logs.common.browser"),
						children: deviceDetails.browser ?? notRecorded,
					},
					{
						key: "operatingSystem",
						label: t("adminShell.logs.common.operatingSystem"),
						children: deviceDetails.operatingSystem ?? notRecorded,
					},
					{
						key: "language",
						label: t("adminShell.deviceInfo.language"),
						children: getPrimaryLanguage(log.acceptLanguage) ?? notRecorded,
					},
					{
						key: "acceptLanguage",
						label: t("adminShell.logs.common.acceptLanguage"),
						children: log.acceptLanguage ?? notRecorded,
					},
					{
						key: "timeZone",
						label: t("adminShell.deviceInfo.timeZone"),
						children:
							log.timeZone?.trim() || t("adminShell.deviceInfo.notRecorded"),
					},
				]}
			/>
			<LogDetailSection
				title={t("adminShell.recordDetails.sections.technical")}
				items={[
					{
						key: "sessionId",
						label: t("adminShell.logs.login.columns.sessionId"),
						children: log.sessionId ?? notRecorded,
					},
					{
						key: "userAgent",
						label: t("adminShell.logs.common.userAgent"),
						children: log.userAgent ?? notRecorded,
					},
				]}
			/>
		</Flex>
	);
}
