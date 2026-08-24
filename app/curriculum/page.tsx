import type { Metadata } from "next";
import { CurriculumMap } from "@/components/curriculum-map";

export const metadata: Metadata = { title: "Curriculum" };
export default async function CurriculumPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const params = await searchParams;
  const parsed = params.day ? Number(params.day) : undefined;
  const initialDay = parsed && Number.isInteger(parsed) ? Math.min(28, Math.max(1, parsed)) : undefined;
  return <CurriculumMap initialDay={initialDay} />;
}
