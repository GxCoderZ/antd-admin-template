import { CloseCircleOutlined, RightOutlined } from "@ant-design/icons";
import { GridContent } from "@ant-design/pro-components";
import { Button, Card, Result } from "antd";
import { useTranslation } from "react-i18next";

import useStyles from "./FailureResultPage.style";

export function FailureResultPage() {
	const { t } = useTranslation();
	const { styles } = useStyles();
	const content = (
		<>
			<div className={styles.title}>
				<span>{t("adminShell.results.failure.errorIntro")}</span>
			</div>
			<div style={{ marginBottom: 16 }}>
				<CloseCircleOutlined
					className={styles.error_icon}
					style={{ marginRight: 8 }}
				/>
				<span>{t("adminShell.results.failure.accountFrozen")}</span>
				<Button type="link" style={{ marginLeft: 16, padding: 0 }}>
					<span>{t("adminShell.results.failure.unfreezeNow")}</span>
					<RightOutlined />
				</Button>
			</div>
			<div>
				<CloseCircleOutlined
					className={styles.error_icon}
					style={{ marginRight: 8 }}
				/>
				<span>{t("adminShell.results.failure.notEligible")}</span>
				<Button type="link" style={{ marginLeft: 16, padding: 0 }}>
					<span>{t("adminShell.results.failure.upgradeNow")}</span>
					<RightOutlined />
				</Button>
			</div>
		</>
	);

	return (
		<GridContent>
			<Card variant="borderless">
				<Result
					extra={
						<Button type="primary">
							<span>{t("adminShell.results.failure.returnModify")}</span>
						</Button>
					}
					status="error"
					style={{ marginTop: 48, marginBottom: 16 }}
					subTitle={t("adminShell.results.failure.subTitle")}
					title={t("adminShell.results.failure.title")}
				>
					{content}
				</Result>
			</Card>
		</GridContent>
	);
}
