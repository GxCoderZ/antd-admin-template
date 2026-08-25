export function copyTableValue(value: string) {
	void navigator.clipboard?.writeText(value).catch(() => undefined);
}
