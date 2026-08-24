import type { LearningLanguage, LessonSlug } from "@/lib/learning/catalog";

export type AssessmentMode = "guided" | "independent";
export type AssessmentGroup = "correctness" | "edgeCases" | "efficiency";
export type AssessmentCaseStatus = "passed" | "failed" | "not_run";
export type AssessmentErrorType = "wrong_answer" | "compile_error" | "runtime_error" | "timeout" | "internal_error";

export interface AssessmentCaseResult {
  id: string;
  name: string;
  category: string;
  group: AssessmentGroup;
  input: string;
  expected: string;
  actual: string;
  status: AssessmentCaseStatus;
  errorType?: AssessmentErrorType;
  error?: string;
  line?: number;
  correction: string;
}

export interface AssessmentSectionScore {
  earned: number;
  possible: number;
  passed: number;
  total: number;
}

export interface LessonAssessmentResult {
  mode: AssessmentMode;
  attemptId?: string;
  lessonId: LessonSlug;
  language: LearningLanguage;
  attemptNumber: number;
  firstSubmission: boolean;
  passed: boolean;
  score: number;
  passedCount: number;
  totalCount: number;
  solveDurationMs?: number;
  judgeDurationMs: number;
  outcome: "passed" | "failed" | "compile_error" | "runtime_error" | "timeout" | "internal_error";
  summary: string;
  remarks: string[];
  sections: Record<AssessmentGroup, AssessmentSectionScore>;
  cases: AssessmentCaseResult[];
}

export interface IndependentAttemptStart {
  id: string;
  lessonId: LessonSlug;
  language: LearningLanguage;
  attemptNumber: number;
  startedAt: string;
  expiresAt: string;
  testCount: number;
}

export type StartAssessmentResponse =
  | { attempt: IndependentAttemptStart; result?: never }
  | { attempt?: never; result: LessonAssessmentResult };

