import { Alert, Button, Drawer, Form, Input, Select, Space } from "antd";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import type {
	CreatePlatformAnnouncementInput,
	PlatformAnnouncement,
} from "#src/api/announcements";

interface AnnouncementFormDrawerProps {
	announcement: PlatformAnnouncement | null;
	error: boolean;
	loading: boolean;
	onClose: () => void;
	onSubmit: (values: CreatePlatformAnnouncementInput) => void;
	open: boolean;
}

const formId = "announcement-form";

export function AnnouncementFormDrawer({
	announcement,
	error,
	loading,
	onClose,
	onSubmit,
	open,
}: AnnouncementFormDrawerProps) {
	const { t } = useTranslation();
	const [form] = Form.useForm<CreatePlatformAnnouncementInput>();

	useEffect(() => {
		if (!open) {
			return;
		}

		form.setFieldsValue(
			announcement
				? {
						content: announcement.content,
						status: announcement.status,
						title: announcement.title,
					}
				: { content: "", status: "draft", title: "" },
		);
	}, [announcement, form, open]);

	return (
		<Drawer
			destroyOnHidden
			extra={
				<Space>
					<Button disabled={loading} onClick={onClose}>
						{t("adminShell.announcements.cancel")}
					</Button>
					<Button
						form={formId}
						htmlType="submit"
						loading={loading}
						type="primary"
					>
						{t("adminShell.announcements.save")}
					</Button>
				</Space>
			}
			onClose={onClose}
			open={open}
			title={t(
				announcement
					? "adminShell.announcements.editTitle"
					: "adminShell.announcements.createTitle",
			)}
		>
			{error ? (
				<Alert
					description={t("adminShell.announcements.errors.fallback")}
					showIcon
					style={{ marginBottom: 16 }}
					title={t("adminShell.announcements.errors.save")}
					type="error"
				/>
			) : null}
			<Form<CreatePlatformAnnouncementInput>
				form={form}
				id={formId}
				layout="vertical"
				name="announcementEditor"
				onFinish={onSubmit}
			>
				<Form.Item
					label={t("adminShell.announcements.fields.title")}
					name="title"
					rules={[
						{
							max: 100,
							message: t("adminShell.announcements.validation.titleLength"),
							required: true,
						},
					]}
				>
					<Input
						maxLength={100}
						placeholder={t("adminShell.announcements.placeholders.title")}
						showCount
					/>
				</Form.Item>
				<Form.Item
					label={t("adminShell.announcements.fields.status")}
					name="status"
					rules={[{ required: true }]}
				>
					<Select
						options={[
							{
								label: t("adminShell.announcements.statuses.draft"),
								value: "draft",
							},
							{
								label: t("adminShell.announcements.statuses.published"),
								value: "published",
							},
						]}
					/>
				</Form.Item>
				<Form.Item
					label={t("adminShell.announcements.fields.content")}
					name="content"
					rules={[
						{
							max: 2_000,
							message: t("adminShell.announcements.validation.contentLength"),
							required: true,
						},
					]}
				>
					<Input.TextArea
						autoSize={{ maxRows: 12, minRows: 6 }}
						maxLength={2_000}
						placeholder={t("adminShell.announcements.placeholders.content")}
						showCount
					/>
				</Form.Item>
			</Form>
		</Drawer>
	);
}
