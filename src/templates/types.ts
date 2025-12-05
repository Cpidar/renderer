export interface PuckNode {
  component: string;
  props?: Record<string, any>;
  children?: PuckNode[];
}

export interface TemplateSnapshot {
  id: string;
  name: string;
  tree: PuckNode;
  meta?: Record<string, any>;
}
