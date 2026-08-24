export type InterviewRoute = "foundations" | "service-it" | "product" | "big-tech" | "non-tech";

export interface LearnerProfile {
  name: string;
  initials: string;
  route: InterviewRoute;
  preferredLanguage: "python" | "java" | "cpp";
  target: string;
  dailyMinutes: number;
  daysPerWeek: number;
  driveDate?: string;
  diagnosticComplete: boolean;
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
  standup?: string;
  standupDate?: string;
  eveningCheckin?: string;
  eveningCheckinDate?: string;
  retro?: string;
  retroWeek?: number;
  gate?: {
    week: number;
    score: number;
    passed: boolean;
    failedTopics: string[];
    recalibration?: {
      reteachTopics: string[];
      fadeAdjustment: number;
      newMaterialMinutes: number;
    };
  };
}

export interface MasteryEvidence {
  rating: number;
  confidence: number;
  attempts: number;
  calibrationError: number;
}

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
  timed: boolean;
  communicationScore?: number;
  measuredComplexity?: string;
  answer?: unknown;
  createdAt: string;
}

export interface StarStory {
  id: string;
  title: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  metrics: string;
  principles: string[];
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

export interface LearnerState {
  revision: number;
  profile: LearnerProfile;
  sprint: SprintState;
  commitment: {
    implementationIntention: string;
    dailyFloorMinutes: number;
    stakeCents: number | null;
  };
  streak: { days: number; freezes: number; floorProtectedToday: boolean; lastProtectedDate?: string; freezeMonth?: string };
  mastery: Record<string, MasteryEvidence>;
  attempts: AttemptEvidence[];
  reviews: ReviewEvidence[];
  readiness: Record<string, number>;
  xp: number;
  diagnostic: {
    status: "not-started" | "in-progress" | "complete";
    answers: Record<string, string>;
    topicPriors: Record<string, number>;
  };
  driveResults: Array<{ pack: string; score: number; sections: Record<string, number>; completedAt: string }>;
  starStories: StarStory[];
  contentReports: Array<{ itemId: string; reason: string; createdAt: string }>;
}

export type LearnerAction =
  | { type: "onboarding.complete"; payload: { route: InterviewRoute; target: string; language: LearnerProfile["preferredLanguage"]; dailyMinutes: number; daysPerWeek: number; implementationIntention: string; goal: string; stakeCents: number | null } }
  | { type: "plan.toggle"; payload: { itemId: string } }
  | { type: "checkin.standup"; payload: { body: string; completedAt: string } }
  | { type: "checkin.evening"; payload: { body: string; completedMinutes: number; completedAt: string } }
  | { type: "retro.save"; payload: { body: string } }
  | { type: "gate.complete"; payload: { score: number; failedTopics: string[] } }
  | { type: "attempt.record"; payload: AttemptEvidence }
  | { type: "diagnostic.answer"; payload: { questionId: string; answer: string } }
  | { type: "diagnostic.complete"; payload: { route: InterviewRoute; goal: string; topicPriors: Record<string, number>; completedAt: string } }
  | { type: "drive.complete"; payload: { pack: string; score: number; sections: Record<string, number>; completedAt: string } }
  | { type: "star.save"; payload: StarStory }
  | { type: "content.report"; payload: { itemId: string; reason: string; createdAt: string } }
  | { type: "streak.freeze"; payload: { protectedAt: string } }
  | { type: "sprint.next"; payload: { goal: string; route: InterviewRoute; startedAt: string } };
