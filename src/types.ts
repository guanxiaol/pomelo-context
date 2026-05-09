export type RecipeId =
  | "compare-options"
  | "implementation-plan"
  | "annotated-pr-review"
  | "module-map"
  | "design-system-reference"
  | "prototype-snapshot"
  | "research-explainer"
  | "status-report"
  | "incident-report"
  | "custom-editor-export"
  | "web-or-chat-archive";

export type SourceType =
  | "html"
  | "markdown"
  | "text"
  | "json"
  | "csv"
  | "directory"
  | "unknown";

export type CellValue = string | number | boolean | null;

export interface WorkbookSource {
  id: string;
  type: SourceType;
  title: string;
  path?: string;
  url?: string;
  capturedAt: string;
  bytes?: number;
  tokenEstimate: number;
  summary?: string;
}

export interface WorkbookSheet {
  name: string;
  kind: string;
  description: string;
  columns: string[];
  rows: Record<string, CellValue>[];
  priority: number;
  suggestedRanges: string[];
}

export interface WorkbookNote {
  name: string;
  title: string;
  body: string;
}

export interface WorkbookAsset {
  path: string;
  type: string;
  description: string;
}

export interface WorkbookReference {
  title: string;
  author?: string;
  url: string;
  note: string;
}

export interface ReadingGuideEntry {
  task: string;
  firstRead: string[];
  thenRead: string[];
  tokenBudget: "small" | "medium" | "full";
  rationale: string;
}

export interface ContextWorkbook {
  version: "0.1";
  id: string;
  title: string;
  recipe: RecipeId;
  createdAt: string;
  summary: string;
  tokenBudget: {
    estimatedFullTokens: number;
    estimatedIndexTokens: number;
    recommendedDefault: "small" | "medium" | "full";
  };
  localFirst: true;
  ai: {
    enabled: false;
    note: string;
  };
  sources: WorkbookSource[];
  sheets: WorkbookSheet[];
  notes: WorkbookNote[];
  assets: WorkbookAsset[];
  references: WorkbookReference[];
  readingGuide: ReadingGuideEntry[];
}

export interface RecipeDefinition {
  id: RecipeId;
  title: string;
  category: string;
  borrowedFrom: string;
  purpose: string;
  promptPattern: string;
  defaultSheets: Array<{
    name: string;
    kind: string;
    description: string;
    columns: string[];
    priority: number;
  }>;
  readingGuide: ReadingGuideEntry[];
}

export interface PackOptions {
  input: string;
  out: string;
  recipe: RecipeId;
  formats: Set<"xlsx" | "json" | "md" | "csv" | "html">;
}

export interface ConvertOptions {
  input: string;
  out?: string;
  to: "xlsx" | "csv-dir" | "md" | "html" | "json";
}
