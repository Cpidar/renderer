// /cms/src/types/TemplateSnapshot.ts

export interface CompiledSnapshot {
    id: string;                            // template name, e.g. "modern"
    version: number;
    tree: any;                              // Puck-ready JSON tree
    meta: {
        label: string;
        description?: string;
        demoPreviewImage?: string;
        defaultSettings?: Record<string, any>;
    };
    sampleProducts?: Array<{
        title: string;
        description: string;
        image: string;
        price: number;
        slug: string;
    }>;
}

