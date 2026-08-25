import type { FormInstance, SelectProps } from "antd";

import { BasicButton } from "#src/components/basic-button";
import { BasicCard } from "#src/components/basic-card";

import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Col, DatePicker, Flex, Form, Grid, Input, Row, Select, Space, theme, Typography } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export interface QueryFilterField {
	label: string
	name: string
	options?: SelectProps["options"]
	placeholder?: string
	transform?: (value: unknown) => Record<string, unknown>
	type: "date-time-range" | "select" | "text"
}

interface QueryFilterPanelProps {
	fields: QueryFilterField[]
	form: FormInstance
	loading?: boolean
	onFinish: (values: Record<string, unknown>) => void
	onReset: () => void
}

export function QueryFilterPanel({ fields, form, loading = false, onFinish, onReset }: QueryFilterPanelProps) {
	const { t } = useTranslation();
	const { token } = theme.useToken();
	const screens = Grid.useBreakpoint();
	const [expanded, setExpanded] = useState(false);
	const columnCount = screens.xxl ? 4 : screens.md ? 3 : screens.sm ? 2 : 1;
	const columnSpan = 24 / columnCount;
	const collapsedFieldCount = Math.min(fields.length, Math.max(1, columnCount - 1));
	const visibleFields = expanded ? fields : fields.slice(0, collapsedFieldCount);
	const canExpand = collapsedFieldCount < fields.length;
	const lastRowSpan = (visibleFields.length * columnSpan) % 24;
	const submitterOffset = lastRowSpan + columnSpan > 24 ? 24 - columnSpan : 24 - lastRowSpan - columnSpan;

	return (
		<BasicCard>
			<Form form={form} layout={screens.md ? "horizontal" : "vertical"} onFinish={onFinish}>
				<Row align="middle" gutter={[token.marginLG, token.margin]}>
					{visibleFields.map(field => (
						<Col key={field.name} span={columnSpan}>
							<Form.Item label={field.label} name={field.name} className="!mb-0">
								{field.type === "text" && <Input allowClear placeholder={field.placeholder} />}
								{field.type === "select" && <Select allowClear options={field.options} placeholder={field.placeholder} />}
								{field.type === "date-time-range" && <DatePicker.RangePicker className="w-full" showTime />}
							</Form.Item>
						</Col>
					))}
					<Col offset={submitterOffset} span={columnSpan}>
						<Form.Item className="!mb-0">
							<Flex justify="flex-end">
								<Space size={token.margin}>
									<Flex gap={token.marginXS}>
										<BasicButton disabled={loading} onClick={onReset}>{t("common.reset")}</BasicButton>
										<BasicButton htmlType="submit" loading={loading} type="primary">{t("common.search")}</BasicButton>
									</Flex>
									{canExpand && (
										<Typography.Link aria-expanded={expanded} onClick={() => setExpanded(current => !current)}>
											{expanded ? t("common.collapse") : t("common.expand")}
											{expanded ? <UpOutlined className="ml-1" /> : <DownOutlined className="ml-1" />}
										</Typography.Link>
									)}
								</Space>
							</Flex>
						</Form.Item>
					</Col>
				</Row>
			</Form>
		</BasicCard>
	);
}
