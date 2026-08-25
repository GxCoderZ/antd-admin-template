import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
	ApplicationSkeleton,
	FormSkeleton,
	RouteContentSkeleton,
} from "./LoadingSkeletons";

describe("loading skeletons", () => {
	it.each([["form", FormSkeleton]] as const)(
		"renders the Ant Design default %s skeleton",
		(_name, Component) => {
			const { container } = render(<Component />);

			expect(container.firstElementChild).toHaveClass(
				"ant-skeleton",
				"ant-skeleton-active",
			);
		},
	);

	it.each([
		["application", ApplicationSkeleton],
		["route-content", RouteContentSkeleton],
	] as const)(
		"renders the Ant Design Pro %s page skeleton",
		(_name, Component) => {
			const { container } = render(<Component />);
			const skeleton = container.firstElementChild as HTMLElement;

			expect(skeleton).toHaveClass("ant-skeleton", "ant-skeleton-active");
			expect(skeleton.style.height).toBe("60vh");
			expect(skeleton.style.padding).toBe("24px 40px");
		},
	);
});
