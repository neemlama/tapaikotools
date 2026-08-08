import type { ComponentType } from "react";

import { JsonFormatterTool } from "@/components/tools/implementations/json-formatter";
import { PasswordGeneratorTool } from "@/components/tools/implementations/password-generator";

/**
 * Maps a tool's slug to its actual implementation component. A slug in the
 * registry with no entry here renders the generic "coming soon" fallback
 * instead — see app/tools/[slug]/page.tsx. Adding a new tool is: write the
 * component, add it here, flip its registry status to "available".
 */
export const toolImplementations: Record<string, ComponentType> = {
  "json-formatter": JsonFormatterTool,
  "password-generator": PasswordGeneratorTool,
};
