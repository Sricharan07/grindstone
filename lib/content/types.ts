export interface GeneratedContentItem {
  id: string;
  kind: "mcq" | "pseudocode" | "quantitative" | "reasoning" | "verbal" | "fundamentals" | "lesson" | "sql";
  topic: string;
  difficulty: number;
  prompt: string;
  answer: string;
  distractors: string[];
  explanation: string;
  subgoalLabels: string[];
  bodyL1: string;
  bodyL2: string;
  bodyL3: string;
  verificationProgram?: string;
  expectedOutput?: string;
  status: "generated" | "verified" | "published" | "quarantined" | "retired";
  verification: {
    executionRequired?: boolean;
    execution?: { passed: boolean; output: string; detail: string };
    independent?: { passed: boolean; answer: string };
    ambiguity?: { passed: boolean; issues: string[] };
    duplicateOf?: string;
  };
}

export interface GenerationRequest {
  topic: string;
  kind: GeneratedContentItem["kind"];
  difficulty: number;
  count: number;
  language?: "python" | "java" | "cpp";
}

export interface PipelineDependencies {
  generate: (request: GenerationRequest, index: number) => Promise<{ item: GeneratedContentItem; costUsd: number; inputTokens?: number; outputTokens?: number }>;
  execute: (code: string) => Promise<{ outcome: string; stdout: string; stderr: string }>;
  independentSolve: (item: GeneratedContentItem) => Promise<{ answer: string; costUsd: number; inputTokens?: number; outputTokens?: number }>;
  ambiguityCritic: (item: GeneratedContentItem) => Promise<{ issues: string[]; costUsd: number; inputTokens?: number; outputTokens?: number }>;
}
