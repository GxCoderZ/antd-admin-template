import { EyeOutlined } from "@ant-design/icons";
import {
	Button,
	Card,
	Checkbox,
	ColorPicker,
	Flex,
	Form,
	Grid,
	Image,
	Input,
	Select,
	Space,
	Tag,
	theme,
	Typography,
} from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import {
	type PreviewMode,
	ResponsivePreviewPanel,
} from "../../app/ResponsivePreviewPanel";

const { Paragraph, Text, Title } = Typography;

interface PreviewDraft {
	action: string;
	audience: string;
	published: boolean;
	summary: string;
	title: string;
}

const initialDraft: PreviewDraft = {
	action: "查看详情",
	audience: "全部成员",
	published: true,
	summary: "使用标准预览容器即时核对桌面端、移动端和纯内容呈现。",
	title: "通用内容预览",
};

export function PreviewWorkbenchPage() {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const [draft, setDraft] = useState(initialDraft);
	const [accent, setAccent] = useState(token.colorPrimary);
	const [mode, setMode] = useState<PreviewMode>("desktop");
	const [zoom, setZoom] = useState(100);
	const [revision, setRevision] = useState(0);

	return (
		<Flex align="start" gap={token.marginLG} vertical={!screens.lg}>
			<div style={{ flex: screens.lg ? "0 0 360px" : "1 1 auto", minWidth: 0, width: "100%" }}>
				<Card title={t("adminShell.previewWorkbench.editorTitle")}>
					<Form<PreviewDraft>
						initialValues={initialDraft}
						layout="vertical"
						onValuesChange={(_changed, values) => setDraft(values)}
						requiredMark="optional"
					>
						<Form.Item label={t("adminShell.previewWorkbench.fields.title")} name="title" rules={[{ required: true }]}>
							<Input maxLength={80} />
						</Form.Item>
						<Form.Item label={t("adminShell.previewWorkbench.fields.summary")} name="summary" rules={[{ required: true }]}>
							<Input.TextArea maxLength={240} rows={4} showCount />
						</Form.Item>
						<Form.Item label={t("adminShell.previewWorkbench.fields.action")} name="action" rules={[{ required: true }]}>
							<Input maxLength={24} />
						</Form.Item>
						<Form.Item label={t("adminShell.previewWorkbench.fields.audience")} name="audience">
							<Select
								options={[
									{ label: t("adminShell.previewWorkbench.audiences.all"), value: "全部成员" },
									{ label: t("adminShell.previewWorkbench.audiences.admin"), value: "管理员" },
									{ label: t("adminShell.previewWorkbench.audiences.operator"), value: "运营人员" },
								]}
							/>
						</Form.Item>
						<Form.Item label={t("adminShell.previewWorkbench.fields.accent")}>
							<ColorPicker
								onChangeComplete={(color) => setAccent(color.toHexString())}
								showText
								value={accent}
							/>
						</Form.Item>
						<Form.Item name="published" valuePropName="checked">
							<Checkbox>{t("adminShell.previewWorkbench.fields.published")}</Checkbox>
						</Form.Item>
					</Form>
				</Card>
			</div>
			<div style={{ flex: "1 1 0", minWidth: 0, width: "100%" }}>
				<ResponsivePreviewPanel
					mode={mode}
					onModeChange={setMode}
					onRefresh={() => setRevision((value) => value + 1)}
					onZoomChange={setZoom}
					title={t("adminShell.previewWorkbench.previewTitle")}
					zoom={zoom}
				>
					<div key={revision} style={{ padding: mode === "mobile" ? token.padding : token.paddingLG }}>
						<Image
							alt={t("adminShell.previewWorkbench.coverAlt")}
							height={mode === "mobile" ? 180 : 260}
							preview={false}
							src="/pro-search/iXjVmWVHbCJAyqvDxdtx.png"
							style={{ objectFit: "cover", width: "100%" }}
							width="100%"
						/>
						<Flex gap={token.margin} style={{ paddingBlock: token.paddingLG }} vertical>
							<Space wrap>
								{draft.published ? <Tag color="success">{t("adminShell.previewWorkbench.published")}</Tag> : <Tag>{t("adminShell.previewWorkbench.draft")}</Tag>}
								<Tag>{draft.audience}</Tag>
							</Space>
							<Title level={mode === "mobile" ? 3 : 2} style={{ margin: 0 }}>{draft.title}</Title>
							<Paragraph style={{ margin: 0 }}>{draft.summary}</Paragraph>
							<Flex align="center" justify="space-between" wrap>
								<Text type="secondary">{t("adminShell.previewWorkbench.updatedNow")}</Text>
								<Button icon={<EyeOutlined aria-hidden />} style={{ background: accent, borderColor: accent, color: token.colorWhite }}>
									{draft.action}
								</Button>
							</Flex>
						</Flex>
					</div>
				</ResponsivePreviewPanel>
			</div>
		</Flex>
	);
}
