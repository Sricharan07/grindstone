export type DriveSectionKind = "mcq" | "coding" | "hr_interview" | "communication" | "codebase" | "system_design" | "behavioral";

export interface DriveSection {
  kind: DriveSectionKind;
  topic?: string;
  difficulty?: string;
  count: number;
  minutes: number;
}

export interface DrivePack {
  slug: string;
  company: string;
  cutoff: number;
  sections: DriveSection[];
}

export const drivePacks: DrivePack[] = [
  { slug: "tcs-nqt", company: "TCS NQT", cutoff: 70, sections: [{ kind: "mcq", topic: "quantitative", count: 20, minutes: 25 }, { kind: "mcq", topic: "reasoning", count: 20, minutes: 25 }, { kind: "mcq", topic: "verbal", count: 25, minutes: 25 }, { kind: "coding", difficulty: "easy", count: 2, minutes: 45 }, { kind: "hr_interview", count: 6, minutes: 20 }] },
  { slug: "infosys", company: "Infosys", cutoff: 68, sections: [{ kind: "mcq", topic: "quantitative", count: 15, minutes: 20 }, { kind: "mcq", topic: "reasoning", count: 15, minutes: 20 }, { kind: "mcq", topic: "pseudocode", count: 20, minutes: 25 }, { kind: "coding", difficulty: "easy", count: 2, minutes: 40 }, { kind: "hr_interview", count: 5, minutes: 15 }] },
  { slug: "wipro", company: "Wipro", cutoff: 65, sections: [{ kind: "mcq", topic: "aptitude", count: 20, minutes: 25 }, { kind: "mcq", topic: "verbal", count: 15, minutes: 20 }, { kind: "mcq", topic: "pseudocode", count: 15, minutes: 20 }, { kind: "coding", difficulty: "easy", count: 2, minutes: 45 }, { kind: "hr_interview", count: 5, minutes: 15 }] },
  { slug: "accenture", company: "Accenture", cutoff: 67, sections: [{ kind: "mcq", topic: "cognitive", count: 30, minutes: 40 }, { kind: "mcq", topic: "technical", count: 20, minutes: 25 }, { kind: "coding", difficulty: "easy", count: 2, minutes: 45 }, { kind: "communication", count: 6, minutes: 20 }] },
  { slug: "big-tech-loop", company: "Big-tech practice loop", cutoff: 75, sections: [{ kind: "coding", difficulty: "medium", count: 2, minutes: 45 }, { kind: "codebase", count: 1, minutes: 45 }, { kind: "system_design", count: 1, minutes: 45 }, { kind: "behavioral", count: 4, minutes: 45 }] },
];
