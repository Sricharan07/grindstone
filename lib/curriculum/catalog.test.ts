import { describe, expect, it } from "vitest";
import { activitiesFor, SPRINT_DAYS } from "./catalog";
import { labGuide } from "./lab-guides";

describe("28-day curriculum", () => {
  it("schedules exactly 150 minutes on every sequential day", () => {
    expect(SPRINT_DAYS).toHaveLength(28);
    expect(SPRINT_DAYS.map((day) => day.day)).toEqual(Array.from({ length: 28 }, (_, index) => index + 1));
    for (const day of SPRINT_DAYS) {
      expect(activitiesFor(day).reduce((total, activity) => total + activity.minutes, 0)).toBe(150);
    }
  });

  it("routes aptitude, labs, and gates to real session workspaces", () => {
    for (const day of SPRINT_DAYS) {
      const activities = activitiesFor(day);
      expect(activities.find((activity) => activity.id.endsWith("-aptitude"))?.href).toBe(`/session/${day.day}/aptitude`);
      expect(activities.find((activity) => activity.id.endsWith("-lab"))?.href).toBe(`/session/${day.day}/lab`);
      if (day.kind === "gate") expect(activities.find((activity) => activity.id.endsWith("-interview"))?.href).toBe(`/session/${day.day}/gate`);
    }
  });

  it("provides a concrete four-part capstone rubric for all 28 days", () => {
    for (const day of SPRINT_DAYS) {
      const guide = labGuide(day.day);
      expect(guide.criteria).toHaveLength(4);
      expect(guide.criteria.every((item) => item.length > 40)).toBe(true);
      expect(guide.verification).toHaveLength(2);
    }
  });
});
