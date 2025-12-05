import type { TemplateSnapshot } from "./types";

export const TEMPLATE_INDEX = {
//   modern: () => import("./snapshots/modern.json") as Promise<{ default: TemplateSnapshot }>,
//   minimal: () => import("./snapshots/minimal.json") as Promise<{ default: TemplateSnapshot }>,
//   fashion: () => import("./snapshots/fashion.json") as Promise<{ default: TemplateSnapshot }>
} as const;

export type TemplateID = keyof typeof TEMPLATE_INDEX;
