import {
	CloseCircleOutlined,
	DingdingOutlined,
	RightOutlined,
} from "@ant-design/icons";
import {
	Button,
	Card,
	Descriptions,
	Result,
	Steps,
	theme,
	Typography,
} from "antd";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

export function SuccessResultPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	return (
		<Card variant="borderless">
			<Result
				status="success"
				title={t("adminShell.pageExamples.results.successTitle")}
				subTitle={t("adminShell.pageExamples.results.successDescription")}
				extra={[
					<Button key="back" type="primary">
						{t("adminShell.pageExamples.results.backList")}
					</Button>,
					<Button key="view">
						{t("adminShell.pageExamples.results.viewProject")}
					</Button>,
					<Button key="print">
						{t("adminShell.pageExamples.results.print")}
					</Button>,
				]}
				style={{ marginBottom: token.margin }}
			>
				<div>
					<Descriptions
						column={{ xs: 1, sm: 3 }}
						title={t("adminShell.pageExamples.results.projectName")}
						items={[
							{
								key: "id",
								label: t("adminShell.pageExamples.results.projectId"),
								children: "23421",
							},
							{
								key: "owner",
								label: t("adminShell.pageExamples.owner"),
								children: "Platform Admin",
							},
							{
								key: "date",
								label: t("adminShell.pageExamples.results.effectiveTime"),
								children: "2026-08-26 ~ 2027-08-26",
							},
						]}
					/>
					<div style={{ height: token.marginLG }} />
					<Steps
						current={1}
						items={[
							{
								content: (
									<div style={{ color: token.colorText, fontSize: 12, textAlign: "center" }}>
										<div style={{ margin: "8px 0 4px" }}>
											曲丽丽
											<DingdingOutlined style={{ color: "#00a0e9", marginInlineStart: 8 }} />
										</div>
										<div>2016-12-12 12:32</div>
									</div>
								),
								title: t("adminShell.pageExamples.results.created"),
							},
							{
								content: (
									<div style={{ color: token.colorText, fontSize: 12, textAlign: "center" }}>
										<div style={{ margin: "8px 0 4px" }}>
											周毛毛
											<Button style={{ padding: 0 }} type="link">
												<DingdingOutlined style={{ color: "#00a0e9", marginInlineStart: 8 }} />
												{t("adminShell.pageExamples.results.nudge")}
											</Button>
										</div>
									</div>
								),
								title: t("adminShell.pageExamples.results.review"),
							},
							{ title: t("adminShell.pageExamples.results.financeReview") },
							{ title: t("adminShell.pageExamples.results.completed") },
						]}
						responsive
						type="dot"
					/>
				</div>
			</Result>
		</Card>
	);
}

export function FailureResultPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	return (
		<Card variant="borderless">
			<Result
				icon={<CloseCircleOutlined style={{ color: token.colorError }} />}
				status="error"
				title={t("adminShell.pageExamples.results.failureTitle")}
				subTitle={t("adminShell.pageExamples.results.failureDescription")}
				extra={
					<Button type="primary">
						{t("adminShell.pageExamples.results.returnEdit")}
					</Button>
				}
				style={{ marginBottom: token.margin, marginTop: token.marginXL }}
			>
				<div>
					<Title level={5} style={{ marginBottom: token.margin }}>
						{t("adminShell.pageExamples.results.errorHeading")}
					</Title>
					{["frozen", "ineligible"].map((key) => (
						<div key={key} style={{ marginBottom: token.margin }}>
							<CloseCircleOutlined style={{ color: token.colorError }} />
							<Text style={{ marginInlineStart: token.marginXS }}>
								{t(`adminShell.pageExamples.results.errors.${key}`)}
							</Text>
							<Button
								icon={<RightOutlined />}
								iconPosition="end"
								size="small"
								type="link"
							>
								{t(`adminShell.pageExamples.results.actions.${key}`)}
							</Button>
						</div>
					))}
				</div>
			</Result>
		</Card>
	);
}
