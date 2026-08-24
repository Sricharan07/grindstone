import type { LearningLanguage } from "@/lib/learning/catalog";

export interface LearnerProfile {
  name: string;
  initials: string;
  language: LearningLanguage;
  timezone: string;
  sessionTime: string;
  onboardingComplete: boolean;
}

export interface SprintState {
  number: number;
  week: 1 | 2 | 3 | 4;
  day: number;
  daysRemaining: number;
  goal: string;
  status: "draft" | "active" | "complete";
  startedAt?: string;
  completedItems: string[];
  gate?: {
    week: number;
    score: number;
    passed: boolean;
    failedTopics: string[];
  };
  gates: Record<string, {
    week: number;
    score: number;
    passed: boolean;
    failedTopics: string[];
    completedAt: string;
  }>;
}

export interface MasteryEvidence {
  rating: number;
  confidence: number;
  attempts: number;
  calibrationError: number;
}

export type AssistanceLevel = "none" | "socratic" | "concept" | "pseudocode" | "next-step" | "completion";

export interface AttemptEvidence {
  id: string;
  itemType: string;
  itemId: string;
  topic: string;
  correct: boolean;
  difficulty: number;
  durationMs: number;
  targetDurationMs: number;
  predictedSuccess?: number;
  scaffoldLevel: number;
  assistance?: AssistanceLevel;
  transfer?: boolean;
  timed: boolean;
  communicationScore?: number;
  measuredComplexity?: string;
  verified?: boolean;
  score?: number;
  passedTests?: number;
  totalTests?: number;
  attemptNumber?: number;
  feedback?: string[];
  solveDurationMs?: number;
  language?: LearningLanguage;
  code?: string;
  answer?: unknown;
  createdAt: string;
}

export interface OnboardingDraft {
  step: number;
  completed: boolean;
  name: string;
  language: LearningLanguage;
  timezone: string;
  sessionTime: string;
}

export type LessonStage = "understand" | "predict" | "code" | "explain" | "transfer" | "complete";

export interface LessonProgress {
  stage: LessonStage;
  language: LearningLanguage;
  code: string;
  transferCode: string;
  prediction: string;
  explanation: string;
  hintsUsed: AssistanceLevel[];
  testsPassed: boolean;
  transferPassed: boolean;
  updatedAt: string;
}

export interface LabProgress {
  notes: string;
  evidence: string;
  checks: boolean[];
  completed: boolean;
  updatedAt: string;
}

export interface AptitudeProgress {
  currentIndex: number;
  answers: Record<string, {
    selectedIndex: number;
    answerIndex: number;
    correct: boolean;
    explanation: string;
  }>;
  completed: boolean;
  updatedAt: string;
}

export interface ReviewEvidence {
  itemType: string;
  itemId: string;
  topic: string;
  dueAt: string;
  fsrs: {
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    learning_steps: number;
    reps: number;
    lapses: number;
    state: number;
    last_review?: string;
  };
}

export type ReadinessDimension = "Coding and debugging" | "Full-stack engineering" | "Applied AI engineering" | "Aptitude and SQL" | "Interview communication";

export interface LearnerState {
  revision: number;
  profile: LearnerProfile;
  sprint: SprintState;
  streak: {
    days: number;
    recoveryTokens: number;
    protectedToday: boolean;
    lastProtectedDate?: string;
  };
  mastery: Record<string, MasteryEvidence>;
  attempts: AttemptEvidence[];
  reviews: ReviewEvidence[];
  readiness: Record<ReadinessDimension, number>;
  xp: number;
  onboarding: OnboardingDraft;
  lessons: Record<string, LessonProgress>;
  labs: Record<string, LabProgress>;
  aptitude: Record<string, AptitudeProgress>;
  contentReports: Array<{ itemId: string; reason: string; createdAt: string }>;
}

export type LearnerAction =
  | { type: "onboarding.save"; payload: Partial<OnboardingDraft> }
  | { type: "onboarding.complete"; payload: { name: string; language: LearningLanguage; timezone: string; sessionTime: string; startedAt: string } }
  | { type: "profile.update"; payload: { name?: string; language?: LearningLanguage; timezone?: string; sessionTime?: string } }
  | { type: "lesson.save"; payload: { lessonId: string; progress: Partial<LessonProgress> } }
  | { type: "lab.save"; payload: { day: number; progress: Partial<LabProgress> } }
  | { type: "aptitude.save"; payload: { day: number; progress: Partial<AptitudeProgress> } }
  | { type: "plan.toggle"; payload: { itemId: string; completedAt?: string } }
  | { type: "gate.complete"; payload: { week: number; score: number; failedTopics: string[]; completedAt: string } }
  | { type: "attempt.record"; payload: AttemptEvidence }
  | { type: "content.report"; payload: { itemId: string; reason: string; createdAt: string } }
  | { type: "streak.recover"; payload: { protectedAt: string } }
  | { type: "sprint.restart"; payload: { startedAt: string } };
