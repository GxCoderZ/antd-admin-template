import { Button, Drawer, Form, Input, Select, Space } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type {
	ContentCategoryItem,
	SaveContentCategoryItemInput,
} from "#src/api/content-categories";

interface ContentItemEditorDrawerProps {
	categoryOptions: Array<{ label: string; value: string }>;
	defaultCategoryId: string;
	item: ContentCategoryItem | null;
	loading: boolean;
	onClose: () => void;
	onSave: (input: SaveContentCategoryItemInput) => void;
	open: boolean;
	size: number | string;
}

export function ContentItemEditorDrawer({
	categoryOptions,
	defaultCategoryId,
	item,
	loading,
	onClose,
	onSave,
	open,
	size,
}: ContentItemEditorDrawerProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<SaveContentCategoryItemInput>();
	useEffect(() => {
		if (!open) return;
		form.setFieldsValue(
			item
				? {
						categoryId: item.categoryId,
						owner: item.owner,
						status: item.status,
						title: item.title,
					}
				: {
						categoryId: defaultCategoryId,
						owner: "Platform Admin",
						status: "draft",
						title: "",
					},
		);
	}, [defaultCategoryId, form, item, open]);

	return (
		<Drawer
			destroyOnHidden
			extra={
				<Space>
					<Button onClick={onClose}>{t("adminShell.contentCategories.cancel")}</Button>
					<Button loading={loading} onClick={() => form.submit()} type="primary">
						{t("adminShell.contentCategories.save")}
					</Button>
				</Space>
			}
			onClose={onClose}
			open={open}
			title={t(
				item
					? "adminShell.contentCategories.editContent"
					: "adminShell.contentCategories.createContent",
			)}
			size={size}
		>
			<Form form={form} layout="vertical" onFinish={onSave} requiredMark="optional">
				<Form.Item label={t("adminShell.contentCategories.fields.title")} name="title" rules={[{ max: 120, min: 1, required: true }]}>
					<Input />
				</Form.Item>
				<Form.Item label={t("adminShell.contentCategories.fields.category")} name="categoryId" rules={[{ required: true }]}>
					<Select options={categoryOptions} />
				</Form.Item>
				<Form.Item label={t("adminShell.contentCategories.fields.owner")} name="owner" rules={[{ max: 64, min: 1, required: true }]}>
					<Input />
				</Form.Item>
				<Form.Item label={t("adminShell.contentCategories.fields.contentStatus")} name="status" rules={[{ required: true }]}>
					<Select
						options={[
							{ label: t("adminShell.contentCategories.itemStatuses.draft"), value: "draft" },
							{ label: t("adminShell.contentCategories.itemStatuses.published"), value: "published" },
						]}
					/>
				</Form.Item>
			</Form>
		</Drawer>
	);
}
