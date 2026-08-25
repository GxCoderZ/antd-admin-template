import { fetchSystemInfo } from "#src/api/system/info";
import { BasicCard } from "#src/components/basic-card";
import { BasicContent } from "#src/components/basic-content";
import { BasicTable } from "#src/components/basic-table";

import { useQuery } from "@tanstack/react-query";
import { Col, Divider, Flex, Row, Tag, theme, Typography } from "antd";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { createDependencyColumns, productionDependencies, technologyGroups } from "./constants";

export default function AboutSystem() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const systemInfoQuery = useQuery({
		queryKey: ["system-info"],
		queryFn: async () => {
			const response = await fetchSystemInfo();
			if (response.code !== 0)
				throw new Error(response.msg);
			return response.data;
		},
	});
	const dependencyColumns = useMemo(() => createDependencyColumns(t), [t]);

	return (
		<BasicContent>
			<Flex gap={token.marginLG} vertical>
				<BasicCard title={t("system-info.runtimeTitle")}>
					{systemInfoQuery.isError
						? <Typography.Text type="secondary">{t("system-info.runtimeLoadError")}</Typography.Text>
						: (
							<Flex gap={token.marginXL} wrap>
								<Flex gap={token.marginXXS}>
									<Typography.Text>{`${t("system-info.service")}：`}</Typography.Text>
									<Typography.Text strong>{systemInfoQuery.data?.service ?? "—"}</Typography.Text>
								</Flex>
								<Flex gap={token.marginXXS}>
									<Typography.Text>{`${t("system-info.version")}：`}</Typography.Text>
									<Typography.Text strong>{systemInfoQuery.data?.version ?? "—"}</Typography.Text>
								</Flex>
								<Flex gap={token.marginXXS}>
									<Typography.Text>{`${t("system-info.startedAt")}：`}</Typography.Text>
									<Typography.Text strong>{systemInfoQuery.data?.started_at ?? "—"}</Typography.Text>
								</Flex>
							</Flex>
						)}
				</BasicCard>
				<section aria-labelledby="about-technology-landscape-title">
					<Typography.Title id="about-technology-landscape-title" level={4}>{t("system-info.stackTitle")}</Typography.Title>
					<Row gutter={[token.marginLG, token.marginLG]}>
						{technologyGroups.map(group => (
							<Col key={group.key} xl={8} xs={24}>
								<BasicCard className="h-full" title={t(`system-info.groups.${group.key}`)}>
									<Flex vertical>
										{group.items.map((item, index) => (
											<Flex key={item.name} vertical>
												<Flex align="flex-start" gap={token.margin} justify="space-between">
													<Flex gap={token.marginXXS} style={{ minWidth: 0 }} vertical>
														<Typography.Text strong>{item.name}</Typography.Text>
														<Flex gap={token.marginXS} wrap>
															<Typography.Text type="secondary">{t("system-info.typeLabel", { value: item.type })}</Typography.Text>
															<Typography.Text type="secondary">{t("system-info.versionLabel", { value: item.version })}</Typography.Text>
														</Flex>
													</Flex>
													<Tag color={item.status === "enabled" ? "success" : "processing"}>{t(`system-info.status.${item.status}`)}</Tag>
												</Flex>
												{index < group.items.length - 1 && <Divider style={{ marginBlock: token.marginSM }} />}
											</Flex>
										))}
									</Flex>
								</BasicCard>
							</Col>
						))}
					</Row>
				</section>
				<BasicTable
					columns={dependencyColumns}
					dataSource={productionDependencies}
					headerTitle={t("system-info.dependenciesTitle")}
					options={false}
					pagination={false}
					rowKey="name"
					search={false}
					size="small"
				/>
			</Flex>
		</BasicContent>
	);
}
