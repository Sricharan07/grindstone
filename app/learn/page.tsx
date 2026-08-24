import type { Metadata } from "next";
import { LearnWorkspace } from "@/components/learn-workspace";

export const metadata: Metadata = { title: "Learn" };

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ lesson?: string }> }) {
  const params = await searchParams;
  return <LearnWorkspace key={params.lesson ?? "first-lesson"} lessonId={params.lesson} />;
}
