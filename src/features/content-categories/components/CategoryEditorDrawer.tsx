import { Button, Drawer, Form, Input, Select, Space } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type {
	ContentCategory,
	SaveContentCategoryInput,
} from "#src/api/content-categories";

interface CategoryEditorDrawerProps {
	category: ContentCategory | null;
	categoryOptions: Array<{ label: string; value: string }>;
	defaultParentId: string | null;
	loading: boolean;
	onClose: () => void;
	onSave: (input: SaveContentCategoryInput) => void;
	open: boolean;
	size: number | string;
}

export function CategoryEditorDrawer({
	category,
	categoryOptions,
	defaultParentId,
	loading,
	onClose,
	onSave,
	open,
	size,
}: CategoryEditorDrawerProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<SaveContentCategoryInput>();
	useEffect(() => {
		if (!open) return;
		form.setFieldsValue(
			category
				? {
						code: category.code,
						name: category.name,
						parentId: category.parentId,
						status: category.status,
					}
				: {
						code: "",
						name: "",
						parentId: defaultParentId,
						status: "active",
					},
		);
	}, [category, defaultParentId, form, open]);

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
				category
					? "adminShell.contentCategories.editCategory"
					: "adminShell.contentCategories.createCategory",
			)}
			size={size}
		>
			<Form form={form} layout="vertical" onFinish={onSave} requiredMark="optional">
				<Form.Item
					label={t("adminShell.contentCategories.fields.categoryName")}
					name="name"
					rules={[{ max: 64, min: 1, required: true }]}
				>
					<Input />
				</Form.Item>
				<Form.Item
					label={t("adminShell.contentCategories.fields.categoryCode")}
					name="code"
					rules={[{ max: 64, min: 1, required: true }]}
				>
					<Input />
				</Form.Item>
				<Form.Item label={t("adminShell.contentCategories.fields.parentCategory")} name="parentId">
					<Select
						allowClear
						options={categoryOptions.filter((option) => option.value !== category?.id)}
						placeholder={t("adminShell.contentCategories.rootCategory")}
					/>
				</Form.Item>
				<Form.Item label={t("adminShell.contentCategories.fields.status")} name="status" rules={[{ required: true }]}>
					<Select
						options={[
							{ label: t("adminShell.contentCategories.statuses.active"), value: "active" },
							{ label: t("adminShell.contentCategories.statuses.disabled"), value: "disabled" },
						]}
					/>
				</Form.Item>
			</Form>
		</Drawer>
	);
}
