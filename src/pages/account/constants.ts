export const accountProfileQueryKey = ["account-profile"] as const;
export const accountSessionsQueryKey = ["account-sessions"] as const;
export const avatarUploadLimitBytes = 2 * 1024 * 1024;
export const supportedAvatarContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export type AccountSettingsSection = "basic" | "security";
