export type SprintRoute =
  | "foundations"
  | "service-it"
  | "product"
  | "big-tech"
  | "non-tech";

export type TrainingKind =
  | "review"
  | "concept"
  | "recognition"
  | "coding"
  | "aptitude"
  | "debugging"
  | "mock"
  | "review-sheet";

export interface MasteryState {
  rating: number;
  confidence: number;
  attempts: number;
  calibrationError: number;
}

export interface AttemptSignal {
  correct: boolean;
  predictedSuccess?: number;
  durationMs: number;
  targetDurationMs: number;
  scaffoldLevel: number;
  difficulty: number;
}

export interface TrainingItem {
  id: string;
  title: string;
  topic: string;
  kind: TrainingKind;
  minutes: number;
  why: string;
  due?: boolean;
  newMaterial?: boolean;
  prerequisiteComplete?: boolean;
  priority?: number;
}

export interface SprintContext {
  week: 1 | 2 | 3 | 4;
  dayOfWeek: number;
  daysRemaining: number;
  dailyMinutes: number;
  dailyFloorMinutes: number;
  missedDays: number;
  gatePassed?: boolean;
  newMaterialMinutes?: number;
}

export interface DailyPlan {
  items: TrainingItem[];
  budgetMinutes: number;
  scheduledMinutes: number;
  loadFactor: number;
  taper: boolean;
  message: string;
}
