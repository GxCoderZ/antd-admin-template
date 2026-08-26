import { DingdingOutlined } from "@ant-design/icons";
import { GridContent } from "@ant-design/pro-components";
import { Button, Card, Descriptions, Result, Steps, theme } from "antd";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import useStyles from "./SuccessResultPage.style";

export const SuccessResultPage: FC = () => {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const { styles } = useStyles();
	const descriptionItems = [
		{
			key: "id",
			label: t("adminShell.results.success.projectId"),
			children: "23421",
		},
		{
			key: "owner",
			label: t("adminShell.results.success.owner"),
			children: t("adminShell.results.success.ownerName"),
		},
		{
			key: "time",
			label: t("adminShell.results.success.effectiveTime"),
			children: "2016-12-12 ~ 2017-12-12",
		},
	];
	const extra = (
		<>
			<Button type="primary">
				{t("adminShell.results.success.returnList")}
			</Button>
			<Button>{t("adminShell.results.success.viewProject")}</Button>
			<Button>{t("adminShell.results.success.print")}</Button>
		</>
	);
	const desc1 = (
		<div className={styles.title}>
			<div style={{ margin: "8px 0 4px" }}>
				<span>{t("adminShell.results.success.ownerName")}</span>
				<DingdingOutlined style={{ marginLeft: 8, color: token.colorInfo }} />
			</div>
			<div>2016-12-12 12:32</div>
		</div>
	);
	const desc2 = (
		<div className={styles.title} style={{ fontSize: 12 }}>
			<div style={{ margin: "8px 0 4px" }}>
				<span>{t("adminShell.results.success.reviewerName")}</span>
				<Button type="link" style={{ padding: 0 }}>
					<DingdingOutlined style={{ color: token.colorInfo, marginLeft: 8 }} />
					<span>{t("adminShell.results.success.urge")}</span>
				</Button>
			</div>
		</div>
	);
	const content = (
		<>
			<Descriptions
				items={descriptionItems}
				title={t("adminShell.results.success.projectName")}
			/>
			<br />
			<Steps
				current={1}
				items={[
					{
						title: (
							<span style={{ fontSize: 14 }}>
								{t("adminShell.results.success.createProject")}
							</span>
						),
						content: desc1,
					},
					{
						title: (
							<span style={{ fontSize: 14 }}>
								{t("adminShell.results.success.departmentReview")}
							</span>
						),
						content: desc2,
					},
					{
						title: (
							<span style={{ fontSize: 14 }}>
								{t("adminShell.results.success.financeReview")}
							</span>
						),
					},
					{
						title: (
							<span style={{ fontSize: 14 }}>
								{t("adminShell.results.success.complete")}
							</span>
						),
					},
				]}
				type="dot"
			/>
		</>
	);

	return (
		<GridContent>
			<Card variant="borderless">
				<Result
					extra={extra}
					status="success"
					style={{ marginBottom: 16 }}
					subTitle={t("adminShell.results.success.subTitle")}
					title={t("adminShell.results.success.title")}
				>
					{content}
				</Result>
			</Card>
		</GridContent>
	);
};
