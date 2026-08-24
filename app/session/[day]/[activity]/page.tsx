import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AptitudeWorkspace } from "@/components/aptitude-workspace";
import { GateWorkspace } from "@/components/gate-workspace";
import { LabWorkspace } from "@/components/lab-workspace";
import { sprintDay } from "@/lib/curriculum/catalog";

export const metadata: Metadata = { title: "Daily session" };

export default async function SessionPage({ params }: PageProps<"/session/[day]/[activity]">) {
  const values = await params;
  const dayNumber = Number(values.day);
  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 28) notFound();
  const day = sprintDay(dayNumber);

  if (values.activity === "aptitude") return <AptitudeWorkspace dayNumber={dayNumber} />;
  if (values.activity === "lab") return <LabWorkspace dayNumber={dayNumber} />;
  if (values.activity === "gate" && day.kind === "gate") return <GateWorkspace dayNumber={dayNumber} />;
  notFound();
}
