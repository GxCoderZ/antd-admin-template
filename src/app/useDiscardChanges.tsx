import { Modal, type FormInstance } from "antd";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

export function hasFormChanges<Values extends object>(
	form: FormInstance<Values>,
	initialValues: {
		[Key in keyof Values]?: string | number | boolean | null | undefined;
	},
) {
	const values = new Map<string, unknown>(
		Object.entries(form.getFieldsValue()),
	);
	return Object.entries(initialValues).some(
		([name, initial]: [string, unknown]) => {
			const current = values.get(name);
			return (current ?? "") !== (initial ?? "");
		},
	);
}

export function useDiscardChanges({
	isDirty,
	onDiscard,
	saving,
}: {
	isDirty: () => boolean;
	onDiscard: () => void;
	saving: boolean;
}) {
	const { t } = useTranslation();
	const [modal, contextHolder] = Modal.useModal();
	const confirming = useRef(false);
	const requestClose = () => {
		if (saving || confirming.current) return;
		if (!isDirty()) {
			onDiscard();
			return;
		}
		confirming.current = true;
		modal.confirm({
			focusable: { autoFocusButton: "cancel" },
			cancelText: t("discardChanges.keepEditing"),
			content: t("discardChanges.description"),
			okButtonProps: { danger: true },
			okText: t("discardChanges.discard"),
			title: t("discardChanges.title"),
			onCancel: () => {
				confirming.current = false;
			},
			onOk: () => {
				confirming.current = false;
				onDiscard();
			},
		});
	};
	return { contextHolder, requestClose };
}
