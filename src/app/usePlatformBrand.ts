import type { PlatformGeneralSettings } from "#src/api/settings";
import { createContext, useContext } from "react";

export const PlatformBrandContext =
	createContext<PlatformGeneralSettings | null>(null);

export function usePlatformBrand() {
	const brand = useContext(PlatformBrandContext);
	if (!brand) throw new Error("PlatformBrandProvider is required");
	return brand;
}
