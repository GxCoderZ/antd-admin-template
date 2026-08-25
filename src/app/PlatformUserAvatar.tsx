import { UserOutlined } from "@ant-design/icons";
import {
	getPlatformUserAvatar,
	platformUserAvatarQueryKey,
} from "#src/api/users";
import { useQuery } from "@tanstack/react-query";
import { Avatar, type AvatarProps } from "antd";
import { useState } from "react";

interface PlatformUserAvatarProps {
	displayName: string;
	fallback?: "icon" | "initial";
	revision: number | string;
	size?: AvatarProps["size"];
	userId: string;
}

const defaultCurrentUserAvatar = "/antd-pro-card-avatar.png";

function getInitial(displayName: string) {
	return Array.from(displayName.trim())[0]?.toUpperCase();
}

export function PlatformUserAvatar({
	displayName,
	fallback = "initial",
	revision,
	size,
	userId,
}: PlatformUserAvatarProps) {
	const avatarQuery = useQuery({
		queryFn: ({ signal }) => getPlatformUserAvatar(userId, signal),
		queryKey: platformUserAvatarQueryKey(userId, revision),
	});
	const customSource = avatarQuery.data?.dataUrl ?? undefined;
	const [failedSources, setFailedSources] = useState<ReadonlySet<string>>(
		() => new Set(),
	);
	const initial = getInitial(displayName);
	const fallbackContent =
		fallback === "icon" || !initial ? <UserOutlined aria-hidden /> : initial;
	const fallbackSource =
		fallback === "icon" ? defaultCurrentUserAvatar : undefined;
	const source = [customSource, fallbackSource].find(
		(candidate): candidate is string =>
			candidate !== undefined && !failedSources.has(candidate),
	);

	// Drive the image through Avatar's own src prop so antd applies its
	// fill-and-crop styling (like Ant Design Pro); a child <img> would leave
	// the default background ring showing. Fall back to the initial/icon when
	// the image fails to load.
	return (
		<Avatar
			alt=""
			onError={() => {
				if (source) {
					setFailedSources((currentSources) => {
						const nextSources = new Set(currentSources);
						nextSources.add(source);
						return nextSources;
					});
				}
				return false;
			}}
			size={size}
			src={source}
		>
			{fallbackContent}
		</Avatar>
	);
}
