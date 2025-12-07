import { Data } from "@measured/puck";

export type TemplateSnapshot = Data & {
    id: string;
    name: string;                            // template name, e.g. "modern"
    version: string;
    updatedAt: string;
    meta?: Record<string, any>;
    defaults?: {
        [key: string]: any;
    };
    tokens?: {
        [key: string]: any;
    }
}
