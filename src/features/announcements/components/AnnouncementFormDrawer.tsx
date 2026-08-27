import { Alert, Button, Drawer, Flex, Form, Input, Select, theme } from "antd";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
	hasFormChanges,
	useDiscardChanges,
} from "../../../app/useDiscardChanges";

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
	const { token } = theme.useToken();
	const [form] = Form.useForm<CreatePlatformAnnouncementInput>();
	const initialValues = useMemo<CreatePlatformAnnouncementInput>(
		() =>
			announcement
				? {
						content: announcement.content,
						status: announcement.status,
						title: announcement.title,
					}
				: { content: "", status: "draft", title: "" },
		[announcement],
	);
	const discard = useDiscardChanges({
		isDirty: () => hasFormChanges(form, initialValues),
		onDiscard: onClose,
		saving: loading,
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		form.setFieldsValue(initialValues);
	}, [initialValues, form, open]);

	return (
		<Drawer
			destroyOnHidden
			size="min(560px, 100vw)"
			footer={
				<Flex gap={token.marginXS} justify="flex-end">
					<Button disabled={loading} onClick={discard.requestClose}>
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
				</Flex>
			}
			onClose={discard.requestClose}
			closable={!loading}
			keyboard={!loading}
			mask={{ closable: !loading }}
			open={open}
			title={t(
				announcement
					? "adminShell.announcements.editTitle"
					: "adminShell.announcements.createTitle",
			)}
		>
			{discard.contextHolder}
			{error ? (
				<Alert
					description={t("adminShell.announcements.errors.fallback")}
					showIcon
					style={{ marginBottom: token.margin }}
					title={t("adminShell.announcements.errors.save")}
					type="error"
				/>
			) : null}
			<Form<CreatePlatformAnnouncementInput>
				disabled={loading}
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
